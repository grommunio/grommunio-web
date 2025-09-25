<?php declare(strict_types=1);

/**
 * Files Plugin - Seafile backend
 *
 * This plugin provides the backend for Seafile.
 */
final class PluginFilesbackendSeafile extends Plugin
{

    /**
	 * Called to initialize the plugin and register for hooks.
	 *
	 * @return void
	 */
	public function init()
	{
		$this->registerHook('server.core.settings.init.before');
	}

	/**
	 * Function is executed when a hook is triggered by the PluginManager
	 *
	 * @param String $eventID Identifier of the hook
	 * @param Array $data Reference to the data of the triggered hook
	 */
	public function execute($eventID, &$data)
	{
		switch ($eventID) {
			case 'server.core.settings.init.before':
				$this->onBeforeSettingsInit($data);
				break;
            default:
		}
	}

	/**
	 * Called when the core Settings class is initialized and ready to accept sysadmin default
	 * settings. Registers the sysadmin defaults for the filesbackendSeafile plugin.
	 *
	 * @param Array $data Reference to the data of the triggered hook
	 * @return void
	 */
	public function onBeforeSettingsInit(&$data)
	{
		$data['settingsObj']->addSysAdminDefaults(array(
			'zarafa' => array(
				'v1' => array(
					'plugins' => array(
						'filesbackendSeafile' => array(
							'enable' => true,
						)
					)
				)
			)
		));
	}
}
