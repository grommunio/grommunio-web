<?php
require_once('classes/KopanoUser.php');
require_once('classes/ContactUser.php');
require_once('classes/TestData.php');
require_once('classes/KopanoTest.php');
require_once('classes/RestoreMessageUser.php');

/**
 * ContactTest
 *
 * Tests small Contact operations (create, delete, open).
 */
class ContactTest extends KopanoTest {
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

		$this->user = $this->addUser(new ContactUser(new KopanoUser(KOPANO_USER1_NAME, KOPANO_USER1_PASSWORD)));
		$this->restoreUser = $this->addUser(new RestoreMessageUser(new KopanoUser(KOPANO_USER1_NAME, KOPANO_USER1_PASSWORD)));
		$this->restoreUser->setDefaultTestFolderEntryId($this->user->getDefaultTestFolderEntryId());
		
		$this->message = array(
			'props' => TestData::getContact(),
		);
	}

	/**
	 * Test if the Contact is saved into the correct folder
	 */
	public function testSavingContactResult()
	{
		$savedContact = $this->user->saveContact($this->message);
		$entryid = $this->user->getContactProps($savedContact, array(PR_ENTRYID));
		$foundContact = $this->user->getContact($entryid[PR_ENTRYID]);

		$this->assertInternalType(PHPUnit_Framework_Constraint_IsType::TYPE_RESOURCE, $foundContact, 'Test that the found Contact is a resource');
	}

	/**
	 * Test if all properties in the new contact are correct
	 */
	public function testSavingContactProperties()
	{
		$savedContact = $this->user->saveContact($this->message);
		$props = $this->user->getContactProps($savedContact);

		$this->assertEquals($this->message['props']['message_class'], $props[PR_MESSAGE_CLASS], 'Test that the \'PR_MESSAGE_CLASS\' is correctly saved');
		$this->assertEquals($this->message['props']['fileas'], $props[$this->user->getContactPropTags()['fileas']], 'Test that the \'fileas\' is correctly saved');
		$this->assertEquals($this->message['props']['body'], $props[PR_BODY], 'Test that the \'PR_BODY\' is correctly saved');
	}

	/**
	 * Test if the Contact can be opened
	 */
	public function testOpeningContact()
	{
		try {
			$savedContact = $this->user->saveContact($this->message);
			$entryid = $this->user->getContactProps($savedContact, array(PR_ENTRYID));
			$openedContact = $this->user->openContact($entryid[PR_ENTRYID]);
		} catch (Exception $e) {
			$this->fail('Test that the Contact can be opened: ' . $e->getMessage() . PHP_EOL . $e->getTraceAsString());
		}

		$this->assertArrayHasKey('item', $openedContact, 'Test that the opened Contact returns an \'item\' array');
		$this->assertArrayHasKey('item', $openedContact['item'], 'Test that the \'item\' array contains items');
		$this->assertArrayHasKey('props', $openedContact['item']['item'], 'Test that the item contains properties');
	}

	/**
	 * Test if the opened Contact contains the correct properties
	 */
	public function testOpeningContactProperties()
	{
		$savedContact = $this->user->saveContact($this->message);
		$entryid = $this->user->getContactProps($savedContact, array(PR_ENTRYID));
		$openedContact = $this->user->openContact($entryid[PR_ENTRYID]);

		$props = $openedContact['item']['item']['props'];
		$this->assertEquals($this->message['props']['message_class'], $props['message_class'], 'Test that the \'PR_MESSAGE_CLASS\' is correctly obtained');
		$this->assertEquals($this->message['props']['fileas'], $props['fileas'], 'Test that the \'fileas\' is correctly obtained');
		$this->assertEquals($this->message['props']['body'], $props['body'], 'Test that the \'PR_BODY\' is correctly obtained');
	}

	/**
	 * Test if the Contact can be modified by emptying the body
	 */
	public function testUpdatingContactEmptyBody()
	{
		$savedContact = $this->user->saveContact($this->message);
		$entryid = $this->user->getContactProps($savedContact, array(PR_ENTRYID, PR_PARENT_ENTRYID, PR_STORE_ENTRYID));
		$openedContact = $this->user->openContact($entryid[PR_ENTRYID]);
		$savedContact = $this->user->saveContact(array(
			'entryid' => bin2hex($entryid[PR_ENTRYID]),
			'parent_entryid' => bin2hex($entryid[PR_PARENT_ENTRYID]),
			'store_entryid' => bin2hex($entryid[PR_STORE_ENTRYID]),
			'props' => array(
				'body' => '',
				'subject' => ''
			)
		));
		$openedContact = $this->user->openContact($entryid[PR_ENTRYID]);
		$props = $openedContact['item']['item']['props'];

		$this->assertEquals($this->message['props']['message_class'], $props['message_class'], 'Test that the \'PR_MESSAGE_CLASS\' is correctly obtained');
		$this->assertEquals('', $props['subject'], 'Test that the \'PR_SUBJECT\' is correctly updated');
		$this->assertEquals('', $props['body'], 'Test that the \'PR_BODY\' is correctly updated');
	}

	/**
	 * Test if a Contact can be deleted
	 */
	public function testDeletingContacts()
	{
		try {
			$savedContact = $this->user->saveContact($this->message);
			$props = $this->user->getContactProps($savedContact, array(PR_ENTRYID));
			$this->user->deleteContact($props[PR_ENTRYID]);
		} catch (Exception $e) {
			$this->fail('Test that the Contact can be deleted: ' . $e->getMessage() . PHP_EOL . $e->getTraceAsString());
		}

		$contact = $this->user->getContact($props[PR_ENTRYID]);

		$this->assertEmpty($contact, 'Test that the deleted Contact is no longer in the Contacts folder');

		$deletedContact = $this->user->getAllDeletedContacts();

		$this->assertNotEmpty($deletedContact, 'Test that the deleted Contact is in the Deleted Items folder');

		$softDeletedContacts = $this->restoreUser->loadSoftdeletedItems();

		$this->assertEmpty($softDeletedContacts, 'Test that the deleted Contact is not there in the Contact folder as a soft deleted Contact');
	}

	/**
	 * Test if a Contact can be Moved
	 */
	public function testMovingContacts()
	{
		try {
			$savedContact = $this->user->saveContact($this->message);
			$props = $this->user->getContactProps($savedContact, array(PR_ENTRYID));
			$this->user->copyContact($props[PR_ENTRYID], array(), true);
		} catch (Exception $e) {
			$this->fail('Test that the Contact can be Moved: ' . $e->getMessage() . PHP_EOL . $e->getTraceAsString());
		}

		$contactItems = $this->user->loadContacts(false);

		$this->assertCount(1, $contactItems, 'Test that 1 Contact was found in the folder');
		//For simplicity we are moving a message into same folder, so check entryid is changed or not
		$this->assertNotEquals(bin2hex($props[PR_ENTRYID]), $contactItems[0]['entryid'], 'Test that the entryid is not equal');

		$softdeletedItems = $this->restoreUser->loadSoftdeletedItems();
		$this->assertEmpty($softdeletedItems, 'Test that no messages exists in the soft delete system');
	}

	/**
	 * Test if a Contact can be copied
	 */
	public function testCopyingContacts()
	{
		try {
			$savedContact = $this->user->saveContact($this->message);
			$props = $this->user->getContactProps($savedContact, array(PR_ENTRYID));

			$this->user->copyContact($props[PR_ENTRYID]);
		} catch (Exception $e) {
			$this->fail('Test that the Contact can be copied: ' . $e->getMessage() . PHP_EOL . $e->getTraceAsString());
		}

		$contactItems = $this->user->loadContacts();
		$props = $this->user->getContactProps($contactItems);

		$copy = $props[0];
		$orig = $props[1];

		// Here, test system Copies item into the same folder
		$this->assertCount(2, $props, 'Test that 2 Contacts was found in the folder');
		$this->assertNotEquals($copy[PR_ENTRYID], $orig[PR_ENTRYID], 'Test that the entryid is not equal');

		$softdeletedItems = $this->restoreUser->loadSoftdeletedItems();
		$this->assertEmpty($softdeletedItems, 'Test that no messages exists in the soft delete system');
	}
}
?>
