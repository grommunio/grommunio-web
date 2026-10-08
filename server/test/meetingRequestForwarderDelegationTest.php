<?php

/*
 * SPDX-FileCopyrightText: Copyright 2020 - 2026 grommunio GmbH
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

// A mapi-header-php that forwards meetings itself gets the whole forward.
if (function_exists('mapi_getprops')) {
	echo "Meeting request forwarder delegation checks skipped with php-mapi loaded\n";

	return;
}

foreach (['PR_DISPLAY_NAME', 'PR_SMTP_ADDRESS', 'PR_RECIPIENT_TYPE', 'MAPI_TO', 'DT_MAILUSER', 'MAPI_MAILUSER'] as $index => $constant) {
	define($constant, 1000 + $index);
}

class Meetingrequest {
	public static $calls = [];

	public function __construct($store, $message, $session) {
		self::$calls[] = ['construct', $store, $message, $session];
	}

	public function forwardMeetingRequest(array $recipients, string $prefix = 'FW: ', false|int $basedate = false): void {
		self::$calls[] = ['forward', $recipients, $prefix, $basedate];
	}
}

$GLOBALS['operations'] = new class {
	public function openMessage($store, $entryid) {
		return 'appointment';
	}

	public function createRecipientList($recipients, $opType, $isException, $copyProps) {
		return array_map(fn ($r) => [PR_DISPLAY_NAME => $r['display_name'], PR_SMTP_ADDRESS => $r['smtp_address'], PR_RECIPIENT_TYPE => $r['recipient_type']], $recipients);
	}
};

$GLOBALS['mapisession'] = new class {
	public function getSession() {
		return 'session';
	}
};

require_once dirname(__DIR__) . '/includes/core/class.meetingrequestforwarder.php';

function assertDelegation($condition, $message) {
	if (!$condition) {
		throw new RuntimeException($message);
	}
}

$forwarder = new MeetingRequestForwarder([]);
$action = ['basedate' => '1700000000', 'message_action' => [
	'forwardRecipients' => [['display_name' => 'Ann', 'smtp_address' => 'ann@example.test']],
	'forwardSubjectPrefix' => 'WG: ',
]];

// Without the mapi stubs any MAPI call of the web's own forward would be fatal.
assertDelegation($forwarder->forward('store', 'appt', $action) === true, 'The delegated forward failed');
assertDelegation(Meetingrequest::$calls[0] === ['construct', 'store', 'appointment', 'session'], 'The forward was built on the wrong message');
$rows = [[PR_DISPLAY_NAME => 'Ann', PR_SMTP_ADDRESS => 'ann@example.test', PR_RECIPIENT_TYPE => MAPI_TO]];
assertDelegation(Meetingrequest::$calls[1] === ['forward', $rows, 'WG: ', 1700000000], 'The forward arguments are wrong');

Meetingrequest::$calls = [];
assertDelegation($forwarder->forward('store', 'appt', ['message_action' => []]) === false, 'A forward without recipients succeeded');
assertDelegation(Meetingrequest::$calls === [], 'A forward without recipients reached mapi-header-php');

echo "Meeting request forwarder delegation checks passed\n";
