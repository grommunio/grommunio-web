<?php
	require_once(BASE_PATH . 'server/includes/mapi/class.recurrence.php');
	
	/**
	 * Appointment ItemModule
	 * Module which openes, creates, saves and deletes an item. It 
	 * extends the Module class.
	 */
	class AppointmentItemModule extends ItemModule
	{
		/**
		 * Constructor
		 * @param int $id unique id.
		 * @param array $data list of all actions.
		 */
		function __construct($id, $data)
		{
			$this->properties = $GLOBALS['properties']->getAppointmentProperties();

			parent::__construct($id, $data);

			$this->plaintext = true;
			$this->skipCopyProperties = array(
				$this->properties['goid'],
				$this->properties['goid2'],
				$this->properties['request_sent'],
				PR_OWNER_APPT_ID
			);
		}
		
		function open($store, $entryid, $action)
		{
			if($store && $entryid) {
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
					// add all standard properties from the series/normal message 
					$data['item'] = $GLOBALS['operations']->getMessageProps($store, $message, $this->properties, $this->plaintext);
				}

				// if appointment is recurring then only we should get properties of occurence if basedate is supplied
				if($data['item']['props']['recurring'] === true) {
					if(!empty($action['basedate'])) {
						// check for occurence/exception
						$basedate = $action['basedate'];

						$recur = new Recurrence($store, $message);

						$exceptionatt = $recur->getExceptionAttachment($basedate);

						// Single occurences are never recurring
						$data['item']['props']['recurring'] = false;

						if($exceptionatt) {
							// Existing exception (open existing item, which includes basedate)
							$exceptionattProps = mapi_getprops($exceptionatt, array(PR_ATTACH_NUM));
							$exception = mapi_attach_openobj($exceptionatt, 0);

							// overwrite properties with the ones from the exception
							$exceptionProps = $GLOBALS['operations']->getMessageProps($store, $exception, $this->properties, $this->plaintext);

							/**
							 * If recurring item has set reminder to true then
							 * all occurrences before the 'flagdueby' value(of recurring item)
							 * should not show that reminder is set.
							 */
							if (isset($exceptionProps['props']['reminder']) && $data['item']['props']['reminder'] == true) {
								$flagDueByDay = $recur->dayStartOf($data['item']['props']['flagdueby']);

								if ($flagDueByDay > $basedate) {
									$exceptionProps['props']['reminder'] = false;
								}
							}

							// The properties must be merged, if the recipients or attachments are present in the exception
							// then that list should be used. Otherwise the list from the series must be applied (this
							// corresponds with OL2007).
							// @FIXME getMessageProps should not return empty string if exception doesn't contain body
							// by this change we can handle a situation where user has set empty string in the body explicitly
							if (!empty($exceptionProps['props']['body']) || !empty($exceptionProps['props']['html_body'])) {
								if(!empty($exceptionProps['props']['body'])) {
									$data['item']['props']['body'] = $exceptionProps['props']['body'];
								}

								if(!empty($exceptionProps['props']['html_body'])) {
									$data['item']['props']['html_body'] = $exceptionProps['props']['html_body'];
								}

								$data['item']['props']['isHTML'] = $exceptionProps['props']['isHTML'];
							}
							// remove properties from $exceptionProps so array_merge will not overwrite it
							unset($exceptionProps['props']['html_body']);
							unset($exceptionProps['props']['body']);
							unset($exceptionProps['props']['isHTML']);

							$data['item']['props'] = array_merge($data['item']['props'], $exceptionProps['props']);
							if (isset($exceptionProps['recipients'])) {
								$data['item']['recipients'] = $exceptionProps['recipients'];
							}

							if (isset($exceptionProps['attachments'])) {
								$data['item']['attachments'] = $exceptionProps['attachments'];
							}

							// Make sure we are using the passed basedate and not something wrong in the opened item
							$data['item']['props']['basedate'] = $basedate;
							$data['item']['attach_num'] = array($exceptionattProps[PR_ATTACH_NUM]);
						} else if($recur->isDeleteException($basedate)) {
							// Exception is deleted, should not happen, but if it the case then give error
							$this->sendFeedback(false,
								array(
									'type' => ERROR_ZARAFA,
									'info' => array(
										'original_message' => _('Could not open occurrence.'),
										'display_message' => _('Could not open occurrence, specific occurrence is probably deleted.')
									)
								)
							);
							return;
						} else {
							// opening an occurence of a recurring series (same as normal open, but add basedate, startdate and enddate)
							$data['item']['props']['basedate'] = $basedate;
							$data['item']['props']['startdate'] = $recur->getOccurrenceStart($basedate);
							$data['item']['props']['duedate'] = $recur->getOccurrenceEnd($basedate);
							$data['item']['props']['commonstart'] = $data['item']['props']['startdate'];
							$data['item']['props']['commonend'] = $data['item']['props']['duedate'];
							unset($data['item']['props']['reminder_time']);

							/**
							 * If recurring item has set reminder to true then
							 * all occurrences before the 'flagdueby' value(of recurring item)
							 * should not show that reminder is set.
							 */
							if (isset($exceptionProps['props']['reminder']) && $data['item']['props']['reminder'] == true) {
								$flagDueByDay = $recur->dayStartOf($data['item']['props']['flagdueby']);

								if ($flagDueByDay > $basedate) {
									$exceptionProps['props']['reminder'] = false;
								}
							}
						}
					} else {
						// Opening a recurring series, get the recurrence information
						$recur = new Recurrence($store, $message);
						$recurpattern = $recur->getRecurrence();
						$tz = $recur->tz; // no function to do this at the moment

						// Add the recurrence pattern to the data
						if(isset($recurpattern) && is_array($recurpattern)) {
							$data['item']['props'] += $recurpattern;
						}

						// Add the timezone information to the data
						if(isset($tz) && is_array($tz)) {
							$data['item']['props'] += $tz;
						}
					}
				}

				// Send the data
				$this->addActionData('item', $data);
				$GLOBALS['bus']->addData($this->getResponseData());
			}
		}
		
		function save($store, $parententryid, $entryid, $action, $actionType = 'save')
		{
			$result = false;

			// Save appointment (saveAppointment takes care of creating/modifying exceptions to recurring
			// items if necessary)
			$messageProps = $GLOBALS['operations']->saveAppointment($store, $entryid, $parententryid, $action, $actionType, $this->directBookingMeetingRequest);

			// Notify the bus if the save was OK
			if($messageProps && !(is_array($messageProps) && isset($messageProps['error'])) && !isset($messageProps['remindertimeerror']) ){
				$GLOBALS['bus']->notify(bin2hex($parententryid), TABLE_SAVE, $messageProps);
				$result = true;
			}

			$errorMsg = false;
			if(!$result && isset($messageProps['remindertimeerror']) && !$messageProps['remindertimeerror']){
				$errorMsg = _('Cannot set a reminder to appear before the previous occurrence. Reset reminder to save the change');
			}else if (isset($messageProps['isexceptionallowed']) && $messageProps['isexceptionallowed'] === false){
				$errorMsg = _('Two occurrences cannot occur on the same day');
			}elseif(is_array($messageProps) && isset($messageProps['error'])){
				switch($messageProps['error']){
					case 1:
						$errorMsg = sprintf(_('You marked \'%s\' as a resource. You cannot schedule a meeting with \'%s\' because you do not have the appropiate permissions for that account. Either enter the name as a required or optional attendee or talk to your administrator about giving you permission to schedule \'%s\'.'), $messageProps['displayname'], $messageProps['displayname'], $messageProps['displayname']);
						break;
					case 2:
						$errorMsg = sprintf(_('\'%s\' has declined your meeting because \'%s\' does not automatically accept meeting requests.'), $messageProps['displayname'], $messageProps['displayname']);
						break;
					case 3:
						$errorMsg = sprintf(_('\'%s\' has declined your meeting because it is recurring. You must book each meeting separately with this resource.'), $messageProps['displayname']);
						break;
					case 4:
						$errorMsg = sprintf(_('\'%s\' is already booked for this specified time. You must use another time or find another resource.'), $messageProps['displayname']);
						break;
					default:
						$errorMsg = _('Meeting was not scheduled.');
						break;
				}
			}else{
				// Recurring but non-existing exception (same as normal open, but add basedate, startdate and enddate)
				$data = array();
				if ($result) {
					$data = Conversion::mapMAPI2XML($this->properties, $messageProps);

					// Get recipient information from the saved appointment to update client side
					// according to the latest recipient related changes only if changes requested from client.
					$savedAppointment = $GLOBALS['operations']->openMessage($store, $messageProps[PR_ENTRYID]);
					if(!empty($action['recipients'])) {
						$recipients = $GLOBALS["operations"]->getRecipientsInfo($savedAppointment);
						if(!empty($recipients)) {
							$data["recipients"] = array(
								"item" => $recipients
							);
						}
					}

					// Get attachments information from the saved appointment to update client side
					// according to the latest attachments related changes only if changes requested from client.
					if (!empty($action['attachments'])) {
						$attachments = $GLOBALS["operations"]->getAttachmentsInfo($savedAppointment);
						if (!empty($attachments)) {
							$data["attachments"] = array(
								"item" => $attachments
							);
						}
					}

					$data['action_response'] = Array(
						'resources_booked' => $this->directBookingMeetingRequest
					);

					if(isset($action['message_action']) && isset($action['message_action']['paste'])) {
						$data['action_response']['resources_pasted'] = true;
					}

				} else {
					if(!empty($action['message_action']['send'])){
						$errorMsg = _('Meeting could not be sent.');
					}else{
						$errorMsg = _('Meeting could not be saved.');
					}
				}
			}

			if($errorMsg===false){

				$this->addActionData('update', array('item' => $data));
				$GLOBALS['bus']->addData($this->getResponseData());
			} else {
				$this->sendFeedback(false, array(
					'type' => ERROR_ZARAFA,
					'info' => array(
						'display_message' => $errorMsg,
					)
				));
			}
		}
	}
?>
