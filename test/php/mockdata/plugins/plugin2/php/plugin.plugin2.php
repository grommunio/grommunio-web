<?php

class PluginPlugin2 extends Plugin {
	/**
	 * Called to initialize the plugin and register for hooks.
	 */
	function init(){
		$this->registerHook('server.core.settings.init.before');
	}

	/**
	 *
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
	 * settings.
	 * @param Array $data Reference to the data of the triggered hook
	 */
	function onBeforeSettingsInit(&$data){
		$data['settingsObj']->addSysAdminDefaults(Array(
			'zarafa' => Array(
				'v1' => Array(
					'plugins' => Array(
						'statslogging' => Array(
							'enable' => True,
						)
					)
				)
			)
		));
	}
}
?>
