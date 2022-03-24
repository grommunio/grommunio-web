<?php

/**
 * FilesHierarchyNotifier
 *
 * Generates notifications update Files hierarchy contents.
 */
class FilesHierarchyNotifier extends Notifier
{
	/**
	 * @return Number the event which this module handles.
	 */
	public function getEvents()
	{
		return OBJECT_DELETE | OBJECT_SAVE;
	}

	/**
	 * If an event elsewhere has occurred, it enters in this methode. This method
	 * executes one ore more actions, depends on the event.
	 * @param int $event Event.
	 * @param string $entryid Entryid.
	 * @param array $data array of data.
	 */
	public function update($event, $entryid, $props)
	{
		switch ($event) {
			case OBJECT_DELETE:
				$props["folderdelete"] = 1;
				$this->addNotificationActionData("folders", array( "item" => array($props)));
				$GLOBALS["bus"]->addData($this->createNotificationResponseData());
				break;
			case OBJECT_SAVE:
				$this->addNotificationActionData("folders", array( "item" => $props));
				$GLOBALS["bus"]->addData($this->createNotificationResponseData());
				break;
		}
	}
}

?>