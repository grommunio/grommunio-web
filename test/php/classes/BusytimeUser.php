<?php
require_once('IPMUser.php');

/**
 * BusytimeUser
 *
 * An extension of the IPMUser to load the
 * busy times for the calendar.
 */
class BusytimeUser extends IPMUser {

	/**
	 * Initialize the TestUser
	 */
	protected function initialize()
	{
		parent::initialize();

		$this->logon();

		$this->defaultStoreEntryId = $this->getDefaultMessageStoreEntryID();
		$this->defaultFolderEntryId = $this->getDefaultFolderEntryID(PR_IPM_APPOINTMENT_ENTRYID);
		$this->defaultItemModule = 'busytimelistmodule';
		$this->defaultListModule = 'busytimelistmodule';
	}

	/**
	 * Load all busy times from the calendar folder for the given restriction
	 * @param Number $start The start date from where the busy times should be loaded
	 * @param Number $due The due date until which the busy times should be loaded
	 * @return Array The array of busy times for the given range
	 */
	public function loadBusytimes($restrictStart, $restrictDue)
	{
		$this->logon();

		$extraProps = array(
			'restriction' => array(
				'startdate' => $restrictStart,
				'duedate' => $restrictDue
			)
		);

		return $this->loadItems($extraProps, false);
	}
}

?>
