<?php
/**
* Handles plugin registration.
*/
class PluginMDM extends Plugin {

	/**
	 * Called to initialize the plugin and register for hooks.
	 */
	function init(){
		$this->registerHook('server.core.settings.init.before');
	}

	/**
	 * Function is executed when a hook is triggered by the PluginManager
	 * @param String $eventID Identifier of the hook
	 * @param Array $data Reference to the data of the triggered hook
	 */
	function execute($eventID, &$data){
		switch($eventID){
			case 'server.core.settings.init.before':
				$this->onBeforeSettingsInit($data);
				break;
		}
	}

	/**
	 * Called when the core Settings class is initialized and ready to accept sysadmin default
	 * settings. Registers the sysadmin defaults for the StatsLogging plugin.
	 * @param Array $data Reference to the data of the triggered hook
	 */
	function onBeforeSettingsInit(&$data){
		$data['settingsObj']->addSysAdminDefaults(Array(
			'zarafa' => Array(
				'v1' => Array(
					'plugins' => Array(
						'mdm' => Array(
							'enable' => PLUGIN_MDM_USER_DEFAULT_ENABLE_MDM,
						)
					)
				)
			)
		));
	}
}
?>