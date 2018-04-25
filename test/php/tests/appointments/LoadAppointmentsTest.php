<?php
require_once('classes/KopanoUser.php');
require_once('classes/CalendarUser.php');
require_once('classes/HierarchyUser.php');
require_once('classes/TestData.php');
require_once('classes/KopanoTest.php');

/**
 * LoadingAppointmentsTest
 *
 * Tests all possible cases for loading Appointments
 */
class LoadAppointmentsTest extends KopanoTest {
	/**
	 * The default user which is creating the appointments
	 */
	private $user;

	/**
	 * The hierarchy user which is creating the calendar folder 
	 */
	private $hierarchyUser;

	/**
	 * The default settings for the appointment
	 */
	private $appointment;

	/**
	 * During setup we are going to create the $user which will create the appointments.
	 */
	protected function setUp()
	{
		parent::setUp();

		$this->user = $this->addUser(new CalendarUser(new KopanoUser(KOPANO_USER1_NAME, KOPANO_USER1_PASSWORD)));
		$this->hierarchyUser = $this->addUser(new HierarchyUser(new KopanoUser(KOPANO_USER1_NAME, KOPANO_USER1_PASSWORD)));

		$this->appointment = array(
			'props' => TestData::getAppointment()
		);
	}

	/**
	 * Test loading appointments using different forms of restrictions
	 * @dataProvider providerLoadAppointments
	 */
	public function testLoadAppointments($restrictStart, $restrictDue, $props, $expectedCount, $msg)
	{
		$this->user->saveAppointment(array( 'props' => array_merge($this->appointment['props'], $props)));
		if (!is_null($restrictStart) && !is_null($restrictDue)) {
			$appointments = $this->user->loadAppointments(array(
				'restriction' => array(
					'startdate' => $restrictStart,
					'duedate' => $restrictDue
				)
			));
		} else {
			$appointments = $this->user->loadAppointments();
		}

		$this->assertCount($expectedCount, $appointments, $msg);
	}

	/**
	 * Test loading appointments from multiple folders using different forms of restrictions
	 * @dataProvider providerLoadAppointments
	 */
	public function testLoadingMultipleFolders($restrictStart, $restrictDue, $props, $expectedCount, $msg)
	{
		$extraProps = array(
			'entryid' => array(
				bin2hex($this->user->getDefaultTestFolderEntryId())
			),
			'store_entryid' => array(
				bin2hex($this->user->getDefaultTestStoreEntryId())
			)
		);

		$folder = $this->hierarchyUser->saveFolder(array(
			'props' => TestData::getFolder(array(
				'container_class' => 'IPF.Appointment',
				'parent_entryid' => $extraProps['entryid'][0]
			))
		));
		$folderProps = $this->hierarchyUser->getFolderProps($folder, array( PR_ENTRYID, PR_STORE_ENTRYID ));
		$extraProps['entryid'][] = bin2hex($folderProps[PR_ENTRYID]);
		$extraProps['store_entryid'][] = bin2hex($folderProps[PR_STORE_ENTRYID]);

		// Create an appointment in each folder
		for ($i = 0, $len = count($extraProps['entryid']); $i < $len; $i++) {
			$props['parent_entryid'] = $extraProps['entryid'][$i];
			$props['store_entryid'] = $extraProps['store_entryid'][$i];

			$this->user->saveAppointment(array( 'props' => array_merge($this->appointment['props'], $props)));
		}

		// Check if a restriction should be applied
		$extraProps['restriction'] = array(
			'startdate' => $restrictStart,
			'duedate' => $restrictDue
		);

		$appointments = $this->user->loadAppointments($extraProps);

		$this->assertCount(2 * $expectedCount, $appointments, $msg);
	}

	/**********************************************************************************************************/
	/* Data providers */
	/**********************************************************************************************************/

	/**
	 * Provide combinations of an appointment with different start/duedate and restrictions.
	 * The purpose is to test different cases where the appointment (partially) overlaps with
	 * the given restriction.
	 *
	 * The test functions using this provider should accept 5 arguments. Where the first two
	 * arguments are the start and due date which must be applied to the restriction for loading
	 * the appointments.
	 * The third argument is the properties array which must be applied on the message which
	 * should be loaded. The fourth argument is the expected appointment count which should be
	 * returned by the load command, and the fifth argument is the message that should be
	 * shown when the test fails.
	 */
	public function providerLoadAppointments()
	{
		$restrictStart = gmmktime(0, 0, 0, date("n"), date("j"), date("Y"));
		$restrictDue = $restrictStart + (1 * 24 * 60 * 60);

		return array(
			// The appointment falls completely before the restriction
			array($restrictStart, $restrictDue, array(
				'startdate' => $restrictStart - (2 * 60 * 60),
				'commonstart' => $restrictStart - (2 * 60 * 60),
				'duedate' => $restrictStart - (1 * 60 * 60),
				'commonend' => $restrictStart - (1 * 60 * 60)
			), 0, 'Test that appointments that end before the restriction are not loaded'),
			// The appointment overlaps the start of the restriction
			array($restrictStart, $restrictDue, array(
				'startdate' => $restrictStart - (2 * 60 * 60),
				'commonstart' => $restrictStart - (2 * 60 * 60),
				'duedate' => $restrictStart + (1 * 60 * 60),
				'commonend' => $restrictStart + (1 * 60 * 60)
			), 1, 'Test that appointments which overlap the start of the restriction are loaded'),
			// The appointment overlaps the entire restriction
			array($restrictStart, $restrictDue, array(
				'startdate' => $restrictStart - (2 * 60 * 60),
				'commonstart' => $restrictStart - (2 * 60 * 60),
				'duedate' => $restrictDue + (2 * 60 * 60),
				'commonend' => $restrictDue + (2 * 60 * 60)
			), 1, 'Test that appointments which start before and end after the restriction are loaded'),
			// The appointment falls within the restriction
			array($restrictStart, $restrictDue, array(
				'startdate' => $restrictStart + (2 * 60 * 60),
				'commonstart' => $restrictStart + (2 * 60 * 60),
				'duedate' => $restrictDue - (2 * 60 * 60),
				'commonend' => $restrictDue - (2 * 60 * 60)
			), 1, 'Test that appointments which start and end within the restriction are loaded'),
			// The appointment falls completely after the restriction
			array($restrictStart, $restrictDue, array(
				'startdate' => $restrictDue + (1 * 60 * 60),
				'commonstart' => $restrictDue + (1 * 60 * 60),
				'duedate' => $restrictDue + (2 * 60 * 60),
				'commonend' => $restrictDue + (2 * 60 * 60)
			), 0, 'Test that appointments that start after the restriction are not loaded'),
			// The appointment overlaps the end of the restriction
			array($restrictStart, $restrictDue, array(
				'startdate' => $restrictDue - (1 * 60 * 60),
				'commonstart' => $restrictDue - (1 * 60 * 60),
				'duedate' => $restrictDue + (2 * 60 * 60),
				'commonend' => $restrictDue + (2 * 60 * 60)
			), 1, 'Test that appointments that overlap the end of the restriction are loaded'),
			// The appointment ends at the start of the restriction
			array($restrictStart, $restrictDue, array(
				'startdate' => $restrictStart - (2 * 60 * 60),
				'commonstart' => $restrictStart - (2 * 60 * 60),
				'duedate' => $restrictStart,
				'commonend' => $restrictStart
			), 0, 'Test that appointments that end at the start of the restriction are not loaded'),
			// The appointment starts at the end of the restriction
			array($restrictStart, $restrictDue, array(
				'startdate' => $restrictDue,
				'commonstart' => $restrictDue,
				'duedate' => $restrictDue + (2 * 60 * 60),
				'commonend' => $restrictDue + (2 * 60 * 60)
			), 0, 'Test that appointments that start at the end of the restriction are not loaded'),
			// The appointment starts and ends on the start of the restriction
			array($restrictStart, $restrictDue, array(
				'startdate' => $restrictStart,
				'commonstart' => $restrictStart,
				'duedate' => $restrictStart,
				'commonend' => $restrictStart
			), 1, 'Test that appointments that start and end on the start of the restriction are loaded'),
			// The appointment starts and ends on the end of the retriction
			array($restrictStart, $restrictDue, array(
				'startdate' => $restrictDue,
				'commonstart' => $restrictDue,
				'duedate' => $restrictDue,
				'commonend' => $restrictDue
			), 0, 'Test that appointments that start and end on the end of the restriction are not loaded')
		);
	}
}

?>
