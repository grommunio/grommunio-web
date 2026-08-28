<?php

if (function_exists('mapi_msgstore_openentry')) {
	echo "Protected-submit checks skipped with php-mapi loaded\n";

	return;
}

foreach ([
	'PR_IPM_OUTBOX_ENTRYID', 'PR_IPM_SENTMAIL_ENTRYID', 'PR_ENTRYID', 'PR_SENTMAIL_ENTRYID',
	'PR_SENT_REPRESENTING_SMTP_ADDRESS', 'PR_SENT_REPRESENTING_EMAIL_ADDRESS',
	'PR_SENT_REPRESENTING_ENTRYID', 'PR_SENT_REPRESENTING_ADDRTYPE', 'PR_SENT_REPRESENTING_SEARCH_KEY',
	'PR_SENT_REPRESENTING_NAME', 'PR_SENDER_EMAIL_ADDRESS', 'PR_SENDER_SMTP_ADDRESS', 'PR_SENDER_ENTRYID',
	'PR_SENDER_NAME', 'PR_SENDER_ADDRTYPE', 'PR_SENDER_SEARCH_KEY', 'PR_CONVERSATION_INDEX',
	'PR_CONVERSATION_TOPIC', 'PR_NORMALIZED_SUBJECT', 'PR_INTERNET_MESSAGE_ID', 'PR_INTERNET_REFERENCES',
	'PR_MESSAGE_FLAGS', 'PR_PARENT_ENTRYID', 'PR_MESSAGE_CLASS', 'PR_MESSAGE_DELIVERY_TIME',
	'PR_CLIENT_SUBMIT_TIME', 'PR_SEARCH_KEY', 'PR_STORE_ENTRYID', 'PR_HTML', 'PR_BODY',
	'PR_SUBJECT_PREFIX', 'PR_DISPLAY_NAME', 'PR_EMAIL_ADDRESS', 'PR_SMTP_ADDRESS',
	'PR_MDB_PROVIDER', 'PR_MAILBOX_OWNER_ENTRYID', 'PR_EMS_AB_PROXY_ADDRESSES',
] as $index => $constant) {
	define($constant, $index + 100);
}
define('DELETE_HARD_DELETE', 16);
define('MSGFLAG_READ', 1);
define('MSGFLAG_UNSENT', 8);
define('ZARAFA_STORE_PUBLIC_GUID', 'public');
define('MAPI_E_NO_SUPPORT', 0x80040102);

class MAPIException extends Exception {
	public function setHandled() {}
	public function setTitle($title) {}
	public function setDisplayMessage($message) {}
}

if (!function_exists('mapi_msgstore_openentry')) {
function getPropIdsFromStrings($store, $names) {
	return ['pgp_sign' => 10001, 'pgp_encrypt' => 10002];
}

function get_mapi_error_name($code) {
	return 'TEST_ERROR_' . $code;
}

function mapi_last_hresult() {
	return 42;
}

function mapi_getprops($object, $properties = null) {
	if (is_object($object)) {
		return $object->props;
	}
	if ($object === 'store' || $object === 'delegate-store') {
		return [PR_ENTRYID => $object, PR_IPM_OUTBOX_ENTRYID => 'outbox-id',
			PR_IPM_SENTMAIL_ENTRYID => $object === 'store' ? 'sent-id' : 'repr-sent-id',
			PR_MDB_PROVIDER => 'private'];
	}

	return [];
}

function mapi_msgstore_openentry($store, $entryid) {
	return $GLOBALS['submitMessages'][$entryid] ?? $entryid;
}

function mapi_folder_createmessage($folder) {
	$id = $folder === 'repr-sent-id' ? 'repr-id' : 'outgoing-id';
	$message = (object) ['props' => [PR_ENTRYID => $id, PR_PARENT_ENTRYID => $folder, PR_MESSAGE_FLAGS => MSGFLAG_UNSENT], 'saved' => false];
	$GLOBALS['submitMessages'][$id] = $message;

	return $message;
}

function mapi_copyto($source, $exclude, $properties, $destination, $flags = 0) {
	if ($destination->props[PR_ENTRYID] === 'repr-id' && $GLOBALS['submitMode'] === 'repr-copy-false') {
		return false;
	}
	$destination->props += $source->props;
	if ($destination->props[PR_ENTRYID] === 'repr-id') {
		$GLOBALS['submitEvents'][] = 'copy-representee';
		if (($source->props[PR_BODY] ?? '') !== 'encrypted MIME') {
			throw new RuntimeException('The representee copy received plaintext before the protection hook.');
		}
	}
}

function mapi_message_getrecipienttable($message) {
	return 'recipients';
}

function mapi_table_getrowcount($table) {
	return 1;
}

function mapi_savechanges($message) {
	if ($message->props[PR_ENTRYID] === 'repr-id' && $GLOBALS['submitMode'] === 'repr-save-false') {
		return false;
	}
	$message->saved = true;
	if ($message->props[PR_ENTRYID] === 'repr-id') {
		$GLOBALS['submitEvents'][] = 'save-representee';
	}
}

function mapi_setprops($message, $props) {
	if ($message->props[PR_ENTRYID] === 'repr-id' && $GLOBALS['submitMode'] === 'repr-props-false') {
		return false;
	}
	$message->props = $props + $message->props;
}

function mapi_folder_deletemessages($folder, $ids, $flags = 0) {
	$GLOBALS['submitEvents'][] = 'delete-draft';
	if ($GLOBALS['submitMode'] === 'cleanup-error') {
		throw new MAPIException('Cleanup failed', 43);
	}
	foreach ($ids as $id) {
		unset($GLOBALS['submitMessages'][$id]);
	}

	return true;
}

function mapi_message_submitmessage($message) {
	$GLOBALS['submitEvents'][] = 'submit';
	if ($GLOBALS['submitMode'] === 'submit-error') {
		throw new MAPIException('Submit failed', 42);
	}
	if ($GLOBALS['submitMode'] === 'submit-false') {
		return false;
	}
	$message->props[PR_PARENT_ENTRYID] = 'sent-id';

	return true;
}

function mapi_ab_openentry($ab, $entryid) {
	return (object) ['props' => [PR_DISPLAY_NAME => 'Test identity', PR_EMAIL_ADDRESS => $entryid === 'bob-id' ? 'bob@example.test' : 'alice@example.test', PR_SEARCH_KEY => $entryid]];
}

function parse_smime($store, $message) {}
}

$GLOBALS['settings'] = new class {
	public function get($key) {
		return str_starts_with($GLOBALS['submitMode'], 'repr-') ? 'representee' : 'both';
	}
};
$GLOBALS['mapisession'] = new class {
	public function getDefaultMessageStore() { return 'store'; }
	public function getUserName() { return 'alice'; }
	public function getUserEntryID() { return 'alice-id'; }
	public function getAddressbook() { return 'address-book'; }
	public function getSMTPAddress() { return 'alice@example.test'; }
	public function getEmailAddress() { return 'alice@example.test'; }
	public function getStoreEntryIdOfUser($user) { return 'delegate-store'; }
	public function openMessageStore($entryid) { return $entryid; }
};
$GLOBALS['entryid'] = new class {
	public function compareEntryIds($first, $second) {
		return $first === $second;
	}
};
$GLOBALS['PluginManager'] = new class {
	public function triggerHook($name, $data) {
		$GLOBALS['submitEvents'][] = 'protect';
		if ($GLOBALS['submitMode'] === 'unhandled-pgp') {
			return;
		}
		if ($GLOBALS['submitMode'] === 'plugin-error') {
			throw new RuntimeException('Signing key locked');
		}
		$data['message']->props[PR_BODY] = 'encrypted MIME';
		$data['message']->props[PR_MESSAGE_CLASS] = 'IPM.Note.GpgOL.MultipartEncrypted';
	}
};

require_once dirname(__DIR__) . '/includes/core/class.operations.php';

class ProtectedSubmitOperations extends Operations {
	public function saveMessage($store, $entryid, $parententryid, $props, &$messageProps, $recipients = [], $attachments = [], $propertiesToDelete = [], $copyFromMessage = false, $copyAttachments = false, $copyRecipients = false, $copyInlineAttachmentsOnly = false, $saveChanges = true, $send = false, $isPlainText = false) {
		$message = $entryid ? $GLOBALS['submitMessages'][$entryid] : mapi_folder_createmessage($parententryid);
		$message->props = $props + $message->props;
		$message->props[PR_BODY] = 'original plaintext';
		$messageProps = $message->props;

		return $message;
	}

	public function getRecipientsInfo($message, $excludeDeleted = true) { return []; }
	public function addRecipientsToRecipientHistory($recipients) {}
}

foreach (['store', 'delegate-store', 'own-store-delegate'] as $store) {
	foreach (['plugin-error', 'unhandled-pgp', 'submit-error', 'submit-false', 'success', 'cleanup-error', 'repr-copy-false', 'repr-props-false', 'repr-save-false'] as $mode) {
		$GLOBALS['submitMode'] = $mode;
		$GLOBALS['submitEvents'] = [];
		$GLOBALS['submitMessages'] = ['draft-id' => (object) ['props' => [
			PR_ENTRYID => 'draft-id', PR_PARENT_ENTRYID => 'drafts-id', PR_MESSAGE_CLASS => 'IPM.Note',
			PR_BODY => 'original plaintext', PR_MESSAGE_FLAGS => MSGFLAG_UNSENT,
			10002 => $mode === 'unhandled-pgp',
		]]];
		$messageProps = [];
		$props = $store === 'own-store-delegate' ? [
			PR_SENT_REPRESENTING_SMTP_ADDRESS => 'bob@example.test', PR_SENT_REPRESENTING_EMAIL_ADDRESS => 'bob@example.test',
			PR_SENT_REPRESENTING_ENTRYID => 'bob-id', PR_SENT_REPRESENTING_ADDRTYPE => 'SMTP', PR_SENDER_EMAIL_ADDRESS => 'alice@example.test',
		] : [];
		try {
			$result = (new ProtectedSubmitOperations())->submitMessage($store === 'own-store-delegate' ? 'store' : $store, 'draft-id', $props, $messageProps);
			if ($mode === 'plugin-error' || $mode === 'unhandled-pgp') {
				throw new RuntimeException('The protection-hook exception was swallowed.');
			}
		}
		catch (MAPIException $exception) {
			if ($mode !== 'unhandled-pgp' || $exception->getCode() !== MAPI_E_NO_SUPPORT) {
				throw $exception;
			}
		}
		catch (RuntimeException $exception) {
			if ($mode !== 'plugin-error' || $exception->getMessage() !== 'Signing key locked') {
				throw $exception;
			}
		}
		$failed = in_array($mode, ['plugin-error', 'unhandled-pgp', 'submit-error', 'submit-false'], true);
		if ($failed) {
			if (!isset($GLOBALS['submitMessages']['draft-id']) || in_array('delete-draft', $GLOBALS['submitEvents'], true)) {
				throw new RuntimeException("{$store}/{$mode}: original draft was removed after a failed send.");
			}
			if (isset($GLOBALS['submitMessages']['repr-id']) && $GLOBALS['submitMessages']['repr-id']->saved) {
				throw new RuntimeException('An unsent message was saved into representee Sent Items.');
			}
			if ($mode === 'unhandled-pgp' && in_array('submit', $GLOBALS['submitEvents'], true)) {
				throw new RuntimeException('A saved draft with unapplied OpenPGP intent reached submission.');
			}
			if (!in_array($mode, ['plugin-error', 'unhandled-pgp'], true) && $result !== 'TEST_ERROR_42') {
				throw new RuntimeException('The submit failure was not reported.');
			}
		}
		else {
			if ($result !== false || array_search('delete-draft', $GLOBALS['submitEvents'], true) < array_search('submit', $GLOBALS['submitEvents'], true)) {
				throw new RuntimeException('Draft cleanup preceded submission or changed successful-send status.');
			}
			if (str_starts_with($mode, 'repr-')) {
				if (!isset($GLOBALS['submitMessages']['outgoing-id']) || !empty($GLOBALS['submitMessages']['repr-id']->saved)) {
					throw new RuntimeException('A failed representee copy removed the sender copy or saved an incomplete copy.');
				}
			}
			elseif ($store !== 'store') {
				$events = $GLOBALS['submitEvents'];
				if (!(array_search('protect', $events, true) < array_search('copy-representee', $events, true) &&
					array_search('copy-representee', $events, true) < array_search('submit', $events, true) &&
					array_search('submit', $events, true) < array_search('save-representee', $events, true))) {
					throw new RuntimeException('Representee-copy protection/submission ordering is incorrect.');
				}
			}
		}
	}
}

echo "Protected submit preserves drafts and copies only final encrypted content\n";
