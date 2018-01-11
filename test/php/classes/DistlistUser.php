<?php

require_once('IPMUser.php');
require_once('Restriction.php');

/**
 * DistlistUser
 *
 * An extension to the IPMUser to represent a user which
 * uses his distlists (e.g. saving distlists).
 */
class DistlistUser extends IPMUser {

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
	 * Obtain the array of named properties which can be present on Distlists
	 * @return Array The array of Named property tags
	 */
	public function getDistlistPropTags()
	{
		$this->logon();

		return $GLOBALS['properties']->getDistlistProperties();
	}

	/**
	 * Save a Distlist to the contacts folder
	 * @param array $message The message which should be saved
	 * @param Boolean $open True if the saved item should be opened, otherwise the
	 * saved properties will be returned.
	 * @return MAPI_MESSAGE The saved message
	 */
	public function saveDistlist($message, $open = true)
	{
		$this->logon();
		return $this->saveItem($message, $open);
	}

	/**
	 * Open the given Distlist from the Contacts folder.
	 * @param Binary $entryid The entryid of the item which should be deleted
	 * @param Array $extraProps The array of extra properties which should be
	 * send to the server together with this request
	 * @return Array The response from the PHP
	 */
	public function openDistlist($entryid, $extraProps = array())
	{
		$this->logon();
		return $this->openItem($entryid, $extraProps);
	}

	/**
	 * Delete the given Distlist from the Contacts folder.
	 * @param Binary $entryid The entryid of the item which should be deleted
	 * @param Array $extraProps The array of extra properties which should be
	 * send to the server together with this request
	 * @return Array The response from the PHP
	 */
	public function deleteDistlist($entryid, $extraProps = array())
	{
		$this->logon();
		return $this->deleteItem($entryid, $extraProps);
	}

	/**
	 * Copy/Move the given Distlist
	 * @param Binary $entryid The entryid of the item which should be copied/moved
	 * @param Array $extraProps The array of extra properties which should be
	 * send to the server together with this request
	 * @param Boolean $move True to move the item rather then copy
	 * @return Array The response from the PHP
	 */
	public function copyDistlist($entryid, $extraProps = array(), $move = false)
	{
		$this->logon();
		return $this->copyItem($entryid, $extraProps, $move);
	}

	/**
	 * Load all Distlists from the contacts folder
	 * @param Array $restriction The restriction which must be applied to the load action
	 * @param Boolean $open True if the saved item should be opened, otherwise the
	 * item props will be returned.
	 * @return Array The array of items for the given range
	 */
	public function loadDistlists($restriction = null, $open = true)
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
	 * Obtains the Distlist from the default folder based on the entryid
	 * @param Binary $entryid The entryid of the item to obtain
	 * @param Boolean $open True if the found item should be opened, otherwise the
	 * entryid's will be returned.
	 * @return Mixed The contact with the given entryid
	 */
	public function getDistlist($entryid, $open = true)
	{
		$this->logon();
		$items = $this->getItems(Restriction::ResProperty(PR_ENTRYID, $entryid, RELOP_EQ), $open);
		return array_shift($items);
	}

	/**
	 * Obtains the Distlist from the wastebasket folder based on the entryid
	 * @param Binary $entryid The entryid of the item to obtain
	 * @param Boolean $open True if the found item should be opened, otherwise the
	 * entryid's will be returned.
	 * @return Mixed The contact with the given entryid
	 */
	public function getDeletedDistlist($entryid, $open = true)
	{
		$this->logon();
		$items = $this->getDeletedItems(Restriction::ResProperty(PR_ENTRYID, $entryid, RELOP_EQ), $open);
		return array_shift($items);
	}

	/**
	 * Obtain all Distlist which are present in the wastebastet folder.
	 * @param Boolean $open True if the found item should be opened, otherwise the
	 * entryid's will be returned.
	 * @return Array list of items
	 */
	public function getAllDeletedDistlists($open = true)
	{
		$this->logon();
		return $this->getDeletedItems(Restriction::ResContent(PR_MESSAGE_CLASS, 'IPM.DistList', FL_SUBSTRING | FL_IGNORECASE), $open);
	}

	/**
	 * Obtain the properties for the Distlist
	 * @param Array $items array of the MAPI_MESSAGES.
	 * @param Array $tags The list of property tags to fetch.
	 * @return Array returns array of props of all MAPI_MESSAGE items passed to the function.
	 */
	public function getDistlistProps($items, $tags = array())
	{
		$this->logon();
		return $this->getItemProps($items, $tags);
	}

	/**
	 * Obtain the Members object for this distlist from a PHP response message
	 * @param array $message The message from where the members should be obtained
	 * @param String $distlistType (optional) The distlist type of member which will be returned
	 * @return array The members
	 */
	public function getMembersFromDistlist($message, $distlistType = false)
	{
		if (isset($message['members']) && isset($message['members']['item'])) {
			$props = Util::pluckFromObject($message['members']['item'], 'props');

			if($distlistType === false) {
				// will return all members
				return $props;
			}

			// return specific member
			$index = Util::indexInArray($props, 'distlist_type', $distlistType);
			if ($index >= 0) {
				return $message['members']['item'][$index];
			}
		}

		return null;
	}

	/**
	 * Obtain the Members object for this distlist from a PHP response message
	 * @param array $message The message which will converted to member
	 * @return array The member
	 */
	public function convertToDistlistMember($message)
	{
		$props = $message['props'];

		return array(
			'distlist_type' => DL_DIST,
			'display_name' => $props['display_name'],
			'address_type' => !empty($props['address_type']) ? $props['address_type'] : 'ZARAFA',
			'email_address' => !empty($props['email_address']) ? $props['email_address'] : '',
			'entryid' => !empty($message['entryid']) ? $message['entryid'] : '00000000ac21a95040d3ee48b319fba753304425010000',
		);
	}
}
?>