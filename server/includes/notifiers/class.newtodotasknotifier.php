<?php

/**
 * NewTodoTaskNotifier
 *
 * Generates notifications update To-Do list folder.
 */
class NewTodoTaskNotifier extends Notifier
{
	/**
	 * @return Number the event which this module handles.
	 */
	public function getEvents()
	{
		return OBJECT_SAVE;
	}

	/**
	 * If an event elsewhere has occurred, it enters in this methode. This method
	 * executes one or more actions, depends on the event.
	 * @param int $event Event.
	 * @param string $entryid Entryid.
	 * @param array $data array of data.
	 */
	public function update($event, $entryid, $props)
	{
		switch ($event) {
			case OBJECT_SAVE:
				$data['item'][] = array(
					'entryid' =>  $entryid,
					'store_entryid' => bin2hex($props[PR_STORE_ENTRYID])
				);
				$this->addNotificationActionData("newtodotask", $data);
				$GLOBALS["bus"]->addData($this->createNotificationResponseData());
				break;
		}
	}
}

?>
