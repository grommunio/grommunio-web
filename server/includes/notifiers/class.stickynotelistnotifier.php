<?php
	require_once(__DIR__ . '/class.listnotifier.php');

	/**
	 * StickyNoteListNotifier
	 *
	 * Generates notifications for changes to the
	 * StickyNote Folder contents.
	 */
        class StickyNoteListNotifier extends ListNotifier
	{
		/**
		 * Obtain the list of Message Properties which should be returned
		 * to the client when a Message was changed.
		 * @return Array The properties mapping
		 */
		protected function getPropertiesList()
		{
			return $GLOBALS["properties"]->getStickyNoteListProperties();
		}
	}
?>
