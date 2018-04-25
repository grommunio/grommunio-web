<?php

require_once('IPMUser.php');

/**
 * FreebusyUser
 *
 * An extension to the IPMUser to represent a user which
 * uses his freebusy information
 */
class FreebusyUser extends IPMUser {

	/**
	 * Initialize the TestUser
	 */
	protected function initialize()
	{
		parent::initialize();

		$this->logon();

		$this->defaultStoreEntryId = $this->getDefaultMessageStoreEntryID();
		$this->defaultFolderEntryId = $this->getDefaultFolderEntryID(PR_IPM_APPOINTMENT_ENTRYID);
		$this->defaultItemModule = 'freebusymodule';
		$this->defaultListModule = 'freebusymodule';
	}

	/**
	 * Load all mails from the mail folder
	 * @param Array The list of users for which the freebusy must be loaded
	 * @param Number $start The start date from where the freebusy should be loaded
	 * @param Number $due The due date until which the freebusy should be loaded
	 * @return Array The array of items
	 */
	public function loadFreebusy($users, $restrictStart, $restrictDue)
	{
		$this->logon();
		return $this->execute($this->defaultListModule, array(
			"list" => array(
				"users" => $users,
				"start" => $restrictStart,
				"end" => $restrictDue
			)
		));
	}
}

?>
