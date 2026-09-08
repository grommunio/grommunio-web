<?php

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

class InvalidPluginManager extends PluginManager {
	public function processPlugin($dirname) {
		return false;
	}
}

$manager = new InvalidPluginManager(false);
$normalize = new ReflectionMethod(PluginManager::class, 'normalizePluginData');
$legacyData = [
	'filesbackendOwncloud' => [
		'pluginname' => 'filesbackendOwncloud',
		'components' => [],
	],
];
$normalized = $normalize->invoke($manager, $legacyData);
if (isset($normalized['filesbackendOwncloud']) ||
	($normalized['filesbackendDefault']['pluginname'] ?? null) !== 'filesbackendDefault') {
	throw new RuntimeException('Invalid fresh plugin data did not fall back to cached legacy metadata.');
}

$testRoot = sys_get_temp_dir() . '/grommunio-plugin-' . bin2hex(random_bytes(8));
$pluginRoot = $testRoot . '/invalid';
if (!mkdir($pluginRoot, 0700, true) || file_put_contents($pluginRoot . '/manifest.xml', '<plugin version="1"/>') === false) {
	throw new RuntimeException('Could not create the invalid-plugin fixture.');
}

try {
	$manager->pluginpath = $testRoot;
	if ($manager->readPluginFolder([]) !== []) {
		throw new RuntimeException('Invalid plugin data was added to the plugin registry.');
	}
}
finally {
	unlink($pluginRoot . '/manifest.xml');
	rmdir($pluginRoot);
	rmdir($testRoot);
}

echo "Invalid plugin metadata checks passed\n";
