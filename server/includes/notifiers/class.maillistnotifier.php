<?php

require_once __DIR__ . '/class.listnotifier.php';

/**
 * MailListNotifier.
 *
 * Generates notifications for changes to the
 * Mail Folder contents.
 */
class MailListNotifier extends ListNotifier {
	/**
	 * Obtain the list of Message Properties which should be returned
	 * to the client when a Message was changed.
	 *
	 * @return array The properties mapping
	 */
	protected function getPropertiesList() {
		return $GLOBALS["properties"]->getMailListProperties();
	}
}
