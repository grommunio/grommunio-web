<?php

/**
 * Test-only GnuPG interoperability oracle. Never loaded by production code.
 *
 * Each account MUST have its own directory outside the document root. The
 * application decides which full fingerprints are trusted for an address;
 * GnuPG's local ownertrust database is not an address authentication policy.
 * No command, plaintext, passphrase, or GnuPG diagnostic is logged here.
 */
class Gpg {
	private const MAX_INPUT = 52428800;
	private const MAX_KEY_INPUT = 10485760;
	private const AGENT_CONFIG = "allow-loopback-pinentry\ndefault-cache-ttl 0\nmax-cache-ttl 0\nignore-cache-for-signing\n";
	private string $home;
	private string $binary;
	private int $timeout;

	public function __construct(string $home, string $binary = '/usr/bin/gpg', int $timeout = 60) {
		if ($home === '' || $home[0] !== '/' || str_contains($home, "\0") || preg_match('~(?:^|/)\.\.?(?:/|$)~', $home)) {
			throw new InvalidArgumentException('The OpenPGP key directory must be an absolute path.');
		}
		if ($binary === '' || $binary[0] !== '/' || !is_file($binary) || !is_executable($binary)) {
			throw new RuntimeException('The configured GnuPG executable is unavailable.');
		}
		$home = rtrim(preg_replace('~/+~', '/', $home), '/');
		if ($home === '') {
			throw new InvalidArgumentException('A dedicated OpenPGP key directory is required.');
		}
		if (strlen($home) > 80) {
			throw new InvalidArgumentException('The OpenPGP key directory path is too long for GnuPG agent sockets. Configure a shorter storage path (at most 80 bytes per account).');
		}
		$roots = [realpath(dirname(__DIR__, 4)), realpath($_SERVER['DOCUMENT_ROOT'] ?? '')];
		foreach ($roots as $root) {
			if ($root && ($home === $root || str_starts_with($home, $root . '/'))) {
				throw new RuntimeException('OpenPGP keys must be stored outside the web document root.');
			}
		}
		$path = '';
		foreach (explode('/', ltrim($home, '/')) as $component) {
			if ($component === '') {
				continue;
			}
			$path .= '/' . $component;
			if (is_link($path) || (file_exists($path) && !is_dir($path))) {
				throw new RuntimeException('The OpenPGP key directory cannot contain symbolic links.');
			}
			if (!is_dir($path) && !@mkdir($path, 0700) && !is_dir($path)) {
				throw new RuntimeException('The OpenPGP key directory could not be created.');
			}
		}
		if (function_exists('posix_geteuid') && fileowner($home) !== posix_geteuid()) {
			throw new RuntimeException('The OpenPGP key directory must be owned by the web service account.');
		}
		if (!@chmod($home, 0700)) {
			throw new RuntimeException('The OpenPGP key directory permissions could not be secured.');
		}
		$this->home = $home;
		$this->binary = $binary;
		$this->timeout = max(5, min(300, $timeout));
		$config = $home . '/gpg-agent.conf';
		if (is_link($config)) {
			throw new RuntimeException('The OpenPGP agent configuration must not be a symbolic link.');
		}
		if (!file_exists($config)) {
			$handle = @fopen($config, 'x');
			if ($handle === false) {
				throw new RuntimeException('The OpenPGP agent configuration could not be created.');
			}
			chmod($config, 0600);
			fwrite($handle, self::AGENT_CONFIG);
			fclose($handle);
		}
		if (file_get_contents($config) !== self::AGENT_CONFIG) {
			throw new RuntimeException('The OpenPGP agent configuration must disable passphrase caching.');
		}
	}

	/** List public keys, their usable capabilities, and local secret-key presence. */
	public function listKeys(): array {
		$public = $this->run(['--with-colons', '--fixed-list-mode', '--with-fingerprint', '--with-subkey-fingerprint', '--list-keys']);
		$secret = $this->run(['--with-colons', '--fixed-list-mode', '--with-fingerprint', '--with-subkey-fingerprint', '--list-secret-keys']);
		$keys = $this->parseKeys($public['output']);
		$secrets = $this->parseKeys($secret['output']);
		foreach ($keys as &$key) {
			$key['secret'] = isset($secrets[$key['fingerprint']]);
			$key['can_sign'] = $key['can_sign'] && $key['secret'];
		}
		unset($key);

		return array_values($keys);
	}

	/** Generate a passphrase-protected certification/signing key and encryption subkey. */
	public function generateKey(string $name, string $email, string $passphrase, string $algorithm = 'RSA3072', string $expires = '2y'): array {
		$this->requirePassphrase($passphrase);
		if (trim($name) === '' || strlen($name) > 200 || preg_match('/[\x00-\x1f\x7f<>]/', $name) || !filter_var($email, FILTER_VALIDATE_EMAIL) || preg_match('/[\r\n\x00<>]/', $email)) {
			throw new InvalidArgumentException('A valid name and email address are required.');
		}
		if (!preg_match('/^(?:[1-9][0-9]{0,3}[dwmy]|[0-9]{4}-[0-9]{2}-[0-9]{2})$/D', $expires)) {
			throw new InvalidArgumentException('Specify a key expiration such as 2y or YYYY-MM-DD.');
		}
		$algorithms = ['RSA3072' => ['rsa3072', 'rsa3072'], 'RSA4096' => ['rsa4096', 'rsa4096'], 'CURVE25519' => ['ed25519', 'cv25519']];
		$pair = $algorithms[strtoupper($algorithm)] ?? null;
		if ($pair === null) {
			throw new InvalidArgumentException('Supported key algorithms are RSA3072, RSA4096, and curve25519.');
		}
		$result = $this->run(['--rfc4880', '--default-preference-list', 'AES256 AES192 AES SHA512 SHA384 SHA256 SHA224 ZLIB ZIP Uncompressed', '--quick-generate-key', trim($name) . ' <' . $email . '>', $pair[0], 'cert,sign', $expires], '', $passphrase);
		$fingerprint = null;
		foreach ($this->statusLines($result['status']) as [$token, $value]) {
			if ($token === 'KEY_CREATED') {
				$fingerprint = explode(' ', $value)[1] ?? null;
			}
		}
		if ($fingerprint === null) {
			throw new RuntimeException('GnuPG did not return the generated key fingerprint.');
		}
		try {
			$this->run(['--quick-add-key', $this->fingerprint($fingerprint), $pair[1], 'encrypt', $expires], '', $passphrase);
		}
		catch (Throwable $error) {
			$this->run(['--delete-secret-and-public-key', $fingerprint], '', null, '', true);
			throw $error;
		}

		return $this->getKey($fingerprint);
	}

	/** Import supplied key material only; network retrieval is never performed. */
	public function importKey(string $material): array {
		if ($material === '' || strlen($material) > self::MAX_KEY_INPUT) {
			throw new InvalidArgumentException('OpenPGP key data is empty or exceeds 10 MiB.');
		}
		$material = $this->assertProtectedSecretKeys($material);
		$preview = $this->run(['--with-colons', '--import-options', 'show-only', '--import'], $material);
		$shown = $this->parseKeys($preview['output']);
		if (!$shown || count($shown) > 100) {
			throw new InvalidArgumentException('Import between one and 100 OpenPGP keys at a time.');
		}
		$result = $this->run(['--import-options', 'import-clean', '--import'], $material);
		$fingerprints = [];
		foreach ($this->statusLines($result['status']) as [$token, $value]) {
			if ($token === 'IMPORT_OK') {
				$fields = explode(' ', $value);
				$fingerprints[] = $this->fingerprint($fields[1] ?? '');
			}
		}
		$fingerprints = array_values(array_unique($fingerprints));
		if (!$fingerprints) {
			// GnuPG can exit successfully while skipping every supplied key,
			// notably when a privacy-preserving keyserver removed all user IDs.
			throw new RuntimeException('No OpenPGP key could be imported. The key may have no usable user ID; try another configured keyserver or obtain the complete public key from its owner.');
		}

		return ['fingerprints' => $fingerprints, 'keys' => array_values(array_filter($this->listKeys(), static fn ($key) => in_array($key['fingerprint'], $fingerprints, true)))];
	}

	/** Inspect complete supplied keys without modifying the account keyring. */
	public function inspectKey(string $material): array {
		if ($material === '' || strlen($material) > self::MAX_KEY_INPUT) {
			throw new InvalidArgumentException('OpenPGP key data is empty or exceeds 10 MiB.');
		}
		$binary = $this->assertProtectedSecretKeys($material);
		$result = $this->run(['--with-colons', '--import-options', 'show-only', '--import'], $binary);
		$keys = array_values($this->parseKeys($result['output']));
		if (!$keys || count($keys) > 100) {
			throw new InvalidArgumentException('Supply between one and 100 OpenPGP keys.');
		}

		return $keys;
	}

	/**
	 * Reject cleartext secret packets before importing them into the account.
	 * Packet and public-field boundaries follow RFC 9580 sections 4.2 and 5.5.
	 * GnuPG remains responsible for validating the actual key and its bindings.
	 */
	private function assertProtectedSecretKeys(string $material): string {
		$binary = str_contains($material, '-----BEGIN PGP') ? $this->run(['--dearmor'], $material)['output'] : $material;
		$offset = 0;
		$primarySeen = false;
		while ($offset < strlen($binary)) {
			$header = $this->readNumber($binary, $offset, 1);
			if (($header & 0x80) === 0) {
				throw new InvalidArgumentException('Malformed OpenPGP key packet.');
			}
			$body = '';
			if (($header & 0x40) !== 0) {
				$tag = $header & 0x3f;
				do {
					$first = $this->readNumber($binary, $offset, 1);
					$partial = $first >= 224 && $first < 255;
					if ($first < 192) {
						$length = $first;
					}
					elseif ($first < 224) {
						$length = (($first - 192) << 8) + $this->readNumber($binary, $offset, 1) + 192;
					}
					else {
						$length = $partial ? 1 << ($first & 0x1f) : $this->readNumber($binary, $offset, 4);
					}
					$body .= $this->readBytes($binary, $offset, $length);
				} while ($partial);
			}
			else {
				$tag = ($header >> 2) & 0x0f;
				$kind = $header & 3;
				$length = $kind === 3 ? strlen($binary) - $offset : $this->readNumber($binary, $offset, 1 << $kind);
				$body = $this->readBytes($binary, $offset, $length);
			}
			if (!in_array($tag, [2, 5, 6, 7, 10, 12, 13, 14, 17], true)) {
				throw new InvalidArgumentException('Import uncompressed OpenPGP key packets only.');
			}
			if ($tag === 5 || $tag === 6) {
				$primarySeen = true;
			}
			elseif (!$primarySeen && $tag !== 10) {
				throw new InvalidArgumentException('Import a complete OpenPGP key, including its primary key packet.');
			}
			if ($tag !== 5 && $tag !== 7) {
				continue;
			}
			$cursor = 0;
			$version = $this->readNumber($body, $cursor, 1);
			$this->readBytes($body, $cursor, 4);
			$algorithm = $this->readNumber($body, $cursor, 1);
			if ($version === 6) {
				$publicLength = $this->readNumber($body, $cursor, 4);
				$this->readBytes($body, $cursor, $publicLength);
			}
			elseif ($version === 4) {
				if (in_array($algorithm, [18, 19, 22], true)) {
					$oidLength = $this->readNumber($body, $cursor, 1);
					$this->readBytes($body, $cursor, $oidLength);
					$mpiCount = 1;
				}
				else {
					$mpiCount = [1 => 2, 2 => 2, 3 => 2, 16 => 3, 17 => 4][$algorithm] ?? null;
					if ($mpiCount === null) {
						throw new InvalidArgumentException('This private-key algorithm cannot be safely imported.');
					}
				}
				for ($i = 0; $i < $mpiCount; ++$i) {
					$bits = $this->readNumber($body, $cursor, 2);
					$this->readBytes($body, $cursor, intdiv($bits + 7, 8));
				}
				if ($algorithm === 18) {
					$kdfLength = $this->readNumber($body, $cursor, 1);
					$this->readBytes($body, $cursor, $kdfLength);
				}
			}
			else {
				throw new InvalidArgumentException('Only version 4 and version 6 private keys can be safely imported.');
			}
			$usage = $this->readNumber($body, $cursor, 1);
			if (!in_array($usage, [253, 254], true)) {
				throw new InvalidArgumentException('Private keys must be protected by a passphrase and an integrity check. Protect the key in GnuPG before importing it.');
			}
		}

		return $binary;
	}

	private function readBytes(string $bytes, int &$offset, int $length): string {
		if ($length < 0 || $length > strlen($bytes) - $offset) {
			throw new InvalidArgumentException('Truncated OpenPGP key packet.');
		}
		$result = substr($bytes, $offset, $length);
		$offset += $length;

		return $result;
	}

	private function readNumber(string $bytes, int &$offset, int $length): int {
		$number = 0;
		foreach (str_split($this->readBytes($bytes, $offset, $length)) as $byte) {
			$number = ($number << 8) | ord($byte);
		}

		return $number;
	}

	public function exportKey(string $fingerprint, bool $secret = false, ?string $passphrase = null): string {
		$key = $this->getKey($fingerprint);
		if ($secret) {
			$this->requirePassphrase($passphrase);
			if (!$key['secret']) {
				throw new InvalidArgumentException('The private key is not available.');
			}
		}
		$result = $this->run(['--armor', $secret ? '--export-secret-keys' : '--export', $key['fingerprint']], '', $secret ? $passphrase : null);
		if ($result['output'] === '') {
			throw new RuntimeException('The OpenPGP key could not be exported.');
		}

		return $result['output'];
	}

	/** Secret material is deleted only when explicitly requested by the caller. */
	public function deleteKey(string $fingerprint, bool $deleteSecret = false): void {
		$key = $this->getKey($fingerprint);
		if ($key['secret'] && !$deleteSecret) {
			throw new InvalidArgumentException('Explicit confirmation is required to delete a private key.');
		}
		$this->run([$deleteSecret ? '--delete-secret-and-public-key' : '--delete-keys', $key['fingerprint']]);
	}

	/** Encrypt to explicitly pinned full primary fingerprints. Always uses integrity protection. */
	public function encrypt(string $data, array $recipients, ?string $signer = null, ?string $passphrase = null): string {
		if (!$recipients || count($recipients) > 100) {
			throw new InvalidArgumentException('Supply between one and 100 recipient fingerprints.');
		}
		$args = ['--armor', '--rfc4880', '--force-mdc', '--throw-keyids', '--cipher-algo', 'AES256', '--digest-algo', 'SHA256', '--compress-algo', 'ZIP', '--trust-model', 'always'];
		foreach (array_unique($recipients) as $recipient) {
			$key = $this->usableKey($recipient, 'can_encrypt');
			$args[] = '--recipient';
			$args[] = $key['fingerprint'];
		}
		if ($signer !== null) {
			$key = $this->usableKey($signer, 'can_sign');
			$this->requirePassphrase($passphrase);
			array_push($args, '--local-user', $key['fingerprint'], '--sign');
		}
		$args[] = '--encrypt';

		return $this->run($args, $data, $signer !== null ? $passphrase : null)['output'];
	}

	/** Plaintext is returned only after GnuPG confirms successful integrity verification. */
	public function decrypt(string $data, ?string $passphrase = null): array {
		$result = $this->run(['--decrypt'], $data, $passphrase, '', true);
		$tokens = [];
		$aead = false;
		$insideEncryption = false;
		$unexpectedPlaintext = false;
		$signatureFailure = false;
		$fatalFailure = false;
		foreach ($this->statusLines($result['status']) as [$token, $value]) {
			$tokens[$token] = ($tokens[$token] ?? 0) + 1;
			if (in_array($token, ['ERRSIG', 'BADSIG', 'NO_PUBKEY', 'EXPSIG', 'EXPKEYSIG', 'REVKEYSIG'], true)) {
				$signatureFailure = true;
			}
			if ($token === 'FAILURE' && !str_starts_with($value, 'gpg-exit ')) {
				$fatalFailure = true;
			}
			if ($token === 'BEGIN_DECRYPTION') {
				$insideEncryption = true;
			}
			elseif ($token === 'END_DECRYPTION') {
				$insideEncryption = false;
			}
			elseif ($token === 'PLAINTEXT' && !$insideEncryption) {
				$unexpectedPlaintext = true;
			}
			if ($token === 'DECRYPTION_INFO') {
				$fields = explode(' ', $value);
				$aead = (int) ($fields[2] ?? 0) > 0;
			}
		}
		// Some GnuPG builds report gpg-exit failure after successfully decrypting
		// one hidden recipient because another recipient's private key is absent.
		// Only tolerate that aggregate failure after the complete integrity checks.
		if (($tokens['DECRYPTION_OKAY'] ?? 0) !== 1 || ($tokens['PLAINTEXT'] ?? 0) !== 1 || $unexpectedPlaintext || (!isset($tokens['GOODMDC']) && !$aead) || isset($tokens['BADMDC']) || isset($tokens['ERRMDC']) || isset($tokens['DECRYPTION_FAILED']) || isset($tokens['ERROR']) || $fatalFailure || (isset($tokens['FAILURE']) && !$signatureFailure && !isset($tokens['NO_SECKEY']))) {
			throw new RuntimeException('OpenPGP decryption failed. Check the private key and passphrase; damaged or unprotected ciphertext is rejected.');
		}

		return ['data' => $result['output'], 'integrity' => true, 'signatures' => $this->signatures($result['status'])];
	}

	public function sign(string $data, string $signer, string $passphrase): string {
		$key = $this->usableKey($signer, 'can_sign');
		$this->requirePassphrase($passphrase);

		return $this->run(['--armor', '--digest-algo', 'SHA256', '--local-user', $key['fingerprint'], '--detach-sign'], $data, $passphrase)['output'];
	}

	/** A valid signature is cryptographic evidence only, never a trusted address binding. */
	public function verify(string $data, string $signature): array {
		if ($signature === '' || strlen($signature) > self::MAX_KEY_INPUT) {
			throw new InvalidArgumentException('The OpenPGP signature is empty or too large.');
		}
		$result = $this->run(['--verify', '/dev/fd/5', '-'], $data, null, $signature, true);
		$signatures = $this->signatures($result['status']);

		return ['valid' => $result['exit_code'] === 0 && count($signatures) > 0 && count(array_filter($signatures, static fn ($signature) => !$signature['valid'])) === 0, 'signatures' => $signatures];
	}

	/** Verify one complete inline clear-signed message without accepting appended text. */
	public function verifyCleartext(string $armor): array {
		if (strlen($armor) > $this->maxInput() || !preg_match('/\A-----BEGIN PGP SIGNED MESSAGE-----\r?\n(?:Hash: [A-Za-z0-9, -]+\r?\n)*\r?\n/s', $armor) || !preg_match('/\r?\n-----END PGP SIGNATURE-----(?:\r?\n)?\z/D', $armor) || substr_count($armor, "\n-----BEGIN PGP SIGNATURE-----") !== 1 || substr_count($armor, "\n-----END PGP SIGNATURE-----") !== 1) {
			throw new InvalidArgumentException('Expected exactly one complete OpenPGP clear-signed message.');
		}
		$result = $this->run(['--decrypt'], $armor, null, '', true);
		$signatures = $this->signatures($result['status']);
		if (count($signatures) !== 1) {
			throw new InvalidArgumentException('The OpenPGP clear-signed message is malformed or ambiguous.');
		}

		return ['data' => $result['output'], 'valid' => $result['exit_code'] === 0 && $signatures[0]['valid'], 'signatures' => $signatures];
	}

	private function fingerprint(string $fingerprint): string {
		if (!preg_match('/^(?:[A-Fa-f0-9]{40}|[A-Fa-f0-9]{64})$/D', $fingerprint)) {
			throw new InvalidArgumentException('A complete OpenPGP fingerprint is required.');
		}

		return strtoupper($fingerprint);
	}

	private function requirePassphrase(?string $passphrase): void {
		if ($passphrase === null || $passphrase === '' || strlen($passphrase) > 4096 || preg_match('/[\x00\r\n]/', $passphrase)) {
			throw new InvalidArgumentException('A non-empty passphrase without line breaks is required.');
		}
	}

	private function maxInput(): int {
		return defined('PLUGIN_PGP_MAX_MESSAGE_BYTES') ? max(1048576, min(104857600, (int) PLUGIN_PGP_MAX_MESSAGE_BYTES)) : self::MAX_INPUT;
	}

	private function getKey(string $fingerprint): array {
		$fingerprint = $this->fingerprint($fingerprint);
		foreach ($this->listKeys() as $key) {
			if ($key['fingerprint'] === $fingerprint) {
				return $key;
			}
		}
		throw new InvalidArgumentException('The requested OpenPGP key was not found.');
	}

	private function usableKey(string $fingerprint, string $capability): array {
		$key = $this->getKey($fingerprint);
		if ($key['revoked'] || $key['expired'] || $key['disabled'] || !$key[$capability]) {
			throw new InvalidArgumentException('The selected OpenPGP key is expired, revoked, disabled, or unsuitable for this operation.');
		}

		return $key;
	}

	private function parseKeys(string $output): array {
		$keys = [];
		$current = null;
		$subkey = null;
		foreach (explode("\n", $output) as $line) {
			$fields = explode(':', $line);
			$type = $fields[0];
			if (in_array($type, ['pub', 'sec', 'sub', 'ssb'], true)) {
				$record = ['fingerprint' => '', 'keyid' => $fields[4] ?? '', 'algorithm' => (int) ($fields[3] ?? 0), 'bits' => (int) ($fields[2] ?? 0), 'created' => (int) ($fields[5] ?? 0), 'expires' => (int) ($fields[6] ?? 0), 'validity' => $fields[1] ?? '', 'capabilities' => $fields[11] ?? '', 'revoked' => ($fields[1] ?? '') === 'r', 'expired' => ($fields[1] ?? '') === 'e' || ((int) ($fields[6] ?? 0) > 0 && (int) $fields[6] <= time()), 'disabled' => str_contains($fields[11] ?? '', 'D') || ($fields[1] ?? '') === 'd', 'secret' => in_array($type, ['sec', 'ssb'], true), 'uids' => [], 'subkeys' => []];
				if ($type === 'pub' || $type === 'sec') {
					$keys[] = $record;
					$current = array_key_last($keys);
					$subkey = null;
				}
				elseif ($current !== null) {
					$keys[$current]['subkeys'][] = $record;
					$subkey = array_key_last($keys[$current]['subkeys']);
				}
			}
			elseif ($type === 'fpr' && $current !== null) {
				if ($subkey === null) {
					$keys[$current]['fingerprint'] = strtoupper($fields[9] ?? '');
				}
				else {
					$keys[$current]['subkeys'][$subkey]['fingerprint'] = strtoupper($fields[9] ?? '');
				}
			}
			elseif ($type === 'uid' && $current !== null) {
				$uid = $this->decodeColon($fields[9] ?? '');
				$email = '';
				$name = $uid;
				if (preg_match('/^(.*?)\s*<([^<>]+)>\s*$/uD', $uid, $match)) {
					$name = trim($match[1]);
					$email = strtolower($match[2]);
				}
				elseif (filter_var($uid, FILTER_VALIDATE_EMAIL)) {
					$email = strtolower($uid);
				}
				$keys[$current]['uids'][] = ['uid' => $uid, 'name' => $name, 'email' => $email, 'validity' => $fields[1] ?? '', 'revoked' => ($fields[1] ?? '') === 'r', 'expired' => ($fields[1] ?? '') === 'e'];
			}
		}
		$result = [];
		foreach ($keys as $key) {
			if (!preg_match('/^(?:[A-F0-9]{40}|[A-F0-9]{64})$/D', $key['fingerprint'])) {
				continue;
			}
			$key['can_encrypt'] = false;
			$key['can_sign'] = false;
			$key['secret'] = $key['secret'] || count(array_filter($key['subkeys'], static fn ($part) => $part['secret'])) > 0;
			if (!$key['revoked'] && !$key['expired'] && !$key['disabled']) {
				foreach (array_merge([$key], $key['subkeys']) as $part) {
					if (!$part['revoked'] && !$part['expired'] && !$part['disabled']) {
						$key['can_encrypt'] = $key['can_encrypt'] || str_contains($part['capabilities'], 'e');
						$key['can_sign'] = $key['can_sign'] || str_contains($part['capabilities'], 's');
					}
				}
			}
			$result[$key['fingerprint']] = $key;
		}

		return $result;
	}

	private function decodeColon(string $value): string {
		return preg_replace_callback('/\\\\x([0-9A-Fa-f]{2})/', static fn ($match) => chr(hexdec($match[1])), $value);
	}

	private function statusLines(string $status): array {
		$lines = [];
		foreach (explode("\n", $status) as $line) {
			if (str_starts_with($line, '[GNUPG:] ')) {
				$pair = explode(' ', substr($line, 9), 2);
				$lines[] = [$pair[0], $pair[1] ?? ''];
			}
		}

		return $lines;
	}

	private function signatures(string $status): array {
		$signatures = [];
		$current = null;
		foreach ($this->statusLines($status) as [$token, $value]) {
			if ($token === 'NEWSIG') {
				$current = null;
				continue;
			}
			if (!in_array($token, ['GOODSIG', 'VALIDSIG', 'BADSIG', 'ERRSIG', 'NO_PUBKEY', 'EXPSIG', 'EXPKEYSIG', 'REVKEYSIG', 'KEYEXPIRED', 'SIGEXPIRED'], true)) {
				continue;
			}
			if ($current === null) {
				$signatures[] = ['status' => 'unknown', 'valid' => false, 'fingerprint' => null, 'primary_fingerprint' => null, 'keyid' => null, 'uid' => null, 'timestamp' => null, 'expires' => null, 'hash_algorithm' => null, 'key_expired' => false, 'key_revoked' => false];
				$current = array_key_last($signatures);
			}
			$signature = &$signatures[$current];
			$fields = explode(' ', $value);
			if (in_array($token, ['GOODSIG', 'BADSIG', 'EXPSIG', 'EXPKEYSIG', 'REVKEYSIG'], true)) {
				$signature['keyid'] = $fields[0] ?? null;
				$signature['uid'] = rawurldecode(explode(' ', $value, 2)[1] ?? '');
				$signature['status'] = ['GOODSIG' => 'good', 'BADSIG' => 'bad', 'EXPSIG' => 'expired-signature', 'EXPKEYSIG' => 'expired-key', 'REVKEYSIG' => 'revoked-key'][$token];
				$signature['key_expired'] = $token === 'EXPKEYSIG';
				$signature['key_revoked'] = $token === 'REVKEYSIG';
			}
			elseif ($token === 'VALIDSIG') {
				$signature['fingerprint'] = $fields[0] ?? null;
				$signature['primary_fingerprint'] = $fields[9] ?? $signature['fingerprint'];
				$signature['timestamp'] = (int) ($fields[2] ?? 0);
				$signature['expires'] = (int) ($fields[3] ?? 0);
				$signature['hash_algorithm'] = (int) ($fields[7] ?? 0);
				if ($signature['status'] === 'good') {
					$signature['valid'] = in_array($signature['hash_algorithm'], [8, 9, 10, 11], true);
					if (!$signature['valid']) {
						$signature['status'] = 'weak-digest';
					}
				}
			}
			elseif ($token === 'NO_PUBKEY' || $token === 'ERRSIG') {
				$signature['status'] = $token === 'NO_PUBKEY' ? 'missing-key' : 'error';
				$signature['keyid'] = $fields[0] ?? null;
				$signature['valid'] = false;
			}
			elseif ($token === 'KEYEXPIRED') {
				$signature['key_expired'] = true;
			}
			elseif ($token === 'SIGEXPIRED') {
				$signature['status'] = 'expired-signature';
				$signature['valid'] = false;
			}
			unset($signature);
		}

		return $signatures;
	}

	/**
	 * Shell-free bounded process execution. Input, status, detached signature and
	 * passphrase use separate pipes; stdout/stderr are always drained together.
	 */
	private function run(array $arguments, string $input = '', ?string $passphrase = null, string $signature = '', bool $allowFailure = false): array {
		if (strlen($input) > $this->maxInput() || strlen($signature) > self::MAX_KEY_INPUT) {
			throw new InvalidArgumentException('OpenPGP input exceeds the configured safety limit.');
		}
		if ($passphrase !== null) {
			$this->requirePassphrase($passphrase);
		}
		$lockPath = $this->home . '/.web-lock';
		if (is_link($lockPath)) {
			throw new RuntimeException('The OpenPGP lock file must not be a symbolic link.');
		}
		$lock = @fopen($lockPath, 'c');
		if ($lock === false) {
			throw new RuntimeException('The OpenPGP key directory cannot be locked.');
		}
		chmod($lockPath, 0600);
		$started = microtime(true);
		while (!flock($lock, LOCK_EX | LOCK_NB)) {
			if (microtime(true) - $started > 10) {
				fclose($lock);
				throw new RuntimeException('The OpenPGP key directory is busy. Try again.');
			}
			usleep(20000);
		}
		$maxOutput = $this->maxInput() * 2;
		$command = array_merge([$this->binary, '--no-options', '--homedir', $this->home, '--batch', '--yes', '--no-tty', '--display-charset', 'utf-8', '--status-fd', '3', '--exit-on-status-write-error', '--no-auto-key-retrieve', '--no-auto-key-import', '--auto-key-locate', 'clear', '--pinentry-mode', 'loopback', '--passphrase-fd', '4', '--no-symkey-cache', '--max-output', (string) $maxOutput], $arguments);
		$pipes = [];
		$process = null;
		try {
			$process = @proc_open($command, [0 => ['pipe', 'r'], 1 => ['pipe', 'w'], 2 => ['pipe', 'w'], 3 => ['pipe', 'w'], 4 => ['pipe', 'r'], 5 => ['pipe', 'r']], $pipes, $this->home, ['PATH' => '/usr/bin:/bin', 'LANG' => 'C', 'LC_ALL' => 'C', 'GNUPGHOME' => $this->home], ['bypass_shell' => true]);
			if (!is_resource($process)) {
				throw new RuntimeException('GnuPG could not be started.');
			}
			foreach ($pipes as $pipe) {
				stream_set_blocking($pipe, false);
			}
			$writes = [0 => $input, 4 => ($passphrase ?? '') . "\n", 5 => $signature];
			$offsets = [0 => 0, 4 => 0, 5 => 0];
			$outputs = [1 => '', 2 => '', 3 => ''];
			$limits = [1 => $maxOutput, 2 => 65536, 3 => 1048576];
			$started = microtime(true);
			$exitCode = -1;
			while ($pipes) {
				if (microtime(true) - $started > $this->timeout) {
					throw new RuntimeException('The OpenPGP operation exceeded its time limit.');
				}
				foreach ($writes as $fd => $data) {
					if (isset($pipes[$fd]) && $offsets[$fd] >= strlen($data)) {
						fclose($pipes[$fd]);
						unset($pipes[$fd]);
					}
				}
				$read = array_intersect_key($pipes, $outputs);
				$write = array_intersect_key($pipes, $writes);
				$except = null;
				if (!$read && !$write) {
					break;
				}
				$ready = @stream_select($read, $write, $except, 0, 200000);
				if ($ready === false) {
					throw new RuntimeException('Communication with GnuPG failed.');
				}
				foreach ($write as $fd => $pipe) {
					$written = @fwrite($pipe, substr($writes[$fd], $offsets[$fd], 65536));
					if ($written === false) {
						fclose($pipes[$fd]);
						unset($pipes[$fd]);
					}
					else {
						$offsets[$fd] += $written;
					}
				}
				foreach ($read as $fd => $pipe) {
					$chunk = fread($pipe, 65536);
					if ($chunk === false) {
						throw new RuntimeException('Reading GnuPG output failed.');
					}
					$outputs[$fd] .= $chunk;
					if (strlen($outputs[$fd]) > $limits[$fd]) {
						throw new RuntimeException('GnuPG output exceeds the configured safety limit.');
					}
					if (feof($pipe)) {
						fclose($pipes[$fd]);
						unset($pipes[$fd]);
					}
				}
				$state = proc_get_status($process);
				if (!$state['running'] && $state['exitcode'] >= 0) {
					$exitCode = $state['exitcode'];
				}
			}
			do {
				$state = proc_get_status($process);
				if (!$state['running']) {
					if ($state['exitcode'] >= 0) {
						$exitCode = $state['exitcode'];
					}
					break;
				}
				if (microtime(true) - $started > $this->timeout) {
					throw new RuntimeException('The OpenPGP operation exceeded its time limit.');
				}
				usleep(20000);
			} while (true);
			$closed = proc_close($process);
			$process = null;
			if ($exitCode < 0) {
				$exitCode = $closed;
			}
			if ($exitCode !== 0 && !$allowFailure) {
				throw new RuntimeException('The OpenPGP operation failed. Check the key, passphrase, and GnuPG service configuration.');
			}

			return ['output' => $outputs[1], 'status' => $outputs[3], 'exit_code' => $exitCode];
		}
		finally {
			if (is_resource($process)) {
				proc_terminate($process, 9);
			}
			foreach ($pipes as $pipe) {
				if (is_resource($pipe)) {
					fclose($pipe);
				}
			}
			if (is_resource($process)) {
				proc_close($process);
			}
			flock($lock, LOCK_UN);
			fclose($lock);
		}
	}
}
