<?php

if (function_exists('mapi_logon_zarafa')) {
	echo "Eml attachment preview checks skipped with php-mapi loaded\n";

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
	'ATTACH_BY_VALUE' => 1,
	'ATTACH_EMBEDDED_MSG' => 5,
	'STREAM_SEEK_SET' => 0,
	'IID_IStream' => 'IID_IStream',
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

if (!function_exists('_')) {
	function _($message) {
		return $message;
	}
}

$GLOBALS['emlAttachProps'] = [];
$GLOBALS['emlStreamData'] = '';
$GLOBALS['emlStreamCalls'] = 0;
$GLOBALS['emlConvertCalls'] = 0;
$GLOBALS['emlConvertResult'] = true;
$GLOBALS['emlDraftsEntryid'] = 'drafts';
$GLOBALS['emlSaveCalls'] = 0;

// Wrapped so the declarations are not hoisted past the php-mapi check above.
if (!function_exists('mapi_attach_getprops')) {
	function mapi_attach_getprops($attachment, $properties = null) {
		return $GLOBALS['emlAttachProps'];
	}

	function mapi_attach_openobj($attachment) {
		return 'embedded-message';
	}

	function mapi_openproperty($object, $proptag, $iid = null, $flags = 0, $extra = 0) {
		++$GLOBALS['emlStreamCalls'];

		return 'stream';
	}

	function mapi_stream_stat($stream) {
		return ['cb' => strlen((string) $GLOBALS['emlStreamData'])];
	}

	function mapi_stream_seek($stream, $offset, $origin) {}

	function mapi_stream_read($stream, $size) {
		static $offset = 0;

		if ($offset >= strlen((string) $GLOBALS['emlStreamData'])) {
			$offset = 0;

			return '';
		}
		$chunk = substr((string) $GLOBALS['emlStreamData'], $offset, $size);
		$offset += strlen($chunk);

		return $chunk;
	}

	function mapi_getprops($object, $properties = null) {
		return [PR_IPM_DRAFTS_ENTRYID => $GLOBALS['emlDraftsEntryid']];
	}

	function mapi_msgstore_openentry($store, $entryid = null) {
		return 'drafts-folder';
	}

	function mapi_folder_createmessage($folder) {
		return 'scratch-message';
	}

	function mapi_message_savechanges($message) {
		++$GLOBALS['emlSaveCalls'];
	}

	function mapi_inetmapi_imtomapi($session, $store, $addrbook, $message, $eml, $options) {
		++$GLOBALS['emlConvertCalls'];

		return $GLOBALS['emlConvertResult'];
	}
}

class TestMapiSession {
	public function getDefaultMessageStore() {
		return 'store';
	}

	public function getSession() {
		return 'session';
	}

	public function getAddressbook() {
		return 'addressbook';
	}
}

$GLOBALS['mapisession'] = new TestMapiSession();

require_once dirname(__DIR__) . '/includes/util.php';

// --- isEmlAttachment -------------------------------------------------------

$recognized = [
	'mime tag' => [PR_ATTACH_MIME_TAG => 'message/rfc822'],
	'mime tag in mixed case' => [PR_ATTACH_MIME_TAG => 'Message/RFC822'],
	'long filename' => [PR_ATTACH_LONG_FILENAME => 'Quartalsbericht.eml'],
	'uppercase extension' => [PR_ATTACH_LONG_FILENAME => 'FORWARD.EML'],
	'short filename' => [PR_ATTACH_FILENAME => 'note.eml'],
];
foreach ($recognized as $label => $props) {
	if (!isEmlAttachment($props)) {
		throw new RuntimeException(sprintf('An attachment identified by its %s was not recognized as a mail.', $label));
	}
}

$rejected = [
	'a PDF' => [PR_ATTACH_MIME_TAG => 'application/pdf', PR_ATTACH_LONG_FILENAME => 'report.pdf'],
	'an unnamed binary' => [PR_ATTACH_MIME_TAG => 'application/octet-stream'],
	'a name that merely contains eml' => [PR_ATTACH_LONG_FILENAME => 'emlaeufe.txt'],
	'no properties at all' => [],
];
foreach ($rejected as $label => $props) {
	if (isEmlAttachment($props)) {
		throw new RuntimeException(sprintf('%s was mistaken for a mail attachment.', ucfirst($label)));
	}
}

// --- openAttachedMessage ---------------------------------------------------

$GLOBALS['emlAttachProps'] = [PR_ATTACH_METHOD => ATTACH_EMBEDDED_MSG];
if (openAttachedMessage('attachment') !== 'embedded-message') {
	throw new RuntimeException('An embedded message was no longer opened directly.');
}
if ($GLOBALS['emlStreamCalls'] !== 0) {
	throw new RuntimeException('An embedded message was read as a file.');
}

$GLOBALS['emlAttachProps'] = [PR_ATTACH_METHOD => ATTACH_BY_VALUE, PR_ATTACH_LONG_FILENAME => 'report.pdf'];
if (openAttachedMessage('attachment') !== false) {
	throw new RuntimeException('A file attachment that is not a mail was opened as a message.');
}
if ($GLOBALS['emlStreamCalls'] !== 0) {
	throw new RuntimeException('A file attachment that is not a mail was read anyway.');
}

$GLOBALS['emlStreamData'] = "From: alice@example.org\r\nDate: Wed, 09 Sep 2026 09:14:22 +0200\r\n\r\nHallo\r\n";
$GLOBALS['emlAttachProps'] = [PR_ATTACH_METHOD => ATTACH_BY_VALUE, PR_ATTACH_LONG_FILENAME => 'Quartalsbericht.eml'];
if (openAttachedMessage('attachment') !== 'scratch-message') {
	throw new RuntimeException('An .eml attachment was not converted into a message.');
}
if ($GLOBALS['emlConvertCalls'] !== 1) {
	throw new RuntimeException('An .eml attachment did not reach the RFC822 conversion.');
}
if ($GLOBALS['emlSaveCalls'] !== 0) {
	throw new RuntimeException('The converted mail was saved, which would leave a copy behind.');
}

// --- convertEmlToMessage ---------------------------------------------------

$before = $GLOBALS['emlConvertCalls'];
if (convertEmlToMessage('') !== false) {
	throw new RuntimeException('An empty attachment was handed to the converter.');
}
if (convertEmlToMessage("Subject: no headers that matter\r\n\r\nbody\r\n") !== false) {
	throw new RuntimeException('A mail without From and Date headers was handed to the converter.');
}
if ($GLOBALS['emlConvertCalls'] !== $before) {
	throw new RuntimeException('A corrupt mail still reached the RFC822 conversion.');
}

$GLOBALS['emlConvertResult'] = false;
if (convertEmlToMessage($GLOBALS['emlStreamData']) !== false) {
	throw new RuntimeException('A failed conversion did not return false.');
}
$GLOBALS['emlConvertResult'] = true;

$GLOBALS['emlDraftsEntryid'] = '';
if (convertEmlToMessage($GLOBALS['emlStreamData']) !== false) {
	throw new RuntimeException('A mailbox without a drafts folder did not stop the conversion.');
}

echo "Eml attachment preview checks passed\n";
