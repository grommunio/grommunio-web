<?php

require_once BASE_PATH . 'server/includes/core/class.junkrule.php';

/**
 * JunkMailModule Module.
 *
 * Reads and writes the Outlook Junk Email Rule (MS-OXCSPAM): the
 * IPM.ExtendedRule.Message FAI message in the inbox whose extended rule
 * condition carries the blocked senders, safe senders and safe recipients
 * lists. Outlook reads and writes the same message, so both clients see
 * one set of lists.
 */
class JunkMailModule extends Module {
	public const MAX_ENTRIES = 1024;
	public const MAX_ENTRY_LENGTH = 256;

	/**
	 * Per-request cache of parsed lists, shared with Operations::isSafeSender.
	 */
	private static $cachedLists;

	/**
	 * Executes all the actions in the $data variable.
	 */
	#[Override]
	public function execute() {
		foreach ($this->data as $actionType => $action) {
			if (isset($actionType)) {
				try {
					match ($actionType) {
						"list" => $this->getJunkSettings(),
						"save" => $this->saveJunkSettings($action),
						default => $this->handleUnknownActionType($actionType),
					};
				}
				catch (MAPIException $e) {
					$this->processException($e, $actionType);
				}
				catch (ZarafaException $e) {
					$this->sendFeedback(false, [
						"type" => ERROR_ZARAFA,
						"info" => ["display_message" => $e->getDisplayMessage()],
					]);
				}
			}
		}
	}

	/**
	 * Find the Junk Email Rule FAI message in the inbox associated contents.
	 *
	 * @param resource $store MAPI message store
	 *
	 * @return array [message|false, inbox]
	 */
	public static function findJunkRule($store) {
		$inbox = mapi_msgstore_getreceivefolder($store);
		$table = mapi_folder_getcontentstable($inbox, MAPI_ASSOCIATED);

		mapi_table_restrict($table, [RES_AND, [
			[RES_CONTENT,
				[
					FUZZYLEVEL => FL_FULLSTRING | FL_IGNORECASE,
					ULPROPTAG => PR_MESSAGE_CLASS,
					VALUE => [PR_MESSAGE_CLASS => 'IPM.ExtendedRule.Message'],
				],
			],
			[RES_CONTENT,
				[
					FUZZYLEVEL => FL_FULLSTRING | FL_IGNORECASE,
					ULPROPTAG => PR_RULE_MSG_PROVIDER,
					VALUE => [PR_RULE_MSG_PROVIDER => JunkRule::PROVIDER],
				],
			],
		]]);

		// Newest first, so a duplicate created by a racing client is shadowed
		// deterministically rather than by table order.
		mapi_table_sort($table, [PR_LAST_MODIFICATION_TIME => TABLE_SORT_DESCEND], TBL_BATCH);
		$rows = mapi_table_queryallrows($table, [PR_ENTRYID]);

		if (!empty($rows)) {
			return [mapi_msgstore_openentry($store, $rows[0][PR_ENTRYID]), $inbox];
		}

		return [false, $inbox];
	}

	/**
	 * Read the lists and options. Never creates the rule: a mailbox without
	 * one simply has empty lists, like a fresh Outlook profile.
	 */
	public function getJunkSettings() {
		$store = $GLOBALS['mapisession']->getDefaultMessageStore();
		$lists = self::getSenderLists($store);

		$data = [
			'props' => [
				'safe_senders' => $lists['safe_senders'],
				'safe_recipients' => $lists['safe_recipients'],
				'blocked_senders' => $lists['blocked_senders'],
				'junk_include_contacts' => $lists['junk_include_contacts'],
				'migrated_pending' => $lists['migrated_pending'],
			],
		];

		$this->addActionData('list', ['item' => [$data]]);
		$GLOBALS['bus']->addData($this->getResponseData());
	}

	/**
	 * The parsed lists, cached per request. Entries of the old webapp
	 * safe_senders_list setting are merged into safe_senders (marked by
	 * 'migrated_pending') until a verified save retires the setting.
	 *
	 * @param resource $store MAPI message store
	 *
	 * @return array lists plus options
	 */
	public static function getSenderLists($store) {
		if (isset(self::$cachedLists)) {
			return self::$cachedLists;
		}

		$lists = [
			'safe_senders' => [],
			'safe_recipients' => [],
			'blocked_senders' => [],
			'contacts' => [],
			'junk_include_contacts' => 0,
			'migrated_pending' => false,
		];

		try {
			[$message] = self::findJunkRule($store);
		}
		catch (MAPIException $e) {
			$e->setHandled();
			$message = false;
		}

		if ($message !== false) {
			$props = mapi_getprops($message, [PR_EXTENDED_RULE_MSG_CONDITION, PR_JUNK_INCLUDE_CONTACTS]);
			$blob = $props[PR_EXTENDED_RULE_MSG_CONDITION] ?? streamProperty($message, PR_EXTENDED_RULE_MSG_CONDITION);
			$parsed = is_string($blob) ? JunkRule::parseCondition($blob) : false;
			if ($parsed !== false) {
				$lists['safe_senders'] = $parsed['safe_senders'];
				$lists['safe_recipients'] = $parsed['safe_recipients'];
				$lists['blocked_senders'] = $parsed['blocked_senders'];
				$lists['contacts'] = $parsed['contacts'];
			}
			$lists['junk_include_contacts'] = ($props[PR_JUNK_INCLUDE_CONTACTS] ?? 0) ? 1 : 0;
		}

		$old = $GLOBALS['settings']->get('zarafa/v1/contexts/mail/safe_senders_list');
		if (is_array($old) && !empty($old)) {
			$known = array_map('strtolower', $lists['safe_senders']);
			foreach ($old as $entry) {
				$entry = trim((string) $entry);
				if ($entry === '' || !self::isSaneEntry($entry)) {
					continue;
				}
				if (!str_contains($entry, '@')) {
					$entry = '@' . $entry;
				}
				if (!in_array(strtolower($entry), $known, true)) {
					$lists['safe_senders'][] = $entry;
					$known[] = strtolower($entry);
					$lists['migrated_pending'] = true;
				}
			}
		}

		self::$cachedLists = $lists;

		return $lists;
	}

	/**
	 * Save the lists. Rebuilds the whole condition and actions, verifies the
	 * write by reading it back, and only then retires the old webapp setting.
	 *
	 * @param array $action the action data sent by the client
	 */
	public function saveJunkSettings($action) {
		$props = $action['props'] ?? [];
		$safeSenders = $this->sanitizeList($props['safe_senders'] ?? null);
		$safeRecipients = $this->sanitizeList($props['safe_recipients'] ?? null);
		$blockedSenders = $this->sanitizeList($props['blocked_senders'] ?? null);
		if ($safeSenders === false || $safeRecipients === false || $blockedSenders === false) {
			throw new ZarafaException(_("The sender lists could not be saved"));
		}

		$store = $GLOBALS['mapisession']->getDefaultMessageStore();
		[$message, $inbox] = self::findJunkRule($store);

		// The lists the client did not send keep their stored value.
		$current = self::getSenderLists($store);
		$explicitSafeSenders = $safeSenders !== null;
		$safeSenders ??= $current['safe_senders'];
		$safeRecipients ??= $current['safe_recipients'];
		$blockedSenders ??= $current['blocked_senders'];

		// MS-OXCSPAM 2.2.2.2: the contacts clause must be empty while the
		// option is off; Outlook repopulates it when re-enabled.
		$includeContacts = isset($props['junk_include_contacts'])
			? (empty($props['junk_include_contacts']) ? 0 : 1)
			: $current['junk_include_contacts'];

		$condition = JunkRule::buildCondition($blockedSenders, $safeSenders, $safeRecipients,
			$includeContacts ? $current['contacts'] : []);
		$actions = JunkRule::buildActions(
			$this->getJunkFolderEntryId($inbox),
			$this->getMoveStamp($inbox)
		);

		$writeProps = [
			PR_EXTENDED_RULE_MSG_CONDITION => $condition,
			PR_EXTENDED_RULE_MSG_ACTIONS => $actions,
			// Re-enable on every save; Outlook may have flagged ST_ERROR.
			PR_RULE_MSG_STATE => JunkRule::RULE_STATE,
		];
		if (isset($props['junk_include_contacts'])) {
			$writeProps[PR_JUNK_INCLUDE_CONTACTS] = $includeContacts;
		}

		$created = $message === false;
		if ($created) {
			$message = mapi_folder_createmessage($inbox, MAPI_ASSOCIATED);
			$writeProps += [
				PR_MESSAGE_CLASS => 'IPM.ExtendedRule.Message',
				PR_RULE_MSG_NAME => JunkRule::RULE_NAME,
				PR_SUBJECT => JunkRule::RULE_NAME,
				PR_RULE_MSG_PROVIDER => JunkRule::PROVIDER,
				PR_RULE_MSG_SEQUENCE => 0,
				PR_RULE_MSG_LEVEL => 0,
				PR_RULE_MSG_USER_FLAGS => 0,
				PR_JUNK_INCLUDE_CONTACTS => $writeProps[PR_JUNK_INCLUDE_CONTACTS] ?? 0,
				PR_JUNK_THRESHOLD => -1,
				PR_JUNK_PERMANENTLY_DELETE => 0,
				PR_JUNK_ADD_RECIPS_TO_SSL => 0,
				PR_JUNK_PHISHING_ENABLE_LINKS => false,
				PR_REPORT_TIME => time(),
			];
		}

		mapi_setprops($message, $writeProps);
		mapi_savechanges($message);

		// zcore silently rejects an oversized or non-FAI condition write:
		// mapi_setprops still succeeds, so the only proof is reading back.
		$check = mapi_getprops($message, [PR_EXTENDED_RULE_MSG_CONDITION]);
		$stored = $check[PR_EXTENDED_RULE_MSG_CONDITION] ?? streamProperty($message, PR_EXTENDED_RULE_MSG_CONDITION);
		if ($stored !== $condition) {
			if ($created) {
				// Do not leave an enabled rule without a condition behind.
				try {
					$eid = mapi_getprops($message, [PR_ENTRYID]);
					mapi_folder_deletemessages($inbox, [$eid[PR_ENTRYID]], DELETE_HARD_DELETE);
				}
				catch (MAPIException $e) {
					$e->setHandled();
				}
			}

			throw new ZarafaException(_("The sender lists could not be saved"));
		}

		$this->retireOldSetting($safeSenders, $explicitSafeSenders);
		self::$cachedLists = null;

		$this->sendFeedback(true);
	}

	/**
	 * @param mixed $list the client-sent list
	 *
	 * @return array|false|null null when absent, false when invalid
	 */
	private function sanitizeList($list) {
		if ($list === null) {
			return null;
		}
		if (!is_array($list) || count($list) > self::MAX_ENTRIES) {
			return false;
		}
		$out = [];
		$seen = [];
		foreach ($list as $entry) {
			if (!is_string($entry)) {
				return false;
			}
			$entry = trim($entry);
			if ($entry === '') {
				continue;
			}
			if (!self::isSaneEntry($entry)) {
				return false;
			}
			$lower = strtolower($entry);
			if (!isset($seen[$lower])) {
				$seen[$lower] = true;
				$out[] = $entry;
			}
		}

		return $out;
	}

	/**
	 * The junk folder entryid: PR_ADDITIONAL_REN_ENTRYIDS index 4 on the inbox.
	 *
	 * @param resource $inbox
	 *
	 * @return string 46-byte folder entryid
	 */
	private function getJunkFolderEntryId($inbox) {
		$props = mapi_getprops($inbox, [PR_ADDITIONAL_REN_ENTRYIDS]);
		$eid = $props[PR_ADDITIONAL_REN_ENTRYIDS][4] ?? '';
		if (strlen($eid) !== 46) {
			throw new ZarafaException(_("The sender lists could not be saved"));
		}

		return $eid;
	}

	/**
	 * The junk email move stamp: PR_ADDITIONAL_REN_ENTRYIDS index 5 on the
	 * inbox; generated and stored there when absent (MS-OXCSPAM 3.2.4.1).
	 *
	 * @param resource $inbox
	 *
	 * @return int
	 */
	private function getMoveStamp($inbox) {
		$props = mapi_getprops($inbox, [PR_ADDITIONAL_REN_ENTRYIDS]);
		$entries = $props[PR_ADDITIONAL_REN_ENTRYIDS] ?? [];
		if (isset($entries[5]) && strlen((string) $entries[5]) === 4) {
			return unpack('V', $entries[5])[1];
		}

		$stamp = random_int(1, 0x7FFFFFFF);
		for ($i = 0; $i <= 5; ++$i) {
			$entries[$i] ??= '';
		}
		$entries[5] = pack('V', $stamp);
		ksort($entries);
		mapi_setprops($inbox, [PR_ADDITIONAL_REN_ENTRYIDS => array_values($entries)]);
		mapi_savechanges($inbox);

		return $stamp;
	}

	/**
	 * Delete the old webapp setting after a verified save. An explicitly sent
	 * safe senders list was built from the merged view (the client refuses to
	 * save before loading), so deletions in it are deliberate; otherwise the
	 * setting is kept until a save covers every remaining entry.
	 *
	 * @param array $safeSenders the just-saved safe senders
	 * @param bool  $explicit    the client sent the list itself
	 */
	private function retireOldSetting($safeSenders, $explicit) {
		$old = $GLOBALS['settings']->get('zarafa/v1/contexts/mail/safe_senders_list');
		if (!is_array($old) || empty($old)) {
			return;
		}

		if (!$explicit) {
			$known = array_map('strtolower', $safeSenders);
			foreach ($old as $entry) {
				$entry = trim((string) $entry);
				if ($entry === '' || !self::isSaneEntry($entry)) {
					continue;
				}
				if (!str_contains($entry, '@')) {
					$entry = '@' . $entry;
				}
				if (!in_array(strtolower($entry), $known, true)) {
					return;
				}
			}
		}

		$GLOBALS['settings']->delete('zarafa/v1/contexts/mail/safe_senders_list');
		$GLOBALS['settings']->saveSettings();
	}

	/**
	 * @param string $entry
	 * @return bool True when the entry can live in a sender list
	 */
	private static function isSaneEntry($entry) {
		return strlen($entry) <= self::MAX_ENTRY_LENGTH && !preg_match('/[;,\s\x00-\x1F]/', $entry);
	}
}
