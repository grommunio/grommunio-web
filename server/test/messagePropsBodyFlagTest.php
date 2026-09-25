<?php

/*
 * SPDX-FileCopyrightText: Copyright 2020 - 2026 grommunio GmbH
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

// isHTML describes the body. A caller that asks for no body must not be told the
// item is plain text, or an opened record on the client loses its html body.
if (extension_loaded('mapi')) {
	echo "Message property body flag checks skipped with php-mapi loaded\n";

	return;
}

defined('BASE_PATH') || define('BASE_PATH', dirname(__DIR__, 2) . '/');
$sources = '';
foreach (['class.operations.php', 'class.conversion.php'] as $file) {
	$sources .= file_get_contents(dirname(__DIR__) . '/includes/core/' . $file);
}
preg_match_all('/\b(PR_[A-Z0-9_]+|PT_[A-Z0-9_]+|MAPI_[A-Z0-9_]+|ATTACH_[A-Z0-9_]+|IID_[A-Za-z]+|OPEN_[A-Z0-9_]+)\b/', $sources, $matches);
foreach (array_values(array_unique($matches[1])) as $index => $name) {
	defined($name) || define($name, ($index + 1) << 16);
}

// Values the conversion arithmetic needs to behave like the real ones.
defined('MVI_FLAG') || define('MVI_FLAG', 0x2000);
defined('PT_UNICODE') || define('PT_UNICODE', 0x1F);
defined('PT_STRING8') || define('PT_STRING8', 0x1E);

function mapi_prop_type($property) {
	return PT_STRING8;
}

if (!class_exists('MAPIException')) {
	class MAPIException extends Exception {
		public function setHandled() {}
	}
}

$GLOBALS['bodyFlagProps'] = [];

function mapi_getprops($object, $tags = null) {
	return $GLOBALS['bodyFlagProps'];
}
function mapi_message_getprops($object, $tags = null) {
	return $GLOBALS['bodyFlagProps'];
}
function mapi_message_openproperty($message, $tag) {
	return $GLOBALS['bodyFlagProps'][$tag] ?? '';
}
function mapi_openproperty($object, $tag) {
	return $GLOBALS['bodyFlagProps'][$tag] ?? '';
}
function mapi_ab_openentry($book, $entryid) {
	return false;
}
function propIsError($property, $props) {
	return false;
}
function readMapiProp($object, $tag, $props) {
	return $props[$tag] ?? null;
}
function mapi_message_getrecipienttable($message) {
	return 'recipients';
}
function mapi_message_getattachmenttable($message) {
	return 'attachments';
}
function mapi_table_queryallrows($table, $properties = null, $restriction = null) {
	return [];
}
function mapi_table_setcolumns($table, $properties) {
	return true;
}
function mapi_folder_getcontentstable($folder) {
	return 'contents';
}
function mapi_last_hresult() {
	return 0;
}

require_once dirname(__DIR__) . '/includes/core/class.conversion.php';
require_once dirname(__DIR__) . '/includes/core/class.operations.php';

$GLOBALS['mapisession'] = new class {
	public function getAddressbook($fresh = false) {
		return 'addressbook';
	}
};

$GLOBALS['properties'] = new class {
	public function getRecipientProperties() {
		return [];
	}
};

$operations = new Operations();

// A list notification asks for no body.
$GLOBALS['bodyFlagProps'] = [PR_SUBJECT => 'An appointment'];
$props = $operations->getMessageProps('store', 'message', ['subject' => PR_SUBJECT]);
if (array_key_exists('isHTML', $props['props'])) {
	throw new RuntimeException('A property set without a body still claimed a body format.');
}
if (($props['props']['subject'] ?? null) !== 'An appointment') {
	throw new RuntimeException('The requested properties did not come back.');
}

// An item open asks for the body, and then the flag belongs to it.
$GLOBALS['bodyFlagProps'] = [PR_SUBJECT => 'An appointment', PR_BODY => 'plain text'];
$props = $operations->getMessageProps('store', 'message', ['subject' => PR_SUBJECT], false, true);
if (!array_key_exists('isHTML', $props['props'])) {
	throw new RuntimeException('A property set with a body carries no body format.');
}
if ($props['props']['isHTML'] !== false) {
	throw new RuntimeException('A plain text body was reported as html.');
}

echo "Message property body flag checks passed\n";
