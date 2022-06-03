<?php

/**
 * FilesBrowserNotifier.
 *
 * Generates notifications update Files Grid contents.
 */
class FilesBrowserNotifier extends Notifier {
	/**
	 * @return Number the event which this module handles
	 */
	public function getEvents() {
		return OBJECT_DELETE | OBJECT_SAVE;
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
			case OBJECT_DELETE:
				$this->addNotificationActionData("delete", ["item" => [$props]]);
				$GLOBALS["bus"]->addData($this->createNotificationResponseData());
				break;

			case OBJECT_SAVE:
				$this->addNotificationActionData("update", ["item" => [$props]]);
				$GLOBALS["bus"]->addData($this->createNotificationResponseData());
				break;
		}
	}
}
