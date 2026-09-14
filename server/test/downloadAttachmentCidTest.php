<?php

if (function_exists('mapi_message_getattachmenttable')) {
	echo "Attachment CID lookup check skipped with php-mapi loaded\n";

	return;
}

if (!class_exists('BaseException')) {
	class BaseException extends Exception {
		public $displayMessage;

		public function __construct($message = '', $code = 0, $previous = null, $displayMessage = null) {
			parent::__construct($message, $code, $previous);
			$this->displayMessage = $displayMessage;
		}

		public function getFileLine() {
			return basename($this->getFile()) . ':' . $this->getLine();
		}

		public function getDisplayMessage() {
			return $this->displayMessage ?? $this->getMessage();
		}
	}
}

require_once dirname(__DIR__) . '/includes/exceptions/class.ZarafaErrorException.php';
require_once dirname(__DIR__) . '/includes/exceptions/class.ZarafaException.php';
require_once dirname(__DIR__) . '/includes/download_base.php';

foreach ([
	'RES_OR',
	'RES_CONTENT',
	'FUZZYLEVEL',
	'FL_FULLSTRING',
	'FL_IGNORECASE',
	'ULPROPTAG',
	'PR_ATTACH_CONTENT_ID',
	'VALUE',
	'PR_ATTACH_CONTENT_LOCATION',
	'PR_ATTACH_FILENAME',
	'PR_ATTACH_LONG_FILENAME',
	'PR_ATTACH_NUM',
	'MAPI_E_NOT_FOUND',
	'ERROR_MAPI',
	'ERROR_ZARAFA',
	'ERROR_GENERAL',
] as $value => $name) {
	defined($name) || define($name, $value + 1);
}

$GLOBALS['attachmentCidTestRows'] = [];
$GLOBALS['attachmentCidTableCalls'] = 0;
$GLOBALS['attachmentOpenResults'] = [];
$GLOBALS['attachmentObjectResult'] = 'embedded-message';

if (!function_exists('mapi_message_getattachmenttable')) {
	function mapi_attach_openobj($attachment) {
		return $GLOBALS['attachmentObjectResult'];
	}

	// util.php is not loaded here; only the opened message matters.
	function openAttachedMessage($attachment) {
		return $GLOBALS['attachmentObjectResult'];
	}

	function mapi_message_getattachmenttable($message) {
		++$GLOBALS['attachmentCidTableCalls'];

		return 'attachment-table';
	}

	function mapi_table_queryallrows($table, $properties, $restriction) {
		$GLOBALS['attachmentCidLastRestriction'] = $restriction;

		return $GLOBALS['attachmentCidTestRows'];
	}

	function mapi_message_openattach($message, $attachmentNumber) {
		if ($GLOBALS['attachmentOpenResults']) {
			return array_shift($GLOBALS['attachmentOpenResults']);
		}

		return "attachment-{$attachmentNumber}";
	}
}

$_GET = [];
ob_start();
require_once dirname(__DIR__) . '/includes/download_attachment.php';
ob_end_clean();

$reflection = new ReflectionClass(DownloadAttachment::class);
$download = $reflection->newInstanceWithoutConstructor();

$message = new ReflectionProperty(DownloadBase::class, 'message');
$message->setValue($download, 'outer-message');

$attachCid = $reflection->getProperty('attachCid');

$download->init(['attachCid' => 'img2/plus+x%41@example.org']);
if ($attachCid->getValue($download) !== 'img2/plus+x%41@example.org') {
	throw new RuntimeException('The content id from the query string was decoded a second time.');
}
$download->getAttachmentByAttachCid();
$lookedUp = array_unique(array_map(fn ($clause) => reset($clause[1][VALUE]), $GLOBALS['attachmentCidLastRestriction'][1]));
if (array_values($lookedUp) !== ['img2/plus+x%41@example.org', 'img2/plus+xA@example.org']) {
	throw new RuntimeException('The lookup does not try the literal and the decoded content id: ' . json_encode($lookedUp));
}

$attachCid->setValue($download, 'missing-content-id');

if ($download->getAttachmentByAttachCid('container-attachment') !== false) {
	throw new RuntimeException('A missing CID returned the embedded-message container attachment.');
}

$GLOBALS['attachmentCidTestRows'] = [[PR_ATTACH_NUM => 7]];
if ($download->getAttachmentByAttachCid('container-attachment') !== 'attachment-7') {
	throw new RuntimeException('A matching CID did not return the resolved attachment.');
}

$tableCalls = $GLOBALS['attachmentCidTableCalls'];
$GLOBALS['attachmentObjectResult'] = false;
if ($download->getAttachmentByAttachCid('container-attachment') !== false ||
	$GLOBALS['attachmentCidTableCalls'] !== $tableCalls) {
	throw new RuntimeException('A failed embedded-message open entered the CID lookup path.');
}
$GLOBALS['attachmentObjectResult'] = 'embedded-message';

$attachNum = $reflection->getProperty('attachNum');
$attachNum->setValue($download, [1, 2]);
$message->setValue($download, 'outer-message');
$GLOBALS['attachmentOpenResults'] = [false];
if ($download->getAttachmentByAttachNum() !== false) {
	throw new RuntimeException('A failed intermediate attachment open was not propagated.');
}

$GLOBALS['attachmentOpenResults'] = ['container-attachment'];
$GLOBALS['attachmentObjectResult'] = false;
if ($download->getAttachmentByAttachNum() !== false) {
	throw new RuntimeException('A failed intermediate embedded-message open was not propagated.');
}

$GLOBALS['attachmentOpenResults'] = [];
$GLOBALS['attachmentObjectResult'] = 'embedded-message';
if ($download->getAttachmentByAttachNum() !== 'attachment-2') {
	throw new RuntimeException('A successful nested attachment lookup did not return its final attachment.');
}

class MissingImportAttachmentDownload extends DownloadAttachment {
	public function getAttachmentByAttachNum() {
		return false;
	}
}

try {
	(new MissingImportAttachmentDownload())->importAttachment();
}
catch (ZarafaException $e) {
	if ($e->getMessage() === _("Could not find attachment.")) {
		echo "Attachment lookup checks passed\n";

		return;
	}
}

throw new RuntimeException('Importing a missing attachment did not fail cleanly.');
