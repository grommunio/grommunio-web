<?php

/*
 * SPDX-FileCopyrightText: Copyright 2020 - 2026 grommunio GmbH
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

// What the plugin signs and encrypts, and how the signed result is stored.
chdir(dirname(__DIR__));
require_once 'php/util.php';

function checkEntity(bool $condition, string $message): void {
	if (!$condition) {
		fwrite(STDERR, "FAIL: {$message}\n");

		exit(1);
	}
}

$dir = sys_get_temp_dir() . '/smime-entity-' . bin2hex(random_bytes(6));
checkEntity(mkdir($dir, 0700), 'temporary directory');

function smimeMimeEntity(string $eml): ?string {
	global $dir;
	file_put_contents("{$dir}/eml", $eml);
	$ok = smimeMimeEntityFile("{$dir}/eml");
	checkEntity(!file_exists("{$dir}/eml.entity"), 'no leftover entity file');

	return $ok ? file_get_contents("{$dir}/eml") : null;
}

function smimeCrlf(string $mime): string {
	global $dir;
	file_put_contents("{$dir}/crlf", $mime);
	checkEntity(smimeCrlfFile("{$dir}/crlf"), 'CRLF conversion succeeds');

	return file_get_contents("{$dir}/crlf");
}

$body = "This is a multi-part message in MIME format.\r\n--b1\r\nContent-Type: text/plain; charset=utf-8\r\n\r\nGr\xc3\xbc\xc3\x9fe\r\n\r\nsecond paragraph\r\n--b1--\r\n";
$eml = "Content-Type: multipart/alternative; \r\n boundary=\"b1\"\r\nMIME-Version: 1.0\r\nFrom: \"A\" <a@example.test>\r\nTo: b@example.test\r\n" .
	"Bcc: \"Hidden\" <hidden@example.test>\r\nSubject: Secret\r\nDate: Fri, 20 Nov 2026 14:07:54 +0000\r\nMessage-Id: <id@example.test>\r\n" .
	"Content-Id: <c@example.test>\r\nX-Mailer: gromox-oxcmail\r\nX-Content-Note: not MIME\r\n\r\n" . $body;
$entity = smimeMimeEntity($eml);
checkEntity($entity === "Content-Type: multipart/alternative; \r\n boundary=\"b1\"\r\nContent-Id: <c@example.test>\r\n\r\n" . $body, 'keeps folded Content-* headers and the exact body');
checkEntity(stripos($entity, 'hidden@example.test') === false && stripos($entity, 'Subject:') === false, 'envelope headers, Bcc included, stay out');

$single = "Content-Type: text/plain; charset=utf-8\r\nContent-Transfer-Encoding: base64\r\nFrom: a@example.test\r\n\r\nR3LDvMOfZQ==\r\n";
checkEntity(smimeMimeEntity($single) === "Content-Type: text/plain; charset=utf-8\r\nContent-Transfer-Encoding: base64\r\n\r\nR3LDvMOfZQ==\r\n", 'keeps the transfer encoding of a single part');
checkEntity(smimeMimeEntity("From: a@example.test\nSubject: x\n\nplain\n") === "Content-Type: text/plain; charset=utf-8\r\n\r\nplain\n", 'defaults the type when there is none, LF input');
checkEntity(smimeMimeEntity("Content-Type: text/plain\r\n\r\nline\n\nmore\r\n") === "Content-Type: text/plain\r\n\r\nline\n\nmore\r\n", 'splits at the earliest blank line (CRLF before LF)');
checkEntity(smimeMimeEntity("Content-Type: text/plain\nTo: x\n\nline\r\n\r\nmore\r\n") === "Content-Type: text/plain\r\n\r\nline\r\n\r\nmore\r\n", 'splits at the earliest blank line (LF before CRLF)');
checkEntity(smimeMimeEntity("Content-Type: text/plain\r\nno separator") === null, 'rejects a message without body separator');
checkEntity(file_get_contents("{$dir}/eml") === "Content-Type: text/plain\r\nno separator", 'a rejected message stays as it was');
$large = "Content-Type: application/octet-stream\r\nBcc: x@example.test\r\n\r\n" . str_repeat(random_bytes(1024) . "\n", 6000);
checkEntity(smimeMimeEntity($large) === "Content-Type: application/octet-stream\r\n\r\n" . substr($large, strpos($large, "\r\n\r\n") + 4), 'streams a large body unchanged');

checkEntity(smimeCrlf("a\nb\r\nc\n") === "a\r\nb\r\nc\r\n", 'bare LF becomes CRLF, CRLF stays');
checkEntity(smimeCrlf(smimeCrlf("a\nb\r\n")) === "a\r\nb\r\n", 'CRLF conversion is idempotent');

// OpenSSL writes its envelope with bare LF around the CRLF content.
$key = openssl_pkey_new(['private_key_bits' => 2048, 'private_key_type' => OPENSSL_KEYTYPE_RSA]);
$cert = openssl_csr_sign(openssl_csr_new(['commonName' => 'mime entity test', 'emailAddress' => 'a@example.test'], $key), null, $key, 1);
file_put_contents("{$dir}/in", $entity);
checkEntity(openssl_pkcs7_sign("{$dir}/in", "{$dir}/out", $cert, $key, [], PKCS7_DETACHED), 'OpenSSL signs the entity');
$raw = file_get_contents("{$dir}/out");
checkEntity(smimeCrlfFile("{$dir}/out"), 'signed output converted in place');
$signed = file_get_contents("{$dir}/out");
// gromox splices the stored body after the first CRLF blank line
$cut = strpos($raw, "\r\n\r\n");
checkEntity($cut !== false && str_contains(substr($raw, 0, $cut), 'S/MIME signed message'), 'raw OpenSSL output misleads a CRLF header search (the bug)');
$cut = strpos($signed, "\r\n\r\n");
checkEntity(stripos(substr($signed, 0, $cut), 'multipart/signed') !== false && !str_contains(substr($signed, 0, $cut), 'S/MIME signed message'), 'after conversion the first blank line ends the S/MIME headers');
file_put_contents("{$dir}/signed", $signed);
checkEntity(openssl_pkcs7_verify("{$dir}/signed", PKCS7_NOVERIFY, "{$dir}/signer", [], null, "{$dir}/content") === true, 'signature still verifies after the CRLF conversion');
checkEntity(file_get_contents("{$dir}/content") === $entity, 'verified content is the entity');
array_map('unlink', glob("{$dir}/*"));
rmdir($dir);

echo "S/MIME entity checks passed\n";
