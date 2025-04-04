<?php

/**
 * Chat Plugin
 * Plugin that adds Chat to grommunio Web.
 */
class PluginChat extends Plugin {
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
	 * settings. Registers the sysadmin defaults for the desktopnotifications plugin.
	 *
	 * @param array $data Reference to the data of the triggered hook
	 */
	public function injectPluginSettings(&$data) {
		$pluginData = [
			'enable' => PLUGIN_CHAT_USER_DEFAULT_ENABLE,
			'url' => PLUGIN_CHAT_URL,
			'autostart' => PLUGIN_CHAT_AUTOSTART,
		];

		$data['settingsObj']->addSysAdminDefaults([
			'zarafa' => [
				'v1' => [
					'plugins' => [
						'chat' => $pluginData,
					],
				],
			],
		]);
	}
}
