<?php

define('TYPE_PLUGIN', 1);
define('TYPE_MODULE', 2);
define('TYPE_CONFIG', 3);
define('TYPE_NOTIFIER', 4);

define('DEPEND_DEPENDS', 1);
define('DEPEND_REQUIRES', 2);
define('DEPEND_RECOMMENDS', 3);
define('DEPEND_SUGGESTS', 4);

/**
 * Managing component for all plugins
 *
 * This class handles all the plugin interaction with the webaccess on the server side.
 *
 * @package core
 */
class PluginManager
{
	// True if the Plugin framework is enabled
	var $enabled;

	// The path to the folder which contains the plugins
	var $pluginpath;

	// The path to the folder which holds the configuration for the plugins
	// This folder has same structure as $this->pluginpath
	var $pluginconfigpath;

	// List of all plugins and their data
	var $plugindata;

	// List of the plugins in the order in which
	// they should be loaded
	var $pluginorder;

	/**
	 * List of all hooks registered by plugins.
	 * [eventID][] = plugin
	 */
	var $hooks;

	/**
	 * List of all plugin objects
	 * [pluginname] = pluginObj
	 */
	var $plugins;

	/**
	 * List of all provided modules
	 * [modulename] = moduleFile
	 */
	var $modules;

	/**
	 * List of all provided notifiers
	 * [notifiername] = notifierFile
	 */
	var $notifiers;

	/**
	 * List of sessiondata from plugins.
	 * [pluginname] = sessiondata
	 */
	var $sessionData;

	/**
	 * Mapping for the XML 'load' attribute values
	 * on the <serverfile>, <clientfile> or <resourcefile> element
	 * to the corresponding define.
	 */
	var $loadMap = Array(
		'release' => LOAD_RELEASE,
		'debug' => LOAD_DEBUG,
		'source' => LOAD_SOURCE
	);

	/**
	 * Mapping for the XML 'type' attribute values
	 * on the <serverfile> element to the corresponding define.
	 */
	var $typeMap = Array(
		'plugin' => TYPE_PLUGIN,
		'module' => TYPE_MODULE,
		'notifier' => TYPE_NOTIFIER
	);

	/**
	 * Mapping for the XML 'type' attribute values
	 * on the <depends> element to the corresponding define.
	 */
	var $dependMap = Array(
		'depends' => DEPEND_DEPENDS,
		'requires' => DEPEND_REQUIRES,
		'recommends' => DEPEND_RECOMMENDS,
		'suggests' => DEPEND_SUGGESTS
	);

	/**
	 * Constructor
	 */
	function __construct($enable = ENABLE_PLUGINS)
	{
		$this->enabled = $enable && defined('PATH_PLUGIN_DIR');
		$this->plugindata = Array();
		$this->pluginorder = Array();
		$this->hooks = Array();
		$this->plugins = Array();
		$this->modules = Array();
		$this->notifiers = Array();
		$this->sessionData = false;
		if ($this->enabled) {
			$this->pluginpath = PATH_PLUGIN_DIR;
			$this->pluginconfigpath = PATH_PLUGIN_CONFIG_DIR;
		}
	}

	/**
	 * pluginsEnabled
	 *
	 * Checks whether the plugins have been enabled by checking if the proper
	 * configuration keys are set.
	 * @return boolean Returns true when plugins enabled, false when not.
	 */
	function pluginsEnabled(){
		return $this->enabled;
	}

	/**
	 * detectPlugins
	 *
	 * Detecting the installed plugins either by using the already ready data
	 * from the state object or otherwise read in all the data and write it into
	 * the state.
	 *
	 * @param String $disabled The list of plugins to disable, this list is separated
	 * by the ';' character.
	 */
	function detectPlugins($disabled = ''){
		if (!$this->pluginsEnabled()) {
			return false;
		}

		// Get the plugindata from the state.
		$pluginState = new State('plugin');
		$pluginState->open();

		if (!DEBUG_PLUGINS_DISABLE_CACHE) {
			$this->plugindata = $pluginState->read("plugindata");
			$pluginOrder = $pluginState->read("pluginorder");
			$this->pluginorder = empty($pluginOrder) ? array() : $pluginOrder;
		}

		// If no plugindata has been stored yet, get it from the plugins dir.
		if (!$this->plugindata || !$this->pluginorder) {
			$disabledPlugins = Array();
			if (!empty($disabled)) {
				$disabledPlugins = explode(';', $disabled);
			}

			// Read all plugins from the plugins folders.
			$this->plugindata = $this->readPluginFolder($disabledPlugins);

			// Check if any plugin directories found or not
			if (!empty($this->plugindata) ) {
				// Not we update plugindata and pluginorder based on the configured dependencies.
				// Note that each change to plugindata requires the requirements and dependencies
				// to be recalculated.
				while (!$this->pluginorder || !$this->validatePluginRequirements()) {
					// Generate the order in which the plugins should be loaded,
					// this uses the $this->plugindata as base.
					$pluginOrder = $this->buildPluginDependencyOrder();
					$this->pluginorder = empty($pluginOrder) ? array() : $pluginOrder;
				};
			}
		}

		// Write the plugindata back to the state
		if (!DEBUG_PLUGINS_DISABLE_CACHE) {
			$pluginState->write("plugindata", $this->plugindata);
			$pluginState->write("pluginorder", $this->pluginorder);
		}

		// Free the state again.
		$pluginState->close();
	}

	/**
	 * readPluginFolder
	 *
	 * Read all subfolders of the directory referenced to by $this->pluginpath,
	 * for each subdir, we $this->processPlugin it as a plugin.
	 *
	 * @param $disabledPlugins Array The list of disabled plugins, the subfolders
	 * named as any of the strings inside this list will not be processed.
	 * @returns Array The object containing all the processed plugins. The object is a key-value'
	 * object where the key is the unique name of the plugin, and the value the parsed data.
	 */
	function readPluginFolder($disabledPlugins)
	{
		$data = Array();

		$pluginsdir = opendir($this->pluginpath);
		if ($pluginsdir) {
			while(($plugin = readdir($pluginsdir)) !== false){
				if ($plugin != '.' && $plugin != '..' && !in_array($plugin, $disabledPlugins)){
					if(is_dir($this->pluginpath . DIRECTORY_SEPARATOR . $plugin)){
						if(is_file($this->pluginpath . DIRECTORY_SEPARATOR . $plugin . DIRECTORY_SEPARATOR . 'manifest.xml')){
							$processed = $this->processPlugin($plugin);
							$data[$processed['pluginname']] = $processed;
						}
					}
				}
			}

			closedir($pluginsdir);
		}

		return $data;
	}

	/**
	 * validatePluginRequirements
	 *
	 * Go over the parsed $this->plugindata and check if all requirements are met.
	 * This means that for each plugin which defined a "depends" or "requires" plugin
	 * we check if those plugins are present on the system. If some dependencies are
	 * not met, the plugin is removed from $this->plugindata.
	 *
	 * @return boolean False if the $this->plugindata was modified by this function
	 */
	function validatePluginRequirements()
	{
		$modified = false;

		do {
			$success = true;

			foreach ($this->plugindata as $pluginname => &$plugin) {
				// Check if the plugin had any dependencies
				// declared in the manifest. If not, they are obviously
				// met. Otherwise we have to check the type of dependencies
				// which were declared.
				if ($plugin['dependencies']) {

					// We only care about the 'depends' and 'requires'
					// dependency types. All others are not blocking.
					foreach ($plugin['dependencies'][DEPEND_DEPENDS] as &$depends) {
						if (!$this->pluginExists($depends['plugin'])) {
							if (DEBUG_PLUGINS) {
								dump('[PLUGIN ERROR] Plugin "' . $pluginname . '" requires "' . $depends['plugin'] . '" which could not be found');
							}
							unset($this->plugindata[$pluginname]);
							// Indicate failure, as we have removed a plugin, and the requirements
							// must be rechecked.
							$success = false;
							// Indicate that the plugindata was modified.
							$modified = true;
						}
					}

					foreach ($plugin['dependencies'][DEPEND_REQUIRES] as &$depends) {
						if (!$this->pluginExists($depends['plugin'])) {
							if (DEBUG_PLUGINS) {
								dump('[PLUGIN ERROR] Plugin "' . $pluginname . '" requires "' . $depends['plugin'] . '" which could not be found');
							}
							unset($this->plugindata[$pluginname]);
							// Indicate failure, as we have removed a plugin, and the requirements
							// must be rechecked.
							$success = false;
							// Indicate that the plugindata was modified.
							$modified = true;
						}
					}
				}
			}

		// If a plugin was removed because of a failed dependency or requirement,
		// then we have to redo the cycle, because another plugin might have depended
		// on the removed plugin.
		} while(!$success);

		return !$modified;
	}

	/**
	 * buildPluginDependencyOrder
	 *
	 * Go over the parsed $this->plugindata and create a ordered list of the plugins, resembling
	 * the order in which those plugins should be loaded. This goes over all plugins to read
	 * the 'dependencies' data and ordering those plugins based on the DEPEND_DEPENDS dependency type.
	 *
	 * In case of circular dependencies, the $this->plugindata object might be altered to remove
	 * the plugin which the broken dependencies.
	 *
	 * @return Array The array of plugins in the order of which they should be loaded
	 */
	function buildPluginDependencyOrder()
	{
		$plugins = array_keys($this->plugindata);
		$ordered = Array();
		$failedCount = 0;

		// We are going to keep it quite simple, we keep looping over the $plugins
		// array until it is empty. Each time we find a plugin for which all dependencies
		// are met, we can put it on the $ordered list. If we have looped over the list twice,
		// without updated the $ordered list in any way, then we have found a circular dependency
		// and we cannot resolve the plugins correctly.
		while (!empty($plugins)) {
			$pluginname = array_shift($plugins);
			$plugin = $this->plugindata[$pluginname];
			$accepted = true;

			// Go over all dependencies to see if they have been met.
			if ($plugin['dependencies']) {
				for ($i = 0, $len = count($plugin['dependencies'][DEPEND_DEPENDS]); $i < $len; $i++) {
					$dependency = $plugin['dependencies'][DEPEND_DEPENDS][$i];
					if (array_search($dependency['plugin'], $ordered) === FALSE) {
						$accepted = false;
						break;
					}
				}
			}

			if ($accepted) {
				// The dependencies for this plugin have been met, we can push
				// the plugin into the tree.
				$ordered[] = $pluginname;

				// Reset the $failedCount property, this ensures that we can keep
				// looping because other plugins with previously unresolved dependencies
				// could possible be resolved.
				$failedCount = 0;
			} else {
				// The dependencies for this plugin have not been met, we push
				// the plugin back to the list and we will retry later when the
				// $ordered list contains more items.
				$plugins[] = $pluginname;

				// Increase the $failedCount property, this prevents that we could go into
				// an infinite loop when a circular dependency was defined.
				$failedCount++;
			}

			// If the $failedCount matches the the number of items in the $plugins array,
			// it means that all unordered plugins have unmet dependencies. This could only
			// happen for circular dependencies. In that case we will refuse to load those plugins.
			if ($failedCount === count($plugins)) {
				foreach ($plugins as $plugin) {
					if (DEBUG_PLUGINS) {
						dump('[PLUGIN ERROR] Circular dependency detected for plugin "' . $plugin . '"');
					}
					unset($this->plugindata[$plugin]);
				}
				break;
			}
		}

		return $ordered;
	}

	/**
	 * initPlugins
	 *
	 * This function includes the server plugin classes, instantiate and
	 * initialize them.
	 *
	 * @param number $load One of LOAD_RELEASE, LOAD_DEBUG, LOAD_SOURCE. This will filter
	 * the files based on the 'load' attribute.
	 */
	function initPlugins($load = LOAD_RELEASE){
		if(!$this->pluginsEnabled()){
			return false;
		}

		$files = $this->getServerFiles($load);
		foreach ($files['server'] as $file) {
			include_once($file);
		}

		// Inlcude the root files of all the plugins and instantiate the plugin
		foreach ($this->pluginorder as $plugName) {
			$pluginClassName = 'Plugin' . $plugName;
			if(class_exists($pluginClassName)){
				$this->plugins[$plugName] = new $pluginClassName;
				$this->plugins[$plugName]->setPluginName($plugName);
				$this->plugins[$plugName]->init();
			}
		}

		$this->modules = $files['modules'];
		$this->notifiers = $files['notifiers'];
	}

	/**
	 * processPlugin
	 *
	 * Read in the manifest and get the files that need to be included
	 * for placing hooks, defining modules, etc.
	 *
	 * @param $dirname string name of the directory of the plugin
	 * @return array The plugin data read from the given directory
	 */
	function processPlugin($dirname){
		// Read XML manifest file of plugin
		$handle = fopen($this->pluginpath . DIRECTORY_SEPARATOR . $dirname . DIRECTORY_SEPARATOR . 'manifest.xml', 'rb');
		$xml = '';
		if($handle){
			while (!feof($handle)) {
				$xml .= fread($handle, 4096);
			}
			fclose($handle);
		}

		$plugindata = $this->extractPluginDataFromXML($xml, $dirname);
		if ($plugindata) {
			// Apply the name to the object
			$plugindata['pluginname'] = $dirname;
		} else {
			if (DEBUG_PLUGINS) {
				dump('[PLUGIN ERROR] Plugin "'.$dirname.'" has an invalid manifest.');
			}
		}
		return $plugindata;
	}

	/**
	 * loadSessionData
	 *
	 * Loads sessiondata of the plugins from disk.
	 * To improve performance the data is only loaded if a
	 * plugin requests (reads or saves) the data.
	 *
	 * @param $pluginname string Identifier of the plugin
	 */
	function loadSessionData($pluginname) {
		// lazy reading of sessionData
		if (!$this->sessionData) {
			$sessState = new State('plugin_sessiondata');
			$sessState->open();
			$this->sessionData = $sessState->read("sessionData");
			if (!isset($this->sessionData) || $this->sessionData == "")
				$this->sessionData = array();
			$sessState->close();
		}
		if ($this->pluginExists($pluginname)) {
			if (!isset($this->sessionData[$pluginname])) {
				$this->sessionData[$pluginname] = array();
			}
			$this->plugins[ $pluginname ]->setSessionData($this->sessionData[$pluginname]);
		}
	}

	/**
	 * saveSessionData
	 *
	 * Saves sessiondata of the plugins to the disk.
	 *
	 * @param $pluginname string Identifier of the plugin
	 */
	function saveSessionData($pluginname) {
		if ($this->pluginExists($pluginname)) {
			$this->sessionData[$pluginname] = $this->plugins[ $pluginname ]->getSessionData();
		}
		if ($this->sessionData) {
			$sessState = new State('plugin_sessiondata');
			$sessState->open();
			$sessState->write("sessionData", $this->sessionData);
			$sessState->close();
		}
	}

	/**
	 * pluginExists
	 *
	 * Checks if plugin exists.
	 *
	 * @param $pluginname string Identifier of the plugin
	 * @return boolen True when plugin exists, false when it does not.
	 */
	function pluginExists($pluginname){
		if(isset($this->plugindata[ $pluginname ])){
			return true;
		}else{
			return false;
		}
	}

	/**
	 * getModuleFilePath
	 *
	 * Obtain the filepath of the given modulename
	 *
	 * @param $modulename string Identifier of the modulename
	 * @return string The path to the file for the module
	 */
	function getModuleFilePath($modulename)
	{
		if (isset($this->modules[$modulename])) {
			return $this->modules[$modulename];
		}

		return false;
	}

	/**
	 * getNotifierFilePath
	 *
	 * Obtain the filepath of the given notifiername
	 *
	 * @param $notifiername string Identifier of the notifiername
	 * @return string The path to the file for the notifier
	 */
	function getNotifierFilePath($notifiername)
	{
		if (isset($this->notifiers[$notifiername])) {
			return $this->notifiers[$notifiername];
		}

		return false;
	}

	/**
	 * registerHook
	 *
	 * This function allows the plugin to register their hooks.
	 *
	 * @param $eventID string Identifier of the event where this hook must be triggered.
	 * @param $pluginName string Name of the plugin that is registering this hook.
	 */
	function registerHook($eventID, $pluginName){
		$this->hooks[ $eventID ][ $pluginName ] = $pluginName;
	}

	/**
	 * triggerHook
	 *
	 * This function will call all the registered hooks when their event is triggered.
	 *
	 * @param $eventID string Identifier of the event that has just been triggered.
	 * @param $data mixed (Optional) Usually an array of data that the callback function can modify.
	 * @return mixed Data that has been changed by plugins.
	 */
	function triggerHook($eventID, $data = Array())
	{
		if(isset($this->hooks[ $eventID ]) && is_array($this->hooks[ $eventID ])){
			foreach($this->hooks[ $eventID ] as $key => $pluginname){
				$this->plugins[ $pluginname ]->execute($eventID, $data);
			}
		}
		return $data;
	}

	/**
	 * getPluginVersion
	 *
	 * Function is used to prepare version information array from plugindata.
	 *
	 * @return Array The array of plugins version information.
	 */
	function getPluginsVersion()
	{
		$versionInfo = Array();
		foreach ($this->plugindata as $pluginName => $data ) {
			$versionInfo[$pluginName] = $data["version"];
		}
		return $versionInfo;
	}

	/**
	 * getServerFilesForComponent
	 *
	 * Called by getServerFiles() to return the list of files which are provided
	 * for the given component in a particular plugin.
	 * The paths which are returned start at the root of the webapp.
	 *
	 * This function might call itself recursively if it couldn't find any files for
	 * the given $load type. If no 'source' files are found, it will obtain the 'debug'
	 * files, if that too files it will fallback to 'release' files. If the latter is
	 * not found either, no files are returned.
	 *
	 * @param String $pluginname The name of the plugin (this is used in the pathname)
	 * @param Array $component The component to read the serverfiles from
	 * @param number $load One of LOAD_RELEASE, LOAD_DEBUG, LOAD_SOURCE. This will filter
	 * the files based on the 'load' attribute.
	 * @return array list of paths to the files in this component
	 */
	function getServerFilesForComponent($pluginname, $component, $load)
	{
		$componentfiles = Array(
			'server' => Array(),
			'modules' => Array(),
			'notifiers' => Array()
		);

		foreach ($component['serverfiles'][$load] as &$file) {
			switch ($file['type']) {
				case TYPE_CONFIG:
					$componentfiles['server'][] = $this->pluginconfigpath . DIRECTORY_SEPARATOR . $pluginname . DIRECTORY_SEPARATOR . $file['file'];
					break;
				case TYPE_PLUGIN:
					$componentfiles['server'][] = $this->pluginpath . DIRECTORY_SEPARATOR . $pluginname . DIRECTORY_SEPARATOR . $file['file'];
					break;
				case TYPE_MODULE:
					$componentfiles['modules'][ $file['module'] ] = $this->pluginpath . DIRECTORY_SEPARATOR . $pluginname . DIRECTORY_SEPARATOR . $file['file'];
					break;
				case TYPE_NOTIFIER:
					$componentfiles['notifiers'][ $file['notifier'] ] = $this->pluginpath . DIRECTORY_SEPARATOR . $pluginname . DIRECTORY_SEPARATOR .$file['file'];
					break;
			}

		}
		unset($file);

		return $componentfiles;
	}

	/**
	 * getServerFiles
	 *
	 * Returning an array of paths to files that need to be included.
	 * The paths which are returned start at the root of the webapp.
	 *
	 * This calls getServerFilesForComponent() to obtain the files
	 * for each component inside the requested plugin
	 *
	 * @param string $pluginname The name of the plugin for which the server files are requested.
	 * @param number $load One of LOAD_RELEASE, LOAD_DEBUG, LOAD_SOURCE. This will filter
	 * the files based on the 'load' attribute.
	 * @return array List of paths to files.
	 */
	function getServerFiles($load = LOAD_RELEASE)
	{
		$files = Array(
			'server' => Array(),
			'modules' => Array(),
			'notifiers' => Array()
		);

		foreach ($this->pluginorder as $pluginname) {
			$plugin = &$this->plugindata[$pluginname];
			foreach($plugin['components'] as &$component) {
				if (!empty($component['serverfiles'][$load])) {
					$componentfiles = $this->getServerFilesForComponent($pluginname, $component, $load);
				} else if ($load === LOAD_SOURCE && !empty($component['serverfiles'][LOAD_DEBUG])) {
					$componentfiles = $this->getServerFilesForComponent($pluginname, $component, LOAD_DEBUG);
				} else if ($load !== LOAD_RELEASE && !empty($component['serverfiles'][LOAD_RELEASE])) {
					$componentfiles = $this->getServerFilesForComponent($pluginname, $component, LOAD_RELEASE);
				} // else tough luck, at least release should be present

				if (isset($componentfiles)) {
					$files['server'] = array_merge($files['server'], $componentfiles['server']);
					$files['modules'] = array_merge($files['modules'], $componentfiles['modules']);
					$files['notifiers'] = array_merge($files['notifiers'], $componentfiles['notifiers']);
					unset($componentfiles);
				}
			}
			unset($component);
		}
		unset($plugin);

		return $files;
	}

	/**
	 * getClientFilesForComponent
	 *
	 * Called by getClientFiles() to return the list of files which are provided
	 * for the given component in a particular plugin.
	 * The paths which are returned start at the root of the webapp.
	 *
	 * This function might call itself recursively if it couldn't find any files for
	 * the given $load type. If no 'source' files are found, it will obtain the 'debug'
	 * files, if that too files it will fallback to 'release' files. If the latter is
	 * not found either, no files are returned.
	 *
	 * @param String $pluginname The name of the plugin (this is used in the pathname)
	 * @param Array $component The component to read the clientfiles from
	 * @param number $load One of LOAD_RELEASE, LOAD_DEBUG, LOAD_SOURCE. This will filter
	 * the files based on the 'load' attribute.
	 * @return array list of paths to the files in this component
	 */
	function getClientFilesForComponent($pluginname, $component, $load)
	{
		$componentfiles = Array();

		foreach ($component['clientfiles'][$load] as &$file) {
			$componentfiles[] = $this->pluginpath . DIRECTORY_SEPARATOR . $pluginname . DIRECTORY_SEPARATOR . $file['file'];
		}
		unset($file);

		return $componentfiles;
	}

	/**
	 * getClientFiles
	 *
	 * Returning an array of paths to files that need to be included.
	 * The paths which are returned start at the root of the webapp.
	 *
	 * This calls getClientFilesForComponent() to obtain the files
	 * for each component inside each plugin.
	 *
	 * @param number $load One of LOAD_RELEASE, LOAD_DEBUG, LOAD_SOURCE. This will filter
	 * the files based on the 'load' attribute.
	 * @return array List of paths to files.
	 */
	function getClientFiles($load = LOAD_RELEASE){
		$files = Array();

		foreach ($this->pluginorder as $pluginname) {
			$plugin = &$this->plugindata[$pluginname];
			foreach($plugin['components'] as &$component) {
				if (!empty($component['clientfiles'][$load])) {
					$componentfiles = $this->getClientFilesForComponent($pluginname, $component, $load);
				} else if ($load === LOAD_SOURCE && !empty($component['clientfiles'][LOAD_DEBUG])) {
					$componentfiles = $this->getClientFilesForComponent($pluginname, $component, LOAD_DEBUG);
				} else if ($load !== LOAD_RELEASE && !empty($component['clientfiles'][LOAD_RELEASE])) {
					$componentfiles = $this->getClientFilesForComponent($pluginname, $component, LOAD_RELEASE);
				} // else tough luck, at least release should be present

				if (isset($componentfiles)) {
					$files = array_merge($files, $componentfiles);
					unset($componentfiles);
				}
			}
			unset($component);
		}
		unset($plugin);

		return $files;
	}

	/**
	 * getResourceFilesForComponent
	 *
	 * Called by getResourceFiles() to return the list of files which are provided
	 * for the given component in a particular plugin.
	 * The paths which are returned start at the root of the webapp.
	 *
	 * This function might call itself recursively if it couldn't find any files for
	 * the given $load type. If no 'source' files are found, it will obtain the 'debug'
	 * files, if that too files it will fallback to 'release' files. If the latter is
	 * not found either, no files are returned.
	 *
	 * @param String $pluginname The name of the plugin (this is used in the pathname)
	 * @param Array $component The component to read the resourcefiles from
	 * @param number $load One of LOAD_RELEASE, LOAD_DEBUG, LOAD_SOURCE. This will filter
	 * the files based on the 'load' attribute.
	 * @return array list of paths to the files in this component
	 */
	function getResourceFilesForComponent($pluginname, $component, $load)
	{
		$componentfiles = Array();

		foreach ($component['resourcefiles'][$load] as &$file) {
			$componentfiles[] = $this->pluginpath . DIRECTORY_SEPARATOR . $pluginname . DIRECTORY_SEPARATOR . $file['file'];
		}
		unset($file);

		return $componentfiles;
	}

	/**
	 * getResourceFiles
	 *
	 * Returning an array of paths to files that need to be included.
	 * The paths which are returned start at the root of the webapp.
	 *
	 * This calls getResourceFilesForComponent() to obtain the files
	 * for each component inside each plugin.
	 *
	 * @param number $load One of LOAD_RELEASE, LOAD_DEBUG, LOAD_SOURCE. This will filter
	 * the files based on the 'load' attribute.
	 * @return array List of paths to files.
	 */
	function getResourceFiles($load = LOAD_RELEASE) {
		$files = Array();

		foreach ($this->pluginorder as $pluginname) {
			$plugin = &$this->plugindata[$pluginname];
			foreach($plugin['components'] as &$component) {
				if (!empty($component['resourcefiles'][$load])) {
					$componentfiles = $this->getResourceFilesForComponent($pluginname, $component, $load);
				} else if ($load === LOAD_SOURCE && !empty($component['resourcefiles'][LOAD_DEBUG])) {
					$componentfiles = $this->getResourceFilesForComponent($pluginname, $component, LOAD_DEBUG);
				} else if ($load !== LOAD_RELEASE && !empty($component['resourcefiles'][LOAD_RELEASE])) {
					$componentfiles = $this->getResourceFilesForComponent($pluginname, $component, LOAD_RELEASE);
				} // else tough luck, at least release should be present

				if (isset($componentfiles)) {
					$files = array_merge($files, $componentfiles);
					unset($componentfiles);
				}
			}
			unset($component);
		}
		unset($plugin);

		return $files;
	}

	/**
	 * getTranslationFilePaths
	 *
	 * Returning an array of paths to to the translations files. This will be
	 * used by the gettext functionality.
	 *
	 * @return array List of paths to translations.
	 */
	function getTranslationFilePaths(){
		$paths = Array();

		foreach ($this->pluginorder as $pluginname) {
			$plugin = &$this->plugindata[$pluginname];
			if ($plugin['translationsdir']) {
				$translationPath =  $this->pluginpath . DIRECTORY_SEPARATOR . $pluginname . DIRECTORY_SEPARATOR . $plugin['translationsdir']['dir'];
				if(is_dir($translationPath)){
					$paths[$pluginname] = $translationPath;
				}
			}
		}
		unset($plugin);

		return $paths;
	}

	/**
	 * extractPluginDataFromXML
	 *
	 * Extracts all the data from the Plugin XML manifest.
	 *
	 * @param $xml string XML manifest of plugin
	 * @param $dirname string name of the directory of the plugin
	 * @return array Data from XML converted into array that the PluginManager can use.
	 */
	function extractPluginDataFromXML($xml, $dirname)
	{
		$plugindata = Array(
			'components' => Array(),
			'dependencies' => null,
			'translationsdir' => null,
			'version' => null
		);

		// Parse all XML data
		$data = new SimpleXMLElement($xml);

		// Parse the <plugin> attributes
		if (isset($data['version']) && (int) $data['version'] !== 2) {
			if (DEBUG_PLUGINS) {
				dump("[PLUGIN ERROR] Plugin $dirname manifest uses version " . $data['version'] . " while only version 2 is supported");
			}
			return false;
		}

		// Parse the <info> element
		if (isset($data->info->version)) {
			$plugindata['version'] = (string) $data->info->version;
		} else {
			dump("[PLUGIN WARNING] Plugin $dirname has not specified version information in manifest.xml");
		}

		// Parse the <config> element
		if (isset($data->config)) {
			if (isset($data->config->configfile)) {
				if (empty($data->config->configfile)) {
					dump("[PLUGIN ERROR] Plugin $dirname manifest contains empty configfile declaration");
				}
				if (!file_exists($data->config->configfile)) {
					dump("[PLUGIN ERROR] Plugin $dirname manifest config file does not exists");
				}
			} else {
				dump("[PLUGIN ERROR] Plugin $dirname manifest configfile entry is missing");
			}

			$files = Array(
				LOAD_SOURCE => Array(),
				LOAD_DEBUG => Array(),
				LOAD_RELEASE => Array(),
			);
			foreach($data->config->configfile as $filename) {
				$files[LOAD_RELEASE][] = Array(
					'file' => (string) $filename,
					'type' => TYPE_CONFIG,
					'load' => LOAD_RELEASE,
					'module' => null,
					'notifier' => null
				);
			}
			$plugindata['components'][] = Array(
				'serverfiles' => $files,
				'clientfiles' => Array(),
				'resourcefiles' => Array(),
			);
		}

		// Parse the <dependencies> element
		if (isset($data->dependencies) && isset($data->dependencies->depends)){
			$dependencies = Array(
				DEPEND_DEPENDS => Array(),
				DEPEND_REQUIRES => Array(),
				DEPEND_RECOMMENDS => Array(),
				DEPEND_SUGGESTS => Array()
			);
			foreach($data->dependencies->depends as $depends){
				$type = $this->dependMap[(string)$depends->attributes()->type];
				$plugin = (string) $depends->dependsname;
				$dependencies[$type][] = Array(
					'plugin' => $plugin
				);
			}
			$plugindata['dependencies'] = $dependencies;
		}

		// Parse the <translations> element
		if (isset($data->translations) && isset($data->translations->translationsdir)) {
			$plugindata['translationsdir'] = Array(
				'dir' => (string) $data->translations->translationsdir
			);
		}

		// Parse the <components> element
		if (isset($data->components) && isset($data->components->component)) {
			foreach($data->components->component as $component){
				$componentdata = array(
					'serverfiles' => Array(
						LOAD_SOURCE => Array(),
						LOAD_DEBUG => Array(),
						LOAD_RELEASE => Array()
					),
					'clientfiles' => Array(
						LOAD_SOURCE => Array(),
						LOAD_DEBUG => Array(),
						LOAD_RELEASE => Array()
					),
					'resourcefiles' => Array(
						LOAD_SOURCE => Array(),
						LOAD_DEBUG => Array(),
						LOAD_RELEASE => Array()
					),
				);
				if (isset($component->files)) {
					if (isset($component->files->server) && isset($component->files->server->serverfile)) {
						$files = Array(
							LOAD_SOURCE => Array(),
							LOAD_DEBUG => Array(),
							LOAD_RELEASE => Array()
						);
						foreach($component->files->server->serverfile as $serverfile) {
							$load = LOAD_RELEASE;
							$type = TYPE_PLUGIN;
							$module = null;
							$notifier = null;

							$filename = (string) $serverfile;
							if (empty($filename)) {
								dump("[PLUGIN ERROR] Plugin $dirname manifest contains empty serverfile declaration");
							}
							if (isset($serverfile['type'])) {
								$type = $this->typeMap[(string)$serverfile['type']];
							}
							if (isset($serverfile['load'])) {
								$load = $this->loadMap[(string)$serverfile['load']];
							}
							if (isset($serverfile['module'])) {
								$module = (string) $serverfile['module'];
							}
							if (isset($serverfile['notifier'])) {
								$notifier = (string) $serverfile['notifier'];
							}
							if ($filename){
								$files[$load][] = Array(
									'file' => $filename,
									'type' => $type,
									'load' => $load,
									'module' => $module,
									'notifier' => $notifier
								);
							}
						}
						$componentdata['serverfiles'][LOAD_SOURCE] = array_merge($componentdata['serverfiles'][LOAD_SOURCE], $files[LOAD_SOURCE]);
						$componentdata['serverfiles'][LOAD_DEBUG] = array_merge($componentdata['serverfiles'][LOAD_DEBUG], $files[LOAD_DEBUG]);
						$componentdata['serverfiles'][LOAD_RELEASE] = array_merge($componentdata['serverfiles'][LOAD_RELEASE], $files[LOAD_RELEASE]);
					}
					if (isset($component->files->client) && isset($component->files->client->clientfile)) {
						$files = Array(
							LOAD_SOURCE => Array(),
							LOAD_DEBUG => Array(),
							LOAD_RELEASE => Array()
						);
						foreach($component->files->client->clientfile as $clientfile) {
							$filename = False;
							$load = LOAD_RELEASE;
							$filename = (string) $clientfile;
							if (isset($clientfile['load'])) {
								$load = $this->loadMap[(string)$clientfile['load']];
							}
							if (empty($filename)) {
								if (DEBUG_PLUGINS) {
									dump("[PLUGIN ERROR] Plugin $dirname manifest contains empty resourcefile declaration");
								}
							} else {
								$files[$load][] = Array(
									'file' => $filename,
									'load' => $load,
								);
							}
						}
						$componentdata['clientfiles'][LOAD_SOURCE] = array_merge($componentdata['clientfiles'][LOAD_SOURCE], $files[LOAD_SOURCE]);
						$componentdata['clientfiles'][LOAD_DEBUG] = array_merge($componentdata['clientfiles'][LOAD_DEBUG], $files[LOAD_DEBUG]);
						$componentdata['clientfiles'][LOAD_RELEASE] = array_merge($componentdata['clientfiles'][LOAD_RELEASE], $files[LOAD_RELEASE]);
					}
					if (isset($component->files->resources) && isset($component->files->resources->resourcefile)) {
						$files = Array(
							LOAD_SOURCE => Array(),
							LOAD_DEBUG => Array(),
							LOAD_RELEASE => Array()
						);
						foreach($component->files->resources->resourcefile as $resourcefile) {
							$filename = False;
							$load = LOAD_RELEASE;
							$filename = (string) $resourcefile;
							if (isset($resourcefile['load'])) {
								$load = $this->loadMap[(string)$resourcefile['load']];
							}
							if (empty($filename)) {
								if (DEBUG_PLUGINS) {
									dump("[PLUGIN ERROR] Plugin $dirname manifest contains empty resourcefile declaration");
								}
							} else {
								$files[$load][] = Array(
									'file' => $filename,
									'load' => $load,
								);
							}
						}
						$componentdata['resourcefiles'][LOAD_SOURCE] = array_merge($componentdata['resourcefiles'][LOAD_SOURCE], $files[LOAD_SOURCE]);
						$componentdata['resourcefiles'][LOAD_DEBUG] = array_merge($componentdata['resourcefiles'][LOAD_DEBUG], $files[LOAD_DEBUG]);
						$componentdata['resourcefiles'][LOAD_RELEASE] = array_merge($componentdata['resourcefiles'][LOAD_RELEASE], $files[LOAD_RELEASE]);
					}
					$plugindata['components'][] = $componentdata;
				}
			}
		} else {
			if (DEBUG_PLUGINS) {
				dump("[PLUGIN ERROR] Plugin $dirname manifest didn't provide any components");
			}
			return false;
		}
		return $plugindata;
	}

	/**
	 * Expands a string that contains a semicolon separated list of plugins.
	 * All wildcards (*) will be resolved.
	 */
	function expandPluginList($pluginList)
	{
		$pluginNames = explode(';', $pluginList);
		$pluginList = array();
		foreach ( $pluginNames as $pluginName ){
			$pluginName = trim($pluginName);
			if ( array_key_exists($pluginName, $this->plugindata) ){
				$pluginList[] = $pluginName;
			} else {
				// Check if it contains a wildcard
				if ( strpos($pluginName, '*')!==false ){
					$expandedPluginList = $this->_expandPluginNameWithWildcard($pluginName);
					$pluginList = array_merge($pluginList, $expandedPluginList);
				}
			}
		}

		// Remove duplicates
		$pluginList = array_unique($pluginList);

		return implode(';', $pluginList);
	}

	/**
	 * Finds all plugins that match the given string name (that contains one or
	 * more wildcards)
	 *
	 * @param String $pluginNameWithWildcard A plugin identifying string that
	 * contains a wildcard character (*)
	 * @return Array An array with the names of the plugins that are identified by
	 * $pluginNameWithWildcard
	 */
	private function _expandPluginNameWithWildcard($pluginNameWithWildcard)
	{
		$retVal = array();
		$pluginNames = array_keys($this->plugindata);
		$regExp = '/^' . str_replace('*', '.*?', $pluginNameWithWildcard) . '$/';
		dump('rexexp = '.$regExp);
		foreach ( $pluginNames as $pluginName ){
			dump('checking plugin: '.$pluginName);
			if ( preg_match($regExp, $pluginName) ){
				$retVal[] = $pluginName;
			}
		}

		return $retVal;
	}
}
?>
