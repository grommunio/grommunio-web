<?php

/*
 * SPDX-FileCopyrightText: Copyright 2020 - 2026 grommunio GmbH
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

if (function_exists('mapi_getprops')) {
	echo "Meeting request forwarder checks skipped with php-mapi loaded\n";

	return;
}

$constants = [
	'PR_IPM_OUTBOX_ENTRYID', 'PR_IPM_SENTMAIL_ENTRYID', 'PR_SUBJECT', 'PR_ENTRYID', 'PR_PARENT_ENTRYID',
	'PR_STORE_ENTRYID', 'PR_MESSAGE_FLAGS', 'PR_MESSAGE_RECIPIENTS', 'PR_SENTMAIL_ENTRYID',
	'PR_MESSAGE_DELIVERY_TIME', 'PR_SENDER_ENTRYID', 'PR_SENDER_NAME', 'PR_SENDER_EMAIL_ADDRESS',
	'PR_SENDER_ADDRTYPE', 'PR_SENDER_SEARCH_KEY', 'PR_SENT_REPRESENTING_ENTRYID', 'PR_SENT_REPRESENTING_NAME',
	'PR_SENT_REPRESENTING_EMAIL_ADDRESS', 'PR_SENT_REPRESENTING_ADDRTYPE', 'PR_SENT_REPRESENTING_SEARCH_KEY',
	'PR_SENT_REPRESENTING_SMTP_ADDRESS', 'PR_MESSAGE_CLASS', 'PR_RESPONSE_REQUESTED', 'PR_START_DATE',
	'PR_END_DATE', 'PR_ICON_INDEX', 'PR_DISPLAY_NAME', 'PR_SMTP_ADDRESS', 'PR_EMAIL_ADDRESS', 'PR_BODY',
	'PR_ADDRTYPE', 'PR_RECIPIENT_TYPE', 'PR_SEARCH_KEY', 'MAPI_TO', 'DT_MAILUSER', 'MAPI_MAILUSER',
	'MODRECIP_ADD', 'olMeetingReceived', 'olResponseNotResponded', 'fbTentative',
	'PidLidAppointmentStartWhole', 'PidLidAppointmentEndWhole', 'PidLidLocation', 'PidLidGlobalObjectId',
	'PidLidCleanGlobalObjectId',
];
foreach ($constants as $index => $constant) {
	defined($constant) || define($constant, 1000 + $index);
}

$GLOBALS['fwdCalls'] = [];
$GLOBALS['fwdLocalOrganiser'] = false;

function fwdLog($call, ...$args) {
	$GLOBALS['fwdCalls'][] = array_merge([$call], $args);
}

if (!function_exists('mapi_getprops')) {
	function mapi_getprops($object, $properties = null) {
		if ($object === 'user-store') {
			return [PR_IPM_OUTBOX_ENTRYID => 'outbox-id', PR_IPM_SENTMAIL_ENTRYID => 'sent-id'];
		}
		if ($properties === [PR_SUBJECT]) {
			return [PR_SUBJECT => 'Planning'];
		}

		return [
			PR_SENT_REPRESENTING_EMAIL_ADDRESS => 'org@example.test',
			PR_SENT_REPRESENTING_NAME => 'Org',
			1 => 1700000000,
			2 => 1700003600,
			3 => 'Room 1',
			4 => 'goid-value',
			5 => 2,
		];
	}

	function mapi_msgstore_openentry($store, $entryid) {
		return 'outbox';
	}

	function mapi_folder_createmessage($folder) {
		static $count = 0;

		return 'msg' . (++$count);
	}

	function mapi_copyto($src, $excludeIids, $excludeProps, $dst, $flags) {
		fwdLog('copyto', $src, $dst);
	}

	function mapi_setprops($message, $props) {
		fwdLog('setprops', $message, $props);
	}

	function mapi_deleteprops($message, $props) {
		fwdLog('deleteprops', $message, $props);
	}

	function mapi_message_modifyrecipients($message, $flags, $rows) {
		fwdLog('modifyrecipients', $message, $rows);
	}

	function mapi_savechanges($message) {
		fwdLog('savechanges', $message);
	}

	function mapi_message_submitmessage($message) {
		fwdLog('submit', $message);
	}

	function mapi_createoneoff($name, $type, $address) {
		return "oneoff:{$name}:{$type}:{$address}";
	}

	if (!function_exists('_')) {
		function _($text) {
			return $text;
		}
	}

	function getPropIdsFromStrings($store, $names) {
		return array_combine(array_keys($names), array_map(fn ($k) => 'named-' . $k, array_keys($names)));
	}

	class Meetingrequest {
		public function __construct($store, $message, $session) {}

		public function isLocalOrganiser() {
			return $GLOBALS['fwdLocalOrganiser'];
		}
	}
}

$GLOBALS['operations'] = new class {
	public function openMessage($store, $entryid) {
		return $entryid === 'missing' ? false : 'appointment';
	}

	public function createRecipientList($recipients, $opType, $isException, $copyProps) {
		$rows = [];
		foreach ($recipients as $r) {
			$rows[] = [PR_DISPLAY_NAME => $r['display_name'], PR_SMTP_ADDRESS => $r['smtp_address'], PR_RECIPIENT_TYPE => $r['recipient_type']];
		}

		return $rows;
	}
};

$GLOBALS['mapisession'] = new class {
	public function getDefaultMessageStore() {
		return 'user-store';
	}

	public function getFullName() {
		return 'Delegate';
	}

	public function getUserName() {
		return 'delegate';
	}

	public function getSMTPAddress() {
		return 'delegate@example.test';
	}

	public function getEmailAddress() {
		return '';
	}

	public function getUserEntryID() {
		return 'user-eid';
	}

	public function getSearchKey() {
		return 'user-sk';
	}

	public function getSession() {
		return 'session';
	}
};

require_once dirname(__DIR__) . '/includes/core/class.meetingrequestforwarder.php';

function assertForwarder($condition, $message) {
	if (!$condition) {
		throw new RuntimeException($message);
	}
}

function callsOf($name) {
	return array_values(array_filter($GLOBALS['fwdCalls'], fn ($c) => $c[0] === $name));
}

$props = ['goid' => 4, 'meeting' => 10, 'busystatus' => 5, 'intendedbusystatus' => 11, 'startdate' => 1, 'duedate' => 2, 'location' => 3, 'request_sent' => 12];
$action = ['message_action' => ['forwardRecipients' => [
	['display_name' => 'Ann', 'smtp_address' => 'ann@example.test'],
	['display_name' => '', 'smtp_address' => 'bob@example.test', 'recipient_type' => 2],
]]];
$forwarder = new MeetingRequestForwarder($props);

assertForwarder($forwarder->forward('store', 'missing', $action) === false, 'A missing appointment was forwarded');
assertForwarder($GLOBALS['fwdCalls'] === [], 'A missing appointment reached MAPI');

assertForwarder($forwarder->forward('store', 'appt', ['message_action' => []]) === false, 'A forward without recipients succeeded');
assertForwarder(callsOf('submit') === [], 'A forward without recipients was submitted');

$GLOBALS['fwdCalls'] = [];
assertForwarder($forwarder->forward('store', 'appt', $action) === true, 'A valid forward failed');

$setprops = callsOf('setprops');
$fwdProps = $setprops[0][2];
assertForwarder($setprops[0][1] === 'msg2', 'Forward properties went to the wrong message');
assertForwarder($fwdProps[PR_SUBJECT] === 'FW: Planning', 'Forward subject is wrong');
assertForwarder($fwdProps[PR_MESSAGE_CLASS] === 'IPM.Schedule.Meeting.Request', 'Forward class is wrong');
assertForwarder($fwdProps[10] === olMeetingReceived && $fwdProps[5] === fbTentative && $fwdProps[11] === 2, 'Meeting state properties are wrong');
assertForwarder($fwdProps[PR_START_DATE] === 1700000000 && $fwdProps[PR_END_DATE] === 1700003600, 'Forward dates are wrong');
assertForwarder($fwdProps[PR_SENDER_EMAIL_ADDRESS] === 'delegate@example.test', 'Forward sender is wrong');
assertForwarder(callsOf('deleteprops')[0][2] === [PR_ICON_INDEX, PR_MESSAGE_DELIVERY_TIME, 12], 'Forward delete list is wrong');

$recipients = callsOf('modifyrecipients');
assertForwarder($recipients[0][2][0][PR_RECIPIENT_TYPE] === MAPI_TO && $recipients[0][2][1][PR_RECIPIENT_TYPE] === 2, 'Recipient type defaults are wrong');

$notif = $setprops[1][2];
$expectedBody = "Your meeting has been forwarded\n\n" .
	"Delegate has forwarded your meeting request to others.\n\n" .
	"     Meeting: Planning\n" .
	'     Meeting Time: ' . date('l, F j, Y g:i A', 1700000000) . ' - ' . date('l, F j, Y g:i A', 1700003600) . "\n" .
	"     Location: Room 1\n" .
	"     Recipients: Ann (ann@example.test), bob@example.test\n";
assertForwarder($setprops[1][1] === 'msg3', 'Notification went to the wrong message');
assertForwarder($notif[PR_BODY] === $expectedBody, 'Notification body is wrong');
assertForwarder($notif[PR_SUBJECT] === 'Your meeting has been forwarded: Planning', 'Notification subject is wrong');
assertForwarder($notif['named-goid'] === 'goid-value' && $notif['named-location'] === 'Room 1' && $notif[PR_START_DATE] === 1700000000, 'Notification appointment properties are wrong');
assertForwarder($recipients[1][2][0][PR_ENTRYID] === 'oneoff:Org:SMTP:org@example.test', 'Organizer recipient is wrong');
assertForwarder(array_column(callsOf('submit'), 1) === ['msg2', 'msg3'], 'Submit order is wrong');

$GLOBALS['fwdCalls'] = [];
$GLOBALS['fwdLocalOrganiser'] = true;
assertForwarder($forwarder->forward('store', 'appt', $action) === true, 'Forward by the organizer failed');
assertForwarder(count(callsOf('submit')) === 1, 'The organizer was notified about their own forward');

echo "Meeting request forwarder checks passed\n";
