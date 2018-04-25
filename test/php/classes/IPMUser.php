<?php

require_once('TestUser.php');

/**
 * IPMUser
 *
 * An extension to a normal TestUser to represent a user
 * which works on IPM items inside a single folder.
 */
class IPMUser extends TestUser {
	/**
	 * The entryid for the default store.
	 */
	protected $defaultStoreEntryId;

	/**
	 * The entryid for the default folder.
	 */
	protected $defaultFolderEntryId;

	/**
	 * The name of the default itemmodule to which
	 * we send all item requests.
	 */
	protected $defaultItemModule;

	/**
	 * The name of the default listmodule to which
	 * we send all list requests.
	 */
	protected $defaultListModule;

	/**
	 * The entryid of the currently active search folder.
	 */
	private $searchFolderEntryId;

	/**
	 * @return The default Store Entryid
	 */
	public function getDefaultTestStoreEntryId()
	{
		return $this->defaultStoreEntryId;
	}

	/**
	 * @return The default Folder Entryid
	 */
	public function getDefaultTestFolderEntryId()
	{
		return $this->defaultFolderEntryId;
	}

	/**
	 * Sets default store entryid for particular user.
	 * @param Binary $storeEntryId The default Store Entryid
	 */
	public function setDefaultTestStoreEntryId($storeEntryId)
	{
		$this->defaultStoreEntryId = $storeEntryId;
	}

	/**
	 * Sets default folder entryid for particular user.
	 * @param Binary $folderEntryId The default Folder Entryid
	 */
	public function setDefaultTestFolderEntryId($folderEntryId)
	{
		$this->defaultFolderEntryId = $folderEntryId;
	}

	/**
	 * @return String The Default Item Module
	 */
	public function getItemModule()
	{
		return $this->defaultItemModule;
	}

	/**
	 * @return String The Default List Module
	 */
	public function getListModule()
	{
		return $this->defaultListModule;
	}

	/**
	 * Cleanup all folders inside the store which might have been affected during testing.
	 * This will additionally clean the search folder.
	 *
	 * @param MAPI_STORE The store which must be cleaned. Defaults to getDefaultMessageStore().
	 */
	public function cleanFolders($store = false)
	{
		parent::cleanFolders();

		// Remove all active search folders
		$this->logon();
		try {
			cleanSearchFolders();
		} catch (MAPIException $e) {
			// ignore any error in cleanup of search folders
		}
	}

	/**
	 * Save a item to the default folder
	 *
	 * @param array $message The message which should be saved
	 * @param Boolean $open True if the saved item should be opened, otherwise the
	 * saved properties will be returned.
	 * @return MAPI_MESSAGE The saved message
	 */
	protected function saveItem($message, $open = true)
	{
		$this->logon();

		// If a default folder or store entryid is provided, we must
		// apply it to the request data.
		if ($this->defaultFolderEntryId || $this->defaultStoreEntryId) {
			$message = array_merge(array(
				'parent_entryid' => bin2hex($this->defaultFolderEntryId),
				'store_entryid' => bin2hex($this->defaultStoreEntryId),
			), $message);
		}

		$item = $this->execute($this->defaultItemModule, array(
			'save' => $message
		));

		if (!isset($item) || !isset($item['update'])) {
			return $item;
		}

		$item = $item['update'];
		if (isset($item['item'])) {
			$item = $item['item'];
		}

		if ($open === true && isset($item['entryid'])) {
			$store = $this->getDefaultMessageStore();
			$item = mapi_msgstore_openentry($store, hex2bin($item['entryid']));
		}

		return $item;
	}

	/**
	 * Update an existing item
	 *
	 * @param array $message The message which should be updated
	 * @param Boolean $open True if the updated item should be opened, otherwise the
	 * saved properties will be returned.
	 * @return MAPI_MESSAGE the saved message
	 */
	protected function updateItem($message, $open = true)
	{
		$this->logon();

		$item = $this->execute($this->defaultItemModule, array(
			'save' => $message
		));

		if (!isset($item) || !isset($item['update'])) {
			return $item;
		}

		$item = $item['update'];
		if (isset($item['item'])) {
			$item = $item['item'];
		}

		if ($open === true && isset($item['entryid'])) {
			$store = $this->getDefaultMessageStore();
			$item = mapi_msgstore_openentry($store, hex2bin($item['entryid']));
		}

		return $item;
	}

	/**
	 * Open the given item from the default folder.
	 * @param Binary $entryid The entryid of the item which should be deleted
	 * @param Array $extraProps The array of extra properties which should be
	 * send to the server together with this request
	 * @return Array The response from the PHP
	 */
	protected function openItem($entryid, $extraProps = array())
	{
		$this->logon();

		return $this->execute($this->defaultItemModule, array(
			'open' => array_merge(array(
				'entryid' => bin2hex($entryid),
				'parent_entryid' => bin2hex($this->defaultFolderEntryId),
				'store_entryid' => bin2hex($this->defaultStoreEntryId),
			), $extraProps),
		));
	}

	/**
	 * Delete the given item from the default folder.
	 * @param Binary $entryid The entryid of the item which should be deleted
	 * @param Array $extraProps The array of extra properties which should be
	 * send to the server together with this request
	 * @param Boolean $softDelete (optional) True to soft-delete the item rather then delete
	 * @return Array The response from the PHP
	 */
	protected function deleteItem($entryid, $extraProps = array(), $softDelete = false)
	{
		$this->logon();

		return $this->execute($this->defaultItemModule, array(
			'delete' => array_merge(array(
				'entryid' => bin2hex($entryid),
				'parent_entryid' => bin2hex($this->defaultFolderEntryId),
				'store_entryid' => bin2hex($this->defaultStoreEntryId),
				'message_action' => array(
					'soft_delete' => $softDelete,
				),
			), $extraProps),
		));
	}

	/**
	 * Copy/Move the given item
	 * @param Binary $entryid The entryid of the item which should be copied/moved
	 * @param Array $extraProps The array of extra properties which should be
	 * send to the server together with this request
	 * @param Boolean $move True to move the item rather then copy
	 * @return Array The response from the PHP
	 */
	protected function copyItem($entryid, $extraProps = array(), $move = false)
	{
		$this->logon();

		return $this->execute($this->defaultItemModule, array(
			'save' => array_merge(array(
				'entryid' => bin2hex($entryid),
				'parent_entryid' => bin2hex($this->defaultFolderEntryId),
				'store_entryid' => bin2hex($this->defaultStoreEntryId),
				'message_action' => array(
					'action_type' => $move ? 'move' : 'copy',
					'destination_parent_entryid' => bin2hex($this->defaultFolderEntryId),
					'destination_store_entryid' => bin2hex($this->defaultStoreEntryId),
				)
			), $extraProps),
		));
	}

	/**
	 * Load all items from the default folder.
	 * @param Array $extraProps The array of extra properties which should be
	 * send to the server together with this request
	 * @param Boolean $open True if the saved item should be opened, otherwise the
	 * item props will be returned.
	 * @return Array The array of items in the folder
	 */
	protected function loadItems($extraProps = array(), $open = true)
	{
		$this->logon();

		$items = $this->execute($this->defaultListModule, array(
			'list' => array_merge(array(
				'entryid' => bin2hex($this->defaultFolderEntryId),
				'store_entryid' => bin2hex($this->defaultStoreEntryId),
			), $extraProps)
		));

		if (!isset($items) || !isset($items['list']) || !isset($items['list']['item'])) {
			return null;
		}

		$items = $items['list']['item'];

		if ($open === true && !empty($items)) {
			$store = $this->getDefaultMessageStore();

			$list = array();
			foreach($items as $item) {
				if (isset($item['entryid'])) {
					$list[] = mapi_msgstore_openentry($store, hex2bin($item['entryid']));
				}
			}
		} else {
			$list = $items;
		}

		return $list;
	}

	/**
	 * Finds the items from the default folder based on the given property and value.
	 * @param Folder $folder The folder in which to find the item
	 * @param Array $restriction The restriction to apply to find the item
	 * @param Boolean $open True if the found item should be opened, otherwise the
	 * entryid's will be returned.
	 * @return Array list of items
	 */
	private function findItemsInFolder($folder, $restriction, $open = true)
	{
		$this->logon();

		$table = mapi_folder_getcontentstable($folder);

		// Force the sorting of the table, by default we will sort by the modification time,
		// so that all callers can be sure the latest changed item will be the first in in
		// the table.
		mapi_table_sort($table, array(PR_LAST_MODIFICATION_TIME => TABLE_SORT_DESCEND));

		if (isset($restriction) && is_array($restriction)) {
			$rows = mapi_table_queryallrows($table, array(PR_ENTRYID), $restriction);
		} else {
			$rows = mapi_table_queryallrows($table, array(PR_ENTRYID));
		}
		$items = array();

		if (count($rows) > 0) {
			$store = $this->getDefaultMessageStore();

			// In principle, there should only be one row, but we'll handle them all just in case
			foreach($rows as $row) {
				if ($open === true) {
					$items[] = mapi_msgstore_openentry($store, $row[PR_ENTRYID]);
				} else {
					$items[] = $row[PR_ENTRYID];
				}
			}
		}

		return $items;
	}

	/**
	 * Wrapper around findItemsInFolder() which applies a waiting time for the item to arrive
	 * in the given folder. This can be used for items which are being sent to another user.
	 *
	 * @param Folder $folder The folder in which to find the item
	 * @param Array $restriction The restriction to apply to find the item
	 * @param Number $expectedCount the number of items that is expected to be returned
	 * @param Boolean $open True if the found item should be opened, otherwise the
	 * entryid's will be returned.
	 * @param Integer $delay delay in seconds to wait for spooler/dagent to actually send/receive meeting requests
	 * @return Array list of items
	 */
	private function findDelayedItemsInFolder($folder, $restriction, $expectedCount = 1, $open = true, $delay = 30)
	{
		$items = array();

		sleep(0.1);
		for ($i = 0; $i < $delay; $i++) {
			$items = $this->findItemsInFolder($folder, $restriction, $open);

			if ($items && (count($items) === $expectedCount)) {
				return $items;
			}

			// when finding items we need to give some time to spooler to actually deliver mail
			sleep(0.1 * $i);
		}

		return $items;
	}

	/**
	 * Obtains the items from the default folder based on the given property and value.
	 * @param Array $restriction The restriction to apply to find the item
	 * @param Boolean $open True if the found item should be opened, otherwise the
	 * entryid's will be returned.
	 * @return Array list of items
	 */
	protected function getItems($restriction, $open = true)
	{
		$this->logon();

		$store = $this->getDefaultMessageStore();
		$folder = mapi_msgstore_openentry($store,  $this->defaultFolderEntryId);

		return $this->findItemsInFolder($folder, $restriction, $open);
	}

	/**
	 * Obtains the items from the wastebasket folder based on the given property and value.
	 * @param Array $restriction The restriction to apply to find the item
	 * @param Boolean $open True if the found item should be opened, otherwise the
	 * entryid's will be returned.
	 * @return Array list of items
	 */
	protected function getDeletedItems($restriction, $open = true)
	{
		$this->logon();

		$folder = $this->getDefaultFolder(PR_IPM_WASTEBASKET_ENTRYID);

		return $this->findItemsInFolder($folder, $restriction, $open);
	}

	/**
	 * Obtains the items from Inbox based on the given property and value. This function should
	 * be used when the item is being send from another user and the function should take into account
	 * that the delivery can happen within a couple of seconds.
	 * @param Array $restriction The restriction to apply to find the item
	 * @param Number $expectedCount the number of items that is expected to be returned
	 * @param Boolean $open True if the found item should be opened, otherwise the
	 * entryid's will be returned.
	 * @param Integer $delay delay in seconds to wait for spooler/dagent to actually send/receive meeting requests
	 * @return Array list of items
	 * FIXME because of OpenUpdateToRecurringMeetingRequestTest::testOpeningUpdateAndMeetingRequest we need to change access
	 * specifier to public so this needs a proper fix
	 */
	public function getReceivedItems($restriction, $expectedCount = 1, $open = true, $delay = 30)
	{
		$this->logon();

		$folder = $this->getReceiveFolder();

		return $this->findDelayedItemsInFolder($folder, $restriction, $expectedCount, $open, $delay);
	}

	/**
	 * Obtains the items from the Sent Items folder based on the given property and value. This function
	 * should be used when the item is being send by the current user and the function should take into
	 * account that the delivery (and thus the move from Outbox to Sent Items) can happen within a couple
	 * of seconds.
	 * @param Array $restriction The restriction to apply to find the item
	 * @param Number $expectedCount the number of items that is expected to be returned
	 * @param Boolean $open True if the found item should be opened, otherwise the
	 * entryid's will be returned.
	 * @param Integer $delay delay in seconds to wait for spooler/dagent to actually send/receive meeting requests
	 * @return Array list of items
	 */
	protected function getSentItems($restriction, $expectedCount = 1, $open = true, $delay = 30)
	{
		$this->logon();

		$folder = $this->getDefaultFolder(PR_IPM_SENTMAIL_ENTRYID);

		return $this->findDelayedItemsInFolder($folder, $restriction, $expectedCount, $open, $delay);
	}

    /**
     * Obtains the items from the Outbox Items folder based on the given property and value.
     * @param Array $restriction The restriction to apply to find the item
     * @param Number $expectedCount the number of items that is expected to be returned
     * @param Boolean $open True if the found item should be opened, otherwise the
     * entryid's will be returned.
     * @param Integer $delay delay in seconds to wait for spooler/dagent to actually send/receive meeting requests
     * @return Array list of items
     */
    protected function getOutboxItems($restriction, $expectedCount = 1, $open = true, $delay = 0)
    {
        $this->logon();

        $folder = $this->getDefaultFolder(PR_IPM_OUTBOX_ENTRYID);

        return $this->findDelayedItemsInFolder($folder, $restriction, $expectedCount, $open, $delay);
    }

	/**
	 * Start a normal search in the default folder without using search folders
	 * Restriction used here is mimicking restriction generation defined in client/zarafa/common/ui/SearchBar.js
	 * so make sure both these restrictions are in sync otherwise we would have hard to find bugs
	 * @param String $proptag The property on which to search
	 * @param Mixed $propvalue The value to which the property must match
	 * @return Array The response from the server
	 */
	public function doSearch($proptag, $propvalue)
	{
		$this->logon();

		$propvalue = preg_split("/[\.\/\~\,\ \@]+/", $propvalue);

		$restrictions = array();
		for($index = 0, $len = count($propvalue); $index < $len; $index++) {
			if(!empty($propvalue[$index])) {
				array_push($restrictions,
					Restriction::ResAnd(array(
						Restriction::ResExist($proptag),
						Restriction::ResContent($proptag, $propvalue[$index], FL_SUBSTRING | FL_IGNORECASE)
					))
				);
			}
		}

		return $this->execute($this->defaultListModule, array(
			'search' => array(
				'entryid' => bin2hex($this->defaultFolderEntryId),
				'store_entryid' => bin2hex($this->defaultStoreEntryId),
				'use_searchfolder' => false,
				'subfolders' => false,
				'restriction' => array(
					'search' => Restriction::ResAnd($restrictions)
				),
			)
		));
	}

	/**
	 * Start a search in the default folder using a Search folder
	 * Restriction used here is mimicking restriction generation defined in client/zarafa/common/ui/SearchBar.js
	 * so make sure both these restrictions are in sync otherwise we would have hard to find bugs
	 * @param String $proptag The property on which to search
	 * @param Mixed $propvalue The value to which the property must match
	 * @return Array The response from the server
	 */
	public function startSearch($proptag, $propvalue)
	{
		$this->logon();

		$propvalue = preg_split("/[\.\/\~\,\ \@]+/", $propvalue);

		$restrictions = array();
		for($index = 0, $len = count($propvalue); $index < $len; $index++) {
			if(!empty($propvalue[$index])) {
				array_push($restrictions,
					Restriction::ResAnd(array(
						Restriction::ResExist($proptag),
						Restriction::ResContent($proptag, $propvalue[$index], FL_SUBSTRING | FL_IGNORECASE)
					))
				);
			}
		}

		$result = $this->execute($this->defaultListModule, array(
			'search' => array(
				'entryid' => bin2hex($this->defaultFolderEntryId),
				'store_entryid' => bin2hex($this->defaultStoreEntryId),
				'use_searchfolder' => true,
				'subfolders' => false,
				'restriction' => array(
					'search' => Restriction::ResAnd($restrictions)
				),
			)
		));

		if (isset($result['search']) &&
			isset($result['search']['search_meta']) &&
			isset($result['search']['search_meta']['searchfolder_entryid'])) {
				$this->searchFolderEntryId = hex2bin($result['search']['search_meta']['searchfolder_entryid']);
		}

		return $result;
	}

	/**
	 * Request an update for the search results for a given search folder
	 * @return Array The response from the server
	 */
	public function updateSearch()
	{
		$this->logon();

		return $this->execute($this->defaultListModule, array(
			'updatesearch' => array(
				'entryid' => bin2hex($this->searchFolderEntryId),
				'store_entryid' => bin2hex($this->defaultStoreEntryId),
			)
		));
	}

	/**
	 * Request the end of a search request for the given search folder.
	 * @return Array The response from the server
	 */
	public function stopSearch()
	{
		$this->logon();

		$result = $this->execute($this->defaultListModule, array(
			'stopsearch' => array(
				'entryid' => bin2hex($this->searchFolderEntryId),
				'store_entryid' => bin2hex($this->defaultStoreEntryId),
			)
		));

		return $result;
	}

	/**
	 * Function will return array of props for all the MAPI_MESSAGES passed to the function.
	 * @param Array $items array of the MAPI_MESSAGES.
	 * @param Array $tags The list of property tags to fetch.
	 * @return Array returns array of props of all MAPI_MESSAGE items passed to the function.
	 */
	protected function getItemProps($items, $tags = array())
	{
		$this->logon();

		if (!is_array($items)) {
			$items = Array($items);
		}

		$props = array();
		foreach ($items as $key => $item) {
			if (!empty($tags)) {
				array_push($props, mapi_getprops($item, $tags));
			} else {
				array_push($props, mapi_getprops($item));
			}
		}

		if (count($props) === 1) {
			$props = array_shift($props);
		}

		return $props;
	}

	/**
	 * Function can be used to add an embedded attachment to a message
	 * @param {Array} $message data that will be used for saving message, it will be used to get unique id of attachments to store
	 * @param {MAPIMessage} $messageToEmbed mapi message that should be added as embedded attachment
	 */
	function addEmbeddedAttachment($message, $messageToEmbed)
	{
		$this->logon();

		$dialogAttachments = $message['attachments']['dialog_attachments'];
		if(empty($dialogAttachments)) {
			return;
		}

		$props = $this->getItemProps($messageToEmbed, array(PR_ENTRYID, PR_STORE_ENTRYID));

		// open file
		$GLOBALS['attachment_state']->open();

		$attachid = $GLOBALS['attachment_state']->addEmbeddedAttachment($dialogAttachments, array(
			'entryid' => bin2hex($props[PR_ENTRYID]),
			'store_entryid' => bin2hex($props[PR_STORE_ENTRYID]),
			// indicate that this is actually an embedded attachment
			'sourcetype' => 'embedded'
		));

		// save the changes to disk
		$GLOBALS['attachment_state']->close();
	}

	/**
	 * Obtain the Attachments object for this message from a PHP response message
	 * @param array $message The message from where the attachments should be obtained
	 * @param Number $attachNum attachment that is stored with this attach num will be returned
	 * @return array The attachments
	 */
	public function getAttachmentFromMessage($message, $attachNum = -1)
	{
		if (isset($message['attachments']) && isset($message['attachments']['item'])) {
			$props = Util::pluckFromObject($message['attachments']['item'], 'props');

			if($attachNum === -1) {
				// will return all attachments
				return $props;
			}

			// return specific attachment
			$index = Util::indexInArray($props, 'attach_num', $attachNum);
			if ($index >= 0) {
				return $message['attachments']['item'][$index];
			}
		}

		return null;
	}
}
?>
