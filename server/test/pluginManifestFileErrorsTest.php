<?php

/*
 * SPDX-FileCopyrightText: Copyright 2020 - 2026 grommunio GmbH
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

foreach ([
	'LOAD_RELEASE' => 1,
	'LOAD_DEBUG' => 2,
	'LOAD_SOURCE' => 3,
	'ENABLE_PLUGINS' => false,
	'DEBUG_PLUGINS' => true,
] as $name => $value) {
	defined($name) || define($name, $value);
}

$dumps = [];
if (!function_exists('dump')) {
	function dump($message) {
		$GLOBALS['dumps'][] = $message;
	}
}

require_once dirname(__DIR__) . '/includes/core/class.pluginmanager.php';

function check($condition, $message) {
	if (!$condition) {
		throw new RuntimeException($message . ' ' . json_encode($GLOBALS['dumps']));
	}
}

function parse($files) {
	$GLOBALS['dumps'] = [];
	$xml = '<plugin version="2"><info><version>1</version></info><components><component><files>' . $files . '</files></component></components></plugin>';

	return (new PluginManager(false))->extractPluginDataFromXML($xml, 'sample')['components'][0];
}

parse('<client><clientfile load="release"></clientfile></client>');
check($dumps === ['[PLUGIN ERROR] Plugin sample manifest contains empty clientfile declaration'], 'An empty clientfile was not reported as such.');
parse('<resources><resourcefile></resourcefile></resources>');
check($dumps === ['[PLUGIN ERROR] Plugin sample manifest contains empty resourcefile declaration'], 'An empty resourcefile was not reported as such.');

echo "Plugin manifest file error checks passed\n";
