<?php

/*
 * SPDX-FileCopyrightText: Copyright 2020 - 2026 grommunio GmbH
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

/**
 * Persists plugin session data in the 'plugin_sessiondata' state. Saves merge
 * only the keys a plugin changed since it loaded, so concurrent requests of
 * the same session do not overwrite each other.
 */
class PluginSessionStore {
	/**
	 * Serialized plugin session data at load time, keyed by plugin name.
	 */
	private $snapshots = [];

	/**
	 * Reads the session data of all plugins on first use and prepares the
	 * entry of one plugin.
	 *
	 * @param array|false $sessionData   session data of all plugins, false when not read yet
	 * @param string      $pluginname    plugin name as requested, possibly a legacy alias
	 * @param string      $canonicalName canonical plugin name
	 * @param bool        $exists        whether the plugin is loaded
	 */
	public function load(&$sessionData, $pluginname, $canonicalName, $exists) {
		if ($sessionData === false) {
			$sessionData = $this->read();
		}

		if ($pluginname !== $canonicalName && isset($sessionData[$pluginname])) {
			$sessionData[$canonicalName] = $sessionData[$pluginname];
			unset($sessionData[$pluginname]);
		}

		if ($exists) {
			if (!isset($sessionData[$canonicalName])) {
				$sessionData[$canonicalName] = [];
			}
			$this->snapshots[$canonicalName] = serialize($sessionData[$canonicalName]);
		}
	}

	/**
	 * Merges the changes of one plugin into the stored session data.
	 *
	 * @param array|false $sessionData       session data of all plugins, replaced by the stored state
	 * @param string      $pluginname        plugin name as requested, possibly a legacy alias
	 * @param string      $canonicalName     canonical plugin name
	 * @param mixed       $pluginSessionData the plugin's current session data
	 *
	 * @return bool false when the state could not be opened
	 */
	public function save(&$sessionData, $pluginname, $canonicalName, $pluginSessionData) {
		if (isset($this->snapshots[$canonicalName])) {
			$baseSessionData = unserialize($this->snapshots[$canonicalName]);
		}
		else {
			$baseSessionData = is_array($sessionData) && array_key_exists($canonicalName, $sessionData) ?
				$sessionData[$canonicalName] : [];
		}
		if (!is_array($sessionData)) {
			$sessionData = [];
		}

		$sessState = new State('plugin_sessiondata');
		if (!$sessState->open()) {
			error_log('Unable to save plugin session state: ' . $canonicalName);

			return false;
		}

		try {
			$currentSessionData = $sessState->read("sessionData");
			if (!is_array($currentSessionData)) {
				$currentSessionData = [];
			}
			if ($pluginname !== $canonicalName) {
				if (!isset($currentSessionData[$canonicalName]) && isset($currentSessionData[$pluginname])) {
					$currentSessionData[$canonicalName] = $currentSessionData[$pluginname];
				}
				unset($currentSessionData[$pluginname]);
			}
			$currentPluginData = $currentSessionData[$canonicalName] ?? [];
			$currentSessionData[$canonicalName] = $this->merge(
				$currentPluginData,
				$pluginSessionData,
				$baseSessionData
			);
			$sessState->write("sessionData", $currentSessionData);
			$sessionData = $currentSessionData;
			$this->snapshots[$canonicalName] = serialize($currentSessionData[$canonicalName]);
		}
		finally {
			$sessState->close();
		}

		return true;
	}

	/**
	 * @return array
	 */
	private function read() {
		$sessState = new State('plugin_sessiondata');
		if (!$sessState->open()) {
			throw new RuntimeException('Unable to read plugin session state');
		}

		try {
			$sessionData = $sessState->read("sessionData");
		}
		finally {
			$sessState->close();
		}
		if (!isset($sessionData) || $sessionData == "") {
			$sessionData = [];
		}

		return $sessionData;
	}

	/**
	 * Merge keys changed by one plugin instance into the latest state.
	 *
	 * @param mixed $current
	 * @param mixed $local
	 * @param mixed $base
	 */
	private function merge($current, $local, $base) {
		if (!is_array($current) || !is_array($local) || !is_array($base)) {
			return $local;
		}

		foreach ($base as $key => $value) {
			if (!array_key_exists($key, $local)) {
				unset($current[$key]);
			}
			elseif (serialize($local[$key]) !== serialize($value)) {
				$current[$key] = $local[$key];
			}
		}
		foreach ($local as $key => $value) {
			if (!array_key_exists($key, $base)) {
				$current[$key] = $value;
			}
		}

		return $current;
	}
}
