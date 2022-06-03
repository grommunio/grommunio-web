<?php

/**
 * AddressBookNotifier.
 *
 * Generates notifications update AddressBook contents.
 */
class AddressBookNotifier extends Notifier {
	/**
	 * @return Number the event which this module handles
	 */
	public function getEvents() {
		return OBJECT_SAVE;
	}

	/**
	 * If an event elsewhere has occurred, it enters in this method. This method
	 * executes one ore more actions, depends on the event.
	 *
	 * @param int    $event   event
	 * @param string $entryid entryid
	 * @param array  $data    array of data
	 * @param mixed  $props
	 */
	public function update($event, $entryid, $props) {
		switch ($event) {
			case OBJECT_SAVE:
				$this->addNotificationActionData("addressbook", true);
				$GLOBALS["bus"]->addData($this->createNotificationResponseData());
				break;
		}
	}
}
