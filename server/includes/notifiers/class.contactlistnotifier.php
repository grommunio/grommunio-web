<?php
	require_once(__DIR__ . '/class.listnotifier.php');

	/**
	 * ContactListNotifier
	 *
	 * Generates notifications for changes to the
	 * Contact Folder contents.
	 */
	class ContactListNotifier extends ListNotifier
	{
		/**
		 * Obtain the list of Message Properties which should be returned
		 * to the client when a Message was changed.
		 * @return Array The properties mapping
		 */
		protected function getPropertiesList()
		{
			return $GLOBALS["properties"]->getContactListProperties();
		}
	}
?>
