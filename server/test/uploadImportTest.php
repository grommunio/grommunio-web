<?php

if (!class_exists('BaseException')) {
	class BaseException extends Exception {}
}

if (!function_exists('_')) {
	function _($message) {
		return $message;
	}
}

if (!class_exists('AttachmentState')) {
	class AttachmentState {
		public function open() {}

		public function close() {}
	}
}

define('BLOCK_SIZE', 4);

require_once dirname(__DIR__) . '/includes/upload_attachment.php';

class TestAttachmentState {
	public function __construct(private $path) {}

	public function getAttachmentPath($name) {
		return $this->path;
	}
}

class TestUploadAttachment extends UploadAttachment {
	public function setAttachmentPath($path) {
		$this->attachment_state = new TestAttachmentState($path);
	}

	#[Override]
	public function importEMLFile($attachmentStream, $filename) {
		return [$attachmentStream, $filename];
	}
}

$temporaryDirectory = sys_get_temp_dir() . '/grommunio-upload-import-' . bin2hex(random_bytes(8));
if (!mkdir($temporaryDirectory, 0700)) {
	throw new RuntimeException('Unable to create the upload import test directory.');
}

$attachmentPath = $temporaryDirectory . '/attachment';
$payload = "test\0attachment";

try {
	if (file_put_contents($attachmentPath, $payload) !== strlen($payload)) {
		throw new RuntimeException('Unable to create the attachment fixture.');
	}

	$upload = new TestUploadAttachment();
	$upload->setAttachmentPath($attachmentPath);
	if ($upload->importFiles('attachment', 'message.eml') !== [$payload, 'message.eml']) {
		throw new RuntimeException('The uploaded attachment was not read completely.');
	}
	if (file_exists($attachmentPath)) {
		throw new RuntimeException('The imported attachment was not removed.');
	}

	set_error_handler(static fn () => true);

	try {
		$upload->importFiles('missing', 'message.eml');

		throw new RuntimeException('An unreadable attachment was accepted.');
	}
	catch (ZarafaException) {
		// Expected failure for an unreadable attachment.
	}
	finally {
		restore_error_handler();
	}
}
finally {
	if (is_file($attachmentPath)) {
		unlink($attachmentPath);
	}
	rmdir($temporaryDirectory);
}

echo "Upload import checks passed\n";
