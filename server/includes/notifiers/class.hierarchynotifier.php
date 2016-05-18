<?php
	/**
	 * Hierarchy Notifier
	 *
	 * Generates notifications which might be created
	 * inside the hierarchy.
	 */
	class HierarchyNotifier extends Notifier
	{
		/**
		 * Flag to indicate that we need to reopen store object to get updated message size
		 */
		 var $reopenStore;

		/**
		 * previous store size of the default store of user, this is updated whenever
		 * notification is sent to client to update quota details
		 */
		 var $storeSize;

		/**
		 * Constructor
		 */
		function HierarchyNotifier()
		{
			/*
			 * Initialize hierarchy store's size, so in future on change events of 
			 * folder object or message item we can check store's previous size,
			 * and if it is changed then send notification to server.
			 */
			$this->storeSize = -1;

			parent::Notifier();
		}

		/**
		 * @return Number Return the bitmask of events which are handled
		 * by this notifier. The bitmask can consist of the 
		 * OBJECT_SAVE, OBJECT_DELETE, TABLE_SAVE, TABLE_DELETE, REQUEST_START and REQUEST_END flags
		 */
		public function getEvents()
		{
			return OBJECT_SAVE | OBJECT_DELETE | TABLE_SAVE | TABLE_DELETE | REQUEST_START | REQUEST_END;
		}

		/**
		 * If an event elsewhere has occurred, it enters in this methode. This method
		 * executes one ore more actions, depends on the event.
		 * @param int $event Event.
		 * @param string $entryid Entryid.
		 * @param array $data array of data.
		 */
		public function update($event, $entryid, $props)
		{
			switch($event) {
				case REQUEST_START:
					$this->reopenStore = false;
					break;
				case OBJECT_SAVE:
				case TABLE_SAVE:
				case TABLE_DELETE:
					$data = array();

					// If no PR_ENTRYID is given, we will settle with PR_PARENT_ENTRYID
					$folderEntryid = false;
					if (isset($props[PR_PARENT_ENTRYID])) {
						$folderEntryid = $props[PR_PARENT_ENTRYID];
					} else if(isset($props[PR_ENTRYID])) {
						$folderEntryid = $props[PR_ENTRYID];
					}

					if (isset($props[PR_STORE_ENTRYID]) && $folderEntryid) {
						$store = $GLOBALS["mapisession"]->openMessageStore($props[PR_STORE_ENTRYID]);

						$folder = mapi_msgstore_openentry($store, $folderEntryid);
						if ($folder) {
							$properties = $GLOBALS["properties"]->getFolderListProperties();
							$folderProps = mapi_folder_getprops($folder, $properties);

							// If this folder belongs to Favorites folder,then change PARENT_ENTRYID manually.
							if ($GLOBALS["entryid"]->isFavoriteFolder($folderProps[PR_ENTRYID])) {
								$storeProps = mapi_getprops($store, array(PR_IPM_FAVORITES_ENTRYID));

								if (isset($storeProps[PR_IPM_FAVORITES_ENTRYID])) {
									$favFolder = mapi_msgstore_openentry($store, $storeProps[PR_IPM_FAVORITES_ENTRYID]);
									$favHierarchyTable = mapi_folder_gethierarchytable($favFolder, MAPI_DEFERRED_ERRORS);
									$folders = mapi_table_queryallrows($favHierarchyTable, array(PR_DISPLAY_NAME, PR_STORE_ENTRYID),
										array(RES_PROPERTY,
											array(
												RELOP => RELOP_EQ,
												ULPROPTAG => PR_ENTRYID,
												VALUE => array(
													PR_ENTRYID => $folderProps[PR_ENTRYID]
												)
											)
										)
									);

									// Update folderProps to properties of folder which is under 'FAVORITES'
									$folderProps[PR_DISPLAY_NAME] = $folders[0][PR_DISPLAY_NAME];
									$folderProps[PR_PARENT_ENTRYID] = $storeProps[PR_IPM_FAVORITES_ENTRYID];
								}
							}

							$data[] = $GLOBALS["operations"]->setFolder($folderProps);
						}

						$this->addNotificationActionData("folders", array( "item" => $data ));
						$GLOBALS["bus"]->addData($this->createNotificationResponseData());

						// data is changed in store so message size will be updated so reopen store to get correct data
						$this->reopenStore = true;
					}
					break;
				case OBJECT_DELETE:
					if (isset($props[PR_ENTRYID]) && isset($props[PR_PARENT_ENTRYID])) {
						$data = array();
						$data["folderdelete"] = 1;
						$data["entryid"] = bin2hex($props[PR_ENTRYID]);
						$data["parent_entryid"] = bin2hex($props[PR_PARENT_ENTRYID]);
						$data["store_entryid"] = bin2hex($props[PR_STORE_ENTRYID]);

						$this->addNotificationActionData("folders", array( "item" => $data ));
						$GLOBALS["bus"]->addData($this->createNotificationResponseData());

						// data is changed in store so message size will be updated so reopen store to get correct data
						$this->reopenStore = true;
					}
					break;
				case REQUEST_END:
					if($this->reopenStore) {
						// @FIXME this actually very heavy operation for performance point of view
						// we need to remove this in future
						$store = mapi_openmsgstore($GLOBALS["mapisession"]->getSession(), $GLOBALS["mapisession"]->defaultstore);
					} else {
						$store = $GLOBALS["mapisession"]->getDefaultMessageStore();
					}

					// reset flag for further use
					$this->reopenStore = false;

					// Send notification for any changes in store's properties
					if($store) {
						$storeProps = mapi_getprops($store, array(PR_ENTRYID, PR_STORE_ENTRYID, PR_MDB_PROVIDER, PR_OBJECT_TYPE, PR_QUOTA_WARNING_THRESHOLD, PR_QUOTA_SEND_THRESHOLD, PR_QUOTA_RECEIVE_THRESHOLD, PR_MESSAGE_SIZE_EXTENDED));

						$storeSize = round($storeProps[PR_MESSAGE_SIZE_EXTENDED]/1024);

						// Check whether size of the store is changed, if it is changed then
						// send latest store size and quota information to client-side.
						if($this->storeSize != $storeSize) {
							$data = array();
							$data["props"] = array();
							$data["store_entryid"] = bin2hex($storeProps[PR_STORE_ENTRYID]);
							$data["props"]["object_type"] = $storeProps[PR_OBJECT_TYPE];
							$data["props"]["store_size"] = $storeSize;
							$data["props"]["quota_warning"] = isset($storeProps[PR_QUOTA_WARNING_THRESHOLD]) ? $storeProps[PR_QUOTA_WARNING_THRESHOLD] : 0;
							$data["props"]["quota_soft"] = isset($storeProps[PR_QUOTA_SEND_THRESHOLD]) ? $storeProps[PR_QUOTA_SEND_THRESHOLD] : 0;
							$data["props"]["quota_hard"] = isset($storeProps[PR_QUOTA_RECEIVE_THRESHOLD]) ? $storeProps[PR_QUOTA_RECEIVE_THRESHOLD] : 0;

							$this->addNotificationActionData("stores", array( "item" => array($data) ));
							$GLOBALS["bus"]->addData($this->createNotificationResponseData());

							// assign size for next checking
							$this->storeSize = $storeSize;
						}
					}
					break;
			}
		}
	}
?>
