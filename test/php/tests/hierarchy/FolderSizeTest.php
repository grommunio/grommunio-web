<?php
require_once('classes/KopanoUser.php');
require_once('classes/HierarchyUser.php');
require_once('classes/MailUser.php');
require_once('classes/TestData.php');
require_once('classes/KopanoTest.php');
require_once('classes/Util.php');

/**
 * FolderSizeTest
 *
 * Tests obtaining folder size information
 */
class FolderPropertiesTest extends KopanoTest {

	/**
	 * The user for which we will open the hierarchy
	 */
	private $user;

	/**
	 * The user which will be saving/sending mail
	 */
	private $mailUser;

	/**
	 * The message which will be saved/send
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
					$this->mailUser->getRecipient()
				)
			)
		);

		// Initialize the folders by sending and saving some mails
		for ($i = 0; $i < 5; $i++) {
			$this->mailUser->saveMail($this->message);
		}

		// Increase mail size
		$this->message['props']['body'] .= 'This extends the body with more text to ensure that we increase the ' .
						   'foldersize a bit more to directly see the foldersize differences';
		$entryid = $this->mailUser->getDefaultTestFolderEntryId();
		$this->mailUser->setDefaultTestFolderEntryId($this->mailUser->getReceiveFolderEntryID());
		for ($i = 0; $i < 5; $i++) {
			$this->mailUser->saveMail($this->message);
		}
		$this->mailUser->setDefaultTestFolderEntryId($entryid);
	}

	/*
	 * Test if the foldersize is correctly calculated for the inbox
	 */
	public function testGetFolderSizeResponse()
	{
		$info = $this->user->getFolderSize();

		$this->assertArrayHasKey('item', $info, 'Test that the response contains the \'item\' key');
		$this->assertArrayHasKey('folders', $info['item'], 'Test that the response contains the \'folders\' key');
		$this->assertEmpty($info['item']['folders']['item'], 'Test that no subfolders are listed for the Inbox');

		$this->assertArrayHasKey('props', $info['item'], 'Test that the response contains the \'props\' key');
		$this->assertEquals('Inbox', $info['item']['props']['display_name'], 'Test that the folder name is correctly set');
		$this->assertNotEquals(0, $info['item']['props']['message_size'], 'Test that the \'message_size\' property is not 0');
		$this->assertGreaterThanOrEqual($info['item']['props']['message_size'], $info['item']['props']['total_message_size'], 'Test that the \'total_message_size\' property is greater or equal to \'message_size\'');
		$this->assertEquals($info['item']['props']['message_size'], $info['item']['props']['total_message_size'], 'Test that the message size and total message size are equal');
	}

	/*
	 * Test if the foldersize is correctly calculated for the entire store
	 */
	public function testGetStoreSizeResponse()
	{
		$entryid = $this->user->getDefaultFolderEntryID(PR_IPM_SUBTREE_ENTRYID);
		$info = $this->user->getFolderSize($entryid);

		$this->assertArrayHasKey('item', $info, 'Test that the response contains the \'item\' key');
		$this->assertArrayHasKey('folders', $info['item'], 'Test that the response contains the \'folders\' key');
		$this->assertNotEmpty($info['item']['folders']['item'], 'Test that no subfolders are listed for the Inbox');

		$this->assertArrayHasKey('props', $info['item'], 'Test that the response contains the \'props\' key');
		$this->assertEquals('Inbox - ' . KOPANO_USER1_DISPLAY_NAME, $info['item']['props']['display_name'], 'Test that the folder name is correctly set');
		$this->assertNotEquals(0, $info['item']['props']['message_size'], 'Test that the \'message_size\' property is not 0');
		$this->assertGreaterThanOrEqual($info['item']['props']['message_size'], $info['item']['props']['total_message_size'], 'Test that the \'total_message_size\' property is greater or equal to \'message_size\'');
		$this->assertNotEquals($info['item']['props']['message_size'], $info['item']['props']['total_message_size'], 'Test that the message size and total message size are equal');
	}

	/*
	 * Test if the subfolders are property shown
	 */
	public function testSubFolderSizeResponse()
	{
		$entryid = $this->user->getDefaultFolderEntryID(PR_IPM_SUBTREE_ENTRYID);
		$info = $this->user->getFolderSize($entryid);
		$inboxentryid = $this->user->getReceiveFolderEntryID();
		$inboxinfo = $this->user->getFolderSize($inboxentryid);
		$sententryid = $this->user->getDefaultFolderEntryID(PR_IPM_SENTMAIL_ENTRYID);
		$sentinfo = $this->user->getFolderSize($sententryid);
		$wasteentryid = $this->user->getDefaultFolderEntryID(PR_IPM_WASTEBASKET_ENTRYID);
		$wasteinfo = $this->user->getFolderSize($wasteentryid);

		$inbox = Util::searchInArray($info['item']['folders']['item'], 'entryid', bin2hex($inboxentryid));
		$this->assertNotNull($inbox, 'Test that the folders array contained the Inbox');
		$this->assertArrayHasKey('props', $inbox, 'Test that the Inbox entry has props');
		$this->assertEquals('Inbox', $inbox['props']['folder_pathname'], 'Test that the \'folder_pathname\' property in Inbox is correctly set');
		$this->assertEquals('Inbox', $inbox['props']['display_name'], 'Test that the \'display_name\' property in Inbox is correctly set');
		$this->assertEquals(MAPI_FOLDER, $inbox['props']['object_type'], 'Test that the \'object_type\' property in Inbox is correctly set');
		$this->assertEquals($inboxinfo['item']['props']['message_size'], $inbox['props']['message_size'], 'Test that the \'message_size\' in Inbox property is correct');
		$this->assertEquals($inboxinfo['item']['props']['total_message_size'], $inbox['props']['total_message_size'], 'Test that the \'total_message_size\' in Inbox property is correct');

		$sent = Util::searchInArray($info['item']['folders']['item'], 'entryid', bin2hex($sententryid));
		$this->assertNotNull($sent, 'Test that the folders array contained the Sent items');
		$this->assertArrayHasKey('props', $sent, 'Test that the Sent items entry has props');
		$this->assertEquals('Sent Items', $sent['props']['folder_pathname'], 'Test that the \'folder_pathname\' property in Sent items is correctly set');
		$this->assertEquals('Sent Items', $sent['props']['display_name'], 'Test that the \'display_name\' property in Sent items is correctly set');
		$this->assertEquals(MAPI_FOLDER, $sent['props']['object_type'], 'Test that the \'object_type\' property in Sent items is correctly set');
		$this->assertEquals($sentinfo['item']['props']['message_size'], $sent['props']['message_size'], 'Test that the \'message_size\' property in Sent items is correct');
		$this->assertEquals($sentinfo['item']['props']['total_message_size'], $sent['props']['total_message_size'], 'Test that the \'total_message_size\' property in Sent items is correct');

		$waste = Util::searchInArray($info['item']['folders']['item'], 'entryid', bin2hex($wasteentryid));
		$this->assertNotNull($waste, 'Test that the folders array contained the Deleted items');
		$this->assertArrayHasKey('props', $waste, 'Test that the Deleted items entry has props');
		$this->assertEquals('Deleted Items', $waste['props']['folder_pathname'], 'Test that the \'folder_pathname\' property in Deleted items is correctly set');
		$this->assertEquals('Deleted Items', $waste['props']['display_name'], 'Test that the \'display_name\' property in Deleted items is correctly set');
		$this->assertEquals(MAPI_FOLDER, $waste['props']['object_type'], 'Test that the \'object_type\' property in Deleted items is correctly set');
		$this->assertEquals($wasteinfo['item']['props']['message_size'], $waste['props']['message_size'], 'Test that the \'message_size\' property in Deleted items is correct');
		$this->assertEquals($wasteinfo['item']['props']['total_message_size'], $waste['props']['total_message_size'], 'Test that the \'total_message_size\' property in Deleted items is correct');
	}
}

?>
