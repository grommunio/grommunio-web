<?php

require_once __DIR__ . '/../config.php';
require_once __DIR__ . '/class.pgpkeymaterial.php';

/**
 * Mailbox-local public keys, encrypted private keys and explicit fingerprint pins.
 * No filesystem keyring, passphrase storage, decryption, or GnuPG execution.
 */
class PgpKeyStore {
	public const GUID = '{9ae1e2cd-14c9-4d51-a235-3a19ccff9d34}';
	public const KEY_CLASS = 'IPM.Configuration.Grommunio.OpenPGP.Key';
	public const POLICY_CLASS = 'IPM.Configuration.Grommunio.OpenPGP.Policy';
	private const SCHEMA = 1;
	private const MAX_KEYS = 200;
	private const MAX_JSON = 65536;
	private $store;
	private $root;
	private array $tags;
	private ?array $cachedPolicy = null;

	/** A store handle can be injected by trusted server code/tests, not HTTP input. */
	public function __construct($store = null) {
		$this->store = $store ?? $GLOBALS['mapisession']->getDefaultMessageStore();
		if (!$this->store || !($this->root = mapi_msgstore_openentry($this->store))) {
			throw new RuntimeException('Cannot open your mailbox OpenPGP key storage.');
		}
		$this->tags = getPropIdsFromStrings($this->store, self::propertyNames());
		if (count($this->tags) !== count(self::propertyNames()) || in_array(false, $this->tags, true)) {
			throw new RuntimeException('Cannot resolve the mailbox OpenPGP storage properties.');
		}
	}
	public static function current(): self {
		if (!PLUGIN_PGP_ENABLE) { throw new RuntimeException('The administrator has not enabled OpenPGP.'); }
		return new self($GLOBALS['mapisession']->getDefaultMessageStore());
	}
	public static function propertyNames(): array {
		$result = [];
		foreach (['schema' => ['PT_LONG', 'SchemaVersion'], 'fingerprint' => ['PT_STRING8', 'Fingerprint'],
			'public_key' => ['PT_BINARY', 'PublicKey'], 'encrypted_private_key' => ['PT_BINARY', 'EncryptedPrivateKey'],
			'has_private' => ['PT_BOOLEAN', 'HasPrivateKey'], 'metadata' => ['PT_BINARY', 'Metadata'],
			'revision' => ['PT_STRING8', 'Revision'], 'policy' => ['PT_BINARY', 'Policy']] as $name => [$type, $id]) {
			$result[$name] = $type . ':' . self::GUID . ':OpenPGP.' . $id;
		}
		return $result;
	}
	public static function fingerprint(string $value): string {
		if (!preg_match('/^(?:[A-Fa-f0-9]{40}|[A-Fa-f0-9]{64})$/D', $value)) {
			throw new InvalidArgumentException('Use the complete OpenPGP fingerprint (40 or 64 hexadecimal characters).');
		}
		return strtoupper($value);
	}
	public static function email(string $value): string {
		$value = strtolower(trim($value));
		if (!filter_var($value, FILTER_VALIDATE_EMAIL) || preg_match('/[\r\n\x00]/', $value)) {
			throw new InvalidArgumentException('A valid SMTP email address is required for OpenPGP.');
		}
		return $value;
	}
	/** Advisory metadata only: certification/identity checks run in the browser. */
	public static function hasUid(array $key, string $email): bool {
		foreach ($key['uids'] ?? [] as $uid) {
			if (strtolower($uid['email'] ?? '') === strtolower($email) && !in_array($uid['validity'] ?? '', ['r', 'e', 'd', 'i'], true)) { return true; }
		}
		return false;
	}
	public function listKeys(bool $includeMaterial = false): array {
		$seen = [];
		$keys = [];
		foreach ($this->rows(self::KEY_CLASS) as $row) {
			$fingerprint = self::fingerprint($row[$this->tags['fingerprint']] ?? '');
			// Two devices can race the same import; the first record wins, delete() removes all.
			if (isset($seen[$fingerprint])) { continue; }
			$seen[$fingerprint] = true;
			$keys[] = $this->readKey($row, $includeMaterial);
		}
		return $keys;
	}
	public function key(string $fingerprint, bool $includeMaterial = true): array {
		$row = $this->findKey(self::fingerprint($fingerprint));
		if ($row === null) { throw new RuntimeException('The requested OpenPGP key is not stored in your mailbox.'); }
		return $this->readKey($row, $includeMaterial);
	}
	/** Bounded browser verification/recipient bundle, never private armor. */
	public function publicKeys(): array {
		$rows = $this->rows(self::KEY_CLASS);
		if (count($rows) > self::MAX_KEYS) { throw new RuntimeException('Too many OpenPGP public keys are stored to load the verification bundle. Remove unused keys.'); }
		$keys = [];
		foreach ($rows as $row) {
			$fingerprint = self::fingerprint($row[$this->tags['fingerprint']] ?? '');
			if (isset($keys[$fingerprint])) { continue; }
			$keys[$fingerprint] = $this->readKey($row, true, false);
		}
		return array_values($keys);
	}

	/** Existing records require their last revision; omitted private armor is preserved. */
	public function importKey(array $record): array {
		$fingerprint = self::fingerprint($record['fingerprint'] ?? '');
		$public = $record['public_key'] ?? null;
		if (!is_string($public)) { throw new InvalidArgumentException('An armored OpenPGP public key is required.'); }
		$info = PgpKeyMaterial::inspect($public, false, PLUGIN_PGP_MAX_KEY_BYTES);
		if ($info['fingerprint'] !== $fingerprint) { throw new InvalidArgumentException('The public key does not match its full fingerprint.'); }
		$private = $record['encrypted_private_key'] ?? null;
		if (array_key_exists('encrypted_private_key', $record)) {
			if (!is_string($private) || $private === '') { throw new InvalidArgumentException('Omit private key material to preserve it, or supply an encrypted private key.'); }
			if (PgpKeyMaterial::inspect($private, true, PLUGIN_PGP_MAX_KEY_BYTES)['fingerprint'] !== $fingerprint) {
				throw new InvalidArgumentException('The encrypted private key does not match the public key fingerprint.');
			}
		}
		$metadata = $this->metadata($record['metadata'] ?? []);
		foreach (['created', 'version', 'algorithm'] as $field) { $metadata[$field] = $info[$field]; }
		$metadata['keyid'] = strlen($fingerprint) === 64 ? substr($fingerprint, 0, 16) : substr($fingerprint, -16);
		$row = $this->findKey($fingerprint);
		if ($row === null) {
			if (!empty($record['revision'])) { throw new RuntimeException('This OpenPGP key was deleted or changed. Reload the key list before saving.'); }
			if (count($this->rows(self::KEY_CLASS)) >= self::MAX_KEYS) { throw new RuntimeException('The mailbox OpenPGP key limit has been reached.'); }
			$message = mapi_folder_createmessage($this->root, MAPI_ASSOCIATED);
			$hasPrivate = $private !== null;
		}
		else {
			if (!is_string($record['revision'] ?? null) || !hash_equals($row[$this->tags['revision']] ?? '', $record['revision'])) {
				throw new RuntimeException('This OpenPGP key changed. Reload it before importing an update.');
			}
			$message = $this->openRow($row, self::KEY_CLASS);
			$existing = mapi_getprops($message, [$this->tags['has_private']]);
			if (!is_array($existing)) { throw new RuntimeException('Cannot read the stored OpenPGP key state.'); }
			$hasPrivate = $private !== null || !empty($existing[$this->tags['has_private']]);
		}
		if (!$message) { throw new RuntimeException('Cannot create the mailbox OpenPGP key record.'); }
		// Bound the stored form: readBlob() refuses anything larger for good.
		$encodedMetadata = json_encode($metadata, JSON_THROW_ON_ERROR);
		if (strlen($encodedMetadata) > self::MAX_JSON) { throw new InvalidArgumentException('OpenPGP key metadata is too large.'); }
		$this->writeBlob($message, $this->tags['public_key'], $public);
		if ($private !== null) { $this->writeBlob($message, $this->tags['encrypted_private_key'], $private); }
		$this->writeBlob($message, $this->tags['metadata'], $encodedMetadata);
		if (mapi_setprops($message, [PR_MESSAGE_CLASS => self::KEY_CLASS, PR_SUBJECT => 'OpenPGP ' . $fingerprint,
			$this->tags['schema'] => self::SCHEMA, $this->tags['fingerprint'] => $fingerprint,
			$this->tags['has_private'] => $hasPrivate, $this->tags['revision'] => bin2hex(random_bytes(16))]) === false ||
			mapi_savechanges($message) === false) {
			throw new RuntimeException('Cannot save the mailbox OpenPGP key record.');
		}
		return $this->key($fingerprint, false);
	}
	public function delete(string $fingerprint, bool $secret = false): void {
		$fingerprint = self::fingerprint($fingerprint);
		$rows = array_values(array_filter($this->rows(self::KEY_CLASS), fn ($row) => ($row[$this->tags['fingerprint']] ?? null) === $fingerprint));
		if ($rows === []) { throw new RuntimeException('The requested OpenPGP key is not stored in your mailbox.'); }
		// Deletion must work even when the record's metadata can no longer be read.
		$stored = mapi_getprops($this->openRow($rows[0], self::KEY_CLASS), [$this->tags['has_private']]);
		if (!is_array($stored)) { throw new RuntimeException('Cannot read the stored OpenPGP key state.'); }
		if (!empty($stored[$this->tags['has_private']]) && !$secret) {
			throw new InvalidArgumentException('Explicit confirmation is required to delete an encrypted private key.');
		}
		// Remove trust first: failure cannot leave a trusted-but-deleted key.
		$policy = $this->policy();
		$policy['trusted'] = array_filter($policy['trusted'], static fn ($value) => $value !== $fingerprint);
		$this->savePolicy($policy);
		if (mapi_folder_deletemessages($this->root, array_column($rows, PR_ENTRYID)) === false) {
			throw new RuntimeException('Cannot delete the mailbox OpenPGP key record.');
		}
	}
	public function trust(string $fingerprint, string $email, bool $trusted): void {
		$fingerprint = self::fingerprint($fingerprint);
		$email = self::email($email);
		$key = $this->key($fingerprint, false);
		if ($trusted && (!self::hasUid($key, $email) || !empty($key['revoked']) || !empty($key['expired']) || !empty($key['disabled']))) {
			throw new InvalidArgumentException('Verify a usable key with a user ID matching this email address in the browser first.');
		}
		$policy = $this->policy();
		if ($trusted) { $policy['trusted'][$email] = $fingerprint; }
		elseif (($policy['trusted'][$email] ?? null) === $fingerprint) { unset($policy['trusted'][$email]); }
		$this->savePolicy($policy);
	}
	public function trusted(string $fingerprint, string $email): bool {
		return ($this->policy()['trusted'][self::email($email)] ?? null) === self::fingerprint($fingerprint);
	}
	public function recipientKey(string $email): string {
		$email = self::email($email);
		$fingerprint = $this->policy()['trusted'][$email] ?? '';
		if ($fingerprint === '') { throw new RuntimeException('No verified OpenPGP fingerprint for ' . $email . '.'); }
		$this->key($fingerprint, false);
		return $fingerprint;
	}
	public function servers(): array {
		return array_values(array_intersect($this->policy()['keyservers'], PLUGIN_PGP_KEYSERVER_ALLOWLIST));
	}
	public function setServers(array $servers): void {
		if (count($servers) > 10) { throw new InvalidArgumentException('At most ten keyservers can be configured.'); }
		foreach ($servers as $server) {
			if (!is_string($server) || !in_array($server, PLUGIN_PGP_KEYSERVER_ALLOWLIST, true)) {
				throw new InvalidArgumentException('This keyserver is not in the administrator HTTPS allowlist.');
			}
		}
		$policy = $this->policy();
		$policy['keyservers'] = array_values(array_unique($servers));
		$this->savePolicy($policy);
	}

	private function rows(string $class): array {
		$table = mapi_folder_getcontentstable($this->root, MAPI_ASSOCIATED);
		if (!$table) { throw new RuntimeException('Your mailbox does not support associated OpenPGP key storage.'); }
		$restriction = [RES_PROPERTY, [RELOP => RELOP_EQ, ULPROPTAG => PR_MESSAGE_CLASS, VALUE => [PR_MESSAGE_CLASS => $class]]];
		$rows = mapi_table_queryallrows($table, [PR_ENTRYID, PR_MESSAGE_CLASS, $this->tags['fingerprint'], $this->tags['revision']], $restriction);
		if (!is_array($rows) || count($rows) > self::MAX_KEYS) { throw new RuntimeException('Cannot safely enumerate mailbox OpenPGP records.'); }
		foreach ($rows as $row) {
			if (($row[PR_MESSAGE_CLASS] ?? null) !== $class || !is_string($row[PR_ENTRYID] ?? null) || $row[PR_ENTRYID] === '') {
				throw new RuntimeException('Invalid mailbox OpenPGP record.');
			}
		}
		return $rows;
	}
	private function findKey(string $fingerprint): ?array {
		foreach ($this->rows(self::KEY_CLASS) as $row) {
			if (($row[$this->tags['fingerprint']] ?? null) === $fingerprint) { return $row; }
		}
		return null;
	}
	private function openRow(array $row, string $class) {
		$message = mapi_msgstore_openentry($this->store, $row[PR_ENTRYID]);
		$props = $message ? mapi_getprops($message, [PR_MESSAGE_CLASS, $this->tags['schema']]) : false;
		if (!is_array($props) || ($props[PR_MESSAGE_CLASS] ?? null) !== $class || ($props[$this->tags['schema']] ?? null) !== self::SCHEMA) {
			throw new RuntimeException('Unsupported or invalid mailbox OpenPGP storage record.');
		}
		return $message;
	}
	private function readKey(array $row, bool $includeMaterial, bool $includePrivate = true): array {
		$message = $this->openRow($row, self::KEY_CLASS);
		$props = mapi_getprops($message, [$this->tags['fingerprint'], $this->tags['revision'], $this->tags['has_private']]);
		if (!is_array($props)) { throw new RuntimeException('Cannot read the mailbox OpenPGP key record.'); }
		$metadata = $this->metadata(json_decode($this->readBlob($message, $this->tags['metadata'], self::MAX_JSON), true, 32, JSON_THROW_ON_ERROR));
		$fingerprint = self::fingerprint($props[$this->tags['fingerprint']] ?? '');
		$revision = $props[$this->tags['revision']] ?? '';
		if (!is_string($revision) || !preg_match('/^[a-f0-9]{32}$/D', $revision)) { throw new RuntimeException('Invalid mailbox OpenPGP record revision.'); }
		$key = $metadata;
		$key['metadata'] = $metadata;
		$key['metadata_advisory'] = true;
		$key['fingerprint'] = $fingerprint;
		$key['keyid'] = strlen($fingerprint) === 64 ? substr($fingerprint, 0, 16) : substr($fingerprint, -16);
		$key['secret'] = !empty($props[$this->tags['has_private']]);
		$key['revision'] = $revision;
		$key['trusted_emails'] = array_keys(array_filter($this->policy()['trusted'], static fn ($value) => $value === $fingerprint));
		$key['trusted'] = $key['trusted_emails'] !== [];
		if ($includeMaterial) {
			$key['public_key'] = $this->readBlob($message, $this->tags['public_key'], PLUGIN_PGP_MAX_KEY_BYTES);
			if (PgpKeyMaterial::inspect($key['public_key'], false, PLUGIN_PGP_MAX_KEY_BYTES)['fingerprint'] !== $fingerprint) {
				throw new RuntimeException('Stored public key fingerprint mismatch.');
			}
			if ($key['secret'] && $includePrivate) {
				$key['encrypted_private_key'] = $this->readBlob($message, $this->tags['encrypted_private_key'], PLUGIN_PGP_MAX_KEY_BYTES);
				if (PgpKeyMaterial::inspect($key['encrypted_private_key'], true, PLUGIN_PGP_MAX_KEY_BYTES)['fingerprint'] !== $fingerprint) {
					throw new RuntimeException('Stored encrypted private key fingerprint mismatch.');
				}
			}
		}
		return $key;
	}
	private function metadata(array $metadata): array {
		if (strlen(json_encode($metadata, JSON_THROW_ON_ERROR)) > self::MAX_JSON) { throw new InvalidArgumentException('OpenPGP key metadata is too large.'); }
		$result = [];
		foreach (['keyid', 'algorithm', 'algorithm_name', 'bits', 'curve', 'created', 'expires', 'validity', 'capabilities', 'version'] as $field) {
			if (isset($metadata[$field]) && (is_string($metadata[$field]) || is_int($metadata[$field]))) { $result[$field] = $metadata[$field]; }
		}
		foreach (['revoked', 'expired', 'disabled', 'can_encrypt', 'can_sign'] as $field) { $result[$field] = !empty($metadata[$field]); }
		$result['uids'] = [];
		if ((isset($metadata['uids']) && !is_array($metadata['uids'])) || count($metadata['uids'] ?? []) > 100) {
			throw new InvalidArgumentException('Invalid OpenPGP user ID metadata.');
		}
		foreach ($metadata['uids'] ?? [] as $uid) {
			if (!is_array($uid)) { throw new InvalidArgumentException('Invalid OpenPGP user ID metadata.'); }
			$clean = [];
			foreach (['uid', 'name', 'email', 'validity'] as $field) {
				$value = $uid[$field] ?? '';
				if (!is_string($value) || strlen($value) > 4096 || preg_match('/[\x00-\x1f\x7f]/', $value)) { throw new InvalidArgumentException('Invalid OpenPGP user ID metadata.'); }
				$clean[$field] = $value;
			}
			$clean['revoked'] = !empty($uid['revoked']);
			$clean['expired'] = !empty($uid['expired']);
			$result['uids'][] = $clean;
		}
		return $result;
	}
	private function policy(): array {
		if ($this->cachedPolicy !== null) { return $this->cachedPolicy; }
		$rows = $this->rows(self::POLICY_CLASS);
		if (count($rows) > 1) { throw new RuntimeException('Duplicate mailbox OpenPGP policies require administrator repair.'); }
		if (!$rows) { return $this->cachedPolicy = ['trusted' => [], 'keyservers' => PLUGIN_PGP_KEYSERVER_ALLOWLIST]; }
		$message = $this->openRow($rows[0], self::POLICY_CLASS);
		$policy = json_decode($this->readBlob($message, $this->tags['policy'], self::MAX_JSON), true, 32, JSON_THROW_ON_ERROR);
		if (!is_array($policy) || !is_array($policy['trusted'] ?? null) || !is_array($policy['keyservers'] ?? null)) {
			throw new RuntimeException('Invalid mailbox OpenPGP policy.');
		}
		foreach ($policy['trusted'] as $email => $fingerprint) { self::email($email); self::fingerprint($fingerprint); }
		foreach ($policy['keyservers'] as $server) { if (!is_string($server)) { throw new RuntimeException('Invalid mailbox OpenPGP keyserver policy.'); } }
		return $this->cachedPolicy = $policy;
	}
	private function savePolicy(array $policy): void {
		$encoded = json_encode($policy, JSON_THROW_ON_ERROR);
		if (strlen($encoded) > self::MAX_JSON) { throw new RuntimeException('The mailbox OpenPGP policy is too large.'); }
		$rows = $this->rows(self::POLICY_CLASS);
		if (count($rows) > 1) { throw new RuntimeException('Duplicate mailbox OpenPGP policies require administrator repair.'); }
		$message = $rows ? $this->openRow($rows[0], self::POLICY_CLASS) : mapi_folder_createmessage($this->root, MAPI_ASSOCIATED);
		if (!$message) { throw new RuntimeException('Cannot create the mailbox OpenPGP policy.'); }
		$this->writeBlob($message, $this->tags['policy'], $encoded);
		if (mapi_setprops($message, [PR_MESSAGE_CLASS => self::POLICY_CLASS, PR_SUBJECT => 'OpenPGP key policy',
			$this->tags['schema'] => self::SCHEMA, $this->tags['revision'] => bin2hex(random_bytes(16))]) === false || mapi_savechanges($message) === false) {
			throw new RuntimeException('Cannot save the mailbox OpenPGP policy.');
		}
		$this->cachedPolicy = $policy;
	}
	private function readBlob($message, int $tag, int $limit): string {
		$stream = mapi_openproperty($message, $tag, IID_IStream, 0, 0);
		$stat = $stream ? mapi_stream_stat($stream) : false;
		if (!is_array($stat) || !is_int($stat['cb'] ?? null) || $stat['cb'] < 0 || $stat['cb'] > $limit) { throw new RuntimeException('Cannot safely read mailbox OpenPGP key data.'); }
		$result = '';
		while (strlen($result) < $stat['cb']) {
			$chunk = mapi_stream_read($stream, min(65536, $stat['cb'] - strlen($result)));
			if (!is_string($chunk) || $chunk === '' || strlen($chunk) > $stat['cb'] - strlen($result)) { throw new RuntimeException('Truncated mailbox OpenPGP key data.'); }
			$result .= $chunk;
		}
		return $result;
	}
	private function writeBlob($message, int $tag, string $value): void {
		$stream = mapi_openproperty($message, $tag, IID_IStream, 0, MAPI_CREATE | MAPI_MODIFY);
		if (!$stream || mapi_stream_setsize($stream, strlen($value)) === false || mapi_stream_write($stream, $value) !== strlen($value) || mapi_stream_commit($stream) === false) {
			throw new RuntimeException('Cannot write mailbox OpenPGP key data.');
		}
	}
}
