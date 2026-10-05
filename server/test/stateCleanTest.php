<?php

/*
 * SPDX-FileCopyrightText: Copyright 2020 - 2026 grommunio GmbH
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

$temporaryDirectory = sys_get_temp_dir() . '/grommunio-state-clean-' . bin2hex(random_bytes(8));
if (!mkdir($temporaryDirectory, 0700)) {
	throw new RuntimeException('Unable to create the state test directory.');
}

define('TMP_PATH', $temporaryDirectory);
define('STATE_FILE_MAX_LIFETIME', 7200);

function dump($message) {}

require_once dirname(__DIR__) . '/includes/core/class.state.php';

$sessionDirectory = $temporaryDirectory . '/session';

function stateCleanAge($path, $seconds) {
	if (!touch($path, time() - $seconds, time() - $seconds)) {
		throw new RuntimeException('Unable to age ' . $path);
	}
}

try {
	$state = new State('fresh', 'test-owner');
	if (!$state->open()) {
		throw new RuntimeException('The state file could not be opened.');
	}
	$state->write('value', 1);
	$state->close();

	$files = [
		'old-content' => ['data', 3 * 3600],
		'old-empty' => ['', 2 * 3600],
		'recent-empty' => ['', 1800],
		'recent-content' => ['data', 5000],
	];
	foreach ($files as $name => [$contents, $age]) {
		file_put_contents($sessionDirectory . '/' . $name, $contents);
		stateCleanAge($sessionDirectory . '/' . $name, $age);
	}
	mkdir($sessionDirectory . '/old-directory');
	stateCleanAge($sessionDirectory . '/old-directory', 3 * 3600);
	symlink($sessionDirectory . '/recent-content', $sessionDirectory . '/old-link');
	stateCleanAge($sessionDirectory . '/.cleanup.lock', 3 * 3600);

	$locked = fopen($sessionDirectory . '/old-locked', 'w+');
	fwrite($locked, 'data');
	flock($locked, LOCK_EX);
	stateCleanAge($sessionDirectory . '/old-locked', 3 * 3600);

	(new State('cleaner', 'test-owner'))->clean();

	$remaining = array_values(array_diff(scandir($sessionDirectory), ['.', '..']));
	sort($remaining);
	$expected = ['.cleanup.lock', 'old-directory', 'old-link', 'old-locked', 'recent-content', 'recent-empty', 'test-owner.fresh'];
	if ($remaining !== $expected) {
		throw new RuntimeException('Unexpected files after cleaning: ' . implode(', ', $remaining));
	}
	flock($locked, LOCK_UN);
	fclose($locked);

	(new State('cleaner', 'test-owner'))->clean(1000);
	$remaining = array_values(array_diff(scandir($sessionDirectory), ['.', '..']));
	sort($remaining);
	$expected = ['.cleanup.lock', 'old-directory', 'old-link', 'test-owner.fresh'];
	if ($remaining !== $expected) {
		throw new RuntimeException('Unexpected files after the short cleaning: ' . implode(', ', $remaining));
	}
}
finally {
	if (is_dir($sessionDirectory)) {
		foreach (array_diff(scandir($sessionDirectory), ['.', '..']) as $filename) {
			$path = $sessionDirectory . '/' . $filename;
			if (is_dir($path) && !is_link($path) ? !rmdir($path) : !unlink($path)) {
				throw new RuntimeException('Unable to remove a state test file.');
			}
		}
		rmdir($sessionDirectory);
	}
	if (!rmdir($temporaryDirectory)) {
		throw new RuntimeException('Unable to remove the state test directory.');
	}
}

echo "State cleaning checks passed\n";
