<?php
require_once('classes/KopanoUser.php');
require_once('classes/HierarchyUser.php');
require_once('classes/TestData.php');
require_once('classes/KopanoTest.php');

/**
 * KeepAliveTest
 *
 * Tests sending keepalive
 */
class KeepAliveTest extends KopanoTest {

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
		$this->user = $this->addUser(new HierarchyUser(new KopanoUser(KOPANO_USER1_NAME, KOPANO_USER1_PASSWORD)));
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
