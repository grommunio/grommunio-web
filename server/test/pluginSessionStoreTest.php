<?php

/*
 * SPDX-FileCopyrightText: Copyright 2020 - 2026 grommunio GmbH
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

class State {
	public static $data = [];

	public function __construct(private $name) {}

	public function open() {
		return true;
	}

	public function read($key) {
		return self::$data[$this->name][$key] ?? null;
	}

	public function write($key, $value, $flush = true) {
		self::$data[$this->name][$key] = $value;
	}

	public function close() {}
}

require_once dirname(__DIR__) . '/includes/core/class.pluginsessionstore.php';

function check($condition, $message) {
	if (!$condition) {
		throw new RuntimeException($message);
	}
}

State::$data['plugin_sessiondata']['sessionData'] = [
	'files' => ['keep' => 1, 'drop' => 2],
	'other' => ['x' => 1],
];

$first = new PluginSessionStore();
$firstData = false;
$first->load($firstData, 'files', 'files', true);
$second = new PluginSessionStore();
$secondData = false;
$second->load($secondData, 'files', 'files', true);

$local = $firstData['files'];
$local['a'] = 'first';
unset($local['drop']);
check($first->save($firstData, 'files', 'files', $local), 'First save failed.');

$local = $secondData['files'];
$local['b'] = 'second';
$local['keep'] = 3;
check($second->save($secondData, 'files', 'files', $local), 'Second save failed.');

$stored = State::$data['plugin_sessiondata']['sessionData'];
check($stored['files'] === ['keep' => 3, 'a' => 'first', 'b' => 'second'], 'Concurrent plugin session changes were not merged.');
check($stored['other'] === ['x' => 1], 'Session data of other plugins was changed.');
check($secondData === $stored, 'The caller did not receive the stored session data.');

State::$data['plugin_sessiondata']['sessionData'] = ['legacyname' => ['k' => 'v']];
$store = new PluginSessionStore();
$data = false;
$store->load($data, 'legacyname', 'newname', true);
check($data === ['newname' => ['k' => 'v']], 'Legacy session data was not moved to the canonical name.');

$data = false;
$store->load($data, 'missing', 'missing', false);
check(!isset($data['missing']), 'Session data was created for a plugin that does not exist.');

echo "Plugin session store checks passed\n";
