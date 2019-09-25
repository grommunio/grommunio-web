<?php
require_once('classes/KopanoUser.php');
require_once('classes/NoteUser.php');
require_once('classes/TestData.php');
require_once('classes/KopanoTest.php');

/**
 * LoadNoteTest
 *
 * Tests all possible cases for loading Sticky Notes
 */
class LoadNoteTest extends KopanoTest {
	/**
	 * The default user
	 */
	private $user;

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

		$this->message = array(
			'props' => TestData::getNote(),
		);
	}

	/**
	 * Test loading Sticky Notes without using any restrictions.
	 */
	public function testLoadAllNotes()
	{
		$this->user->saveNote($this->message);
		$notes = $this->user->loadNotes();

		$this->assertCount(1, $notes, 'Test that all notes can be loaded without a restriction');
	}
}
?>

