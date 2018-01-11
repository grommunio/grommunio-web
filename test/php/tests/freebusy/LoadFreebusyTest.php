<?php
require_once('classes/KopanoUser.php');
require_once('classes/CalendarUser.php');
require_once('classes/FreebusyUser.php');
require_once('classes/TestData.php');
require_once('classes/KopanoTest.php');

/**
 * LoadFreebusyTest
 *
 * Tests all possible cases for loading Freebusy data
 */
class LoadFreebusyTest extends KopanoTest {
	/**
	 * The default user
	 */
	private $user;

	/**
	 * The first CalendarUser in which we will create
	 * appointments
	 */
	private $calendarUserA;

	/**
	 * The second CalendarUser in which we will create
	 * appointments
	 */
	private $calendarUserB;

	/**
	 * The array of users for which the freebusy data is requested
	 */
	private $freebusyUsers;

	/**
	 * The Freebusy start range
	 */
	private $restrictStart;

	/**
	 * The freebusy end range
	 */
	private $restrictDue;

	/**
	 * During setUp we create the user
	 */
	protected function setUp()
	{
		parent::setUp();

		$this->user = $this->addUser(new FreebusyUser(new KopanoUser(KOPANO_USER1_NAME, KOPANO_USER1_PASSWORD)));
		$this->calendarUserA = $this->addUser(new CalendarUser(new KopanoUser(KOPANO_USER1_NAME, KOPANO_USER1_PASSWORD)));
		$this->calendarUserB = $this->addUser(new CalendarUser(new KopanoUser(KOPANO_USER2_NAME, KOPANO_USER2_PASSWORD)));

		// FIXME: missing 'organizer'
		$this->freebusyUsers = array();
		$this->freebusyUsers[] = array(
			'userid' => -1,
			'entryid' => bin2hex($this->calendarUserA->getUserEntryID()),
			'organizer' => true
		);
		$this->freebusyUsers[] = array(
			'userid' => 1,
			'entryid' => bin2hex($this->calendarUserB->getUserEntryID()),
			'organizer' => false
		);

		$this->restrictStart = gmmktime(0, 0, 0, date("n"), date("j"), date("Y"));
		$this->restrictDue = gmmktime(0, 0, 0, date("n"), date("j") + 14, date("Y"));
	}

	/**
	 * Test loading freebusy data for empty calendars
	 */
	public function testLoadEmptyFreebusy()
	{
		try {
			$this->freebusyUsers = array();
			$this->freebusyUser[] = array(
				'userid' => 2,
				'entryid' => '',
				'organizer' => false

			);

			$response = $this->user->loadFreebusy($this->freebusyUsers, $this->restrictStart, $this->restrictDue);
		} catch (Exception $e) {
			$this->fail('Test that the freebusy data can be retrieved: ' . $e->getMessage() . PHP_EOL . $e->getTraceAsString());
		}

		$this->assertArrayHasKey('list', $response, 'Test that the response contains the \'list\' array');
		$this->assertArrayHasKey('users', $response['list'], 'Test that the response contains the \'users\' array');
		$this->assertCount(count($this->freebusyUsers), $response['list']['users'], 'Test that only 1 user response has been returned');

		for ($i = 0, $len = count($this->freebusyUsers); $i < $len; $i++) {
			$user = $this->freebusyUsers[$i];
			$responseuser = $response['list']['users'][$i];

			if(isset($responseuser['items'][0]['isRestrictedRange']) && $responseuser['items'][0]['isRestrictedRange']) {
				continue;
			}

			$this->assertEquals($user['userid'], $responseuser['userid'], 'Test that the \'userid\' property matches');
			$this->assertEquals($user['entryid'], $responseuser['entryid'], 'Test that the \'entryid\' property matches');
			$this->assertArrayHasKey('items', $responseuser, 'Test that the user object contains the \'items\' array');
			$this->assertCount(1, $responseuser['items'], 'Test that only 1 freebusy block has been returned');
			$this->assertEquals(-1, $responseuser['items'][0]['status'], 'Test that the the status is -1');
			$this->assertEquals($this->restrictStart, $responseuser['items'][0]['start'], 'Test that the the start matches the start of the range');
			$this->assertEquals($this->restrictDue, $responseuser['items'][0]['end'], 'Test that the the start matches the end of the range');
		}
	}

	/**
	 * Test loading freebusy data after creating appointments
	 * @dataProvider providerAppointments
	 */
	public function testLoadFreebusyAfterCreation($appointmentsA, $appointmentsB)
	{
		$appointments = array( $appointmentsA, $appointmentsB );

		// Create all appointments
		for ($i = 0, $len = count($appointmentsA); $i < $len; $i++) {
			$this->calendarUserA->saveAppointment($appointmentsA[$i], false);
		}
		for ($i = 0, $len = count($appointmentsB); $i < $len; $i++) {
			$this->calendarUserB->saveAppointment($appointmentsB[$i], false);
		}

		$response = $this->user->loadFreebusy($this->freebusyUsers, $this->restrictStart, $this->restrictDue);
		$len = count($this->freebusyUsers);

		// Test response
		$this->assertArrayHasKey('list', $response, 'Test that the response contains the \'list\' array');
		$this->assertArrayHasKey('users', $response['list'], 'Test that the response contains the \'users\' array');
		$this->assertCount($len, $response['list']['users'], 'Test that only 1 user response has been returned');

		for ($i = 0; $i < $len; $i++) {
			$user = $this->freebusyUsers[$i];
			$responseuser = $response['list']['users'][$i];
			$apptuser = $appointments[$i];

			foreach($responseuser['items'] as $key =>$item) {
				if($item['isRestrictedRange']) {
					unset($responseuser['items'][$key]);
				}
			}

			$this->assertEquals($user['userid'], $responseuser['userid'], 'Test that the \'userid\' property matches');
			$this->assertEquals($user['entryid'], $responseuser['entryid'], 'Test that the \'entryid\' property matches');
			$this->assertArrayHasKey('items', $responseuser, 'Test that the user object contains the \'items\' array');
			$this->assertCount(count($apptuser), $responseuser['items'], 'Test that the correct number of freebusy block has been returned');

			for ($j = 0, $jlen = count($apptuser); $j < $jlen; $j++) {
				$this->assertEquals($apptuser[$j]['props']['busystatus'], $responseuser['items'][$j]['status'], 'Test that the the status is correct');
				$this->assertEquals($apptuser[$j]['props']['startdate'], $responseuser['items'][$j]['start'], 'Test that the the start matches the start of the appointment');
				$this->assertEquals($apptuser[$j]['props']['duedate'], $responseuser['items'][$j]['end'], 'Test that the the start matches the end of the appointment');
			}
		}
	}

	/**
	 * Test loading freebusy data after deleting appointments
	 * @dataProvider providerAppointments
	 */
	public function testLoadEmptyFreebusyAfterDeletion($appointmentsA, $appointmentsB)
	{
		// Create all appointments and delete them, we use 2 deletion strategies:
		// - Create everything, followed by delete everything
		// - Create one, delete one
		$entryidsA = array();
		for ($i = 0, $len = count($appointmentsA); $i < $len; $i++) {
			$response = $this->calendarUserA->saveAppointment($appointmentsA[$i], false);
			$entryidsA[] = $response['entryid'];
		}
		for ($i = 0, $len = count($entryidsA); $i < $len; $i++) {
			$this->calendarUserA->deleteAppointment(hex2bin($entryidsA[$i]));
		}

		for ($i = 0, $len = count($appointmentsB); $i < $len; $i++) {
			$response = $this->calendarUserB->saveAppointment($appointmentsB[$i], false);
			$this->calendarUserB->deleteAppointment(hex2bin($response['entryid']));
		}
		$response = $this->user->loadFreebusy($this->freebusyUsers, $this->restrictStart, $this->restrictDue);

		// Test response
		$this->assertArrayHasKey('list', $response, 'Test that the response contains the \'list\' array');
		$this->assertArrayHasKey('users', $response['list'], 'Test that the response contains the \'users\' array');
		$this->assertCount(count($this->freebusyUsers), $response['list']['users'], 'Test that only 1 user response has been returned');

		for ($i = 0, $len = count($this->freebusyUsers); $i < $len; $i++) {
			$user = $this->freebusyUsers[$i];
			$responseuser = $response['list']['users'][$i];

			if(isset($responseuser['items'][0]['isRestrictedRange']) && $responseuser['items'][0]['isRestrictedRange']) {
				continue;
			}
			$this->assertEquals($user['userid'], $responseuser['userid'], 'Test that the \'userid\' property matches');
			$this->assertEquals($user['entryid'], $responseuser['entryid'], 'Test that the \'entryid\' property matches');
			$this->assertArrayHasKey('items', $responseuser, 'Test that the user object contains the \'items\' array');
			$this->assertCount(1, $responseuser['items'], 'Test that only 1 freebusy block has been returned');
			$this->assertEquals(-1, $responseuser['items'][0]['status'], 'Test that the the status is -1');

			$this->assertEquals($this->restrictStart, $responseuser['items'][0]['start'], 'Test that the the start matches the start of the range');
			$this->assertEquals($this->restrictDue, $responseuser['items'][0]['end'], 'Test that the the start matches the end of the range');
		}
	}

	/**
	 * Provider for the creation of various appointments which should be created into the calendar
	 * and which can afterwards be loaded into the freebusy.
	 *
	 * The test functions which use this provider should accept 2 arguments, the first argument is
	 * the array of appointments which should be created for the first user, the second argument is
	 * the array of appointments which should be created for the second user.
	 */
	public function providerAppointments()
	{
		return array(
			array(
				array(
					array(
						'props' => TestData::getAppointment(array(
							'startdate' => gmmktime(14, 35, 0, date("n"), date("j") + 5, date("Y")),
							'duedate' => gmmktime(15, 05, 0, date("n"), date("j") + 5, date("Y")),
							'busystatus' => fbBusy
						))
					)
				),
				array(
					array(
						'props' => TestData::getAppointment(array(
							'startdate' => gmmktime(6, 17, 0, date("n"), date("j") + 10, date("Y")),
								'duedate' => gmmktime(6, 29, 0, date("n"), date("j") + 10, date("Y")),
							'busystatus' => fbBusy
						))
					)
				)
			),
			array(
				array(
					array(
						'props' => TestData::getAppointment(array(
							'startdate' => gmmktime(12, 23, 0, date("n"), date("j") + 7, date("Y")),
							'duedate' => gmmktime(13, 56, 0, date("n"), date("j") + 7, date("Y")),
							'busystatus' => fbOutOfOffice
						))
					)
				),
				array(
					array(
						'props' => TestData::getAppointment(array(
							'startdate' => gmmktime(20, 54, 0, date("n"), date("j") + 12, date("Y")),
							'duedate' => gmmktime(21, 32, 0, date("n"), date("j") + 12, date("Y")),
							'busystatus' => fbOutOfOffice
						))
					)
				)
			),
			array(
				array(
					array(
						'props' => TestData::getAppointment(array(
							'startdate' => gmmktime(4, 45, 0, date("n"), date("j") + 9, date("Y")),
							'duedate' => gmmktime(5, 55, 0, date("n"), date("j") + 9, date("Y")),
							'busystatus' => fbTentative
						))
					)
				),
				array(
					array(
						'props' => TestData::getAppointment(array(
							'startdate' => gmmktime(3, 54, 0, date("n"), date("j") + 11, date("Y")),
							'duedate' => gmmktime(4, 32, 0, date("n"), date("j") + 11, date("Y")),
							'busystatus' => fbTentative
						))
					)
				)
			),
		);
	}
}

?>
