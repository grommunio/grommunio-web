<?php

if (function_exists('mapi_msgstore_openentry')) {
	echo "Failed message-open check skipped with php-mapi loaded\n";

	return;
}

$GLOBALS['operationsOpenMessageGetPropsCalls'] = 0;
$GLOBALS['operationsOpenMessageParseSmimeCalls'] = 0;
$GLOBALS['operationsOpenMessageResult'] = false;
$GLOBALS['operationsOpenMessageClass'] = 'IPM.Note.SMIME.MultipartSigned';
$GLOBALS['operationsOpenAttachmentResult'] = false;
$GLOBALS['operationsOpenAttachmentObjectResult'] = false;
$GLOBALS['operationsOpenAttachmentCalls'] = 0;
defined('PR_MESSAGE_CLASS') || define('PR_MESSAGE_CLASS', 1);

if (!function_exists('mapi_msgstore_openentry')) {
	function mapi_msgstore_openentry($store, $entryid) {
		return $GLOBALS['operationsOpenMessageResult'];
	}

	function mapi_getprops($message, $properties = null) {
		++$GLOBALS['operationsOpenMessageGetPropsCalls'];

		return [PR_MESSAGE_CLASS => $GLOBALS['operationsOpenMessageClass']];
	}

	function parse_smime($store, $message) {
		++$GLOBALS['operationsOpenMessageParseSmimeCalls'];
	}

	function mapi_message_openattach($message, $attachNum) {
		++$GLOBALS['operationsOpenAttachmentCalls'];

		return $GLOBALS['operationsOpenAttachmentResult'];
	}

	function mapi_attach_openobj($attachment) {
		return $GLOBALS['operationsOpenAttachmentObjectResult'];
	}
}

require_once dirname(__DIR__) . '/includes/core/class.operations.php';

$operations = new Operations();
if ($operations->openMessage('store', 'entryid', false, true) !== false) {
	throw new RuntimeException('A failed MAPI message open did not return false.');
}
if ($GLOBALS['operationsOpenMessageGetPropsCalls'] !== 0 || $GLOBALS['operationsOpenMessageParseSmimeCalls'] !== 0) {
	throw new RuntimeException('A failed MAPI message open entered the S/MIME parsing path.');
}

$GLOBALS['operationsOpenMessageResult'] = 'message';
if ($operations->openMessage('store', 'entryid', false, true) !== 'message') {
	throw new RuntimeException('A successful MAPI message open did not return the message.');
}
if ($GLOBALS['operationsOpenMessageGetPropsCalls'] !== 1 || $GLOBALS['operationsOpenMessageParseSmimeCalls'] !== 1) {
	throw new RuntimeException('A successful S/MIME message open did not retain its parsing path.');
}

define('PLUGIN_PGP_ENABLE', true);
foreach (['IPM.Note.GpgOL.MultipartEncrypted', 'IPM.Note'] as $messageClass) {
	$GLOBALS['operationsOpenMessageClass'] = $messageClass;
	$before = $GLOBALS['operationsOpenMessageParseSmimeCalls'];
	$operations->openMessage('store', 'entryid', false, true);
	if ($GLOBALS['operationsOpenMessageParseSmimeCalls'] !== $before + 1) {
		throw new RuntimeException('OpenPGP decoding was skipped for ' . $messageClass);
	}
}

$GLOBALS['operationsOpenAttachmentResult'] = 'attachment';
if ($operations->openMessage('store', 'entryid', [1]) !== false) {
	throw new RuntimeException('A failed embedded-message open did not return false.');
}

$GLOBALS['operationsOpenAttachmentObjectResult'] = 'embedded-message';
if ($operations->openMessage('store', 'entryid', [1]) !== 'embedded-message') {
	throw new RuntimeException('A successful embedded-message open did not return the nested message.');
}

$GLOBALS['operationsOpenAttachmentObjectResult'] = false;
if ($operations->openMessage('store', 'entryid', [1, 2]) !== false) {
	throw new RuntimeException('A failed intermediate embedded-message open did not stop traversal.');
}
if ($GLOBALS['operationsOpenAttachmentCalls'] !== 3) {
	throw new RuntimeException('Attachment traversal continued after a failed embedded-message open.');
}

echo "Failed message-open checks passed\n";
