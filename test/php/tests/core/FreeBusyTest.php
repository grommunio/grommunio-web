<?php

require_once 'classes/grommunioUser.php';
require_once 'classes/FreebusyUser.php';
require_once 'classes/grommunioTest.php';

/**
 * Freebusy test.
 *
 * Tests all possible cases for getting freebusy message and folder.
 *
 * @internal
 * @coversNothing
 */
class FreeBusyTest extends grommunioTest {
	/**
	 * Default store.
	 */
	private $store;

	/**
	 * During setup we initialize the store object.
	 */
	protected function setUp() {
		parent::setUp();
		$user = $this->addUser(new FreebusyUser(new grommunioUser(GROMMUNIO_USER1_NAME, GROMMUNIO_USER1_PASSWORD)));
		$this->store = $user->getDefaultMessageStore();
		$this->cleanFolders = false;
	}

	/**
	 * Test getting freebusy message.
	 */
	public function testGetLocalFreeBusyMessage() {
		$result = FreeBusy::getLocalFreeBusyMessage($this->store);
		$this->assertNotFalse($result, "Test that it return message.");

		$props = mapi_getprops($result, [PR_MESSAGE_CLASS]);
		$this->assertEquals($props[PR_MESSAGE_CLASS], "IPM.Microsoft.ScheduleData.FreeBusy", "Test that return message is freebusy message.");
	}

	/**
	 * Test getting freebusy folder.
	 */
	public function testGetLocalFreeBusyFolder() {
		$result = FreeBusy::getLocalFreeBusyFolder($this->store);
		$this->assertNotFalse($result, "Test that it return freebusy folder");

		$props = mapi_getprops($result, [PR_OBJECT_TYPE]);
		$this->assertEquals($props[PR_OBJECT_TYPE], MAPI_FOLDER, "Test that it return mapi folder");
	}
}
