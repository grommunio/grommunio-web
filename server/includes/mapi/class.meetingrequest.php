<?php
/*
 * SPDX-License-Identifier: AGPL-3.0-only
 * SPDX-FileCopyrightText: Copyright 2005-2016 Zarafa Deutschland GmbH
 * SPDX-FileCopyrightText: Copyright 2020-2022 grommunio GmbH
 */

class Meetingrequest {
	/*
	 * NOTE
	 *
	 * This class is designed to modify and update meeting request properties
	 * and to search for linked appointments in the calendar. It does not
	 * - set standard properties like subject or location
	 * - commit property changes through savechanges() (except in accept() and decline())
	 *
	 * To set all the other properties, just handle the item as any other appointment
	 * item. You aren't even required to set those properties before or after using
	 * this class. If you update properties before REsending a meeting request (ie with
	 * a time change) you MUST first call updateMeetingRequest() so the internal counters
	 * can be updated. You can then submit the message any way you like.
	 *
	 */

	/*
	 * How to use
	 * ----------
	 *
	 * Sending a meeting request:
	 * - Create appointment item as normal, but as 'tentative'
	 *   (this is the state of the item when the receiving user has received but
	 *    not accepted the item)
	 * - Set recipients as normally in e-mails
	 * - Create Meetingrequest class instance
	 * - Call checkCalendarWriteAccess(), to check for write permissions on calendar folder
	 * - Call setMeetingRequest(), this turns on all the meeting request properties in the
	 *   calendar item
	 * - Call sendMeetingRequest(), this sends a copy of the item with some extra properties
	 *
	 * Updating a meeting request:
	 * - Create Meetingrequest class instance
	 * - Call checkCalendarWriteAccess(), to check for write permissions on calendar folder
	 * - Call updateMeetingRequest(), this updates the counters
	 * - Call checkSignificantChanges(), this will check for significant changes and if needed will clear the
	 *   existing recipient responses
	 * - Call sendMeetingRequest()
	 *
	 * Clicking on a an e-mail:
	 * - Create Meetingrequest class instance
	 * - Check isMeetingRequest(), if true:
	 *   - Check isLocalOrganiser(), if true then ignore the message
	 *   - Check isInCalendar(), if not call doAccept(true, false, false). This adds the item in your
	 *     calendar as tentative without sending a response
	 *   - Show Accept, Tentative, Decline buttons
	 *   - When the user presses Accept, Tentative or Decline, call doAccept(false, true, true),
	 *     doAccept(true, true, true) or doDecline(true) respectively to really accept or decline and
	 *     send the response. This will remove the request from your inbox.
	 * - Check isMeetingRequestResponse, if true:
	 *   - Check isLocalOrganiser(), if not true then ignore the message
	 *   - Call processMeetingRequestResponse()
	 *     This will update the trackstatus of all recipients, and set the item to 'busy'
	 *     when all the recipients have accepted.
	 * - Check isMeetingCancellation(), if true:
	 *   - Check isLocalOrganiser(), if true then ignore the message
	 *   - Check isInCalendar(), if not, then ignore
	 *     Call processMeetingCancellation()
	 *   - Show 'Remove From Calendar' button to user
	 *   - When userpresses button, call doRemoveFromCalendar(), which removes the item from your
	 *     calendar and deletes the message
	 *
	 * Cancelling a meeting request:
	 *   - Call doCancelInvitation, which will send cancellation mails to attendees and will remove
	 *     meeting object from calendar
	 */

	// All properties for a recipient that are interesting
	public $recipprops = [
		PR_ENTRYID,
		PR_DISPLAY_NAME,
		PR_EMAIL_ADDRESS,
		PR_RECIPIENT_ENTRYID,
		PR_RECIPIENT_TYPE,
		PR_SEND_INTERNET_ENCODING,
		PR_SEND_RICH_INFO,
		PR_RECIPIENT_DISPLAY_NAME,
		PR_ADDRTYPE,
		PR_DISPLAY_TYPE,
		PR_DISPLAY_TYPE_EX,
		PR_RECIPIENT_TRACKSTATUS,
		PR_RECIPIENT_TRACKSTATUS_TIME,
		PR_RECIPIENT_FLAGS,
		PR_ROWID,
		PR_OBJECT_TYPE,
		PR_SEARCH_KEY,
	];

	/**
	 * Indication whether the setting of resources in a Meeting Request is success (false) or if it
	 * has failed (integer).
	 */
	public $errorSetResource;

	public $proptags;
	private $store;
	public $message;
	private $session;
	private $meetingTimeInfo;
	private $enableDirectBooking;
	private $includesResources;
	private $nonAcceptingResources;
	private $recipientDisplayname;

	/**
	 * Constructor.
	 *
	 * Takes a store and a message. The message is an appointment item
	 * that should be converted into a meeting request or an incoming
	 * e-mail message that is a meeting request.
	 *
	 * The $session variable is optional, but required if the following features
	 * are to be used:
	 *
	 * - Sending meeting requests for meetings that are not in your own store
	 * - Sending meeting requests to resources, resource availability checking and resource freebusy updates
	 *
	 * @param mixed $store
	 * @param mixed $message
	 * @param mixed $session
	 * @param mixed $enableDirectBooking
	 */
	public function __construct($store, $message, $session = false, $enableDirectBooking = true) {
		$this->store = $store;
		$this->message = $message;
		$this->session = $session;
		// This variable string saves time information for the MR.
		$this->meetingTimeInfo = false;
		$this->enableDirectBooking = $enableDirectBooking;

		$properties = [];
		$properties['goid'] = 'PT_BINARY:PSETID_Meeting:0x3';
		$properties['goid2'] = 'PT_BINARY:PSETID_Meeting:0x23';
		$properties['type'] = 'PT_STRING8:PSETID_Meeting:0x24';
		$properties['meetingrecurring'] = 'PT_BOOLEAN:PSETID_Meeting:0x5';
		$properties['unknown2'] = 'PT_BOOLEAN:PSETID_Meeting:0xa';
		$properties['attendee_critical_change'] = 'PT_SYSTIME:PSETID_Meeting:0x1';
		$properties['owner_critical_change'] = 'PT_SYSTIME:PSETID_Meeting:0x1a';
		$properties['meetingstatus'] = 'PT_LONG:PSETID_Appointment:' . PidLidAppointmentStateFlags;
		$properties['responsestatus'] = 'PT_LONG:PSETID_Appointment:0x8218';
		$properties['unknown6'] = 'PT_LONG:PSETID_Meeting:0x4';
		$properties['replytime'] = 'PT_SYSTIME:PSETID_Appointment:0x8220';
		$properties['usetnef'] = 'PT_BOOLEAN:PSETID_Common:0x8582';
		$properties['recurrence_data'] = 'PT_BINARY:PSETID_Appointment:' . PidLidAppointmentRecur;
		$properties['reminderminutes'] = 'PT_LONG:PSETID_Common:' . PidLidReminderDelta;
		$properties['reminderset'] = 'PT_BOOLEAN:PSETID_Common:' . PidLidReminderSet;
		$properties['sendasical'] = 'PT_BOOLEAN:PSETID_Appointment:0x8200';
		$properties['updatecounter'] = 'PT_LONG:PSETID_Appointment:' . PidLidAppointmentSequence;					// AppointmentSequenceNumber
		$properties['unknown7'] = 'PT_LONG:PSETID_Appointment:0x8202';
		$properties['last_updatecounter'] = 'PT_LONG:PSETID_Appointment:0x8203';			// AppointmentLastSequence
		$properties['busystatus'] = 'PT_LONG:PSETID_Appointment:' . PidLidBusyStatus;
		$properties['intendedbusystatus'] = 'PT_LONG:PSETID_Appointment:' . PidLidIntendedBusyStatus;
		$properties['start'] = 'PT_SYSTIME:PSETID_Appointment:' . PidLidAppointmentStartWhole;
		$properties['responselocation'] = 'PT_STRING8:PSETID_Meeting:0x2';
		$properties['location'] = 'PT_STRING8:PSETID_Appointment:' . PidLidLocation;
		$properties['requestsent'] = 'PT_BOOLEAN:PSETID_Appointment:0x8229';		// PidLidFInvited, MeetingRequestWasSent
		$properties['startdate'] = 'PT_SYSTIME:PSETID_Appointment:' . PidLidAppointmentStartWhole;
		$properties['duedate'] = 'PT_SYSTIME:PSETID_Appointment:' . PidLidAppointmentEndWhole;
		$properties['flagdueby'] = 'PT_SYSTIME:PSETID_Common:' . PidLidReminderSignalTime;
		$properties['commonstart'] = 'PT_SYSTIME:PSETID_Common:0x8516';
		$properties['commonend'] = 'PT_SYSTIME:PSETID_Common:0x8517';
		$properties['recurring'] = 'PT_BOOLEAN:PSETID_Appointment:' . PidLidRecurring;
		$properties['clipstart'] = 'PT_SYSTIME:PSETID_Appointment:' . PidLidClipStart;
		$properties['clipend'] = 'PT_SYSTIME:PSETID_Appointment:' . PidLidClipEnd;
		$properties['start_recur_date'] = 'PT_LONG:PSETID_Meeting:0xD';				// StartRecurTime
		$properties['start_recur_time'] = 'PT_LONG:PSETID_Meeting:0xE';				// StartRecurTime
		$properties['end_recur_date'] = 'PT_LONG:PSETID_Meeting:0xF';				// EndRecurDate
		$properties['end_recur_time'] = 'PT_LONG:PSETID_Meeting:0x10';				// EndRecurTime
		$properties['is_exception'] = 'PT_BOOLEAN:PSETID_Meeting:0xA';				// LID_IS_EXCEPTION
		$properties['apptreplyname'] = 'PT_STRING8:PSETID_Appointment:0x8230';
		// Propose new time properties
		$properties['proposed_start_whole'] = 'PT_SYSTIME:PSETID_Appointment:' . PidLidAppointmentProposedStartWhole;
		$properties['proposed_end_whole'] = 'PT_SYSTIME:PSETID_Appointment:' . PidLidAppointmentProposedEndWhole;
		$properties['proposed_duration'] = 'PT_LONG:PSETID_Appointment:0x8256';
		$properties['counter_proposal'] = 'PT_BOOLEAN:PSETID_Appointment:' . PidLidAppointmentCounterProposal;
		$properties['recurring_pattern'] = 'PT_STRING8:PSETID_Appointment:0x8232';
		$properties['basedate'] = 'PT_SYSTIME:PSETID_Appointment:' . PidLidExceptionReplaceTime;
		$properties['meetingtype'] = 'PT_LONG:PSETID_Meeting:0x26';
		$properties['timezone_data'] = 'PT_BINARY:PSETID_Appointment:' . PidLidTimeZoneStruct;
		$properties['timezone'] = 'PT_STRING8:PSETID_Appointment:' . PidLidTimeZoneDescription;
		$properties['categories'] = 'PT_MV_STRING8:PS_PUBLIC_STRINGS:Keywords';
		$properties['private'] = 'PT_BOOLEAN:PSETID_Common:' . PidLidPrivate;
		$properties['alldayevent'] = 'PT_BOOLEAN:PSETID_Appointment:' . PidLidAppointmentSubType;
		$properties['toattendeesstring'] = 'PT_STRING8:PSETID_Appointment:0x823B';
		$properties['ccattendeesstring'] = 'PT_STRING8:PSETID_Appointment:0x823C';

		$this->proptags = getPropIdsFromStrings($store, $properties);
	}

	/**
	 * Sets the direct booking property. This is an alternative to the setting of the direct booking
	 * property through the constructor. However, setting it in the constructor is preferred.
	 *
	 * @param bool $directBookingSetting
	 */
	public function setDirectBooking($directBookingSetting) {
		$this->enableDirectBooking = $directBookingSetting;
	}

	/**
	 * Returns TRUE if the message pointed to is an incoming meeting request and should
	 * therefore be replied to with doAccept or doDecline().
	 *
	 * @param string $messageClass message class to use for checking
	 *
	 * @return bool returns true if this is a meeting request else false
	 */
	public function isMeetingRequest($messageClass = false) {
		if ($messageClass === false) {
			$props = mapi_getprops($this->message, [PR_MESSAGE_CLASS]);
			$messageClass = isset($props[PR_MESSAGE_CLASS]) ? $props[PR_MESSAGE_CLASS] : false;
		}

		if ($messageClass !== false && stripos($messageClass, 'ipm.schedule.meeting.request') === 0) {
			return true;
		}

		return false;
	}

	/**
	 * Returns TRUE if the message pointed to is a returning meeting request response.
	 *
	 * @param string $messageClass message class to use for checking
	 *
	 * @return bool returns true if this is a meeting request else false
	 */
	public function isMeetingRequestResponse($messageClass = false) {
		if ($messageClass === false) {
			$props = mapi_getprops($this->message, [PR_MESSAGE_CLASS]);
			$messageClass = isset($props[PR_MESSAGE_CLASS]) ? $props[PR_MESSAGE_CLASS] : false;
		}

		if ($messageClass !== false && stripos($messageClass, 'ipm.schedule.meeting.resp') === 0) {
			return true;
		}

		return false;
	}

	/**
	 * Returns TRUE if the message pointed to is a cancellation request.
	 *
	 * @param string $messageClass message class to use for checking
	 *
	 * @return bool returns true if this is a meeting request else false
	 */
	public function isMeetingCancellation($messageClass = false) {
		if ($messageClass === false) {
			$props = mapi_getprops($this->message, [PR_MESSAGE_CLASS]);
			$messageClass = isset($props[PR_MESSAGE_CLASS]) ? $props[PR_MESSAGE_CLASS] : false;
		}

		if ($messageClass !== false && stripos($messageClass, 'ipm.schedule.meeting.canceled') === 0) {
			return true;
		}

		return false;
	}

	/**
	 * Function is used to get the last update counter of meeting request.
	 *
	 * @return bool|int false when last_updatecounter not found else return last_updatecounter
	 */
	public function getLastUpdateCounter() {
		$calendarItemProps = mapi_getprops($this->message, [$this->proptags['last_updatecounter']]);
		if (isset($calendarItemProps) && !empty($calendarItemProps)) {
			return $calendarItemProps[$this->proptags['last_updatecounter']];
		}

		return false;
	}

	/**
	 * Process an incoming meeting request response. This updates the appointment
	 * in your calendar to show whether the user has accepted or declined.
	 */
	public function processMeetingRequestResponse() {
		if (!$this->isMeetingRequestResponse()) {
			return;
		}

		if (!$this->isLocalOrganiser()) {
			return;
		}

		// Get information we need from the response message
		$messageprops = mapi_getprops($this->message, [
			$this->proptags['goid'],
			$this->proptags['goid2'],
			PR_OWNER_APPT_ID,
			PR_SENT_REPRESENTING_EMAIL_ADDRESS,
			PR_SENT_REPRESENTING_NAME,
			PR_SENT_REPRESENTING_ADDRTYPE,
			PR_SENT_REPRESENTING_ENTRYID,
			PR_SENT_REPRESENTING_SEARCH_KEY,
			PR_MESSAGE_DELIVERY_TIME,
			PR_MESSAGE_CLASS,
			PR_PROCESSED,
			PR_RCVD_REPRESENTING_ENTRYID,
			$this->proptags['proposed_start_whole'],
			$this->proptags['proposed_end_whole'],
			$this->proptags['proposed_duration'],
			$this->proptags['counter_proposal'],
			$this->proptags['attendee_critical_change'],
		]);

		$goid2 = $messageprops[$this->proptags['goid2']];

		if (!isset($goid2) || !isset($messageprops[PR_SENT_REPRESENTING_EMAIL_ADDRESS])) {
			return;
		}

		// Find basedate in GlobalID(0x3), this can be a response for an occurrence
		$basedate = $this->getBasedateFromGlobalID($messageprops[$this->proptags['goid']]);

		// check if delegate is processing the response
		if (isset($messageprops[PR_RCVD_REPRESENTING_ENTRYID])) {
			$delegatorStore = $this->getDelegatorStore($messageprops[PR_RCVD_REPRESENTING_ENTRYID], [PR_IPM_APPOINTMENT_ENTRYID]);
			$userStore = $delegatorStore['store'];
		}
		else {
			$userStore = $this->store;
		}

		// check for calendar access
		if ($this->checkCalendarWriteAccess($userStore) !== true) {
			// Throw an exception that we don't have write permissions on calendar folder,
			// allow caller to fill the error message
			throw new MAPIException(null, MAPI_E_NO_ACCESS);
		}

		$calendarItem = $this->getCorrespondentCalendarItem(true);

		// Open the calendar items, and update all the recipients of the calendar item that match
		// the email address of the response.
		if ($calendarItem !== false) {
			$this->processResponse($userStore, $calendarItem, $basedate, $messageprops);
		}
	}

	/**
	 * Process every incoming MeetingRequest response.This updates the appointment
	 * in your calendar to show whether the user has accepted or declined.
	 *
	 * @param resource $store        contains the userStore in which the meeting is created
	 * @param mixed    $calendarItem resource of the calendar item for which this response has arrived
	 * @param mixed    $basedate     if present the create an exception
	 * @param array    $messageprops contains message properties
	 */
	public function processResponse($store, $calendarItem, $basedate, $messageprops) {
		$senderentryid = $messageprops[PR_SENT_REPRESENTING_ENTRYID];
		$messageclass = $messageprops[PR_MESSAGE_CLASS];
		$deliverytime = $messageprops[PR_MESSAGE_DELIVERY_TIME];

		// Open the calendar item, find the sender in the recipient table and update all the recipients of the calendar item that match
		// the email address of the response.
		$calendarItemProps = mapi_getprops($calendarItem, [$this->proptags['recurring'], PR_STORE_ENTRYID, PR_PARENT_ENTRYID, PR_ENTRYID, $this->proptags['updatecounter']]);

		// check if meeting response is already processed
		if (isset($messageprops[PR_PROCESSED]) && $messageprops[PR_PROCESSED] == true) {
			// meeting is already processed
			return;
		}
		mapi_setprops($this->message, [PR_PROCESSED => true]);
		mapi_savechanges($this->message);

		// if meeting is updated in organizer's calendar then we don't need to process
		// old response
		if ($this->isMeetingUpdated($basedate)) {
			return;
		}

		// If basedate is found, then create/modify exception msg and do processing
		if ($basedate && isset($calendarItemProps[$this->proptags['recurring']]) && $calendarItemProps[$this->proptags['recurring']] === true) {
			$recurr = new Recurrence($store, $calendarItem);

			// Copy properties from meeting request
			$exception_props = mapi_getprops($this->message, [
				PR_OWNER_APPT_ID,
				$this->proptags['proposed_start_whole'],
				$this->proptags['proposed_end_whole'],
				$this->proptags['proposed_duration'],
				$this->proptags['counter_proposal'],
			]);

			// Create/modify exception
			if ($recurr->isException($basedate)) {
				$recurr->modifyException($exception_props, $basedate);
			}
			else {
				// When we are creating an exception we need copy recipients from main recurring item
				$recipTable = mapi_message_getrecipienttable($calendarItem);
				$recips = mapi_table_queryallrows($recipTable, $this->recipprops);

				// Retrieve actual start/due dates from calendar item.
				$exception_props[$this->proptags['startdate']] = $recurr->getOccurrenceStart($basedate);
				$exception_props[$this->proptags['duedate']] = $recurr->getOccurrenceEnd($basedate);

				$recurr->createException($exception_props, $basedate, false, $recips);
			}

			mapi_savechanges($calendarItem);

			$attach = $recurr->getExceptionAttachment($basedate);
			if ($attach) {
				$recurringItem = $calendarItem;
				$calendarItem = mapi_attach_openobj($attach, MAPI_MODIFY);
			}
			else {
				return false;
			}
		}

		// Get the recipients of the calendar item
		$reciptable = mapi_message_getrecipienttable($calendarItem);
		$recipients = mapi_table_queryallrows($reciptable, $this->recipprops);

		// FIXME we should look at the updatecounter property and compare it
		// to the counter in the recipient to see if this update is actually
		// newer than the status in the calendar item
		$found = false;

		$totalrecips = 0;
		$acceptedrecips = 0;
		foreach ($recipients as $recipient) {
			++$totalrecips;
			if (isset($recipient[PR_ENTRYID]) && $this->compareABEntryIDs($recipient[PR_ENTRYID], $senderentryid)) {
				$found = true;

				/*
				 * If value of attendee_critical_change on meeting response mail is less than PR_RECIPIENT_TRACKSTATUS_TIME
				 * on the corresponding recipientRow of meeting then we ignore this response mail.
				 */
				if (isset($recipient[PR_RECIPIENT_TRACKSTATUS_TIME]) && ($messageprops[$this->proptags['attendee_critical_change']] < $recipient[PR_RECIPIENT_TRACKSTATUS_TIME])) {
					continue;
				}

				// The email address matches, update the row
				$recipient[PR_RECIPIENT_TRACKSTATUS] = $this->getTrackStatus($messageclass);
				if (isset($messageprops[$this->proptags['attendee_critical_change']])) {
					$recipient[PR_RECIPIENT_TRACKSTATUS_TIME] = $messageprops[$this->proptags['attendee_critical_change']];
				}

				// If this is a counter proposal, set the proposal properties in the recipient row
				if (isset($messageprops[$this->proptags['counter_proposal']]) && $messageprops[$this->proptags['counter_proposal']]) {
					$recipient[PR_RECIPIENT_PROPOSEDSTARTTIME] = $messageprops[$this->proptags['proposed_start_whole']];
					$recipient[PR_RECIPIENT_PROPOSEDENDTIME] = $messageprops[$this->proptags['proposed_end_whole']];
					$recipient[PR_RECIPIENT_PROPOSED] = $messageprops[$this->proptags['counter_proposal']];
				}

				// Update the recipient information
				mapi_message_modifyrecipients($calendarItem, MODRECIP_REMOVE, [$recipient]);
				mapi_message_modifyrecipients($calendarItem, MODRECIP_ADD, [$recipient]);
			}
			if (isset($recipient[PR_RECIPIENT_TRACKSTATUS]) && $recipient[PR_RECIPIENT_TRACKSTATUS] == olRecipientTrackStatusAccepted) {
				++$acceptedrecips;
			}
		}

		// If the recipient was not found in the original calendar item,
		// then add the recpient as a new optional recipient
		if (!$found) {
			$recipient = [];
			$recipient[PR_ENTRYID] = $messageprops[PR_SENT_REPRESENTING_ENTRYID];
			$recipient[PR_EMAIL_ADDRESS] = $messageprops[PR_SENT_REPRESENTING_EMAIL_ADDRESS];
			$recipient[PR_DISPLAY_NAME] = $messageprops[PR_SENT_REPRESENTING_NAME];
			$recipient[PR_ADDRTYPE] = $messageprops[PR_SENT_REPRESENTING_ADDRTYPE];
			$recipient[PR_RECIPIENT_TYPE] = MAPI_CC;
			$recipient[PR_SEARCH_KEY] = $messageprops[PR_SENT_REPRESENTING_SEARCH_KEY];
			$recipient[PR_RECIPIENT_TRACKSTATUS] = $this->getTrackStatus($messageclass);
			$recipient[PR_RECIPIENT_TRACKSTATUS_TIME] = $deliverytime;

			// If this is a counter proposal, set the proposal properties in the recipient row
			if (isset($messageprops[$this->proptags['counter_proposal']])) {
				$recipient[PR_RECIPIENT_PROPOSEDSTARTTIME] = $messageprops[$this->proptags['proposed_start_whole']];
				$recipient[PR_RECIPIENT_PROPOSEDENDTIME] = $messageprops[$this->proptags['proposed_end_whole']];
				$recipient[PR_RECIPIENT_PROPOSED] = $messageprops[$this->proptags['counter_proposal']];
			}

			mapi_message_modifyrecipients($calendarItem, MODRECIP_ADD, [$recipient]);
			++$totalrecips;
			if ($recipient[PR_RECIPIENT_TRACKSTATUS] == olRecipientTrackStatusAccepted) {
				++$acceptedrecips;
			}
		}

		// TODO: Update counter proposal number property on message
		/*
		If it is the first time this attendee has proposed a new date/time, increment the value of the PidLidAppointmentProposalNumber property on the organizer's meeting object, by 0x00000001. If this property did not previously exist on the organizer's meeting object, it MUST be set with a value of 0x00000001.
		*/
		// If this is a counter proposal, set the counter proposal indicator boolean
		if (isset($messageprops[$this->proptags['counter_proposal']])) {
			$props = [];
			if ($messageprops[$this->proptags['counter_proposal']]) {
				$props[$this->proptags['counter_proposal']] = true;
			}
			else {
				$props[$this->proptags['counter_proposal']] = false;
			}

			mapi_setprops($calendarItem, $props);
		}

		mapi_savechanges($calendarItem);
		if (isset($attach)) {
			mapi_savechanges($attach);
			mapi_savechanges($recurringItem);
		}
	}

	/**
	 * Process an incoming meeting request cancellation. This updates the
	 * appointment in your calendar to show that the meeting has been cancelled.
	 */
	public function processMeetingCancellation() {
		if (!$this->isMeetingCancellation()) {
			return;
		}

		if ($this->isLocalOrganiser()) {
			return;
		}

		if (!$this->isInCalendar()) {
			return;
		}

		$listProperties = $this->proptags;
		$listProperties['subject'] = PR_SUBJECT;
		$listProperties['sent_representing_name'] = PR_SENT_REPRESENTING_NAME;
		$listProperties['sent_representing_address_type'] = PR_SENT_REPRESENTING_ADDRTYPE;
		$listProperties['sent_representing_email_address'] = PR_SENT_REPRESENTING_EMAIL_ADDRESS;
		$listProperties['sent_representing_entryid'] = PR_SENT_REPRESENTING_ENTRYID;
		$listProperties['sent_representing_search_key'] = PR_SENT_REPRESENTING_SEARCH_KEY;
		$listProperties['rcvd_representing_name'] = PR_RCVD_REPRESENTING_NAME;
		$listProperties['rcvd_representing_address_type'] = PR_RCVD_REPRESENTING_ADDRTYPE;
		$listProperties['rcvd_representing_email_address'] = PR_RCVD_REPRESENTING_EMAIL_ADDRESS;
		$listProperties['rcvd_representing_entryid'] = PR_RCVD_REPRESENTING_ENTRYID;
		$listProperties['rcvd_representing_search_key'] = PR_RCVD_REPRESENTING_SEARCH_KEY;
		$messageProps = mapi_getprops($this->message, $listProperties);

		$goid = $messageProps[$this->proptags['goid']];	// GlobalID (0x3)
		if (!isset($goid)) {
			return;
		}

		// get delegator store, if delegate is processing this cancellation
		if (isset($messageProps[PR_RCVD_REPRESENTING_ENTRYID])) {
			$delegatorStore = $this->getDelegatorStore($messageProps[PR_RCVD_REPRESENTING_ENTRYID], [PR_IPM_APPOINTMENT_ENTRYID]);

			$store = $delegatorStore['store'];
		}
		else {
			$store = $this->store;
		}

		// check for calendar access
		if ($this->checkCalendarWriteAccess($store) !== true) {
			// Throw an exception that we don't have write permissions on calendar folder,
			// allow caller to fill the error message
			throw new MAPIException(null, MAPI_E_NO_ACCESS);
		}

		$calendarItem = $this->getCorrespondentCalendarItem(true);
		$basedate = $this->getBasedateFromGlobalID($goid);

		if ($calendarItem !== false) {
			// if basedate is provided and we could not find the item then it could be that we are processing
			// an exception so get the exception and process it
			if ($basedate) {
				$calendarItemProps = mapi_getprops($calendarItem, [$this->proptags['recurring']]);
				if ($calendarItemProps[$this->proptags['recurring']] === true) {
					$recurr = new Recurrence($store, $calendarItem);

					// Set message class
					$messageProps[PR_MESSAGE_CLASS] = 'IPM.Appointment';

					if ($recurr->isException($basedate)) {
						$recurr->modifyException($messageProps, $basedate);
					}
					else {
						$recurr->createException($messageProps, $basedate);
					}
				}
			}
			else {
				// set the properties of the cancellation object
				mapi_setprops($calendarItem, $messageProps);
			}

			mapi_savechanges($calendarItem);
		}
	}

	/**
	 * Returns true if the corresponding calendar items exists in the celendar folder for this
	 * meeting request/response/cancellation.
	 */
	public function isInCalendar() {
		// @TODO check for deleted exceptions
		return $this->getCorrespondentCalendarItem(false) !== false;
	}

	/**
	 * Accepts the meeting request by moving the item to the calendar
	 * and sending a confirmation message back to the sender. If $tentative
	 * is TRUE, then the item is accepted tentatively. After accepting, you
	 * can't use this class instance any more. The message is closed. If you
	 * specify TRUE for 'move', then the item is actually moved (from your
	 * inbox probably) to the calendar. If you don't, it is copied into
	 * your calendar.
	 *
	 * @param bool  $tentative            true if user as tentative accepted the meeting
	 * @param bool  $sendresponse         true if a response has to be sent to organizer
	 * @param bool  $move                 true if the meeting request should be moved to the deleted items after processing
	 * @param mixed $newProposedStartTime contains starttime if user has proposed other time
	 * @param mixed $newProposedEndTime   contains endtime if user has proposed other time
	 * @param mixed $body
	 * @param mixed $userAction
	 * @param mixed $store
	 * @param mixed $basedate             start of day of occurrence for which user has accepted the recurrent meeting
	 * @param bool  $isImported           true to indicate that MR is imported from .ics or .vcs file else it false.
	 *
	 * @return bool|string $entryid entryid of item which created/updated in calendar
	 */
	public function doAccept($tentative, $sendresponse, $move, $newProposedStartTime = false, $newProposedEndTime = false, $body = false, $userAction = false, $store = false, $basedate = false, $isImported = false) {
		if ($this->isLocalOrganiser()) {
			return false;
		}

		// Remove any previous calendar items with this goid and appt id
		$messageprops = mapi_getprops($this->message, [PR_ENTRYID, PR_MESSAGE_CLASS, $this->proptags['goid'], $this->proptags['updatecounter'], PR_PROCESSED, PR_RCVD_REPRESENTING_ENTRYID, PR_SENDER_ENTRYID, PR_SENT_REPRESENTING_ENTRYID, PR_RECEIVED_BY_ENTRYID]);

		// If this meeting request is received by a delegate then open delegator's store.
		if (isset($messageprops[PR_RCVD_REPRESENTING_ENTRYID])) {
			$delegatorStore = $this->getDelegatorStore($messageprops[PR_RCVD_REPRESENTING_ENTRYID], [PR_IPM_APPOINTMENT_ENTRYID]);

			$store = $delegatorStore['store'];
			$calFolder = $delegatorStore[PR_IPM_APPOINTMENT_ENTRYID];
		}
		else {
			$calFolder = $this->openDefaultCalendar();
			$store = $this->store;
		}

		// check for calendar access
		if ($this->checkCalendarWriteAccess($store) !== true) {
			// Throw an exception that we don't have write permissions on calendar folder,
			// allow caller to fill the error message
			throw new MAPIException(null, MAPI_E_NO_ACCESS);
		}

		// if meeting is out dated then don't process it
		if ($this->isMeetingRequest($messageprops[PR_MESSAGE_CLASS]) && $this->isMeetingOutOfDate()) {
			return false;
		}

		/*
		 *	if this function is called automatically with meeting request object then there will be
		 *	two possibilitites
		 *	1) meeting request is opened first time, in this case make a tentative appointment in
		 *		recipient's calendar
		 *	2) after this every subsequent request to open meeting request will not do any processing
		 */
		if ($this->isMeetingRequest($messageprops[PR_MESSAGE_CLASS]) && $userAction == false) {
			if (isset($messageprops[PR_PROCESSED]) && $messageprops[PR_PROCESSED] == true) {
				// if meeting request is already processed then don't do anything
				return false;
			}

			// if correspondent calendar item is already processed then don't do anything
			$calendarItem = $this->getCorrespondentCalendarItem();
			if ($calendarItem) {
				$calendarItemProps = mapi_getprops($calendarItem, [PR_PROCESSED]);
				if (isset($calendarItemProps[PR_PROCESSED]) && $calendarItemProps[PR_PROCESSED] == true) {
					// mark meeting-request mail as processed as well
					mapi_setprops($this->message, [PR_PROCESSED => true]);
					mapi_savechanges($this->message);

					return false;
				}
			}
		}

		// Retrieve basedate from globalID, if it is not received as argument
		if (!$basedate) {
			$basedate = $this->getBasedateFromGlobalID($messageprops[$this->proptags['goid']]);
		}

		// set counter proposal properties in calendar item when proposing new time
		$proposeNewTimeProps = [];
		if ($newProposedStartTime && $newProposedEndTime) {
			$proposeNewTimeProps[$this->proptags['proposed_start_whole']] = $newProposedStartTime;
			$proposeNewTimeProps[$this->proptags['proposed_end_whole']] = $newProposedEndTime;
			$proposeNewTimeProps[$this->proptags['proposed_duration']] = round($newProposedEndTime - $newProposedStartTime) / 60;
			$proposeNewTimeProps[$this->proptags['counter_proposal']] = true;
		}

		// While sender is receiver then we have to process the meeting request as per the intended busy status
		// instead of tentative, and accept the same as per the intended busystatus.
		$senderEntryId = isset($messageprops[PR_SENT_REPRESENTING_ENTRYID]) ? $messageprops[PR_SENT_REPRESENTING_ENTRYID] : $messageprops[PR_SENDER_ENTRYID];
		if (isset($messageprops[PR_RECEIVED_BY_ENTRYID]) && compareEntryIds($senderEntryId, $messageprops[PR_RECEIVED_BY_ENTRYID])) {
			$entryid = $this->accept(false, $sendresponse, $move, $proposeNewTimeProps, $body, true, $store, $calFolder, $basedate);
		}
		else {
			$entryid = $this->accept($tentative, $sendresponse, $move, $proposeNewTimeProps, $body, $userAction, $store, $calFolder, $basedate);
		}

		// if we have first time processed this meeting then set PR_PROCESSED property
		if ($this->isMeetingRequest($messageprops[PR_MESSAGE_CLASS]) && $userAction === false && $isImported === false) {
			if (!isset($messageprops[PR_PROCESSED]) || $messageprops[PR_PROCESSED] != true) {
				// set processed flag
				mapi_setprops($this->message, [PR_PROCESSED => true]);
				mapi_savechanges($this->message);
			}
		}

		return $entryid;
	}

	public function accept($tentative, $sendresponse, $move, $proposeNewTimeProps = [], $body = false, $userAction = false, $store, $calFolder, $basedate = false) {
		$messageprops = mapi_getprops($this->message);
		$isDelegate = isset($messageprops[PR_RCVD_REPRESENTING_NAME]);

		if ($sendresponse) {
			$this->createResponse($tentative ? olResponseTentative : olResponseAccepted, $proposeNewTimeProps, $body, $store, $basedate, $calFolder);
		}

		/*
		 * Further processing depends on what user is receiving. User can receive recurring item, a single occurrence or a normal meeting.
		 * 1) If meeting req is of recurrence then we find all the occurrence in calendar because in past user might have received one or few occurrences.
		 * 2) If single occurrence then find occurrence itself using globalID and if item is not found then use cleanGlobalID to find main recurring item
		 * 3) Normal meeting req are handled normally as they were handled previously.
		 *
		 * Also user can respond(accept/decline) to item either from previewpane or from calendar by opening the item. If user is responding the meeting from previewpane
		 * and that item is not found in calendar then item is move else item is opened and all properties, attachments and recipient are copied from meeting request.
		 * If user is responding from calendar then item is opened and properties are set such as meetingstatus, responsestatus, busystatus etc.
		 */
		if ($this->isMeetingRequest($messageprops[PR_MESSAGE_CLASS])) {
			// While processing the item mark it as read.
			mapi_message_setreadflag($this->message, SUPPRESS_RECEIPT);

			// This meeting request item is recurring, so find all occurrences and saves them all as exceptions to this meeting request item.
			if (isset($messageprops[$this->proptags['recurring']]) && $messageprops[$this->proptags['recurring']] == true) {
				$calendarItem = false;

				// Find main recurring item based on GlobalID (0x3)
				$items = $this->findCalendarItems($messageprops[$this->proptags['goid2']], $calFolder);
				if (is_array($items)) {
					foreach ($items as $key => $entryid) {
						$calendarItem = mapi_msgstore_openentry($store, $entryid);
					}
				}

				$processed = false;
				if (!$calendarItem) {
					// Recurring item not found, so create new meeting in Calendar
					$calendarItem = mapi_folder_createmessage($calFolder);
				}
				else {
					// we have found the main recurring item, check if this meeting request is already processed
					if (isset($messageprops[PR_PROCESSED]) && $messageprops[PR_PROCESSED] == true) {
						// only set required properties, other properties are already copied when processing this meeting request
						// for the first time
						$processed = true;
					}
				}

				if (!$processed) {
					// get all the properties and copy that to calendar item
					$props = mapi_getprops($this->message);
					// reset the PidLidMeetingType to Unspecified for outlook display the item
					$props[$this->proptags['meetingtype']] = mtgEmpty;
					/*
					 * the client which has sent this meeting request can generate wrong flagdueby
					 * time (mainly OL), so regenerate that property so we will always show reminder
					 * on right time
					 */
					if (isset($props[$this->proptags['reminderminutes']])) {
						$props[$this->proptags['flagdueby']] = $props[$this->proptags['startdate']] - ($props[$this->proptags['reminderminutes']] * 60);
					}
				}
				else {
					// only get required properties so we will not overwrite existing updated properties from calendar
					$props = mapi_getprops($this->message, [PR_ENTRYID]);
				}

				// While we applying updates of MR then all local categories will be removed,
				// So get the local categories of all occurrence before applying update from organiser.
				$localCategories = $this->getLocalCategories($calendarItem, $store, $calFolder);

				$props[PR_MESSAGE_CLASS] = 'IPM.Appointment';
				// When meeting requests are generated by third-party solutions, we might be missing the updatecounter property.
				if (!isset($props[$this->proptags['updatecounter']])) {
					$props[$this->proptags['updatecounter']] = 0;
				}
				$props[$this->proptags['meetingstatus']] = olMeetingReceived;
				// when we are automatically processing the meeting request set responsestatus to olResponseNotResponded
				$props[$this->proptags['responsestatus']] = $userAction ? ($tentative ? olResponseTentative : olResponseAccepted) : olResponseNotResponded;

				if (isset($props[$this->proptags['intendedbusystatus']])) {
					if ($tentative && $props[$this->proptags['intendedbusystatus']] !== fbFree) {
						$props[$this->proptags['busystatus']] = fbTentative;
					}
					else {
						$props[$this->proptags['busystatus']] = $props[$this->proptags['intendedbusystatus']];
					}
				// we already have intendedbusystatus value in $props so no need to copy it
				}
				else {
					$props[$this->proptags['busystatus']] = $tentative ? fbTentative : fbBusy;
				}

				if ($userAction) {
					$addrInfo = $this->getOwnerAddress($this->store);

					// if user has responded then set replytime and name
					$props[$this->proptags['replytime']] = time();
					if (!empty($addrInfo)) {
						// @FIXME conditionally set this property only for delegation case
						$props[$this->proptags['apptreplyname']] = $addrInfo[0];
					}
				}

				mapi_setprops($calendarItem, $props);

				// we have already processed attachments and recipients, so no need to do it again
				if (!$processed) {
					// Copy attachments too
					$this->replaceAttachments($this->message, $calendarItem);
					// Copy recipients too
					$this->replaceRecipients($this->message, $calendarItem, $isDelegate);
				}

				// Find all occurrences based on CleanGlobalID (0x23)
				// there will be no exceptions left if $processed is true, but even if it doesn't hurt to recheck
				$items = $this->findCalendarItems($messageprops[$this->proptags['goid2']], $calFolder, true);
				if (is_array($items)) {
					// Save all existing occurrence as exceptions
					foreach ($items as $entryid) {
						// Open occurrence
						$occurrenceItem = mapi_msgstore_openentry($store, $entryid);

						// Save occurrence into main recurring item as exception
						if ($occurrenceItem) {
							$occurrenceItemProps = mapi_getprops($occurrenceItem, [$this->proptags['goid'], $this->proptags['recurring']]);

							// Find basedate of occurrence item
							$basedate = $this->getBasedateFromGlobalID($occurrenceItemProps[$this->proptags['goid']]);
							if ($basedate && $occurrenceItemProps[$this->proptags['recurring']] != true) {
								$this->mergeException($calendarItem, $occurrenceItem, $basedate, $store);
							}
						}
					}
				}

				mapi_savechanges($calendarItem);

				// After applying update of organiser all local categories of occurrence was removed,
				// So if local categories exist then apply it on respective occurrence.
				if (!empty($localCategories)) {
					$this->applyLocalCategories($calendarItem, $store, $localCategories);
				}

				if ($move) {
					// open wastebasket of currently logged in user and move the meeting request to it
					// for delegates this will be delegate's wastebasket folder
					$wastebasket = $this->openDefaultWastebasket($this->openDefaultStore());
					mapi_folder_copymessages($calFolder, [$props[PR_ENTRYID]], $wastebasket, MESSAGE_MOVE);
				}

				$entryid = $props[PR_ENTRYID];
			}
			else {
				/**
				 * This meeting request is not recurring, so can be an exception or normal meeting.
				 * If exception then find main recurring item and update exception
				 * If main recurring item is not found then put exception into Calendar as normal meeting.
				 */
				$calendarItem = false;

				// We found basedate in GlobalID of this meeting request, so this meeting request if for an occurrence.
				if ($basedate) {
					// Find main recurring item from CleanGlobalID of this meeting request
					$items = $this->findCalendarItems($messageprops[$this->proptags['goid2']], $calFolder);
					if (is_array($items)) {
						foreach ($items as $key => $entryid) {
							$calendarItem = mapi_msgstore_openentry($store, $entryid);
						}
					}

					// Main recurring item is found, so now update exception
					if ($calendarItem) {
						$this->acceptException($calendarItem, $this->message, $basedate, $move, $tentative, $userAction, $store, $isDelegate);
						$calendarItemProps = mapi_getprops($calendarItem, [PR_ENTRYID]);
						$entryid = $calendarItemProps[PR_ENTRYID];
					}
				}

				if (!$calendarItem) {
					$items = $this->findCalendarItems($messageprops[$this->proptags['goid']], $calFolder);
					if (is_array($items)) {
						// Get local categories before deleting MR.
						$message = mapi_msgstore_openentry($store, $items[0]);
						$localCategories = mapi_getprops($message, [$this->proptags['categories']]);
						mapi_folder_deletemessages($calFolder, $items);
					}

					if ($move) {
						// All we have to do is open the default calendar,
						// set the message class correctly to be an appointment item
						// and move it to the calendar folder
						$sourcefolder = $this->openParentFolder();

						// create a new calendar message, and copy the message to there,
						// since we want to delete (move to wastebasket) the original message
						$old_entryid = mapi_getprops($this->message, [PR_ENTRYID]);
						$calmsg = mapi_folder_createmessage($calFolder);
						mapi_copyto($this->message, [], [], $calmsg); /* includes attachments and recipients */
						// reset the PidLidMeetingType to Unspecified for outlook display the item
						$tmp_props = [];
						$tmp_props[$this->proptags['meetingtype']] = mtgEmpty;
						// OL needs this field always being set, or it will not display item
						$tmp_props[$this->proptags['recurring']] = false;
						mapi_setprops($calmsg, $tmp_props);

						// After creating new MR, If local categories exist then apply it on new MR.
						if (!empty($localCategories)) {
							mapi_setprops($calmsg, $localCategories);
						}

						$calItemProps = [];
						$calItemProps[PR_MESSAGE_CLASS] = 'IPM.Appointment';

						/*
						 * the client which has sent this meeting request can generate wrong flagdueby
						 * time (mainly OL), so regenerate that property so we will always show reminder
						 * on right time
						 */
						if (isset($messageprops[$this->proptags['reminderminutes']])) {
							$calItemProps[$this->proptags['flagdueby']] = $messageprops[$this->proptags['startdate']] - ($messageprops[$this->proptags['reminderminutes']] * 60);
						}

						if (isset($messageprops[$this->proptags['intendedbusystatus']])) {
							if ($tentative && $messageprops[$this->proptags['intendedbusystatus']] !== fbFree) {
								$calItemProps[$this->proptags['busystatus']] = fbTentative;
							}
							else {
								$calItemProps[$this->proptags['busystatus']] = $messageprops[$this->proptags['intendedbusystatus']];
							}
							$calItemProps[$this->proptags['intendedbusystatus']] = $messageprops[$this->proptags['intendedbusystatus']];
						}
						else {
							$calItemProps[$this->proptags['busystatus']] = $tentative ? fbTentative : fbBusy;
						}

						// when we are automatically processing the meeting request set responsestatus to olResponseNotResponded
						$calItemProps[$this->proptags['responsestatus']] = $userAction ? ($tentative ? olResponseTentative : olResponseAccepted) : olResponseNotResponded;
						if ($userAction) {
							$addrInfo = $this->getOwnerAddress($this->store);

							// if user has responded then set replytime and name
							$calItemProps[$this->proptags['replytime']] = time();
							if (!empty($addrInfo)) {
								$calItemProps[$this->proptags['apptreplyname']] = $addrInfo[0];
							}
						}

						$calItemProps[$this->proptags['recurring_pattern']] = '';
						$calItemProps[$this->proptags['alldayevent']] = $calItemProps[$this->proptags['alldayevent']] ?? false;
						$calItemProps[$this->proptags['private']] = $calItemProps[$this->proptags['private']] ?? false;
						$calItemProps[$this->proptags['meetingstatus']] = $calItemProps[$this->proptags['meetingstatus']] ?? olMeetingReceived;
						if (isset($calItemProps[$this->proptags['startdate']])) {
							$calItemProps[$this->proptags['commonstart']] = $calItemProps[$this->proptags['startdate']];
						}
						if (isset($calItemProps[$this->proptags['duedate']])) {
							$calItemProps[$this->proptags['commonend']] = $calItemProps[$this->proptags['duedate']];
						}

						mapi_setprops($calmsg, $proposeNewTimeProps + $calItemProps);

						// get properties which stores owner information in meeting request mails
						$props = mapi_getprops($calmsg, [
							PR_SENT_REPRESENTING_ENTRYID,
							PR_SENT_REPRESENTING_NAME,
							PR_SENT_REPRESENTING_EMAIL_ADDRESS,
							PR_SENT_REPRESENTING_ADDRTYPE,
							PR_SENT_REPRESENTING_SEARCH_KEY,
						]);

						// add owner to recipient table
						$recips = [];
						$this->addOrganizer($props, $recips);
						mapi_message_modifyrecipients($calmsg, MODRECIP_ADD, $recips);
						mapi_savechanges($calmsg);

						// Move the message to the wastebasket
						$wastebasket = $this->openDefaultWastebasket($this->openDefaultStore());
						mapi_folder_copymessages($sourcefolder, [$old_entryid[PR_ENTRYID]], $wastebasket, MESSAGE_MOVE);

						$messageprops = mapi_getprops($calmsg, [PR_ENTRYID]);
						$entryid = $messageprops[PR_ENTRYID];
					}
					else {
						// Create a new appointment with duplicate properties and recipient, but as an IPM.Appointment
						$new = mapi_folder_createmessage($calFolder);
						$props = mapi_getprops($this->message);

						$props[$this->proptags['recurring_pattern']] = '';
						$props[$this->proptags['alldayevent']] = $props[$this->proptags['alldayevent']] ?? false;
						$props[$this->proptags['private']] = $props[$this->proptags['private']] ?? false;
						$props[$this->proptags['meetingstatus']] = $props[$this->proptags['meetingstatus']] ?? olMeetingReceived;
						if (isset($props[$this->proptags['startdate']])) {
							$props[$this->proptags['commonstart']] = $props[$this->proptags['startdate']];
						}
						if (isset($props[$this->proptags['duedate']])) {
							$props[$this->proptags['commonend']] = $props[$this->proptags['duedate']];
						}

						$props[PR_MESSAGE_CLASS] = 'IPM.Appointment';
						// reset the PidLidMeetingType to Unspecified for outlook display the item
						$props[$this->proptags['meetingtype']] = mtgEmpty;
						// OL needs this field always being set, or it will not display item
						$props[$this->proptags['recurring']] = false;

						// After creating new MR, If local categories exist then apply it on new MR.
						if (!empty($localCategories)) {
							mapi_setprops($new, $localCategories);
						}

						/*
						 * the client which has sent this meeting request can generate wrong flagdueby
						 * time (mainly OL), so regenerate that property so we will always show reminder
						 * on right time
						 */
						if (isset($props[$this->proptags['reminderminutes']])) {
							$props[$this->proptags['flagdueby']] = $props[$this->proptags['startdate']] - ($props[$this->proptags['reminderminutes']] * 60);
						}

						// When meeting requests are generated by third-party solutions, we might be missing the updatecounter property.
						if (!isset($props[$this->proptags['updatecounter']])) {
							$props[$this->proptags['updatecounter']] = 0;
						}
						// when we are automatically processing the meeting request set responsestatus to olResponseNotResponded
						$props[$this->proptags['responsestatus']] = $userAction ? ($tentative ? olResponseTentative : olResponseAccepted) : olResponseNotResponded;

						if (isset($props[$this->proptags['intendedbusystatus']])) {
							if ($tentative && $props[$this->proptags['intendedbusystatus']] !== fbFree) {
								$props[$this->proptags['busystatus']] = fbTentative;
							}
							else {
								$props[$this->proptags['busystatus']] = $props[$this->proptags['intendedbusystatus']];
							}
						// we already have intendedbusystatus value in $props so no need to copy it
						}
						else {
							$props[$this->proptags['busystatus']] = $tentative ? fbTentative : fbBusy;
						}

						if ($userAction) {
							$addrInfo = $this->getOwnerAddress($this->store);

							// if user has responded then set replytime and name
							$props[$this->proptags['replytime']] = time();
							if (!empty($addrInfo)) {
								$props[$this->proptags['apptreplyname']] = $addrInfo[0];
							}
						}

						mapi_setprops($new, $proposeNewTimeProps + $props);

						$reciptable = mapi_message_getrecipienttable($this->message);

						$recips = [];
						// If delegate, then do not add the delegate in recipients
						if ($isDelegate) {
							$delegate = mapi_getprops($this->message, [PR_RECEIVED_BY_EMAIL_ADDRESS]);
							$res = [
								RES_PROPERTY,
								[
									RELOP => RELOP_NE,
									ULPROPTAG => PR_EMAIL_ADDRESS,
									VALUE => [PR_EMAIL_ADDRESS => $delegate[PR_RECEIVED_BY_EMAIL_ADDRESS]],
								],
							];
							$recips = mapi_table_queryallrows($reciptable, $this->recipprops, $res);
						}
						else {
							$recips = mapi_table_queryallrows($reciptable, $this->recipprops);
						}

						$this->addOrganizer($props, $recips);
						mapi_message_modifyrecipients($new, MODRECIP_ADD, $recips);
						mapi_savechanges($new);

						$props = mapi_getprops($new, [PR_ENTRYID]);
						$entryid = $props[PR_ENTRYID];
					}
				}
			}
		}
		else {
			// Here only properties are set on calendaritem, because user is responding from calendar.
			$props = [];
			$props[$this->proptags['responsestatus']] = $tentative ? olResponseTentative : olResponseAccepted;

			if (isset($messageprops[$this->proptags['intendedbusystatus']])) {
				if ($tentative && $messageprops[$this->proptags['intendedbusystatus']] !== fbFree) {
					$props[$this->proptags['busystatus']] = fbTentative;
				}
				else {
					$props[$this->proptags['busystatus']] = $messageprops[$this->proptags['intendedbusystatus']];
				}
				$props[$this->proptags['intendedbusystatus']] = $messageprops[$this->proptags['intendedbusystatus']];
			}
			else {
				$props[$this->proptags['busystatus']] = $tentative ? fbTentative : fbBusy;
			}

			$props[$this->proptags['meetingstatus']] = olMeetingReceived;

			$addrInfo = $this->getOwnerAddress($this->store);

			// if user has responded then set replytime and name
			$props[$this->proptags['replytime']] = time();
			if (!empty($addrInfo)) {
				$props[$this->proptags['apptreplyname']] = $addrInfo[0];
			}

			if ($basedate) {
				$recurr = new Recurrence($store, $this->message);

				// Copy recipients list
				$reciptable = mapi_message_getrecipienttable($this->message);
				$recips = mapi_table_queryallrows($reciptable, $this->recipprops);

				if ($recurr->isException($basedate)) {
					$recurr->modifyException($proposeNewTimeProps + $props, $basedate, $recips);
				}
				else {
					$props[$this->proptags['startdate']] = $recurr->getOccurrenceStart($basedate);
					$props[$this->proptags['duedate']] = $recurr->getOccurrenceEnd($basedate);

					$props[PR_SENT_REPRESENTING_EMAIL_ADDRESS] = $messageprops[PR_SENT_REPRESENTING_EMAIL_ADDRESS];
					$props[PR_SENT_REPRESENTING_NAME] = $messageprops[PR_SENT_REPRESENTING_NAME];
					$props[PR_SENT_REPRESENTING_ADDRTYPE] = $messageprops[PR_SENT_REPRESENTING_ADDRTYPE];
					$props[PR_SENT_REPRESENTING_ENTRYID] = $messageprops[PR_SENT_REPRESENTING_ENTRYID];
					$props[PR_SENT_REPRESENTING_SEARCH_KEY] = $messageprops[PR_SENT_REPRESENTING_SEARCH_KEY];

					$recurr->createException($proposeNewTimeProps + $props, $basedate, false, $recips);
				}
			}
			else {
				mapi_setprops($this->message, $proposeNewTimeProps + $props);
			}
			mapi_savechanges($this->message);

			$entryid = $messageprops[PR_ENTRYID];
		}

		return $entryid;
	}

	/**
	 * Declines the meeting request by moving the item to the deleted
	 * items folder and sending a decline message. After declining, you
	 * can't use this class instance any more. The message is closed.
	 * When an occurrence is decline then false is returned because that
	 * occurrence is deleted not the recurring item.
	 *
	 * @param bool  $sendresponse true if a response has to be sent to organizer
	 * @param mixed $basedate     if specified contains starttime of day of an occurrence
	 * @param mixed $body
	 *
	 * @return bool true if item is deleted from Calendar else false
	 */
	public function doDecline($sendresponse, $basedate = false, $body = false) {
		if ($this->isLocalOrganiser()) {
			return false;
		}

		$result = false;
		$calendaritem = false;

		// Remove any previous calendar items with this goid and appt id
		$messageprops = mapi_getprops($this->message, [$this->proptags['goid'], $this->proptags['goid2'], PR_RCVD_REPRESENTING_ENTRYID]);

		// If this meeting request is received by a delegate then open delegator's store.
		if (isset($messageprops[PR_RCVD_REPRESENTING_ENTRYID])) {
			$delegatorStore = $this->getDelegatorStore($messageprops[PR_RCVD_REPRESENTING_ENTRYID], [PR_IPM_APPOINTMENT_ENTRYID]);

			$store = $delegatorStore['store'];
			$calFolder = $delegatorStore[PR_IPM_APPOINTMENT_ENTRYID];
		}
		else {
			$calFolder = $this->openDefaultCalendar();
			$store = $this->store;
		}

		// check for calendar access before deleting the calendar item
		if ($this->checkCalendarWriteAccess($store) !== true) {
			// Throw an exception that we don't have write permissions on calendar folder,
			// allow caller to fill the error message
			throw new MAPIException(null, MAPI_E_NO_ACCESS);
		}

		$goid = $messageprops[$this->proptags['goid']];

		// First, find the items in the calendar by GlobalObjid (0x3)
		$entryids = $this->findCalendarItems($goid, $calFolder);

		if (!$basedate) {
			$basedate = $this->getBasedateFromGlobalID($goid);
		}

		if ($sendresponse) {
			$this->createResponse(olResponseDeclined, [], $body, $store, $basedate, $calFolder);
		}

		if ($basedate) {
			// use CleanGlobalObjid (0x23)
			$calendaritems = $this->findCalendarItems($messageprops[$this->proptags['goid2']], $calFolder);

			if (is_array($calendaritems)) {
				foreach ($calendaritems as $entryid) {
					// Open each calendar item and set the properties of the cancellation object
					$calendaritem = mapi_msgstore_openentry($store, $entryid);

					// Recurring item is found, now delete exception
					if ($calendaritem) {
						$this->doRemoveExceptionFromCalendar($basedate, $calendaritem, $store);
						$result = true;
					}
				}
			}

			if ($this->isMeetingRequest()) {
				$calendaritem = false;
			}
		}

		if (!$calendaritem) {
			$calendar = $this->openDefaultCalendar($store);

			if (!empty($entryids)) {
				mapi_folder_deletemessages($calendar, $entryids);
			}

			// All we have to do to decline, is to move the item to the waste basket
			$wastebasket = $this->openDefaultWastebasket($this->openDefaultStore());
			$sourcefolder = $this->openParentFolder();

			$messageprops = mapi_getprops($this->message, [PR_ENTRYID]);

			// Release the message
			$this->message = null;

			// Move the message to the waste basket
			mapi_folder_copymessages($sourcefolder, [$messageprops[PR_ENTRYID]], $wastebasket, MESSAGE_MOVE);

			$result = true;
		}

		return $result;
	}

	/**
	 * Removes a meeting request from the calendar when the user presses the
	 * 'remove from calendar' button in response to a meeting cancellation.
	 *
	 * @param mixed $basedate if specified contains starttime of day of an occurrence
	 */
	public function doRemoveFromCalendar($basedate) {
		if ($this->isLocalOrganiser()) {
			return false;
		}

		$messageprops = mapi_getprops($this->message, [PR_ENTRYID, $this->proptags['goid'], PR_RCVD_REPRESENTING_ENTRYID, PR_MESSAGE_CLASS]);

		$goid = $messageprops[$this->proptags['goid']];

		if (isset($messageprops[PR_RCVD_REPRESENTING_ENTRYID])) {
			$delegatorStore = $this->getDelegatorStore($messageprops[PR_RCVD_REPRESENTING_ENTRYID], [PR_IPM_APPOINTMENT_ENTRYID]);

			$store = $delegatorStore['store'];
			$calFolder = $delegatorStore[PR_IPM_APPOINTMENT_ENTRYID];
		}
		else {
			$store = $this->store;
			$calFolder = $this->openDefaultCalendar();
		}

		// check for calendar access before deleting the calendar item
		if ($this->checkCalendarWriteAccess($store) !== true) {
			// Throw an exception that we don't have write permissions on calendar folder,
			// allow caller to fill the error message
			throw new MAPIException(null, MAPI_E_NO_ACCESS);
		}

		$wastebasket = $this->openDefaultWastebasket($this->openDefaultStore());
		// get the source folder of the meeting message
		$sourcefolder = $this->openParentFolder();

		// Check if the message is a meeting request in the inbox or a calendaritem by checking the message class
		if ($this->isMeetingCancellation($messageprops[PR_MESSAGE_CLASS])) {
			// get the basedate to check for exception
			$basedate = $this->getBasedateFromGlobalID($goid);

			$calendarItem = $this->getCorrespondentCalendarItem(true);

			if ($calendarItem !== false) {
				// basedate is provided so open exception
				if ($basedate) {
					$exception = $this->getExceptionItem($calendarItem, $basedate);

					if ($exception !== false) {
						// exception found, remove it from calendar
						$this->doRemoveExceptionFromCalendar($basedate, $calendarItem, $store);
					}
				}
				else {
					// remove normal / recurring series from calendar
					$entryids = mapi_getprops($calendarItem, [PR_ENTRYID]);

					$entryids = [$entryids[PR_ENTRYID]];

					mapi_folder_copymessages($calFolder, $entryids, $wastebasket, MESSAGE_MOVE);
				}
			}

			// Release the message, because we are going to move it to wastebasket
			$this->message = null;

			// Move the cancellation mail to wastebasket
			mapi_folder_copymessages($sourcefolder, [$messageprops[PR_ENTRYID]], $wastebasket, MESSAGE_MOVE);
		}
		else {
			// Here only properties are set on calendaritem, because user is responding from calendar.
			if ($basedate) {
				// remove the occurrence
				$this->doRemoveExceptionFromCalendar($basedate, $this->message, $store);
			}
			else {
				// remove normal/recurring meeting item.
				// Move the message to the waste basket
				mapi_folder_copymessages($sourcefolder, [$messageprops[PR_ENTRYID]], $wastebasket, MESSAGE_MOVE);
			}
		}
	}

	/**
	 * Function can be used to cancel any existing meeting and send cancellation mails to attendees.
	 * Should only be called from meeting object from calendar.
	 *
	 * @param mixed $basedate (optional) basedate of occurrence which should be cancelled
	 * @FIXME cancellation mail is also sent to attendee which has declined the meeting
	 * @FIXME don't send canellation mail when cancelling meeting from past
	 */
	public function doCancelInvitation($basedate = false) {
		if (!$this->isLocalOrganiser()) {
			return;
		}

		// check write access for delegate
		if ($this->checkCalendarWriteAccess($this->store) !== true) {
			// Throw an exception that we don't have write permissions on calendar folder,
			// error message will be filled by module
			throw new MAPIException(null, MAPI_E_NO_ACCESS);
		}

		$messageProps = mapi_getprops($this->message, [PR_ENTRYID, $this->proptags['recurring']]);

		if (isset($messageProps[$this->proptags['recurring']]) && $messageProps[$this->proptags['recurring']] === true) {
			// cancellation of recurring series or one occurrence
			$recurrence = new Recurrence($this->store, $this->message);

			// if basedate is specified then we are cancelling only one occurrence, so create exception for that occurrence
			if ($basedate) {
				$recurrence->createException([], $basedate, true);
			}

			// update the meeting request
			$this->updateMeetingRequest();

			// send cancellation mails
			$this->sendMeetingRequest(true, dgettext('zarafa', 'Canceled') . ': ', $basedate);

			// save changes in the message
			mapi_savechanges($this->message);
		}
		else {
			// cancellation of normal meeting request
			// Send the cancellation
			$this->updateMeetingRequest();
			$this->sendMeetingRequest(true, dgettext('zarafa', 'Canceled') . ': ');

			// save changes in the message
			mapi_savechanges($this->message);
		}

		// if basedate is specified then we have already created exception of it so nothing should be done now
		// but when cancelling normal / recurring meeting request we need to remove meeting from calendar
		if ($basedate === false) {
			// get the wastebasket folder, for delegate this will give wastebasket of delegate
			$wastebasket = $this->openDefaultWastebasket($this->openDefaultStore());

			// get the source folder of the meeting message
			$sourcefolder = $this->openParentFolder();

			// Move the message to the deleted items
			mapi_folder_copymessages($sourcefolder, [$messageProps[PR_ENTRYID]], $wastebasket, MESSAGE_MOVE);
		}
	}

	/**
	 * Convert epoch to MAPI FileTime, number of 100-nanosecond units since
	 * the start of January 1, 1601.
	 * https://msdn.microsoft.com/en-us/library/office/cc765906.aspx.
	 *
	 * @param int $epoch the current epoch
	 *
	 * @return int the MAPI FileTime equalevent to the given epoch time
	 */
	public function epochToMapiFileTime($epoch) {
		$nanoseconds_between_epoch = 116444736000000000;

		return ($epoch * 10000000) + $nanoseconds_between_epoch;
	}

	/**
	 * Sets the properties in the message so that is can be sent
	 * as a meeting request. The caller has to submit the message. This
	 * is only used for new MeetingRequests. Pass the appointment item as $message
	 * in the constructor to do this.
	 *
	 * @param mixed $basedate
	 */
	public function setMeetingRequest($basedate = false) {
		$props = mapi_getprops($this->message, [$this->proptags['updatecounter']]);

		// Create a new global id for this item
		// https://msdn.microsoft.com/en-us/library/ee160198(v=exchg.80).aspx
		$goid = pack('H*', '040000008200E00074C5B7101A82E00800000000');
		/*
		$year = gmdate('Y');
		$month = gmdate('n');
		$day = gmdate('j');
		$goid .= pack('n', $year);
		$goid .= pack('C', $month);
		$goid .= pack('C', $day);
		*/
		// Creation Time
		$time = $this->epochToMapiFileTime(time());
		$goid .= pack('V', $time & 0xFFFFFFFF);
		$goid .= pack('V', $time >> 32);
		// 8 Zeros
		$goid .= pack('H*', '0000000000000000');
		// Length of the random data
		$goid .= pack('V', 16);
		// Random data.
		for ($i = 0; $i < 16; ++$i) {
			$goid .= chr(rand(0, 255));
		}

		// Create a new appointment id for this item
		$apptid = rand();

		$props[PR_OWNER_APPT_ID] = $apptid;
		$props[PR_ICON_INDEX] = 1026;
		$props[$this->proptags['goid']] = $goid;
		$props[$this->proptags['goid2']] = $goid;

		if (!isset($props[$this->proptags['updatecounter']])) {
			$props[$this->proptags['updatecounter']] = 0;			// OL also starts sequence no with zero.
			$props[$this->proptags['last_updatecounter']] = 0;
		}

		mapi_setprops($this->message, $props);
	}

	/**
	 * Sends a meeting request by copying it to the outbox, converting
	 * the message class, adding some properties that are required only
	 * for sending the message and submitting the message. Set cancel to
	 * true if you wish to completely cancel the meeting request. You can
	 * specify an optional 'prefix' to prefix the sent message, which is normally
	 * 'Canceled: '.
	 *
	 * @param mixed $cancel
	 * @param mixed $prefix
	 * @param mixed $basedate
	 * @param mixed $modifiedRecips
	 * @param mixed $deletedRecips
	 */
	public function sendMeetingRequest($cancel, $prefix = false, $basedate = false, $modifiedRecips = false, $deletedRecips = false) {
		$this->includesResources = false;
		$this->nonAcceptingResources = [];

		// Get the properties of the message
		$messageprops = mapi_getprops($this->message, [$this->proptags['recurring']]);

		/*
		 * Submit message to non-resource recipients
		 */
		// Set BusyStatus to olTentative (1)
		// Set MeetingStatus to olMeetingReceived
		// Set ResponseStatus to olResponseNotResponded

		/*
		 * While sending recurrence meeting exceptions are not sent as attachments
		 * because first all exceptions are sent and then recurrence meeting is sent.
		 */
		if (isset($messageprops[$this->proptags['recurring']]) && $messageprops[$this->proptags['recurring']] && !$basedate) {
			// Book resource
			$this->bookResources($this->message, $cancel, $prefix);

			if (!$this->errorSetResource) {
				$recurr = new Recurrence($this->openDefaultStore(), $this->message);

				// First send meetingrequest for recurring item
				$this->submitMeetingRequest($this->message, $cancel, $prefix, false, $recurr, false, $modifiedRecips, $deletedRecips);

				// Then send all meeting request for all exceptions
				$exceptions = $recurr->getAllExceptions();
				if ($exceptions) {
					foreach ($exceptions as $exceptionBasedate) {
						$attach = $recurr->getExceptionAttachment($exceptionBasedate);

						if ($attach) {
							$occurrenceItem = mapi_attach_openobj($attach, MAPI_MODIFY);
							$this->submitMeetingRequest($occurrenceItem, $cancel, false, $exceptionBasedate, $recurr, false, $modifiedRecips, $deletedRecips);
							mapi_savechanges($attach);
						}
					}
				}
			}
		}
		else {
			// Basedate found, an exception is to be sent
			if ($basedate) {
				$recurr = new Recurrence($this->openDefaultStore(), $this->message);

				if ($cancel) {
					// @TODO: remove occurrence from Resource's Calendar if resource was booked for whole series
					$this->submitMeetingRequest($this->message, $cancel, $prefix, $basedate, $recurr, false);
				}
				else {
					$attach = $recurr->getExceptionAttachment($basedate);

					if ($attach) {
						$occurrenceItem = mapi_attach_openobj($attach, MAPI_MODIFY);

						// Book resource for this occurrence
						$resourceRecipData = $this->bookResources($occurrenceItem, $cancel, $prefix, $basedate);

						if (!$this->errorSetResource) {
							// Save all previous changes
							mapi_savechanges($this->message);

							$this->submitMeetingRequest($occurrenceItem, $cancel, $prefix, $basedate, $recurr, true, $modifiedRecips, $deletedRecips);
							mapi_savechanges($occurrenceItem);
							mapi_savechanges($attach);
						}
					}
				}
			}
			else {
				// This is normal meeting
				$resourceRecipData = $this->bookResources($this->message, $cancel, $prefix);

				if (!$this->errorSetResource) {
					$this->submitMeetingRequest($this->message, $cancel, $prefix, false, false, false, $modifiedRecips, $deletedRecips);
				}
			}
		}

		if (isset($this->errorSetResource) && $this->errorSetResource) {
			return [
				'error' => $this->errorSetResource,
				'displayname' => $this->recipientDisplayname,
			];
		}

		return true;
	}

	/**
	 * Updates the message after an update has been performed (for example,
	 * changing the time of the meeting). This must be called before re-sending
	 * the meeting request. You can also call this function instead of 'setMeetingRequest()'
	 * as it will automatically call setMeetingRequest on this object if it is the first
	 * call to this function.
	 *
	 * @param mixed $basedate
	 */
	public function updateMeetingRequest($basedate = false) {
		$messageprops = mapi_getprops($this->message, [$this->proptags['last_updatecounter'], $this->proptags['goid']]);

		if (!isset($messageprops[$this->proptags['goid']])) {
			$this->setMeetingRequest($basedate);
		}
		else {
			$counter = $messageprops[$this->proptags['last_updatecounter']] + 1;

			// increment value of last_updatecounter, last_updatecounter will be common for recurring series
			// so even if you sending an exception only you need to update the last_updatecounter in the recurring series message
			// this way we can make sure that every time we will be using a uniwue number for every operation
			mapi_setprops($this->message, [$this->proptags['last_updatecounter'] => $counter]);
		}
	}

	/**
	 * Returns TRUE if we are the organiser of the meeting. Can be used with any type of meeting object.
	 */
	public function isLocalOrganiser() {
		$props = mapi_getprops($this->message, [$this->proptags['goid'], PR_MESSAGE_CLASS]);

		if (!$this->isMeetingRequest($props[PR_MESSAGE_CLASS]) && !$this->isMeetingRequestResponse($props[PR_MESSAGE_CLASS]) && !$this->isMeetingCancellation($props[PR_MESSAGE_CLASS])) {
			// we are checking with calendar item
			$calendarItem = $this->message;
		}
		else {
			// we are checking with meeting request / response / cancellation mail
			// get calendar items
			$calendarItem = $this->getCorrespondentCalendarItem(true);
		}

		// even if we have received request/response for exception/occurrence then also
		// we can check recurring series for organizer, no need to check with exception/occurrence

		if ($calendarItem !== false) {
			$messageProps = mapi_getprops($calendarItem, [$this->proptags['responsestatus']]);

			if (isset($messageProps[$this->proptags['responsestatus']]) && $messageProps[$this->proptags['responsestatus']] === olResponseOrganized) {
				return true;
			}
		}

		return false;
	}

	/*
	 * Support functions - INTERNAL ONLY
	 ***************************************************************************************************
	 */

	/**
	 * Return the tracking status of a recipient based on the IPM class (passed).
	 *
	 * @param mixed $class
	 */
	public function getTrackStatus($class) {
		$status = olRecipientTrackStatusNone;

		switch ($class) {
			case 'IPM.Schedule.Meeting.Resp.Pos':
				$status = olRecipientTrackStatusAccepted;
				break;

			case 'IPM.Schedule.Meeting.Resp.Tent':
				$status = olRecipientTrackStatusTentative;
				break;

			case 'IPM.Schedule.Meeting.Resp.Neg':
				$status = olRecipientTrackStatusDeclined;
				break;
		}

		return $status;
	}

	/**
	 * Function returns MAPIFolder resource of the folder that currently holds this meeting/meeting request
	 * object.
	 */
	public function openParentFolder() {
		$messageprops = mapi_getprops($this->message, [PR_PARENT_ENTRYID]);

		return mapi_msgstore_openentry($this->store, $messageprops[PR_PARENT_ENTRYID]);
	}

	/**
	 * Function will return resource of the default calendar folder of store.
	 *
	 * @param mixed $store {optional} user store whose default calendar should be opened
	 *
	 * @return resource default calendar folder of store
	 */
	public function openDefaultCalendar($store = false) {
		return $this->openDefaultFolder(PR_IPM_APPOINTMENT_ENTRYID, $store);
	}

	/**
	 * Function will return resource of the default outbox folder of store.
	 *
	 * @param mixed $store {optional} user store whose default outbox should be opened
	 *
	 * @return resource default outbox folder of store
	 */
	public function openDefaultOutbox($store = false) {
		return $this->openBaseFolder(PR_IPM_OUTBOX_ENTRYID, $store);
	}

	/**
	 * Function will return resource of the default wastebasket folder of store.
	 *
	 * @param mixed $store {optional} user store whose default wastebasket should be opened
	 *
	 * @return resource default wastebasket folder of store
	 */
	public function openDefaultWastebasket($store = false) {
		return $this->openBaseFolder(PR_IPM_WASTEBASKET_ENTRYID, $store);
	}

	/**
	 * Function will return resource of the default calendar folder of store.
	 *
	 * @param mixed $store {optional} user store whose default calendar should be opened
	 *
	 * @return bool|string default calendar folder of store
	 */
	public function getDefaultWastebasketEntryID($store = false) {
		return $this->getBaseEntryID(PR_IPM_WASTEBASKET_ENTRYID, $store);
	}

	/**
	 * Function will return resource of the default sent mail folder of store.
	 *
	 * @param mixed $store {optional} user store whose default sent mail should be opened
	 *
	 * @return bool|string default sent mail folder of store
	 */
	public function getDefaultSentmailEntryID($store = false) {
		return $this->getBaseEntryID(PR_IPM_SENTMAIL_ENTRYID, $store);
	}

	/**
	 * Function will return entryid of any default folder of store. This method is useful when you want
	 * to get entryid of folder which is stored as properties of inbox folder
	 * (PR_IPM_APPOINTMENT_ENTRYID, PR_IPM_CONTACT_ENTRYID, PR_IPM_DRAFTS_ENTRYID, PR_IPM_JOURNAL_ENTRYID, PR_IPM_NOTE_ENTRYID, PR_IPM_TASK_ENTRYID).
	 *
	 * @param int   $prop  proptag of the folder for which we want to get entryid
	 * @param mixed $store {optional} user store from which we need to get entryid of default folder
	 *
	 * @return bool|string entryid of folder pointed by $prop
	 */
	public function getDefaultFolderEntryID($prop, $store = false) {
		try {
			$inbox = mapi_msgstore_getreceivefolder($store ? $store : $this->store);
			$inboxprops = mapi_getprops($inbox, [$prop]);
			if (isset($inboxprops[$prop])) {
				return $inboxprops[$prop];
			}
		}
		catch (MAPIException $e) {
			// public store doesn't support this method
			if ($e->getCode() == MAPI_E_NO_SUPPORT) {
				// don't propagate this error to parent handlers, if store doesn't support it
				$e->setHandled();
			}
		}

		return false;
	}

	/**
	 * Function will return resource of any default folder of store.
	 *
	 * @param int   $prop  proptag of the folder that we want to open
	 * @param mixed $store {optional} user store from which we need to open default folder
	 *
	 * @return resource default folder of store
	 */
	public function openDefaultFolder($prop, $store = false) {
		$folder = false;
		$entryid = $this->getDefaultFolderEntryID($prop, $store);

		if ($entryid !== false) {
			$folder = mapi_msgstore_openentry($store ? $store : $this->store, $entryid);
		}

		return $folder;
	}

	/**
	 * Function will return entryid of default folder from store. This method is useful when you want
	 * to get entryid of folder which is stored as store properties
	 * (PR_IPM_FAVORITES_ENTRYID, PR_IPM_OUTBOX_ENTRYID, PR_IPM_SENTMAIL_ENTRYID, PR_IPM_WASTEBASKET_ENTRYID).
	 *
	 * @param int   $prop  proptag of the folder whose entryid we want to get
	 * @param mixed $store {optional} user store from which we need to get entryid of default folder
	 *
	 * @return bool|string entryid of default folder from store
	 */
	public function getBaseEntryID($prop, $store = false) {
		$storeprops = mapi_getprops($store ? $store : $this->store, [$prop]);
		if (!isset($storeprops[$prop])) {
			return false;
		}

		return $storeprops[$prop];
	}

	/**
	 * Function will return resource of any default folder of store.
	 *
	 * @param int   $prop  proptag of the folder that we want to open
	 * @param mixed $store {optional} user store from which we need to open default folder
	 *
	 * @return resource default folder of store
	 */
	public function openBaseFolder($prop, $store = false) {
		$folder = false;
		$entryid = $this->getBaseEntryID($prop, $store);

		if ($entryid !== false) {
			$folder = mapi_msgstore_openentry($store ? $store : $this->store, $entryid);
		}

		return $folder;
	}

	/**
	 * Function checks whether user has access over the specified folder or not.
	 *
	 * @param string $entryid entryid The entryid of the folder to check
	 * @param mixed  $store   (optional) store from which folder should be opened
	 *
	 * @return bool true if user has an access over the folder, false if not
	 */
	public function checkFolderWriteAccess($entryid, $store = false) {
		$accessToFolder = false;

		if (!empty($entryid)) {
			if ($store === false) {
				$store = $this->store;
			}

			try {
				$folder = mapi_msgstore_openentry($store, $entryid);
				$folderProps = mapi_getprops($folder, [PR_ACCESS]);
				if (($folderProps[PR_ACCESS] & MAPI_ACCESS_CREATE_CONTENTS) === MAPI_ACCESS_CREATE_CONTENTS) {
					$accessToFolder = true;
				}
			}
			catch (MAPIException $e) {
				// we don't have rights to open folder, so return false
				if ($e->getCode() == MAPI_E_NO_ACCESS) {
					return $accessToFolder;
				}

				// rethrow other errors
				throw $e;
			}
		}

		return $accessToFolder;
	}

	/**
	 * Function checks whether user has access over the specified folder or not.
	 *
	 * @param mixed $store
	 *
	 * @return bool true if user has an access over the folder, false if not
	 */
	public function checkCalendarWriteAccess($store = false) {
		if ($store === false) {
			// If this meeting request is received by a delegate then open delegator's store.
			$messageProps = mapi_getprops($this->message, [PR_RCVD_REPRESENTING_ENTRYID]);
			if (isset($messageProps[PR_RCVD_REPRESENTING_ENTRYID])) {
				$delegatorStore = $this->getDelegatorStore($messageProps[PR_RCVD_REPRESENTING_ENTRYID]);

				$store = $delegatorStore['store'];
			}
			else {
				$store = $this->store;
			}
		}

		// If the store is a public folder, the calendar folder is the PARENT_ENTRYID of the calendar item
		$provider = mapi_getprops($store, [PR_MDB_PROVIDER]);
		if (isset($provider[PR_MDB_PROVIDER]) && $provider[PR_MDB_PROVIDER] === ZARAFA_STORE_PUBLIC_GUID) {
			$entryid = mapi_getprops($this->message, [PR_PARENT_ENTRYID]);
			$entryid = $entryid[PR_PARENT_ENTRYID];
		}
		else {
			$entryid = $this->getDefaultFolderEntryID(PR_IPM_APPOINTMENT_ENTRYID, $store);
			if ($entryid === false) {
				$entryid = $this->getBaseEntryID(PR_IPM_APPOINTMENT_ENTRYID, $store);
			}

			if ($entryid === false) {
				return false;
			}
		}

		return $this->checkFolderWriteAccess($entryid, $store);
	}

	/**
	 * Function will resolve the user and open its store.
	 *
	 * @param string $ownerentryid the entryid of the user
	 *
	 * @return resource store of the user
	 */
	public function openCustomUserStore($ownerentryid) {
		$ab = mapi_openaddressbook($this->session);

		try {
			$mailuser = mapi_ab_openentry($ab, $ownerentryid);
		}
		catch (MAPIException $e) {
			return;
		}

		$mailuserprops = mapi_getprops($mailuser, [PR_EMAIL_ADDRESS]);
		$storeid = mapi_msgstore_createentryid($this->store, $mailuserprops[PR_EMAIL_ADDRESS]);

		return mapi_openmsgstore($this->session, $storeid);
	}

	/**
	 * Function which sends response to organizer when attendee accepts, declines or proposes new time to a received meeting request.
	 *
	 * @param int   $status              response status of attendee
	 * @param array $proposeNewTimeProps properties of attendee's proposal
	 * @param mixed $body
	 * @param mixed $store
	 * @param mixed $basedate            date of occurrence which attendee has responded
	 * @param mixed $calFolder
	 */
	public function createResponse($status, $proposeNewTimeProps = [], $body = false, $store, $basedate = false, $calFolder) {
		$messageprops = mapi_getprops($this->message, [
			PR_SENT_REPRESENTING_ENTRYID,
			PR_SENT_REPRESENTING_EMAIL_ADDRESS,
			PR_SENT_REPRESENTING_ADDRTYPE,
			PR_SENT_REPRESENTING_NAME,
			PR_SENT_REPRESENTING_SEARCH_KEY,
			$this->proptags['goid'],
			$this->proptags['goid2'],
			$this->proptags['location'],
			$this->proptags['startdate'],
			$this->proptags['duedate'],
			$this->proptags['recurring'],
			$this->proptags['recurring_pattern'],
			$this->proptags['recurrence_data'],
			$this->proptags['timezone_data'],
			$this->proptags['timezone'],
			$this->proptags['updatecounter'],
			PR_SUBJECT,
			PR_MESSAGE_CLASS,
			PR_OWNER_APPT_ID,
			$this->proptags['is_exception'],
		]);

		$props = [];

		if ($basedate !== false && !$this->isMeetingRequest($messageprops[PR_MESSAGE_CLASS])) {
			// we are creating response from a recurring calendar item object
			// We found basedate,so opened occurrence and get properties.
			$recurr = new Recurrence($store, $this->message);
			$exception = $recurr->getExceptionAttachment($basedate);

			if ($exception) {
				// Exception found, Now retrieve properties
				$imessage = mapi_attach_openobj($exception, 0);
				$imsgprops = mapi_getprops($imessage);

				// If location is provided, copy it to the response
				if (isset($imsgprops[$this->proptags['location']])) {
					$messageprops[$this->proptags['location']] = $imsgprops[$this->proptags['location']];
				}

				// Update $messageprops with timings of occurrence
				$messageprops[$this->proptags['startdate']] = $imsgprops[$this->proptags['startdate']];
				$messageprops[$this->proptags['duedate']] = $imsgprops[$this->proptags['duedate']];

				// Meeting related properties
				$props[$this->proptags['meetingstatus']] = $imsgprops[$this->proptags['meetingstatus']];
				$props[$this->proptags['responsestatus']] = $imsgprops[$this->proptags['responsestatus']];
				$props[PR_SUBJECT] = $imsgprops[PR_SUBJECT];
			}
			else {
				// Exceptions is deleted.
				// Update $messageprops with timings of occurrence
				$messageprops[$this->proptags['startdate']] = $recurr->getOccurrenceStart($basedate);
				$messageprops[$this->proptags['duedate']] = $recurr->getOccurrenceEnd($basedate);

				$props[$this->proptags['meetingstatus']] = olNonMeeting;
				$props[$this->proptags['responsestatus']] = olResponseNone;
			}

			$props[$this->proptags['recurring']] = false;
			$props[$this->proptags['is_exception']] = true;
		}
		else {
			// we are creating a response from meeting request mail (it could be recurring or non-recurring)
			// Send all recurrence info in response, if this is a recurrence meeting.
			$isRecurring = isset($messageprops[$this->proptags['recurring']]) && $messageprops[$this->proptags['recurring']];
			$isException = isset($messageprops[$this->proptags['is_exception']]) && $messageprops[$this->proptags['is_exception']];
			if ($isRecurring || $isException) {
				if ($isRecurring) {
					$props[$this->proptags['recurring']] = $messageprops[$this->proptags['recurring']];
				}
				if ($isException) {
					$props[$this->proptags['is_exception']] = $messageprops[$this->proptags['is_exception']];
				}
				$calendaritems = $this->findCalendarItems($messageprops[$this->proptags['goid2']], $calFolder);

				$calendaritem = mapi_msgstore_openentry($store, $calendaritems[0]);
				$recurr = new Recurrence($store, $calendaritem);
			}
		}

		// we are sending a response for recurring meeting request (or exception), so set some required properties
		if (isset($recurr) && $recurr) {
			if (!empty($messageprops[$this->proptags['recurring_pattern']])) {
				$props[$this->proptags['recurring_pattern']] = $messageprops[$this->proptags['recurring_pattern']];
			}

			if (!empty($messageprops[$this->proptags['recurrence_data']])) {
				$props[$this->proptags['recurrence_data']] = $messageprops[$this->proptags['recurrence_data']];
			}

			$props[$this->proptags['timezone_data']] = $messageprops[$this->proptags['timezone_data']];
			$props[$this->proptags['timezone']] = $messageprops[$this->proptags['timezone']];

			$this->generateRecurDates($recurr, $messageprops, $props);
		}

		// Create a response message
		$recip = [];
		$recip[PR_ENTRYID] = $messageprops[PR_SENT_REPRESENTING_ENTRYID];
		$recip[PR_EMAIL_ADDRESS] = $messageprops[PR_SENT_REPRESENTING_EMAIL_ADDRESS];
		$recip[PR_ADDRTYPE] = $messageprops[PR_SENT_REPRESENTING_ADDRTYPE];
		$recip[PR_DISPLAY_NAME] = $messageprops[PR_SENT_REPRESENTING_NAME];
		$recip[PR_RECIPIENT_TYPE] = MAPI_TO;
		$recip[PR_SEARCH_KEY] = $messageprops[PR_SENT_REPRESENTING_SEARCH_KEY];

		$subjectprefix = '';

		switch ($status) {
			case olResponseAccepted:
				$classpostfix = 'Pos';
				$subjectprefix = dgettext('zarafa', 'Accepted');
				break;

			case olResponseDeclined:
				$classpostfix = 'Neg';
				$subjectprefix = dgettext('zarafa', 'Declined');
				break;

			case olResponseTentative:
				$classpostfix = 'Tent';
				$subjectprefix = dgettext('zarafa', 'Tentatively accepted');
				break;
		}

		if (!empty($proposeNewTimeProps)) {
			// if attendee has proposed new time then change subject prefix
			$subjectprefix = dgettext('zarafa', 'New Time Proposed');
		}

		$props[PR_SUBJECT] = $subjectprefix . ': ' . $messageprops[PR_SUBJECT];

		$props[PR_MESSAGE_CLASS] = 'IPM.Schedule.Meeting.Resp.' . $classpostfix;
		if (isset($messageprops[PR_OWNER_APPT_ID])) {
			$props[PR_OWNER_APPT_ID] = $messageprops[PR_OWNER_APPT_ID];
		}

		// Set GlobalId AND CleanGlobalId, if exception then also set basedate into GlobalId(0x3).
		$props[$this->proptags['goid']] = $this->setBasedateInGlobalID($messageprops[$this->proptags['goid2']], $basedate);
		$props[$this->proptags['goid2']] = $messageprops[$this->proptags['goid2']];
		$props[$this->proptags['updatecounter']] = isset($messageprops[$this->proptags['updatecounter']]) ? $messageprops[$this->proptags['updatecounter']] : 0;

		if (!empty($proposeNewTimeProps)) {
			// merge proposal properties to message properties which will be sent to organizer
			$props = $proposeNewTimeProps + $props;
		}

		// Set body message in Appointment
		if (isset($body)) {
			$props[PR_BODY] = $this->getMeetingTimeInfo() ? $this->getMeetingTimeInfo() : $body;
		}

		// PR_START_DATE/PR_END_DATE is used in the UI in Outlook on the response message
		$props[PR_START_DATE] = $messageprops[$this->proptags['startdate']];
		$props[PR_END_DATE] = $messageprops[$this->proptags['duedate']];

		// Set startdate and duedate in response mail.
		$props[$this->proptags['startdate']] = $messageprops[$this->proptags['startdate']];
		$props[$this->proptags['duedate']] = $messageprops[$this->proptags['duedate']];

		// responselocation is used in the UI in Outlook on the response message
		if (isset($messageprops[$this->proptags['location']])) {
			$props[$this->proptags['responselocation']] = $messageprops[$this->proptags['location']];
			$props[$this->proptags['location']] = $messageprops[$this->proptags['location']];
		}

		$message = $this->createOutgoingMessage($store);

		mapi_setprops($message, $props);
		mapi_message_modifyrecipients($message, MODRECIP_ADD, [$recip]);
		mapi_savechanges($message);
		mapi_message_submitmessage($message);
	}

	/**
	 * Function which finds items in calendar based on globalId and cleanGlobalId.
	 *
	 * @param string $goid             GlobalID(0x3) of item
	 * @param mixed  $calendar         MAPI_folder of user (optional)
	 * @param bool   $useCleanGlobalId if true then search should be performed on cleanGlobalId(0x23) else globalId(0x3)
	 *
	 * @return mixed
	 */
	public function findCalendarItems($goid, $calendar = false, $useCleanGlobalId = false) {
		if ($calendar === false) {
			// Open the Calendar
			$calendar = $this->openDefaultCalendar();
		}

		// Find the item by restricting all items to the correct ID
		$restrict = [
			RES_PROPERTY,
			[
				RELOP => RELOP_EQ,
				ULPROPTAG => ($useCleanGlobalId === true ? $this->proptags['goid2'] : $this->proptags['goid']),
				VALUE => $goid,
			],
		];

		$calendarcontents = mapi_folder_getcontentstable($calendar);

		$rows = mapi_table_queryallrows($calendarcontents, [PR_ENTRYID], $restrict);

		if (empty($rows)) {
			return;
		}

		$calendaritems = [];

		// In principle, there should only be one row, but we'll handle them all just in case
		foreach ($rows as $row) {
			$calendaritems[] = $row[PR_ENTRYID];
		}

		return $calendaritems;
	}

	// Returns TRUE if both entryid's are equal. Equality is defined by both entryid's pointing at the
	// same SMTP address when converted to SMTP
	public function compareABEntryIDs($entryid1, $entryid2) {
		// If the session was not passed, just do a 'normal' compare.
		if (!$this->session) {
			return $entryid1 == $entryid2;
		}

		$smtp1 = $this->getSMTPAddress($entryid1);
		$smtp2 = $this->getSMTPAddress($entryid2);

		if ($smtp1 == $smtp2) {
			return true;
		}

		return false;
	}

	// Gets the SMTP address of the passed addressbook entryid
	public function getSMTPAddress($entryid) {
		if (!$this->session) {
			return false;
		}

		try {
			$ab = mapi_openaddressbook($this->session);
			$abitem = mapi_ab_openentry($ab, $entryid);

			if (!$abitem) {
				return '';
			}
		}
		catch (MAPIException $e) {
			return '';
		}

		$props = mapi_getprops($abitem, [PR_ADDRTYPE, PR_EMAIL_ADDRESS, PR_SMTP_ADDRESS]);

		if ($props[PR_ADDRTYPE] == 'SMTP') {
			return $props[PR_EMAIL_ADDRESS];
		}

		return $props[PR_SMTP_ADDRESS];
	}

	/**
	 * Gets the properties associated with the owner of the passed store:
	 * PR_DISPLAY_NAME, PR_EMAIL_ADDRESS, PR_ADDRTYPE, PR_ENTRYID, PR_SEARCH_KEY.
	 *
	 * @param mixed $store                  message store
	 * @param bool  $fallbackToLoggedInUser If true then return properties of logged in user instead of mailbox owner.
	 *                                      Not used when passed store is public store.
	 *                                      For public store we are always returning logged in user's info.
	 *
	 * @return array|bool properties of logged in user in an array in sequence of display_name, email address, address type,
	 *                    entryid and search key
	 */
	public function getOwnerAddress($store, $fallbackToLoggedInUser = true) {
		if (!$this->session) {
			return false;
		}

		$storeProps = mapi_getprops($store, [PR_MAILBOX_OWNER_ENTRYID, PR_USER_ENTRYID]);

		$ownerEntryId = false;
		if (isset($storeProps[PR_USER_ENTRYID]) && $storeProps[PR_USER_ENTRYID]) {
			$ownerEntryId = $storeProps[PR_USER_ENTRYID];
		}

		if (isset($storeProps[PR_MAILBOX_OWNER_ENTRYID]) && $storeProps[PR_MAILBOX_OWNER_ENTRYID] && !$fallbackToLoggedInUser) {
			$ownerEntryId = $storeProps[PR_MAILBOX_OWNER_ENTRYID];
		}

		if ($ownerEntryId) {
			$ab = mapi_openaddressbook($this->session);

			$zarafaUser = mapi_ab_openentry($ab, $ownerEntryId);
			if (!$zarafaUser) {
				return false;
			}

			$ownerProps = mapi_getprops($zarafaUser, [PR_ADDRTYPE, PR_DISPLAY_NAME, PR_EMAIL_ADDRESS, PR_SEARCH_KEY]);

			$addrType = $ownerProps[PR_ADDRTYPE];
			$name = $ownerProps[PR_DISPLAY_NAME];
			$emailAddr = $ownerProps[PR_EMAIL_ADDRESS];
			$searchKey = $ownerProps[PR_SEARCH_KEY];
			$entryId = $ownerEntryId;

			return [$name, $emailAddr, $addrType, $entryId, $searchKey];
		}

		return false;
	}

	// Opens this session's default message store
	public function openDefaultStore() {
		$storestable = mapi_getmsgstorestable($this->session);
		$rows = mapi_table_queryallrows($storestable, [PR_ENTRYID, PR_DEFAULT_STORE]);

		foreach ($rows as $row) {
			if (isset($row[PR_DEFAULT_STORE]) && $row[PR_DEFAULT_STORE]) {
				$entryid = $row[PR_ENTRYID];
				break;
			}
		}

		if (!$entryid) {
			return false;
		}

		return mapi_openmsgstore($this->session, $entryid);
	}

	/**
	 *  Function which adds organizer to recipient list which is passed.
	 *  This function also checks if it has organizer.
	 *
	 * @param array $messageProps message properties
	 * @param array $recipients   recipients list of message
	 * @param bool  $isException  true if we are processing recipient of exception
	 */
	public function addOrganizer($messageProps, &$recipients, $isException = false) {
		$hasOrganizer = false;
		// Check if meeting already has an organizer.
		foreach ($recipients as $key => $recipient) {
			if (isset($recipient[PR_RECIPIENT_FLAGS]) && $recipient[PR_RECIPIENT_FLAGS] == (recipSendable | recipOrganizer)) {
				$hasOrganizer = true;
			}
			elseif ($isException && !isset($recipient[PR_RECIPIENT_FLAGS])) {
				// Recipients for an occurrence
				$recipients[$key][PR_RECIPIENT_FLAGS] = recipSendable | recipExceptionalResponse;
			}
		}

		if (!$hasOrganizer) {
			// Create organizer.
			$organizer = [];
			$organizer[PR_ENTRYID] = $messageProps[PR_SENT_REPRESENTING_ENTRYID];
			$organizer[PR_DISPLAY_NAME] = $messageProps[PR_SENT_REPRESENTING_NAME];
			$organizer[PR_EMAIL_ADDRESS] = $messageProps[PR_SENT_REPRESENTING_EMAIL_ADDRESS];
			$organizer[PR_RECIPIENT_TYPE] = MAPI_TO;
			$organizer[PR_RECIPIENT_DISPLAY_NAME] = $messageProps[PR_SENT_REPRESENTING_NAME];
			$organizer[PR_ADDRTYPE] = empty($messageProps[PR_SENT_REPRESENTING_ADDRTYPE]) ? 'SMTP' : $messageProps[PR_SENT_REPRESENTING_ADDRTYPE];
			$organizer[PR_RECIPIENT_TRACKSTATUS] = olRecipientTrackStatusNone;
			$organizer[PR_RECIPIENT_FLAGS] = recipSendable | recipOrganizer;
			$organizer[PR_SEARCH_KEY] = $messageProps[PR_SENT_REPRESENTING_SEARCH_KEY];

			// Add organizer to recipients list.
			array_unshift($recipients, $organizer);
		}
	}

	/**
	 * Function which removes an exception/occurrence from recurrencing meeting
	 * when a meeting cancellation of an occurrence is processed.
	 *
	 * @param mixed    $basedate basedate of an occurrence
	 * @param mixed    $message  recurring item from which occurrence has to be deleted
	 * @param resource $store    MAPI_MSG_Store which contains the item
	 */
	public function doRemoveExceptionFromCalendar($basedate, $message, $store) {
		$recurr = new Recurrence($store, $message);
		$recurr->createException([], $basedate, true);
		mapi_savechanges($message);
	}

	/**
	 * Function which returns basedate of an changed occurrence from globalID of meeting request.
	 *
	 * @param string $goid globalID
	 *
	 * @return bool|int true if basedate is found else false it not found
	 */
	public function getBasedateFromGlobalID($goid) {
		$hexguid = bin2hex($goid);
		$hexbase = substr($hexguid, 32, 8);
		$day = (int) hexdec(substr($hexbase, 6, 2));
		$month = (int) hexdec(substr($hexbase, 4, 2));
		$year = (int) hexdec(substr($hexbase, 0, 4));

		if ($day && $month && $year) {
			return gmmktime(0, 0, 0, $month, $day, $year);
		}

		return false;
	}

	/**
	 * Function which sets basedate in globalID of changed occurrence which is to be sent.
	 *
	 * @param string $goid     globalID
	 * @param mixed  $basedate of changed occurrence
	 *
	 * @return bool|string globalID with basedate in it
	 */
	public function setBasedateInGlobalID($goid, $basedate = false) {
		$hexguid = bin2hex($goid);
		$year = $basedate ? sprintf('%04s', dechex((int) gmdate('Y', $basedate))) : '0000';
		$month = $basedate ? sprintf('%02s', dechex((int) gmdate('m', $basedate))) : '00';
		$day = $basedate ? sprintf('%02s', dechex((int) gmdate('d', $basedate))) : '00';

		return hex2bin(strtoupper(substr($hexguid, 0, 32) . $year . $month . $day . substr($hexguid, 40)));
	}

	/**
	 * Function which replaces attachments with copy_from in copy_to.
	 *
	 * @param mixed $copyFrom       MAPI_message from which attachments are to be copied
	 * @param mixed $copyTo         MAPI_message to which attachment are to be copied
	 * @param bool  $copyExceptions if true then all exceptions should also be sent as attachments
	 */
	public function replaceAttachments($copyFrom, $copyTo, $copyExceptions = true) {
		/* remove all old attachments */
		$attachmentTableTo = mapi_message_getattachmenttable($copyTo);
		if ($attachmentTableTo) {
			$attachments = mapi_table_queryallrows($attachmentTableTo, [PR_ATTACH_NUM, PR_ATTACH_METHOD, PR_EXCEPTION_STARTTIME]);

			foreach ($attachments as $attachProps) {
				/* remove exceptions too? */
				if (!$copyExceptions && $attachProps[PR_ATTACH_METHOD] == ATTACH_EMBEDDED_MSG && isset($attachProps[PR_EXCEPTION_STARTTIME])) {
					continue;
				}
				mapi_message_deleteattach($copyTo, $attachProps[PR_ATTACH_NUM]);
			}
		}

		/* copy new attachments */
		$attachmentTableFrom = mapi_message_getattachmenttable($copyFrom);
		if ($attachmentTableFrom) {
			$attachments = mapi_table_queryallrows($attachmentTableFrom, [PR_ATTACH_NUM, PR_ATTACH_METHOD, PR_EXCEPTION_STARTTIME]);

			foreach ($attachments as $attachProps) {
				if (!$copyExceptions && $attachProps[PR_ATTACH_METHOD] == ATTACH_EMBEDDED_MSG && isset($attachProps[PR_EXCEPTION_STARTTIME])) {
					continue;
				}

				$attachOld = mapi_message_openattach($copyFrom, (int) $attachProps[PR_ATTACH_NUM]);
				$attachNewResourceMsg = mapi_message_createattach($copyTo);
				mapi_copyto($attachOld, [], [], $attachNewResourceMsg, 0);
				mapi_savechanges($attachNewResourceMsg);
			}
		}
	}

	/**
	 * Function which replaces recipients in copyTo with recipients from copyFrom.
	 *
	 * @param mixed $copyFrom   MAPI_message from which recipients are to be copied
	 * @param mixed $copyTo     MAPI_message to which recipients are to be copied
	 * @param bool  $isDelegate indicates whether delegate is processing
	 *                          so don't copy delegate information to recipient table
	 */
	public function replaceRecipients($copyFrom, $copyTo, $isDelegate = false) {
		$recipientTable = mapi_message_getrecipienttable($copyFrom);

		// If delegate, then do not add the delegate in recipients
		if ($isDelegate) {
			$delegate = mapi_getprops($copyFrom, [PR_RECEIVED_BY_EMAIL_ADDRESS]);
			$res = [
				RES_PROPERTY,
				[
					RELOP => RELOP_NE,
					ULPROPTAG => PR_EMAIL_ADDRESS,
					VALUE => [PR_EMAIL_ADDRESS => $delegate[PR_RECEIVED_BY_EMAIL_ADDRESS]],
				],
			];
			$recipients = mapi_table_queryallrows($recipientTable, $this->recipprops, $res);
		}
		else {
			$recipients = mapi_table_queryallrows($recipientTable, $this->recipprops);
		}

		$copyToRecipientTable = mapi_message_getrecipienttable($copyTo);
		$copyToRecipientRows = mapi_table_queryallrows($copyToRecipientTable, [PR_ROWID]);

		mapi_message_modifyrecipients($copyTo, MODRECIP_REMOVE, $copyToRecipientRows);
		mapi_message_modifyrecipients($copyTo, MODRECIP_ADD, $recipients);
	}

	/**
	 * Function creates meeting item in resource's calendar.
	 *
	 * @param resource $message  MAPI_message which is to create in resource's calendar
	 * @param bool     $cancel   cancel meeting
	 * @param mixed    $prefix   prefix for subject of meeting
	 * @param mixed    $basedate
	 */
	public function bookResources($message, $cancel, $prefix, $basedate = false) {
		if (!$this->enableDirectBooking) {
			return [];
		}

		// Get the properties of the message
		$messageprops = mapi_getprops($message);

		if ($basedate) {
			$recurrItemProps = mapi_getprops($this->message, [$this->proptags['goid'], $this->proptags['goid2'], $this->proptags['timezone_data'], $this->proptags['timezone'], PR_OWNER_APPT_ID]);

			$messageprops[$this->proptags['goid']] = $this->setBasedateInGlobalID($recurrItemProps[$this->proptags['goid']], $basedate);
			$messageprops[$this->proptags['goid2']] = $recurrItemProps[$this->proptags['goid2']];

			// Delete properties which are not needed.
			$deleteProps = [$this->proptags['basedate'], PR_DISPLAY_NAME, PR_ATTACHMENT_FLAGS, PR_ATTACHMENT_HIDDEN, PR_ATTACHMENT_LINKID, PR_ATTACH_FLAGS, PR_ATTACH_METHOD];
			foreach ($deleteProps as $propID) {
				if (isset($messageprops[$propID])) {
					unset($messageprops[$propID]);
				}
			}

			if (isset($messageprops[$this->proptags['recurring']])) {
				$messageprops[$this->proptags['recurring']] = false;
			}

			// Set Outlook properties
			$messageprops[$this->proptags['clipstart']] = $messageprops[$this->proptags['startdate']];
			$messageprops[$this->proptags['clipend']] = $messageprops[$this->proptags['duedate']];
			$messageprops[$this->proptags['timezone_data']] = $recurrItemProps[$this->proptags['timezone_data']];
			$messageprops[$this->proptags['timezone']] = $recurrItemProps[$this->proptags['timezone']];
			$messageprops[$this->proptags['attendee_critical_change']] = time();
			$messageprops[$this->proptags['owner_critical_change']] = time();
		}

		// Get resource recipients
		$getResourcesRestriction = [
			RES_PROPERTY,
			[
				RELOP => RELOP_EQ,	// Equals recipient type 3: Resource
				ULPROPTAG => PR_RECIPIENT_TYPE,
				VALUE => [PR_RECIPIENT_TYPE => MAPI_BCC],
			],
		];
		$recipienttable = mapi_message_getrecipienttable($message);
		$resourceRecipients = mapi_table_queryallrows($recipienttable, $this->recipprops, $getResourcesRestriction);

		$this->errorSetResource = false;
		$resourceRecipData = [];

		// Put appointment into store resource users
		$i = 0;
		$len = count($resourceRecipients);
		while (!$this->errorSetResource && $i < $len) {
			$userStore = $this->openCustomUserStore($resourceRecipients[$i][PR_ENTRYID]);

			// Open root folder
			$userRoot = mapi_msgstore_openentry($userStore, null);

			// Get calendar entryID
			$userRootProps = mapi_getprops($userRoot, [PR_STORE_ENTRYID, PR_IPM_APPOINTMENT_ENTRYID, PR_FREEBUSY_ENTRYIDS]);

			// Open Calendar folder
			$accessToFolder = false;

			try {
				// @FIXME this checks delegate has access to resource's calendar folder
				// but it should use boss' credentials

				$accessToFolder = $this->checkCalendarWriteAccess($this->store);
				if ($accessToFolder) {
					$calFolder = mapi_msgstore_openentry($userStore, $userRootProps[PR_IPM_APPOINTMENT_ENTRYID]);
				}
			}
			catch (MAPIException $e) {
				$e->setHandled();
				$this->errorSetResource = 1; // No access
			}

			if ($accessToFolder) {
				/**
				 * Get the LocalFreebusy message that contains the properties that
				 * are set to accept or decline resource meeting requests.
				 */
				$localFreebusyMsg = FreeBusy::getLocalFreeBusyMessage($userStore);
				if ($localFreebusyMsg) {
					$props = mapi_getprops($localFreebusyMsg, [PR_SCHDINFO_AUTO_ACCEPT_APPTS, PR_SCHDINFO_DISALLOW_RECURRING_APPTS, PR_SCHDINFO_DISALLOW_OVERLAPPING_APPTS]);

					$acceptMeetingRequests = isset($props[PR_SCHDINFO_AUTO_ACCEPT_APPTS]) ? $props[PR_SCHDINFO_AUTO_ACCEPT_APPTS] : false;
					$declineRecurringMeetingRequests = isset($props[PR_SCHDINFO_DISALLOW_RECURRING_APPTS]) ? $props[PR_SCHDINFO_DISALLOW_RECURRING_APPTS] : false;
					$declineConflictingMeetingRequests = isset($props[PR_SCHDINFO_DISALLOW_OVERLAPPING_APPTS]) ? $props[PR_SCHDINFO_DISALLOW_OVERLAPPING_APPTS] : false;

					if (!$acceptMeetingRequests) {
						/*
						 * When a resource has not been set to automatically accept meeting requests,
						 * the meeting request has to be sent to him rather than being put directly into
						 * his calendar. No error should be returned.
						 */
						// $errorSetResource = 2;
						$this->nonAcceptingResources[] = $resourceRecipients[$i];
					}
					else {
						if ($declineRecurringMeetingRequests && !$cancel) {
							// Check if appointment is recurring
							if ($messageprops[$this->proptags['recurring']]) {
								$this->errorSetResource = 3;
							}
						}
						if ($declineConflictingMeetingRequests && !$cancel) {
							// Check for conflicting items
							if ($calFolder && $this->isMeetingConflicting($message, $userStore, $calFolder)) {
								$this->errorSetResource = 4; // Conflict
							}
						}
					}
				}
			}

			if (!$this->errorSetResource && $accessToFolder) {
				/**
				 * First search on GlobalID(0x3)
				 * If (recurring and occurrence) If Resource was booked for only this occurrence then Resource should have only this occurrence in Calendar and not whole series.
				 * If (normal meeting) then GlobalID(0x3) and CleanGlobalID(0x23) are same, so doesn't matter if search is based on GlobalID.
				 */
				$rows = $this->findCalendarItems($messageprops[$this->proptags['goid']], $calFolder);

				/*
				 * If no entry is found then
				 * 1) Resource doesn't have meeting in Calendar. Seriously!!
				 * OR
				 * 2) We were looking for occurrence item but Resource has whole series
				 */
				if (empty($rows)) {
					/**
					 * Now search on CleanGlobalID(0x23) WHY???
					 * Because we are looking recurring item.
					 *
					 * Possible results of this search
					 * 1) If Resource was booked for more than one occurrences then this search will return all those occurrence because search is perform on CleanGlobalID
					 * 2) If Resource was booked for whole series then it should return series.
					 */
					$rows = $this->findCalendarItems($messageprops[$this->proptags['goid2']], $calFolder, true);

					$newResourceMsg = false;
					if (!empty($rows)) {
						// Since we are looking for recurring item, open every result and check for 'recurring' property.
						foreach ($rows as $row) {
							$ResourceMsg = mapi_msgstore_openentry($userStore, $row);
							$ResourceMsgProps = mapi_getprops($ResourceMsg, [$this->proptags['recurring']]);

							if (isset($ResourceMsgProps[$this->proptags['recurring']]) && $ResourceMsgProps[$this->proptags['recurring']]) {
								$newResourceMsg = $ResourceMsg;
								break;
							}
						}
					}

					// Still no results found. I giveup, create new message.
					if (!$newResourceMsg) {
						$newResourceMsg = mapi_folder_createmessage($calFolder);
					}
				}
				else {
					$newResourceMsg = mapi_msgstore_openentry($userStore, $rows[0]);
				}

				// Prefix the subject if needed
				if ($prefix && isset($messageprops[PR_SUBJECT])) {
					$messageprops[PR_SUBJECT] = $prefix . $messageprops[PR_SUBJECT];
				}

				// Set status to cancelled if needed
				$messageprops[$this->proptags['busystatus']] = fbBusy; // The default status (Busy)
				if ($cancel) {
					$messageprops[$this->proptags['meetingstatus']] = olMeetingCanceled; // The meeting has been canceled
					$messageprops[$this->proptags['busystatus']] = fbFree; // Free
				}
				else {
					$messageprops[$this->proptags['meetingstatus']] = olMeetingReceived; // The recipient is receiving the request
				}
				$messageprops[$this->proptags['responsestatus']] = olResponseAccepted; // The resource automatically accepts the appointment

				$messageprops[PR_MESSAGE_CLASS] = 'IPM.Appointment';

				// Remove the PR_ICON_INDEX as it is not needed in the sent message.
				$messageprops[PR_ICON_INDEX] = null;
				$messageprops[PR_RESPONSE_REQUESTED] = true;

				// get the store of organizer, in case of delegates it will be delegate store
				$defaultStore = $this->openDefaultStore();

				$storeProps = mapi_getprops($this->store, [PR_ENTRYID]);
				$defaultStoreProps = mapi_getprops($defaultStore, [PR_ENTRYID]);

				// @FIXME use entryid comparison functions here
				if ($storeProps[PR_ENTRYID] !== $defaultStoreProps[PR_ENTRYID]) {
					// get delegate information
					$addrInfo = $this->getOwnerAddress($defaultStore, false);

					if (!empty($addrInfo)) {
						list($ownername, $owneremailaddr, $owneraddrtype, $ownerentryid, $ownersearchkey) = $addrInfo;

						$messageprops[PR_SENDER_EMAIL_ADDRESS] = $owneremailaddr;
						$messageprops[PR_SENDER_NAME] = $ownername;
						$messageprops[PR_SENDER_ADDRTYPE] = $owneraddrtype;
						$messageprops[PR_SENDER_ENTRYID] = $ownerentryid;
						$messageprops[PR_SENDER_SEARCH_KEY] = $ownersearchkey;
					}

					// get delegator information
					$addrInfo = $this->getOwnerAddress($this->store, false);

					if (!empty($addrInfo)) {
						list($ownername, $owneremailaddr, $owneraddrtype, $ownerentryid, $ownersearchkey) = $addrInfo;

						$messageprops[PR_SENT_REPRESENTING_EMAIL_ADDRESS] = $owneremailaddr;
						$messageprops[PR_SENT_REPRESENTING_NAME] = $ownername;
						$messageprops[PR_SENT_REPRESENTING_ADDRTYPE] = $owneraddrtype;
						$messageprops[PR_SENT_REPRESENTING_ENTRYID] = $ownerentryid;
						$messageprops[PR_SENT_REPRESENTING_SEARCH_KEY] = $ownersearchkey;
					}
				}
				else {
					// get organizer information
					$addrInfo = $this->getOwnerAddress($this->store);

					if (!empty($addrInfo)) {
						list($ownername, $owneremailaddr, $owneraddrtype, $ownerentryid, $ownersearchkey) = $addrInfo;

						$messageprops[PR_SENDER_EMAIL_ADDRESS] = $owneremailaddr;
						$messageprops[PR_SENDER_NAME] = $ownername;
						$messageprops[PR_SENDER_ADDRTYPE] = $owneraddrtype;
						$messageprops[PR_SENDER_ENTRYID] = $ownerentryid;
						$messageprops[PR_SENDER_SEARCH_KEY] = $ownersearchkey;

						$messageprops[PR_SENT_REPRESENTING_EMAIL_ADDRESS] = $owneremailaddr;
						$messageprops[PR_SENT_REPRESENTING_NAME] = $ownername;
						$messageprops[PR_SENT_REPRESENTING_ADDRTYPE] = $owneraddrtype;
						$messageprops[PR_SENT_REPRESENTING_ENTRYID] = $ownerentryid;
						$messageprops[PR_SENT_REPRESENTING_SEARCH_KEY] = $ownersearchkey;
					}
				}

				$messageprops[$this->proptags['replytime']] = time();

				if ($basedate && isset($ResourceMsgProps[$this->proptags['recurring']]) && $ResourceMsgProps[$this->proptags['recurring']]) {
					$recurr = new Recurrence($userStore, $newResourceMsg);

					// Copy recipients list
					$reciptable = mapi_message_getrecipienttable($message);
					$recips = mapi_table_queryallrows($reciptable, $this->recipprops);

					// add owner to recipient table
					$this->addOrganizer($messageprops, $recips, true);

					// Update occurrence
					if ($recurr->isException($basedate)) {
						$recurr->modifyException($messageprops, $basedate, $recips);
					}
					else {
						$recurr->createException($messageprops, $basedate, false, $recips);
					}
				}
				else {
					mapi_setprops($newResourceMsg, $messageprops);

					// Copy attachments
					$this->replaceAttachments($message, $newResourceMsg);

					// Copy all recipients too
					$this->replaceRecipients($message, $newResourceMsg);

					// Now add organizer also to recipient table
					$recips = [];
					$this->addOrganizer($messageprops, $recips);

					mapi_message_modifyrecipients($newResourceMsg, MODRECIP_ADD, $recips);
				}

				mapi_savechanges($newResourceMsg);

				$resourceRecipData[] = [
					'store' => $userStore,
					'folder' => $calFolder,
					'msg' => $newResourceMsg,
				];
				$this->includesResources = true;
			}
			else {
				/*
				 * If no other errors occurred and you have no access to the
				 * folder of the resource, throw an error=1.
				 */
				if (!$this->errorSetResource) {
					$this->errorSetResource = 1;
				}

				for ($j = 0, $len = count($resourceRecipData); $j < $len; ++$j) {
					// Get the EntryID
					$props = mapi_message_getprops($resourceRecipData[$j]['msg']);

					mapi_folder_deletemessages($resourceRecipData[$j]['folder'], [$props[PR_ENTRYID]], DELETE_HARD_DELETE);
				}
				$this->recipientDisplayname = $resourceRecipients[$i][PR_DISPLAY_NAME];
			}
			++$i;
		}

		/*
		 * Set the BCC-recipients (resources) tackstatus to accepted.
		 */
		// Get resource recipients
		$getResourcesRestriction = [
			RES_PROPERTY,
			[
				RELOP => RELOP_EQ,	// Equals recipient type 3: Resource
				ULPROPTAG => PR_RECIPIENT_TYPE,
				VALUE => [PR_RECIPIENT_TYPE => MAPI_BCC],
			],
		];
		$recipienttable = mapi_message_getrecipienttable($message);
		$resourceRecipients = mapi_table_queryallrows($recipienttable, $this->recipprops, $getResourcesRestriction);
		if (!empty($resourceRecipients)) {
			// Set Tracking status of resource recipients to olResponseAccepted (3)
			for ($i = 0, $len = count($resourceRecipients); $i < $len; ++$i) {
				$resourceRecipients[$i][PR_RECIPIENT_TRACKSTATUS] = olRecipientTrackStatusAccepted;
				$resourceRecipients[$i][PR_RECIPIENT_TRACKSTATUS_TIME] = time();
			}
			mapi_message_modifyrecipients($message, MODRECIP_MODIFY, $resourceRecipients);
		}

		return $resourceRecipData;
	}

	/**
	 * Function which save an exception into recurring item.
	 *
	 * @param resource $recurringItem  reference to MAPI_message of recurring item
	 * @param resource $occurrenceItem reference to MAPI_message of occurrence
	 * @param string   $basedate       basedate of occurrence
	 * @param bool     $move           if true then occurrence item is deleted
	 * @param bool     $tentative      true if user has tentatively accepted it or false if user has accepted it
	 * @param bool     $userAction     true if user has manually responded to meeting request
	 * @param resource $store          user store
	 * @param bool     $isDelegate     true if delegate is processing this meeting request
	 */
	public function acceptException(&$recurringItem, &$occurrenceItem, $basedate, $move = false, $tentative, $userAction = false, $store, $isDelegate = false) {
		$recurr = new Recurrence($store, $recurringItem);

		// Copy properties from meeting request
		$exception_props = mapi_getprops($occurrenceItem);

		// Copy recipients list
		$reciptable = mapi_message_getrecipienttable($occurrenceItem);
		// If delegate, then do not add the delegate in recipients
		if ($isDelegate) {
			$delegate = mapi_getprops($this->message, [PR_RECEIVED_BY_EMAIL_ADDRESS]);
			$res = [
				RES_PROPERTY,
				[
					RELOP => RELOP_NE,
					ULPROPTAG => PR_EMAIL_ADDRESS,
					VALUE => [PR_EMAIL_ADDRESS => $delegate[PR_RECEIVED_BY_EMAIL_ADDRESS]],
				],
			];
			$recips = mapi_table_queryallrows($reciptable, $this->recipprops, $res);
		}
		else {
			$recips = mapi_table_queryallrows($reciptable, $this->recipprops);
		}

		// add owner to recipient table
		$this->addOrganizer($exception_props, $recips, true);

		// add delegator to meetings
		if ($isDelegate) {
			$this->addDelegator($exception_props, $recips);
		}

		$exception_props[$this->proptags['meetingstatus']] = olMeetingReceived;
		$exception_props[$this->proptags['responsestatus']] = $userAction ? ($tentative ? olResponseTentative : olResponseAccepted) : olResponseNotResponded;

		if (isset($exception_props[$this->proptags['intendedbusystatus']])) {
			if ($tentative && $exception_props[$this->proptags['intendedbusystatus']] !== fbFree) {
				$exception_props[$this->proptags['busystatus']] = fbTentative;
			}
			else {
				$exception_props[$this->proptags['busystatus']] = $exception_props[$this->proptags['intendedbusystatus']];
			}
		// we already have intendedbusystatus value in $exception_props so no need to copy it
		}
		else {
			$exception_props[$this->proptags['busystatus']] = $tentative ? fbTentative : fbBusy;
		}

		if ($userAction) {
			$addrInfo = $this->getOwnerAddress($this->store);

			// if user has responded then set replytime and name
			$exception_props[$this->proptags['replytime']] = time();
			if (!empty($addrInfo)) {
				$exception_props[$this->proptags['apptreplyname']] = $addrInfo[0];
			}
		}

		if ($recurr->isException($basedate)) {
			$recurr->modifyException($exception_props, $basedate, $recips, $occurrenceItem);
		}
		else {
			$recurr->createException($exception_props, $basedate, false, $recips, $occurrenceItem);
		}

		// Move the occurrenceItem to the waste basket
		if ($move) {
			$wastebasket = $this->openDefaultWastebasket($this->openDefaultStore());
			$sourcefolder = mapi_msgstore_openentry($store, $exception_props[PR_PARENT_ENTRYID]);
			mapi_folder_copymessages($sourcefolder, [$exception_props[PR_ENTRYID]], $wastebasket, MESSAGE_MOVE);
		}

		mapi_savechanges($recurringItem);
	}

	/**
	 * Function which merges an exception mapi message to recurring message.
	 * This will be used when we receive recurring meeting request and we already have an exception message
	 * of same meeting in calendar and we need to remove that exception message and add it to attachment table
	 * of recurring meeting.
	 *
	 * @param resource $recurringItem  reference to MAPI_message of recurring item
	 * @param resource $occurrenceItem reference to MAPI_message of occurrence
	 * @param mixed    $basedate       basedate of occurrence
	 * @param resource $store          user store
	 */
	public function mergeException(&$recurringItem, &$occurrenceItem, $basedate, $store) {
		$recurr = new Recurrence($store, $recurringItem);

		// Copy properties from meeting request
		$exception_props = mapi_getprops($occurrenceItem);

		// Get recipient list from message and add it to exception attachment
		$reciptable = mapi_message_getrecipienttable($occurrenceItem);
		$recips = mapi_table_queryallrows($reciptable, $this->recipprops);

		if ($recurr->isException($basedate)) {
			$recurr->modifyException($exception_props, $basedate, $recips, $occurrenceItem);
		}
		else {
			$recurr->createException($exception_props, $basedate, false, $recips, $occurrenceItem);
		}

		// Move the occurrenceItem to the waste basket
		$wastebasket = $this->openDefaultWastebasket($this->openDefaultStore());
		$sourcefolder = mapi_msgstore_openentry($store, $exception_props[PR_PARENT_ENTRYID]);
		mapi_folder_copymessages($sourcefolder, [$exception_props[PR_ENTRYID]], $wastebasket, MESSAGE_MOVE);

		mapi_savechanges($recurringItem);
	}

	/**
	 * Function which submits meeting request based on arguments passed to it.
	 *
	 * @param resource $message        MAPI_message whose meeting request is to be sent
	 * @param bool     $cancel         if true send request, else send cancellation
	 * @param mixed    $prefix         subject prefix
	 * @param mixed    $basedate       basedate for an occurrence
	 * @param mixed    $recurObject    recurrence object of mr
	 * @param bool     $copyExceptions When sending update mail for recurring item then we don't send exceptions in attachments
	 * @param mixed    $modifiedRecips
	 * @param mixed    $deletedRecips
	 */
	public function submitMeetingRequest($message, $cancel, $prefix, $basedate = false, $recurObject = false, $copyExceptions = true, $modifiedRecips = false, $deletedRecips = false) {
		$newmessageprops = $messageprops = mapi_getprops($this->message);
		$new = $this->createOutgoingMessage();

		// Copy the entire message into the new meeting request message
		if ($basedate) {
			// messageprops contains properties of whole recurring series
			// and newmessageprops contains properties of exception item
			$newmessageprops = mapi_getprops($message);

			// Ensure that the correct basedate is set in the new message
			$newmessageprops[$this->proptags['basedate']] = $basedate;

			// Set isRecurring to false, because this is an exception
			$newmessageprops[$this->proptags['recurring']] = false;

			// set LID_IS_EXCEPTION to true
			$newmessageprops[$this->proptags['is_exception']] = true;

			// Set to high importance
			if ($cancel) {
				$newmessageprops[PR_IMPORTANCE] = IMPORTANCE_HIGH;
			}

			// Set startdate and enddate of exception
			if ($cancel && $recurObject) {
				$newmessageprops[$this->proptags['startdate']] = $recurObject->getOccurrenceStart($basedate);
				$newmessageprops[$this->proptags['duedate']] = $recurObject->getOccurrenceEnd($basedate);
			}

			// Set basedate in guid (0x3)
			$newmessageprops[$this->proptags['goid']] = $this->setBasedateInGlobalID($messageprops[$this->proptags['goid2']], $basedate);
			$newmessageprops[$this->proptags['goid2']] = $messageprops[$this->proptags['goid2']];
			$newmessageprops[PR_OWNER_APPT_ID] = $messageprops[PR_OWNER_APPT_ID];

			// Get deleted recipiets from exception msg
			$restriction = [
				RES_AND,
				[
					[
						RES_BITMASK,
						[
							ULTYPE => BMR_NEZ,
							ULPROPTAG => PR_RECIPIENT_FLAGS,
							ULMASK => recipExceptionalDeleted,
						],
					],
					[
						RES_BITMASK,
						[
							ULTYPE => BMR_EQZ,
							ULPROPTAG => PR_RECIPIENT_FLAGS,
							ULMASK => recipOrganizer,
						],
					],
				],
			];

			// In direct-booking mode, we don't need to send cancellations to resources
			if ($this->enableDirectBooking) {
				$restriction[1][] = [
					RES_PROPERTY,
					[
						RELOP => RELOP_NE,	// Does not equal recipient type: MAPI_BCC (Resource)
						ULPROPTAG => PR_RECIPIENT_TYPE,
						VALUE => [PR_RECIPIENT_TYPE => MAPI_BCC],
					],
				];
			}

			$recipienttable = mapi_message_getrecipienttable($message);
			$recipients = mapi_table_queryallrows($recipienttable, $this->recipprops, $restriction);

			if (!$deletedRecips) {
				$deletedRecips = array_merge([], $recipients);
			}
			else {
				$deletedRecips = array_merge($deletedRecips, $recipients);
			}
		}

		// Remove the PR_ICON_INDEX as it is not needed in the sent message.
		$newmessageprops[PR_ICON_INDEX] = null;
		$newmessageprops[PR_RESPONSE_REQUESTED] = true;

		// PR_START_DATE and PR_END_DATE will be used by outlook to show the position in the calendar
		$newmessageprops[PR_START_DATE] = $newmessageprops[$this->proptags['startdate']];
		$newmessageprops[PR_END_DATE] = $newmessageprops[$this->proptags['duedate']];

		// Set updatecounter/AppointmentSequenceNumber
		// get the value of latest updatecounter for the whole series and use it
		$newmessageprops[$this->proptags['updatecounter']] = $messageprops[$this->proptags['last_updatecounter']];

		$meetingTimeInfo = $this->getMeetingTimeInfo();

		if ($meetingTimeInfo) {
			// Needs to unset PR_HTML and PR_RTF_COMPRESSED props
			// because while canceling meeting requests with edit text
			// will override the PR_BODY because body value is not consistent with
			// PR_HTML and PR_RTF_COMPRESSED value so in this case PR_RTF_COMPRESSED will
			// get priority which override the PR_BODY value.
			unset($newmessageprops[PR_HTML], $newmessageprops[PR_RTF_COMPRESSED]);

			$newmessageprops[PR_BODY] = $meetingTimeInfo;
		}

		// Send all recurrence info in mail, if this is a recurrence meeting.
		if (isset($messageprops[$this->proptags['recurring']]) && $messageprops[$this->proptags['recurring']]) {
			if (!empty($messageprops[$this->proptags['recurring_pattern']])) {
				$newmessageprops[$this->proptags['recurring_pattern']] = $messageprops[$this->proptags['recurring_pattern']];
			}
			$newmessageprops[$this->proptags['recurrence_data']] = $messageprops[$this->proptags['recurrence_data']];
			$newmessageprops[$this->proptags['timezone_data']] = $messageprops[$this->proptags['timezone_data']];
			$newmessageprops[$this->proptags['timezone']] = $messageprops[$this->proptags['timezone']];

			if ($recurObject) {
				$this->generateRecurDates($recurObject, $messageprops, $newmessageprops);
			}
		}

		if (isset($newmessageprops[$this->proptags['counter_proposal']])) {
			unset($newmessageprops[$this->proptags['counter_proposal']]);
		}

		// Prefix the subject if needed
		if ($prefix && isset($newmessageprops[PR_SUBJECT])) {
			$newmessageprops[PR_SUBJECT] = $prefix . $newmessageprops[PR_SUBJECT];
		}

		if (isset($newmessageprops[$this->proptags['categories']]) &&
			!empty($newmessageprops[$this->proptags['categories']])) {
			unset($newmessageprops[$this->proptags['categories']]);
		}
		mapi_setprops($new, $newmessageprops);

		// Copy attachments
		$this->replaceAttachments($message, $new, $copyExceptions);

		// Retrieve only those recipient who should receive this meeting request.
		$stripResourcesRestriction = [
			RES_AND,
			[
				[
					RES_BITMASK,
					[
						ULTYPE => BMR_EQZ,
						ULPROPTAG => PR_RECIPIENT_FLAGS,
						ULMASK => recipExceptionalDeleted,
					],
				],
				[
					RES_BITMASK,
					[
						ULTYPE => BMR_EQZ,
						ULPROPTAG => PR_RECIPIENT_FLAGS,
						ULMASK => recipOrganizer,
					],
				],
			],
		];

		// In direct-booking mode, resources do not receive a meeting request
		if ($this->enableDirectBooking) {
			$stripResourcesRestriction[1][] = [
				RES_PROPERTY,
				[
					RELOP => RELOP_NE,	// Does not equal recipient type: MAPI_BCC (Resource)
					ULPROPTAG => PR_RECIPIENT_TYPE,
					VALUE => [PR_RECIPIENT_TYPE => MAPI_BCC],
				],
			];
		}

		// If no recipients were explicitly provided, we will send the update to all
		// recipients from the meeting.
		if ($modifiedRecips === false) {
			$recipienttable = mapi_message_getrecipienttable($message);
			$modifiedRecips = mapi_table_queryallrows($recipienttable, $this->recipprops, $stripResourcesRestriction);

			if ($basedate && empty($modifiedRecips)) {
				// Retrieve full list
				$recipienttable = mapi_message_getrecipienttable($this->message);
				$modifiedRecips = mapi_table_queryallrows($recipienttable, $this->recipprops);

				// Save recipients in exceptions
				mapi_message_modifyrecipients($message, MODRECIP_ADD, $modifiedRecips);

				// Now retrieve only those recipient who should receive this meeting request.
				$modifiedRecips = mapi_table_queryallrows($recipienttable, $this->recipprops, $stripResourcesRestriction);
			}
		}

		// @TODO: handle nonAcceptingResources
		/*
		 * Add resource recipients that did not automatically accept the meeting request.
		 * (note: meaning that they did not decline the meeting request)
		 */ /*
		for($i=0;$i<count($this->nonAcceptingResources);$i++){
			$recipients[] = $this->nonAcceptingResources[$i];
		}*/

		if (!empty($modifiedRecips)) {
			// Strip out the sender/'owner' recipient
			mapi_message_modifyrecipients($new, MODRECIP_ADD, $modifiedRecips);

			// Set some properties that are different in the sent request than
			// in the item in our calendar

			// we should store busystatus value to intendedbusystatus property, because busystatus for outgoing meeting request
			// should always be fbTentative
			$newmessageprops[$this->proptags['intendedbusystatus']] = isset($newmessageprops[$this->proptags['busystatus']]) ? $newmessageprops[$this->proptags['busystatus']] : $messageprops[$this->proptags['busystatus']];
			$newmessageprops[$this->proptags['busystatus']] = fbTentative; // The default status when not accepted
			$newmessageprops[$this->proptags['responsestatus']] = olResponseNotResponded; // The recipient has not responded yet
			$newmessageprops[$this->proptags['attendee_critical_change']] = time();
			$newmessageprops[$this->proptags['owner_critical_change']] = time();
			$newmessageprops[$this->proptags['meetingtype']] = mtgRequest;

			if ($cancel) {
				$newmessageprops[PR_MESSAGE_CLASS] = 'IPM.Schedule.Meeting.Canceled';
				$newmessageprops[$this->proptags['meetingstatus']] = olMeetingCanceled; // It's a cancel request
				$newmessageprops[$this->proptags['busystatus']] = fbFree; // set the busy status as free
			}
			else {
				$newmessageprops[PR_MESSAGE_CLASS] = 'IPM.Schedule.Meeting.Request';
				$newmessageprops[$this->proptags['meetingstatus']] = olMeetingReceived; // The recipient is receiving the request
			}

			mapi_setprops($new, $newmessageprops);
			mapi_savechanges($new);

			// Submit message to non-resource recipients
			mapi_message_submitmessage($new);
		}

		// Search through the deleted recipients, and see if any of them is also
		// listed as a recipient to whom we have sent an update. As we don't
		// want to send a cancellation message to recipients who will also receive
		// an meeting update, we have to filter those recipients out.
		if ($deletedRecips) {
			$tmp = [];

			foreach ($deletedRecips as $delRecip) {
				$found = false;

				// Search if the deleted recipient can be found inside
				// the updated recipients as well.
				foreach ($modifiedRecips as $recip) {
					if ($this->compareABEntryIDs($recip[PR_ENTRYID], $delRecip[PR_ENTRYID])) {
						$found = true;
						break;
					}
				}

				// If the recipient was not found, it truly is deleted,
				// and we can safely send a cancellation message
				if (!$found) {
					$tmp[] = $delRecip;
				}
			}

			$deletedRecips = $tmp;
		}

		// Send cancellation to deleted attendees
		if ($deletedRecips && !empty($deletedRecips)) {
			$new = $this->createOutgoingMessage();

			mapi_message_modifyrecipients($new, MODRECIP_ADD, $deletedRecips);

			$newmessageprops[PR_MESSAGE_CLASS] = 'IPM.Schedule.Meeting.Canceled';
			$newmessageprops[$this->proptags['meetingstatus']] = olMeetingCanceled; // It's a cancel request
			$newmessageprops[$this->proptags['busystatus']] = fbFree; // set the busy status as free
			$newmessageprops[PR_IMPORTANCE] = IMPORTANCE_HIGH;	// HIGH Importance
			if (isset($newmessageprops[PR_SUBJECT])) {
				$newmessageprops[PR_SUBJECT] = dgettext('zarafa', 'Canceled') . ': ' . $newmessageprops[PR_SUBJECT];
			}

			mapi_setprops($new, $newmessageprops);
			mapi_savechanges($new);

			// Submit message to non-resource recipients
			mapi_message_submitmessage($new);
		}

		// Set properties on meeting object in calendar
		// Set requestsent to 'true' (turns on 'tracking', etc)
		$props = [];
		$props[$this->proptags['meetingstatus']] = olMeeting;
		$props[$this->proptags['responsestatus']] = olResponseOrganized;
		// Only set the 'requestsent' property if it wasn't set previously yet,
		// this ensures we will not accidentally set it from true to false.
		if (!isset($messageprops[$this->proptags['requestsent']]) || $messageprops[$this->proptags['requestsent']] !== true) {
			$props[$this->proptags['requestsent']] = !empty($modifiedRecips) || ($this->includesResources && !$this->errorSetResource);
		}
		$props[$this->proptags['attendee_critical_change']] = time();
		$props[$this->proptags['owner_critical_change']] = time();
		$props[$this->proptags['meetingtype']] = mtgRequest;
		// save the new updatecounter to exception/recurring series/normal meeting
		$props[$this->proptags['updatecounter']] = $newmessageprops[$this->proptags['updatecounter']];

		// PR_START_DATE and PR_END_DATE will be used by outlook to show the position in the calendar
		$props[PR_START_DATE] = $messageprops[$this->proptags['startdate']];
		$props[PR_END_DATE] = $messageprops[$this->proptags['duedate']];

		mapi_setprops($message, $props);

		// saving of these properties on calendar item should be handled by caller function
		// based on sending meeting request was successful or not
	}

	/**
	 * OL2007 uses these 4 properties to specify occurrence that should be updated.
	 * ical generates RECURRENCE-ID property based on exception's basedate (PidLidExceptionReplaceTime),
	 * but OL07 doesn't send this property, so ical will generate RECURRENCE-ID property based on date
	 * from GlobalObjId and time from StartRecurTime property, so we are sending basedate property and
	 * also additionally we are sending these properties.
	 * Ref: MS-OXCICAL 2.2.1.20.20 Property: RECURRENCE-ID.
	 *
	 * @param object $recurObject     instance of recurrence class for this message
	 * @param array  $messageprops    properties of meeting object that is going to be sent
	 * @param array  $newmessageprops properties of meeting request/response that is going to be sent
	 */
	public function generateRecurDates($recurObject, $messageprops, &$newmessageprops) {
		if ($messageprops[$this->proptags['startdate']] && $messageprops[$this->proptags['duedate']]) {
			$startDate = date('Y:n:j:G:i:s', $recurObject->fromGMT($recurObject->tz, $messageprops[$this->proptags['startdate']]));
			$endDate = date('Y:n:j:G:i:s', $recurObject->fromGMT($recurObject->tz, $messageprops[$this->proptags['duedate']]));

			$startDate = explode(':', $startDate);
			$endDate = explode(':', $endDate);

			// [0] => year, [1] => month, [2] => day, [3] => hour, [4] => minutes, [5] => seconds
			// RecurStartDate = year * 512 + month_number * 32 + day_number
			$newmessageprops[$this->proptags['start_recur_date']] = (((int) $startDate[0]) * 512) + (((int) $startDate[1]) * 32) + ((int) $startDate[2]);
			// RecurStartTime = hour * 4096 + minutes * 64 + seconds
			$newmessageprops[$this->proptags['start_recur_time']] = (((int) $startDate[3]) * 4096) + (((int) $startDate[4]) * 64) + ((int) $startDate[5]);

			$newmessageprops[$this->proptags['end_recur_date']] = (((int) $endDate[0]) * 512) + (((int) $endDate[1]) * 32) + ((int) $endDate[2]);
			$newmessageprops[$this->proptags['end_recur_time']] = (((int) $endDate[3]) * 4096) + (((int) $endDate[4]) * 64) + ((int) $endDate[5]);
		}
	}

	/**
	 * Function will create a new outgoing message that will be used to send meeting mail.
	 *
	 * @param mixed $store (optional) store that is used when creating response, if delegate is creating outgoing mail
	 *                     then this would point to delegate store
	 *
	 * @return resource outgoing mail that is created and can be used for sending it
	 */
	public function createOutgoingMessage($store = false) {
		// get logged in user's store that will be used to send mail, for delegate this will be
		// delegate store
		$userStore = $this->openDefaultStore();

		$sentprops = [];
		$outbox = $this->openDefaultOutbox($userStore);

		$outgoing = mapi_folder_createmessage($outbox);

		// check if $store is set and it is not equal to $defaultStore (means its the delegation case)
		if ($store !== false) {
			$storeProps = mapi_getprops($store, [PR_ENTRYID]);
			$userStoreProps = mapi_getprops($userStore, [PR_ENTRYID]);

			// @FIXME use entryid comparison functions here
			if ($storeProps[PR_ENTRYID] !== $userStoreProps[PR_ENTRYID]) {
				// get the delegator properties and set it into outgoing mail
				$delegatorDetails = $this->getOwnerAddress($store, false);

				if (!empty($delegatorDetails)) {
					list($ownername, $owneremailaddr, $owneraddrtype, $ownerentryid, $ownersearchkey) = $delegatorDetails;
					$sentprops[PR_SENT_REPRESENTING_EMAIL_ADDRESS] = $owneremailaddr;
					$sentprops[PR_SENT_REPRESENTING_NAME] = $ownername;
					$sentprops[PR_SENT_REPRESENTING_ADDRTYPE] = $owneraddrtype;
					$sentprops[PR_SENT_REPRESENTING_ENTRYID] = $ownerentryid;
					$sentprops[PR_SENT_REPRESENTING_SEARCH_KEY] = $ownersearchkey;
				}

				// get the delegate properties and set it into outgoing mail
				$delegateDetails = $this->getOwnerAddress($userStore, false);

				if (!empty($delegateDetails)) {
					list($ownername, $owneremailaddr, $owneraddrtype, $ownerentryid, $ownersearchkey) = $delegateDetails;
					$sentprops[PR_SENDER_EMAIL_ADDRESS] = $owneremailaddr;
					$sentprops[PR_SENDER_NAME] = $ownername;
					$sentprops[PR_SENDER_ADDRTYPE] = $owneraddrtype;
					$sentprops[PR_SENDER_ENTRYID] = $ownerentryid;
					$sentprops[PR_SENDER_SEARCH_KEY] = $ownersearchkey;
				}
			}
		}
		else {
			// normal user is sending mail, so both set of properties will be same
			$userDetails = $this->getOwnerAddress($userStore);

			if (!empty($userDetails)) {
				list($ownername, $owneremailaddr, $owneraddrtype, $ownerentryid, $ownersearchkey) = $userDetails;
				$sentprops[PR_SENT_REPRESENTING_EMAIL_ADDRESS] = $owneremailaddr;
				$sentprops[PR_SENT_REPRESENTING_NAME] = $ownername;
				$sentprops[PR_SENT_REPRESENTING_ADDRTYPE] = $owneraddrtype;
				$sentprops[PR_SENT_REPRESENTING_ENTRYID] = $ownerentryid;
				$sentprops[PR_SENT_REPRESENTING_SEARCH_KEY] = $ownersearchkey;

				$sentprops[PR_SENDER_EMAIL_ADDRESS] = $owneremailaddr;
				$sentprops[PR_SENDER_NAME] = $ownername;
				$sentprops[PR_SENDER_ADDRTYPE] = $owneraddrtype;
				$sentprops[PR_SENDER_ENTRYID] = $ownerentryid;
				$sentprops[PR_SENDER_SEARCH_KEY] = $ownersearchkey;
			}
		}

		$sentprops[PR_SENTMAIL_ENTRYID] = $this->getDefaultSentmailEntryID($userStore);

		mapi_setprops($outgoing, $sentprops);

		return $outgoing;
	}

	/**
	 * Function which checks that meeting in attendee's calendar is already updated
	 * and we are checking an old meeting request. This function also will update property
	 * meetingtype to indicate that its out of date meeting request.
	 *
	 * @return bool true if meeting request is outofdate else false if it is new
	 */
	public function isMeetingOutOfDate() {
		$result = false;

		$props = mapi_getprops($this->message, [PR_MESSAGE_CLASS, $this->proptags['goid'], $this->proptags['goid2'], $this->proptags['updatecounter'], $this->proptags['meetingtype'], $this->proptags['owner_critical_change']]);

		if (!$this->isMeetingRequest($props[PR_MESSAGE_CLASS])) {
			return $result;
		}

		if (isset($props[$this->proptags['meetingtype']]) && ($props[$this->proptags['meetingtype']] & mtgOutOfDate) == mtgOutOfDate) {
			return true;
		}

		// get the basedate to check for exception
		$basedate = $this->getBasedateFromGlobalID($props[$this->proptags['goid']]);

		$calendarItem = $this->getCorrespondentCalendarItem(true);

		// if basedate is provided and we could not find the item then it could be that we are checking
		// an exception so get the exception and check it
		if ($basedate !== false && $calendarItem !== false) {
			$exception = $this->getExceptionItem($calendarItem, $basedate);

			if ($exception !== false) {
				// we are able to find the exception compare with it
				$calendarItem = $exception;
			}
			// we are not able to find exception, could mean that a significant change has occurred on series
			// and it deleted all exceptions, so compare with series
			// $calendarItem already contains reference to series
		}

		if ($calendarItem !== false) {
			$calendarItemProps = mapi_getprops($calendarItem, [
				$this->proptags['owner_critical_change'],
				$this->proptags['updatecounter'],
			]);

			$updateCounter = (isset($calendarItemProps[$this->proptags['updatecounter']]) && $props[$this->proptags['updatecounter']] < $calendarItemProps[$this->proptags['updatecounter']]);

			$criticalChange = (isset($calendarItemProps[$this->proptags['owner_critical_change']]) && $props[$this->proptags['owner_critical_change']] < $calendarItemProps[$this->proptags['owner_critical_change']]);

			if ($updateCounter || $criticalChange) {
				// meeting request is out of date, set properties to indicate this
				mapi_setprops($this->message, [$this->proptags['meetingtype'] => mtgOutOfDate, PR_ICON_INDEX => 1033]);
				mapi_savechanges($this->message);

				$result = true;
			}
		}

		return $result;
	}

	/**
	 * Function which checks that if we have received a meeting response for an updated meeting in organizer's calendar.
	 *
	 * @param mixed $basedate basedate of the exception if we want to compare with exception
	 *
	 * @return bool true if meeting request is updated later
	 */
	public function isMeetingUpdated($basedate = false) {
		$result = false;

		$props = mapi_getprops($this->message, [PR_MESSAGE_CLASS, $this->proptags['updatecounter']]);

		if (!$this->isMeetingRequestResponse($props[PR_MESSAGE_CLASS])) {
			return $result;
		}

		$calendarItem = $this->getCorrespondentCalendarItem(true);

		if ($calendarItem !== false) {
			// basedate is provided so open exception
			if ($basedate !== false) {
				$exception = $this->getExceptionItem($calendarItem, $basedate);

				if ($exception !== false) {
					// we are able to find the exception compare with it
					$calendarItem = $exception;
				}
				// we are not able to find exception, could mean that a significant change has occurred on series
				// and it deleted all exceptions, so compare with series
				// $calendarItem already contains reference to series
			}

			if ($calendarItem !== false) {
				$calendarItemProps = mapi_getprops($calendarItem, [$this->proptags['updatecounter']]);

				/*
				 * if(message_counter < appointment_counter) meeting object is newer then meeting response (meeting is updated)
				 * if(message_counter >= appointment_counter) meeting is not updated, do normal processing
				 */
				if (isset($calendarItemProps[$this->proptags['updatecounter']], $props[$this->proptags['updatecounter']])) {
					if ($props[$this->proptags['updatecounter']] < $calendarItemProps[$this->proptags['updatecounter']]) {
						$result = true;
					}
				}
			}
		}

		return $result;
	}

	/**
	 * Checks if there has been any significant changes on appointment/meeting item.
	 * Significant changes be:
	 * 1) startdate has been changed
	 * 2) duedate has been changed OR
	 * 3) recurrence pattern has been created, modified or removed.
	 *
	 * @param mixed $oldProps
	 * @param mixed $basedate
	 * @param mixed $isRecurrenceChanged for change in recurrence pattern.
	 *                                   true means Recurrence pattern has been changed,
	 *                                   so clear all attendees response
	 */
	public function checkSignificantChanges($oldProps, $basedate, $isRecurrenceChanged = false) {
		$message = null;
		$attach = null;

		// If basedate is specified then we need to open exception message to clear recipient responses
		if ($basedate) {
			$recurrence = new Recurrence($this->store, $this->message);
			if ($recurrence->isException($basedate)) {
				$attach = $recurrence->getExceptionAttachment($basedate);
				if ($attach) {
					$message = mapi_attach_openobj($attach, MAPI_MODIFY);
				}
			}
		}
		else {
			// use normal message or recurring series message
			$message = $this->message;
		}

		if (!$message) {
			return;
		}

		$newProps = mapi_getprops($message, [$this->proptags['startdate'], $this->proptags['duedate'], $this->proptags['updatecounter']]);

		// Check whether message is updated or not.
		if (isset($newProps[$this->proptags['updatecounter']]) && $newProps[$this->proptags['updatecounter']] == 0) {
			return;
		}

		if (($newProps[$this->proptags['startdate']] != $oldProps[$this->proptags['startdate']]) ||
				($newProps[$this->proptags['duedate']] != $oldProps[$this->proptags['duedate']]) ||
				$isRecurrenceChanged) {
			$this->clearRecipientResponse($message);

			mapi_setprops($message, [$this->proptags['owner_critical_change'] => time()]);

			mapi_savechanges($message);
			if ($attach) { // Also save attachment Object.
				mapi_savechanges($attach);
			}
		}
	}

	/**
	 * Clear responses of all attendees who have replied in past.
	 *
	 * @param resource $message on which responses should be cleared
	 */
	public function clearRecipientResponse($message) {
		$recipTable = mapi_message_getrecipienttable($message);
		$recipsRows = mapi_table_queryallrows($recipTable, $this->recipprops);

		foreach ($recipsRows as $recipient) {
			if (($recipient[PR_RECIPIENT_FLAGS] & recipOrganizer) != recipOrganizer) {
				// Recipient is attendee, set the trackstatus to 'Not Responded'
				$recipient[PR_RECIPIENT_TRACKSTATUS] = olRecipientTrackStatusNone;
			}
			else {
				// Recipient is organizer, this is not possible, but for safety
				// it is best to clear the trackstatus for him as well by setting
				// the trackstatus to 'Organized'.
				$recipient[PR_RECIPIENT_TRACKSTATUS] = olRecipientTrackStatusNone;
			}
			mapi_message_modifyrecipients($message, MODRECIP_MODIFY, [$recipient]);
		}
	}

	/**
	 * Function returns correspondent calendar item attached with the meeting request/response/cancellation.
	 * This will only check for actual MAPIMessages in calendar folder, so if a meeting request is
	 * for exception then this function will return recurring series for that meeting request
	 * after that you need to use getExceptionItem function to get exception item that will be
	 * fetched from the attachment table of recurring series MAPIMessage.
	 *
	 * @param bool $open boolean to indicate the function should return entryid or MAPIMessage. Defaults to true.
	 *
	 * @return bool|resource resource of calendar item
	 */
	public function getCorrespondentCalendarItem($open = true) {
		$props = mapi_getprops($this->message, [PR_MESSAGE_CLASS, $this->proptags['goid'], $this->proptags['goid2'], PR_RCVD_REPRESENTING_ENTRYID]);

		if (!$this->isMeetingRequest($props[PR_MESSAGE_CLASS]) && !$this->isMeetingRequestResponse($props[PR_MESSAGE_CLASS]) && !$this->isMeetingCancellation($props[PR_MESSAGE_CLASS])) {
			// can work only with meeting requests/responses/cancellations
			return false;
		}

		$globalId = $props[$this->proptags['goid']];
		$cleanGlobalId = $props[$this->proptags['goid2']];

		// If Delegate is processing Meeting Request/Response for Delegator then retrieve Delegator's store and calendar.
		if (isset($props[PR_RCVD_REPRESENTING_ENTRYID])) {
			$delegatorStore = $this->getDelegatorStore($props[PR_RCVD_REPRESENTING_ENTRYID], [PR_IPM_APPOINTMENT_ENTRYID]);

			$store = $delegatorStore['store'];
			$calFolder = $delegatorStore[PR_IPM_APPOINTMENT_ENTRYID];
		}
		else {
			$store = $this->store;
			$calFolder = $this->openDefaultCalendar();
		}

		$basedate = $this->getBasedateFromGlobalID($globalId);

		/**
		 * First search for any appointments which correspond to the $globalId,
		 * this can be the entire series (if the Meeting Request refers to the
		 * entire series), or an particular Occurrence (if the meeting Request
		 * contains a basedate).
		 *
		 * If we cannot find a corresponding item, and the $globalId contains
		 * a $basedate, it might imply that a new exception will have to be
		 * created for a series which is present in the calendar, we can look
		 * that one up by searching for the $cleanGlobalId.
		 */
		$entryids = $this->findCalendarItems($globalId, $calFolder);
		if ($basedate !== false && empty($entryids)) {
			$entryids = $this->findCalendarItems($cleanGlobalId, $calFolder, true);
		}

		// there should be only one item returned
		if (!empty($entryids) && count($entryids) === 1) {
			// return only entryid
			if ($open === false) {
				return $entryids[0];
			}

			// open calendar item and return it
			return mapi_msgstore_openentry($store, $entryids[0]);
		}

		// no items found in calendar
		return false;
	}

	/**
	 * Function returns exception item based on the basedate passed.
	 *
	 * @param mixed $recurringMessage Resource of Recurring meeting from calendar
	 * @param mixed $basedate         basedate of exception that needs to be returned
	 * @param mixed $store            store that contains the recurring calendar item
	 *
	 * @return entryid or MAPIMessage resource of exception item
	 */
	public function getExceptionItem($recurringMessage, $basedate, $store = false) {
		$occurItem = false;

		$props = mapi_getprops($this->message, [PR_RCVD_REPRESENTING_ENTRYID, $this->proptags['recurring']]);

		// check if the passed item is recurring series
		if (isset($props[$this->proptags['recurring']]) && $props[$this->proptags['recurring']] !== false) {
			return false;
		}

		if ($store === false) {
			// If Delegate is processing Meeting Request/Response for Delegator then retrieve Delegator's store and calendar.
			if (isset($props[PR_RCVD_REPRESENTING_ENTRYID])) {
				$delegatorStore = $this->getDelegatorStore($props[PR_RCVD_REPRESENTING_ENTRYID]);
				$store = $delegatorStore['store'];
			}
			else {
				$store = $this->store;
			}
		}

		$recurr = new Recurrence($store, $recurringMessage);
		$attach = $recurr->getExceptionAttachment($basedate);
		if ($attach) {
			$occurItem = mapi_attach_openobj($attach);
		}

		return $occurItem;
	}

	/**
	 * Function which checks whether received meeting request is either conflicting with other appointments or not.
	 *
	 * @param mixed $message   meeting request item that should be checked for conflicts in calendar
	 * @param mixed $userStore store containing calendar folder that will be used for confilict checking
	 * @param mixed $calFolder calendar folder for conflict checking
	 *
	 * @return mixed(boolean/integer) true if normal meeting is conflicting or an integer which specifies no of instances
	 * conflict of recurring meeting and false if meeting is not conflicting
	 * @return mixed if boolean then true/false for indicating conflict, if number then items that are conflicting with the message
	 */
	public function isMeetingConflicting($message = false, $userStore = false, $calFolder = false) {
		$returnValue = false;
		$noOfInstances = 0;

		if ($message === false) {
			$message = $this->message;
		}

		$messageProps = mapi_getprops(
			$message,
			[
				PR_MESSAGE_CLASS,
				$this->proptags['goid'],
				$this->proptags['goid2'],
				$this->proptags['startdate'],
				$this->proptags['duedate'],
				$this->proptags['recurring'],
				$this->proptags['clipstart'],
				$this->proptags['clipend'],
				PR_RCVD_REPRESENTING_ENTRYID,
				$this->proptags['basedate'],
				PR_RCVD_REPRESENTING_NAME,
			]
		);

		if ($userStore === false) {
			$userStore = $this->store;

			// check if delegate is processing the response
			if (isset($messageProps[PR_RCVD_REPRESENTING_ENTRYID])) {
				$delegatorStore = $this->getDelegatorStore($messageProps[PR_RCVD_REPRESENTING_ENTRYID], [PR_IPM_APPOINTMENT_ENTRYID]);

				$userStore = $delegatorStore['store'];
				$calFolder = $delegatorStore[PR_IPM_APPOINTMENT_ENTRYID];
			}
		}

		if ($calFolder === false) {
			$calFolder = $this->openDefaultCalendar($userStore);
		}

		if ($calFolder) {
			// Meeting request is recurring, so get all occurrence and check for each occurrence whether it conflicts with other appointments in Calendar.
			if (isset($messageProps[$this->proptags['recurring']]) && $messageProps[$this->proptags['recurring']] === true) {
				// Apply recurrence class and retrieve all occurrences(max: 30 occurrence because recurrence can also be set as 'no end date')
				$recurr = new Recurrence($userStore, $message);
				$items = $recurr->getItems($messageProps[$this->proptags['clipstart']], $messageProps[$this->proptags['clipend']] * (24 * 24 * 60), 30);

				foreach ($items as $item) {
					// Get all items in the timeframe that we want to book, and get the goid and busystatus for each item
					$calendarItems = $recurr->getCalendarItems($userStore, $calFolder, $item[$this->proptags['startdate']], $item[$this->proptags['duedate']], [$this->proptags['goid'], $this->proptags['busystatus']]);

					foreach ($calendarItems as $calendarItem) {
						if ($calendarItem[$this->proptags['busystatus']] !== fbFree) {
							/*
							 * Only meeting requests have globalID, normal appointments do not have globalID
							 * so if any normal appointment if found then it is assumed to be conflict.
							 */
							if (isset($calendarItem[$this->proptags['goid']])) {
								if ($calendarItem[$this->proptags['goid']] !== $messageProps[$this->proptags['goid']]) {
									++$noOfInstances;
									break;
								}
							}
							else {
								++$noOfInstances;
								break;
							}
						}
					}
				}

				if ($noOfInstances > 0) {
					$returnValue = $noOfInstances;
				}
			}
			else {
				// Get all items in the timeframe that we want to book, and get the goid and busystatus for each item
				$items = getCalendarItems($userStore, $calFolder, $messageProps[$this->proptags['startdate']], $messageProps[$this->proptags['duedate']], [$this->proptags['goid'], $this->proptags['busystatus']]);

				if (isset($messageProps[$this->proptags['basedate']]) && !empty($messageProps[$this->proptags['basedate']])) {
					$basedate = $messageProps[$this->proptags['basedate']];
					// Get the goid2 from recurring MR which further used to
					// check the resource conflicts item.
					$recurrItemProps = mapi_getprops($this->message, [$this->proptags['goid2']]);
					$messageProps[$this->proptags['goid']] = $this->setBasedateInGlobalID($recurrItemProps[$this->proptags['goid2']], $basedate);
					$messageProps[$this->proptags['goid2']] = $recurrItemProps[$this->proptags['goid2']];
				}

				foreach ($items as $item) {
					if ($item[$this->proptags['busystatus']] !== fbFree) {
						if (isset($item[$this->proptags['goid']])) {
							if (($item[$this->proptags['goid']] !== $messageProps[$this->proptags['goid']]) &&
								($item[$this->proptags['goid']] !== $messageProps[$this->proptags['goid2']])) {
								$returnValue = true;
								break;
							}
						}
						else {
							$returnValue = true;
							break;
						}
					}
				}
			}
		}

		return $returnValue;
	}

	/**
	 *  Function which adds organizer to recipient list which is passed.
	 *  This function also checks if it has organizer.
	 *
	 * @param array $messageProps message properties
	 * @param array $recipients   recipients list of message
	 */
	public function addDelegator($messageProps, &$recipients) {
		$hasDelegator = false;
		// Check if meeting already has an organizer.
		foreach ($recipients as $key => $recipient) {
			if (isset($messageProps[PR_RCVD_REPRESENTING_EMAIL_ADDRESS]) && $recipient[PR_EMAIL_ADDRESS] == $messageProps[PR_RCVD_REPRESENTING_EMAIL_ADDRESS]) {
				$hasDelegator = true;
			}
		}

		if (!$hasDelegator) {
			// Create delegator.
			$delegator = [];
			$delegator[PR_ENTRYID] = $messageProps[PR_RCVD_REPRESENTING_ENTRYID];
			$delegator[PR_DISPLAY_NAME] = $messageProps[PR_RCVD_REPRESENTING_NAME];
			$delegator[PR_EMAIL_ADDRESS] = $messageProps[PR_RCVD_REPRESENTING_EMAIL_ADDRESS];
			$delegator[PR_RECIPIENT_TYPE] = MAPI_TO;
			$delegator[PR_RECIPIENT_DISPLAY_NAME] = $messageProps[PR_RCVD_REPRESENTING_NAME];
			$delegator[PR_ADDRTYPE] = empty($messageProps[PR_RCVD_REPRESENTING_ADDRTYPE]) ? 'SMTP' : $messageProps[PR_RCVD_REPRESENTING_ADDRTYPE];
			$delegator[PR_RECIPIENT_TRACKSTATUS] = olRecipientTrackStatusNone;
			$delegator[PR_RECIPIENT_FLAGS] = recipSendable;
			$delegator[PR_SEARCH_KEY] = $messageProps[PR_RCVD_REPRESENTING_SEARCH_KEY];

			// Add organizer to recipients list.
			array_unshift($recipients, $delegator);
		}
	}

	/**
	 * Function will return delegator's store and calendar folder for processing meetings.
	 *
	 * @param string $receivedRepresentingEntryId entryid of the delegator user
	 * @param array  $foldersToOpen               contains list of folder types that should be returned in result
	 *
	 * @return array contains store of the delegator and resource of folders if $foldersToOpen is not empty
	 */
	public function getDelegatorStore($receivedRepresentingEntryId, $foldersToOpen = []) {
		$returnData = [];

		$delegatorStore = $this->openCustomUserStore($receivedRepresentingEntryId);
		$returnData['store'] = $delegatorStore;

		if (!empty($foldersToOpen)) {
			for ($index = 0, $len = count($foldersToOpen); $index < $len; ++$index) {
				$folderType = $foldersToOpen[$index];

				// first try with default folders
				$folder = $this->openDefaultFolder($folderType, $delegatorStore);

				// if folder not found then try with base folders
				if ($folder === false) {
					$folder = $this->openBaseFolder($folderType, $delegatorStore);
				}

				if ($folder === false) {
					// we are still not able to get the folder so give up
					continue;
				}

				$returnData[$folderType] = $folder;
			}
		}

		return $returnData;
	}

	/**
	 * Function returns extra info about meeting timing along with message body
	 * which will be included in body while sending meeting request/response.
	 *
	 * @return bool|string $meetingTimeInfo info about meeting timing along with message body
	 */
	public function getMeetingTimeInfo() {
		return $this->meetingTimeInfo;
	}

	/**
	 * Function sets extra info about meeting timing along with message body
	 * which will be included in body while sending meeting request/response.
	 *
	 * @param string $meetingTimeInfo info about meeting timing along with message body
	 */
	public function setMeetingTimeInfo($meetingTimeInfo) {
		$this->meetingTimeInfo = $meetingTimeInfo;
	}

	/**
	 * Helper function which is use to get local categories of all occurrence.
	 *
	 * @param mixed $calendarItem meeting request item
	 * @param mixed $store        store containing calendar folder
	 * @param mixed $calFolder    calendar folder
	 *
	 * @return array $localCategories which contain array of basedate along with categories
	 */
	public function getLocalCategories($calendarItem, $store, $calFolder) {
		$calendarItemProps = mapi_getprops($calendarItem);
		$recurrence = new Recurrence($store, $calendarItem);

		// Retrieve all occurrences(max: 30 occurrence because recurrence can also be set as 'no end date')
		$items = $recurrence->getItems($calendarItemProps[$this->proptags['clipstart']], $calendarItemProps[$this->proptags['clipend']] * (24 * 24 * 60), 30);
		$localCategories = [];

		foreach ($items as $item) {
			$recurrenceItems = $recurrence->getCalendarItems($store, $calFolder, $item[$this->proptags['startdate']], $item[$this->proptags['duedate']], [$this->proptags['goid'], $this->proptags['busystatus'], $this->proptags['categories']]);
			foreach ($recurrenceItems as $recurrenceItem) {
				// Check if occurrence is exception then get the local categories of that occurrence.
				if (isset($recurrenceItem[$this->proptags['goid']]) && $recurrenceItem[$this->proptags['goid']] == $calendarItemProps[$this->proptags['goid']]) {
					$exceptionAttach = $recurrence->getExceptionAttachment($recurrenceItem['basedate']);

					if ($exceptionAttach) {
						$exception = mapi_attach_openobj($exceptionAttach, 0);
						$exceptionProps = mapi_getprops($exception, [$this->proptags['categories']]);
						if (isset($exceptionProps[$this->proptags['categories']])) {
							$localCategories[$recurrenceItem['basedate']] = $exceptionProps[$this->proptags['categories']];
						}
					}
				}
			}
		}

		return $localCategories;
	}

	/**
	 * Helper function which is use to apply local categories on respective occurrences.
	 *
	 * @param mixed $calendarItem    meeting request item
	 * @param mixed $store           store containing calendar folder
	 * @param array $localCategories array contains basedate and array of categories
	 */
	public function applyLocalCategories($calendarItem, $store, $localCategories) {
		$calendarItemProps = mapi_getprops($calendarItem, [PR_PARENT_ENTRYID, PR_ENTRYID]);
		$message = mapi_msgstore_openentry($store, $calendarItemProps[PR_ENTRYID]);
		$recurrence = new Recurrence($store, $message);

		// Check for all occurrence if it is exception then modify the exception by setting up categories,
		// Otherwise create new exception with categories.
		foreach ($localCategories as $key => $value) {
			if ($recurrence->isException($key)) {
				$recurrence->modifyException([$this->proptags['categories'] => $value], $key);
			}
			else {
				$recurrence->createException([$this->proptags['categories'] => $value], $key, false);
			}
			mapi_savechanges($message);
		}
	}
}
