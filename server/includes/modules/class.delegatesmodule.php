<?php

/**
 * DelegatesModule
 * Class can be used to get delegate information of a particular user.
 * The delegate information can be created/update using this class as well.
 */
class DelegatesModule extends Module {
	/**
	 * @var array contains entryid's of all default folders
	 */
	private $defaultFolders;

	/**
	 * @var array contains delegate properties from special message (LocalFreebusy)
	 */
	private $delegateProps;

	/**
	 * @var resource of LocalFreeBusy Message. This contains for delegates.
	 */
	private $localFreeBusyMessage;

	/**
	 * @var resource of FreeBusy Folder in IPM_SUBTREE. This permissions for freebusy folder used in calendar.
	 */
	private $freeBusyFolder;

	/**
	 * @var resource of default store of the current user
	 */
	private $defaultStore;

	/**
	 * Constructor.
	 *
	 * @param int   $id   unique id
	 * @param array $data list of all actions
	 */
	public function __construct($id, $data) {
		$this->defaultFolders = [];
		$this->delegateProps = [];
		$this->localFreeBusyMessage = false;
		$this->freeBusyFolder = false;
		$this->defaultStore = false;

		parent::__construct($id, $data);
	}

	/**
	 * Executes all the actions in the $data variable.
	 */
	#[Override]
	public function execute() {
		foreach ($this->data as $actionType => $action) {
			if (isset($actionType)) {
				try {
					match ($actionType) {
						'list' => $this->delegateList(),
						'open' => $this->openDelegate($action),
						'save' => $this->saveDelegates($action),
						'delete' => $this->deleteDelegates($action),
						default => $this->handleUnknownActionType($actionType),
					};
				}
				catch (MAPIException $e) {
					$this->processException($e, $actionType);
				}
			}
		}
	}

	/* Generic functions to access data */

	/**
	 * Function will return values of the properties PR_DELEGATE_FLAGS, PR_SCHDINFO_DELEGATE_ENTRYIDS and
	 * PR_SCHDINFO_DELEGATE_NAMES from LocalFreeBusyMessage of the user's store.
	 *
	 * @param resource $localFreeBusyMessage (optional) local freebusy message of the user's store
	 *
	 * @return array values of delegate properties
	 */
	public function getDelegateProps($localFreeBusyMessage = false) {
		if (empty($this->delegateProps)) {
			if ($localFreeBusyMessage === false) {
				$localFreeBusyMessage = FreeBusy::getLocalFreeBusyMessage($this->getDefaultStore());
			}

			$this->delegateProps = mapi_getprops($localFreeBusyMessage, [PR_DELEGATE_FLAGS, PR_SCHDINFO_DELEGATE_ENTRYIDS, PR_SCHDINFO_DELEGATE_NAMES]);

			// check if properties exists or not, if not then initialize with default values
			// this way in caller functions we don't need to check for non-existent properties
			if (!isset($this->delegateProps[PR_DELEGATE_FLAGS])) {
				$this->delegateProps[PR_DELEGATE_FLAGS] = [];
			}

			if (!isset($this->delegateProps[PR_SCHDINFO_DELEGATE_ENTRYIDS])) {
				$this->delegateProps[PR_SCHDINFO_DELEGATE_ENTRYIDS] = [];
			}

			if (!isset($this->delegateProps[PR_SCHDINFO_DELEGATE_NAMES])) {
				$this->delegateProps[PR_SCHDINFO_DELEGATE_NAMES] = [];
			}
		}

		return $this->delegateProps;
	}

	/**
	 * Function will return array of entryids of default folders of the user's store.
	 *
	 * @param resource $store (optional) user's store
	 *
	 * @return array default folder entryids
	 */
	public function getDefaultFolders($store = false) {
		if (empty($this->defaultFolders)) {
			if ($store === false) {
				$store = $this->getDefaultStore();
			}

			// Get root store
			$root = mapi_msgstore_openentry($store);

			// Get Inbox folder
			$inbox = mapi_msgstore_getreceivefolder($store);
			$inboxprops = mapi_getprops($inbox, [PR_ENTRYID]);

			// Get entryids of default folders.
			$rootStoreProps = mapi_getprops($root, [PR_IPM_APPOINTMENT_ENTRYID, PR_IPM_TASK_ENTRYID, PR_IPM_CONTACT_ENTRYID, PR_IPM_NOTE_ENTRYID, PR_IPM_JOURNAL_ENTRYID]);

			$this->defaultFolders = [
				'calendar' => $rootStoreProps[PR_IPM_APPOINTMENT_ENTRYID],
				'tasks' => $rootStoreProps[PR_IPM_TASK_ENTRYID],
				'inbox' => $inboxprops[PR_ENTRYID],
				'contacts' => $rootStoreProps[PR_IPM_CONTACT_ENTRYID],
				'notes' => $rootStoreProps[PR_IPM_NOTE_ENTRYID],
				'journal' => $rootStoreProps[PR_IPM_JOURNAL_ENTRYID],
			];
		}

		return $this->defaultFolders;
	}

	/**
	 * Function will return index of a particular delegate, this index can be used to get information of
	 * delegate from PR_DELEGATE_FLAGS, PR_SCHDINFO_DELEGATE_ENTRYIDS and
	 * PR_SCHDINFO_DELEGATE_NAMES properties.
	 *
	 * @param string $entryId entryid of delegate
	 *
	 * @return int index of the delegate information
	 */
	public function getDelegateIndex($entryId) {
		$delegateProps = $this->getDelegateProps();

		// Check if user is existing delegate.
		if (!empty($delegateProps[PR_SCHDINFO_DELEGATE_ENTRYIDS])) {
			return array_search($entryId, $delegateProps[PR_SCHDINFO_DELEGATE_ENTRYIDS]);
		}

		return false;
	}

	/**
	 * Function will return resource of the default store of the current logged in user.
	 *
	 * @return resource current user's store
	 */
	public function getDefaultStore() {
		if (!$this->defaultStore) {
			$this->defaultStore = $GLOBALS['mapisession']->getDefaultMessageStore();
		}

		return $this->defaultStore;
	}

	/**
	 * Function will return properties of the user from addressbook based on passed user's entryid.
	 *
	 * @param string $userEntryId entryid of the user from addressbook
	 *
	 * @return array properties of user from addressbook
	 */
	public function getUserInfo($userEntryId) {
		// default return stuff
		$result = [
			'display_name' => _('Unknown user/group'),
			'entryid' => null,
		];

		// open the addressbook
		$ab = $GLOBALS['mapisession']->getAddressbook();

		try {
			// try userid as normal user
			$user = mapi_ab_openentry($ab, $userEntryId);
		}
		catch (MAPIException $e) {
			if ($e->getCode() === MAPI_E_NOT_FOUND) {
				$e->setHandled();

				return $result;
			}
		}

		$props = mapi_getprops($user, [PR_DISPLAY_NAME]);
		$result['display_name'] = $props[PR_DISPLAY_NAME];
		$result['entryid'] = bin2hex($userEntryId);

		return $result;
	}

	/* Functions to get delegates information */

	/**
	 * Function will return all the delegates information for current user.
	 */
	public function delegateList() {
		$delegateProps = $this->getDelegateProps();

		$data = [];

		// get delegate meeting rule
		$delegateMeetingRule = $this->getDelegateMeetingRule();

		// Get permissions of all delegates.
		if (!empty($delegateProps[PR_SCHDINFO_DELEGATE_ENTRYIDS])) {
			for ($i = 0, $len = count($delegateProps[PR_SCHDINFO_DELEGATE_ENTRYIDS]); $i < $len; ++$i) {
				array_push($data, $this->getDelegatePermissions($delegateProps[PR_SCHDINFO_DELEGATE_ENTRYIDS][$i], $delegateMeetingRule));
			}
		}

		$this->addActionData('list', ['item' => $data]);
		$GLOBALS['bus']->addData($this->getResponseData());
	}

	/**
	 * Function will return the permissions assigned for a particular delegate user.
	 *
	 * @param array $delegate the delegate information sent by client
	 */
	public function openDelegate($delegate) {
		// Get permissions of a delegate.
		$data = $this->getDelegatePermissions(hex2bin((string) $delegate['entryid']));

		$this->addActionData('item', ['item' => $data]);
		$GLOBALS['bus']->addData($this->getResponseData());
	}

	/**
	 * Function will return information of a particular delegate from current user's store.
	 *
	 * @param string $userEntryId         entryid of the delegate
	 * @param array  $delegateMeetingRule (optional) information of the delegate meeting rule that can be used to check if
	 *                                    current delegate exists in the meeting rule
	 *
	 * @return array delegate information
	 */
	public function getDelegatePermissions($userEntryId, $delegateMeetingRule = false) {
		$delegateProps = $this->getDelegateProps();
		$delegateIndex = $this->getDelegateIndex($userEntryId);
		$userinfo = $this->getUserInfo($userEntryId);

		$delegate = [];
		$delegate['entryid'] = bin2hex($userEntryId);

		$delegate['props'] = [];
		$delegate['props']['display_name'] = $userinfo['display_name'];
		$delegate['props']['can_see_private'] = isset($delegateProps[PR_DELEGATE_FLAGS][$delegateIndex]) ? ($delegateProps[PR_DELEGATE_FLAGS][$delegateIndex] == 1) : false;

		$delegate['props'] = array_merge($delegate['props'], $this->getFolderPermissions($userEntryId));

		return $delegate;
	}

	/**
	 * Function will return folder permissions of a delegate user.
	 *
	 * @param string $userEntryId entryid of the delegate
	 *
	 * @return array folder permissions of a delegate user
	 */
	public function getFolderPermissions($userEntryId) {
		$delegateRights = [];
		$store = $this->getDefaultStore();

		foreach ($this->getDefaultFolders($store) as $folderName => $folderEntryId) {
			$folder = mapi_msgstore_openentry($store, $folderEntryId);

			// Get all users who has permissions
			$grants = mapi_zarafa_getpermissionrules($folder, ACCESS_TYPE_GRANT);

			// Find current delegate and get permission.
			foreach ($grants as $id => $grant) {
				if ($GLOBALS["entryid"]->compareEntryIds(bin2hex($userEntryId), bin2hex((string) $grant['userid']))) {
					$delegateRights['rights_' . $folderName] = $grant['rights'];
				}
			}
		}

		return $delegateRights;
	}

	/**
	 * Function will return properties of meeting rule that is used to send meeting related messages to delegate.
	 *
	 * @return array delegate meeting rule information
	 */
	public function getDelegateMeetingRule() {
		$inbox = mapi_msgstore_getreceivefolder($this->getDefaultStore());
		$rulesTable = mapi_folder_getrulestable($inbox);
		// get delegate meeting rule
		$restriction = [RES_CONTENT,
			[
				FUZZYLEVEL => FL_FULLSTRING | FL_IGNORECASE,
				ULPROPTAG => PR_RULE_PROVIDER,
				VALUE => [
					PR_RULE_PROVIDER => 'Schedule+ EMS Interface',
				],
			],
		];
		mapi_table_restrict($rulesTable, $restriction);
		// there will be only one rule, so fetch that only
		$delegateMeetingRule = mapi_table_queryrows($rulesTable, $GLOBALS['properties']->getRulesProperties(), 0, 1);

		return !empty($delegateMeetingRule) ? $delegateMeetingRule[0] : false;
	}

	/* Functions to update delegates information */

	/**
	 * Function which saves delegates information sent from client.
	 *
	 * @param array $delegates the delegates information sent by client
	 */
	public function saveDelegates($delegates) {
		$responseData = [];

		// @FIXME currently client only sends a single delegate in a request, if we can change that to contain
		// multiple delegates that would be good

		if (is_assoc_array($delegates)) {
			// wrap single delegate in an array
			$delegates = [$delegates];
		}

		for ($index = 0, $len = count($delegates); $index < $len; ++$index) {
			$delegate = $delegates[$index];
			$this->setFolderPermissions($delegate);
			// set properties for delegates on user's freebusy folder
			array_push($responseData, ['entryid' => $delegate['entryid']]);
		}
		$this->setDelegateProps($delegates);
		// set delegate meeting rule
		$this->setDelegateMeetingRule($delegates);

		// send response to indicate success
		if (!empty($responseData)) {
			$this->addActionData('update', ['item' => $responseData]);
			$GLOBALS['bus']->addData($this->getResponseData());
		}
	}

	/**
	 * Function will update PR_DELEGATE_FLAGS, PR_SCHDINFO_DELEGATE_ENTRYIDS and
	 * PR_SCHDINFO_DELEGATE_NAMES properties in the current user's store.
	 *
	 * @param mixed $delegates
	 */
	public function setDelegateProps($delegates) {
		$localFreeBusyMessage = FreeBusy::getLocalFreeBusyMessage($this->getDefaultStore());
		$delegateProps = $this->getDelegateProps($localFreeBusyMessage);
		$len = count($delegates);
		for ($i = 0; $i < $len; ++$i) {
			$delegate = $delegates[$i];
			$len1 = count($delegateProps[PR_SCHDINFO_DELEGATE_ENTRYIDS]);
			for ($j = 0; $j < $len1; ++$j) {
				if ($delegateProps[PR_SCHDINFO_DELEGATE_ENTRYIDS][$j] == hex2bin((string) $delegate['entryid'])) {
					break;
				}
			}
			$delegateProps[PR_SCHDINFO_DELEGATE_ENTRYIDS][$j] = hex2bin((string) $delegate['entryid']);
			if (isset($delegate['props']['display_name'])) {
				$delegateProps[PR_SCHDINFO_DELEGATE_NAMES][$j] = $delegate['props']['display_name'];
			}
			else {
				$addrBook = $GLOBALS['mapisession']->getAddressbook();
				$user = mapi_ab_openentry($addrBook, hex2bin((string) $delegate['entryid']));
				if (empty($user)) {
					$delegateProps[PR_SCHDINFO_DELEGATE_NAMES][$j] = "";
				}
				else {
					$userProps = mapi_getprops($user, [PR_SMTP_ADDRESS]);
					if (empty($userProps[PR_SMTP_ADDRESS])) {
						$delegateProps[PR_SCHDINFO_DELEGATE_NAMES][$j] = "";
					}
					else {
						$delegateProps[PR_SCHDINFO_DELEGATE_NAMES][$j] = $userProps[PR_SMTP_ADDRESS];
					}
				}
			}
			if (isset($delegate['props']['can_see_private'])) {
				$delegateProps[PR_DELEGATE_FLAGS][$j] = $delegate['props']['can_see_private'];
			}
			else {
				$delegateProps[PR_DELEGATE_FLAGS][$j] = false;
			}
		}
		mapi_setprops($localFreeBusyMessage, $delegateProps);
		mapi_savechanges($localFreeBusyMessage);
		// unset the module variable, so subsequent calls will have the updated value
		unset($this->delegateProps);
	}

	/**
	 * Function will set folder permissions for a delegate user.
	 *
	 * @param array $delegate delegate information sent from client
	 */
	public function setFolderPermissions($delegate) {
		$store = $this->getDefaultStore();

		// Get all default folders and set permissions.
		foreach ($this->getDefaultFolders($store) as $folderName => $folderEntryID) {
			// we need to only modify those permissions which are modified on client
			if (isset($delegate['props']['rights_' . $folderName]) && $delegate['props']['rights_' . $folderName] !== '') {
				$folder = mapi_msgstore_openentry($store, $folderEntryID);

				// Set new permissions.
				$acls = [
					[
						'type' => ACCESS_TYPE_GRANT,
						'userid' => hex2bin((string) $delegate['entryid']),
						'rights' => $delegate['props']['rights_' . $folderName],
						'state' => RIGHT_NEW | RIGHT_AUTOUPDATE_DENIED,
						'memberid' => 0,
					],
				];

				mapi_zarafa_setpermissionrules($folder, $acls);
				mapi_savechanges($folder);

				if ($folderName === 'calendar') {
					$freeBusyFolder = FreeBusy::getLocalFreeBusyFolder($store);

					if ($freeBusyFolder !== false) {
						// set permissions on free/busy message
						$acls[0]['rights'] |= ecRightsDefaultPublic;

						mapi_zarafa_setpermissionrules($freeBusyFolder, $acls);
						mapi_savechanges($freeBusyFolder);
					}
				}
			}
		}
	}

	/**
	 * Function which creates/modifies delegate meeting rule in user store
	 * to send meeting request mails to delegates also.
	 *
	 * @param array $delegates all delegate information
	 */
	public function setDelegateMeetingRule($delegates) {
		$delegateMeetingRule = $this->getDelegateMeetingRule();
		if ($delegateMeetingRule !== false) {
			$users = $delegateMeetingRule[PR_RULE_ACTIONS][0]['adrlist'];
		}
		else {
			$users = [];
		}
		// open addressbook to get information of all users
		$addrBook = $GLOBALS['mapisession']->getAddressbook();
		$len = count($delegates);
		for ($i = 0; $i < $len; ++$i) {
			$delegate = $delegates[$i];
			// get user info, using entryid
			$user = mapi_ab_openentry($addrBook, hex2bin((string) $delegate['entryid']));
			$userProps = mapi_getprops($user, [PR_ENTRYID, PR_ADDRTYPE, PR_EMAIL_ADDRESS, PR_DISPLAY_NAME, PR_SEARCH_KEY, PR_SMTP_ADDRESS, PR_OBJECT_TYPE, PR_DISPLAY_TYPE, PR_DISPLAY_TYPE_EX]);

			if (is_array($userProps)) {
				// add recipient type prop, to specify type of recipient in mail
				$userProps[PR_RECIPIENT_TYPE] = MAPI_TO;
				$len1 = count($users);
				for ($j = 0; $j < $len1; ++$j) {
					if ($userProps[PR_ENTRYID] == $users[$j][PR_ENTRYID]) {
						break;
					}
				}
				$users[$j] = $userProps;
			}
		}
		// only continue if any delegate has set the flag
		if (!empty($users)) {
			if ($delegateMeetingRule === false) {
				$this->createDelegateMeetingRule($users);
			}
			else {
				$this->modifyDelegateMeetingRule($delegateMeetingRule, $users);
			}
		}
	}

	/**
	 * Function will create a new delegate meeting rule if it is not present in current user's store.
	 *
	 * @param array $usersInfo user properties which should be added in PR_RULE_ACTIONS
	 */
	public function createDelegateMeetingRule($usersInfo) {
		// create new rule
		$rule = [];

		// no need to pass rule_id when creating new rule
		$rule[PR_RULE_ACTIONS] = [
			[
				'action' => OP_DELEGATE,
				// don't set this value it will have no effect, its hardcoded to FWD_PRESERVE_SENDER | FWD_DO_NOT_MUNGE_MSG
				'flavor' => 0,
				'flags' => 0,
				'adrlist' => $usersInfo,
			],
		];

		$rule[PR_RULE_CONDITION] = [RES_AND,
			[
				[RES_CONTENT,
					[
						FUZZYLEVEL => FL_PREFIX,
						ULPROPTAG => PR_MESSAGE_CLASS,
						VALUE => [PR_MESSAGE_CLASS => 'IPM.Schedule.Meeting'],
					],
				],
				[RES_NOT,
					[
						[RES_EXIST,
							[
								ULPROPTAG => PR_DELEGATED_BY_RULE,
							],
						],
					],
				],
				[RES_OR,
					[
						[RES_NOT,
							[
								[RES_EXIST,
									[
										ULPROPTAG => PR_SENSITIVITY,
									],
								],
							],
						],
						[RES_PROPERTY,
							[
								RELOP => RELOP_NE,
								ULPROPTAG => PR_SENSITIVITY,
								VALUE => [PR_SENSITIVITY => SENSITIVITY_PRIVATE],
							],
						],
					],
				],
			],
		];

		$rule[PR_RULE_NAME] = '';
		$rule[PR_RULE_PROVIDER_DATA] = '';		// 0 byte binary string
		$rule[PR_RULE_STATE] = ST_ENABLED;
		$rule[PR_RULE_LEVEL] = 0;
		$rule[PR_RULE_SEQUENCE] = 0;
		$rule[PR_RULE_PROVIDER] = 'Schedule+ EMS Interface';
		$rule[PR_RULE_USER_FLAGS] = 0;

		$rows = [
			0 => [
				'rowflags' => ROW_ADD,
				'properties' => $rule,
			],
		];
		$inbox = mapi_msgstore_getreceivefolder($this->getDefaultStore());
		mapi_folder_modifyrules($inbox, $rows);
	}

	public function modifyDelegateMeetingRule($delegateMeetingRule, $users) {
		$inbox = mapi_msgstore_getreceivefolder($this->getDefaultStore());
		if (count($users) > 0) {
			// update the adrlist in the rule
			$delegateMeetingRule[PR_RULE_ACTIONS][0]['adrlist'] = $users;

			$rows = [
				[
					'rowflags' => ROW_MODIFY,
					'properties' => $delegateMeetingRule,
				],
			];
		}
		else {
			// no users remaining in the rule so delete the rule
			$rows = [
				0 => [
					'rowflags' => ROW_REMOVE,
					'properties' => $delegateMeetingRule,
				],
			];
		}
		mapi_folder_modifyrules($inbox, $rows);
	}

	/* Functions to delete delegates information */

	/**
	 * Function which deletes delegates information sent by client.
	 *
	 * @param array $delegates delegates information sent by client
	 */
	public function deleteDelegates($delegates) {
		if (is_assoc_array($delegates)) {
			// wrap single delegate in an array
			$delegates = [$delegates];
		}
		foreach ($delegates as $delegate) {
			// set properties for delegates on user's freebusy folder
			$this->deleteDelegateProps($delegate);

			// set permissions on user's default folders
			$this->deleteFolderPermissions($delegate);
		}
		// delete delegate meeting rule
		$this->removeDelegatesFromDelegateMeetingRule($delegates);
		$this->sendFeedback(true);
	}

	/**
	 * Function will delete values from PR_DELEGATE_FLAGS, PR_SCHDINFO_DELEGATE_ENTRYIDS and PR_SCHDINFO_DELEGATE_NAMES and save the properties back if its not empty.
	 *
	 * @param array $delegate delegate information sent from client
	 */
	public function deleteDelegateProps($delegate) {
		$localFreeBusyMessage = FreeBusy::getLocalFreeBusyMessage($this->getDefaultStore());
		$delegateProps = $this->getDelegateProps($localFreeBusyMessage);
		$delegateIndex = -1;
		$len = count($delegateProps[PR_SCHDINFO_DELEGATE_ENTRYIDS]);
		for ($i = 0; $i < $len; ++$i) {
			if ($delegateProps[PR_SCHDINFO_DELEGATE_ENTRYIDS][$i] == hex2bin((string) $delegate["entryid"])) {
				$delegateIndex = $i;
				break;
			}
		}
		if ($delegateIndex == -1) {
			return;
		}
		unset($delegateProps[PR_DELEGATE_FLAGS][$delegateIndex], $delegateProps[PR_SCHDINFO_DELEGATE_ENTRYIDS][$delegateIndex], $delegateProps[PR_SCHDINFO_DELEGATE_NAMES][$delegateIndex]);

		// unset will remove the value but will not regenerate array keys, so we need to
		// do it here
		$delegateProps[PR_DELEGATE_FLAGS] = array_values($delegateProps[PR_DELEGATE_FLAGS]);
		$delegateProps[PR_SCHDINFO_DELEGATE_ENTRYIDS] = array_values($delegateProps[PR_SCHDINFO_DELEGATE_ENTRYIDS]);
		$delegateProps[PR_SCHDINFO_DELEGATE_NAMES] = array_values($delegateProps[PR_SCHDINFO_DELEGATE_NAMES]);

		if (!empty($delegateProps[PR_SCHDINFO_DELEGATE_ENTRYIDS])) {
			mapi_setprops($localFreeBusyMessage, $delegateProps);
		}
		else {
			// Delete delegate properties.
			mapi_deleteprops($localFreeBusyMessage, [PR_DELEGATE_FLAGS, PR_SCHDINFO_DELEGATE_ENTRYIDS, PR_SCHDINFO_DELEGATE_NAMES]);
		}

		mapi_savechanges($localFreeBusyMessage);

		// unset the module variable, so subsequent calls will have the updated value
		unset($this->delegateProps);
	}

	/**
	 * Function which deletes permissions from all default folder for a particular delegate.
	 *
	 * @param array $delegate delegate's information sent by client
	 */
	public function deleteFolderPermissions($delegate) {
		$store = $this->getDefaultStore();

		// Get all default folders and set permissions.
		foreach ($this->getDefaultFolders($store) as $folderName => $folderEntryID) {
			$folder = mapi_msgstore_openentry($store, $folderEntryID);

			// delete current acl's
			$acls = [
				[
					'type' => ACCESS_TYPE_GRANT,
					'userid' => hex2bin((string) $delegate['entryid']),
					'rights' => ecRightsNone,
					'state' => RIGHT_DELETED | RIGHT_AUTOUPDATE_DENIED,
					'memberid' => 0,
				],
			];

			mapi_zarafa_setpermissionrules($folder, $acls);

			if ($folderName === 'calendar') {
				$freeBusyFolder = FreeBusy::getLocalFreeBusyFolder($store);

				if ($freeBusyFolder !== false) {
					mapi_zarafa_setpermissionrules($freeBusyFolder, $acls);
					mapi_savechanges($freeBusyFolder);
				}
			}

			mapi_savechanges($folder);
		}
	}

	/**
	 * Function will remove delegates from delegate meeting rule when the user is deleted from delegate list.
	 *
	 * @param array $delegates all delegate information that are deleted
	 */
	public function removeDelegatesFromDelegateMeetingRule($delegates) {
		$delegateMeetingRule = $this->getDelegateMeetingRule();
		if ($delegateMeetingRule === false) {
			// no delegate rule exists, nothing to do
			return;
		}
		$len = count($delegates);
		$old_users = $delegateMeetingRule[PR_RULE_ACTIONS][0]['adrlist'];
		$new_users = [];
		foreach ($old_users as $user) {
			for ($index = 0; $index < $len; ++$index) {
				if ($user[PR_ENTRYID] == hex2bin((string) $delegates[$index]['entryid'])) {
					break;
				}
			}
			if ($index == $len) {
				$new_users[] = $user;
			}
		}
		$this->modifyDelegateMeetingRule($delegateMeetingRule, $new_users);
	}

	/* Functions for exception handling */

	/**
	 * Function does customization of MAPIException based on module data.
	 * like, here it will generate display message based on actionType
	 * for particular exception.
	 *
	 * @param object     $e             Exception object
	 * @param string     $actionType    the action type, sent by the client
	 * @param MAPIobject $store         store object of the current user
	 * @param string     $parententryid parent entryid of the message
	 * @param string     $entryid       entryid of the message/folder
	 * @param array      $action        the action data, sent by the client
	 */
	#[Override]
	public function handleException(&$e, $actionType = null, $store = null, $parententryid = null, $entryid = null, $action = null) {
		switch ($actionType) {
			case 'save':
				$e->setDisplayMessage(_('Could not save delegate information.'));
				break;

			case 'delete':
				$e->setDisplayMessage(_('Could not delete delegate.'));
				break;

			case 'list':
				$e->setDisplayMessage(_('Can not get list of delegates.'));
				break;
		}

		parent::handleException($e, $actionType, $store, $parententryid, $entryid, $action);
	}
}
