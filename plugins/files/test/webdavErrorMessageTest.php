<?php

/*
 * SPDX-FileCopyrightText: Copyright 2020 - 2026 grommunio GmbH
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

if (!function_exists('_')) {
	function _($message) {
		return $message;
	}
}

require_once dirname(__DIR__) . '/php/Files/Backend/Webdav/class.backend.php';

use Files\Backend\Webdav\Backend;

$backend = (new ReflectionClass(Backend::class))->newInstanceWithoutConstructor();
$parse = new ReflectionMethod(Backend::class, 'parseErrorCodeToMessage');

$admin = ' Please contact your system administrator.';
$unreachable = 'File server is not reachable. Please verify the connection.';
$expected = [
	401 => 'Unauthorized. Wrong username or password.',
	403 => 'You don\'t have enough permissions to view this file or folder.',
	404 => 'The file or folder is not available anymore.',
	405 => 'File server is not reachable. Please verify the file server URL.',
	408 => 'Connection to the file server timed out. Please check again later.',
	423 => 'This file is locked by another user. Please try again later.',
	500 => 'The file server encountered an internal problem.' . $admin,
	800 => $unreachable,
	801 => 'We could not write to temporary directory.' . $admin,
	802 => 'We could not retrieve list of server features.' . $admin,
	803 => 'PHP-Curl is not available.' . $admin,
	'404' => 'The file or folder is not available anymore.',
	0 => 'Unknown error',
	999 => 'Unknown error',
];
if (defined('CURLE_COULDNT_CONNECT')) {
	$expected[CURLE_COULDNT_CONNECT] = $unreachable;
	$expected[CURLE_COULDNT_RESOLVE_HOST] = $unreachable;
	$expected[CURLE_SSL_CONNECT_ERROR] = $unreachable;
}

foreach ($expected as $code => $message) {
	$actual = $parse->invoke($backend, $code);
	if ($actual !== $message) {
		throw new RuntimeException("Code {$code}: expected '{$message}', got '{$actual}'.");
	}
}

// a rejected MOVE must not be reported as done
$backend->sabre_client = new class {
	public $status = 404;

	public function request($method, $url, $body = null, $headers = []) {
		return ['statusCode' => $this->status];
	}
};
try {
	$backend->move('/missing.txt', '/q.txt');

	throw new RuntimeException('MOVE answered 404 but no exception was thrown.');
}
catch (Files\Backend\Exception $e) {
	if ($e->getCode() !== 404) {
		throw new RuntimeException('MOVE failure carries code ' . $e->getCode());
	}
}
$backend->sabre_client->status = 201;
if ($backend->move('/a.txt', '/b.txt') !== true) {
	throw new RuntimeException('MOVE with 201 failed.');
}

// the other write operations must fail the same way
$backend->sabre_client->status = 403;
foreach (['mkcol' => ['/d'], 'delete' => ['/a.txt'], 'put' => ['/a.txt', 'x'], 'copy_file' => ['/a.txt', '/b.txt'], 'copy_coll' => ['/d', '/e']] as $method => $args) {
	try {
		$backend->{$method}(...$args);

		throw new RuntimeException("{$method} answered 403 but no exception was thrown.");
	}
	catch (Files\Backend\Exception $e) {
		if ($e->getCode() !== 403) {
			throw new RuntimeException("{$method} failure carries code " . $e->getCode());
		}
	}
}
$backend->sabre_client->status = 201;
if ($backend->mkcol('/d') !== true || $backend->put('/a.txt', 'x') !== true) {
	throw new RuntimeException('Write with 201 failed.');
}
$backend->sabre_client->status = 404;
if ($backend->delete('/gone.txt') !== true) {
	throw new RuntimeException('DELETE of a missing item failed.');
}

echo "webdavErrorMessageTest: OK\n";
