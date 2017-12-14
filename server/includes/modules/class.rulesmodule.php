<?php
	/**
	 * Rules Module
	 * Module will be used to save rules information to rules table
	 */
	class RulesModule extends Module
	{
		/**
		 * @var MAPITable contains resource of rules table.
		 */
		private $rulesTable;

		/**
		 * @var MAPITable contains resource of rules modify table.
		 */
		private $rulesModifyTable;

		/**
		 * Constructor
		 * @param int $id unique id.
		 * @param array $data list of all actions.
		 */
		function __construct($id, $data)
		{
			$this->properties = $GLOBALS['properties']->getRulesProperties();

			$this->rulesTable = null;
			$this->rulesModifyTable = null;

			parent::__construct($id, $data);
		}

		/**
		 * Executes all the actions in the $data variable.
		 * @return boolean true on success of false on failure.
		 */
		function execute()
		{
			foreach($this->data as $actionType => $action)
			{
				// Determine if the request contains items or not. We couldn't add the storeEntryId to
				// the action data if it contained items because it was an array, so the storeEntryId
				// was added to all the items. We will pick it from the first item.
				if (isset($action[0])) {
					$storeGuid = $action[0]['message_action']['store'];
				} else {
					$storeGuid = $action['store'];
				}

				$ownStoreEntryId = $GLOBALS['mapisession']->getDefaultMessageStoreEntryId();

				try {
					if ( ENABLE_SHARED_RULES !== true && !$GLOBALS['entryid']->compareEntryIds($storeGuid, $ownStoreEntryId) ){
						// When the admin does not allow a user to set rules on the store of other users, but somehow
						// the user still tries this (probably hacking) we will not allow this
						throw new MAPIException(_('Setting mail filters on the stores of other users is not allowed.'));
					} else {
						$store = $GLOBALS['mapisession']->openMessageStore(hex2bin($storeGuid));
					}

					switch($actionType) {
						case 'list':
							$rules = $this->getRules($store);
							if ($rules) {
								$this->addActionData('list', $rules);
								$GLOBALS['bus']->addData($this->getResponseData());
							} else {
								$this->sendFeedback(false);
							}
							break;
						case 'save':
							// When saving the rules, we expect _all_ rules
							// to have been send. So our first task, is to
							// delete all existing rules.
							$this->deleteRules($store);

							// Now can save all rules
							$this->saveRules($store, $action);

							// delete (outlook) client rules
							$this->deleteOLClientRules($store);

							// Respond with the full set of rules.
							$rules = $this->getRules($store);
							if ($rules) {
								$this->addActionData('update', $rules);
								$GLOBALS['bus']->addData($this->getResponseData());
							} else {
								$this->sendFeedback(false);
							}
							break;
						default:
							$this->handleUnknownActionType($actionType);
					}
				} catch (MAPIException $e) {
					$this->processException($e, $actionType);
				}
			}
		}

		/**
		 * Function will return resource of the rules table that can be used to create/update delegate
		 * meeting rule in current user's store.
		 * @param {MAPIStore} $store (optional) current user's store.
		 * @return {MAPITable} rules table resource.
		 */
		function getRulesTable($store = false)
		{
			if(!$this->rulesTable) {
				$this->rulesTable = mapi_rules_gettable($this->getRulesModifyTable($store));
			}

			return $this->rulesTable;
		}

		/**
		 * Function will return resource of the rules table that can be used to create/update delegate
		 * meeting rule in current user's store.
		 * @param {MAPIStore} $store (optional) current user's store.
		 * @return {MAPITable} rules table resource.
		 */
		function getRulesModifyTable($store = false)
		{
			if(!$this->rulesModifyTable) {
				if($store === false) {
					$store = $GLOBALS['mapisession']->getDefaultMessageStore();
				}

				$inbox = mapi_msgstore_getreceivefolder($store);

				// get IExchangeModifyTable interface
				$this->rulesModifyTable = mapi_folder_openmodifytable($inbox);
			}

			return $this->rulesModifyTable;
		}

		/**
		 * Create a restriction to search for rules which have a rule provider
		 * which starts with RuleOrganizer. Outlook will generate some rules
		 * with PR_RULE_PROVIDER RuleOrganizer2 for client-only rules, however
		 * we still want to show these in the client, hence we perform a prefix
		 * search.
		 * @return {Array} The restriction which should be applied to the RulesTable
		 * to obtain all the rules which should be shown to the user
		 */
		function getRestriction()
		{
			return array(RES_CONTENT,
				array(
					FUZZYLEVEL      =>      FL_PREFIX | FL_IGNORECASE,
					ULPROPTAG       =>      PR_RULE_PROVIDER,
					VALUE           =>      array(
						PR_RULE_PROVIDER        =>      'RuleOrganizer'
					)
				)
			);
		}

		/**
		 * Get all rules of a store
		 *
		 * This function opens the rules table for the specified store, and reads
		 * all rules with PR_RULE_PROVIDER equal to 'RuleOrganizer'. These are the rules
		 * that the user sees when managing rules from Outlook.
		 *
		 * @param {MAPIStore} $store Store in which rules reside
		 * @return {Array} rules data
		 */
		function getRules($store)
		{
			$rulesTable = $this->getRulesTable($store);

			mapi_table_restrict($rulesTable, $this->getRestriction(), TBL_BATCH);
			mapi_table_sort($rulesTable, array(PR_RULE_SEQUENCE => TABLE_SORT_ASCEND), TBL_BATCH);

			$rows = mapi_table_queryallrows($rulesTable, $this->properties);

			$rules = array();

			foreach ($rows as &$row) {
				$rules[] = Conversion::mapMAPI2XML($this->properties, $row);
			}
			unset($row);

			return Array('item' => $rules);
		}

		/**
		 * Function used to delete all the rules the user currently has.
		 * @param {MAPIStore} $store in which we want to delete the rules.
		 */
		function deleteRules($store)
		{
			$modifyTable = $this->getRulesModifyTable($store);
			$rulesTable = $this->getRulesTable($store);

			mapi_table_restrict($rulesTable, $this->getRestriction(), TBL_BATCH);
			mapi_table_sort($rulesTable, array(PR_RULE_SEQUENCE => TABLE_SORT_ASCEND), TBL_BATCH);

			$rows = mapi_table_queryallrows($rulesTable, $this->properties);

			$rules = array();

			foreach ($rows as &$row) {
				$rules[] = array(
					'rowflags' => ROW_REMOVE,
					'properties' => $row
				);
			}

			if (!empty($rules)) {
				mapi_rules_modifytable($modifyTable, $rules);
			}
		}

		/**
		 * Function will be used to create/update rule in user's rules table.
		 * This function only usee ROW_MODIFY flag to save rules data, Which is correct when modifying existing rules
		 * but for adding new rules Kopano Core automatically checks existence of rule id and if it si not then
		 * use ROW_ADD flag.
		 * @param {MAPIStore} $store The store into which the rules must be saved.
		 * @param {Array} $rulesData rules data that should be deleted.
		 */
		function saveRules($store, $rulesData)
		{
			if (is_assoc_array($rulesData)) {
				// wrap single rule in an array
				$rulesData = array($rulesData);
			}

			// save rules in rules table
			$saveRules = array();
			for ($index = 0, $len = count($rulesData); $index < $len; $index++) {
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
					$rule[PR_RULE_ACTIONS] = array(
						array(
							'action' => OP_DEFER_ACTION,
							'dam' => hex2bin('E0C810000120000100000000000000010000000000000001000000360000000200FFFF00000C004352756C65456C656D656E7490010000010000000000000001000000018064000000010000000000000001000000')
						)
					);
				}

				if (empty($rule[PR_RULE_CONDITION])) {
					$rule[PR_RULE_CONDITION] = array(
						RES_EXIST,
						array(
							ULPROPTAG => PR_MESSAGE_CLASS
						)
					);
				}

				if (empty($rule[PR_RULE_NAME])) {
					$rule[PR_RULE_NAME] = _('Untitled rule');
				}

				// generate rule provider data
				$rule[PR_RULE_PROVIDER_DATA] = pack('VVa*', 1, $rule[PR_RULE_ID], Conversion::UnixTimeToCOleDateTime(time()));

				$saveRules[] = array(
					'rowflags' => ROW_ADD,
					'properties' => $rule
				);
			}

			if (!empty($saveRules)) {
				mapi_rules_modifytable($this->getRulesModifyTable($store), $saveRules);
			}
		}

		/**
		 * Function will delete (outlook) client rules. Outlook maintains client rules
		 * in associated table of inbox, When we create/delete/update rule from webapp
		 * it won't match with outlook's client rules, so it will confuse outlook and
		 * it will ask user to preserve whether client or server side rules, so everytime
		 * we save rules we need to remove this outlook generated client rule to remove
		 * ambigiuty.
		 *
		 * @param {MAPIStore} $store (optional) current user's store.
		 */
		function deleteOLClientRules($store = false)
		{
			if($store === false) {
				$store = $GLOBALS['mapisession']->getDefaultMessageStore();
			}

			$inbox = mapi_msgstore_getreceivefolder($store);

			// get inbox' associatedTable
			$associatedTable = mapi_folder_getcontentstable($inbox, MAPI_ASSOCIATED);

			mapi_table_restrict($associatedTable,
						array(RES_CONTENT,
							array(
								FUZZYLEVEL	=>	FL_FULLSTRING | FL_IGNORECASE,
								ULPROPTAG	=>	PR_MESSAGE_CLASS,
								VALUE		=>	array(
									PR_MESSAGE_CLASS	=>	"IPM.RuleOrganizer"
								)
							)
						)
								);
			$messages = mapi_table_queryallrows($associatedTable, array(PR_ENTRYID));

			$deleteMessages = array();
			for ($i = 0, $len = count($messages); $i < $len; $i++) {
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
		 * @param object $e Exception object.
		 * @param string $actionType the action type, sent by the client.
		 * @param MAPIobject $store Store object of the message.
		 * @param string $parententryid parent entryid of the message.
		 * @param string $entryid entryid of the message/folder.
		 * @param array $action the action data, sent by the client.
		 */
		function handleException(&$e, $actionType = null, $store = null, $parententryid = null, $entryid = null, $action = null)
		{
			if (is_null($e->displayMessage)) {
				switch ($actionType)
				{
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
?>
