<?php

/*
 * SPDX-FileCopyrightText: Copyright 2020 - 2026 grommunio GmbH
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

require_once BASE_PATH . 'server/includes/core/class.encryptionstore.php';
require_once 'zpushprops.php';
require_once 'class.mdmhierarchy.php';

/**
 * PluginMDMModule Module.
 */
class PluginMDMModule extends Module {
	// content data
	public const FOLDERUUID = 1;
	public const FOLDERTYPE = 2;
	public const FOLDERBACKENDID = 5;

	/** @var null|false|resource */
	private $stateFolder;
	private $deviceStates;
	private $devices;

	/**
	 * Constructor.
	 *
	 * @param int   $id   unique id
	 * @param array $data list of all actions
	 */
	public function __construct($id, $data) {
		parent::__construct($id, $data);
		$this->stateFolder = null;
		$this->deviceStates = [];
		$this->devices = [];
	}

	#[Override]
	protected function afterLoadSessionData() {
		$this->setupDevices();
	}

	/**
	 * Function sets up the array with the user's devices.
	 */
	public function setupDevices() {
		$devices = [];
		$stateFolder = $this->getStoreStateFolder();
		if ($stateFolder) {
			$store = $GLOBALS["mapisession"]->getDefaultMessageStore();
			$username = $GLOBALS["mapisession"]->getUserName();
			$hierarchyTable = mapi_folder_gethierarchytable($stateFolder, CONVENIENT_DEPTH | MAPI_DEFERRED_ERRORS);
			$rows = mapi_table_queryallrows($hierarchyTable, [PR_ENTRYID, PR_DISPLAY_NAME]);
			foreach ($rows as $row) {
				$deviceStateFolder = mapi_msgstore_openentry($store, $row[PR_ENTRYID]);
				if (mapi_last_hresult() == 0) {
					$this->deviceStates[$row[PR_DISPLAY_NAME]] = $deviceStateFolder;

					$deviceStateFolderContents = mapi_folder_getcontentstable($deviceStateFolder, MAPI_ASSOCIATED);
					$restriction = $this->getStateMessageRestriction("devicedata");
					mapi_table_restrict($deviceStateFolderContents, $restriction);
					if (mapi_table_getrowcount($deviceStateFolderContents) == 1) {
						$rows = mapi_table_queryrows($deviceStateFolderContents, [PR_ENTRYID], 0, 1);
						$message = mapi_msgstore_openentry($store, $rows[0][PR_ENTRYID]);
						$state = base64_decode(readMapiPropStream($message, PR_BODY));
						$unserializedState = json_decode($state);
						// fallback for "old-style" states
						if (isset($unserializedState->data->devices)) {
							$devices[$unserializedState->data->devices->{$username}->data->deviceid] = $unserializedState->data->devices->{$username}->data;
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
	 *
	 * @param string $deviceid of phone which has to be resynced
	 *
	 * @return bool $response true if removing states succeeded or false on failure
	 */
	public function resyncDevice($deviceid) {
		$deviceStateFolder = $this->deviceStates[$deviceid];
		if ($deviceStateFolder) {
			try {
				// find all messages that are not 'devicedata' and remove them
				$deviceStateFolderContents = mapi_folder_getcontentstable($deviceStateFolder, MAPI_ASSOCIATED);
				$restriction = $this->getStateMessageRestriction("devicedata", RELOP_NE);
				mapi_table_restrict($deviceStateFolderContents, $restriction);

				$rows = mapi_table_queryallrows($deviceStateFolderContents, [PR_ENTRYID, PR_DISPLAY_NAME]);
				$messages = [];
				foreach ($rows as $row) {
					$messages[] = $row[PR_ENTRYID];
				}
				mapi_folder_deletemessages($deviceStateFolder, $messages, DEL_ASSOCIATED | DELETE_HARD_DELETE);
				if (mapi_last_hresult() == NOERROR) {
					return true;
				}
			}
			catch (Exception $e) {
				error_log(sprintf("mdm plugin resyncDevice Exception: %s", $e));

				return false;
			}
		}
		error_log(sprintf("mdm plugin resyncDevice device state folder %s", $deviceStateFolder));

		return false;
	}

	/**
	 * Function which triggers remote wipe of a device.
	 *
	 * @param string $deviceid of phone which has to be wiped
	 * @param string $password user password
	 * @param int    $wipeType remove account only or all data
	 *
	 * @return bool true if the request was successful, false otherwise
	 */
	public function wipeDevice($deviceid, $password, $wipeType = SYNC_PROVISION_RWSTATUS_PENDING) {
		$payload = [
			'remoteIP' => '[::1]',
			'status' => $wipeType,
			'time' => time(),
		];
		if (!empty($password)) {
			$payload['password'] = $password;
		}
		$opts = ['http' => [
			'method' => 'POST',
			'header' => 'Content-Type: application/json',
			'ignore_errors' => true,
			'content' => json_encode($payload),
		],
		];
		$ret = file_get_contents(PLUGIN_MDM_ADMIN_API_WIPE_ENDPOINT . $GLOBALS["mapisession"]->getUserName() . "?devices=" . $deviceid, false, stream_context_create($opts));

		return $this->apiReportedSuccess($ret);
	}

	/**
	 * Whether the admin API answered a wipe or remove request with success.
	 *
	 * @param bool|string $response the raw answer of the endpoint
	 */
	private function apiReportedSuccess($response): bool {
		$decoded = json_decode((string) $response, true);

		return is_array($decoded) && strncasecmp('success', (string) ($decoded['message'] ?? ''), 7) === 0;
	}

	/**
	 * Function which triggers removal of a device.
	 *
	 * @param string $deviceid of phone which has to be removed
	 * @param string $password user password
	 *
	 * @return bool true if the device was removed, false otherwise
	 */
	public function removeDevice($deviceid, $password) {
		// TODO remove the device from device / user list
		$deviceStateFolder = $this->deviceStates[$deviceid];
		$stateFolder = $this->getStoreStateFolder();
		if ($stateFolder && $deviceStateFolder) {
			$props = mapi_getprops($deviceStateFolder, [PR_ENTRYID]);

			try {
				mapi_folder_deletefolder($stateFolder, $props[PR_ENTRYID], DEL_MESSAGES);
				$payload = [
					'remoteIP' => '[::1]',
					'status' => SYNC_PROVISION_RWSTATUS_NA,
					'time' => time(),
				];
				if (!empty($password)) {
					$payload['password'] = $password;
				}
				$opts = ['http' => [
					'method' => 'POST',
					'header' => 'Content-Type: application/json',
					'ignore_errors' => true,
					'content' => json_encode($payload),
				],
				];
				$ret = file_get_contents(PLUGIN_MDM_ADMIN_API_WIPE_ENDPOINT . $GLOBALS["mapisession"]->getUserName() . "?devices=" . $deviceid, false, stream_context_create($opts));

				return $this->apiReportedSuccess($ret);
			}
			catch (Exception $e) {
				error_log(sprintf("mdm plugin removeDevice Exception: %s", $e));

				return false;
			}
		}
		error_log(sprintf(
			"mdm plugin removeDevice state folder %s device state folder %s",
			(string) $stateFolder,
			$deviceStateFolder
		));

		return false;
	}

	/**
	 * Function to get details of the given device.
	 *
	 * @param string $deviceid id of device
	 *
	 * @return array contains device props
	 */
	public function getDeviceDetails($deviceid) {
		$device = [];
		$device['props'] = $this->getDeviceProps($this->devices[$deviceid]);
		$device['sharedfolders'] = ['item' => $this->getAdditionalFolderList($deviceid)];

		return $device;
	}

	/**
	 * Executes all the actions in the $data variable.
	 *
	 * @return bool true on success or false on failure
	 */
	#[Override]
	public function execute() {
		foreach ($this->data as $actionType => $actionData) {
			if (isset($actionType)) {
				try {
					switch ($actionType) {
						case 'wipe':
							$this->addActionData('wipe', [
								'type' => 3,
								'wipe' => $this->wipeDevice($actionData['deviceid'], $actionData['password'] ?? '', $actionData['wipetype']),
							]);
							$GLOBALS['bus']->addData($this->getResponseData());
							break;

						case 'resync':
							$this->addActionData('resync', [
								'type' => 3,
								'resync' => $this->resyncDevice($actionData['deviceid']),
							]);
							$GLOBALS['bus']->addData($this->getResponseData());
							break;

						case 'remove':
							$this->addActionData('remove', [
								'type' => 3,
								'remove' => $this->removeDevice($actionData['deviceid'], $actionData['password'] ?? ''),
							]);
							$GLOBALS['bus']->addData($this->getResponseData());
							break;

						case 'list':
							$items = [];
							$data['page'] = [];

							foreach ($this->devices as $device) {
								array_push($items, ['props' => $this->getDeviceProps($device)]);
							}
							$data['page']['start'] = 0;
							$data['page']['rowcount'] = count($this->devices);
							$data['page']['totalrowcount'] = $data['page']['rowcount'];
							$data = array_merge($data, ['item' => $items]);
							$this->addActionData('list', $data);
							$GLOBALS['bus']->addData($this->getResponseData());
							break;

						case 'open':
							$device = $this->getDeviceDetails($actionData["entryid"]);
							$item = ["item" => $device];
							$this->addActionData('item', $item);
							$GLOBALS['bus']->addData($this->getResponseData());
							break;

						case 'save':
							$this->saveDevice($actionData);
							$device = $this->getDeviceDetails($actionData["entryid"]);
							$item = ["item" => $device];
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
					$this->sendFeedback(false, ["type" => ERROR_GENERAL, "info" => ['title' => $title, 'display_message' => $display_message]]);
				}
			}
		}
	}

	/**
	 * Function which is use to get device properties.
	 *
	 * @param object $device array of device properties
	 *
	 * @return array
	 */
	public function getDeviceProps($device) {
		$item = [];
		$propsList = ['devicetype', 'deviceos', 'devicefriendlyname', 'useragent', 'asversion', 'firstsynctime',
			'lastsynctime', 'lastupdatetime', 'policyname', 'impersonatinguser'];

		$item['entryid'] = $device->deviceid;
		$item['message_class'] = "IPM.MDM";
		foreach ($propsList as $prop) {
			if (isset($device->{$prop})) {
				$item[$prop] = $device->{$prop};
			}
		}
		$item['wipestatus'] = $this->getProvisioningWipeStatus($device->deviceid);
		$item['lastconnecttime'] = $this->getLastConnectionTime($device->deviceid, $item['lastupdatetime']);

		return array_merge($item, $this->getSyncFoldersProps($device));
	}

	/**
	 * Function which is use to gather some statistics about synchronized folders.
	 *
	 * @param object $device object containing device properties
	 *
	 * @return array $syncFoldersProps has list of properties related to synchronized folders
	 */
	public function getSyncFoldersProps($device) {
		$synchedFolderTypes = [];
		$synchronizedFolders = 0;

		foreach ($device->contentdata as $folderid => $folderdata) {
			if (isset($folderdata->{self::FOLDERUUID})) {
				$type = $folderdata->{self::FOLDERTYPE};

				$folderType = $this->getSyncFolderType($type);
				if (isset($synchedFolderTypes[$folderType])) {
					++$synchedFolderTypes[$folderType];
				}
				else {
					$synchedFolderTypes[$folderType] = 1;
				}
			}
		}
		$syncFoldersProps = [];
		foreach ($synchedFolderTypes as $key => $value) {
			$synchronizedFolders += $value;
			$syncFoldersProps[strtolower($key) . 'folder'] = $value;
		}
		$syncFoldersProps['synchronizedfolders'] = $synchronizedFolders;

		return $syncFoldersProps;
	}

	/**
	 * Get the general type (such as Mail, Calendar, or Contacts) from a folder type.
	 *
	 * @param int $type folder type for a folder already known to the mobile device
	 *
	 * @return string general folder type
	 */
	public function getSyncFolderType($type) {
		return match ($type) {
			SYNC_FOLDER_TYPE_APPOINTMENT, SYNC_FOLDER_TYPE_USER_APPOINTMENT => "Calendars",
			SYNC_FOLDER_TYPE_CONTACT, SYNC_FOLDER_TYPE_USER_CONTACT => "Contacts",
			SYNC_FOLDER_TYPE_TASK, SYNC_FOLDER_TYPE_USER_TASK => "Tasks",
			SYNC_FOLDER_TYPE_NOTE, SYNC_FOLDER_TYPE_USER_NOTE => "Notes",
			default => "Emails",
		};
	}

	/**
	 * Function which is use to get list of additional folders which was shared with given device.
	 *
	 * @param string $devid device id
	 *
	 * @return array has list of properties related to shared folders
	 */
	public function getAdditionalFolderList($devid) {
		// The former SOAP endpoint is unavailable; keep the disabled UI's empty-list contract.
		return [];
	}

	/**
	 * Function which is use to remove additional folder which was shared with given device.
	 *
	 * @param string $entryId  id of device
	 * @param string $folderid id of folder which will remove from device
	 */
	public function additionalFolderRemove($entryId, $folderid) {
		throw new RuntimeException(_('Managing shared folders is not supported by this server.'));
	}

	/**
	 * Function which is use to add additional folder which will share with given device.
	 *
	 * @param string $entryId id of device
	 * @param array  $folder  folder which will share with device
	 */
	public function additionalFolderAdd($entryId, $folder) {
		throw new RuntimeException(_('Managing shared folders is not supported by this server.'));
	}

	/**
	 * Function which use to save the device.
	 * It will use to add or remove folders in the device.
	 *
	 * @param array $data array of added and removed folders
	 */
	public function saveDevice($data) {
		if (!empty($data['sharedfolders']['remove']) || !empty($data['sharedfolders']['add'])) {
			throw new RuntimeException(_('Managing shared folders is not supported by this server.'));
		}
	}

	/**
	 * Gets the hierarchy list of all required stores.
	 *
	 * @return array the array of all hierarchy folders
	 */
	public function getHierarchyList() {
		return (new MDMHierarchy())->getHierarchyList();
	}

	/**
	 * @see MDMHierarchy::getSharedFolderList()
	 *
	 * @param mixed $store
	 * @param mixed $sharedFolders
	 * @param mixed $properties
	 * @param mixed $storeUserName
	 */
	public function getSharedFolderList($store, $sharedFolders, $properties, $storeUserName) {
		return (new MDMHierarchy())->getSharedFolderList($store, $sharedFolders, $properties, $storeUserName);
	}

	/**
	 * @see MDMHierarchy::getSubFolders()
	 *
	 * @param mixed $folder
	 * @param mixed $store
	 * @param mixed $properties
	 * @param mixed $storeData
	 * @param mixed $storeUserName
	 */
	public function getSubFolders($folder, $store, $properties, &$storeData, $storeUserName) {
		(new MDMHierarchy())->getSubFolders($folder, $store, $properties, $storeData, $storeUserName);
	}

	/**
	 * @see MDMHierarchy::getFolderTypeFromContainerClass()
	 *
	 * @param mixed $containerClass
	 */
	public function getFolderTypeFromContainerClass($containerClass) {
		return (new MDMHierarchy())->getFolderTypeFromContainerClass($containerClass);
	}

	/**
	 * Returns MAPIFolder object which contains the state information.
	 * Creates this folder if it is not available yet.
	 *
	 * @return null|false|resource
	 */
	public function getStoreStateFolder() {
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
	 * @param string $folderName the state folder name
	 *
	 * @return array
	 */
	public function getStateFolderRestriction($folderName) {
		return [RES_AND, [
			[RES_PROPERTY,
				[RELOP => RELOP_EQ,
					ULPROPTAG => PR_DISPLAY_NAME,
					VALUE => $folderName,
				],
			],
			[RES_PROPERTY,
				[RELOP => RELOP_EQ,
					ULPROPTAG => PR_ATTR_HIDDEN,
					VALUE => true,
				],
			],
		]];
	}

	/**
	 * Returns the restriction for the associated message in the state folder.
	 *
	 * @param string $messageName the message name
	 * @param int    $op          comparison operation
	 *
	 * @return array
	 */
	public function getStateMessageRestriction($messageName, $op = RELOP_EQ) {
		return [RES_AND, [
			[RES_PROPERTY,
				[RELOP => $op,
					ULPROPTAG => PR_DISPLAY_NAME,
					VALUE => $messageName,
				],
			],
			[RES_PROPERTY,
				[RELOP => RELOP_EQ,
					ULPROPTAG => PR_MESSAGE_CLASS,
					VALUE => 'IPM.Note.GrommunioState',
				],
			],
		]];
	}

	/**
	 * Returns the last connection time of a device.
	 *
	 * @param mixed $deviceid
	 * @param int   $fallback
	 *
	 * @return int returns the last connection time (epoch) of a device
	 */
	public function getLastConnectionTime($deviceid, $fallback) {
		// retrieve the LAST CONNECT from the Admin API
		$api_response = file_get_contents(PLUGIN_MDM_ADMIN_API_LASTCONNECT_ENDPOINT . $GLOBALS["mapisession"]->getUserName() . "?devices=" . $deviceid);
		if ($api_response) {
			$data = json_decode($api_response, true);
			if (isset($data['data'][$deviceid]["lastconnecttime"])) {
				return $data['data'][$deviceid]["lastconnecttime"];
			}
		}

		return $fallback;
	}

	/**
	 * Returns the status of the remote wipe policy.
	 *
	 * @param mixed $deviceid
	 *
	 * @return int returns the current status of the device - SYNC_PROVISION_RWSTATUS_*
	 */
	public function getProvisioningWipeStatus($deviceid) {
		// retrieve the WIPE STATUS from the Admin API
		$api_response = file_get_contents(PLUGIN_MDM_ADMIN_API_WIPE_ENDPOINT . $GLOBALS["mapisession"]->getUserName() . "?devices=" . $deviceid);
		if ($api_response) {
			$data = json_decode($api_response, true);
			if (isset($data['data'][$deviceid]["status"])) {
				return $data['data'][$deviceid]["status"];
			}
		}

		return SYNC_PROVISION_RWSTATUS_NA;
	}
}
