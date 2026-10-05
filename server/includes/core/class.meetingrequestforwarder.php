<?php

/*
 * SPDX-FileCopyrightText: Copyright 2020 - 2026 grommunio GmbH
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

/**
 * MeetingRequestForwarder.
 *
 * Forwards a meeting request to additional recipients and informs the
 * organizer with a forward notification.
 */
class MeetingRequestForwarder {
	/**
	 * @var array property tag mapping of the calling module
	 */
	private $properties;

	/**
	 * @param array $properties property tag mapping of the calling module
	 */
	public function __construct($properties) {
		$this->properties = $properties;
	}

	/**
	 * Creates a new IPM.Schedule.Meeting.Request message addressed to the
	 * requested recipients and sends a forward notification to the organizer.
	 *
	 * @param resource $store   MAPI store of the appointment
	 * @param string   $entryid entryid of the appointment to forward
	 * @param array    $action  action data from the client
	 *
	 * @return bool true when the request was submitted
	 */
	public function forward($store, $entryid, $action) {
		$message = $GLOBALS['operations']->openMessage($store, $entryid);

		if (empty($message)) {
			return false;
		}

		$sourceMessage = $this->openSourceMessage($store, $message, $action);
		// PR_SUBJECT is computed and may be omitted without a filter.
		$sourceProps = mapi_getprops($sourceMessage);
		$subjectProps = mapi_getprops($sourceMessage, [PR_SUBJECT]);
		if (isset($subjectProps[PR_SUBJECT])) {
			$sourceProps[PR_SUBJECT] = $subjectProps[PR_SUBJECT];
		}

		// Ensure we have appointment properties even when called from a
		// non-appointment module (e.g. forwarding from the mail list).
		$props = $this->properties;
		if (empty($props['goid'])) {
			$props = $GLOBALS['properties']->getAppointmentProperties();
		}

		// Always use the current user's own store for outbox operations
		// so that forwarding works without Send As permission on shared
		// calendars.
		$userStore = $GLOBALS['mapisession']->getDefaultMessageStore();
		$storeProps = mapi_getprops($userStore, [PR_IPM_OUTBOX_ENTRYID, PR_IPM_SENTMAIL_ENTRYID]);
		$outbox = mapi_msgstore_openentry($userStore, $storeProps[PR_IPM_OUTBOX_ENTRYID]);
		$fwdMsg = mapi_folder_createmessage($outbox);

		// Copy properties and attachments from the source, excluding
		// envelope/identity properties. PR_SENDER_* will be set to
		// the current user. All PR_SENT_REPRESENTING_* variants
		// (including SMTP_ADDRESS) must be absent so gromox treats
		// this as the user's own message and skips delegation checks.
		// The organizer is still informed via the MFN.
		mapi_copyto($sourceMessage, [], [
			PR_ENTRYID,
			PR_PARENT_ENTRYID,
			PR_STORE_ENTRYID,
			PR_MESSAGE_FLAGS,
			PR_MESSAGE_RECIPIENTS,
			PR_SENTMAIL_ENTRYID,
			PR_MESSAGE_DELIVERY_TIME,
			PR_SENDER_ENTRYID,
			PR_SENDER_NAME,
			PR_SENDER_EMAIL_ADDRESS,
			PR_SENDER_ADDRTYPE,
			PR_SENDER_SEARCH_KEY,
			PR_SENT_REPRESENTING_ENTRYID,
			PR_SENT_REPRESENTING_NAME,
			PR_SENT_REPRESENTING_EMAIL_ADDRESS,
			PR_SENT_REPRESENTING_ADDRTYPE,
			PR_SENT_REPRESENTING_SEARCH_KEY,
			PR_SENT_REPRESENTING_SMTP_ADDRESS,
		], $fwdMsg, 0);

		mapi_setprops($fwdMsg, $this->buildForwardProps($sourceProps, $props, $action, $storeProps[PR_IPM_SENTMAIL_ENTRYID]));

		// The icon index is cleared so the mail list derives it from the message class.
		$deleteProps = [PR_ICON_INDEX, PR_MESSAGE_DELIVERY_TIME];
		if (isset($props['counter_proposal'], $sourceProps[$props['counter_proposal']])) {
			$deleteProps[] = $props['counter_proposal'];
		}
		if (isset($props['request_sent'])) {
			$deleteProps[] = $props['request_sent'];
		}
		mapi_deleteprops($fwdMsg, $deleteProps);

		// Build recipient list using the standard Operations helper which
		// handles address resolution and one-off entryid creation.
		$recipientRows = $GLOBALS['operations']->createRecipientList($this->getForwardRecipients($action), 'add', false, true);

		if (empty($recipientRows)) {
			return false;
		}

		mapi_message_modifyrecipients($fwdMsg, MODRECIP_ADD, $recipientRows);

		mapi_savechanges($fwdMsg);
		mapi_message_submitmessage($fwdMsg);

		$this->sendForwardNotification($store, $message, $sourceProps, $recipientRows, $props, $userStore);

		return true;
	}

	/**
	 * For recurring occurrences, opens the exception attachment.
	 *
	 * @param resource $store   MAPI store of the appointment
	 * @param resource $message appointment MAPI message
	 * @param array    $action  action data from the client
	 *
	 * @return resource the exception message or the appointment itself
	 */
	private function openSourceMessage($store, $message, $action) {
		if (empty($action['basedate'])) {
			return $message;
		}
		$recur = new Recurrence($store, $message);
		$exceptionAtt = $recur->getExceptionAttachment($action['basedate']);
		if (!$exceptionAtt) {
			return $message;
		}

		return mapi_attach_openobj($exceptionAtt, 0) ?: $message;
	}

	/**
	 * @param array  $sourceProps      properties of the source message
	 * @param array  $props            property tag mapping
	 * @param array  $action           action data from the client
	 * @param string $sentmailEntryid  entryid of the user's sent items folder
	 *
	 * @return array properties of the forwarded meeting request
	 */
	private function buildForwardProps($sourceProps, $props, $action, $sentmailEntryid) {
		$session = $GLOBALS['mapisession'];
		$senderName = $session->getFullName() ?: $session->getUserName();
		$senderEmail = $session->getSMTPAddress() ?: $session->getEmailAddress();

		$subject = $sourceProps[PR_SUBJECT] ?? '';
		$subjectPrefix = $action['message_action']['forwardSubjectPrefix'] ?? 'FW: ';
		$fwdProps = [
			PR_MESSAGE_CLASS => 'IPM.Schedule.Meeting.Request',
			PR_SUBJECT => $subjectPrefix . $subject,
			PR_SENTMAIL_ENTRYID => $sentmailEntryid,
			PR_RESPONSE_REQUESTED => true,
			PR_SENDER_NAME => $senderName,
			PR_SENDER_EMAIL_ADDRESS => $senderEmail,
			PR_SENDER_ADDRTYPE => 'SMTP',
			PR_SENDER_ENTRYID => $session->getUserEntryID(),
			PR_SENDER_SEARCH_KEY => $session->getSearchKey(),
		];

		$fixedValues = ['meeting' => olMeetingReceived, 'responsestatus' => olResponseNotResponded, 'busystatus' => fbTentative];
		foreach ($fixedValues as $key => $value) {
			if (isset($props[$key])) {
				$fwdProps[$props[$key]] = $value;
			}
		}
		if (isset($props['intendedbusystatus'], $sourceProps[$props['busystatus']])) {
			$fwdProps[$props['intendedbusystatus']] = $sourceProps[$props['busystatus']];
		}

		// Mail list views and previews rely on PR_START_DATE / PR_END_DATE.
		if (isset($props['startdate'], $sourceProps[$props['startdate']])) {
			$fwdProps[PR_START_DATE] = $sourceProps[$props['startdate']];
		}
		if (isset($props['duedate'], $sourceProps[$props['duedate']])) {
			$fwdProps[PR_END_DATE] = $sourceProps[$props['duedate']];
		}

		return $fwdProps;
	}

	/**
	 * @param array $action action data from the client
	 *
	 * @return array forward recipients with defaults for missing fields
	 */
	private function getForwardRecipients($action) {
		$forwardRecipients = $action['message_action']['forwardRecipients'] ?? [];
		foreach ($forwardRecipients as &$recip) {
			$recip['recipient_type'] ??= MAPI_TO;
			$recip['address_type'] ??= 'SMTP';
			$recip['display_type'] ??= DT_MAILUSER;
			$recip['display_type_ex'] ??= DT_MAILUSER;
			$recip['object_type'] ??= MAPI_MAILUSER;
		}
		unset($recip);

		return $forwardRecipients;
	}

	/**
	 * Send a forward notification to the meeting organizer informing them
	 * that the meeting was forwarded to additional recipients.
	 *
	 * @param resource $store         MAPI store containing the appointment
	 * @param resource $message       original appointment MAPI message
	 * @param array    $messageProps  properties of the source message
	 * @param array    $recipientRows MAPI recipient rows of forward targets
	 * @param array    $props         property tag mapping
	 * @param resource $userStore     current user's default store
	 */
	private function sendForwardNotification($store, $message, $messageProps, $recipientRows, $props, $userStore) {
		$req = new Meetingrequest($store, $message, $GLOBALS['mapisession']->getSession());
		if ($req->isLocalOrganiser()) {
			return;
		}

		$organizerEmail = $messageProps[PR_SENT_REPRESENTING_EMAIL_ADDRESS] ?? '';
		if (empty($organizerEmail)) {
			return;
		}

		$userStoreProps = mapi_getprops($userStore, [PR_IPM_OUTBOX_ENTRYID, PR_IPM_SENTMAIL_ENTRYID]);
		$outbox = mapi_msgstore_openentry($userStore, $userStoreProps[PR_IPM_OUTBOX_ENTRYID]);
		$notifMsg = mapi_folder_createmessage($outbox);

		$meeting = $this->getMeetingDetails($messageProps, $props);
		$subject = $messageProps[PR_SUBJECT] ?? '';
		$notifProps = [
			PR_MESSAGE_CLASS => 'IPM.Schedule.Meeting.Notification.Forward',
			PR_SUBJECT => _('Your meeting has been forwarded') . ': ' . $subject,
			PR_BODY => $this->buildNotificationBody($subject, $meeting, $recipientRows),
			PR_SENTMAIL_ENTRYID => $userStoreProps[PR_IPM_SENTMAIL_ENTRYID],
		];
		$notifProps += $this->getNotificationAppointmentProps($messageProps, $props, $meeting, $userStore);

		mapi_setprops($notifMsg, $notifProps);
		mapi_message_modifyrecipients($notifMsg, MODRECIP_ADD, [$this->buildOrganizerRecipient($messageProps)]);

		mapi_savechanges($notifMsg);
		mapi_message_submitmessage($notifMsg);
	}

	/**
	 * Reads start, end and location of the meeting. Property keys differ
	 * between the appointment set (startdate) and mail set
	 * (appointment_startdate); the appointment_* keys are preferred as the
	 * mail set also has startdate/duedate mapped to Task properties.
	 *
	 * @param array $messageProps properties of the source message
	 * @param array $props        property tag mapping
	 *
	 * @return array with keys start, end, location
	 */
	private function getMeetingDetails($messageProps, $props) {
		$startKey = isset($props['appointment_startdate']) ? 'appointment_startdate' : 'startdate';
		$endKey = isset($props['appointment_duedate']) ? 'appointment_duedate' : 'duedate';
		$locKey = isset($props['appointment_location']) ? 'appointment_location' : 'location';

		return [
			'start' => $this->getMappedValue($messageProps, $props, $startKey, null),
			'end' => $this->getMappedValue($messageProps, $props, $endKey, null),
			'location' => $this->getMappedValue($messageProps, $props, $locKey, ''),
		];
	}

	/**
	 * @param array  $messageProps properties of the source message
	 * @param array  $props        property tag mapping
	 * @param string $key          key into $props
	 * @param mixed  $default      value when the property is unmapped or unset
	 *
	 * @return mixed
	 */
	private function getMappedValue($messageProps, $props, $key, $default) {
		return isset($props[$key], $messageProps[$props[$key]]) ? $messageProps[$props[$key]] : $default;
	}

	/**
	 * @param array $recipientRows MAPI recipient rows of forward targets
	 *
	 * @return string comma-separated names and addresses
	 */
	private function formatForwardedTo($recipientRows) {
		$forwardedTo = [];
		foreach ($recipientRows as $recip) {
			$name = $recip[PR_DISPLAY_NAME] ?? '';
			$email = $recip[PR_SMTP_ADDRESS] ?? $recip[PR_EMAIL_ADDRESS] ?? '';
			if (!empty($name) && !empty($email) && $name !== $email) {
				$forwardedTo[] = $name . ' (' . $email . ')';
			}
			else {
				$forwardedTo[] = $name ?: $email;
			}
		}

		return implode(', ', $forwardedTo);
	}

	/**
	 * @param string $subject       meeting subject
	 * @param array  $meeting       result of getMeetingDetails()
	 * @param array  $recipientRows MAPI recipient rows of forward targets
	 *
	 * @return string notification body
	 */
	private function buildNotificationBody($subject, $meeting, $recipientRows) {
		$recipients = $this->formatForwardedTo($recipientRows);
		$currentUser = $GLOBALS['mapisession']->getFullName() ?: $GLOBALS['mapisession']->getUserName();

		$body = _('Your meeting has been forwarded') . "\n\n";
		$body .= $currentUser . ' ' . _('has forwarded your meeting request to others.') . "\n\n";
		$body .= '     ' . _('Meeting') . ': ' . $subject . "\n";
		if ($meeting['start']) {
			$meetingTime = date(_('l, F j, Y g:i A'), $meeting['start']);
			if ($meeting['end']) {
				$meetingTime .= ' - ' . date(_('l, F j, Y g:i A'), $meeting['end']);
			}
			$body .= '     ' . _('Meeting Time') . ': ' . $meetingTime . "\n";
		}
		if (!empty($meeting['location'])) {
			$body .= '     ' . _('Location') . ': ' . $meeting['location'] . "\n";
		}
		$body .= '     ' . _('Recipients') . ': ' . $recipients . "\n";

		return $body;
	}

	/**
	 * Appointment properties so the preview can show When/Location and link
	 * the notification to the calendar item. Named property tags are
	 * resolved against the user's store so they match when the
	 * notification is later read back.
	 *
	 * @param array    $messageProps properties of the source message
	 * @param array    $props        property tag mapping
	 * @param array    $meeting      result of getMeetingDetails()
	 * @param resource $userStore    current user's default store
	 *
	 * @return array
	 */
	private function getNotificationAppointmentProps($messageProps, $props, $meeting, $userStore) {
		$namedProps = getPropIdsFromStrings($userStore, [
			'startdate' => "PT_SYSTIME:PSETID_Appointment:" . PidLidAppointmentStartWhole,
			'duedate' => "PT_SYSTIME:PSETID_Appointment:" . PidLidAppointmentEndWhole,
			'location' => "PT_STRING8:PSETID_Appointment:" . PidLidLocation,
			'goid' => "PT_BINARY:PSETID_Meeting:" . PidLidGlobalObjectId,
			'goid2' => "PT_BINARY:PSETID_Meeting:" . PidLidCleanGlobalObjectId,
		]);

		$notifProps = [];
		if (isset($props['goid'], $messageProps[$props['goid']])) {
			$notifProps[$namedProps['goid']] = $messageProps[$props['goid']];
		}
		if (isset($props['goid2'], $messageProps[$props['goid2']])) {
			$notifProps[$namedProps['goid2']] = $messageProps[$props['goid2']];
		}
		if ($meeting['start']) {
			$notifProps[PR_START_DATE] = $meeting['start'];
			$notifProps[$namedProps['startdate']] = $meeting['start'];
		}
		if ($meeting['end']) {
			$notifProps[PR_END_DATE] = $meeting['end'];
			$notifProps[$namedProps['duedate']] = $meeting['end'];
		}
		if (!empty($meeting['location'])) {
			$notifProps[$namedProps['location']] = $meeting['location'];
		}

		return $notifProps;
	}

	/**
	 * @param array $messageProps properties of the source message
	 *
	 * @return array recipient row addressing the organizer
	 */
	private function buildOrganizerRecipient($messageProps) {
		$organizerEmail = $messageProps[PR_SENT_REPRESENTING_EMAIL_ADDRESS] ?? '';
		$organizerName = $messageProps[PR_SENT_REPRESENTING_NAME] ?? '';
		$addrType = $messageProps[PR_SENT_REPRESENTING_ADDRTYPE] ?? 'SMTP';
		$organizerRecip = [
			PR_DISPLAY_NAME => $organizerName,
			PR_EMAIL_ADDRESS => $organizerEmail,
			PR_ADDRTYPE => $addrType,
			PR_RECIPIENT_TYPE => MAPI_TO,
		];
		$organizerRecip[PR_ENTRYID] = !empty($messageProps[PR_SENT_REPRESENTING_ENTRYID])
			? $messageProps[PR_SENT_REPRESENTING_ENTRYID]
			: mapi_createoneoff($organizerName, $addrType, $organizerEmail);
		if (!empty($messageProps[PR_SENT_REPRESENTING_SEARCH_KEY])) {
			$organizerRecip[PR_SEARCH_KEY] = $messageProps[PR_SENT_REPRESENTING_SEARCH_KEY];
		}

		return $organizerRecip;
	}
}
