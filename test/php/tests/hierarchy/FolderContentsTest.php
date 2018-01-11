<?php
require_once('classes/KopanoUser.php');
require_once('classes/HierarchyUser.php');
require_once('classes/MailUser.php');
require_once('classes/TestData.php');
require_once('classes/KopanoTest.php');

/**
 * FolderContentsTest
 *
 * Tests for updating (empty, mark all as read) folders
 */
class FolderContentsTest extends KopanoTest {

	/**
	 * The user for which we will open the hierarchy
	 */
	private $user;

	/**
	 * The user which will be delivering the mail
	 */
	private $mailUser;

	/**
	 * The message which will be handled
	 */
	private $message;

	/**
	 * During setup we create the user, and clear the shared stores settings
	 */
	protected function setUp()
	{
		parent::setUp();

		$this->user = $this->addUser(new HierarchyUser(new KopanoUser(KOPANO_USER1_NAME, KOPANO_USER1_PASSWORD)));
		$this->mailUser = $this->addUser(new MailUser(new KopanoUser(KOPANO_USER1_NAME, KOPANO_USER1_PASSWORD)));

		$this->message = array(
			'props' => TestData::getMail(),
			'recipients' => array(
				'add' => array(
					$this->user->getRecipient()
				)
			)
		);
	}

	/**
	 * Test the response from the 'emptyfolder' request
	 */
	public function testEmptyFolder()
	{
		$inboxFolder = $this->user->getReceiveFolderEntryID();
		$this->mailUser->setDefaultTestFolderEntryId($inboxFolder);
		$this->mailUser->saveMail($this->message);
		$receivedMails = $this->mailUser->getAllReceivedMails();
		$result = $this->user->emptyFolder($inboxFolder);

		$this->assertArrayHasKey('folders', $result, 'Test that the response contains the \'folders\' object');
		$this->assertEquals(bin2hex($inboxFolder), $result['folders']['entryid'], 'Test that the response contains the correct folder');
		$this->assertArrayHasKey('props', $result['folders'], 'Test that the response contains the \'props\' object');
		$this->assertEquals('Inbox', $result['folders']['props']['display_name'], 'Test that the response contains the Inbox folder');
		$this->assertEquals(0, $result['folders']['props']['content_count'], 'Test that the returned folder has the content_count of 0');
		$this->assertEquals(0, $result['folders']['props']['content_unread'], 'Test that the returned folder has the content_unread of 0');

		$emptyFolderMails = $this->mailUser->getInboxMails();

		$this->assertCount(1, $receivedMails, 'Test that before emptying the folder, it was non-empty');
		$this->assertCount(0, $emptyFolderMails, 'Test that after emptying the folder, it is empty');
	}

	/**
	 * Test the response from the 'readflags' request
	 */
	public function testMarkContentsAsRead()
	{
		$inboxFolder = $this->user->getReceiveFolderEntryID();
		$this->mailUser->setDefaultTestFolderEntryId($inboxFolder);
		$sentMail = $this->mailUser->saveMail($this->message);
		mapi_setprops($sentMail, array(PR_MESSAGE_FLAGS => MSGFLAG_UNMODIFIED));

		$receivedMails = $this->mailUser->getAllReceivedMails();
		$receivedProps = $this->mailUser->getMailProps($receivedMails[0], array(PR_MESSAGE_FLAGS));
		$result = $this->user->markAllAsRead($inboxFolder);

		$this->assertArrayHasKey('folders', $result, 'Test that the response contains the \'folders\' object');
		$this->assertEquals(bin2hex($inboxFolder), $result['folders']['entryid'], 'Test that the response contains the correct folder');
		$this->assertArrayHasKey('props', $result['folders'], 'Test that the response contains the \'props\' object');
		$this->assertEquals('Inbox', $result['folders']['props']['display_name'], 'Test that the response contains the Inbox folder');
		$this->assertEquals(1, $result['folders']['props']['content_count'], 'Test that the returned folder has the content_count of 0');
		$this->assertEquals(0, $result['folders']['props']['content_unread'], 'Test that the returned folder has the content_unread of 0');

		$readFolderMails = $this->mailUser->getAllReceivedMails();
		$readFolderProps = $this->mailUser->getMailProps($readFolderMails[0], array(PR_MESSAGE_FLAGS));

		$this->assertMaskNotEquals(MSGFLAG_READ, $receivedProps[PR_MESSAGE_FLAGS], 'Test that before marking the contents as read, the mail was unread');
		$this->assertMaskEquals(MSGFLAG_READ, $readFolderProps[PR_MESSAGE_FLAGS], 'Test that after marking the contents as read, the mail was marked as read');
	}
}

?>
