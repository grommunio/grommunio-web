<?php

/**
 * Task ItemModule
 * Module which opens, creates, saves and deletes an item. It
 * extends the Module class.
 */
class TaskItemModule extends ItemModule {
	/**
	 * Constructor.
	 *
	 * @param int   $id   unique id
	 * @param array $data list of all actions
	 */
	public function __construct($id, $data) {
		parent::__construct($id, $data);

		$this->properties = $GLOBALS["properties"]->getTaskProperties();

		$this->plaintext = false;
	}

	#[Override]
	public function open($store, $entryid, $action) {
		$data = [];

		$message = $GLOBALS['operations']->openMessage($store, $entryid);

		if (empty($message)) {
			return;
		}

		// Open embedded message if requested
		$attachNum = !empty($action['attach_num']) ? $action['attach_num'] : false;
		if ($attachNum) {
			// get message props of sub message
			$parentMessage = $message;
			$message = $GLOBALS['operations']->openMessage($store, $entryid, $attachNum);

			if (empty($message)) {
				return;
			}

			$data['item'] = $GLOBALS['operations']->getEmbeddedMessageProps($store, $message, $this->properties, $parentMessage, $attachNum);
		}
		else {
			$data['item'] = $GLOBALS['operations']->getMessageProps($store, $message, $this->properties, $this->plaintext, true);

			$tr = new TaskRequest($store, $message, $GLOBALS['mapisession']->getSession());
			if ($tr->isTaskRequest() || $tr->isTaskRequestResponse()) {
				$tr->isTaskRequest() ? $tr->processTaskRequest() : $tr->processTaskResponse();
				$task = $tr->getAssociatedTask(false);
				$action["message_action"]["open_task"] = true;
				$data = $this->getMessageProps($store, $entryid, $action, $task);
				$data['item']['props']['task_not_found'] = ($task === false);
			}
		}

		$this->addActionData('item', $data);
		$GLOBALS['bus']->addData($this->getResponseData());
	}

	/**
	 * Function which used to open and get the all properties of the message. if message_action
	 * "open_task" is true then it will open the associated task of task request and return its data item
	 * else return the task request data item.
	 *
	 * @param object $store   MAPI Message Store Object
	 * @param string $entryid entryid of the message
	 * @param object $task    associated task of task request
	 * @param mixed  $action
	 *
	 * @return array $data item properties of given message
	 */
	public function getMessageProps($store, $entryid, $action, $task) {
		if (isset($action["message_action"]["open_task"]) && $action["message_action"]["open_task"] && $task !== false) {
			$taskProps = mapi_getprops($task, [PR_ENTRYID, PR_PARENT_ENTRYID, PR_STORE_ENTRYID]);
			$message = $GLOBALS['operations']->openMessage($store, $taskProps[PR_ENTRYID]);
		}
		else {
			$message = $GLOBALS['operations']->openMessage($store, $entryid);
		}
		$data['item'] = $GLOBALS['operations']->getMessageProps($store, $message, $this->properties, $this->plaintext, true);

		return $data;
	}

	/**
	 * Function which saves an item.
	 *
	 * @param object $store         MAPI Message Store Object
	 * @param string $parententryid parent entryid of the message
	 * @param array  $action        the action data, sent by the client
	 * @param mixed  $entryid
	 */
	#[Override]
	public function save($store, $parententryid, $entryid, $action) {
		if (isset($action["props"])) {
			if (!$store && !$parententryid) {
				if (isset($action["props"]["message_class"])) {
					$store = $GLOBALS["mapisession"]->getDefaultMessageStore();
					$parententryid = $this->getDefaultFolderEntryID($store, $action["props"]["message_class"]);
				}
			}

			if ($store && $parententryid) {
				// Set the message flag for the item
				if (isset($action['props']['message_flags']) && $entryid) {
					$GLOBALS['operations']->setMessageFlag($store, $entryid, $action['props']['message_flags']);
				}

				$messageProps = $this->saveTask($store, $parententryid, $entryid, $action);

				if ($messageProps) {
					$send = $action["message_action"]["send"] ?? false;
					$message = $GLOBALS['operations']->openMessage($store, $messageProps[PR_ENTRYID]);
					$data = $GLOBALS['operations']->getMessageProps($store, $message, $this->properties, $this->plaintext, true);

					// taskupdates property true if assigner as checked "Keep copy of task in task list" checkbox.
					// if it is not checked then it means user don't want assigned task copy in his task list.
					if ($send && isset($data["props"]['taskupdates']) && $data["props"]['taskupdates'] === false) {
						// Hard delete the task if taskupdates property is not true.
						$folder = mapi_msgstore_openentry($store, $parententryid);
						mapi_folder_deletemessages($folder, [$messageProps[PR_ENTRYID]], DELETE_HARD_DELETE);

						$data = Conversion::mapMAPI2XML($this->properties, $messageProps);
						$GLOBALS["bus"]->notify(bin2hex($parententryid), TABLE_DELETE, $messageProps);
					}
					else {
						$GLOBALS["bus"]->notify(bin2hex($parententryid), TABLE_SAVE, $messageProps);
					}
					// Notify To-Do list folder as new task item was created.
					$GLOBALS["bus"]->notify(bin2hex(TodoList::getEntryId()), OBJECT_SAVE, $messageProps);
					$this->addActionData("update", ["item" => $data]);
					$GLOBALS["bus"]->addData($this->getResponseData());
				}
			}
		}
	}

	/**
	 * Function which deletes an item.
	 *
	 * @param object $store         MAPI Message Store Object
	 * @param string $parententryid parent entryid of the message
	 * @param mixed  $entryids
	 * @param array  $action        the action data, sent by the client
	 */
	#[Override]
	public function delete($store, $parententryid, $entryids, $action) {
		if ($store && $parententryid) {
			$props = [];
			$props[PR_PARENT_ENTRYID] = $parententryid;
			$props[PR_ENTRYID] = $entryids;

			$storeprops = mapi_getprops($store, [PR_ENTRYID]);
			$props[PR_STORE_ENTRYID] = $storeprops[PR_ENTRYID];

			$result = $this->deleteTask($store, $parententryid, $entryids, $action);

			if ($result) {
				if (isset($result['occurrenceDeleted']) && $result['occurrenceDeleted']) {
					// Occurrence deleted, update item
					$GLOBALS["bus"]->notify(bin2hex($parententryid), TABLE_SAVE, $props);
				}
				else {
					$GLOBALS["bus"]->notify(bin2hex($parententryid), TABLE_DELETE, $props);
				}
				$this->sendFeedback(true);
			}
		}
	}

	/**
	 * Deletes a task.
	 *
	 * deletes occurrence if task is a recurring item.
	 *
	 * @param mapistore $store         MAPI Message Store Object
	 * @param string    $parententryid parent entryid of the messages to be deleted
	 * @param array     $entryids      a list of entryids which will be deleted
	 * @param mixed     $action
	 *
	 * @return bool true if action succeeded, false if not
	 */
	public function deleteTask($store, $parententryid, $entryids, $action) {
		$result = false;
		$message = mapi_msgstore_openentry($store, $entryids);
		$messageAction = $action["message_action"]["action_type"] ?? false;
		// If user wants to delete only occurrence then delete this occurrence
		if (!is_array($entryids) && $messageAction) {
			if ($message) {
				if ($messageAction == 'occurrence') {
					$recur = new TaskRecurrence($store, $message);
					$occurrenceDeleted = $recur->deleteOccurrence($action);
				}
				elseif ($messageAction == 'declineAndDelete' || $messageAction == 'completeAndDelete') {
					$taskReq = new TaskRequest($store, $message, $GLOBALS["mapisession"]->getSession());
					if ($messageAction == 'declineAndDelete') {
						$taskReq->doDecline();
					}
					elseif ($messageAction == 'completeAndDelete') {
						$taskReq->sendCompleteUpdate();
					}
				}
			}
		}

		// Deleting occurrence failed, maybe that was its last occurrence, so now we delete whole series.
		if (!isset($occurrenceDeleted) || !$occurrenceDeleted) {
			$properties = $GLOBALS["properties"]->getTaskProperties();
			$goid = mapi_getprops($message, [$properties["task_goid"]]);
			// If task is assigned task to assignee and user is trying to delete the task.
			// then we have to remove respective task request(IPM.TaskRequest.Accept/Decline/Update)
			// notification mail from inbox.
			if (isset($goid[$properties["task_goid"]]) && !empty($goid[$properties["task_goid"]])) {
				$taskReq = new TaskRequest($store, $message, $GLOBALS["mapisession"]->getSession());
				$result = $taskReq->deleteReceivedTR();
				if ($result) {
					$GLOBALS["bus"]->notify(bin2hex((string) $result[PR_PARENT_ENTRYID]), TABLE_DELETE, $result);
				}
			}

			// If softdelete is set then set it in softDelete variable and pass it for deleting message.
			$softDelete = $action['message_action']['soft_delete'] ?? false;
			$result = $GLOBALS["operations"]->deleteMessages($store, $parententryid, $entryids, $softDelete);
		}
		else {
			$result = ['occurrenceDeleted' => true];
		}

		return $result;
	}

	/**
	 * Save task item.
	 *
	 * just one step more before saving task message that to support recurrence and task request here. We need
	 * to regenerate task if it is recurring and client has changed either set as complete or delete or
	 * given new start or end date.
	 *
	 * @param mapistore $store         MAPI store of the message
	 * @param string    $parententryid Parent entryid of the message (folder entryid, NOT message entryid)
	 * @param array     $action        Action array containing XML request
	 * @param mixed     $entryid
	 *
	 * @return array of PR_ENTRYID, PR_PARENT_ENTRYID and PR_STORE_ENTRYID properties of modified item
	 */
	public function saveTask($store, $parententryid, $entryid, $action) {
		$properties = $this->properties;
		$messageProps = [];
		$send = $action["message_action"]["send"] ?? false;

		if ($store && $parententryid) {
			if (isset($action["props"])) {
				if (isset($action["entryid"]) && empty($action["entryid"])) {
					$GLOBALS["operations"]->setSenderAddress($store, $action);
				}

				$props = $action["props"];
				$recips = [];
				if (isset($action["recipients"]) && is_array($action["recipients"])) {
					$recips = $action["recipients"];
				}

				if (isset($action["entryid"]) && !empty($action["entryid"])) {
					$message = mapi_msgstore_openentry($store, hex2bin((string) $action["entryid"]));
					if ($message) {
						$messageProps = mapi_getprops($message, [PR_ENTRYID, PR_PARENT_ENTRYID, PR_STORE_ENTRYID, $properties['recurring']]);

						if ((isset($messageProps[$properties['recurring']]) && $messageProps[$properties['recurring']]) ||
							(isset($props['recurring']) && $props['recurring'])) {
							$recur = new TaskRecurrence($store, $message);

							if (isset($props['recurring_reset']) && $props['recurring_reset'] == 1) {
								$msgProps = $recur->setRecurrence($props);
							}
							elseif (isset($props['complete']) && $props['complete'] == 1) {
								$msgProps = $recur->markOccurrenceComplete($props);
							}
						}
						mapi_savechanges($message);

						$messageProps = Conversion::mapXML2MAPI($properties, $props);

						$message = $GLOBALS["operations"]->saveMessage($store, $entryid, $parententryid, $messageProps, $messageProps, $recips, $action['attachments'] ?? [], []);

						if (isset($msgProps) && $msgProps) {
							$messageProps = $msgProps;
						}
					}
				}
				else {
					$messageProps = Conversion::mapXML2MAPI($properties, $props);
					// New message

					$copyAttachments = false;
					$copyFromMessage = false;

					// we need to copy the original attachments when create task from message.
					if (isset($action['message_action'], $action['message_action']['source_entryid'])) {
						$copyFromMessage = hex2bin($action['message_action']['source_entryid']);
						$copyFromStore = hex2bin((string) $action['message_action']['source_store_entryid']);
						$copyAttachments = true;

						// get resources of store and message
						$copyFromStore = $GLOBALS['mapisession']->openMessageStore($copyFromStore);
						$copyFromMessage = $GLOBALS['operations']->openMessage($copyFromStore, $copyFromMessage);
					}

					$message = $GLOBALS["operations"]->saveMessage($store, $entryid, $parententryid, $messageProps, $messageProps, $recips, $action['attachments'] ?? [], [], $copyFromMessage, $copyAttachments, false, false, false);

					// Set recurrence
					if (isset($action['props']['recurring']) && $action['props']['recurring'] == 1) {
						$recur = new TaskRecurrence($store, $message);
						$recur->setRecurrence($props);
					}
				}

				if ($message) {
					$tr = new TaskRequest($store, $message, $GLOBALS["mapisession"]->getSession());
					if ($send) {
						$tr->sendTaskRequest(_("Task Request:") . " ");

						return $messageProps;
					}
					if (isset($action["message_action"]["response_type"]) && $action["message_action"]["response_type"] === tdmtTaskUpd) {
						$tr->doUpdate();

						return $messageProps;
					}
					if (isset($action["message_action"]["action_type"]) && $action["message_action"]["action_type"] === "restoreToTaskList") {
						$deleteTRProps = $tr->deleteReceivedTR();
						if ($deleteTRProps) {
							$GLOBALS["bus"]->notify(bin2hex((string) $deleteTRProps[PR_PARENT_ENTRYID]), TABLE_DELETE, $deleteTRProps);
						}

						return $messageProps;
					}
				}

				mapi_savechanges($message);
			}
		}

		// Return message properties that can be sent to the bus to notify changes
		return $messageProps;
	}
}
