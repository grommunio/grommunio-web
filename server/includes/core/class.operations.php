<?php

/**
 * General operations.
 *
 * All mapi operations, like create, change and delete, are set in this class.
 * A module calls one of these methods.
 *
 * Note: All entryids in this class are binary
 *
 * @todo This class is bloated. It also returns data in various arbitrary formats
 * that other functions depend on, making lots of code almost completely unreadable.
 */
class Operations {
	/**
	 * Gets the hierarchy list of all required stores.
	 *
	 * getHierarchyList builds an entire hierarchy list of all folders that should be shown in various places. Most importantly,
	 * it generates the list of folders to be show in the hierarchylistmodule (left-hand folder browser) on the client.
	 *
	 * It is also used to generate smaller hierarchy lists, for example for the 'create folder' dialog.
	 *
	 * The returned array is a flat array of folders, so if the caller wishes to build a tree, it is up to the caller to correlate
	 * the entryids and the parent_entryids of all the folders to build the tree.
	 *
	 * The return value is an associated array with the following keys:
	 * - store: array of stores
	 *
	 * Each store contains:
	 * - array("store_entryid" => entryid of store, name => name of store, subtree => entryid of viewable root, type => default|public|other, folder_type => "all")
	 * - folder: array of folders with each an array of properties (see Operations::setFolder() for properties)
	 *
	 * @param array  $properties   MAPI property mapping for folders
	 * @param int    $type         Which stores to fetch (HIERARCHY_GET_ALL | HIERARCHY_GET_DEFAULT | HIERARCHY_GET_ONE)
	 * @param object $store        Only when $type == HIERARCHY_GET_ONE
	 * @param array  $storeOptions Only when $type == HIERARCHY_GET_ONE, this overrides the  loading options which is normally
	 *                             obtained from the settings for loading the store (e.g. only load calendar).
	 * @param string $username     The username
	 *
	 * @return array Return structure
	 */
	public function getHierarchyList($properties, $type = HIERARCHY_GET_ALL, $store = null, $storeOptions = null, $username = null) {
		switch ($type) {
			case HIERARCHY_GET_ALL:
				$storelist = $GLOBALS["mapisession"]->getAllMessageStores();
				break;

			case HIERARCHY_GET_DEFAULT:
				$storelist = [$GLOBALS["mapisession"]->getDefaultMessageStore()];
				break;

			case HIERARCHY_GET_ONE:
				// Get single store and it's archive store as well
				$storelist = $GLOBALS["mapisession"]->getSingleMessageStores($store, $storeOptions, $username);
				break;
		}

		$data = [];
		$data["item"] = [];

		// Get the other store options
		if (isset($storeOptions)) {
			$otherUsers = $storeOptions;
		}
		else {
			$otherUsers = $GLOBALS["mapisession"]->retrieveOtherUsersFromSettings();
		}

		foreach ($storelist as $store) {
			$msgstore_props = mapi_getprops($store, [PR_ENTRYID, PR_DISPLAY_NAME, PR_IPM_SUBTREE_ENTRYID, PR_IPM_OUTBOX_ENTRYID, PR_IPM_SENTMAIL_ENTRYID, PR_IPM_WASTEBASKET_ENTRYID, PR_MDB_PROVIDER, PR_IPM_PUBLIC_FOLDERS_ENTRYID, PR_IPM_FAVORITES_ENTRYID, PR_OBJECT_TYPE, PR_STORE_SUPPORT_MASK, PR_MAILBOX_OWNER_ENTRYID, PR_MAILBOX_OWNER_NAME, PR_USER_ENTRYID, PR_USER_NAME, PR_QUOTA_WARNING_THRESHOLD, PR_QUOTA_SEND_THRESHOLD, PR_QUOTA_RECEIVE_THRESHOLD, PR_MESSAGE_SIZE_EXTENDED, PR_COMMON_VIEWS_ENTRYID, PR_FINDER_ENTRYID]);

			$inboxProps = [];
			$storeType = $msgstore_props[PR_MDB_PROVIDER];

			/*
			 * storetype is public and if public folder is disabled
			 * then continue in loop for next store.
			 */
			if ($storeType == ZARAFA_STORE_PUBLIC_GUID && ENABLE_PUBLIC_FOLDERS === false) {
				continue;
			}

			// Obtain the real username for the store when dealing with a shared store
			if ($storeType == ZARAFA_STORE_DELEGATE_GUID) {
				$storeUserName = $GLOBALS["mapisession"]->getUserNameOfStore($msgstore_props[PR_ENTRYID]);
			}
			else {
				$storeUserName = $msgstore_props[PR_USER_NAME] ?? $GLOBALS["mapisession"]->getUserName();
			}

			$storeData = [
				"store_entryid" => bin2hex((string) $msgstore_props[PR_ENTRYID]),
				"props" => [
					// Showing the store as 'Inbox - Name' is confusing, so we strip the 'Inbox - ' part.
					"display_name" => str_replace('Inbox - ', '', $msgstore_props[PR_DISPLAY_NAME]),
					"subtree_entryid" => bin2hex((string) $msgstore_props[PR_IPM_SUBTREE_ENTRYID]),
					"mdb_provider" => bin2hex((string) $msgstore_props[PR_MDB_PROVIDER]),
					"object_type" => $msgstore_props[PR_OBJECT_TYPE],
					"store_support_mask" => $msgstore_props[PR_STORE_SUPPORT_MASK],
					"user_name" => $storeUserName,
					"store_size" => round($msgstore_props[PR_MESSAGE_SIZE_EXTENDED] / 1024),
					"quota_warning" => $msgstore_props[PR_QUOTA_WARNING_THRESHOLD] ?? 0,
					"quota_soft" => $msgstore_props[PR_QUOTA_SEND_THRESHOLD] ?? 0,
					"quota_hard" => $msgstore_props[PR_QUOTA_RECEIVE_THRESHOLD] ?? 0,
					"common_view_entryid" => isset($msgstore_props[PR_COMMON_VIEWS_ENTRYID]) ? bin2hex((string) $msgstore_props[PR_COMMON_VIEWS_ENTRYID]) : "",
					"finder_entryid" => isset($msgstore_props[PR_FINDER_ENTRYID]) ? bin2hex((string) $msgstore_props[PR_FINDER_ENTRYID]) : "",
					"todolist_entryid" => bin2hex(TodoList::getEntryId()),
				],
			];

			// these properties doesn't exist in public store
			if (isset($msgstore_props[PR_MAILBOX_OWNER_ENTRYID], $msgstore_props[PR_MAILBOX_OWNER_NAME])) {
				$storeData["props"]["mailbox_owner_entryid"] = bin2hex((string) $msgstore_props[PR_MAILBOX_OWNER_ENTRYID]);
				$storeData["props"]["mailbox_owner_name"] = $msgstore_props[PR_MAILBOX_OWNER_NAME];
			}

			// public store doesn't have inbox
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

			$storeData["folders"] = ["item" => []];

			if (isset($msgstore_props[PR_IPM_SUBTREE_ENTRYID])) {
				$subtreeFolderEntryID = $msgstore_props[PR_IPM_SUBTREE_ENTRYID];

				$openWholeStore = true;
				if ($storeType == ZARAFA_STORE_DELEGATE_GUID) {
					$username = strtolower((string) $storeData["props"]["user_name"]);
					$sharedFolders = [];

					// Check whether we should open the whole store or just single folders
					if (isset($otherUsers[$username])) {
						$sharedFolders = $otherUsers[$username];
						if (!isset($otherUsers[$username]['all'])) {
							$openWholeStore = false;
						}
					}

					// Update the store properties when this function was called to
					// only open a particular shared store.
					if (is_array($storeOptions)) {
						// Update the store properties to mark previously opened
						$prevSharedFolders = $GLOBALS["settings"]->get("zarafa/v1/contexts/hierarchy/shared_stores/" . $username, null);
						if (!empty($prevSharedFolders)) {
							foreach ($prevSharedFolders as $type => $prevSharedFolder) {
								// Update the store properties to refer to the shared folder,
								// note that we don't care if we have access to the folder or not.
								$type = $prevSharedFolder["folder_type"];
								if ($type == "all") {
									$propname = "subtree_entryid";
								}
								else {
									$propname = "default_folder_" . $prevSharedFolder["folder_type"];
								}

								if (isset($storeData["props"][$propname])) {
									$folderEntryID = hex2bin($storeData["props"][$propname]);
									$storeData["props"]["shared_folder_" . $prevSharedFolder["folder_type"]] = bin2hex($folderEntryID);
								}
							}
						}
					}
				}

				// Get the IPMSUBTREE object
				$storeAccess = true;

				try {
					$subtreeFolder = mapi_msgstore_openentry($store, $subtreeFolderEntryID);
					// Add root folder
					$subtree = $this->setFolder(mapi_getprops($subtreeFolder, $properties));
					if (!$openWholeStore) {
						$subtree['props']['access'] = 0;
					}
					array_push($storeData["folders"]["item"], $subtree);
				}
				catch (MAPIException $e) {
					if ($openWholeStore) {
						/*
						 * if we are going to open whole store and we are not able to open the subtree folder
						 * then it should be considered as an error
						 * but if we are only opening single folder then it could be possible that we don't have
						 * permission to open subtree folder so add a dummy subtree folder in the response and don't consider this as an error
						 */
						$storeAccess = false;

						// Add properties to the store response to indicate to the client
						// that the store could not be loaded.
						$this->invalidateResponseStore($storeData, 'all', $subtreeFolderEntryID);
					}
					else {
						// Add properties to the store response to add a placeholder IPMSubtree.
						$this->getDummyIPMSubtreeFolder($storeData, $subtreeFolderEntryID);
					}

					// We've handled the event
					$e->setHandled();
				}

				if ($storeAccess) {
					// Open the whole store and be done with it
					if ($openWholeStore) {
						try {
							// Update the store properties to refer to the shared folder,
							// note that we don't care if we have access to the folder or not.
							$storeData["props"]["shared_folder_all"] = bin2hex((string) $subtreeFolderEntryID);
							$this->getSubFolders($subtreeFolder, $store, $properties, $storeData);

							if ($storeType == ZARAFA_SERVICE_GUID) {
								// If store type ZARAFA_SERVICE_GUID (own store) then get the
								// IPM_COMMON_VIEWS folder and set it to folders array.
								$storeData["favorites"] = ["item" => []];
								$commonViewFolderEntryid = $msgstore_props[PR_COMMON_VIEWS_ENTRYID];

								$this->setDefaultFavoritesFolder($commonViewFolderEntryid, $store, $storeData);

								$commonViewFolder = mapi_msgstore_openentry($store, $commonViewFolderEntryid);
								$this->getFavoritesFolders($commonViewFolder, $storeData);

								$commonViewFolderProps = mapi_getprops($commonViewFolder);
								array_push($storeData["folders"]["item"], $this->setFolder($commonViewFolderProps));

								// Get the To-do list folder and add it to the hierarchy
								$todoSearchFolder = todoList::getTodoSearchFolder($store);
								if ($todoSearchFolder) {
									$todoSearchFolderProps = mapi_getprops($todoSearchFolder);

									// Change the parent so the folder will be shown in the hierarchy
									$todoSearchFolderProps[PR_PARENT_ENTRYID] = $subtreeFolderEntryID;
									// Change the display name of the folder
									$todoSearchFolderProps[PR_DISPLAY_NAME] = _('To-Do List');
									// Never show unread content for the To-do list
									$todoSearchFolderProps[PR_CONTENT_UNREAD] = 0;
									$todoSearchFolderProps[PR_CONTENT_COUNT] = 0;
									array_push($storeData["folders"]["item"], $this->setFolder($todoSearchFolderProps));
									$storeData["props"]['default_folder_todolist'] = bin2hex((string) $todoSearchFolderProps[PR_ENTRYID]);
								}
							}
						}
						catch (MAPIException $e) {
							// Add properties to the store response to indicate to the client
							// that the store could not be loaded.
							$this->invalidateResponseStore($storeData, 'all', $subtreeFolderEntryID);

							// We've handled the event
							$e->setHandled();
						}

					// Open single folders under the store object
					}
					else {
						foreach ($sharedFolders as $type => $sharedFolder) {
							$openSubFolders = ($sharedFolder["show_subfolders"] == true);

							// See if the folders exists by checking if it is in the default folders entryid list
							$store_access = true;
							if (!isset($storeData["props"]["default_folder_" . $sharedFolder["folder_type"]])) {
								// Create a fake folder entryid which must be used for referencing this folder
								$folderEntryID = "default_folder_" . $sharedFolder["folder_type"];

								// Add properties to the store response to indicate to the client
								// that the store could not be loaded.
								$this->invalidateResponseStore($storeData, $type, $folderEntryID);

								// Update the store properties to refer to the shared folder,
								// note that we don't care if we have access to the folder or not.
								$storeData["props"]["shared_folder_" . $sharedFolder["folder_type"]] = bin2hex($folderEntryID);

								// Indicate that we don't have access to the store,
								// so no more attempts to read properties or open entries.
								$store_access = false;

							// If you access according to the above check, go ahead and retrieve the MAPIFolder object
							}
							else {
								$folderEntryID = hex2bin($storeData["props"]["default_folder_" . $sharedFolder["folder_type"]]);

								// Update the store properties to refer to the shared folder,
								// note that we don't care if we have access to the folder or not.
								$storeData["props"]["shared_folder_" . $sharedFolder["folder_type"]] = bin2hex($folderEntryID);

								try {
									// load folder props
									$folder = mapi_msgstore_openentry($store, $folderEntryID);
								}
								catch (MAPIException $e) {
									// Add properties to the store response to indicate to the client
									// that the store could not be loaded.
									$this->invalidateResponseStore($storeData, $type, $folderEntryID);

									// Indicate that we don't have access to the store,
									// so no more attempts to read properties or open entries.
									$store_access = false;

									// We've handled the event
									$e->setHandled();
								}
							}

							// Check if a error handler already inserted a error folder,
							// or if we can insert the real folders here.
							if ($store_access === true) {
								// check if we need subfolders or not
								if ($openSubFolders === true) {
									// add folder data (with all subfolders recursively)
									// get parent folder's properties
									$folderProps = mapi_getprops($folder, $properties);
									$tempFolderProps = $this->setFolder($folderProps);

									array_push($storeData["folders"]["item"], $tempFolderProps);

									// get subfolders
									if ($tempFolderProps["props"]["has_subfolder"] != false) {
										$subfoldersData = [];
										$subfoldersData["folders"]["item"] = [];
										$this->getSubFolders($folder, $store, $properties, $subfoldersData);

										$storeData["folders"]["item"] = array_merge($storeData["folders"]["item"], $subfoldersData["folders"]["item"]);
									}
								}
								else {
									$folderProps = mapi_getprops($folder, $properties);
									$tempFolderProps = $this->setFolder($folderProps);
									// We don't load subfolders, this means the user isn't allowed
									// to create subfolders, as they should normally be hidden immediately.
									$tempFolderProps["props"]["access"] = ($tempFolderProps["props"]["access"] & ~MAPI_ACCESS_CREATE_HIERARCHY);
									// We don't load subfolders, so force the 'has_subfolder' property
									// to be false, so the UI will not consider loading subfolders.
									$tempFolderProps["props"]["has_subfolder"] = false;
									array_push($storeData["folders"]["item"], $tempFolderProps);
								}
							}
						}
					}
				}
				array_push($data["item"], $storeData);
			}
		}

		return $data;
	}

	/**
	 * Helper function to get the subfolders of a Personal Store.
	 *
	 * @param object $folder        mapi Folder Object
	 * @param object $store         Message Store Object
	 * @param array  $properties    MAPI property mappings for folders
	 * @param array  $storeData     Reference to an array. The folder properties are added to this array.
	 * @param mixed  $parentEntryid
	 */
	public function getSubFolders($folder, $store, $properties, &$storeData, $parentEntryid = false) {
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

		$hierarchyTable = mapi_folder_gethierarchytable($folder, CONVENIENT_DEPTH | MAPI_DEFERRED_ERRORS);
		mapi_table_restrict($hierarchyTable, $restriction, TBL_BATCH);

		// Also request PR_DEPTH
		$columns = array_merge($properties, [PR_DEPTH]);

		mapi_table_setcolumns($hierarchyTable, $columns);
		$columns = null;

		// Load the hierarchy in bulks
		$rows = mapi_table_queryrows($hierarchyTable, $columns, 0, 0x7FFFFFFF);

		foreach ($rows as $subfolder) {
			if ($parentEntryid !== false && isset($subfolder[PR_DEPTH]) && $subfolder[PR_DEPTH] === 1) {
				$subfolder[PR_PARENT_ENTRYID] = $parentEntryid;
			}
			array_push($storeData["folders"]["item"], $this->setFolder($subfolder));
		}
	}

	/**
	 * Convert MAPI properties into useful XML properties for a folder.
	 *
	 * @param array $folderProps Properties of a folder
	 *
	 * @return array List of properties of a folder
	 *
	 * @todo The name of this function is misleading because it doesn't 'set' anything, it just reads some properties.
	 */
	public function setFolder($folderProps) {
		$props = [
			// Identification properties
			"entryid" => bin2hex((string) $folderProps[PR_ENTRYID]),
			"parent_entryid" => bin2hex((string) $folderProps[PR_PARENT_ENTRYID]),
			"store_entryid" => bin2hex((string) $folderProps[PR_STORE_ENTRYID]),
			// Scalar properties
			"props" => [
				"display_name" => $folderProps[PR_DISPLAY_NAME],
				"object_type" => $folderProps[PR_OBJECT_TYPE] ?? MAPI_FOLDER, // FIXME: Why isn't this always set?
				"content_count" => $folderProps[PR_CONTENT_COUNT] ?? 0,
				"content_unread" => $folderProps[PR_CONTENT_UNREAD] ?? 0,
				"has_subfolder" => $folderProps[PR_SUBFOLDERS] ?? false,
				"container_class" => $folderProps[PR_CONTAINER_CLASS] ?? "IPF.Note",
				"access" => $folderProps[PR_ACCESS],
				"rights" => $folderProps[PR_RIGHTS] ?? ecRightsNone,
				"assoc_content_count" => $folderProps[PR_ASSOC_CONTENT_COUNT] ?? 0,
			],
		];

		$this->setExtendedFolderFlags($folderProps, $props);

		return $props;
	}

	/**
	 * Function is used to retrieve the favorites and search folders from
	 * respective favorites(IPM.Microsoft.WunderBar.Link) and search (IPM.Microsoft.WunderBar.SFInfo)
	 * link messages which belongs to associated contains table of IPM_COMMON_VIEWS folder.
	 *
	 * @param object $commonViewFolder MAPI Folder Object in which the favorites link messages lives
	 * @param array  $storeData        Reference to an array. The favorites folder properties are added to this array.
	 */
	public function getFavoritesFolders($commonViewFolder, &$storeData) {
		$table = mapi_folder_getcontentstable($commonViewFolder, MAPI_ASSOCIATED);

		$restriction = [RES_OR,
			[
				[RES_PROPERTY,
					[
						RELOP => RELOP_EQ,
						ULPROPTAG => PR_MESSAGE_CLASS,
						VALUE => [PR_MESSAGE_CLASS => "IPM.Microsoft.WunderBar.Link"],
					],
				],
				[RES_PROPERTY,
					[
						RELOP => RELOP_EQ,
						ULPROPTAG => PR_MESSAGE_CLASS,
						VALUE => [PR_MESSAGE_CLASS => "IPM.Microsoft.WunderBar.SFInfo"],
					],
				],
			],
		];

		// Get hierarchy table from all FINDERS_ROOT folders of
		// all message stores.
		$stores = $GLOBALS["mapisession"]->getAllMessageStores();
		$finderHierarchyTables = [];
		foreach ($stores as $entryid => $store) {
			$props = mapi_getprops($store, [PR_DEFAULT_STORE, PR_FINDER_ENTRYID]);
			if (!$props[PR_DEFAULT_STORE]) {
				continue;
			}

			try {
				$finderFolder = mapi_msgstore_openentry($store, $props[PR_FINDER_ENTRYID]);
				$hierarchyTable = mapi_folder_gethierarchytable($finderFolder, MAPI_DEFERRED_ERRORS);
				$finderHierarchyTables[$props[PR_FINDER_ENTRYID]] = $hierarchyTable;
			}
			catch (MAPIException $e) {
				$e->setHandled();
				$props = mapi_getprops($store, [PR_DISPLAY_NAME]);
				error_log(sprintf(
					"Unable to open FINDER_ROOT for store \"%s\": %s (%s)",
					$props[PR_DISPLAY_NAME],
					mapi_strerror($e->getCode()),
					get_mapi_error_name($e->getCode())
				));
			}
		}

		$rows = mapi_table_queryallrows($table, $GLOBALS["properties"]->getFavoritesFolderProperties(), $restriction);
		$faultyLinkMsg = [];
		foreach ($rows as $row) {
			if (isset($row[PR_WLINK_TYPE]) && $row[PR_WLINK_TYPE] > wblSharedFolder) {
				continue;
			}

			try {
				if ($row[PR_MESSAGE_CLASS] === "IPM.Microsoft.WunderBar.Link") {
					// Find faulty link messages which does not linked to any message. if link message
					// does not contains store entryid in which actual message is located then it consider as
					// faulty link message.
					if (isset($row[PR_WLINK_STORE_ENTRYID]) && empty($row[PR_WLINK_STORE_ENTRYID]) ||
						!isset($row[PR_WLINK_STORE_ENTRYID])) {
						// Outlook apparently doesn't set PR_WLINK_STORE_ENTRYID
						// for with free/busy permission only opened shared calendars,
						// so do not remove them from the IPM_COMMON_VIEWS
						if ((isset($row[PR_WLINK_SECTION]) && $row[PR_WLINK_SECTION] != wbsidCalendar) ||
							!isset($row[PR_WLINK_SECTION])) {
							array_push($faultyLinkMsg, $row[PR_ENTRYID]);
						}

						continue;
					}
					$props = $this->getFavoriteLinkedFolderProps($row);
					if (empty($props)) {
						continue;
					}
				}
				elseif ($row[PR_MESSAGE_CLASS] === "IPM.Microsoft.WunderBar.SFInfo") {
					$props = $this->getFavoritesLinkedSearchFolderProps($row[PR_WB_SF_ID], $finderHierarchyTables);
					if (empty($props)) {
						continue;
					}
				}
			}
			catch (MAPIException) {
				continue;
			}

			array_push($storeData['favorites']['item'], $this->setFavoritesFolder($props));
		}

		if (!empty($faultyLinkMsg)) {
			// remove faulty link messages from common view folder.
			mapi_folder_deletemessages($commonViewFolder, $faultyLinkMsg);
		}
	}

	/**
	 * Function which checks whether given linked Message is faulty or not.
	 * It will store faulty linked messages in given &$faultyLinkMsg array.
	 * Returns true if linked message of favorite item is faulty.
	 *
	 * @param array  &$faultyLinkMsg   reference in which faulty linked messages will be stored
	 * @param array  $allMessageStores Associative array with entryid -> mapistore of all open stores (private, public, delegate)
	 * @param object $linkedMessage    link message which belongs to associated contains table of IPM_COMMON_VIEWS folder
	 *
	 * @return true if linked message of favorite item is faulty or false
	 */
	public function checkFaultyFavoritesLinkedFolder(&$faultyLinkMsg, $allMessageStores, $linkedMessage) {
		// Find faulty link messages which does not linked to any message. if link message
		// does not contains store entryid in which actual message is located then it consider as
		// faulty link message.
		if (isset($linkedMessage[PR_WLINK_STORE_ENTRYID]) && empty($linkedMessage[PR_WLINK_STORE_ENTRYID])) {
			array_push($faultyLinkMsg, $linkedMessage[PR_ENTRYID]);

			return true;
		}

		// Check if store of a favorite Item does not exist in Hierarchy then
		// delete link message of that favorite item.
		// i.e. If a user is unhooked then remove its favorite items.
		$storeExist = array_key_exists($linkedMessage[PR_WLINK_STORE_ENTRYID], $allMessageStores);
		if (!$storeExist) {
			array_push($faultyLinkMsg, $linkedMessage[PR_ENTRYID]);

			return true;
		}

		return false;
	}

	/**
	 * Function which get the favorites marked folders from favorites link message
	 * which belongs to associated contains table of IPM_COMMON_VIEWS folder.
	 *
	 * @param array $linkMessageProps properties of link message which belongs to
	 *                                associated contains table of IPM_COMMON_VIEWS folder
	 *
	 * @return array List of properties of a folder
	 */
	public function getFavoriteLinkedFolderProps($linkMessageProps) {
		// In webapp we use IPM_SUBTREE as root folder for the Hierarchy but OL is use IMsgStore as a
		// Root folder. OL never mark favorites to IPM_SUBTREE. So to make favorites compatible with OL
		// we need this check.
		// Here we check PR_WLINK_STORE_ENTRYID and PR_WLINK_ENTRYID is same. Which same only in one case
		// where some user has mark favorites to root(Inbox-<user name>) folder from OL. So here if condition
		// gets true we get the IPM_SUBTREE and send it to response as favorites folder to webapp.
		try {
			if ($GLOBALS['entryid']->compareEntryIds($linkMessageProps[PR_WLINK_STORE_ENTRYID], $linkMessageProps[PR_WLINK_ENTRYID])) {
				$storeObj = $GLOBALS["mapisession"]->openMessageStore($linkMessageProps[PR_WLINK_STORE_ENTRYID]);
				$subTreeEntryid = mapi_getprops($storeObj, [PR_IPM_SUBTREE_ENTRYID]);
				$folderObj = mapi_msgstore_openentry($storeObj, $subTreeEntryid[PR_IPM_SUBTREE_ENTRYID]);
			}
			else {
				$storeObj = $GLOBALS["mapisession"]->openMessageStore($linkMessageProps[PR_WLINK_STORE_ENTRYID]);
				if (!is_resource($storeObj)) {
					return false;
				}
				$folderObj = mapi_msgstore_openentry($storeObj, $linkMessageProps[PR_WLINK_ENTRYID]);
			}

			return mapi_getprops($folderObj, $GLOBALS["properties"]->getFavoritesFolderProperties());
		}
		catch (Exception) {
			// in some cases error_log was causing an endless loop, so disable it for now
			// error_log($e);
		}

		return false;
	}

	/**
	 * Function which retrieve the search folder from FINDERS_ROOT folder of all open
	 * message store.
	 *
	 * @param string $searchFolderId        contains a GUID that identifies the search folder.
	 *                                      The value of this property MUST NOT change.
	 * @param array  $finderHierarchyTables hierarchy tables which belongs to FINDERS_ROOT
	 *                                      folder of message stores
	 *
	 * @return array list of search folder properties
	 */
	public function getFavoritesLinkedSearchFolderProps($searchFolderId, $finderHierarchyTables) {
		$restriction = [RES_EXIST,
			[
				ULPROPTAG => PR_EXTENDED_FOLDER_FLAGS,
			],
		];

		foreach ($finderHierarchyTables as $finderEntryid => $hierarchyTable) {
			$rows = mapi_table_queryallrows($hierarchyTable, $GLOBALS["properties"]->getFavoritesFolderProperties(), $restriction);
			foreach ($rows as $row) {
				$flags = unpack("H2ExtendedFlags-Id/H2ExtendedFlags-Cb/H8ExtendedFlags-Data/H2SearchFolderTag-Id/H2SearchFolderTag-Cb/H8SearchFolderTag-Data/H2SearchFolderId-Id/H2SearchFolderId-Cb/H32SearchFolderId-Data", (string) $row[PR_EXTENDED_FOLDER_FLAGS]);
				if ($flags["SearchFolderId-Data"] === bin2hex($searchFolderId)) {
					return $row;
				}
			}
		}
	}

	/**
	 * Create link messages for default favorites(Inbox and Sent Items) folders in associated contains table of IPM_COMMON_VIEWS folder
	 * and remove all other link message from the same.
	 *
	 * @param string $commonViewFolderEntryid IPM_COMMON_VIEWS folder entryid
	 * @param object $store                   Message Store Object
	 * @param array  $storeData               the store data which use to create restriction
	 */
	public function setDefaultFavoritesFolder($commonViewFolderEntryid, $store, $storeData) {
		if ($GLOBALS["settings"]->get("zarafa/v1/contexts/hierarchy/show_default_favorites") !== false) {
			$commonViewFolder = mapi_msgstore_openentry($store, $commonViewFolderEntryid);

			$inboxFolderEntryid = hex2bin((string) $storeData["props"]["default_folder_inbox"]);
			$sentFolderEntryid = hex2bin((string) $storeData["props"]["default_folder_sent"]);

			$table = mapi_folder_getcontentstable($commonViewFolder, MAPI_ASSOCIATED);

			// Restriction for get all link message(IPM.Microsoft.WunderBar.Link)
			// and search link message (IPM.Microsoft.WunderBar.SFInfo) from
			// Associated contains table of IPM_COMMON_VIEWS folder.
			$findLinkMsgRestriction = [RES_OR,
				[
					[RES_PROPERTY,
						[
							RELOP => RELOP_EQ,
							ULPROPTAG => PR_MESSAGE_CLASS,
							VALUE => [PR_MESSAGE_CLASS => "IPM.Microsoft.WunderBar.Link"],
						],
					],
					[RES_PROPERTY,
						[
							RELOP => RELOP_EQ,
							ULPROPTAG => PR_MESSAGE_CLASS,
							VALUE => [PR_MESSAGE_CLASS => "IPM.Microsoft.WunderBar.SFInfo"],
						],
					],
				],
			];

			// Restriction for find Inbox and/or Sent folder link message from
			// Associated contains table of IPM_COMMON_VIEWS folder.
			$findInboxOrSentLinkMessage = [RES_OR,
				[
					[RES_PROPERTY,
						[
							RELOP => RELOP_EQ,
							ULPROPTAG => PR_WLINK_ENTRYID,
							VALUE => [PR_WLINK_ENTRYID => $inboxFolderEntryid],
						],
					],
					[RES_PROPERTY,
						[
							RELOP => RELOP_EQ,
							ULPROPTAG => PR_WLINK_ENTRYID,
							VALUE => [PR_WLINK_ENTRYID => $sentFolderEntryid],
						],
					],
				],
			];

			// Restriction to get all link messages except Inbox and Sent folder's link messages from
			// Associated contains table of IPM_COMMON_VIEWS folder, if exist in it.
			$restriction = [RES_AND,
				[
					$findLinkMsgRestriction,
					[RES_NOT,
						[
							$findInboxOrSentLinkMessage,
						],
					],
				],
			];

			$rows = mapi_table_queryallrows($table, [PR_ENTRYID], $restriction);
			if (!empty($rows)) {
				$deleteMessages = [];
				foreach ($rows as $row) {
					array_push($deleteMessages, $row[PR_ENTRYID]);
				}
				mapi_folder_deletemessages($commonViewFolder, $deleteMessages);
			}

			// We need to remove all search folder from FIND_ROOT(search root folder)
			// when reset setting was triggered because on reset setting we remove all
			// link messages from common view folder which are linked with either
			// favorites or search folder.
			$finderFolderEntryid = hex2bin((string) $storeData["props"]["finder_entryid"]);
			$finderFolder = mapi_msgstore_openentry($store, $finderFolderEntryid);
			$hierarchyTable = mapi_folder_gethierarchytable($finderFolder, MAPI_DEFERRED_ERRORS);
			$folders = mapi_table_queryallrows($hierarchyTable, [PR_ENTRYID]);
			foreach ($folders as $folder) {
				try {
					mapi_folder_deletefolder($finderFolder, $folder[PR_ENTRYID]);
				}
				catch (MAPIException $e) {
					$msg = "Problem in deleting search folder while reset settings. MAPI Error %s.";
					$formattedMsg = sprintf($msg, get_mapi_error_name($e->getCode()));
					error_log($formattedMsg);
					Log::Write(LOGLEVEL_ERROR, "Operations:setDefaultFavoritesFolder() " . $formattedMsg);
				}
			}
			// Restriction used to find only Inbox and Sent folder's link messages from
			// Associated contains table of IPM_COMMON_VIEWS folder, if exist in it.
			$restriction = [RES_AND,
				[
					$findLinkMsgRestriction,
					$findInboxOrSentLinkMessage,
				],
			];

			$rows = mapi_table_queryallrows($table, [PR_WLINK_ENTRYID], $restriction);

			// If Inbox and Sent folder's link messages are not exist then create the
			// link message for those in associated contains table of IPM_COMMON_VIEWS folder.
			if (empty($rows)) {
				$defaultFavFoldersKeys = ["inbox", "sent"];
				foreach ($defaultFavFoldersKeys as $folderKey) {
					$folderObj = $GLOBALS["mapisession"]->openMessage(hex2bin((string) $storeData["props"]["default_folder_" . $folderKey]));
					$props = mapi_getprops($folderObj, [PR_ENTRYID, PR_STORE_ENTRYID, PR_DISPLAY_NAME]);
					$this->createFavoritesLink($commonViewFolder, $props);
				}
			}
			elseif (count($rows) < 2) {
				// If rows count is less than 2 it means associated contains table of IPM_COMMON_VIEWS folder
				// can have either Inbox or Sent folder link message in it. So we have to create link message
				// for Inbox or Sent folder which ever not exist in associated contains table of IPM_COMMON_VIEWS folder
				// to maintain default favorites folder.
				$row = $rows[0];
				$wlinkEntryid = $row[PR_WLINK_ENTRYID];

				$isInboxFolder = $GLOBALS['entryid']->compareEntryIds($wlinkEntryid, $inboxFolderEntryid);

				if (!$isInboxFolder) {
					$folderObj = $GLOBALS["mapisession"]->openMessage($inboxFolderEntryid);
				}
				else {
					$folderObj = $GLOBALS["mapisession"]->openMessage($sentFolderEntryid);
				}

				$props = mapi_getprops($folderObj, [PR_ENTRYID, PR_STORE_ENTRYID, PR_DISPLAY_NAME]);
				$this->createFavoritesLink($commonViewFolder, $props);
			}
			$GLOBALS["settings"]->set("zarafa/v1/contexts/hierarchy/show_default_favorites", false, true);
		}
	}

	/**
	 * Create favorites link message (IPM.Microsoft.WunderBar.Link) or
	 * search link message ("IPM.Microsoft.WunderBar.SFInfo") in associated
	 * contains table of IPM_COMMON_VIEWS folder.
	 *
	 * @param object      $commonViewFolder MAPI Message Folder Object
	 * @param array       $folderProps      Properties of a folder
	 * @param bool|string $searchFolderId   search folder id which is used to identify the
	 *                                      linked search folder from search link message. by default it is false.
	 */
	public function createFavoritesLink($commonViewFolder, $folderProps, $searchFolderId = false) {
		if ($searchFolderId) {
			$props = [
				PR_MESSAGE_CLASS => "IPM.Microsoft.WunderBar.SFInfo",
				PR_WB_SF_ID => $searchFolderId,
				PR_WLINK_TYPE => wblSearchFolder,
			];
		}
		else {
			$defaultStoreEntryId = hex2bin((string) $GLOBALS['mapisession']->getDefaultMessageStoreEntryId());
			$props = [
				PR_MESSAGE_CLASS => "IPM.Microsoft.WunderBar.Link",
				PR_WLINK_ENTRYID => $folderProps[PR_ENTRYID],
				PR_WLINK_STORE_ENTRYID => $folderProps[PR_STORE_ENTRYID],
				PR_WLINK_TYPE => $GLOBALS['entryid']->compareEntryIds($defaultStoreEntryId, $folderProps[PR_STORE_ENTRYID]) ? wblNormalFolder : wblSharedFolder,
			];
		}

		$favoritesLinkMsg = mapi_folder_createmessage($commonViewFolder, MAPI_ASSOCIATED);
		mapi_setprops($favoritesLinkMsg, $props);
		mapi_savechanges($favoritesLinkMsg);
	}

	/**
	 * Convert MAPI properties into useful and human readable string for favorites folder.
	 *
	 * @param array $folderProps Properties of a folder
	 *
	 * @return array List of properties of a folder
	 */
	public function setFavoritesFolder($folderProps) {
		$props = $this->setFolder($folderProps);
		// Add and Make isFavorites to true, this allows the client to properly
		// indicate to the user that this is a favorites item/folder.
		$props["props"]["isFavorites"] = true;
		$props["props"]["folder_type"] = $folderProps[PR_FOLDER_TYPE];

		return $props;
	}

	/**
	 * Fetches extended flags for folder. If PR_EXTENDED_FLAGS is not set then we assume that client
	 * should handle which property to display.
	 *
	 * @param array $folderProps Properties of a folder
	 * @param array $props       properties in which flags should be set
	 */
	public function setExtendedFolderFlags($folderProps, &$props) {
		if (isset($folderProps[PR_EXTENDED_FOLDER_FLAGS])) {
			$flags = unpack("Cid/Cconst/Cflags", $folderProps[PR_EXTENDED_FOLDER_FLAGS]);

			// ID property is '1' this means 'Data' property contains extended flags
			if ($flags["id"] == 1) {
				$props["props"]["extended_flags"] = $flags["flags"];
			}
		}
	}

	/**
	 * Used to update the storeData with a folder and properties that will
	 * inform the user that the store could not be opened.
	 *
	 * @param array  &$storeData    The store data which will be updated
	 * @param string $folderType    The foldertype which was attempted to be loaded
	 * @param array  $folderEntryID The entryid of the which was attempted to be opened
	 */
	public function invalidateResponseStore(&$storeData, $folderType, $folderEntryID) {
		$folderName = "Folder";
		$containerClass = "IPF.Note";

		switch ($folderType) {
			case "all":
				$folderName = "IPM_SUBTREE";
				$containerClass = "IPF.Note";
				break;

			case "calendar":
				$folderName = _("Calendar");
				$containerClass = "IPF.Appointment";
				break;

			case "contact":
				$folderName = _("Contacts");
				$containerClass = "IPF.Contact";
				break;

			case "inbox":
				$folderName = _("Inbox");
				$containerClass = "IPF.Note";
				break;

			case "note":
				$folderName = _("Notes");
				$containerClass = "IPF.StickyNote";
				break;

			case "task":
				$folderName = _("Tasks");
				$containerClass = "IPF.Task";
				break;
		}

		// Insert a fake folder which will be shown to the user
		// to acknowledge that he has a shared store, but also
		// to indicate that he can't open it.
		$tempFolderProps = $this->setFolder([
			PR_ENTRYID => $folderEntryID,
			PR_PARENT_ENTRYID => hex2bin((string) $storeData["props"]["subtree_entryid"]),
			PR_STORE_ENTRYID => hex2bin((string) $storeData["store_entryid"]),
			PR_DISPLAY_NAME => $folderName,
			PR_OBJECT_TYPE => MAPI_FOLDER,
			PR_SUBFOLDERS => false,
			PR_CONTAINER_CLASS => $containerClass,
			PR_ACCESS => 0,
		]);

		// Mark the folder as unavailable, this allows the client to properly
		// indicate to the user that this is a fake entry.
		$tempFolderProps['props']['is_unavailable'] = true;

		array_push($storeData["folders"]["item"], $tempFolderProps);

		/* TRANSLATORS: This indicates that the opened folder belongs to a particular user,
		 * for example: 'Calendar of Holiday', in this case %1$s is 'Calendar' (the foldername)
		 * and %2$s is 'Holiday' (the username).
		 */
		$storeData["props"]["display_name"] = ($folderType === "all") ? $storeData["props"]["display_name"] : sprintf(_('%1$s of %2$s'), $folderName, $storeData["props"]["mailbox_owner_name"]);
		$storeData["props"]["subtree_entryid"] = $tempFolderProps["parent_entryid"];
		$storeData["props"]["folder_type"] = $folderType;
	}

	/**
	 * Used to update the storeData with a folder and properties that will function as a
	 * placeholder for the IPMSubtree that could not be opened.
	 *
	 * @param array &$storeData    The store data which will be updated
	 * @param array $folderEntryID The entryid of the which was attempted to be opened
	 */
	public function getDummyIPMSubtreeFolder(&$storeData, $folderEntryID) {
		// Insert a fake folder which will be shown to the user
		// to acknowledge that he has a shared store.
		$tempFolderProps = $this->setFolder([
			PR_ENTRYID => $folderEntryID,
			PR_PARENT_ENTRYID => hex2bin((string) $storeData["props"]["subtree_entryid"]),
			PR_STORE_ENTRYID => hex2bin((string) $storeData["store_entryid"]),
			PR_DISPLAY_NAME => "IPM_SUBTREE",
			PR_OBJECT_TYPE => MAPI_FOLDER,
			PR_SUBFOLDERS => true,
			PR_CONTAINER_CLASS => "IPF.Note",
			PR_ACCESS => 0,
		]);

		array_push($storeData["folders"]["item"], $tempFolderProps);
		$storeData["props"]["subtree_entryid"] = $tempFolderProps["parent_entryid"];
	}

	/**
	 * Create a MAPI folder.
	 *
	 * This function simply creates a MAPI folder at a specific location with a specific folder
	 * type.
	 *
	 * @param object $store         MAPI Message Store Object in which the folder lives
	 * @param string $parententryid The parent entryid in which the new folder should be created
	 * @param string $name          The name of the new folder
	 * @param string $type          The type of the folder (PR_CONTAINER_CLASS, so value should be 'IPM.Appointment', etc)
	 * @param array  $folderProps   reference to an array which will be filled with PR_ENTRYID and PR_STORE_ENTRYID of new folder
	 *
	 * @return bool true if action succeeded, false if not
	 */
	public function createFolder($store, $parententryid, $name, $type, &$folderProps) {
		$result = false;
		$folder = mapi_msgstore_openentry($store, $parententryid);

		if ($folder) {
			/**
			 * @TODO: If parent folder has any sub-folder with the same name than this will return
			 * MAPI_E_COLLISION error, so show this error to client and don't close the dialog.
			 */
			$new_folder = mapi_folder_createfolder($folder, $name);

			if ($new_folder) {
				mapi_setprops($new_folder, [PR_CONTAINER_CLASS => $type]);
				$result = true;

				$folderProps = mapi_getprops($new_folder, [PR_ENTRYID, PR_STORE_ENTRYID]);
			}
		}

		return $result;
	}

	/**
	 * Rename a folder.
	 *
	 * This function renames the specified folder. However, a conflict situation can arise
	 * if the specified folder name already exists. In this case, the folder name is postfixed with
	 * an ever-higher integer to create a unique folder name.
	 *
	 * @param object $store       MAPI Message Store Object
	 * @param string $entryid     The entryid of the folder to rename
	 * @param string $name        The new name of the folder
	 * @param array  $folderProps reference to an array which will be filled with PR_ENTRYID and PR_STORE_ENTRYID
	 *
	 * @return bool true if action succeeded, false if not
	 */
	public function renameFolder($store, $entryid, $name, &$folderProps) {
		$folder = mapi_msgstore_openentry($store, $entryid);
		if (!$folder) {
			return false;
		}
		$result = false;
		$folderProps = mapi_getprops($folder, [PR_ENTRYID, PR_STORE_ENTRYID, PR_DISPLAY_NAME]);

		/*
		 * If parent folder has any sub-folder with the same name than this will return
		 * MAPI_E_COLLISION error while renaming folder, so show this error to client,
		 * and revert changes in view.
		 */
		try {
			mapi_setprops($folder, [PR_DISPLAY_NAME => $name]);
			mapi_savechanges($folder);
			$result = true;
		}
		catch (MAPIException $e) {
			if ($e->getCode() == MAPI_E_COLLISION) {
				/*
				 * revert folder name to original one
				 * There is a bug in php-mapi that updates folder name in hierarchy table with null value
				 * so we need to revert those change by again setting the old folder name
				 * (ZCP-11586)
				 */
				mapi_setprops($folder, [PR_DISPLAY_NAME => $folderProps[PR_DISPLAY_NAME]]);
				mapi_savechanges($folder);
			}

			// rethrow exception so we will send error to client
			throw $e;
		}

		return $result;
	}

	/**
	 * Check if a folder is 'special'.
	 *
	 * All default MAPI folders such as 'inbox', 'outbox', etc have special permissions; you can not rename them for example. This
	 * function returns TRUE if the specified folder is 'special'.
	 *
	 * @param object $store   MAPI Message Store Object
	 * @param string $entryid The entryid of the folder
	 *
	 * @return bool true if folder is a special folder, false if not
	 */
	public function isSpecialFolder($store, $entryid) {
		$msgstore_props = mapi_getprops($store, [PR_MDB_PROVIDER]);

		// "special" folders don't exists in public store
		if ($msgstore_props[PR_MDB_PROVIDER] == ZARAFA_STORE_PUBLIC_GUID) {
			return false;
		}

		// Check for the Special folders which are provided on the store
		$msgstore_props = mapi_getprops($store, [
			PR_IPM_SUBTREE_ENTRYID,
			PR_IPM_OUTBOX_ENTRYID,
			PR_IPM_SENTMAIL_ENTRYID,
			PR_IPM_WASTEBASKET_ENTRYID,
			PR_IPM_PUBLIC_FOLDERS_ENTRYID,
			PR_IPM_FAVORITES_ENTRYID,
		]);

		if (array_search($entryid, $msgstore_props)) {
			return true;
		}

		// Check for the Special folders which are provided on the root folder
		$root = mapi_msgstore_openentry($store);
		$rootProps = mapi_getprops($root, [
			PR_IPM_APPOINTMENT_ENTRYID,
			PR_IPM_CONTACT_ENTRYID,
			PR_IPM_DRAFTS_ENTRYID,
			PR_IPM_JOURNAL_ENTRYID,
			PR_IPM_NOTE_ENTRYID,
			PR_IPM_TASK_ENTRYID,
			PR_ADDITIONAL_REN_ENTRYIDS,
		]);

		if (array_search($entryid, $rootProps)) {
			return true;
		}

		// The PR_ADDITIONAL_REN_ENTRYIDS are a bit special
		if (isset($rootProps[PR_ADDITIONAL_REN_ENTRYIDS]) && is_array($rootProps[PR_ADDITIONAL_REN_ENTRYIDS])) {
			if (array_search($entryid, $rootProps[PR_ADDITIONAL_REN_ENTRYIDS])) {
				return true;
			}
		}

		// Check if the given folder is the inbox, note that we are unsure
		// if we have permissions on that folder, so we need a try catch.
		try {
			$inbox = mapi_msgstore_getreceivefolder($store);
			$props = mapi_getprops($inbox, [PR_ENTRYID]);

			if ($props[PR_ENTRYID] == $entryid) {
				return true;
			}
		}
		catch (MAPIException $e) {
			if ($e->getCode() !== MAPI_E_NO_ACCESS) {
				throw $e;
			}
		}

		return false;
	}

	/**
	 * Delete a folder.
	 *
	 * Deleting a folder normally just moves the folder to the wastebasket, which is what this function does. However,
	 * if the folder was already in the wastebasket, then the folder is really deleted.
	 *
	 * @param object $store         MAPI Message Store Object
	 * @param string $parententryid The parent in which the folder should be deleted
	 * @param string $entryid       The entryid of the folder which will be deleted
	 * @param array  $folderProps   reference to an array which will be filled with PR_ENTRYID, PR_STORE_ENTRYID of the deleted object
	 * @param bool   $softDelete    flag for indicating that folder should be soft deleted which can be recovered from
	 *                              restore deleted items
	 * @param bool   $hardDelete    flag for indicating that folder should be hard deleted from system and can not be
	 *                              recovered from restore soft deleted items
	 *
	 * @return bool true if action succeeded, false if not
	 *
	 * @todo subfolders of folders in the wastebasket should also be hard-deleted
	 */
	public function deleteFolder($store, $parententryid, $entryid, &$folderProps, $softDelete = false, $hardDelete = false) {
		$result = false;
		$msgprops = mapi_getprops($store, [PR_IPM_WASTEBASKET_ENTRYID]);
		$folder = mapi_msgstore_openentry($store, $parententryid);

		if ($folder && !$this->isSpecialFolder($store, $entryid)) {
			if ($hardDelete === true) {
				// hard delete the message if requested
				// beware that folder can not be recovered after this and will be deleted from system entirely
				if (mapi_folder_deletefolder($folder, $entryid, DEL_MESSAGES | DEL_FOLDERS | DELETE_HARD_DELETE)) {
					$result = true;

					// if exists, also delete settings made for this folder (client don't need an update for this)
					$GLOBALS["settings"]->delete("zarafa/v1/state/folders/" . bin2hex($entryid));
				}
			}
			else {
				if (isset($msgprops[PR_IPM_WASTEBASKET_ENTRYID])) {
					// TODO: check if not only $parententryid=wastebasket, but also the parents of that parent...
					// if folder is already in wastebasket or softDelete is requested then delete the message
					if ($msgprops[PR_IPM_WASTEBASKET_ENTRYID] == $parententryid || $softDelete === true) {
						if (mapi_folder_deletefolder($folder, $entryid, DEL_MESSAGES | DEL_FOLDERS)) {
							$result = true;

							// if exists, also delete settings made for this folder (client don't need an update for this)
							$GLOBALS["settings"]->delete("zarafa/v1/state/folders/" . bin2hex($entryid));
						}
					}
					else {
						// move the folder to wastebasket
						$wastebasket = mapi_msgstore_openentry($store, $msgprops[PR_IPM_WASTEBASKET_ENTRYID]);

						$deleted_folder = mapi_msgstore_openentry($store, $entryid);
						$props = mapi_getprops($deleted_folder, [PR_DISPLAY_NAME]);

						try {
							/*
							 * To decrease overload of checking for conflicting folder names on modification of every folder
							 * we should first try to copy folder and if it returns MAPI_E_COLLISION then
							 * only we should check for the conflicting folder names and generate a new name
							 * and copy folder with the generated name.
							 */
							mapi_folder_copyfolder($folder, $entryid, $wastebasket, $props[PR_DISPLAY_NAME], FOLDER_MOVE);
							$folderProps = mapi_getprops($deleted_folder, [PR_ENTRYID, PR_STORE_ENTRYID]);
							$result = true;
						}
						catch (MAPIException $e) {
							if ($e->getCode() == MAPI_E_COLLISION) {
								$foldername = $this->checkFolderNameConflict($store, $wastebasket, $props[PR_DISPLAY_NAME]);

								mapi_folder_copyfolder($folder, $entryid, $wastebasket, $foldername, FOLDER_MOVE);
								$folderProps = mapi_getprops($deleted_folder, [PR_ENTRYID, PR_STORE_ENTRYID]);
								$result = true;
							}
							else {
								// all other errors should be propagated to higher level exception handlers
								throw $e;
							}
						}
					}
				}
				else {
					if (mapi_folder_deletefolder($folder, $entryid, DEL_MESSAGES | DEL_FOLDERS)) {
						$result = true;

						// if exists, also delete settings made for this folder (client don't need an update for this)
						$GLOBALS["settings"]->delete("zarafa/v1/state/folders/" . bin2hex($entryid));
					}
				}
			}
		}

		return $result;
	}

	/**
	 * Empty folder.
	 *
	 * Removes all items from a folder. This is a real delete, not a move.
	 *
	 * @param object $store           MAPI Message Store Object
	 * @param string $entryid         The entryid of the folder which will be emptied
	 * @param array  $folderProps     reference to an array which will be filled with PR_ENTRYID and PR_STORE_ENTRYID of the emptied folder
	 * @param bool   $hardDelete      flag to indicate if messages will be hard deleted and can not be recoved using restore soft deleted items
	 * @param bool   $emptySubFolders true to remove all messages with child folders of selected folder else false will
	 *                                remove only message of selected folder
	 *
	 * @return bool true if action succeeded, false if not
	 */
	public function emptyFolder($store, $entryid, &$folderProps, $hardDelete = false, $emptySubFolders = true) {
		$result = false;
		$folder = mapi_msgstore_openentry($store, $entryid);

		if ($folder) {
			$flag = DEL_ASSOCIATED;

			if ($hardDelete) {
				$flag |= DELETE_HARD_DELETE;
			}

			if ($emptySubFolders) {
				$result = mapi_folder_emptyfolder($folder, $flag);
			}
			else {
				// Delete all items of selected folder without
				// removing child folder and it's content.
				// FIXME: it is effecting performance because mapi_folder_emptyfolder function not provide facility to
				// remove only selected folder items without touching child folder and it's items.
				// for more check KC-1268
				$table = mapi_folder_getcontentstable($folder, MAPI_DEFERRED_ERRORS);
				$rows = mapi_table_queryallrows($table, [PR_ENTRYID]);
				$messages = [];
				foreach ($rows as $row) {
					array_push($messages, $row[PR_ENTRYID]);
				}
				$result = mapi_folder_deletemessages($folder, $messages, $flag);
			}

			$folderProps = mapi_getprops($folder, [PR_ENTRYID, PR_STORE_ENTRYID]);
			$result = true;
		}

		return $result;
	}

	/**
	 * Copy or move a folder.
	 *
	 * @param object $store               MAPI Message Store Object
	 * @param string $parentfolderentryid The parent entryid of the folder which will be copied or moved
	 * @param string $sourcefolderentryid The entryid of the folder which will be copied or moved
	 * @param string $destfolderentryid   The entryid of the folder which the folder will be copied or moved to
	 * @param bool   $moveFolder          true - move folder, false - copy folder
	 * @param array  $folderProps         reference to an array which will be filled with entryids
	 * @param mixed  $deststore
	 *
	 * @return bool true if action succeeded, false if not
	 */
	public function copyFolder($store, $parentfolderentryid, $sourcefolderentryid, $destfolderentryid, $deststore, $moveFolder, &$folderProps) {
		$result = false;
		$sourceparentfolder = mapi_msgstore_openentry($store, $parentfolderentryid);
		$destfolder = mapi_msgstore_openentry($deststore, $destfolderentryid);
		if (!$this->isSpecialFolder($store, $sourcefolderentryid) && $sourceparentfolder && $destfolder && $deststore) {
			$folder = mapi_msgstore_openentry($store, $sourcefolderentryid);
			$props = mapi_getprops($folder, [PR_DISPLAY_NAME]);

			try {
				/*
				  * To decrease overload of checking for conflicting folder names on modification of every folder
				  * we should first try to copy/move folder and if it returns MAPI_E_COLLISION then
				  * only we should check for the conflicting folder names and generate a new name
				  * and copy/move folder with the generated name.
				  */
				if ($moveFolder) {
					mapi_folder_copyfolder($sourceparentfolder, $sourcefolderentryid, $destfolder, $props[PR_DISPLAY_NAME], FOLDER_MOVE);
					$folderProps = mapi_getprops($folder, [PR_ENTRYID, PR_STORE_ENTRYID]);
					// In some cases PR_PARENT_ENTRYID is not available in mapi_getprops, add it manually
					$folderProps[PR_PARENT_ENTRYID] = $destfolderentryid;
					$result = true;
				}
				else {
					mapi_folder_copyfolder($sourceparentfolder, $sourcefolderentryid, $destfolder, $props[PR_DISPLAY_NAME], COPY_SUBFOLDERS);
					$result = true;
				}
			}
			catch (MAPIException $e) {
				if ($e->getCode() == MAPI_E_COLLISION) {
					$foldername = $this->checkFolderNameConflict($deststore, $destfolder, $props[PR_DISPLAY_NAME]);
					if ($moveFolder) {
						mapi_folder_copyfolder($sourceparentfolder, $sourcefolderentryid, $destfolder, $foldername, FOLDER_MOVE);
						$folderProps = mapi_getprops($folder, [PR_ENTRYID, PR_STORE_ENTRYID]);
						$result = true;
					}
					else {
						mapi_folder_copyfolder($sourceparentfolder, $sourcefolderentryid, $destfolder, $foldername, COPY_SUBFOLDERS);
						$result = true;
					}
				}
				else {
					// all other errors should be propagated to higher level exception handlers
					throw $e;
				}
			}
		}

		return $result;
	}

	/**
	 * Read MAPI table.
	 *
	 * This function performs various operations to open, setup, and read all rows from a MAPI table.
	 *
	 * The output from this function is an XML array structure which can be sent directly to XML serialisation.
	 *
	 * @param object $store        MAPI Message Store Object
	 * @param string $entryid      The entryid of the folder to read the table from
	 * @param array  $properties   The set of properties which will be read
	 * @param array  $sort         The set properties which the table will be sort on (formatted as a MAPI sort order)
	 * @param int    $start        Starting row at which to start reading rows
	 * @param int    $rowcount     Number of rows which should be read
	 * @param array  $restriction  Table restriction to apply to the table (formatted as MAPI restriction)
	 * @param mixed  $getHierarchy
	 * @param mixed  $flags
	 *
	 * @return array XML array structure with row data
	 */
	public function getTable($store, $entryid, $properties, $sort, $start, $rowcount = false, $restriction = false, $getHierarchy = false, $flags = MAPI_DEFERRED_ERRORS) {
		$data = [];
		$folder = mapi_msgstore_openentry($store, $entryid);

		if (!$folder) {
			return $data;
		}

		$table = $getHierarchy ? mapi_folder_gethierarchytable($folder, $flags) : mapi_folder_getcontentstable($folder, $flags);

		if (!$rowcount) {
			$rowcount = $GLOBALS['settings']->get('zarafa/v1/main/page_size', 50);
		}

		if (is_array($restriction)) {
			mapi_table_restrict($table, $restriction, TBL_BATCH);
		}

		if (is_array($sort) && !empty($sort)) {
			/*
			 * If the sort array contains the PR_SUBJECT column we should change this to
			 * PR_NORMALIZED_SUBJECT to make sure that when sorting on subjects: "sweet" and
			 * "RE: sweet", the first one is displayed before the latter one. If the subject
			 * is used for sorting the PR_MESSAGE_DELIVERY_TIME must be added as well as
			 * Outlook behaves the same way in this case.
			 */
			if (isset($sort[PR_SUBJECT])) {
				$sortReplace = [];
				foreach ($sort as $key => $value) {
					if ($key == PR_SUBJECT) {
						$sortReplace[PR_NORMALIZED_SUBJECT] = $value;
						$sortReplace[PR_MESSAGE_DELIVERY_TIME] = TABLE_SORT_DESCEND;
					}
					else {
						$sortReplace[$key] = $value;
					}
				}
				$sort = $sortReplace;
			}

			mapi_table_sort($table, $sort, TBL_BATCH);
		}

		$data["item"] = [];

		$rows = mapi_table_queryrows($table, $properties, $start, $rowcount);
		$actualCount = count($rows);
		foreach ($rows as $row) {
			$itemData = Conversion::mapMAPI2XML($properties, $row);

			// For ZARAFA type users the email_address properties are filled with the username
			// Here we will copy that property to the *_username property for consistency with
			// the getMessageProps() function
			// We will not retrieve the real email address (like the getMessageProps function does)
			// for all items because that would be a performance decrease!
			if (isset($itemData['props']["sent_representing_email_address"])) {
				$itemData['props']["sent_representing_username"] = $itemData['props']["sent_representing_email_address"];
			}
			if (isset($itemData['props']["sender_email_address"])) {
				$itemData['props']["sender_username"] = $itemData['props']["sender_email_address"];
			}
			if (isset($itemData['props']["received_by_email_address"])) {
				$itemData['props']["received_by_username"] = $itemData['props']["received_by_email_address"];
			}

			array_push($data["item"], $itemData);
		}

		// Update the page information
		$data["page"] = [];
		$data["page"]["start"] = $start;
		$data["page"]["rowcount"] = $rowcount;
		$data["page"]["totalrowcount"] = $start + $actualCount;
		if ($actualCount === $rowcount) {
			$data["page"]["totalrowcount"]++;
		}

		return $data;
	}

	/**
	 * Returns TRUE of the MAPI message only has inline attachments.
	 *
	 * @param mapimessage $message The MAPI message object to check
	 *
	 * @return bool TRUE if the item contains only inline attachments, FALSE otherwise
	 *
	 * @deprecated This function is not used, because it is much too slow to run on all messages in your inbox
	 */
	public function hasOnlyInlineAttachments($message) {
		$attachmentTable = @mapi_message_getattachmenttable($message);
		if (!$attachmentTable) {
			return false;
		}

		$attachments = @mapi_table_queryallrows($attachmentTable, [PR_ATTACHMENT_HIDDEN]);
		if (empty($attachments)) {
			return false;
		}

		foreach ($attachments as $attachmentRow) {
			if (!isset($attachmentRow[PR_ATTACHMENT_HIDDEN]) || !$attachmentRow[PR_ATTACHMENT_HIDDEN]) {
				return false;
			}
		}

		return true;
	}

	/**
	 * Retrieve and convert body content of a message.
	 *
	 * This function performs the heavy lifting of decompressing RTF, converting
	 * code pages and extracting both the HTML and plain text bodies. It can be
	 * called independently to lazily fetch body data when required.
	 *
	 * @param object $message   The MAPI Message Object
	 * @param bool   $html2text true - body will be converted from html to text,
	 *			    false - html body will be returned
	 *
	 * @return array associative array containing keys 'body', 'html_body' and 'isHTML'
	 */
	public function getMessageBody($message, $html2text = false) {
		$result = [
			'body' => '',
			'isHTML' => false,
		];

		if (!$message) {
			return $result;
		}

		$plaintext = $this->isPlainText($message);
		$tmpProps = mapi_getprops($message, [PR_BODY, PR_HTML]);

		if (empty($tmpProps[PR_HTML])) {
			$tmpProps = mapi_getprops($message, [PR_BODY, PR_RTF_COMPRESSED]);
			if (isset($tmpProps[PR_RTF_COMPRESSED])) {
				$tmpProps[PR_HTML] = mapi_decompressrtf($tmpProps[PR_RTF_COMPRESSED]);
			}
		}

		$htmlcontent = '';
		if (!$plaintext && isset($tmpProps[PR_HTML])) {
			$cpprops = mapi_message_getprops($message, [PR_INTERNET_CPID]);
			$codepage = $cpprops[PR_INTERNET_CPID] ?? 65001;
			$htmlcontent = Conversion::convertCodepageStringToUtf8($codepage, $tmpProps[PR_HTML]);
			if (!empty($htmlcontent)) {
				if ($html2text) {
					$htmlcontent = '';
				}
				else {
					$result['isHTML'] = true;
				}
			}

			$htmlcontent = trim($htmlcontent, "\0");
		}

		if (isset($tmpProps[PR_BODY])) {
			// only open property if it exists
			$result['body'] = trim((string) mapi_message_openproperty($message, PR_BODY), "\0");
		}
		elseif ($html2text && isset($tmpProps[PR_HTML])) {
			$result['body'] = strip_tags((string) $tmpProps[PR_HTML]);
		}

		if (!empty($htmlcontent)) {
			$result['html_body'] = $htmlcontent;
		}

		return $result;
	}

	/**
	 * Read message properties.
	 *
	 * Reads a message and returns the data as an XML array structure with all data from the message that is needed
	 * to show a message (for example in the preview pane)
	 *
	 * @param object $store      MAPI Message Store Object
	 * @param object $message    The MAPI Message Object
	 * @param array  $properties Mapping of properties that should be read
	 * @param bool   $html2text  true - body will be converted from html to text, false - html body will be returned
	 * @param bool   $loadBody   true - fetch body content, false - skip body retrieval
	 *
	 * @return array item properties
	 *
	 * @todo Function name is misleading as it doesn't just get message properties
	 */
	public function getMessageProps($store, $message, $properties, $html2text = false, $loadBody = false) {
		$props = [];

		if ($message) {
			$itemprops = mapi_getprops($message, $properties);

			/* If necessary stream the property, if it's > 8KB */
			if (isset($itemprops[PR_TRANSPORT_MESSAGE_HEADERS]) || propIsError(PR_TRANSPORT_MESSAGE_HEADERS, $itemprops) == MAPI_E_NOT_ENOUGH_MEMORY) {
				$itemprops[PR_TRANSPORT_MESSAGE_HEADERS] = mapi_openproperty($message, PR_TRANSPORT_MESSAGE_HEADERS);
			}

			$props = Conversion::mapMAPI2XML($properties, $itemprops);

			// Get actual SMTP address for sent_representing_email_address and received_by_email_address
			$smtpprops = mapi_getprops($message, [PR_SENT_REPRESENTING_ENTRYID, PR_RECEIVED_BY_ENTRYID, PR_SENDER_ENTRYID]);

			if (isset($smtpprops[PR_SENT_REPRESENTING_ENTRYID])) {
				try {
					$user = mapi_ab_openentry($GLOBALS['mapisession']->getAddressbook(true), $smtpprops[PR_SENT_REPRESENTING_ENTRYID]);
					if (isset($user)) {
						$user_props = mapi_getprops($user, [PR_EMS_AB_THUMBNAIL_PHOTO]);
						if (isset($user_props[PR_EMS_AB_THUMBNAIL_PHOTO])) {
							$props["props"]['thumbnail_photo'] = "data:image/jpeg;base64," . base64_encode((string) $user_props[PR_EMS_AB_THUMBNAIL_PHOTO]);
						}
					}
				}
				catch (MAPIException) {
					// do nothing
				}
			}

			/*
			 * Check that we have PR_SENT_REPRESENTING_ENTRYID for the item, and also
			 * Check that we have sent_representing_email_address property there in the message,
			 * but for contacts we are not using sent_representing_* properties so we are not
			 * getting it from the message. So basically this will be used for mail items only
			 */
			if (isset($smtpprops[PR_SENT_REPRESENTING_ENTRYID], $props["props"]["sent_representing_email_address"])) {
				$props["props"]["sent_representing_username"] = $props["props"]["sent_representing_email_address"];
				$sentRepresentingSearchKey = isset($props['props']['sent_representing_search_key']) ? hex2bin($props['props']['sent_representing_search_key']) : false;
				$props["props"]["sent_representing_email_address"] = $this->getEmailAddress($smtpprops[PR_SENT_REPRESENTING_ENTRYID], $sentRepresentingSearchKey);
			}

			if (isset($smtpprops[PR_SENDER_ENTRYID], $props["props"]["sender_email_address"])) {
				$props["props"]["sender_username"] = $props["props"]["sender_email_address"];
				$senderSearchKey = isset($props['props']['sender_search_key']) ? hex2bin($props['props']['sender_search_key']) : false;
				$props["props"]["sender_email_address"] = $this->getEmailAddress($smtpprops[PR_SENDER_ENTRYID], $senderSearchKey);
			}

			if (isset($smtpprops[PR_RECEIVED_BY_ENTRYID], $props["props"]["received_by_email_address"])) {
				$props["props"]["received_by_username"] = $props["props"]["received_by_email_address"];
				$receivedSearchKey = isset($props['props']['received_by_search_key']) ? hex2bin($props['props']['received_by_search_key']) : false;
				$props["props"]["received_by_email_address"] = $this->getEmailAddress($smtpprops[PR_RECEIVED_BY_ENTRYID], $receivedSearchKey);
			}

			$props['props']['isHTML'] = false;
			$htmlcontent = null;
			if ($loadBody) {
				$body = $this->getMessageBody($message, $html2text);
				$props['props'] = array_merge($props['props'], $body);
				$htmlcontent = $body['html_body'] ?? null;
			}

			// Get reply-to information, otherwise consider the sender to be the reply-to person.
			$props['reply-to'] = ['item' => []];
			$messageprops = mapi_getprops($message, [PR_REPLY_RECIPIENT_ENTRIES]);
			if (isset($messageprops[PR_REPLY_RECIPIENT_ENTRIES])) {
				$props['reply-to']['item'] = $this->readReplyRecipientEntry($messageprops[PR_REPLY_RECIPIENT_ENTRIES]);
			}
			if (!isset($messageprops[PR_REPLY_RECIPIENT_ENTRIES]) || count($props['reply-to']['item']) === 0) {
				if (isset($props['props']['sent_representing_email_address']) && !empty($props['props']['sent_representing_email_address'])) {
					$props['reply-to']['item'][] = [
						'rowid' => 0,
						'props' => [
							'entryid' => $props['props']['sent_representing_entryid'],
							'display_name' => $props['props']['sent_representing_name'],
							'smtp_address' => $props['props']['sent_representing_email_address'],
							'address_type' => $props['props']['sent_representing_address_type'],
							'object_type' => MAPI_MAILUSER,
							'search_key' => $props['props']['sent_representing_search_key'] ?? '',
						],
					];
				}
				elseif (!empty($props['props']['sender_email_address'])) {
					$props['reply-to']['item'][] = [
						'rowid' => 0,
						'props' => [
							'entryid' => $props['props']['sender_entryid'],
							'display_name' => $props['props']['sender_name'],
							'smtp_address' => $props['props']['sender_email_address'],
							'address_type' => $props['props']['sender_address_type'],
							'object_type' => MAPI_MAILUSER,
							'search_key' => $props['props']['sender_search_key'],
						],
					];
				}
			}

			// Get recipients
			$recipients = $GLOBALS["operations"]->getRecipientsInfo($message);
			if (!empty($recipients)) {
				$props["recipients"] = [
					"item" => $recipients,
				];
			}

			// Get attachments
			$attachments = $GLOBALS["operations"]->getAttachmentsInfo($message);
			if (!empty($attachments)) {
				$props["attachments"] = [
					"item" => $attachments,
				];
				$cid_found = false;
				foreach ($attachments as $attachment) {
					if (isset($attachment["props"]["cid"])) {
						$cid_found = true;
					}
				}
				if ($loadBody && $cid_found === true && $htmlcontent !== null) {
					preg_match_all('/src="cid:(.*)"/Uims', $htmlcontent, $matches);
					if (count($matches) > 0) {
						$search = [];
						$replace = [];
						foreach ($matches[1] as $match) {
							$idx = -1;
							foreach ($attachments as $key => $attachment) {
								if (isset($attachment["props"]["cid"]) &&
									strcasecmp($match, $attachment["props"]["cid"]) == 0) {
									$idx = $key;
									$num = $attachment["props"]["attach_num"];
								}
							}
							if ($idx == -1) {
								continue;
							}
							$attach = mapi_message_openattach($message, $num);
							if (empty($attach)) {
								continue;
							}
							$attachprop = mapi_getprops($attach, [PR_ATTACH_DATA_BIN, PR_ATTACH_MIME_TAG]);
							if (empty($attachprop) || !isset($attachprop[PR_ATTACH_DATA_BIN])) {
								continue;
							}
							if (!isset($attachprop[PR_ATTACH_MIME_TAG])) {
								$mime_tag = "text/plain";
							}
							else {
								$mime_tag = $attachprop[PR_ATTACH_MIME_TAG];
							}
							$search[] = "src=\"cid:{$match}\"";
							$replace[] = "src=\"data:{$mime_tag};base64," . base64_encode((string) $attachprop[PR_ATTACH_DATA_BIN]) . "\"";
							unset($props["attachments"]["item"][$idx]);
						}
						$props["attachments"]["item"] = array_values($props["attachments"]["item"]);
						$htmlcontent = str_replace($search, $replace, $htmlcontent);
						$props["props"]["html_body"] = $htmlcontent;
					}
				}
			}

			// for distlists, we need to get members data
			if (isset($props["props"]["oneoff_members"], $props["props"]["members"])) {
				// remove non-client props
				unset($props["props"]["members"], $props["props"]["oneoff_members"]);

				// get members
				$members = $GLOBALS["operations"]->getMembersFromDistributionList($store, $message, $properties);
				if (!empty($members)) {
					$props["members"] = [
						"item" => $members,
					];
				}
			}
		}

		return $props;
	}

	/**
	 * Get the email address either from entryid or search key. Function is helpful
	 * to retrieve the email address of already deleted contact which is use as a
	 * recipient in message.
	 *
	 * @param string      $entryId   the entryId of an item/recipient
	 * @param bool|string $searchKey then search key of an item/recipient
	 *
	 * @return string email address if found else return empty string
	 */
	public function getEmailAddress($entryId, $searchKey = false) {
		$emailAddress = $this->getEmailAddressFromEntryID($entryId);
		if (empty($emailAddress) && $searchKey !== false) {
			$emailAddress = $this->getEmailAddressFromSearchKey($searchKey);
		}

		return $emailAddress;
	}

	/**
	 * Get and convert properties of a message into an XML array structure.
	 *
	 * @param object $item       The MAPI Object
	 * @param array  $properties Mapping of properties that should be read
	 *
	 * @return array XML array structure
	 *
	 * @todo Function name is misleading, especially compared to getMessageProps()
	 */
	public function getProps($item, $properties) {
		$props = [];

		if ($item) {
			$itemprops = mapi_getprops($item, $properties);
			$props = Conversion::mapMAPI2XML($properties, $itemprops);
		}

		return $props;
	}

	/**
	 * Get embedded message data.
	 *
	 * Returns the same data as getMessageProps, but then for a specific sub/sub/sub message
	 * of a MAPI message.
	 *
	 * @param object $store         MAPI Message Store Object
	 * @param object $message       MAPI Message Object
	 * @param array  $properties    a set of properties which will be selected
	 * @param array  $parentMessage MAPI Message Object of parent
	 * @param array  $attach_num    a list of attachment numbers (aka 2,1 means 'attachment nr 1 of attachment nr 2')
	 *
	 * @return array item XML array structure of the embedded message
	 */
	public function getEmbeddedMessageProps($store, $message, $properties, $parentMessage, $attach_num) {
		$msgprops = mapi_getprops($message, [PR_MESSAGE_CLASS]);

		$html2text = match ($msgprops[PR_MESSAGE_CLASS]) {
			'IPM.Note' => false,
			default => true,
		};

		$props = $this->getMessageProps($store, $message, $properties, $html2text, true);

		// sub message will not be having entryid, so use parent's entryid
		$parentProps = mapi_getprops($parentMessage, [PR_ENTRYID, PR_PARENT_ENTRYID, PR_STORE_ENTRYID]);
		$props['entryid'] = bin2hex((string) $parentProps[PR_ENTRYID]);
		$props['parent_entryid'] = bin2hex((string) $parentProps[PR_PARENT_ENTRYID]);
		$props['store_entryid'] = bin2hex((string) $parentProps[PR_STORE_ENTRYID]);
		$props['attach_num'] = $attach_num;

		return $props;
	}

	/**
	 * Create a MAPI message.
	 *
	 * @param object $store         MAPI Message Store Object
	 * @param string $parententryid The entryid of the folder in which the new message is to be created
	 *
	 * @return mapimessage Created MAPI message resource
	 */
	public function createMessage($store, $parententryid) {
		$folder = mapi_msgstore_openentry($store, $parententryid);

		return mapi_folder_createmessage($folder);
	}

	/**
	 * Open a MAPI message.
	 *
	 * @param object $store       MAPI Message Store Object
	 * @param string $entryid     entryid of the message
	 * @param array  $attach_num  a list of attachment numbers (aka 2,1 means 'attachment nr 1 of attachment nr 2')
	 * @param bool   $parse_smime (optional) call parse_smime on the opened message or not
	 *
	 * @return object MAPI Message
	 */
	public function openMessage($store, $entryid, $attach_num = false, $parse_smime = false) {
		$message = mapi_msgstore_openentry($store, $entryid);

		// Needed for S/MIME messages with embedded message attachments
		if ($parse_smime) {
			parse_smime($store, $message);
		}

		if ($message && $attach_num) {
			for ($index = 0, $count = count($attach_num); $index < $count; ++$index) {
				// attach_num cannot have value of -1
				// if we get that then we are trying to open an embedded message which
				// is not present in the attachment table to parent message (because parent message is unsaved yet)
				// so return the message which is opened using entryid which will point to actual message which is
				// attached as embedded message
				if ($attach_num[$index] === -1) {
					return $message;
				}

				$attachment = mapi_message_openattach($message, $attach_num[$index]);

				if ($attachment) {
					$message = mapi_attach_openobj($attachment);
				}
				else {
					return false;
				}
			}
		}

		return $message;
	}

	/**
	 * Save a MAPI message.
	 *
	 * The to-be-saved message can be of any type, including e-mail items, appointments, contacts, etc. The message may be pre-existing
	 * or it may be a new message.
	 *
	 * The dialog_attachments parameter represents a unique ID which for the dialog in the client for which this function was called; This
	 * is used as follows; Whenever a user uploads an attachment, the attachment is stored in a temporary place on the server. At the same time,
	 * the temporary server location of the attachment is saved in the session information, accompanied by the $dialog_attachments unique ID. This
	 * way, when we save the message into MAPI, we know which attachment was previously uploaded ready for this message, because when the user saves
	 * the message, we pass the same $dialog_attachments ID as when we uploaded the file.
	 *
	 * @param object      $store                     MAPI Message Store Object
	 * @param binary      $entryid                   entryid of the message
	 * @param binary      $parententryid             Parent entryid of the message
	 * @param array       $props                     The MAPI properties to be saved
	 * @param array       $messageProps              reference to an array which will be filled with PR_ENTRYID and PR_STORE_ENTRYID of the saved message
	 * @param array       $recipients                XML array structure of recipients for the recipient table
	 * @param array       $attachments               attachments array containing unique check number which checks if attachments should be added
	 * @param array       $propertiesToDelete        Properties specified in this array are deleted from the MAPI message
	 * @param MAPIMessage $copyFromMessage           resource of the message from which we should
	 *                                               copy attachments and/or recipients to the current message
	 * @param bool        $copyAttachments           if set we copy all attachments from the $copyFromMessage
	 * @param bool        $copyRecipients            if set we copy all recipients from the $copyFromMessage
	 * @param bool        $copyInlineAttachmentsOnly if true then copy only inline attachments
	 * @param bool        $saveChanges               if true then save all change in mapi message
	 * @param bool        $send                      true if this function is called from submitMessage else false
	 * @param bool        $isPlainText               if true then message body will be generated using PR_BODY otherwise PR_HTML will be used in saveMessage() function
	 *
	 * @return mapimessage Saved MAPI message resource
	 */
	public function saveMessage($store, $entryid, $parententryid, $props, &$messageProps, $recipients = [], $attachments = [], $propertiesToDelete = [], $copyFromMessage = false, $copyAttachments = false, $copyRecipients = false, $copyInlineAttachmentsOnly = false, $saveChanges = true, $send = false, $isPlainText = false) {
		$message = false;

		// Check if an entryid is set, otherwise create a new message
		if ($entryid && !empty($entryid)) {
			$message = $this->openMessage($store, $entryid);
		}
		else {
			$message = $this->createMessage($store, $parententryid);
		}

		if ($message) {
			$property = false;
			$body = "";

			// Check if the body is set.
			if (isset($props[PR_BODY])) {
				$body = $props[PR_BODY];
				$property = PR_BODY;
				$bodyPropertiesToDelete = [PR_HTML, PR_RTF_COMPRESSED];

				if (isset($props[PR_HTML])) {
					$subject = '';
					if (isset($props[PR_SUBJECT])) {
						$subject = $props[PR_SUBJECT];
					// If subject is not updated we need to get it from the message
					}
					else {
						$subjectProp = mapi_getprops($message, [PR_SUBJECT]);
						if (isset($subjectProp[PR_SUBJECT])) {
							$subject = $subjectProp[PR_SUBJECT];
						}
					}
					$body = $this->generateBodyHTML($isPlainText ? $props[PR_BODY] : $props[PR_HTML], $subject);
					$property = PR_HTML;
					$bodyPropertiesToDelete = [PR_BODY, PR_RTF_COMPRESSED];
					unset($props[PR_HTML]);
				}
				unset($props[PR_BODY]);

				$propertiesToDelete = array_unique(array_merge($propertiesToDelete, $bodyPropertiesToDelete));
			}

			if (!isset($props[PR_SENT_REPRESENTING_ENTRYID]) &&
			   isset($props[PR_SENT_REPRESENTING_EMAIL_ADDRESS]) && !empty($props[PR_SENT_REPRESENTING_EMAIL_ADDRESS]) &&
			   isset($props[PR_SENT_REPRESENTING_ADDRTYPE]) && !empty($props[PR_SENT_REPRESENTING_ADDRTYPE]) &&
			   isset($props[PR_SENT_REPRESENTING_NAME]) && !empty($props[PR_SENT_REPRESENTING_NAME])) {
				// Set FROM field properties
				$props[PR_SENT_REPRESENTING_ENTRYID] = mapi_createoneoff($props[PR_SENT_REPRESENTING_NAME], $props[PR_SENT_REPRESENTING_ADDRTYPE], $props[PR_SENT_REPRESENTING_EMAIL_ADDRESS]);
			}

			/*
			 * Delete PR_SENT_REPRESENTING_ENTRYID and PR_SENT_REPRESENTING_SEARCH_KEY properties, if PR_SENT_REPRESENTING_* properties are configured with empty string.
			 * Because, this is the case while user removes recipient from FROM field and send that particular draft without saving it.
			 */
			if (isset($props[PR_SENT_REPRESENTING_EMAIL_ADDRESS]) && empty($props[PR_SENT_REPRESENTING_EMAIL_ADDRESS]) &&
			   isset($props[PR_SENT_REPRESENTING_ADDRTYPE]) && empty($props[PR_SENT_REPRESENTING_ADDRTYPE]) &&
			   isset($props[PR_SENT_REPRESENTING_NAME]) && empty($props[PR_SENT_REPRESENTING_NAME])) {
				array_push($propertiesToDelete, PR_SENT_REPRESENTING_ENTRYID, PR_SENT_REPRESENTING_SEARCH_KEY);
			}

			// remove mv properties when needed
			foreach ($props as $propTag => $propVal) {
				switch (mapi_prop_type($propTag)) {
					case PT_SYSTIME:
						// Empty PT_SYSTIME values mean they should be deleted (there is no way to set an empty PT_SYSTIME)
						// case PT_STRING8:	// not enabled at this moment
						// Empty Strings
					case PT_MV_LONG:
						// Empty multivalued long
						if (empty($propVal)) {
							$propertiesToDelete[] = $propTag;
						}
						break;

					case PT_MV_STRING8:
						// Empty multivalued string
						if (empty($propVal)) {
							$props[$propTag] = [];
						}
						break;
				}
			}

			foreach ($propertiesToDelete as $prop) {
				unset($props[$prop]);
			}

			// Set the properties
			mapi_setprops($message, $props);

			// Delete the properties we don't need anymore
			mapi_deleteprops($message, $propertiesToDelete);

			if ($property != false) {
				// Stream the body to the PR_BODY or PR_HTML property
				$stream = mapi_openproperty($message, $property, IID_IStream, 0, MAPI_CREATE | MAPI_MODIFY);
				mapi_stream_setsize($stream, strlen((string) $body));
				mapi_stream_write($stream, $body);
				mapi_stream_commit($stream);
			}

			/*
			 * Save recipients
			 *
			 * If we are sending mail from delegator's folder, then we need to copy
			 * all recipients from original message first - need to pass message
			 *
			 * if delegate has added or removed any recipients then they will be
			 * added/removed using recipients array.
			 */
			if ($copyRecipients !== false && $copyFromMessage !== false) {
				$this->copyRecipients($message, $copyFromMessage);
			}

			$this->setRecipients($message, $recipients, $send);

			// Save the attachments with the $dialog_attachments, for attachments we have to obtain
			// some additional information from the state.
			if (!empty($attachments)) {
				$attachment_state = new AttachmentState();
				$attachment_state->open();

				if ($copyFromMessage !== false) {
					$this->copyAttachments($message, $attachments, $copyFromMessage, $copyInlineAttachmentsOnly, $attachment_state);
				}

				$this->setAttachments($message, $attachments, $attachment_state);

				$attachment_state->close();
			}

			// Set 'hideattachments' if message has only inline attachments.
			$properties = $GLOBALS['properties']->getMailProperties();
			if ($this->hasOnlyInlineAttachments($message)) {
				mapi_setprops($message, [$properties['hide_attachments'] => true]);
			}
			else {
				mapi_deleteprops($message, [$properties['hide_attachments']]);
			}

			$this->convertInlineImage($message);
			// Save changes
			if ($saveChanges) {
				mapi_savechanges($message);
			}

			// Get the PR_ENTRYID, PR_PARENT_ENTRYID and PR_STORE_ENTRYID properties of this message
			$messageProps = mapi_getprops($message, [PR_ENTRYID, PR_PARENT_ENTRYID, PR_STORE_ENTRYID]);
		}

		return $message;
	}

	/**
	 * Save an appointment item.
	 *
	 * This is basically the same as saving any other type of message with the added complexity that
	 * we support saving exceptions to recurrence here. This means that if the client sends a basedate
	 * in the action, that we will attempt to open an existing exception and change that, and if that
	 * fails, create a new exception with the specified data.
	 *
	 * @param mapistore $store                       MAPI store of the message
	 * @param string    $entryid                     entryid of the message
	 * @param string    $parententryid               Parent entryid of the message (folder entryid, NOT message entryid)
	 * @param array     $action                      Action array containing XML request
	 * @param string    $actionType                  The action type which triggered this action
	 * @param bool      $directBookingMeetingRequest Indicates if a Meeting Request should use direct booking or not. Defaults to true.
	 *
	 * @return array of PR_ENTRYID, PR_PARENT_ENTRYID and PR_STORE_ENTRYID properties of modified item
	 */
	public function saveAppointment($store, $entryid, $parententryid, $action, $actionType = 'save', $directBookingMeetingRequest = true) {
		$messageProps = [];
		// It stores the values that is exception allowed or not false -> not allowed
		$isExceptionAllowed = true;
		$delete = $actionType == 'delete';	// Flag for MeetingRequest Class whether to send update or cancel mail.
		$basedate = false;	// Flag for MeetingRequest Class whether to send an exception or not.
		$isReminderTimeAllowed = true;	// Flag to check reminder minutes is in range of the occurrences
		$properties = $GLOBALS['properties']->getAppointmentProperties();
		$send = false;
		$oldProps = [];
		$pasteRecord = false;

		if (isset($action['message_action'], $action['message_action']['send'])) {
			$send = $action['message_action']['send'];
		}

		if (isset($action['message_action'], $action['message_action']['paste'])) {
			$pasteRecord = true;
		}

		if (!empty($action['recipients'])) {
			$recips = $action['recipients'];
		}
		else {
			$recips = false;
		}

		// Set PidLidAppointmentTimeZoneDefinitionStartDisplay and
		// PidLidAppointmentTimeZoneDefinitionEndDisplay so that the allday
		// events are displayed correctly
		if (!empty($action['props']['timezone_iana'])) {
			try {
				$tzdef = mapi_ianatz_to_tzdef($action['props']['timezone_iana']);
			}
			catch (Exception) {
			}
			if ($tzdef !== false) {
				$action['props']['tzdefstart'] = $action['props']['tzdefend'] = bin2hex($tzdef);
				if (isset($action['props']['recurring']) && $action['props']['recurring'] == true) {
					$action['props']['tzdefrecur'] = $action['props']['tzdefstart'];
				}
			}
		}

		if ($store && $parententryid) {
			// @FIXME: check for $action['props'] array
			if (isset($entryid) && $entryid) {
				// Modify existing or add/change exception
				$message = mapi_msgstore_openentry($store, $entryid);

				if ($message) {
					$props = mapi_getprops($message, $properties);
					// Do not update timezone information if the appointment times haven't changed
					if (!isset($action['props']['commonstart']) &&
						!isset($action['props']['commonend']) &&
						!isset($action['props']['startdate']) &&
						!isset($action['props']['enddate'])
					) {
						unset($action['props']['tzdefstart'], $action['props']['tzdefend'], $action['props']['tzdefrecur']);
					}
					// Check if appointment is an exception to a recurring item
					if (isset($action['basedate']) && $action['basedate'] > 0) {
						// Create recurrence object
						$recurrence = new Recurrence($store, $message);

						$basedate = $action['basedate'];
						$exceptionatt = $recurrence->getExceptionAttachment($basedate);
						if ($exceptionatt) {
							// get properties of existing exception.
							$exceptionattProps = mapi_getprops($exceptionatt, [PR_ATTACH_NUM]);
							$attach_num = $exceptionattProps[PR_ATTACH_NUM];
						}

						if ($delete === true) {
							$isExceptionAllowed = $recurrence->createException([], $basedate, true);
						}
						else {
							$exception_recips = [];
							if (isset($recips['add'])) {
								$savedUnsavedRecipients = [];
								foreach ($recips["add"] as $recip) {
									$savedUnsavedRecipients["unsaved"][] = $recip;
								}
								// convert all local distribution list members to ideal recipient.
								$members = $this->convertLocalDistlistMembersToRecipients($savedUnsavedRecipients);

								$recips['add'] = $members['add'];
								$exception_recips['add'] = $this->createRecipientList($recips['add'], 'add', true, true);
							}
							if (isset($recips['remove'])) {
								$exception_recips['remove'] = $this->createRecipientList($recips['remove'], 'remove');
							}
							if (isset($recips['modify'])) {
								$exception_recips['modify'] = $this->createRecipientList($recips['modify'], 'modify', true, true);
							}

							if (isset($action['props']['reminder_minutes'], $action['props']['startdate'])) {
								$isReminderTimeAllowed = $recurrence->isValidReminderTime($basedate, $action['props']['reminder_minutes'], $action['props']['startdate']);
							}

							// As the reminder minutes occurs before other occurrences don't modify the item.
							if ($isReminderTimeAllowed) {
								if ($recurrence->isException($basedate)) {
									$oldProps = $recurrence->getExceptionProperties($recurrence->getChangeException($basedate));

									$isExceptionAllowed = $recurrence->modifyException(Conversion::mapXML2MAPI($properties, $action['props']), $basedate, $exception_recips);
								}
								else {
									$oldProps[$properties['startdate']] = $recurrence->getOccurrenceStart($basedate);
									$oldProps[$properties['duedate']] = $recurrence->getOccurrenceEnd($basedate);

									$isExceptionAllowed = $recurrence->createException(Conversion::mapXML2MAPI($properties, $action['props']), $basedate, false, $exception_recips);
								}
								mapi_savechanges($message);
							}
						}
					}
					else {
						$oldProps = mapi_getprops($message, [$properties['startdate'], $properties['duedate']]);
						// Modifying non-exception (the series) or normal appointment item
						$message = $GLOBALS['operations']->saveMessage($store, $entryid, $parententryid, Conversion::mapXML2MAPI($properties, $action['props']), $messageProps, $recips ?: [], $action['attachments'] ?? [], [], false, false, false, false, false, false, $send);

						$recurrenceProps = mapi_getprops($message, [$properties['startdate_recurring'], $properties['enddate_recurring'], $properties["recurring"]]);
						// Check if the meeting is recurring
						if ($recips && $recurrenceProps[$properties["recurring"]] && isset($recurrenceProps[$properties['startdate_recurring']], $recurrenceProps[$properties['enddate_recurring']])) {
							// If recipient of meeting is modified than that modification needs to be applied
							// to recurring exception as well, if any.
							$exception_recips = [];
							if (isset($recips['add'])) {
								$exception_recips['add'] = $this->createRecipientList($recips['add'], 'add', true, true);
							}
							if (isset($recips['remove'])) {
								$exception_recips['remove'] = $this->createRecipientList($recips['remove'], 'remove');
							}
							if (isset($recips['modify'])) {
								$exception_recips['modify'] = $this->createRecipientList($recips['modify'], 'modify', true, true);
							}

							// Create recurrence object
							$recurrence = new Recurrence($store, $message);

							$recurItems = $recurrence->getItems($recurrenceProps[$properties['startdate_recurring']], $recurrenceProps[$properties['enddate_recurring']]);

							foreach ($recurItems as $recurItem) {
								if (isset($recurItem["exception"])) {
									$recurrence->modifyException([], $recurItem["basedate"], $exception_recips);
								}
							}
						}

						// Only save recurrence if it has been changed by the user (because otherwise we'll reset
						// the exceptions)
						if (isset($action['props']['recurring_reset']) && $action['props']['recurring_reset'] == true) {
							$recur = new Recurrence($store, $message);

							if (isset($action['props']['timezone'])) {
								$tzprops = ['timezone', 'timezonedst', 'dststartmonth', 'dststartweek', 'dststartday', 'dststarthour', 'dstendmonth', 'dstendweek', 'dstendday', 'dstendhour'];

								// Get timezone info
								$tz = [];
								foreach ($tzprops as $tzprop) {
									$tz[$tzprop] = $action['props'][$tzprop];
								}
							}

							/**
							 * Check if any recurrence property is missing, if yes then prepare
							 * the set of properties required to update the recurrence. For more info
							 * please refer detailed description of parseRecurrence function of
							 * BaseRecurrence class".
							 *
							 * Note : this is a special case of changing the time of
							 * recurrence meeting from scheduling tab.
							 */
							$recurrence = $recur->getRecurrence();
							if (isset($recurrence)) {
								unset($recurrence['changed_occurrences'], $recurrence['deleted_occurrences']);

								foreach ($recurrence as $key => $value) {
									if (!isset($action['props'][$key])) {
										$action['props'][$key] = $value;
									}
								}
							}
							// Act like the 'props' are the recurrence pattern; it has more information but that
							// is ignored
							$recur->setRecurrence($tz ?? false, $action['props']);
						}
					}

					// Get the properties of the main object of which the exception was changed, and post
					// that message as being modified. This will cause the update function to update all
					// occurrences of the item to the client
					$messageProps = mapi_getprops($message, [PR_ENTRYID, PR_PARENT_ENTRYID, PR_STORE_ENTRYID]);

					// if opened appointment is exception then it will add
					// the attach_num and basedate in messageProps.
					if (isset($attach_num)) {
						$messageProps[PR_ATTACH_NUM] = [$attach_num];
						$messageProps[$properties["basedate"]] = $action['basedate'];
					}
				}
			}
			else {
				$tz = null;
				$hasRecipient = false;
				$copyAttachments = false;
				$sourceRecord = false;
				if (isset($action['message_action'], $action['message_action']['source_entryid'])) {
					$sourceEntryId = $action['message_action']['source_entryid'];
					$sourceStoreEntryId = $action['message_action']['source_store_entryid'];

					$sourceStore = $GLOBALS['mapisession']->openMessageStore(hex2bin((string) $sourceStoreEntryId));
					$sourceRecord = mapi_msgstore_openentry($sourceStore, hex2bin($sourceEntryId));
					if ($pasteRecord) {
						$sourceRecordProps = mapi_getprops($sourceRecord, [$properties["meeting"], $properties["responsestatus"]]);
						// Don't copy recipient if source record is received message.
						if ($sourceRecordProps[$properties["meeting"]] === olMeeting &&
							$sourceRecordProps[$properties["meeting"]] === olResponseOrganized) {
							$table = mapi_message_getrecipienttable($sourceRecord);
							$hasRecipient = mapi_table_getrowcount($table) > 0;
						}
					}
					else {
						$copyAttachments = true;
						// Set sender of new Appointment.
						$this->setSenderAddress($store, $action);
					}
				}
				else {
					// Set sender of new Appointment.
					$this->setSenderAddress($store, $action);
				}

				$message = $this->saveMessage($store, $entryid, $parententryid, Conversion::mapXML2MAPI($properties, $action['props']), $messageProps, $recips ?: [], $action['attachments'] ?? [], [], $sourceRecord, $copyAttachments, $hasRecipient, false, false, false, $send);

				if (isset($action['props']['timezone'])) {
					$tzprops = ['timezone', 'timezonedst', 'dststartmonth', 'dststartweek', 'dststartday', 'dststarthour', 'dstendmonth', 'dstendweek', 'dstendday', 'dstendhour'];

					// Get timezone info
					$tz = [];
					foreach ($tzprops as $tzprop) {
						$tz[$tzprop] = $action['props'][$tzprop];
					}
				}

				// Set recurrence
				if (isset($action['props']['recurring']) && $action['props']['recurring'] == true) {
					$recur = new Recurrence($store, $message);
					$recur->setRecurrence($tz, $action['props']);
				}
			}
		}

		$result = false;
		// Check to see if it should be sent as a meeting request
		if ($send === true && $isExceptionAllowed) {
			$savedUnsavedRecipients = [];
			$remove = [];
			if (!isset($action['basedate'])) {
				// retrieve recipients from saved message
				$savedRecipients = $GLOBALS['operations']->getRecipientsInfo($message);
				foreach ($savedRecipients as $recipient) {
					$savedUnsavedRecipients["saved"][] = $recipient['props'];
				}

				// retrieve removed recipients.
				if (!empty($recips) && !empty($recips["remove"])) {
					$remove = $recips["remove"];
				}

				// convert all local distribution list members to ideal recipient.
				$members = $this->convertLocalDistlistMembersToRecipients($savedUnsavedRecipients, $remove);

				// Before sending meeting request we set the recipient to message
				// which are converted from local distribution list members.
				$this->setRecipients($message, $members);
			}

			$request = new Meetingrequest($store, $message, $GLOBALS['mapisession']->getSession(), $directBookingMeetingRequest);

			/*
			 * check write access for delegate, make sure that we will not send meeting request
			 * if we don't have permission to save calendar item
			 */
			if ($request->checkFolderWriteAccess($parententryid, $store) !== true) {
				// Throw an exception that we don't have write permissions on calendar folder,
				// error message will be filled by module
				throw new MAPIException(null, MAPI_E_NO_ACCESS);
			}

			$request->updateMeetingRequest($basedate);

			$isRecurrenceChanged = isset($action['props']['recurring_reset']) && $action['props']['recurring_reset'] == true;
			$request->checkSignificantChanges($oldProps, $basedate, $isRecurrenceChanged);

			// Update extra body information
			if (isset($action['message_action']['meetingTimeInfo']) && !empty($action['message_action']['meetingTimeInfo'])) {
				// Append body if the request action requires this
				if (isset($action['message_action'], $action['message_action']['append_body'])) {
					$bodyProps = mapi_getprops($message, [PR_BODY]);
					if (isset($bodyProps[PR_BODY]) || propIsError(PR_BODY, $bodyProps) == MAPI_E_NOT_ENOUGH_MEMORY) {
						$bodyProps[PR_BODY] = streamProperty($message, PR_BODY);
					}

					if (isset($action['message_action']['meetingTimeInfo'], $bodyProps[PR_BODY])) {
						$action['message_action']['meetingTimeInfo'] .= $bodyProps[PR_BODY];
					}
				}

				$request->setMeetingTimeInfo($action['message_action']['meetingTimeInfo']);
				unset($action['message_action']['meetingTimeInfo']);
			}

			$modifiedRecipients = false;
			$deletedRecipients = false;
			if ($recips) {
				if (isset($action['message_action']['send_update']) && $action['message_action']['send_update'] == 'modified') {
					if (isset($recips['add']) && !empty($recips['add'])) {
						$modifiedRecipients = $modifiedRecipients ?: [];
						$modifiedRecipients = array_merge($modifiedRecipients, $this->createRecipientList($recips['add'], 'add'));
					}

					if (isset($recips['modify']) && !empty($recips['modify'])) {
						$modifiedRecipients = $modifiedRecipients ?: [];
						$modifiedRecipients = array_merge($modifiedRecipients, $this->createRecipientList($recips['modify'], 'modify'));
					}
				}

				// lastUpdateCounter is represent that how many times this message is updated(send)
				$lastUpdateCounter = $request->getLastUpdateCounter();
				if ($lastUpdateCounter !== false && $lastUpdateCounter > 0) {
					if (isset($recips['remove']) && !empty($recips['remove'])) {
						$deletedRecipients = $deletedRecipients ?: [];
						$deletedRecipients = array_merge($deletedRecipients, $this->createRecipientList($recips['remove'], 'remove'));
						if (isset($action['message_action']['send_update']) && $action['message_action']['send_update'] != 'all') {
							$modifiedRecipients = $modifiedRecipients ?: [];
						}
					}
				}
			}

			$sendMeetingRequestResult = $request->sendMeetingRequest($delete, false, $basedate, $modifiedRecipients, $deletedRecipients);

			$this->addRecipientsToRecipientHistory($this->getRecipientsInfo($message));

			if ($sendMeetingRequestResult === true) {
				$this->parseDistListAndAddToRecipientHistory($savedUnsavedRecipients, $remove);

				mapi_savechanges($message);

				// We want to sent the 'request_sent' property, to have it properly
				// deserialized we must also send some type properties.
				$props = mapi_getprops($message, [PR_MESSAGE_CLASS, PR_OBJECT_TYPE]);
				$messageProps[PR_MESSAGE_CLASS] = $props[PR_MESSAGE_CLASS];
				$messageProps[PR_OBJECT_TYPE] = $props[PR_OBJECT_TYPE];

				// Indicate that the message was correctly sent
				$messageProps[$properties['request_sent']] = true;

				// Return message properties that can be sent to the bus to notify changes
				$result = $messageProps;
			}
			else {
				$sendMeetingRequestResult[PR_ENTRYID] = $messageProps[PR_ENTRYID];
				$sendMeetingRequestResult[PR_PARENT_ENTRYID] = $messageProps[PR_PARENT_ENTRYID];
				$sendMeetingRequestResult[PR_STORE_ENTRYID] = $messageProps[PR_STORE_ENTRYID];
				$result = $sendMeetingRequestResult;
			}
		}
		else {
			mapi_savechanges($message);

			if (isset($isExceptionAllowed)) {
				if ($isExceptionAllowed === false) {
					$messageProps['isexceptionallowed'] = false;
				}
			}

			if (isset($isReminderTimeAllowed)) {
				if ($isReminderTimeAllowed === false) {
					$messageProps['remindertimeerror'] = false;
				}
			}
			// Return message properties that can be sent to the bus to notify changes
			$result = $messageProps;
		}

		return $result;
	}

	/**
	 * Function is used to identify the local distribution list from all recipients and
	 * convert all local distribution list members to recipients.
	 *
	 * @param array $recipients array of recipients either saved or add
	 * @param array $remove     array of recipients that was removed
	 *
	 * @return array $newRecipients a list of recipients as XML array structure
	 */
	public function convertLocalDistlistMembersToRecipients($recipients, $remove = []) {
		$addRecipients = [];
		$removeRecipients = [];

		foreach ($recipients as $key => $recipient) {
			foreach ($recipient as $recipientItem) {
				$recipientEntryid = $recipientItem["entryid"];
				$isExistInRemove = $this->isExistInRemove($recipientEntryid, $remove);

				/*
				 * Condition is only gets true, if recipient is distribution list and it`s belongs
				 * to shared/internal(belongs in contact folder) folder.
				 */
				if ($recipientItem['object_type'] == MAPI_DISTLIST && $recipientItem['address_type'] != 'EX') {
					if (!$isExistInRemove) {
						$recipientItems = $GLOBALS["operations"]->expandDistList($recipientEntryid, true);
						foreach ($recipientItems as $recipient) {
							// set recipient type of each members as per the distribution list recipient type
							$recipient['recipient_type'] = $recipientItem['recipient_type'];
							array_push($addRecipients, $recipient);
						}

						if ($key === "saved") {
							array_push($removeRecipients, $recipientItem);
						}
					}
				}
				else {
					/*
					 * Only Add those recipients which are not saved earlier in message and
					 * not present in remove array.
					 */
					if (!$isExistInRemove && $key === "unsaved") {
						array_push($addRecipients, $recipientItem);
					}
				}
			}
		}
		$newRecipients["add"] = $addRecipients;
		$newRecipients["remove"] = $removeRecipients;

		return $newRecipients;
	}

	/**
	 * Function used to identify given recipient was already available in remove array of recipients array or not.
	 * which was sent from client side. If it is found the entry in the $remove array will be deleted, since
	 * we do not want to find it again for other recipients. (if a user removes and adds an user again it
	 * should be added once!).
	 *
	 * @param string $recipientEntryid recipient entryid
	 * @param array  $remove           removed recipients array
	 *
	 * @return bool return false if recipient not exist in remove array else return true
	 */
	public function isExistInRemove($recipientEntryid, &$remove) {
		if (!empty($remove)) {
			foreach ($remove as $index => $removeItem) {
				if (array_search($recipientEntryid, $removeItem, true)) {
					unset($remove[$index]);

					return true;
				}
			}
		}

		return false;
	}

	/**
	 * Function is used to identify the local distribution list from all recipients and
	 * Add distribution list to recipient history.
	 *
	 * @param array $savedUnsavedRecipients array of recipients either saved or add
	 * @param array $remove                 array of recipients that was removed
	 */
	public function parseDistListAndAddToRecipientHistory($savedUnsavedRecipients, $remove) {
		$distLists = [];
		foreach ($savedUnsavedRecipients as $key => $recipient) {
			foreach ($recipient as $recipientItem) {
				if ($recipientItem['address_type'] == 'MAPIPDL') {
					$isExistInRemove = $this->isExistInRemove($recipientItem['entryid'], $remove);
					if (!$isExistInRemove) {
						array_push($distLists, ["props" => $recipientItem]);
					}
				}
			}
		}

		$this->addRecipientsToRecipientHistory($distLists);
	}

	/**
	 * Set sent_representing_email_address property of Appointment.
	 *
	 * Before saving any new appointment, sent_representing_email_address property of appointment
	 * should contain email_address of user, who is the owner of store(in which the appointment
	 * is created).
	 *
	 * @param mapistore $store  MAPI store of the message
	 * @param array     $action reference to action array containing XML request
	 */
	public function setSenderAddress($store, &$action) {
		$storeProps = mapi_getprops($store, [PR_MAILBOX_OWNER_ENTRYID]);
		// check for public store
		if (!isset($storeProps[PR_MAILBOX_OWNER_ENTRYID])) {
			$store = $GLOBALS["mapisession"]->getDefaultMessageStore();
			$storeProps = mapi_getprops($store, [PR_MAILBOX_OWNER_ENTRYID]);
		}
		$mailuser = mapi_ab_openentry($GLOBALS["mapisession"]->getAddressbook(), $storeProps[PR_MAILBOX_OWNER_ENTRYID]);
		if ($mailuser) {
			$userprops = mapi_getprops($mailuser, [PR_ADDRTYPE, PR_DISPLAY_NAME, PR_EMAIL_ADDRESS, PR_SMTP_ADDRESS]);
			$action["props"]["sent_representing_entryid"] = bin2hex((string) $storeProps[PR_MAILBOX_OWNER_ENTRYID]);
			// we do conversion here, because before passing props to saveMessage() props are converted from utf8-to-w
			$action["props"]["sent_representing_name"] = $userprops[PR_DISPLAY_NAME];
			$action["props"]["sent_representing_address_type"] = $userprops[PR_ADDRTYPE];
			if ($userprops[PR_ADDRTYPE] == 'SMTP') {
				$emailAddress = $userprops[PR_SMTP_ADDRESS];
			}
			else {
				$emailAddress = $userprops[PR_EMAIL_ADDRESS];
			}
			$action["props"]["sent_representing_email_address"] = $emailAddress;
			$action["props"]["sent_representing_search_key"] = bin2hex(strtoupper($userprops[PR_ADDRTYPE] . ':' . $emailAddress)) . '00';
		}
	}

	/**
	 * Submit a message for sending.
	 *
	 * This function is an extension of the saveMessage() function, with the extra functionality
	 * that the item is actually sent and queued for moving to 'Sent Items'. Also, the e-mail addresses
	 * used in the message are processed for later auto-suggestion.
	 *
	 * @see Operations::saveMessage() for more information on the parameters, which are identical.
	 *
	 * @param mapistore   $store                     MAPI Message Store Object
	 * @param binary      $entryid                   Entryid of the message
	 * @param array       $props                     The properties to be saved
	 * @param array       $messageProps              reference to an array which will be filled with PR_ENTRYID, PR_PARENT_ENTRYID and PR_STORE_ENTRYID
	 * @param array       $recipients                XML array structure of recipients for the recipient table
	 * @param array       $attachments               array of attachments consisting unique ID of attachments for this message
	 * @param MAPIMessage $copyFromMessage           resource of the message from which we should
	 *                                               copy attachments and/or recipients to the current message
	 * @param bool        $copyAttachments           if set we copy all attachments from the $copyFromMessage
	 * @param bool        $copyRecipients            if set we copy all recipients from the $copyFromMessage
	 * @param bool        $copyInlineAttachmentsOnly if true then copy only inline attachments
	 * @param bool        $isPlainText               if true then message body will be generated using PR_BODY otherwise PR_HTML will be used in saveMessage() function
	 *
	 * @return bool false if action succeeded, anything else indicates an error (e.g. a string)
	 */
	public function submitMessage($store, $entryid, $props, &$messageProps, $recipients = [], $attachments = [], $copyFromMessage = false, $copyAttachments = false, $copyRecipients = false, $copyInlineAttachmentsOnly = false, $isPlainText = false) {
		$message = false;
		$origStore = $store;
		$reprMessage = false;
		$delegateSentItemsStyle = $GLOBALS['settings']->get('zarafa/v1/contexts/mail/delegate_sent_items_style');
		$saveBoth = strcasecmp((string) $delegateSentItemsStyle, 'both') == 0;
		$saveRepresentee = strcasecmp((string) $delegateSentItemsStyle, 'representee') == 0;
		$sendingAsDelegate = false;

		// Get the outbox and sent mail entryid, ignore the given $store, use the default store for submitting messages
		$store = $GLOBALS["mapisession"]->getDefaultMessageStore();
		$storeprops = mapi_getprops($store, [PR_IPM_OUTBOX_ENTRYID, PR_IPM_SENTMAIL_ENTRYID, PR_ENTRYID]);
		$origStoreprops = mapi_getprops($origStore, [PR_ENTRYID, PR_IPM_SENTMAIL_ENTRYID]);

		if (!isset($storeprops[PR_IPM_OUTBOX_ENTRYID])) {
			return false;
		}
		if (isset($storeprops[PR_IPM_SENTMAIL_ENTRYID])) {
			$props[PR_SENTMAIL_ENTRYID] = $storeprops[PR_IPM_SENTMAIL_ENTRYID];
		}

		// Check if replying then set PR_INTERNET_REFERENCES and PR_IN_REPLY_TO_ID properties in props.
		// flag is probably used wrong here but the same flag indicates if this is reply or replyall
		if ($copyInlineAttachmentsOnly) {
			$origMsgProps = mapi_getprops($copyFromMessage, [PR_INTERNET_MESSAGE_ID, PR_INTERNET_REFERENCES]);
			if (isset($origMsgProps[PR_INTERNET_MESSAGE_ID])) {
				// The references header should indicate the message-id of the original
				// header plus any of the references which were set on the previous mail.
				$props[PR_INTERNET_REFERENCES] = $origMsgProps[PR_INTERNET_MESSAGE_ID];
				if (isset($origMsgProps[PR_INTERNET_REFERENCES])) {
					$props[PR_INTERNET_REFERENCES] = $origMsgProps[PR_INTERNET_REFERENCES] . ' ' . $props[PR_INTERNET_REFERENCES];
				}
				$props[PR_IN_REPLY_TO_ID] = $origMsgProps[PR_INTERNET_MESSAGE_ID];
			}
		}

		if (!$GLOBALS["entryid"]->compareEntryIds(bin2hex((string) $origStoreprops[PR_ENTRYID]), bin2hex((string) $storeprops[PR_ENTRYID]))) {
			// set properties for "on behalf of" mails
			$origStoreProps = mapi_getprops($origStore, [PR_MAILBOX_OWNER_ENTRYID, PR_MDB_PROVIDER, PR_IPM_SENTMAIL_ENTRYID]);

			// set PR_SENDER_* properties, which contains currently logged user's data
			$ab = $GLOBALS['mapisession']->getAddressbook();
			$abitem = mapi_ab_openentry($ab, $GLOBALS["mapisession"]->getUserEntryID());
			$abitemprops = mapi_getprops($abitem, [PR_DISPLAY_NAME, PR_EMAIL_ADDRESS, PR_SEARCH_KEY]);

			$props[PR_SENDER_ENTRYID] = $GLOBALS["mapisession"]->getUserEntryID();
			$props[PR_SENDER_NAME] = $abitemprops[PR_DISPLAY_NAME];
			$props[PR_SENDER_EMAIL_ADDRESS] = $abitemprops[PR_EMAIL_ADDRESS];
			$props[PR_SENDER_ADDRTYPE] = "EX";
			$props[PR_SENDER_SEARCH_KEY] = $abitemprops[PR_SEARCH_KEY];

			// Use the PR_SENT_REPRESENTING_* properties sent by the client or set to the currently logged user's data
			$props[PR_SENT_REPRESENTING_ENTRYID] = $props[PR_SENT_REPRESENTING_ENTRYID] ?? $props[PR_SENDER_ENTRYID];
			$props[PR_SENT_REPRESENTING_NAME] = $props[PR_SENT_REPRESENTING_NAME] ?? $props[PR_SENDER_NAME];
			$props[PR_SENT_REPRESENTING_EMAIL_ADDRESS] = $props[PR_SENT_REPRESENTING_EMAIL_ADDRESS] ?? $props[PR_SENDER_EMAIL_ADDRESS];
			$props[PR_SENT_REPRESENTING_ADDRTYPE] = $props[PR_SENT_REPRESENTING_ADDRTYPE] ?? $props[PR_SENDER_ADDRTYPE];
			$props[PR_SENT_REPRESENTING_SEARCH_KEY] = $props[PR_SENT_REPRESENTING_SEARCH_KEY] ?? $props[PR_SENDER_SEARCH_KEY];
			/**
			 * we are sending mail from delegate's account, so we can't use delegate's outbox and sent items folder
			 * so we have to copy the mail from delegate's store to logged user's store and in outbox folder and then
			 * we can send mail from logged user's outbox folder.
			 *
			 * if we set $entryid to false before passing it to saveMessage function then it will assume
			 * that item doesn't exist and it will create a new item (in outbox of logged in user)
			 */
			if ($entryid) {
				$oldEntryId = $entryid;
				$entryid = false;

				// if we are sending mail from drafts folder then we have to copy
				// its recipients and attachments also. $origStore and $oldEntryId points to mail
				// saved in delegators draft folder
				if ($copyFromMessage === false) {
					$copyFromMessage = mapi_msgstore_openentry($origStore, $oldEntryId);
					$copyRecipients = true;

					// Decode smime signed messages on this message
					parse_smime($origStore, $copyFromMessage);
				}
			}

			if ($copyFromMessage) {
				// Get properties of original message, to copy recipients and attachments in new message
				$copyMessageProps = mapi_getprops($copyFromMessage);
				$oldParentEntryId = $copyMessageProps[PR_PARENT_ENTRYID];

				// unset id properties before merging the props, so we will be creating new item instead of sending same item
				unset($copyMessageProps[PR_ENTRYID], $copyMessageProps[PR_PARENT_ENTRYID], $copyMessageProps[PR_STORE_ENTRYID], $copyMessageProps[PR_SEARCH_KEY]);

				// grommunio generates PR_HTML on the fly, but it's necessary to unset it
				// if the original message didn't have PR_HTML property.
				if (!isset($props[PR_HTML]) && isset($copyMessageProps[PR_HTML])) {
					unset($copyMessageProps[PR_HTML]);
				}
				/* New EMAIL_ADDRESSes were set (various cases above), kill off old SMTP_ADDRESS. */
				unset($copyMessageProps[PR_SENDER_SMTP_ADDRESS], $copyMessageProps[PR_SENT_REPRESENTING_SMTP_ADDRESS]);

				// Merge original message props with props sent by client
				$props = $props + $copyMessageProps;
			}

			// Save the new message properties
			$message = $this->saveMessage($store, $entryid, $storeprops[PR_IPM_OUTBOX_ENTRYID], $props, $messageProps, $recipients, $attachments, [], $copyFromMessage, $copyAttachments, $copyRecipients, $copyInlineAttachmentsOnly, true, true, $isPlainText);

			// FIXME: currently message is deleted from original store and new message is created
			// in current user's store, but message should be moved

			// delete message from it's original location
			if (!empty($oldEntryId) && !empty($oldParentEntryId)) {
				$folder = mapi_msgstore_openentry($origStore, $oldParentEntryId);
				mapi_folder_deletemessages($folder, [$oldEntryId], DELETE_HARD_DELETE);
			}
			if ($saveBoth || $saveRepresentee) {
				if ($origStoreProps[PR_MDB_PROVIDER] === ZARAFA_STORE_PUBLIC_GUID) {
					$userEntryid = $GLOBALS["mapisession"]->getStoreEntryIdOfUser(strtolower($props[PR_SENT_REPRESENTING_EMAIL_ADDRESS]));
					$origStore = $GLOBALS["mapisession"]->openMessageStore($userEntryid);
					$origStoreprops = mapi_getprops($origStore, [PR_IPM_SENTMAIL_ENTRYID]);
				}
				$destfolder = mapi_msgstore_openentry($origStore, $origStoreprops[PR_IPM_SENTMAIL_ENTRYID]);
				$reprMessage = mapi_folder_createmessage($destfolder);
				mapi_copyto($message, [], [], $reprMessage, 0);
			}
		}
		else {
			// When the message is in your own store, just move it to your outbox. We move it manually so we know the new entryid after it has been moved.
			$outbox = mapi_msgstore_openentry($store, $storeprops[PR_IPM_OUTBOX_ENTRYID]);

			// Open the old and the new message
			$newmessage = mapi_folder_createmessage($outbox);
			$oldEntryId = $entryid;

			// Remember the new entryid
			$newprops = mapi_getprops($newmessage, [PR_ENTRYID]);
			$entryid = $newprops[PR_ENTRYID];

			if (!empty($oldEntryId)) {
				$message = mapi_msgstore_openentry($store, $oldEntryId);
				// Copy the entire message
				mapi_copyto($message, [], [], $newmessage);
				$tmpProps = mapi_getprops($message);
				$oldParentEntryId = $tmpProps[PR_PARENT_ENTRYID];
				if ($storeprops[PR_IPM_OUTBOX_ENTRYID] == $oldParentEntryId) {
					$folder = $outbox;
				}
				else {
					$folder = mapi_msgstore_openentry($store, $oldParentEntryId);
				}

				// Copy message_class for S/MIME plugin
				if (isset($tmpProps[PR_MESSAGE_CLASS])) {
					$props[PR_MESSAGE_CLASS] = $tmpProps[PR_MESSAGE_CLASS];
				}
				// Delete the old message
				mapi_folder_deletemessages($folder, [$oldEntryId]);
			}

			// save changes to new message created in outbox
			mapi_savechanges($newmessage);

			$reprProps = mapi_getprops($newmessage, [PR_SENT_REPRESENTING_EMAIL_ADDRESS, PR_SENDER_EMAIL_ADDRESS, PR_SENT_REPRESENTING_ENTRYID]);
			if (isset($reprProps[PR_SENT_REPRESENTING_EMAIL_ADDRESS], $reprProps[PR_SENDER_EMAIL_ADDRESS], $reprProps[PR_SENT_REPRESENTING_ENTRYID]) &&
				strcasecmp((string) $reprProps[PR_SENT_REPRESENTING_EMAIL_ADDRESS], (string) $reprProps[PR_SENDER_EMAIL_ADDRESS]) != 0) {
				$ab = $GLOBALS['mapisession']->getAddressbook();
				$abitem = mapi_ab_openentry($ab, $reprProps[PR_SENT_REPRESENTING_ENTRYID]);
				$abitemprops = mapi_getprops($abitem, [PR_DISPLAY_NAME, PR_EMAIL_ADDRESS, PR_SEARCH_KEY]);

				$props[PR_SENT_REPRESENTING_NAME] = $abitemprops[PR_DISPLAY_NAME];
				$props[PR_SENT_REPRESENTING_EMAIL_ADDRESS] = $abitemprops[PR_EMAIL_ADDRESS];
				$props[PR_SENT_REPRESENTING_ADDRTYPE] = "EX";
				$props[PR_SENT_REPRESENTING_SEARCH_KEY] = $abitemprops[PR_SEARCH_KEY];
				$sendingAsDelegate = true;
			}
			// Save the new message properties
			$message = $this->saveMessage($store, $entryid, $storeprops[PR_IPM_OUTBOX_ENTRYID], $props, $messageProps, $recipients, $attachments, [], $copyFromMessage, $copyAttachments, $copyRecipients, $copyInlineAttachmentsOnly, true, true, $isPlainText);
			// Sending as delegate from drafts folder
			if ($sendingAsDelegate && ($saveBoth || $saveRepresentee)) {
				$userEntryid = $GLOBALS["mapisession"]->getStoreEntryIdOfUser(strtolower($props[PR_SENT_REPRESENTING_EMAIL_ADDRESS]));
				$origStore = $GLOBALS["mapisession"]->openMessageStore($userEntryid);
				if ($origStore) {
					$origStoreprops = mapi_getprops($origStore, [PR_ENTRYID, PR_IPM_SENTMAIL_ENTRYID]);
					$destfolder = mapi_msgstore_openentry($origStore, $origStoreprops[PR_IPM_SENTMAIL_ENTRYID]);
					$reprMessage = mapi_folder_createmessage($destfolder);
					mapi_copyto($message, [], [], $reprMessage, 0);
				}
			}
		}

		if (!$message) {
			return false;
		}
		// Allowing to hook in just before the data sent away to be sent to the client
		$GLOBALS['PluginManager']->triggerHook('server.core.operations.submitmessage', [
			'moduleObject' => $this,
			'store' => $store,
			'entryid' => $entryid,
			'message' => &$message,
		]);

		// Submit the message (send)
		try {
			mapi_message_submitmessage($message);
		}
		catch (MAPIException $e) {
			$username = $GLOBALS["mapisession"]->getUserName();
			$errorName = get_mapi_error_name($e->getCode());
			error_log(sprintf(
				'Unable to submit message for %s, MAPI error: %s. ' .
				'SMTP server may be down or it refused the message or the message' .
				' is too large to submit or user does not have the permission ...',
				$username,
				$errorName
			));

			return $errorName;
		}

		$tmp_props = mapi_getprops($message, [PR_PARENT_ENTRYID, PR_MESSAGE_DELIVERY_TIME, PR_CLIENT_SUBMIT_TIME, PR_SEARCH_KEY, PR_MESSAGE_FLAGS]);
		$messageProps[PR_PARENT_ENTRYID] = $tmp_props[PR_PARENT_ENTRYID];
		if ($reprMessage !== false) {
			mapi_setprops($reprMessage, [
				PR_CLIENT_SUBMIT_TIME => $tmp_props[PR_CLIENT_SUBMIT_TIME] ?? time(),
				PR_MESSAGE_DELIVERY_TIME => $tmp_props[PR_MESSAGE_DELIVERY_TIME] ?? time(),
				PR_MESSAGE_FLAGS => $tmp_props[PR_MESSAGE_FLAGS] | MSGFLAG_READ,
			]);
			mapi_savechanges($reprMessage);
			if ($saveRepresentee) {
				// delete the message in the delegate's Sent Items folder
				$sentFolder = mapi_msgstore_openentry($store, $storeprops[PR_IPM_SENTMAIL_ENTRYID]);
				$sentTable = mapi_folder_getcontentstable($sentFolder, MAPI_DEFERRED_ERRORS);
				$restriction = [RES_PROPERTY, [
					RELOP => RELOP_EQ,
					ULPROPTAG => PR_SEARCH_KEY,
					VALUE => $tmp_props[PR_SEARCH_KEY],
				]];
				mapi_table_restrict($sentTable, $restriction);
				$sentMessageProps = mapi_table_queryallrows($sentTable, [PR_ENTRYID, PR_SEARCH_KEY]);
				if (mapi_table_getrowcount($sentTable) == 1) {
					mapi_folder_deletemessages($sentFolder, [$sentMessageProps[0][PR_ENTRYID]], DELETE_HARD_DELETE);
				}
				else {
					error_log(sprintf(
						"Found multiple entries in Sent Items with the same PR_SEARCH_KEY (%d)." .
						" Impossible to delete email from the delegate's Sent Items folder.",
						mapi_table_getrowcount($sentTable)
					));
				}
			}
		}

		$this->addRecipientsToRecipientHistory($this->getRecipientsInfo($message));

		return false;
	}

	/**
	 * Delete messages.
	 *
	 * This function does what is needed when a user presses 'delete' on a MAPI message. This means that:
	 *
	 * - Items in the own store are moved to the wastebasket
	 * - Items in the wastebasket are deleted
	 * - Items in other users stores are moved to our own wastebasket
	 * - Items in the public store are deleted
	 *
	 * @param mapistore $store         MAPI Message Store Object
	 * @param string    $parententryid parent entryid of the messages to be deleted
	 * @param array     $entryids      a list of entryids which will be deleted
	 * @param bool      $softDelete    flag for soft-deleteing (when user presses Shift+Del)
	 * @param bool      $unread        message is unread
	 *
	 * @return bool true if action succeeded, false if not
	 */
	public function deleteMessages($store, $parententryid, $entryids, $softDelete = false, $unread = false) {
		$result = false;
		if (!is_array($entryids)) {
			$entryids = [$entryids];
		}

		$folder = mapi_msgstore_openentry($store, $parententryid);
		$flags = $unread ? GX_DELMSG_NOTIFY_UNREAD : 0;
		$msgprops = mapi_getprops($store, [PR_IPM_WASTEBASKET_ENTRYID, PR_MDB_PROVIDER, PR_IPM_OUTBOX_ENTRYID]);

		switch ($msgprops[PR_MDB_PROVIDER]) {
			case ZARAFA_STORE_DELEGATE_GUID:
				$softDelete = $softDelete || defined('ENABLE_DEFAULT_SOFT_DELETE') ? ENABLE_DEFAULT_SOFT_DELETE : false;
				// with a store from an other user we need our own waste basket...
				if (isset($msgprops[PR_IPM_WASTEBASKET_ENTRYID]) && $msgprops[PR_IPM_WASTEBASKET_ENTRYID] == $parententryid || $softDelete) {
					// except when it is the waste basket itself
					$result = mapi_folder_deletemessages($folder, $entryids, $flags);
					break;
				}
				$defaultstore = $GLOBALS["mapisession"]->getDefaultMessageStore();
				$msgprops = mapi_getprops($defaultstore, [PR_IPM_WASTEBASKET_ENTRYID, PR_MDB_PROVIDER]);

				if (!isset($msgprops[PR_IPM_WASTEBASKET_ENTRYID]) ||
					$msgprops[PR_IPM_WASTEBASKET_ENTRYID] == $parententryid) {
					$result = mapi_folder_deletemessages($folder, $entryids, $flags);
					break;
				}

				try {
					$result = $this->copyMessages($store, $parententryid, $defaultstore, $msgprops[PR_IPM_WASTEBASKET_ENTRYID], $entryids, [], true);
				}
				catch (MAPIException $e) {
					$e->setHandled();
					// if moving fails, try normal delete
					$result = mapi_folder_deletemessages($folder, $entryids, $flags);
				}
				break;

			case ZARAFA_STORE_ARCHIVER_GUID:
			case ZARAFA_STORE_PUBLIC_GUID:
				// always delete in public store and archive store
				$result = mapi_folder_deletemessages($folder, $entryids, $flags);
				break;

			case ZARAFA_SERVICE_GUID:
				// delete message when in your own waste basket, else move it to the waste basket
				if (isset($msgprops[PR_IPM_WASTEBASKET_ENTRYID]) && $msgprops[PR_IPM_WASTEBASKET_ENTRYID] == $parententryid || $softDelete === true) {
					$result = mapi_folder_deletemessages($folder, $entryids, $flags);
					break;
				}

				try {
					// if the message is deleting from outbox then first delete the
					// message from an outgoing queue.
					if (function_exists("mapi_msgstore_abortsubmit") && isset($msgprops[PR_IPM_OUTBOX_ENTRYID]) && $msgprops[PR_IPM_OUTBOX_ENTRYID] === $parententryid) {
						foreach ($entryids as $entryid) {
							$message = mapi_msgstore_openentry($store, $entryid);
							$messageProps = mapi_getprops($message, [PR_DEFERRED_SEND_TIME]);
							if (isset($messageProps[PR_DEFERRED_SEND_TIME])) {
								mapi_msgstore_abortsubmit($store, $entryid);
							}
						}
					}
					$result = $this->copyMessages($store, $parententryid, $store, $msgprops[PR_IPM_WASTEBASKET_ENTRYID], $entryids, [], true);
				}
				catch (MAPIException $e) {
					if ($e->getCode() === MAPI_E_NOT_IN_QUEUE || $e->getCode() === MAPI_E_UNABLE_TO_ABORT) {
						throw $e;
					}

					$e->setHandled();
					// if moving fails, try normal delete
					$result = mapi_folder_deletemessages($folder, $entryids, $flags);
				}
				break;
		}

		return $result;
	}

	/**
	 * Copy or move messages.
	 *
	 * @param object $store         MAPI Message Store Object
	 * @param string $parententryid parent entryid of the messages
	 * @param string $destentryid   destination folder
	 * @param array  $entryids      a list of entryids which will be copied or moved
	 * @param array  $ignoreProps   a list of proptags which should not be copied over
	 *                              to the new message
	 * @param bool   $moveMessages  true - move messages, false - copy messages
	 * @param array  $props         a list of proptags which should set in new messages
	 * @param mixed  $destStore
	 *
	 * @return bool true if action succeeded, false if not
	 */
	public function copyMessages($store, $parententryid, $destStore, $destentryid, $entryids, $ignoreProps, $moveMessages, $props = []) {
		$sourcefolder = mapi_msgstore_openentry($store, $parententryid);
		$destfolder = mapi_msgstore_openentry($destStore, $destentryid);

		if (!$sourcefolder || !$destfolder) {
			error_log("Could not open source or destination folder. Aborting.");

			return false;
		}

		if (!is_array($entryids)) {
			$entryids = [$entryids];
		}

		/*
		 * If there are no properties to ignore as well as set then we can use mapi_folder_copymessages instead
		 * of mapi_copyto. mapi_folder_copymessages is much faster then copyto since it executes
		 * the copying on the server instead of in client.
		 */
		if (empty($ignoreProps) && empty($props)) {
			try {
				mapi_folder_copymessages($sourcefolder, $entryids, $destfolder, $moveMessages ? MESSAGE_MOVE : 0);
			}
			catch (MAPIException) {
				error_log(sprintf("mapi_folder_copymessages failed with code: 0x%08X. Wait 250ms and try again", mapi_last_hresult()));
				// wait 250ms before trying again
				usleep(250000);

				try {
					mapi_folder_copymessages($sourcefolder, $entryids, $destfolder, $moveMessages ? MESSAGE_MOVE : 0);
				}
				catch (MAPIException) {
					error_log(sprintf("2nd attempt of mapi_folder_copymessages also failed with code: 0x%08X. Abort.", mapi_last_hresult()));

					return false;
				}
			}
		}
		else {
			foreach ($entryids as $entryid) {
				$oldmessage = mapi_msgstore_openentry($store, $entryid);
				$newmessage = mapi_folder_createmessage($destfolder);

				mapi_copyto($oldmessage, [], $ignoreProps, $newmessage, 0);
				if (!empty($props)) {
					mapi_setprops($newmessage, $props);
				}
				mapi_savechanges($newmessage);
			}
			if ($moveMessages) {
				// while moving message we actually copy that particular message into
				// destination folder, and remove it from source folder. so we must have
				// to hard delete the message.
				mapi_folder_deletemessages($sourcefolder, $entryids, DELETE_HARD_DELETE);
			}
		}

		return true;
	}

	/**
	 * Set message read flag.
	 *
	 * @param object $store      MAPI Message Store Object
	 * @param string $entryid    entryid of the message
	 * @param int    $flags      Bitmask of values (read, has attachment etc.)
	 * @param array  $props      properties of the message
	 * @param mixed  $msg_action
	 *
	 * @return bool true if action succeeded, false if not
	 */
	public function setMessageFlag($store, $entryid, $flags, $msg_action = false, &$props = false) {
		$message = $this->openMessage($store, $entryid);

		if ($message) {
			/**
			 * convert flags of PR_MESSAGE_FLAGS property to flags that is
			 * used in mapi_message_setreadflag.
			 */
			$flag = MAPI_DEFERRED_ERRORS;		// set unread flag, read receipt will be sent

			if (($flags & MSGFLAG_RN_PENDING) && isset($msg_action['send_read_receipt']) && $msg_action['send_read_receipt'] == false) {
				$flag |= SUPPRESS_RECEIPT;
			}
			else {
				if (!($flags & MSGFLAG_READ)) {
					$flag |= CLEAR_READ_FLAG;
				}
			}

			mapi_message_setreadflag($message, $flag);

			if (is_array($props)) {
				$props = mapi_getprops($message, [PR_ENTRYID, PR_STORE_ENTRYID, PR_PARENT_ENTRYID]);
			}
		}

		return true;
	}

	/**
	 * Create a unique folder name based on a provided new folder name.
	 *
	 * checkFolderNameConflict() checks if a folder name conflict is caused by the given $foldername.
	 * This function is used for copying of moving a folder to another folder. It returns
	 * a unique foldername.
	 *
	 * @param object $store      MAPI Message Store Object
	 * @param object $folder     MAPI Folder Object
	 * @param string $foldername the folder name
	 *
	 * @return string correct foldername
	 */
	public function checkFolderNameConflict($store, $folder, $foldername) {
		$folderNames = [];

		$hierarchyTable = mapi_folder_gethierarchytable($folder, MAPI_DEFERRED_ERRORS);
		mapi_table_sort($hierarchyTable, [PR_DISPLAY_NAME => TABLE_SORT_ASCEND], TBL_BATCH);

		$subfolders = mapi_table_queryallrows($hierarchyTable, [PR_ENTRYID]);

		if (is_array($subfolders)) {
			foreach ($subfolders as $subfolder) {
				$folderObject = mapi_msgstore_openentry($store, $subfolder[PR_ENTRYID]);
				$folderProps = mapi_getprops($folderObject, [PR_DISPLAY_NAME]);

				array_push($folderNames, strtolower((string) $folderProps[PR_DISPLAY_NAME]));
			}
		}

		if (array_search(strtolower($foldername), $folderNames) !== false) {
			$i = 2;
			while (array_search(strtolower($foldername) . " ({$i})", $folderNames) !== false) {
				++$i;
			}
			$foldername .= " ({$i})";
		}

		return $foldername;
	}

	/**
	 * Set the recipients of a MAPI message.
	 *
	 * @param object $message    MAPI Message Object
	 * @param array  $recipients XML array structure of recipients
	 * @param bool   $send       true if we are going to send this message else false
	 */
	public function setRecipients($message, $recipients, $send = false) {
		if (empty($recipients)) {
			// no recipients are sent from client
			return;
		}

		$newRecipients = [];
		$removeRecipients = [];
		$modifyRecipients = [];

		if (isset($recipients['add']) && !empty($recipients['add'])) {
			$newRecipients = $this->createRecipientList($recipients['add'], 'add', false, $send);
		}

		if (isset($recipients['remove']) && !empty($recipients['remove'])) {
			$removeRecipients = $this->createRecipientList($recipients['remove'], 'remove');
		}

		if (isset($recipients['modify']) && !empty($recipients['modify'])) {
			$modifyRecipients = $this->createRecipientList($recipients['modify'], 'modify', false, $send);
		}

		if (!empty($removeRecipients)) {
			mapi_message_modifyrecipients($message, MODRECIP_REMOVE, $removeRecipients);
		}

		if (!empty($modifyRecipients)) {
			mapi_message_modifyrecipients($message, MODRECIP_MODIFY, $modifyRecipients);
		}

		if (!empty($newRecipients)) {
			mapi_message_modifyrecipients($message, MODRECIP_ADD, $newRecipients);
		}
	}

	/**
	 * Copy recipients from original message.
	 *
	 * If we are sending mail from a delegator's folder, we need to copy all recipients from the original message
	 *
	 * @param object      $message         MAPI Message Object
	 * @param MAPIMessage $copyFromMessage If set we copy all recipients from this message
	 */
	public function copyRecipients($message, $copyFromMessage = false) {
		$recipienttable = mapi_message_getrecipienttable($copyFromMessage);
		$messageRecipients = mapi_table_queryallrows($recipienttable, $GLOBALS["properties"]->getRecipientProperties());
		if (!empty($messageRecipients)) {
			mapi_message_modifyrecipients($message, MODRECIP_ADD, $messageRecipients);
		}
	}

	/**
	 * Set attachments in a MAPI message.
	 *
	 * This function reads any attachments that have been previously uploaded and copies them into
	 * the passed MAPI message resource. For a description of the dialog_attachments variable and
	 * generally how attachments work when uploading, see Operations::saveMessage()
	 *
	 * @see Operations::saveMessage()
	 *
	 * @param object          $message          MAPI Message Object
	 * @param array           $attachments      XML array structure of attachments
	 * @param AttachmentState $attachment_state the state object in which the attachments are saved
	 *                                          between different requests
	 */
	public function setAttachments($message, $attachments, $attachment_state) {
		// Check if attachments should be deleted. This is set in the "upload_attachment.php" file
		if (isset($attachments['dialog_attachments'])) {
			$deleted = $attachment_state->getDeletedAttachments($attachments['dialog_attachments']);
			if ($deleted) {
				foreach ($deleted as $attach_num) {
					try {
						mapi_message_deleteattach($message, (int) $attach_num);
					}
					catch (Exception) {
						continue;
					}
				}
				$attachment_state->clearDeletedAttachments($attachments['dialog_attachments']);
			}
		}

		$addedInlineAttachmentCidMapping = [];
		if (is_array($attachments) && !empty($attachments)) {
			// Set contentId to saved attachments.
			if (isset($attachments['add']) && is_array($attachments['add']) && !empty($attachments['add'])) {
				foreach ($attachments['add'] as $key => $attach) {
					if ($attach && isset($attach['inline']) && $attach['inline']) {
						$addedInlineAttachmentCidMapping[$attach['attach_num']] = $attach['cid'];
						$msgattachment = mapi_message_openattach($message, $attach['attach_num']);
						if ($msgattachment) {
							$props = [PR_ATTACH_CONTENT_ID => $attach['cid'], PR_ATTACHMENT_HIDDEN => true];
							mapi_setprops($msgattachment, $props);
							mapi_savechanges($msgattachment);
						}
					}
				}
			}

			// Delete saved inline images if removed from body.
			if (isset($attachments['remove']) && is_array($attachments['remove']) && !empty($attachments['remove'])) {
				foreach ($attachments['remove'] as $key => $attach) {
					if ($attach && isset($attach['inline']) && $attach['inline']) {
						$msgattachment = mapi_message_openattach($message, $attach['attach_num']);
						if ($msgattachment) {
							mapi_message_deleteattach($message, $attach['attach_num']);
							mapi_savechanges($message);
						}
					}
				}
			}
		}

		if ($attachments['dialog_attachments']) {
			$dialog_attachments = $attachments['dialog_attachments'];
		}
		else {
			return;
		}

		$files = $attachment_state->getAttachmentFiles($dialog_attachments);
		if ($files) {
			// Loop through the uploaded attachments
			foreach ($files as $tmpname => $fileinfo) {
				if ($fileinfo['sourcetype'] === 'embedded') {
					// open message which needs to be embedded
					$copyFromStore = $GLOBALS['mapisession']->openMessageStore(hex2bin((string) $fileinfo['store_entryid']));
					$copyFrom = mapi_msgstore_openentry($copyFromStore, hex2bin((string) $fileinfo['entryid']));

					$msgProps = mapi_getprops($copyFrom, [PR_SUBJECT]);

					// get message and copy it to attachment table as embedded attachment
					$props = [];
					$props[PR_EC_WA_ATTACHMENT_ID] = $fileinfo['attach_id'];
					$props[PR_ATTACH_METHOD] = ATTACH_EMBEDDED_MSG;
					$props[PR_DISPLAY_NAME] = !empty($msgProps[PR_SUBJECT]) ? $msgProps[PR_SUBJECT] : _('Untitled');

					// Create new attachment.
					$attachment = mapi_message_createattach($message);
					mapi_setprops($attachment, $props);

					$imessage = mapi_attach_openobj($attachment, MAPI_CREATE | MAPI_MODIFY);

					// Copy the properties from the source message to the attachment
					mapi_copyto($copyFrom, [], [], $imessage, 0); // includes attachments and recipients

					// save changes in the embedded message and the final attachment
					mapi_savechanges($imessage);
					mapi_savechanges($attachment);
				}
				elseif ($fileinfo['sourcetype'] === 'icsfile') {
					$messageStore = $GLOBALS['mapisession']->openMessageStore(hex2bin((string) $fileinfo['store_entryid']));
					$copyFrom = mapi_msgstore_openentry($messageStore, hex2bin((string) $fileinfo['entryid']));

					// Get addressbook for current session
					$addrBook = $GLOBALS['mapisession']->getAddressbook();

					// get message properties.
					$messageProps = mapi_getprops($copyFrom, [PR_SUBJECT]);

					// Read the appointment as RFC2445-formatted ics stream.
					$appointmentStream = mapi_mapitoical($GLOBALS['mapisession']->getSession(), $addrBook, $copyFrom, []);

					$filename = (!empty($messageProps[PR_SUBJECT])) ? $messageProps[PR_SUBJECT] : _('Untitled');
					$filename .= '.ics';

					$props = [
						PR_ATTACH_LONG_FILENAME => $filename,
						PR_DISPLAY_NAME => $filename,
						PR_ATTACH_METHOD => ATTACH_BY_VALUE,
						PR_ATTACH_DATA_BIN => "",
						PR_ATTACH_MIME_TAG => "application/octet-stream",
						PR_ATTACHMENT_HIDDEN => false,
						PR_EC_WA_ATTACHMENT_ID => isset($fileinfo["attach_id"]) && !empty($fileinfo["attach_id"]) ? $fileinfo["attach_id"] : uniqid(),
						PR_ATTACH_EXTENSION => pathinfo($filename, PATHINFO_EXTENSION),
					];

					$attachment = mapi_message_createattach($message);
					mapi_setprops($attachment, $props);

					// Stream the file to the PR_ATTACH_DATA_BIN property
					$stream = mapi_openproperty($attachment, PR_ATTACH_DATA_BIN, IID_IStream, 0, MAPI_CREATE | MAPI_MODIFY);
					mapi_stream_write($stream, $appointmentStream);

					// Commit the stream and save changes
					mapi_stream_commit($stream);
					mapi_savechanges($attachment);
				}
				else {
					$filepath = $attachment_state->getAttachmentPath($tmpname);
					if (is_file($filepath)) {
						// Set contentId if attachment is inline
						$cid = '';
						if (isset($addedInlineAttachmentCidMapping[$tmpname])) {
							$cid = $addedInlineAttachmentCidMapping[$tmpname];
						}

						// If a .p7m file was manually uploaded by the user, we must change the mime type because
						// otherwise mail applications will think the containing email is an encrypted email.
						// That will make Outlook crash, and it will make grommunio Web show the original mail as encrypted
						// without showing the attachment
						$mimeType = $fileinfo["type"];
						$smimeTags = ['multipart/signed', 'application/pkcs7-mime', 'application/x-pkcs7-mime'];
						if (in_array($mimeType, $smimeTags)) {
							$mimeType = "application/octet-stream";
						}

						// Set attachment properties
						$props = [
							PR_ATTACH_LONG_FILENAME => $fileinfo["name"],
							PR_DISPLAY_NAME => $fileinfo["name"],
							PR_ATTACH_METHOD => ATTACH_BY_VALUE,
							PR_ATTACH_DATA_BIN => "",
							PR_ATTACH_MIME_TAG => $mimeType,
							PR_ATTACHMENT_HIDDEN => !empty($cid) ? true : false,
							PR_EC_WA_ATTACHMENT_ID => isset($fileinfo["attach_id"]) && !empty($fileinfo["attach_id"]) ? $fileinfo["attach_id"] : uniqid(),
							PR_ATTACH_EXTENSION => pathinfo((string) $fileinfo["name"], PATHINFO_EXTENSION),
						];

						if (isset($fileinfo['sourcetype']) && $fileinfo['sourcetype'] === 'contactphoto') {
							$props[PR_ATTACHMENT_HIDDEN] = true;
							$props[PR_ATTACHMENT_CONTACTPHOTO] = true;
						}

						if (!empty($cid)) {
							$props[PR_ATTACH_CONTENT_ID] = $cid;
						}

						// Create attachment and set props
						$attachment = mapi_message_createattach($message);
						mapi_setprops($attachment, $props);

						// Stream the file to the PR_ATTACH_DATA_BIN property
						$stream = mapi_openproperty($attachment, PR_ATTACH_DATA_BIN, IID_IStream, 0, MAPI_CREATE | MAPI_MODIFY);
						$handle = fopen($filepath, "r");
						while (!feof($handle)) {
							$contents = fread($handle, BLOCK_SIZE);
							mapi_stream_write($stream, $contents);
						}

						// Commit the stream and save changes
						mapi_stream_commit($stream);
						mapi_savechanges($attachment);
						fclose($handle);
						unlink($filepath);
					}
				}
			}

			// Delete all the files in the state.
			$attachment_state->clearAttachmentFiles($dialog_attachments);
		}
	}

	/**
	 * Copy attachments from original message.
	 *
	 * @see Operations::saveMessage()
	 *
	 * @param object          $message                   MAPI Message Object
	 * @param string          $attachments
	 * @param MAPIMessage     $copyFromMessage           if set, copy the attachments from this message in addition to the uploaded attachments
	 * @param bool            $copyInlineAttachmentsOnly if true then copy only inline attachments
	 * @param AttachmentState $attachment_state          the state object in which the attachments are saved
	 *                                                   between different requests
	 */
	public function copyAttachments($message, $attachments, $copyFromMessage, $copyInlineAttachmentsOnly, $attachment_state) {
		$attachmentTable = mapi_message_getattachmenttable($copyFromMessage);
		if ($attachmentTable && isset($attachments['dialog_attachments'])) {
			$existingAttachments = mapi_table_queryallrows($attachmentTable, [PR_ATTACH_NUM, PR_ATTACH_SIZE, PR_ATTACH_LONG_FILENAME, PR_ATTACHMENT_HIDDEN, PR_DISPLAY_NAME, PR_ATTACH_METHOD, PR_ATTACH_CONTENT_ID]);
			$deletedAttachments = $attachment_state->getDeletedAttachments($attachments['dialog_attachments']);

			$plainText = $this->isPlainText($message);

			$properties = $GLOBALS['properties']->getMailProperties();
			$blockStatus = mapi_getprops($copyFromMessage, [PR_BLOCK_STATUS]);
			$blockStatus = Conversion::mapMAPI2XML($properties, $blockStatus);
			$isSafeSender = false;

			// Here if message is HTML and block status is empty then and then call isSafeSender function
			// to check that sender or sender's domain of original message was part of safe sender list.
			if (!$plainText && empty($blockStatus)) {
				$isSafeSender = $this->isSafeSender($copyFromMessage);
			}

			$body = false;
			foreach ($existingAttachments as $props) {
				// check if this attachment is "deleted"

				if ($deletedAttachments && in_array($props[PR_ATTACH_NUM], $deletedAttachments)) {
					// skip attachment, remove reference from state as it no longer applies.
					$attachment_state->removeDeletedAttachment($attachments['dialog_attachments'], $props[PR_ATTACH_NUM]);

					continue;
				}

				$old = mapi_message_openattach($copyFromMessage, $props[PR_ATTACH_NUM]);
				$isInlineAttachment = $attachment_state->isInlineAttachment($old);

				/*
				 * If reply/reply all message, then copy only inline attachments.
				 */
				if ($copyInlineAttachmentsOnly) {
					/*
					 * if message is reply/reply all and format is plain text than ignore inline attachments
					 * and normal attachments to copy from original mail.
					 */
					if ($plainText || !$isInlineAttachment) {
						continue;
					}
				}
				elseif ($plainText && $isInlineAttachment) {
					/*
					 * If message is forward and format of message is plain text then ignore only inline attachments from the
					 * original mail.
					 */
					continue;
				}

				/*
				 * If the inline attachment is referenced with an content-id,
				 * manually check if it's still referenced in the body otherwise remove it
				 */
				if ($isInlineAttachment) {
					// Cache body, so we stream it once
					if ($body === false) {
						$body = streamProperty($message, PR_HTML);
					}

					$contentID = $props[PR_ATTACH_CONTENT_ID];
					if (!str_contains($body, (string) $contentID)) {
						continue;
					}
				}

				/*
				 * if message is reply/reply all or forward and format of message is HTML but
				 * - inline attachments are not downloaded from external source
				 * - sender of original message is not safe sender
				 * - domain of sender is not part of safe sender list
				 * then ignore inline attachments from original message.
				 *
				 * NOTE : blockStatus is only generated when user has download inline image from external source.
				 * it should remains empty if user add the sender in to safe sender list.
				 */
				if (!$plainText && $isInlineAttachment && empty($blockStatus) && !$isSafeSender) {
					continue;
				}

				$new = mapi_message_createattach($message);

				try {
					mapi_copyto($old, [], [], $new, 0);
					mapi_savechanges($new);
				}
				catch (MAPIException $e) {
					// This is a workaround for the grommunio-web issue 75
					// Remove it after gromox issue 253 is resolved
					if ($e->getCode() == ecMsgCycle) {
						$oldstream = mapi_openproperty($old, PR_ATTACH_DATA_BIN, IID_IStream, 0, 0);
						$stat = mapi_stream_stat($oldstream);
						$props = mapi_attach_getprops($old, [PR_ATTACH_LONG_FILENAME, PR_ATTACH_MIME_TAG, PR_DISPLAY_NAME, PR_ATTACH_METHOD, PR_ATTACH_FILENAME, PR_ATTACHMENT_HIDDEN, PR_ATTACH_EXTENSION, PR_ATTACH_FLAGS]);

						mapi_setprops($new, [
							PR_ATTACH_LONG_FILENAME => $props[PR_ATTACH_LONG_FILENAME] ?? '',
							PR_ATTACH_MIME_TAG => $props[PR_ATTACH_MIME_TAG] ?? "application/octet-stream",
							PR_DISPLAY_NAME => $props[PR_DISPLAY_NAME] ?? '',
							PR_ATTACH_METHOD => $props[PR_ATTACH_METHOD] ?? ATTACH_BY_VALUE,
							PR_ATTACH_FILENAME => $props[PR_ATTACH_FILENAME] ?? '',
							PR_ATTACH_DATA_BIN => "",
							PR_ATTACHMENT_HIDDEN => $props[PR_ATTACHMENT_HIDDEN] ?? false,
							PR_ATTACH_EXTENSION => $props[PR_ATTACH_EXTENSION] ?? '',
							PR_ATTACH_FLAGS => $props[PR_ATTACH_FLAGS] ?? 0,
						]);
						$newstream = mapi_openproperty($new, PR_ATTACH_DATA_BIN, IID_IStream, 0, MAPI_CREATE | MAPI_MODIFY);
						mapi_stream_setsize($newstream, $stat['cb']);
						for ($i = 0; $i < $stat['cb']; $i += BLOCK_SIZE) {
							mapi_stream_write($newstream, mapi_stream_read($oldstream, BLOCK_SIZE));
						}
						mapi_stream_commit($newstream);
						mapi_savechanges($new);
					}
				}
			}
		}
	}

	/**
	 * Function was used to identify the sender or domain of original mail in safe sender list.
	 *
	 * @param MAPIMessage $copyFromMessage resource of the message from which we should get
	 *                                     the sender of message
	 *
	 * @return bool true if sender of original mail was safe sender else false
	 */
	public function isSafeSender($copyFromMessage) {
		$safeSenderList = $GLOBALS['settings']->get('zarafa/v1/contexts/mail/safe_senders_list');
		$senderEntryid = mapi_getprops($copyFromMessage, [PR_SENT_REPRESENTING_ENTRYID]);
		$senderEntryid = $senderEntryid[PR_SENT_REPRESENTING_ENTRYID];

		// If sender is user himself (which happens in case of "Send as New message") consider sender as safe
		if ($GLOBALS['entryid']->compareEntryIds($senderEntryid, $GLOBALS["mapisession"]->getUserEntryID())) {
			return true;
		}

		try {
			$mailuser = mapi_ab_openentry($GLOBALS["mapisession"]->getAddressbook(), $senderEntryid);
		}
		catch (MAPIException) {
			// The user might have a new uidNumber, which makes the user not resolve, see WA-7673
			// FIXME: Lookup the user by PR_SENDER_NAME or another attribute if PR_SENDER_ADDRTYPE is "EX"
			return false;
		}

		$addressType = mapi_getprops($mailuser, [PR_ADDRTYPE]);

		// Here it will check that sender of original mail was address book user.
		// If PR_ADDRTYPE is ZARAFA, it means sender of original mail was address book contact.
		if ($addressType[PR_ADDRTYPE] === 'EX') {
			$address = mapi_getprops($mailuser, [PR_SMTP_ADDRESS]);
			$address = $address[PR_SMTP_ADDRESS];
		}
		elseif ($addressType[PR_ADDRTYPE] === 'SMTP') {
			// If PR_ADDRTYPE is SMTP, it means sender of original mail was external sender.
			$address = mapi_getprops($mailuser, [PR_EMAIL_ADDRESS]);
			$address = $address[PR_EMAIL_ADDRESS];
		}

		// Obtain the Domain address from smtp/email address.
		$domain = substr((string) $address, strpos((string) $address, "@") + 1);

		if (!empty($safeSenderList)) {
			foreach ($safeSenderList as $safeSender) {
				if ($safeSender === $address || $safeSender === $domain) {
					return true;
				}
			}
		}

		return false;
	}

	/**
	 * get attachments information of a particular message.
	 *
	 * @param MapiMessage $message       MAPI Message Object
	 * @param bool        $excludeHidden exclude hidden attachments
	 */
	public function getAttachmentsInfo($message, $excludeHidden = false) {
		$attachmentsInfo = [];

		$hasattachProp = mapi_getprops($message, [PR_HASATTACH]);
		if (isset($hasattachProp[PR_HASATTACH]) && $hasattachProp[PR_HASATTACH]) {
			$attachmentTable = mapi_message_getattachmenttable($message);

			$attachments = mapi_table_queryallrows($attachmentTable, [PR_ATTACH_NUM, PR_ATTACH_SIZE, PR_ATTACH_LONG_FILENAME,
				PR_ATTACH_FILENAME, PR_ATTACHMENT_HIDDEN, PR_DISPLAY_NAME, PR_ATTACH_METHOD,
				PR_ATTACH_CONTENT_ID, PR_ATTACH_MIME_TAG,
				PR_ATTACHMENT_CONTACTPHOTO, PR_RECORD_KEY, PR_EC_WA_ATTACHMENT_ID, PR_OBJECT_TYPE, PR_ATTACH_EXTENSION, ]);
			foreach ($attachments as $attachmentRow) {
				$props = [];

				if (isset($attachmentRow[PR_ATTACH_MIME_TAG])) {
					if ($attachmentRow[PR_ATTACH_MIME_TAG]) {
						$props["filetype"] = $attachmentRow[PR_ATTACH_MIME_TAG];
					}

					$smimeTags = ['multipart/signed', 'application/pkcs7-mime', 'application/x-pkcs7-mime'];
					if (in_array($attachmentRow[PR_ATTACH_MIME_TAG], $smimeTags)) {
						// Ignore the message with attachment types set as smime as they are for smime
						continue;
					}
				}

				$attach_id = '';
				if (isset($attachmentRow[PR_EC_WA_ATTACHMENT_ID])) {
					$attach_id = $attachmentRow[PR_EC_WA_ATTACHMENT_ID];
				}
				elseif (isset($attachmentRow[PR_RECORD_KEY])) {
					$attach_id = bin2hex((string) $attachmentRow[PR_RECORD_KEY]);
				}
				else {
					$attach_id = uniqid();
				}

				$props["object_type"] = $attachmentRow[PR_OBJECT_TYPE];
				$props["attach_id"] = $attach_id;
				$props["attach_num"] = $attachmentRow[PR_ATTACH_NUM];
				$props["attach_method"] = $attachmentRow[PR_ATTACH_METHOD];
				$props["size"] = $attachmentRow[PR_ATTACH_SIZE];

				if (isset($attachmentRow[PR_ATTACH_CONTENT_ID]) && $attachmentRow[PR_ATTACH_CONTENT_ID]) {
					$props["cid"] = $attachmentRow[PR_ATTACH_CONTENT_ID];
				}

				$props["hidden"] = $attachmentRow[PR_ATTACHMENT_HIDDEN] ?? false;
				if ($excludeHidden && $props["hidden"]) {
					continue;
				}

				if (isset($attachmentRow[PR_ATTACH_LONG_FILENAME])) {
					$props["name"] = $attachmentRow[PR_ATTACH_LONG_FILENAME];
				}
				elseif (isset($attachmentRow[PR_ATTACH_FILENAME])) {
					$props["name"] = $attachmentRow[PR_ATTACH_FILENAME];
				}
				elseif (isset($attachmentRow[PR_DISPLAY_NAME])) {
					$props["name"] = $attachmentRow[PR_DISPLAY_NAME];
				}
				else {
					$props["name"] = "untitled";
				}

				if (isset($attachmentRow[PR_ATTACH_EXTENSION]) && $attachmentRow[PR_ATTACH_EXTENSION]) {
					$props["extension"] = $attachmentRow[PR_ATTACH_EXTENSION];
				}
				else {
					// For backward compatibility where attachments doesn't have the extension property
					$props["extension"] = pathinfo((string) $props["name"], PATHINFO_EXTENSION);
				}

				if (isset($attachmentRow[PR_ATTACHMENT_CONTACTPHOTO]) && $attachmentRow[PR_ATTACHMENT_CONTACTPHOTO]) {
					$props["attachment_contactphoto"] = $attachmentRow[PR_ATTACHMENT_CONTACTPHOTO];
					$props["hidden"] = true;

					// Open contact photo attachment in binary format.
					$attach = mapi_message_openattach($message, $props["attach_num"]);
				}

				if ($props["attach_method"] == ATTACH_EMBEDDED_MSG) {
					// open attachment to get the message class
					$attach = mapi_message_openattach($message, $props["attach_num"]);
					$embMessage = mapi_attach_openobj($attach);
					$embProps = mapi_getprops($embMessage, [PR_MESSAGE_CLASS]);
					if (isset($embProps[PR_MESSAGE_CLASS])) {
						$props["attach_message_class"] = $embProps[PR_MESSAGE_CLASS];
					}
				}

				array_push($attachmentsInfo, ["props" => $props]);
			}
		}

		return $attachmentsInfo;
	}

	/**
	 * get recipients information of a particular message.
	 *
	 * @param MapiMessage $message        MAPI Message Object
	 * @param bool        $excludeDeleted exclude deleted recipients
	 */
	public function getRecipientsInfo($message, $excludeDeleted = true) {
		$recipientsInfo = [];

		$recipientTable = mapi_message_getrecipienttable($message);
		if ($recipientTable) {
			$recipients = mapi_table_queryallrows($recipientTable, $GLOBALS['properties']->getRecipientProperties());

			foreach ($recipients as $recipientRow) {
				if ($excludeDeleted && isset($recipientRow[PR_RECIPIENT_FLAGS]) && (($recipientRow[PR_RECIPIENT_FLAGS] & recipExceptionalDeleted) == recipExceptionalDeleted)) {
					continue;
				}

				$props = [];
				$props['rowid'] = $recipientRow[PR_ROWID];
				$props['search_key'] = isset($recipientRow[PR_SEARCH_KEY]) ? bin2hex((string) $recipientRow[PR_SEARCH_KEY]) : '';
				$props['display_name'] = $recipientRow[PR_DISPLAY_NAME] ?? '';
				$props['email_address'] = $recipientRow[PR_EMAIL_ADDRESS] ?? '';
				$props['smtp_address'] = $recipientRow[PR_SMTP_ADDRESS] ?? '';
				$props['address_type'] = $recipientRow[PR_ADDRTYPE] ?? '';
				$props['object_type'] = $recipientRow[PR_OBJECT_TYPE] ?? MAPI_MAILUSER;
				$props['recipient_type'] = $recipientRow[PR_RECIPIENT_TYPE];
				$props['display_type'] = $recipientRow[PR_DISPLAY_TYPE] ?? DT_MAILUSER;
				$props['display_type_ex'] = $recipientRow[PR_DISPLAY_TYPE_EX] ?? DT_MAILUSER;

				if (isset($recipientRow[PR_RECIPIENT_FLAGS])) {
					$props['recipient_flags'] = $recipientRow[PR_RECIPIENT_FLAGS];
				}

				if (isset($recipientRow[PR_ENTRYID])) {
					$props['entryid'] = bin2hex((string) $recipientRow[PR_ENTRYID]);

					// Get the SMTP address from the addressbook if no address is found
					if (empty($props['smtp_address']) && ($recipientRow[PR_ADDRTYPE] == 'EX' || $props['address_type'] === 'ZARAFA')) {
						$recipientSearchKey = $recipientRow[PR_SEARCH_KEY] ?? false;
						$props['smtp_address'] = $this->getEmailAddress($recipientRow[PR_ENTRYID], $recipientSearchKey);
					}
				}

				// smtp address is still empty(in case of external email address) than
				// value of email address is copied into smtp address.
				if ($props['address_type'] == 'SMTP' && empty($props['smtp_address'])) {
					$props['smtp_address'] = $props['email_address'];
				}

				// PST importer imports items without an entryid and as SMTP recipient, this causes issues for
				// opening meeting requests with removed users as recipient.
				// gromox-kdb2mt might import items without an entryid and
				// PR_ADDRTYPE 'ZARAFA' which causes issues when opening such messages.
				if (empty($props['entryid']) && ($props['address_type'] === 'SMTP' || $props['address_type'] === 'ZARAFA')) {
					$props['entryid'] = bin2hex(mapi_createoneoff($props['display_name'], $props['address_type'], $props['smtp_address'], MAPI_UNICODE));
				}

				// Set propose new time properties
				if (isset($recipientRow[PR_RECIPIENT_PROPOSED], $recipientRow[PR_RECIPIENT_PROPOSEDSTARTTIME], $recipientRow[PR_RECIPIENT_PROPOSEDENDTIME])) {
					$props['proposednewtime_start'] = $recipientRow[PR_RECIPIENT_PROPOSEDSTARTTIME];
					$props['proposednewtime_end'] = $recipientRow[PR_RECIPIENT_PROPOSEDENDTIME];
					$props['proposednewtime'] = $recipientRow[PR_RECIPIENT_PROPOSED];
				}
				else {
					$props['proposednewtime'] = false;
				}

				$props['recipient_trackstatus'] = $recipientRow[PR_RECIPIENT_TRACKSTATUS] ?? olRecipientTrackStatusNone;
				$props['recipient_trackstatus_time'] = $recipientRow[PR_RECIPIENT_TRACKSTATUS_TIME] ?? null;

				array_push($recipientsInfo, ["props" => $props]);
			}
		}

		return $recipientsInfo;
	}

	/**
	 * Extracts email address from PR_SEARCH_KEY property if possible.
	 *
	 * @param string $searchKey The PR_SEARCH_KEY property
	 *
	 * @return string email address if possible else return empty string
	 */
	public function getEmailAddressFromSearchKey($searchKey) {
		if (str_contains($searchKey, ':') && str_contains($searchKey, '@')) {
			return trim(strtolower(explode(':', $searchKey)[1]));
		}

		return "";
	}

	/**
	 * Create a MAPI recipient list from an XML array structure.
	 *
	 * This functions is used for setting the recipient table of a message.
	 *
	 * @param array  $recipientList a list of recipients as XML array structure
	 * @param string $opType        the type of operation that will be performed on this recipient list (add, remove, modify)
	 * @param bool   $send          true if we are going to send this message else false
	 * @param mixed  $isException
	 *
	 * @return array list of recipients with the correct MAPI properties ready for mapi_message_modifyrecipients()
	 */
	public function createRecipientList($recipientList, $opType = 'add', $isException = false, $send = false) {
		$recipients = [];
		$addrbook = $GLOBALS["mapisession"]->getAddressbook();

		foreach ($recipientList as $recipientItem) {
			if ($isException) {
				// We do not add organizer to exception msg in organizer's calendar.
				if (isset($recipientItem[PR_RECIPIENT_FLAGS]) && $recipientItem[PR_RECIPIENT_FLAGS] == (recipSendable | recipOrganizer)) {
					continue;
				}

				$recipient[PR_RECIPIENT_FLAGS] = (recipSendable | recipExceptionalResponse | recipReserved);
			}

			if (!empty($recipientItem["smtp_address"]) && empty($recipientItem["email_address"])) {
				$recipientItem["email_address"] = $recipientItem["smtp_address"];
			}

			// When saving a mail we can allow an empty email address or entryid, but not when sending it
			if ($send && empty($recipientItem["email_address"]) && empty($recipientItem['entryid'])) {
				return;
			}

			// to modify or remove recipients we need PR_ROWID property
			if ($opType !== 'add' && (!isset($recipientItem['rowid']) || !is_numeric($recipientItem['rowid']))) {
				continue;
			}

			if (isset($recipientItem['search_key']) && !empty($recipientItem['search_key'])) {
				// search keys sent from client are in hex format so convert it to binary format
				$recipientItem['search_key'] = hex2bin((string) $recipientItem['search_key']);
			}

			if (isset($recipientItem["entryid"]) && !empty($recipientItem["entryid"])) {
				// entryids sent from client are in hex format so convert it to binary format
				$recipientItem["entryid"] = hex2bin((string) $recipientItem["entryid"]);

			// Only resolve the recipient when no entryid is set
			}
			else {
				/**
				 * For external contacts (DT_REMOTE_MAILUSER) email_address contains display name of contact
				 * which is obviously not unique so for that we need to resolve address based on smtp_address
				 * if provided.
				 */
				$addressToResolve = $recipientItem["email_address"];
				if (!empty($recipientItem["smtp_address"])) {
					$addressToResolve = $recipientItem["smtp_address"];
				}

				// Resolve the recipient
				$user = [[PR_DISPLAY_NAME => $addressToResolve]];

				try {
					// resolve users based on email address with strict matching
					$user = mapi_ab_resolvename($addrbook, $user, EMS_AB_ADDRESS_LOOKUP);
					$recipientItem["display_name"] = $user[0][PR_DISPLAY_NAME];
					$recipientItem["entryid"] = $user[0][PR_ENTRYID];
					$recipientItem["search_key"] = $user[0][PR_SEARCH_KEY];
					$recipientItem["email_address"] = $user[0][PR_EMAIL_ADDRESS];
					$recipientItem["address_type"] = $user[0][PR_ADDRTYPE];
				}
				catch (MAPIException $e) {
					// recipient is not resolved or it got multiple matches,
					// so ignore this error and continue with normal processing
					$e->setHandled();
				}
			}

			$recipient = [];
			$recipient[PR_DISPLAY_NAME] = $recipientItem["display_name"];
			$recipient[PR_DISPLAY_TYPE] = $recipientItem["display_type"];
			$recipient[PR_DISPLAY_TYPE_EX] = $recipientItem["display_type_ex"];
			$recipient[PR_EMAIL_ADDRESS] = $recipientItem["email_address"];
			$recipient[PR_SMTP_ADDRESS] = $recipientItem["smtp_address"];
			if (isset($recipientItem["search_key"])) {
				$recipient[PR_SEARCH_KEY] = $recipientItem["search_key"];
			}
			$recipient[PR_ADDRTYPE] = $recipientItem["address_type"];
			$recipient[PR_OBJECT_TYPE] = $recipientItem["object_type"];
			$recipient[PR_RECIPIENT_TYPE] = $recipientItem["recipient_type"];
			if ($opType != 'add') {
				$recipient[PR_ROWID] = $recipientItem["rowid"];
			}

			if (isset($recipientItem["recipient_status"]) && !empty($recipientItem["recipient_status"])) {
				$recipient[PR_RECIPIENT_TRACKSTATUS] = $recipientItem["recipient_status"];
			}

			if (isset($recipientItem["recipient_flags"]) && !empty($recipient["recipient_flags"])) {
				$recipient[PR_RECIPIENT_FLAGS] = $recipientItem["recipient_flags"];
			}
			else {
				$recipient[PR_RECIPIENT_FLAGS] = recipSendable;
			}

			if (isset($recipientItem["proposednewtime"]) && !empty($recipientItem["proposednewtime"]) && isset($recipientItem["proposednewtime_start"], $recipientItem["proposednewtime_end"])) {
				$recipient[PR_RECIPIENT_PROPOSED] = $recipientItem["proposednewtime"];
				$recipient[PR_RECIPIENT_PROPOSEDSTARTTIME] = $recipientItem["proposednewtime_start"];
				$recipient[PR_RECIPIENT_PROPOSEDENDTIME] = $recipientItem["proposednewtime_end"];
			}
			else {
				$recipient[PR_RECIPIENT_PROPOSED] = false;
			}

			// Use given entryid if possible, otherwise create a one-off entryid
			if (isset($recipientItem["entryid"]) && !empty($recipientItem["entryid"])) {
				$recipient[PR_ENTRYID] = $recipientItem["entryid"];
			}
			elseif ($send) {
				// only create one-off entryid when we are actually sending the message not saving it
				$recipient[PR_ENTRYID] = mapi_createoneoff($recipient[PR_DISPLAY_NAME], $recipient[PR_ADDRTYPE], $recipient[PR_EMAIL_ADDRESS]);
			}

			array_push($recipients, $recipient);
		}

		return $recipients;
	}

	/**
	 * Function which is get store of external resource from entryid.
	 *
	 * @param string $entryid entryid of the shared folder record
	 *
	 * @return object/boolean $store store of shared folder if found otherwise false
	 *
	 * FIXME: this function is pretty inefficient, since it opens the store for every
	 * shared user in the worst case. Might be that we could extract the guid from
	 * the $entryid and compare it and fetch the guid from the userentryid.
	 * C++ has a GetStoreGuidFromEntryId() function.
	 */
	public function getOtherStoreFromEntryid($entryid) {
		// Get all external user from settings
		$otherUsers = $GLOBALS['mapisession']->retrieveOtherUsersFromSettings();

		// Fetch the store of each external user and
		// find the record with given entryid
		foreach ($otherUsers as $sharedUser => $values) {
			$userEntryid = mapi_msgstore_createentryid($GLOBALS['mapisession']->getDefaultMessageStore(), $sharedUser);
			$store = $GLOBALS['mapisession']->openMessageStore($userEntryid);
			if ($GLOBALS['entryid']->hasContactProviderGUID($entryid)) {
				$entryid = $GLOBALS["entryid"]->unwrapABEntryIdObj($entryid);
			}

			try {
				$record = mapi_msgstore_openentry($store, hex2bin((string) $entryid));
				if ($record) {
					return $store;
				}
			}
			catch (MAPIException) {
			}
		}

		return false;
	}

	/**
	 * Function which is use to check the contact item (distribution list / contact)
	 * belongs to any external folder or not.
	 *
	 * @param string $entryid entryid of contact item
	 *
	 * @return bool true if contact item from external folder otherwise false.
	 *
	 * FIXME: this function is broken and returns true if the user is a contact in a shared store.
	 * Also research if we cannot just extract the GUID and compare it with our own GUID.
	 * FIXME This function should be renamed, because it's also meant for normal shared folder contacts.
	 */
	public function isExternalContactItem($entryid) {
		try {
			if (!$GLOBALS['entryid']->hasContactProviderGUID(bin2hex($entryid))) {
				$entryid = hex2bin((string) $GLOBALS['entryid']->wrapABEntryIdObj(bin2hex($entryid), MAPI_DISTLIST));
			}
			mapi_ab_openentry($GLOBALS["mapisession"]->getAddressbook(), $entryid);
		}
		catch (MAPIException) {
			return true;
		}

		return false;
	}

	/**
	 * Get object type from distlist type of member of distribution list.
	 *
	 * @param int $distlistType distlist type of distribution list
	 *
	 * @return int object type of distribution list
	 */
	public function getObjectTypeFromDistlistType($distlistType) {
		return match ($distlistType) {
			DL_DIST, DL_DIST_AB => MAPI_DISTLIST,
			default => MAPI_MAILUSER,
		};
	}

	/**
	 * Function which fetches all members of shared/internal(Local Contact Folder)
	 * folder's distribution list.
	 *
	 * @param string $distlistEntryid entryid of distribution list
	 * @param bool   $isRecursive     if there is/are distribution list(s) inside the distlist
	 *                                to expand all the members, pass true to expand distlist recursively, false to not expand
	 *
	 * @return array $members all members of a distribution list
	 */
	public function expandDistList($distlistEntryid, $isRecursive = false) {
		$properties = $GLOBALS['properties']->getDistListProperties();
		$eidObj = $GLOBALS['entryid']->createABEntryIdObj($distlistEntryid);
		$isMuidGuid = !$GLOBALS['entryid']->hasNoMuid('', $eidObj);
		$extidObj = $isMuidGuid ?
			$GLOBALS['entryid']->createMessageEntryIdObj($eidObj['extid']) :
			$GLOBALS['entryid']->createMessageEntryIdObj($GLOBALS['entryid']->createMessageEntryId($eidObj));

		$store = $GLOBALS["mapisession"]->getDefaultMessageStore();
		$contactFolderId = $this->getPropertiesFromStoreRoot($store, [PR_IPM_CONTACT_ENTRYID]);
		$contactFolderidObj = $GLOBALS['entryid']->createFolderEntryIdObj(bin2hex((string) $contactFolderId[PR_IPM_CONTACT_ENTRYID]));

		if ($contactFolderidObj['providerguid'] != $extidObj['providerguid'] && $contactFolderidObj['folderdbguid'] != $extidObj['folderdbguid']) {
			$storelist = $GLOBALS["mapisession"]->getAllMessageStores();
			foreach ($storelist as $storeObj) {
				$contactFolderId = $this->getPropertiesFromStoreRoot($storeObj, [PR_IPM_CONTACT_ENTRYID]);
				if (isset($contactFolderId[PR_IPM_CONTACT_ENTRYID])) {
					$contactFolderidObj = $GLOBALS['entryid']->createFolderEntryIdObj(bin2hex((string) $contactFolderId[PR_IPM_CONTACT_ENTRYID]));
					if ($contactFolderidObj['providerguid'] == $extidObj['providerguid'] && $contactFolderidObj['folderdbguid'] == $extidObj['folderdbguid']) {
						$store = $storeObj;
						break;
					}
				}
			}
		}

		if ($isMuidGuid) {
			$distlistEntryid = $GLOBALS["entryid"]->unwrapABEntryIdObj($distlistEntryid);
		}

		try {
			$distlist = $this->openMessage($store, hex2bin((string) $distlistEntryid));
		}
		catch (Exception) {
			// the distribution list is in a public folder
			$distlist = $this->openMessage($GLOBALS["mapisession"]->getPublicMessageStore(), hex2bin((string) $distlistEntryid));
		}

		// Retrieve the members from distribution list.
		$distlistMembers = $this->getMembersFromDistributionList($store, $distlist, $properties, $isRecursive);
		$recipients = [];

		foreach ($distlistMembers as $member) {
			$props = $this->convertDistlistMemberToRecipient($store, $member);
			array_push($recipients, $props);
		}

		return $recipients;
	}

	/**
	 * Function Which convert the shared/internal(local contact folder distlist)
	 * folder's distlist members to recipient type.
	 *
	 * @param mapistore $store  MAPI store of the message
	 * @param array     $member of distribution list contacts
	 *
	 * @return array members properties converted in to recipient
	 */
	public function convertDistlistMemberToRecipient($store, $member) {
		$entryid = $member["props"]["entryid"];
		$memberProps = $member["props"];
		$props = [];

		$distlistType = $memberProps["distlist_type"];
		$addressType = $memberProps["address_type"];

		$isGABDistlList = $distlistType == DL_DIST_AB && $addressType === "EX";
		$isLocalDistlist = $distlistType == DL_DIST && $addressType === "MAPIPDL";

		$isGABContact = $memberProps["address_type"] === 'EX';
		// If distlist_type is 0 then it means distlist member is external contact.
		// For mare please read server/core/constants.php
		$isLocalContact = !$isGABContact && $distlistType !== 0;

		/*
		 * If distribution list belongs to the local contact folder then open that contact and
		 * retrieve all properties which requires to prepare ideal recipient to send mail.
		 */
		if ($isLocalDistlist) {
			try {
				$distlist = $this->openMessage($store, hex2bin((string) $entryid));
			}
			catch (Exception) {
				$distlist = $this->openMessage($GLOBALS["mapisession"]->getPublicMessageStore(), hex2bin((string) $entryid));
			}

			$abProps = $this->getProps($distlist, $GLOBALS['properties']->getRecipientProperties());
			$props = $abProps["props"];

			$props["entryid"] = $GLOBALS["entryid"]->wrapABEntryIdObj($abProps["entryid"], MAPI_DISTLIST);
			$props["display_type"] = DT_DISTLIST;
			$props["display_type_ex"] = DT_DISTLIST;
			$props["address_type"] = $memberProps["address_type"];
			$emailAddress = !empty($memberProps["email_address"]) ? $memberProps["email_address"] : "";
			$props["smtp_address"] = $emailAddress;
			$props["email_address"] = $emailAddress;
		}
		elseif ($isGABContact || $isGABDistlList) {
			/*
			 * If contact or distribution list belongs to GAB then open that contact and
			 * retrieve all properties which requires to prepare ideal recipient to send mail.
			 */
			try {
				$abentry = mapi_ab_openentry($GLOBALS["mapisession"]->getAddressbook(), hex2bin((string) $entryid));
				$abProps = $this->getProps($abentry, $GLOBALS['properties']->getRecipientProperties());
				$props = $abProps["props"];
				$props["entryid"] = $abProps["entryid"];
			}
			catch (Exception $e) {
				// Throw MAPI_E_NOT_FOUND or MAPI_E_UNKNOWN_ENTRYID it may possible that contact is already
				// deleted from server. so just create recipient
				// with existing information of distlist member.
				// recipient is not valid so sender get report mail for that
				// particular recipient to inform that recipient is not exist.
				if ($e->getCode() == MAPI_E_NOT_FOUND || $e->getCode() == MAPI_E_UNKNOWN_ENTRYID) {
					$props["entryid"] = $memberProps["entryid"];
					$props["display_type"] = DT_MAILUSER;
					$props["display_type_ex"] = DT_MAILUSER;
					$props["display_name"] = $memberProps["display_name"];
					$props["smtp_address"] = $memberProps["email_address"];
					$props["email_address"] = $memberProps["email_address"];
					$props["address_type"] = !empty($memberProps["address_type"]) ? $memberProps["address_type"] : 'SMTP';
				}
				else {
					throw $e;
				}
			}
		}
		else {
			/*
			 * If contact is belongs to local/shared folder then prepare ideal recipient to send mail
			 * as per the contact type.
			 */
			$props["entryid"] = $isLocalContact ? $GLOBALS["entryid"]->wrapABEntryIdObj($entryid, MAPI_MAILUSER) : $memberProps["entryid"];
			$props["display_type"] = DT_MAILUSER;
			$props["display_type_ex"] = $isLocalContact ? DT_MAILUSER : DT_REMOTE_MAILUSER;
			$props["display_name"] = $memberProps["display_name"];
			$props["smtp_address"] = $memberProps["email_address"];
			$props["email_address"] = $memberProps["email_address"];
			$props["address_type"] = !empty($memberProps["address_type"]) ? $memberProps["address_type"] : 'SMTP';
		}

		// Set object type property into each member of distribution list
		$props["object_type"] = $this->getObjectTypeFromDistlistType($memberProps["distlist_type"]);

		return $props;
	}

	/**
	 * Parse reply-to value from PR_REPLY_RECIPIENT_ENTRIES property.
	 *
	 * @param string $flatEntryList the PR_REPLY_RECIPIENT_ENTRIES value
	 *
	 * @return array list of recipients in array structure
	 */
	public function readReplyRecipientEntry($flatEntryList) {
		$addressbook = $GLOBALS["mapisession"]->getAddressbook();
		$entryids = [];

		// Unpack number of entries, the byte count and the entries
		$unpacked = unpack('V1cEntries/V1cbEntries/a*', $flatEntryList);

		// $unpacked consists now of the following fields:
		//	'cEntries' => The number of entryids in our list
		//	'cbEntries' => The total number of bytes inside 'abEntries'
		//	'abEntries' => The list of Entryids
		//
		// Each 'abEntries' can be broken down into groups of 2 fields
		//	'cb' => The length of the entryid
		//	'entryid' => The entryid

		$position = 8; // sizeof(cEntries) + sizeof(cbEntries);

		for ($i = 0, $len = $unpacked['cEntries']; $i < $len; ++$i) {
			// Obtain the size for the current entry
			$size = unpack('a' . $position . '/V1cb/a*', $flatEntryList);

			// We have the size, now can obtain the bytes
			$entryid = unpack('a' . $position . '/V1cb/a' . $size['cb'] . 'entryid/a*', $flatEntryList);

			// unpack() will remove the NULL characters, re-add
			// them until we match the 'cb' length.
			while ($entryid['cb'] > strlen((string) $entryid['entryid'])) {
				$entryid['entryid'] .= chr(0x00);
			}

			$entryids[] = $entryid['entryid'];

			// sizeof(cb) + strlen(entryid)
			$position += 4 + $entryid['cb'];
		}

		$recipients = [];
		foreach ($entryids as $entryid) {
			// Check if entryid extracted, since unpack errors can not be caught.
			if (!$entryid) {
				continue;
			}

			// Handle malformed entryids
			try {
				$entry = mapi_ab_openentry($addressbook, $entryid);
				$props = mapi_getprops($entry, [PR_ENTRYID, PR_SEARCH_KEY, PR_OBJECT_TYPE, PR_DISPLAY_NAME, PR_ADDRTYPE, PR_EMAIL_ADDRESS]);

				// Put data in recipient array
				$recipients[] = $this->composeRecipient(count($recipients), $props);
			}
			catch (MAPIException $e) {
				try {
					$oneoff = mapi_parseoneoff($entryid);
				}
				catch (MAPIException $ex) {
					error_log(sprintf(
						"readReplyRecipientEntry unable to open AB entry and mapi_parseoneoff failed: %s - %s",
						get_mapi_error_name($ex->getCode()),
						$ex->getDisplayMessage()
					));

					continue;
				}
				if (!isset($oneoff['address'])) {
					error_log(sprintf(
						"readReplyRecipientEntry unable to open AB entry and oneoff address is not available: %s - %s ",
						get_mapi_error_name($e->getCode()),
						$e->getDisplayMessage()
					));

					continue;
				}

				$entryid = mapi_createoneoff($oneoff['name'] ?? '', $oneoff['type'] ?? 'SMTP', $oneoff['address']);
				$props = [
					PR_ENTRYID => $entryid,
					PR_DISPLAY_NAME => !empty($oneoff['name']) ? $oneoff['name'] : $oneoff['address'],
					PR_ADDRTYPE => $oneoff['type'] ?? 'SMTP',
					PR_EMAIL_ADDRESS => $oneoff['address'],
				];
				$recipients[] = $this->composeRecipient(count($recipients), $props);
			}
		}

		return $recipients;
	}

	private function composeRecipient($rowid, $props) {
		return [
			'rowid' => $rowid,
			'props' => [
				'entryid' => !empty($props[PR_ENTRYID]) ? bin2hex((string) $props[PR_ENTRYID]) : '',
				'object_type' => $props[PR_OBJECT_TYPE] ?? MAPI_MAILUSER,
				'search_key' => $props[PR_SEARCH_KEY] ?? '',
				'display_name' => !empty($props[PR_DISPLAY_NAME]) ? $props[PR_DISPLAY_NAME] : $props[PR_EMAIL_ADDRESS],
				'address_type' => $props[PR_ADDRTYPE] ?? 'SMTP',
				'email_address' => $props[PR_EMAIL_ADDRESS] ?? '',
				'smtp_address' => $props[PR_EMAIL_ADDRESS] ?? '',
			],
		];
	}

	/**
	 * Build full-page HTML from the TinyMCE HTML.
	 *
	 * This function basically takes the generated HTML from TinyMCE and embeds it in
	 * a standalone HTML page (including header and CSS) to form.
	 *
	 * @param string $body  This is the HTML created by the TinyMCE
	 * @param string $title Optional, this string is placed in the <title>
	 *
	 * @return string full HTML message
	 */
	public function generateBodyHTML($body, $title = "grommunio-web") {
		$html = "<!DOCTYPE html>" .
				"<html>\n" .
				"<head>\n" .
				"  <meta name=\"Generator\" content=\"grommunio-web v" . trim(file_get_contents('version')) . "\">\n" .
				"  <meta http-equiv=\"Content-Type\" content=\"text/html; charset=utf-8\">\n" .
				"  <title>" . htmlspecialchars($title) . "</title>\n";

		$html .= "</head>\n" .
				"<body>\n" .
				$body . "\n" .
				"</body>\n" .
				"</html>";

		return $html;
	}

	/**
	 * Calculate the total size for all items in the given folder.
	 *
	 * @param mapifolder $folder The folder for which the size must be calculated
	 *
	 * @return number The folder size
	 */
	public function calcFolderMessageSize($folder) {
		$folderProps = mapi_getprops($folder, [PR_MESSAGE_SIZE_EXTENDED]);

		return $folderProps[PR_MESSAGE_SIZE_EXTENDED] ?? 0;
	}

	/**
	 * Detect plaintext body type of message.
	 *
	 * @param mapimessage $message MAPI message resource to check
	 *
	 * @return bool TRUE if the message is a plaintext message, FALSE if otherwise
	 */
	public function isPlainText($message) {
		$props = mapi_getprops($message, [PR_NATIVE_BODY_INFO]);
		if (isset($props[PR_NATIVE_BODY_INFO]) && $props[PR_NATIVE_BODY_INFO] == 1) {
			return true;
		}

		return false;
	}

	/**
	 * Parse email recipient list and add all e-mail addresses to the recipient history.
	 *
	 * The recipient history is used for auto-suggestion when writing e-mails. This function
	 * opens the recipient history property (PR_EC_RECIPIENT_HISTORY_JSON) and updates or appends
	 * it with the passed email addresses.
	 *
	 * @param array $recipients list of recipients
	 */
	public function addRecipientsToRecipientHistory($recipients) {
		$emailAddress = [];
		foreach ($recipients as $key => $value) {
			$emailAddresses[] = $value['props'];
		}

		if (empty($emailAddresses)) {
			return;
		}

		// Retrieve the recipient history
		$store = $GLOBALS["mapisession"]->getDefaultMessageStore();
		$storeProps = mapi_getprops($store, [PR_EC_RECIPIENT_HISTORY_JSON]);
		$recipient_history = [];

		if (isset($storeProps[PR_EC_RECIPIENT_HISTORY_JSON]) || propIsError(PR_EC_RECIPIENT_HISTORY_JSON, $storeProps) == MAPI_E_NOT_ENOUGH_MEMORY) {
			$datastring = streamProperty($store, PR_EC_RECIPIENT_HISTORY_JSON);

			if (!empty($datastring)) {
				$recipient_history = json_decode_data($datastring, true);
			}
		}

		$l_aNewHistoryItems = [];
		// Loop through all new recipients
		for ($i = 0, $len = count($emailAddresses); $i < $len; ++$i) {
			if ($emailAddresses[$i]['address_type'] == 'SMTP') {
				$emailAddress = $emailAddresses[$i]['smtp_address'];
				if (empty($emailAddress)) {
					$emailAddress = $emailAddresses[$i]['email_address'];
				}
			}
			else { // address_type == 'EX' || address_type == 'MAPIPDL'
				$emailAddress = $emailAddresses[$i]['email_address'];
				if (empty($emailAddress)) {
					$emailAddress = $emailAddresses[$i]['smtp_address'];
				}
			}

			// If no email address property is found, then we can't
			// generate a valid suggestion.
			if (empty($emailAddress)) {
				continue;
			}

			$l_bFoundInHistory = false;
			// Loop through all the recipients in history
			if (is_array($recipient_history) && !empty($recipient_history['recipients'])) {
				for ($j = 0, $lenJ = count($recipient_history['recipients']); $j < $lenJ; ++$j) {
					// Email address already found in history
					$l_bFoundInHistory = false;

					// The address_type property must exactly match,
					// when it does, a recipient matches the suggestion
					// if it matches to either the email_address or smtp_address.
					if ($emailAddresses[$i]['address_type'] === $recipient_history['recipients'][$j]['address_type']) {
						if ($emailAddress == $recipient_history['recipients'][$j]['email_address'] ||
							$emailAddress == $recipient_history['recipients'][$j]['smtp_address']) {
							$l_bFoundInHistory = true;
						}
					}

					if ($l_bFoundInHistory === true) {
						// Check if a name has been supplied.
						$newDisplayName = trim((string) $emailAddresses[$i]['display_name']);
						if (!empty($newDisplayName)) {
							$oldDisplayName = trim((string) $recipient_history['recipients'][$j]['display_name']);

							// Check if the name is not the same as the email address
							if ($newDisplayName != $emailAddresses[$i]['smtp_address']) {
								$recipient_history['recipients'][$j]['display_name'] = $newDisplayName;
							// Check if the recipient history has no name for this email
							}
							elseif (empty($oldDisplayName)) {
								$recipient_history['recipients'][$j]['display_name'] = $newDisplayName;
							}
						}
						++$recipient_history['recipients'][$j]['count'];
						$recipient_history['recipients'][$j]['last_used'] = time();
						break;
					}
				}
			}
			if (!$l_bFoundInHistory && !isset($l_aNewHistoryItems[$emailAddress])) {
				$l_aNewHistoryItems[$emailAddress] = [
					'display_name' => $emailAddresses[$i]['display_name'],
					'smtp_address' => $emailAddresses[$i]['smtp_address'],
					'email_address' => $emailAddresses[$i]['email_address'],
					'address_type' => $emailAddresses[$i]['address_type'],
					'count' => 1,
					'last_used' => time(),
					'object_type' => $emailAddresses[$i]['object_type'],
				];
			}
		}
		if (!empty($l_aNewHistoryItems)) {
			foreach ($l_aNewHistoryItems as $l_aValue) {
				$recipient_history['recipients'][] = $l_aValue;
			}
		}

		$l_sNewRecipientHistoryJSON = json_encode($recipient_history);

		$stream = mapi_openproperty($store, PR_EC_RECIPIENT_HISTORY_JSON, IID_IStream, 0, MAPI_CREATE | MAPI_MODIFY);
		mapi_stream_setsize($stream, strlen($l_sNewRecipientHistoryJSON));
		mapi_stream_write($stream, $l_sNewRecipientHistoryJSON);
		mapi_stream_commit($stream);
		mapi_savechanges($store);
	}

	/**
	 * Get the SMTP e-mail of an addressbook entry.
	 *
	 * @param string $entryid Addressbook entryid of object
	 *
	 * @return string SMTP e-mail address of that entry or FALSE on error
	 */
	public function getEmailAddressFromEntryID($entryid) {
		try {
			$mailuser = mapi_ab_openentry($GLOBALS["mapisession"]->getAddressbook(), $entryid);
		}
		catch (MAPIException $e) {
			// if any invalid entryid is passed in this function then it should silently ignore it
			// and continue with execution
			if ($e->getCode() == MAPI_E_UNKNOWN_ENTRYID) {
				$e->setHandled();

				return "";
			}
		}

		if (!isset($mailuser)) {
			return "";
		}

		$abprops = mapi_getprops($mailuser, [PR_SMTP_ADDRESS, PR_EMAIL_ADDRESS]);

		return $abprops[PR_SMTP_ADDRESS] ?? $abprops[PR_EMAIL_ADDRESS] ?? "";
	}

	/**
	 * Function which fetches all members of a distribution list recursively.
	 *
	 * @param resource $store        MAPI Message Store Object
	 * @param resource $message      the distribution list message
	 * @param array    $properties   array of properties to get properties of distlist
	 * @param bool     $isRecursive  function will be called recursively if there is/are
	 *                               distribution list inside the distlist to expand all the members,
	 *                               pass true to expand distlist recursively, false to not expand
	 * @param array    $listEntryIDs list of already expanded Distribution list from contacts folder,
	 *                               This parameter is used for recursive call of the function
	 *
	 * @return object $items all members of a distlist
	 */
	public function getMembersFromDistributionList($store, $message, $properties, $isRecursive = false, $listEntryIDs = []) {
		$items = [];

		$props = mapi_getprops($message, [$properties['oneoff_members'], $properties['members'], PR_ENTRYID]);

		// only continue when we have something to expand
		if (!isset($props[$properties['oneoff_members']]) || !isset($props[$properties['members']])) {
			return [];
		}

		if ($isRecursive) {
			// when opening sub message we will not have entryid, so use entryid only when we have it
			if (isset($props[PR_ENTRYID])) {
				// for preventing recursion we need to store entryids, and check if the same distlist is going to be expanded again
				if (in_array($props[PR_ENTRYID], $listEntryIDs)) {
					// don't expand a distlist that is already expanded
					return [];
				}

				$listEntryIDs[] = $props[PR_ENTRYID];
			}
		}

		$members = $props[$properties['members']];

		// parse oneoff members
		$oneoffmembers = [];
		foreach ($props[$properties['oneoff_members']] as $key => $item) {
			$oneoffmembers[$key] = mapi_parseoneoff($item);
		}

		foreach ($members as $key => $item) {
			/*
			 * PHP 5.5.0 and greater has made the unpack function incompatible with previous versions by changing:
			 * - a = code now retains trailing NULL bytes.
			 * - A = code now strips all trailing ASCII whitespace (spaces, tabs, newlines, carriage
			 * returns, and NULL bytes).
			 * for more http://php.net/manual/en/function.unpack.php
			 */
			if (version_compare(PHP_VERSION, '5.5.0', '>=')) {
				$parts = unpack('Vnull/A16guid/Ctype/a*entryid', (string) $item);
			}
			else {
				$parts = unpack('Vnull/A16guid/Ctype/A*entryid', (string) $item);
			}

			$memberItem = [];
			$memberItem['props'] = [];
			$memberItem['props']['distlist_type'] = $parts['type'];

			if ($parts['guid'] === hex2bin('812b1fa4bea310199d6e00dd010f5402')) {
				// custom e-mail address (no user or contact)
				$oneoff = mapi_parseoneoff($item);

				$memberItem['props']['display_name'] = $oneoff['name'];
				$memberItem['props']['address_type'] = $oneoff['type'];
				$memberItem['props']['email_address'] = $oneoff['address'];
				$memberItem['props']['smtp_address'] = $oneoff['address'];
				$memberItem['props']['entryid'] = bin2hex((string) $members[$key]);

				$items[] = $memberItem;
			}
			else {
				if ($parts['type'] === DL_DIST && $isRecursive) {
					// Expand distribution list to get distlist members inside the distributionlist.
					$distlist = mapi_msgstore_openentry($store, $parts['entryid']);
					$items = array_merge($items, $this->getMembersFromDistributionList($store, $distlist, $properties, true, $listEntryIDs));
				}
				else {
					$memberItem['props']['entryid'] = bin2hex((string) $parts['entryid']);
					$memberItem['props']['display_name'] = $oneoffmembers[$key]['name'];
					$memberItem['props']['address_type'] = $oneoffmembers[$key]['type'];
					// distribution lists don't have valid email address so ignore that property

					if ($parts['type'] !== DL_DIST) {
						$memberItem['props']['email_address'] = $oneoffmembers[$key]['address'];

						// internal members in distribution list don't have smtp address so add add that property
						$memberProps = $this->convertDistlistMemberToRecipient($store, $memberItem);
						$memberItem['props']['smtp_address'] = $memberProps["smtp_address"] ?? $memberProps["email_address"];
					}

					$items[] = $memberItem;
				}
			}
		}

		return $items;
	}

	/**
	 * Convert inline image <img src="data:image/mimetype;.date> links in HTML email
	 * to CID embedded images. Which are supported in major mail clients or
	 * providers such as outlook.com or gmail.com.
	 *
	 * grommunio Web now extracts the base64 image, saves it as hidden attachment,
	 * replace the img src tag with the 'cid' which corresponds with the attachments
	 * cid.
	 *
	 * @param MAPIMessage $message the distribution list message
	 */
	public function convertInlineImage($message) {
		$body = streamProperty($message, PR_HTML);
		$imageIDs = [];

		// Only load the DOM if the HTML contains a img or data:text/plain due to a bug
		// in Chrome on Windows in combination with TinyMCE.
		if (str_contains($body, "img") || str_contains($body, "data:text/plain")) {
			$doc = new DOMDocument();
			$cpprops = mapi_message_getprops($message, [PR_INTERNET_CPID]);
			$codepage = $cpprops[PR_INTERNET_CPID] ?? 1252;
			$hackEncoding = '<meta http-equiv="Content-Type" content="text/html; charset=' . Conversion::getCodepageCharset($codepage) . '">';
			// TinyMCE does not generate valid HTML, so we must suppress warnings.
			@$doc->loadHTML($hackEncoding . $body);
			$images = $doc->getElementsByTagName('img');
			$saveChanges = false;

			foreach ($images as $image) {
				$src = $image->getAttribute('src');

				if (!str_contains($src, "cid:") && (str_contains($src, "data:image") ||
					str_contains($body, "data:text/plain"))) {
					$saveChanges = true;

					// Extract mime type data:image/jpeg;
					$firstOffset = strpos($src, '/') + 1;
					$endOffset = strpos($src, ';');
					$mimeType = substr($src, $firstOffset, $endOffset - $firstOffset);

					$dataPosition = strpos($src, ",");
					// Extract encoded data
					$rawImage = base64_decode(substr($src, $dataPosition + 1, strlen($src)));

					$uniqueId = uniqid();
					$image->setAttribute('src', 'cid:' . $uniqueId);
					// TinyMCE adds an extra inline image for some reason, remove it.
					$image->setAttribute('data-mce-src', '');

					array_push($imageIDs, $uniqueId);

					// Create hidden attachment with CID
					$inlineImage = mapi_message_createattach($message);
					$props = [
						PR_ATTACH_METHOD => ATTACH_BY_VALUE,
						PR_ATTACH_CONTENT_ID => $uniqueId,
						PR_ATTACHMENT_HIDDEN => true,
						PR_ATTACH_FLAGS => 4,
						PR_ATTACH_MIME_TAG => $mimeType !== 'plain' ? 'image/' . $mimeType : 'image/png',
					];
					mapi_setprops($inlineImage, $props);

					$stream = mapi_openproperty($inlineImage, PR_ATTACH_DATA_BIN, IID_IStream, 0, MAPI_CREATE | MAPI_MODIFY);
					mapi_stream_setsize($stream, strlen($rawImage));
					mapi_stream_write($stream, $rawImage);
					mapi_stream_commit($stream);
					mapi_savechanges($inlineImage);
				}
				elseif (str_contains($src, "cid:")) {
					// Check for the cid(there may be http: ) is in the image src. push the cid
					// to $imageIDs array. which further used in clearDeletedInlineAttachments function.

					$firstOffset = strpos($src, ":") + 1;
					$cid = substr($src, $firstOffset);
					array_push($imageIDs, $cid);
				}
			}

			if ($saveChanges) {
				// Write the <img src="cid:data"> changes to the HTML property
				$body = $doc->saveHTML();
				$stream = mapi_openproperty($message, PR_HTML, IID_IStream, 0, MAPI_MODIFY);
				mapi_stream_setsize($stream, strlen($body));
				mapi_stream_write($stream, $body);
				mapi_stream_commit($stream);
				mapi_savechanges($message);
			}
		}
		$this->clearDeletedInlineAttachments($message, $imageIDs);
	}

	/**
	 * Delete the deleted inline image attachment from attachment store.
	 *
	 * @param MAPIMessage $message  the distribution list message
	 * @param array       $imageIDs Array of existing inline image PR_ATTACH_CONTENT_ID
	 */
	public function clearDeletedInlineAttachments($message, $imageIDs = []) {
		$attachmentTable = mapi_message_getattachmenttable($message);

		$restriction = [RES_AND, [
			[RES_PROPERTY,
				[
					RELOP => RELOP_EQ,
					ULPROPTAG => PR_ATTACHMENT_HIDDEN,
					VALUE => [PR_ATTACHMENT_HIDDEN => true],
				],
			],
			[RES_EXIST,
				[
					ULPROPTAG => PR_ATTACH_CONTENT_ID,
				],
			],
		]];

		$attachments = mapi_table_queryallrows($attachmentTable, [PR_ATTACH_CONTENT_ID, PR_ATTACH_NUM], $restriction);
		foreach ($attachments as $attachment) {
			$clearDeletedInlineAttach = array_search($attachment[PR_ATTACH_CONTENT_ID], $imageIDs) === false;
			if ($clearDeletedInlineAttach) {
				mapi_message_deleteattach($message, $attachment[PR_ATTACH_NUM]);
			}
		}
	}

	/**
	 * This function will fetch the user from mapi session and retrieve its LDAP image.
	 * It will return the compressed image using php's GD library.
	 *
	 * @param string $userEntryId       The user entryid which is going to open
	 * @param int    $compressedQuality The compression factor ranges from 0 (high) to 100 (low)
	 *                                  Default value is set to 10 which is nearly
	 *                                  extreme compressed image
	 *
	 * @return string A base64 encoded string (data url)
	 */
	public function getCompressedUserImage($userEntryId, $compressedQuality = 10) {
		try {
			$user = $GLOBALS['mapisession']->getUser($userEntryId);
		}
		catch (Exception $e) {
			$msg = "Problem while getting a user from the addressbook. Error %s : %s.";
			$formattedMsg = sprintf($msg, $e->getCode(), $e->getMessage());
			error_log($formattedMsg);
			Log::Write(LOGLEVEL_ERROR, "Operations:getCompressedUserImage() " . $formattedMsg);

			return "";
		}

		$userImageProp = mapi_getprops($user, [PR_EMS_AB_THUMBNAIL_PHOTO]);
		if (isset($userImageProp[PR_EMS_AB_THUMBNAIL_PHOTO])) {
			return $this->compressedImage($userImageProp[PR_EMS_AB_THUMBNAIL_PHOTO], $compressedQuality);
		}

		return "";
	}

	/**
	 * Function used to compressed the image.
	 *
	 * @param string $image the image which is going to compress
	 * @param int compressedQuality The compression factor range from 0 (high) to 100 (low)
	 * Default value is set to 10 which is nearly extreme compressed image
	 * @param mixed $compressedQuality
	 *
	 * @return string A base64 encoded string (data url)
	 */
	public function compressedImage($image, $compressedQuality = 10) {
		// Proceed only when GD library's functions and user image data are available.
		if (function_exists('imagecreatefromstring')) {
			try {
				$image = imagecreatefromstring($image);
			}
			catch (Exception $e) {
				$msg = "Problem while creating image from string. Error %s : %s.";
				$formattedMsg = sprintf($msg, $e->getCode(), $e->getMessage());
				error_log($formattedMsg);
				Log::Write(LOGLEVEL_ERROR, "Operations:compressedImage() " . $formattedMsg);
			}

			if ($image !== false) {
				// We need to use buffer because imagejpeg will give output as image in browser or file.
				ob_start();
				imagejpeg($image, null, $compressedQuality);
				$compressedImg = ob_get_contents();
				ob_end_clean();

				// Free up memory space acquired by image.
				imagedestroy($image);

				return strlen($compressedImg) > 0 ? "data:image/jpg;base64," . base64_encode($compressedImg) : "";
			}
		}

		return "";
	}

	public function getPropertiesFromStoreRoot($store, $props) {
		$root = mapi_msgstore_openentry($store);

		return mapi_getprops($root, $props);
	}

	/**
	 * Returns the encryption key for sodium functions.
	 *
	 * It will generate a new one if the user doesn't have an encryption key yet.
	 * It will also save the key into EncryptionStore for this session if the key
	 * wasn't there yet.
	 *
	 * @return string
	 */
	public function getFilesEncryptionKey() {
		// fallback if FILES_ACCOUNTSTORE_V1_SECRET_KEY is defined globally
		$key = defined('FILES_ACCOUNTSTORE_V1_SECRET_KEY') ? hex2bin((string) constant('FILES_ACCOUNTSTORE_V1_SECRET_KEY')) : null;
		if ($key === null) {
			$encryptionStore = EncryptionStore::getInstance();
			$key = $encryptionStore->get('filesenckey');
			if ($key === null) {
				$store = $GLOBALS["mapisession"]->getDefaultMessageStore();
				$props = mapi_getprops($store, [PR_EC_WA_FILES_ENCRYPTION_KEY]);
				if (isset($props[PR_EC_WA_FILES_ENCRYPTION_KEY])) {
					$key = $props[PR_EC_WA_FILES_ENCRYPTION_KEY];
				}
				else {
					$key = sodium_crypto_secretbox_keygen();
					$encryptionStore->add('filesenckey', $key);
					mapi_setprops($store, [PR_EC_WA_FILES_ENCRYPTION_KEY => $key]);
					mapi_savechanges($store);
				}
			}
		}

		return $key;
	}
}
