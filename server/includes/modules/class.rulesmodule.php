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
	public function execute() {
		foreach ($this->data as $actionType => $action) {
			// Determine if the request contains multiple items or not. We couldn't add the storeEntryId to
			// the action data if it contained items because it was an array, so the storeEntryId
			// was added to all the items. We will pick it from the first item.
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
						if (count($action) > 1) {
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
		if (!$this->rulesFolder) {
			if ($store === false) {
				$store = $GLOBALS['mapisession']->getDefaultMessageStore();
			}
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
		}
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
	public function handleException(&$e, $actionType = null, $store = null, $parententryid = null, $entryid = null, $action = null) {
		if (is_null($e->displayMessage)) {
			switch ($actionType) {
				case 'list':
					$e->setDisplayMessage(_('Could not load rules.'));
					break;

				case 'save':
					$e->setDisplayMessage(_('Could not save rules.'));
					break;
			}
		}
	}
}
