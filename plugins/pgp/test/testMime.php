<?php

require_once __DIR__ . '/../php/class.pgpmime.php';
require_once __DIR__ . '/oracle/Gpg.php';

/** Standalone MIME fixtures and real detached-signature interoperability. */
$assertions = 0;
function mimeCheck(bool $condition, string $message): void {
	global $assertions;
	++$assertions;
	if (!$condition) {
		throw new RuntimeException('FAIL: ' . $message);
	}
}
function mimeRejects(callable $operation, string $message): void {
	$rejected = false;
	try {
		$operation();
	}
	catch (RuntimeException | InvalidArgumentException $error) {
		$rejected = true;
	}
	mimeCheck($rejected, $message);
}

$rawBinary = implode('', array_map('chr', range(0, 255))) . "\x00\xff\rbare CR\nLF\r\nCRLF\t \r\n";
$body = "--mixed\r\nContent-Type: multipart/alternative; boundary=alternative\r\n\r\n" .
	"--alternative\r\nContent-Type: text/plain; charset=utf-8\r\nContent-Transfer-Encoding: quoted-printable\r\n\r\nHello, Gr=C3=BC=C3=9Fe!\r\n" .
	"--alternative\r\nContent-Type: text/html; charset=utf-8\r\nContent-Transfer-Encoding: quoted-printable\r\n\r\n<p>Hello, Gr=C3=BC=C3=9Fe!</p>\r\n--alternative--\r\n" .
	"--mixed\r\nContent-Type: application/octet-stream; name=payload.bin\r\nContent-Disposition: attachment; filename=payload.bin\r\nContent-Transfer-Encoding: base64\r\n\r\n" .
	chunk_split(base64_encode($rawBinary), 76, "\r\n") . "--mixed--\r\n";
$contentHeaders = "Content-Type: multipart/mixed;\r\n boundary=mixed\r\nContent-Language: en";
$fullMessage = "From: Alice <alice@example.test>\r\nTo: Bob <bob@example.test>\r\nCc: Carol <carol@example.test>\r\nBcc: Private <private@example.test>\r\nSubject: MIME fixture\r\nMIME-Version: 1.0\r\n" . $contentHeaders . "\r\n\r\n" . $body;
$entity = PgpMime::entity($fullMessage);
mimeCheck($entity === $contentHeaders . "\r\n\r\n" . $body, 'extract content headers and nested MIME body exactly');
mimeCheck(!preg_match('/^(?:From|To|Cc|Bcc|Subject|MIME-Version):/mi', $entity), 'SMTP envelope and Bcc never enter the protected MIME entity');
mimeCheck(PgpMime::entity("From: a@example.test\nSubject: no type\n\nbody\n") === "Content-Type: text/plain; charset=utf-8\r\n\r\nbody\r\n", 'supply a content type when the source has none');
mimeCheck(PgpMime::entity("Content-Type: text/plain \t\n\ntrailing spaces \t\nlast\t") === "Content-Type: text/plain\r\n\r\ntrailing spaces\r\nlast", 'outgoing canonicalization removes trailing whitespace and uses CRLF');

$binaryEntity = "Content-Type: application/octet-stream\r\nContent-Transfer-Encoding: binary\r\n\r\n" . $rawBinary;
mimeCheck(PgpMime::entity("From: attacker@example.test\r\nTo: victim@example.test\r\nBcc: concealed@example.test\r\nSubject: attacker replacement\r\n" . $binaryEntity, false) === $binaryEntity, 'incoming binary data survives envelope stripping byte for byte');
mimeCheck(PgpMime::entity("Content-Type: text/plain\n\nspace \t\nno newline", false) === "Content-Type: text/plain\r\n\r\nspace \t\nno newline", 'incoming body line endings and trailing whitespace are preserved');

[$type, $parameters] = PgpMime::contentType('Multipart/Signed; protocol="application/pgp-signature"; note="semi;\"quoted\\\\name"; boundary="alpha?beta"');
mimeCheck($type === 'multipart/signed' && $parameters['protocol'] === 'application/pgp-signature', 'content type names normalized and quoted protocol accepted');
mimeCheck($parameters['note'] === 'semi;"quoted\\name' && $parameters['boundary'] === 'alpha?beta', 'escaped quote, backslash, and semicolon parsed inside quoted parameters');
mimeCheck(PgpMime::contentType('text/plain; charset = utf-8; empty=""')[1]['empty'] === '', 'empty quoted values and parameter whitespace accepted');
mimeRejects(fn () => PgpMime::contentType('text/plain; charset=utf-8; CHARSET=ascii'), 'duplicate parameters rejected');
mimeRejects(fn () => PgpMime::contentType('text/plain; name="unfinished'), 'unclosed quoted parameter rejected');
mimeRejects(fn () => PgpMime::contentType('text/plain; charset=utf-8 garbage'), 'unparsed parameter suffix rejected');
mimeRejects(fn () => PgpMime::contentType("text/plain; name=evil\r\nInjected: yes"), 'content type header injection rejected');
mimeRejects(fn () => PgpMime::contentType('text/plain; name=a/b'), 'unquoted MIME special characters rejected');
mimeRejects(fn () => PgpMime::headers("Content-Type: text/plain\r\ncontent-type: text/html"), 'ambiguous duplicate content type rejected');
mimeRejects(fn () => PgpMime::headers("Content-Type: text/plain\r\nContent-Transfer-Encoding: 7bit\r\ncontent-transfer-encoding: base64"), 'ambiguous duplicate encoding rejected');
mimeRejects(fn () => PgpMime::headers("Content-Type: text/plain\rInjected: yes"), 'bare carriage return in headers rejected');
mimeRejects(fn () => PgpMime::headers("Content-Type: text/plain\x00"), 'NUL header bytes rejected');

$signature = "-----BEGIN PGP SIGNATURE-----\r\n\r\nZmFrZQ==\r\n-----END PGP SIGNATURE-----\r\n";
$signed = PgpMime::signed($entity, $signature);
$unwrapped = PgpMime::unwrap($signed);
mimeCheck($unwrapped === ['kind' => 'signed', 'entity' => $entity, 'signature' => $signature], 'nested signed MIME preserves the exact signed entity and signature');
mimeCheck(str_contains($signed, 'micalg=pgp-sha256'), 'MIME micalg matches the SHA256 signer');
foreach (["Content-Type: text/plain\r\n\r\nbody", "Content-Type: text/plain\r\n\r\nbody\r\n", "Content-Type: text/plain\r\n\r\nbody\r\n\r\n", $binaryEntity] as $variant) {
	mimeCheck(PgpMime::unwrap(PgpMime::signed($variant, $signature))['entity'] === $variant, 'boundary CRLF does not alter signed body bytes or terminal newlines');
}
$ciphertext = "-----BEGIN PGP MESSAGE-----\r\n\r\nZmFrZQ==\r\n-----END PGP MESSAGE-----\r\n";
$encrypted = PgpMime::encrypted($ciphertext);
mimeCheck(PgpMime::unwrap($encrypted) === ['kind' => 'encrypted', 'ciphertext' => $ciphertext], 'encrypted envelope extracts exact ciphertext');
[$outerHeaders, $outerBody] = PgpMime::split($signed);
[, $outerParams] = PgpMime::contentType(PgpMime::headers($outerHeaders)['content-type']);
$boundary = $outerParams['boundary'];
mimeCheck(PgpMime::unwrap($outerHeaders . "\r\n\r\nUNTRUSTED PREAMBLE\r\n" . $outerBody . 'UNTRUSTED EPILOGUE')['entity'] === $entity, 'unauthenticated preamble and epilogue never enter signed content');
mimeCheck(PgpMime::unwrap(str_replace('--' . $boundary . "\r\n", '--' . $boundary . " \t\r\n", $signed))['entity'] === $entity, 'legal whitespace on delimiter lines accepted');
$extraPart = str_replace('--' . $boundary . '--', '--' . $boundary . "\r\nContent-Type: text/html\r\n\r\nunsigned third part\r\n--" . $boundary . '--', $signed);
mimeRejects(fn () => PgpMime::unwrap($extraPart), 'extra unsigned MIME parts rejected');
mimeRejects(fn () => PgpMime::unwrap(str_replace('--' . $boundary . '--', '--' . $boundary, $signed)), 'missing closing delimiter rejected');
mimeRejects(fn () => PgpMime::unwrap(str_replace('boundary="' . $boundary . '"', 'boundary="' . str_repeat('x', 71) . '"', $signed)), 'overlong boundary rejected');
mimeRejects(fn () => PgpMime::unwrap(str_replace('boundary="' . $boundary . '"', 'boundary="bad[boundary]"', $signed)), 'invalid boundary characters rejected');
mimeRejects(fn () => PgpMime::unwrap(str_replace('boundary="' . $boundary . '"', 'boundary="bad "', $signed)), 'trailing-space boundary rejected');
mimeRejects(fn () => PgpMime::unwrap($outerHeaders . "\r\nContent-Transfer-Encoding: base64\r\n\r\n" . $outerBody), 'encoded multipart container rejected');
mimeRejects(fn () => PgpMime::unwrap(str_replace('Version: 1', 'Version: 2', $encrypted)), 'invalid encrypted version rejected');
mimeRejects(fn () => PgpMime::unwrap(str_replace('Content-Type: application/octet-stream;', 'Content-Type: text/html;', $encrypted)), 'wrong encrypted payload type rejected');
$encodedSignature = str_replace("\r\n\r\n" . $signature, "\r\nContent-Transfer-Encoding: base64\r\n\r\n" . base64_encode($signature), $signed);
mimeCheck(PgpMime::unwrap($encodedSignature)['signature'] === $signature, 'base64 signature transfer encoding decoded');
mimeRejects(fn () => PgpMime::unwrap(str_replace(base64_encode($signature), '!!!!', $encodedSignature)), 'invalid base64 signature rejected');
$quotedSignature = str_replace("\r\n\r\n" . $signature, "\r\nContent-Transfer-Encoding: quoted-printable\r\n\r\n" . quoted_printable_encode($signature), $signed);
mimeCheck(PgpMime::unwrap($quotedSignature)['signature'] === $signature, 'quoted-printable signature transfer encoding decoded');
mimeRejects(fn () => PgpMime::unwrap(str_replace('quoted-printable', 'rot13', $quotedSignature)), 'unknown signature transfer encoding rejected');

$testHome = sys_get_temp_dir() . '/grommunio-pgp-mime-' . bin2hex(random_bytes(8));
try {
	$gpg = new Gpg($testHome, $argv[1] ?? '/usr/bin/gpg');
	$key = $gpg->generateKey('MIME Test', 'mime@example.test', 'MIME integration passphrase', 'curve25519', '1y');
	$realSignature = $gpg->sign($entity, $key['fingerprint'], 'MIME integration passphrase');
	$realSigned = PgpMime::signed($entity, $realSignature);
	$unwrapped = PgpMime::unwrap($realSigned);
	mimeCheck($gpg->verify($unwrapped['entity'], $unwrapped['signature'])['valid'], 'real detached GnuPG signature verifies after MIME assembly and parsing');
	$realEncrypted = PgpMime::encrypted($gpg->encrypt($realSigned, [$key['fingerprint']]));
	$decrypted = $gpg->decrypt(PgpMime::unwrap($realEncrypted)['ciphertext'], 'MIME integration passphrase');
	$nested = PgpMime::unwrap($decrypted['data']);
	mimeCheck($nested['entity'] === $entity && $gpg->verify($nested['entity'], $nested['signature'])['valid'], 'nested signed-inside-encrypted MIME verifies with intact binary attachment bytes');
	$combined = PgpMime::encrypted($gpg->encrypt($entity, [$key['fingerprint']], $key['fingerprint'], 'MIME integration passphrase'));
	$decrypted = $gpg->decrypt(PgpMime::unwrap($combined)['ciphertext'], 'MIME integration passphrase');
	mimeCheck($decrypted['data'] === $entity && $decrypted['signatures'][0]['valid'], 'combined sign/encrypt MIME round trip preserves nested alternative and attachment');
	fwrite(STDOUT, "OK: {$assertions} OpenPGP MIME assertions\n");
}
finally {
	if (is_dir($testHome)) {
		$agent = proc_open(['/usr/bin/gpgconf', '--homedir', $testHome, '--kill', 'gpg-agent'], [0 => ['file', '/dev/null', 'r'], 1 => ['file', '/dev/null', 'w'], 2 => ['file', '/dev/null', 'w']], $pipes);
		if (is_resource($agent)) {
			proc_close($agent);
		}
		$entries = new RecursiveIteratorIterator(new RecursiveDirectoryIterator($testHome, FilesystemIterator::SKIP_DOTS), RecursiveIteratorIterator::CHILD_FIRST);
		foreach ($entries as $entry) {
			$entry->isDir() && !$entry->isLink() ? rmdir($entry->getPathname()) : unlink($entry->getPathname());
		}
		rmdir($testHome);
	}
}
