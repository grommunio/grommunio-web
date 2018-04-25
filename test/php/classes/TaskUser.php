<?php

require_once('IPMUser.php');
require_once('Restriction.php');

/**
 * TaskUser
 *
 * An extension to the IPMUser to represent a user which
 * uses his tasks (e.g. saving tasks).
 */
class TaskUser extends IPMUser {

	/**
	 * Initialize the TestUser
	 */
	protected function initialize()
	{
		parent::initialize();

		$this->logon();

		$this->defaultStoreEntryId = $this->getDefaultMessageStoreEntryID();
		$this->defaultFolderEntryId = $this->getDefaultFolderEntryID(PR_IPM_TASK_ENTRYID);
		$this->defaultItemModule = 'taskitemmodule';
		$this->defaultListModule = 'tasklistmodule';
	}

	/**
	 * Save a Task to the tasks folder
	 *
	 * @param array $message The message which should be saved
	 * @param Boolean $open True if the saved item should be opened, otherwise the
	 * saved properties will be returned.
	 * @return MAPI_MESSAGE The saved message
	 */
	public function saveTask($message, $open = true)
	{
		$this->logon();
		return $this->saveItem($message, $open);
	}

	/**
	 * Open the given task from the tasks folder.
	 * @param Binary $entryid The entryid of the item which should be deleted
	 * @param Array $extraProps The array of extra properties which should be
	 * send to the server together with this request
	 * @return Array The response from the PHP
	 */
	public function openTask($entryid, $extraProps = array())
	{
		$this->logon();
		return $this->openItem($entryid, $extraProps);
	}

	/**
	 * Delete the given task from the tasks folder.
	 * @param Binary $entryid The entryid of the item which should be deleted
	 * @param Array $extraProps The array of extra properties which should be
	 * send to the server together with this request
	 * @return Array The response from the PHP
	 */
	public function deleteTask($entryid, $extraProps = array())
	{
		$this->logon();
		return $this->deleteItem($entryid, $extraProps);
	}

	/**
	 * Copy/Move the given Task
	 * @param Binary $entryid The entryid of the item which should be copied/moved
	 * @param Array $extraProps The array of extra properties which should be
	 * send to the server together with this request
	 * @param Boolean $move True to move the item rather then copy
	 * @return Array The response from the PHP
	 */
	public function copyTask($entryid, $extraProps = array(), $move = false)
	{
		$this->logon();
		return $this->copyItem($entryid, $extraProps, $move);
	}

	/**
	 * Load all tasks from the tasks folder
	 * @param Boolean $open True if the saved item should be opened, otherwise the
	 * item props will be returned.
	 * @return Array The array of items for the given range
	 */
	public function loadTasks($open = true)
	{
		$this->logon();
		return $this->loadItems(array(), $open);
	}

	/**
	 * Obtains the task from the default folder based on the entryid
	 * @param Binary $entryid The entryid of the item to obtain
	 * @param Boolean $open True if the found item should be opened, otherwise the
	 * entryid's will be returned.
	 * @return Mixed The task with the given entryid
	 */
	public function getTask($entryid, $open = true)
	{
		$this->logon();
		$items = $this->getItems(Restriction::ResProperty(PR_ENTRYID, $entryid, RELOP_EQ), $open);
		return array_shift($items);
	}

	/**
	 * Obtains the task from the wastebasket folder based on the entryid
	 * @param Binary $entryid The entryid of the item to obtain
	 * @param Boolean $open True if the found item should be opened, otherwise the
	 * entryid's will be returned.
	 * @return Mixed The task with the given entryid
	 */
	public function getDeletedTask($entryid, $open = true)
	{
		$this->logon();
		$items = $this->getDeletedItems(Restriction::ResProperty(PR_ENTRYID, $entryid, RELOP_EQ), $open);
		return array_shift($items);
	}

	/**
	 * Obtain all tasks which are present in the wastebastet folder.
	 * @param Boolean $open True if the found item should be opened, otherwise the
	 * entryid's will be returned.
	 * @return Array list of items
	 */
	public function getAllDeletedTasks($open = true)
	{
		$this->logon();
		return $this->getDeletedItems(Restriction::ResContent(PR_MESSAGE_CLASS, 'IPM.Task', FL_SUBSTRING | FL_IGNORECASE), $open);
	}

	/**
	 * Obtain the properties for the task
	 * @param Array $items array of the MAPI_MESSAGES.
	 * @param Array $tags The list of property tags to fetch.
	 * @return Array returns array of props of all MAPI_MESSAGE items passed to the function.
	 */
	public function getTaskProps($items, $tags = array())
	{
		$this->logon();
		return $this->getItemProps($items, $tags);
	}
}

?>
