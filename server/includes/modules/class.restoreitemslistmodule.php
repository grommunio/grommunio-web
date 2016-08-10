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
			$this->properties = $GLOBALS['properties']->getRestoreItemListProperties();
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
				if(isset($actionType)) {
					try {
						$store = $this->getActionStore($action);
						$parententryid = $this->getActionParentEntryID($action);
						$folderentryid = $this->getActionEntryID($action);

						switch($actionType) {
							case "list":
								$this->itemList($store, $folderentryid, $action);
								break;

							case "delete":
								$itemType = $action["message_action"]["action_type"];

								switch($itemType) {
									case "restorefolder" :
										$this->restoreFolder($store, $parententryid, $folderentryid, $action);
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
		 * Function to retrieve the list of messages or folder of particular folder
		 * @param object $store store object.
		 * @param binary $entryid entry id of that particular folder.
		 * @param object $action request data.
		 */
		function itemList($store, $entryid, $action)
		{
			//set the this->$sort variable.
			$this->parseSortOrder($action);

			$data = array();

			$folder = mapi_msgstore_openentry($store, $entryid);

			if (isset($action["itemType"]) && $action["itemType"] == "folder") {
				$table = mapi_folder_gethierarchytable($folder, MAPI_DEFERRED_ERRORS | SHOW_SOFT_DELETES);
			} else {
				$table = mapi_folder_getcontentstable($folder, MAPI_DEFERRED_ERRORS | SHOW_SOFT_DELETES);
			}
			
			
			//sort the table according to sort data
			if (is_array($this->sort) && !empty($this->sort)){
				mapi_table_sort($table, $this->sort, TBL_BATCH);
			}

			$restoreitems = mapi_table_queryallrows($table, $this->properties);

			$items = Array();
			foreach($restoreitems as $restoreitem)
			{
				$item = Conversion::mapMAPI2XML($this->properties, $restoreitem);
				array_push($items,$item);
			}
			$data["item"] = $items;

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
		 * @param object $action request data.
		 */
		function restoreFolder($store, $parententryid, $folderentryid, $action)
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

			/* when we restore any folder from soft deleted system then we are actually copying the folder, so at that time entryid of
			 * folder gets changed and we don't have notification system to get new entryid, so to notify client about changes we need to 
			 * notify all subfolders of parent folder where we have restored the folder
			 */

			$hierarchyTable = mapi_folder_gethierarchytable($sfolder, CONVENIENT_DEPTH | MAPI_DEFERRED_ERRORS);
			mapi_table_sort($hierarchyTable, array(PR_DISPLAY_NAME => TABLE_SORT_ASCEND), TBL_BATCH);

			$subfolders = mapi_table_queryallrows($hierarchyTable, array(PR_ENTRYID));

			if (is_array($subfolders)) {
				foreach($subfolders as $subfolder) {
					$folderObject = mapi_msgstore_openentry($store, $subfolder[PR_ENTRYID]); 
					$folderProps = mapi_folder_getprops($folderObject, array(PR_ENTRYID, PR_STORE_ENTRYID));
					$GLOBALS["bus"]->notify(bin2hex($subfolder[PR_ENTRYID]), OBJECT_SAVE, $folderProps);
				}
			}

			// notify the parent folder
			$folder = mapi_msgstore_openentry($store, $parententryid);
			$folderProps = mapi_folder_getprops($folder, array(PR_ENTRYID, PR_STORE_ENTRYID));
			$GLOBALS["bus"]->notify(bin2hex($folderProps[PR_ENTRYID]), OBJECT_SAVE, $folderProps);

			$this->sendFeedback(true);
		}
	}
?>
