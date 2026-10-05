<?php

/*
 * SPDX-FileCopyrightText: Copyright 2020 - 2026 grommunio GmbH
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

/* compressedImage() returns an empty string for unreadable thumbnails. */
defined('LOGLEVEL_ERROR') || define('LOGLEVEL_ERROR', 1);
if (!class_exists('Log')) {
	class Log {
		public static function Write($loglevel, $message, $data = null) {}
	}
}
if (!function_exists('imagecreatefromstring')) {
	// Mirror GD: an empty string is a ValueError, bad data returns false.
	function imagecreatefromstring(string $data) {
		if ($data === '') {
			throw new ValueError('imagecreatefromstring(): Argument #1 ($data) cannot be empty');
		}

		return false;
	}
}

require_once dirname(__DIR__) . '/includes/core/class.operations.php';

ini_set('error_log', '/dev/null');
set_error_handler(function (int $errno, string $errstr, string $errfile, int $errline): bool {
	throw new ErrorException($errstr, 0, $errno, $errfile, $errline);
});

$operations = new Operations();
foreach (['empty' => '', 'garbage' => 'not an image', 'null' => null] as $label => $image) {
	if ($operations->compressedImage($image) !== '') {
		throw new RuntimeException("An unreadable thumbnail ({$label}) produced an image");
	}
}

echo "Compressed image checks passed\n";
