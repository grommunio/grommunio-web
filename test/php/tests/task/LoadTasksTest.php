<?php
require_once('classes/KopanoUser.php');
require_once('classes/TaskUser.php');
require_once('classes/TestData.php');
require_once('classes/KopanoTest.php');

/**
 * LoadTaskTest
 *
 * Tests all possible cases for loading Appointments
 */
class LoadTaskTest extends KopanoTest {
	/**
	 * The default user
	 */
	private $user;

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

		$this->message = array(
			'props' => TestData::getTask(),
		);
	}

	/**
	 * Test loading tasks without using any restrictions.
	 */
	public function testLoadAllTasks()
	{
		$this->user->saveTask($this->message);
		$tasks = $this->user->loadTasks();

		$this->assertCount(1, $tasks, 'Test that all tasks can be loaded without a restriction');
	}
}
?>
