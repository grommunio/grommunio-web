<?php
require_once('classes/grommunioUser.php');
require_once('classes/HierarchyUser.php');
require_once('classes/TestData.php');
require_once('classes/grommunioTest.php');

/**
 * KeepAliveTest
 *
 * Tests sending keepalive
 */
class KeepAliveTest extends grommunioTest {

	/**
	 * The user for which we will add and close Shared Stores
	 */
	private $user;

	/**
	 * During setup we create the user, and clear the shared stores settings
	 */
	protected function setUp()
	{

		parent::setUp();

		$this->cleanFolders = false;
		$this->user = $this->addUser(new HierarchyUser(new grommunioUser(GROMMUNIO_USER1_NAME, GROMMUNIO_USER1_PASSWORD)));
	}

	/*
	 * Test if a keepalive can be send to the server
	 */
	public function testSendingKeepAlive()
	{
		try {
			$response = $this->user->sendKeepAlive();
		} catch (Exception $e) {
			$this->fail('Test that a keep alive can be send: ' . $e->getMessage() . PHP_EOL . $e->getTraceAsString());
		}

		$this->assertArrayHasKey('success', $response, 'Test that the keepalive returns the \'success\' property');
	}
}
