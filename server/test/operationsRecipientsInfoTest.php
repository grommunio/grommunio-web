<?php

/*
 * SPDX-FileCopyrightText: Copyright 2020 - 2026 grommunio GmbH
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

/* Recipient rows of a message as returned by getRecipientsInfo(). */
if (function_exists('mapi_msgstore_openentry')) {
	echo "Recipient info checks skipped with php-mapi loaded\n";

	return;
}

foreach (['PR_ADDRTYPE', 'PR_DISPLAY_NAME', 'PR_DISPLAY_TYPE', 'PR_DISPLAY_TYPE_EX', 'PR_EMAIL_ADDRESS', 'PR_ENTRYID',
	'PR_OBJECT_TYPE', 'PR_RECIPIENT_FLAGS', 'PR_RECIPIENT_PROPOSED', 'PR_RECIPIENT_PROPOSEDENDTIME',
	'PR_RECIPIENT_PROPOSEDSTARTTIME', 'PR_RECIPIENT_TRACKSTATUS', 'PR_RECIPIENT_TRACKSTATUS_TIME', 'PR_RECIPIENT_TYPE',
	'PR_ROWID', 'PR_SEARCH_KEY', 'PR_SMTP_ADDRESS', 'MAPI_MAILUSER', 'DT_MAILUSER', 'MAPI_UNICODE',
	'recipExceptionalDeleted', 'olRecipientTrackStatusNone'] as $index => $constant) {
	define($constant, $index + 500);
}
define('MAPI_E_NOT_FOUND', 0x8004010F);
define('MAPI_E_INVALID_PARAMETER', 0x80070057);

class MAPIException extends Exception {}

$GLOBALS['mapisession'] = new class {
	public function getAddressbook($fresh = false, $loadSharedContactsProvider = false) {
		return 'addressbook';
	}
};
$GLOBALS['properties'] = new class {
	public function getRecipientProperties() {
		return [];
	}
};

$GLOBALS['abOpened'] = [];
if (!function_exists('mapi_message_getrecipienttable')) {
	function mapi_message_getrecipienttable($message) {
		return 'table';
	}

	function mapi_table_queryallrows($table, $props) {
		return $GLOBALS['recipientRows'];
	}

	function mapi_ab_openentry($ab, $entryid) {
		$GLOBALS['abOpened'][] = $entryid;
		if ($entryid === 'unknown') {
			throw new MAPIException('not found', MAPI_E_NOT_FOUND);
		}

		return 'mailuser';
	}

	function mapi_createoneoff($displayName, $addressType, $emailAddress, $flags = 0) {
		return 'oneoff:' . $emailAddress;
	}
}

require_once dirname(__DIR__) . '/includes/core/class.operations.php';

class RecipientsInfoOperations extends Operations {
	public function getEmailAddress($entryId, $searchKey = false) {
		return 'resolved@example.test';
	}
}

$checks = 0;
function recipientsInfoCheck(bool $condition, string $label): void {
	if (!$condition) {
		throw new RuntimeException($label);
	}
	++$GLOBALS['checks'];
}

set_error_handler(function (int $errno, string $errstr): bool {
	throw new ErrorException($errstr, 0, $errno);
});

function exRecipient(string $name, ?string $entryid): array {
	$row = [
		PR_ROWID => 0,
		PR_RECIPIENT_TYPE => 1,
		PR_DISPLAY_NAME => $name,
		PR_EMAIL_ADDRESS => '/o=test/cn=' . $name,
		PR_SMTP_ADDRESS => $name . '@example.test',
		PR_ADDRTYPE => 'EX',
	];
	if ($entryid !== null) {
		$row[PR_ENTRYID] = $entryid;
	}

	return $row;
}

$GLOBALS['recipientRows'] = [exRecipient('known', 'known'), exRecipient('unknown', 'unknown'), exRecipient('missing', null)];
$recipients = (new RecipientsInfoOperations())->getRecipientsInfo('message');

recipientsInfoCheck($GLOBALS['abOpened'] === ['known', 'unknown'], 'an EX recipient without entryid was looked up');
recipientsInfoCheck($recipients[0]['props']['address_type'] === 'EX', 'a known EX recipient was converted');
recipientsInfoCheck($recipients[0]['props']['entryid'] === bin2hex('known'), 'a known EX recipient lost its entryid');
foreach ([1 => 'unknown', 2 => 'missing'] as $index => $name) {
	$props = $recipients[$index]['props'];
	recipientsInfoCheck($props['address_type'] === 'SMTP', "{$name}: the EX recipient was not converted to SMTP");
	recipientsInfoCheck($props['email_address'] === $name . '@example.test', "{$name}: the SMTP address was not used");
	recipientsInfoCheck($props['entryid'] === bin2hex('oneoff:' . $name . '@example.test'), "{$name}: no one-off entryid");
}

echo "OK: {$checks} recipient info assertions\n";
