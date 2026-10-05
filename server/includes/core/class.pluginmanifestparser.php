<?php

/*
 * SPDX-FileCopyrightText: Copyright 2020 - 2026 grommunio GmbH
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

/**
 * Turns a plugin manifest.xml into the plugin data used by the PluginManager.
 */
class PluginManifestParser {
	private const EMPTY_FILE_LIST = [
		LOAD_SOURCE => [],
		LOAD_DEBUG => [],
		LOAD_RELEASE => [],
	];

	private $loadMap;
	private $typeMap;
	private $dependMap;

	/**
	 * @param array $loadMap   'load' attribute values to LOAD_* defines
	 * @param array $typeMap   <serverfile> 'type' attribute values to TYPE_* defines
	 * @param array $dependMap <depends> 'type' attribute values to DEPEND_* defines
	 */
	public function __construct(array $loadMap, array $typeMap, array $dependMap) {
		$this->loadMap = $loadMap;
		$this->typeMap = $typeMap;
		$this->dependMap = $dependMap;
	}

	/**
	 * @param string $xml     plugin XML manifest
	 * @param string $dirname plugin directory name
	 *
	 * @return array|false plugin data, or false when the manifest is unsupported or incomplete
	 */
	public function parse($xml, $dirname) {
		$plugindata = [
			'components' => [],
			'dependencies' => null,
			'translationsdir' => null,
			'version' => null,
			'title' => $dirname,
			'optional' => null,
		];

		$data = new SimpleXMLElement($xml);

		if (isset($data['version']) && (int) $data['version'] !== 2) {
			if (DEBUG_PLUGINS) {
				dump("[PLUGIN ERROR] Plugin {$dirname} manifest uses version " . $data['version'] . " while only version 2 is supported");
			}

			return false;
		}

		if (isset($data->info->version)) {
			$plugindata['version'] = (string) $data->info->version;
		}
		else {
			dump("[PLUGIN WARNING] Plugin {$dirname} has not specified version information in manifest.xml");
		}
		if (isset($data->info->title)) {
			$plugindata['title'] = (string) $data->info->title;
		}

		if (isset($data->config)) {
			$plugindata['components'][] = $this->parseConfig($data->config, $dirname);
		}

		if (isset($data->dependencies, $data->dependencies->depends)) {
			$plugindata['dependencies'] = $this->parseDependencies($data->dependencies->depends);
		}

		if (isset($data->optional)) {
			$plugindata['optional'] = ((string) $data->optional['settingsname']) ?: $dirname;
		}

		if (isset($data->translations, $data->translations->translationsdir)) {
			$plugindata['translationsdir'] = [
				'dir' => (string) $data->translations->translationsdir,
			];
		}

		if (!isset($data->components, $data->components->component)) {
			if (DEBUG_PLUGINS) {
				dump("[PLUGIN ERROR] Plugin {$dirname} manifest didn't provide any components");
			}

			return false;
		}

		foreach ($data->components->component as $component) {
			if (isset($component->files)) {
				$plugindata['components'][] = $this->parseComponentFiles($component->files, $dirname);
			}
		}

		return $plugindata;
	}

	/**
	 * @param SimpleXMLElement $config
	 * @param string           $dirname
	 *
	 * @return array
	 */
	private function parseConfig($config, $dirname) {
		if (isset($config->configfile)) {
			if (empty($config->configfile)) {
				dump("[PLUGIN ERROR] Plugin {$dirname} manifest contains empty configfile declaration");
			}
			if (!file_exists($config->configfile)) {
				dump("[PLUGIN ERROR] Plugin {$dirname} manifest config file does not exists");
			}
		}
		else {
			dump("[PLUGIN ERROR] Plugin {$dirname} manifest configfile entry is missing");
		}

		$files = self::EMPTY_FILE_LIST;
		foreach ($config->configfile as $filename) {
			$files[LOAD_RELEASE][] = [
				'file' => (string) $filename,
				'type' => TYPE_CONFIG,
				'load' => LOAD_RELEASE,
				'module' => null,
				'notifier' => null,
			];
		}

		return [
			'serverfiles' => $files,
			'clientfiles' => [],
			'resourcefiles' => [],
		];
	}

	/**
	 * @param SimpleXMLElement $dependsList the <depends> elements
	 *
	 * @return array
	 */
	private function parseDependencies($dependsList) {
		$dependencies = [
			DEPEND_DEPENDS => [],
			DEPEND_REQUIRES => [],
			DEPEND_RECOMMENDS => [],
			DEPEND_SUGGESTS => [],
		];
		foreach ($dependsList as $depends) {
			$type = $this->dependMap[(string) $depends->attributes()->type];
			$dependencies[$type][] = [
				'plugin' => (string) $depends->dependsname,
			];
		}

		return $dependencies;
	}

	/**
	 * @param SimpleXMLElement $files   the <files> element of a component
	 * @param string           $dirname
	 *
	 * @return array
	 */
	private function parseComponentFiles($files, $dirname) {
		return [
			'serverfiles' => $this->parseFileList($files->server->serverfile ?? [], $dirname, true),
			'clientfiles' => $this->parseFileList($files->client->clientfile ?? [], $dirname, false),
			'resourcefiles' => $this->parseFileList($files->resources->resourcefile ?? [], $dirname, false),
		];
	}

	/**
	 * @param array|SimpleXMLElement $elements the file elements
	 * @param string           $dirname
	 * @param bool             $server   whether these are <serverfile> elements
	 *
	 * @return array the file entries keyed by load level
	 */
	private function parseFileList($elements, $dirname, $server) {
		$files = self::EMPTY_FILE_LIST;
		foreach ($elements as $element) {
			$entry = $server ? $this->serverFileEntry($element) : $this->clientFileEntry($element);
			if (empty($entry['file'])) {
				$this->reportEmptyFile($dirname, $element);

				continue;
			}
			$unknown = $this->unknownAttribute($entry);
			if ($unknown !== null) {
				dump("[PLUGIN ERROR] Plugin {$dirname} manifest declares {$element->getName()} {$entry['file']} with unknown {$unknown} \"{$element[$unknown]}\", the file is ignored");

				continue;
			}
			$files[$entry['load']][] = $entry;
		}

		return [
			LOAD_SOURCE => $files[LOAD_SOURCE],
			LOAD_DEBUG => $files[LOAD_DEBUG],
			LOAD_RELEASE => $files[LOAD_RELEASE],
		];
	}

	/**
	 * @param SimpleXMLElement $element
	 *
	 * @return array
	 */
	private function serverFileEntry($element) {
		return [
			'file' => (string) $element,
			'type' => isset($element['type']) ? $this->typeMap[(string) $element['type']] ?? null : TYPE_PLUGIN,
			'load' => $this->fileLoad($element),
			'module' => isset($element['module']) ? (string) $element['module'] : null,
			'notifier' => isset($element['notifier']) ? (string) $element['notifier'] : null,
		];
	}

	/**
	 * @param SimpleXMLElement $element
	 *
	 * @return array
	 */
	private function clientFileEntry($element) {
		return [
			'file' => (string) $element,
			'load' => $this->fileLoad($element),
		];
	}

	/**
	 * @param SimpleXMLElement $element
	 */
	private function fileLoad($element) {
		return isset($element['load']) ? $this->loadMap[(string) $element['load']] ?? null : LOAD_RELEASE;
	}

	/**
	 * @param array $entry the parsed file entry
	 *
	 * @return null|string the attribute whose value is not known
	 */
	private function unknownAttribute($entry) {
		foreach (['load', 'type'] as $attribute) {
			if (array_key_exists($attribute, $entry) && $entry[$attribute] === null) {
				return $attribute;
			}
		}

		return null;
	}

	/**
	 * @param string           $dirname
	 * @param SimpleXMLElement $element
	 */
	private function reportEmptyFile($dirname, $element) {
		$name = $element->getName();
		if ($name === 'serverfile' || DEBUG_PLUGINS) {
			dump("[PLUGIN ERROR] Plugin {$dirname} manifest contains empty {$name} declaration");
		}
	}
}
