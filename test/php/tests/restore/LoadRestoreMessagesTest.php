<?php
require_once('classes/KopanoUser.php');
require_once('classes/RestoreMessageUser.php');
require_once('classes/MailUser.php');
require_once('classes/TestData.php');
require_once('classes/KopanoTest.php');

class LoadRestoreMessages extends KopanoTest {
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
	}

	/**
	 * Tests if there is no soft deleted messages
	 */
	public function testEmptySoftDeletedMessagesList()
	{
		$softDeletedMessages = $this->restoreUser->loadSoftdeletedItems();

		$this->assertEmpty($softDeletedMessages, 'Test that there is no soft deleted Messages');
	}

	/**
	 * Tests if some messages can be soft deleted from the drafts folder without errors
	 */
	public function testSoftDeletedMessages()
	{
		try {
			$savedMail = $this->mailUser->saveMail($this->message);
			$props = $this->mailUser->getMailProps($savedMail, array(PR_ENTRYID));
			$response = $this->mailUser->deleteMail($props[PR_ENTRYID], array(), true);
		} catch(Exception $e) {
			$this->fail('Test that some messages can be soft deleted: ' . $e->getMessage() . PHP_EOL . $e->getTraceAsString());
		}

		$this->assertArrayHasKey('success', $response, 'Test that the response contains the \'success\' property');

		$mail = $this->mailUser->getMail($props[PR_ENTRYID]);

		$this->assertEmpty($mail, 'Test that the deleted Mail is no longer in the Mail folder');

		$deletedMail = $this->mailUser->getAllDeletedMails();

		$this->assertEmpty($deletedMail, 'Test that the deleted Mail is not in the Deleted Items folder');

	}

	/**
	 * Tests if soft deleted messages are there in soft deleted items list
	 */
	public function testSoftDeletedMessagesPresentIntoList()
	{
		try {
			$savedMail = $this->mailUser->saveMail($this->message);
			$props = $this->mailUser->getMailProps($savedMail, array(PR_ENTRYID));
			$this->mailUser->deleteMail($props[PR_ENTRYID], array(), true);
		} catch(Exception $e) {
			$this->fail('Test that some messages can be soft deleted: ' . $e->getMessage() . PHP_EOL . $e->getTraceAsString());
		}

		$softDeletedMessages = $this->restoreUser->loadSoftdeletedItems();

		$this->assertNotEmpty($softDeletedMessages, 'Test that there is some soft deleted Messages');

		$this->assertEntryIdEquals($softDeletedMessages[0]['entryid'], bin2hex($props[PR_ENTRYID]), 'Test that the correct message is deleted by comparing \'entryid\'');
	}

	/*
	 * Test that the soft deleted message list display with proper 'sort' order
	 */
	public function xtestSoftDeletedMessageSortOrder()
	{
		$messageObjA = array(
			'props' => TestData::getFolder(array(
				'subject' => 'A'
			))
		);

		$messageObjB = array(
			'props' => TestData::getFolder(array(
				'subject' => 'B'
			))
		);

		$messageObjC = array(
			'props' => TestData::getFolder(array(
				'subject' => 'C'
			))
		);

		$savedMailA = $this->mailUser->saveMail($messageObjA);
		$savedMailB = $this->mailUser->saveMail($messageObjB);
		$savedMailC = $this->mailUser->saveMail($messageObjC);

		$propsA = $this->mailUser->getMailProps($savedMailA, array(PR_ENTRYID));
		$propsB = $this->mailUser->getMailProps($savedMailB, array(PR_ENTRYID));
		$propsC = $this->mailUser->getMailProps($savedMailC, array(PR_ENTRYID));


		$this->mailUser->deleteMail($propsA[PR_ENTRYID], array(), true);
		$this->mailUser->deleteMail($propsB[PR_ENTRYID], array(), true);
		$this->mailUser->deleteMail($propsC[PR_ENTRYID], array(), true);

		$sortOrder = array(
			'sort' => array(
				0 => array(
					'direction' => 'ASC',
					'field' => 'subject'
				)
			)
		);

		$softDeletedMessages = $this->restoreUser->loadSoftdeletedItems($sortOrder);

		$this->assertEquals($softDeletedMessages[0]['props']['subject'], 'A', 'Test that the soft deleted message list is correctly sorted in Ascending order');

		$sortOrder['sort'][0]['direction'] = 'DESC';

		$softDeletedMessages = $this->restoreUser->loadSoftdeletedItems($sortOrder);

		$this->assertEquals($softDeletedMessages[0]['props']['subject'], 'C', 'Test that the soft deleted message list is correctly sorted in Descending order');
	}
}
?>
