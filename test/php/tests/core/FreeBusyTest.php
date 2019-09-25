<?php
require_once('classes/KopanoUser.php');
require_once('classes/FreebusyUser.php');
require_once('classes/KopanoTest.php');

/**
 * Freebusy test
 *
 * Tests all possible cases for getting freebusy message and folder.
 */
class FreeBusyTest extends KopanoTest
{
	/**
	 * Default store
	 */
	private $store;

	/**
	 * During setup we initialize the store object
	 */
	protected function setUp()
	{
		parent::setUp();
		$user = $this->addUser(new FreebusyUser(new KopanoUser(KOPANO_USER1_NAME, KOPANO_USER1_PASSWORD)));
		$this->store = $user->getDefaultMessageStore();
		$this->cleanFolders = false;
	}

	/**
	 * Test getting freebusy message.
	 */
	public function testGetLocalFreeBusyMessage()
	{
		$result = freebusy::getLocalFreeBusyMessage($this->store);
		$this->assertNotFalse($result, "Test that it return message.");

		$props = mapi_getprops($result, array(PR_MESSAGE_CLASS));
		$this->assertEquals($props[PR_MESSAGE_CLASS], "IPM.Microsoft.ScheduleData.FreeBusy", "Test that return message is freebusy message.");
	}

	/**
	 * Test getting freebusy folder.
	 */
	public function testGetLocalFreeBusyFolder()
	{
		$result = freebusy::getLocalFreeBusyFolder($this->store);
		$this->assertNotFalse($result, "Test that it return freebusy folder");

		$props = mapi_getprops($result, array(PR_OBJECT_TYPE));
		$this->assertEquals($props[PR_OBJECT_TYPE], MAPI_FOLDER, "Test that it return mapi folder");
	}
}
