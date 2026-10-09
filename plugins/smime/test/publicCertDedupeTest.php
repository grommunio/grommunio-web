<?php

/*
 * SPDX-FileCopyrightText: Copyright 2020 - 2026 grommunio GmbH
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

/* A stored public certificate is recognised by issuer, serial and body, and duplicates are collapsed into one. */
if (function_exists('mapi_table_queryallrows')) {
	echo "Public certificate dedupe checks skipped with php-mapi loaded\n";

	return;
}

chdir(dirname(__DIR__));

foreach (['RES_AND', 'RES_PROPERTY', 'RELOP', 'RELOP_EQ', 'ULPROPTAG', 'VALUE', 'MAPI_ASSOCIATED', 'TBL_BATCH',
	'PR_ENTRYID', 'PR_MESSAGE_CLASS', 'PR_SUBJECT', 'PR_SUBJECT_PREFIX', 'PR_SENDER_NAME',
	'PR_SENDER_EMAIL_ADDRESS', 'PR_BODY', 'IID_IStream', 'STREAM_SEEK_SET'] as $index => $constant) {
	if (!defined($constant)) {
		define($constant, $index + 500);
	}
}

if (!class_exists('MAPIException')) {
	class MAPIException extends Exception {}
}

$GLOBALS['rows'] = [];
$GLOBALS['bodies'] = [];
$GLOBALS['deleted'] = [];
$GLOBALS['saved'] = [];
if (!function_exists('mapi_table_queryallrows')) {
	function mapi_msgstore_openentry($store, $entryid = null) {
		return $entryid ?? 'root';
	}
	function mapi_folder_getcontentstable($folder, $flags) {
		return 'table';
	}
	function mapi_table_restrict($table, $restriction, $flags) {
		$GLOBALS['restriction'] = $restriction;

		return true;
	}
	function mapi_table_queryallrows($table, $columns) {
		if ($GLOBALS['rows'] instanceof Exception) {
			throw $GLOBALS['rows'];
		}
		// Apply the serial restriction the way the store would.
		$restriction = $GLOBALS['restriction'];
		if ($restriction[0] === RES_AND) {
			$serial = $restriction[1][1][1][VALUE][PR_SENDER_NAME];

			return array_values(array_filter($GLOBALS['rows'], static fn ($row) => $row[PR_SENDER_NAME] === $serial));
		}

		return $GLOBALS['rows'];
	}
	function mapi_openproperty($message, $tag, $iid, $options, $flags) {
		$GLOBALS['offset'] = 0;

		return $message;
	}
	function mapi_stream_stat($stream) {
		return ['cb' => strlen($GLOBALS['bodies'][$stream])];
	}
	function mapi_stream_seek($stream, $offset, $whence) {
		$GLOBALS['offset'] = $offset;
	}
	function mapi_stream_read($stream, $length) {
		$chunk = substr($GLOBALS['bodies'][$stream], $GLOBALS['offset'], $length);
		$GLOBALS['offset'] += $length;

		return $chunk;
	}
	function mapi_folder_deletemessages($folder, $entryids) {
		$GLOBALS['deleted'] = array_merge($GLOBALS['deleted'], $entryids);
	}
	function mapi_setprops($message, $props) {
		$GLOBALS['saved'][$message] = $props;
	}
	function mapi_message_savechanges($message) {
		return true;
	}
}

require_once 'php/util.php';

function checkDedupe(bool $condition, string $message): void {
	if (!$condition) {
		fwrite(STDERR, "FAIL: {$message}\n");

		exit(1);
	}
}

function makeCert(string $email, int $serial): string {
	$key = openssl_pkey_new(['private_key_type' => OPENSSL_KEYTYPE_EC, 'curve_name' => 'prime256v1']);
	$csr = openssl_csr_new(['commonName' => 'Test', 'emailAddress' => $email], $key);
	openssl_x509_export(openssl_csr_sign($csr, null, $key, 30, null, $serial), $pem);

	return $pem;
}

ini_set('error_log', '/dev/null');

$issuer = certIssuerString(['issuer' => ['C' => 'DE', 'CN' => 'Test CA']]);
checkDedupe($issuer === "C=DE\nCN=Test CA\n", 'issuer string keeps the stored format');

$json = '{"type":"RSA","bits":4096,"curve":"","purpose":"both"}';
$certs = ['a' => makeCert('a@example.com', 1), 'b' => makeCert('b@example.com', 2), 'c' => makeCert('c@example.com', 3),
	'd' => makeCert('d@example.com', 4), 'e' => makeCert('e@example.com', 1)];
$row = static function ($id, $cert, $serial, $subject, $prefix = '') use ($issuer, $certs) {
	$GLOBALS['bodies'][$id] = base64_encode($certs[$cert]);

	return [
		PR_ENTRYID => $id,
		PR_SENDER_NAME => $serial,
		PR_SENDER_EMAIL_ADDRESS => $issuer,
		PR_SUBJECT => $prefix . $subject,
		PR_SUBJECT_PREFIX => $prefix,
	];
};

$GLOBALS['rows'] = [$row('e1', 'a', '1', 'a@example.com')];
checkDedupe(findPublicCert('store', '1', $issuer, $certs['a'])[PR_ENTRYID] === 'e1', 'same certificate is stored');
checkDedupe(findPublicCert('store', '1', $issuer, $certs['e']) === null, 'another certificate with the same issuer and serial is not');
checkDedupe(findPublicCert('store', '2', $issuer, $certs['a']) === null, 'another serial is not stored');
checkDedupe(findPublicCert('store', '1', "CN=Other CA\n", $certs['a']) === null, 'same serial from another issuer is not stored');
checkDedupe(findPublicCert('store', '', $issuer, $certs['a']) === null, 'a certificate without serial is never matched');

$GLOBALS['rows'] = new MAPIException('table failed', 0x80004005);
checkDedupe(findPublicCert('store', '1', $issuer, $certs['a']) === null, 'a MAPI failure does not block the import');
dedupePublicCerts('store');
checkDedupe($GLOBALS['deleted'] === [], 'a MAPI failure deletes nothing');

$GLOBALS['rows'] = [
	// legacy subject first, the working copy second
	$row('a1', 'a', '1', 'a@example.com, DNS:example.com'),
	$row('a2', 'a', '1', 'a@example.com'),
	$row('a3', 'a', '1', 'a@example.com', $json),
	// only copies with the key type prefix
	$row('b1', 'b', '2', 'b@example.com', $json),
	$row('b2', 'b', '2', 'b@example.com', $json),
	// a single clean copy, a single legacy copy
	$row('c1', 'c', '3', 'c@example.com'),
	$row('d1', 'd', '4', 'd@example.com, DNS:example.com'),
	// same issuer and serial as a, different certificate
	$row('e1', 'e', '1', 'e@example.com'),
];
dedupePublicCerts('store');
sort($GLOBALS['deleted']);
checkDedupe($GLOBALS['deleted'] === ['a1', 'a3', 'b2'], 'duplicates are deleted, the copy the lookup finds is kept');
ksort($GLOBALS['saved']);
checkDedupe(array_keys($GLOBALS['saved']) === ['b1', 'd1'], 'only kept copies with a wrong subject are rewritten');
checkDedupe($GLOBALS['saved']['b1'] === [PR_SUBJECT => 'b@example.com', PR_SUBJECT_PREFIX => ''], 'the prefix is removed');
checkDedupe($GLOBALS['saved']['d1'] === [PR_SUBJECT => 'd@example.com', PR_SUBJECT_PREFIX => ''], 'a legacy subject is repaired');

echo "Public certificate dedupe checks passed\n";
