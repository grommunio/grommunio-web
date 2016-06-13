<?php
	include_once(__DIR__ . '/../mapi/class.taskrecurrence.php');
	include_once(__DIR__ . '/../mapi/class.taskrequest.php');

	/**
	 * Task ItemModule
	 * Module which openes, creates, saves and deletes an item. It 
	 * extends the Module class.
	 */
	class TaskItemModule extends ItemModule
	{
		/**
		 * Constructor
		 * @param int $id unique id.
		 * @param array $data list of all actions.
		 */
		function __construct($id, $data)
		{
			$this->properties = $GLOBALS["properties"]->getTaskProperties();
			
			parent::__construct($id, $data);

			$this->plaintext = true;
		}

		function open($store, $entryid, $action)
		{
			$data = array();

			$message = $GLOBALS['operations']->openMessage($store, $entryid);

			if(empty($message)) {
				return;
			}

			// Open embedded message if requested
			$attachNum = !empty($action['attach_num']) ? $action['attach_num'] : false;
			if($attachNum) {
				// get message props of sub message
				$parentMessage = $message;
				$message = $GLOBALS['operations']->openMessage($store, $entryid, $attachNum);

				if(empty($message)) {
					return;
				}

				$data['item'] = $GLOBALS['operations']->getEmbeddedMessageProps($store, $message, $this->properties, $parentMessage, $attachNum);
			} else {
				$data['item'] = $GLOBALS['operations']->getMessageProps($store, $message, $this->properties, $this->plaintext);

				$tr = new TaskRequest($store, $message, $GLOBALS['mapisession']->getSession());

				if($tr->isTaskRequest()) {
					$tr->processTaskRequest();
					$task = $tr->getAssociatedTask(false);

					$taskprops = mapi_getprops($task, array(PR_ENTRYID));
					$entryid = $taskprops[PR_ENTRYID];
				}

				if($tr->isTaskRequestResponse()) {
					$tr->processTaskResponse();
					$task = $tr->getAssociatedTask(false);

					$taskprops = mapi_getprops($task, array(PR_ENTRYID));
					$entryid = $taskprops[PR_ENTRYID];
				}

				// Get the recurrence information
				$recur = new Taskrecurrence($store, $message);
				$recurpattern = $recur->getRecurrence();

				// Add the recurrence pattern to the data
				if(isset($recurpattern) && is_array($recurpattern)) {
					$data['item'] += $recurpattern;
				}
			}

			$this->addActionData('item', $data);
			$GLOBALS['bus']->addData($this->getResponseData());
		}

		/**
		 * Function which saves an item.
		 * @param object $store MAPI Message Store Object
		 * @param string $parententryid parent entryid of the message
		 * @param array $action the action data, sent by the client
		 * @return boolean true on success or false on failure		 		 
		 */
		function save($store, $parententryid, $entryid, $action)
		{
			if(isset($action["props"])) {
				$props = $action["props"];
				
				if(!$store && !$parententryid) {
					if(isset($action["props"]["message_class"])) {
						$store = $GLOBALS["mapisession"]->getDefaultMessageStore();
						$parententryid = $this->getDefaultFolderEntryID($store, $action["props"]["message_class"]);
					}
				}

				if ($store && $parententryid) {
					// Set the message flag for the item
					if(isset($action['props']['message_flags']) && $entryid) {
						$GLOBALS['operations']->setMessageFlag($store, $entryid, $action['props']['message_flags']);
					}

					$messageProps = $GLOBALS["operations"]->saveTask($store, $parententryid, $entryid, $action);

					if($messageProps) {
						$data = array();
						$data["entryid"] = bin2hex($messageProps[PR_ENTRYID]);
						$data["parent_entryid"] = bin2hex($messageProps[PR_PARENT_ENTRYID]);
						$data["store_entryid"] = bin2hex($messageProps[PR_STORE_ENTRYID]);
						$this->addActionData("update", array("item" => $data));
						$GLOBALS["bus"]->addData($this->getResponseData());

						$GLOBALS["bus"]->notify(bin2hex($parententryid), TABLE_SAVE, $messageProps);
					}
				}
			}
		}

		/**
		 * Function which deletes an item.
		 * @param object $store MAPI Message Store Object
		 * @param string $parententryid parent entryid of the message
		 * @param string $entryid entryid of the message		 
		 * @param array $action the action data, sent by the client
		 * @return boolean true on success or false on failure		 		 
		 */
		function delete($store, $parententryid, $entryids, $action)
		{
			$send = isset($action["message_action"]["send"]) ? $action["message_action"]["send"] : false;

			if($store && $parententryid) {
				$props = array();
				$props[PR_PARENT_ENTRYID] = $parententryid;
				$props[PR_ENTRYID] = $entryids;

				$storeprops = mapi_getprops($store, array(PR_ENTRYID));
				$props[PR_STORE_ENTRYID] = $storeprops[PR_ENTRYID];

				$result = $GLOBALS["operations"]->deleteTask($store, $parententryid, $entryids, $action);

				if ($result) {
					if (isset($result['occurrenceDeleted']) && $result['occurrenceDeleted']) {
						// Occurrence deleted, update item
						$GLOBALS["bus"]->notify(bin2hex($parententryid), TABLE_SAVE, $props);
					} else {
						$GLOBALS["bus"]->notify(bin2hex($parententryid), TABLE_DELETE, $props);
					}
					$this->sendFeedback(true);
				}
			}
		}
	}
?>
