<?php
	require(__DIR__ . '/../exceptions/class.SettingsException.php');

	/**
	 * Generic settings class
	 *
	 * This class allows access to various user settings which are normally
	 * configured by the user. Settings can be set and retrieved
	 * via this class. Default values must be provided at retrieval time.
	 *
	 * Settings have a path-like structure, for example:
	 * <code>
	 * path/to/setting => 5
	 * </code>
	 *
	 * @package core
	 */
	class Settings
	{
		/**
		 * User's default message store where we will be storing all the settings in a property
		 */
		private $store;

		/**
		 * Associative Array that will store all the settings of webapp, this will be filled by retreiveAllSettings
		 * and will be used when we call saveSettings
		 */
		private $settings;

		/**
		 * Associative Array that will store all the persistent settings of webapp, this will be filled by
		 * retreiveAllSettings and will be used when we call saveSettings
		 */
		private $persistentSettings;

		/**
		 *  Array External settings which are stored outside of settings property and are managed differently,
		 * Out of office settings are one of them
		 */
		private $externalSettings;

		/**
		 *  Boolean Flag to indicate that settings has been initialized and we can safely call saveSettings to
		 * add/update new settings, if this is false then it will indicate that there was some problem
		 * initializing $this->settings object and we shouldn't continue saving new settings as that will
		 * lose all existing settings of the user
		 */
		private $init;

		/**
		 *  Array Settings that are defined by system admin
		 */
		private $sysAdminDefaults;

		/**
		 * Json encoded string which represents existing set of settings, this can be compared with json encoded
		 * string of $this->settings to check if there was a change in settings and we need to save the changes
		 * to mapi
		 */
		private $settings_string;

		/**
		 * Json encoded string which represents existing set of settings, this can be compared with json encoded
		 * string of $this->settings to check if there was a change in settings and we need to save the changes
		 * to mapi
		 */
		private $persistentSettingsString;

		/**
		 * Keeps track of all modifications on settings which are not saved yet.
		 * The array is reset in saveSettings() after a successful save.
		 */
		private $modified;

		function __construct()
		{
			$this->settings = array();
			$this->persistentSettings = array();
			$this->sysAdminDefaults = array();
			$this->settings_string = '';
			$this->modified = array();
			$this->init = false;
		}

		/**
		 * Initialise the settings class
		 *
		 * Opens the default store and gets the settings. This is done only once. Therefore
		 * changes written to the settings after the first Init() call will be invisible to this
		 * instance of the Settings class
		 * @access private
		 */
		function Init()
		{
			$GLOBALS['PluginManager']->triggerHook('server.core.settings.init.before', Array('settingsObj' => $this));

			$this->store = $GLOBALS['mapisession']->getDefaultMessageStore();

			// ignore exceptions when loading settings
			try {
				$this->retrieveSettings();
				$this->retrievePersistentSettings();

				// this object will only be initialized when we are able to retrieve existing settings correctly
				$this->init = true;
			} catch (SettingsException $e) {
				$e->setHandled();
			}
		}

		/**
		 * Get a setting from the settings repository
		 *
		 * Retrieves the setting at the path specified. If the setting is not found, and no $default value
		 * is passed, returns null.
		 *
		 * @param string $path Path to the setting you want to get, separated with slashes.
		 * @param string $default If the setting is not found, and this parameter is passed, then this value is returned
		 * @param boolean $persistent Set to true to get the given $path from the persistent settings.
		 * @return string Setting data, or $default if not found or null of no default is found
		 */
		function get($path=null, $default=null, $persistent=false)
		{
			if (!$this->init) {
				$this->Init();
			}

			$settings = !!$persistent ? $this->persistentSettings : $this->settings;

			if ($path==null) {
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
		 * Get a setting from the persistent settings repository
		 *
		 * Retrieves the setting at the path specified. If the setting is not found, and no $default value
		 * is passed, returns null.
		 *
		 * @param string $path Path to the setting you want to get, separated with slashes.
		 * @param string $default If the setting is not found, and this parameter is passed, then this value is returned
		 * @return string Setting data, or $default if not found or null of no default is found
		 */
		function getPersistent($path=null, $default=null)
		{
			return $this->get($path, $default, true);
		}

		/**
		 * Store a setting
		 *
		 * Overwrites a setting at a specific settings path with the value passed.
		 *
		 * @param string $path Path to the setting you want to set, separated with slashes.
		 * @param mixed $value New value for the setting
		 * @param boolean $autoSave True to directly save the settings to the MAPI Store,
		 * this defaults to false as the settings will be saved at the end of the request.
		 * @param boolean $persistent True to set a persistent setting, false otherwise.
		 */
		function set($path, $value, $autoSave = false, $persistent=false)
		{
			if (!$this->init) {
				$this->Init();
			}

			if ( !!$persistent ){
				$this->modifiedPersistent[$path] = $value;
			} else {
				$this->modified[$path] = $value;
			}

			$path = explode('/', $path);

			// Save the last key separately
			$lastKey = array_pop($path);

			// Walk over the settings to find the object
			// which we can manipulate
			if ( !!$persistent ){
				$pointer = &$this->persistentSettings;
			} else {
				$pointer = &$this->settings;
			}

			for ($i = 0, $len = count($path); $i < $len; $i++) {
				$key = $path[$i];

				if (!isset($pointer[$key])) {
					$pointer[$key] = array();
				}

				$pointer = &$pointer[$key];
			}

			$pointer[$lastKey] = $value;
			unset($pointer);

			if ($autoSave === true) {
				!!$persistent ? $this->savePersistentSettings() : $this->saveSettings();
			}
		}

		/**
		 * Store a persistent setting
		 *
		 * Overwrites a persistent setting at a specific settings path with the value passed.
		 *
		 * @param string $path Path to the setting you want to set, separated with slashes.
		 * @param mixed $value New value for the setting
		 * @param boolean $autoSave True to directly save the settings to the MAPI Store,
		 * this defaults to false as the settings will be saved at the end of the request.
		 */
		function setPersistent($path, $value, $autoSave = false)
		{
			return $this->set($path, $value, $autoSave, true);
		}

		/**
	 	 * Delete a setting
	 	 *
		 * Deletes the setting references by $path
		 *
		 * @param string $path Path to the setting you want to delete
		 * @param boolean $autoSave True to directly save the settings to the MAPI Store,
		 * this defaults to false as the settings will be saved at the end of the request.
		 */
		function delete($path, $autoSave = false)
		{
			if (!$this->init) {
				$this->Init();
			}

			$this->modified[$path] = '';
			$path = explode('/', $path);
			$tmp =& $this->settings;

			// We have to get the second to last level to unset the value through a reference.
			$prevEntry = null;

			foreach ($path as $pointer) {
				if (!empty($pointer)) {
					if (!isset($tmp[$pointer])) {
						return;
					}
					$prevEntry =& $tmp;
					$tmp =& $tmp[$pointer];
				}
			}

			/**
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
		 * Get all settings as a Javascript script
		 *
		 * This function will output all settings as a JSON object, allowing easy inclusing in client-side javascript.
		 * @return String json encoded php array
		 */
		function getJSON()
		{
			if (!$this->init) {
				$this->Init();
			}

			return json_encode($this->settings);
		}

		/**
		 * Get all persistent settings as a Javascript script
		 *
		 * This function will output all persistent settings as a JSON object, allowing easy inclusing in client-side
		 * javascript.
		 * @return String json encoded php array
		 */
		function getPersistentSettingsJSON()
		{
			if (!$this->init) {
				$this->Init();
			}

			return json_encode($this->persistentSettings);
		}

		/**
		 * Get settings from store
		 *
		 * This function retrieves the actual settings from the store.
		 * Settings are stored in two different properties as we wanted to ship new webaccess and older webaccess
		 * simultenously so both webaccess uses different settings and doesn't interfere with each other.
		 *
		 * new webaccess uses string property PR_EC_WEBACCESS_SETTINGS_JSON which contains settings in JSON format
		 *
		 * Additionally, there are also settings in PR_EC_OUTOFOFFICE_* which are retrieved in this function also.
		 *
		 * This function returns nothing, but populates the 'settings' property of the class.
		 * @access private
		 */
		function retrieveSettings()
		{
			// We retrieve the 'external' settings, this will serve as base
			$this->retrieveExternalSettings();

			// first check if property exist and we can open that using mapi_openproperty
			$storeProps = mapi_getprops($this->store, array(PR_EC_WEBACCESS_SETTINGS_JSON, PR_EC_USER_LANGUAGE));
			
			$settings = array("settings"=> array("zarafa" => array("v1" => array("main" => array()))));
			// Check if property exists, if it does not exist then we can continue with empty set of settings
			if (isset($storeProps[PR_EC_WEBACCESS_SETTINGS_JSON]) || propIsError(PR_EC_WEBACCESS_SETTINGS_JSON, $storeProps) == MAPI_E_NOT_ENOUGH_MEMORY) {
				$this->settings_string = streamProperty($this->store, PR_EC_WEBACCESS_SETTINGS_JSON);

				if(!empty($this->settings_string)) {
					$settings = json_decode_data($this->settings_string, true);
					if (empty($settings) || empty($settings['settings'])) {
						throw new SettingsException(Language::getstring('Error retrieving existing settings'));
					}
				}
				if (isset($storeProps[PR_EC_USER_LANGUAGE])) {
					$settings["settings"]["zarafa"]["v1"]["main"]["language"] = $storeProps[PR_EC_USER_LANGUAGE];
				} else if (isset($_COOKIE['lang'])) {
					$settings["settings"]["zarafa"]["v1"]["main"]["language"] = $_COOKIE['lang'];
				}
				// Get and apply the System Administrator default settings
				$sysadminSettings = $this->getDefaultSysAdminSettings();
				$settings = array_replace_recursive($sysadminSettings, $settings['settings']);
				// Finally merge the settings with the external settings which were obtained
				// at the start of this function.
				$this->settings = array_replace_recursive($settings, $this->settings);
			} elseif (DISABLE_WELCOME_SCREEN) {
				/*
				 * if DISABLE_WELCOME_SCREEN is true and PR_EC_WEBACCESS_SETTINGS_JSON is not exists at that time, We
				 * just append the admin settings to settings array. Normally system admin settings
				 * contains plugin default enable/disable and other plugins related settings information which required
				 * while webapp loading time.
				 */
				if (isset($storeProps[PR_EC_USER_LANGUAGE])) {
					$settings["settings"]["zarafa"]["v1"]["main"]["language"] = $storeProps[PR_EC_USER_LANGUAGE];
				} else if (isset($_COOKIE['lang'])) {
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
		private function retrievePersistentSettings()
		{
			// first check if property exist and we can open that using mapi_openproperty
			$storeProps = mapi_getprops($this->store, array(PR_EC_WEBAPP_PERSISTENT_SETTINGS_JSON));

			// Check if property exists, if it does not exist then we can continue with empty set of settings
			if ( isset($storeProps[PR_EC_WEBAPP_PERSISTENT_SETTINGS_JSON])
				|| propIsError(PR_EC_WEBAPP_PERSISTENT_SETTINGS_JSON, $storeProps) == MAPI_E_NOT_ENOUGH_MEMORY ) {

				if ( propIsError(PR_EC_WEBAPP_PERSISTENT_SETTINGS_JSON, $storeProps) == MAPI_E_NOT_ENOUGH_MEMORY ) {
					$this->persistentSettingsString = streamProperty($this->store, PR_EC_WEBAPP_PERSISTENT_SETTINGS_JSON);
				} else {
					$this->persistentSettingsString = $storeProps[PR_EC_WEBAPP_PERSISTENT_SETTINGS_JSON];
				}

				if ( !empty($this->persistentSettingsString) ) {
					try{
						$persistentSettings = json_decode_data($this->persistentSettingsString, true);
					} catch(Exception $e){}

					if ( empty($persistentSettings) || empty($persistentSettings['settings']) ) {
						throw new SettingsException(Language::getstring('Error retrieving existing persistent settings'));
					}

					$this->persistentSettings =$persistentSettings['settings'];
				}
			}
		}

		/**
		 * Retrieves the default settings as defined by the System Administrator.
		 * @return Array Settings object
		 */
		function getDefaultSysAdminSettings()
		{
			return $this->sysAdminDefaults;
		}

		/**
		 * Applies the default settings defined by the System Administrator to the sysAdminDefaults
		 * property.
		 * @param Array $settings The default settings
		 */
		function addSysAdminDefaults($settings)
		{
			$this->sysAdminDefaults = array_replace_recursive($this->sysAdminDefaults, $settings);
		}

		/**
		 * Takes two arrays, one settings and one defaults and removes the items from the settings
		 * array that have the same value as the defaults array. What is left is the settings that
		 * are not in the defaults array and the changed values of the ones that their keys do match
		 * in the defaults. It calls itself recursively to check the full array.
		 * @param Array $settings The array containing the unfiltered settings
		 * @param Array $defaults The array containing the default key/values.
		 * @return Array The filtered settings array
		 */
		function filterOutSettings($settings, $defaults)
		{
			foreach ($defaults as $key => $value) {
				if (isset($settings[$key])) {
					if ($defaults[$key] == $settings[$key]) {
						unset($settings[$key]);
					} elseif (is_array($defaults[$key])) {
						$settings[$key] = $this->filterOutSettings($settings[$key], $defaults[$key]);
					}
				}
			}

			return $settings;
		}

		/**
		 * Save settings to store
		 *
		 * This function saves all settings to the store's PR_EC_WEBACCESS_SETTINGS_JSON property, and to the
		 * PR_EC_OUTOFOFFICE_* properties.
		 */
		function saveSettings()
		{
			if (!$this->init) {
				$this->Init();
			}

			$this->saveExternalSettings();

			$externalSetting = false;
			$language = false;
			if (isset($this->settings['zarafa']['v1'])) {
				if (isset($this->settings['zarafa']['v1']['contexts']['mail']['outofoffice'])) {
					// Temporarily remove external settings so we don't save the external settings to PR_EC_WEBACCESS_SETTINGS_JSON
					$externalSetting = $this->settings['zarafa']['v1']['contexts']['mail']['outofoffice'];
					unset($this->settings['zarafa']['v1']['contexts']['mail']['outofoffice']);
				}
				// Temporarily remove external settings so we don't save the language to PR_EC_WEBACCESS_SETTINGS_JSON
				if (isset($this->settings['zarafa']['v1']['main']['language'])) {
					$language = $this->settings['zarafa']['v1']['main']['language'];
					unset($this->settings['zarafa']['v1']['main']['language']);
				}
			}

			// Filter out the unchanged default sysadmin settings
			$settings = $this->filterOutSettings($this->settings, $this->getDefaultSysAdminSettings());
			$settings = json_encode(array( 'settings' => $settings ));

			// Check if the settings have been changed.
			if ($this->settings_string !== $settings) {
				// Update the Free/Busy range of the login user when user gets login or update the free/busy months from settings.
				if(isset($this->modified['zarafa/v1/contexts/calendar/free_busy_range'])) {
					$GLOBALS["operations"]->publishFreeBusy($this->store);
				}

				$stream = mapi_openproperty($this->store, PR_EC_WEBACCESS_SETTINGS_JSON, IID_IStream, STGM_TRANSACTED, MAPI_CREATE | MAPI_MODIFY);
				mapi_stream_setsize($stream, strlen($settings));
				mapi_stream_write($stream, $settings);
				mapi_stream_commit($stream);

				mapi_savechanges($this->store);

				// Settings saved, update settings_string and modified array
				$this->settings_string = $settings;
				$this->modified = array();
			}
			
			// Put the external settings back
			if ($externalSetting) {
				$this->settings['zarafa']['v1']['contexts']['mail']['outofoffice'] = $externalSetting;
			}
			if ($language) {
				$this->settings['zarafa']['v1']['main']['language'] = $language;
			}
		}

		/**
		 * Save persistent settings to store
		 *
		 * This function saves all persistent settings to the store's PR_EC_WEBAPP_PERSISTENT_SETTINGS_JSON property.
		 */
		function savePersistentSettings()
		{
			$persistentSettings = json_encode(array('settings' => $this->persistentSettings));

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
		 * Read 'external' settings from PR_EC_OUTOFOFFICE_*
		 *
		 * Internal function to retrieve the 'external' settings from the store, these settings are normal properties on the store
		 * @access private
		 */
		function retrieveExternalSettings()
		{
			$props = mapi_getprops($this->store, array(PR_EC_OOF_STATE, PR_EC_OOF_INTERNALREPLY,
					PR_EC_OOF_INTERNALSUBJECT, PR_EC_OOF_BEGIN, PR_EC_OOF_END, PR_EC_OOF_ALLOWEXTERNAL,
					PR_EC_OOF_EXTERNALAUDIENCE, PR_EC_OOF_EXTERNALREPLY, PR_EC_OOF_EXTERNALSUBJECT));

			if (!isset($props[PR_EC_OOF_STATE])) {
				$props[PR_EC_OOF_STATE] = false;
			}
			if (!isset($props[PR_EC_OOF_INTERNALREPLY])) {
				$props[PR_EC_OOF_INTERNALREPLY] = '';
			}
			if (!isset($props[PR_EC_OOF_INTERNALSUBJECT])) {
				$props[PR_EC_OOF_INTERNALSUBJECT] = '';
			}
			if (!isset($props[PR_EC_OOF_BEGIN])) {
				$props[PR_EC_OOF_BEGIN] = 0;
			}
			if (!isset($props[PR_EC_OOF_END])) {
				$props[PR_EC_OOF_END] = 0;
			}
			if (!isset($props[PR_EC_OOF_ALLOWEXTERNAL])) {
				$props[PR_EC_OOF_ALLOWEXTERNAL] = 0;
			}
			if (!isset($props[PR_EC_OOF_EXTERNALAUDIENCE])) {
				$props[PR_EC_OOF_EXTERNALAUDIENCE] = 0;
			}
			if (!isset($props[PR_EC_OOF_EXTERNALREPLY])) {
				$props[PR_EC_OOF_EXTERNALREPLY] = '';
			}
			if (!isset($props[PR_EC_OOF_EXTERNALSUBJECT])) {
				$props[PR_EC_OOF_EXTERNALSUBJECT] = '';
			}
			switch ($props[PR_EC_OOF_STATE]) {
			case 1:
				$this->settings['zarafa']['v1']['contexts']['mail']['outofoffice']['set'] = 1;
				$this->settings['zarafa']['v1']['contexts']['mail']['outofoffice']['timerange'] = 0;
				break;
			case 2:
				$this->settings['zarafa']['v1']['contexts']['mail']['outofoffice']['set'] = 1;
				$this->settings['zarafa']['v1']['contexts']['mail']['outofoffice']['timerange'] = 1;
				break;
			default:
				$this->settings['zarafa']['v1']['contexts']['mail']['outofoffice']['set'] = 0;
				$this->settings['zarafa']['v1']['contexts']['mail']['outofoffice']['timerange'] = 0;
				break;
			}
			$this->settings['zarafa']['v1']['contexts']['mail']['outofoffice']['internal_reply'] = $props[PR_EC_OOF_INTERNALREPLY];
			$this->settings['zarafa']['v1']['contexts']['mail']['outofoffice']['internal_subject'] = $props[PR_EC_OOF_INTERNALSUBJECT];
			$this->settings['zarafa']['v1']['contexts']['mail']['outofoffice']['from'] = $props[PR_EC_OOF_BEGIN];
			$this->settings['zarafa']['v1']['contexts']['mail']['outofoffice']['until'] = $props[PR_EC_OOF_END];
			$this->settings['zarafa']['v1']['contexts']['mail']['outofoffice']['allow_external'] = $props[PR_EC_OOF_ALLOWEXTERNAL];
			$this->settings['zarafa']['v1']['contexts']['mail']['outofoffice']['external_audience'] = $props[PR_EC_OOF_EXTERNALAUDIENCE];
			$this->settings['zarafa']['v1']['contexts']['mail']['outofoffice']['external_reply'] = $props[PR_EC_OOF_EXTERNALREPLY];
			$this->settings['zarafa']['v1']['contexts']['mail']['outofoffice']['external_subject'] = $props[PR_EC_OOF_EXTERNALSUBJECT];
			// Save the properties
			$this->externalSettings = $props;
		}

		/**
		 * Internal function to save the 'external' settings to the correct properties on the store
		 *
		 * Writes some properties to the PR_EC_OUTOFOFFICE_* properties
		 * @access private
		 */
		function saveExternalSettings()
		{
			if (isset($this->settings['zarafa']['v1']['main']['language'])) {
				$props = array();
				$props[PR_EC_USER_LANGUAGE] = $this->settings['zarafa']['v1']['main']['language'];
				mapi_setprops($this->store, $props);
			}
			if (isset($this->settings['zarafa']['v1']['main']['thumbnail_photo'])) {
				$thumbnail_photo = $this->settings['zarafa']['v1']['main']['thumbnail_photo'];
				unset($this->settings['zarafa']['v1']['main']['thumbnail_photo']);
				if (preg_match('/^data:image\/(?<extension>(?:png|gif|jpg|jpeg));base64,(?<image>.+)$/', $thumbnail_photo, $matchings)) {
					$imageData = base64_decode($matchings['image']);
					$extension = $matchings['extension'];
					$tmp_file = "/tmp/thumbnail-" . time() . "." . $extension;
					if (file_put_contents($tmp_file, $imageData)) {
						if (0 == strcasecmp($extension, "gif")) {
							$im = imagecreatefromgif($tmp_file);
						} else if (0 == strcasecmp($extension, "jpeg")
							|| 0 == strcasecmp($extension, "jpg")) {
							$im = imagecreatefromjpeg($tmp_file);
						} else if (0 == strcasecmp($extension, "png")) {
							$im = imagecreatefrompng($tmp_file);
						} else {
							$im = null;
						}
						if ($im) {
							$n_width = 144;
							$n_height = 144;
							$width = imagesx($im);
							$height = imagesy($im);
							$n_height = ($n_width/$width) * $height;
							$newimage = imagecreatetruecolor($n_width, $n_height);
							imagecopyresized($newimage, $im, 0, 0, 0, 0,
								$n_width, $n_height, $width, $height);
							imagejpeg($newimage, $tmp_file, 100);
							$thumbnail_photo = file_get_contents($tmp_file);
							$props = array();
							$props[PR_EMS_AB_THUMBNAIL_PHOTO] = $thumbnail_photo;
							mapi_setprops($this->store, $props);
							$GLOBALS['mapisession']->setUserImage("data:image/jpeg;base64," . base64_encode($thumbnail_photo));
						}
					}
					unlink($tmp_file);
				}
			}
			$props = array();
			if (!isset($this->settings['zarafa']) ||
				!isset($this->settings['zarafa']['v1']) ||
			    !isset($this->settings['zarafa']['v1']['contexts']) ||
				!isset($this->settings['zarafa']['v1']['contexts']['mail']) ||
			    !isset($this->settings['zarafa']['v1']['contexts']['mail']['outofoffice'])) {
				return;
			}

			$oof = $this->settings['zarafa']['v1']['contexts']['mail']['outofoffice'];

			if ($oof['set']) {
				if ($oof['timerange']) {
					$props[PR_EC_OOF_STATE] = 2;
				} else {
					$props[PR_EC_OOF_STATE] = 1;
				}
			} else {
				$props[PR_EC_OOF_STATE] = 0;
			}
			if (isset($oof['from'])) {
				$props[PR_EC_OOF_BEGIN] = $oof['from'];
			}
			if (isset($oof['until'])) {
				$props[PR_EC_OOF_END] = $oof['until'];
			}
			if (isset($oof['internal_reply'])) {
				$props[PR_EC_OOF_INTERNALREPLY] = $oof['internal_reply'];
			}
			if (isset($oof['internal_subject'])) {
				$props[PR_EC_OOF_INTERNALSUBJECT] = $oof['internal_subject'];
			}
			if (isset($oof['allow_external'])) {
				$props[PR_EC_OOF_ALLOWEXTERNAL] = $oof['allow_external'];
			}
			if (isset($oof['external_audience'])) {
				$props[PR_EC_OOF_EXTERNALAUDIENCE] = $oof['external_audience'];
			}
			if (isset($oof['external_reply'])) {
				$props[PR_EC_OOF_EXTERNALREPLY] = $oof['external_reply'];
			}
			if (isset($oof['external_subject'])) {
				$props[PR_EC_OOF_EXTERNALSUBJECT] = $oof['external_subject'];
			}
			if (!empty($props))	{
				mapi_setprops($this->store, $props);
			}
		}

		/**
		 * Get session-wide settings
		 *
		 * Returns one explicit setting in an associative array:
		 *
		 * 'lang' -> setting('zarafa/v1/main/language')
		 *
		 * @return array Associative array with 'lang' entry.
		 */
		function getSessionSettings($Language)
		{
			$lang = $this->get('zarafa/v1/main/language', LANG);
			$lang = $Language->resolveLanguage($lang);

			return array(
				'lang' => $lang
			);
		}
	}
?>
