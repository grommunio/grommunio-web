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

					$messageProps = $this->saveTask($store, $parententryid, $entryid, $action);

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
			if($store && $parententryid) {
				$props = array();
				$props[PR_PARENT_ENTRYID] = $parententryid;
				$props[PR_ENTRYID] = $entryids;

				$storeprops = mapi_getprops($store, array(PR_ENTRYID));
				$props[PR_STORE_ENTRYID] = $storeprops[PR_ENTRYID];

				$result = $this->deleteTask($store, $parententryid, $entryids, $action);

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

		/**
		 * Deletes a task.
		 *
		 * deletes occurrence if task is a recurring item.
		 * @param mapistore $store MAPI Message Store Object
		 * @param string $parententryid parent entryid of the messages to be deleted
		 * @param array $entryids a list of entryids which will be deleted
		 * @param boolean $softDelete flag for soft-deleteing (when user presses Shift+Del)
		 * @return boolean true if action succeeded, false if not
		 */
		function deleteTask($store, $parententryid, $entryids, $action)
		{
			$result = false;

			// If user wants to delete only occurrence then delete this occurrence
			if (!is_array($entryids) && isset($action['deleteFlag'])) {
				$message = mapi_msgstore_openentry($store, $entryids);

				if ($message) {
					if ($action['deleteFlag'] == 'occurrence') {
						$recur = new TaskRecurrence($store, $message);
						$occurrenceDeleted = $recur->deleteOccurrence($action);
					} else if ($action['deleteFlag'] == 'decline' || $action['deleteFlag'] == 'complete') {
						$taskReq = new TaskRequest($store, $message, $GLOBALS["mapisession"]->getSession());

						if ($action['deleteFlag'] == 'decline') $taskReq->doDecline(_("Task Declined:") . " ");
						else if ($action['deleteFlag'] == 'complete') $taskReq->sendCompleteUpdate(_("Task Updated:") . " ", $action, _("Task Completed:") . " ");
					}
				}
			}

			// Deleting occurrence failed, maybe that was its last occurrence, so now we delete whole series.
			if (!isset($occurrenceDeleted) || !$occurrenceDeleted) {
				// If softdelete is set then set it in softDelete variable and pass it for deleteing message.
				$softDelete = isset($action["softdelete"]) ? $action["softdelete"] : false;
				$result = $GLOBALS["operations"]->deleteMessages($store, $parententryid, $entryids, $softDelete);
			} else {
				$result = array('occurrenceDeleted' => true);
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
		 * @param mapistore $store MAPI store of the message
		 * @param string $parententryid Parent entryid of the message (folder entryid, NOT message entryid)
		 * @param array $action Action array containing XML request
		 * @return array of PR_ENTRYID, PR_PARENT_ENTRYID and PR_STORE_ENTRYID properties of modified item
		 */
		function saveTask($store, $parententryid, $entryid, $action)
		{
			$properties = $GLOBALS["properties"]->getTaskProperties();
			$send = isset($action["send"]) ? $action["send"] : false;

			if($store && $parententryid) {
				if(isset($action["props"])) {

					$props = $action["props"];

					if (!isset($action["props"]["entryid"])) {

						// Fetch message store properties of a current store.
						$msgstoreProps = mapi_getprops($store, array(PR_USER_ENTRYID, PR_MDB_PROVIDER, PR_MAILBOX_OWNER_ENTRYID));

						// Get current session and open addressbook
						$addrbook = $GLOBALS["mapisession"]->getAddressbook();

						// Store PR_SENT_REPRESENTING_* properties for task according to store type.
						switch ($msgstoreProps[PR_MDB_PROVIDER])
						{
							case ZARAFA_STORE_PUBLIC_GUID:
								try {
									// Open addressbook entry for current user.
									$userObject = mapi_ab_openentry($addrbook, $msgstoreProps[PR_USER_ENTRYID]);
									$userProps = mapi_getprops($userObject);
									// Store PR_SENDER_* properties for task in props variable.
									$props["sender_email_address"] = $userProps[PR_EMAIL_ADDRESS];
									$props["sender_name"] = $userProps[PR_DISPLAY_NAME];
									$props["sender_address_type"] = $userProps[PR_ADDRTYPE];
									$props["sender_entryid"] = bin2hex($userProps[PR_ENTRYID]);
									$props["sender_search_key"] = bin2hex($userProps[PR_SEARCH_KEY]);

									/**
									 * store type is "public"
									 * Store PR_SENT_REPRESENTING_* properties for task in props variable.
									 */
									$props["sent_representing_entryid"] = bin2hex($userProps[PR_ENTRYID]);
									$props["sent_representing_name"] = $userProps[PR_DISPLAY_NAME];
									$props["sent_representing_address_type"] = $userProps[PR_ADDRTYPE];
									$props["sent_representing_email_address"] = $userProps[PR_EMAIL_ADDRESS];
									$props["sent_representing_search_key"] = bin2hex($userProps[PR_SEARCH_KEY]);
								} catch (MAPIException $e) {
									$e->setHandled();
								}
								break;
							case ZARAFA_SERVICE_GUID:
								// store type is "default"
							case ZARAFA_STORE_DELEGATE_GUID:
								/**
								 * store type is "delegate"
								 * Open addressbook entry for mailbox owner.
								 */
								try {
									$ownerObject = mapi_ab_openentry($addrbook, $msgstoreProps[PR_MAILBOX_OWNER_ENTRYID]);
									$ownerProps = mapi_getprops($ownerObject);
										// Store PR_SENT_REPRESENTING_* properties for task in props variable.
										$props["sent_representing_entryid"] = bin2hex($ownerProps[PR_ENTRYID]);
										$props["sent_representing_name"] = $ownerProps[PR_DISPLAY_NAME];
										$props["sent_representing_address_type"] = $ownerProps[PR_ADDRTYPE];
										$props["sent_representing_email_address"] = $ownerProps[PR_EMAIL_ADDRESS];
										$props["sent_representing_search_key"] = bin2hex($ownerProps[PR_SEARCH_KEY]);
								} catch (MAPIException $e) {
									$e->setHandled();
								}
								break;
						}
					}

					$messageProps = array();
					$recips = array();
					if(isset($action["recipients"]) && is_array($action["recipients"])) {
						$recips = $action["recipients"];
					} else {
						$recips = false;
					}

					if (isset($action["props"]["entryid"]) && !empty($action["props"]["entryid"])) {
						$message = mapi_msgstore_openentry($store, hex2bin($action["props"]["entryid"]));

						if ($message) {
							$messageProps = mapi_getprops($message, array(PR_ENTRYID, PR_PARENT_ENTRYID, PR_STORE_ENTRYID, $properties['recurring']));

							if ((isset($messageProps[$properties['recurring']]) && $messageProps[$properties['recurring']]) ||
								(isset($props['recurring']) && $props['recurring'])) {
								$recur = new TaskRecurrence($store, $message);

								if (isset($props['recurring_reset']) && $props['recurring_reset'] == 1) {
									$msgProps = $recur->setRecurrence($props);
								} else if ((isset($props['complete']) && $props['complete'] == 1)) {
									$msgProps = $recur->markOccurrenceComplete($props);
								}
							}
							mapi_savechanges($message);

							$messageProps = Conversion::mapXML2MAPI($properties, $props);

							$message = $GLOBALS["operations"]->saveMessage($store, $entryid, $parententryid, $messageProps, $messageProps, $recips ? $recips : array(), isset($action['attachments']) ? $action['attachments'] : array(), array());

							if (isset($msgProps) && $msgProps) {
								$messageProps = $msgProps;
							}
						}
					} else {
						$messageProps = Conversion::mapXML2MAPI($properties, $props);
						//New message

						$copyAttachments = false;
						$copyFromMessage = false;

						// we need to copy the original attachments when create task from message.
						if (isset($action['message_action']) && isset($action['message_action']['source_entryid'])) {
							$copyFromMessage = hex2bin($action['message_action']['source_entryid']);
							$copyFromStore = hex2bin($action['message_action']['source_store_entryid']);
							$copyAttachments = true;

							// get resources of store and message
							$copyFromStore = $GLOBALS['mapisession']->openMessageStore($copyFromStore);
							$copyFromMessage = $GLOBALS['operations']->openMessage($copyFromStore, $copyFromMessage);
						}

						$message = $GLOBALS["operations"]->saveMessage($store, $entryid, $parententryid, $messageProps, $messageProps, $recips ? $recips : array(), isset($action['attachments']) ? $action['attachments'] : array(), array(), $copyFromMessage, $copyAttachments);

						// Set recurrence
						if (isset($action['props']['recurring']) && $action['props']['recurring'] == 1) {
							$recur = new TaskRecurrence($store, $message);
							$recur->setRecurrence($props);
						}
					}

					if ($message) {
						// The task may be a delegated task, do an update if needed (will fail for non-delegated tasks)
						$tr = new TaskRequest($store, $message, $GLOBALS["mapisession"]->getSession());

						// @TODO: check whether task is request and not a normal task
						switch($send)
						{
							case "accept":
								$result = $tr->doAccept(_("Task Accepted:") . " ");
								break;
							case "decline":
								$result = $tr->doDecline(_("Task Declined:") . " ");
								break;
							case "request":
								$tr->sendTaskRequest(_("Task Request:") . " ");
								break;
							case "unassign":
								$tr->createUnassignedCopy();
								break;
							case "reclaim":
								$tr->reclaimownership();
								break;
							default:
								if (isset($props["messagechanged"]) && $props["messagechanged"])
									$tr->doUpdate(_("Task Updated:") . " ", _("Task Completed:") . " ");
						}

						// Notify Inbox that task request has been deleted
						if (isset($result) && is_array($result))
							$GLOBALS["bus"]->notify(bin2hex($result[PR_PARENT_ENTRYID]), TABLE_DELETE, $result);
					}
				}
			}

			mapi_savechanges($message);

			// Return message properties that can be sent to the bus to notify changes
			return $messageProps;
		}
	}
?>
