<?php

require_once('IPMUser.php');
require_once('Restriction.php');

/**
 * ContactUser
 *
 * An extension to the IPMUser to represent a user which
 * uses his contacts (e.g. saving contacts).
 */
class ContactUser extends IPMUser {

	/**
	 * Initialize the TestUser
	 */
	protected function initialize()
	{
		parent::initialize();

		$this->logon();

		$this->defaultStoreEntryId = $this->getDefaultMessageStoreEntryID();
		$this->defaultFolderEntryId = $this->getDefaultFolderEntryID(PR_IPM_CONTACT_ENTRYID);
		$this->defaultItemModule = 'contactitemmodule';
		$this->defaultListModule = 'contactlistmodule';
	}

	/**
	 * Obtain the array of named properties which can be present on Contacts
	 *
	 * @return Array The array of Named property tags
	 */
	public function getContactPropTags()
	{
		$this->logon();

		return $GLOBALS['properties']->getContactProperties();
	}

	/**
	 * Save a Contact to the contacts folder
	 *
	 * @param array $message The message which should be saved
	 * @param Boolean $open True if the saved item should be opened, otherwise the
	 * saved properties will be returned.
	 * @return MAPI_MESSAGE The saved message
	 */
	public function saveContact($message, $open = true)
	{
		$this->logon();
		return $this->saveItem($message, $open);
	}

	/**
	 * Open the given Contact from the Contacts folder.
	 * @param Binary $entryid The entryid of the item which should be deleted
	 * @param Array $extraProps The array of extra properties which should be
	 * send to the server together with this request
	 * @return Array The response from the PHP
	 */
	public function openContact($entryid, $extraProps = array())
	{
		$this->logon();
		return $this->openItem($entryid, $extraProps);
	}

	/**
	 * Delete the given Contact from the Contacts folder.
	 * @param Binary $entryid The entryid of the item which should be deleted
	 * @param Array $extraProps The array of extra properties which should be
	 * send to the server together with this request
	 * @return Array The response from the PHP
	 */
	public function deleteContact($entryid, $extraProps = array())
	{
		$this->logon();
		return $this->deleteItem($entryid, $extraProps);
	}

	/**
	 * Copy/Move the given Contact
	 * @param Binary $entryid The entryid of the item which should be copied/moved
	 * @param Array $extraProps The array of extra properties which should be
	 * send to the server together with this request
	 * @param Boolean $move True to move the item rather then copy
	 * @return Array The response from the PHP
	 */
	public function copyContact($entryid, $extraProps = array(), $move = false)
	{
		$this->logon();
		return $this->copyItem($entryid, $extraProps, $move);
	}

	/**
	 * Load all contacts from the contacts folder
	 * @param Array $restriction The restriction which must be applied to the load action
	 * @param Boolean $open True if the saved item should be opened, otherwise the
	 * item props will be returned.
	 * @return Array The array of items for the given range
	 */
	public function loadContacts($restriction = null, $open = true)
	{
		$this->logon();

		$extraProps = array();
		if (!is_null($restriction)) {
			$extraProps = array(
				'restriction' => $restriction
			);
		}

		return $this->loadItems($extraProps, $open);
	}

	/**
	 * Obtains the contact from the default folder based on the entryid
	 * @param Binary $entryid The entryid of the item to obtain
	 * @param Boolean $open True if the found item should be opened, otherwise the
	 * entryid's will be returned.
	 * @return Mixed The contact with the given entryid
	 */
	public function getContact($entryid, $open = true)
	{
		$this->logon();
		$items = $this->getItems(Restriction::ResProperty(PR_ENTRYID, $entryid, RELOP_EQ), $open);
		return array_shift($items);
	}

	/**
	 * Obtains the contact from the wastebasket folder based on the entryid
	 * @param Binary $entryid The entryid of the item to obtain
	 * @param Boolean $open True if the found item should be opened, otherwise the
	 * entryid's will be returned.
	 * @return Mixed The contact with the given entryid
	 */
	public function getDeletedContact($entryid, $open = true)
	{
		$this->logon();
		$items = $this->getDeletedItems(Restriction::ResProperty(PR_ENTRYID, $entryid, RELOP_EQ), $open);
		return array_shift($items);
	}

	/**
	 * Obtain all contacts which are present in the wastebastet folder.
	 * @param Boolean $open True if the found item should be opened, otherwise the
	 * entryid's will be returned.
	 * @return Array list of items
	 */
	public function getAllDeletedContacts($open = true)
	{
		$this->logon();
		return $this->getDeletedItems(Restriction::ResContent(PR_MESSAGE_CLASS, 'IPM.Contact', FL_SUBSTRING | FL_IGNORECASE), $open);
	}

	/**
	 * Obtain the properties for the contact
	 * @param Array $items array of the MAPI_MESSAGES.
	 * @param Array $tags The list of property tags to fetch.
	 * @return Array returns array of props of all MAPI_MESSAGE items passed to the function.
	 */
	public function getContactProps($items, $tags = array())
	{
		$this->logon();
		return $this->getItemProps($items, $tags);
	}
}
?>
