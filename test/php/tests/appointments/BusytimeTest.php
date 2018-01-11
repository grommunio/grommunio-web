<?php
require_once('classes/KopanoUser.php');
require_once('classes/BusytimeUser.php');
require_once('classes/CalendarUser.php');
require_once('classes/TestData.php');
require_once('classes/KopanoTest.php');

/**
 * BusytimeTest
 *
 * Tests all cases for loading the busytimes
 */
class BusytimeTest extends KopanoTest {

	/**
	 * The default user which is creating the appointments
	 */
	private $user;

	/**
	 * The calendar user which will save the appointments
	 */
	private $calendarUser;

	/**
	 * The start date for the restriction
	 */
	private $startDate;

	/**
	 * The due date for the restriction
	 */
	private $dueDate;

	/**
	 * During setup we are going to create the $user which will create the appointments.
	 */
	protected function setUp()
	{
		parent::setUp();

		$this->user = $this->addUser(new BusytimeUser(new KopanoUser(KOPANO_USER1_NAME, KOPANO_USER1_PASSWORD)));
		$this->calendarUser = $this->addUser(new CalendarUser(new KopanoUser(KOPANO_USER1_NAME, KOPANO_USER1_PASSWORD)));

		$this->startDate = mktime(0, 0, 0, date("n") + 1, 1, date("Y"));
		$this->dueDate = mktime(0, 0, 0, date("n") + 2, 1, date("Y"));
	}

	/**
	 * Test if the busytimes can be loaded
	 *
	 * @dataProvider providerLoadBusytimes
	 */
	public function testLoadBusytime($props, $expectedCount, $msg)
	{
		try {
			$appointment = array(
				'props' => TestData::getRecurringAppointment($props)
			);
			$appointment = $this->calendarUser->saveAppointment($appointment);
			$appointments = $this->user->loadBusytimes($this->startDate, $this->dueDate);
		} catch (Exception $e) {
			$this->fail('Test that the Appointment can be saved: ' . $e->getMessage() . PHP_EOL . $e->getTraceAsString());
		}

		$this->assertCount($expectedCount, $appointments, $msg);
	}

	/**********************************************************************************************************/
	/* Data providers */
	/**********************************************************************************************************/

	/**
	 * Provide combinations of an appointment with different start/duedate and recurrences
	 * The purpose is to test different cases where the appointments are placed inside the current month
	 *
	 * The test functions using this provider should accept 3 arguments.
	 * The first argument is the properties array which must be applied on the message which
	 * should be loaded. The second argument is the expected appointment count which should be
	 * returned by the load command, and the third argument is the message that should be
	 * shown when the test fails.
	 */
	public function providerLoadBusytimes()
	{
		//get number of weeks in the next month, starting from today's date in a month
		$month = date("n") + 1;
		if($month > 12) {
			$month -= 12;
		}

		$days = cal_days_in_month(CAL_GREGORIAN, $month, date("Y"));
		$firstDayStamp = mktime(0,0,0,date("n")+1,(date("j")%7)+1,date("Y")); //timestamp
		$firstDay = date("j", $firstDayStamp); //day of the month (only the first week, 1-7)
		$weeks = floor(($days-$firstDay)/7)+1;

		//floor dosen't convert the data type from float to integer, and assertCount
		//requires Integer as its first argument
		$weeks = intval($weeks);

		return array(
			// The appointment falls completely before the restriction
			array(array(
				'startdate' => mktime(14, 0, 0, date("n"), date("j")),
				'duedate' => mktime(15, 0, 0, date("n"), date("j")),
				'recurring' => false
			), 0, 'Test that the busy time is empty when appointment falls before range'),
			// The appointment overlaps the start of the restriction
			array(array(
				'startdate' => mktime(22, 0, 0, date("n"), date("j")),
				'duedate' => mktime(02, 0, 0, date("n") + 1, date("j")),
				'recurring' => false
			), 1, 'Test that the busy time can be loaded when appointment overlaps startdate'),
			// The appointment falls completely after the restriction
			array(array(
				'startdate' => mktime(14, 0, 0, date("n") + 2, date("j")),
				'duedate' => mktime(15, 0, 0, date("n") + 2, date("j")),
				'recurring' => false
			), 0, 'Test that the busy time is empty when appointment falls after range'),
			// The appointment overlaps the end of the restriction
			array(array(
				'startdate' => mktime(22, 0, 0, date("n") + 2, 0),
				'duedate' => mktime(02, 0, 0, date("n") + 2, 1),
				'recurring' => false
			), 1, 'Test that the busy time can be loaded when appointment overlaps duedate'),
			// The recurring appointment runs over the entire duration
			array(array(
				'startdate' => $firstDayStamp,
				'duedate' => $firstDayStamp + (60 * 60),
				'recurring' => true
			), $weeks, 'Test that the busy times for a recurring appointment can be loaded'),
		);
	}
}

?>
