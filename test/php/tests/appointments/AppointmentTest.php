<?php
require_once('classes/KopanoUser.php');
require_once('classes/CalendarUser.php');
require_once('classes/TestData.php');
require_once('classes/KopanoTest.php');
require_once('classes/RestoreMessageUser.php');

/**
 * AppointmentTest
 *
 * Tests small Appointment operations (create, delete, open).
 */
class AppointmentTest extends KopanoTest {
	/**
	 * The default user
	 */
	private $user;

	/**
	 * The default user which will be sending request to retrieve soft deleted folders
	 */
	private $restoreUser;

	/**
	 * The message which will be handled
	 */
	private $message;

	/**
	 * During setUp we create the user
	 */
	protected function setUp()
	{
		parent::setUp();

		$this->user = $this->addUser(new CalendarUser(new KopanoUser(KOPANO_USER1_NAME, KOPANO_USER1_PASSWORD)));
		$this->restoreUser = $this->addUser(new RestoreMessageUser(new KopanoUser(KOPANO_USER1_NAME, KOPANO_USER1_PASSWORD)));
		$this->restoreUser->setDefaultTestFolderEntryId($this->user->getDefaultTestFolderEntryId());

		$this->message = array(
			'props' => TestData::getAppointment()
		);
	}

	/**
	 * Test if a Appointment can be saved to the calendar folder without errors
	 */
	public function testSavingAppointment()
	{
		try {
			$savedAppointment = $this->user->saveAppointment($this->message);
		} catch(Exception $e) {
			$this->fail('Test that the Appointment can be saved: ' . $e->getMessage() . PHP_EOL . $e->getTraceAsString());
		}

		$this->assertInternalType(PHPUnit_Framework_Constraint_IsType::TYPE_RESOURCE, $savedAppointment, 'Test that the saved Appointment is a resource');
	}

	/**
	 * Test if the Appointment is saved into the correct folder
	 */
	public function testSavingAppointmentFolder()
	{
		$savedAppointment = $this->user->saveAppointment($this->message);
		$entryid = $this->user->getAppointmentProps($savedAppointment, array(PR_ENTRYID));
		$foundAppointment = $this->user->getAppointment($entryid[PR_ENTRYID]);

		$this->assertInternalType(PHPUnit_Framework_Constraint_IsType::TYPE_RESOURCE, $foundAppointment, 'Test that the found Appointment is a resource');
	}

	/**
	 * Test if all properties in the new Appointment are correct
	 */
	public function testSavingAppointmentProperties()
	{
		$savedAppointment = $this->user->saveAppointment($this->message);
		$props = $this->user->getAppointmentProps($savedAppointment);

		$this->assertEquals($this->message['props']['message_class'], $props[PR_MESSAGE_CLASS], 'Test that the \'PR_MESSAGE_CLASS\' is correctly saved');
		$this->assertEquals($this->message['props']['subject'], $props[PR_SUBJECT], 'Test that the \'PR_SUBJECT\' is correctly saved');
		$this->assertEquals($this->message['props']['body'], $props[PR_BODY], 'Test that the \'PR_BODY\' is correctly saved');
	}

	/**
	 * Test if the Appointment can be opened
	 */
	public function testOpeningAppointment()
	{
		try {
			$savedAppointment = $this->user->saveAppointment($this->message);
			$entryid = $this->user->getAppointmentProps($savedAppointment, array(PR_ENTRYID));
			$openedAppointment = $this->user->openAppointment($entryid[PR_ENTRYID]);
		} catch (Exception $e) {
			$this->fail('Test that the Appointment can be opened: ' . $e->getMessage() . PHP_EOL . $e->getTraceAsString());
		}

		$this->assertArrayHasKey('item', $openedAppointment, 'Test that the opened Appointment returns an \'item\' array');
		$this->assertArrayHasKey('item', $openedAppointment['item'], 'Test that the \'item\' array contains items');
		$this->assertArrayHasKey('props', $openedAppointment['item']['item'], 'Test that the item contains properties');
	}

	/**
	 * Test if the opened Appointment contains the correct properties
	 */
	public function testOpeningAppointmentProperties()
	{
		$savedAppointment = $this->user->saveAppointment($this->message);
		$entryid = $this->user->getAppointmentProps($savedAppointment, array(PR_ENTRYID));
		$openedAppointment = $this->user->openAppointment($entryid[PR_ENTRYID]);

		$props = $openedAppointment['item']['item']['props'];

		$this->assertEquals($this->message['props']['message_class'], $props['message_class'], 'Test that the \'PR_MESSAGE_CLASS\' is correctly obtained');
		$this->assertEquals($this->message['props']['subject'], $props['subject'], 'Test that the \'PR_SUBJECT\' is correctly obtained');
		$this->assertEquals($this->message['props']['body'], $props['body'], 'Test that the \'PR_BODY\' is correctly obtained');
	}

	/**
	 * Test if the Appointment can be modified by emptying the body
	 */
	public function testUpdatingAppointmentEmptyBody()
	{
		$savedAppointment = $this->user->saveAppointment($this->message);
		$entryid = $this->user->getAppointmentProps($savedAppointment, array(PR_ENTRYID, PR_PARENT_ENTRYID, PR_STORE_ENTRYID));
		$openedAppointment = $this->user->openAppointment($entryid[PR_ENTRYID]);
		$savedAppointment = $this->user->saveAppointment(array(
			'entryid' => bin2hex($entryid[PR_ENTRYID]),
			'parent_entryid' => bin2hex($entryid[PR_PARENT_ENTRYID]),
			'store_entryid' => bin2hex($entryid[PR_STORE_ENTRYID]),
			'props' => array(
				'body' => '',
				'subject' => ''
			)
		));
		$openedAppointment = $this->user->openAppointment($entryid[PR_ENTRYID]);
		$props = $openedAppointment['item']['item']['props'];

		$this->assertEquals($this->message['props']['message_class'], $props['message_class'], 'Test that the \'PR_MESSAGE_CLASS\' is correctly obtained');
		$this->assertEquals('', $props['subject'], 'Test that the \'PR_SUBJECT\' is correctly updated');
		$this->assertEquals('', $props['body'], 'Test that the \'PR_BODY\' is correctly updated');
	}

	/**
	 * Test if a Appointment can be deleted
	 */
	public function testDeletingAppointments()
	{
		try {
			$savedAppointment = $this->user->saveAppointment($this->message);
			$props = $this->user->getAppointmentProps($savedAppointment, array(PR_ENTRYID));
			$this->user->deleteAppointment($props[PR_ENTRYID]);
		} catch (Exception $e) {
			$this->fail('Test that the Appointment can be deleted: ' . $e->getMessage() . PHP_EOL . $e->getTraceAsString());
		}

		$appointment = $this->user->getAppointment($props[PR_ENTRYID]);

		$this->assertEmpty($appointment, 'Test that the deleted Appointment is no longer in the Calendar folder');

		$deletedAppointment = $this->user->getAllDeletedAppointments();

		$this->assertNotEmpty($deletedAppointment, 'Test that the deleted Appointment is in the Deleted Items folder');

		$softDeletedAppointment = $this->restoreUser->loadSoftdeletedItems();

		$this->assertEmpty($softDeletedAppointment, 'Test that the deleted Appointment is not there in the Calendar folder as a soft deleted Appointment');
	}

	/**
	 * Test if a Appointment can be Moved
	 */
	public function testMovingAppointments()
	{
		try {
			$savedAppointment = $this->user->saveAppointment($this->message);
			$props = $this->user->getAppointmentProps($savedAppointment, array(PR_ENTRYID));
			$this->user->copyAppointment($props[PR_ENTRYID], array(), true);
		} catch (Exception $e) {
			$this->fail('Test that the Appointment can be Moved: ' . $e->getMessage() . PHP_EOL . $e->getTraceAsString());
		}

		$appointmentItems = $this->user->loadAppointments();

		$this->assertCount(1, $appointmentItems, 'Test that 1 Appointment was found in the folder');
		//For simplicity we are moving a message into same folder, so check entryid is changed or not
		$this->assertNotEquals(bin2hex($props[PR_ENTRYID]), $appointmentItems[0]['entryid'], 'Test that the entryid is not equal');

		$softdeletedItems = $this->restoreUser->loadSoftdeletedItems();
		$this->assertEmpty($softdeletedItems, 'Test that no messages exists in the soft delete system');
	}
}

?>
