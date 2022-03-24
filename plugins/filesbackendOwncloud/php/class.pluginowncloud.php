<?php

/**
 * Files Plugin - Owncloud backend
 *
 * This plugin provides the backend for Owncloud and OCS.
 */
class PluginFilesbackendOwncloud extends Plugin
{

	/**
	 * Constructor
	 */
	function __construct()
	{
	}

	/**
	 * Called to initialize the plugin and register for hooks.
	 *
	 * @return void
	 */
	function init()
	{
		$this->registerHook('server.core.settings.init.before');
	}

	/**
	 * Function is executed when a hook is triggered by the PluginManager
	 *
	 * @param String $eventID Identifier of the hook
	 * @param Array $data Reference to the data of the triggered hook
	 */
	function execute($eventID, &$data)
	{
		switch ($eventID) {
			case 'server.core.settings.init.before':
				$this->onBeforeSettingsInit($data);
				break;
		}
	}

	/**
	 * Called when the core Settings class is initialized and ready to accept sysadmin default
	 * settings. Registers the sysadmin defaults for the filesbackendOwncloud plugin.
	 *
	 * @param Array $data Reference to the data of the triggered hook
	 * @return void
	 */
	function onBeforeSettingsInit(&$data)
	{
		$data['settingsObj']->addSysAdminDefaults(Array(
			'zarafa' => Array(
				'v1' => Array(
					'plugins' => Array(
						'filesbackendOwncloud' => Array(
							'enable' => true,
						)
					)
				)
			)
		));
	}
}

?>
