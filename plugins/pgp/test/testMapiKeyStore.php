<?php

/** Fault-injected mailbox persistence plus real OpenPGP packet fixtures. */
if (extension_loaded('mapi')) { fwrite(STDERR, "Run using php -n, without php-mapi.\n"); exit(2); }
define('PLUGIN_PGP_ENABLE', true);
define('PLUGIN_PGP_MAX_KEY_BYTES', 1048576);
foreach (['PR_ENTRYID' => 0x0fff0102, 'PR_MESSAGE_CLASS' => 0x001a001f, 'PR_SUBJECT' => 0x0037001f,
	'MAPI_ASSOCIATED' => 0x40, 'MAPI_CREATE' => 2, 'MAPI_MODIFY' => 1,
	'RES_PROPERTY' => 4, 'RELOP' => 0, 'RELOP_EQ' => 4, 'ULPROPTAG' => 1, 'VALUE' => 2] as $name => $value) { define($name, $value); }
define('IID_IStream', 'stream');
class KeyTestStore {
	public array $saved = [];
	public int $next = 1;
	public array $faults = [];
	public int $saves = 0;
}
class KeyTestMessage {
	public array $props;
	public function __construct(public KeyTestStore $store, public string $id, public bool $associated, array $props = []) {
		$this->props = $props + [PR_ENTRYID => $id];
	}
}
class KeyTestStream {
	public int $offset = 0;
	public string $value;
	public function __construct(public KeyTestMessage $message, public int $tag) { $this->value = $message->props[$tag] ?? ''; }
}
function getPropIdsFromStrings($store, array $names): array {
	$result = [];
	$index = 0x8001;
	foreach ($names as $name => $definition) {
		$type = explode(':', $definition)[0];
		$result[$name] = ($index++ << 16) | ['PT_LONG' => 3, 'PT_STRING8' => 30, 'PT_BOOLEAN' => 11, 'PT_BINARY' => 258][$type];
	}
	return $result;
}
function mapi_msgstore_openentry($store, $id = null) {
	if ($id === null) { return $store; }
	if (isset($store->faults['open']) || !isset($store->saved[$id])) { return false; }
	$record = $store->saved[$id];
	return new KeyTestMessage($store, $id, $record['associated'], $record['props']);
}
function mapi_folder_getcontentstable($root, $flags = 0) {
	if (isset($root->faults['table'])) { return false; }
	return [$root, $flags];
}
function mapi_table_queryallrows($table, $columns, $restriction = null) {
	[$store, $flags] = $table;
	if (isset($store->faults['query'])) { return false; }
	$rows = [];
	foreach ($store->saved as $record) {
		if ($record['associated'] !== ($flags === MAPI_ASSOCIATED)) { continue; }
		if ($restriction !== null && ($record['props'][PR_MESSAGE_CLASS] ?? null) !== $restriction[1][VALUE][PR_MESSAGE_CLASS]) { continue; }
		$rows[] = array_intersect_key($record['props'], array_flip($columns));
	}
	return $rows;
}
function mapi_folder_createmessage($root, $flags = 0) {
	return isset($root->faults['create']) ? false : new KeyTestMessage($root, 'id-' . $root->next++, $flags === MAPI_ASSOCIATED);
}
function mapi_getprops($message, $tags) {
	return isset($message->store->faults['getprops']) ? false : array_intersect_key($message->props, array_flip($tags));
}
function mapi_setprops($message, $props) {
	if (isset($message->store->faults['setprops'])) { return false; }
	$message->props = array_replace($message->props, $props);
	return true;
}
function mapi_savechanges($message) {
	if (isset($message->store->faults['save'])) { return false; }
	++$message->store->saves;
	$message->store->saved[$message->id] = ['associated' => $message->associated, 'props' => $message->props];
	return true;
}
function mapi_folder_deletemessages($root, $ids) {
	if (isset($root->faults['delete'])) { return false; }
	foreach ($ids as $id) { unset($root->saved[$id]); }
	return true;
}
function mapi_openproperty($message, $tag, ...$args) {
	if (isset($message->store->faults['stream'])) { return false; }
	return new KeyTestStream($message, $tag);
}
function mapi_stream_stat($stream) { return ['cb' => $stream->message->store->faults['size'] ?? strlen($stream->value)]; }
function mapi_stream_read($stream, $count) {
	if (isset($stream->message->store->faults['truncated'])) { return ''; }
	$result = substr($stream->value, $stream->offset, $count);
	$stream->offset += strlen($result);
	return $result;
}
function mapi_stream_setsize($stream, $size) { $stream->value = substr($stream->value, 0, $size); return true; }
function mapi_stream_write($stream, $value) { $stream->value = $value; return strlen($value) - (int) isset($stream->message->store->faults['shortwrite']); }
function mapi_stream_commit($stream) {
	if (isset($stream->message->store->faults['commit'])) { return false; }
	$stream->message->props[$stream->tag] = $stream->value;
	return true;
}
require_once __DIR__ . '/../php/class.pgpkeystore.php';
require_once __DIR__ . '/oracle/Gpg.php'; // Test fixture generator only, never required by MAPI storage.
$assertions = 0;
function keyCheck(bool $condition, string $message): void {
	global $assertions;
	++$assertions;
	if (!$condition) { throw new RuntimeException('FAIL: ' . $message); }
}
function keyRejects(callable $operation, string $message): void {
	try { $operation(); } catch (RuntimeException | InvalidArgumentException $error) { keyCheck(true, $message); return; }
	keyCheck(false, $message);
}
function keyCleanup(string $path): void {
	foreach (new FilesystemIterator($path, FilesystemIterator::SKIP_DOTS) as $entry) {
		if ($entry->isDir() && !$entry->isLink()) { keyCleanup($entry->getPathname()); }
		else { unlink($entry->getPathname()); }
	}
	rmdir($path);
}
function keyArmor(string $binary, bool $private = false): string {
	$kind = $private ? 'PRIVATE' : 'PUBLIC';
	return '-----BEGIN PGP ' . $kind . " KEY BLOCK-----\n\n" . chunk_split(base64_encode($binary), 64, "\n") . '-----END PGP ' . $kind . " KEY BLOCK-----\n";
}
$temp = sys_get_temp_dir() . '/pgp-mapi-key-' . bin2hex(random_bytes(6));
try {
	$gpg = new Gpg($temp, $argv[1] ?? '/usr/bin/gpg');
	$generated = $gpg->generateKey('MAPI Keys', 'keys@example.test', 'fixture passphrase only', 'curve25519', '1y');
	$fingerprint = $generated['fingerprint'];
	$public = $gpg->exportKey($fingerprint);
	$private = $gpg->exportKey($fingerprint, true, 'fixture passphrase only');
	keyCheck(PgpKeyMaterial::inspect($public, false, 1048576)['fingerprint'] === $fingerprint, 'server computes v4 fingerprint from real public armor');
	keyCheck(PgpKeyMaterial::inspect($private, true, 1048576)['fingerprint'] === $fingerprint, 'encrypted private primary fingerprint matches public key');
	keyRejects(fn () => PgpKeyMaterial::inspect($private, false, 1048576), 'private armor cannot be uploaded as a public key');
	keyRejects(fn () => PgpKeyMaterial::inspect($public . $public, false, 1048576), 'concatenated key blocks rejected');
	keyRejects(fn () => PgpKeyMaterial::inspect($public . 'unrelated suffix', false, 1048576), 'appended non-armor data rejected');
	keyRejects(fn () => PgpKeyMaterial::inspect($public, false, 10), 'oversized key armor rejected before MAPI');
	keyRejects(fn () => PgpKeyMaterial::inspect(keyArmor("\xc6\xff\x7f\xff\xff\xff"), false, 1048576), 'out-of-bounds packet lengths rejected');
	keyRejects(fn () => PgpKeyMaterial::inspect(keyArmor("\xcb\x01x"), false, 1048576), 'literal-data packets rejected');
	$raw = new ReflectionMethod(Gpg::class, 'run');
	$raw->invoke($gpg, ['--quick-generate-key', 'Unprotected <naked@example.test>', 'ed25519', 'cert,sign', '1y']);
	$naked = array_values(array_filter($gpg->listKeys(), static fn ($key) => $key['fingerprint'] !== $fingerprint))[0];
	$nakedPrivate = $raw->invoke($gpg, ['--armor', '--export-secret-keys', $naked['fingerprint']])['output'];
	keyRejects(fn () => PgpKeyMaterial::inspect($nakedPrivate, true, 1048576), 'unencrypted private packet rejected without decrypting it');
	$stub = $raw->invoke($gpg, ['--armor', '--export-secret-subkeys', $fingerprint], '', 'fixture passphrase only')['output'];
	keyCheck(str_contains($stub, 'PRIVATE KEY BLOCK') && PgpKeyMaterial::inspect($stub, true, 1048576)['fingerprint'] === $fingerprint, 'GnuPG offline-primary export with a GNU stub counts as protected material');
	// Synthetic version-6 public packet: storage parsing checks the RFC fingerprint
	// envelope, not whether an invented public point is a usable signing identity.
	$v6body = "\x06" . pack('N', 1700000000) . "\x1b" . pack('N', 32) . str_repeat('x', 32);
	$v6 = keyArmor("\xc6" . chr(strlen($v6body)) . $v6body);
	keyCheck(PgpKeyMaterial::inspect($v6, false, 1048576)['fingerprint'] === strtoupper(hash('sha256', "\x9b" . pack('N', strlen($v6body)) . $v6body)), 'RFC9580 v6 fingerprint uses SHA256 and 0x9b framing');
	$store = new KeyTestStore();
	$GLOBALS['mapisession'] = new class($store) {
		public function __construct(private $store) {}
		public function getDefaultMessageStore() { return $this->store; }
	};
	$keys = PgpKeyStore::current();
	keyCheck($keys->listKeys() === [], 'authenticated default mailbox starts with no keys');
	$other = new KeyTestStore();
	$otherKeys = new PgpKeyStore($other);
	$record = ['fingerprint' => $fingerprint, 'public_key' => $public, 'encrypted_private_key' => $private,
		'metadata' => $generated + ['passphrase' => 'MUST NOT STORE', 'private_key' => 'MUST NOT STORE']];
	$saved = $keys->importKey($record);
	keyCheck($saved['secret'] && $saved['fingerprint'] === $fingerprint && $saved['metadata_advisory'], 'saved record returns private-presence and explicit advisory metadata');
	keyCheck(!isset($saved['public_key']) && !isset($saved['encrypted_private_key']), 'list/import responses omit bulk public and private armor');
	keyCheck(!str_contains(serialize($store->saved), 'MUST NOT STORE') && !str_contains(serialize($store->saved), 'fixture passphrase only'), 'no passphrase or unknown metadata enters MAPI');
	$bloated = array_replace($record, ['metadata' => ['uids' => array_fill(0, 98, ['uid' => str_repeat('u', 620)])]]);
	keyRejects(fn () => $otherKeys->importKey($bloated), 'metadata that only fits before normalisation is rejected instead of stored unreadably');
	keyCheck(count($store->saved) === 1 && reset($store->saved)['associated'], 'key stored as root folder-associated information');
	$tags = getPropIdsFromStrings($store, PgpKeyStore::propertyNames());
	keyCheck(reset($store->saved)['props'][PR_MESSAGE_CLASS] === PgpKeyStore::KEY_CLASS, 'dedicated OpenPGP class never reuses S/MIME certificate class');
	keyCheck($keys->key($fingerprint)['encrypted_private_key'] === $private && $keys->key($fingerprint)['public_key'] === $public, 'explicit get retrieves exact encrypted and public armor');
	$publicBundle = $keys->publicKeys();
	keyCheck(count($publicBundle) === 1 && $publicBundle[0]['public_key'] === $public && !isset($publicBundle[0]['encrypted_private_key']), 'public verification bundle contains public armor only');
	$bulkStore = clone $store;
	$originalRecord = reset($store->saved);
	for ($i = 0; $i < 201; ++$i) { $bulkStore->saved['bulk-' . $i] = $originalRecord; }
	keyRejects(fn () => (new PgpKeyStore($bulkStore))->publicKeys(), 'oversized public bundle fails explicitly instead of silently truncating keys');
	keyCheck($otherKeys->listKeys() === [], 'a second mailbox cannot see stored keys');
	$v6Fingerprint = PgpKeyMaterial::inspect($v6, false, 1048576)['fingerprint'];
	$v6Record = $otherKeys->importKey(['fingerprint' => $v6Fingerprint, 'public_key' => $v6, 'metadata' => []]);
	keyCheck($v6Record['keyid'] === substr($v6Fingerprint, 0, 16), 'version6 displayed Key ID uses high64 fingerprint bits, not version4 low64');
	keyCheck(!$keys->trusted($fingerprint, 'keys@example.test'), 'import never establishes an email fingerprint trust pin');
	keyRejects(fn () => $keys->importKey($record), 'existing key update without revision rejected');
	keyRejects(fn () => $keys->importKey($record + ['revision' => str_repeat('0', 32)]), 'stale revision rejected');
	$publicUpdate = $record;
	unset($publicUpdate['encrypted_private_key']);
	$publicUpdate['revision'] = $saved['revision'];
	$updated = $keys->importKey($publicUpdate);
	keyCheck($updated['revision'] !== $saved['revision'] && $keys->key($fingerprint)['encrypted_private_key'] === $private, 'public-key refresh changes revision but preserves encrypted private key');
	keyRejects(fn () => $keys->importKey(array_replace($publicUpdate, ['revision' => $updated['revision'], 'encrypted_private_key' => ''])), 'empty private material cannot silently delete existing secret');
	keyRejects(fn () => $keys->importKey(array_replace($record, ['fingerprint' => str_repeat('A', 40)])), 'claimed fingerprint cannot differ from public packet');
	keyRejects(fn () => $keys->importKey(array_replace($record, ['encrypted_private_key' => $nakedPrivate])), 'unencrypted or mismatched secret never enters existing mailbox record');
	$keys->trust($fingerprint, 'KEYS@example.test', true);
	keyCheck($keys->trusted($fingerprint, 'keys@example.test') && $keys->recipientKey('KEYS@example.test') === $fingerprint, 'explicit trust binding round-trips with case-normalized address');
	keyRejects(fn () => $keys->trust($fingerprint, 'wrong@example.test', true), 'wrong metadata identity cannot be pinned');
	$keys->setServers([]);
	keyCheck((new PgpKeyStore($store))->servers() === [], 'keyserver choices persist in mailbox policy');
	keyRejects(fn () => $keys->setServers(['http://127.0.0.1']), 'arbitrary keyserver origin rejected');
	keyRejects(fn () => $keys->delete($fingerprint), 'private key deletion requires explicit flag');
	foreach (['query', 'stream', 'truncated'] as $fault) {
		$store->faults[$fault] = true;
		keyRejects(fn () => (new PgpKeyStore($store))->key($fingerprint), $fault . ' read failure never returns partial key material');
		unset($store->faults[$fault]);
	}
	foreach ([-1, 1048577] as $size) {
		$store->faults['size'] = $size;
		keyRejects(fn () => (new PgpKeyStore($store))->key($fingerprint), 'invalid stream size is bounded');
		unset($store->faults['size']);
	}
	foreach (['shortwrite', 'commit', 'setprops', 'save'] as $fault) {
		$before = $store->saved;
		$store->faults[$fault] = true;
		keyRejects(fn () => $keys->importKey(array_replace($publicUpdate, ['revision' => $updated['revision']])), $fault . ' write failure aborts key update');
		unset($store->faults[$fault]);
		keyCheck($before === $store->saved, $fault . ' leaves saved encrypted key data untouched');
	}
	// Two devices importing concurrently can leave two records for one fingerprint.
	$original = current(array_filter($store->saved, static fn ($entry) => ($entry['props'][PR_MESSAGE_CLASS] ?? null) === PgpKeyStore::KEY_CLASS));
	$store->saved['id-duplicate'] = ['associated' => true, 'props' => array_replace($original['props'], [PR_ENTRYID => 'id-duplicate'])];
	keyCheck(count($keys->listKeys()) === 1 && count($keys->publicKeys()) === 1 && $keys->key($fingerprint)['fingerprint'] === $fingerprint, 'duplicate key records resolve to one key instead of locking the keyring');
	$keys->delete($fingerprint, true);
	keyCheck(!isset($store->saved['id-duplicate']), 'deleting a key removes its duplicate records too');
	keyCheck($keys->listKeys() === [] && !$keys->trusted($fingerprint, 'keys@example.test'), 'explicit deletion removes only own key and its trust pins');
	keyCheck(count($store->saved) === 1 && reset($store->saved)['props'][PR_MESSAGE_CLASS] === PgpKeyStore::POLICY_CLASS, 'key deletion preserves separate associated policy');
	keyCheck(!str_contains(file_get_contents(__DIR__ . '/../php/class.pgpkeystore.php'), 'class.gpg.php') && !method_exists(PgpKeyStore::class, 'crypto'), 'production keystore has no GnuPG dependency or crypto operation');
	echo "OK: {$assertions} MAPI key-storage assertions\n";
}
finally {
	if (is_dir($temp)) {
		$agent = proc_open(['/usr/bin/gpgconf', '--homedir', $temp, '--kill', 'gpg-agent'], [0 => ['file', '/dev/null', 'r'], 1 => ['file', '/dev/null', 'w'], 2 => ['file', '/dev/null', 'w']], $pipes);
		if (is_resource($agent)) { proc_close($agent); }
		keyCleanup($temp);
	}
}
