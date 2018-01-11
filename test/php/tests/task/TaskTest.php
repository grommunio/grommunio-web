<?php
require_once('classes/KopanoUser.php');
require_once('classes/TaskUser.php');
require_once('classes/TestData.php');
require_once('classes/KopanoTest.php');
require_once('classes/RestoreMessageUser.php');

/**
 * TaskTest
 *
 * Tests small Task operations (create, delete, open).
 */
class TaskTest extends KopanoTest {
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

		$this->user = $this->addUser(new TaskUser(new KopanoUser(KOPANO_USER1_NAME, KOPANO_USER1_PASSWORD)));
		$this->restoreUser = $this->addUser(new RestoreMessageUser(new KopanoUser(KOPANO_USER1_NAME, KOPANO_USER1_PASSWORD)));
		$this->restoreUser->setDefaultTestFolderEntryId($this->user->getDefaultTestFolderEntryId());

		$this->message = array(
			'props' => TestData::getTask(),
		);
	}

	/**
	 * Test if a Task can be saved to the Tasks folder without problems
	 */
	public function testSavingTasks()
	{
		try {
			$savedTask = $this->user->saveTask($this->message);
		} catch(Exception $e) {
			$this->fail('Test that the Task can be saved: ' . $e->getMessage() . PHP_EOL . $e->getTraceAsString());
		}

		$this->assertInternalType(PHPUnit_Framework_Constraint_IsType::TYPE_RESOURCE, $savedTask, 'Test that the saved Task is a resource');
	}

	/**
	 * Test if the Task is saved into the correct folder
	 */
	public function testSavingTaskFolder()
	{
		$savedTask = $this->user->saveTask($this->message);
		$entryid = $this->user->getTaskProps($savedTask, array(PR_ENTRYID));
		$foundTask = $this->user->getTask($entryid[PR_ENTRYID]);

		$this->assertInternalType(PHPUnit_Framework_Constraint_IsType::TYPE_RESOURCE, $foundTask, 'Test that the found Task is a resource');
	}

	/**
	 * Test if all properties in the new Task are correct
	 */
	public function testSavingTaskProperties()
	{
		$savedTask = $this->user->saveTask($this->message);
		$props = $this->user->getTaskProps($savedTask);

		$this->assertEquals($this->message['props']['message_class'], $props[PR_MESSAGE_CLASS], 'Test that the \'PR_MESSAGE_CLASS\' is correctly saved');
		$this->assertEquals($this->message['props']['subject'], $props[PR_SUBJECT], 'Test that the \'PR_SUBJECT\' is correctly saved');
		$this->assertEquals($this->message['props']['body'], $props[PR_BODY], 'Test that the \'PR_BODY\' is correctly saved');
	}

	/**
	 * Test if the Task can be opened
	 */
	public function testOpeningTask()
	{
		try {
			$savedTask = $this->user->saveTask($this->message);
			$entryid = $this->user->getTaskProps($savedTask, array(PR_ENTRYID));
			$openedTask = $this->user->openTask($entryid[PR_ENTRYID]);
		} catch (Exception $e) {
			$this->fail('Test that the Task can be opened: ' . $e->getMessage() . PHP_EOL . $e->getTraceAsString());
		}

		$this->assertArrayHasKey('item', $openedTask, 'Test that the opened Task returns an \'item\' array');
		$this->assertArrayHasKey('item', $openedTask['item'], 'Test that the \'item\' array contains items');
		$this->assertArrayHasKey('props', $openedTask['item']['item'], 'Test that the item contains properties');
	}

	/**
	 * Test if the opened Task contains the correct properties
	 */
	public function testOpeningTaskProperties()
	{
		$savedTask = $this->user->saveTask($this->message);
		$entryid = $this->user->getTaskProps($savedTask, array(PR_ENTRYID));
		$openedTask = $this->user->openTask($entryid[PR_ENTRYID]);

		$props = $openedTask['item']['item']['props'];

		$this->assertEquals($this->message['props']['message_class'], $props['message_class'], 'Test that the \'PR_MESSAGE_CLASS\' is correctly obtained');
		$this->assertEquals($this->message['props']['subject'], $props['subject'], 'Test that the \'PR_SUBJECT\' is correctly obtained');
		$this->assertEquals($this->message['props']['body'], $props['body'], 'Test that the \'PR_BODY\' is correctly obtained');
	}

	/**
	 * Test if the Task can be modified by emptying the body
	 */
	public function testUpdatingTaskEmptyBody()
	{
		$savedTask = $this->user->saveTask($this->message);
		$entryid = $this->user->getTaskProps($savedTask, array(PR_ENTRYID, PR_PARENT_ENTRYID, PR_STORE_ENTRYID));
		$openedTask = $this->user->openTask($entryid[PR_ENTRYID]);
		$savedTask = $this->user->saveTask(array(
			'entryid' => bin2hex($entryid[PR_ENTRYID]),
			'parent_entryid' => bin2hex($entryid[PR_PARENT_ENTRYID]),
			'store_entryid' => bin2hex($entryid[PR_STORE_ENTRYID]),
			'props' => array(
				'body' => '',
				'subject' => ''
			)
		));
		$openedTask = $this->user->openTask($entryid[PR_ENTRYID]);
		$props = $openedTask['item']['item']['props'];

		$this->assertEquals($this->message['props']['message_class'], $props['message_class'], 'Test that the \'PR_MESSAGE_CLASS\' is correctly obtained');
		$this->assertEquals('', $props['subject'], 'Test that the \'PR_SUBJECT\' is correctly updated');
		$this->assertEquals('', $props['body'], 'Test that the \'PR_BODY\' is correctly updated');
	}

	/**
	 * Test if a Task can be deleted
	 */
	public function testDeletingTasks()
	{
		try {
			$savedTask = $this->user->saveTask($this->message);
			$props = $this->user->getTaskProps($savedTask, array(PR_ENTRYID));
			$this->user->deleteTask($props[PR_ENTRYID]);
		} catch (Exception $e) {
			$this->fail('Test that the Task can be deleted: ' . $e->getMessage() . PHP_EOL . $e->getTraceAsString());
		}

		$task = $this->user->getTask($props[PR_ENTRYID]);

		$this->assertEmpty($task, 'Test that the deleted Task is no longer in the Tasks folder');

		$deletedTask = $this->user->getAllDeletedTasks();

		$this->assertNotEmpty($deletedTask, 'Test that the deleted Task is in the Deleted Items folder');

		$softDeletedTask = $this->restoreUser->loadSoftdeletedItems();

		$this->assertEmpty($softDeletedTask, 'Test that the deleted Task is not there in the Task folder as a soft deleted Task');
	}

	/**
	 * Test if a Task can be Moved
	 */
	public function testMovingTasks()
	{
		try {
			$savedTask = $this->user->saveTask($this->message);
			$props = $this->user->getTaskProps($savedTask, array(PR_ENTRYID));
			$this->user->copyTask($props[PR_ENTRYID], array(), true);
		} catch (Exception $e) {
			$this->fail('Test that the Task can be Moved: ' . $e->getMessage() . PHP_EOL . $e->getTraceAsString());
		}

		$taskItems = $this->user->loadTasks(false);

		$this->assertCount(1, $taskItems, 'Test that 1 Task was found in the folder');
		//For simplicity we are moving a message into same folder, so check entryid is the same since we use mapi_copymessages MOVE_MESSAGE
		//true
		$this->assertEquals(bin2hex($props[PR_ENTRYID]), $taskItems[0]['entryid'], 'Test that the entryid is not equal');

		$softdeletedItems = $this->restoreUser->loadSoftdeletedItems();
		$this->assertEmpty($softdeletedItems, 'Test that no messages exists in the soft delete system');
	}

	/**
	 * Test if a Task can be copied
	 */
	public function testCopyingTasks()
	{
		try {
			$savedTask = $this->user->saveTask($this->message);
			$props = $this->user->getTaskProps($savedTask, array(PR_ENTRYID));

			$this->user->copyTask($props[PR_ENTRYID]);
		} catch (Exception $e) {
			$this->fail('Test that the Task can be copied: ' . $e->getMessage() . PHP_EOL . $e->getTraceAsString());
		}

		$taskItems = $this->user->loadTasks();
		$props = $this->user->getTaskProps($taskItems);

		$copy = $props[0];
		$orig = $props[1];

		// Here, test system Copies item into the same folder
		$this->assertCount(2, $props, 'Test that 2 Tasks was found in the folder');

		$this->assertNotEquals($copy[PR_ENTRYID], $orig[PR_ENTRYID], 'Test that the entryid is not equal');

		$softdeletedItems = $this->restoreUser->loadSoftdeletedItems();
		$this->assertEmpty($softdeletedItems, 'Test that no messages exists in the soft delete system');
	}
}
?>
