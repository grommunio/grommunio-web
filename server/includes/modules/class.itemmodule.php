<?php
	/**
	 * ItemModule
	 * Module which openes, creates, saves and deletes an item. It
	 * extends the Module class.
	 */
	class ItemModule extends Module
	{
		/**
		 * The setting whether Meeting Requests should be booked directly or not.
		 */
		public $directBookingMeetingRequest;

		/**
		 * The array of properties which should not be copied during the copy() action.
		 */
		public $skipCopyProperties;

		/**
		 * Indicates that we are supporting only plain text body in the message props
		 */
		public $plaintext;

		/**
		 * Constructor
		 * @param int $id unique id.
		 * @param array $data list of all actions.
		 */
		function __construct($id, $data)
		{
			$this->directBookingMeetingRequest = ENABLE_DIRECT_BOOKING;
			$this->skipCopyProperties = array();
			$this->plaintext = false;

			parent::__construct($id, $data);
		}

		/**
		 * Executes all the actions in the $data variable.
		 * @return boolean true on success of false on fialure.
		 */
		function execute()
		{
			foreach($this->data as $actionType => $action)
			{
				if(isset($actionType)) {
					try {
						$store = $this->getActionStore($action);
						$parententryid = $this->getActionParentEntryID($action);
						$entryid = $this->getActionEntryID($action);

						switch($actionType)
						{
							case "open":
								$this->open($store, $entryid, $action);
								break;
							case "save":
								if ($store && $parententryid) {
									/*
									 * The "message_action" object has been set, check the action_type field for
									 * the exact action which must be taken.
									 * Supported actions:
									 *   - acceptmeetingrequest: attendee has accepted mr
									 *   - declineMeetingRequest: attendee has declined mr
									 */
									if (isset($action["message_action"]) && isset($action["message_action"]["action_type"])) {
										switch($action["message_action"]["action_type"])
										{
											case "declineMeetingRequest":
											case "acceptMeetingRequest":
												$message = $GLOBALS["operations"]->openMessage($store, $entryid);
												$basedate = (isset($action['basedate']) ? $action['basedate'] : false);
												$delete = false;

												if($basedate) {
													$recurrence = new Recurrence($store, $message);
													$exceptionatt = $recurrence->getExceptionAttachment($basedate);
													if($exceptionatt) {
														//get properties of existing exception.
														$exceptionattProps = mapi_getprops($exceptionatt, array(PR_ATTACH_NUM));
														$attach_num = $exceptionattProps[PR_ATTACH_NUM];
													}
												}

												/**
												 * Get message class from original message. This can be changed to
												 * IPM.Appointment if the item is a Meeting Request in the maillist.
												 * After Accepting/Declining the message is moved and changed.
												 */
												$originalMessageProps = mapi_getprops($message, array(PR_MESSAGE_CLASS));
												$req = new Meetingrequest($store, $message, $GLOBALS["mapisession"]->getSession(), $this->directBookingMeetingRequest);

												// Update extra body information
												if(isset($action["message_action"]['meetingTimeInfo']) && !empty($action["message_action"]['meetingTimeInfo'])) {
													$req->setMeetingTimeInfo($action["message_action"]['meetingTimeInfo']);
													unset($action["message_action"]['meetingTimeInfo']);
												}

												// sendResponse flag if it is set then send the mail response to the organzer.
												$sendResponse = true;
												if(isset($action["message_action"]["sendResponse"]) && $action["message_action"]["sendResponse"] == false) {
													$sendResponse = false;
												}

												// @FIXME: fix body
												$body = false;
												if (isset($action["props"]["isHTML"]) && $action["props"]["isHTML"] === true) {
													$body = isset($action["props"]["html_body"]) ? $action["props"]["html_body"] : false;
												} else {
													$body = isset($action["props"]["body"]) ? $action["props"]["body"] : false;
												}

												if($action["message_action"]["action_type"] == "acceptMeetingRequest") {
													$tentative = $action["message_action"]["responseType"] === olResponseTentative;
													$newProposedStartTime = isset($action["message_action"]["proposed_starttime"]) ? $action["message_action"]["proposed_starttime"] : false;
													$newProposedEndTime = isset($action["message_action"]["proposed_endtime"]) ? $action["message_action"]["proposed_endtime"] : false;

													// We are accepting MR from preview-read-mail so set delete the actual mail flag.
													$delete = $req->isMeetingRequest($originalMessageProps[PR_MESSAGE_CLASS]);

													$req->doAccept($tentative, $sendResponse, $delete, $newProposedStartTime, $newProposedEndTime, $body, true, $store, $basedate);
												} else {
													$delete = $req->doDecline($sendResponse, $basedate, $body);
												}

												// Publish updated free/busy information
												$GLOBALS["operations"]->publishFreeBusy($store);

												/**
												 * Now if the item is the Meeting Request that was sent to the attendee
												 * it is removed when the user has clicked on Accept/Decline. If the
												 * item is the appointment in the calendar it will not be moved. To only
												 * notify the bus when the item is a Meeting Request we are going to
												 * check the PR_MESSAGE_CLASS and see if it is "IPM.Meeting*".
												 */
												$messageProps = mapi_getprops($message, array(PR_ENTRYID, PR_STORE_ENTRYID, PR_PARENT_ENTRYID));

												// if opened appointment is exception then it will add 
												// the attach_num and basedate in messageProps.
												if(isset($attach_num)) {
													$messageProps[PR_ATTACH_NUM] = array($attach_num);
													$messageProps[$properties["basedate"]] = $basedate;
												}

												if($delete) {
													// send TABLE_DELETE event because the message has moved
													$this->sendFeedback(true);
													$GLOBALS["bus"]->notify(bin2hex($messageProps[PR_PARENT_ENTRYID]), TABLE_DELETE, $messageProps);
												} else {
													$this->addActionData("update", array("item" => Conversion::mapMAPI2XML($this->properties, $messageProps)));
													$GLOBALS["bus"]->addData($this->getResponseData());

													// send TABLE_SAVE event because an occurrence is deleted
													$GLOBALS["bus"]->notify(bin2hex($messageProps[PR_PARENT_ENTRYID]), TABLE_SAVE, $messageProps);
												}

											break;
											case "acceptTaskRequest":
											case "declineTaskRequest":
												$message = $GLOBALS["operations"]->openMessage($store, $entryid);

												if (isset($action["props"]) && !empty($action["props"])) {
													$properties = $GLOBALS["properties"]->getTaskProperties();
													mapi_setprops($message, Conversion::mapXML2MAPI($properties, $action["props"]));
													mapi_savechanges($message);
												}
												// The task may be a delegated task, do an update if needed (will fail for non-delegated tasks)
												$tr = new TaskRequest($store, $message, $GLOBALS["mapisession"]->getSession());
												$isAccept = $action["message_action"]["action_type"] == "acceptTaskRequest";
												if (isset($action["message_action"]["task_comments_info"]) && !empty($action["message_action"]["task_comments_info"])) {
													$tr->setTaskCommentsInfo($action["message_action"]["task_comments_info"]);
												}
												if ($isAccept) {
													$result = $tr->doAccept();
												} else {
													$result = $tr->doDecline();
												}

												$this->sendFeedback(true);
												if($result) {
													$GLOBALS["bus"]->notify(bin2hex($result[PR_PARENT_ENTRYID]), TABLE_DELETE, $result);
												}

												$props = mapi_getprops($message, array(PR_ENTRYID, PR_STORE_ENTRYID, PR_PARENT_ENTRYID));
												if(!$tr->isTaskRequest()) {
													unset($props[PR_MESSAGE_CLASS]);
													$GLOBALS["bus"]->notify(bin2hex($props[PR_PARENT_ENTRYID]), $isAccept ? TABLE_SAVE : TABLE_DELETE, $props);
												}
											break;
											case "copy":
											case "move":
												$this->copy($store, $parententryid, $entryid, $action);
												break;

											case "reply":
											case "replyall":
											case "forward":
											default:
												$this->save($store, $parententryid, $entryid, $action);
										}
									} else {
										$this->save($store, $parententryid, $entryid, $action);
									}
								} else {
									/**
									 * if parententryid or storeentryid is not passed then we can take a guess that
									 * it would be  a save operation but instead of depending on server to get default
									 * parent and store client should always send parententryid and storeentryid
									 *
									 * we can also assume that user has permission to right in his own store
									 */
									$this->save($store, $parententryid, $entryid, $action);
								}
								break;
							case "delete":
								$subActionType = false;
								if (isset($action["message_action"]) && isset($action["message_action"]["action_type"])) {
									$subActionType = $action["message_action"]["action_type"];
								}

								/*
								 * The "message_action" object has been set, check the action_type field for
								 * the exact action which must be taken.
								 * Supported actions:
								 *   - cancelInvitation: organizer cancels already scheduled meeting
								 *   - removeFromCalendar: attendee receives meeting cancellation and wants to remove item from calendar
								 */
								switch($subActionType)
								{
									case "removeFromCalendar":
										$basedate = (isset($action['basedate']) && !empty($action['basedate'])) ? $action['basedate'] : false;

										$this->removeFromCalendar($store, $entryid, $basedate, $this->directBookingMeetingRequest);
										$this->sendFeedback(true);
										break;

									case "cancelInvitation":
										$this->cancelInvitation($store, $entryid, $action, $this->directBookingMeetingRequest);
										$this->sendFeedback(true);
										break;

									case "declineMeeting":
										// @FIXME can we somehow merge declineMeeting and declineMeetingRequest sub actions?
										$message = $GLOBALS["operations"]->openMessage($store, $entryid);
										$basedate = (isset($action['basedate']) && !empty($action['basedate'])) ? $action['basedate'] : false;

										$req = new Meetingrequest($store, $message, $GLOBALS["mapisession"]->getSession(), $this->directBookingMeetingRequest);

										// @FIXME: may be we can remove this body check any get it while declining meeting 'body'
										$body = false;
										if (isset($action["props"]["isHTML"]) && $action["props"]["isHTML"] === true) {
											$body = isset($action["props"]["html_body"]) ? $action["props"]["html_body"] : false;
										} else {
											$body = isset($action["props"]["body"]) ? $action["props"]["body"] : false;
										}
										$req->doDecline(true, $basedate, $body);

										// Publish updated free/busy information
										$GLOBALS["operations"]->publishFreeBusy($store);

										$messageProps = mapi_getprops($message, array(PR_ENTRYID, PR_STORE_ENTRYID, PR_PARENT_ENTRYID));
										$GLOBALS["bus"]->notify(bin2hex($messageProps[PR_PARENT_ENTRYID]), $basedate ? TABLE_SAVE : TABLE_DELETE, $messageProps);

										break;
                                    case "snooze":
                                    case "dismiss":
                                        $this->delete($store, $parententryid, $entryid, $action);
                                        break;

									default:
										// Deleting an occurence means that we have to save the message to
										// generate an exception. So when the basedate is provided, we actually
										// perform a save rather then delete.
										if (isset($action['basedate']) && !empty($action['basedate'])) {
											$this->save($store, $parententryid, $entryid, $action, "delete");
										} else {
											$this->delete($store, $parententryid, $entryid, $action);
											$GLOBALS["operations"]->publishFreeBusy($store, $parententryid);
										}
										break;
								}
								break;
							default:
								$this->handleUnknownActionType($actionType);
						}
					} catch (MAPIException $e) {
						$this->processException($e, $actionType, $store, $parententryid, $entryid, $action);
					}
				}
			}
		}

		/**
		 * Function does customization of exception based on module data.
		 * like, here it will generate display message based on actionType
		 * for particular exception.
		 *
		 * @param object $e Exception object
		 * @param string $actionType the action type, sent by the client
		 * @param MAPIobject $store Store object of message.
		 * @param string $parententryid parent entryid of the message.
		 * @param string $entryid entryid of the message.
		 * @param array $action the action data, sent by the client
		 */
		function handleException(&$e, $actionType = null, $store = null, $parententryid = null, $entryid = null, $action = null)
		{
			if(is_null($e->displayMessage)) {
				switch($actionType)
				{
					case "open":
						if($e->getCode() == MAPI_E_NO_ACCESS) {
							$e->setDisplayMessage(_("You have insufficient privileges to open this message."));
						} elseif($e->getCode() == MAPI_E_NOT_FOUND) {
							$e->setDisplayMessage(_("Could not find message, either it has been moved or deleted or you don't have access to open this message."));
						} else {
							$e->setDisplayMessage(_("Could not open message."));
							$e->allowToShowDetailsMessage = true;
						}
						break;

					case "save":
						if($e->getCode() == MAPI_E_NO_ACCESS) {
							if (!empty($action["message_action"]["action_type"])) {
								switch($action["message_action"]["action_type"])
								{
									case "declineMeetingRequest":
										$e->setDisplayMessage(_("You have insufficient privileges to decline this Meeting Request") . ".");
										break;
									case "acceptMeetingRequest":
										$e->setDisplayMessage(_("You have insufficient privileges to accept this Meeting Request") . ".");
										break;
									case "copy":
										$e->setDisplayMessage(_("Could not copy message") . ".");
										break;
									case "move":
										$e->setDisplayMessage(_("Could not move message") . ".");
										break;
								}
							}

							if(empty($e->displayMessage)) {
								$e->setDisplayMessage(_("You have insufficient privileges to save items in this folder") . ".");
							}
						} else if($e->getCode() == MAPI_E_STORE_FULL) {
							$e->setDisplayMessage($this->getOverQuotaMessage($store));
						} else {
							$e->setDisplayMessage(_("Could not save message") . ".");
							$e->allowToShowDetailsMessage = true;
						}
						break;

					case 'delete':
						switch ($e->getCode()) {
							case MAPI_E_NO_ACCESS:
								if (!empty($action['message_action']['action_type'])) {
									switch($action['message_action']['action_type'])
									{
										case 'removeFromCalendar':
											$e->setDisplayMessage(_('You have insufficient privileges to remove item from the calendar.'));
											break;
									}
								}
								break;
							case MAPI_E_NOT_IN_QUEUE:
								$e->setDisplayMessage(_('Message is no longer in the outgoing queue, typically because it has already been sent.'));
								break;
							case MAPI_E_UNABLE_TO_ABORT:
								$e->setDisplayMessage(_('Message cannot be aborted'));
								break;
						}
						if(empty($e->displayMessage)) {
							$e->setDisplayMessage(_("You have insufficient privileges to delete items in this folder") . ".");
						}
						break;

					case "attach_items":
						if($e->getCode() == MAPI_E_NO_ACCESS)
							$e->setDisplayMessage(_("You have insufficient privileges to attach item as an attachment."));
						else
							$e->setDisplayMessage(_("Could not attach item as an attachment."));
						break;

					case "reclaimownership":
						if($e->getCode() == MAPI_E_NO_ACCESS)
							$e->setDisplayMessage(_("You have insufficient privileges to reclaim the ownership for the Task Request."));
						else
							$e->setDisplayMessage(_("Could not reclaim the ownership for the Task Request."));
						break;

					case "acceptTaskRequest":
						if($e->getCode() == MAPI_E_NO_ACCESS)
							$e->setDisplayMessage(_("You have insufficient privileges to accept this Task Request."));
						else
							$e->setDisplayMessage(_("Could not accept Task Request."));
						break;

					case "declineTaskRequest":
						if($e->getCode() == MAPI_E_NO_ACCESS)
							$e->setDisplayMessage(_("You have insufficient privileges to decline this Task Request."));
						else
							$e->setDisplayMessage(_("Could not decline Task Request."));
						break;
				}
				Log::Write(
					LOGLEVEL_ERROR,
					"itemmodule::handleException():". $actionType . ": " . $e->displayMessage,
					$e,
					$action
				);
			}

			parent::handleException($e, $actionType, $store, $parententryid, $entryid, $action);
		}

		/**
		 * Function which opens an item.
		 * @param object $store MAPI Message Store Object
		 * @param string $entryid entryid of the message
		 * @param array $action the action data, sent by the client
		 * @return boolean true on success or false on failure
		 */
		function open($store, $entryid, $action)
		{
			$data = array();

			if($entryid) {
				if($store) {
					$message = $GLOBALS['operations']->openMessage($store, $entryid);
				} else {
					// store is not passed so we need to open the message first to get the store resource
					$message = $GLOBALS['mapisession']->openMessage($entryid);

					$messageStoreInfo = mapi_getprops($message, array(PR_STORE_ENTRYID));
					$store = $GLOBALS['mapisession']->openMessageStore($messageStoreInfo[PR_STORE_ENTRYID]);
				}
			}

			if(empty($message)) {
				return;
			}

			// Decode smime signed messages on this message
 			parse_smime($store, $message);

			// Open embedded message if requested
			$attachNum = !empty($action['attach_num']) ? $action['attach_num'] : false;
			if($attachNum) {
				// get message props of sub message
				$parentMessage = $message;
				$message = $GLOBALS['operations']->openMessage($store, $entryid, $attachNum, true);

				if(empty($message)) {
					return;
				}

				$data['item'] = $GLOBALS['operations']->getEmbeddedMessageProps($store, $message, $this->properties, $parentMessage, $attachNum);
			} else {
				// get message props of the message
				$data['item'] = $GLOBALS['operations']->getMessageProps($store, $message, $this->properties, $this->plaintext);

				$messageClass = !empty($data['item']['props']['message_class']) ? $data['item']['props']['message_class'] : '';

				// Check for meeting request, do processing if necessary
				if(stripos($messageClass, 'IPM.Schedule.Meeting') !== false) {
					$req = new Meetingrequest($store, $message, $GLOBALS['mapisession']->getSession(), $this->directBookingMeetingRequest);

					try {
						if($req->isMeetingRequestResponse()) {
							if($req->isLocalOrganiser()) {
								// We received a meeting request response, and we're the delegate/organiser
								$req->processMeetingRequestResponse();
							}
						} else if($req->isMeetingRequest()) {
							if(!$req->isLocalOrganiser()) {
								if ($req->isMeetingOutOfDate()) {
									// we know that meeting is out of date so directly set this properties
									$data['item']['props']['meetingtype'] = mtgOutOfDate;
									$data['item']['props']['icon_index'] = 1033;

									// send update to maillistmodule that meeting request is updated with out of date flag
									$messageProps = mapi_getprops($message, array(PR_ENTRYID, PR_PARENT_ENTRYID, PR_STORE_ENTRYID));
									$GLOBALS['bus']->notify(bin2hex($messageProps[PR_PARENT_ENTRYID]), TABLE_SAVE, $messageProps);
								} else {
									/**
									 * if meeting request is not out of date then process it for the first time
									 * which will create corresponding appointment in the user's calendar
									 */
									$req->doAccept(true, false, false);

									// Publish updated free/busy information
									$GLOBALS['operations']->publishFreeBusy($store);
								}

								// Show user whether meeting request conflict with other appointment or not.
								$meetingConflicts = $req->isMeetingConflicting();

								/**
								 * if $meetingConflicts is boolean and true then its a normal meeting.
								 * if $meetingConflicts is integer then it indicates no of instances of a recurring meeting which conflicts with Calendar.
								 */
								if($meetingConflicts !== false) {
									if ($meetingConflicts === true) {
										$data['item']['props']['conflictinfo'] = _('Conflicts with another appointment.');
									} else {
										$data['item']['props']['conflictinfo'] = sprintf(ngettext('%s occurrence of this recurring appointment conflicts with other appointment.', '%s occurrences of this recurring appointment conflicts with other appointments.', $meetingConflicts), $meetingConflicts);
									}
								}
							}
						} else if($req->isMeetingCancellation()) {
							$req->processMeetingCancellation();
						}

						if($req->isInCalendar()) {
							$calendarItemProps = $this->getCalendarItemProps($req);
							if (!empty($calendarItemProps)) {
								$data['item']['props'] = array_merge($data['item']['props'], $calendarItemProps);
							}
						} else {
							$data['item']['props']['appointment_not_found'] = true;
						}
					} catch (MAPIException $e) {
						// if quota is exceeded or or we don't have permission to write in calendar folder than ignore the exception.
						if($e->getCode() !== MAPI_E_STORE_FULL && $e->getCode() !== MAPI_E_NO_ACCESS) {
							// re-throw the exception if it is not one of quota/calendar permission.
							throw $e;
						}
					}
				} else if(stripos($messageClass, 'REPORT.IPM.NOTE.NDR') !== false) {
					// check if this message is a NDR (mail)message, if so, generate a new body message
					$data['item']['props']['isHTML'] = false;
					$data['item']['props']['body'] = $this->getNDRbody($message);
				}
			}

			// Allowing to hook in just before the data sent away to be sent to the client
			$GLOBALS['PluginManager']->triggerHook('server.module.itemmodule.open.after', array(
				'moduleObject' =>& $this,
				'store' => $store,
				'entryid' => $entryid,
				'action' => $action,
				'message' =>& $message,
				'data' =>& $data
				));

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
			$result = false;

			if(isset($action["props"])) {
				if(!$store) {
					$store = $GLOBALS['mapisession']->getDefaultMessageStore();
				}
				if(!$parententryid) {
					if(isset($action['props']['message_class'])) {
						$parententryid = $this->getDefaultFolderEntryID($store, $action['props']['message_class']);
					} else {
						$parententryid = $this->getDefaultFolderEntryID($store, '');
					}
				}

				if($store && $parententryid) {
					$props = Conversion::mapXML2MAPI($this->properties, $action["props"]);

					$messageProps = array(); // props returned from saveMessage

					// Save message
					if(!empty($props)){
						$result = $GLOBALS["operations"]->saveMessage($store, $entryid, $parententryid, $props, $messageProps, array(), (!empty($action['attachments']) ? $action['attachments'] : array()));
					}

					if($result) {
						$GLOBALS["bus"]->notify(bin2hex($parententryid), TABLE_SAVE, $messageProps);

						$this->addActionData("update", array("item" => Conversion::mapMAPI2XML($this->properties, $messageProps)));
						$GLOBALS["bus"]->addData($this->getResponseData());
					} else {
						$this->sendFeedback(false);
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
		function delete($store, $parententryid, $entryid, $action)
		{
			if($store && $parententryid && $entryid) {
				$props = array();
				$props[PR_PARENT_ENTRYID] = $parententryid;
				$props[PR_ENTRYID] = $entryid;

				$storeprops = mapi_getprops($store, array(PR_ENTRYID));
				$props[PR_STORE_ENTRYID] = $storeprops[PR_ENTRYID];

				$result = $GLOBALS["operations"]->deleteMessages($store, $parententryid, $entryid, isset($action['message_action']['soft_delete']) ? $action['message_action']['soft_delete'] : false);

				if($result) {
					$GLOBALS["bus"]->notify(bin2hex($parententryid), TABLE_DELETE, $props);
					$this->sendFeedback(true);
				}
			}
		}

		/**
		 * Function which returns the entryid of a default folder.
		 * @param object $store MAPI Message Store Object
		 * @param string $messageClass the class of the folder
		 * @return string entryid of a default folder, false if not found
		 */
		function getDefaultFolderEntryID($store, $messageClass)
		{
			$entryid = false;

			if($store) {
				$rootcontainer = mapi_msgstore_openentry($store);
				$rootcontainerprops = mapi_getprops($rootcontainer, array(PR_IPM_DRAFTS_ENTRYID, PR_IPM_APPOINTMENT_ENTRYID, PR_IPM_CONTACT_ENTRYID, PR_IPM_JOURNAL_ENTRYID, PR_IPM_NOTE_ENTRYID, PR_IPM_TASK_ENTRYID));

				switch($messageClass)
				{
					case "IPM.Appointment":
						if(isset($rootcontainerprops[PR_IPM_APPOINTMENT_ENTRYID])) {
							$entryid = $rootcontainerprops[PR_IPM_APPOINTMENT_ENTRYID];
						}
						break;
					case "IPM.Contact":
					case "IPM.DistList":
						if(isset($rootcontainerprops[PR_IPM_CONTACT_ENTRYID])) {
							$entryid = $rootcontainerprops[PR_IPM_CONTACT_ENTRYID];
						}
						break;
					case "IPM.StickyNote":
						if(isset($rootcontainerprops[PR_IPM_NOTE_ENTRYID])) {
							$entryid = $rootcontainerprops[PR_IPM_NOTE_ENTRYID];
						}
						break;
					case "IPM.Task":
						if(isset($rootcontainerprops[PR_IPM_TASK_ENTRYID])) {
							$entryid = $rootcontainerprops[PR_IPM_TASK_ENTRYID];
						}
						break;
					default:
						if(isset($rootcontainerprops[PR_IPM_DRAFTS_ENTRYID])) {
							$entryid = $rootcontainerprops[PR_IPM_DRAFTS_ENTRYID];
						}
						break;
				}
			}

			return $entryid;
		}

		/**
		 * Function which copies or moves one or more items.
		 * @param MAPIStore $store MAPI Message Store Object
		 * @param binString $parententryid entryid of the folder
		 * @param array $entryid list of entryids which will be copied or moved (in binary format)
		 * @param array $action the action data, sent by the client
		 * @return boolean true on success or false on failure
		 */
		function copy($store, $parententryid, $entryids, $action)
		{
			$result = false;

			if($store && $parententryid && $entryids) {
				$dest_store = $store;
				if(isset($action["message_action"]["destination_store_entryid"])) {
					$dest_storeentryid = hex2bin($action["message_action"]["destination_store_entryid"]);
					$dest_store = $GLOBALS["mapisession"]->openMessageStore($dest_storeentryid);
				}

				$dest_folderentryid = false;
				if(isset($action["message_action"]["destination_parent_entryid"])) {
					$dest_folderentryid = hex2bin($action["message_action"]["destination_parent_entryid"]);
				}

				$moveMessages = false;
				if(isset($action["message_action"]["action_type"]) && $action["message_action"]["action_type"] == "move") {
					$moveMessages = true;
				}

				// drag & drop from a public store to other store should always be copy instead of move
				$destStoreProps = mapi_getprops($dest_store, array(PR_MDB_PROVIDER));
				$storeProps = mapi_getprops($store, array(PR_MDB_PROVIDER));

				if($storeProps[PR_MDB_PROVIDER] == ZARAFA_STORE_PUBLIC_GUID && $destStoreProps[PR_MDB_PROVIDER] != ZARAFA_STORE_PUBLIC_GUID) {
					$moveMessages = false;
				}

				// if item has some set of props that need to be saved into the newly copied/moved item
				$copyProps = array();
				if (isset($action["message_action"]["dropmodifications"])) {
					$copyProps = Conversion::mapXML2MAPI($this->properties, $action["message_action"]["dropmodifications"]);
				}

				// if item has some changes made before choosing different calendar from create-in dropdown
				if (isset($action["props"])) {
					$copyProps = Conversion::mapXML2MAPI($this->properties, $action["props"]);
				}

				$props = array();
				$props[PR_PARENT_ENTRYID] = $parententryid;
				$props[PR_ENTRYID] = $entryids;

				$storeprops = mapi_getprops($store, array(PR_ENTRYID));
				$props[PR_STORE_ENTRYID] = $storeprops[PR_ENTRYID];

				$result = $GLOBALS["operations"]->copyMessages($store, $parententryid, $dest_store, $dest_folderentryid, $entryids, $moveMessages ? array() : $this->skipCopyProperties, $moveMessages, $copyProps);

				if($result) {
					if($moveMessages) {
						$GLOBALS["bus"]->notify(bin2hex($parententryid), TABLE_DELETE, $props);
					}

					// Delete the PR_ENTRYID, the copied or moved message has a new entryid,
					// and at this time we have no idea what that might be. So make sure
					// we unset it, otherwise the notification handlers get weird ideas
					// and could reset the PR_PARENT_ENTRYID to the old folder again.
					unset($props[PR_ENTRYID]);
					$props[PR_PARENT_ENTRYID] = $dest_folderentryid;
					$props[PR_STORE_ENTRYID] = $dest_storeentryid;
					$GLOBALS["bus"]->notify(bin2hex($dest_folderentryid), TABLE_SAVE, $props);
				}

				$this->sendFeedback($result, array());
			}
		}

		/**
		 * Function returns correspondent calendar item's properties attached
		 * with the meeting request/response/cancellation.
		 * @param Meetingrequest $meetingRequestObject the meeting request object
		 * using which function will fetch meeting request properties and return them.
		 */
		function getCalendarItemProps($meetingRequestObject)
		{
			$calendarItem = $meetingRequestObject->getCorrespondentCalendarItem();
			$props = array();
			if ($calendarItem !== false) {
				$calendarItemProps = mapi_getprops($calendarItem, array(PR_STORE_ENTRYID, PR_PARENT_ENTRYID, PR_ENTRYID, $meetingRequestObject->proptags['updatecounter'], $meetingRequestObject->proptags['goid']));

				// Store calendar item's necessary properties in props array.
				$props['appointment_store_entryid'] = bin2hex($calendarItemProps[PR_STORE_ENTRYID]);
				$props['appointment_parent_entryid'] = bin2hex($calendarItemProps[PR_PARENT_ENTRYID]);
				$props['appointment_entryid'] = bin2hex($calendarItemProps[PR_ENTRYID]);

				$props['appointment_updatecounter'] = isset($calendarItemProps[$meetingRequestObject->proptags['updatecounter']]) ? $calendarItemProps[$meetingRequestObject->proptags['updatecounter']] : 0;

				$messageProps = mapi_getprops($meetingRequestObject->message, array($meetingRequestObject->proptags['goid']));

				$basedate = $meetingRequestObject->getBasedateFromGlobalID($messageProps[$meetingRequestObject->proptags['goid']]);

				if($basedate) {
					$props['appointment_basedate'] = $basedate;

					// if basedate is provided then it is exception, so get update counter of the exceotion
					$exception = $meetingRequestObject->getExceptionItem($calendarItem, $basedate);

					if($exception !== false) {
						// we are able to find the exception then get updatecounter
						$exceptionProps = mapi_getprops($exception, array($meetingRequestObject->proptags['updatecounter']));
						$props['appointment_updatecounter'] = isset($exceptionProps[$meetingRequestObject->proptags['updatecounter']]) ? $exceptionProps[$meetingRequestObject->proptags['updatecounter']] : 0;
					}
				}

				if($meetingRequestObject->isMeetingRequestResponse()) {
					$props['meeting_updated'] = $meetingRequestObject->isMeetingUpdated($basedate);
				}

				return $props;
			}

			return false;
		}

		/**
		* Get a text body for a Non-Delivery report
		*
		* This function reads the necessary properties from the passed message and constructs
		* a user-readable NDR message from those properties
		*
		* @param mapimessage $message The NDR message to read the information from
		* @return string NDR body message as plaintext message.
		*/
		function getNDRbody($message)
		{
			$message_props  = mapi_getprops($message, array(PR_ORIGINAL_SUBJECT,PR_ORIGINAL_SUBMIT_TIME, PR_BODY));
			$body = '';

			// use PR_BODY if it's there, otherwise create a recipient failed message
			if(isset($message_props[PR_BODY]) || propIsError(PR_BODY, $message_props) == MAPI_E_NOT_ENOUGH_MEMORY) {
				$body = mapi_openproperty($message, PR_BODY);
			}

			if (empty($body)) {
				$body = _("Your message did not reach some or all of the intended recipients")."\n\n";
				$body .= "\t"._("Subject").": ".$message_props[PR_ORIGINAL_SUBJECT]."\n";
				$body .= "\t"._("Sent").":    ".strftime("%a %x %X",$message_props[PR_ORIGINAL_SUBMIT_TIME])."\n\n";
				$body .= _("The following recipient(s) could not be reached").":\n";

				$recipienttable = mapi_message_getrecipienttable($message);
				$recipientrows = mapi_table_queryallrows($recipienttable,array(PR_DISPLAY_NAME,PR_REPORT_TIME,PR_REPORT_TEXT));
				foreach ($recipientrows as $recipient){
					$body .= "\n\t".$recipient[PR_DISPLAY_NAME]." on ".strftime("%a %x %X",$recipient[PR_REPORT_TIME])."\n";
					$body .= "\t\t".$recipient[PR_REPORT_TEXT]."\n";
				}
			}

			return $body;
		}

		/**
		* Send a meeting cancellation
		*
		* This function sends a meeting cancellation for the meeting references by the passed entryid. It
		* will send the meeting cancellation and move the item itself to the waste basket.
		*
		* @param mapistore $store The store in which the meeting request resides
		* @param string $entryid Entryid of the appointment for which the cancellation should be sent.
		* @param Object $action data sent by client.
		* @param boolean $directBookingMeetingRequest Indicates if a Meeting Request should use direct booking or not
		*/
		function cancelInvitation($store, $entryid, $action, $directBookingMeetingRequest) {
			$message = $GLOBALS['operations']->openMessage($store, $entryid);

			// @TODO move this to meeting request class ?
			$req = new Meetingrequest($store, $message, $GLOBALS['mapisession']->getSession(), $directBookingMeetingRequest);

			// Update extra body information
			if(isset($action['message_action']['meetingTimeInfo']) && !empty($action['message_action']['meetingTimeInfo'])) {
				$req->setMeetingTimeInfo($action["message_action"]['meetingTimeInfo']);
				unset($action["message_action"]['meetingTimeInfo']);
			}

			// get basedate from action data and pass to meeting request class
			$basedate = !empty($action['basedate']) ? $action['basedate'] : false;

			$req->doCancelInvitation($basedate);

			if($basedate !== false) {
				// if basedate is specified then we have created exception in recurring meeting request
				// so send notification of creation of exception
				$messageProps = mapi_getprops($message, array(PR_ENTRYID, PR_STORE_ENTRYID, PR_PARENT_ENTRYID));
				$GLOBALS["bus"]->notify(bin2hex($messageProps[PR_PARENT_ENTRYID]), TABLE_SAVE, $messageProps);
			} else {
				// for normal/recurring meetings send delete notification
				$messageProps = mapi_getprops($message, array(PR_ENTRYID, PR_STORE_ENTRYID, PR_PARENT_ENTRYID));
				$GLOBALS["bus"]->notify(bin2hex($messageProps[PR_PARENT_ENTRYID]), TABLE_DELETE, $messageProps);
			}
		}

		/**
		* Remove all appointments for a certain meeting request
		*
		* This function searches the default calendar for all meeting requests for the specified
		* meeting. All those appointments are then removed.
		*
		* @param mapistore $store Mapi store in which the meeting request and the calendar reside
		* @param string $entryid Entryid of the meeting request or appointment for which all items should be deleted
		* @param string $basedate if specified contains starttime of day of an occurrence
		* @param boolean $directBookingMeetingRequest Indicates if a Meeting Request should use direct booking or not
		*/
		function removeFromCalendar($store, $entryid, $basedate, $directBookingMeetingRequest) {
			$message = $GLOBALS["operations"]->openMessage($store, $entryid);

			$req = new Meetingrequest($store, $message, $GLOBALS["mapisession"]->getSession(), $directBookingMeetingRequest);

			$req->doRemoveFromCalendar($basedate);

			// Notify the bus that the message has been deleted
			$messageProps = mapi_getprops($message, array(PR_ENTRYID, PR_STORE_ENTRYID, PR_PARENT_ENTRYID));
			$GLOBALS["bus"]->notify(bin2hex($messageProps[PR_PARENT_ENTRYID]), $basedate? TABLE_SAVE : TABLE_DELETE, $messageProps);
		}
	}
?>
