<?php

/*
 * SPDX-FileCopyrightText: Copyright 2020 - 2026 grommunio GmbH
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

if (function_exists('mapi_attach_openobj')) {
	echo "Embedded message download checks skipped with php-mapi loaded\n";

	return;
}

// declared conditionally so they are not hoisted ahead of the guard
if (!class_exists('BaseException')) {
	class BaseException extends Exception {
		public function getFileLine() {
			return basename($this->getFile()) . ':' . $this->getLine();
		}

		public function getDisplayMessage() {
			return $this->getMessage();
		}
	}
}

foreach (['STRING_REGEX', 'PR_ATTACH_FILENAME', 'PR_ATTACH_LONG_FILENAME', 'PR_ATTACH_MIME_TAG', 'PR_DISPLAY_NAME',
	'PR_ATTACH_METHOD', 'PR_ATTACH_CONTENT_ID', 'PR_ATTACH_DATA_BIN', 'PR_ATTACH_NUM', 'PR_ATTACHMENT_HIDDEN', 'IID_IStream',
	'ERROR_MAPI', 'ERROR_GROMMUNIO', 'ERROR_GENERAL'] as $value => $name) {
	defined($name) || define($name, $value + 100);
}
defined('ATTACH_BY_VALUE') || define('ATTACH_BY_VALUE', 1);
defined('ATTACH_EMBEDDED_MSG') || define('ATTACH_EMBEDDED_MSG', 5);
defined('BLOCK_SIZE') || define('BLOCK_SIZE', 4);
defined('MAPI_E_NOT_FOUND') || define('MAPI_E_NOT_FOUND', 0x8004010F);

const EML = "From: a@example.com\r\nSubject: Inner\r\n\r\nbody\r\n";

if (!function_exists('mapi_attach_openobj')) {
	function mapi_attach_getprops($attachment, $props) {
		return $GLOBALS['attachments'][$attachment];
	}

	function mapi_attach_openobj($attachment) {
		return "message-of-{$attachment}";
	}

	function mapi_inetmapi_imtoinet($session, $ab, $message, $flags) {
		return (object) ['data' => EML, 'pos' => 0];
	}

	function mapi_openproperty($attachment, $prop, $iid, $a, $b) {
		return (object) ['data' => $GLOBALS['attachments'][$attachment]['data'] ?? '', 'pos' => 0];
	}

	function mapi_stream_stat($stream) {
		return ['cb' => strlen($stream->data)];
	}

	function mapi_stream_read($stream, $size) {
		$chunk = substr($stream->data, $stream->pos, $size);
		$stream->pos += $size;

		return $chunk;
	}

	function mapi_message_getattachmenttable($message) {
		return 'table';
	}

	function mapi_table_queryallrows($table, $props) {
		return array_map(fn ($num) => [PR_ATTACH_NUM => $num] + array_intersect_key($GLOBALS['attachments'][$num], [PR_ATTACH_METHOD => 1, PR_ATTACHMENT_HIDDEN => 1]), array_keys($GLOBALS['attachments']));
	}

	function mapi_message_openattach($message, $num) {
		return $num;
	}

	function normalizeHTTPContentType($type) {
		return $type;
	}

	function getDownloadContentDisposition($requested, $type) {
		return 'attachment';
	}

	function sendDownloadSecurityHeaders() {}

	function browserDependingHTTPHeaderEncode($name) {
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
$GLOBALS['attachments'] = [
	0 => [PR_ATTACH_METHOD => ATTACH_EMBEDDED_MSG, PR_ATTACH_MIME_TAG => 'message/rfc822', PR_DISPLAY_NAME => '../Inner/forwarded message'],
	1 => [PR_ATTACH_METHOD => ATTACH_BY_VALUE, PR_ATTACH_LONG_FILENAME => 'notes.txt', 'data' => 'plain text'],
	// a recurrence exception
	2 => [PR_ATTACH_METHOD => ATTACH_EMBEDDED_MSG, PR_ATTACHMENT_HIDDEN => true, PR_DISPLAY_NAME => 'Exception'],
];
$_SERVER['REQUEST_METHOD'] = 'GET';

$_GET = [];
ob_start();
require_once dirname(__DIR__) . '/includes/download_attachment.php';
ob_end_clean();

$download = new DownloadAttachment();

ob_start();
$download->downloadSavedAttachment(0);
$body = ob_get_clean();
if ($body !== EML) {
	throw new RuntimeException('An embedded message was not downloaded as a mail: ' . json_encode($body));
}

$zip = new class {
	public $files = [];

	public function addFromString($name, $data) {
		$this->files[$name] = $data;
	}
};
$state = new class {
	public function isInlineAttachment($attachment) {
		return false;
	}

	public function isContactPhoto($attachment) {
		return false;
	}

	public function getAttachmentFiles($id) {
		return [];
	}
};
(new ReflectionProperty(DownloadBase::class, 'message'))->setValue($download, 'message');
$download->addAttachmentsToZipArchive($state, $zip);
if ($zip->files !== ['.._Inner_forwarded message.eml' => EML, 'notes.txt' => 'plain text']) {
	throw new RuntimeException('The archive did not carry the embedded message as a mail: ' . json_encode($zip->files));
}

echo "Embedded message download checks passed\n";
