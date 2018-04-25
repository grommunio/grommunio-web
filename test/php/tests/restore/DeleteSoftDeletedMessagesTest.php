<?php
require_once('classes/KopanoUser.php');
require_once('classes/RestoreMessageUser.php');
require_once('classes/MailUser.php');
require_once('classes/TestData.php');
require_once('classes/KopanoTest.php');

class DeleteSoftDeletedMessages extends KopanoTest {
	/**
	 * The default user which will be sending request to retrieve soft deleted messages
	 */
	private $restoreUser;

	/**
	 * The default user which will be sending the mail
	 */
	private $mailUser;

	/**
	 * The message which will be created and saved
	 */
	private $message;

	/**
	 * The entryid of the soft-deleted message
	 */
	private $softDeletedId;

	/**
	 * During setUp we create the user
	 */
	protected function setUp()
	{
		parent::setUp();

		$this->restoreUser = $this->addUser(new RestoreMessageUser(new KopanoUser(KOPANO_USER1_NAME, KOPANO_USER1_PASSWORD)));
		$this->mailUser = $this->addUser(new MailUser(new KopanoUser(KOPANO_USER1_NAME, KOPANO_USER1_PASSWORD)));

		$this->message = array(
			'props' => TestData::getMail()
		);

		$savedMail = $this->mailUser->saveMail($this->message);
		$this->softDeletedId = $this->mailUser->getMailProps($savedMail, array(PR_ENTRYID));
		$this->softDeletedId = $this->softDeletedId[PR_ENTRYID];
		$this->mailUser->deleteMail($this->softDeletedId, array('soft_delete' => true));
	}

	/**
	 * Tests if soft deleted messages will be hard-deleted successfully
	 */
	public function testDeleteSoftDeletedMessages()
	{
		try {
			$response = $this->restoreUser->deleteSoftdeletedItems(array($this->softDeletedId));
		} catch(Exception $e) {
			$this->fail('Test that a message can be hard-deleted: ' . $e->getMessage() . PHP_EOL . $e->getTraceAsString());
		}

		$this->assertArrayHasKey('success', $response[0], 'Test that the response contains the \'success\' property');
	}

	/**
	 * Tests if the message is not there into the soft deleted message list after hard-delete
	 * @expectedException MAPIException
	 */
	public function testSoftDeletedMessageDeletedPermanently()
	{
		try {
			$this->restoreUser->deleteSoftdeletedItems(array($this->softDeletedId));
		} catch(Exception $e) {
			$this->fail('Test that a message can be hard-deleted: ' . $e->getMessage() . PHP_EOL . $e->getTraceAsString());
		}

		// assert that the soft-deleted message list is empty
		$softDeletedMessages = $this->restoreUser->loadSoftdeletedItems();
		$this->assertEmpty($softDeletedMessages, 'Test that there is no soft deleted messages after hard-delete');

		// assert that MAPIException will be thrown while opening the soft deleted message which is Permanently Deleted
		mapi_msgstore_openentry($this->mailUser->getDefaultMessageStore(), $this->softDeletedId, SHOW_SOFT_DELETES);
	}

	/*
	 * Tests if all the soft deleted messages will be hard-deleted
	 */
	public function testDeleteAllSoftDeletedMessages()
	{
		$messageObjA = array(
			'props' => TestData::getMail(array(
				'subject' => 'A'
			))
		);

		$messageObjB = array(
			'props' => TestData::getMail(array(
				'subject' => 'B'
			))
		);

		try {
			$savedMailA = $this->mailUser->saveMail($messageObjA);
			$savedMailB = $this->mailUser->saveMail($messageObjB);

			$propsA = $this->mailUser->getMailProps($savedMailA, array(PR_ENTRYID));
			$propsB = $this->mailUser->getMailProps($savedMailB, array(PR_ENTRYID));

			$this->mailUser->deleteMail($propsA[PR_ENTRYID], array('soft_delete' => true));
			$this->mailUser->deleteMail($propsB[PR_ENTRYID], array('soft_delete' => true));

			$entryids = array($propsA[PR_ENTRYID], $propsB[PR_ENTRYID], $this->softDeletedId);
			$response = $this->restoreUser->deleteSoftdeletedItems($entryids);
		} catch (Exception $e) {
			$this->fail('Test that some messages can be soft deleted and hard-deleted too: ' . $e->getMessage() . PHP_EOL . $e->getTraceAsString());
		}

		$this->assertArrayHasKey('success', $response[0], 'Test that the first response contains the \'success\' property');
		$this->assertArrayHasKey('success', $response[1], 'Test that the second response contains the \'success\' property');
		$this->assertArrayHasKey('success', $response[2], 'Test that the third response contains the \'success\' property');
	}

	/**
	 * Tests if all the messages are not there into the soft deleted message list after hard-delete all those messages
	 */
	public function testAllSoftDeletedMessagesDeletedPermanently()
	{
		$messageObjA = array(
			'props' => TestData::getMail(array(
				'subject' => 'A'
			))
		);

		$messageObjB = array(
			'props' => TestData::getMail(array(
				'subject' => 'B'
			))
		);

		try {
			$savedMailA = $this->mailUser->saveMail($messageObjA);
			$savedMailB = $this->mailUser->saveMail($messageObjB);

			$propsA = $this->mailUser->getMailProps($savedMailA, array(PR_ENTRYID));
			$propsB = $this->mailUser->getMailProps($savedMailB, array(PR_ENTRYID));

			$this->mailUser->deleteMail($propsA[PR_ENTRYID], array('soft_delete' => true));
			$this->mailUser->deleteMail($propsB[PR_ENTRYID], array('soft_delete' => true));

			$entryids = array($propsA[PR_ENTRYID], $propsB[PR_ENTRYID], $this->softDeletedId);
			$this->restoreUser->deleteSoftdeletedItems($entryids);
		} catch (Exception $e) {
			$this->fail('Test that some messages can be soft deleted and hard-deleted too: ' . $e->getMessage() . PHP_EOL . $e->getTraceAsString());
		}

		// assert that the soft-deleted message list is empty
		$softDeletedMessages = $this->restoreUser->loadSoftdeletedItems();
		$this->assertEmpty($softDeletedMessages, 'Test that there is no soft deleted messages after Delete all');
	}
}
?>
