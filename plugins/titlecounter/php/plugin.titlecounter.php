<?php
/**
 * titlecounter Plugin
 *
 * Plugin will update the title of a tab and browser window.
 *
 */
class Plugintitlecounter extends Plugin {

	/**
	 * Constructor
	 */
	function Plugintitlecounter() {
	}

	/**
	 * Function initializes the Plugin and registers all hooks
	 */
	function init() {
		$this->registerHook('server.core.settings.init.before');
	}

	/**
	 * Function is executed when a hook is triggered by the PluginManager
	 *
	 * @param string $eventID the id of the triggered hook
	 * @param mixed $data object(s) related to the hook
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
	 * settings. Registers the sysadmin defaults for the testcompatibility plugin.
	 * @param Array $data Reference to the data of the triggered hook
	 */
	function injectPluginSettings(&$data) {
		$data['settingsObj']->addSysAdminDefaults(Array(
			'zarafa' => Array(
				'v1' => Array(
					'plugins' => Array(
						'titlecounter' => Array(
							'enable' => PLUGIN_TITLECOUNTER_USER_DEFAULT_ENABLE
						)
					)
				)
			)
		));
	}
}
?>
