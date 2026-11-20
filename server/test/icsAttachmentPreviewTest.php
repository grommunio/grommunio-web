<?php

/*
 * SPDX-FileCopyrightText: Copyright 2026 grommunio GmbH
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

if (function_exists('mapi_logon_zarafa')) {
	echo "Ics attachment preview checks skipped with php-mapi loaded\n";

	return;
}

define('BASE_PATH', dirname(__DIR__, 2) . '/');
define('BLOCK_SIZE', 4096);

foreach ([
	'PR_ATTACH_METHOD' => 0x37050003,
	'PR_ATTACH_MIME_TAG' => 0x370E001E,
	'PR_ATTACH_LONG_FILENAME' => 0x3707001E,
	'PR_ATTACH_FILENAME' => 0x3704001E,
	'PR_ATTACH_DATA_BIN' => 0x37010102,
	'PR_IPM_DRAFTS_ENTRYID' => 0x36D70102,
	'PR_IPM_APPOINTMENT_ENTRYID' => 0x36D00102,
	'PR_MESSAGE_CLASS' => 0x001A001E,
	'ATTACH_BY_VALUE' => 1,
	'ATTACH_EMBEDDED_MSG' => 5,
] as $name => $value) {
	defined($name) || define($name, $value);
}

if (!class_exists('BaseException')) {
	class BaseException extends Exception {}
}

if (!class_exists('MAPIException')) {
	class MAPIException extends Exception {
		public function setHandled() {}
	}
}

$GLOBALS['icsAttachProps'] = [];
$GLOBALS['icsData'] = '';
$GLOBALS['icsCalendarEntryid'] = 'calendar';
$GLOBALS['icsEvents'] = [];
$GLOBALS['icsConvertFolders'] = [];
$GLOBALS['icsMessageClass'] = [];
$GLOBALS['icsSetProps'] = [];
$GLOBALS['icsSaveCalls'] = 0;

// Wrapped so the declarations are not hoisted past the php-mapi check above.
if (!function_exists('mapi_attach_getprops')) {
	function mapi_attach_getprops($attachment, $properties = null) {
		return $GLOBALS['icsAttachProps'];
	}

	function mapi_attach_openobj($attachment) {
		return 'embedded-message';
	}

	function readMapiPropStream($object, $proptag) {
		return $GLOBALS['icsData'];
	}

	function mapi_getprops($object, $properties = null) {
		if ($object === 'root') {
			return [PR_IPM_APPOINTMENT_ENTRYID => $GLOBALS['icsCalendarEntryid']];
		}

		return [PR_MESSAGE_CLASS => $GLOBALS['icsMessageClass'][$object] ?? 'IPM.Appointment'];
	}

	function mapi_setprops($object, $props) {
		$GLOBALS['icsSetProps'][$object] = $props;
	}

	function mapi_msgstore_openentry($store, $entryid = null) {
		return $entryid === null ? 'root' : $entryid . '-folder';
	}

	function mapi_icaltomapi2($addrbook, $folder, $ics) {
		$GLOBALS['icsConvertFolders'][] = $folder;

		return $GLOBALS['icsEvents'];
	}

	function mapi_savechanges($object) {
		++$GLOBALS['icsSaveCalls'];
	}

	function mapi_message_savechanges($object) {
		++$GLOBALS['icsSaveCalls'];
	}
}

class TestMapiSession {
	public function getDefaultMessageStore() {
		return 'store';
	}

	public function getAddressbook() {
		return 'addressbook';
	}
}

$GLOBALS['mapisession'] = new TestMapiSession();

require_once dirname(__DIR__) . '/includes/util.php';

$ics = "BEGIN:VCALENDAR\r\nVERSION:2.0\r\nBEGIN:VEVENT\r\nSUMMARY:Webinar\r\nEND:VEVENT\r\nEND:VCALENDAR\r\n";

// --- isIcsAttachment -------------------------------------------------------

foreach ([
	'mime tag' => [PR_ATTACH_MIME_TAG => 'text/calendar'],
	'mime tag in mixed case' => [PR_ATTACH_MIME_TAG => 'Text/Calendar'],
	'.ics name' => [PR_ATTACH_LONG_FILENAME => 'invite.ics'],
	'uppercase extension' => [PR_ATTACH_LONG_FILENAME => 'INVITE.ICS'],
	'.vcs name' => [PR_ATTACH_FILENAME => 'termin.vcs'],
] as $label => $props) {
	if (!isIcsAttachment($props)) {
		throw new RuntimeException(sprintf('A calendar file identified by its %s was not recognized.', $label));
	}
}
foreach ([
	'a PDF' => [PR_ATTACH_MIME_TAG => 'application/pdf', PR_ATTACH_LONG_FILENAME => 'report.pdf'],
	'a mail' => [PR_ATTACH_LONG_FILENAME => 'forward.eml'],
	'a name that merely contains ics' => [PR_ATTACH_LONG_FILENAME => 'physics.txt'],
	'no properties at all' => [],
] as $label => $props) {
	if (isIcsAttachment($props)) {
		throw new RuntimeException(sprintf('%s was mistaken for a calendar file.', ucfirst($label)));
	}
}

// --- openAttachedMessage ---------------------------------------------------

$GLOBALS['icsData'] = $ics;
$GLOBALS['icsEvents'] = ['event-1', 'event-2'];
$GLOBALS['icsAttachProps'] = [PR_ATTACH_METHOD => ATTACH_BY_VALUE, PR_ATTACH_LONG_FILENAME => 'webinar.ics'];
if (openAttachedMessage('attachment') !== 'event-1') {
	throw new RuntimeException('An .ics attachment did not open as its first event.');
}
if ($GLOBALS['icsConvertFolders'] !== ['calendar-folder']) {
	throw new RuntimeException('The calendar file was not converted in the user\'s calendar.');
}
if ($GLOBALS['icsSaveCalls'] !== 0) {
	throw new RuntimeException('The converted event was saved, which would file it without the user.');
}
if (!empty($GLOBALS['icsSetProps'])) {
	throw new RuntimeException('A plain event had its message class changed.');
}

$GLOBALS['icsMessageClass'] = ['event-1' => 'IPM.Schedule.Meeting.Request'];
openAttachedMessage('attachment');
if (($GLOBALS['icsSetProps']['event-1'][PR_MESSAGE_CLASS] ?? null) !== 'IPM.Appointment') {
	throw new RuntimeException('An invitation did not open as a calendar item.');
}
$GLOBALS['icsMessageClass'] = [];

// --- convertIcsToMessage ---------------------------------------------------

$GLOBALS['icsConvertFolders'] = [];
if (convertIcsToMessage('') !== false || convertIcsToMessage("BEGIN:VCARD\r\nEND:VCARD\r\n") !== false) {
	throw new RuntimeException('A file that is no calendar was converted.');
}
if ($GLOBALS['icsConvertFolders'] !== []) {
	throw new RuntimeException('A file that is no calendar reached the converter.');
}

$GLOBALS['icsEvents'] = [];
if (convertIcsToMessage($ics) !== false) {
	throw new RuntimeException('A calendar without events did not return false.');
}

$GLOBALS['icsEvents'] = ['event-1'];
convertIcsToMessage($ics, 'shared-folder');
if (end($GLOBALS['icsConvertFolders']) !== 'shared-folder') {
	throw new RuntimeException('The event was not created in the folder asked for.');
}

$GLOBALS['icsCalendarEntryid'] = '';
if (convertIcsToMessage($ics) !== false) {
	throw new RuntimeException('A mailbox without a calendar did not stop the conversion.');
}

echo "Ics attachment preview checks passed\n";
