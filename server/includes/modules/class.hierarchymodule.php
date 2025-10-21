<?php

/**
 * Hierarchy Module.
 *
 * @todo
 * - Check the code at deleteFolder and at copyFolder. Looks the same.
 */
class HierarchyModule extends Module {
	private $store_entryid;

	/**
	 * Constructor.
	 *
	 * @param int   $id   unique id
	 * @param array $data list of all actions
	 */
	public function __construct($id, $data) {
		$this->properties = $GLOBALS["properties"]->getFolderProperties();
		$this->list_properties = $GLOBALS["properties"]->getFolderListProperties();

		parent::__construct($id, $data);
	}

	/**
	 * Creates the notifiers for this module,
	 * and register them to the Bus.
	 */
	public function createNotifiers() {
		$entryid = $this->getEntryID();
		$GLOBALS["bus"]->registerNotifier('hierarchynotifier', $entryid, true);
		$GLOBALS["bus"]->registerNotifier('hierarchynotifier', REQUEST_ENTRYID);
		$GLOBALS["bus"]->registerNotifier('newmailnotifier', REQUEST_ENTRYID);
	}

	/**
	 * Function which returns a list of entryids, which is used to register this module. It
	 * returns the ipm_subtree entryids of every message store.
	 *
	 * @return array list of entryids
	 */
	#[Override]
	public function getEntryID() {
		$entryids = [];
		$storelist = $GLOBALS["mapisession"]->getAllMessageStores();

		foreach ($storelist as $entryid => $store) {
			$entryids[] = bin2hex((string) $entryid);
		}

		return $entryids;
	}

	/**
	 * Executes all the actions in the $data variable.
	 */
	#[Override]
	public function execute() {
		foreach ($this->data as $actionType => $action) {
			if (!isset($actionType)) {
				continue;
			}

			try {
				$store = $this->getActionStore($action);
				$parententryid = $this->getActionParentEntryID($action);
				$entryid = $this->getActionEntryID($action);
				$this->store_entryid = $action["store_entryid"] ?? '';

				switch ($actionType) {
					case "keepalive":
						/*
						 * as we haven't done any processing here but still we need to send
						 * success message to client so client can know that there isn't any problem
						 * on server side (this will also make bus class happy as it will cry when
						 * there isn't any data to send to client).
						 */
						$this->sendFeedback(true);
						break;

					case "destroysession":
						// This actiontype should never get this far, but should already have been
						// intercepted by the Session class.
						// Nevertheless implement processing here for unforeseen cases.
						$this->sendFeedback(true);
						break;

					case "list":
						$this->hierarchyList();
						break;

					case "open":
						$folder = mapi_msgstore_openentry($store, $entryid);
						$data = $this->getFolderProps($store, $folder);

						// return response
						$this->addActionData("item", $data);
						$GLOBALS["bus"]->addData($this->getResponseData());
						break;

					case "foldersize":
						$folders = [];

						$folder = mapi_msgstore_openentry($store, $entryid);
						$data = $this->getFolderProps($store, $folder);

						$info = $this->getFolderSize($store, $folder, '', $folders);

						// It could be that the $props already contains the data,
						// this happens when the folder is the IPM_SUBTREE and the
						// folder size is read directly from the store. Adjust
						// total_size accordingly.
						if (isset($data["props"]["store_size"])) {
							if (!isset($data["props"]["message_size"])) {
								$data["props"]["message_size"] = $data["props"]["store_size"];
							}
							$data["props"]["total_message_size"] = $data["props"]["store_size"] + $info["total_size"];
						}
						else {
							$data["props"]["message_size"] = $info["size"];
							$data["props"]["total_message_size"] = $info["total_size"];
						}
						$data["folders"] = [
							"item" => $folders,
						];

						// return response
						$this->addActionData("item", $data);
						$GLOBALS["bus"]->addData($this->getResponseData());
						break;

					case "delete":
						if (!$store || !$parententryid || !$entryid) {
							break;
						}
						if (!isset($action["message_action"], $action["message_action"]["action_type"]) ||
							$action["message_action"]["action_type"] !== "removefavorites") {
							$this->deleteFolder($store, $parententryid, $entryid, $action);
							break;
						}
						if (!isset($action["message_action"]["isSearchFolder"]) ||
							!$action["message_action"]["isSearchFolder"]) {
							$this->removeFromFavorite($entryid);
							break;
						}
						$result = $this->deleteSearchFolder($store, $parententryid, $entryid, $action);
						dump($result, '$result');
						if ($result) {
							$this->sendFeedback(true);
						}
						break;

					case "save":
						if (!$store || !$parententryid) {
							break;
						}
						if ($entryid) {
							// The "message_action" object has been set, check the action_type field for
							// the exact action which must be taken.
							// Supported actions:
							//   - copy: Copy the folder to the new destination folder
							//   - move: Move the folder to the new destination folder
							//   - emptyfolder: Delete all items within the folder
							//   - readflags: Mark all items within the folder as read
							//   - addtofavorites: Add the folder to "favorites"
							if (!isset($action["message_action"]["isSearchFolder"])) {
								$folder = mapi_msgstore_openentry($store, $entryid);
								$data = $this->getFolderProps($store, $folder);
							}
							if (isset($action["message_action"], $action["message_action"]["action_type"])) {
								switch ($action["message_action"]["action_type"]) {
									case "copy":
									case "move":
										$destentryid = false;
										if (isset($action["message_action"]["destination_parent_entryid"])) {
											$destentryid = hex2bin($action["message_action"]["destination_parent_entryid"]);
										}

										$deststore = $store;
										if (isset($action["message_action"]["destination_store_entryid"])) {
											$deststore = $GLOBALS['mapisession']->openMessageStore(hex2bin($action["message_action"]["destination_store_entryid"]));
										}

										if ($destentryid && $deststore) {
											$this->copyFolder($store, $parententryid, $entryid, $destentryid, $deststore, $action["message_action"]["action_type"] == "move");
										}
										if ($data["props"]["container_class"] === "IPF.Contact") {
											$GLOBALS["bus"]->notify(ADDRESSBOOK_ENTRYID, OBJECT_SAVE);
										}
										break;

									case "emptyfolder":
										$this->emptyFolder($store, $entryid);
										break;

									case "readflags":
										$this->setReadFlags($store, $entryid);
										break;

									case "addtofavorites":
										if (isset($action["message_action"]["isSearchFolder"]) && $action["message_action"]["isSearchFolder"]) {
											$searchStoreEntryId = $action["message_action"]["search_store_entryid"];
											// Set display name to search folder.
											$searchStore = $GLOBALS["mapisession"]->openMessageStore(hex2bin((string) $searchStoreEntryId));
											$searchFolder = mapi_msgstore_openentry($searchStore, $entryid);
											mapi_setprops($searchFolder, [
												PR_DISPLAY_NAME => $action["props"]["display_name"],
											]);
											mapi_savechanges($searchFolder);
											$this->createLinkedSearchFolder($searchFolder);
										}
										else {
											$this->addToFavorite($store, $entryid);
										}
										break;
								}
							}
							else {
								// save folder
								$folder = mapi_msgstore_openentry($store, hex2bin((string) $action["entryid"]));
								$this->save($store, $folder, $action);
								if ($data["props"]["container_class"] === "IPF.Contact") {
									$GLOBALS["bus"]->notify(ADDRESSBOOK_ENTRYID, OBJECT_SAVE);
								}
								$this->sendFeedback(true, []);
							}
						}
						else {
							// no entryid, create new folder
							if ($store && $parententryid && isset($action["props"]["display_name"], $action["props"]["container_class"])) {
								if (isset($action["message_action"], $action["message_action"]["action_type"])) {
									// We need to create new search folder under the favorites folder
									// based on give search folder info.
									if ($action["message_action"]["action_type"] === "addtofavorites") {
										$storeEntryId = $action["message_action"]["search_store_entryid"];
										$searchFolderEntryId = $action["message_action"]["search_folder_entryid"];

										// Get the search folder and search criteria using $storeEntryId and $searchFolderEntryId.
										$Store = $GLOBALS["mapisession"]->openMessageStore(hex2bin((string) $storeEntryId));
										$searchFolder = mapi_msgstore_openentry($Store, hex2bin((string) $searchFolderEntryId));
										$searchCriteria = mapi_folder_getsearchcriteria($searchFolder);

										// Get FINDERS_ROOT folder from store.
										$finderRootFolder = mapi_getprops($Store, [PR_FINDER_ENTRYID]);
										$searchFolderRoot = mapi_msgstore_openentry($Store, $finderRootFolder[PR_FINDER_ENTRYID]);

										// Create new search folder in FINDERS_ROOT folder and set the search
										// criteria in newly created search folder.
										$newSearchFolder = mapi_folder_createfolder($searchFolderRoot, $action["props"]["display_name"], '', 0, FOLDER_SEARCH);
										$subfolder_flag = 0;
										if (isset($action["subfolders"]) && $action["subfolders"] == "true") {
											$subfolder_flag = RECURSIVE_SEARCH;
										}
										mapi_folder_setsearchcriteria($newSearchFolder, $searchCriteria['restriction'], $searchCriteria['folderlist'], $subfolder_flag);

										// Sleep for 1 seconds initially, since it usually takes ~  1 seconds to fill the search folder.
										sleep(1);
										$this->createLinkedSearchFolder($newSearchFolder);
									}
								}
								else {
									$this->addFolder($store, $parententryid, $action["props"]["display_name"], $action["props"]["container_class"]);
								}
							}
							if ($action["props"]["container_class"] === "IPF.Contact") {
								$GLOBALS["bus"]->notify(ADDRESSBOOK_ENTRYID, OBJECT_SAVE);
							}
						}
						break;

					case "closesharedfolder":
						if (isset($action["folder_type"]) && $action["folder_type"] != "all") {
							// We're closing a Shared folder, check if we still have other
							// folders for the same user opened, if not we can safely close
							// the usrstore.
							$stores = $GLOBALS["settings"]->get("zarafa/v1/contexts/hierarchy/shared_stores/" . strtolower(bin2hex((string) $action["user_name"])));
							if (!isset($stores) || empty($stores) || (count($stores) == 1 && isset($stores[$action["folder_type"]]))) {
								$entryid = $GLOBALS["mapisession"]->removeUserStore($action["user_name"]);
							}
							else {
								$entryid = $GLOBALS["mapisession"]->getStoreEntryIdOfUser($action["user_name"]);
								$this->removeFromFavorite(hex2bin((string) $action["entryid"]), $store, PR_WLINK_ENTRYID, false);
							}
						}
						else {
							// We're closing a Shared Store, simply remove it from the session.
							$entryid = $GLOBALS["mapisession"]->removeUserStore($action["user_name"]);

							if (isset($action["remove_favorites"]) && $action["remove_favorites"]) {
								$this->removeFromFavorite(hex2bin((string) $action["store_entryid"]), $store, PR_WLINK_STORE_ENTRYID, false);
							}
						}

						$data = [];
						$data["store_entryid"] = bin2hex((string) $entryid);
						if (isset($action["folder_type"])) {
							$data["folder_type"] = $action["folder_type"];
						}

						$this->addActionData("delete", $data);
						$GLOBALS["bus"]->addData($this->getResponseData());
						$GLOBALS["bus"]->notify(ADDRESSBOOK_ENTRYID, OBJECT_SAVE);
						break;

					case "opensharedfolder":
						$username = strtolower((string) $action["user_name"]);
						$store = $GLOBALS["mapisession"]->addUserStore($username);
						if (!$store) {
							break;
						}

						$options = [$username => [$action["folder_type"] => $action]];
						$data = $GLOBALS["operations"]->getHierarchyList($this->list_properties, HIERARCHY_GET_ONE, $store, $options, $username);

						if (empty($data["item"][0]["folders"]["item"])) {
							throw new MAPIException(_("Could not load the hierarchy."), MAPI_E_NO_ACCESS);
						}

						$folders = count($data["item"][0]["folders"]["item"]);
						if ($folders === 0) {
							throw new MAPIException(_("Could not load the hierarchy."), MAPI_E_NO_ACCESS);
						}

						$noPermissionFolders = array_filter($data['item'][0]['folders']['item'], fn ($item) => $item['props']['access'] === 0);
						if (count($noPermissionFolders) >= $folders) {
							// Throw an exception that we couldn't open the shared store,
							// lets have processException() fill in our error message.
							throw new MAPIException(_("Could not load the hierarchy."), MAPI_E_NO_ACCESS);
						}

						$this->addActionData("list", $data);
						$GLOBALS["bus"]->addData($this->getResponseData());
						$GLOBALS["bus"]->notify(ADDRESSBOOK_ENTRYID, OBJECT_SAVE);
						break;

					case "sharedstoreupdate":
						$supported_types = ['inbox' => 1, 'all' => 1];
						$users = $GLOBALS["settings"]->get("zarafa/v1/contexts/hierarchy/shared_stores", []);

						foreach ($users as $username => $data) {
							$key = array_keys($data)[0];
							$folder_type = $data[$key]['folder_type'];

							if (!isset($supported_types[$folder_type])) {
								continue;
							}

							$GLOBALS["bus"]->notify(REQUEST_ENTRYID, HIERARCHY_UPDATE, [strtolower(hex2bin((string) $username)), $folder_type]);
						}

						$this->sendFeedback(true);
						break;

					default:
						$this->handleUnknownActionType($actionType);
				}
			}
			catch (MAPIException $e) {
				$this->processException($e, $actionType, $store, $parententryid, $entryid, $action);
			}
		}
	}

	/**
	 * Function does customization of exception based on module data.
	 * like, here it will generate display message based on actionType
	 * for particular exception, and send feedback to the client.
	 *
	 * @param object     $e             Exception object
	 * @param string     $actionType    the action type, sent by the client
	 * @param MAPIobject $store         store object of the folder
	 * @param string     $parententryid parent entryid of the message
	 * @param string     $entryid       entryid of the folder
	 * @param array      $action        the action data, sent by the client
	 */
	#[Override]
	public function handleException(&$e, $actionType = null, $store = null, $parententryid = null, $entryid = null, $action = null) {
		if (is_null($e->displayMessage)) {
			switch ($actionType) {
				case "list":
					$e->setDisplayMessage(_("Could not load the hierarchy."));
					break;

				case "open":
					$e->setDisplayMessage(_("Could not load folder properties."));
					break;

				case "delete":
					if (isset($action["message_action"], $action["message_action"]["action_type"]) &&
						$action["message_action"]["action_type"] === "removefavorites") {
						$e->setDisplayMessage(_("Could not remove folder from favorites."));
					}
					else {
						if ($e->getCode() == MAPI_E_NO_ACCESS) {
							$e->setDisplayMessage(_("You have insufficient privileges to delete folder."));
						}
						else {
							$e->setDisplayMessage(_("Could not delete folder."));
						}
						break;
					}

					// no break
				case "save":
					if ($entryid) {
						if (isset($action["message_action"], $action["message_action"]["action_type"])) {
							switch ($action["message_action"]["action_type"]) {
								case "copy":
									if ($e->getCode() == MAPI_E_NO_ACCESS) {
										$e->setDisplayMessage(_("You have insufficient privileges to copy folder."));
									}
									else {
										$e->setDisplayMessage(_("Could not copy folder."));
									}
									break;

								case "move":
									if ($e->getCode() == MAPI_E_NO_ACCESS) {
										$e->setDisplayMessage(_("You have insufficient privileges to move this folder."));
									}
									else {
										$e->setDisplayMessage(_("Could not move folder."));
									}
									break;

								case "emptyfolder":
									if ($e->getCode() == MAPI_E_NO_ACCESS) {
										$e->setDisplayMessage(_("You have insufficient privileges to delete items."));
									}
									else {
										$e->setDisplayMessage(_("Could not empty folder."));
									}
									break;

								case "readflags":
									$e->setDisplayMessage(_("Could not perform action correctly."));
									break;

								case "addtofavorites":
									if ($e->getCode() == MAPI_E_COLLISION) {
										$e->setDisplayMessage(_("A favorite folder with this name already exists, please use another name."));
									}
									else {
										$e->setDisplayMessage(_("Could not add folder to favorites."));
									}
									break;
							}
						}
						else {
							// Exception generated while setting folder permissions.
							if (isset($action["permissions"])) {
								if ($e->getCode() == MAPI_E_NO_ACCESS) {
									$e->setDisplayMessage(_("You have insufficient privileges to set permissions for this folder."));
								}
								else {
									$e->setDisplayMessage(_("Could not set folder permissions."));
								}
							}
							else {
								// Exception generated while renaming folder.
								match ($e->getCode()) {
									MAPI_E_NO_ACCESS => $e->setDisplayMessage(_("You have insufficient privileges to rename this folder.")),
									MAPI_E_COLLISION => $e->setDisplayMessage(_("A folder with this name already exists. Use another name.")),
									default => $e->setDisplayMessage(_("Could not rename folder.")),
								};
							}
						}
					}
					else {
						// Exception generated while creating new folder.
						match ($e->getCode()) {
							MAPI_E_NO_ACCESS => $e->setDisplayMessage(_("You have insufficient privileges to create this folder.")),
							MAPI_E_COLLISION => $e->setDisplayMessage(_("A folder with this name already exists. Use another name.")),
							default => $e->setDisplayMessage(_("Could not create folder.")),
						};
					}
					break;

				case "closesharedfolder":
					$e->setDisplayMessage(_("Could not close shared folder."));
					break;

				case "opensharedfolder":
					if ($e->getCode() == MAPI_E_NOT_FOUND) {
						$e->setDisplayMessage(_("User could not be resolved."));
					}
					else {
						$folderType = $action["folder_type"];
						if ($folderType == "all") {
							$folderType = 'entire inbox';
						}
						$e->setDisplayMessage(sprintf(_('You have insufficient privileges to open this %1$s folder. The folder owner can set these using the \'permissions\'-tab of the folder properties (right click the %1$s folder > properties > permissions).'), $folderType));
					}
					break;
			}
		}

		parent::handleException($e, $actionType, $store, $parententryid, $entryid, $action);
	}

	/**
	 * Generates the hierarchy list. All folders and subfolders are added to response data.
	 */
	public function hierarchyList() {
		$data = $GLOBALS["operations"]->getHierarchyList($this->list_properties);

		$this->addActionData("list", $data);
		$GLOBALS["bus"]->addData($this->getResponseData());
	}

	/**
	 * Add folder's properties to response data. This function doesn't add permission details yet.
	 *
	 * @param resource $store      mapi store of the folder
	 * @param string   $entryid    entryid of the folder
	 * @param string   $actionType type of action
	 */
	public function addFolderToResponseData($store, $entryid, $actionType) {
		$folder = mapi_msgstore_openentry($store, $entryid);
		$folderProps = mapi_getprops($folder, $this->list_properties);

		$data = $GLOBALS["operations"]->setFolder($folderProps);
		$this->addActionData($actionType, $data);
	}

	/**
	 * Adds a folder to the hierarchylist.
	 *
	 * @param object $store         message Store Object
	 * @param string $parententryid entryid of the parent folder
	 * @param string $name          name of the new folder
	 * @param string $type          type of the folder (calendar, mail, ...).
	 *
	 * @return bool true on success or false on failure
	 */
	public function addFolder($store, $parententryid, $name, $type) {
		$props = [];
		$result = $GLOBALS["operations"]->createFolder($store, $parententryid, $name, $type, $props);

		if ($result && isset($props[PR_ENTRYID])) {
			// Notify about this newly created folder
			$this->addFolderToResponseData($store, $props[PR_ENTRYID], "update");

			// Add all response data to Bus
			$GLOBALS["bus"]->addData($this->getResponseData());

			// Notify parent folder that a folder has been added
			$props[PR_ENTRYID] = $parententryid;
			$GLOBALS["bus"]->notify(bin2hex($parententryid), OBJECT_SAVE, $props);
		}

		return $result;
	}

	/**
	 * returns properties of a folder, used by the properties dialog.
	 *
	 * @param mixed $store
	 * @param mixed $folder
	 */
	public function getFolderProps($store, $folder) {
		$data = $GLOBALS["operations"]->getProps($folder, $this->properties);

		// adding container_class if missing
		if (!isset($data["props"]["container_class"])) {
			$data["props"]["container_class"] = "IPF.Note";
		}

		// replace "IPM_SUBTREE" with the display name of the store, and use the store message size
		$store_props = mapi_getprops($store, [PR_IPM_SUBTREE_ENTRYID]);
		if ($data["entryid"] == bin2hex((string) $store_props[PR_IPM_SUBTREE_ENTRYID])) {
			$store_props = mapi_getprops($store, [PR_DISPLAY_NAME, PR_MESSAGE_SIZE_EXTENDED,
				PR_CONTENT_COUNT, PR_QUOTA_WARNING_THRESHOLD, PR_PROHIBIT_SEND_QUOTA, PR_PROHIBIT_RECEIVE_QUOTA, ]);
			$data["props"]["display_name"] = $store_props[PR_DISPLAY_NAME];
			$data["props"]["message_size"] = round($store_props[PR_MESSAGE_SIZE_EXTENDED]);
			$data["props"]["content_count"] = $store_props[PR_CONTENT_COUNT];
			$data["props"]["store_size"] = round($store_props[PR_MESSAGE_SIZE_EXTENDED]);

			if (isset($store_props[PR_QUOTA_WARNING_THRESHOLD])) {
				$data["props"]["quota_warning"] = round($store_props[PR_QUOTA_WARNING_THRESHOLD]);
			}
			if (isset($store_props[PR_PROHIBIT_SEND_QUOTA])) {
				$data["props"]["quota_soft"] = round($store_props[PR_PROHIBIT_SEND_QUOTA]);
			}
			if (isset($store_props[PR_PROHIBIT_RECEIVE_QUOTA])) {
				$data["props"]["quota_hard"] = round($store_props[PR_PROHIBIT_RECEIVE_QUOTA]);
			}
		}

		// calculating missing message_size
		if (!isset($data["props"]["message_size"])) {
			$data["props"]["message_size"] = round($GLOBALS["operations"]->calcFolderMessageSize($folder, false));
		}

		// retrieving folder permissions
		$data["permissions"] = [
			"item" => $this->getFolderPermissions($folder),
		];

		return $data;
	}

	/**
	 * Returns the size and total_size of the given folder.
	 *
	 * @param mapistore  $store       The store to which the folder belongs
	 * @param mapifolder $folder      The folder for which the size must be calculated
	 * @param string     $pathname    The path of the current folder
	 * @param array      &$subfolders The array in which all information for the subfolders are stored
	 * @param bool       $hidden      True to prevent the subfolders to be stored into the $subfolders argument
	 *
	 * @return array The response data
	 */
	public function getFolderSize($store, $folder, $pathname, &$subfolders, $hidden = false) {
		$columns = [PR_ENTRYID, PR_PARENT_ENTRYID, PR_STORE_ENTRYID, PR_OBJECT_TYPE, PR_DISPLAY_NAME, PR_ATTR_HIDDEN];
		$size = $GLOBALS["operations"]->calcFolderMessageSize($folder, false);
		$total_size = $size;

		$table = mapi_folder_gethierarchytable($folder, MAPI_DEFERRED_ERRORS);

		mapi_table_setcolumns($table, $columns);
		$columns = null;

		$rows = mapi_table_queryrows($table, $columns, 0, 0x7FFFFFF);
		foreach ($rows as $row) {
			$subfolder = mapi_msgstore_openentry($store, $row[PR_ENTRYID]);
			$subpath = (!empty($pathname) ? ($pathname . '\\') : '') . $row[PR_DISPLAY_NAME];

			/**
			 * Don't add  hidden folders, folders with PR_ATTR_HIDDEN property set
			 * should not be shown to the client.
			 */
			$hide = $hidden === true || (isset($row[PR_ATTR_HIDDEN]) && $row[PR_ATTR_HIDDEN] === true);
			$info = $this->getFolderSize($store, $subfolder, $subpath, $subfolders, $hide);

			if ($hide !== true) {
				array_push($subfolders, [
					"entryid" => bin2hex((string) $row[PR_ENTRYID]),
					"parent_entryid" => bin2hex((string) $row[PR_PARENT_ENTRYID]),
					"store_entryid" => bin2hex((string) $row[PR_STORE_ENTRYID]),
					"props" => [
						"folder_pathname" => $subpath, // This equals PR_FOLDER_PATHNAME, which is not supported by Gromox
						"display_name" => $row[PR_DISPLAY_NAME],
						"object_type" => $row[PR_OBJECT_TYPE],
						"message_size" => $info["size"],
						"total_message_size" => $info["total_size"],
					],
				]);
			}

			$total_size += $info["total_size"];
		}

		return ["size" => $size, "total_size" => $total_size];
	}

	/**
	 * Function which saves changed properties to a folder.
	 *
	 * @param object $store  MAPI object of the store
	 * @param object $folder MAPI object of the folder
	 * @param mixed  $action
	 */
	public function save($store, $folder, $action) {
		// Rename folder
		if (isset($action["props"]["display_name"])) {
			$this->modifyFolder($store, hex2bin((string) $action["entryid"]), $action["props"]["display_name"]);
		}

		if (isset($action["props"]["comment"])) {
			mapi_setprops($folder, [PR_COMMENT => $action["props"]["comment"]]);
		}

		if (isset($action["permissions"])) {
			$this->setFolderPermissions($folder, $action["permissions"]);
			if (isset($action['props']['recursive'])) {
				$hierarchyTable = mapi_folder_gethierarchytable($folder, CONVENIENT_DEPTH | MAPI_DEFERRED_ERRORS);
				$subfolders = mapi_table_queryallrows($hierarchyTable, [PR_ENTRYID]);
				foreach ($subfolders as $subfolder) {
					$folderObject = mapi_msgstore_openentry($store, $subfolder[PR_ENTRYID]);
					$this->setFolderPermissions($folderObject, $action["permissions"]);
					mapi_savechanges($folderObject);
				}
			}
		}

		mapi_savechanges($folder);
	}

	public function getFolderPermissions($folder) {
		$eidObj = $GLOBALS["entryid"]->createMsgStoreEntryIdObj(hex2bin((string) $this->store_entryid));
		$cnUserPos = strrpos((string) $eidObj['MailboxDN'], '/cn=');
		$cnUserBase = ($cnUserPos !== false) ? substr((string) $eidObj['MailboxDN'], 0, $cnUserPos) : '';
		$grants = mapi_zarafa_getpermissionrules($folder, ACCESS_TYPE_GRANT);
		foreach ($grants as $id => $grant) {
			// The mapi_zarafa_getpermissionrules returns the entryid in the userid key
			$userinfo = $this->getUserInfo($grant, $cnUserBase);

			$rights = [];
			$rights["entryid"] = $userinfo["entryid"];
			$rights["props"] = [];
			$rights["props"]["type"] = ACCESS_TYPE_GRANT;
			$rights["props"]["display_name"] = $userinfo["fullname"];
			$rights["props"]["object_type"] = $userinfo["type"];
			$rights["props"]["entryid"] = $userinfo["entryid"];
			$rights["props"]["rights"] = $grant["rights"];

			$grants[$id] = $rights;
		}

		return $grants;
	}

	public function setFolderPermissions($folder, $permissions) {
		$folderProps = mapi_getprops($folder, [PR_DISPLAY_NAME, PR_STORE_ENTRYID, PR_ENTRYID]);
		$store = $GLOBALS["mapisession"]->openMessageStore($folderProps[PR_STORE_ENTRYID]);
		$currentPermissions = $this->getFolderPermissions($folder);

		// check if the folder is the default calendar, if so we also need to set the same permissions on the freebusy folder
		$root = mapi_msgstore_openentry($store);
		if ($root) {
			$rootProps = mapi_getprops($root, [PR_IPM_APPOINTMENT_ENTRYID]);
			if ($folderProps[PR_ENTRYID] == $rootProps[PR_IPM_APPOINTMENT_ENTRYID]) {
				$freebusy = FreeBusy::getLocalFreeBusyFolder($store);
			}
		}

		// first, get the current permissions because we need to delete all current acl's
		$curAcls = mapi_zarafa_getpermissionrules($folder, ACCESS_TYPE_GRANT);
		$eidObj = $GLOBALS["entryid"]->createMsgStoreEntryIdObj(hex2bin((string) $this->store_entryid));
		$cnUserPos = strrpos((string) $eidObj['MailboxDN'], '/cn=');
		$cnUserBase = ($cnUserPos !== false) ? substr((string) $eidObj['MailboxDN'], 0, $cnUserPos) : '';
		foreach ($curAcls as &$curAcl) {
			$curAcl = $this->getUserInfo($curAcl, $cnUserBase);
		}

		// First check which permissions should be removed from the existing list
		if (isset($permissions['remove']) && !empty($permissions['remove'])) {
			foreach ($permissions['remove'] as $i => &$delAcl) {
				$userid = hex2bin((string) $delAcl['entryid']);
				foreach ($curAcls as $aclIndex => &$curAcl) {
					// do not remove default and anonymous grants
					if ($curAcl['userid'] === $userid && $curAcl['memberid'] != 0 && $curAcl['memberid'] != 0xFFFFFFFF) {
						$curAcl['rights'] = ecRightsNone;
						$curAcl['state'] = RIGHT_DELETED | RIGHT_AUTOUPDATE_DENIED;
					}
				}
				unset($curAcl);
			}
			unset($delAcl);
		}

		// Then we check which permissions must be updated in the existing list
		if (isset($permissions['modify']) && !empty($permissions['modify'])) {
			foreach ($permissions['modify'] as $i => &$modAcl) {
				$entryid = $modAcl['entryid'];
				// No permission for this user
				// This is necessary for recursive folder permissions.
				// If a subfolder does not have any permissions for the user yet,
				// they need to be added instead of modified.
				if (!$this->idInCurrentPermissions($currentPermissions, $entryid)) {
					if (!isset($permissions['add'])) {
						$permissions['add'] = [];
					}
					array_push($permissions['add'], $modAcl);
				}
				else {
					$userid = hex2bin((string) $entryid);
					foreach ($curAcls as $aclIndex => &$curAcl) {
						if ($curAcl['userid'] === $userid) {
							$curAcl['rights'] = $modAcl['rights'];
							$curAcl['state'] = RIGHT_MODIFY | RIGHT_AUTOUPDATE_DENIED;
						}
						if (isset($curAcl['memberid']) && ($curAcl['memberid'] == 0 || $curAcl['memberid'] == 0xFFFFFFFF)) {
							$curAcl['userid'] = null;
						}
					}
				}
				unset($curAcl);
			}
			unset($modAcl);
		}

		// Finally we check which permissions must be added to the existing list
		if (isset($permissions['add']) && !empty($permissions['add'])) {
			$cnt = count($curAcls);
			foreach ($permissions['add'] as $i => &$addAcl) {
				$curAcls[$cnt++] = [
					'type' => ACCESS_TYPE_GRANT,
					'userid' => hex2bin((string) $addAcl['entryid']),
					'rights' => $addAcl['rights'],
					'state' => RIGHT_NEW | RIGHT_AUTOUPDATE_DENIED,
					'memberid' => 0, // for new permissions memberid may be any number
				];
			}
			unset($addAcl);
		}

		if (!empty($curAcls)) {
			mapi_zarafa_setpermissionrules($folder, $curAcls);

			// $freebusy is only set when the calendar folder permissions is updated
			if (isset($freebusy) && $freebusy !== false) {
				// set permissions on free/busy message
				foreach ($curAcls as $key => &$acl) {
					if ($acl['type'] == ACCESS_TYPE_GRANT && ($acl['rights'] & ecRightsEditOwned)) {
						$acl['rights'] |= ecRightsEditAny;
					}
				}
				unset($acl);
				mapi_zarafa_setpermissionrules($freebusy, $curAcls);
			}
		}
	}

	public function idInCurrentPermissions($currentPermissions, $entryid) {
		foreach ($currentPermissions as $permission) {
			if ($permission['entryid'] === $entryid) {
				return true;
			}
		}

		return false;
	}

	public function getUserInfo($grant, $cnUserBase) {
		// Create fake entryids for default and anonymous permissions
		if ($grant["memberid"] == 0) {
			$entryid = $GLOBALS["entryid"]->createMuidemsabEntryid($cnUserBase . '/cn=0000000000000000-default');
			$grant["fullname"] = _("default");
			$grant["username"] = _("default");
			$grant["entryid"] = $entryid;
			$grant["userid"] = hex2bin((string) $entryid);

			return $grant;
		}

		if ($grant["memberid"] == 0xFFFFFFFF) {
			$entryid = $GLOBALS["entryid"]->createMuidemsabEntryid($cnUserBase . '/cn=ffffffffffffffff-anonymous');
			$grant["fullname"] = _("anonymous");
			$grant["username"] = _("anonymous");
			$grant["entryid"] = $entryid;
			$grant["userid"] = hex2bin((string) $entryid);

			return $grant;
		}

		// open the addressbook
		$ab = $GLOBALS["mapisession"]->getAddressbook();
		$user = mapi_ab_openentry($ab, $grant["userid"]);
		if ($user) {
			$props = mapi_getprops($user, [PR_ACCOUNT, PR_DISPLAY_NAME, PR_OBJECT_TYPE]);

			$grant["fullname"] = $props[PR_DISPLAY_NAME] ?? _("unknown");
			$grant["username"] = $props[PR_ACCOUNT] ?? _("unknown");
			$grant["entryid"] = bin2hex((string) $grant["userid"]);

			return $grant;
		}

		error_log(sprintf("No user with the entryid %s found (memberid: %s)", bin2hex((string) $grant["userid"]), $grant["memberid"]));

		// default return stuff
		return [
			"fullname" => _("Unknown user/group"),
			"username" => _("unknown"),
			"entryid" => null,
			"type" => MAPI_MAILUSER,
			"id" => $grant["userid"],
			"userid" => null,
		];
	}

	/**
	 * Function is used to get the IPM_COMMON_VIEWS folder from defaults store.
	 *
	 * @return object MAPI folder object
	 */
	public function getCommonViewsFolder() {
		$defaultStore = $GLOBALS["mapisession"]->getDefaultMessageStore();
		$commonViewsFolderEntryid = mapi_getprops($defaultStore, [PR_COMMON_VIEWS_ENTRYID]);
		$commonViewsFolder = mapi_msgstore_openentry($defaultStore, $commonViewsFolderEntryid[PR_COMMON_VIEWS_ENTRYID]);

		return $commonViewsFolder;
	}

	/**
	 * Remove favorites link message from associated contains table of IPM_COMMON_VIEWS.
	 * It will also remove favorites search folders of given store.
	 *
	 * @param string $entryid  entryid of the folder
	 * @param object $store    MAPI object of the store
	 * @param string $prop     property which is used to find record from associated contains table of
	 *                         IPM_COMMON_VIEWS folder
	 * @param bool   $doNotify true to notify the IPM_COMMO_VIEWS folder on client side
	 */
	public function removeFromFavorite($entryid, $store = false, $prop = PR_WLINK_ENTRYID, $doNotify = true) {
		$commonViewsFolder = $this->getCommonViewsFolder();
		$associatedTable = mapi_folder_getcontentstable($commonViewsFolder, MAPI_ASSOCIATED);

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
		$finderHierarchyTables = [];
		if (!empty($store)) {
			$props = mapi_getprops($store, [PR_FINDER_ENTRYID]);

			try {
				$finderFolder = mapi_msgstore_openentry($store, $props[PR_FINDER_ENTRYID]);
				$hierarchyTable = mapi_folder_gethierarchytable($finderFolder, MAPI_DEFERRED_ERRORS);
				$finderHierarchyTables[$props[PR_FINDER_ENTRYID]] = $hierarchyTable;
			}
			catch (Exception) {
			}
		}

		$messages = mapi_table_queryallrows($associatedTable, [PR_ENTRYID, PR_MESSAGE_CLASS, PR_WB_SF_ID, PR_WLINK_ENTRYID, PR_WLINK_STORE_ENTRYID, PR_PARENT_ENTRYID, PR_STORE_ENTRYID], $restriction);

		if (!empty($messages)) {
			foreach ($messages as $message) {
				if ($message[PR_MESSAGE_CLASS] === "IPM.Microsoft.WunderBar.SFInfo" && !empty($finderHierarchyTables)) {
					$props = $GLOBALS["operations"]->getFavoritesLinkedSearchFolderProps($message[PR_WB_SF_ID], $finderHierarchyTables);
					if (!empty($props)) {
						$this->deleteSearchFolder($store, $props[PR_PARENT_ENTRYID], $props[PR_ENTRYID], []);
					}
				}
				elseif ($message[PR_MESSAGE_CLASS] === "IPM.Microsoft.WunderBar.Link") {
					if (isset($message[$prop]) && $GLOBALS['entryid']->compareEntryIds($message[$prop], $entryid)) {
						mapi_folder_deletemessages($commonViewsFolder, [$message[PR_ENTRYID]]);
						if ($doNotify) {
							$GLOBALS["bus"]->notify(bin2hex((string) $message[PR_ENTRYID]), OBJECT_SAVE, $message);
						}
					}
					elseif (isset($message[PR_WLINK_STORE_ENTRYID])) {
						$storeObj = $GLOBALS["mapisession"]->openMessageStore($message[PR_WLINK_STORE_ENTRYID]);
						$storeProps = mapi_getprops($storeObj, [PR_ENTRYID]);
						if ($GLOBALS['entryid']->compareEntryIds($message[PR_WLINK_ENTRYID], $storeProps[PR_ENTRYID])) {
							mapi_folder_deletemessages($commonViewsFolder, [$message[PR_ENTRYID]]);
							$this->sendFeedback(true);
						}
					}
				}
			}
		}
	}

	/**
	 * Function which is used to remove the search link message(IPM.Microsoft.WunderBar.SFInfo)
	 * from associated contains table of IPM_COMMON_VIEWS folder.
	 *
	 * @param string $searchFolderId GUID that identifies the search folder
	 */
	public function removeSearchLinkMessage($searchFolderId) {
		$commonViewsFolder = $this->getCommonViewsFolder();
		$associatedTable = mapi_folder_getcontentstable($commonViewsFolder, MAPI_ASSOCIATED);

		$restriction = [RES_AND,
			[
				[RES_PROPERTY,
					[
						RELOP => RELOP_EQ,
						ULPROPTAG => PR_MESSAGE_CLASS,
						VALUE => [PR_MESSAGE_CLASS => "IPM.Microsoft.WunderBar.SFInfo"],
					],
				],
				[RES_PROPERTY,
					[
						RELOP => RELOP_EQ,
						ULPROPTAG => PR_WB_SF_ID,
						VALUE => [PR_WB_SF_ID => hex2bin($searchFolderId)],
					],
				],
			],
		];

		$messages = mapi_table_queryallrows($associatedTable, [PR_WB_SF_ID, PR_ENTRYID], $restriction);

		if (!empty($messages)) {
			foreach ($messages as $message) {
				if (bin2hex((string) $message[PR_WB_SF_ID]) === $searchFolderId) {
					mapi_folder_deletemessages($commonViewsFolder, [$message[PR_ENTRYID]]);
				}
			}
		}
	}

	/**
	 * Function is used to create link message for the selected folder
	 * in associated contains of IPM_COMMON_VIEWS folder.
	 *
	 * @param string $store   $store entryid of the store
	 * @param string $entryid $entryid entryid of the MAPI folder
	 */
	public function addToFavorite($store, $entryid) {
		$commonViewsFolder = $this->getCommonViewsFolder();

		// In Favorites list all folders are must be sibling of other folders.
		// whether it is sub folder of any other folders.
		// So unset "subfolders" property as we don't required to show sub folders in favorites list.
		unset($this->properties["subfolders"]);
		$folder = mapi_msgstore_openentry($store, $entryid);
		$folderProps = mapi_getprops($folder, $this->properties);
		$GLOBALS["operations"]->createFavoritesLink($commonViewsFolder, $folderProps);

		$this->addActionData("update", $GLOBALS["operations"]->setFavoritesFolder($folderProps));
		$GLOBALS["bus"]->addData($this->getResponseData());
	}

	/**
	 * Function which is used delete the search folder from respective store.
	 *
	 * @param object $store         $store $store MAPI store in which search folder is belongs
	 * @param array  $parententryid $parententryid parent folder to search folder it is FIND_ROOT folder which
	 *                              treated as search root folder
	 * @param string $entryid       $entryid search folder entryid which is going to remove
	 * @param array  $action        the action data, sent by the client
	 */
	public function deleteSearchFolder($store, $parententryid, $entryid, $action) {
		$folder = mapi_msgstore_openentry($store, $entryid);
		$props = mapi_getprops($folder, [PR_EXTENDED_FOLDER_FLAGS]);
		// for more information about PR_EXTENDED_FOLDER_FLAGS go through this link
		// https://msdn.microsoft.com/en-us/library/ee203919(v=exchg.80).aspx
		$flags = unpack("H2ExtendedFlags-Id/H2ExtendedFlags-Cb/H8ExtendedFlags-Data/H2SearchFolderTag-Id/H2SearchFolderTag-Cb/H8SearchFolderTag-Data/H2SearchFolderId-Id/H2SearchFolderId-Cb/H32SearchFolderId-Data", (string) $props[PR_EXTENDED_FOLDER_FLAGS]);
		$searchFolderId = $flags["SearchFolderId-Data"];
		$this->removeSearchLinkMessage($searchFolderId);

		// Do not remove the search folder when the 'keepSearchFolder' flag is set.
		// This flag indicates there is currently an open search tab which uses this search folder.
		if (!isset($action["message_action"]["keepSearchFolder"])) {
			$finderFolder = mapi_msgstore_openentry($store, $parententryid);

			return mapi_folder_deletefolder($finderFolder, $entryid, DEL_FOLDERS | DEL_MESSAGES | DELETE_HARD_DELETE);
		}
		// Rename search folder to default search folder name otherwise,
		// It will not be picked up by our search folder cleanup logic.
		$storeProps = mapi_getprops($store, [PR_FINDER_ENTRYID]);
		$props = [];
		$folder = mapi_msgstore_openentry($store, $storeProps[PR_FINDER_ENTRYID]);
		$folderName = $GLOBALS["operations"]->checkFolderNameConflict($store, $folder, "grommunio Web Search Folder");

		return $GLOBALS["operations"]->renameFolder($store, $entryid, $folderName, $props);
	}

	/**
	 * Function which is used create link message for the created search folder.
	 * in associated contains table of IPM_COMMON_VIEWS folder.
	 *
	 * @param object $folder MAPI search folder for which link message needs to
	 *                       create in associated contains table of IPM_COMMON_VIEWS folder
	 */
	public function createLinkedSearchFolder($folder) {
		$searchFolderTag = openssl_random_pseudo_bytes(4);
		$searchFolderId = openssl_random_pseudo_bytes(16);

		// PR_EXTENDED_FOLDER_FLAGS used to create permanent/persistent search folder in MAPI.
		// also it used to identify/get the linked search folder from FINDER_ROOT folder.
		// PR_EXTENDED_FOLDER_FLAGS contains at least the SearchFolderTag, SearchFolderID,
		// and ExtendedFlags subproperties.
		// For more information about PR_EXTENDED_FOLDER_FLAGS go through this link
		// https://msdn.microsoft.com/en-us/library/ee203919(v=exchg.80).aspx
		$extendedFolderFlags = "0104000000010304" . bin2hex($searchFolderTag) . "0210" . bin2hex($searchFolderId);

		mapi_setprops($folder, [
			PR_EXTENDED_FOLDER_FLAGS => hex2bin($extendedFolderFlags),
		]);
		mapi_savechanges($folder);

		$folderProps = mapi_getprops($folder, $this->properties);
		$commonViewsFolder = $this->getCommonViewsFolder();
		$GLOBALS["operations"]->createFavoritesLink($commonViewsFolder, $folderProps, $searchFolderId);

		$folderProps = mapi_getprops($folder, $this->properties);
		$this->addActionData("update", $GLOBALS["operations"]->setFavoritesFolder($folderProps));
		$GLOBALS["bus"]->addData($this->getResponseData());
	}

	/**
	 * Modifies a folder off the hierarchylist.
	 *
	 * @param object $store   message Store Object
	 * @param string $entryid entryid of the folder
	 * @param string $name    name of the folder
	 */
	public function modifyFolder($store, $entryid, $name) {
		$props = [];
		$result = $GLOBALS["operations"]->renameFolder($store, $entryid, $name, $props);

		if ($result && isset($props[PR_ENTRYID])) {
			$GLOBALS["bus"]->notify(bin2hex($props[PR_ENTRYID]), OBJECT_SAVE, $props);
		}
	}

	/**
	 * Deletes a folder in the hierarchylist.
	 *
	 * @param object $store         message Store Object
	 * @param string $parententryid entryid of the parent folder
	 * @param string $entryid       entryid of the folder
	 * @param array  $action        the action data, sent by the client
	 */
	public function deleteFolder($store, $parententryid, $entryid, $action) {
		$props = [];
		$pubStore = $GLOBALS["mapisession"]->isPublicStore($action['store_entryid'] ?? '');
		$result = $GLOBALS["operations"]->deleteFolder($store, $parententryid, $entryid, $props, $action['soft_delete'] ?? false, $pubStore ? true : false);

		// Indicate if the delete succeedded
		$this->sendFeedback($result);

		if (isset($props[PR_ENTRYID])) {
			if ($result) {
				$GLOBALS["bus"]->notify(bin2hex($parententryid), OBJECT_SAVE, $props);

				$props = [];
				$props[PR_PARENT_ENTRYID] = $parententryid;

				$storeprops = mapi_getprops($store, [PR_ENTRYID, PR_IPM_WASTEBASKET_ENTRYID]);
				$props[PR_STORE_ENTRYID] = $storeprops[PR_ENTRYID];
				$GLOBALS["bus"]->notify(bin2hex($parententryid), OBJECT_SAVE, $props);

				$props[PR_PARENT_ENTRYID] = $storeprops[PR_IPM_WASTEBASKET_ENTRYID];
				$GLOBALS["bus"]->notify(bin2hex($parententryid), OBJECT_SAVE, $props);
			}
		}
		else {
			$props[PR_ENTRYID] = $entryid;
			$props[PR_PARENT_ENTRYID] = $parententryid;

			if ($result) {
				$this->removeFromFavorite($props[PR_ENTRYID]);

				$storeprops = mapi_getprops($store, [PR_ENTRYID, PR_IPM_FAVORITES_ENTRYID]);
				$props[PR_STORE_ENTRYID] = $storeprops[PR_ENTRYID];

				// Notify about that folder is deleted
				$GLOBALS["bus"]->notify(bin2hex($parententryid), OBJECT_DELETE, $props);

				// Notify its parent about the delete
				$GLOBALS["bus"]->notify(bin2hex($parententryid), OBJECT_SAVE, $props);

				// Notifying corresponding folder in 'Favorites'
				if (isset($storeprops[PR_IPM_FAVORITES_ENTRYID])) {
					$folderEntryID = "00000001" . substr(bin2hex($entryid), 8);
					$props[PR_ENTRYID] = hex2bin($folderEntryID);
					$props[PR_PARENT_ENTRYID] = $storeprops[PR_IPM_FAVORITES_ENTRYID];
					$GLOBALS["bus"]->notify(bin2hex($parententryid), OBJECT_DELETE, $props);
				}
			}
		}
	}

	/**
	 * Deletes all messages in a folder.
	 *
	 * @param object $store   message Store Object
	 * @param string $entryid entryid of the folder
	 */
	public function emptyFolder($store, $entryid) {
		$props = [];

		$result = false;

		// False will only remove the message of
		// selected folder only and can't remove the
		// child folders.
		$emptySubFolders = false;
		$storeProps = mapi_getprops($store, [PR_IPM_WASTEBASKET_ENTRYID]);
		// Check that selected folder is Waste basket or Junk folder then empty folder by removing
		// the child folders.
		if (isset($storeProps[PR_IPM_WASTEBASKET_ENTRYID]) && $storeProps[PR_IPM_WASTEBASKET_ENTRYID] === $entryid) {
			$emptySubFolders = true;
		}
		else {
			$root = mapi_msgstore_openentry($store);
			$rootProps = mapi_getprops($root, [PR_ADDITIONAL_REN_ENTRYIDS]);
			// check if selected folder is junk folder then make junk folder empty with
			// it's child folder and it's contains.
			if (isset($rootProps[PR_ADDITIONAL_REN_ENTRYIDS]) && is_array($rootProps[PR_ADDITIONAL_REN_ENTRYIDS])) {
				// Checking if folder is junk folder or not.
				$emptySubFolders = $GLOBALS['entryid']->compareEntryIds($rootProps[PR_ADDITIONAL_REN_ENTRYIDS][4], $entryid);
			}

			if ($emptySubFolders === false) {
				$folder = mapi_msgstore_openentry($store, $entryid);
				$folderProps = mapi_getprops($folder, [PR_SUBFOLDERS]);
				$emptySubFolders = $folderProps[PR_SUBFOLDERS] === false;
			}
		}

		$result = $GLOBALS["operations"]->emptyFolder($store, $entryid, $props, false, $emptySubFolders);

		if ($result && isset($props[PR_ENTRYID])) {
			$this->addFolderToResponseData($store, $entryid, "folders");

			// Add all response data to Bus
			$GLOBALS["bus"]->addData($this->getResponseData());
		}
	}

	/**
	 * Copies of moves a folder in the hierarchylist.
	 *
	 * @param object $store               message Store Object
	 * @param string $parententryid       entryid of the parent folder
	 * @param string $sourcefolderentryid entryid of the folder to be copied of moved
	 * @param string $destfolderentryid   entryid of the destination folder
	 * @param mixed  $deststore
	 * @param mixed  $moveFolder
	 */
	public function copyFolder($store, $parententryid, $sourcefolderentryid, $destfolderentryid, $deststore, $moveFolder) {
		$props = [];
		$result = $GLOBALS["operations"]->copyFolder($store, $parententryid, $sourcefolderentryid, $destfolderentryid, $deststore, $moveFolder, $props);

		if ($result) {
			if ($moveFolder) {
				try {
					// If destination folder is wastebasket then remove source folder from favorites list if
					// it is present in it.
					$defaultStore = $GLOBALS["mapisession"]->getDefaultMessageStore();
					$wastebasketFolderEntryid = mapi_getprops($defaultStore, [PR_IPM_WASTEBASKET_ENTRYID]);
					if ($GLOBALS["entryid"]->compareEntryIds($wastebasketFolderEntryid[PR_IPM_WASTEBASKET_ENTRYID], $destfolderentryid)) {
						$this->removeFromFavorite($sourcefolderentryid);
					}

					/*
					 * Normally it works well within same store,
					 * but entryid gets changed when different stores so we can't use old entryid anymore.
					 * When moving to different store send delete notification.
					 */
					$this->addFolderToResponseData($deststore, $sourcefolderentryid, "folders");

					// Add all response data to Bus
					$GLOBALS["bus"]->addData($this->getResponseData());
				}
				catch (MAPIException $e) {
					$exCode = $e->getCode();
					// gromox throws MAPI_E_INVALID_PARAMETER if it's not able to open an entry
					if ($exCode == MAPI_E_INVALID_ENTRYID || $exCode == MAPI_E_INVALID_PARAMETER) {
						// Entryid of the folder might be change after move, so send delete notification for folder.
						$GLOBALS["bus"]->notify(bin2hex($props[PR_ENTRYID]), OBJECT_DELETE, $props);
					}
				}

				// if move folder then refresh parent of source folder
				$sourcefolder = mapi_msgstore_openentry($store, $parententryid);
				$folderProps = mapi_getprops($sourcefolder, [PR_ENTRYID, PR_STORE_ENTRYID]);
				$GLOBALS["bus"]->notify(bin2hex((string) $folderProps[PR_ENTRYID]), OBJECT_SAVE, $folderProps);
			}
			else {
				$this->sendFeedback(true);
			}

			// Update subfolders of copy/move folder
			$folder = mapi_msgstore_openentry($deststore, $destfolderentryid);
			$hierarchyTable = mapi_folder_gethierarchytable($folder, CONVENIENT_DEPTH | MAPI_DEFERRED_ERRORS);
			mapi_table_sort($hierarchyTable, [PR_DISPLAY_NAME => TABLE_SORT_ASCEND], TBL_BATCH);

			/**
			 * remove hidden folders, folders with PR_ATTR_HIDDEN property set
			 * should not be shown to the client.
			 */
			$restriction = [RES_OR,
				[
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
				],
			];

			$subfolders = mapi_table_queryallrows($hierarchyTable, [PR_ENTRYID], $restriction);

			if (is_array($subfolders)) {
				foreach ($subfolders as $subfolder) {
					$folderObject = mapi_msgstore_openentry($deststore, $subfolder[PR_ENTRYID]);
					$folderProps = mapi_getprops($folderObject, [PR_ENTRYID, PR_STORE_ENTRYID]);
					$GLOBALS["bus"]->notify(bin2hex((string) $subfolder[PR_ENTRYID]), OBJECT_SAVE, $folderProps);
				}
			}

			// Now update destination folder
			$folder = mapi_msgstore_openentry($deststore, $destfolderentryid);
			$folderProps = mapi_getprops($folder, [PR_ENTRYID, PR_STORE_ENTRYID]);
			$GLOBALS["bus"]->notify(bin2hex((string) $folderProps[PR_ENTRYID]), OBJECT_SAVE, $folderProps);
		}
		else {
			if ($moveFolder) {
				$this->sendFeedback(false, _('Could not move folder'));
			}
			else {
				$this->sendFeedback(false, _('Could not copy folder'));
			}
		}
	}

	/**
	 * Set all messages read.
	 *
	 * @param object $store   message Store Object
	 * @param string $entryid entryid of the folder
	 */
	public function setReadFlags($store, $entryid) {
		$props = [];
		$folder = mapi_msgstore_openentry($store, $entryid);

		if (!$folder) {
			return;
		}

		if (mapi_folder_setreadflags($folder, [], SUPPRESS_RECEIPT)) {
			$props = mapi_getprops($folder, [PR_ENTRYID, PR_STORE_ENTRYID]);

			if (!isset($props[PR_ENTRYID])) {
				return;
			}

			$this->addFolderToResponseData($store, $props[PR_ENTRYID], "folders");

			// Add all response data to Bus
			$GLOBALS["bus"]->addData($this->getResponseData());
		}
	}
}
