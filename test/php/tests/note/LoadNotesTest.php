<?php
require_once 'classes/grommunioUser.php';
require_once 'classes/NoteUser.php';
require_once 'classes/TestData.php';
require_once 'classes/grommunioTest.php';

/**
 * LoadNoteTest.
 *
 * Tests all possible cases for loading Sticky Notes
 *
 * @internal
 * @coversNothing
 */
class LoadNoteTest extends grommunioTest {
	/**
	 * The default user.
	 */
	private $user;

	/**
	 * The message which will be handled.
	 */
	private $message;

	/**
	 * During setUp we create the user.
	 */
	protected function setUp() {
		parent::setUp();

		$this->user = $this->addUser(new NoteUser(new grommunioUser(GROMMUNIO_USER1_NAME, GROMMUNIO_USER1_PASSWORD)));

		$this->message = [
			'props' => TestData::getNote(),
		];
	}

	/**
	 * Test loading Sticky Notes without using any restrictions.
	 */
	public function testLoadAllNotes() {
		$this->user->saveNote($this->message);
		$notes = $this->user->loadNotes();

		$this->assertCount(1, $notes, 'Test that all notes can be loaded without a restriction');
	}
}
?>

