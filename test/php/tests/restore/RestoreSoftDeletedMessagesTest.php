<?php
require_once('classes/KopanoUser.php');
require_once('classes/RestoreMessageUser.php');
require_once('classes/MailUser.php');
require_once('classes/TestData.php');
require_once('classes/KopanoTest.php');

class RestoreSoftDeletedMessages extends KopanoTest {
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
		$this->mailUser->deleteMail($this->softDeletedId, array(), true);
	}

	/**
	 * Tests if soft deleted messages will be restored successfully
	 */
	public function testRestoreSoftDeletedMessages()
	{
		try {
			$response = $this->restoreUser->restoreSoftdeletedItems(array($this->softDeletedId));
		} catch(Exception $e) {
			$this->fail('Test that a message can be restored: ' . $e->getMessage() . PHP_EOL . $e->getTraceAsString());
		}

		$this->assertArrayHasKey('success', $response[0], 'Test that the response contains the \'success\' property');
	}

	/**
	 * Tests if soft deleted the message is restored successfully and is present into the 'drafts' folder
	 */
	public function testSoftDeletedMessageRestoredInDrafts()
	{
		try {
			$this->restoreUser->restoreSoftdeletedItems(array($this->softDeletedId));
		} catch(Exception $e) {
			$this->fail('Test that a message can be restored: ' . $e->getMessage() . PHP_EOL . $e->getTraceAsString());
		}

		// assert that the soft-deleted message list is empty
		$softDeletedMessages = $this->restoreUser->loadSoftdeletedItems();
		$this->assertEmpty($softDeletedMessages, 'Test that there is no soft deleted messages after restore');

		// assert that the message is restored successfully and is present into the 'drafts' folder
		$mailList = $this->mailUser->loadMails();
		$mailProps = $this->mailUser->getMailProps($mailList[0], array(PR_SUBJECT));
		$this->assertEquals($mailProps[PR_SUBJECT], 'new mail', 'Test that the message is there into the drafts folder');
	}

	/*
	 * Tests if all the soft deleted messages will be restored
	 */
	public function testRestoreAllSoftDeletedMessages()
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
			$response = $this->restoreUser->restoreSoftdeletedItems($entryids);
		} catch (Exception $e) {
			$this->fail('Test that some messages can be soft deleted and restored: ' . $e->getMessage() . PHP_EOL . $e->getTraceAsString());
		}

		$this->assertArrayHasKey('success', $response[0], 'Test that the first response contains the \'success\' property');
		$this->assertArrayHasKey('success', $response[1], 'Test that the second response contains the \'success\' property');
		$this->assertArrayHasKey('success', $response[2], 'Test that the third response contains the \'success\' property');
	}

	/**
	 * Tests if all the soft deleted messages are restored successfully and is present into the 'drafts' folder
	 */
	public function testRestoreAllSoftDeletedMessagesInDrafts()
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

			$this->mailUser->deleteMail($propsA[PR_ENTRYID], array(), true);
			$this->mailUser->deleteMail($propsB[PR_ENTRYID], array(), true);

			$entryids = array($propsA[PR_ENTRYID], $propsB[PR_ENTRYID], $this->softDeletedId);
			$this->restoreUser->restoreSoftdeletedItems($entryids);
		} catch (Exception $e) {
			$this->fail('Test that some messages can be soft deleted and restored: ' . $e->getMessage() . PHP_EOL . $e->getTraceAsString());
		}

		// assert that the soft-deleted message list is empty
		$softDeletedMessages = $this->restoreUser->loadSoftdeletedItems();
		$this->assertEmpty($softDeletedMessages, 'Test that there is no soft deleted messages after restore all');

		$mailList = $this->mailUser->loadMails();

		// assert that all the messages are restored successfully and is present into the 'drafts' folder
		$mailPropsB = $this->mailUser->getMailProps($mailList[0], array(PR_SUBJECT));
		$mailPropsA = $this->mailUser->getMailProps($mailList[1], array(PR_SUBJECT));
		$mailPropsC = $this->mailUser->getMailProps($mailList[2], array(PR_SUBJECT));

		$this->assertEquals($mailPropsA[PR_SUBJECT], 'A', 'Test that the first message is there into the drafts folder');
		$this->assertEquals($mailPropsB[PR_SUBJECT], 'B', 'Test that the second message is there into the drafts folder');
		$this->assertEquals($mailPropsC[PR_SUBJECT], 'new mail', 'Test that the third message is there into the drafts folder');
	}
}
?>
