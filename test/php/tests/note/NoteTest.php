<?php
require_once('classes/KopanoUser.php');
require_once('classes/NoteUser.php');
require_once('classes/TestData.php');
require_once('classes/KopanoTest.php');
require_once('classes/RestoreMessageUser.php');

/**
 * NoteTest
 *
 * Tests small Sicky Note operations (create, delete, open).
 */
class NoteTest extends KopanoTest {
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

		$this->user = $this->addUser(new NoteUser(new KopanoUser(KOPANO_USER1_NAME, KOPANO_USER1_PASSWORD)));
		$this->restoreUser = $this->addUser(new RestoreMessageUser(new KopanoUser(KOPANO_USER1_NAME, KOPANO_USER1_PASSWORD)));
		$this->restoreUser->setDefaultTestFolderEntryId($this->user->getDefaultTestFolderEntryId());

		$this->message = array(
			'props' => TestData::getNote(),
		);
	}

	/**
	 * Test if a Sticky Note can be saved to the Notes folder without problems
	 */
	public function testSavingNotes()
	{
		try {
			$savedNote = $this->user->saveNote($this->message);
		} catch(Exception $e) {
			$this->fail('Test that the Sticky Note can be saved: ' . $e->getMessage() . PHP_EOL . $e->getTraceAsString());
		}

		$this->assertInternalType(PHPUnit_Framework_Constraint_IsType::TYPE_RESOURCE, $savedNote, 'Test that the saved Sticky Note is a resource');
	}

	/**
	 * Test if the Sticky Note is saved into the correct folder
	 */
	public function testSavingNoteFolder()
	{
		$savedNote = $this->user->saveNote($this->message);
		$entryid = $this->user->getNoteProps($savedNote, array(PR_ENTRYID));
		$foundNote = $this->user->getNote($entryid[PR_ENTRYID]);

		$this->assertInternalType(PHPUnit_Framework_Constraint_IsType::TYPE_RESOURCE, $foundNote, 'Test that the found Sticky Note is a resource');
	}

	/**
	 * Test if all properties in the new Sticky Note are correct
	 */
	public function testSavingNoteProperties()
	{
		$savedNote = $this->user->saveNote($this->message);
		$props = $this->user->getNoteProps($savedNote);

		$this->assertEquals($this->message['props']['message_class'], $props[PR_MESSAGE_CLASS], 'Test that the \'PR_MESSAGE_CLASS\' is correctly saved');
		$this->assertEquals($this->message['props']['subject'], $props[PR_SUBJECT], 'Test that the \'PR_SUBJECT\' is correctly saved');
		$this->assertEquals($this->message['props']['body'], $props[PR_BODY], 'Test that the \'PR_BODY\' is correctly saved');
	}

	/**
	 * Test if the Sticky Note can be opened
	 */
	public function testOpeningNote()
	{
		try {
			$savedNote = $this->user->saveNote($this->message);
			$entryid = $this->user->getNoteProps($savedNote, array(PR_ENTRYID));
			$openedNote = $this->user->openNote($entryid[PR_ENTRYID]);
		} catch (Exception $e) {
			$this->fail('Test that the Sticky Note can be opened: ' . $e->getMessage()) . PHP_EOL . $e->getTraceAsString();
		}

		$this->assertArrayHasKey('item', $openedNote, 'Test that the opened Sticky Note returns an \'item\' array');
		$this->assertArrayHasKey('item', $openedNote['item'], 'Test that the \'item\' array contains items');
		$this->assertArrayHasKey('props', $openedNote['item']['item'], 'Test that the item contains properties');
	}

	/**
	 * Test if the opened Sticky Note contains the correct properties
	 */
	public function testOpeningNoteProperties()
	{
		$savedNote = $this->user->saveNote($this->message);
		$entryid = $this->user->getNoteProps($savedNote, array(PR_ENTRYID));
		$openedNote = $this->user->openNote($entryid[PR_ENTRYID]);

		$props = $openedNote['item']['item']['props'];

		$this->assertEquals($this->message['props']['message_class'], $props['message_class'], 'Test that the \'PR_MESSAGE_CLASS\' is correctly obtained');
		$this->assertEquals($this->message['props']['subject'], $props['subject'], 'Test that the \'PR_SUBJECT\' is correctly obtained');
		$this->assertEquals($this->message['props']['body'], $props['body'], 'Test that the \'PR_BODY\' is correctly obtained');
	}

	/**
	 * Test if the Sticky note can be modified by emptying the body
	 */
	public function testUpdatingNoteEmptyBody()
	{
		$savedNote = $this->user->saveNote($this->message);
		$entryid = $this->user->getNoteProps($savedNote, array(PR_ENTRYID, PR_PARENT_ENTRYID, PR_STORE_ENTRYID));
		$openedNote = $this->user->openNote($entryid[PR_ENTRYID]);
		$savedNote = $this->user->saveNote(array(
			'entryid' => bin2hex($entryid[PR_ENTRYID]),
			'parent_entryid' => bin2hex($entryid[PR_PARENT_ENTRYID]),
			'store_entryid' => bin2hex($entryid[PR_STORE_ENTRYID]),
			'props' => array(
				'body' => '',
				'subject' => ''
			)
		));
		$openedNote = $this->user->openNote($entryid[PR_ENTRYID]);
		$props = $openedNote['item']['item']['props'];

		$this->assertEquals($this->message['props']['message_class'], $props['message_class'], 'Test that the \'PR_MESSAGE_CLASS\' is correctly obtained');
		$this->assertEquals('', $props['subject'], 'Test that the \'PR_SUBJECT\' is correctly updated');
		$this->assertEquals('', $props['body'], 'Test that the \'PR_BODY\' is correctly updated');
	}

	/**
	 * Test if a Sticky Note can be deleted
	 */
	public function testDeletingNotes()
	{
		try {
			$savedNote = $this->user->saveNote($this->message);
			$props = $this->user->getNoteProps($savedNote, array(PR_ENTRYID));
			$this->user->deleteNote($props[PR_ENTRYID]);
		} catch (Exception $e) {
			$this->fail('Test that the Sticky Note can be deleted: ' . $e->getMessage() . PHP_EOL . $e->getTraceAsString());
		}

		$note = $this->user->getNote($props[PR_ENTRYID]);

		$this->assertEmpty($note, 'Test that the deleted Sticky Note is no longer in the Notes folder');

		$deletedNote = $this->user->getAllDeletedNotes();

		$this->assertNotEmpty($deletedNote, 'Test that the deleted Note is in the Deleted Items folder');

		$softDeletedNote = $this->restoreUser->loadSoftdeletedItems();

		$this->assertEmpty($softDeletedNote, 'Test that the deleted Note is not there in the Note folder as a soft deleted Note');
	}

	/**
	 * Test if a Note can be Moved
	 */
	public function testMovingNote()
	{
		try {
			$savedNote = $this->user->saveNote($this->message);
			$props = $this->user->getNoteProps($savedNote, array(PR_ENTRYID));
			$this->user->copyNote($props[PR_ENTRYID], array(), true);
		} catch (Exception $e) {
			$this->fail('Test that the Note can be Moved: ' . $e->getMessage() . PHP_EOL . $e->getTraceAsString());
		}

		$noteItems = $this->user->loadNotes(false);

		$this->assertCount(1, $noteItems, 'Test that 1 Note was found in the folder');
		//For simplicity we are moving a message into same folder, so check entryid is the same since we use mapi_copymessages MOVE_MESSAGE
		//true
		$this->assertEquals(bin2hex($props[PR_ENTRYID]), $noteItems[0]['entryid'], 'Test that the entryid is not equal');

		$softdeletedItems = $this->restoreUser->loadSoftdeletedItems();
		$this->assertEmpty($softdeletedItems, 'Test that no messages exists in the soft delete system');
	}

	/**
	 * Test if a Note can be Copied
	 */
	public function testCopyingNote()
	{
		try {
			$savedNote = $this->user->saveNote($this->message);
			$props = $this->user->getNoteProps($savedNote, array(PR_ENTRYID));

			$this->user->copyNote($props[PR_ENTRYID]);
		} catch (Exception $e) {
			$this->fail('Test that the Note can be copied: ' . $e->getMessage() . PHP_EOL . $e->getTraceAsString());
		}

		$noteItems = $this->user->loadNotes();
		$props = $this->user->getNoteProps($noteItems);

		$copy = $props[0];
		$orig = $props[1];

		// Here, test system Copies item into the same folder
		$this->assertCount(2, $props, 'Test that 2 Notes was found in the folder');

		$this->assertNotEquals($copy[PR_ENTRYID], $orig[PR_ENTRYID], 'Test that the entryid is not equal');

		$softdeletedItems = $this->restoreUser->loadSoftdeletedItems();
		$this->assertEmpty($softdeletedItems, 'Test that no messages exists in the soft delete system');
	}
}
?>
