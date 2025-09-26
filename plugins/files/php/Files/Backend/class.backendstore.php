<?php

namespace Files\Backend;

require_once __DIR__ . "/../Core/Util/class.logger.php";
require_once __DIR__ . "/../Core/Util/class.stringutil.php";

// For backward compatibility we must check if the file exists
if (file_exists(BASE_PATH . 'server/includes/core/class.encryptionstore.php')) {
	require_once BASE_PATH . 'server/includes/core/class.encryptionstore.php';
}

use Files\Core\Util\Logger;
use Files\Core\Util\StringUtil;

class BackendStore {
	public const EXTERNAL_BACKEND_PREFIX = "filesbackend"; // folder prefix for external backends
	private $EXTERNAL_BACKEND_DIR = ""; // path to search for external plugins (should be grommunio-web/plugins)
	public const BACKEND_DIR = "/"; // path to search for core backends, relative to current path
	public const LOG_CONTEXT = "BackendStore"; // Context for the Logger

	/**
	 * Mapping of legacy backend names to their canonical replacements.
	 *
	 * @var array<string, string>
	 */
	private $backendAliases = [
		'Owncloud' => 'Default',
	];

	/**
	 * Feature variables.
	 */
	public const FEATURE_QUOTA = "Quota";
	public const FEATURE_VERSION = "VersionInfo";
	public const FEATURE_SHARING = "Sharing";
	public const FEATURE_STREAMING = "Streaming";
	public const FEATURE_OAUTH = "OAUTH";

	/**
	 * @var AbstractBackend
	 */
	private $backends = [];
	protected static $_instance;

	// Make it a singleton
	private function __construct() {
		// Be tolerant if PATH_PLUGIN_DIR is not defined in config.php
		$pluginsDir = defined('PATH_PLUGIN_DIR') ? constant('PATH_PLUGIN_DIR') : 'plugins';
		$this->EXTERNAL_BACKEND_DIR = BASE_PATH . rtrim($pluginsDir, '/') . "/";

		Logger::debug(self::LOG_CONTEXT, "Searching for external backends in " . $this->EXTERNAL_BACKEND_DIR);
	}

	/**
	 * Call this method to get singleton.
	 *
	 * @return BackendStore
	 */
	public static function getInstance() {
		if (self::$_instance === null) {
			self::$_instance = new self();
			self::$_instance->initialize();
			self::$_instance->initializeExternal();
		}

		return self::$_instance;
	}

	/**
	 * Search the backend folder for backends and register them.
	 */
	public function initialize() {
		$list = [];
		$workdir = __DIR__ . self::BACKEND_DIR;

		// Populate the list of directories to check against
		if (($directoryHandle = opendir($workdir)) !== false) {
			while (($file = readdir($directoryHandle)) !== false) {
				// Make sure we're not dealing with a file or a link to the parent directory
				if (is_dir($workdir . $file) && ($file == '.' || $file == '..') !== true) {
					array_push($list, $file);
				}
			}
		}
		else {
			Logger::error(self::LOG_CONTEXT, "Error opening the backend directory: " . $workdir);
		}

		// Register the backends
		foreach ($list as $backend) {
			Logger::debug(self::LOG_CONTEXT, "Registering backend: " . $backend);
			$this->register($backend);
		}
	}

	/**
	 * Search the backend folder for external backends and register them.
	 */
	public function initializeExternal() {
		$list = [];
		$workdir = $this->EXTERNAL_BACKEND_DIR;

		// Populate the list of directories to check against
		if (($directoryHandle = opendir($workdir)) !== false) {
			while (($file = readdir($directoryHandle)) !== false) {
				// Make sure we're not dealing with a file or a link to the parent directory
				if (is_dir($workdir . $file) && ($file == '.' || $file == '..') !== true && StringUtil::startsWith($file, self::EXTERNAL_BACKEND_PREFIX)) {
					$backendName = substr($file, strlen(self::EXTERNAL_BACKEND_PREFIX));
					array_push($list, $backendName);
				}
			}
		}
		else {
			Logger::error(self::LOG_CONTEXT, "Error opening the external backend directory: " . $workdir);
		}

		// Register the backends
		foreach ($list as $backend) {
			Logger::debug(self::LOG_CONTEXT, "Registering external backend: " . $backend);
			$this->registerExternal($backend);
		}
	}

	/**
	 * Registration adds the backend to the list of plugins, and also
	 * includes it's code into our runtime.
	 *
	 * @param mixed $backend
	 */
	private function register($backend) {
		require_once __DIR__ . self::BACKEND_DIR . $backend . "/class.backend.php";
		array_push($this->backends, $backend);
	}

	/**
	 * Registration adds the external backend to the list of plugins, and also
	 * includes it's code into our runtime.
	 *
	 * @param mixed $backend
	 */
	private function registerExternal($backend) {
		require_once $this->EXTERNAL_BACKEND_DIR . self::EXTERNAL_BACKEND_PREFIX . $backend . "/php/class.backend.php";
		array_push($this->backends, $backend);
	}

	/**
	 * Check if a backend is registered.
	 *
	 * @param mixed $backend
	 *
	 * @return bool
	 */
	public function backendExists($backend) {
		$canonical = $this->normalizeBackendName($backend);
		foreach ($this->backends as $registeredbackend) {
			if ($canonical === $registeredbackend) {
				return true;
			}
		}

		Logger::log(self::LOG_CONTEXT, "Backend does not exist: " . $backend);

		return false;
	}

	/**
	 * Creates a new Instance of the given backendtype.
	 *
	 * @param mixed $backend
	 *
	 * @return AbstractBackend
	 */
	public function getInstanceOfBackend($backend) {
		$canonical = $this->normalizeBackendName($backend);
		if ($this->backendExists($canonical)) {
			$class = "\\Files\\Backend\\{$canonical}\\Backend";

			return new $class();
		}

		return false; // return false if the backend does not exist
	}

	/**
	 * Normalize backend identifier to canonical name.
	 *
	 * @param string $backend
	 *
	 * @return string
	 */
	public function normalizeBackendName($backend) {
		return $this->backendAliases[$backend] ?? $backend;
	}

	/**
	 * Return all registered backend internal names.
	 *
	 * @return array
	 */
	public function getRegisteredBackendNames() {
		return $this->backends;
	}
}
