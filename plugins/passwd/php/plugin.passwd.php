<?php

/**
 * Passwd plugin.
 *
 * Allows to change user password from grommunio Web.
 */
class Pluginpasswd extends Plugin {
	public function __construct() {}

	/**
	 * Function initializes the Plugin and registers all hooks.
	 */
	public function init() {
		$this->registerHook('server.core.settings.init.before');
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
		}
	}

	/**
	 * Called when the core Settings class is initialized and ready to accept sysadmin default
	 * settings. Registers the sysadmin defaults for the SugarCRM plugin.
	 *
	 * @param array $data Reference to the data of the triggered hook
	 */
	public function injectPluginSettings(&$data) {
		$data['settingsObj']->addSysAdminDefaults([
			'zarafa' => [
				'v1' => [
					'plugins' => [
						'passwd' => [
							'enable' => PLUGIN_PASSWD_USER_DEFAULT_ENABLE,
							'enable_strict_check' => PLUGIN_PASSWD_STRICT_CHECK_ENABLE,
						],
					],
				],
			],
		]);
	}
}
