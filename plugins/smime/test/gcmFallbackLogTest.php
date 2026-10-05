<?php

/*
 * SPDX-FileCopyrightText: Copyright 2020 - 2026 grommunio GmbH
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

/* An unsupported GCM cipher is reported when a message is encrypted, not on every request. */
chdir(dirname(__DIR__));

if (!class_exists('Plugin')) {
	class Plugin {}
}
if (!defined('PLUGIN_SMIME_CIPHER_NAME')) {
	define('PLUGIN_SMIME_CIPHER_NAME', 'aes-256-gcm');
}

require_once 'php/plugin.smime.php';

function checkGcm(bool $condition, string $message): void {
	if (!$condition) {
		fwrite(STDERR, "FAIL: {$message}\n");

		exit(1);
	}
}

$cms = new CmsOperations();
foreach (['hasCmsStringCipher' => false, 'hasCmsCli' => false] as $property => $value) {
	(new ReflectionProperty(CmsOperations::class, $property))->setValue($cms, $value);
}
$plugin = (new ReflectionClass(Pluginsmime::class))->newInstanceWithoutConstructor();
(new ReflectionProperty(Pluginsmime::class, 'cms'))->setValue($plugin, $cms);

$log = tempnam(sys_get_temp_dir(), 'smime-gcm-log-');
$in = tempnam(sys_get_temp_dir(), 'smime-gcm-in-');
$out = tempnam(sys_get_temp_dir(), 'smime-gcm-out-');
ini_set('error_log', $log);

try {
	$cipher = (new ReflectionMethod(Pluginsmime::class, 'resolveCipher'))->invoke($plugin);
	checkGcm(file_get_contents($log) === '', 'resolving the cipher logs nothing');

	file_put_contents($in, "Content-Type: text/plain\r\n\r\nbody\r\n");
	checkGcm($cms->encrypt($in, $out, [file_get_contents('test/user.crt')], [], 0, $cipher), 'encryption succeeds');
	checkGcm(substr_count(file_get_contents($log), 'AES-GCM not available') === 1, 'encryption logs the fallback once');
	$der = base64_decode(preg_replace('/\A.*?\r?\n\r?\n/s', '', file_get_contents($out)));
	checkGcm(str_contains($der, "\x06\x09\x60\x86\x48\x01\x65\x03\x04\x01\x2a"), 'message is encrypted with aes-256-cbc');
}
finally {
	@unlink($log);
	@unlink($in);
	@unlink($out);
}

echo "GCM fallback checks passed\n";
