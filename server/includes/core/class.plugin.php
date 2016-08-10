<?php
class Plugin {
	// Identifying name of the plugin.
	private $pluginname = false;
	// holds session data of the plugin
	private $sessionData = false;

	function __construct(){}

	/**
	 * setPluginName
	 * 
	 * Sets the identifying name of the plugin in a member variable.
	 *
	 *@param $name string Identifying name of the plugin
	 */
	function setPluginName($name){
		$this->pluginname = $name;
	}

	/**
	 * getPluginName
	 * 
	 * Gets the identifying name of the plugin.
	 *
	 *@return string Identifying name of the plugin
	 */
	function getPluginName(){
		return $this->pluginname;
	}

	/**
	 * registerHook
	 * 
	 * This functions calls the PluginManager to register a hook for this plugin.
	 * 
	 * @param $eventID string Identifier of the event where this hook must be triggered.
	 */
	function registerHook($eventID){
		if($this->getPluginName()){
			$GLOBALS['PluginManager']->registerHook($eventID, $this->getPluginName());
		}
	}

	/**
	 * getData
	 * 
	 * This functions returns session data for a key. If the sessiondata is not yet 
	 * loaded the PluginManager is invoked to take care of this
	 * 
	 * @param $key string Identifier in the session data
	 */
	function getData($key) {
		// lazy load of plugindata
		if (! $this->sessionData)	
			$GLOBALS['PluginManager']->loadSessionData($this->getPluginName());
			
		if (is_array($this->sessionData) && isset($this->sessionData[$key]))
			return $this->sessionData[$key];
		else
			return null;
	}

	/**
	 * setData
	 * 
	 * This functions sets session data for a key. If the sessiondata is not yet 
	 * loaded the PluginManager is invoked to take care of this.
	 * By default, the function saves the sessiondata to the disk by invoking the PluginManager.
	 * This could be disabled for performance improvement, but this may cause data loss if the 
	 * data is never saved 
	 * 
	 * @param $key string Identifier in the session data
	 * @param $value mixed data associated to the key
	 * @param $autosave boolean By default all data is saved
	 */	
	function setData($key, $value, $autosave = true) {
		// lazy load of plugindata
		if (! is_array($this->sessionData))	
			$GLOBALS['PluginManager']->loadSessionData($this->getPluginName());

		$this->sessionData[$key] = $value;
		
		if ($autosave) $GLOBALS['PluginManager']->saveSessionData($this->getPluginName());		
	}

	/**
	 * setSessionData
	 * 
	 * Setter for session data
	 * 
	 * @param $sessionData array() the session data for the plugin
	 */	
	function setSessionData($sessionData) {
		$this->sessionData = $sessionData;
	}

	/**
	 * getSessionData
	 * 
	 * Getter for session data
	 * 
	 */	
	function getSessionData() {
		return $this->sessionData;
	}	
	
	/**
	 * returns the PLUGINPATH and pluginname as a single string
	 *  
	 * @return string path
	 */	
	function getPluginPath() {
		return PATH_PLUGIN_DIR."/" . $this->getPluginName() . "/";
	}
	
	// Placeholder functions
	function execute($eventID, &$data){}
	function init(){}
}
?>
