<?php

/*
 * SPDX-FileCopyrightText: Copyright 2020 - 2026 grommunio GmbH
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

require_once dirname(__DIR__) . '/includes/core/class.response.php';

$origins = [
	[['HTTP_HOST' => 'Mail.Example.com'], 'https://mail.example.com'],
	[['HTTP_HOST' => 'mail.example.com:443'], 'https://mail.example.com'],
	[['HTTP_HOST' => 'mail.example.com:8443'], 'https://mail.example.com:8443'],
	[['HTTP_HOST' => '[::1]:8443'], 'https://[::1]:8443'],
	[['HTTP_HOST' => 'internal:8080', 'HTTP_X_FORWARDED_HOST' => 'public.example.com, internal'], 'https://public.example.com'],
	[['HTTP_HOST' => 'user@evil.example.com'], null],
	[['HTTP_HOST' => 'mail.example.com:'], null],
	[['HTTP_HOST' => 'mail.example.com/path'], null],
	[['SERVER_NAME' => 'mail.example.com', 'SERVER_PORT' => '8080'], 'https://mail.example.com'],
	[['SERVER_NAME' => 'mail.example.com', 'SERVER_PORT' => '8443', 'HTTPS' => 'on'], 'https://mail.example.com:8443'],
	[['SERVER_NAME' => '::1', 'SERVER_PORT' => '443'], 'https://[::1]'],
	[['SERVER_NAME' => '_', 'SERVER_PORT' => '443'], null],
	[['SERVER_NAME' => ''], null],
];
foreach ($origins as [$server, $expected]) {
	$_SERVER = $server;
	$actual = RequestOrigin::get();
	if ($actual !== $expected) {
		throw new RuntimeException('Origin for ' . json_encode($server) . ' is ' . var_export($actual, true) . ', expected ' . var_export($expected, true));
	}
}

$host = ['HTTP_HOST' => 'mail.example.com'];
$sources = [
	[[], false],
	[['HTTP_ORIGIN' => 'https://mail.example.com'], true],
	[['HTTP_ORIGIN' => 'https://MAIL.example.com:443/'], true],
	[['HTTP_ORIGIN' => 'https://evil.example.com', 'HTTP_SEC_FETCH_SITE' => 'same-origin'], false],
	[['HTTP_SEC_FETCH_SITE' => 'same-origin'], true],
	[['HTTP_SEC_FETCH_SITE' => 'None'], true],
	[['HTTP_SEC_FETCH_SITE' => 'cross-site', 'HTTP_REFERER' => 'https://mail.example.com/web/'], false],
	[['HTTP_REFERER' => 'https://mail.example.com/web/?x=1'], true],
	[['HTTP_REFERER' => 'https://user@mail.example.com/web/'], false],
	[['HTTP_REFERER' => 'https://evil.example.com/', 'HTTP_X_REQUESTED_WITH' => 'XMLHttpRequest'], false],
	[['HTTP_X_REQUESTED_WITH' => ' xmlhttprequest '], true],
];
foreach ($sources as [$server, $expected]) {
	$_SERVER = $server + $host;
	if (RequestOrigin::isSameOriginSource() !== $expected || Response::isSameOriginRequestSource() !== $expected) {
		throw new RuntimeException('Same-origin source for ' . json_encode($server) . ' is not ' . var_export($expected, true));
	}
}
$_SERVER = ['HTTP_HOST' => 'bad host', 'HTTP_SEC_FETCH_SITE' => 'same-origin'];
if (RequestOrigin::isSameOriginSource()) {
	throw new RuntimeException('An unusable request origin was accepted');
}

foreach (['https://a.example.com.' => 'https://a.example.com', 'http://a.example.com:80' => 'http://a.example.com', 'ftp://a.example.com' => null, 'https://a.example.com/x' => null, 'https://a.example.com:0' => null, 'https://-a.example.com' => null] as $in => $expected) {
	if (HttpOrigin::normalize($in) !== $expected) {
		throw new RuntimeException("Normalized origin of {$in} changed");
	}
}

echo "Request origin checks passed\n";
