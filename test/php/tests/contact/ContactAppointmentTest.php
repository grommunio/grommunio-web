<?php
require_once('classes/KopanoUser.php');
require_once('classes/ContactUser.php');
require_once('classes/CalendarUser.php');
require_once('classes/TestData.php');
require_once('classes/KopanoTest.php');

/**
 * ContactAppointmentTest
 *
 * Tests functionality of creating appointments on birthday and anniversary properties in contacts.
 */
class ContactAppointmentTest extends KopanoTest {
	/**
	 * The default user
	 */
	private $user;

	/**
	 * The message which will be handled
	 */
	private $message;

	/**
	 * Array of named properties for user which can be present on Contacts.
	 */
	private $userTags;

	/**
	 * During setUp we create the user
	 */
	protected function setUp()
	{
		parent::setUp();

		$this->user = $this->addUser(new ContactUser(new KopanoUser(KOPANO_USER1_NAME, KOPANO_USER1_PASSWORD)));
		$this->calendarUser = $this->addUser(new CalendarUser(new KopanoUser(KOPANO_USER1_NAME, KOPANO_USER1_PASSWORD)));

		$this->userTags = $this->user->getContactPropTags();

		$this->message = array(
			'props' => TestData::getContact(),
		);
	}

	/**
	 * Test if appointments are created for birthday and anniversary
	 */
	public function testContactAppointments()
	{
		try {
			$savedContact = $this->user->saveContact($this->message);

			$props = $this->user->getContactProps($savedContact, array($this->userTags['birthday_eventid'], $this->userTags['anniversary_eventid']));
		} catch (Exception $e) {
			$this->fail('Test that the Appointment for birthday/anniversary is created for Contact: ' . $e->getMessage() . PHP_EOL . $e->getTraceAsString());
		}

		// Check if appointment for birthday and anniversary is created
		$this->assertNotEmpty($props[$this->userTags['birthday_eventid']], 'Test that the \'birthday_eventid\' exists in the contact');
		$this->assertNotEmpty($props[$this->userTags['anniversary_eventid']], 'Test that the \'anniversary_eventid\' exists in the contact');
	}

	/**
	 * Test if appointments can be loaded in calendar
	 */
	public function testContactAppointmentsInCalendar()
	{
		try {
			$savedContact = $this->user->saveContact($this->message);

			$appointments = $this->calendarUser->loadAppointments();
		} catch (Exception $e) {
			$this->fail('Test that the Appointment for birthday/anniversary can be loaded in the Calendar: ' . $e->getMessage() . PHP_EOL . $e->getTraceAsString());
		}

		$this->assertCount(2, $appointments, 'Test that exactly two appointments are created for contact');
	}

	/**
	 * Test if birthday appointment can be opened from calendar
	 */
	public function testOpeningContactBirthdayAppointment()
	{
		try {
			$savedContact = $this->user->saveContact($this->message);

			$props = $this->user->getContactProps($savedContact, array($this->userTags['birthday_eventid']));

			$birthdayAppointment = $this->calendarUser->openAppointment($props[$this->userTags['birthday_eventid']]);
		} catch (Exception $e) {
			$this->fail('Test that the Appointment for birthday can be opened: ' . $e->getMessage() . PHP_EOL . $e->getTraceAsString());
		}

		$this->assertArrayHasKey('item', $birthdayAppointment, 'Test that the birthday Appointment returns an \'item\' array');
		$this->assertArrayHasKey('item', $birthdayAppointment['item'], 'Test that the \'item\' array contains items');
		$this->assertArrayHasKey('props', $birthdayAppointment['item']['item'], 'Test that the item contains properties');
	}

	/**
	 * Test if anniversary appointment can be opened from calendar
	 */
	public function testOpeningContactAnniversaryAppointment()
	{
		try {
			$savedContact = $this->user->saveContact($this->message);

			$props = $this->user->getContactProps($savedContact, array($this->userTags['anniversary_eventid']));

			$anniversaryAppointment = $this->calendarUser->openAppointment($props[$this->userTags['anniversary_eventid']]);
		} catch (Exception $e) {
			$this->fail('Test that the Appointment for anniversary can be opened: ' . $e->getMessage() . PHP_EOL . $e->getTraceAsString());
		}

		$this->assertArrayHasKey('item', $anniversaryAppointment, 'Test that the birthday Appointment returns an \'item\' array');
		$this->assertArrayHasKey('item', $anniversaryAppointment['item'], 'Test that the \'item\' array contains items');
		$this->assertArrayHasKey('props', $anniversaryAppointment['item']['item'], 'Test that the item contains properties');
	}

	/**
	 * Test if properties are properly generated for birthday appointment
	 */
	public function testContactBirthdayAppointmentProps()
	{
		try {
			$savedContact = $this->user->saveContact($this->message);

			$contactProps = $this->user->getContactProps($savedContact, array($this->userTags['birthday_eventid'], $this->userTags['birthday']));

			$birthdayAppointment = $this->calendarUser->openAppointment($contactProps[$this->userTags['birthday_eventid']]);

			$props = $birthdayAppointment['item']['item']['props'];
		} catch (Exception $e) {
			$this->fail('Test thatg the Appointment for birthday can be opened: ' . $e->getMessage() . PHP_EOL . $e->getTraceAsString());
		}

		$startDateUTC = $contactProps[$this->userTags['birthday']];
		$dueDateUTC = $startDateUTC + (24 * 60 * 60);

		$this->assertEquals($this->message['props']['subject'] . '\'s Birthday', $props['subject'], 'Test that \'subject\' is correctly saved in appointment');
		$this->assertEquals('IPM.Appointment', $props['message_class'], 'Test that \'message_class\' is correctly saved in appointment');
		$this->assertEquals(fbFree, $props['busystatus'], 'Test that \'busystatus\' is correctly saved in appointment');
		$this->assertEquals(true, $props['alldayevent'], 'Test that \'alldayevent\' is correctly saved in appointment');
		$this->assertEquals(1440, $props['duration'], 'Test that \'duration\' is correctly saved in appointment');
		$this->assertEquals($startDateUTC, $props['startdate'], 'Test that \'startdate\' is correctly saved in appointment');
		$this->assertEquals($dueDateUTC, $props['duedate'], 'Test that \'duedate\' is correctly saved in appointment');

		$this->assertEquals($startDateUTC, $props['commonstart'], 'Test that \'commonstart\' is correctly saved in appointment');
		$this->assertEquals($dueDateUTC, $props['commonend'], 'Test that \'commonend\' is correctly saved in appointment');

		// recurring properties
		$this->assertEquals(true, $props['recurring'], 'Test that \'recurring\' is correctly saved in appointment');
		$this->assertEquals(12, $props['everyn'], 'Test that \'everyn\' is correctly saved in appointment');
		$this->assertEquals(13, $props['type'], 'Test that \'type\' is correctly saved in appointment');
		$this->assertEquals(2, $props['subtype'], 'Test that \'subtype\' is correctly saved in appointment');
		$this->assertEquals(date('j', $startDateUTC), $props['monthday'], 'Test that \'monthday\' is correctly saved in appointment');

		// reminder properties
		$this->assertEquals(true, $props['reminder'], 'Test that \'reminder\' is correctly saved in appointment');
		$this->assertEquals(1080, $props['reminder_minutes'], 'Test that \'reminder_minutes\' is correctly saved in appointment');
		$this->assertEquals($startDateUTC, $props['reminder_time'], 'Test that \'reminder_time\' is correctly saved in appointment');
		$this->assertEquals($startDateUTC - ($props['reminder_minutes'] * 60), $props['flagdueby'], 'Test that \'flagdueby\' is correctly saved in appointment');
	}

	/**
	 * Test if properties are properly generated for anniversary appointment
	 */
	public function testContactAnniversaryAppointmentProps()
	{
		try {
			$savedContact = $this->user->saveContact($this->message);

			$contactProps = $this->user->getContactProps($savedContact, array($this->userTags['anniversary_eventid'], $this->userTags['wedding_anniversary']));

			$anniversaryAppointment = $this->calendarUser->openAppointment($contactProps[$this->userTags['anniversary_eventid']]);

			$props = $anniversaryAppointment['item']['item']['props'];
		} catch (Exception $e) {
			$this->fail('Test thatg the Appointment for anniversary can be opened: ' . $e->getMessage() . PHP_EOL . $e->getTraceAsString());
		}

		$startDateUTC = $contactProps[$this->userTags['wedding_anniversary']];
		$dueDateUTC = $startDateUTC + (24 * 60 * 60);

		$this->assertEquals($this->message['props']['subject'] . '\'s Anniversary', $props['subject'], 'Test that \'subject\' is correctly saved in appointment');
		$this->assertEquals('IPM.Appointment', $props['message_class'], 'Test that \'message_class\' is correctly saved in appointment');
		$this->assertEquals(fbFree, $props['busystatus'], 'Test that \'busystatus\' is correctly saved in appointment');
		$this->assertEquals(true, $props['alldayevent'], 'Test that \'alldayevent\' is correctly saved in appointment');
		$this->assertEquals(1440, $props['duration'], 'Test that \'duration\' is correctly saved in appointment');
		$this->assertEquals($startDateUTC, $props['startdate'], 'Test that \'startdate\' is correctly saved in appointment');
		$this->assertEquals($dueDateUTC, $props['duedate'], 'Test that \'duedate\' is correctly saved in appointment');

		$this->assertEquals($startDateUTC, $props['commonstart'], 'Test that \'commonstart\' is correctly saved in appointment');
		$this->assertEquals($dueDateUTC, $props['commonend'], 'Test that \'commonend\' is correctly saved in appointment');

		// recurring properties
		$this->assertEquals(true, $props['recurring'], 'Test that \'recurring\' is correctly saved in appointment');
		$this->assertEquals(12, $props['everyn'], 'Test that \'everyn\' is correctly saved in appointment');
		$this->assertEquals(13, $props['type'], 'Test that \'type\' is correctly saved in appointment');
		$this->assertEquals(2, $props['subtype'], 'Test that \'subtype\' is correctly saved in appointment');
		$this->assertEquals(date('j', $startDateUTC), $props['monthday'], 'Test that \'monthday\' is correctly saved in appointment');

		// reminder properties
		$this->assertEquals(true, $props['reminder'], 'Test that \'reminder\' is correctly saved in appointment');
		$this->assertEquals(1080, $props['reminder_minutes'], 'Test that \'reminder_minutes\' is correctly saved in appointment');
		$this->assertEquals($startDateUTC, $props['reminder_time'], 'Test that \'reminder_time\' is correctly saved in appointment');
		$this->assertEquals($startDateUTC - ($props['reminder_minutes'] * 60), $props['flagdueby'], 'Test that \'flagdueby\' is correctly saved in appointment');
	}

	/**
	 * Test if appointment is not duplicated in calendar after updating same contact
	 */
	public function testContactAppointmentsNotDuplicated()
	{
		try {
			unset($this->message['props']['wedding_anniversary']);

			$savedContact = $this->user->saveContact($this->message);

			$props = $this->user->getContactProps($savedContact, array(PR_ENTRYID, $this->userTags['birthday_eventid']));

			// update birthday time
			$this->message['entryid'] = bin2hex($props[PR_ENTRYID]);
			$this->message['props']['birthday'] = mktime(0, 0, 0, date('n') + 3);
			$this->message['props']['birthday_eventid'] = bin2hex($props[$this->userTags['birthday_eventid']]);

			$savedContact = $this->user->saveContact($this->message);

			$appointments = $this->calendarUser->loadAppointments();
		} catch (Exception $e) {
			$this->fail('Test that the Appointment is updated in Calendar after updating birthday in Contact: ' . $e->getMessage() . PHP_EOL . $e->getTraceAsString());
		}

		// Test that appointment is not duplicated
		$this->assertCount(1, $appointments, 'Test that exactly one appointment is created for contact');
	}

	/**
	 * Test if appointment is updated in calendar after updating birthday in contact
	 * For this test the birthday is placed in the Winter time
	 */
	public function testContactUpdateAppointment()
	{
		try {
			$savedContact = $this->user->saveContact($this->message);

			$props = $this->user->getContactProps($savedContact, array(PR_ENTRYID, $this->userTags['birthday_eventid']));

			// update birthday time
			$this->message['entryid'] = bin2hex($props[PR_ENTRYID]);
			$this->message['props']['birthday'] = mktime(0, 0, 0, 1); // Ensure the new date is in the winter
			$this->message['props']['birthday_eventid'] = bin2hex($props[$this->userTags['birthday_eventid']]);

			$savedContact = $this->user->saveContact($this->message);

			$contactProps = $this->user->getContactProps($savedContact, array($this->userTags['birthday_eventid'], $this->userTags['birthday']));

			$birthdayAppointment = $this->calendarUser->openAppointment($contactProps[$this->userTags['birthday_eventid']]);

			$props = $birthdayAppointment['item']['item']['props'];
		} catch (Exception $e) {
			$this->fail('Test that the Appointment is updated in Calendar after updating birthday in Contact: ' . $e->getMessage() . PHP_EOL . $e->getTraceAsString());
		}

		$startDateUTC = $contactProps[$this->userTags['birthday']];
		$dueDateUTC = $startDateUTC + (24 * 60 * 60);

		// Test that appointment is updated in calendar
		$this->assertEquals($startDateUTC, $props['startdate'], 'Test that \'startdate\' is correctly saved in appointment');
		$this->assertEquals($dueDateUTC, $props['duedate'], 'Test that \'duedate\' is correctly saved in appointment');

		// recurring properties
		$this->assertEquals(date('j', $startDateUTC), $props['monthday'], 'Test that \'monthday\' is correctly saved in appointment');

		// reminder properties
		$this->assertEquals($startDateUTC, $props['reminder_time'], 'Test that \'reminder_time\' is correctly saved in appointment');
	}

	/**
	 * Test if appointment is updated in calendar after updating birthday in contact
	 * For this test the birthday is placed in the Summer time
	 */
	public function testContactUpdateAppointmentDST()
	{
		try {
			$savedContact = $this->user->saveContact($this->message);

			$props = $this->user->getContactProps($savedContact, array(PR_ENTRYID, $this->userTags['birthday_eventid']));

			// update birthday time
			$this->message['entryid'] = bin2hex($props[PR_ENTRYID]);
			$this->message['props']['birthday'] = mktime(0, 0, 0, 6); // Ensure the new date is in the summer
			$this->message['props']['birthday_eventid'] = bin2hex($props[$this->userTags['birthday_eventid']]);

			$savedContact = $this->user->saveContact($this->message);

			$contactProps = $this->user->getContactProps($savedContact, array($this->userTags['birthday_eventid'], $this->userTags['birthday']));

			$birthdayAppointment = $this->calendarUser->openAppointment($contactProps[$this->userTags['birthday_eventid']]);

			$props = $birthdayAppointment['item']['item']['props'];
		} catch (Exception $e) {
			$this->fail('Test that the Appointment is updated in Calendar after updating birthday in Contact: ' . $e->getMessage() . PHP_EOL . $e->getTraceAsString());
		}

		$startDateUTC = $contactProps[$this->userTags['birthday']];
		$dueDateUTC = $startDateUTC + (24 * 60 * 60);

		// Test that appointment is updated in calendar
		$this->assertEquals($startDateUTC, $props['startdate'], 'Test that \'startdate\' is correctly saved in appointment');
		$this->assertEquals($dueDateUTC, $props['duedate'], 'Test that \'duedate\' is correctly saved in appointment');

		// recurring properties
		$this->assertEquals(date('j', $startDateUTC), $props['monthday'], 'Test that \'monthday\' is correctly saved in appointment');

		// reminder properties
		$this->assertEquals($startDateUTC, $props['reminder_time'], 'Test that \'reminder_time\' is correctly saved in appointment');
	}

	/**
	 * Test if appointment is created if the appointment is deleted for the birthday of contact
	 */
	public function testContactUpdateDeletedAppointment()
	{
		try {
			$savedContact = $this->user->saveContact($this->message);

			$props = $this->user->getContactProps($savedContact, array(PR_ENTRYID, $this->userTags['birthday_eventid']));

			// delete the appointment
			$this->calendarUser->deleteAppointment($props[$this->userTags['birthday_eventid']]);

			// update birthday time
			$this->message['entryid'] = bin2hex($props[PR_ENTRYID]);
			$this->message['props']['birthday'] = mktime(0, 0, 0, date('n') + 3);
			$this->message['props']['birthday_eventid'] = bin2hex($props[$this->userTags['birthday_eventid']]);

			$savedContact = $this->user->saveContact($this->message);

			// get the new entryid of appointment
			$props = $this->user->getContactProps($savedContact, array($this->userTags['birthday_eventid']));

			$foundAppointment = $this->calendarUser->getAppointment($props[$this->userTags['birthday_eventid']]);
		} catch (Exception $e) {
			$this->fail('Test that the Appointment is updated in Calendar after updating birthday in Contact: ' . $e->getMessage() . PHP_EOL . $e->getTraceAsString());
		}

		$this->assertInternalType(PHPUnit_Framework_Constraint_IsType::TYPE_RESOURCE, $foundAppointment, 'Test that the found Appointment is a resource');
	}

	/**
	 * Test if appointment is deleted if birthday/anniversary date is removed from contact
	 */
	public function testContactDeleteAppointmentByRemovingProperty()
	{
		try {
			$savedContact = $this->user->saveContact($this->message);

			$props = $this->user->getContactProps($savedContact, array(PR_ENTRYID, $this->userTags['birthday_eventid'], $this->userTags['anniversary_eventid']));

			// remove birthday/anniversary date
			$this->message['entryid'] = bin2hex($props[PR_ENTRYID]);
			$this->message['props']['birthday'] = null;
			$this->message['props']['wedding_anniversary'] = null;
			$this->message['props']['birthday_eventid'] = bin2hex($props[$this->userTags['birthday_eventid']]);
			$this->message['props']['anniversary_eventid'] = bin2hex($props[$this->userTags['anniversary_eventid']]);

			$savedContact = $this->user->saveContact($this->message);

			$props = $this->user->getContactProps($savedContact, array(PR_ENTRYID, $this->userTags['birthday_eventid'], $this->userTags['anniversary_eventid']));

			$appointments = $this->calendarUser->loadAppointments();
		} catch (Exception $e) {
			$this->fail('Test that the Appointment is updated in Calendar after updating birthday in Contact: ' . $e->getMessage() . PHP_EOL . $e->getTraceAsString());
		}

		$this->assertArrayNotHasKey($this->userTags['birthday_eventid'], $props, 'Test that appointment for birthday is deleted');
		$this->assertArrayNotHasKey($this->userTags['anniversary_eventid'], $props, 'Test that appointment for wedding anniversary is deleted');

		$this->assertCount(0, $appointments, 'Test that there are no appointments in the calendar');
	}

	/**
	 * Test if appointment is deleted when contact is deleted
	 */
	public function testContactDeleteAppointment()
	{
		try {
			$savedContact = $this->user->saveContact($this->message, false);

			// delete contact
			$this->user->deleteContact(hex2bin($savedContact['entryid']));

			$appointments = $this->calendarUser->loadAppointments();
		} catch (Exception $e) {
			$this->fail('Test that the Appointment is updated in Calendar after updating birthday in Contact: ' . $e->getMessage() . PHP_EOL . $e->getTraceAsString());
		}

		$this->assertCount(0, $appointments, 'Test that there are no appointments in the calendar');
	}
}
?>
