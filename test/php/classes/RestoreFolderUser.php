<?php

require_once('IPMUser.php');

/**
 * RestoreFolderUser
 *
 * An extension to the IPMUser which can be used to get list of soft deleted folders
 * and also delete/restore those folders.
 */
class RestoreFolderUser extends IPMUser {

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
	 * Initialize the RestoreFolderUser
	 */
	protected function initialize()
	{
		parent::initialize();

		$this->logon();

		$this->defaultStoreEntryId = $this->getDefaultMessageStoreEntryID();
		$this->defaultFolderEntryId = $this->getReceiveFolderEntryID();
		$this->defaultItemModule = 'restoreitemslistmodule';
		$this->defaultListModule = 'restoreitemslistmodule';
	}

	/**
	 * Load all soft deleted folder from the default folder which is 'inbox'.
	 * @param Array $sortOrder The properties related to sorting to be merged, by default 'false'.
	 * @return Array The list of soft deleted folder
	 */
	public function loadSoftdeletedItems($sortOrder = false)
	{
		$this->logon();

		$props = array( 'itemType' => 'folder' );

		if ($sortOrder) {
			$props = array_merge($props, $sortOrder);
		}

		return parent::loadItems($props, false);
	}

	/**
	 * Restore soft deleted folders from the default folder which is 'inbox'.
	 * @param Array $entryids The array of entryid of the folders which should be restored
	 * @return Array The response from the PHP
	 */
	public function restoreSoftdeletedItems($entryids)
	{
		$response = array();
		$this->logon();

		$props = array(
			'message_action' => array(
				'action_type' => 'restorefolder'
			)
		);

		foreach($entryids as $entryid){
			$response[] = parent::deleteItem($entryid, $props);
		}

		return $response;
	}

	/**
	 * Permanently Delete the soft deleted folder from the default folder which is 'Inbox'.
	 * @param Array $entryids The array of entryid of the folder which should be hard deleted
	 * @return Array The response from the PHP
	 */
	public function deleteSoftdeletedItems($entryids)
	{
		$response = array();
		$this->logon();

		$props = array(
			'message_action' => array(
				'action_type' => 'deletefolder'
			)
		);

		foreach($entryids as $entryid){
			$response[] = parent::deleteItem($entryid, $props);
		}

		return $response;
	}
}
?>