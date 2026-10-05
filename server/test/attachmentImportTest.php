<?php

/*
 * SPDX-FileCopyrightText: Copyright 2020 - 2026 grommunio GmbH
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

if (function_exists('mapi_folder_createmessage')) {
	echo "Attachment import checks skipped with php-mapi loaded\n";

	return;
}

// declared conditionally so they are not hoisted ahead of the guard
if (!class_exists('BaseException')) {
	class BaseException extends Exception {
		public $title;

		public function getFileLine() {
			return basename($this->getFile()) . ':' . $this->getLine();
		}

		public function getDisplayMessage() {
			return $this->getMessage();
		}

		public function setTitle($title) {
			$this->title = $title;
		}

		public function getTitle() {
			return $this->title;
		}
	}
}

foreach (['STRING_REGEX', 'PR_ATTACH_LONG_FILENAME', 'PR_ATTACH_DATA_BIN', 'PR_MESSAGE_CLASS', 'PR_ENTRYID', 'PR_PARENT_ENTRYID',
	'PR_CONTENT_UNREAD', 'PR_DISPLAY_NAME', 'PR_MDB_PROVIDER', 'ERROR_MAPI', 'ERROR_GROMMUNIO', 'ERROR_GENERAL'] as $value => $name) {
	defined($name) || define($name, $value + 1);
}
defined('MAPI_E_NOT_FOUND') || define('MAPI_E_NOT_FOUND', 0x8004010F);
defined('MAPI_E_TABLE_EMPTY') || define('MAPI_E_TABLE_EMPTY', 0x80040402);
defined('MAPI_E_CORRUPT_DATA') || define('MAPI_E_CORRUPT_DATA', 0x8004011B);
defined('MAPI_E_INVALID_PARAMETER') || define('MAPI_E_INVALID_PARAMETER', 0x80070057);
defined('MAPI_E_CALL_FAILED') || define('MAPI_E_CALL_FAILED', 0x80004005);
defined('ENABLE_DIRECT_BOOKING') || define('ENABLE_DIRECT_BOOKING', true);
defined('ZARAFA_STORE_PUBLIC_GUID') || define('ZARAFA_STORE_PUBLIC_GUID', 'public');
defined('ZARAFA_STORE_DELEGATE_GUID') || define('ZARAFA_STORE_DELEGATE_GUID', 'delegate');

if (!function_exists('mapi_folder_createmessage')) {
	class Meetingrequest {
		public function __construct($store, $message) {
			$GLOBALS['accepted'][] = $message->props[PR_MESSAGE_CLASS];
		}

		public function doAccept() {}
	}

	class FakeMessage {
		public $props = [];
		public $saved = false;

		public function __construct($props = []) {
			$this->props = $props;
		}
	}

	function mapi_folder_createmessage($folder) {
		return $GLOBALS['created'][] = new FakeMessage();
	}

	function mapi_attach_getprops($attachment, $props) {
		return [PR_ATTACH_LONG_FILENAME => $GLOBALS['filename']];
	}

	function readMapiPropStream($object, $prop) {
		return $GLOBALS['data'];
	}

	function isBrokenEml($eml) {
		return false;
	}

	function mapi_inetmapi_imtomapi($session, $store, $ab, $message, $eml, $flags) {
		$message->props[PR_MESSAGE_CLASS] = 'IPM.Note';

		return true;
	}

	function mapi_vcftomapi($session, $store, $message, $vcf) {
		$message->props[PR_MESSAGE_CLASS] = 'IPM.Contact';

		return true;
	}

	function mapi_icaltomapi2($ab, $folder, $ics) {
		if (stripos($ics, 'VCALENDAR') === false) {
			throw new Exception('The operation failed for an unspecified reason', MAPI_E_CALL_FAILED);
		}

		return array_map(fn ($class) => $GLOBALS['created'][] = new FakeMessage([PR_MESSAGE_CLASS => $class]), $GLOBALS['icsClasses']);
	}

	function mapi_savechanges($message) {
		if ($message instanceof FakeMessage) {
			$message->saved = true;
		}

		return true;
	}

	function mapi_getprops($object, $props) {
		if ($object instanceof FakeMessage) {
			return $object->props;
		}

		return [PR_ENTRYID => 's', PR_PARENT_ENTRYID => 'p', PR_CONTENT_UNREAD => 0, PR_DISPLAY_NAME => 'Calendar', PR_MDB_PROVIDER => 'private'];
	}

	function sanitizeGetValue($name, $default, $regex) {
		return $name;
	}
}

require_once dirname(__DIR__) . '/includes/exceptions/class.GrommunioErrorException.php';
require_once dirname(__DIR__) . '/includes/exceptions/class.GrommunioException.php';
require_once dirname(__DIR__) . '/includes/download_base.php';

$GLOBALS['mapisession'] = new class {
	public function getSession() {
		return 'session';
	}

	public function getAddressbook() {
		return 'addressbook';
	}
};

$_GET = [];
ob_start();
require_once dirname(__DIR__) . '/includes/download_attachment.php';
ob_end_clean();

class ImportAttachmentDownload extends DownloadAttachment {
	public function getAttachmentByAttachNum() {
		return 'attachment';
	}
}

function importAttachment($filename, $data = 'data') {
	$GLOBALS['filename'] = $filename;
	$GLOBALS['data'] = $data;
	$GLOBALS['created'] = [];
	$GLOBALS['accepted'] = [];
	$download = new ImportAttachmentDownload();
	foreach (['destinationFolder' => 'folder', 'store' => 'store'] as $name => $value) {
		(new ReflectionProperty(DownloadAttachment::class, $name))->setValue($download, $value);
	}
	ob_start();

	try {
		$download->importAttachment();
	}
	finally {
		$output = ob_get_clean();
	}

	return json_decode($output, true);
}

foreach (['card.vcf' => 'IPM.Contact', 'mail.eml' => 'IPM.Note'] as $filename => $class) {
	$response = importAttachment($filename);
	if (empty($response['success']) || $GLOBALS['accepted'] !== [] || !$GLOBALS['created'][0]->saved) {
		throw new RuntimeException("Importing {$filename} did not save a plain {$class}: " . json_encode($GLOBALS['accepted']));
	}
}

$GLOBALS['icsClasses'] = ['IPM.Schedule.Meeting.Request'];
importAttachment('invite.ics', "BEGIN:VCALENDAR\r\nEND:VCALENDAR\r\n");
if ($GLOBALS['accepted'] !== ['IPM.Schedule.Meeting.Request']) {
	throw new RuntimeException('An imported meeting request was not turned into an appointment.');
}

$GLOBALS['icsClasses'] = ['IPM.Appointment', 'IPM.Appointment'];
$response = importAttachment('events.ics', "BEGIN:VCALENDAR\r\nEND:VCALENDAR\r\n");
$saved = array_map(fn ($message) => $message->saved, $GLOBALS['created']);
if (empty($response['success']) || $saved !== [true, true] || $GLOBALS['accepted'] !== []) {
	throw new RuntimeException('A calendar file with two events was not imported as two appointments: ' . json_encode($saved));
}

$GLOBALS['icsClasses'] = ['IPM.Appointment'];
$response = importAttachment('lower.ics', "begin:vcalendar\r\nend:vcalendar\r\n");
if (empty($response['success'])) {
	throw new RuntimeException('A calendar file with lowercase names was not imported.');
}

$GLOBALS['icsClasses'] = [];
try {
	importAttachment('none.ics', "BEGIN:VCALENDAR\r\nEND:VCALENDAR\r\n");

	throw new LogicException('A calendar file without events was reported as imported.');
}
catch (GrommunioException $e) {
}

foreach (['', 'garbage'] as $data) {
	try {
		importAttachment('empty.ics', $data);

		throw new LogicException('An invalid calendar file was reported as imported.');
	}
	catch (GrommunioException $e) {
		if (!str_ends_with($e->getMessage(), 'The file is invalid.') || $GLOBALS['created'] !== []) {
			throw new RuntimeException('An invalid calendar file was not reported as invalid: ' . $e->getMessage());
		}
	}
}

echo "Attachment import checks passed\n";
