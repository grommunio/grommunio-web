<?php

/*
 * SPDX-FileCopyrightText: Copyright 2020 - 2026 grommunio GmbH
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

/* Unwrapping a signed message keeps the outer subject unless the inner part has one. */
if (function_exists('mapi_logon_zarafa')) {
	echo "Signed message subject checks skipped with php-mapi loaded\n";

	return;
}

define('BASE_PATH', dirname(__DIR__, 2) . '/');

foreach (['PR_MESSAGE_CLASS', 'PR_MESSAGE_FLAGS', 'PR_SENT_REPRESENTING_NAME', 'PR_SENT_REPRESENTING_ENTRYID',
	'PR_SENT_REPRESENTING_SEARCH_KEY', 'PR_SENT_REPRESENTING_EMAIL_ADDRESS', 'PR_SENT_REPRESENTING_SMTP_ADDRESS',
	'PR_SENT_REPRESENTING_ADDRTYPE', 'PR_CLIENT_SUBMIT_TIME', 'PR_TRANSPORT_MESSAGE_HEADERS',
	'PR_REPLY_RECIPIENT_ENTRIES', 'PR_SUBJECT', 'PR_ATTACH_MIME_TAG', 'PR_ATTACH_NUM', 'PR_ATTACH_DATA_BIN',
	'MSGFLAG_READ'] as $index => $name) {
	defined($name) || define($name, $index + 700);
}

if (!class_exists('BaseException')) {
	class BaseException extends Exception {}
}

class SignedMessage {
	public array $props;

	public function __construct(public ?string $innerSubject) {
		$this->props = [
			PR_MESSAGE_CLASS => 'IPM.Note.SMIME.MultipartSigned',
			PR_MESSAGE_FLAGS => 0,
			PR_SUBJECT => 'Outer subject',
			PR_SENT_REPRESENTING_NAME => 'Sender',
			PR_SENT_REPRESENTING_ENTRYID => 'entryid',
			PR_SENT_REPRESENTING_SEARCH_KEY => 'searchkey',
		];
	}
}

if (!function_exists('mapi_getprops')) {
	function mapi_getprops($object, $tags = null) {
		return array_intersect_key($object->props, array_flip($tags));
	}

	function mapi_setprops($object, $props) {
		$object->props = array_replace($object->props, $props);

		return true;
	}

	function mapi_message_getattachmenttable($message) {
		return 'attachments';
	}

	function mapi_message_getrecipienttable($message) {
		return 'recipients';
	}

	function mapi_table_queryallrows($table, $tags) {
		return $table === 'attachments' ? [[PR_ATTACH_MIME_TAG => 'multipart/signed', PR_ATTACH_NUM => 0]] : [];
	}

	function mapi_message_openattach($message, $num) {
		return 'attachment';
	}

	function mapi_openproperty($object, $tag) {
		return "Content-Type: multipart/signed\r\n\r\n";
	}

	function mapi_inetmapi_imtomapi($session, $store, $ab, $message, $data, $flags) {
		$message->props = [PR_MESSAGE_CLASS => 'IPM.Note'];
		if ($message->innerSubject !== null) {
			$message->props[PR_SUBJECT] = $message->innerSubject;
		}

		return true;
	}
}

require_once BASE_PATH . 'server/includes/util.php';

function checkSubject(bool $condition, string $message): void {
	if (!$condition) {
		fwrite(STDERR, "FAIL: {$message}\n");

		exit(1);
	}
}

$GLOBALS['PluginManager'] = new class {
	public function triggerHook($name, $data) {}
};
$GLOBALS['mapisession'] = new class {
	public function getSession() {
		return 'session';
	}

	public function getAddressbook() {
		return 'addressbook';
	}
};
$GLOBALS['properties'] = new class {
	public function getRecipientProperties() {
		return [];
	}
};

$message = new SignedMessage(null);
parse_smime('store', $message);
checkSubject(($message->props[PR_SUBJECT] ?? null) === 'Outer subject', 'outer subject restored after unwrapping');
checkSubject($message->props[PR_MESSAGE_CLASS] === 'IPM.Note.SMIME.MultipartSigned', 'message class restored');

$message = new SignedMessage('Inner subject');
parse_smime('store', $message);
checkSubject($message->props[PR_SUBJECT] === 'Inner subject', 'inner subject kept');

$props = [];
parse_smime__keep_subject($props, new SignedMessage(null));
checkSubject(!array_key_exists(PR_SUBJECT, $props), 'no subject is set when neither part has one');

echo "Signed message subject checks passed\n";
