<?php
require_once('classes/KopanoUser.php');
require_once('classes/CalendarUser.php');
require_once('classes/TestData.php');
require_once('classes/KopanoTest.php');

/**
 * RecurringAppointmentTest
 *
 * Tests all possible cases for creating and opening recurring appointments.
 */
class RecurringAppointmentTest extends KopanoTest {
	/**
	 * The default user which is creating the appointments
	 */
	private $user;

	/**
	 * The default settings for the appointment
	 */
	private $appointment;

	/**
	 * The date from where we start collecting the occurrences in the calendar.
	 */
	private $countStart;

	/**
	 * The end date where we stop collecting the occurrences in the calendar.
	 */
	private $countEnd;

	/**
	 * During setup we are going to create the $user which will create the appointments.
	 */
	protected function setUp()
	{
		parent::setUp();

		$this->user = $this->addUser(new CalendarUser(new KopanoUser(KOPANO_USER1_NAME, KOPANO_USER1_PASSWORD)));

		$this->appointment = array(
			'props' => TestData::getAppointment()
		);

		// Extend the appointment with recurring information.
		// By default we will recur for 5 years.
		$this->appointment['props'] = array_merge(
			$this->appointment['props'],
			array(
				'recurring' => true,
				'recurring_reset' => true,
				'startdate' => gmmktime(14, 30, 0, 8, 17, 2011),
				'commonstart' => gmmktime(14, 30, 0, 8, 17, 2011),
				'duedate' => gmmktime(15, 0, 0, 8, 17, 2011),
				'commonend' => gmmktime(15, 0, 0, 8, 17, 2011),
				'start' => gmmktime(2, 0, 0, 8, 17, 2011),
				'startocc' => 870,
				'end' => gmmktime(2, 0, 0, 8, 17, 2016),
				'endocc' => 900
			)	
		);

		$this->countStart = gmmktime(0, 0, 0, 8, 1, 2011);
		$this->countEnd = gmmktime(0, 0, 0, 8, 1, 2025);
	}

	/**
	 * Test if it is possible to create daily recurring appointments, and if after saving, the series
	 * indicates the correct recurrence properties. The $providerDailyRecurringAppointment will generate
	 * all the various daily recurring options which will be used to create the appointments.
	 * @dataProvider providerDailyRecurringAppointment
	 */
	public function testDailyRecurringAppointment($props, $expectedCount)
	{
		try {
			$this->appointment['props'] = array_merge($this->appointment['props'], $props);
			$appointment = $this->user->saveAppointment($this->appointment);
		} catch (Exception $e) {
			$this->fail('Test that the Recurring Appointment can be saved: ' . $e->getMessage() . PHP_EOL . $e->getTraceAsString());
		}

		$this->assertInternalType(PHPUnit_Framework_Constraint_IsType::TYPE_RESOURCE, $appointment, 'Test that the created appointment is a resource');

		$recurrence = new Recurrence($this->user->getDefaultMessageStore(), $appointment);
		$pattern = $recurrence->getRecurrence();

		$this->assertNotNull($pattern);

		foreach($props as $key => $value) {
			$this->assertEquals($props[$key], $pattern[$key], 'Test that the property \''. $key .'\' is correctly saved');
		}

		$items = $recurrence->getItems($this->countStart, $this->countEnd);
		$this->assertCount($expectedCount, $items, 'Test that the expected number of occurrences is found');
		$items = $this->user->loadAppointments(array(
			'restriction' => array(
				'startdate' => $this->countStart,
				'duedate' => $this->countEnd
			)
		));
		$this->assertCount($expectedCount, $items, 'Test that the expected number of appointments is found');
	}

	/**
	 * Test if it is possible to create weekly recurring appointments, and if after saving, the series
	 * indicates the correct recurrence properties. The $providerWeeklyRecurringAppointment will generate
	 * all the various daily recurring options which will be used to create the appointments.
	 * @dataProvider providerWeeklyRecurringAppointment
	 */
	public function testWeeklyRecurringAppointment($props, $expectedCount)
	{
		try {
			$this->appointment['props'] = array_merge($this->appointment['props'], $props);
			$appointment = $this->user->saveAppointment($this->appointment);
		} catch (Exception $e) {
			$this->fail('Test that the Recurring Appointment can be saved: ' . $e->getMessage() . PHP_EOL . $e->getTraceAsString());
		}

		$this->assertInternalType(PHPUnit_Framework_Constraint_IsType::TYPE_RESOURCE, $appointment, 'Test that the created appointment is a resource');

		$recurrence = new Recurrence($this->user->getDefaultMessageStore(), $appointment);
		$pattern = $recurrence->getRecurrence();

		$this->assertNotNull($pattern);

		foreach($props as $key => $value) {
			$this->assertEquals($props[$key], $pattern[$key], 'Test that the property \''. $key .'\' is correctly saved');
		}

		$items = $recurrence->getItems($this->countStart, $this->countEnd);
		$this->assertCount($expectedCount, $items, 'Test that the expected number of occurrences is found');
		$items = $this->user->loadAppointments(array(
			'restriction' => array(
				'startdate' => $this->countStart,
				'duedate' => $this->countEnd
			)
		));
		$this->assertCount($expectedCount, $items, 'Test that the expected number of appointments is found');
	}

	/**
	 * Test if it is possible to create monthly recurring appointments, and if after saving, the series
	 * indicates the correct recurrence properties. The $providerMonthlyRecurringAppointment will generate
	 * all the various daily recurring options which will be used to create the appointments.
	 * @dataProvider providerMonthlyRecurringAppointment
	 */
	public function testMonthlyRecurringAppointment($props, $expectedCount)
	{
		try {
			$this->appointment['props'] = array_merge($this->appointment['props'], $props);
			$appointment = $this->user->saveAppointment($this->appointment);
		} catch (Exception $e) {
			$this->fail('Test that the Recurring Appointment can be saved: ' . $e->getMessage() . PHP_EOL . $e->getTraceAsString());
		}

		$this->assertInternalType(PHPUnit_Framework_Constraint_IsType::TYPE_RESOURCE, $appointment, 'Test that the created appointment is a resource');

		$recurrence = new Recurrence($this->user->getDefaultMessageStore(), $appointment);
		$pattern = $recurrence->getRecurrence();

		$this->assertNotNull($pattern);

		foreach($props as $key => $value) {
			$this->assertEquals($props[$key], $pattern[$key], 'Test that the property \''. $key .'\' is correctly saved');
		}

		$items = $recurrence->getItems($this->countStart, $this->countEnd);
		$this->assertCount($expectedCount, $items, 'Test that the expected number of occurrences is found');
		$items = $this->user->loadAppointments(array(
			'restriction' => array(
				'startdate' => $this->countStart,
				'duedate' => $this->countEnd
			)
		));
		$this->assertCount($expectedCount, $items, 'Test that the expected number of appointments is found');
	}

	/**
	 * Test if it is possible to create yearly recurring appointments, and if after saving, the series
	 * indicates the correct recurrence properties. The $providerYearlyRecurringAppointment will generate
	 * all the various daily recurring options which will be used to create the appointments.
	 * @dataProvider providerYearlyRecurringAppointment
	 */
	public function testYearlyRecurringAppointment($props, $expectedCount)
	{
		try {
			$this->appointment['props'] = array_merge($this->appointment['props'], $props);
			$appointment = $this->user->saveAppointment($this->appointment);
		} catch (Exception $e) {
			$this->fail('Test that the Recurring Appointment can be saved: ' . $e->getMessage() . PHP_EOL . $e->getTraceAsString());
		}

		$this->assertInternalType(PHPUnit_Framework_Constraint_IsType::TYPE_RESOURCE, $appointment, 'Test that the created appointment is a resource');

		$recurrence = new Recurrence($this->user->getDefaultMessageStore(), $appointment);
		$pattern = $recurrence->getRecurrence();

		$this->assertNotNull($pattern);

		foreach($props as $key => $value) {
			$this->assertEquals($props[$key], $pattern[$key], 'Test that the property \''. $key .'\' is correctly saved');
		}

		$items = $recurrence->getItems($this->countStart, $this->countEnd);
		$this->assertCount($expectedCount, $items, 'Test that the expected number of occurrences is found');
		$items = $this->user->loadAppointments(array(
			'restriction' => array(
				'startdate' => $this->countStart,
				'duedate' => $this->countEnd
			)
		));
		$this->assertCount($expectedCount, $items, 'Test that the expected number of appointments is found');
	}

	/**********************************************************************************************************/
	/* Data providers */
	/**********************************************************************************************************/

	/**
	 * Special data provider for the $testDailyRecurringAppointment function. This will generate all combinations
	 * for daily recurrences which need to be tested.
	 */
	public function providerDailyRecurringAppointment()
	{
		// Return all possible combinations for daily recurrences.
		return array(
			// Occur every day, no end limit
			array(array('type' => 10, 'subtype' => 0, 'regen' => 0, 'everyn' => 1440, 'term' => 35), 5098),
			// Occur every day, end after 10 occurrences
			array(array('type' => 10, 'subtype' => 0, 'regen' => 0, 'everyn' => 1440, 'term' => 34,'numoccur' => 10), 10),
			// Occur every day, end on given date
			array(array('type' => 10, 'subtype' => 0, 'regen' => 0, 'everyn' => 1440, 'term' => 33), 1828),

			// Occur every 5 days, no end limit
			array(array('type' => 10, 'subtype' => 0, 'regen' => 0, 'everyn' => 7200, 'term' => 35), 1020),
			// Occur every 5 days, end after 10 occurrences
			array(array('type' => 10, 'subtype' => 0, 'regen' => 0, 'everyn' => 7200, 'term' => 34,'numoccur' => 10), 10),
			// Occur every 5 days, end on given date
			array(array('type' => 10, 'subtype' => 0, 'regen' => 0, 'everyn' => 7200, 'term' => 33), 366),

			// Occur every weekday, no end limit
			array(array('type' => 10, 'subtype' => 1, 'regen' => 0, 'everyn' => 1, 'term' => 35), 3642),
			// Occur every weekday, end after Y occurrences
			array(array('type' => 10, 'subtype' => 1, 'regen' => 0, 'everyn' => 1, 'term' => 34, 'numoccur' => 10), 10),
			// Occur every weekday, end on given date
			array(array('type' => 10, 'subtype' => 1, 'regen' => 0, 'everyn' => 1, 'term' => 33), 1306),
		);
	}

	/**
	 * Special data provider for the $testWeeklyRecurringAppointment function. This will generate all combinations
	 * for weekly recurrences which need to be tested.
	 */
	public function providerWeeklyRecurringAppointment()
	{
		// Return all possible combinations for weekly recurrences.
		return array(
			// Occur every week on Wednesday, no end limit
			array(array('type' => 11, 'subtype' => 1, 'regen' => 0, 'everyn' => 1, 'weekdays' => 8, 'term' => 35), 729),
			// Occur every week on Wednesday, end after 10 occurrences
			array(array('type' => 11, 'subtype' => 1, 'regen' => 0, 'everyn' => 1, 'weekdays' => 8, 'term' => 34, 'numoccur' => 10), 10),
			// Occur every week on wednesday, end on given date
			array(array('type' => 11, 'subtype' => 1, 'regen' => 0, 'everyn' => 1, 'weekdays' => 8, 'term' => 33), 262),

			// Occur every 5 weeks on Wednesday, no end limit
			array(array('type' => 11, 'subtype' => 1, 'regen' => 0, 'everyn' => 5, 'weekdays' => 8, 'term' => 35), 146),
			// Occur every 5weeks on Wednesday, end after 10 occurrences
			array(array('type' => 11, 'subtype' => 1, 'regen' => 0, 'everyn' => 5, 'weekdays' => 8, 'term' => 34, 'numoccur' => 10), 10),
			// Occur every 5 weeks on wednesday, end on given date
			array(array('type' => 11, 'subtype' => 1, 'regen' => 0, 'everyn' => 5, 'weekdays' => 8, 'term' => 33), 53),
		);
	}

	/**
	 * Special data provider for the $testMonthlyRecurringAppointment function. This will generate all combinations
	 * for monthly recurrences which need to be tested.
	 */
	public function providerMonthlyRecurringAppointment()
	{
		// Return all possible combinations for monthly recurrences.
		return array(
			// Occur on every 17th of every month, no end limit
			array(array('type' => 12, 'subtype' => 2, 'regen' => 0, 'everyn' => 1, 'monthday' => 17, 'term' => 35), 168),
			// Occur on every 17th of every month, end after 10 occurrences
			array(array('type' => 12, 'subtype' => 2, 'regen' => 0, 'everyn' => 1, 'monthday' => 17, 'term' => 34, 'numoccur' => 10), 10),
			// Occur on every 17th of every month, end on given date
			array(array('type' => 12, 'subtype' => 2, 'regen' => 0, 'everyn' => 1, 'monthday' => 17, 'term' => 33), 61),

			// Occur on every 17th of every 5 months, no end limit
			array(array('type' => 12, 'subtype' => 2, 'regen' => 0, 'everyn' => 5, 'monthday' => 17, 'term' => 35), 34),
			// Occur on every 17th of every 5 months, end after 10 occurrences
			array(array('type' => 12, 'subtype' => 2, 'regen' => 0, 'everyn' => 5, 'monthday' => 17, 'term' => 34, 'numoccur' => 10), 10),
			// Occur on every 17th of every 5 months, end on given date
			array(array('type' => 12, 'subtype' => 2, 'regen' => 0, 'everyn' => 5, 'monthday' => 17, 'term' => 33), 13),

			// Occur on every third Wednesday of every month, no end limit
			array(array('type' => 12, 'subtype' => 3, 'regen' => 0, 'everyn' => 1, 'nday' => 3, 'weekdays' => 8, 'term' => 35), 168),
			// Occur on every third Wednesday of every month, end after 10 occurrences
			array(array('type' => 12, 'subtype' => 3, 'regen' => 0, 'everyn' => 1, 'nday' => 3, 'weekdays' => 8, 'term' => 34, 'numoccur' => 10), 10),
			// Occur on every third Wednesday of every month, end on given date
			array(array('type' => 12, 'subtype' => 3, 'regen' => 0, 'everyn' => 1, 'nday' => 3, 'weekdays' => 8, 'term' => 33), 61),

			// Occur on every third Wednesday of every 5 months, no end limit
			array(array('type' => 12, 'subtype' => 3, 'regen' => 0, 'everyn' => 5, 'nday' => 3, 'weekdays' => 8, 'term' => 35), 34),
			// Occur on every third Wednesday of every 5 months, end after 10 occurrences
			array(array('type' => 12, 'subtype' => 3, 'regen' => 0, 'everyn' => 5, 'nday' => 3, 'weekdays' => 8, 'term' => 34, 'numoccur' => 10), 10),
			// Occur on every third Wednesday of every 5 months, end on given date
			array(array('type' => 12, 'subtype' => 3, 'regen' => 0, 'everyn' => 5, 'nday' => 3, 'weekdays' => 8, 'term' => 33), 13),
		);
	}

	/**
	 * Special data provider for the $testYearlyRecurringAppointment function. This will generate all combinations
	 * for yearly recurrences which need to be tested.
	 */
	public function providerYearlyRecurringAppointment()
	{
		// Return all possible combinations for yearly recurrences
		return array(
			// Occur on every August 17 of every year, no end limit
			array(array('type' => 13, 'subtype' => 2, 'regen' => 0, 'everyn' => 12, 'month' => 305280, 'monthday' => 17, 'term' => 35), 14),
			// Occur on every August 17 of every year, end after 10 occurrences
			array(array('type' => 13, 'subtype' => 2, 'regen' => 0, 'everyn' => 12, 'month' => 305280, 'monthday' => 17, 'term' => 34, 'numoccur' => 10), 10),
			// Occur on every August 17 of every year, end on given date
			array(array('type' => 13, 'subtype' => 2, 'regen' => 0, 'everyn' => 12, 'month' => 305280, 'monthday' => 17, 'term' => 33), 6),

			// Occur on every third Wednesday of August, no end limit
			array(array('type' => 13, 'subtype' => 3, 'regen' => 0, 'everyn' => 12, 'nday' => 3, 'weekdays' => 8, 'month' => 305280, 'term' => 35), 14),
			// Occur on every third Wednesday of August, end after 10 occurrences
			array(array('type' => 13, 'subtype' => 3, 'regen' => 0, 'everyn' => 12, 'nday' => 3, 'weekdays' => 8, 'month' => 305280, 'term' => 34, 'numoccur' => 10), 10),
			// Occur on every third Wednesday of August, end on given date
			array(array('type' => 13, 'subtype' => 3, 'regen' => 0, 'everyn' => 12, 'nday' => 3, 'weekdays' => 8, 'month' => 305280, 'term' => 33), 6),

			// Occur on every July 17 of every year starting from same monthday of earlier month, no end limit
			array(array('type' => 13, 'subtype' => 2, 'regen' => 0, 'everyn' => 12, 'month' => 260640, 'monthday' => 17, 'term' => 35), 14),

			// Occur on every September 17 of every year starting from same monthday of later month, no end limit
			array(array('type' => 13, 'subtype' => 2, 'regen' => 0, 'everyn' => 12, 'month' => 349920, 'monthday' => 17, 'term' => 35), 14),

			// Occur on every August 11 of every year starting from same month, no end limit.
			// expected occurences are 13 because countEnd configured as August 1st and ocurrence date is August 11th.
			array(array('type' => 13, 'subtype' => 2, 'regen' => 0, 'everyn' => 12, 'month' => 305280, 'monthday' => 11, 'term' => 35), 13),

			// Occur on every August 21 of every year starting from same month, no end limit
			array(array('type' => 13, 'subtype' => 2, 'regen' => 0, 'everyn' => 12, 'month' => 305280, 'monthday' => 21, 'term' => 35), 14),

			// Occur on every July 11 of every year starting from earlier date, no end limit
			array(array('type' => 13, 'subtype' => 2, 'regen' => 0, 'everyn' => 12, 'month' => 260640, 'monthday' => 11, 'term' => 35), 14),

			// Occur on every September 21 of every year starting from later date, no end limit
			array(array('type' => 13, 'subtype' => 2, 'regen' => 0, 'everyn' => 12, 'month' => 349920, 'monthday' => 21, 'term' => 35), 14),
		);
	}
}

?>
