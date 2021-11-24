<?php
	/**
	 * DelegatesModule
	 * Class can be used to get delegate information of a particular user.
	 * The delegate information can be created/update using this class as well.
	 */
	class DelegatesModule extends Module
	{
		/**
		 * @var array contains entryid's of all default folders.
		 */
		private $defaultFolders;

		/**
		 * @var array contains delegate properties from special message (LocalFreebusy).
		 */
		private $delegateProps;

		/**
		 * @var Resource of LocalFreeBusy Message. This contains $delegateProps for delegates.
		 */
		private $localFreeBusyMessage;

		/**
		 * @var Resource of FreeBusy Folder in IPM_SUBTREE. This permissions for freebusy folder used in calendar.
		 */
		private $freeBusyFolder;

		/**
		 * @var Resource of default store of the current user.
		 */
		private $defaultStore;

		/**
		 * Constructor
		 * @param int $id unique id.
		 * @param array $data list of all actions.
		 */
		function __construct($id, $data)
		{
			$this->defaultFolders = array();
			$this->delegateProps = array();
			$this->localFreeBusyMessage = false;
			$this->freeBusyFolder = false;
			$this->defaultStore = false;

			parent::__construct($id, $data);
		}

		/**
		 * Executes all the actions in the $data variable
		 */
		function execute()
		{
			foreach($this->data as $actionType => $action)
			{
				if(isset($actionType)) {
					try {
						switch($actionType)
						{
							case 'list':
								$this->delegateList();
								break;
							case 'open':
								$this->openDelegate($action);
								break;
							case 'save':
								$this->saveDelegates($action);
								break;
							case 'delete':
								$this->deleteDelegates($action);
								break;
							default:
								$this->handleUnknownActionType($actionType);
						}
					} catch (MAPIException $e) {
						$this->processException($e, $actionType);
					}
				}
			}
		}

		/******** Generic functions to access data ***********/

		/**
		 * Function will return values of the properties PR_DELEGATES_SEE_PRIVATE, PR_SCHDINFO_DELEGATE_ENTRYIDS and
		 * PR_SCHDINFO_DELEGATE_NAMES from LocalFreeBusyMessage of the user's store.
		 * @param {MAPIMessage} $localFreeBusyMessage (optional) local freebusy message of the user's store.
		 * @return {Array} values of delegate properties.
		 */
		function getDelegateProps($localFreeBusyMessage = false)
		{
			if(empty($this->delegateProps)) {
				if($localFreeBusyMessage === false) {
					$localFreeBusyMessage = freebusy::getLocalFreeBusyMessage();
				}

				$this->delegateProps = mapi_getprops($localFreeBusyMessage, array(PR_DELEGATES_SEE_PRIVATE, PR_SCHDINFO_DELEGATE_ENTRYIDS, PR_SCHDINFO_DELEGATE_NAMES));

				// check if properties exists or not, if not then initialize with default values
				// this way in caller functions we don't need to check for non-existent properties
				if(!isset($this->delegateProps[PR_DELEGATES_SEE_PRIVATE])) {
					$this->delegateProps[PR_DELEGATES_SEE_PRIVATE] = array();
				}

				if(!isset($this->delegateProps[PR_SCHDINFO_DELEGATE_ENTRYIDS])) {
					$this->delegateProps[PR_SCHDINFO_DELEGATE_ENTRYIDS] = array();
				}

				if(!isset($this->delegateProps[PR_SCHDINFO_DELEGATE_NAMES])) {
					$this->delegateProps[PR_SCHDINFO_DELEGATE_NAMES] = array();
				}
			}

			return $this->delegateProps;
		}

		/**
		 * Function will return array of entryids of default folders of the user's store.
		 * @param {MAPIStore} $store (optional) user's store.
		 * @return {Array} default folder entryids.
		 */
		function getDefaultFolders($store = false)
		{
			if(empty($this->defaultFolders)) {
				if($store === false) {
					$store = $this->getDefaultStore();
				}

				// Get root store
				$root = mapi_msgstore_openentry($store, null);

				// Get Inbox folder
				$inbox = mapi_msgstore_getreceivefolder($store);
				$inboxprops = mapi_getprops($inbox, Array(PR_ENTRYID));

				// Get entryids of default folders.
				$rootStoreProps = mapi_getprops($root, array(PR_IPM_APPOINTMENT_ENTRYID, PR_IPM_TASK_ENTRYID, PR_IPM_CONTACT_ENTRYID, PR_IPM_NOTE_ENTRYID, PR_IPM_JOURNAL_ENTRYID));
				
				$this->defaultFolders = array(
					'calendar' 		=> $rootStoreProps[PR_IPM_APPOINTMENT_ENTRYID],
					'tasks' 		=> $rootStoreProps[PR_IPM_TASK_ENTRYID],
					'inbox' 		=> $inboxprops[PR_ENTRYID],
					'contacts'		=> $rootStoreProps[PR_IPM_CONTACT_ENTRYID],
					'notes'			=> $rootStoreProps[PR_IPM_NOTE_ENTRYID],
					'journal'		=> $rootStoreProps[PR_IPM_JOURNAL_ENTRYID]
				);
			}

			return $this->defaultFolders;
		}

		/**
		 * Function will return index of a particular delegate, this index can be used to get information of
		 * delegate from PR_DELEGATES_SEE_PRIVATE, PR_SCHDINFO_DELEGATE_ENTRYIDS and
		 * PR_SCHDINFO_DELEGATE_NAMES properties.
		 * @param {BinEntryid} $entryId entryid of delegate.
		 * @return {Number} index of the delegate information.
		 */
		function getDelegateIndex($entryId)
		{
			$delegateProps = $this->getDelegateProps();

			// Check if user is existing delegate.
			if(!empty($delegateProps[PR_SCHDINFO_DELEGATE_ENTRYIDS])) {
				return array_search($entryId, $delegateProps[PR_SCHDINFO_DELEGATE_ENTRYIDS]);
			} else {
				return false;
			}
		}

		/**
		 * Function will return resource of the default store of the current logged in user.
		 * @return {MAPIStore} current user's store.
		 */
		function getDefaultStore()
		{
			if(!$this->defaultStore) {
				$this->defaultStore = $GLOBALS['mapisession']->getDefaultMessageStore();
			}

			return $this->defaultStore;
		}

		/**
		 * Function will return properties of the user from addressbook based on passed user's entryid.
		 * @param {BinEntryid} $userEntryId entryid of the user from addressbook.
		 * @return {Array} properties of user from addressbook.
		 */
		function getUserInfo($userEntryId)
		{
			// default return stuff
			$result = array(
				'display_name' => Language::getstring('Unknown user/group'),
				'entryid' => null
			);

			// open the addressbook
			$ab = $GLOBALS['mapisession']->getAddressbook();

			try {
				// try userid as normal user
				$user = mapi_ab_openentry($ab, $userEntryId);
			} catch (MAPIException $e) {
				if($e->getCode() === MAPI_E_NOT_FOUND) {
					$e->setHandled();
					return $result;
				}
			}

			$props = mapi_getprops($user, array(PR_DISPLAY_NAME));
			$result['display_name'] = $props[PR_DISPLAY_NAME];
			$result['entryid'] = bin2hex($userEntryId);

			return $result; 
		}

		/******** Functions to get delegates information ***********/

		/**
		 * Function will return all the delegates information for current user.
		 */
		function delegateList()
		{
			$delegateProps = $this->getDelegateProps();

			$data = array();

			// get delegate meeting rule
			$delegateMeetingRule = $this->getDelegateMeetingRule();

			// Get permissions of all delegates.
			if(!empty($delegateProps[PR_SCHDINFO_DELEGATE_ENTRYIDS])) {
				for($i = 0, $len = count($delegateProps[PR_SCHDINFO_DELEGATE_ENTRYIDS]); $i < $len; $i++) {
					array_push($data, $this->getDelegatePermissions($delegateProps[PR_SCHDINFO_DELEGATE_ENTRYIDS][$i], $delegateMeetingRule));
				}
			}

			$this->addActionData('list', array('item' => $data));
			$GLOBALS['bus']->addData($this->getResponseData());
		}

		/**
		 * Function will return the permissions assigned for a particular delegate user.
		 * @param {Array} $delegate the delegate information sent by client.
		 */
		function openDelegate($delegate)
		{
			// Get permissions of a delegate.
			$data = $this->getDelegatePermissions(hex2bin($delegate['entryid']));

			$this->addActionData('item', array('item' => $data));
			$GLOBALS['bus']->addData($this->getResponseData());
		}

		/**
		 * Function will return information of a particular delegate from current user's store.
		 * @param {BinEntryid} $userEntryId entryid of the delegate.
		 * @param {Array} $delegateMeetingRule (optional) information of the delegate meeting rule that can be used to check if
		 * current delegate exists in the meeting rule.
		 * @return {Array} delegate information.
		 */
		function getDelegatePermissions($userEntryId, $delegateMeetingRule = false)
		{
			$delegateProps = $this->getDelegateProps();
			$delegateIndex = $this->getDelegateIndex($userEntryId);
			$userinfo = $this->getUserInfo($userEntryId);

			$delegate = array();
			$delegate['entryid'] = bin2hex($userEntryId);

			$delegate['props'] = array();
			$delegate['props']['display_name'] = $userinfo['display_name'];
			$delegate['props']['can_see_private'] = isset($delegateProps[PR_DELEGATES_SEE_PRIVATE][$delegateIndex]) ? ($delegateProps[PR_DELEGATES_SEE_PRIVATE][$delegateIndex] == 1) : false;

			$delegate['props'] = array_merge($delegate['props'], $this->getFolderPermissions($userEntryId));

			return $delegate;
		}

		/**
		 * Function will return folder permissions of a delegate user.
		 * @param {BinEntryid} $userEntryId entryid of the delegate.
		 * @return {Array} folder permissions of a delegate user.
		 */
		function getFolderPermissions($userEntryId)
		{
			$delegateRights = array();
			$store = $this->getDefaultStore();

			foreach($this->getDefaultFolders($store) as $folderName => $folderEntryId) {
				$folder = mapi_msgstore_openentry($store, $folderEntryId);

				// Get all users who has permissions
				$grants = mapi_zarafa_getpermissionrules($folder, ACCESS_TYPE_GRANT);

				// Find current delegate and get permission.
				foreach($grants as $id => $grant) {
					if($GLOBALS["entryid"]->compareABEntryIds(bin2hex($userEntryId), bin2hex($grant['userid']))) {
						$delegateRights['rights_' . $folderName] = $grant['rights'];
					}
				}
			}

			return $delegateRights;
		}

		/**
		 * Function will return properties of meeting rule that is used to send meeting related messages to delegate.
		 * @return {Array} delegate meeting rule information.
		 */
		function getDelegateMeetingRule()
		{
			$inbox = mapi_msgstore_getreceivefolder($this->getDefaultStore());
			$rulesTable = mapi_folder_getrulestable($inbox);
			// get delegate meeting rule
			$restriction = Array(RES_CONTENT,
						Array(
							FUZZYLEVEL => FL_FULLSTRING | FL_IGNORECASE,
							ULPROPTAG => PR_RULE_PROVIDER,
							VALUE => Array(
								PR_RULE_PROVIDER => 'Schedule+ EMS Interface'
							)
						)
			);
			mapi_table_restrict($rulesTable, $restriction);
			// there will be only one rule, so fetch that only
			$delegateMeetingRule = mapi_table_queryrows($rulesTable, $GLOBALS['properties']->getRulesProperties(), 0, 1);
			return !empty($delegateMeetingRule) ? $delegateMeetingRule[0] : false;
		}

		/******** Functions to update delegates information ***********/

		/**
		 * Function which saves delegates information sent from client.
		 * @param {Array} $delegates the delegates information sent by client.
		 */
		function saveDelegates($delegates)
		{
			$responseData = array();

			// @FIXME currently client only sends a single delegate in a request, if we can change that to contain
			// multiple delegates that would be good

			if(is_assoc_array($delegates)) {
				// wrap single delegate in an array
				$delegates = array($delegates);
			}

			for($index = 0, $len = count($delegates); $index < $len; $index++) {
				$delegate = $delegates[$index];
				$this->setFolderPermissions($delegate);
				// set properties for delegates on user's freebusy folder
				array_push($responseData, array('entryid' => $delegate['entryid']));
			}
			$this->setDelegateProps($delegates);
			// set delegate meeting rule
			$this->setDelegateMeetingRule($delegates);

			// send response to indicate success
			if(!empty($responseData)) {
				$this->addActionData('update', array('item' => $responseData));
				$GLOBALS['bus']->addData($this->getResponseData());
			}
		}

		/**
		 * Function will update PR_DELEGATES_SEE_PRIVATE, PR_SCHDINFO_DELEGATE_ENTRYIDS and
		 * PR_SCHDINFO_DELEGATE_NAMES properties in the current user's store.
		 */
		function setDelegateProps($delegates)
		{
			$localFreeBusyMessage = freebusy::getLocalFreeBusyMessage();
			$delegateProps = $this->getDelegateProps($localFreeBusyMessage);
			$len = count($delegates);
			for ($i=0; $i<$len; $i++) {
				$delegate = $delegates[$i];
				$len1 = count($delegateProps[PR_SCHDINFO_DELEGATE_ENTRYIDS]);
				for ($j=0; $j<$len1; $j++) {
					if ($delegateProps[PR_SCHDINFO_DELEGATE_ENTRYIDS][$j] == hex2bin($delegate['entryid'])) {
						break;
					}
				}
				$delegateProps[PR_SCHDINFO_DELEGATE_ENTRYIDS][$j] = hex2bin($delegate['entryid']);
				if (isset($delegate['props']['display_name'])) {
					$delegateProps[PR_SCHDINFO_DELEGATE_NAMES][$j] = $delegate['props']['display_name'];
				} else {
					$addrBook = $GLOBALS['mapisession']->getAddressbook();
					$user = mapi_ab_openentry($addrBook, hex2bin($delegate['entryid']));
					if (empty($user)) {
						$delegateProps[PR_SCHDINFO_DELEGATE_NAMES][$j] = "";
					} else {
						$userProps = mapi_getprops($user, array(PR_SMTP_ADDRESS));
						if (empty($userProps[PR_SMTP_ADDRESS])) {
							$delegateProps[PR_SCHDINFO_DELEGATE_NAMES][$j] = "";
						} else {
							$delegateProps[PR_SCHDINFO_DELEGATE_NAMES][$j] = $userProps[PR_SMTP_ADDRESS];
						}
					}
				}
				if (isset($delegate['props']['can_see_private'])) {
					$delegateProps[PR_DELEGATES_SEE_PRIVATE][$j] = $delegate['props']['can_see_private'];
				} else {
					$delegateProps[PR_DELEGATES_SEE_PRIVATE][$j] = false;
				}
			}
			mapi_setprops($localFreeBusyMessage, $delegateProps);
			mapi_savechanges($localFreeBusyMessage);
			// unset the module variable, so subsequent calls will have the updated value
			unset($this->delegateProps);
		}

		/**
		 * Function will set folder permissions for a delegate user.
		 * @param {Array} $delegate delegate information sent from client.
		 */
		function setFolderPermissions($delegate)
		{
			$store = $this->getDefaultStore();

			// Get all default folders and set permissions.
			foreach($this->getDefaultFolders($store) as $folderName => $folderEntryID) {
				// we need to only modify those permissions which are modified on client
				if(isset($delegate['props']['rights_' . $folderName]) && $delegate['props']['rights_' . $folderName] !== '') {
					$folder = mapi_msgstore_openentry($store, $folderEntryID);

					// Set new permissions.
					$acls = array(
							array(
								'type' => ACCESS_TYPE_GRANT,
								'userid' => hex2bin($delegate['entryid']),
								'rights' => $delegate['props']['rights_' . $folderName],
								'state' => RIGHT_NEW | RIGHT_AUTOUPDATE_DENIED
							)
					);

					mapi_zarafa_setpermissionrules($folder, $acls);
					mapi_savechanges($folder);

					if ($folderName === 'calendar') {
						$freeBusyFolder = freebusy::getLocalFreeBusyFolder($store);

						if(isset($freeBusyFolder)) {
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
		 * @param {Array} $delegates all delegate information
		 */
		function setDelegateMeetingRule($delegates)
		{
			$delegateMeetingRule = $this->getDelegateMeetingRule();
			if (isset($delegateMeetingRule)) {
				$users = $delegateMeetingRule[PR_RULE_ACTIONS][0]['adrlist'];
			} else {
				$users = array();
			}
			// open addressbook to get information of all users
			$addrBook = $GLOBALS['mapisession']->getAddressbook();
			$len = count($delegates);
			for ($i=0; $i<$len; $i++) {
				$delegate = $delegates[$i];
				// get user info, using entryid
				$user = mapi_ab_openentry($addrBook, hex2bin($delegate['entryid']));
				$userProps = mapi_getprops($user, Array(PR_ENTRYID, PR_ADDRTYPE, PR_EMAIL_ADDRESS, PR_DISPLAY_NAME, PR_SEARCH_KEY, PR_SMTP_ADDRESS, PR_OBJECT_TYPE, PR_DISPLAY_TYPE, PR_DISPLAY_TYPE_EX));

				if (is_array($userProps)) {
					// add recipient type prop, to specify type of recipient in mail
					$userProps[PR_RECIPIENT_TYPE] = MAPI_TO;
					$len1 = count($users);
					for ($j=0; $j<$len1; $j++) {
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
				} else {
					$this->modifyDelegateMeetingRule($delegateMeetingRule, $users);
				}
			}
		}

		/**
		 * Function will create a new delegate meeting rule if it is not present in current user's store.
		 * @param {Array} $usersInfo user properties which should be added in PR_RULE_ACTIONS.
		 */
		function createDelegateMeetingRule($usersInfo)
		{
			// create new rule
			$rule = Array();

			// no need to pass rule_id when creating new rule
			$rule[PR_RULE_ACTIONS] = Array(
							Array(
								'action' => OP_DELEGATE,
								// don't set this value it will have no effect, its harcoded to FWD_PRESERVE_SENDER | FWD_DO_NOT_MUNGE_MSG
								'flavor' => 0,
								'flags' => 0,
								'adrlist' => $usersInfo
							)
			);

			$rule[PR_RULE_CONDITION] = Array(RES_AND,
								Array(
									Array(RES_CONTENT,
										Array(
											FUZZYLEVEL => FL_PREFIX,
											ULPROPTAG => PR_MESSAGE_CLASS,
											VALUE => Array(PR_MESSAGE_CLASS => 'IPM.Schedule.Meeting')
										)
									),
									Array(RES_NOT,
										Array(
											Array(RES_EXIST,
												Array(
													ULPROPTAG => PR_DELEGATED_BY_RULE
												)
											)
										)
									),
									Array(RES_OR,
										Array(
											Array(RES_NOT,
												Array(
													Array(RES_EXIST,
														Array(
															ULPROPTAG => PR_SENSITIVITY
														)
													)
												)
											),
											Array(RES_PROPERTY,
												Array(
													RELOP => RELOP_NE,
													ULPROPTAG => PR_SENSITIVITY,
													VALUE => Array(PR_SENSITIVITY => SENSITIVITY_PRIVATE)
												)
											)
										)
									),
								)
			);

			$rule[PR_RULE_NAME] = '';
			$rule[PR_RULE_PROVIDER_DATA] = '';		// 0 byte binary string
			$rule[PR_RULE_STATE] = ST_ENABLED;
			$rule[PR_RULE_LEVEL] = 0;
			$rule[PR_RULE_SEQUENCE] = 0;
			$rule[PR_RULE_PROVIDER] = 'Schedule+ EMS Interface';
			$rule[PR_RULE_USER_FLAGS] = 0;

			$rows = Array(
					0 => Array(
						'rowflags' => ROW_ADD,
						'properties' => $rule
					)
			);
			$inbox = mapi_msgstore_getreceivefolder($this->getDefaultStore());
			mapi_folder_modifyrules($inbox, $rows);
		}

		function modifyDelegateMeetingRule($delegateMeetingRule, $users)
		{
			$inbox = mapi_msgstore_getreceivefolder($this->getDefaultStore());
			if(count($users) > 0) {
				// update the adrlist in the rule
				$delegateMeetingRule[PR_RULE_ACTIONS][0]['adrlist'] = $users;

				$rows = Array(
						Array(
							'rowflags' => ROW_MODIFY,
							'properties' => $delegateMeetingRule
						)
				);
				
			} else {
				// no users remaining in the rule so delete the rule
				$rows = Array(
						0 => Array(
							'rowflags' => ROW_REMOVE,
							'properties' => $delegateMeetingRule
						)
				);
			}
			mapi_folder_modifyrules($inbox, $rows);
		}

		/******** Functions to delete delegates information ***********/

		/**
		 * Function which deletes delegates information sent by client.
		 * @param {Array} $delegates delegates information sent by client
		 */
		function deleteDelegates($delegates)
		{
			if (is_assoc_array($delegates)) {
				// wrap single delegate in an array
				$delegates = array($delegates);
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
		 * Function will delete values from PR_DELEGATES_SEE_PRIVATE, PR_SCHDINFO_DELEGATE_ENTRYIDS and PR_SCHDINFO_DELEGATE_NAMES and save the properties back if its not empty.
		 * @param {Array} $delegate delegate information sent from client.
		 */
		function deleteDelegateProps($delegate)
		{
			$localFreeBusyMessage = freebusy::getLocalFreeBusyMessage();
			$delegateProps = $this->getDelegateProps($localFreeBusyMessage);
			$delegateIndex = -1;
			$len = count($delegateProps[PR_SCHDINFO_DELEGATE_ENTRYIDS]);
			for ($i=0; $i<$len; $i++) {
				if ($delegateProps[PR_SCHDINFO_DELEGATE_ENTRYIDS][$i] == hex2bin($delegate["entryid"])) {
					$delegateIndex = $i;
					break;	
				}
			}
			if (-1 == $delegateIndex) {
				return;
			}
			unset($delegateProps[PR_DELEGATES_SEE_PRIVATE][$delegateIndex]);
			unset($delegateProps[PR_SCHDINFO_DELEGATE_ENTRYIDS][$delegateIndex]);
			unset($delegateProps[PR_SCHDINFO_DELEGATE_NAMES][$delegateIndex]);

			// unset will remove the value but will not regenerate array keys, so we need to
			// do it here
			$delegateProps[PR_DELEGATES_SEE_PRIVATE] = array_values($delegateProps[PR_DELEGATES_SEE_PRIVATE]);
			$delegateProps[PR_SCHDINFO_DELEGATE_ENTRYIDS] = array_values($delegateProps[PR_SCHDINFO_DELEGATE_ENTRYIDS]);
			$delegateProps[PR_SCHDINFO_DELEGATE_NAMES] = array_values($delegateProps[PR_SCHDINFO_DELEGATE_NAMES]);

			if(!empty($delegateProps[PR_SCHDINFO_DELEGATE_ENTRYIDS])) {
				mapi_setprops($localFreeBusyMessage, $delegateProps);
			} else {
				// Delete delegate properties.
				mapi_deleteprops($localFreeBusyMessage, array(PR_DELEGATES_SEE_PRIVATE, PR_SCHDINFO_DELEGATE_ENTRYIDS, PR_SCHDINFO_DELEGATE_NAMES));
			}

			mapi_savechanges($localFreeBusyMessage);

			// unset the module variable, so subsequent calls will have the updated value
			unset($this->delegateProps);
		}

		/**
		 * Function which deletes permissions from all default folder for a particular delegate.
		 * @param {Array} $delegate delegate's information sent by client.
		 */
		function deleteFolderPermissions($delegate)
		{
			$store = $this->getDefaultStore();

			// Get all default folders and set permissions.
			foreach($this->getDefaultFolders($store) as $folderName => $folderEntryID) {
				$folder = mapi_msgstore_openentry($store, $folderEntryID);

				// delete current acl's
				$acls = array(
						array(
							'type' => ACCESS_TYPE_GRANT,
							'userid' => hex2bin($delegate['entryid']),
							'rights' => ecRightsNone,
							'state' => RIGHT_DELETED | RIGHT_AUTOUPDATE_DENIED
						)
				);

				mapi_zarafa_setpermissionrules($folder, $acls);

				if ($folderName === 'calendar') {
					$freeBusyFolder = freebusy::getLocalFreeBusyFolder($store);

					if(isset($freeBusyFolder)) {
						mapi_zarafa_setpermissionrules($freeBusyFolder, $acls);
						mapi_savechanges($freeBusyFolder);
					}
				}

				mapi_savechanges($folder);
			}
		}

		/**
		 * Function will remove delegates from delegate meeting rule when the user is deleted from delegate list.
		* @param {Array} $delegates all delegate information that are deleted
		 */
		function removeDelegatesFromDelegateMeetingRule($delegates)
		{
			$delegateMeetingRule = $this->getDelegateMeetingRule();
			if ($delegateMeetingRule === false) {
				// no delegate rule exists, nothing to do
				return;
			}
			$len = count($delegates);
			$old_users = $delegateMeetingRule[PR_RULE_ACTIONS][0]['adrlist'];
			$new_users = array();
			foreach ($old_users as $user) {
				for($index=0; $index<$len; $index++) {
					if ($user[PR_ENTRYID] == hex2bin($delegates[$index]['entryid'])) {
						break;
					}
				}
				if ($index == $len) {
					$new_users[] = $user;
				}
			}
			$this->modifyDelegateMeetingRule($delegateMeetingRule, $new_users);
		}

		/******** Functions for exception handling ***********/

		/**
		 * Function does customization of MAPIException based on module data.
		 * like, here it will generate display message based on actionType
		 * for particular exception.
		 * 
		 * @param object $e Exception object
		 * @param string $actionType the action type, sent by the client
		 * @param MAPIobject $store Store object of the current user.
		 * @param string $parententryid parent entryid of the message.
		 * @param string $entryid entryid of the message/folder.
		 * @param array $action the action data, sent by the client
		 */
		function handleException(&$e, $actionType = null, $store = null, $parententryid = null, $entryid = null, $action = null)
		{
			switch($actionType) {
				case 'save':
					$e->setDisplayMessage(Language::getstring('Could not save delegate information.'));
					break;
				case 'delete':
					$e->setDisplayMessage(Language::getstring('Could not delete delegate.'));
					break;
				case 'list':
					$e->setDisplayMessage(Language::getstring('Can not get list of delegates.'));
					break;
			}

			parent::handleException($e, $actionType, $store, $parententryid, $entryid, $action);
		}
	}
?>
