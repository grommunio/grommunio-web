<?php

/*
 * SPDX-FileCopyrightText: Copyright 2020 - 2026 grommunio GmbH
 * SPDX-FileCopyrightText: Copyright 2016 Kopano and its licensors
 * SPDX-FileCopyrightText: Copyright 2005 - 2016 Zarafa B.V. and its licensors
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

/**
 * suggestEmailAddressModule.
 *
 * Class is used to store/retrieve suggestion list entries from a mapi property PR_EC_RECIPIENT_HISTORY_JSON
 * on default store. The format of recipient history that is stored in this property is shown below
 * {
 * 	 recipients : [
 *		'display_name' : 'foo bar',
 *		'smtp_address' : 'foo@local.com',
 *		'count' : 1,
 *		'last_used' : 1232313121,
 *		'object_type' : 6 // MAPI_MAILUSER
 *	 ]
 * }
 */
class suggestEmailAddressModule extends Module {
	public const MAX_SUGGESTIONS = 10;

	// Shorter queries match too much of a large address book to be useful.
	public const DIRECTORY_MIN_CHARS = 3;

	#[Override]
	protected function getExecutionLockName() {
		return null;
	}

	public function __construct($id, $data) {
		parent::__construct($id, $data);
	}

	#[Override]
	public function execute() {
		$actionType = null;
		$historyState = false;
		if (isset($this->data['delete'])) {
			$historyState = State::forStore('recipient-history-write');
			if (!$historyState->open()) {
				throw new RuntimeException('Unable to lock recipient history for writing');
			}
		}

		try {
			// Retrieve the recipient history
			$storeProps = mapi_getprops($GLOBALS["mapisession"]->getDefaultMessageStore(), [PR_EC_RECIPIENT_HISTORY_JSON]);
			$recipient_history = [];

			$datastring = readMapiProp($GLOBALS["mapisession"]->getDefaultMessageStore(), PR_EC_RECIPIENT_HISTORY_JSON, $storeProps);
			if (!empty($datastring)) {
				$decodedHistory = json_decode_data($datastring, true);
				if (is_array($decodedHistory)) {
					$recipient_history = $decodedHistory;
				}
			}

			foreach ($this->data as $actionType => $action) {
				if (isset($actionType)) {
					switch ($actionType) {
						case 'delete':
							$this->deleteRecipient($action, $recipient_history);
							break;

						case 'list':
							$data = $this->getRecipientList($action, $recipient_history);

							// Pass data on to be returned to the client
							$this->addActionData("list", $data);
							$GLOBALS["bus"]->addData($this->getResponseData());

							break;
					}
				}
			}
		}
		catch (MAPIException $e) {
			$this->processException($e, $actionType);
		}
		finally {
			if ($historyState instanceof State) {
				$historyState->close();
			}
		}
	}

	public static function cmpSortResultList($a, $b) {
		if ($a['count'] < $b['count']) {
			return 1;
		}
		if ($a['count'] > $b['count']) {
			return -1;
		}
		$l_iReturnVal = strnatcasecmp((string) $a['display_name'], (string) $b['display_name']);
		if ($l_iReturnVal == 0) {
			$l_iReturnVal = strnatcasecmp((string) $a['smtp_address'], (string) $b['smtp_address']);
		}

		return $l_iReturnVal;
	}

	/**
	 * Function is used to delete a recipient entry from already stored recipient history
	 * in mapi property. it searches for deleteRecipients key in the action array which will
	 * contain email addresses of recipients that should be deleted in semicolon separated format.
	 *
	 * @param array $action            action data in associative array format
	 * @param array $recipient_history recipient history stored in mapi property
	 */
	public function deleteRecipient($action, $recipient_history) {
		if (isset($action) && !empty($recipient_history) && !empty($recipient_history['recipients'])) {
			/*
			 * A foreach is used instead of a normal for-loop to
			 * prevent the loop from finishing before the end of
			 * the array, because of the unsetting of elements
			 * in that array.
			 */
			foreach ($recipient_history['recipients'] as $index => $recipient) {
				if ($action['email_address'] == $recipient['email_address'] || $action['smtp_address'] == $recipient['smtp_address']) {
					unset($recipient_history['recipients'][$index]);
				}
			}
			// Re-indexing recipients' array to adjust index of deleted recipients
			$recipient_history['recipients'] = array_values($recipient_history['recipients']);

			// Write new recipient history to property
			$l_sNewRecipientHistoryJSON = json_encode($recipient_history);

			writeMapiPropStream($GLOBALS["mapisession"]->getDefaultMessageStore(), PR_EC_RECIPIENT_HISTORY_JSON, $l_sNewRecipientHistoryJSON);
			mapi_savechanges($GLOBALS["mapisession"]->getDefaultMessageStore());
		}

		// send success message to client
		$this->sendFeedback(true);
	}

	/**
	 * Function is used to get recipient history from mapi property based
	 * on the query specified by the client in action array.
	 *
	 * @param array $action            action data in associative array format
	 * @param array $recipient_history recipient history stored in mapi property
	 *
	 * @return array data holding recipients that matched the query
	 */
	public function getRecipientList($action, $recipient_history) {
		$data = $this->getHistoryList($action, $recipient_history);
		$data['directory_searched'] = false;

		$query = trim((string) ($action['query'] ?? ''));
		$free = self::MAX_SUGGESTIONS - count($data['results']);
		if ($free > 0 && ENABLE_DIRECTORY_SUGGESTIONS && ($action['directory'] ?? true) !== false &&
			mb_strlen($query) >= self::DIRECTORY_MIN_CHARS) {
			$known = [];
			foreach ($data['results'] as $recipient) {
				$known[strtolower((string) $recipient['smtp_address'])] = true;
			}
			foreach ($this->getDirectoryRecipients($query, $free, $known) as $recipient) {
				$recipient['id'] = count($data['results']) + 1;
				$data['results'][] = $recipient;
			}
			$data['directory_searched'] = true;
		}

		return $data;
	}

	/**
	 * Look the query up in the global address book and then in the default contacts
	 * folder, each with a single restricted table query of at most $limit rows.
	 *
	 * @param string $query search text
	 * @param int    $limit maximum number of entries
	 * @param array  $known lowercase SMTP addresses already suggested
	 *
	 * @return array suggestion entries, marked with source 'directory'
	 */
	public function getDirectoryRecipients($query, $limit, $known) {
		$results = [];
		$add = function ($entry) use (&$results, &$known, $limit) {
			$key = strtolower((string) $entry['smtp_address']);
			if ($key === '' || isset($known[$key]) || count($results) >= $limit) {
				return;
			}
			$known[$key] = true;
			$results[] = $entry + ['count' => 0, 'last_used' => 0, 'source' => 'directory'];
		};
		$match = fn ($tags) => [RES_OR, array_map(fn ($tag) => [RES_CONTENT,
			[FUZZYLEVEL => FL_SUBSTRING | FL_IGNORECASE, ULPROPTAG => $tag, VALUE => $query]], $tags)];

		try {
			$ab = $GLOBALS['mapisession']->getAddressbook();
			// The table lives only as long as its container, so keep it referenced.
			$gal = mapi_ab_openentry($ab, mapi_ab_getdefaultdir($ab));
			$table = mapi_folder_getcontentstable($gal, MAPI_DEFERRED_ERRORS);
			mapi_table_restrict($table, $match([PR_DISPLAY_NAME, PR_SMTP_ADDRESS, PR_ACCOUNT]), TBL_BATCH);
			$rows = mapi_table_queryrows($table, [PR_ENTRYID, PR_DISPLAY_NAME, PR_SMTP_ADDRESS, PR_EMAIL_ADDRESS,
				PR_ADDRTYPE, PR_OBJECT_TYPE, PR_DISPLAY_TYPE, PR_DISPLAY_TYPE_EX, PR_SEARCH_KEY], 0, $limit);
			foreach ($rows as $row) {
				$add([
					'entryid' => bin2hex((string) $row[PR_ENTRYID]),
					'search_key' => isset($row[PR_SEARCH_KEY]) ? bin2hex((string) $row[PR_SEARCH_KEY]) : '',
					'display_name' => $row[PR_DISPLAY_NAME] ?? '',
					'smtp_address' => $row[PR_SMTP_ADDRESS] ?? '',
					'email_address' => $row[PR_EMAIL_ADDRESS] ?? ($row[PR_SMTP_ADDRESS] ?? ''),
					'address_type' => $row[PR_ADDRTYPE] ?? 'SMTP',
					'object_type' => $row[PR_OBJECT_TYPE] ?? MAPI_MAILUSER,
					'display_type' => $row[PR_DISPLAY_TYPE] ?? DT_MAILUSER,
					'display_type_ex' => $row[PR_DISPLAY_TYPE_EX] ?? DT_MAILUSER,
				]);
			}
		}
		catch (MAPIException $e) {
			$e->setHandled();
		}

		if (count($results) >= $limit) {
			return $results;
		}

		try {
			$store = $GLOBALS['mapisession']->getDefaultMessageStore();
			$root = mapi_msgstore_openentry($store);
			$contactsId = mapi_getprops($root, [PR_IPM_CONTACT_ENTRYID])[PR_IPM_CONTACT_ENTRYID] ?? null;
			if ($contactsId === null) {
				return $results;
			}
			$props = getPropIdsFromStrings($store, [
				'email_address_1' => 'PT_STRING8:PSETID_Address:' . PidLidEmail1EmailAddress,
				'email_address_2' => 'PT_STRING8:PSETID_Address:' . PidLidEmail2EmailAddress,
				'email_address_3' => 'PT_STRING8:PSETID_Address:' . PidLidEmail3EmailAddress,
			]);
			$emails = [$props['email_address_1'], $props['email_address_2'], $props['email_address_3']];
			$contacts = mapi_msgstore_openentry($store, $contactsId);
			$table = mapi_folder_getcontentstable($contacts, MAPI_DEFERRED_ERRORS);
			mapi_table_restrict($table, [RES_AND, [
				[RES_PROPERTY, [RELOP => RELOP_EQ, ULPROPTAG => PR_MESSAGE_CLASS, VALUE => 'IPM.Contact']],
				$match(array_merge([PR_DISPLAY_NAME], $emails)),
			]], TBL_BATCH);
			foreach (mapi_table_queryrows($table, array_merge([PR_DISPLAY_NAME], $emails), 0, $limit) as $row) {
				foreach ($emails as $tag) {
					if (!empty($row[$tag]) && str_contains((string) $row[$tag], '@')) {
						$add([
							'display_name' => $row[PR_DISPLAY_NAME] ?? $row[$tag],
							'smtp_address' => $row[$tag],
							'email_address' => $row[$tag],
							'address_type' => 'SMTP',
							'object_type' => MAPI_MAILUSER,
						]);
					}
				}
			}
		}
		catch (MAPIException $e) {
			$e->setHandled();
		}

		return $results;
	}

	/**
	 * Match the query against the stored recipient history.
	 *
	 * @param array $action            action data in associative array format
	 * @param array $recipient_history recipient history stored in mapi property
	 *
	 * @return array data holding recipients that matched the query
	 */
	private function getHistoryList($action, $recipient_history) {
		if (!empty($action["query"]) && !empty($recipient_history) && !empty($recipient_history['recipients'])) {
			// Setup result array with match levels
			$l_aResult = [
				0 => [],
				1 => [],
			];

			// Track seen email addresses to skip duplicates
			$seen = [];
			$l_sSearchString = strtolower((string) $action["query"]);

			// Loop through all the recipients

			for ($i = 0, $len = count($recipient_history['recipients']); $i < $len; ++$i) {
				$entry = $recipient_history['recipients'][$i];

				// Prepare strings for case sensitive search
				$l_sName = strtolower((string) $entry['display_name']);
				$l_sEmail = strtolower((string) $entry['smtp_address']);
				// Deduplicate by smtp_address (case-insensitive)
				$dedupeKey = $l_sEmail !== '' ? $l_sEmail : strtolower((string) $entry['email_address']);
				if ($dedupeKey !== '' && isset($seen[$dedupeKey])) {
					// Keep the entry with the higher count
					$prevLevel = $seen[$dedupeKey][0];
					$prevIndex = $seen[$dedupeKey][1];
					$prevCount = $l_aResult[$prevLevel][$prevIndex]['count'] ?? 0;
					if (($entry['count'] ?? 0) > $prevCount) {
						// Replace previous entry with this one
						unset($l_aResult[$prevLevel][$prevIndex]);
					}
					else {
						continue;
					}
				}

				// Check for the presence of the search string
				$l_ibPosName = strpos($l_sName, $l_sSearchString);
				$l_ibPosEmail = strpos($l_sEmail, $l_sSearchString);

				// Check if the string is present in name or email fields
				if ($l_ibPosName !== false || $l_ibPosEmail !== false) {
					// Check if the found string matches from the start of the word
					if ($l_ibPosName === 0 || substr($l_sName, $l_ibPosName - 1, 1) == ' ' || $l_ibPosEmail === 0 || substr($l_sEmail, $l_ibPosEmail - 1, 1) == ' ') {
						$idx = count($l_aResult[0]);
						$l_aResult[0][$idx] = [
							'display_name' => $entry['display_name'],
							'smtp_address' => $entry['smtp_address'],
							'email_address' => $entry['email_address'],
							'address_type' => $entry['address_type'],
							'count' => $entry['count'],
							'last_used' => $entry['last_used'],
							'object_type' => $entry['object_type'],
						];
						if ($dedupeKey !== '') {
							$seen[$dedupeKey] = [0, $idx];
						}
					// Does not match from start of a word, but start in the middle
					}
					else {
						$idx = count($l_aResult[1]);
						$l_aResult[1][$idx] = [
							'display_name' => $entry['display_name'],
							'smtp_address' => $entry['smtp_address'],
							'email_address' => $entry['email_address'],
							'address_type' => $entry['address_type'],
							'count' => $entry['count'],
							'last_used' => $entry['last_used'],
							'object_type' => $entry['object_type'],
						];
						if ($dedupeKey !== '') {
							$seen[$dedupeKey] = [1, $idx];
						}
					}
				}
			}

			// Re-index after potential unset operations
			$l_aResult[0] = array_values($l_aResult[0]);
			$l_aResult[1] = array_values($l_aResult[1]);

			// Prevent the displaying of the exact match of the whole email address when only one item is found.
			if (count($l_aResult[0]) == 1 && empty($l_aResult[1]) && $l_sSearchString == strtolower((string) $l_aResult[0][0]['smtp_address'])) {
				$recipientList = [];
			}
			else {
				/**
				 * Sort lists.
				 *
				 * This block of code sorts the two lists and creates one final list.
				 * The first list holds the matches based on whole words or words
				 * beginning with the search string and the second list contains the
				 * partial matches that start in the middle of the words.
				 * The first list is sorted on count (the number of emails sent to this
				 * email address), name and finally on the email address. This is done
				 * by a natural sort. When this first list already contains the maximum
				 * number of returned items the second list needs no sorting. If it has
				 * fewer items, the second list is sorted and included in the first list
				 * as well. At the end the final list is sorted on name and email again.
				 */
				$l_iMaxNumListItems = self::MAX_SUGGESTIONS;
				$l_aSortedList = [];
				usort($l_aResult[0], [self::class, 'cmpSortResultList']);
				for ($i = 0, $len = min($l_iMaxNumListItems, count($l_aResult[0])); $i < $len; ++$i) {
					$l_aSortedList[] = $l_aResult[0][$i];
				}
				if (count($l_aSortedList) < $l_iMaxNumListItems) {
					$l_iMaxNumRemainingListItems = $l_iMaxNumListItems - count($l_aSortedList);
					usort($l_aResult[1], [self::class, 'cmpSortResultList']);
					for ($i = 0, $len = min($l_iMaxNumRemainingListItems, count($l_aResult[1])); $i < $len; ++$i) {
						$l_aSortedList[] = $l_aResult[1][$i];
					}
				}

				$recipientList = [];
				foreach ($l_aSortedList as $index => $recipient) {
					$recipient['id'] = count($recipientList) + 1;
					$recipientList[] = $recipient;
				}
			}

			$data = [
				'query' => $action["query"],
				'results' => $recipientList,
			];
		}
		else {
			$data = [
				'query' => $action["query"],
				'results' => [],
			];
		}

		return $data;
	}
}
