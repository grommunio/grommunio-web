<?php
	/**
	 * ListNotifier
	 *
	 * Generates notifications for changes to the
	 * folder contents.
	 */
	class ListNotifier extends Notifier
	{
		/**
		 * @return Number Return the bitmask of events which are handled
		 * by this notifier. The bitmask can consist of the 
		 * OBJECT_SAVE, OBJECT_DELETE, TABLE_SAVE, TABLE_DELETE, REQUEST_START and REQUEST_END flags
		 */
		public function getEvents()
		{
			return OBJECT_SAVE | TABLE_SAVE | TABLE_DELETE;
		}

		/**
		 * Obtain the list of Message Properties which should be returned
		 * to the client when a Message was changed.
		 * @return Array The properties mapping
		 */
		protected function getPropertiesList()
		{
			return Array();
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
			switch ($event) {
				case TABLE_SAVE:
					$data = array();

					if (isset($props[PR_STORE_ENTRYID])) {
						$store = $GLOBALS["mapisession"]->openMessageStore($props[PR_STORE_ENTRYID]);

						if (isset($props[PR_ENTRYID])) {
							$properties = $this->getPropertiesList();
							$data = $GLOBALS["operations"]->getMessageProps($store, $GLOBALS["operations"]->openMessage($store, $props[PR_ENTRYID]), $properties);
							$this->addNotificationActionData("update", array( "item" => array($data) ));
						} else if (isset($props[PR_PARENT_ENTRYID])) {
							// An object was created inside this folder for which we don't know the entryid
							// this can happen when we copy or move a message. Just tell the javascript that
							// this folder has a new object.
							$folder = mapi_msgstore_openentry($store, $props[PR_PARENT_ENTRYID]);
							$folderProps = mapi_getprops($folder, array(PR_ENTRYID, PR_PARENT_ENTRYID, PR_STORE_ENTRYID, PR_CONTENT_COUNT, PR_CONTENT_UNREAD, PR_DISPLAY_NAME));

							$data = array(
								"item" => array(
									array(
										"content_count" => $folderProps[PR_CONTENT_COUNT],
										"content_unread" => $folderProps[PR_CONTENT_UNREAD],
										// Add store_entryid,entryid of folder and display_name of folder 
										// to JSON data in order to refresh the list.
										"store_entryid" => bin2hex($folderProps[PR_STORE_ENTRYID]),
										"parent_entryid" => bin2hex($folderProps[PR_PARENT_ENTRYID]),
										"entryid" => bin2hex($folderProps[PR_ENTRYID]),
										"display_name" => $folderProps[PR_DISPLAY_NAME]
									)
								)
							);

							$this->addNotificationActionData("newobject", $data);
						}
					}
					break;
				case TABLE_DELETE:
					$folderEntryID = isset($props[PR_PARENT_ENTRYID]) ? $props[PR_PARENT_ENTRYID] : false;

					if (isset($props[PR_ENTRYID]) && $folderEntryID) {
						$data = array();
						$data["parent_entryid"] = bin2hex($folderEntryID);

						if (is_array($props[PR_ENTRYID])) {
							$data["entryid"] = array();
						
							foreach ($props[PR_ENTRYID] as $entryid) {
								array_push($data["entryid"], bin2hex($entryid));
							}
						} else {
							$data["entryid"] = bin2hex($props[PR_ENTRYID]);
						}
						
						$this->addNotificationActionData("delete", array( "item" => array($data) ));
					}
					break;
			}

			$GLOBALS["bus"]->addData($this->createNotificationResponseData());
		}
	}
?>
