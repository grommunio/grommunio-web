<?php

require_once 'IPMUser.php';

/**
 * RestoreMessageUser.
 *
 * An extension to the IPMUser which can be used to get list of sof deleted items and
 * also can be used to hard delete messages from folder or restore it.
 */
class RestoreMessageUser extends IPMUser {
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
	 * Initialize the RestoreMessageUser.
	 */
	protected function initialize() {
		parent::initialize();

		$this->logon();

		$this->defaultStoreEntryId = $this->getDefaultMessageStoreEntryID();
		$this->defaultFolderEntryId = $this->getDefaultFolderEntryID(PR_IPM_DRAFTS_ENTRYID);
		$this->defaultItemModule = 'restoreitemslistmodule';
		$this->defaultListModule = 'restoreitemslistmodule';
	}

	/**
	 * Load all soft deleted items from the default folder which is 'drafts'.
	 *
	 * @param array $sortOrder the properties related to sorting to be merged, by default 'false'
	 *
	 * @return array The list of soft deleted messages from drafts folder
	 */
	public function loadSoftdeletedItems($sortOrder = false) {
		$this->logon();

		$props = ['itemType' => 'message'];

		if ($sortOrder) {
			$props = array_merge($props, $sortOrder);
		}

		return parent::loadItems($props, false);
	}

	/**
	 * Restore soft deleted items from the default folder which is 'drafts'.
	 *
	 * @param array $entryids The array of entryid of the items which should be restored
	 *
	 * @return array The response from the PHP
	 */
	public function restoreSoftdeletedItems($entryids) {
		$response = [];
		$this->logon();

		$props = [
			'message_action' => [
				'action_type' => 'restoremessage',
			],
		];

		foreach ($entryids as $entryid) {
			$response[] = parent::deleteItem($entryid, $props);
		}

		return $response;
	}

	/**
	 * Permanently Delete the soft deleted items from the default folder which is 'drafts'.
	 *
	 * @param array $entryids The array of entryid of the items which should be hard deleted
	 *
	 * @return array The response from the PHP
	 */
	public function deleteSoftdeletedItems($entryids) {
		$response = [];
		$this->logon();

		$props = [
			'message_action' => [
				'action_type' => 'deletemessage',
			],
		];

		foreach ($entryids as $entryid) {
			$response[] = parent::deleteItem($entryid, $props);
		}

		return $response;
	}
}
