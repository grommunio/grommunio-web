<?php

if (function_exists('mapi_msgstore_openentry')) {
	echo "Failed submit check skipped with php-mapi loaded\n";

	return;
}

$constants = [
	'PR_IPM_OUTBOX_ENTRYID',
	'PR_IPM_SENTMAIL_ENTRYID',
	'PR_ENTRYID',
	'PR_SENTMAIL_ENTRYID',
	'PR_SENT_REPRESENTING_SMTP_ADDRESS',
	'PR_SENT_REPRESENTING_EMAIL_ADDRESS',
	'PR_SENT_REPRESENTING_ENTRYID',
	'PR_SENT_REPRESENTING_ADDRTYPE',
	'PR_SENT_REPRESENTING_SEARCH_KEY',
	'PR_SENDER_EMAIL_ADDRESS',
	'PR_CONVERSATION_INDEX',
	'PR_CONVERSATION_TOPIC',
	'PR_NORMALIZED_SUBJECT',
	'PR_INTERNET_MESSAGE_ID',
	'PR_INTERNET_REFERENCES',
	'PR_MESSAGE_FLAGS',
	'PR_PARENT_ENTRYID',
	'PR_MESSAGE_CLASS',
];
foreach ($constants as $index => $constant) {
	defined($constant) || define($constant, $index + 1);
}

$GLOBALS['operationsSubmitDeleteCalls'] = 0;
$GLOBALS['settings'] = new class {
	public function get($key) {
		return '';
	}
};
$GLOBALS['mapisession'] = new class {
	public function getDefaultMessageStore() {
		return 'store';
	}
};
$GLOBALS['entryid'] = new class {
	public function compareEntryIds($first, $second) {
		return true;
	}
};

if (!function_exists('mapi_msgstore_openentry')) {
	function mapi_getprops($object, $properties = null) {
		if ($object === 'store') {
			return [
				PR_IPM_OUTBOX_ENTRYID => 'outbox-id',
				PR_IPM_SENTMAIL_ENTRYID => 'sent-id',
				PR_ENTRYID => 'store-id',
			];
		}
		if ($object === 'new-message') {
			return [PR_ENTRYID => 'new-message-id'];
		}
		if ($object === 'old-message') {
			return [PR_PARENT_ENTRYID => 'drafts-id'];
		}

		return [];
	}

	function mapi_msgstore_openentry($store, $entryid) {
		return match ($entryid) {
			'outbox-id' => 'outbox',
			'old-message-id' => 'old-message',
			'drafts-id' => 'drafts',
			default => false,
		};
	}

	function mapi_folder_createmessage($folder) {
		return 'new-message';
	}

	function mapi_copyto($source, $exclude, $include, $destination) {}

	function mapi_message_getrecipienttable($message) {
		return 'recipient-table';
	}

	function mapi_table_getrowcount($table) {
		return 1;
	}

	function mapi_savechanges($message) {}

	function mapi_folder_deletemessages($folder, $entryids) {
		++$GLOBALS['operationsSubmitDeleteCalls'];
	}
}

require_once dirname(__DIR__) . '/includes/core/class.operations.php';

class FailingSaveOperations extends Operations {
	public function saveMessage($store, $entryid, $parententryid, $props, &$messageProps, $recipients = [], $attachments = [], $propertiesToDelete = [], $copyFromMessage = false, $copyAttachments = false, $copyRecipients = false, $copyInlineAttachmentsOnly = false, $saveChanges = true, $send = false, $isPlainText = false) {
		return false;
	}
}

$messageProps = [];
$operations = new FailingSaveOperations();
$result = $operations->submitMessage('store', 'old-message-id', [], $messageProps);
if ($result !== false) {
	throw new RuntimeException('A failed replacement save did not abort submission.');
}
if ($GLOBALS['operationsSubmitDeleteCalls'] !== 0) {
	throw new RuntimeException('The original draft was deleted before its replacement was saved.');
}

echo "Failed submit preserves original draft\n";
