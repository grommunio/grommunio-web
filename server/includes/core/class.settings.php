<?php

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
	 * User's default message store where we will be storing all the settings in a property.
	 */
	private $store;

	/**
	 * Associative Array that will store all the settings of webapp, this will be filled by retreiveAllSettings
	 * and will be used when we call saveSettings.
	 */
	private $settings;

	/**
	 * Associative Array that will store all the persistent settings of webapp, this will be filled by
	 * retreiveAllSettings and will be used when we call saveSettings.
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
	 *  Array Settings that are defined by system admin.
	 */
	private $sysAdminDefaults;

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

	public function __construct() {
		$this->settings = [];
		$this->persistentSettings = [];
		$this->sysAdminDefaults = [];
		$this->settings_string = '';
		$this->modified = [];
		$this->init = false;
	}

	/**
	 * Initialise the settings class.
	 *
	 * Opens the default store and gets the settings. This is done only once. Therefore
	 * changes written to the settings after the first Init() call will be invisible to this
	 * instance of the Settings class
	 */
	public function Init() {
		$GLOBALS['PluginManager']->triggerHook('server.core.settings.init.before', ['settingsObj' => $this]);

		$this->store = $GLOBALS['mapisession']->getDefaultMessageStore();

		// ignore exceptions when loading settings
		try {
			$this->retrieveSettings();
			$this->retrievePersistentSettings();

			// this object will only be initialized when we are able to retrieve existing settings correctly
			$this->init = true;
		}
		catch (SettingsException $e) {
			$e->setHandled();
		}
	}

	/**
	 * Get a setting from the settings repository.
	 *
	 * Retrieves the setting at the path specified. If the setting is not found, and no $default value
	 * is passed, returns null.
	 *
	 * @param string $path       path to the setting you want to get, separated with slashes
	 * @param string $default    If the setting is not found, and this parameter is passed, then this value is returned
	 * @param bool   $persistent set to true to get the given $path from the persistent settings
	 *
	 * @return string Setting data, or $default if not found or null of no default is found
	 */
	public function get($path = null, $default = null, $persistent = false) {
		if (!$this->init) {
			$this->Init();
		}

		$settings = (bool) $persistent ? $this->persistentSettings : $this->settings;

		if ($path == null) {
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
	 * @param string $path    path to the setting you want to get, separated with slashes
	 * @param string $default If the setting is not found, and this parameter is passed, then this value is returned
	 *
	 * @return string Setting data, or $default if not found or null of no default is found
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
		if (!$this->init) {
			$this->Init();
		}

		if ((bool) $persistent) {
			$this->modifiedPersistent[$path] = $value;
		}
		else {
			$this->modified[$path] = $value;
		}

		$path = explode('/', $path);

		// Save the last key separately
		$lastKey = array_pop($path);

		// Walk over the settings to find the object
		// which we can manipulate
		if ((bool) $persistent) {
			$pointer = &$this->persistentSettings;
		}
		else {
			$pointer = &$this->settings;
		}

		for ($i = 0, $len = count($path); $i < $len; ++$i) {
			$key = $path[$i];

			if (!isset($pointer[$key])) {
				$pointer[$key] = [];
			}

			$pointer = &$pointer[$key];
		}

		$pointer[$lastKey] = $value;
		unset($pointer);

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
		return $this->set($path, $value, $autoSave, true);
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
		if (!$this->init) {
			$this->Init();
		}

		$this->modified[$path] = '';
		$path = explode('/', $path);
		$tmp = &$this->settings;

		// We have to get the second to last level to unset the value through a reference.
		$prevEntry = null;

		foreach ($path as $pointer) {
			if (!empty($pointer)) {
				if (!isset($tmp[$pointer])) {
					return;
				}
				$prevEntry = &$tmp;
				$tmp = &$tmp[$pointer];
			}
		}

		/*
		 * If we do unset($tmp) the reference is removed and not the value
		 * it points to. If we do $prevEntry[$pointer] we change a value
		 * inside the reference. In that case it will work.
		 */
		unset($prevEntry[$pointer]);

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

		$settings = ["settings" => ["zarafa" => ["v1" => ["main" => []]]]];
		// Check if property exists, if it does not exist then we can continue with empty set of settings
		if (isset($storeProps[PR_EC_WEBACCESS_SETTINGS_JSON]) || propIsError(PR_EC_WEBACCESS_SETTINGS_JSON, $storeProps) == MAPI_E_NOT_ENOUGH_MEMORY) {
			$this->settings_string = streamProperty($this->store, PR_EC_WEBACCESS_SETTINGS_JSON);

			if (!empty($this->settings_string)) {
				$settings = json_decode_data($this->settings_string, true);
				if (empty($settings) || empty($settings['settings'])) {
					throw new SettingsException(_('Error retrieving existing settings'));
				}
			}
			if (isset($storeProps[PR_EC_USER_LANGUAGE])) {
				$settings["settings"]["zarafa"]["v1"]["main"]["language"] = $storeProps[PR_EC_USER_LANGUAGE];
			}
			elseif (isset($_COOKIE['lang'])) {
				$settings["settings"]["zarafa"]["v1"]["main"]["language"] = $_COOKIE['lang'];
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
				$settings["settings"]["zarafa"]["v1"]["main"]["language"] = $storeProps[PR_EC_USER_LANGUAGE];
			}
			elseif (isset($_COOKIE['lang'])) {
				$settings["settings"]["zarafa"]["v1"]["main"]["language"] = $_COOKIE['lang'];
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
		if (isset($storeProps[PR_EC_WEBAPP_PERSISTENT_SETTINGS_JSON]) ||
			propIsError(PR_EC_WEBAPP_PERSISTENT_SETTINGS_JSON, $storeProps) == MAPI_E_NOT_ENOUGH_MEMORY) {
			if (propIsError(PR_EC_WEBAPP_PERSISTENT_SETTINGS_JSON, $storeProps) == MAPI_E_NOT_ENOUGH_MEMORY) {
				$this->persistentSettingsString = streamProperty($this->store, PR_EC_WEBAPP_PERSISTENT_SETTINGS_JSON);
			}
			else {
				$this->persistentSettingsString = $storeProps[PR_EC_WEBAPP_PERSISTENT_SETTINGS_JSON];
			}

			if (!empty($this->persistentSettingsString)) {
				try {
					$persistentSettings = json_decode_data($this->persistentSettingsString, true);
				}
				catch (Exception) {
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
		$this->sysAdminDefaults = array_replace_recursive($this->sysAdminDefaults, $settings);
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
	 * Save settings to store.
	 *
	 * This function saves all settings to the store's PR_EC_WEBACCESS_SETTINGS_JSON property, and to the
	 * PR_EC_OUTOFOFFICE_* properties.
	 */
	public function saveSettings() {
		if (!$this->init) {
			$this->Init();
		}

		if (isset($this->settings['zarafa']['v1'])) {
			unset($this->settings['zarafa']['v1']['contexts']['mail']['outofoffice']);
		}

		// Filter out the unchanged default sysadmin settings
		$settings = $this->filterOutSettings($this->settings, $this->getDefaultSysAdminSettings());
		$settings = json_encode(['settings' => $settings]);

		// Check if the settings have been changed.
		if ($this->settings_string !== $settings) {
			if (isset($this->settings['zarafa']['v1']['main']['language'])) {
				mapi_setprops($this->store, [PR_EC_USER_LANGUAGE => $this->settings['zarafa']['v1']['main']['language']]);
			}

			if (isset($this->settings['zarafa']['v1']['main']['thumbnail_photo'])) {
				$thumbnail_photo = $this->settings['zarafa']['v1']['main']['thumbnail_photo'];
				unset($this->settings['zarafa']['v1']['main']['thumbnail_photo']);
				if (preg_match('/^data:image\/(?<extension>(?:png|gif|jpg|jpeg));base64,(?<image>.+)$/', $thumbnail_photo, $matchings)) {
					$imageData = base64_decode($matchings['image']);
					$extension = $matchings['extension'];
					$tmp_file = tempnam(sys_get_temp_dir(), "thumbnail_");
					if (file_put_contents($tmp_file, $imageData)) {
						if (strcasecmp($extension, "gif") == 0) {
							$im = imagecreatefromgif($tmp_file);
						}
						elseif (strcasecmp($extension, "jpeg") == 0 ||
							strcasecmp($extension, "jpg") == 0) {
							$im = imagecreatefromjpeg($tmp_file);
						}
						elseif (strcasecmp($extension, "png") == 0) {
							$im = imagecreatefrompng($tmp_file);
						}
						else {
							$im = null;
						}
						if ($im) {
							$n_width = 144;
							$n_height = 144;
							$width = imagesx($im);
							$height = imagesy($im);
							$n_height = ($n_width / $width) * $height;
							$newimage = imagecreatetruecolor($n_width, $n_height);
							imagecopyresized(
								$newimage,
								$im,
								0,
								0,
								0,
								0,
								$n_width,
								$n_height,
								$width,
								$height
							);
							imagejpeg($newimage, $tmp_file, 100);
							$thumbnail_photo = file_get_contents($tmp_file);
							mapi_setprops($this->store, [PR_EMS_AB_THUMBNAIL_PHOTO => $thumbnail_photo]);
							$GLOBALS['mapisession']->setUserImage("data:image/jpeg;base64," . base64_encode($thumbnail_photo));
						}
					}
					unlink($tmp_file);
				}
			}

			try {
				$stream = mapi_openproperty($this->store, PR_EC_WEBACCESS_SETTINGS_JSON, IID_IStream, STGM_TRANSACTED, MAPI_CREATE | MAPI_MODIFY);
				mapi_stream_setsize($stream, strlen($settings));
				mapi_stream_write($stream, $settings);
				mapi_stream_commit($stream);

				mapi_savechanges($this->store);
			}
			catch (Exception) {
			}

			// Settings saved, update settings_string and modified array
			$this->settings_string = $settings;
			$this->modified = [];
		}
	}

	/**
	 * Save persistent settings to store.
	 *
	 * This function saves all persistent settings to the store's PR_EC_WEBAPP_PERSISTENT_SETTINGS_JSON property.
	 */
	public function savePersistentSettings() {
		$persistentSettings = json_encode(['settings' => $this->persistentSettings]);

		// Check if the settings have been changed.
		if ($this->persistentSettingsString !== $persistentSettings) {
			$stream = mapi_openproperty($this->store, PR_EC_WEBAPP_PERSISTENT_SETTINGS_JSON, IID_IStream, STGM_TRANSACTED, MAPI_CREATE | MAPI_MODIFY);
			mapi_stream_setsize($stream, strlen($persistentSettings));
			mapi_stream_write($stream, $persistentSettings);
			mapi_stream_commit($stream);
			mapi_savechanges($this->store);

			// Settings saved, update settings string and modified array
			$this->persistentSettingsString = $persistentSettings;
		}
	}

	/**
	 * Get session-wide settings.
	 *
	 * Returns one explicit setting in an associative array:
	 *
	 * 'lang' -> setting('zarafa/v1/main/language')
	 *
	 * @param mixed $Language
	 *
	 * @return array associative array with 'lang' entry
	 */
	public function getSessionSettings($Language) {
		$store = $GLOBALS['mapisession']->getDefaultMessageStore();
		$storeProps = mapi_getprops($store, [PR_EC_USER_LANGUAGE]);
		if (!empty($storeProps[PR_EC_USER_LANGUAGE])) {
			$lang = $storeProps[PR_EC_USER_LANGUAGE];
		}
		else {
			$lang = $this->get('zarafa/v1/main/language', LANG);
			$lang = $Language->resolveLanguage($lang);
		}

		return [
			'lang' => $lang,
		];
	}
}
