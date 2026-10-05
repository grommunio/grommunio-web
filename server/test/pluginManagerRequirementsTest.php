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

function plugin(array $depends, array $requires) {
	$dependencies = [DEPEND_DEPENDS => [], DEPEND_REQUIRES => [], DEPEND_RECOMMENDS => [], DEPEND_SUGGESTS => []];
	foreach ([DEPEND_DEPENDS => $depends, DEPEND_REQUIRES => $requires] as $type => $names) {
		foreach ($names as $name) {
			$dependencies[$type][] = ['plugin' => $name];
		}
	}

	return ['dependencies' => $dependencies];
}

$manager = new PluginManager(false);
$manager->plugindata = [
	'a' => plugin(['missingdep'], []),
	'b' => plugin([], ['missingreq']),
];
if ($manager->validatePluginRequirements() || $manager->plugindata !== []) {
	throw new RuntimeException('Plugins with unmet dependencies were kept.');
}
if ($dumps !== [
	'[PLUGIN ERROR] Plugin "a" depends on "missingdep" which could not be found',
	'[PLUGIN ERROR] Plugin "b" requires "missingreq" which could not be found',
]) {
	throw new RuntimeException('Unexpected dependency messages: ' . json_encode($dumps));
}

echo "Plugin requirement checks passed\n";
