<?php

/*
 * SPDX-FileCopyrightText: Copyright 2020 - 2026 grommunio GmbH
 * SPDX-FileCopyrightText: Copyright 2016 Kopano and its licensors
 * SPDX-FileCopyrightText: Copyright 2005 - 2016 Zarafa B.V. and its licensors
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

require __DIR__ . '/../exceptions/class.SettingsException.php';

/**
 * Generic settings class.
 *
 * This class allows access to various user settings which are normally
 * configured by the user. Settings can be set and retrieved
 * via this class. Default values must be provided at retrieval time.
 *
 * Settings have a path-like structure, for example:
 * <code>
 * path/to/setting => 5
 * </code>
 */
class Settings {
	/**
	 * Root key of the settings tree inside PR_EC_WEBACCESS_SETTINGS_JSON.
	 */
	private const SETTINGS_ROOT = 'grommunio';

	/**
	 * The root key used before the rename. Trees still carrying it are moved
	 * onto {@link self::SETTINGS_ROOT} by {@link #migrateLegacyRoot}.
	 */
	private const LEGACY_SETTINGS_ROOT = 'zarafa';

	/**
	 * User's default message store where we will be storing all the settings in a property.
	 */
	private $store;

	/**
	 * Associative array that stores all webapp settings; it is filled by retrieveAllSettings()
	 * and will be used when we call saveSettings.
	 */
	private $settings;

	/**
	 * Associative array that stores all persistent webapp settings; it is filled by
	 * retrieveAllSettings() and used when saveSettings() is called.
	 */
	private $persistentSettings;

	/**
	 * Boolean Flag to indicate that settings has been initialized and we can safely call saveSettings to
	 * add/update new settings, if this is false then it will indicate that there was some problem
	 * initializing $this->settings object and we shouldn't continue saving new settings as that will
	 * lose all existing settings of the user.
	 */
	private $init;

	/**
	 * True once retrieveSettings() returned, i.e. $this->settings came from the store.
	 */
	private $settingsLoaded;

	/**
	 * True once retrievePersistentSettings() returned.
	 */
	private $persistentSettingsLoaded;

	/**
	 *  Array Settings that are defined by system admin.
	 */
	private $sysAdminDefaults;

	/**
	 * True once a load attempt threw, so it is not retried on every accessor.
	 */
	private $loadFailed;

	/**
	 * Json encoded string which represents existing set of settings, this can be compared with json encoded
	 * string of $this->settings to check if there was a change in settings and we need to save the changes
	 * to mapi.
	 */
	private $settings_string;

	/**
	 * Json encoded string which represents existing set of settings, this can be compared with json encoded
	 * string of $this->settings to check if there was a change in settings and we need to save the changes
	 * to mapi.
	 */
	private $persistentSettingsString;

	/**
	 * Keeps track of all modifications on settings which are not saved yet.
	 * The array is reset in saveSettings() after a successful save.
	 */
	private $modified;

	/**
	 * Keeps track of all modifications on persistent settings which are not saved yet.
	 * The array is reset in savePersistentSettings() after a successful save.
	 */
	private $modifiedPersistent;

	/**
	 * True when the loaded tree still used the legacy root, so the migrated
	 * tree has to be written back once even if nothing else changed.
	 */
	private $legacyRootMigrated;

	public function __construct() {
		$this->settings = [];
		$this->persistentSettings = [];
		$this->sysAdminDefaults = [];
		$this->settings_string = '';
		$this->persistentSettingsString = '';
		$this->modified = [];
		$this->modifiedPersistent = [];
		$this->init = false;
		$this->loadFailed = false;
		$this->settingsLoaded = false;
		$this->persistentSettingsLoaded = false;
		$this->legacyRootMigrated = false;
	}

	/**
	 * Initialise the settings class.
	 *
	 * Opens the default store and gets the settings. This is done only once. Therefore
	 * changes written to the settings after the first Init() call will be invisible to this
	 * instance of the Settings class
	 */
	public function Init() {
		if ($this->init || $this->loadFailed) {
			return;
		}

		$GLOBALS['PluginManager']->triggerHook('server.core.settings.init.before', ['settingsObj' => $this]);

		$this->store = $GLOBALS['mapisession']->getDefaultMessageStore();

		// ignore exceptions when loading settings
		try {
			$this->retrieveSettings();
			$this->settingsLoaded = true;
			$this->retrievePersistentSettings();
			$this->persistentSettingsLoaded = true;

			// this object will only be initialized when we are able to retrieve existing settings correctly
			$this->init = true;
		}
		catch (SettingsException $e) {
			$e->setHandled();

			// $this->init stays false, so from here get() answers with its
			// default for every path.
			$this->loadFailed = true;
			$msg = "Settings::Init(): the settings of this store could not be loaded, continuing with defaults for every setting: " . $e->getMessage();
			error_log($msg);
			Log::Write(LOGLEVEL_ERROR, $msg);
		}

		// The tree is already migrated in memory, so every read is correct from
		// here on. Write it back once so the legacy root leaves the store.
		if ($this->init && $this->legacyRootMigrated) {
			$this->saveSettings();
		}
	}

	/**
	 * False means the load threw and was handled, so {@link #get} answers with
	 * its default for every path rather than with a stored value.
	 *
	 * @return bool true when the settings came from the store
	 */
	public function isLoaded() {
		if (!$this->init) {
			$this->Init();
		}

		return $this->settingsLoaded;
	}

	/**
	 * Get a setting from the settings repository.
	 *
	 * Retrieves the setting at the path specified. If the setting is not found, and no $default value
	 * is passed, returns null.
	 *
	 * @param null|string $path       path to the setting you want to get, separated with slashes
	 * @param mixed       $default    value returned when the setting is not found
	 * @param bool   $persistent set to true to get the given $path from the persistent settings
	 *
	 * @return mixed setting data, the complete settings array when no path is supplied, or the default
	 */
	public function get($path = null, $default = null, $persistent = false) {
		$path = $this->aliasPath($path);
		if (!$this->init) {
			$this->Init();
		}

		$settings = (bool) $persistent ? $this->persistentSettings : $this->settings;

		if ($path === null) {
			return $settings;
		}

		$path = explode('/', $path);

		$tmp = $settings;
		foreach ($path as $pointer) {
			if (!empty($pointer)) {
				if (!isset($tmp[$pointer])) {
					return $default;
				}
				$tmp = $tmp[$pointer];
			}
		}

		return $tmp;
	}

	/**
	 * Get a setting from the persistent settings repository.
	 *
	 * Retrieves the setting at the path specified. If the setting is not found, and no $default value
	 * is passed, returns null.
	 *
	 * @param null|string $path    path to the setting you want to get, separated with slashes
	 * @param mixed       $default value returned when the setting is not found
	 *
	 * @return mixed setting data, the complete settings array when no path is supplied, or the default
	 */
	public function getPersistent($path = null, $default = null) {
		return $this->get($path, $default, true);
	}

	/**
	 * Store a setting.
	 *
	 * Overwrites a setting at a specific settings path with the value passed.
	 *
	 * @param string $path       path to the setting you want to set, separated with slashes
	 * @param mixed  $value      New value for the setting
	 * @param bool   $autoSave   true to directly save the settings to the MAPI Store,
	 *                           this defaults to false as the settings will be saved at the end of the request
	 * @param bool   $persistent true to set a persistent setting, false otherwise
	 */
	public function set($path, $value, $autoSave = false, $persistent = false) {
		$path = $this->aliasPath($path);
		if (!$this->init) {
			$this->Init();
		}

		if ((bool) $persistent) {
			$this->modifiedPersistent[] = ['path' => $path, 'value' => $value];
		}
		else {
			$this->modified[] = ['path' => $path, 'value' => $value, 'delete' => false];
		}

		if ((bool) $persistent) {
			$this->setPathValue($this->persistentSettings, $path, $value);
		}
		else {
			$this->setPathValue($this->settings, $path, $value);
		}

		if ($autoSave === true) {
			(bool) $persistent ? $this->savePersistentSettings() : $this->saveSettings();
		}
	}

	/**
	 * Store a persistent setting.
	 *
	 * Overwrites a persistent setting at a specific settings path with the value passed.
	 *
	 * @param string $path     path to the setting you want to set, separated with slashes
	 * @param mixed  $value    New value for the setting
	 * @param bool   $autoSave true to directly save the settings to the MAPI Store,
	 *                         this defaults to false as the settings will be saved at the end of the request
	 */
	public function setPersistent($path, $value, $autoSave = false) {
		$this->set($path, $value, $autoSave, true);
	}

	/**
	 * Delete a setting.
	 *
	 * Deletes the setting references by $path
	 *
	 * @param string $path     Path to the setting you want to delete
	 * @param bool   $autoSave true to directly save the settings to the MAPI Store,
	 *                         this defaults to false as the settings will be saved at the end of the request
	 */
	public function delete($path, $autoSave = false) {
		$path = $this->aliasPath($path);
		if (!$this->init) {
			$this->Init();
		}

		$this->modified[] = ['path' => $path, 'delete' => true];
		if (!$this->deletePathValue($this->settings, $path)) {
			return;
		}

		if ($autoSave === true) {
			$this->saveSettings();
		}
	}

	/**
	 * Get all settings as a Javascript script.
	 *
	 * This function will output all settings as a JSON object, allowing easy including in client-side javascript.
	 *
	 * @return string json encoded php array
	 */
	public function getJSON() {
		if (!$this->init) {
			$this->Init();
		}

		return json_encode($this->settings);
	}

	/**
	 * Get all persistent settings as a Javascript script.
	 *
	 * This function will output all persistent settings as a JSON object, allowing easy including in client-side
	 * javascript.
	 *
	 * @return string json encoded php array
	 */
	public function getPersistentSettingsJSON() {
		if (!$this->init) {
			$this->Init();
		}

		return json_encode($this->persistentSettings);
	}

	/**
	 * Move a settings tree that still uses the legacy root onto the current one.
	 *
	 * Runs on every load rather than once, because reloadModifiedSettings()
	 * throws the in-memory tree away and re-reads the store before replaying
	 * this request's changes; normalising here keeps both paths on the new
	 * shape. The legacy subtree is dropped, and since writeSettings()
	 * serialises the whole tree the first save persists that removal.
	 *
	 * @param array $settings the decoded settings tree
	 *
	 * @return array the tree rooted at {@link self::SETTINGS_ROOT}
	 */
	/**
	 * Accept the legacy settings root plugins written before the rename still use.
	 *
	 * @param null|string $path
	 *
	 * @return null|string
	 */
	private function aliasPath($path) {
		if (is_string($path) && preg_match('#^/?' . self::LEGACY_SETTINGS_ROOT . '(?=/|$)#', $path)) {
			return preg_replace('#^/?' . self::LEGACY_SETTINGS_ROOT . '#', self::SETTINGS_ROOT, $path, 1);
		}

		return $path;
	}

	private function migrateLegacyRoot($settings) {
		if (!isset($settings[self::LEGACY_SETTINGS_ROOT])) {
			return $settings;
		}

		$legacy = $settings[self::LEGACY_SETTINGS_ROOT];
		unset($settings[self::LEGACY_SETTINGS_ROOT]);

		// Both roots exist when an earlier migration was interrupted, or when
		// the store saw a downgrade and then this version again. What the newer
		// root holds is the more recent value, so it wins over the legacy one.
		$settings[self::SETTINGS_ROOT] = isset($settings[self::SETTINGS_ROOT]) && is_array($settings[self::SETTINGS_ROOT])
			? array_replace_recursive(is_array($legacy) ? $legacy : [], $settings[self::SETTINGS_ROOT])
			: (is_array($legacy) ? $legacy : []);

		$this->legacyRootMigrated = true;

		return $settings;
	}

	/**
	 * Get settings from store.
	 *
	 * This function retrieves the actual settings from the store.
	 * Settings are stored in two different properties as we wanted to ship new webaccess and older webaccess
	 * simultenously so both webaccess uses different settings and doesn't interfere with each other.
	 *
	 * new webaccess uses string property PR_EC_WEBACCESS_SETTINGS_JSON which contains settings in JSON format
	 *
	 * This function returns nothing, but populates the 'settings' property of the class.
	 */
	public function retrieveSettings() {
		// first check if property exist and we can open that using mapi_openproperty
		$storeProps = mapi_getprops($this->store, [PR_EC_WEBACCESS_SETTINGS_JSON, PR_EC_USER_LANGUAGE]);

		$settings = ["settings" => ["grommunio" => ["v1" => ["main" => []]]]];
		// Check if property exists, if it does not exist then we can continue with empty set of settings
		$settingsString = readMapiProp($this->store, PR_EC_WEBACCESS_SETTINGS_JSON, $storeProps);
		if ($settingsString !== null) {
			$this->settings_string = $settingsString;

			if (!empty($this->settings_string)) {
				$settings = json_decode_data($this->settings_string, true);
				if (empty($settings) || empty($settings['settings'])) {
					throw new SettingsException(_('Error retrieving existing settings'));
				}
				$settings['settings'] = $this->migrateLegacyRoot($settings['settings']);
			}
			if (isset($storeProps[PR_EC_USER_LANGUAGE])) {
				$settings["settings"]["grommunio"]["v1"]["main"]["language"] = $storeProps[PR_EC_USER_LANGUAGE];
			}
			elseif (isset($_COOKIE['lang'])) {
				$settings["settings"]["grommunio"]["v1"]["main"]["language"] = $_COOKIE['lang'];
			}
			// Get and apply the System Administrator default settings
			$sysadminSettings = $this->getDefaultSysAdminSettings();
			$settings = array_replace_recursive($sysadminSettings, $settings['settings']);
			$this->settings = array_replace_recursive($settings, $this->settings);
		}
		elseif (!ENABLE_WELCOME_SCREEN) {
			/*
			 * if ENABLE_WELCOME_SCREEN is false and PR_EC_WEBACCESS_SETTINGS_JSON does not exist at that time, we
			 * just append the admin settings to settings array. Normally system admin settings
			 * contains plugin default enable/disable and other plugins related settings information which required
			 * while webapp loads.
			 */
			if (isset($storeProps[PR_EC_USER_LANGUAGE])) {
				$settings["settings"]["grommunio"]["v1"]["main"]["language"] = $storeProps[PR_EC_USER_LANGUAGE];
			}
			elseif (isset($_COOKIE['lang'])) {
				$settings["settings"]["grommunio"]["v1"]["main"]["language"] = $_COOKIE['lang'];
			}
			$sysadminSettings = $this->getDefaultSysAdminSettings();
			$this->settings = array_replace_recursive($sysadminSettings, $settings['settings']);
		}
	}

	/**
	 * Get persistent settings from store.
	 *
	 * This function retrieves the actual persistent settings from the store.
	 * Persistent settings are stored in PR_EC_WEBAPP_PERSISTENT_SETTINGS_JSON.
	 *
	 * This function returns nothing, but populates the 'persistentSettings' property of the class.
	 */
	private function retrievePersistentSettings() {
		// first check if property exist and we can open that using mapi_openproperty
		$storeProps = mapi_getprops($this->store, [PR_EC_WEBAPP_PERSISTENT_SETTINGS_JSON]);

		// Check if property exists, if it does not exist then we can continue with empty set of settings
		$persistentSettingsString = readMapiProp($this->store, PR_EC_WEBAPP_PERSISTENT_SETTINGS_JSON, $storeProps);
		if ($persistentSettingsString !== null) {
			$this->persistentSettingsString = $persistentSettingsString;

			if (!empty($this->persistentSettingsString)) {
				try {
					$persistentSettings = json_decode_data($this->persistentSettingsString, true);
				}
				catch (Exception) {
					throw new SettingsException(_('Error retrieving existing persistent settings'));
				}

				if (empty($persistentSettings) || empty($persistentSettings['settings'])) {
					throw new SettingsException(_('Error retrieving existing persistent settings'));
				}

				$this->persistentSettings = $persistentSettings['settings'];
			}
		}
	}

	/**
	 * Retrieves the default settings as defined by the System Administrator.
	 *
	 * @return array Settings object
	 */
	public function getDefaultSysAdminSettings() {
		return $this->sysAdminDefaults;
	}

	/**
	 * Applies the default settings defined by the System Administrator to the sysAdminDefaults
	 * property.
	 *
	 * @param array $settings The default settings
	 */
	public function addSysAdminDefaults($settings) {
		$this->sysAdminDefaults = array_replace_recursive($this->sysAdminDefaults, $this->migrateLegacyRoot($settings));
	}

	/**
	 * Takes two arrays, one settings and one defaults and removes the items from the settings
	 * array that have the same value as the defaults array. What is left is the settings that
	 * are not in the defaults array and the changed values of the ones that their keys do match
	 * in the defaults. It calls itself recursively to check the full array.
	 *
	 * @param array $settings The array containing the unfiltered settings
	 * @param array $defaults the array containing the default key/values
	 *
	 * @return array The filtered settings array
	 */
	public function filterOutSettings($settings, $defaults) {
		foreach ($defaults as $key => $value) {
			if (isset($settings[$key])) {
				if ($defaults[$key] == $settings[$key]) {
					unset($settings[$key]);
				}
				elseif (is_array($defaults[$key])) {
					$settings[$key] = $this->filterOutSettings($settings[$key], $defaults[$key]);
				}
			}
		}

		return $settings;
	}

	/**
	 * Set one slash-separated path in a settings array.
	 *
	 * @param mixed $settings
	 * @param mixed $path
	 * @param mixed $value
	 */
	private function setPathValue(&$settings, $path, $value) {
		$path = explode('/', $path);
		$lastKey = array_pop($path);
		$pointer = &$settings;

		foreach ($path as $key) {
			if (!isset($pointer[$key]) || !is_array($pointer[$key])) {
				$pointer[$key] = [];
			}
			$pointer = &$pointer[$key];
		}
		$pointer[$lastKey] = $value;
		unset($pointer);
	}

	/**
	 * Remove one slash-separated path from a settings array.
	 *
	 * @param mixed $settings
	 * @param mixed $path
	 */
	private function deletePathValue(&$settings, $path) {
		$keys = array_values(array_filter(explode('/', $path), static fn ($key) => $key !== ''));
		$lastKey = array_pop($keys);
		if ($lastKey === null) {
			return false;
		}

		$pointer = &$settings;
		foreach ($keys as $key) {
			if (!isset($pointer[$key]) || !is_array($pointer[$key])) {
				return false;
			}
			$pointer = &$pointer[$key];
		}
		if (!array_key_exists($lastKey, $pointer)) {
			return false;
		}
		unset($pointer[$lastKey], $pointer);

		return true;
	}

	/**
	 * Reload the latest regular settings and replay this request's changes.
	 */
	private function reloadModifiedSettings() {
		$settings = $this->settings;
		$settingsString = $this->settings_string;
		$this->settings = [];
		$this->settings_string = '';

		try {
			$this->retrieveSettings();
		}
		catch (Throwable $e) {
			$this->settings = $settings;
			$this->settings_string = $settingsString;

			throw $e;
		}

		foreach ($this->modified as $operation) {
			if ($operation['delete']) {
				$this->deletePathValue($this->settings, $operation['path']);
			}
			else {
				$this->setPathValue($this->settings, $operation['path'], $operation['value']);
			}
		}
	}

	/**
	 * Reload the latest persistent settings and replay this request's changes.
	 */
	private function reloadModifiedPersistentSettings() {
		$settings = $this->persistentSettings;
		$settingsString = $this->persistentSettingsString;
		$this->persistentSettings = [];
		$this->persistentSettingsString = '';

		try {
			$this->retrievePersistentSettings();
		}
		catch (Throwable $e) {
			$this->persistentSettings = $settings;
			$this->persistentSettingsString = $settingsString;

			throw $e;
		}

		foreach ($this->modifiedPersistent as $operation) {
			$this->setPathValue($this->persistentSettings, $operation['path'], $operation['value']);
		}
	}

	/**
	 * Refresh regular settings while preserving unsaved local changes.
	 */
	public function refreshSettings() {
		if (!$this->init) {
			$this->Init();
		}
		if ($this->settingsLoaded) {
			$this->reloadModifiedSettings();
		}
	}

	/**
	 * Save settings to store.
	 *
	 * This function saves all settings to the store's PR_EC_WEBACCESS_SETTINGS_JSON property, and to the
	 * PR_EC_OUTOFOFFICE_* properties.
	 */
	public function saveSettings() {
		if (!$this->init) {
			$this->Init();
		}

		// Saving now would replace stored settings that could not be read.
		if (!$this->settingsLoaded) {
			$msg = "Settings::saveSettings() skipped: the settings of this store could not be read, saving would replace them.";
			error_log($msg);
			Log::Write(LOGLEVEL_ERROR, $msg);

			return;
		}
		if (empty($this->modified) && !$this->legacyRootMigrated) {
			return;
		}

		$settingsState = State::forStore('settings-write');
		if (!$settingsState->open()) {
			throw new RuntimeException('Unable to lock settings for writing');
		}

		try {
			$this->reloadModifiedSettings();
			$this->writeSettings();
		}
		finally {
			$settingsState->close();
		}
	}

	/**
	 * Write the merged regular settings.
	 */
	private function writeSettings() {
		if (isset($this->settings['grommunio']['v1'])) {
			unset($this->settings['grommunio']['v1']['contexts']['mail']['outofoffice']);
		}

		// The picture goes to its own property, it must not reach the settings blob.
		$thumbnailPhoto = $this->settings['grommunio']['v1']['main']['thumbnail_photo'] ?? null;
		unset($this->settings['grommunio']['v1']['main']['thumbnail_photo']);

		if ($thumbnailPhoto !== null) {
			$photo = $this->normalizeProfilePicture($thumbnailPhoto);
			if ($photo !== false) {
				mapi_setprops($this->store, [PR_EMS_AB_THUMBNAIL_PHOTO => $photo]);
				mapi_savechanges($this->store);
				$GLOBALS['mapisession']->setUserImage("data:image/jpeg;base64," . base64_encode($photo));
			}
		}

		// Filter out the unchanged default sysadmin settings
		$settings = $this->filterOutSettings($this->settings, $this->getDefaultSysAdminSettings());
		$settings = json_encode(['settings' => $settings]);

		// Check if the settings have been changed.
		if ($this->settings_string !== $settings) {
			if (isset($this->settings['grommunio']['v1']['main']['language'])) {
				mapi_setprops($this->store, [PR_EC_USER_LANGUAGE => $this->settings['grommunio']['v1']['main']['language']]);
			}

			try {
				writeMapiPropStream($this->store, PR_EC_WEBACCESS_SETTINGS_JSON, $settings);
				mapi_savechanges($this->store);
			}
			catch (Exception) {
				return;
			}

			// Settings saved, update settings_string.
			$this->settings_string = $settings;
			$this->legacyRootMigrated = false;
		}
		$this->modified = [];
	}

	/**
	 * Brings a profile picture into the shape every client renders well: a
	 * square JPEG of at most PROFILE_PICTURE_MAX_EDGE pixels and
	 * PROFILE_PICTURE_MAX_BYTES bytes. An image which already fits is kept
	 * byte for byte.
	 *
	 * @param string $dataUrl the base64 data url as sent by the client
	 *
	 * @return false|string the JPEG data, or false when it is not usable
	 */
	private function normalizeProfilePicture($dataUrl) {
		if (!preg_match('/^data:image\/(?<extension>(?:png|gif|jpg|jpeg));base64,(?<image>.+)$/', (string) $dataUrl, $matches)) {
			return false;
		}

		$image = base64_decode($matches['image'], true);
		if ($image === false || strlen($image) > PROFILE_PICTURE_MAX_BYTES) {
			return false;
		}

		// A small file can still carry a huge canvas; GD would allocate it all.
		$size = @getimagesizefromstring($image);
		if ($size === false || $size[0] * $size[1] > PROFILE_PICTURE_MAX_PIXELS) {
			return false;
		}

		$source = @imagecreatefromstring($image);
		if ($source === false) {
			return false;
		}

		$width = imagesx($source);
		$height = imagesy($source);
		$isJpeg = strcasecmp($matches['extension'], 'jpeg') == 0 || strcasecmp($matches['extension'], 'jpg') == 0;

		if ($isJpeg && $width === $height && $width <= PROFILE_PICTURE_MAX_EDGE) {
			imagedestroy($source);

			return $image;
		}

		// Anything else gets the centre square scaled into the bounds.
		$square = min($width, $height);
		$result = $this->encodeProfilePicture(
			$source,
			(int) (($width - $square) / 2),
			(int) (($height - $square) / 2),
			$square,
			min($square, PROFILE_PICTURE_MAX_EDGE)
		);
		imagedestroy($source);

		return $result;
	}

	/**
	 * Scales a square region of an image to $edge pixels and encodes it as
	 * JPEG, lowering the quality and finally the edge length until it fits
	 * PROFILE_PICTURE_MAX_BYTES.
	 *
	 * @param GdImage $source the decoded image
	 * @param int     $x      left edge of the region
	 * @param int     $y      top edge of the region
	 * @param int     $square edge length of the region
	 * @param int     $edge   edge length of the result
	 *
	 * @return false|string the JPEG data, or false when it could not be encoded
	 */
	private function encodeProfilePicture($source, $x, $y, $square, $edge) {
		$target = imagecreatetruecolor($edge, $edge);
		if ($target === false) {
			return false;
		}

		// Transparency would come out black in JPEG, blend it onto white instead.
		imagealphablending($target, true);
		imagefilledrectangle($target, 0, 0, $edge, $edge, imagecolorallocate($target, 255, 255, 255));
		imagecopyresampled($target, $source, 0, 0, $x, $y, $edge, $edge, $square, $square);

		// Above 90 libjpeg drops the chroma subsampling, which multiplies the
		// size for no visible gain at this resolution.
		$result = false;
		for ($quality = 85; $quality >= 40; $quality -= 10) {
			ob_start();
			$written = imagejpeg($target, null, $quality);
			$jpeg = ob_get_clean();
			if (!$written) {
				break;
			}
			$result = $jpeg;
			if (strlen($jpeg) <= PROFILE_PICTURE_MAX_BYTES) {
				break;
			}
		}
		imagedestroy($target);

		if ($result === false || strlen($result) <= PROFILE_PICTURE_MAX_BYTES) {
			return $result;
		}

		return $edge > 144 ? $this->encodeProfilePicture($source, $x, $y, $square, (int) ($edge / 2)) : false;
	}

	/**
	 * Save persistent settings to store.
	 *
	 * This function saves all persistent settings to the store's PR_EC_WEBAPP_PERSISTENT_SETTINGS_JSON property.
	 */
	public function savePersistentSettings() {
		if (!$this->init) {
			$this->Init();
		}

		if (!$this->persistentSettingsLoaded) {
			$msg = "Settings::savePersistentSettings() skipped: the persistent settings of this store could not be read.";
			error_log($msg);
			Log::Write(LOGLEVEL_ERROR, $msg);

			return;
		}
		if (empty($this->modifiedPersistent)) {
			return;
		}

		$settingsState = State::forStore('settings-write');
		if (!$settingsState->open()) {
			throw new RuntimeException('Unable to lock persistent settings for writing');
		}

		try {
			$this->reloadModifiedPersistentSettings();
			$this->writePersistentSettings();
		}
		finally {
			$settingsState->close();
		}
	}

	/**
	 * Write the merged persistent settings.
	 */
	private function writePersistentSettings() {
		$persistentSettings = json_encode(['settings' => $this->persistentSettings]);

		// Check if the settings have been changed.
		if ($this->persistentSettingsString !== $persistentSettings) {
			writeMapiPropStream($this->store, PR_EC_WEBAPP_PERSISTENT_SETTINGS_JSON, $persistentSettings);
			mapi_savechanges($this->store);

			// Settings saved, update settings string.
			$this->persistentSettingsString = $persistentSettings;
		}
		$this->modifiedPersistent = [];
	}

	/**
	 * Get session-wide settings.
	 *
	 * Returns one explicit setting in an associative array:
	 *
	 * 'lang' -> setting('grommunio/v1/main/language')
	 *
	 * @return array associative array with 'lang' entry
	 */
	public function getSessionSettings() {
		$store = $GLOBALS['mapisession']->getDefaultMessageStore();
		$storeProps = mapi_getprops($store, [PR_EC_USER_LANGUAGE]);
		if (!empty($storeProps[PR_EC_USER_LANGUAGE])) {
			$lang = $storeProps[PR_EC_USER_LANGUAGE];
		}
		else {
			$lang = $this->get('grommunio/v1/main/language', LANG);
		}

		return [
			'lang' => $lang,
		];
	}
}
