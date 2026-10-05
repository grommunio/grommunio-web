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
	'DEBUG_PLUGINS' => false,
] as $name => $value) {
	defined($name) || define($name, $value);
}

require_once dirname(__DIR__) . '/includes/core/class.pluginmanager.php';

class FreshPluginManager extends PluginManager {
	public function processPlugin($dirname) {
		return ['pluginname' => $dirname, 'components' => [], 'dependencies' => null];
	}
}

$manager = new FreshPluginManager(false);
$normalize = new ReflectionMethod(PluginManager::class, 'normalizePluginData');

// A disabled or dropped canonical plugin must not be read back in.
$normalized = $normalize->invoke($manager, ['files' => ['pluginname' => 'files']]);
if (isset($normalized['filesbackendDefault'])) {
	throw new RuntimeException('An absent aliased plugin was put back into the plugin data.');
}
$manager->plugindata = $normalized;
if ($manager->pluginExists('filesbackendDefault') || $manager->pluginExists('filesbackendOwncloud')) {
	throw new RuntimeException('An absent aliased plugin is reported as present.');
}

// A present plugin is still refreshed under its canonical name.
$normalized = $normalize->invoke($manager, ['filesbackendOwncloud' => ['pluginname' => 'filesbackendOwncloud']]);
if (isset($normalized['filesbackendOwncloud']) || ($normalized['filesbackendDefault']['pluginname'] ?? null) !== 'filesbackendDefault') {
	throw new RuntimeException('A legacy plugin was not moved to its canonical name.');
}

echo "Plugin alias checks passed\n";
