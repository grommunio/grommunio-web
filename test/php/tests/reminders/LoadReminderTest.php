<?php
require_once('classes/KopanoUser.php');
require_once('classes/ReminderUser.php');
require_once('classes/CalendarUser.php');
require_once('classes/TaskUser.php');
require_once('classes/TestData.php');
require_once('classes/KopanoTest.php');

/**
 * LoadReminderTest
 *
 * Tests all possible cases for loading reminders
 */
class LoadReminderTest extends KopanoTest {
	/**
	 * The default user
	 */
	private $user;

	/**
	 * During setUp we create the user
	 */
	protected function setUp()
	{
		parent::setUp();

		$this->user = $this->addUser(new ReminderUser(new KopanoUser(KOPANO_USER1_NAME, KOPANO_USER1_PASSWORD)));

		$this->message = array(
			'props' => TestData::getMail(),
			'recipients' => array(
				'add' => array(
					TestData::getSMTPRecipient(KOPANO_USER2_DISPLAY_NAME, KOPANO_USER2_EMAIL_ADDRESS)
				)
			)
		);
	}

	/**
	 * Test loading reminders.
	 */
	public function testLoadReminders()
	{
		try {
			$response = $this->user->loadReminders();
		} catch(Exception $e) {
			$this->fail('Test that the reminders can be obtains: ' . $e->getMessage() . PHP_EOL . $e->getTraceAsString());
		}

		$this->assertArrayHasKey('list', $response, 'Test that the response has the \'list\' key');
		$this->assertArrayHasKey('item', $response['list'], 'Test that the response has the \'item\' array');
		$this->assertArrayHasKey('rowchecksum', $response['list'], 'Test that the response has the \'rowchecksum\' array');
	}

	/**
	 * Test loading appointment reminders
	 */
	public function xtestLoadAppointmentReminders()
	{
		// Set the appointment time, have the appointment start 10 seconds
		// in the future, and the reminder 5 seconds in the future.
		$start = mktime(date('H'), date('i'), date('s') + 10);
		$end = mktime(date('H'), date('i') + 39, date('s') + 10);
		$flag = mktime(date('H'), date('i'), date('s') + 0.8);

		$calendarUser = $this->addUser(new CalendarUser(new KopanoUser(KOPANO_USER1_NAME, KOPANO_USER1_PASSWORD)));
		$appointment = $calendarUser->saveAppointment(array(
			'props' => TestData::getAppointment(array(
				'startdate' => $start,
				'duedate' => $end,
				'commonstart' => $start,
				'commonend' => $end,
				'reminder' => true,
				'reminder_minutes' => 15,
				'reminder_time' => $start,
				'flagdueby' => $flag,
				'flag_due_by' => $flag
			))
		), false);

		// Wait for the reminder time.
		sleep(2);

		$response = $this->user->loadReminders();

		$this->assertArrayHasKey('list', $response, 'Test that the response has the \'list\' key');
		$this->assertArrayHasKey('item', $response['list'], 'Test that the response has the \'item\' array');
		$this->assertCount(1, $response['list']['item'], 'Test that only one reminder was returned');

		$item = $response['list']['item'][0];

		$this->assertEntryIdEquals($appointment['entryid'], $item['entryid'], 'Test that the correct entryid was found');
		$this->assertEntryIdEquals($appointment['parent_entryid'], $item['parent_entryid'], 'Test that the correct parent entryid was found');
		$this->assertStoreEntryIdEquals($appointment['store_entryid'], $item['store_entryid'], 'Test that the correct store entryid was found');
		$this->assertEquals('IPM.Appointment', $item['props']['message_class'], 'Test that the message_class is correct');
		$this->assertEquals(MAPI_MESSAGE, $item['props']['object_type'], 'Test that the object_type is correct');
	}

	/**
	 * Test if the Reminder can be snoozed without errors
	 */
	public function testSnoozeAppointmentReminders()
	{
		try {
			// Set the appointment time, have the appointment start 10 seconds
			// in the future, and the reminder 5 seconds in the future.
			$start = mktime(date('H'), date('i'), date('s') + 10);
			$end = mktime(date('H'), date('i') + 40, date('s') + 10);
			$flag = mktime(date('H'), date('i'), date('s') + 1);

			$calendarUser = $this->addUser(new CalendarUser(new KopanoUser(KOPANO_USER1_NAME, KOPANO_USER1_PASSWORD)));
			$appointment = $calendarUser->saveAppointment(array(
				'props' => TestData::getAppointment(array(
					'startdate' => $start,
					'duedate' => $end,
					'commonstart' => $start,
					'commonend' => $end,
					'reminder' => true,
					'reminder_minutes' => 15,
					'reminder_time' => $start,
					'flagdueby' => $flag
				))
			), false);

			// Wait for the reminder time.
			sleep(3);

			// Obtain the reminder
			$response = $this->user->loadReminders();
			$reminder = $response['list']['item'][0];

			// Snooze reminder for 1 minute
			$response = $this->user->snoozeReminder(hex2bin($reminder['entryid']), 1);
		} catch (Exception $e) {
			$this->fail('Test that the reminders can be snoozed: ' . $e->getMessage() . PHP_EOL . $e->getTraceAsString());
		}

		// Check if the response contains the success property
		$this->assertArrayHasKey('success', $response, 'Test that the response contains the \'success\' property');
	}

	/**
	 * Test that the Reminder can be snoozed
	 */
	public function testSnoozeAppointmentReminderResult()
	{
		// Set the appointment time, have the appointment start 10 seconds
		// in the future, and the reminder 5 seconds in the future.
		$start = mktime(date('H'), date('i'), date('s') + 10);
		$end = mktime(date('H'), date('i') + 40, date('s') + 10);
		$flag = mktime(date('H'), date('i'), date('s') + 1);

		$calendarUser = $this->addUser(new CalendarUser(new KopanoUser(KOPANO_USER1_NAME, KOPANO_USER1_PASSWORD)));
		$appointment = $calendarUser->saveAppointment(array(
			'props' => TestData::getAppointment(array(
				'startdate' => $start,
				'duedate' => $end,
				'commonstart' => $start,
				'commonend' => $end,
				'reminder' => true,
				'reminder_minutes' => 15,
				'reminder_time' => $start,
				'flagdueby' => $flag
			))
		), false);

		// Wait for the reminder time.
		sleep(2);

		// Obtain the reminder
		$response = $this->user->loadReminders();
		$reminder = $response['list']['item'][0];

		// Snooze reminder for 1 seconds
		$response = $this->user->snoozeReminder(hex2bin($reminder['entryid']), 0.014);

		// Check that there are no reminders
		$response = $this->user->loadReminders();
		$this->assertArrayHasKey('list', $response, 'Test that the response has the \'list\' key');
		$this->assertArrayHasKey('item', $response['list'], 'Test that the response has the \'item\' array');
		$this->assertEmpty($response['list']['item'], 'Test that no reminders were returned');

		// Wait until the snooze period has been exceeded
		sleep(1);

		// Check that we have a reminder again
		$response = $this->user->loadReminders();

		$this->assertArrayHasKey('list', $response, 'Test that the response has the \'list\' key');
		$this->assertArrayHasKey('item', $response['list'], 'Test that the response has the \'item\' array');
		$this->assertCount(1, $response['list']['item'], 'Test that only one reminder was returned');

		$item = $response['list']['item'][0];

		$this->assertEntryIdEquals($appointment['entryid'], $item['entryid'], 'Test that the correct entryid was found');
		$this->assertEntryIdEquals($appointment['parent_entryid'], $item['parent_entryid'], 'Test that the correct parent entryid was found');
		$this->assertStoreEntryIdEquals($appointment['store_entryid'], $item['store_entryid'], 'Test that the correct store entryid was found');
		$this->assertEquals('IPM.Appointment', $item['props']['message_class'], 'Test that the message_class is correct');
		$this->assertEquals(MAPI_MESSAGE, $item['props']['object_type'], 'Test that the object_type is correct');
	}

	/**
	 * Test if the Reminder can be snoozed without errors
	 */
	public function testDismissAppointmentReminders()
	{
		try {
			// Set the appointment time, have the appointment start 10 seconds
			// in the future, and the reminder 5 seconds in the future.
			$start = mktime(date('H'), date('i'), date('s') + 10);
			$end = mktime(date('H'), date('i') + 40, date('s') + 10);
			$flag = mktime(date('H'), date('i'), date('s') + 1);

			$calendarUser = $this->addUser(new CalendarUser(new KopanoUser(KOPANO_USER1_NAME, KOPANO_USER1_PASSWORD)));
			$appointment = $calendarUser->saveAppointment(array(
				'props' => TestData::getAppointment(array(
					'startdate' => $start,
					'duedate' => $end,
					'commonstart' => $start,
					'commonend' => $end,
					'reminder' => true,
					'reminder_minutes' => 15,
					'reminder_time' => $start,
					'flagdueby' => $flag
				))
			), false);

			// Wait for the reminder time.
			sleep(2);

			// Obtain the reminder
			$response = $this->user->loadReminders();
			$reminder = $response['list']['item'][0];

			// Dismiss reminder
			$response = $this->user->dismissReminder(hex2bin($reminder['entryid']));
		} catch (Exception $e) {
			$this->fail('Test that the reminders can be snoozed: ' . $e->getMessage() . PHP_EOL . $e->getTraceAsString());
		}

		// Check if the response contains the success property
		$this->assertArrayHasKey('success', $response, 'Test that the response contains the \'success\' property');
	}

	/**
	 * Test that the Reminder can be dismisses
	 */
	public function testDismissAppointmentReminderResult()
	{
		// Set the appointment time, have the appointment start 10 seconds
		// in the future, and the reminder 5 seconds in the future.
		$start = mktime(date('H'), date('i'), date('s') + 10);
		$end = mktime(date('H'), date('i') + 40, date('s') + 10);
		$flag = mktime(date('H'), date('i'), date('s') + 1);

		$calendarUser = $this->addUser(new CalendarUser(new KopanoUser(KOPANO_USER1_NAME, KOPANO_USER1_PASSWORD)));
		$appointment = $calendarUser->saveAppointment(array(
			'props' => TestData::getAppointment(array(
				'startdate' => $start,
				'duedate' => $end,
				'commonstart' => $start,
				'commonend' => $end,
				'reminder' => true,
				'reminder_minutes' => 15,
				'reminder_time' => $start,
				'flagdueby' => $flag
			))
		), false);

		// Wait for the reminder time.
		sleep(2);

		// Obtain the reminder
		$response = $this->user->loadReminders();
		$reminder = $response['list']['item'][0];

		// Dismiss reminder
		$response = $this->user->dismissReminder(hex2bin($reminder['entryid']));

		// Check that there are no reminders
		$response = $this->user->loadReminders();
		$this->assertArrayHasKey('list', $response, 'Test that the response has the \'list\' key');
		$this->assertArrayHasKey('item', $response['list'], 'Test that the response has the \'item\' array');
		$this->assertEmpty($response['list']['item'], 'Test that no reminders were returned');

		// Wait a while
		sleep(4);

		// Check that we still haven't a reminder
		$response = $this->user->loadReminders();
		$this->assertArrayHasKey('list', $response, 'Test that the response has the \'list\' key');
		$this->assertArrayHasKey('item', $response['list'], 'Test that the response has the \'item\' array');
		$this->assertEmpty($response['list']['item'], 'Test that no reminders were returned');
	}

	/**
	 * Test loading task reminders
	 */
	public function testLoadTaskReminders()
	{
		// Set the flag time 5 seconds in the future
		$flag = mktime(date('H'), date('i'), date('s') + 1);

		$taskUser = $this->addUser(new TaskUser(new KopanoUser(KOPANO_USER1_NAME, KOPANO_USER1_PASSWORD)));
		$task = $taskUser->saveTask(array(
			'props' => TestData::getTask(array(
				'reminder' => true,
				'reminder_time' => $flag,
				'flagdueby' => $flag,
				'flag_due_by' => $flag
			))
		), false);

		// Wait for the reminder time.
		sleep(2);

		$response = $this->user->loadReminders();

		$this->assertArrayHasKey('list', $response, 'Test that the response has the \'list\' key');
		$this->assertArrayHasKey('item', $response['list'], 'Test that the response has the \'item\' array');
		$this->assertCount(1, $response['list']['item'], 'Test that only one reminder was returned');

		$item = $response['list']['item'][0];

		$this->assertEntryIdEquals($task['entryid'], $item['entryid'], 'Test that the correct entryid was found');
		$this->assertEntryIdEquals($task['parent_entryid'], $item['parent_entryid'], 'Test that the correct parent entryid was found');
		$this->assertStoreEntryIdEquals($task['store_entryid'], $item['store_entryid'], 'Test that the correct store entryid was found');
		$this->assertEquals('IPM.Task', $item['props']['message_class'], 'Test that the message_class is correct');
		$this->assertEquals(MAPI_MESSAGE, $item['props']['object_type'], 'Test that the object_type is correct');
	}

	/**
	 * Test if the Reminder can be snoozed without errors
	 */
	public function testSnoozeTaskReminders()
	{
		try {
			// Set the flag time 5 seconds in the future
			$flag = mktime(date('H'), date('i'), date('s') + 1);

			$taskUser = $this->addUser(new TaskUser(new KopanoUser(KOPANO_USER1_NAME, KOPANO_USER1_PASSWORD)));
			$taskUser->saveTask(array(
				'props' => TestData::getTask(array(
					'reminder' => true,
					'reminder_time' => $flag,
					'flagdueby' => $flag,
					'flag_due_by' => $flag
				))
			), false);

			// Wait for the reminder time.
			sleep(2);

			// Obtain the reminder
			$response = $this->user->loadReminders();
			$reminder = $response['list']['item'][0];

			// Snooze reminder for 1 minute
			$response = $this->user->snoozeReminder(hex2bin($reminder['entryid']), 1);
		} catch (Exception $e) {
			$this->fail('Test that the reminders can be snoozed: ' . $e->getMessage() . PHP_EOL . $e->getTraceAsString());
		}

		// Check if the response contains the success property
		$this->assertArrayHasKey('success', $response, 'Test that the response contains the \'success\' property');
	}

	/**
	 * Test that the Reminder can be snoozed
	 */
	public function testSnoozeTaskReminderResult()
	{
		// Set the flag time 1 seconds in the future
		$flag = mktime(date('H'), date('i'), date('s') + 1);

		$taskUser = $this->addUser(new TaskUser(new KopanoUser(KOPANO_USER1_NAME, KOPANO_USER1_PASSWORD)));
		$task = $taskUser->saveTask(array(
			'props' => TestData::getTask(array(
				'reminder' => true,
				'reminder_time' => $flag,
				'flagdueby' => $flag,
				'flag_due_by' => $flag
			))
		), false);

		// Wait for the reminder time.
		sleep(2);

		// Obtain the reminder
		$response = $this->user->loadReminders();
		$reminder = $response['list']['item'][0];

		// Snooze reminder for 1 seconds
		$response = $this->user->snoozeReminder(hex2bin($reminder['entryid']), 0.014);

		// Check that there are no reminders
		$response = $this->user->loadReminders();
		$this->assertArrayHasKey('list', $response, 'Test that the response has the \'list\' key');
		$this->assertArrayHasKey('item', $response['list'], 'Test that the response has the \'item\' array');
		$this->assertEmpty($response['list']['item'], 'Test that no reminders were returned');

		// Wait until the snooze period has been exceeded
		sleep(1);

		// Check that we have a reminder again
		$response = $this->user->loadReminders();

		$this->assertArrayHasKey('list', $response, 'Test that the response has the \'list\' key');
		$this->assertArrayHasKey('item', $response['list'], 'Test that the response has the \'item\' array');
		$this->assertCount(1, $response['list']['item'], 'Test that only one reminder was returned');

		$item = $response['list']['item'][0];

		$this->assertEntryIdEquals($task['entryid'], $item['entryid'], 'Test that the correct entryid was found');
		$this->assertEntryIdEquals($task['parent_entryid'], $item['parent_entryid'], 'Test that the correct parent entryid was found');
		$this->assertStoreEntryIdEquals($task['store_entryid'], $item['store_entryid'], 'Test that the correct store entryid was found');
		$this->assertEquals('IPM.Task', $item['props']['message_class'], 'Test that the message_class is correct');
		$this->assertEquals(MAPI_MESSAGE, $item['props']['object_type'], 'Test that the object_type is correct');
	}

	/**
	 * Test if the Reminder can be snoozed without errors
	 */
	public function testDismissTaskReminders()
	{
		try {
			// Set the flag time 2 seconds in the future
			$flag = mktime(date('H'), date('i'), date('s') + 1);

			$taskUser = $this->addUser(new TaskUser(new KopanoUser(KOPANO_USER1_NAME, KOPANO_USER1_PASSWORD)));
			$taskUser->saveTask(array(
				'props' => TestData::getTask(array(
					'reminder' => true,
					'reminder_time' => $flag,
					'flagdueby' => $flag,
					'flag_due_by' => $flag
				))
			), false);

			// Wait for the reminder time.
			sleep(2);

			// Obtain the reminder
			$response = $this->user->loadReminders();
			$reminder = $response['list']['item'][0];

			// Dismiss reminder
			$response = $this->user->dismissReminder(hex2bin($reminder['entryid']));
		} catch (Exception $e) {
			$this->fail('Test that the reminders can be snoozed: ' . $e->getMessage() . PHP_EOL . $e->getTraceAsString());
		}

		// Check if the response contains the success property
		$this->assertArrayHasKey('success', $response, 'Test that the response contains the \'success\' property');
	}

	/**
	 * Test that the Reminder can be dismisses
	 */
	public function testDismissTaskReminderResult()
	{
		// Set the flag time 5 seconds in the future
		$flag = mktime(date('H'), date('i'), date('s') + 1);

		$taskUser = $this->addUser(new TaskUser(new KopanoUser(KOPANO_USER1_NAME, KOPANO_USER1_PASSWORD)));
		$taskUser->saveTask(array(
			'props' => TestData::getTask(array(
				'reminder' => true,
				'reminder_time' => $flag,
				'flagdueby' => $flag,
				'flag_due_by' => $flag
			))
		), false);

		// Wait for the reminder time.
		sleep(2);

		// Obtain the reminder
		$response = $this->user->loadReminders();
		$reminder = $response['list']['item'][0];

		// Dismiss reminder
		$response = $this->user->dismissReminder(hex2bin($reminder['entryid']));

		// Check that there are no reminders
		$response = $this->user->loadReminders();
		$this->assertArrayHasKey('list', $response, 'Test that the response has the \'list\' key');
		$this->assertArrayHasKey('item', $response['list'], 'Test that the response has the \'item\' array');
		$this->assertEmpty($response['list']['item'], 'Test that no reminders were returned');

		// Wait a while
		sleep(4);

		// Check that we still haven't a reminder
		$response = $this->user->loadReminders();
		$this->assertArrayHasKey('list', $response, 'Test that the response has the \'list\' key');
		$this->assertArrayHasKey('item', $response['list'], 'Test that the response has the \'item\' array');
		$this->assertEmpty($response['list']['item'], 'Test that no reminders were returned');
	}
}
?>
