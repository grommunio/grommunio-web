<?php

/**
 * WebApp Manual Plugin
 *
 * Integrates references to the WebApp User Manual into the WebApp
 */
class Pluginwebappmanual extends Plugin {

	/**
	 * Constructor
	 */
	function Pluginwebappmanual() {}

	/**
	 * Function initializes the Plugin and registers all hooks
	 *
	 * @return void
	 */
	function init() {
		$this->registerHook('server.core.settings.init.before');
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
			case 'server.core.settings.init.before' :
				$this->injectPluginSettings($data);
				break;
		}
	}

	/**
	 * Called when the core Settings class is initialized and ready to accept sysadmin default
	 * settings. Registers the URL for the WebApp manual into the settings.
	 * @param Array $data Reference to the data of the triggered hook
	 */
	function injectPluginSettings(&$data) {
		$data['settingsObj']->addSysAdminDefaults(Array(
			'zarafa' => Array(
				'v1' => Array(
					'plugins' => Array(
						'webappmanual' => Array(
							'url' => PLUGIN_WEBAPPMANUAL_URL,
							'enable' => PLUGIN_WEBAPPMANUAL_USER_DEFAULT_ENABLE
						)
					)
				)
			)
		));
	}
}
?>
