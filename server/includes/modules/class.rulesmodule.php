<?php

/**
 * Rules Module
 * Module will be used to save rules information to rules table.
 */
class RulesModule extends Module {
	/**
	 * @var MAPITable contains resource of rules modify table
	 */
	private $rulesFolder;

	/**
	 * Constructor.
	 *
	 * @param int   $id   unique id
	 * @param array $data list of all actions
	 */
	public function __construct($id, $data) {
		$this->properties = $GLOBALS['properties']->getRulesProperties();
		$this->rulesFolder = null;

		parent::__construct($id, $data);
	}

	/**
	 * Executes all the actions in the $data variable.
	 */
	#[Override]
	public function execute() {
		foreach ($this->data as $actionType => $action) {
			// The client proxy may send rule data as an indexed array
			// (multiple rules) or as a single associative array (one
			// rule, unwrapped by ExtJS). Normalize to indexed form so
			// the rest of the code can rely on $action[0].
			if (!isset($action[0]) && isset($action['props'])) {
				$action = [$action];
			}

			if (isset($action[0])) {
				$storeEntryid = $action[0]['message_action']['store_entryid'];
			}
			else {
				$storeEntryid = $action['store_entryid'];
			}

			$ownStoreEntryId = $GLOBALS['mapisession']->getDefaultMessageStoreEntryId();

			try {
				if (ENABLE_SHARED_RULES !== true && !$GLOBALS['entryid']->compareEntryIds($storeEntryid, $ownStoreEntryId)) {
					// When the admin does not allow a user to set rules on the store of other users, but somehow
					// the user still tries this (probably hacking) we will not allow this
					throw new MAPIException(_('Setting mail filters on the stores of other users is not allowed.'));
				}
				$store = $GLOBALS['mapisession']->openMessageStore(hex2bin((string) $storeEntryid));

				switch ($actionType) {
					case 'list':
						$rules = $this->getRules($store);
						if ($rules) {
							$this->addActionData('list', $rules);
							$GLOBALS['bus']->addData($this->getResponseData());
						}
						else {
							$this->sendFeedback(false);
						}
						break;

					case 'save':
						// When saving the rules, we expect _all_ rules
						// to have been send. So our first task, is to
						// delete all existing rules.
						$this->deleteRules($store);

						// Now can save all rules, note that $action can contain just a store key when
						// all rules are removed.
						if (isset($action[0])) {
							$this->saveRules($store, $action);
						}

						// delete (outlook) client rules
						$this->deleteOLClientRules($store);

						// Respond with the full set of rules.
						$rules = $this->getRules($store);
						if ($rules) {
							$this->addActionData('update', $rules);
							$GLOBALS['bus']->addData($this->getResponseData());
						}
						else {
							$this->sendFeedback(false);
						}
						break;

					case 'apply':
						// Run existing rules over the messages already present
						// in a folder ("Run rules now"). The client sends the
						// target folder and, optionally, the subset of rules to
						// run (by PR_RULE_ID); when no subset is given all
						// enabled rules are executed.
						$folderEntryid = !empty($action['folder_entryid']) ? hex2bin((string) $action['folder_entryid']) : false;
						$ruleIds = isset($action['rule_ids']) && is_array($action['rule_ids']) ? $action['rule_ids'] : [];

						$result = $this->applyRules($store, $folderEntryid, $ruleIds);

						$this->addActionData('apply', $result);
						$GLOBALS['bus']->addData($this->getResponseData());
						break;

					default:
						$this->handleUnknownActionType($actionType);
				}
			}
			catch (MAPIException $e) {
				$this->processException($e, $actionType);
			}
		}
	}

	public function getRulesFolder($store = false) {
		if ($store === false) {
			$store = $GLOBALS['mapisession']->getDefaultMessageStore();
		}
		if (!$this->rulesFolder) {
			$this->rulesFolder = mapi_msgstore_getreceivefolder($store);
		}

		return $this->rulesFolder;
	}

	/**
	 * Create a restriction to search for rules which have a rule provider
	 * which starts with RuleOrganizer. Outlook will generate some rules
	 * with PR_RULE_PROVIDER RuleOrganizer2 for client-only rules, however
	 * we still want to show these in the client, hence we perform a prefix
	 * search.
	 *
	 * @return array The restriction which should be applied to the RulesTable
	 *               to obtain all the rules which should be shown to the user
	 */
	public function getRestriction() {
		return [RES_CONTENT,
			[
				FUZZYLEVEL => FL_PREFIX | FL_IGNORECASE,
				ULPROPTAG => PR_RULE_PROVIDER,
				VALUE => [
					PR_RULE_PROVIDER => 'RuleOrganizer',
				],
			],
		];
	}

	/**
	 * Get all rules of a store.
	 *
	 * This function opens the rules table for the specified store, and reads
	 * all rules with PR_RULE_PROVIDER equal to 'RuleOrganizer'. These are the rules
	 * that the user sees when managing rules from Outlook.
	 *
	 * @param resource $store Store in which rules reside
	 *
	 * @return array rules data
	 */
	public function getRules($store) {
		$rules_folder = $this->getRulesFolder($store);
		$rulesTable = mapi_folder_getrulestable($rules_folder);

		mapi_table_restrict($rulesTable, $this->getRestriction(), TBL_BATCH);
		mapi_table_sort($rulesTable, [PR_RULE_SEQUENCE => TABLE_SORT_ASCEND], TBL_BATCH);

		$rows = mapi_table_queryallrows($rulesTable, $this->properties);

		$rules = [];

		foreach ($rows as &$row) {
			$rules[] = Conversion::mapMAPI2XML($this->properties, $row);
		}
		unset($row);

		return ['item' => $rules];
	}

	/**
	 * Function used to delete all the rules the user currently has.
	 *
	 * @param resource $store in which we want to delete the rules
	 */
	public function deleteRules($store) {
		$rules_folder = $this->getRulesFolder($store);
		$rulesTable = mapi_folder_getrulestable($rules_folder);
		mapi_table_restrict($rulesTable, $this->getRestriction(), TBL_BATCH);
		mapi_table_sort($rulesTable, [PR_RULE_SEQUENCE => TABLE_SORT_ASCEND], TBL_BATCH);
		$rows = mapi_table_queryallrows($rulesTable, $this->properties);

		$rules = [];

		foreach ($rows as &$row) {
			$rules[] = [
				'rowflags' => ROW_REMOVE,
				'properties' => $row,
			];
		}

		if (!empty($rules)) {
			mapi_folder_modifyrules($rules_folder, $rules);
		}
	}

	/**
	 * Function will be used to create/update rule in user's rules table.
	 * This function only usee ROW_MODIFY flag to save rules data, Which is correct when modifying existing rules
	 * but for adding new rules Gromox automatically checks existence of rule id and if it si not then
	 * use ROW_ADD flag.
	 *
	 * @param resource $store     The store into which the rules must be saved
	 * @param array    $rulesData rules data that should be deleted
	 */
	public function saveRules($store, $rulesData) {
		if (is_assoc_array($rulesData)) {
			// wrap single rule in an array
			$rulesData = [$rulesData];
		}

		// save rules in rules table
		$saveRules = [];
		for ($index = 0, $len = count($rulesData); $index < $len; ++$index) {
			$rule = $rulesData[$index];
			if (!empty($rule['props'])) {
				$rule += $rule['props'];
			}

			$rule = Conversion::mapXML2MAPI($this->properties, $rule);

			// Always reset the PR_RULE_ID property, it is going
			// to be regenerated by the server anyway, so we can safely
			// discard whatever value the client has given.
			$rule[PR_RULE_ID] = $index;

			// provide default action and rule if client has not provided
			if (empty($rule[PR_RULE_ACTIONS])) {
				$rule[PR_RULE_ACTIONS] = [
					[
						'action' => OP_DEFER_ACTION,
						'dam' => hex2bin('E0C810000120000100000000000000010000000000000001000000360000000200FFFF00000C004352756C65456C656D656E7490010000010000000000000001000000018064000000010000000000000001000000'),
					],
				];
			}

			if (empty($rule[PR_RULE_CONDITION])) {
				$rule[PR_RULE_CONDITION] = [
					RES_EXIST,
					[
						ULPROPTAG => PR_MESSAGE_CLASS,
					],
				];
			}

			if (empty($rule[PR_RULE_NAME])) {
				$rule[PR_RULE_NAME] = _('Untitled rule');
			}

			// generate rule provider data
			$rule[PR_RULE_PROVIDER_DATA] = pack('VVa*', 1, $rule[PR_RULE_ID], Conversion::UnixTimeToCOleDateTime(time()));

			$saveRules[] = [
				'rowflags' => ROW_ADD,
				'properties' => $rule,
			];
		}

		if (!empty($saveRules)) {
			mapi_folder_modifyrules($this->getRulesFolder($store), $saveRules);

			$hresult = mapi_last_hresult();
			if ($hresult !== NOERROR) {
				throw new MAPIException(_('Could not save rules.'), $hresult);
			}
		}
	}

	/**
	 * Read the rules which should be executed by {@link applyRules()}, in
	 * sequence order. Unlike {@link getRules()} this returns the native MAPI
	 * property structures (PR_RULE_CONDITION / PR_RULE_ACTIONS) so they can be
	 * handed directly to mapi_table_restrict() and the message operations,
	 * rather than the XML representation meant for the client.
	 *
	 * Only enabled rules are returned. Rules which only apply while the user is
	 * out-of-office (ST_ONLY_WHEN_OOF) are skipped, as are rules without a
	 * usable condition or action.
	 *
	 * @param resource $store   The store containing the rules
	 * @param array    $ruleIds Optional subset of PR_RULE_ID values to run;
	 *                          when empty all enabled rules are returned
	 *
	 * @return array list of rule rows (associative MAPI property arrays)
	 */
	public function getRulesForExecution($store, $ruleIds = []) {
		$rulesTable = mapi_folder_getrulestable($this->getRulesFolder($store));
		mapi_table_restrict($rulesTable, $this->getRestriction(), TBL_BATCH);
		mapi_table_sort($rulesTable, [PR_RULE_SEQUENCE => TABLE_SORT_ASCEND], TBL_BATCH);

		// Read with the same full property set as getRules(); this is known to
		// return PR_RULE_STATE / PR_RULE_CONDITION / PR_RULE_ACTIONS reliably.
		// The raw row already holds the native MAPI structures keyed by
		// property tag, which is exactly what we need for execution.
		$rows = mapi_table_queryallrows($rulesTable, $this->properties);

		$rules = [];
		foreach ($rows as $row) {
			$state = $row[PR_RULE_STATE] ?? 0;

			// When a subset was requested, skip rules which are not part of it.
			if (!empty($ruleIds) && !in_array($row[PR_RULE_ID] ?? null, $ruleIds)) {
				continue;
			}

			// Only run rules which are enabled and not restricted to
			// out-of-office.
			if (!($state & ST_ENABLED) || ($state & ST_ONLY_WHEN_OOF)) {
				continue;
			}

			// A rule without a condition or without actions cannot be applied.
			if (empty($row[PR_RULE_CONDITION]) || empty($row[PR_RULE_ACTIONS])) {
				continue;
			}

			$rules[] = $row;
		}

		return $rules;
	}

	/**
	 * Rule conditions read from PR_RULE_CONDITION are often wrapped in
	 * RES_COMMENT nodes which carry address-book annotation properties used by
	 * the rule editor (e.g. the resolved sender for a "from X" rule). gromox
	 * rejects those RES_COMMENT nodes when the condition is applied as a
	 * restriction to a contents table (it fails with MAPI error 0x4B9), so we
	 * recursively replace every RES_COMMENT with the actual restriction it
	 * wraps before handing the condition to mapi_table_restrict().
	 *
	 * @param mixed $restriction A MAPI restriction array
	 *
	 * @return mixed the restriction with all RES_COMMENT wrappers removed
	 */
	public function stripCommentRestriction($restriction) {
		if (!is_array($restriction) || count($restriction) < 2) {
			return $restriction;
		}

		$type = $restriction[0];
		$data = $restriction[1];

		switch ($type) {
			case RES_COMMENT:
				// Replace the comment with the restriction it wraps.
				$inner = $data[RESTRICTION] ?? null;

				return $inner === null ? $restriction : $this->stripCommentRestriction($inner);

			case RES_AND:
			case RES_OR:
			case RES_NOT:
				// These hold a plain array of sub-restrictions.
				$subs = [];
				foreach ($data as $sub) {
					$subs[] = $this->stripCommentRestriction($sub);
				}

				return [$type, $subs];

			default:
				return $restriction;
		}
	}

	/**
	 * Apply existing rules to the messages already present in a folder
	 * ("Run rules now"). For every rule the folder's contents table is
	 * restricted by the rule's PR_RULE_CONDITION (evaluated by the store, so
	 * no restriction engine is needed here) and the resulting messages are
	 * processed according to the rule's PR_RULE_ACTIONS.
	 *
	 * Supported actions are OP_MOVE, OP_COPY, OP_DELETE, OP_MARK_AS_READ and
	 * OP_TAG. Other action types (forward, reply, bounce, deferred, delegate,
	 * out-of-office reply) are counted as skipped and not executed.
	 *
	 * @param resource     $store          The store on which the rules run
	 * @param string|false $folderEntryid  Entryid of the folder to run against;
	 *                                     defaults to the receive folder (Inbox)
	 * @param array        $ruleIds        Optional subset of PR_RULE_ID values
	 *
	 * @return array summary counts of the executed run
	 */
	public function applyRules($store, $folderEntryid = false, $ruleIds = []) {
		$result = [
			'success' => true,
			'rules_run' => 0,
			'matched' => 0,
			'moved' => 0,
			'copied' => 0,
			'deleted' => 0,
			'marked_read' => 0,
			'tagged' => 0,
			'skipped_actions' => 0,
		];

		// Default to the receive folder (Inbox) when no folder is provided.
		if (empty($folderEntryid)) {
			$folder = $this->getRulesFolder($store);
			$folderProps = mapi_getprops($folder, [PR_ENTRYID]);
			$folderEntryid = $folderProps[PR_ENTRYID];
		}

		$storeProps = mapi_getprops($store, [PR_IPM_WASTEBASKET_ENTRYID]);
		$wastebasketEntryid = $storeProps[PR_IPM_WASTEBASKET_ENTRYID] ?? false;

		$rules = $this->getRulesForExecution($store, $ruleIds);

		// Keep the folder object in a variable for the whole run: the contents
		// table is a child of this folder, and if the folder were freed (e.g.
		// by opening it inline) its handle would be invalidated and the table
		// operations would fail with MAPI error 0x4B9.
		$sourceFolder = mapi_msgstore_openentry($store, $folderEntryid);

		foreach ($rules as $rule) {
			// Find the messages in the folder which match the rule's condition.
			// The store evaluates the PR_RULE_CONDITION restriction for us.
			try {
				$contentsTable = mapi_folder_getcontentstable($sourceFolder, MAPI_DEFERRED_ERRORS);
				$condition = $this->stripCommentRestriction($rule[PR_RULE_CONDITION]);
				mapi_table_restrict($contentsTable, $condition, TBL_BATCH);
				$matchRows = mapi_table_queryallrows($contentsTable, [PR_ENTRYID]);
			}
			catch (MAPIException $e) {
				// A condition we cannot evaluate (e.g. a parse error) simply
				// matches nothing; log it and move on to the next rule.
				error_log(sprintf('applyRules: could not evaluate rule condition (0x%08X): %s', $e->getCode(), $e->getMessage()));

				continue;
			}

			$entryids = [];
			foreach ($matchRows as $matchRow) {
				$entryids[] = $matchRow[PR_ENTRYID];
			}

			++$result['rules_run'];

			if (empty($entryids)) {
				continue;
			}

			$result['matched'] += count($entryids);

			foreach ($rule[PR_RULE_ACTIONS] as $action) {
				switch ($action['action']) {
					case OP_MOVE:
					case OP_COPY:
						$destStore = $store;
						if (!empty($action['storeentryid'])) {
							$destStore = $GLOBALS['mapisession']->openMessageStore($action['storeentryid']);
						}
						$moveMessages = $action['action'] === OP_MOVE;
						if ($GLOBALS['operations']->copyMessages($store, $folderEntryid, $destStore, $action['folderentryid'], $entryids, false, $moveMessages)) {
							$result[$moveMessages ? 'moved' : 'copied'] += count($entryids);
						}
						break;

					case OP_DELETE:
						// Model a delete as a (soft) move to the wastebasket,
						// consistent with how the client authors delete rules.
						if ($wastebasketEntryid && $GLOBALS['operations']->copyMessages($store, $folderEntryid, $store, $wastebasketEntryid, $entryids, false, true)) {
							$result['deleted'] += count($entryids);
						}
						break;

					case OP_MARK_AS_READ:
						foreach ($entryids as $entryid) {
							$message = mapi_msgstore_openentry($store, $entryid);
							if ($message) {
								mapi_message_setreadflag($message, SUPPRESS_RECEIPT);
								++$result['marked_read'];
							}
						}
						break;

					case OP_TAG:
						if (isset($action['proptag'], $action['value'])) {
							foreach ($entryids as $entryid) {
								$message = mapi_msgstore_openentry($store, $entryid);
								if ($message) {
									mapi_setprops($message, [$action['proptag'] => $action['value']]);
									mapi_savechanges($message);
									++$result['tagged'];
								}
							}
						}
						break;

					default:
						// forward / reply / bounce / defer / delegate / oof
						++$result['skipped_actions'];
						break;
				}
			}
		}

		// Notify the client so the affected folder's message list refreshes.
		$notifyProps = mapi_getprops($sourceFolder, [PR_ENTRYID, PR_STORE_ENTRYID]);
		$GLOBALS['bus']->notify(bin2hex((string) $notifyProps[PR_ENTRYID]), OBJECT_SAVE, $notifyProps);

		return $result;
	}

	/**
	 * Function will delete (outlook) client rules. Outlook maintains client rules
	 * in associated table of inbox, When we create/delete/update rule from webapp
	 * it won't match with outlook's client rules, so it will confuse outlook and
	 * it will ask user to preserve whether client or server side rules, so every time
	 * we save rules we need to remove this outlook generated client rule to remove
	 * ambigiuty.
	 *
	 * @param resource $store (optional) current user's store
	 */
	public function deleteOLClientRules($store = false) {
		if ($store === false) {
			$store = $GLOBALS['mapisession']->getDefaultMessageStore();
		}

		$inbox = mapi_msgstore_getreceivefolder($store);

		// get inbox' associatedTable
		$associatedTable = mapi_folder_getcontentstable($inbox, MAPI_ASSOCIATED);

		mapi_table_restrict(
			$associatedTable,
			[RES_CONTENT,
				[
					FUZZYLEVEL => FL_FULLSTRING | FL_IGNORECASE,
					ULPROPTAG => PR_MESSAGE_CLASS,
					VALUE => [
						PR_MESSAGE_CLASS => "IPM.RuleOrganizer",
					],
				],
			]
		);
		$messages = mapi_table_queryallrows($associatedTable, [PR_ENTRYID]);

		$deleteMessages = [];
		for ($i = 0, $len = count($messages); $i < $len; ++$i) {
			array_push($deleteMessages, $messages[$i][PR_ENTRYID]);
		}

		if (!empty($deleteMessages)) {
			mapi_folder_deletemessages($inbox, $deleteMessages);
		}
	}

	/**
	 * Function does customization of MAPIException based on module data.
	 * like, here it will generate display message based on actionType
	 * for particular exception.
	 *
	 * @param object     $e             exception object
	 * @param string     $actionType    the action type, sent by the client
	 * @param MAPIobject $store         store object of the message
	 * @param string     $parententryid parent entryid of the message
	 * @param string     $entryid       entryid of the message/folder
	 * @param array      $action        the action data, sent by the client
	 */
	#[Override]
	public function handleException(&$e, $actionType = null, $store = null, $parententryid = null, $entryid = null, $action = null) {
		if (is_null($e->displayMessage)) {
			switch ($actionType) {
				case 'list':
					$e->setDisplayMessage(_('Could not load rules.'));
					break;

				case 'save':
					$e->setDisplayMessage(_('Could not save rules.'));
					break;

				case 'apply':
					$e->setDisplayMessage(_('Could not apply rules.'));
					break;
			}
		}
	}
}
