<?php

/**
 * Hierarchy Notifier.
 *
 * Generates notifications which might be created
 * inside the hierarchy.
 */
class HierarchyNotifier extends Notifier {
	/**
	 * Flag to indicate that we need to reopen store object to get updated message size.
	 */
	private $reopenStore;

	/**
	 * previous store size of the default store of user, this is updated whenever
	 * notification is sent to client to update quota details.
	 */
	private $storeSize;

	public function __construct() {
		/*
		 * Initialize hierarchy store's size, so in future on change events of
		 * folder object or message item we can check store's previous size,
		 * and if it is changed then send notification to server.
		 */
		$this->storeSize = -1;

		parent::__construct();
	}

	/**
	 * @return Number Return the bitmask of events which are handled
	 *                by this notifier. The bitmask can consist of the
	 *                OBJECT_SAVE, OBJECT_DELETE, TABLE_SAVE, TABLE_DELETE, REQUEST_START and REQUEST_END flags
	 */
	public function getEvents() {
		return OBJECT_SAVE | OBJECT_DELETE | TABLE_SAVE | TABLE_DELETE | REQUEST_START | REQUEST_END;
	}

	/**
	 * If an event elsewhere has occurred, it enters in this method. This method
	 * executes one or more actions, depends on the event.
	 *
	 * @param int    $event   event
	 * @param string $entryid entryid
	 * @param mixed  $props
	 */
	public function update($event, $entryid, $props) {
		switch ($event) {
			case REQUEST_START:
				$this->reopenStore = false;
				break;

			case OBJECT_SAVE:
			case TABLE_SAVE:
			case TABLE_DELETE:
				$data = [];

				// If no PR_ENTRYID is given, we will settle with PR_PARENT_ENTRYID
				$folderEntryid = false;
				if (isset($props[PR_PARENT_ENTRYID])) {
					$folderEntryid = $props[PR_PARENT_ENTRYID];
				}
				elseif (isset($props[PR_ENTRYID])) {
					$folderEntryid = $props[PR_ENTRYID];
				}

				// We won't send notifiers for changes to the todolist folder, since there is nothing to
				// be updated by the client.
				$entryIdUtil = new EntryId();
				if ($entryIdUtil->compareEntryIds(bin2hex($folderEntryid), bin2hex(TodoList::getEntryId()))) {
					return;
				}

				if (!isset($props[PR_STORE_ENTRYID]) && !$folderEntryid) {
					break;
				}

				$store = $GLOBALS["mapisession"]->openMessageStore($props[PR_STORE_ENTRYID]);

				$folder = mapi_msgstore_openentry($store, $folderEntryid);
				if ($folder) {
					$properties = $GLOBALS["properties"]->getFolderListProperties();
					$folderProps = mapi_getprops($folder, $properties);

					// If this folder belongs to Favorites folder,then change PARENT_ENTRYID manually.
					if ($GLOBALS["entryid"]->isFavoriteFolder($folderProps[PR_ENTRYID])) {
						$storeProps = mapi_getprops($store, [PR_IPM_FAVORITES_ENTRYID]);

						if (isset($storeProps[PR_IPM_FAVORITES_ENTRYID])) {
							$favFolder = mapi_msgstore_openentry($store, $storeProps[PR_IPM_FAVORITES_ENTRYID]);
							$favHierarchyTable = mapi_folder_gethierarchytable($favFolder, MAPI_DEFERRED_ERRORS);
							$folders = mapi_table_queryallrows(
								$favHierarchyTable,
								[PR_DISPLAY_NAME, PR_STORE_ENTRYID],
								[RES_PROPERTY,
									[
										RELOP => RELOP_EQ,
										ULPROPTAG => PR_ENTRYID,
										VALUE => [
											PR_ENTRYID => $folderProps[PR_ENTRYID],
										],
									],
								]
							);

							if (!empty($folders)) {
								// Update folderProps to properties of folder which is under 'FAVORITES'
								$folderProps[PR_DISPLAY_NAME] = $folders[0][PR_DISPLAY_NAME];
								$folderProps[PR_PARENT_ENTRYID] = $storeProps[PR_IPM_FAVORITES_ENTRYID];
							}
						}
					}

					$data[] = $GLOBALS["operations"]->setFolder($folderProps);
				}

				$this->addNotificationActionData("folders", ["item" => $data]);
				$GLOBALS["bus"]->addData($this->createNotificationResponseData());

				// data is changed in store so message size will be updated so reopen store to get correct data
				$this->reopenStore = true;
				break;

			case OBJECT_DELETE:
				if (isset($props[PR_ENTRYID], $props[PR_PARENT_ENTRYID])) {
					$data = [];
					$data["folderdelete"] = 1;
					$data["entryid"] = bin2hex($props[PR_ENTRYID]);
					$data["parent_entryid"] = bin2hex($props[PR_PARENT_ENTRYID]);
					$data["store_entryid"] = bin2hex((string) $props[PR_STORE_ENTRYID]);

					$this->addNotificationActionData("folders", ["item" => $data]);
					$GLOBALS["bus"]->addData($this->createNotificationResponseData());

					// data is changed in store so message size will be updated so reopen store to get correct data
					$this->reopenStore = true;
				}
				break;

			case REQUEST_END:
				if ($this->reopenStore) {
					// @FIXME this actually very heavy operation for performance point of view
					// we need to remove this in future
					$store = $GLOBALS["mapisession"]->getDefaultMessageStore(true);
				}
				else {
					$store = $GLOBALS["mapisession"]->getDefaultMessageStore();
				}

				// reset flag for further use
				$this->reopenStore = false;

				// Send notification for any changes in store's properties
				if ($store) {
					$storeProps = mapi_getprops($store, [PR_ENTRYID, PR_STORE_ENTRYID, PR_MDB_PROVIDER, PR_OBJECT_TYPE, PR_PROHIBIT_SEND_QUOTA, PR_QUOTA_WARNING_THRESHOLD, PR_PROHIBIT_RECEIVE_QUOTA, PR_MESSAGE_SIZE_EXTENDED]);

					$storeSize = round($storeProps[PR_MESSAGE_SIZE_EXTENDED] / 1024);

					// Check whether size of the store is changed, if it is changed then
					// send latest store size and quota information to client-side.
					if ($this->storeSize != $storeSize) {
						$data = [];
						$data["props"] = [];
						$data["store_entryid"] = bin2hex((string) $storeProps[PR_STORE_ENTRYID]);
						$data["props"]["object_type"] = $storeProps[PR_OBJECT_TYPE];
						$data["props"]["store_size"] = $storeSize;
						$data["props"]["quota_warning"] = $storeProps[PR_QUOTA_WARNING_THRESHOLD] ?? 0;
						$data["props"]["quota_soft"] = $storeProps[PR_PROHIBIT_SEND_QUOTA] ?? 0;
						$data["props"]["quota_hard"] = $storeProps[PR_PROHIBIT_RECEIVE_QUOTA] ?? 0;

						$this->addNotificationActionData("stores", ["item" => [$data]]);
						$GLOBALS["bus"]->addData($this->createNotificationResponseData());

						// assign size for next checking
						$this->storeSize = $storeSize;
					}
				}
				break;
		}
	}
}
