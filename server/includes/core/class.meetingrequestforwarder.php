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
	 * Has mapi-header-php forward a meeting request to additional recipients
	 * and notify the organizer.
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

		// Build recipient list using the standard Operations helper which
		// handles address resolution and one-off entryid creation.
		$recipientRows = $GLOBALS['operations']->createRecipientList($this->getForwardRecipients($action), 'add', false, true);

		if (empty($recipientRows)) {
			return false;
		}

		$req = new Meetingrequest($store, $message, $GLOBALS['mapisession']->getSession());
		$req->forwardMeetingRequest($recipientRows, $action['message_action']['forwardSubjectPrefix'] ?? 'FW: ', empty($action['basedate']) ? false : (int) $action['basedate']);

		return true;
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
}
