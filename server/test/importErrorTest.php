<?php

/*
 * SPDX-FileCopyrightText: Copyright 2020 - 2026 grommunio GmbH
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

if (function_exists('mapi_getprops')) {
	echo "Import error check skipped with php-mapi loaded\n";

	return;
}

// declared conditionally so they are not hoisted ahead of the guard
if (!class_exists('BaseException')) {
	class BaseException extends Exception {
		public $title;

		public function setTitle($title) {
			$this->title = $title;
		}
	}
}

if (!function_exists('_')) {
	function _($message) {
		return $message;
	}
}

if (!function_exists('mapi_getprops')) {
	function mapi_getprops($object, $props) {
		return [
			'private-folder' => [PR_DISPLAY_NAME => 'Calendar', PR_MDB_PROVIDER => 'private'],
			'public-folder' => [PR_DISPLAY_NAME => 'Events', PR_MDB_PROVIDER => 'public'],
			'delegate-folder' => [PR_DISPLAY_NAME => 'Kalender', PR_MDB_PROVIDER => 'delegate'],
			'public-store' => [PR_DISPLAY_NAME => 'Public Folders'],
			'delegate-store' => [PR_MAILBOX_OWNER_NAME => 'Jane Doe'],
		][$object];
	}
}

foreach (['PR_DISPLAY_NAME', 'PR_MDB_PROVIDER', 'PR_MAILBOX_OWNER_NAME', 'MAPI_E_TABLE_EMPTY', 'MAPI_E_CORRUPT_DATA', 'MAPI_E_INVALID_PARAMETER'] as $value => $name) {
	define($name, $value + 1);
}
define('ZARAFA_STORE_PUBLIC_GUID', 'public');
define('ZARAFA_STORE_DELEGATE_GUID', 'delegate');

$GLOBALS['mapisession'] = new class {
	public function getPublicMessageStore() {
		return 'public-store';
	}
};

require_once dirname(__DIR__) . '/includes/exceptions/class.ImportError.php';

$storeLookups = 0;
$otherStore = function () use (&$storeLookups) {
	++$storeLookups;

	return 'delegate-store';
};

$cases = [
	['private-folder', MAPI_E_TABLE_EMPTY, "Unable to import 'a.ics' to 'Calendar'. Nothing here."],
	['public-folder', MAPI_E_CORRUPT_DATA, "Unable to import 'a.ics' to 'Events - Public Folders'. The file is corrupt."],
	['delegate-folder', MAPI_E_INVALID_PARAMETER, "Unable to import 'a.ics' to 'Kalender - Jane Doe'. The file is invalid."],
	['delegate-folder', 99, "Unable to import 'a.ics'. conversion failed"],
];
foreach ($cases as [$folder, $code, $expected]) {
	$error = ImportError::fromException(new Exception('conversion failed', $code), 'a.ics', $folder, $otherStore, 'Nothing here.');
	if (!$error instanceof GrommunioException || $error->getMessage() !== $expected || $error->title !== 'Import error') {
		throw new RuntimeException("Import error for {$folder}/{$code} is: " . $error->getMessage());
	}
}
if ($storeLookups !== 2) {
	throw new RuntimeException('The delegate store was looked up for a folder outside of it.');
}

echo "Import error checks passed\n";
