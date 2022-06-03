<?php

require_once 'IPMUser.php';

/**
 * AddressBookUser.
 *
 * An extension to a normal TestUser to represent a user
 * which works in the addressbook
 */
class AddressBookUser extends IPMUser {
	/**
	 * Initialize the TestUser.
	 */
	protected function initialize() {
		parent::initialize();

		$this->logon();

		$this->defaultStoreEntryId = $this->getDefaultMessageStoreEntryID();
		$this->defaultFolderEntryId = $this->getDefaultFolderEntryID(PR_IPM_CONTACT_ENTRYID);
		$this->defaultItemModule = 'addressbookitemmodule';
		$this->defaultListModule = 'addressbooklistmodule';
	}

	/**
	 * Open the given Address Book Item from the Address Book.
	 *
	 * @param Binary $entryid    The entryid of the item which should be opened
	 * @param array  $extraProps The array of extra properties which should be
	 *                           send to the server together with this request
	 *
	 * @return array The response from the PHP
	 */
	public function openABItem($entryid, $extraProps = []) {
		$this->logon();

		return $this->openItem($entryid, $extraProps);
	}

	/**
	 * Load the AddressBook hierarchy.
	 *
	 * @param array $restriction The restriction to be applied on the contents
	 *
	 * @return array The AddressBook Hierarchy
	 */
	public function loadHierarchy($restriction = []) {
		$this->logon();

		if (!empty($restriction)) {
			return $this->execute($this->defaultListModule, [
				'list' => [
					'subActionType' => 'hierarchy',
					'gab' => 'all',
					'restriction' => $restriction,
				],
			]);
		}

		return $this->execute($this->defaultListModule, [
			'list' => [
				'subActionType' => 'hierarchy',
				'gab' => 'all',
			],
		]);
	}

	/**
	 * Load the contents of the Global Address Book.
	 *
	 * @param array $restriction The restriction to be applied on the contents
	 *
	 * 	 * @return Array the Global AddressBook contents
	 */
	public function loadGlobalAddressBook($restriction = []) {
		$this->logon();

		if (!empty($restriction)) {
			return $this->execute($this->defaultListModule, [
				'list' => [
					'subActionType' => 'globaladdressbook',
					'folderType' => 'gab',
					'restriction' => $restriction,
				],
			]);
		}

		return $this->execute($this->defaultListModule, [
			'list' => [
				'subActionType' => 'globaladdressbook',
				'folderType' => 'gab',
			],
		]);
	}

	/**
	 * Load the contacts folder through the Global Address Book.
	 *
	 * @param array $restriction The restriction to be applied on the contents
	 *
	 * @return array The Contacts contents in the AddressBook
	 */
	public function loadContactsAddressBook($restriction = []) {
		$this->logon();
		$abContactFolderEntryId = $this->getABContactFolderEntryId();

		if (empty($restriction)) {
			return $this->execute($this->defaultListModule, [
				'list' => [
					'subActionType' => 'globaladdressbook',
					'folderType' => 'contacts',
					'entryid' => $abContactFolderEntryId,
				],
			]);
		}

		return $this->execute($this->defaultListModule, [
			'list' => [
				'subActionType' => 'globaladdressbook',
				'folderType' => 'contacts',
				'entryid' => $abContactFolderEntryId,
				'restriction' => $restriction,
			],
		]);
	}

	/**
	 * Returns the AB entryid of the Contacts folder in the Addressbook Hierarchy.
	 * It loads the hierarchy and from that response it searches for the folder named "Contacts".
	 *
	 * @return string The AB entryid of the Contact folder
	 */
	public function getABContactFolderEntryId() {
		$this->logon();

		$entryid = false;
		$hierarchy = $this->loadHierarchy();

		$hierarchyItems = $hierarchy['list']['item'];
		for ($i = 0,$len = count($hierarchyItems); $i < $len; ++$i) {
			if ($hierarchyItems[$i]['props']['display_name'] == 'Contacts') {
				$entryid = $hierarchyItems[$i]['props']['entryid'];
				break;
			}
		}

		return $entryid;
	}
}
