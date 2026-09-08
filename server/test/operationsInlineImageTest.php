<?php

if (function_exists('mapi_msgstore_openentry')) {
	echo "Inline image checks skipped with php-mapi loaded\n";

	return;
}

$tags = [
	'PR_HTML' => 1, 'PR_INTERNET_CPID' => 2, 'PR_NATIVE_BODY_INFO' => 3, 'PR_ATTACH_NUM' => 4, 'PR_ATTACH_SIZE' => 5,
	'PR_ATTACH_LONG_FILENAME' => 6, 'PR_ATTACHMENT_HIDDEN' => 7, 'PR_DISPLAY_NAME' => 8, 'PR_ATTACH_METHOD' => 9,
	'PR_ATTACH_CONTENT_ID' => 10, 'PR_ATTACH_FLAGS' => 11, 'PR_ATTACH_MIME_TAG' => 12, 'PR_ATTACH_DATA_BIN' => 13,
	'ATTACH_BY_VALUE' => 1, 'IID_IStream' => 'IStream', 'MAPI_CREATE' => 1, 'MAPI_MODIFY' => 2,
	'RES_AND' => 0, 'RES_PROPERTY' => 4, 'RES_EXIST' => 8, 'RELOP' => 'relop', 'RELOP_EQ' => 4, 'ULPROPTAG' => 'ulproptag', 'VALUE' => 'value',
	'ecMsgCycle' => 0x80040118, 'BLOCK_SIZE' => 1048576,
];
foreach ($tags as $name => $value) {
	defined($name) || define($name, $value);
}

class InlineTestObject {
	public array $props = [];
	public array $attachments = [];

	public function __construct(array $props = []) {
		$this->props = $props;
	}
}

class InlineTestStream {
	public string $data = '';

	public function __construct(public InlineTestObject $object, public $tag) {}
}

class InlineTestAttachmentState {
	public function getDeletedAttachments($dialogAttachments) {
		return [];
	}

	public function removeDeletedAttachment($dialogAttachments, $attachNum) {}

	public function isInlineAttachment($attachment) {
		$props = $attachment->props;

		return isset($props[PR_ATTACH_CONTENT_ID]) && (($props[PR_ATTACH_FLAGS] ?? 0) & 4);
	}
}

if (!function_exists('streamProperty')) {
	function streamProperty($object, $tag) {
		return $object->props[$tag] ?? '';
	}
}
if (!class_exists('Conversion')) {
	class Conversion {
		public static function getCodepageCharset($codepage) {
			return 'utf-8';
		}
	}
}
if (!function_exists('mapi_getprops')) {
	function pick(InlineTestObject $object, $tags) {
		return array_intersect_key($object->props, array_flip($tags));
	}

	function matchesRestriction(InlineTestObject $object, array $restriction) {
		switch ($restriction[0]) {
			case RES_AND:
				foreach ($restriction[1] as $part) {
					if (!matchesRestriction($object, $part)) {
						return false;
					}
				}

				return true;

			case RES_PROPERTY:
				$tag = $restriction[1][ULPROPTAG];

				return $restriction[1][RELOP] === RELOP_EQ && isset($object->props[$tag]) && $object->props[$tag] == $restriction[1][VALUE][$tag];

			case RES_EXIST:
				return isset($object->props[$restriction[1][ULPROPTAG]]);
		}

		throw new RuntimeException('Unsupported restriction: ' . json_encode($restriction));
	}

	function mapi_getprops($object, $tags = null) {
		return pick($object, $tags);
	}

	function mapi_message_getprops($object, $tags = null) {
		return pick($object, $tags);
	}

	function mapi_attach_getprops($object, $tags = null) {
		return pick($object, $tags);
	}

	function mapi_setprops($object, $props) {
		$object->props = $props + $object->props;
	}

	function mapi_message_getattachmenttable($message) {
		return $message;
	}

	function mapi_table_queryallrows($message, $tags, $restriction = null) {
		$rows = [];
		foreach ($message->attachments as $num => $attachment) {
			if ($restriction !== null && !matchesRestriction($attachment, $restriction)) {
				continue;
			}
			$rows[] = [PR_ATTACH_NUM => $num] + pick($attachment, $tags);
		}

		return $rows;
	}

	function mapi_message_openattach($message, $num) {
		return $message->attachments[$num];
	}

	function mapi_message_createattach($message) {
		$attachment = new InlineTestObject();
		$message->attachments[] = $attachment;

		return $attachment;
	}

	function mapi_message_deleteattach($message, $num) {
		unset($message->attachments[$num]);
	}

	function mapi_copyto($source, $excludeInterfaces, $excludeTags, $target, $flags) {
		$target->props = $source->props;
	}

	function mapi_openproperty($object, $tag, $interface, $interfaceFlags, $flags) {
		return new InlineTestStream($object, $tag);
	}

	function mapi_stream_setsize($stream, $size) {}

	function mapi_stream_write($stream, $data) {
		$stream->data .= $data;

		return strlen($data);
	}

	function mapi_stream_commit($stream) {
		$stream->object->props[$stream->tag] = $stream->data;
	}

	function mapi_savechanges($object) {}
}

require_once dirname(__DIR__) . '/includes/core/class.operations.php';

function inlineAttachment($cid, $hidden) {
	$props = [PR_ATTACH_METHOD => ATTACH_BY_VALUE, PR_ATTACH_CONTENT_ID => $cid, PR_ATTACH_FLAGS => 4, PR_ATTACH_MIME_TAG => 'image/png', PR_ATTACH_DATA_BIN => 'png'];
	if ($hidden) {
		$props[PR_ATTACHMENT_HIDDEN] = true;
	}

	return new InlineTestObject($props);
}

function sourceMessage() {
	$source = new InlineTestObject();
	$source->attachments = [
		inlineAttachment('kept@example.org', false),
		inlineAttachment('dropped@example.org', false),
		new InlineTestObject([PR_ATTACH_METHOD => ATTACH_BY_VALUE, PR_ATTACH_LONG_FILENAME => 'report.pdf', PR_ATTACH_DATA_BIN => 'pdf']),
	];

	return $source;
}

function attachmentNames(InlineTestObject $message) {
	return array_values(array_map(fn ($attachment) => $attachment->props[PR_ATTACH_CONTENT_ID] ?? $attachment->props[PR_ATTACH_LONG_FILENAME], $message->attachments));
}

$operations = new Operations();
$attachments = ['dialog_attachments' => 'state'];
$state = new InlineTestAttachmentState();
$body = '<html><body><p><img src="cid:kept@example.org"></p></body></html>';

// forward: the referenced inline attachment and the file, not the unreferenced inline one
$message = new InlineTestObject([PR_HTML => $body, PR_NATIVE_BODY_INFO => 3]);
$operations->copyAttachments($message, $attachments, sourceMessage(), false, $state);
if (attachmentNames($message) !== ['kept@example.org', 'report.pdf']) {
	throw new RuntimeException('Forward did not copy exactly the referenced inline attachment and the file: ' . json_encode(attachmentNames($message)));
}
if (empty($message->attachments[0]->props[PR_ATTACHMENT_HIDDEN])) {
	throw new RuntimeException('The copied inline attachment was not hidden.');
}
if (!empty($message->attachments[1]->props[PR_ATTACHMENT_HIDDEN])) {
	throw new RuntimeException('The copied file was hidden.');
}

// the hidden copy survives the cleanup that follows in saveMessage()
$message->props[PR_INTERNET_CPID] = 65001;
$operations->convertInlineImage($message);
if (attachmentNames($message) !== ['kept@example.org', 'report.pdf']) {
	throw new RuntimeException('The cleanup after the copy removed an attachment: ' . json_encode(attachmentNames($message)));
}

// reply: only the referenced inline attachment
$message = new InlineTestObject([PR_HTML => $body, PR_NATIVE_BODY_INFO => 3]);
$operations->copyAttachments($message, $attachments, sourceMessage(), true, $state);
if (attachmentNames($message) !== ['kept@example.org']) {
	throw new RuntimeException('Reply did not copy exactly the referenced inline attachment: ' . json_encode(attachmentNames($message)));
}

// plain text forward: no inline attachments at all
$message = new InlineTestObject([PR_HTML => $body, PR_NATIVE_BODY_INFO => 1]);
$operations->copyAttachments($message, $attachments, sourceMessage(), false, $state);
if (attachmentNames($message) !== ['report.pdf']) {
	throw new RuntimeException('Plain text forward copied inline attachments: ' . json_encode(attachmentNames($message)));
}

// a percent-encoded reference (RFC 2392) still names the attachment, on the copy and on the cleanup
$message = new InlineTestObject([PR_HTML => '<p><img src="cid:kept%40example.org"></p>', PR_NATIVE_BODY_INFO => 3, PR_INTERNET_CPID => 65001]);
$operations->copyAttachments($message, $attachments, sourceMessage(), true, $state);
$operations->convertInlineImage($message);
if (attachmentNames($message) !== ['kept@example.org']) {
	throw new RuntimeException('An encoded reference did not keep its inline attachment: ' . json_encode(attachmentNames($message)));
}

// convertInlineImage: a pasted data: image becomes a hidden cid attachment without data-mce-src; hidden inline
// attachments stay when the body references them in any way, a visible one is never touched
$message = new InlineTestObject([
	PR_HTML => '<html><body><p><img src="data:image/png;base64,' . base64_encode('png') . '" data-mce-src="" alt="shot"></p>'
		. '<p><img src="cid:kept@example.org"></p><table><tr><td background="cid:bg@example.org"></td></tr></table></body></html>',
	PR_INTERNET_CPID => 65001,
]);
$message->attachments = [
	inlineAttachment('kept@example.org', true),
	inlineAttachment('dropped@example.org', true),
	inlineAttachment('bg@example.org', true),
	inlineAttachment('visible@example.org', false),
];
$operations->convertInlineImage($message);
$html = $message->props[PR_HTML];
if (str_contains($html, 'data-mce-src') || str_contains($html, 'data:image')) {
	throw new RuntimeException('The converted body still carries the editor attributes: ' . $html);
}
if (!preg_match('/<img src="cid:([0-9a-f]+)" alt="shot">/', $html, $match)) {
	throw new RuntimeException('The pasted image was not rewritten to a cid: ' . $html);
}
if (attachmentNames($message) !== ['kept@example.org', 'bg@example.org', 'visible@example.org', $match[1]]) {
	throw new RuntimeException('Unexpected inline attachments after conversion: ' . json_encode(attachmentNames($message)));
}
$created = end($message->attachments);
if (empty($created->props[PR_ATTACHMENT_HIDDEN]) || $created->props[PR_ATTACH_FLAGS] !== 4 || $created->props[PR_ATTACH_MIME_TAG] !== 'image/png' || $created->props[PR_ATTACH_DATA_BIN] !== 'png') {
	throw new RuntimeException('The created inline attachment is incomplete: ' . json_encode($created->props));
}

echo "Inline image checks passed\n";
