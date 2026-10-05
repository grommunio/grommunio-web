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

$dumps = [];
function dump($message) {
	$GLOBALS['dumps'][] = $message;
}

require_once dirname(__DIR__) . '/includes/core/class.pluginmanager.php';

function check($condition, $message) {
	if (!$condition) {
		throw new RuntimeException($message);
	}
}

$manager = new PluginManager(false);
$xml = <<<'XML'
	<plugin version="2">
		<info><version>1.2</version><title>Sample</title></info>
		<dependencies>
			<depends type="depends"><dependsname>files</dependsname></depends>
			<depends type="suggests"><dependsname>maps</dependsname></depends>
		</dependencies>
		<optional/>
		<translations><translationsdir>language</translationsdir></translations>
		<components>
			<component>
				<files>
					<server>
						<serverfile>php/plugin.sample.php</serverfile>
						<serverfile type="module" module="samplemodule" load="debug">php/module.php</serverfile>
						<serverfile></serverfile>
					</server>
					<client>
						<clientfile load="release">js/sample.js</clientfile>
						<clientfile load="source">js/A.js</clientfile>
						<clientfile load="source">js/B.js</clientfile>
					</client>
				</files>
			</component>
			<component/>
		</components>
	</plugin>
	XML;

$data = $manager->extractPluginDataFromXML($xml, 'sample');
check($data['version'] === '1.2' && $data['title'] === 'Sample' && $data['optional'] === 'sample', 'Plugin info was not parsed.');
check($data['translationsdir'] === ['dir' => 'language'], 'Translations dir was not parsed.');
check($data['dependencies'] === [
	DEPEND_DEPENDS => [['plugin' => 'files']],
	DEPEND_REQUIRES => [],
	DEPEND_RECOMMENDS => [],
	DEPEND_SUGGESTS => [['plugin' => 'maps']],
], 'Dependencies were not parsed.');
check(count($data['components']) === 1, 'A component without files must be skipped.');
$component = $data['components'][0];
check($component['serverfiles'] === [
	LOAD_SOURCE => [],
	LOAD_DEBUG => [['file' => 'php/module.php', 'type' => TYPE_MODULE, 'load' => LOAD_DEBUG, 'module' => 'samplemodule', 'notifier' => null]],
	LOAD_RELEASE => [['file' => 'php/plugin.sample.php', 'type' => TYPE_PLUGIN, 'load' => LOAD_RELEASE, 'module' => null, 'notifier' => null]],
], 'Server files were not parsed.');
check($component['clientfiles'] === [
	LOAD_SOURCE => [['file' => 'js/A.js', 'load' => LOAD_SOURCE], ['file' => 'js/B.js', 'load' => LOAD_SOURCE]],
	LOAD_DEBUG => [],
	LOAD_RELEASE => [['file' => 'js/sample.js', 'load' => LOAD_RELEASE]],
], 'Client files were not parsed.');
check($component['resourcefiles'] === [LOAD_SOURCE => [], LOAD_DEBUG => [], LOAD_RELEASE => []], 'Missing resources must give empty lists.');
check(in_array('[PLUGIN ERROR] Plugin sample manifest contains empty serverfile declaration', $dumps, true), 'Empty serverfile was not reported.');

check($manager->extractPluginDataFromXML('<plugin version="1"><components><component/></components></plugin>', 'old') === false, 'Version 1 manifests must be rejected.');
check($manager->extractPluginDataFromXML('<plugin><info><version>1</version></info></plugin>', 'empty') === false, 'Manifests without components must be rejected.');

foreach (glob(dirname(__DIR__, 2) . '/plugins/*/manifest.xml') as $manifest) {
	$dirname = basename(dirname($manifest));
	$manager->pluginpath = dirname($manifest, 2);
	$plugin = $manager->processPlugin($dirname);
	check(is_array($plugin) && $plugin['pluginname'] === $dirname && $plugin['components'] !== [], "Manifest of {$dirname} was not parsed.");
}

echo "Plugin manifest parser checks passed\n";
