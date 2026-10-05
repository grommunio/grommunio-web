<?php

/*
 * SPDX-FileCopyrightText: Copyright 2020 - 2026 grommunio GmbH
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

/* Recipient flags written by createRecipientList() for meeting exceptions. */
foreach (['PR_DISPLAY_NAME', 'PR_DISPLAY_TYPE', 'PR_DISPLAY_TYPE_EX', 'PR_EMAIL_ADDRESS', 'PR_SMTP_ADDRESS',
	'PR_SEARCH_KEY', 'PR_ADDRTYPE', 'PR_OBJECT_TYPE', 'PR_RECIPIENT_TYPE', 'PR_ROWID', 'PR_RECIPIENT_TRACKSTATUS',
	'PR_RECIPIENT_FLAGS', 'PR_RECIPIENT_PROPOSED', 'PR_RECIPIENT_PROPOSEDSTARTTIME', 'PR_RECIPIENT_PROPOSEDENDTIME',
	'PR_ENTRYID'] as $index => $constant) {
	defined($constant) || define($constant, $index + 300);
}
defined('recipSendable') || define('recipSendable', 0x00000001);
defined('recipOrganizer') || define('recipOrganizer', 0x00000002);
defined('recipReserved') || define('recipReserved', 0x00000200);

$GLOBALS['mapisession'] = new class {
	public function getAddressbook() {
		return 'addressbook';
	}
};

require_once dirname(__DIR__) . '/includes/core/class.operations.php';

function exceptionRecipient(string $name, int $flags, ?int $rowid = null): array {
	$recipient = [
		'display_name' => $name,
		'display_type' => 0,
		'display_type_ex' => 0,
		'email_address' => $name . '@example.test',
		'smtp_address' => $name . '@example.test',
		'address_type' => 'SMTP',
		'object_type' => 6,
		'recipient_type' => 1,
		'recipient_flags' => $flags,
		'entryid' => bin2hex($name),
	];
	if ($rowid !== null) {
		$recipient['rowid'] = $rowid;
	}

	return $recipient;
}

$checks = 0;
function exceptionRecipientCheck(bool $condition, string $label): void {
	if (!$condition) {
		throw new RuntimeException($label);
	}
	++$GLOBALS['checks'];
}

$operations = new Operations();
$list = [
	exceptionRecipient('organizer', recipSendable | recipOrganizer, 0),
	exceptionRecipient('attendee', recipSendable, 1),
];

foreach (['add', 'modify'] as $opType) {
	$recipients = $operations->createRecipientList($list, $opType, true, true);
	exceptionRecipientCheck(count($recipients) === 1, "{$opType}: the organizer was added to the exception");
	exceptionRecipientCheck($recipients[0][PR_DISPLAY_NAME] === 'attendee', "{$opType}: the attendee is missing");
	exceptionRecipientCheck($recipients[0][PR_RECIPIENT_FLAGS] === recipSendable, "{$opType}: the attendee flags were changed");
}

$recipients = $operations->createRecipientList($list, 'add');
exceptionRecipientCheck(count($recipients) === 2, 'a series lost its organizer');
exceptionRecipientCheck($recipients[0][PR_RECIPIENT_FLAGS] === (recipSendable | recipOrganizer), 'a series changed the organizer flags');
exceptionRecipientCheck($recipients[1][PR_RECIPIENT_FLAGS] === recipSendable, 'a series changed the attendee flags');

echo "OK: {$checks} exception recipient assertions\n";
