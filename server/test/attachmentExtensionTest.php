<?php

// Check that the extension handed to the client never carries the leading period
// PR_ATTACH_EXTENSION is stored with.
if (extension_loaded('mapi')) {
	echo "Attachment extension checks skipped with php-mapi loaded\n";

	return;
}

foreach (['PR_HASATTACH', 'PR_ATTACH_NUM', 'PR_ATTACH_SIZE', 'PR_ATTACH_LONG_FILENAME',
	'PR_ATTACH_FILENAME', 'PR_ATTACHMENT_HIDDEN', 'PR_DISPLAY_NAME', 'PR_ATTACH_METHOD',
	'PR_ATTACH_CONTENT_ID', 'PR_ATTACH_MIME_TAG', 'PR_ATTACHMENT_CONTACTPHOTO', 'PR_RECORD_KEY',
	'PR_EC_WA_ATTACHMENT_ID', 'PR_OBJECT_TYPE', 'PR_ATTACH_EXTENSION', 'PR_ATTACH_DATA_BIN',
	'PR_ATTACH_CONTENT_LOCATION', 'ATTACH_BY_VALUE', 'ATTACH_EMBEDDED_MSG', 'IID_IStream',
	'MAPI_CREATE', 'MAPI_MODIFY', 'BLOCK_SIZE'] as $value => $name) {
	defined($name) || define($name, $name === 'BLOCK_SIZE' ? 4096 : $value + 1);
}

require_once dirname(__DIR__) . '/includes/core/class.operations.php';

$GLOBALS['extensionRows'] = [];

function mapi_getprops($object, $properties = null) {
	return [PR_HASATTACH => true];
}

function mapi_message_getattachmenttable($message) {
	return 'attachment-table';
}

function mapi_table_queryallrows($table, $properties = null, $restriction = null) {
	return $GLOBALS['extensionRows'];
}

function row(array $extra) {
	return [
		PR_OBJECT_TYPE => 7,
		PR_ATTACH_NUM => 0,
		PR_ATTACH_METHOD => ATTACH_BY_VALUE,
		PR_ATTACH_SIZE => 128,
		PR_EC_WA_ATTACHMENT_ID => 'id',
		PR_ATTACHMENT_HIDDEN => false,
	] + $extra;
}

$operations = new Operations();

// gromox stores the extension with the period, as [MS-OXCMSG] prescribes.
$GLOBALS['extensionRows'] = [row([
	PR_ATTACH_LONG_FILENAME => 'Quartalsbericht.eml',
	PR_ATTACH_EXTENSION => '.eml',
])];
$info = $operations->getAttachmentsInfo('message');
if ($info[0]['props']['extension'] !== 'eml') {
	throw new RuntimeException('A stored extension kept its leading period: ' . var_export($info[0]['props']['extension'], true));
}

// Attachments uploaded through the web app store it without the period.
$GLOBALS['extensionRows'] = [row([
	PR_ATTACH_LONG_FILENAME => 'contact.vcf',
	PR_ATTACH_EXTENSION => 'vcf',
])];
$info = $operations->getAttachmentsInfo('message');
if ($info[0]['props']['extension'] !== 'vcf') {
	throw new RuntimeException('An extension without a period was not passed through.');
}

// Without the property at all the name still has to answer for it.
$GLOBALS['extensionRows'] = [row([PR_ATTACH_LONG_FILENAME => 'event.ics'])];
$info = $operations->getAttachmentsInfo('message');
if ($info[0]['props']['extension'] !== 'ics') {
	throw new RuntimeException('An attachment without the extension property lost its extension.');
}

// A name without an extension must not turn into a period.
$GLOBALS['extensionRows'] = [row([PR_ATTACH_LONG_FILENAME => 'scan'])];
$info = $operations->getAttachmentsInfo('message');
if ($info[0]['props']['extension'] !== '') {
	throw new RuntimeException('An attachment without an extension reported one.');
}

echo "Attachment extension checks passed\n";
