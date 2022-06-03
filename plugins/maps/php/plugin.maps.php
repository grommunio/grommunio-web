<?php

/**
 * Openstreetmap plugin.
 *
 * Makes possible to see contact location on openstreetmap
 */
class Pluginmaps extends Plugin {
	public function __construct() {
	}

	/**
	 * Function initializes the Plugin and registers all hooks.
	 */
	public function init() {
		$this->registerHook('server.core.settings.init.before');
		$this->registerHook('server.main.include.cssfiles');
		$this->registerHook('server.main.include.jsfiles');
	}

	/**
	 * Function is executed when a hook is triggered by the PluginManager.
	 *
	 * @param string $eventID the id of the triggered hook
	 * @param mixed  $data    object(s) related to the hook
	 */
	public function execute($eventID, &$data) {
		switch ($eventID) {
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
	 * Function includes the the files necessary for using
	 * leaflet.
	 *
	 *  @param $data
	 */
	public function addLeafletJsFile(&$data) {
		// make sure to load remote files only when plugin is enabled
		if ($GLOBALS['settings']->get('zarafa/v1/plugins/maps/enable') == true) {
			// removing https: provides protocols compatibility, especially in IE9
			$data['files'][] = 'plugins/maps/js/external/leaflet.js';
			$data['files'][] = 'plugins/maps/js/external/geocoder.js';
		}
	}

	/**
	 * Function includes the the files necessary for using
	 * leaflet.
	 *
	 *  @param $data
	 */
	public function addLeafletCssFile(&$data) {
		// make sure to load remote files only when plugin is enabled
		if ($GLOBALS['settings']->get('zarafa/v1/plugins/maps/enable') == true) {
			// removing https: provides protocols compatibility, especially in IE9
			$data['files'][] = 'plugins/maps/resources/css/leaflet.css';
			$data['files'][] = 'plugins/maps/resources/css/geocoder.css';
		}
	}

	/**
	 * Called when the core Settings class is initialized and ready to accept sysadmin default
	 * settings. Registers the sysadmin defaults for the Maps plugin.
	 *
	 * @param array $data Reference to the data of the triggered hook
	 */
	public function injectPluginSettings(&$data) {
		$data['settingsObj']->addSysAdminDefaults([
			'zarafa' => [
				'v1' => [
					'plugins' => [
						'maps' => [
							'enable' => PLUGIN_MAPS_USER_DEFAULT_ENABLE,
						],
					],
				],
			],
		]);
	}
}
