<?php

/*
 * SPDX-FileCopyrightText: Copyright 2026 grommunio GmbH
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

if (!function_exists('_')) {
	function _($message) {
		return $message;
	}
}

define('PLUGIN_FILESBROWSER_LOGLEVEL', 'NONE');
define('PLUGIN_FILES_ALLOWED_HOSTS', 'allowed.invalid:8080 [::1]:6000, 127.0.0.2');
define('PLUGIN_FILES_UNVERIFIED_HOSTS', '198.51.100.7:8443 allowed.invalid');

require_once dirname(__DIR__) . '/php/Files/Core/Util/class.outboundguard.php';

use Files\Backend\Exception as BackendException;
use Files\Core\Util\OutboundGuard;

function expect($condition, $message) {
	if (!$condition) {
		throw new RuntimeException($message);
	}
}

function refused($url) {
	try {
		OutboundGuard::check($url);
	}
	catch (BackendException $e) {
		return $e->getCode() === 403;
	}

	return false;
}

$refusedAddresses = [
	['127.0.0.1', 80], ['127.0.1.1', 80], ['::1', 80], ['127.0.0.1', 8080], ['127.0.0.1', 6666], ['::1', 6666], ['::ffff:127.0.0.1', 8080],
	['::ffff:7f00:1', 5000], ['64:ff9b::7f00:1', 8080], ['2002:7f00:1::', 8080],
	['169.254.169.254', 80], ['0.0.0.0', 80], ['::', 80], ['fe80::1', 80],
	['224.0.0.1', 80], ['255.255.255.255', 80], ['::ffff:169.254.169.254', 80],
];
foreach ($refusedAddresses as [$address, $port]) {
	expect(OutboundGuard::refusal($address, $port) !== null, "{$address} port {$port} was allowed");
}

$allowedAddresses = [
	['127.0.0.1', 443], ['127.0.1.1', 443], ['::1', 443], ['93.184.216.34', 8443],
	['2606:4700::1', 8080], ['10.1.2.3', 8080], ['192.168.1.10', 443], ['fd00::1', 8080],
];
foreach ($allowedAddresses as [$address, $port]) {
	expect(OutboundGuard::refusal($address, $port) === null, "{$address} port {$port} was refused");
}

$refusedUrls = [
	'http://127.0.0.1:8080/api/v1/', 'http://[::1]:6666/', 'http://127.1:5555/', 'http://2130706433:8080/',
	'http://localhost:8080/', 'http://localhost/', 'http://[::1]/', 'http://169.254.169.254/latest/meta-data/', 'http://[::ffff:127.0.0.1]:8080/',
	'http://a@127.0.0.1:80@example.com/', 'http://user:pass@example.com/', 'file:///etc/passwd',
	'gopher://127.0.0.1:6666/', 'http://exa mple.com/', 'http:///path', 'http://127.0.0.1:99999/',
	'http://[::1]:6001/', 'http://127.0.0.3:8080/',
];
foreach ($refusedUrls as $url) {
	expect(refused($url), "{$url} was allowed");
}

[$url, $resolve] = OutboundGuard::check('https://LOCALHOST/remote.php/webdav/a%20b?x=1#frag');
expect($url === 'https://localhost:443/remote.php/webdav/a%20b?x=1', "unexpected rebuilt URL {$url}");
expect(count($resolve) === 1 && str_starts_with($resolve[0], 'localhost:443:127.0.0.1'), 'localhost was not pinned: ' . json_encode($resolve));

[$url, $resolve] = OutboundGuard::check('https://[::1]/x');
expect($url === 'https://[::1]:443/x' && $resolve === [], "IPv6 literal rebuilt as {$url}");

// the allowlist exempts exactly the listed host and port
expect(OutboundGuard::check('http://allowed.invalid:8080/')[0] === 'http://allowed.invalid:8080/', 'allowlisted host was refused');
expect(refused('http://allowed.invalid:8081/'), 'allowlisted host was allowed on another port');
expect(OutboundGuard::check('http://[::1]:6000/')[1] === [], 'allowlisted IPv6 address was refused');
expect(OutboundGuard::check('http://127.0.0.2:8080/')[1] === [], 'host allowlisted without a port was refused');

// the peer certificate is verified except towards this machine and listed hosts
expect(OutboundGuard::check('https://localhost/')[2] === false, 'this machine was to be verified');
expect(OutboundGuard::check('https://[::1]/')[2] === false, 'this machine was to be verified over IPv6');
expect(OutboundGuard::check('https://93.184.216.34:8443/')[2] === true, 'a remote host was not to be verified');
expect(OutboundGuard::check('https://198.51.100.7:8443/')[2] === false, 'a listed host was to be verified');
expect(OutboundGuard::check('https://198.51.100.7/')[2] === true, 'a listed host was exempt on another port');
expect(OutboundGuard::check('http://allowed.invalid:8080/')[2] === false, 'a host listed without a port was to be verified');
$options = OutboundGuard::curlOptions('https://93.184.216.34:8443/');
expect($options[CURLOPT_SSL_VERIFYPEER] === true && $options[CURLOPT_SSL_VERIFYHOST] === 2, 'verification is not requested from curl');
$options = OutboundGuard::curlOptions('https://198.51.100.7:8443/');
expect($options[CURLOPT_SSL_VERIFYPEER] === false && $options[CURLOPT_SSL_VERIFYHOST] === 0, 'verification is requested for a listed host');

// redirects are vetted hop by hop, credentials stay with their host
$docroot = sys_get_temp_dir() . '/outboundguard-' . getmypid();
mkdir($docroot);
file_put_contents("{$docroot}/index.php", '<?php
if (isset($_GET["to"])) { header("Location: " . $_GET["to"], true, 302); echo "redirect body"; exit; }
echo "auth=", $_SERVER["HTTP_AUTHORIZATION"] ?? "-";');
$server = proc_open([PHP_BINARY, '-S', '127.0.0.2:18766', '-t', $docroot], [1 => ['file', '/dev/null', 'w'], 2 => ['file', '/dev/null', 'w']], $pipes);

try {
	for ($i = 0; $i < 50 && @fsockopen('127.0.0.2', 18766) === false; ++$i) {
		usleep(100000);
	}
	$base = 'http://127.0.0.2:18766/';

	$ch = curl_init();
	curl_setopt_array($ch, [CURLOPT_RETURNTRANSFER => true, CURLOPT_USERPWD => 'u:p']);
	expect(OutboundGuard::exec($ch, $base) === 'auth=Basic dTpw', 'plain request failed');
	expect(OutboundGuard::exec($ch, $base . '?to=' . urlencode('/?x=1')) === 'auth=Basic dTpw', 'same-host redirect lost the credentials');
	expect(OutboundGuard::exec($ch, $base . '?to=' . urlencode('/'), 0) === 'redirect body', 'redirect followed despite maxRedirects 0');
	expect(refused($base . '?to=x') === false, 'allowlisted test server refused');

	try {
		OutboundGuard::exec($ch, $base . '?to=' . urlencode('http://127.0.0.1:6666/'));
		expect(false, 'redirect to a refused destination was followed');
	}
	catch (BackendException $e) {
		expect($e->getCode() === 403, 'unexpected exception code');
	}

	$file = fopen('php://temp', 'w+');
	$ch = curl_init();
	curl_setopt($ch, CURLOPT_FILE, $file);
	OutboundGuard::exec($ch, $base . '?to=' . urlencode('/'), 5, function () use ($file) {
		ftruncate($file, 0);
		rewind($file);
	});
	rewind($file);
	expect(stream_get_contents($file) === 'auth=-', 'redirect body leaked into the output file');
}
finally {
	proc_terminate($server);
	proc_close($server);
	unlink("{$docroot}/index.php");
	rmdir($docroot);
}

echo "Outbound guard checks passed\n";
