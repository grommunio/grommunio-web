<?php

/**
 * Appointment ItemModule
 * Module which openes, creates, saves and deletes an item. It
 * extends the Module class.
 */
class AppointmentItemModule extends ItemModule {
	/**
	 * @var string client or server IANA timezone
	 */
	protected $tziana;

	/**
	 * @var bool|string client timezone definition
	 */
	protected $tzdef;

	/**
	 * @var array|bool client timezone definition array
	 */
	protected $tzdefObj;

	/**
	 * @var mixed client timezone effective rule id
	 */
	protected $tzEffRuleIdx;

	/**
	 * Constructor.
	 *
	 * @param int   $id   unique id
	 * @param array $data list of all actions
	 */
	public function __construct($id, $data) {
		parent::__construct($id, $data);

		$this->properties = $GLOBALS['properties']->getAppointmentProperties();

		$this->plaintext = true;
		$this->skipCopyProperties = [
			$this->properties['goid'],
			$this->properties['goid2'],
			$this->properties['request_sent'],
			PR_OWNER_APPT_ID,
		];

		$this->tziana = 'Etc/UTC';
		$this->tzdef = false;
		$this->tzdefObj = false;
	}

	public function open($store, $entryid, $action) {
		if ($store && $entryid) {
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
				// add all standard properties from the series/normal message
				$data['item'] = $GLOBALS['operations']->getMessageProps($store, $message, $this->properties, $this->plaintext);
			}

			if (!empty($action["timezone_iana"])) {
				$this->tziana = $action["timezone_iana"];
				try {
					$this->tzdef = mapi_ianatz_to_tzdef($action['timezone_iana']);
				}
				catch (Exception) {
				}
			}

			// if appointment is recurring then only we should get properties of occurrence if basedate is supplied
			if ($data['item']['props']['recurring'] === true) {
				if (!empty($action['basedate'])) {
					// check for occurrence/exception
					$basedate = $action['basedate'];

					$recur = new Recurrence($store, $message);

					$exceptionatt = $recur->getExceptionAttachment($basedate);

					// Single occurrences are never recurring
					$data['item']['props']['recurring'] = false;

					if ($exceptionatt) {
						// Existing exception (open existing item, which includes basedate)
						$exceptionattProps = mapi_getprops($exceptionatt, [PR_ATTACH_NUM]);
						$exception = mapi_attach_openobj($exceptionatt, 0);

						// overwrite properties with the ones from the exception
						$exceptionProps = $GLOBALS['operations']->getMessageProps($store, $exception, $this->properties, $this->plaintext);

						/*
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
							if (!empty($exceptionProps['props']['body'])) {
								$data['item']['props']['body'] = $exceptionProps['props']['body'];
							}

							if (!empty($exceptionProps['props']['html_body'])) {
								$data['item']['props']['html_body'] = $exceptionProps['props']['html_body'];
							}

							$data['item']['props']['isHTML'] = $exceptionProps['props']['isHTML'];
						}
						// remove properties from $exceptionProps so array_merge will not overwrite it
						unset($exceptionProps['props']['html_body'], $exceptionProps['props']['body'], $exceptionProps['props']['isHTML']);

						$data['item']['props'] = array_merge($data['item']['props'], $exceptionProps['props']);
						if (isset($exceptionProps['recipients'])) {
							$data['item']['recipients'] = $exceptionProps['recipients'];
						}

						if (isset($exceptionProps['attachments'])) {
							$data['item']['attachments'] = $exceptionProps['attachments'];
						}

						// Make sure we are using the passed basedate and not something wrong in the opened item
						$data['item']['props']['basedate'] = $basedate;
						$data['item']['attach_num'] = [$exceptionattProps[PR_ATTACH_NUM]];
					}
					elseif ($recur->isDeleteException($basedate)) {
						// Exception is deleted, should not happen, but if it the case then give error
						$this->sendFeedback(
							false,
							[
								'type' => ERROR_ZARAFA,
								'info' => [
									'original_message' => _('Could not open occurrence.'),
									'display_message' => _('Could not open occurrence, specific occurrence is probably deleted.'),
								],
							]
						);

						return;
					}
					else {
						// opening an occurrence of a recurring series (same as normal open, but add basedate, startdate and enddate)
						$data['item']['props']['basedate'] = $basedate;
						$data['item']['props']['startdate'] = $recur->getOccurrenceStart($basedate);
						$data['item']['props']['duedate'] = $recur->getOccurrenceEnd($basedate);
						$data['item']['props']['commonstart'] = $data['item']['props']['startdate'];
						$data['item']['props']['commonend'] = $data['item']['props']['duedate'];
						unset($data['item']['props']['reminder_time']);

						/*
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
				}
				else {
					// Opening a recurring series, get the recurrence information
					$recur = new Recurrence($store, $message);
					$recurpattern = $recur->getRecurrence();
					$tz = $recur->tz; // no function to do this at the moment

					// Add the recurrence pattern to the data
					if (isset($recurpattern) && is_array($recurpattern)) {
						$data['item']['props'] += $recurpattern;
					}

					// Add the timezone information to the data
					if (isset($tz) && is_array($tz)) {
						$data['item']['props'] += $tz;
					}
				}
			}

			// Fix for all-day events which have a different timezone than the user's browser
			if ($data['item']['props']['alldayevent'] == 1 && $this->tzdef !== false) {
				$this->processAllDayItem($store, $data['item'], $message);
			}

			// Send the data
			$this->addActionData('item', $data);
			$GLOBALS['bus']->addData($this->getResponseData());
		}
	}

	/**
	 * Function does customization of exception based on module data.
	 * like, here it will generate display message based on actionType
	 * for particular exception.
	 *
	 * @param object     $e             Exception object
	 * @param string     $actionType    the action type, sent by the client
	 * @param MAPIobject $store         store object of message
	 * @param string     $parententryid parent entryid of the message
	 * @param string     $entryid       entryid of the message
	 * @param array      $action        the action data, sent by the client
	 */
	public function handleException(&$e, $actionType = null, $store = null, $parententryid = null, $entryid = null, $action = null) {
		if (is_null($e->displayMessage)) {
			switch ($actionType) {
				case "save":
					if ($e->getCode() == MAPI_E_NO_ACCESS) {
						$message = mapi_msgstore_openentry($store, $entryid);
						$messageProps = mapi_getprops($message, [PR_MESSAGE_CLASS, PR_ENTRYID, PR_PARENT_ENTRYID, PR_STORE_ENTRYID]);
						$messageClass = $messageProps[PR_MESSAGE_CLASS];

						$text = $messageClass !== "IPM.Appointment" ? _('a meeting request') : _('an appointment');
						$msg = _('You have insufficient privileges to move ' . $text . ' in this calendar. The calendar owner can set these using the \'permissions\'-tab of the folder properties (right click the calendar folder > properties > permissions)');

						$e->setDisplayMessage($msg);
						$e->setTitle(_('Insufficient privileges'));

						// Need this notification to refresh the calendar.
						$GLOBALS['bus']->notify(bin2hex((string) $parententryid), TABLE_DELETE, $messageProps);
					}
					break;
			}
		}
		parent::handleException($e, $actionType, $store, $parententryid, $entryid, $action);
	}

	/**
	 * Save the give appointment or meeting request to the calendar.
	 *
	 * @param mapistore $store         MAPI store of the message
	 * @param string    $parententryid Parent entryid of the message (folder entryid, NOT message entryid)
	 * @param string    $entryid       entryid of the message
	 * @param array     $action        Action array containing json request
	 * @param string    $actionType    The action type which triggered this action
	 */
	public function save($store, $parententryid, $entryid, $action, $actionType = 'save') {
		$result = false;

		// Save appointment (saveAppointment takes care of creating/modifying exceptions to recurring
		// items if necessary)
		$messageProps = $GLOBALS['operations']->saveAppointment($store, $entryid, $parententryid, $action, $actionType, $this->directBookingMeetingRequest);

		// Notify the bus if the save was OK
		if ($messageProps && !(is_array($messageProps) && isset($messageProps['error'])) && !isset($messageProps['remindertimeerror'])) {
			$GLOBALS['bus']->notify(bin2hex($parententryid), TABLE_SAVE, $messageProps);
			$result = true;
		}

		$errorMsg = false;
		if (!$result && isset($messageProps['remindertimeerror']) && !$messageProps['remindertimeerror']) {
			$errorMsg = _('Cannot set a reminder to appear before the previous occurrence. Reset reminder to save the change');
		}
		elseif (isset($messageProps['isexceptionallowed']) && $messageProps['isexceptionallowed'] === false) {
			$errorMsg = _('Two occurrences cannot occur on the same day');
		}
		elseif (is_array($messageProps) && isset($messageProps['error'])) {
			$errorMsg = match ($messageProps['error']) {
                1 => sprintf(_('You marked \'%s\' as a resource. You cannot schedule a meeting with \'%s\' because you do not have the appropriate permissions for that account. Either enter the name as a required or optional attendee or talk to your administrator about giving you permission to schedule \'%s\'.'), $messageProps['displayname'], $messageProps['displayname'], $messageProps['displayname']),
                2 => sprintf(_('\'%s\' has declined your meeting because \'%s\' does not automatically accept meeting requests.'), $messageProps['displayname'], $messageProps['displayname']),
                3 => sprintf(_('\'%s\' has declined your meeting because it is recurring. You must book each meeting separately with this resource.'), $messageProps['displayname']),
                4 => sprintf(_('\'%s\' is already booked for this specified time. You must use another time or find another resource.'), $messageProps['displayname']),
                default => _('Meeting was not scheduled.'),
            };
		}
		else {
			// Recurring but non-existing exception (same as normal open, but add basedate, startdate and enddate)
			$data = [];
			if ($result) {
				$data = Conversion::mapMAPI2XML($this->properties, $messageProps);

				// Get recipient information from the saved appointment to update client side
				// according to the latest recipient related changes only if changes requested from client.
				$savedAppointment = $GLOBALS['operations']->openMessage($store, $messageProps[PR_ENTRYID]);
				if (!empty($action['recipients'])) {
					$recipients = $GLOBALS["operations"]->getRecipientsInfo($savedAppointment);
					if (!empty($recipients)) {
						$data["recipients"] = [
							"item" => $recipients,
						];
					}
				}

				// Get attachments information from the saved appointment to update client side
				// according to the latest attachments related changes only if changes requested from client.
				if (!empty($action['attachments'])) {
					$attachments = $GLOBALS["operations"]->getAttachmentsInfo($savedAppointment);
					if (!empty($attachments)) {
						$data["attachments"] = [
							"item" => $attachments,
						];
					}
				}

				$data['action_response'] = [
					'resources_booked' => $this->directBookingMeetingRequest,
				];

				if (isset($action['message_action'], $action['message_action']['paste'])) {
					$data['action_response']['resources_pasted'] = true;
				}
			}
			else {
				if (!empty($action['message_action']['send'])) {
					$errorMsg = _('Meeting could not be sent.');
				}
				else {
					$errorMsg = _('Meeting could not be saved.');
				}
			}
		}

		if ($errorMsg === false) {
			$this->addActionData('update', ['item' => $data]);
			$GLOBALS['bus']->addData($this->getResponseData());
		}
		else {
			$this->sendFeedback(false, [
				'type' => ERROR_ZARAFA,
				'info' => [
					'display_message' => $errorMsg,
				],
			]);
		}
	}

	/**
	 * Processes an all-day item and calculates the correct starttime if necessary.
	 *
	 * @param object $store
	 * @param array  $calendaritem
	 * @param object $message
	 */
	private function processAllDayItem($store, &$calendaritem, $message) {
		// If the appointment doesn't have tzdefstart property, it was probably
		// created on a mobile device (mobile devices do not send a timezone for
		// all-day events).
		$isTzdefstartSet = isset($calendaritem['props']['tzdefstart']);
		$tzdefstart = $isTzdefstartSet ?
			hex2bin((string) $calendaritem['props']['tzdefstart']) :
			mapi_ianatz_to_tzdef("Etc/UTC");

		// Compare the timezone definitions of the client and the appointment.
		// Further processing is only required if they don't match.
		if ($isTzdefstartSet && $GLOBALS['entryid']->compareEntryIds($this->tzdef, $tzdefstart)) {
			return;
		}

		$duration = $calendaritem['props']['duedate'] - $calendaritem['props']['startdate'];
		$localStart = $calendaritem['props']['startdate'];
		if (!$isTzdefstartSet) {
			$localStart = getLocalStart($calendaritem['props']['startdate'], $this->tziana);
		}
		else {
			if ($this->tzdefObj === false) {
				$this->tzdefObj = $GLOBALS['entryid']->createTimezoneDefinitionObject($this->tzdef);
			}
			$this->tzEffRuleIdx = getEffectiveTzreg($this->tzdefObj['rules']);
			
			$appTzDefStart = $GLOBALS['entryid']->createTimezoneDefinitionObject($tzdefstart);
			
			// Find TZRULE_FLAG_EFFECTIVE_TZREG rule for the appointment's timezone
			$appTzEffRuleIdx = getEffectiveTzreg($appTzDefStart['rules']);
			
			if (is_null($this->tzEffRuleIdx) && !is_null($appTzEffRuleIdx)) {
				return;
			}
			// first apply the bias of the appointment timezone and the bias of the browser
			$localStart = $calendaritem['props']['startdate'] - $appTzDefStart['rules'][$appTzEffRuleIdx]['bias'] * 60 + $this->tzdefObj['rules'][$this->tzEffRuleIdx]['bias'] * 60;
			if (isDst($appTzDefStart['rules'][$appTzEffRuleIdx], $calendaritem['props']['startdate'])) {
				$localStart -= $appTzDefStart['rules'][$appTzEffRuleIdx]['dstbias'] * 60;
			}
			if (isDst($this->tzdefObj['rules'][$this->tzEffRuleIdx], $calendaritem['props']['startdate'])) {
				$localStart += $this->tzdefObj['rules'][$this->tzEffRuleIdx]['dstbias'] * 60;
			}
		}
		$calendaritem['props']['startdate'] = $calendaritem['props']['commonstart'] = $localStart;
		$calendaritem['props']['duedate'] = $calendaritem['props']['commonend'] = $localStart + $duration;
	}
}
