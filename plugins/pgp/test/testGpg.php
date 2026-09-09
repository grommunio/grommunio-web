<?php

require_once __DIR__ . '/oracle/Gpg.php';

/** Standalone integration test: php plugins/pgp/test/testGpg.php [GPG_BINARY]. */
$binary = $argv[1] ?? '/usr/bin/gpg';
$base = sys_get_temp_dir() . '/grommunio-pgp-test-' . bin2hex(random_bytes(8));
mkdir($base, 0700);
$assertions = 0;

function check(bool $condition, string $message): void {
	global $assertions;
	++$assertions;
	if (!$condition) {
		throw new RuntimeException('FAIL: ' . $message);
	}
}

function rejects(callable $operation, string $message): void {
	$rejected = false;
	try {
		$operation();
	}
	catch (RuntimeException | InvalidArgumentException $error) {
		$rejected = true;
	}
	check($rejected, $message);
}

function cleanup(string $path): void {
	foreach (new FilesystemIterator($path, FilesystemIterator::SKIP_DOTS) as $entry) {
		if ($entry->isDir() && !$entry->isLink()) {
			cleanup($entry->getPathname());
		}
		else {
			unlink($entry->getPathname());
		}
	}
	rmdir($path);
}

/** Take only a generated public-primary packet to model a key with no UIDs. */
function primaryPacket(string $binary): string {
	$header = ord($binary[0]);
	$offset = 1;
	if ($header & 0x40) {
		if (($header & 0x3f) !== 6) { throw new RuntimeException('Expected a public primary key fixture.'); }
		$first = ord($binary[$offset++]);
		if ($first < 192) { $length = $first; }
		elseif ($first < 224) { $length = (($first - 192) << 8) + ord($binary[$offset++]) + 192; }
		elseif ($first === 255) { $length = unpack('N', substr($binary, $offset, 4))[1]; $offset += 4; }
		else { throw new RuntimeException('Unexpected partial-length generated public key.'); }
	}
	else {
		$kind = $header & 3;
		if ((($header >> 2) & 15) !== 6 || $kind === 3) { throw new RuntimeException('Expected a bounded public primary key fixture.'); }
		$length = 0;
		for ($i = 0; $i < (1 << $kind); ++$i) { $length = ($length << 8) | ord($binary[$offset++]); }
	}
	return substr($binary, 0, $offset + $length);
}

try {
	$alice = new Gpg($base . '/alice', $binary);
	$bob = new Gpg($base . '/bob', $binary);
	$mallory = new Gpg($base . '/mallory', $binary);
	$rawGpg = new ReflectionMethod(Gpg::class, 'run');
	check($alice->listKeys() === [], 'new keyring is empty');
	$aliceKey = $alice->generateKey('Alice Example', 'alice@example.test', 'alice test passphrase', 'curve25519', '1y');
	$bobKey = $bob->generateKey('Bob Example', 'bob@example.test', 'bob test passphrase', 'RSA3072', '1y');
	check($aliceKey['secret'] && $aliceKey['can_sign'] && $aliceKey['can_encrypt'], 'generated key has signing and encryption capability');
	check($bobKey['bits'] === 3072, 'RSA3072 generation');
	check(($aliceKey['uids'][0]['email'] ?? null) === 'alice@example.test', 'UID email parsing');
	check((fileperms($base . '/alice') & 0777) === 0700, 'home is private');
	$alicePublic = $alice->exportKey($aliceKey['fingerprint']);
	$bobPublic = $bob->exportKey($bobKey['fingerprint']);
	$inspected = $mallory->inspectKey($alicePublic);
	check(count($inspected) === 1 && $inspected[0]['fingerprint'] === $aliceKey['fingerprint'] && !$inspected[0]['secret'], 'nonpersistent inspection reports the exact public fingerprint');
	check($mallory->listKeys() === [], 'inspection does not persist keys');
	$import = $alice->importKey($bobPublic);
	check($import['fingerprints'] === [$bobKey['fingerprint']], 'import returns exact fingerprint');
	check($alice->importKey($bobPublic)['fingerprints'] === [$bobKey['fingerprint']], 'unchanged existing public key reimport succeeds with its exact fingerprint');
	$uidless = primaryPacket($rawGpg->invoke($alice, ['--dearmor'], $alicePublic)['output']);
	check($mallory->inspectKey($uidless)[0]['uids'] === [], 'keyserver fixture has a real public primary packet but no user IDs');
	rejects(fn () => $mallory->importKey($uidless), 'GnuPG successful exit with skipped UID-less key is not reported as an import');
	check($mallory->listKeys() === [], 'skipped UID-less key leaves isolated keyring unchanged');
	$bob->importKey($alicePublic);
	$message = "Content-Type: text/plain; charset=utf-8\r\n\r\nHello, Grüße!\r\n" . str_repeat("binary\x00payload\xff\r\n", 9000);
	$signature = $alice->sign($message, $aliceKey['fingerprint'], 'alice test passphrase');
	check(str_contains($signature, 'BEGIN PGP SIGNATURE'), 'detached armored signature');
	$verification = $bob->verify($message, $signature);
	check($verification['valid'], 'verify detached signature');
	check($verification['signatures'][0]['hash_algorithm'] === 8, 'signatures use SHA256');
	check($verification['signatures'][0]['primary_fingerprint'] === $aliceKey['fingerprint'], 'verification identifies full signer fingerprint');
	check(!$bob->verify($message . 'tampered', $signature)['valid'], 'modified signed content rejected');
	check(!$mallory->verify($message, $signature)['valid'], 'unknown signer is not accepted');
	$clear = "Hello, clear-signed mail!\n- A dash-escaped line\n";
	$clearSigned = $rawGpg->invoke($alice, ['--armor', '--digest-algo', 'SHA256', '--local-user', $aliceKey['fingerprint'], '--clearsign'], $clear, 'alice test passphrase')['output'];
	$clearResult = $bob->verifyCleartext($clearSigned);
	check($clearResult['valid'] && $clearResult['data'] === $clear, 'inline clear-signed verification and dash-unescaping');
	check(!$bob->verifyCleartext(str_replace('Hello,', 'Altered,', $clearSigned))['valid'], 'inline cleartext tampering rejected');
	check(!$mallory->verifyCleartext($clearSigned)['valid'], 'inline cleartext missing signer is unverified');
	rejects(fn () => $bob->verifyCleartext($clearSigned . 'unsigned appended content'), 'clear-signed trailing text rejected');
	rejects(fn () => $bob->verifyCleartext('unsigned prepended content' . $clearSigned), 'clear-signed leading text rejected');
	rejects(fn () => $bob->verifyCleartext($clearSigned . $clearSigned), 'concatenated clear-signed messages rejected');
	$encrypted = $alice->encrypt($message, [$aliceKey['fingerprint'], $bobKey['fingerprint']], $aliceKey['fingerprint'], 'alice test passphrase');
	check(str_contains($encrypted, 'BEGIN PGP MESSAGE'), 'armored ciphertext');
	$decrypted = $bob->decrypt($encrypted, 'bob test passphrase');
	check($decrypted['data'] === $message && $decrypted['integrity'], 'binary-safe signed encrypted round trip');
	check(count($decrypted['signatures']) === 1 && $decrypted['signatures'][0]['valid'], 'embedded signature verifies');
	$decryptStatus = $rawGpg->invoke($bob, ['--decrypt'], $encrypted, 'bob test passphrase')['status'];
	preg_match_all('/\[GNUPG:\] ENC_TO ([A-F0-9]+) /', $decryptStatus, $hidden);
	check(count($hidden[1]) === 2 && count(array_filter($hidden[1], static fn ($id) => $id !== '0000000000000000')) === 0, 'all recipient key IDs are hidden to preserve Bcc privacy');
	check(str_contains($decryptStatus, 'DECRYPTION_INFO 2 9 0'), 'generated key preferences select RFC4880 AES256 with MDC');
	$mallory->importKey($bob->exportKey($bobKey['fingerprint'], true, 'bob test passphrase'));
	$unknownSigner = $mallory->decrypt($encrypted, 'bob test passphrase');
	check($unknownSigner['data'] === $message && !$unknownSigner['signatures'][0]['valid'], 'encrypted message with missing signer still decrypts with unverified signature');
	$mallory->importKey($alice->exportKey($aliceKey['fingerprint'], true, 'alice test passphrase'));
	check($mallory->decrypt($encrypted, 'alice test passphrase')['data'] === $message, 'hidden recipients decrypt with the first of multiple protected private keys');
	check($mallory->decrypt($encrypted, 'bob test passphrase')['data'] === $message, 'hidden recipients try another private key with its distinct passphrase');
	$mallory->deleteKey($aliceKey['fingerprint'], true);
	$mallory->deleteKey($bobKey['fingerprint'], true);
	rejects(fn () => $bob->decrypt($encrypted, 'wrong passphrase'), 'decryption with wrong passphrase rejected after successful decryption (no agent cache)');
	rejects(fn () => $alice->sign($message, $aliceKey['fingerprint'], 'wrong passphrase'), 'wrong signing passphrase rejected');
	rejects(fn () => $mallory->decrypt($encrypted, 'anything'), 'missing private key rejected');
	rejects(fn () => $bob->decrypt(substr($encrypted, 0, (int) (strlen($encrypted) / 2)), 'bob test passphrase'), 'truncated ciphertext rejected');
	$cipherBytes = $rawGpg->invoke($alice, ['--dearmor'], $encrypted)['output'];
	$cipherBytes[strlen($cipherBytes) - 3] = chr(ord($cipherBytes[strlen($cipherBytes) - 3]) ^ 1);
	rejects(fn () => $bob->decrypt($cipherBytes, 'bob test passphrase'), 'ciphertext bit modification fails integrity verification');
	rejects(fn () => $bob->decrypt($encrypted . $encrypted, 'bob test passphrase'), 'multiple encrypted messages are rejected as ambiguous');
	rejects(fn () => $bob->decrypt($message, 'bob test passphrase'), 'plaintext cannot masquerade as encrypted content');
	rejects(fn () => $alice->encrypt($message, [substr($bobKey['fingerprint'], -16)]), 'short key IDs refused');
	rejects(fn () => $alice->generateKey("Injected\nName", 'alice@example.test', 'password'), 'UID control characters refused');
	rejects(fn () => $alice->generateKey('Alice', 'alice@example.test', ''), 'unprotected generation refused');
	rejects(fn () => $alice->exportKey($aliceKey['fingerprint'], true), 'private export requires passphrase');
	rejects(fn () => $alice->exportKey($aliceKey['fingerprint'], true, 'wrong passphrase'), 'private export verifies passphrase');
	$private = $alice->exportKey($aliceKey['fingerprint'], true, 'alice test passphrase');
	check(str_contains($private, 'BEGIN PGP PRIVATE KEY BLOCK'), 'protected private export');
	$mallory->importKey($private);
	check($mallory->decrypt($encrypted, 'alice test passphrase')['data'] === $message, 'protected private key import works');
	rejects(fn () => $alice->deleteKey($aliceKey['fingerprint']), 'secret key deletion requires explicit flag');
	$alice->deleteKey($bobKey['fingerprint']);
	check(count($alice->listKeys()) === 1, 'public key deletion');
	$mallory->deleteKey($aliceKey['fingerprint'], true);
	check($mallory->listKeys() === [], 'explicit secret key deletion');
	$naked = new Gpg($base . '/naked', $binary);
	$rawGpg->invoke($naked, ['--quick-generate-key', 'Unprotected <unprotected@example.test>', 'ed25519', 'cert,sign', '1y']);
	$nakedKey = $naked->listKeys()[0];
	$nakedExport = $rawGpg->invoke($naked, ['--armor', '--export-secret-keys', $nakedKey['fingerprint']])['output'];
	rejects(fn () => $mallory->importKey($nakedExport), 'unprotected private key import rejected before persistence');
	rejects(fn () => $mallory->importKey($alicePublic . $nakedExport), 'unprotected secret key appended to public armor rejected');
	check($mallory->listKeys() === [], 'rejected private key leaves keyring untouched');
	rejects(fn () => $mallory->importKey("\xc5\xff\xff\xff\xff\xff"), 'out-of-bounds key packet rejected');
	$oldTime = (string) (time() - 172800);
	$rawGpg->invoke($naked, ['--faked-system-time', $oldTime, '--quick-generate-key', 'Expired <expired@example.test>', 'ed25519', 'cert,sign', '1d'], '', 'expired passphrase');
	$expired = array_values(array_filter($naked->listKeys(), static fn ($key) => ($key['uids'][0]['email'] ?? '') === 'expired@example.test'))[0];
	check($expired['expired'] && !$expired['can_sign'], 'expired keys have no usable signing capability');
	rejects(fn () => $naked->sign($message, $expired['fingerprint'], 'expired passphrase'), 'expired signing keys rejected');
	$revocation = file_get_contents($base . '/alice/openpgp-revocs.d/' . $aliceKey['fingerprint'] . '.rev');
	$revocation = substr($revocation, strpos($revocation, ':-----BEGIN PGP PUBLIC KEY BLOCK-----') + 1);
	$rawGpg->invoke($alice, ['--import'], $revocation);
	$revoked = $alice->listKeys()[0];
	check($revoked['revoked'] && !$revoked['can_sign'] && !$revoked['can_encrypt'], 'revoked key capabilities disabled');
	rejects(fn () => $alice->sign($message, $aliceKey['fingerprint'], 'alice test passphrase'), 'revoked signing key rejected');
	$bob->importKey($alice->exportKey($aliceKey['fingerprint']));
	check(!$bob->verify($message, $signature)['valid'], 'previous signature from subsequently revoked key is not valid');
	rejects(fn () => new Gpg(__DIR__ . '/unsafe'), 'webroot key storage refused');
	symlink($base . '/bob', $base . '/linked');
	rejects(fn () => new Gpg($base . '/linked'), 'symlink key directory refused');
	fwrite(STDOUT, "OK: {$assertions} GnuPG integration assertions\n");
}
finally {
	foreach (['alice', 'bob', 'mallory', 'naked'] as $account) {
		if (is_dir($base . '/' . $account)) {
			$agent = proc_open(['/usr/bin/gpgconf', '--homedir', $base . '/' . $account, '--kill', 'gpg-agent'], [0 => ['file', '/dev/null', 'r'], 1 => ['file', '/dev/null', 'w'], 2 => ['file', '/dev/null', 'w']], $agentPipes);
			if (is_resource($agent)) {
				proc_close($agent);
			}
		}
	}
	cleanup($base);
}
