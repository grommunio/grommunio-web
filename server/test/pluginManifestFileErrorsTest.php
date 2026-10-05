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

// An unknown load or type value drops the file with a message instead of a warning.
set_error_handler(static function ($errno, $errstr) {
	throw new ErrorException($errstr, 0, $errno);
});
$component = parse('<server><serverfile load="nightly">php/a.php</serverfile><serverfile type="widget">php/b.php</serverfile><serverfile>php/c.php</serverfile></server>'
	. '<client><clientfile load="nightly">js/a.js</clientfile><clientfile>js/b.js</clientfile></client>');
restore_error_handler();
check($dumps === [
	'[PLUGIN ERROR] Plugin sample manifest declares serverfile php/a.php with unknown load "nightly", the file is ignored',
	'[PLUGIN ERROR] Plugin sample manifest declares serverfile php/b.php with unknown type "widget", the file is ignored',
	'[PLUGIN ERROR] Plugin sample manifest declares clientfile js/a.js with unknown load "nightly", the file is ignored',
], 'Unknown attribute values were not reported.');
check(array_column($component['serverfiles'][LOAD_RELEASE], 'file') === ['php/c.php'] && count($component['serverfiles']) === 3, 'Unknown server files were not dropped.');
check(array_column($component['clientfiles'][LOAD_RELEASE], 'file') === ['js/b.js'] && count($component['clientfiles']) === 3, 'Unknown client files were not dropped.');

echo "Plugin manifest file error checks passed\n";
