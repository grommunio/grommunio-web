<?php

// Exercise the normal attachment upload path without a mailbox or php-mapi.
if (extension_loaded('mapi')) {
	echo "Inline attachment upload checks skipped with php-mapi loaded\n";

	return;
}

foreach (['PR_ATTACH_CONTENT_ID', 'PR_ATTACHMENT_HIDDEN', 'PR_ATTACH_LONG_FILENAME',
	'PR_DISPLAY_NAME', 'PR_ATTACH_METHOD', 'PR_ATTACH_DATA_BIN', 'PR_ATTACH_MIME_TAG',
	'PR_EC_WA_ATTACHMENT_ID', 'PR_ATTACH_EXTENSION', 'ATTACH_BY_VALUE', 'IID_IStream',
	'MAPI_CREATE', 'MAPI_MODIFY', 'BLOCK_SIZE'] as $value => $name) {
	defined($name) || define($name, $name === 'BLOCK_SIZE' ? 4096 : $value + 1);
}

require_once dirname(__DIR__) . '/includes/core/class.operations.php';

$GLOBALS['inlineOpened'] = [];
$GLOBALS['inlineDeleted'] = [];
$GLOBALS['inlineCreated'] = [];
$GLOBALS['inlineProperties'] = [];
$GLOBALS['inlineBytes'] = [];

function mapi_message_openattach($message, $number) {
	if (!is_int($number) || $number < 0) {
		throw new RuntimeException('A temporary upload identifier reached mapi_message_openattach');
	}
	$GLOBALS['inlineOpened'][] = $number;

	return 'saved-' . $number;
}

function mapi_message_deleteattach($message, $number) {
	$GLOBALS['inlineDeleted'][] = $number;

	return true;
}

function mapi_message_createattach($message) {
	$id = 'created-' . count($GLOBALS['inlineCreated']);
	$GLOBALS['inlineCreated'][] = $id;

	return $id;
}

function mapi_setprops($attachment, $props) {
	$GLOBALS['inlineProperties'][$attachment] = ($GLOBALS['inlineProperties'][$attachment] ?? []) + $props;

	return true;
}

function mapi_savechanges($object) { return true; }
function mapi_openproperty($attachment, $property, $iid, $interface, $flags) { return $attachment; }
function mapi_stream_commit($stream) { return true; }
function mapi_stream_write($stream, $bytes) {
	$GLOBALS['inlineBytes'][$stream] = ($GLOBALS['inlineBytes'][$stream] ?? '') . $bytes;

	return strlen($bytes);
}

class InlineUploadState {
	public $files = [];
	public $paths = [];
	public $cleared = false;

	public function getDeletedAttachments($dialog) { return []; }
	public function getAttachmentFiles($dialog) { return $this->files; }
	public function getAttachmentPath($name) { return $this->paths[$name]; }
	public function clearAttachmentFiles($dialog) { $this->cleared = true; }

	public function add($name, $mime, $bytes) {
		$path = tempnam(sys_get_temp_dir(), 'pgp-inline-test-');
		file_put_contents($path, $bytes);
		$this->paths[$name] = $path;
		$this->files[$name] = ['sourcetype' => 'upload', 'name' => $name, 'type' => $mime];
	}
}

$checks = 0;
function inlineCheck($condition, $label) {
	if (!$condition) {
		throw new RuntimeException($label);
	}
	++$GLOBALS['checks'];
}

$state = new InlineUploadState();
$state->add('cache-picture', 'image/png', "\x89PNG\r\n\x00\xff");
$state->add('legacy-cache', 'image/jpeg', "\xff\xd8\x00\xfe");
$state->add('ordinary-file', 'application/octet-stream', "binary\x00\xff\r\n");
$state->add('pkcs7-file', 'application/pkcs7-mime', 'uploaded-p7m');

try {
	(new Operations())->setAttachments('message', [
		'dialog_attachments' => 'inline-dialog',
		'add' => [
			['inline' => true, 'attach_num' => -1, 'tmpname' => 'cache-picture', 'cid' => 'picture@browser'],
			['inline' => true, 'attach_num' => 'legacy-cache', 'cid' => 'legacy@browser'],
			['inline' => true, 'attach_num' => '7', 'cid' => 'saved@browser'],
			['inline' => false, 'attach_num' => -1, 'tmpname' => 'ordinary-file', 'cid' => 'ignored'],
			['inline' => true, 'attach_num' => -1],
			null,
		],
		'remove' => [
			['inline' => true, 'attach_num' => -1, 'tmpname' => 'already-deleted-upload'],
			['inline' => true, 'attach_num' => 'temporary-deleted-upload'],
			['inline' => true, 'attach_num' => '9'],
			null,
		],
	], $state);
	inlineCheck($GLOBALS['inlineOpened'] === [7, 9], 'Only saved numeric attachments may be opened');
	inlineCheck($GLOBALS['inlineDeleted'] === [9], 'Only the saved inline removal is sent to MAPI');
	inlineCheck($GLOBALS['inlineProperties']['saved-7'][PR_ATTACH_CONTENT_ID] === 'saved@browser', 'Saved attachment CID update preserved');
	inlineCheck($GLOBALS['inlineProperties']['saved-7'][PR_ATTACHMENT_HIDDEN] === true, 'Saved inline attachment hidden flag preserved');
	inlineCheck(count($GLOBALS['inlineCreated']) === 4, 'All ordinary uploaded attachments imported');
	inlineCheck($GLOBALS['inlineProperties']['created-0'][PR_ATTACH_CONTENT_ID] === 'picture@browser', 'Temporary upload CID mapped by tmpname');
	inlineCheck($GLOBALS['inlineProperties']['created-0'][PR_ATTACHMENT_HIDDEN] === true, 'Temporary inline upload hidden flag set');
	inlineCheck($GLOBALS['inlineBytes']['created-0'] === "\x89PNG\r\n\x00\xff", 'Temporary inline upload binary bytes unchanged');
	inlineCheck($GLOBALS['inlineProperties']['created-1'][PR_ATTACH_CONTENT_ID] === 'legacy@browser', 'Legacy temporary-string attachment number remains supported');
	inlineCheck(!isset($GLOBALS['inlineProperties']['created-2'][PR_ATTACH_CONTENT_ID]), 'Ordinary attachment receives no CID');
	inlineCheck($GLOBALS['inlineProperties']['created-2'][PR_ATTACHMENT_HIDDEN] === false, 'Ordinary attachment stays visible');
	inlineCheck($GLOBALS['inlineBytes']['created-2'] === "binary\x00\xff\r\n", 'Ordinary binary upload bytes unchanged');
	inlineCheck($GLOBALS['inlineProperties']['created-3'][PR_ATTACH_MIME_TAG] === 'application/octet-stream', 'Manual PKCS7 attachment safety behavior unchanged');
	inlineCheck($state->cleared, 'Uploaded attachment state cleared after saving');
	inlineCheck(!array_filter($state->paths, 'file_exists'), 'Only consumed test upload files were removed');
	echo "OK: {$checks} inline attachment upload assertions\n";
}
finally {
	foreach ($state->paths as $path) {
		if (is_file($path)) {
			unlink($path);
		}
	}
}
