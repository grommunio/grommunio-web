<?php

require_once 'classes/grommunioUser.php';
require_once 'classes/RestoreMessageUser.php';
require_once 'classes/MailUser.php';
require_once 'classes/TestData.php';
require_once 'classes/grommunioTest.php';

/**
 * @internal
 * @coversNothing
 */
class LoadRestoreMessages extends grommunioTest {
	/**
	 * The default user which will be sending request to retrieve soft deleted messages.
	 */
	private $restoreUser;

	/**
	 * The default user which will be sending the mail.
	 */
	private $mailUser;

	/**
	 * The message which will be created and saved.
	 */
	private $message;

	/**
	 * During setUp we create the user.
	 */
	protected function setUp() {
		parent::setUp();

		$this->restoreUser = $this->addUser(new RestoreMessageUser(new grommunioUser(GROMMUNIO_USER1_NAME, GROMMUNIO_USER1_PASSWORD)));
		$this->mailUser = $this->addUser(new MailUser(new grommunioUser(GROMMUNIO_USER1_NAME, GROMMUNIO_USER1_PASSWORD)));

		$this->message = [
			'props' => TestData::getMail(),
		];
	}

	/**
	 * Tests if there is no soft deleted messages.
	 */
	public function testEmptySoftDeletedMessagesList() {
		$softDeletedMessages = $this->restoreUser->loadSoftdeletedItems();

		$this->assertEmpty($softDeletedMessages, 'Test that there is no soft deleted Messages');
	}

	/**
	 * Tests if some messages can be soft deleted from the drafts folder without errors.
	 */
	public function testSoftDeletedMessages() {
		try {
			$savedMail = $this->mailUser->saveMail($this->message);
			$props = $this->mailUser->getMailProps($savedMail, [PR_ENTRYID]);
			$response = $this->mailUser->deleteMail($props[PR_ENTRYID], [], true);
		}
		catch (Exception $e) {
			$this->fail('Test that some messages can be soft deleted: ' . $e->getMessage() . PHP_EOL . $e->getTraceAsString());
		}

		$this->assertArrayHasKey('success', $response, 'Test that the response contains the \'success\' property');

		$mail = $this->mailUser->getMail($props[PR_ENTRYID]);

		$this->assertEmpty($mail, 'Test that the deleted Mail is no longer in the Mail folder');

		$deletedMail = $this->mailUser->getAllDeletedMails();

		$this->assertEmpty($deletedMail, 'Test that the deleted Mail is not in the Deleted Items folder');
	}

	/**
	 * Tests if soft deleted messages are there in soft deleted items list.
	 */
	public function testSoftDeletedMessagesPresentIntoList() {
		try {
			$savedMail = $this->mailUser->saveMail($this->message);
			$props = $this->mailUser->getMailProps($savedMail, [PR_ENTRYID]);
			$this->mailUser->deleteMail($props[PR_ENTRYID], [], true);
		}
		catch (Exception $e) {
			$this->fail('Test that some messages can be soft deleted: ' . $e->getMessage() . PHP_EOL . $e->getTraceAsString());
		}

		$softDeletedMessages = $this->restoreUser->loadSoftdeletedItems();

		$this->assertNotEmpty($softDeletedMessages, 'Test that there is some soft deleted Messages');

		$this->assertEntryIdEquals($softDeletedMessages[0]['entryid'], bin2hex($props[PR_ENTRYID]), 'Test that the correct message is deleted by comparing \'entryid\'');
	}

	/*
	 * Test that the soft deleted message list display with proper 'sort' order
	 */
	public function xtestSoftDeletedMessageSortOrder() {
		$messageObjA = [
			'props' => TestData::getFolder([
				'subject' => 'A',
			]),
		];

		$messageObjB = [
			'props' => TestData::getFolder([
				'subject' => 'B',
			]),
		];

		$messageObjC = [
			'props' => TestData::getFolder([
				'subject' => 'C',
			]),
		];

		$savedMailA = $this->mailUser->saveMail($messageObjA);
		$savedMailB = $this->mailUser->saveMail($messageObjB);
		$savedMailC = $this->mailUser->saveMail($messageObjC);

		$propsA = $this->mailUser->getMailProps($savedMailA, [PR_ENTRYID]);
		$propsB = $this->mailUser->getMailProps($savedMailB, [PR_ENTRYID]);
		$propsC = $this->mailUser->getMailProps($savedMailC, [PR_ENTRYID]);

		$this->mailUser->deleteMail($propsA[PR_ENTRYID], [], true);
		$this->mailUser->deleteMail($propsB[PR_ENTRYID], [], true);
		$this->mailUser->deleteMail($propsC[PR_ENTRYID], [], true);

		$sortOrder = [
			'sort' => [
				0 => [
					'direction' => 'ASC',
					'field' => 'subject',
				],
			],
		];

		$softDeletedMessages = $this->restoreUser->loadSoftdeletedItems($sortOrder);

		$this->assertEquals($softDeletedMessages[0]['props']['subject'], 'A', 'Test that the soft deleted message list is correctly sorted in Ascending order');

		$sortOrder['sort'][0]['direction'] = 'DESC';

		$softDeletedMessages = $this->restoreUser->loadSoftdeletedItems($sortOrder);

		$this->assertEquals($softDeletedMessages[0]['props']['subject'], 'C', 'Test that the soft deleted message list is correctly sorted in Descending order');
	}
}
