<?php

require_once dirname(__DIR__) . '/includes/core/class.iconsets.php';

$temporaryDirectory = sys_get_temp_dir() . '/grommunio-iconsets-' . bin2hex(random_bytes(8));
if (!mkdir($temporaryDirectory, 0700)) {
	throw new RuntimeException('Unable to create the iconset test directory.');
}

$logFile = $temporaryDirectory . '/errors.log';
$propsFile = $temporaryDirectory . '/iconset.json';
$previousErrorLog = ini_get('error_log');
$previousLogErrors = ini_get('log_errors');
ini_set('error_log', $logFile);
ini_set('log_errors', '1');

try {
	if (Iconsets::getProps($temporaryDirectory, 'missing') !== false) {
		throw new RuntimeException('An unreadable iconset file was accepted.');
	}

	file_put_contents($propsFile, '{broken');
	if (Iconsets::getProps($temporaryDirectory, 'malformed') !== false) {
		throw new RuntimeException('Malformed iconset JSON was accepted.');
	}

	file_put_contents($propsFile, '"valid scalar"');
	if (Iconsets::getProps($temporaryDirectory, 'scalar') !== false) {
		throw new RuntimeException('Scalar iconset JSON was accepted.');
	}

	file_put_contents($propsFile, '{"stylesheet":"icons.css"}');
	if (Iconsets::getProps($temporaryDirectory, 'valid') !== ['stylesheet' => 'icons.css']) {
		throw new RuntimeException('Valid iconset properties were rejected.');
	}

	$errors = file_get_contents($logFile);
	// file_get_contents() can fail even though the analyzer models this call as string-only.
	if (!is_string(/** @scrutinizer ignore-type */ $errors) ||
		!str_contains($errors, "iconset 'missing' does not have a readable iconset.json file") ||
		!str_contains($errors, "iconset 'malformed' does not have a valid iconset.json file") ||
		!str_contains($errors, "iconset 'scalar' iconset.json file must contain an array of properties")) {
		throw new RuntimeException('Iconset validation errors did not identify their cause.');
	}
}
finally {
	ini_set('error_log', $previousErrorLog);
	ini_set('log_errors', $previousLogErrors);

	if (is_file($propsFile)) {
		unlink($propsFile);
	}
	if (is_file($logFile)) {
		unlink($logFile);
	}
	rmdir($temporaryDirectory);
}

echo "Iconset property validation checks passed\n";
