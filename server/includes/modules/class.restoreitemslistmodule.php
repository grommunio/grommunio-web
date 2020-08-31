<?php
	/**
	 * RestoreItemsList Module
	 */
	class RestoreItemsListModule extends ListModule
	{
		/**
		 * Constructor
		 * @param int $id unique id.
		 * @param array $data list of all actions.
		 */
		function __construct($id, $data)
		{
			parent::__construct($id, $data);

			$this->properties = $GLOBALS['properties']->getRestoreItemListProperties();

		}

		/**
		 * Executes all the actions in the $data variable.
		 * @return boolean true on success of false on failure.
		 */
		function execute()
		{
			foreach($this->data as $actionType => $action)
			{
				if(isset($actionType)) {
					try {
						$store = $this->getActionStore($action);
						$parententryid = $this->getActionParentEntryID($action);
						$folderentryid = $this->getActionEntryID($action);

						switch($actionType) {
							case "list":
							case "updatelist":
								if (isset($action["message_action"], $action["message_action"]["action_type"])) {
									$subActionType = $action["message_action"]["action_type"];
									switch ($subActionType) {
										case "restoreAll":
											$this->restoreAll($store, $folderentryid, $action);
											break;
										case "deleteAll":
											$this->deleteAll($store, $folderentryid, $action);
											break;
									}
								} else {
									$this->itemList($store, $folderentryid, $action);
								}
								break;
							case "delete":
								$itemType = $action["message_action"]["action_type"];

								switch($itemType) {
									case "restorefolder" :
										$this->restoreFolder($store, $parententryid, $folderentryid);
										break;

									case "deletefolder" :
										$this->deleteFolder($store, $parententryid, $action);
										break;

									case "restoremessage" :
										$this->restoreItems($store, $parententryid, $action);
										break;

									case "deletemessage" :
										$this->deleteItems($store, $parententryid, $action);
										break;

									default:
									$this->handleUnknownActionType($itemType);
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
		}

		/**
		 * Function which permanently delete all folder or message items.
		 *
		 * @param {object} $store store object
		 * @param {binary} $folderentryid entry id of that particular folder.
		 * @param object $action request data.
		 */
		function deleteAll($store, $folderentryid, $action)
		{
			$folder = mapi_msgstore_openentry($store, $folderentryid);

			// delete all folders.
			if (isset($action["itemType"]) && $action["itemType"] == "folder") {
				$table = mapi_folder_gethierarchytable($folder, MAPI_DEFERRED_ERRORS | SHOW_SOFT_DELETES);
				$items = mapi_table_queryallrows($table, array(PR_ENTRYID));
				$restoreItems = array();
				foreach ($items as $item) {
					array_push($restoreItems, $item[PR_ENTRYID]);
				}

				foreach ($restoreItems as $restoreItem) {
					mapi_folder_deletefolder($folder, $restoreItem, DEL_FOLDERS | DEL_MESSAGES | DELETE_HARD_DELETE);
				}
			} else {
				// delete all messages
				$table = mapi_folder_getcontentstable($folder, MAPI_DEFERRED_ERRORS | SHOW_SOFT_DELETES);
				$items = mapi_table_queryallrows($table, array(PR_ENTRYID));

				$restoreItems = array();
				foreach ($items as $item) {
					array_push($restoreItems, $item[PR_ENTRYID]);
				}

				mapi_folder_deletemessages($folder, $restoreItems , DELETE_HARD_DELETE);
			}

			$this->addActionData("list", array("item" => array()));
			$GLOBALS["bus"]->addData($this->getResponseData());
		}

		/**
		 * Function used to restore all folders.
		 *
		 * @param {object} $store store object.
		 * @param {object} $folder folder data which needs to restore.
		 * @throws MAPIException
		 */
		function restoreAllFolders($store, $folder)
		{
			$table = mapi_folder_gethierarchytable($folder, MAPI_DEFERRED_ERRORS | SHOW_SOFT_DELETES);
			$items = mapi_table_queryallrows($table, array(PR_ENTRYID));
			$restoreItems = array();
			foreach ($items as $item) {
				array_push($restoreItems, $item[PR_ENTRYID]);
			}

			foreach ($restoreItems as $restoreItem) {
				try {
					/*
					 * we should first try to copy folder and if it returns MAPI_E_COLLISION then
					 * only we should check for the conflicting folder names and generate a new name
					 * and restore folder with the generated name.
					 */
					mapi_folder_copyfolder($folder, $restoreItem, $folder, null, FOLDER_MOVE);
				} catch (MAPIException $e) {
					if($e->getCode() == MAPI_E_COLLISION) {
						$folder = mapi_msgstore_openentry($store, $restoreItem, SHOW_SOFT_DELETES);
						$folderNameProps = mapi_getprops($folder, array(PR_DISPLAY_NAME));
						$foldername = $GLOBALS["operations"]->checkFolderNameConflict($store, $folder, $folderNameProps[PR_DISPLAY_NAME]);
						mapi_folder_copyfolder($folder, $restoreItem, $folder, $foldername, FOLDER_MOVE);
					} else {
						// all other errors should be propagated to higher level exception handlers
						throw $e;
					}
				}
			}

			// Notify the parent folder.
			$this->notifyParentFolder($store, $folder, $folder);
		}

		/**
		 * Function which used to restore and message for give folder.
		 *
		 * @param {object} $folder the content of this folder is going to restored.
		 */
		function restoreAllItems($folder)
		{
			$table = mapi_folder_getcontentstable($folder, MAPI_DEFERRED_ERRORS | SHOW_SOFT_DELETES);
			$items = mapi_table_queryallrows($table, array(PR_ENTRYID));

			$restoreItems = array();
			foreach ($items as $item) {
				array_push($restoreItems, $item[PR_ENTRYID]);
			}

			mapi_folder_copymessages($folder, $restoreItems, $folder, MESSAGE_MOVE);

			// as after moving the message/s the entryid gets changed, so need to notify about the folder
			// so that we can update the folder on parent page.
			$folderProps = mapi_getprops($folder, array(PR_STORE_ENTRYID, PR_ENTRYID));

			/* when we restore any message from soft deleted system then we are actually copying the item, so at that time entryid of
			 * that particular item gets changed, so to notify client about changes we need to
			 * notify parent folder where we have restored the message
			 */
			$props[PR_PARENT_ENTRYID] = $folderProps[PR_ENTRYID];
			$props[PR_STORE_ENTRYID] = $folderProps[PR_STORE_ENTRYID];

			$GLOBALS["bus"]->notify(bin2hex($folderProps[PR_ENTRYID]), TABLE_SAVE, $props);
		}

		/**
		 * Function restored restore all folder or message based on give itemType.
		 *
		 * @param {object} $store store object
		 * @param {binary} $folderentryid entry id of that particular folder.
		 * @param object $action request data.
		 * @throws MAPIException
		 */
		function restoreAll($store, $folderentryid, $action)
		{
			$folder = mapi_msgstore_openentry($store, $folderentryid);

			if (isset($action["itemType"]) && $action["itemType"] == "folder") {
				try {
					$this->restoreAllFolders($store, $folder);
				} catch (MAPIException $e) {
					throw $e;
				}
			} else {
				$this->restoreAllItems($folder);
			}

			$this->addActionData("list", array("item" => array()));
			$GLOBALS["bus"]->addData($this->getResponseData());
		}

		/**
		 * Function to retrieve the list of messages or folder of particular folder
		 * @param object $store store object.
		 * @param binary $entryid entry id of that particular folder.
		 * @param object $action request data.
		 */
		function itemList($store, $entryid, $action)
		{
			// Restriction
			$this->parseRestriction($action);

			//set the this->$sort variable.
			$this->parseSortOrder($action);

			if(isset($action['restriction']['limit'])){
				$limit = $action['restriction']['limit'];
			} else {
				$limit = $GLOBALS['settings']->get('zarafa/v1/main/page_size', 50);
			}

			$folder = mapi_msgstore_openentry($store, $entryid);

			if (isset($action["itemType"]) && $action["itemType"] == "folder") {
				$table = mapi_folder_gethierarchytable($folder, MAPI_DEFERRED_ERRORS | SHOW_SOFT_DELETES);
			} else {
				$table = mapi_folder_getcontentstable($folder, MAPI_DEFERRED_ERRORS | SHOW_SOFT_DELETES);
			}

			$data = $GLOBALS["operations"]->getTableContent($table, $this->properties, $this->sort, $this->start, $limit, $this->restriction);

			$this->addActionData("list", $data);
			$GLOBALS["bus"]->addData($this->getResponseData());
		}

		/**
		 * Function to delete selected items of particular folder
		 * @param object $store store object.
		 * @param binary $parententryid entry id of the folder which contain particular item to be deleted.
		 * @param object $items request data.
		 */
		function deleteItems($store, $parententryid, $items){

			if(is_assoc_array($items)) {
				// wrap single item in an array
				$items = array($items);
			}

			$sfolder = mapi_msgstore_openentry($store, $parententryid);

			for($index = 0, $len = count($items); $index < $len; $index++) {
				mapi_folder_deletemessages($sfolder, array(hex2bin($items[$index]['entryid'])), DELETE_HARD_DELETE);
			}
			$this->sendFeedback(true);
		}

		/**
		 * Function to restore message present into the selected folder
		 * @param object $store store object.
		 * @param binary $parententryid entry id of the folder which contain particular item to be restored.
		 * @param object $items request data.
		 */
		function restoreItems($store, $parententryid, $items){

			if(is_assoc_array($items)) {
				// wrap single item in an array
				$items = array($items);
			}

			$sfolder = mapi_msgstore_openentry($store, $parententryid);

			for($index = 0, $len = count($items); $index < $len; $index++) {
				mapi_folder_copymessages($sfolder, array(hex2bin($items[$index]['entryid'])), $sfolder, MESSAGE_MOVE);
			}

			// as after moving the message/s the entryid gets changed, so need to notify about the folder
			// so that we can update the folder on parent page.
			$folderProps = mapi_getprops($sfolder, array(PR_STORE_ENTRYID, PR_ENTRYID));

			/* when we restore any message from soft deleted system then we are actually copying the item, so at that time entryid of
			 * that particular item gets changed, so to notify client about changes we need to 
			 * notify parent folder where we have restored the message
			 */
			$props[PR_PARENT_ENTRYID] = $folderProps[PR_ENTRYID];
			$props[PR_STORE_ENTRYID] = $folderProps[PR_STORE_ENTRYID];
			$GLOBALS["bus"]->notify(bin2hex($folderProps[PR_ENTRYID]), TABLE_SAVE, $props);
			$this->sendFeedback(true);
		}

		/**
		 * Function to delete selected folders
		 * @param object $store store object.
		 * @param binary $parententryid entry id of the folder which contain particular folder to be deleted.
		 * @param object $folders request data.
		 */
		function deleteFolder($store, $parententryid, $folders){

			if(is_assoc_array($folders)) {
				// wrap single folder in an array
				$folders = array($folders);
			}

			$sfolder = mapi_msgstore_openentry($store, $parententryid);

			for($index = 0, $len = count($folders); $index < $len; $index++) {
				mapi_folder_deletefolder($sfolder, hex2bin($folders[$index]['entryid']), DEL_FOLDERS | DEL_MESSAGES | DELETE_HARD_DELETE);
			}

			$this->sendFeedback(true);
		}

		/**
		 * Function to restore soft deleted folder of particular folder
		 * @param object $store store object.
		 * @param binary $parententryid entry id of the folder which contain particular folder to be restored.
		 * @param binary $folderentryid entry id of the folder to be restored.
		 */
		function restoreFolder($store, $parententryid, $folderentryid)
		{
			$sfolder = mapi_msgstore_openentry($store, $parententryid);
			try {
				/*
				 * we should first try to copy folder and if it returns MAPI_E_COLLISION then
				 * only we should check for the conflicting folder names and generate a new name
				 * and restore folder with the generated name.
				 */
				mapi_folder_copyfolder($sfolder, $folderentryid, $sfolder, null, FOLDER_MOVE);
			} catch (MAPIException $e) {
				if($e->getCode() == MAPI_E_COLLISION) {
					$folder = mapi_msgstore_openentry($store, $folderentryid, SHOW_SOFT_DELETES);
					$folderNameProps = mapi_getprops($folder, array(PR_DISPLAY_NAME));
					$foldername = $GLOBALS["operations"]->checkFolderNameConflict($store, $sfolder, $folderNameProps[PR_DISPLAY_NAME]);
					mapi_folder_copyfolder($sfolder, $folderentryid, $sfolder, $foldername, FOLDER_MOVE);
				} else {
					// all other errors should be propagated to higher level exception handlers
					throw $e;
				}
			}

			// notify the parent folder
			$parentFolder = mapi_msgstore_openentry($store, $parententryid);
			$this->notifyParentFolder($store,$sfolder, $parentFolder);
			$this->sendFeedback(true);
		}

		/**
		 * Notify the parent folder about restoration.
		 *
		 * @param object $store store object.
		 * @param object $folder mapi folder which contain particular folder to be restored.
		 * @param object $parentFolder mapi folder which is going to notify.
		 */
		function notifyParentFolder($store, $folder, $parentFolder)
		{
			/* when we restore any folder from soft deleted system then we are actually copying the folder, so at that time entryid of
			 * folder gets changed and we don't have notification system to get new entryid, so to notify client about changes we need to
			 * notify all subfolders of parent folder where we have restored the folder
			 */
			$hierarchyTable = mapi_folder_gethierarchytable($folder, CONVENIENT_DEPTH | MAPI_DEFERRED_ERRORS);
			mapi_table_sort($hierarchyTable, array(PR_DISPLAY_NAME => TABLE_SORT_ASCEND), TBL_BATCH);

			$subfolders = mapi_table_queryallrows($hierarchyTable, array(PR_ENTRYID));

			if (is_array($subfolders)) {
				foreach($subfolders as $subfolder) {
					$folderObject = mapi_msgstore_openentry($store, $subfolder[PR_ENTRYID]);
					$folderProps = mapi_getprops($folderObject, array(PR_ENTRYID, PR_STORE_ENTRYID));
					$GLOBALS["bus"]->notify(bin2hex($subfolder[PR_ENTRYID]), OBJECT_SAVE, $folderProps);
				}
			}

			$folderProps = mapi_getprops($parentFolder, array(PR_ENTRYID, PR_STORE_ENTRYID));
			$GLOBALS["bus"]->notify(bin2hex($folderProps[PR_ENTRYID]), OBJECT_SAVE, $folderProps);
		}
	}
?>
