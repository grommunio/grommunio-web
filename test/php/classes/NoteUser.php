<?php

require_once 'IPMUser.php';
require_once 'Restriction.php';

/**
 * NoteUser.
 *
 * An extension to the IPMUser to represent a user which
 * uses his notes (e.g. saving notes).
 */
class NoteUser extends IPMUser {
	/**
	 * Initialize the TestUser.
	 */
	protected function initialize() {
		parent::initialize();

		$this->logon();

		$this->defaultStoreEntryId = $this->getDefaultMessageStoreEntryID();
		$this->defaultFolderEntryId = $this->getDefaultFolderEntryID(PR_IPM_NOTE_ENTRYID);
		$this->defaultItemModule = 'stickynoteitemmodule';
		$this->defaultListModule = 'stickynotelistmodule';
	}

	/**
	 * Save a Sticky Notes to the notes folder.
	 *
	 * @param array $message The message which should be saved
	 * @param bool  $open    true if the saved item should be opened, otherwise the
	 *                       saved properties will be returned
	 *
	 * @return MAPI_MESSAGE The saved message
	 */
	public function saveNote($message, $open = true) {
		$this->logon();

		return $this->saveItem($message, $open);
	}

	/**
	 * Open the given Sticky Note from the notes folder.
	 *
	 * @param Binary $entryid    The entryid of the item which should be deleted
	 * @param array  $extraProps The array of extra properties which should be
	 *                           send to the server together with this request
	 *
	 * @return array The response from the PHP
	 */
	public function openNote($entryid, $extraProps = []) {
		$this->logon();

		return $this->openItem($entryid, $extraProps);
	}

	/**
	 * Delete the given Sticky Note from the notes folder.
	 *
	 * @param Binary $entryid    The entryid of the item which should be deleted
	 * @param array  $extraProps The array of extra properties which should be
	 *                           send to the server together with this request
	 *
	 * @return array The response from the PHP
	 */
	public function deleteNote($entryid, $extraProps = []) {
		$this->logon();

		return $this->deleteItem($entryid, $extraProps);
	}

	/**
	 * Copy/Move the given Note.
	 *
	 * @param Binary $entryid    The entryid of the item which should be copied/moved
	 * @param array  $extraProps The array of extra properties which should be
	 *                           send to the server together with this request
	 * @param bool   $move       True to move the item rather then copy
	 *
	 * @return array The response from the PHP
	 */
	public function copyNote($entryid, $extraProps = [], $move = false) {
		$this->logon();

		return $this->copyItem($entryid, $extraProps, $move);
	}

	/**
	 * Load all Sticky Notes from the notes folder.
	 *
	 * @param bool $open true if the saved item should be opened, otherwise the
	 *                   item props will be returned
	 *
	 * @return array The array of items for the given range
	 */
	public function loadNotes($open = true) {
		$this->logon();

		return $this->loadItems([], $open);
	}

	/**
	 * Obtains the note from the default folder based on the entryid.
	 *
	 * @param Binary $entryid The entryid of the item to obtain
	 * @param bool   $open    true if the found item should be opened, otherwise the
	 *                        entryid's will be returned
	 *
	 * @return mixed The note with the given entryid
	 */
	public function getNote($entryid, $open = true) {
		$this->logon();
		$items = $this->getItems(Restriction::ResProperty(PR_ENTRYID, $entryid, RELOP_EQ), $open);

		return array_shift($items);
	}

	/**
	 * Obtains the note from the wastebasket folder based on the entryid.
	 *
	 * @param Binary $entryid The entryid of the item to obtain
	 * @param bool   $open    true if the found item should be opened, otherwise the
	 *                        entryid's will be returned
	 *
	 * @return mixed The note with the given entryid
	 */
	public function getDeletedNote($entryid, $open = true) {
		$this->logon();
		$items = $this->getDeletedItems(Restriction::ResProperty(PR_ENTRYID, $entryid, RELOP_EQ), $open);

		return array_shift($items);
	}

	/**
	 * Obtain all notes which are present in the wastebastet folder.
	 *
	 * @param bool $open true if the found item should be opened, otherwise the
	 *                   entryid's will be returned
	 *
	 * @return array list of items
	 */
	public function getAllDeletedNotes($open = true) {
		$this->logon();

		return $this->getDeletedItems(Restriction::ResContent(PR_MESSAGE_CLASS, 'IPM.StickyNote', FL_SUBSTRING | FL_IGNORECASE), $open);
	}

	/**
	 * Obtain the properties for the note.
	 *
	 * @param array $items array of the MAPI_MESSAGES
	 * @param array $tags  the list of property tags to fetch
	 *
	 * @return array returns array of props of all MAPI_MESSAGE items passed to the function
	 */
	public function getNoteProps($items, $tags = []) {
		$this->logon();

		return $this->getItemProps($items, $tags);
	}
}
