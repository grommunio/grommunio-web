<?php

/*
 * SPDX-FileCopyrightText: Copyright 2020 - 2026 grommunio GmbH
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

/**
 * Folder hierarchy listing for the mobile device management plugin.
 */
class MDMHierarchy {
	/**
	 * Gets the hierarchy list of all required stores.
	 * Function which is use to get the hierarchy list with PR_SOURCE_KEY.
	 *
	 * @return array the array of all hierarchy folders
	 */
	public function getHierarchyList() {
		$storeList = $GLOBALS["mapisession"]->getAllMessageStores();
		$properties = $GLOBALS["properties"]->getFolderListProperties();
		$otherUsers = $GLOBALS["mapisession"]->retrieveOtherUsersFromSettings();
		$properties["source_key"] = PR_SOURCE_KEY;
		$storeData = [];

		foreach ($storeList as $store) {
			$openWholeStore = true;
			$msgstore_props = mapi_getprops($store, [PR_MDB_PROVIDER, PR_ENTRYID, PR_IPM_SUBTREE_ENTRYID, PR_USER_NAME]);
			$storeType = $msgstore_props[PR_MDB_PROVIDER];

			if ($storeType == ZARAFA_SERVICE_GUID) {
				continue;
			}
			if ($storeType == ZARAFA_STORE_DELEGATE_GUID) {
				$storeUserName = $GLOBALS["mapisession"]->getUserNameOfStore($msgstore_props[PR_ENTRYID]);
			}
			elseif ($storeType == ZARAFA_STORE_PUBLIC_GUID) {
				$storeUserName = "SYSTEM";
			}
			else {
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
					}
					catch (MAPIException $e) {
						// We've handled the event
						$e->setHandled();

						// no folder access, nothing to list
						continue;
					}

					$this->getSubFolders($subtreeFolder, $store, $properties, $storeData, $storeUserName);
				}
			}
		}

		return $storeData;
	}

	/**
	 * Helper function to get the shared folder list.
	 *
	 * @param object $store         message Store Object
	 * @param array  $sharedFolders folders shared with the current user
	 * @param array  $properties    MAPI property mappings for folders
	 * @param string $storeUserName owner name of store
	 *
	 * @return array shared folders list
	 */
	public function getSharedFolderList($store, $sharedFolders, $properties, $storeUserName) {
		$msgstore_props = mapi_getprops($store, [PR_ENTRYID, PR_DISPLAY_NAME, PR_IPM_SUBTREE_ENTRYID, PR_IPM_OUTBOX_ENTRYID, PR_IPM_SENTMAIL_ENTRYID, PR_IPM_WASTEBASKET_ENTRYID, PR_MDB_PROVIDER, PR_IPM_PUBLIC_FOLDERS_ENTRYID, PR_IPM_FAVORITES_ENTRYID, PR_OBJECT_TYPE, PR_STORE_SUPPORT_MASK, PR_MAILBOX_OWNER_ENTRYID, PR_MAILBOX_OWNER_NAME, PR_USER_ENTRYID, PR_USER_NAME, PR_QUOTA_WARNING_THRESHOLD, PR_QUOTA_SEND_THRESHOLD, PR_QUOTA_RECEIVE_THRESHOLD, PR_MESSAGE_SIZE_EXTENDED, PR_MAPPING_SIGNATURE, PR_COMMON_VIEWS_ENTRYID, PR_FINDER_ENTRYID]);
		$storeData = [];
		$folders = [];

		$inboxProps = [];

		try {
			$inbox = mapi_msgstore_getreceivefolder($store);
			$inboxProps = mapi_getprops($inbox, [PR_ENTRYID]);
		}
		catch (MAPIException $e) {
			// don't propagate this error to parent handlers, if store doesn't support it
			if ($e->getCode() === MAPI_E_NO_SUPPORT) {
				$e->setHandled();
			}
		}

		$root = mapi_msgstore_openentry($store);
		$rootProps = mapi_getprops($root, [PR_IPM_APPOINTMENT_ENTRYID, PR_IPM_CONTACT_ENTRYID, PR_IPM_DRAFTS_ENTRYID, PR_IPM_JOURNAL_ENTRYID, PR_IPM_NOTE_ENTRYID, PR_IPM_TASK_ENTRYID, PR_ADDITIONAL_REN_ENTRYIDS]);

		$additional_ren_entryids = [];
		if (isset($rootProps[PR_ADDITIONAL_REN_ENTRYIDS])) {
			$additional_ren_entryids = $rootProps[PR_ADDITIONAL_REN_ENTRYIDS];
		}

		$defaultfolders = [
			"default_folder_inbox" => ["inbox" => PR_ENTRYID],
			"default_folder_outbox" => ["store" => PR_IPM_OUTBOX_ENTRYID],
			"default_folder_sent" => ["store" => PR_IPM_SENTMAIL_ENTRYID],
			"default_folder_wastebasket" => ["store" => PR_IPM_WASTEBASKET_ENTRYID],
			"default_folder_favorites" => ["store" => PR_IPM_FAVORITES_ENTRYID],
			"default_folder_publicfolders" => ["store" => PR_IPM_PUBLIC_FOLDERS_ENTRYID],
			"default_folder_calendar" => ["root" => PR_IPM_APPOINTMENT_ENTRYID],
			"default_folder_contact" => ["root" => PR_IPM_CONTACT_ENTRYID],
			"default_folder_drafts" => ["root" => PR_IPM_DRAFTS_ENTRYID],
			"default_folder_journal" => ["root" => PR_IPM_JOURNAL_ENTRYID],
			"default_folder_note" => ["root" => PR_IPM_NOTE_ENTRYID],
			"default_folder_task" => ["root" => PR_IPM_TASK_ENTRYID],
			"default_folder_junk" => ["additional" => 4],
			"default_folder_syncissues" => ["additional" => 1],
			"default_folder_conflicts" => ["additional" => 0],
			"default_folder_localfailures" => ["additional" => 2],
			"default_folder_serverfailures" => ["additional" => 3],
		];

		foreach ($defaultfolders as $key => $prop) {
			$tag = reset($prop);
			$from = key($prop);

			switch ($from) {
				case "inbox":
					if (isset($inboxProps[$tag])) {
						$storeData["props"][$key] = bin2hex((string) $inboxProps[$tag]);
					}
					break;

				case "store":
					if (isset($msgstore_props[$tag])) {
						$storeData["props"][$key] = bin2hex((string) $msgstore_props[$tag]);
					}
					break;

				case "root":
					if (isset($rootProps[$tag])) {
						$storeData["props"][$key] = bin2hex((string) $rootProps[$tag]);
					}
					break;

				case "additional":
					if (isset($additional_ren_entryids[$tag])) {
						$storeData["props"][$key] = bin2hex((string) $additional_ren_entryids[$tag]);
					}
					break;
			}
		}

		foreach ($sharedFolders as $sharedFolder) {
			$defaultFolderKey = "default_folder_" . ($sharedFolder["folder_type"] ?? '');
			if (!isset($storeData["props"][$defaultFolderKey])) {
				continue;
			}
			$folderEntryID = hex2bin($storeData["props"][$defaultFolderKey]);
			if ($folderEntryID === false) {
				continue;
			}

			try {
				// load folder props
				$folder = mapi_msgstore_openentry($store, $folderEntryID);
			}
			catch (MAPIException $e) {
				// We've handled the event
				$e->setHandled();

				continue;
			}
			if ($folder === false) {
				continue;
			}

			$folderProps = mapi_getprops($folder, $properties);
			$folderProps["user"] = $storeUserName;
			array_push($folders, $folderProps);

			// If folder has sub folders then add its.
			if (!empty($sharedFolder["show_subfolders"]) && !empty($folderProps[PR_SUBFOLDERS])) {
				$subFoldersData = [];
				$this->getSubFolders($folder, $store, $properties, $subFoldersData, $storeUserName);
				$folders = array_merge($folders, $subFoldersData);
			}
		}

		return $folders;
	}

	/**
	 * Helper function to get the sub folders of a given folder.
	 *
	 * @param object $folder        mapi Folder Object
	 * @param object $store         Message Store Object
	 * @param array  $properties    MAPI property mappings for folders
	 * @param array  $storeData     Reference to an array. The folder properties are added to this array.
	 * @param string $storeUserName owner name of store
	 */
	public function getSubFolders($folder, $store, $properties, &$storeData, $storeUserName) {
		/**
		 * remove hidden folders, folders with PR_ATTR_HIDDEN property set
		 * should not be shown to the client.
		 */
		$restriction = [RES_OR, [
			[RES_PROPERTY,
				[
					RELOP => RELOP_EQ,
					ULPROPTAG => PR_ATTR_HIDDEN,
					VALUE => [PR_ATTR_HIDDEN => false],
				],
			],
			[RES_NOT,
				[
					[RES_EXIST,
						[
							ULPROPTAG => PR_ATTR_HIDDEN,
						],
					],
				],
			],
		]];

		$expand = [
			[
				'folder' => $folder,
				'props' => mapi_getprops($folder, [PR_ENTRYID, PR_SUBFOLDERS]),
			],
		];

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
						array_push($expand, ['folder' => $folderObject, 'props' => $subfolder]);
					}
					$subfolder["user"] = $storeUserName;
					// Add the folder to the return list.
					array_push($storeData, $subfolder);
				}

				// When the server returned a different number of rows then was requested,
				// we have reached the end of the table and we should exit the loop.
			}
			while (count($rows) === $batchcount);
		}
	}

	/**
	 * Function which is use get folder types from the container class.
	 *
	 * @param string $containerClass container class of folder
	 *
	 * @return int folder type
	 */
	public function getFolderTypeFromContainerClass($containerClass) {
		return match ($containerClass) {
			"IPF.Note" => SYNC_FOLDER_TYPE_USER_MAIL,
			"IPF.Appointment" => SYNC_FOLDER_TYPE_USER_APPOINTMENT,
			"IPF.Contact" => SYNC_FOLDER_TYPE_USER_CONTACT,
			"IPF.StickyNote" => SYNC_FOLDER_TYPE_USER_NOTE,
			"IPF.Task" => SYNC_FOLDER_TYPE_USER_TASK,
			"IPF.Journal" => SYNC_FOLDER_TYPE_USER_JOURNAL,
			default => SYNC_FOLDER_TYPE_UNKNOWN,
		};
	}
}
