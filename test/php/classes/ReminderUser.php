<?php
require_once('IPMUser.php');

class ReminderUser extends IPMUser {

	/**
	 * Initialize the TestUser
	 */
	protected function initialize()
	{
		parent::initialize();

		$this->logon();

		$this->defaultListModule = 'reminderlistmodule';
		$this->defaultItemModule = 'reminderitemmodule';
	}

	/**
	 * Load all reminders from the server
	 * @return Array the reminders from the server
	 */
	public function loadReminders()
	{
		$this->logon();

		return $this->execute($this->defaultListModule, array(
			'list' => array(
			)
		));
	}

	/**
	 * Snooze a reminder for the given number of minutes
	 * @param Binary $entryId The entryid to snooze
	 * @param Number $time The number of minutes to snooze
	 * @return Array The server response
	 */
	public function snoozeReminder($entryId, $time)
	{
		$this->logon();

		return $this->execute($this->defaultItemModule, array(
			'delete' => array(
				'entryid' => bin2hex($entryId),
				'message_action' => array(
					'action_type' => 'snooze',
					'snoozeTime' => $time
				)
			)
		));
	}

	/**
	 * Dismiss a reminder
	 * @param Binary $entryId the entryid to snooze
	 * @return Array The server response
	 */
	public function dismissReminder($entryId)
	{
		$this->logon();

		return $this->execute($this->defaultItemModule, array(
			'delete' => array(
				'entryid' => bin2hex($entryId),
				'message_action' => array(
					'action_type' => 'dismiss'
				)
			)
		));
	}
}

?>
