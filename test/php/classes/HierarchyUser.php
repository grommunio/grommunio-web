<?php

require_once 'PermissionUser.php';

/**
 * HierarchyUser.
 *
 * An extension to a normal PermissionUser to represent a user
 * which works in the hierarchy with various folders.
 */
class HierarchyUser extends PermissionUser {
	/**
	 * Initialize the TestUser.
	 */
	protected function initialize() {
		parent::initialize();

		$this->logon();

		$this->defaultStoreEntryId = $this->getDefaultMessageStoreEntryID();
		$this->defaultParentFolderEntryId = $this->getDefaultFolderEntryID(PR_IPM_SUBTREE_ENTRYID);
		$this->defaultFolderEntryId = $this->getReceiveFolderEntryID();
		$this->defaultListModule = 'hierarchymodule';
		$this->defaultItemModule = 'hierarchymodule';
	}

	/**
	 * Send a keepalive request to the server.
	 *
	 * @return array The response
	 */
	public function sendKeepAlive() {
		return $this->execute($this->defaultListModule, [
			'keepalive' => [],
		]);
	}

	/**
	 * Load all the folders from the.
	 *
	 * @return array The array of items
	 */
	public function loadHierarchy() {
		return $this->execute($this->defaultListModule, ["list" => []]);
	}

	/**
	 * Open the given folder.
	 *
	 * @param Binary $entryid The entryid of the item to open
	 *
	 * @return array The response from the PHP
	 */
	public function openFolder($entryid = false) {
		return $this->execute($this->defaultItemModule, [
			'open' => [
				'entryid' => $entryid ? bin2hex($entryid) : bin2hex($this->defaultFolderEntryId),
				'parent_entryid' => bin2hex($this->defaultParentFolderEntryId),
				'store_entryid' => bin2hex($this->defaultStoreEntryId),
			],
		]);
	}

	/**
	 * Obtain the foldersize information.
	 *
	 * @param Binary $entryid THe entryid of the folder to open
	 *
	 * @return array The response from PHP
	 */
	public function getFolderSize($entryid = false) {
		return $this->execute($this->defaultItemModule, [
			'foldersize' => [
				'entryid' => $entryid ? bin2hex($entryid) : bin2hex($this->defaultFolderEntryId),
				'parent_entryid' => bin2hex($this->defaultParentFolderEntryId),
				'store_entryid' => bin2hex($this->defaultStoreEntryId),
			],
		]);
	}

	/**
	 * Save the given folder.
	 *
	 * @param array $folder  The folder to save
	 * @param bool  $open    true if the saved item should be opened, otherwise the
	 *                       saved properties will be returned
	 * @param mixed $message
	 *
	 * @return MAPI_FOLDER The saved folder
	 */
	public function saveFolder($message, $open = true) {
		return $this->saveItem($message, $open);
	}

	/**
	 * Copy the given folder.
	 *
	 * @param Binary $entryid       The entryid of the item which should be copied
	 * @param Binary $target_parent The destination folder
	 *
	 * @return array The response from the PHP
	 */
	public function copyFolder($entryid, $target_parent) {
		return $this->saveItem([
			'entryid' => bin2hex($entryid),
			'message_action' => [
				'action_type' => 'copy',
				'destination_parent_entryid' => bin2hex($target_parent),
				'destination_store_entryid' => bin2hex($this->defaultStoreEntryId),
			],
		], false);
	}

	/**
	 * Move the given folder.
	 *
	 * @param Binary $entryid       The entryid of the item which should be move
	 * @param Binary $target_parent The destination folder
	 *
	 * @return array The response from the PHP
	 */
	public function moveFolder($entryid, $target_parent) {
		return $this->saveItem([
			'entryid' => bin2hex($entryid),
			'message_action' => [
				'action_type' => 'move',
				'destination_parent_entryid' => bin2hex($target_parent),
				'destination_store_entryid' => bin2hex($this->defaultStoreEntryId),
			],
		], false);
	}

	/**
	 * Delete the given folder from the mail folder.
	 *
	 * @param Binary $entryid    The entryid of the item which should be deleted
	 * @param array  $extraProps The array of extra properties which should be
	 *                           send to the server together with this request
	 *
	 * @return array The response from the PHP
	 */
	public function deleteFolder($entryid, $extraProps = []) {
		return $this->deleteItem($entryid, $extraProps);
	}

	/**
	 * Delete the contents of the requested folder.
	 *
	 * @param Binary $entryid The entryid of the folder to empty
	 *
	 * @return array the response from PHP
	 */
	public function emptyFolder($entryid = false) {
		return $this->saveItem([
			'entryid' => $entryid ? bin2hex($entryid) : bin2hex($this->defaultFolderEntryId),
			'message_action' => [
				'action_type' => 'emptyfolder',
			],
		], false);
	}

	/**
	 * Mark the contents of the requested folder as read.
	 *
	 * @param Binary $entryid The entryid of the folder to mark as read
	 *
	 * @return array the response from PHP
	 */
	public function markAllAsRead($entryid = false) {
		return $this->saveItem([
			'entryid' => $entryid ? bin2hex($entryid) : bin2hex($this->defaultFolderEntryId),
			'message_action' => [
				'action_type' => 'readflags',
			],
		], false);
	}

	/**
	 * Open a shared folder.
	 *
	 * @param array $props The properties with the shared folder details to open
	 *
	 * @return array The response from the PHP
	 */
	public function openSharedFolder($props) {
		return $this->execute($this->defaultListModule, ['opensharedfolder' => $props]);
	}

	/**
	 * Close a shared folder.
	 *
	 * @param array $props The properties with the shared folder details to close
	 *
	 * @return array The response from the PHP
	 */
	public function closeSharedFolder($props) {
		return $this->execute($this->defaultListModule, ['closesharedfolder' => $props]);
	}

	/**
	 * Obtain the properties for the folder.
	 *
	 * @param array $items array of the MAPI_FOLDERS
	 * @param array $tags  the list of property tags to fetch
	 *
	 * @return array returns array of props of all MAPI_FOLDER items passed to the function
	 */
	public function getFolderProps($items, $tags = false) {
		return $this->getItemProps($items, $tags);
	}

	/**
	 * Obtain the folders from the ipm subtree based on given restriction.
	 *
	 * @param array $restriction The restriction to apply to find the folder
	 * @param bool  $open        true if the found item should be opened, otherwise the
	 *                           entryid's will be returned
	 *
	 * @return array list of folders
	 */
	public function getFolders($restriction, $open = true) {
		$store = $this->getDefaultMessageStore();
		$folder = $this->getDefaultFolder(PR_IPM_SUBTREE_ENTRYID);

		$hierarchyTable = mapi_folder_gethierarchytable($folder, CONVENIENT_DEPTH | MAPI_DEFERRED_ERRORS);
		mapi_table_sort($hierarchyTable, [PR_DISPLAY_NAME => TABLE_SORT_ASCEND]);

		$rows = mapi_table_queryallrows($hierarchyTable, [PR_ENTRYID], $restriction);

		$items = [];

		if (count($rows) > 0) {
			foreach ($rows as $row) {
				if ($open === true) {
					$items[] = mapi_msgstore_openentry($store, $row[PR_ENTRYID]);
				}
				else {
					$items[] = $row[PR_ENTRYID];
				}
			}
		}

		return $items;
	}
}
