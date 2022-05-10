<?php

require_once(BASE_PATH . 'server/includes/core/class.encryptionstore.php');
require_once('zpushprops.php');

/**
 * PluginMDMModule Module
 */
class PluginMDMModule extends Module
{

	// content data
	const FOLDERUUID = 1;
	const FOLDERTYPE = 2;
	const FOLDERBACKENDID = 5;

	/**
	 * Constructor
	 * @param int $id unique id.
	 * @param array $data list of all actions.
	 */
	function __construct($id, $data)
	{
		parent::__construct($id, $data);
		$this->stateFolder = null;
		$this->deviceStates = [];
		$this->devices = [];
		$this->setupDevices();
	}

	/**
	 * Function sets up the array with the user's devices.
	 */
	function setupDevices()
	{
		$devices = [];
		$stateFolder = $this->getStoreStateFolder();
		if ($stateFolder) {
			$store = $GLOBALS["mapisession"]->getDefaultMessageStore();
			$username = $GLOBALS["mapisession"]->getUserName();
			$hierarchyTable = mapi_folder_gethierarchytable($stateFolder, CONVENIENT_DEPTH | MAPI_DEFERRED_ERRORS);
			$rows = mapi_table_queryallrows($hierarchyTable, [PR_ENTRYID, PR_DISPLAY_NAME]);
			foreach($rows as $row) {
				$deviceStateFolder = mapi_msgstore_openentry($store, $row[PR_ENTRYID]);
				if (mapi_last_hresult() == 0) {
					$this->deviceStates[$row[PR_DISPLAY_NAME]] = $deviceStateFolder;

					$deviceStateFolderContents = mapi_folder_getcontentstable($deviceStateFolder, MAPI_ASSOCIATED);
					$restriction = $this->getStateMessageRestriction("devicedata");
					mapi_table_restrict($deviceStateFolderContents, $restriction);
					if (mapi_table_getrowcount($deviceStateFolderContents) == 1) {
						$rows = mapi_table_queryrows($deviceStateFolderContents, [PR_ENTRYID], 0, 1);
						$message = mapi_msgstore_openentry($store, $rows[0][PR_ENTRYID]);
						$state = base64_decode(streamProperty($message, PR_BODY));
						$unserializedState = json_decode($state);
						// fallback for "old-style" states
						if (isset($unserializedState->data->devices)) {
							$devices[$unserializedState->data->devices->$username->data->deviceid] = $unserializedState->data->devices->$username->data;
						}
						else {
							$devices[$unserializedState->data->deviceid] = $unserializedState->data;
						}
					}
				}
			}
		}
		$this->devices = $devices;
	}

	/**
	 * Function which triggers full resync of a device.
	 * @param string $deviceid of phone which has to be resynced
	 * @return json $response object contains the response of the soap request from grommunio-sync
	 */
	function resyncDevice($deviceid)
	{
		$deviceStateFolder = $this->deviceStates[$deviceid];
		if ($deviceStateFolder) {
			try {
				// get the device data message and empty the folder contents
				// create a new message in the folder and copy the device data message to it
				// preventing the devicedata removal for resync
				$deviceStateFolderContents = mapi_folder_getcontentstable($deviceStateFolder, MAPI_ASSOCIATED);
				$restriction = $this->getStateMessageRestriction("devicedata");
				mapi_table_restrict($deviceStateFolderContents, $restriction);
				if (mapi_table_getrowcount($deviceStateFolderContents) == 1) {
					$rows = mapi_table_queryrows($deviceStateFolderContents, [PR_ENTRYID], 0, 1);
					$store = $GLOBALS["mapisession"]->getDefaultMessageStore();
					$message = mapi_msgstore_openentry($store, $rows[0][PR_ENTRYID]);
					mapi_folder_emptyfolder($deviceStateFolder, DEL_ASSOCIATED);

					$devicedata = mapi_folder_createmessage($deviceStateFolder, MAPI_ASSOCIATED);
					mapi_copyto($message, array(), array(), $devicedata);
					mapi_setprops($devicedata, [PR_MESSAGE_CLASS => 'IPM.Note.GrommunioState']);
					mapi_savechanges($devicedata);
					return true;
				}
			}
			catch(Exception $e) {
				error_log(sprintf("mdm plugin resyncDevice Exception: %s", $e));
				return false;
			}
		}
		error_log(sprintf("mdm plugin resyncDevice device state folder %s", $deviceStateFolder));
		return false;
	}

	/**
	 * Function which triggers remote wipe of a device.
	 * @param string $deviceid of phone which has to be wiped
	 * @param string $password user password
	 * @return json $response object contains the response of the soap request from grommunio-sync
	 */
	function wipeDevice($deviceid, $password)
	{
		$opts = ['http' =>
			[
				'method' => 'POST',
				'header' => 'Content-Type: application/json',
				'ignore_errors' => true,
				'content' => json_encode(
					[
						'password' => $password,
						'remoteIP' => '[::1]',
						'status' => SYNC_PROVISION_RWSTATUS_PENDING,
						'time' => time()
					]
				)
			]
		];
		$ret = file_get_contents(PLUGIN_MDM_ADMIN_API_WIPE_ENDPOINT . $GLOBALS["mapisession"]->getUserName() ."?devices=". $deviceid, false, stream_context_create($opts));
		return $ret;
	}

	/**
	 * Function which triggers removal of a device.
	 * @param string $deviceid of phone which has to be wiped
	 * @param string $password user password
	 * @return json $response object contains the response of the soap request from grommunio-sync
	 */
	function removeDevice($deviceid, $password)
	{
		// TODO remove the device from device / user list
		$deviceStateFolder = $this->deviceStates[$deviceid];
		$stateFolder = $this->getStoreStateFolder();
		if ($stateFolder && $deviceStateFolder) {
			$props = mapi_getprops($deviceStateFolder, [PR_ENTRYID]);
			try {
				mapi_folder_deletefolder($stateFolder, $props[PR_ENTRYID], DEL_MESSAGES);
				$opts = ['http' =>
					[
						'method' => 'POST',
						'header' => 'Content-Type: application/json',
						'ignore_errors' => true,
						'content' => json_encode(
							[
								'password' => $password,
								'remoteIP' => '[::1]',
								'status' => SYNC_PROVISION_RWSTATUS_NA,
								'time' => time()
							]
						)
					]
				];
				$ret = file_get_contents(PLUGIN_MDM_ADMIN_API_WIPE_ENDPOINT . $GLOBALS["mapisession"]->getUserName() ."?devices=". $deviceid, false, stream_context_create($opts));
				return $ret;
			}
			catch(Exception $e) {
				error_log(sprintf("mdm plugin removeDevice Exception: %s", $e));
				return false;
			}
		}
		error_log(sprintf("mdm plugin removeDevice state folder %s device state folder %s",
			$stateFolder, $deviceStateFolder));
		return false;
	}


	/**
	 * Function to get details of the given device.
	 * @param string $deviceid id of device.
	 * @return array contains device props.
	 */
		function getDeviceDetails($deviceid)
		{
			$device = [];
			$device['props'] = $this->getDeviceProps($this->devices[$deviceid]);
			$device['sharedfolders'] = ['item' => $this->getAdditionalFolderList($deviceid)];
			return $device;
		}

	/**
	 * Executes all the actions in the $data variable.
	 * @return boolean true on success of false on fialure.
	 */
	function execute()
	{
		foreach($this->data as $actionType => $actionData)
		{
			if(isset($actionType)) {
				try {
					switch($actionType)
					{
						case 'wipe':
							$this->wipeDevice($actionData['deviceid'], $actionData['password']);
							$this->addActionData('wipe', array(
								'type' => 3,
								'wipe' => $this->wipeDevice($actionData['deviceid'], $actionData['password'])
							));
							$GLOBALS['bus']->addData($this->getResponseData());
							break;
						case 'resync':
							$this->addActionData('resync', array(
								'type' => 3,
								'resync' => $this->resyncDevice($actionData['deviceid'])
							));
							$GLOBALS['bus']->addData($this->getResponseData());
							break;
						case 'remove':
							$this->addActionData('remove', array(
								'type' => 3,
								'remove' => $this->removeDevice($actionData['deviceid'], $actionData['password'])
							));
							$GLOBALS['bus']->addData($this->getResponseData());
							break;
						case 'list':
							$items = array();
							$data['page'] = array();

							foreach($this->devices as $device) {
								array_push($items, array('props' => $this->getDeviceProps($device)));
							}
							$data['page']['start'] = 0;
							$data['page']['rowcount'] = count($this->devices);
							$data['page']['totalrowcount'] = $data['page']['rowcount'];
							$data = array_merge($data, array('item' => $items));
							$this->addActionData('list', $data);
							$GLOBALS['bus']->addData($this->getResponseData());
							break;
						case 'open':
							$device = $this->getDeviceDetails($actionData["entryid"]);
							$item = array("item" => $device);
							$this->addActionData('item', $item);
							$GLOBALS['bus']->addData($this->getResponseData());
							break;
						case 'save':
							$this ->saveDevice($actionData);
							$device = $this->getDeviceDetails($actionData["entryid"]);
							$item = array("item" => $device);
							$this->addActionData('update', $item);
							$GLOBALS['bus']->addData($this->getResponseData());
							break;
						default:
							$this->handleUnknownActionType($actionType);
					}
				}
				catch (Exception $e) {
					$title = _('Mobile device management plugin');
					$display_message = sprintf(_('Unexpected error occurred. Please contact your system administrator. Error code: %s'), $e->getMessage());
					$this->sendFeedback(true, array("type" => ERROR_GENERAL, "info" => array('title' => $title, 'display_message' => $display_message)));
				}
			}
		}
 	}

	/**
	 * Function which is use to get device properties.
	 *
	 * @param object $device array of device properties
	 * @return array
	 */
	function getDeviceProps($device)
	{
		$item = array();
		$propsList = ['devicetype', 'deviceos', 'devicefriendlyname', 'useragent', 'asversion', 'firstsynctime',
			'lastsynctime', 'lastupdatetime', 'policyname'];

		$item['entryid'] = $device->deviceid;
		$item['message_class'] = "IPM.MDM";
		foreach ($propsList as $prop) {
			if (isset($device->$prop)) {
				$item[$prop] = $device->$prop;
			}
		}
		$item['wipestatus'] = $this->getProvisioningWipeStatus($device->deviceid);

		$item = array_merge($item, $this->getSyncFoldersProps($device));
		return $item;
	}

	/**
	 * Function which is use to gather some statistics about synchronized folders.
	 * @param array $device array of device props
	 * @return array $syncFoldersProps has list of properties related to synchronized folders
	 */
	function getSyncFoldersProps($device)
	{
		$synchedFolderTypes = [];
		$synchronizedFolders = 0;

		foreach ($device->contentdata as $folderid => $folderdata) {
			if (isset($folderdata->{self::FOLDERUUID})) {
				$type = $folderdata->{self::FOLDERTYPE};

				$folderType = $this->getSyncFolderType($type);
				if (isset($synchedFolderTypes[$folderType])) {
					$synchedFolderTypes[$folderType]++;
				} else {
					$synchedFolderTypes[$folderType] = 1;
				}
			}
		}
		$syncFoldersProps = [];
		foreach ($synchedFolderTypes as $key => $value) {
			$synchronizedFolders += $value;
			$syncFoldersProps[strtolower($key) . 'folder'] = $value;
		}
		/*
		TODO getAdditionalFolderList
		$client = $this->getSoapClient();
		$items = $client->AdditionalFolderList($device['deviceid']);
		$syncFoldersProps['sharedfolders'] = count($items);
		$syncFoldersProps["shortfolderids"] = $device['hasfolderidmapping'] ? _("Yes") : _("No");
		$syncFoldersProps['synchronizedfolders'] = $synchronizedFolders + count($items);
		*/
		$syncFoldersProps['synchronizedfolders'] = $synchronizedFolders;

		return $syncFoldersProps;
	}


	/**
	 * Function which is use to get general type like Mail,Calendar,Contacts,etc. from folder type.
	 * @param int $type foldertype for a folder already known to the mobile
	 * @param string $name folder name
	 * @return string general folder type
	 */
	function getSyncFolderType($type)
	{
		switch ($type) {
			case SYNC_FOLDER_TYPE_APPOINTMENT:
			case SYNC_FOLDER_TYPE_USER_APPOINTMENT:
					$folderType = "Calendars";
				break;
			case SYNC_FOLDER_TYPE_CONTACT:
			case SYNC_FOLDER_TYPE_USER_CONTACT:
				$folderType = "Contacts";
				break;
			case SYNC_FOLDER_TYPE_TASK:
			case SYNC_FOLDER_TYPE_USER_TASK:
				$folderType = "Tasks";
				break;
			case SYNC_FOLDER_TYPE_NOTE:
			case SYNC_FOLDER_TYPE_USER_NOTE:
				$folderType = "Notes";
				break;
			default:
				$folderType = "Emails";
				break;
		}
		return $folderType;
	}

	/**
	 * Function which is use to get list of additional folders which was shared with given device
	 * @param string $devid device id
	 * @return array has list of properties related to shared folders
	 */
	function getAdditionalFolderList($devid)
	{
		return [];
		// TODO implement
		$stores = $GLOBALS["mapisession"]->getAllMessageStores();
		$client = $this->getSoapClient();
		$items = $client->AdditionalFolderList($devid);
		$data = array();
		foreach ($items as $item)
		{
			foreach ($stores as $store)
			{
				try {
					$entryid = mapi_msgstore_entryidfromsourcekey($store, hex2bin($item->folderid));
				} catch (MAPIException $me) {
					continue;
				}
			}
			if (isset($entryid)) {
				$item->entryid = bin2hex($entryid);
			}
			array_push($data, array("props" => $item));
		}
		return $data;
	}

	/**
	 * Function which is use to remove additional folder which was shared with given device.
	 * @param string $entryId id of device.
	 * @param string $folderid id of folder which will remove from device.
	 */
	function additionalFolderRemove($entryId, $folderid)
	{
		$client = $this->getSoapClient();
		$client->AdditionalFolderRemove($entryId, $folderid);
	}

	/**
	 * Function which is use to add additional folder which will share with given device.
	 * @param string $entryId id of device.
	 * @param array $folder folder which will share with device.
	 */
	function additionalFolderAdd($entryId, $folder)
	{
		$client = $this->getSoapClient();
		$containerClass = isset($folder[PR_CONTAINER_CLASS]) ? $folder[PR_CONTAINER_CLASS] : "IPF.Note";
		$folderId = bin2hex($folder[PR_SOURCE_KEY]);
		$userName = $folder["user"];
		$folderName = $userName === "SYSTEM" ? $folder[PR_DISPLAY_NAME] : $folder[PR_DISPLAY_NAME]." - ".$userName;
		$folderType = $this->getFolderTypeFromContainerClass($containerClass);
		$client->AdditionalFolderAdd($entryId, $userName, $folderId, $folderName, $folderType, FLD_FLAGS_REPLYASUSER);
	}

		/**
	 * Function which use to save the device.
	 * It will use to add or remove folders in the device.
		 * @param array $data array of added and removed folders.
		 */
	function saveDevice($data)
	{
		$entryid = $data["entryid"];
		if (isset($data['sharedfolders'])) {
				if (isset($data['sharedfolders']['remove'])) {
						$deletedFolders = $data['sharedfolders']['remove'];
						foreach ($deletedFolders as $folder) {
								$this->additionalFolderRemove($entryid, $folder["folderid"]);
						}
				}
				if (isset($data['sharedfolders']['add'])) {
						$addFolders = $data['sharedfolders']['add'];
						$hierarchyFolders = $this->getHierarchyList();
						foreach ($addFolders as $folder) {
								foreach ($hierarchyFolders as $hierarchyFolder) {
										$folderEntryid = bin2hex($hierarchyFolder[PR_ENTRYID]);
										if ($folderEntryid === $folder["entryid"]) {
												$this->additionalFolderAdd($entryid, $hierarchyFolder);
												continue 2;
										}
								}
						}
				}
			}
		}

	/**
	 * Gets the hierarchy list of all required stores.
	 * Function which is use to get the hierarchy list with PR_SOURCE_KEY.
	 * @return array the array of all hierarchy folders.
	 */
	function getHierarchyList()
	{
		$storeList = $GLOBALS["mapisession"]->getAllMessageStores();
		$properties = $GLOBALS["properties"]->getFolderListProperties();
		$otherUsers = $GLOBALS["mapisession"]->retrieveOtherUsersFromSettings();
		$properties["source_key"] = PR_SOURCE_KEY;
		$openWholeStore = true;
		$storeData = array();

		foreach ($storeList as $store) {
			$msgstore_props = mapi_getprops($store, array(PR_MDB_PROVIDER, PR_ENTRYID, PR_IPM_SUBTREE_ENTRYID, PR_USER_NAME));
			$storeType = $msgstore_props[PR_MDB_PROVIDER];

			if ($storeType == ZARAFA_SERVICE_GUID) {
				continue;
			} else if ($storeType == ZARAFA_STORE_DELEGATE_GUID) {
				$storeUserName = $GLOBALS["mapisession"]->getUserNameOfStore($msgstore_props[PR_ENTRYID]);
			} else if ($storeType == ZARAFA_STORE_PUBLIC_GUID) {
				$storeUserName = "SYSTEM";
			} else {
				$storeUserName = $msgstore_props[PR_USER_NAME];
			}

			if (is_array($otherUsers)) {
				if (isset($otherUsers[$storeUserName])) {
					$sharedFolders = $otherUsers[$storeUserName];
					if (!isset($otherUsers[$storeUserName]['all'])) {
						$openWholeStore = false;
						$a = $this->getSharedFolderList($store, $sharedFolders, $properties, $storeUserName);
						$storeData = array_merge($storeData, $a);
					}
				}
			}

			if ($openWholeStore) {
				if (isset($msgstore_props[PR_IPM_SUBTREE_ENTRYID])) {
					$subtreeFolderEntryID = $msgstore_props[PR_IPM_SUBTREE_ENTRYID];
					try {
						$subtreeFolder = mapi_msgstore_openentry($store, $subtreeFolderEntryID);
					} catch (MAPIException $e) {
						// We've handled the event
						$e->setHandled();
					}

					if ($storeType != ZARAFA_STORE_PUBLIC_GUID) {
						$this->getSubFolders($subtreeFolder, $store, $properties, $storeData, $storeUserName);
					} else {
						$this->getSubFoldersPublic($subtreeFolder, $store, $properties, $storeData, $storeUserName);
					}
				}
			}
		}

		return $storeData;
	}

	/**
	 * Helper function to get the shared folder list.
	 * @param object $store Message Store Object.
	 * @param object $sharedFolders Mapi Folder Object.
	 * @param array $properties MAPI property mappings for folders.
	 * @param string $storeUserName owner name of store.
	 * @return array shared folders list.
	 */
	function getSharedFolderList($store, $sharedFolders, $properties, $storeUserName)
	{
		$msgstore_props = mapi_getprops($store, array(PR_ENTRYID, PR_DISPLAY_NAME, PR_IPM_SUBTREE_ENTRYID, PR_IPM_OUTBOX_ENTRYID, PR_IPM_SENTMAIL_ENTRYID, PR_IPM_WASTEBASKET_ENTRYID, PR_MDB_PROVIDER, PR_IPM_PUBLIC_FOLDERS_ENTRYID, PR_IPM_FAVORITES_ENTRYID, PR_OBJECT_TYPE, PR_STORE_SUPPORT_MASK, PR_MAILBOX_OWNER_ENTRYID, PR_MAILBOX_OWNER_NAME, PR_USER_ENTRYID, PR_USER_NAME, PR_QUOTA_WARNING_THRESHOLD, PR_QUOTA_SEND_THRESHOLD, PR_QUOTA_RECEIVE_THRESHOLD, PR_MESSAGE_SIZE_EXTENDED, PR_MAPPING_SIGNATURE, PR_COMMON_VIEWS_ENTRYID, PR_FINDER_ENTRYID));
		$storeData = array();
		$folders = array();
		try {
			$inbox = mapi_msgstore_getreceivefolder($store);
			$inboxProps = mapi_getprops($inbox, array(PR_ENTRYID));
		} catch (MAPIException $e) {
			// don't propagate this error to parent handlers, if store doesn't support it
			if ($e->getCode() === MAPI_E_NO_SUPPORT) {
				$e->setHandled();
			}
		}

		$root = mapi_msgstore_openentry($store, null);
		$rootProps = mapi_getprops($root, array(PR_IPM_APPOINTMENT_ENTRYID, PR_IPM_CONTACT_ENTRYID, PR_IPM_DRAFTS_ENTRYID, PR_IPM_JOURNAL_ENTRYID, PR_IPM_NOTE_ENTRYID, PR_IPM_TASK_ENTRYID, PR_ADDITIONAL_REN_ENTRYIDS));

		$additional_ren_entryids = array();
		if (isset($rootProps[PR_ADDITIONAL_REN_ENTRYIDS])) {
			$additional_ren_entryids = $rootProps[PR_ADDITIONAL_REN_ENTRYIDS];
		}

		$defaultfolders = array(
			"default_folder_inbox" => array("inbox" => PR_ENTRYID),
			"default_folder_outbox" => array("store" => PR_IPM_OUTBOX_ENTRYID),
			"default_folder_sent" => array("store" => PR_IPM_SENTMAIL_ENTRYID),
			"default_folder_wastebasket" => array("store" => PR_IPM_WASTEBASKET_ENTRYID),
			"default_folder_favorites" => array("store" => PR_IPM_FAVORITES_ENTRYID),
			"default_folder_publicfolders" => array("store" => PR_IPM_PUBLIC_FOLDERS_ENTRYID),
			"default_folder_calendar" => array("root" => PR_IPM_APPOINTMENT_ENTRYID),
			"default_folder_contact" => array("root" => PR_IPM_CONTACT_ENTRYID),
			"default_folder_drafts" => array("root" => PR_IPM_DRAFTS_ENTRYID),
			"default_folder_journal" => array("root" => PR_IPM_JOURNAL_ENTRYID),
			"default_folder_note" => array("root" => PR_IPM_NOTE_ENTRYID),
			"default_folder_task" => array("root" => PR_IPM_TASK_ENTRYID),
			"default_folder_junk" => array("additional" => 4),
			"default_folder_syncissues" => array("additional" => 1),
			"default_folder_conflicts" => array("additional" => 0),
			"default_folder_localfailures" => array("additional" => 2),
			"default_folder_serverfailures" => array("additional" => 3),
		);

		foreach ($defaultfolders as $key => $prop) {
			$tag = reset($prop);
			$from = key($prop);
			switch ($from) {
				case "inbox":
					if (isset($inboxProps[$tag])) {
						$storeData["props"][$key] = bin2hex($inboxProps[$tag]);
					}
					break;
				case "store":
					if (isset($msgstore_props[$tag])) {
						$storeData["props"][$key] = bin2hex($msgstore_props[$tag]);
					}
					break;
				case "root":
					if (isset($rootProps[$tag])) {
						$storeData["props"][$key] = bin2hex($rootProps[$tag]);
					}
					break;
				case "additional":
					if (isset($additional_ren_entryids[$tag])) {
						$storeData["props"][$key] = bin2hex($additional_ren_entryids[$tag]);
					}
					break;
			}
		}

		$store_access = true;
		$openSubFolders = false;
		foreach ($sharedFolders as $type => $sharedFolder) {
			$openSubFolders = ($sharedFolder["show_subfolders"] == true);
			$folderEntryID = hex2bin($storeData["props"]["default_folder_" . $sharedFolder["folder_type"]]);
			try {
				// load folder props
				$folder = mapi_msgstore_openentry($store, $folderEntryID);
			} catch (MAPIException $e) {
				// Indicate that we don't have access to the store,
				// so no more attempts to read properties or open entries.
				$store_access = false;

				// We've handled the event
				$e->setHandled();
			}
		}

		if ($store_access === true) {
			$folderProps = mapi_getprops($folder, $properties);
			$folderProps["user"] = $storeUserName;
			array_push($folders, $folderProps);

			//If folder has sub folders then add its.
			if ($openSubFolders === true) {
				if ($folderProps[PR_SUBFOLDERS] != false) {
					$subFoldersData = array();
					$this->getSubFolders($folder, $store, $properties, $subFoldersData, $storeUserName);
					$folders =array_merge($folders, $subFoldersData);
				}
			}
		}
		return $folders;
	}


	/**
	 * Helper function to get the sub folders of a given folder.
	 *
	 * @access private
	 * @param object $folder Mapi Folder Object.
	 * @param object $store Message Store Object
	 * @param array $properties MAPI property mappings for folders
	 * @param array $storeData Reference to an array. The folder properties are added to this array.
	 * @param string $storeUserName owner name of store.
	 */
	function getSubFolders($folder, $store, $properties, &$storeData, $storeUserName)
	{
		/**
		 * remove hidden folders, folders with PR_ATTR_HIDDEN property set
		 * should not be shown to the client
		 */
		$restriction = Array(RES_OR, Array(
			Array(RES_PROPERTY,
				Array(
					RELOP => RELOP_EQ,
					ULPROPTAG => PR_ATTR_HIDDEN,
					VALUE => Array(PR_ATTR_HIDDEN => false)
				)
			),
			Array(RES_NOT,
				Array(
					Array(RES_EXIST,
						Array(
							ULPROPTAG => PR_ATTR_HIDDEN
						)
					)
				)
			)
		));


		$expand = Array(
			Array(
				'folder' => $folder,
				'props' => mapi_getprops($folder, Array(PR_ENTRYID, PR_SUBFOLDERS))
			)
		);

		// Start looping through the $expand array, during each loop we grab the first item in
		// the array and obtain the hierarchy table for that particular folder. If one of those
		// subfolders has subfolders of its own, it will be appended to $expand again to ensure
		// it will be expanded later.
		while (!empty($expand)) {
			$item = array_shift($expand);
			$columns = $properties;

			$hierarchyTable = mapi_folder_gethierarchytable($item['folder'], MAPI_DEFERRED_ERRORS);
			mapi_table_restrict($hierarchyTable, $restriction, TBL_BATCH);

			mapi_table_setcolumns($hierarchyTable, $columns);
			$columns = null;

			// Load the hierarchy in small batches
			$batchcount = 100;
			do {
				$rows = mapi_table_queryrows($hierarchyTable, $columns, 0, $batchcount);

				foreach ($rows as $subfolder) {

					// If the subfolders has subfolders of its own, append the folder
					// to the $expand array, so it can be expanded in the next loop.
					if ($subfolder[PR_SUBFOLDERS]) {
						$folderObject = mapi_msgstore_openentry($store, $subfolder[PR_ENTRYID]);
						array_push($expand, array('folder' => $folderObject, 'props' => $subfolder));
					}
					$subfolder["user"] = $storeUserName;
					// Add the folder to the return list.
					array_push($storeData, $subfolder);
				}

				// When the server returned a different number of rows then was requested,
				// we have reached the end of the table and we should exit the loop.
			} while (count($rows) === $batchcount);

		}
	}

	/**
	 * Helper function to get the subfolders of a Public Store
	 *
	 * @access private
	 * @param object $folder Mapi Folder Object.
	 * @param object $store Message Store Object
	 * @param array $properties MAPI property mappings for folders
	 * @param array $storeData Reference to an array. The folder properties are added to this array.
	 * @param string $storeUserName owner name of store.
	 */
	function getSubFoldersPublic($folder, $store, $properties, &$storeData, $storeUserName)
	{
		$expand = Array(
			Array(
				'folder' => $folder,
				'props' => mapi_getprops($folder, Array(PR_ENTRYID, PR_SUBFOLDERS))
			)
		);

		/**
		 * remove hidden folders, folders with PR_ATTR_HIDDEN property set
		 * should not be shown to the client
		 */
		$restriction =	Array(RES_OR, Array(
			Array(RES_PROPERTY,
				Array(
					RELOP => RELOP_EQ,
					ULPROPTAG => PR_ATTR_HIDDEN,
					VALUE => Array( PR_ATTR_HIDDEN => false )
				)
			),
			Array(RES_NOT,
				Array(
					Array(RES_EXIST,
						Array(
							ULPROPTAG => PR_ATTR_HIDDEN
						)
					)
				)
			)
		));

		// CONVENIENT_DEPTH doesn't work on the IPM_SUBTREE, hence we will be recursively
		// walking through the hierarchy. However, we have some special folders like the
		// "Favorites" and "Public Folders" from where we can switch to using
		// CONVENIENT_DEPTH. Obtain these special cases here.
		$specialEntryids = mapi_getprops($store, array(
			PR_IPM_FAVORITES_ENTRYID,
			PR_IPM_PUBLIC_FOLDERS_ENTRYID
		));

		// Start looping through the $expand array, during each loop we grab the first item in
		// the array and obtain the hierarchy table for that particular folder. If one of those
		// subfolders has subfolders of its own, it will be appended to $expand again to ensure
		// it will be expanded later.
		while (!empty($expand)) {
			$item = array_shift($expand);
			$columns = $properties;
			$hierarchyTable = mapi_folder_gethierarchytable($item['folder'], MAPI_DEFERRED_ERRORS);

			mapi_table_restrict($hierarchyTable, $restriction, TBL_BATCH);

			mapi_table_setcolumns($hierarchyTable, $columns);
			$columns = null;

			// Load the hierarchy in small batches
			$batchcount = 100;
			do {
				$rows = mapi_table_queryrows($hierarchyTable, $columns, 0, $batchcount);

				foreach($rows as $subfolder) {
					$specialFolder = false;

					// Check if this folder is special...
					if (!empty($specialEntryids)) {
						foreach ($specialEntryids as $key => $value) {
							// No need to do compareEntryId(), the special folders have static
							// entryids, and can be compared using ===.
							if (bin2hex($subfolder[PR_ENTRYID]) === bin2hex($value)) {
								$specialFolder = mapi_msgstore_openentry($store, $subfolder[PR_ENTRYID]);
								$subfolder = mapi_getprops($specialFolder, $properties);

								// We found the folder, no need to loop over it next time.
								unset($specialEntryids[$key]);
								break;
							}
						}
					}

					// If the subfolders has subfolders of its own, append the folder
					// to the $expand array, so it can be expanded in the next loop.
					if ($subfolder[PR_SUBFOLDERS]) {
						if ($specialFolder) {
							// Special folders can be redirected again to getSubFolders(),
							$this->getSubFolders($specialFolder, $store, $properties, $storeData, $storeUserName);
						} else {
							$folderObject = mapi_msgstore_openentry($store, $subfolder[PR_ENTRYID]);
							array_push($expand, array('folder' => $folderObject, 'props' => $subfolder));
						}
					}

					$subfolder["user"] = $storeUserName;
					// Add the folder to the return list.
					array_push($storeData, $subfolder);
				}

				// When the server returned a different number of rows then was requested,
				// we have reached the end of the table and we should exit the loop.
			} while (count($rows) === $batchcount);
		}
	}

	/**
	 * Function which is use get folder types from the container class
	 * @param string $containerClass container class of folder
	 * @return int folder type
	 */
	function getFolderTypeFromContainerClass($containerClass)
	{
		switch ($containerClass) {
			case	"IPF.Note":
				return SYNC_FOLDER_TYPE_USER_MAIL;
			case "IPF.Appointment":
				return SYNC_FOLDER_TYPE_USER_APPOINTMENT;
			case "IPF.Contact":
				return SYNC_FOLDER_TYPE_USER_CONTACT;
			case "IPF.StickyNote":
				return SYNC_FOLDER_TYPE_USER_NOTE;
			case "IPF.Task":
				return SYNC_FOLDER_TYPE_USER_TASK;
			case "IPF.Journal":
				return SYNC_FOLDER_TYPE_USER_JOURNAL;
			default:
				return SYNC_FOLDER_TYPE_UNKNOWN;
		}
	}

	/**
	 * Returns MAPIFolder object which contains the state information.
	 * Creates this folder if it is not available yet.
	 *
	 * @param string		$devid							the device id
	 *
	 * @access private
	 * @return MAPIFolder
	 */
	function getStoreStateFolder()
	{
		if (!$this->stateFolder) {
			$store = $GLOBALS["mapisession"]->getDefaultMessageStore();
			$rootFolder = mapi_msgstore_openentry($store);
			$hierarchy = mapi_folder_gethierarchytable($rootFolder, CONVENIENT_DEPTH | MAPI_DEFERRED_ERRORS);
			$restriction = $this->getStateFolderRestriction(PLUGIN_MDM_STORE_STATE_FOLDER);
			mapi_table_restrict($hierarchy, $restriction);
			if (mapi_table_getrowcount($hierarchy) == 1) {
				$rows = mapi_table_queryrows($hierarchy, [PR_ENTRYID], 0, 1);
				$this->stateFolder = mapi_msgstore_openentry($store, $rows[0][PR_ENTRYID]);
			}
		}

		return $this->stateFolder;
	}

	/**
	 * Returns the restriction for the state folder name.
	 *
	 * @param string		$folderName				 the state folder name
	 *
	 * @access private
	 * @return array
	 */
	function getStateFolderRestriction($folderName)
	{
		return [RES_AND, [
			[	RES_PROPERTY,
					[	RELOP => RELOP_EQ,
							ULPROPTAG => PR_DISPLAY_NAME,
							VALUE => $folderName
					],
			],
			[	RES_PROPERTY,
					[	RELOP => RELOP_EQ,
							ULPROPTAG => PR_ATTR_HIDDEN,
							VALUE => true
					],
			]
		]];
	}

	/**
	 * Returns the restriction for the associated message in the state folder.
	 *
	 * @param string		$messageName				the message name
	 *
	 * @access private
	 * @return array
	 */
	function getStateMessageRestriction($messageName)
	{
		return [RES_AND, [
				[	 RES_PROPERTY,
						[	 RELOP => RELOP_EQ,
								ULPROPTAG => PR_DISPLAY_NAME,
								VALUE => $messageName
						],
				],
				[	 RES_PROPERTY,
						[	 RELOP => RELOP_EQ,
								ULPROPTAG => PR_MESSAGE_CLASS,
								VALUE => 'IPM.Note.GrommunioState'
						],
				]
		]];
	}

	/**
	 * Returns the status of the remote wipe policy.
	 *
	 * @access public
	 * @return int          returns the current status of the device - SYNC_PROVISION_RWSTATUS_*
	 */
	function getProvisioningWipeStatus($deviceid)
	{
		// retrieve the WIPE STATUS from the Admin API
		$api_response = file_get_contents(PLUGIN_MDM_ADMIN_API_WIPE_ENDPOINT . $GLOBALS["mapisession"]->getUserName() ."?devices=". $deviceid);
		if ($api_response) {
			$data = json_decode($api_response, true);
			if (isset($data['data'][$deviceid]["status"])) {
				return $data['data'][$deviceid]["status"];
			}
		}
		return SYNC_PROVISION_RWSTATUS_NA;
	}
};
