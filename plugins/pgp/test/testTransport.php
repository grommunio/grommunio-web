<?php

/**
 * Real transport/module/MIME code with explicit MAPI, key-storage and session
 * doubles. Key storage and browser cryptography have their own real suites.
 * No GnuPG/private-key operation participates in this server-side test.
 */
if (extension_loaded('mapi')) { throw new RuntimeException('Run isolated transport tests with php -n.'); }
define('PLUGIN_PGP_ENABLE', true);
define('PLUGIN_PGP_MAX_MESSAGE_BYTES', 1048576);
define('PLUGIN_PGP_UNLOCK_TTL', 99999);
require_once __DIR__ . '/../config.php';
foreach ([
	'PT_ERROR' => 10, 'MAPI_E_NOT_FOUND' => 0x8004010f, 'MAPI_E_NOT_ENOUGH_MEMORY' => 0x8007000e,
	'MAPI_E_CALL_FAILED' => 0x80004005, 'MAPI_DISTLIST' => 8, 'MAPI_TO' => 1, 'MAPI_CC' => 2, 'MAPI_BCC' => 3,
	'MAPI_CREATE' => 2, 'MAPI_MODIFY' => 1, 'ATTACH_BY_VALUE' => 1, 'ATTACH_EMBEDDED_MSG' => 5, 'MSGFLAG_UNSENT' => 8,
	'PR_MESSAGE_CLASS' => 0x001a001f, 'PR_MESSAGE_FLAGS' => 0x0e070003, 'PR_CHANGE_KEY' => 0x65e20102,
	'PR_BODY' => 0x1000001f, 'PR_HTML' => 0x10130102, 'PR_RTF_COMPRESSED' => 0x10090102, 'PR_SUBJECT' => 0x0037001f,
	'PR_TRANSPORT_MESSAGE_HEADERS' => 0x007d001f,
	'PR_INTERNET_MESSAGE_ID' => 0x1035001f, 'PR_INTERNET_REFERENCES' => 0x1039001f, 'PR_IN_REPLY_TO_ID' => 0x1042001f,
	'PR_SENDER_NAME' => 0x0c1a001f, 'PR_SENDER_ADDRTYPE' => 0x0c1e001f, 'PR_SENDER_EMAIL_ADDRESS' => 0x0c1f001f, 'PR_SENDER_SMTP_ADDRESS' => 0x5d01001f,
	'PR_SENT_REPRESENTING_NAME' => 0x0042001f, 'PR_REPLY_RECIPIENT_NAMES' => 0x0050001f, 'PR_REPLY_RECIPIENT_ENTRIES' => 0x004f0102,
	'PR_SENT_REPRESENTING_ENTRYID' => 0x00410102, 'PR_SENT_REPRESENTING_EMAIL_ADDRESS' => 0x0065001f,
	'PR_SENT_REPRESENTING_ADDRTYPE' => 0x0064001f, 'PR_SENT_REPRESENTING_SMTP_ADDRESS' => 0x5d02001f,
	'PR_ATTACH_NUM' => 0x0e210003, 'PR_ATTACH_METHOD' => 0x37050003, 'PR_ATTACH_MIME_TAG' => 0x370e001f,
	'PR_ATTACH_LONG_FILENAME' => 0x3707001f, 'PR_ATTACH_FILENAME' => 0x3704001f, 'PR_DISPLAY_NAME' => 0x3001001f,
	'PR_ATTACHMENT_HIDDEN' => 0x7ffe000b, 'PR_ATTACH_DATA_BIN' => 0x37010102, 'PR_RENDERING_POSITION' => 0x370b0003,
	'PR_ATTACH_CONTENT_ID' => 0x3712001f, 'PR_ATTACH_CONTENT_LOCATION' => 0x3713001f,
	'PR_SMTP_ADDRESS' => 0x39fe001f, 'PR_EMAIL_ADDRESS' => 0x3003001f, 'PR_ADDRTYPE' => 0x3002001f,
	'PR_ENTRYID' => 0x0fff0102, 'PR_OBJECT_TYPE' => 0x0ffe0003, 'PR_RECIPIENT_TYPE' => 0x0c150003,
	'PR_IPM_OUTBOX_ENTRYID' => 0x35e20102,
] as $name => $value) { define($name, $value); }
define('IID_IStream', 'stream');
if (!function_exists('_')) { function _($text) { return $text; } }
class Plugin { public function registerHook($name): void {} }
class MAPIException extends RuntimeException {
	public string $displayMessage = '';
	public function setTitle($title): void {}
	public function setDisplayMessage($message): void { $this->displayMessage = $message; }
}
class Module {
	public array $data = [];
	public array $responses = [];
	public array $unknown = [];
	public function handleUnknownActionType($action): void { $this->unknown[] = $action; }
	public function addActionData($action, $data): void { $this->responses[] = $data; }
	public function getResponseData(): array { return $this->responses; }
}
class EncryptionStore {
	public static array $values = [];
	public static bool $race = false;
	public static function getInstance(): self { return new self(); }
	public function get($key) { return self::$values[$key] ?? null; }
	public function add($key, $value, $expires = 0): void { self::$values[$key] = $value; }
	public function take($key) { $value = $this->get($key); unset(self::$values[$key]); return self::$race ? null : $value; }
}
class PgpKeyStore {
	public static bool $enabled = true;
	public static array $calls = [];
	public static string $keyFingerprint = '1234567890ABCDEF1234567890ABCDEF12345678';
	public static function current(): self { if (!self::$enabled) { throw new RuntimeException('Disabled'); } return new self(); }
	public static function email(string $value): string {
		if (!filter_var($value, FILTER_VALIDATE_EMAIL)) { throw new InvalidArgumentException('Invalid SMTP address'); }
		return strtolower($value);
	}
	public static function hasUid(array $key, string $email): bool { return $email === 'sender@example.test'; }
	public function key($fingerprint, $material = true): array {
		self::$calls[] = ['key', $fingerprint, $material];
		return ['fingerprint' => self::$keyFingerprint, 'secret' => true, 'public_key' => 'public armor', 'encrypted_private_key' => 'PROTECTED PRIVATE FIXTURE'];
	}
	public function recipientKey($email): string { return self::$keyFingerprint; }
	public function listKeys(): array { self::$calls[] = ['list']; return [['fingerprint' => self::$keyFingerprint, 'secret' => true]]; }
	public function publicKeys(): array { self::$calls[] = ['public']; return [['public_key' => 'public armor']]; }
	public function servers(): array { return ['https://keys.openpgp.org']; }
	public function setServers($servers): void { self::$calls[] = ['servers', $servers]; }
	public function importKey($key): array { self::$calls[] = ['put', $key]; return ['fingerprint' => self::$keyFingerprint]; }
	public function delete($fingerprint, $secret): void { self::$calls[] = ['delete', $fingerprint, $secret]; }
	public function trust($fingerprint, $email, $trust): void { self::$calls[] = ['trust', $fingerprint, $email, $trust]; }
}
class PgpKeyserver { public static function lookup($store, $server, $fingerprint): array { return ['armored' => 'public lookup', 'fingerprint' => $fingerprint]; } }
class TransportMessage {
	public array $props = [];
	public array $attachments = [];
	public array $recipients = [];
	public array $faults = [];
	public int $saves = 0;
	public ?self $embedded = null;
}
class TransportStream {
	public int $offset = 0;
	public function __construct(public string $data, public array $faults = [], public ?TransportMessage $owner = null, public int $tag = 0) {}
}
class TransportTable { public function __construct(public $rows) {} }
function getPropIdsFromStrings($store, $names): array { return ['pgp_sign' => 0x8001000b, 'pgp_encrypt' => 0x8002000b, 'pgp_key' => 0x8003001e, 'pgp_message_class' => 0x8004001e]; }
function mapi_getprops($object, $tags) {
	if (!empty($object->faults['getprops'])) { return false; }
	$result = [];
	foreach ($tags as $tag) {
		if (array_key_exists($tag, $object->props)) {
			$value = $object->props[$tag];
			// Reproduce MAPI's large-property GetProps limit. The stream remains complete.
			if (is_string($value) && strlen($value) > 8192) { $result[($tag & 0xffff0000) | PT_ERROR] = MAPI_E_NOT_ENOUGH_MEMORY; }
			else { $result[$tag] = $value; }
		}
		else { $result[($tag & 0xffff0000) | PT_ERROR] = MAPI_E_NOT_FOUND; }
	}
	return $result;
}
function mapi_setprops($object, $props) { if (!empty($object->faults['setprops'])) { return false; } $object->props = array_replace($object->props, $props); return true; }
function mapi_deleteprops($object, $tags) { $GLOBALS['deleteprops'] = ($GLOBALS['deleteprops'] ?? 0) + 1; if (!empty($object->faults['deleteprops'])) { return false; } foreach ($tags as $tag) { unset($object->props[$tag]); } return true; }
function mapi_savechanges($object) { if (!empty($object->faults['save'])) { return false; } ++$object->saves; return true; }
function mapi_message_getattachmenttable($message) {
	if (!empty($message->faults['attachment_table'])) { return false; }
	$rows = [];
	foreach ($message->attachments as $number => $attachment) { $rows[] = [PR_ATTACH_NUM => $number] + $attachment->props; }
	return new TransportTable(!empty($message->faults['attachment_rows']) ? false : $rows);
}
function mapi_message_getrecipienttable($message) { return !empty($message->faults['recipient_table']) ? false : new TransportTable(!empty($message->faults['recipient_rows']) ? false : $message->recipients); }
function mapi_table_queryallrows($table, $tags) { return $table instanceof TransportTable ? $table->rows : false; }
function mapi_message_openattach($message, $number) { return !empty($message->faults['openattach']) ? false : ($message->attachments[$number] ?? false); }
function mapi_message_createattach($message) {
	if (!empty($message->faults['createattach'])) { return false; }
	$attachment = new TransportMessage(); $attachment->faults = $message->faults['new_attachment'] ?? [];
	$message->attachments[] = $attachment; return $attachment;
}
function mapi_message_deleteattach($message, $number) { if (!empty($message->faults['deleteattach'])) { return false; } unset($message->attachments[$number]); return true; }
function mapi_attach_openobj($attachment) { return $attachment->embedded ?: false; }
function mapi_openproperty($object, $tag, $iid, $options, $flags) {
	if (!empty($object->faults['openstream'])) { return false; }
	if (!$flags && !array_key_exists($tag, $object->props)) { return false; }
	return new TransportStream($flags ? '' : $object->props[$tag], $object->faults, $flags ? $object : null, $tag);
}
function mapi_stream_stat($stream) { return !empty($stream->faults['stat']) ? false : ['cb' => strlen($stream->data) + (!empty($stream->faults['truncated']) ? 1 : 0)]; }
function mapi_stream_read($stream, $count) { $data = substr($stream->data, $stream->offset, $count); $stream->offset += strlen($data); return $data; }
function mapi_stream_write($stream, $data) { $stream->data .= $data; return strlen($data) - (!empty($stream->faults['shortwrite']) ? 1 : 0); }
function mapi_stream_commit($stream) { if (!empty($stream->faults['commit'])) { return false; } $stream->owner->props[$stream->tag] = $stream->data; return true; }
function mapi_msgstore_openentry($store, $entry = null) { return $entry === "\x22" ? $GLOBALS['draft'] : ($entry === "\x33" ? $GLOBALS['outbox'] : false); }
function mapi_folder_createmessage($folder) { $probe = new TransportMessage(); $probe->faults = $GLOBALS['probe_faults']; return $probe; }
function mapi_inetmapi_imtoinet($session, $ab, $message, $options) {
	if (!empty($message->faults['export'])) { return false; }
	if (str_contains($message->props[PR_MESSAGE_CLASS] ?? '', 'GpgOL')) {
		$wire = reset($message->attachments)->props[PR_ATTACH_DATA_BIN] ?? '';
		return new TransportStream(!empty($GLOBALS['bad_converter']) ? 'Content-Type: text/plain\r\n\r\nbroken' : $wire);
	}
	return new TransportStream("From: sender@example.test\r\nContent-Type: text/plain; charset=utf-8\r\n\r\n" . ($message->props[PR_BODY] ?? ''));
}
function mapi_ab_openentry($book, $entry) { $object = new TransportMessage(); $object->props[PR_SMTP_ADDRESS] = $entry; return $object; }

// Replace only dependency imports, never the code under test.
foreach (['plugin.pgp.php', 'class.pluginpgpmodule.php'] as $file) {
	$source = file_get_contents(__DIR__ . '/../php/' . $file);
	$source = str_replace(["require_once __DIR__ . '/class.pgpkeystore.php';", "require_once __DIR__ . '/class.pgpkeyserver.php';", "require_once __DIR__ . '/class.pgpmime.php';"], '', $source);
	eval('?>' . $source);
}
require_once __DIR__ . '/../php/class.pgpmime.php';
$GLOBALS['store'] = new TransportMessage(); $GLOBALS['store']->props[PR_IPM_OUTBOX_ENTRYID] = "\x33";
$GLOBALS['outbox'] = new TransportMessage();
$GLOBALS['mapisession'] = new class {
	public function openMessageStore($entry) { return $entry === "\x11" ? $GLOBALS['store'] : false; }
	public function getSMTPAddress(): string { return 'sender@example.test'; }
	public function getSession() { return null; }
	public function getAddressbook() { return null; }
};
$GLOBALS['settings'] = new class { public array $values = []; public function get($path, $default = null) { return $this->values[$path] ?? $default; } };
$GLOBALS['bus'] = new class { public function addData($data): void {} };
$GLOBALS['probe_faults'] = [];
$GLOBALS['bad_converter'] = false;
$assertions = 0;
function transportCheck(bool $condition, string $label): void { ++$GLOBALS['assertions']; if (!$condition) { throw new RuntimeException('FAIL: ' . $label); } }
function transportRejects(callable $operation, string $label, string $message = ''): void {
	try { $operation(); } catch (RuntimeException | InvalidArgumentException $error) {
		transportCheck($message === '' || str_contains($error->getMessage() . ($error instanceof MAPIException ? $error->displayMessage : ''), $message), $label . ': ' . $error->getMessage()); return;
	}
	throw new RuntimeException('FAIL: did not reject ' . $label);
}
function fixture(bool $sign = true, bool $encrypt = false): TransportMessage {
	$message = new TransportMessage();
	$message->props = [PR_MESSAGE_CLASS => 'IPM.Note', PR_MESSAGE_FLAGS => MSGFLAG_UNSENT, PR_CHANGE_KEY => 'revision1', PR_SUBJECT => 'Outer subject', PR_BODY => 'Exact message body', PR_SENT_REPRESENTING_SMTP_ADDRESS => 'sender@example.test', 0x8001000b => $sign, 0x8002000b => $encrypt, 0x8003001e => PgpKeyStore::$keyFingerprint];
	$message->recipients = [[PR_SMTP_ADDRESS => 'peer@example.test', PR_RECIPIENT_TYPE => MAPI_TO], [PR_ADDRTYPE => 'SMTP', PR_EMAIL_ADDRESS => 'hidden@example.test', PR_RECIPIENT_TYPE => MAPI_BCC]];
	return $message;
}
function attachment(string $data = 'file bytes'): TransportMessage {
	$item = new TransportMessage();
	$item->props = [PR_ATTACH_METHOD => ATTACH_BY_VALUE, PR_ATTACH_DATA_BIN => $data, PR_ATTACH_LONG_FILENAME => 'file.bin', PR_ATTACH_MIME_TAG => 'application/octet-stream'];
	return $item;
}
function preparation(Pluginpgp $plugin, ?TransportMessage $draft = null): array {
	$GLOBALS['draft'] = $draft ?? fixture();
	$prepared = $plugin->prepare(['store_entryid' => '11', 'entryid' => '22']);
	$entity = base64_decode($prepared['mime']);
	$envelope = $prepared['encrypt'] ? PgpMime::encrypted('OPAQUE BROWSER CIPHERTEXT') : PgpMime::signed($entity, "-----BEGIN PGP SIGNATURE-----\r\nfixture\r\n-----END PGP SIGNATURE-----\r\n", 'pgp-sha256');
	$data = ['entryid' => "\x22", 'store' => $GLOBALS['store'], 'action' => ['store_entryid' => '11', 'props' => ['pgp_sign' => $prepared['sign'], 'pgp_encrypt' => $prepared['encrypt'], 'pgp_key' => PgpKeyStore::$keyFingerprint], 'message_action' => ['pgp' => ['token' => $prepared['token'], 'envelope' => base64_encode($envelope)]]]];
	return [$data, $prepared, $envelope];
}
function accept(Pluginpgp $plugin, array $data): void { $plugin->execute('server.module.createmailitemmodule.beforesend', $data); }
function digest(Pluginpgp $plugin, TransportMessage $message): string { return (new ReflectionMethod($plugin, 'contentDigest'))->invoke($plugin, $message); }

foreach ([[true, false], [false, true], [true, true]] as [$sign, $encrypt]) {
	$plugin = new Pluginpgp(); [$data, $prepared, $envelope] = preparation($plugin, fixture($sign, $encrypt));
	$receipt = EncryptionStore::$values['pgp:prepare:' . $prepared['token']];
	transportCheck(!str_contains($receipt, 'Exact message body') && !str_contains($receipt, 'PROTECTED PRIVATE FIXTURE') && !str_contains($receipt, $prepared['mime']), 'Session receipt has no MIME or key material');
	transportCheck($prepared['sign'] === $sign && $prepared['encrypt'] === $encrypt && isset($prepared['key']['encrypted_private_key']), 'Prepare returns selected browser operation and only protected private material');
	if ($encrypt) { transportCheck(array_column($prepared['recipients'], 'email') === ['hidden@example.test', 'peer@example.test', 'sender@example.test'], 'Encryption includes Bcc, To and sender recovery public keys'); }
	$data['action']['attachments'] = ['dialog_attachments' => 'normal-empty-upload-directory'];
	accept($plugin, $data);
	transportCheck(!isset(EncryptionStore::$values['pgp:prepare:' . $prepared['token']]), 'Valid receipt is consumed before submission');
	transportRejects(fn () => accept(new Pluginpgp(), $data), 'Cross-instance receipt replay rejected');
	$copy = unserialize(serialize($GLOBALS['draft'])); $originalRecipients = $copy->recipients;
	$plugin->protect($GLOBALS['store'], $copy);
	transportCheck($copy->saves === 1 && !isset($copy->props[PR_BODY], $copy->props[PR_HTML]) && count($copy->attachments) === 1, 'Final saved copy contains envelope only');
	transportCheck(reset($copy->attachments)->props[PR_ATTACH_DATA_BIN] === $envelope && $copy->recipients === $originalRecipients, 'Exact browser bytes and delivery recipient table preserved');
	transportCheck($copy->props[PR_MESSAGE_CLASS] === ($encrypt ? 'IPM.Note.GpgOL.MultipartEncrypted' : 'IPM.Note.GpgOL.MultipartSigned') && !$copy->props[0x8001000b] && !$copy->props[0x8002000b], 'GpgOL transport class and cleared compose flags');
}
$plugin = new Pluginpgp(); $draft = fixture(); unset($draft->props[PR_SENT_REPRESENTING_SMTP_ADDRESS]);
[$data, $prepared] = preparation($plugin, $draft); accept($plugin, $data);
$copy = unserialize(serialize($GLOBALS['draft'])); $plugin->protect($GLOBALS['store'], $copy);
transportCheck($prepared['sender'] === 'sender@example.test' && $copy->saves === 1 && !isset($copy->props[PR_BODY]), 'Draft without a From identity is protected with the logon address');
$plugin = new Pluginpgp(); [$data] = preparation($plugin); accept($plugin, $data);
$copy = unserialize(serialize($GLOBALS['draft'])); $copy->props[0x8001000b] = false; $copy->props[0x8002000b] = false;
transportRejects(fn () => $plugin->protect($GLOBALS['store'], $copy), 'Accepted receipt with intent missing from the outbox copy fails closed', 'did not reach');
transportCheck($copy->saves === 0 && isset($copy->props[PR_BODY]), 'Intent-less copy after an accepted receipt is not submitted as plaintext');
$plugin = new Pluginpgp(); [$data] = preparation($plugin);
foreach ([
	'changed store' => static function (&$data) { $data['action']['store_entryid'] = '44'; },
	'changed entry' => static function (&$data) { $data['entryid'] = "\x55"; },
	'changed key' => static function (&$data) { $data['action']['props']['pgp_key'] = str_repeat('A', 40); },
	'changed mode' => static function (&$data) { $data['action']['props']['pgp_encrypt'] = true; },
	'S/MIME selection' => static function (&$data) { $data['action']['props']['smime'] = ['sign' => true]; },
	'S/MIME class' => static function (&$data) { $data['action']['props']['message_class'] = 'IPM.Note.SMIME'; },
	'post-prepare body' => static function (&$data) { $data['action']['props']['body'] = ''; },
	'post-prepare recipients' => static function (&$data) { $data['action']['recipients'] = ['add' => [['email' => 'other@example.test']]]; },
	'post-prepare attachments' => static function (&$data) { $data['action']['attachments'] = ['remove' => [1]]; },
	'invalid collection' => static function (&$data) { $data['action']['attachments'] = 'invalid'; },
	'invalid base64' => static function (&$data) { $data['action']['message_action']['pgp']['envelope'] = '%%%'; },
	'different signed body' => static function (&$data) { $data['action']['message_action']['pgp']['envelope'] = base64_encode(PgpMime::signed("Content-Type: text/plain\r\n\r\nchanged", 'signature', 'pgp-sha256')); },
	'wrong envelope mode' => static function (&$data) { $data['action']['message_action']['pgp']['envelope'] = base64_encode(PgpMime::encrypted('cipher')); },
] as $label => $mutate) {
	$changed = $data; $mutate($changed); transportRejects(fn () => accept($plugin, $changed), $label);
}
$GLOBALS['draft']->props[PR_CHANGE_KEY] = 'new revision';
transportRejects(fn () => accept($plugin, $data), 'Stale saved-draft revision rejected');
$GLOBALS['draft']->props[PR_CHANGE_KEY] = 'revision1';
EncryptionStore::$race = true;
transportRejects(fn () => accept($plugin, $data), 'Another request wins atomic claim', 'already been used');
EncryptionStore::$race = false;
foreach ([
	'body mutation' => static function ($copy) { $copy->props[PR_BODY] .= '!'; },
	'attachment mutation' => static function ($copy) { $copy->attachments[] = attachment(); },
	'Bcc changed to To' => static function ($copy) { $copy->recipients[1][PR_RECIPIENT_TYPE] = MAPI_TO; },
	'From mutation' => static function ($copy) { $copy->props[PR_SENT_REPRESENTING_SMTP_ADDRESS] = 'other@example.test'; },
] as $label => $mutate) {
	$plugin = new Pluginpgp(); [$data] = preparation($plugin); accept($plugin, $data);
	$copy = unserialize(serialize($GLOBALS['draft'])); $mutate($copy);
	transportRejects(fn () => $plugin->protect($GLOBALS['store'], $copy), $label);
	transportCheck($copy->saves === 0 && isset($copy->props[PR_BODY]), 'Changed final content is rejected before replacement');
}
$plugin = new Pluginpgp(); $message = fixture(); $message->attachments = [9 => attachment(str_repeat('A', 20000)), 3 => attachment('other')];
$before = digest($plugin, $message); $copy = unserialize(serialize($message)); $copy->attachments = array_reverse(array_values($copy->attachments));
transportCheck(digest($plugin, $copy) === $before, 'Digest ignores copied attachment numbers and enumeration order');
$copy->attachments[1]->props[PR_ATTACH_DATA_BIN][18000] = 'B';
transportCheck(digest($plugin, $copy) !== $before, 'Digest reads bytes beyond GetProps truncation');
$embedded = attachment(); $embedded->props[PR_ATTACH_METHOD] = ATTACH_EMBEDDED_MSG; $embedded->embedded = fixture(); $message->attachments = [$embedded];
$before = digest($plugin, $message); $embedded->embedded->props[PR_BODY] .= 'change';
transportCheck(digest($plugin, $message) !== $before, 'Digest binds embedded-message bodies');
$before = digest($plugin, $message); $embedded->embedded->props[PR_SENT_REPRESENTING_SMTP_ADDRESS] = 'changed@example.test';
transportCheck(digest($plugin, $message) !== $before, 'Digest binds embedded From headers');
$before = digest($plugin, $message); $embedded->embedded->recipients[1][PR_RECIPIENT_TYPE] = MAPI_TO;
transportCheck(digest($plugin, $message) !== $before, 'Digest binds embedded recipient visibility');
$before = digest($plugin, $message); $copy = unserialize(serialize($message)); $copy->embedded = null; $copy->attachments[0]->embedded->props[PR_CHANGE_KEY] = 'copy-generated change key'; $copy->attachments[0]->embedded->recipients = array_reverse($copy->attachments[0]->embedded->recipients);
transportCheck(digest($plugin, $copy) === $before, 'Embedded digest survives generated changes and recipient enumeration order');
$embedded->embedded = $message;
transportRejects(fn () => digest($plugin, $message), 'Embedded depth limit');
$message = fixture(); $embedded = attachment(); $embedded->props[PR_ATTACH_METHOD] = ATTACH_EMBEDDED_MSG; $embedded->embedded = fixture(); $embedded->embedded->attachments = array_fill(0, 600, attachment('')); $message->attachments = [$embedded, $embedded];
transportRejects(fn () => digest($plugin, $message), 'Global attachment limit includes nested messages');
$message = fixture(); $message->attachments = [attachment(str_repeat('A', 600000)), attachment(str_repeat('B', 600000))];
transportRejects(fn () => digest($plugin, $message), 'Cumulative message size limit');
foreach (['getprops', 'openstream', 'stat', 'truncated', 'attachment_table', 'attachment_rows', 'openattach'] as $fault) {
	$message = fixture(); $message->attachments = [attachment()]; $message->faults[$fault] = true;
	transportRejects(fn () => digest($plugin, $message), 'Digest read failure ' . $fault);
}
foreach (['createattach', 'deleteattach', 'deleteprops', 'save', 'new_attachment' => 'shortwrite'] as $key => $fault) {
	$plugin = new Pluginpgp(); $draft = fixture(); $draft->attachments = [attachment()]; [$data] = preparation($plugin, $draft); accept($plugin, $data);
	$copy = unserialize(serialize($draft));
	if ($key === 'new_attachment') { $copy->faults['new_attachment'] = [$fault => true]; } else { $copy->faults[$fault] = true; }
	transportRejects(fn () => $plugin->protect($GLOBALS['store'], $copy), 'Outgoing MAPI fault ' . $fault);
	transportCheck($copy->saves === 0, 'Failure never saves a partial outgoing protected message');
}
foreach (['openstream', 'commit', 'save', 'setprops'] as $fault) {
	$plugin = new Pluginpgp(); [$data] = preparation($plugin); accept($plugin, $data);
	$copy = unserialize(serialize($GLOBALS['draft'])); $copy->faults['new_attachment'] = [$fault => true];
	transportRejects(fn () => $plugin->protect($GLOBALS['store'], $copy), 'Outgoing attachment write fault ' . $fault);
	transportCheck($copy->saves === 0, 'Attachment failure never saves a partial protected message');
}
$plugin = new Pluginpgp(); [$data] = preparation($plugin); accept($plugin, $data); $GLOBALS['bad_converter'] = true;
transportRejects(fn () => $plugin->protect($GLOBALS['store'], $GLOBALS['draft']), 'Unsupported converter rejected before mutation');
transportCheck(isset($GLOBALS['draft']->props[PR_BODY]) && $GLOBALS['draft']->saves === 0, 'Converter probe is isolated from real draft');
$GLOBALS['bad_converter'] = false;

$deletesBefore = $GLOBALS['deleteprops'] ?? 0;
foreach (['signed', 'encrypted', 'inline', 'inline_long', 'class_inline_long', 'inline_long_fault', 'ordinary', 'smime', 'extra', 'broken', 'streamfault'] as $case) {
	$plugin = new Pluginpgp(); $message = fixture(false, false); $message->props[PR_HTML] = '<p>forged preview</p>'; $message->props[PR_MESSAGE_FLAGS] = 0;
	$envelope = $case === 'signed' ? PgpMime::signed("Content-Type: text/plain\r\n\r\nExact signed body", 'signature', 'pgp-sha256') : PgpMime::encrypted('ciphertext');
	$isInline = str_contains($case, 'inline');
	if ($isInline) {
		$message->props[PR_BODY] = "-----BEGIN PGP MESSAGE-----\r\n" . ($case === 'inline' ? 'opaque' : str_repeat('a', 12000)) . "\r\n-----END PGP MESSAGE-----";
		if ($case === 'class_inline_long' || $case === 'inline_long_fault') { $message->props[PR_MESSAGE_CLASS] = 'IPM.Note.GpgOL.PGPMessage'; }
		if ($case === 'inline_long_fault') { $message->faults['truncated'] = true; }
	}
	elseif ($case === 'smime') { $message->props[PR_MESSAGE_CLASS] = 'IPM.Note.SMIME'; }
	elseif ($case !== 'ordinary') {
		$message->props[PR_MESSAGE_CLASS] = $case === 'signed' ? 'IPM.Note.SMIME.MultipartSigned' : 'IPM.Note.GpgOL.MultipartEncrypted';
		$item = attachment($case === 'broken' ? 'malformed' : $envelope); $item->props[PR_ATTACH_MIME_TAG] = $case === 'signed' ? 'multipart/signed' : 'multipart/encrypted'; $message->attachments = [$item];
		if ($case === 'extra') { $message->attachments[] = attachment('unprotected'); }
		if ($case === 'streamfault') { $item->faults['truncated'] = true; }
	}
	$incomingBody = $message->props[PR_BODY];
	$event = ['message' => $message, 'handled' => false]; $plugin->open($event);
	if (in_array($case, ['ordinary', 'smime'], true)) { transportCheck(!$event['handled'] && isset($message->props[PR_BODY]), 'Unrelated ' . $case . ' stays with its parser'); continue; }
	transportCheck($event['handled'] && isset($message->props[PR_BODY], $message->props[PR_HTML]) && $message->saves === 0, 'Incoming ' . $case . ' leaves the stored message untouched');
	$opened = ['message' => $message, 'data' => ['item' => ['props' => ['smime' => ['stale' => true], 'body' => 'stored preview', 'html_body' => '<p>forged preview</p>', 'isHTML' => true], 'attachments' => ['item' => [['old' => true]]]]]];
	$plugin->execute('server.module.itemmodule.open.after', $opened); $status = $opened['data']['item']['props']['pgp'];
	$failed = in_array($case, ['extra', 'broken', 'streamfault', 'inline_long_fault'], true);
	transportCheck($status['error'] === $failed && $status['pending'] !== $failed && !$status['decrypted'] && !$status['signature_valid'] && !$status['signer_trusted'], 'Server never asserts private crypto success for ' . $case);
	transportCheck(!isset($opened['data']['item']['props']['smime']) && $opened['data']['item']['attachments']['item'] === ($isInline && !$failed ? [['old' => true]] : []), 'Browser-local attachment status replaces stale S/MIME for ' . $case);
	transportCheck($opened['data']['item']['props']['body'] === '' && $opened['data']['item']['props']['html_body'] === '' && $opened['data']['item']['props']['isHTML'] === false, 'Stored preview never reaches the browser for ' . $case);
	if (!$failed) { transportCheck(base64_decode($status['mime']) === ($isInline ? $incomingBody : $envelope), 'Exact incoming ' . $case . ' bytes reach browser'); }
}
// Without a preserved envelope the message renders as stored; the status is advisory only.
foreach (['headers_only', 'hint_only', 'hint_encrypted'] as $case) {
	$plugin = new Pluginpgp(); $message = fixture(false, false); $message->props[PR_MESSAGE_FLAGS] = 0;
	if ($case === 'headers_only') { $message->props[PR_TRANSPORT_MESSAGE_HEADERS] = "Content-Type: multipart/signed; protocol=\"application/pgp-signature\"; boundary=\"legacy\"\r\n\r\n"; }
	else { $message->props[PR_MESSAGE_CLASS] = $case === 'hint_only' ? 'IPM.Note.GpgOL.MultipartSigned' : 'IPM.Note.GpgOL.MultipartEncrypted'; }
	$legacy = attachment("-----BEGIN PGP SIGNATURE-----\r\nlegacy\r\n-----END PGP SIGNATURE-----\r\n"); $legacy->props[PR_ATTACH_MIME_TAG] = 'application/pgp-signature';
	$version = attachment('Version: 1'); $version->props[PR_ATTACH_MIME_TAG] = 'application/pgp-encrypted';
	$message->attachments = $case === 'hint_encrypted' ? [$version, $legacy] : [$legacy];
	$event = ['message' => $message, 'handled' => false]; $plugin->open($event);
	transportCheck(!$event['handled'] && isset($message->props[PR_BODY]), 'Legacy ' . $case . ' layout stays with the normal renderer');
	$opened = ['message' => $message, 'data' => ['item' => ['props' => ['body' => 'Signed text', 'isHTML' => false], 'attachments' => ['item' => [['old' => true]]]]]];
	$plugin->execute('server.module.itemmodule.open.after', $opened); $status = $opened['data']['item']['props']['pgp'];
	transportCheck($status['unverifiable'] === true && !$status['pending'] && !$status['error'] && $status['mime'] === '' && $status['signed'] === ($case !== 'hint_encrypted') && $status['encrypted'] === ($case === 'hint_encrypted'), 'Legacy ' . $case . ' reports an advisory status');
	transportCheck($opened['data']['item']['props']['body'] === 'Signed text' && $opened['data']['item']['attachments']['item'] === [['old' => true]], 'Legacy ' . $case . ' keeps body and attachments');
}
// Drafts, other item types and users who switched the plugin off are never touched.
$envelope = PgpMime::signed("Content-Type: text/plain\r\n\r\nExact signed body", 'signature', 'pgp-sha256');
foreach (['draft', 'note', 'meeting', 'bad_sender', 'user_off', 'user_on'] as $case) {
	$plugin = new Pluginpgp(); $message = fixture(false, false); $message->props[PR_MESSAGE_FLAGS] = $case === 'draft' ? MSGFLAG_UNSENT : 0;
	if ($case === 'draft' || $case === 'note') {
		$message->props[PR_BODY] = "-----BEGIN PGP MESSAGE-----\r\nopaque\r\n-----END PGP MESSAGE-----";
		if ($case === 'note') { $message->props[PR_MESSAGE_CLASS] = 'IPM.StickyNote'; }
	}
	else {
		// The patched converter keeps the transport headers on every class it imports.
		$message->props[PR_MESSAGE_CLASS] = $case === 'meeting' ? 'IPM.Schedule.Meeting.Request' : 'IPM.Note.SMIME.MultipartSigned';
		$message->props[PR_TRANSPORT_MESSAGE_HEADERS] = "Content-Type: multipart/signed; protocol=\"application/pgp-signature\"; boundary=\"b\"\r\n\r\n";
		$item = attachment($envelope); $item->props[PR_ATTACH_MIME_TAG] = 'multipart/signed'; $message->attachments = [$item];
	}
	if ($case === 'bad_sender') { $message->props[PR_SENT_REPRESENTING_SMTP_ADDRESS] = 'not an address'; }
	$GLOBALS['settings']->values['zarafa/v1/plugins/pgp/enable'] = $case === 'user_on';
	$event = ['message' => $message, 'handled' => false];
	if (str_starts_with($case, 'user_')) { $plugin->execute('server.util.parse_secure.before', $event); } else { $plugin->open($event); }
	$opened = ['message' => $message, 'data' => ['item' => ['props' => ['body' => 'stored'], 'attachments' => ['item' => [['old' => true]]]]]];
	$plugin->execute('server.module.itemmodule.open.after', $opened);
	$expectHandled = in_array($case, ['bad_sender', 'user_on'], true);
	transportCheck($event['handled'] === $expectHandled && isset($opened['data']['item']['props']['pgp']) === $expectHandled && isset($message->props[PR_BODY]), 'Case ' . $case . ' is ' . ($expectHandled ? 'decoded in the browser' : 'left alone'));
	if ($case === 'bad_sender') { transportCheck($opened['data']['item']['props']['pgp']['sender'] === '' && $opened['data']['item']['props']['pgp']['pending'], 'A malformed From address does not fail the open'); }
}
unset($GLOBALS['settings']->values['zarafa/v1/plugins/pgp/enable']);
transportCheck(($GLOBALS['deleteprops'] ?? 0) === $deletesBefore, 'Opening never deletes properties on the stored message');
$module = new PluginPgpModule();
foreach (['passphrase', 'password', 'unlocked_key', 'private_key'] as $field) {
	transportRejects(fn () => $module->request(['operation' => 'list', $field => 'never accepted']), 'Forbidden endpoint secret field ' . $field);
}
foreach (['generate', 'unlock', 'sign', 'decrypt', 'export', 'changePassphrase'] as $operation) {
	transportRejects(fn () => $module->request(['operation' => $operation]), 'No production private operation ' . $operation);
}
transportCheck($module->request(['operation' => 'list'])['unlock_ttl'] === 3600, 'Browser unlock TTL is clamped');
transportCheck(!isset($module->request(['operation' => 'list'])['keys'][0]['encrypted_private_key']), 'List endpoint omits protected private material');
transportCheck($module->request(['operation' => 'public'])['keys'] === [['public_key' => 'public armor']], 'Verifier public-bundle endpoint omits private material');
transportCheck(isset($module->request(['operation' => 'get', 'fingerprint' => PgpKeyStore::$keyFingerprint])['key']['encrypted_private_key']), 'Explicit get returns protected browser key');
transportRejects(fn () => $module->request(['operation' => 'delete', 'fingerprint' => PgpKeyStore::$keyFingerprint, 'deleteSecret' => 'true']), 'String truthiness cannot authorize private-key deletion');
transportRejects(fn () => $module->request(['operation' => 'trust', 'fingerprint' => PgpKeyStore::$keyFingerprint, 'email' => 'peer@example.test', 'trusted' => 1]), 'Trust requires explicit boolean');
transportRejects(fn () => $module->request(['operation' => 'put', 'key' => 'armor']), 'Put requires an explicit protected key record');
$module->data = ['request' => ['operation' => 'unlock']]; $module->execute();
transportCheck($module->responses[0]['success'] === false, 'Endpoint catches failure and returns failed request response');
PgpKeyStore::$enabled = false;
transportRejects(fn () => $module->request(['operation' => 'list']), 'Disabled plugin rejects endpoint');
transportCheck(!class_exists('Gpg', false), 'Server transport never loads GnuPG or performs private operations');
echo "OpenPGP browser transport: $assertions assertions passed\n";
