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
		 * Boolean Flag to indicate that settings has been initialized and we can safely call saveSettings to
		 * add/update new settings, if this is false then it will indicate that there was some problem
		 * initializing $this->settings object and we shouldn't continue saving new settings as that will
		 * lose all existing settings of the user
		 */
		private $initialized;

		/**
		 *  Array of settings that are defined by the admin
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

		/**
		 * Constructor
		 */
		function __construct()
		{
			$this->settings = array();
			$this->persistentSettings = array();
			$this->sysAdminDefaults = array();
			$this->settings_string = '';
			$this->modified = array();
			$this->initialized = false;
			$this->loadSettings();
		}

		/**
		 * Retrieves the normal settings and the persistent settings if not done yet.
		 *
		 * @return Boolean True if the settings have been successfully initialized,
		 * false otherwise.
		 */
		function loadSettings() {
			if ($this->initialized) {
				return true;
			}

			$this->store = $GLOBALS['mapisession']->getDefaultMessageStore();

			// ignore exceptions when loading settings
			try {
				$this->retrieveSettings();
				$this->retrievePersistentSettings();

				// this object will only be initialized when we are able to retrieve existing settings correctly
				$this->initialized = true;
			} catch (SettingsException $e) {
				$e->setHandled();
			}

			return $this->initialized;
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
			if (!$this->loadSettings()) {
				return null;
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
			if (!$this->loadSettings()) {
				return;
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
			if (!$this->loadSettings()) {
				return;
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
			if (!$this->loadSettings()) {
				return '{}';
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
			if (!$this->loadSettings()) {
				return '{}';
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
		 * new webaccess uses string property PR_EC_WEBACCESS_SETTINGS_JSON which contains settings in JSON format,
		 * and old webaccess uses string property PR_EC_WEBACCESS_SETTINGS which contains settings in
		 * the format of PHP's serialized data.
		 *
		 * This function returns nothing, but populates the 'settings' property of the class.
		 * @access private
		 */
		function retrieveSettings()
		{
			// first check if property exist and we can open that using mapi_openproperty
			$storeProps = mapi_getprops($this->store, array(PR_EC_WEBACCESS_SETTINGS_JSON));

			$settings = array("settings"=> array());
			// Check if property exists, if it does not exist then we can continue with empty set of settings
			if (isset($storeProps[PR_EC_WEBACCESS_SETTINGS_JSON]) || propIsError(PR_EC_WEBACCESS_SETTINGS_JSON, $storeProps) == MAPI_E_NOT_ENOUGH_MEMORY) {
				$this->settings_string = streamProperty($this->store, PR_EC_WEBACCESS_SETTINGS_JSON);

				if(!empty($this->settings_string)) {
					$settings = json_decode_data($this->settings_string, true);
					if ((empty($settings) || empty($settings['settings'])) && $this->initialized === true) {
						throw new SettingsException(_('Error retrieving existing settings'));
					}
				}
			}

			$this->settings = $settings['settings'];
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
						throw new SettingsException(_('Error retrieving existing persistent settings'));
					}

					$this->persistentSettings =$persistentSettings['settings'];
				}
			}
		}

		/**
		 * Merge the admin settings with the user settings. User settings take prevalence.
		 */
		function mergeSysAdminSettings()
		{
			$sysadminSettings = $this->getDefaultSysAdminSettings();
			$this->settings = array_replace_recursive($sysadminSettings, $this->settings);
		}

		/**
		 * Retrieves the default settings as defined by the System Administrator.
		 * Note: The sysadmin 'enable' setting per plugin will be taken from the WebApp's
		 * config.php (DEFAULT_ENABLED_PLUGINS_LIST) and not from the settings that
		 * are injected by the plugin itself. (that behaviour is deprecated)
		 *
		 * @return Array SysAdmin Settings object
		 */
		function getDefaultSysAdminSettings()
		{
			$allPlugins = $GLOBALS['PluginManager']->getPluginNames();
			$pluginDefaultEnableSettings = array('zarafa' => array('v1' => array('plugins' => array())));

			$defaultEnabledPlugins = $GLOBALS['PluginManager']->expandPluginList(DEFAULT_ENABLED_PLUGINS_LIST);

			forEach ($allPlugins as $p) {
				$pluginDefaultEnableSettings['zarafa']['v1']['plugins'][$p] = array('enable' => in_array($p, $defaultEnabledPlugins));
			}

			return array_replace_recursive($this->sysAdminDefaults, $pluginDefaultEnableSettings);
		}

		/**
		 * Applies the given settings to the sysAdminDefaults object. This function is used by plugins to
		 * inject their admin settings into the WebApp. Only plugin settings are processed, i.e. settings in
		 * the 'zarafa/v1/plugins' namespace. The 'enable' settings of plugins are filtered out. Those should
		 * not be set in the plugins config file anymore, but in the WebApp's config file. (DEFAULT_ENABLED_PLUGINS_LIST)
		 * @param Array $settings The default settings
		 */
		function addSysAdminDefaults($settings)
		{
			// Only allow plugin settings to be injected
			if (
				!isset($settings) || !is_array($settings) ||
				!isset($settings['zarafa']) || !is_array($settings['zarafa']) ||
				!isset($settings['zarafa']['v1']) || !is_array($settings['zarafa']['v1']) ||
				!isset($settings['zarafa']['v1']['plugins']) || !is_array($settings['zarafa']['v1']['plugins'])
			) {
				return;
			}
			$settings = array('zarafa' => array('v1' => array('plugins' => $settings['zarafa']['v1']['plugins'])));

			// Filter out plugin 'enable' settings because we will not let plugins inject those.
			// Instead admins should define default enabled plugins in the WebApp's config.php.
			foreach ($settings['zarafa']['v1']['plugins'] as $pluginName => $pluginSettings) {
				if (isset($pluginSettings) && is_array($pluginSettings) && isset($pluginSettings['enable'])) {
					unset($pluginSettings['enable']);
				}
			}

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
			/*
			if (!$this->init) {
				$this->Init();
			}
			*/

			if (isset($this->settings['zarafa']['v1'])) {
				// Remove external settings so we don't save the external settings to PR_EC_WEBACCESS_SETTINGS_JSON
				unset($this->settings['zarafa']['v1']['contexts']['mail']['outofoffice']);
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
