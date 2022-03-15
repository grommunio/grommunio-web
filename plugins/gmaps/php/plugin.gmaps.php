<?php

/**
 * Openstreetmap plugin
 *
 * Makes possible to see contact location on openstreetmap
 *
 */

class Plugingmaps extends Plugin {

	function __construct() {}

	/**
	 * Function initializes the Plugin and registers all hooks
	 *
	 * @return void
	 */
	function init() {
		$this->registerHook('server.core.settings.init.before');
		$this->registerHook('server.main.include.cssfiles');
		$this->registerHook('server.main.include.jsfiles');
	}

	/**
	 * Function is executed when a hook is triggered by the PluginManager
	 *
	 * @param string $eventID the id of the triggered hook
	 * @param mixed $data object(s) related to the hook
	 * @return void
	 */
	function execute($eventID, &$data) {
		switch($eventID) {
			case 'server.core.settings.init.before':
				$this->injectPluginSettings($data);
				break;
			case 'server.main.include.jsfiles':
				$this->addLeafletJsFile($data);
				break;
			case 'server.main.include.cssfiles':
				$this->addLeafletCssFile($data);
				break;
		}
	}

	/**
	 * Function includes the the files neccessary for using
	 * leaflet
	 *  @param $data
	 */
	function addLeafletJsFile(&$data) {
		// make sure to load remote files only when plugin is enabled
		if($GLOBALS['settings']->get('zarafa/v1/plugins/gmaps/enable') == true) {
			//removing https: provides protocols compatibility, especially in IE9
			$data['files'][] = 'plugins/gmaps/js/leaflet.js';
			$data['files'][] = 'plugins/gmaps/js/geocoder.js';
		}
	}

/**
	 * Function includes the the files neccessary for using
	 * leaflet
	 *  @param $data
	 */
	function addLeafletCssFile(&$data) {
		// make sure to load remote files only when plugin is enabled
		if($GLOBALS['settings']->get('zarafa/v1/plugins/gmaps/enable') == true) {
			//removing https: provides protocols compatibility, especially in IE9
			$data['files'][] = 'plugins/gmaps/css/leaflet.css';
			$data['files'][] = 'plugins/gmaps/css/geocoder.css';
		}
	}

	/**
	 * Called when the core Settings class is initialized and ready to accept sysadmin default
	 * settings. Registers the sysadmin defaults for the Gmaps plugin.
	 * @param Array $data Reference to the data of the triggered hook
	 */
	function injectPluginSettings(&$data) {
		$data['settingsObj']->addSysAdminDefaults(Array(
			'zarafa' => Array(
				'v1' => Array(
					'plugins' => Array(
						'gmaps' => Array(
							'enable'            => PLUGIN_GMAPS_USER_DEFAULT_ENABLE,
						)

					)
				)
			)
		));
	}
}
?>
