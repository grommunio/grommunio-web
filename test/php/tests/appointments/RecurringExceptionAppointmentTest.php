<?php
require_once('classes/KopanoUser.php');
require_once('classes/CalendarUser.php');
require_once('classes/TestData.php');
require_once('classes/KopanoTest.php');

/**
 * RecurringExceptionAppointmentTest
 *
 * Tests creation of exceptions and create/delete/modify operations on that
 */
class RecurringExceptionAppointmentTest extends KopanoTest {
	/**
	 * The default user
	 */
	private $user;

	/**
	 * The default settings for the appointment
	 */
	private $appointment;

	/**
	 * During setUp we create the user
	 */
	protected function setUp()
	{
		parent::setUp();

		$this->user = $this->addUser(new CalendarUser(new KopanoUser(KOPANO_USER1_NAME, KOPANO_USER1_PASSWORD)));

		$this->appointment = array(
			'props' => TestData::getRecurringAppointment()
		);
	}

	/**
	 * Test that exception can be created from recurring appointment
	 */
	function testCreateExceptionRecurring()
	{
		try {
			$savedAppointment = $this->user->saveAppointment($this->appointment);

			// Get the entryid of the original appointment
			$entryId = $this->user->getAppointmentEntryId($savedAppointment);

			// Load all occurrences
			$occurrences = $this->user->loadAppointments(array(
				'restriction' => array(
					'startdate' => gmmktime(0, 0, 0),
					'duedate' => gmmktime(0, 0, 0, gmdate("n") + 1)
				)
			), false);

			// get the first occurrence and create exception
			$basedate = $occurrences[1]['props']['basedate'];

			$newStart = strtotime(date("Y-m-d G:i", $basedate) . " -10 hour");
			$newEnd = strtotime(date("Y-m-d G:i", $basedate) . " -10 hour +30 minute");

			// Create an exception
			$exceptionMessage = $this->user->saveAppointmentOccurence(array(
				'props' => array(
					'startdate' => $newStart,
					'duedate' => $newEnd
				)
			), $entryId, $basedate);

		} catch(Exception $e) {
			$this->fail('Test that the Exception can be saved: ' . $e->getMessage() . PHP_EOL . $e->getTraceAsString());
		}

		$this->assertInternalType(PHPUnit_Framework_Constraint_IsType::TYPE_RESOURCE, $exceptionMessage, 'Test that the saved Exception is a resource');
	}

	/**
	 * Test that exception can be opened from recurring appointment
	 */
	function testCreateExceptionRecurringOpen()
	{
		try {
			$savedAppointment = $this->user->saveAppointment($this->appointment);

			// Get the entryid of the original appointment
			$entryId = $this->user->getAppointmentEntryId($savedAppointment);

			// Load all occurrences
			$occurrences = $this->user->loadAppointments(array(
				'restriction' => array(
					'startdate' => gmmktime(0, 0, 0),
					'duedate' => gmmktime(0, 0, 0, gmdate("n") + 1)
				)
			), false);

			// get the first occurrence and create exception
			$basedate = $occurrences[1]['props']['basedate'];

			$newStart = strtotime(date("Y-m-d G:i", $basedate) . " -10 hour");
			$newEnd = strtotime(date("Y-m-d G:i", $basedate) . " -10 hour +30 minute");

			// create an exception
			$exceptionMessage = $this->user->saveAppointmentOccurence(array(
				'props' => array(
					'startdate' => $newStart,
					'duedate' => $newEnd
				)
			), $entryId, $basedate);

			// Get the entryid of the exception appointment
			$entryId = $this->user->getAppointmentEntryId($exceptionMessage);

			// Check what has happened
			$exception = $this->user->openAppointmentOccurence($entryId, $basedate);
			$exception = $exception['item']['item'];
		} catch(Exception $e) {
			$this->fail('Test that the Exception can be opened: ' . $e->getMessage() . PHP_EOL . $e->getTraceAsString());
		}

		$this->assertNotEmpty($exception['props'], 'Test that exception response contains data.');

		$this->assertEquals($basedate, $exception['props']['basedate'], 'Test that created exception contains valid basedate.');
	}

	/**
	 * Test properties of the exception message in recurring appointment
	 */
	function testCreateExceptionRecurringProps()
	{
		$savedAppointment = $this->user->saveAppointment($this->appointment);

		// Get the entryid of the original appointment
		$entryId = $this->user->getAppointmentEntryId($savedAppointment);

		// Load all occurrences
		$occurrences = $this->user->loadAppointments(array(
			'restriction' => array(
				'startdate' => gmmktime(0, 0, 0),
				'duedate' => gmmktime(0, 0, 0, gmdate("n") + 1)
			)
		), false);

		// get the first occurrence and create exception
		$basedate = $occurrences[1]['props']['basedate'];

		$newStart = strtotime(date("Y-m-d G:i", $basedate) . " -10 hour");
		$newEnd = strtotime(date("Y-m-d G:i", $basedate) . " -10 hour +30 minute");
		$newBody = 'Exception body';
		$newSubject = 'Exception subject';
		$newLabel = 1;

		// Send an exception
		$exceptionMessage = $this->user->saveAppointmentOccurence(array(
			'props' => array(
				'startdate' => $newStart,
				'duedate' => $newEnd,
				'body' => $newBody,
				'subject' => $newSubject,
				'label' => $newLabel
			)
		), $entryId, $basedate);

		// Get the entryid of the exception appointment
		$entryId = $this->user->getAppointmentEntryId($exceptionMessage);

		// Check what has happened
		$exception = $this->user->openAppointmentOccurence($entryId, $basedate);
		$exception = $exception['item']['item'];

		// Check if the exception contains correct subject/body
		$this->assertEquals($newBody, $exception['props']['body'], 'Test that the Exception contains updated body.');
		$this->assertEquals($newSubject, $exception['props']['subject'], 'Test that the Exception contains updated subject.');
		$this->assertEquals($newLabel, $exception['props']['label'], 'Test that the Exception contains updated label.');

		// Check if the exception is on correct start/due time
		$this->assertEquals($newStart, $exception['props']['startdate'], 'Test that the start time of the exception is set correctly.');
		$this->assertEquals($newEnd, $exception['props']['duedate'], 'Test that the end time of the exception is set correctly.');

		// Check if commonstart/commonend is same as startdate/duedate
		$this->assertEquals($newStart, $exception['props']['commonstart'], 'Test that the commonstart is same as startdate.');
		$this->assertEquals($newEnd, $exception['props']['commonend'], 'Test that the commonend is same as duedate.');
	}

	/**
	 * Test that empty body/subject can be saved in exception appointment
	 */
	function testCreateExceptionRecurringEmptyProps()
	{
		$savedAppointment = $this->user->saveAppointment($this->appointment);

		// Get the entryid of the original appointment
		$entryId = $this->user->getAppointmentEntryId($savedAppointment);

		// Load all occurrences
		$occurrences = $this->user->loadAppointments(array(
			'restriction' => array(
				'startdate' => gmmktime(0, 0, 0),
				'duedate' => gmmktime(0, 0, 0, gmdate("n") + 1)
			)
		), false);

		// get the first occurrence and create exception
		$basedate = $occurrences[1]['props']['basedate'];

		$newStart = strtotime(date("Y-m-d G:i", $basedate) . " -10 hour");
		$newEnd = strtotime(date("Y-m-d G:i", $basedate) . " -10 hour +30 minute");
		$newBody = '';
		$newSubject = '';

		// Send an exception
		$exceptionMessage = $this->user->saveAppointmentOccurence(array(
			'props' => array(
				'startdate' => $newStart,
				'duedate' => $newEnd,
				'body' => $newBody,
				'subject' => $newSubject
			)
		), $entryId, $basedate);

		// Get the entryid of the exception appointment
		$entryId = $this->user->getAppointmentEntryId($exceptionMessage);

		// Check what has happened
		$exception = $this->user->openAppointmentOccurence($entryId, $basedate);
		$exception = $exception['item']['item'];

		// Check if the exception contains correct subject/body
		// @FIXME Disabled because corrently we don't support getting empty body of an exception
		// $this->assertEquals($newBody, $exception['props']['body'], 'Test that the Exception contains updated body.');
		$this->assertEquals($newSubject, $exception['props']['subject'], 'Test that the Exception contains updated subject.');
	}

	/**
	 * Test that exception can be deleted and converted to a deleted exception.
	 */
	function testDeleteExceptionRecurring()
	{
		try {
			$savedAppointment = $this->user->saveAppointment($this->appointment);

			// Get the entryid of the original appointment
			$entryId = $this->user->getAppointmentEntryId($savedAppointment);

			// Load all occurrences
			$occurrences = $this->user->loadAppointments(array(
				'restriction' => array(
					'startdate' => gmmktime(0, 0, 0),
					'duedate' => gmmktime(0, 0, 0, gmdate("n") + 1)
				)
			), false);

			$occurrenceCountStart = count($occurrences);

			// get the first occurrence and create exception
			$basedate = $occurrences[1]['props']['basedate'];

			$newStart = strtotime(date("Y-m-d G:i", $basedate) . " -10 hour");
			$newEnd = strtotime(date("Y-m-d G:i", $basedate) . " -10 hour +30 minute");

			// Create an exception
			$exceptionMessage = $this->user->saveAppointmentOccurence(array(
				'props' => array(
					'startdate' => $newStart,
					'duedate' => $newEnd
				)
			), $entryId, $basedate);

			// Get the entryid of the exception appointment
			$entryId = $this->user->getAppointmentEntryId($exceptionMessage);

			// Check what has happened
			$this->user->deleteAppointmentOccurence($entryId, $basedate);

			// Load all occurrences
			$occurrences = $this->user->loadAppointments(array(
				'restriction' => array(
					'startdate' => gmmktime(0, 0, 0),
					'duedate' => gmmktime(0, 0, 0, gmdate("n") + 1)
				)
			), false);

			$occurrenceCountEnd = count($occurrences);

		} catch(Exception $e) {
			$this->fail('Test that the Exception can be deleted: ' . $e->getMessage() . PHP_EOL . $e->getTraceAsString());
		}

		$this->assertEquals($occurrenceCountStart - 1, $occurrenceCountEnd, 'Test that exception is deleted and converted as deleted exception.');
	}

	/**
	 * Test that opening a deleted exception will give error
	 */
	function testOpeningDeletedExceptionRecurring()
	{
		try {
			$savedAppointment = $this->user->saveAppointment($this->appointment);

			// Get the entryid of the original appointment
			$entryId = $this->user->getAppointmentEntryId($savedAppointment);

			// Load all occurrences
			$occurrences = $this->user->loadAppointments(array(
				'restriction' => array(
					'startdate' => gmmktime(0, 0, 0),
					'duedate' => gmmktime(0, 0, 0, gmdate("n") + 1)
				)
			), false);

			// get the first occurrence and create exception
			$basedate = $occurrences[1]['props']['basedate'];

			$newStart = strtotime(date("Y-m-d G:i", $basedate) . " -10 hour");
			$newEnd = strtotime(date("Y-m-d G:i", $basedate) . " -10 hour +30 minute");

			// Create an exception
			$exceptionMessage = $this->user->saveAppointmentOccurence(array(
				'props' => array(
					'startdate' => $newStart,
					'duedate' => $newEnd
				)
			), $entryId, $basedate);

			// Get the entryid of the exception appointment
			$entryId = $this->user->getAppointmentEntryId($exceptionMessage);

			// Check what has happened
			$this->user->deleteAppointmentOccurence($entryId, $basedate);

			// try to open deleted exception
			$error = $this->user->openAppointmentOccurence($entryId, $basedate);
			$error = $error['error'];
		} catch(Exception $e) {
			$this->fail('Test that the Deleted Exception can not be opened: ' . $e->getMessage() . PHP_EOL . $e->getTraceAsString());
		}

		$this->assertEquals(ERROR_ZARAFA, $error['type'], 'Test that we get an error of type \'ERROR_ZARAFA\'');

		$this->assertEquals('Could not open occurrence, specific occurrence is probably deleted.', $error['info']['display_message'], 'Test that we get a proper error message for the error');
	}
}

?>
