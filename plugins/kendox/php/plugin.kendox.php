<?php

/**
 * Kendox Plugin.
 *
 * Integrates Kendox into the grommunio environment.
 */
class Pluginkendox extends Plugin {
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
	 * settings. Registers the sysadmin defaults for the FILES plugin.
	 *
	 * @param array $data Reference to the data of the triggered hook
	 */
	public function injectPluginSettings(&$data) {
		$data['settingsObj']->addSysAdminDefaults([
			'zarafa' => [
				'v1' => [
					'plugins' => [
						'kendox' => [
							'enable' => PLUGIN_KENDOX_USER_DEFAULT_ENABLE,
							'max_attachments_number' => PLUGIN_KENDOX_MAX_ATTACHMENTS_NUMBER,
							'max_attachments_size_mb' => PLUGIN_KENDOX_MAX_ATTACHMENTS_SIZE_MB,
							'environment' => PLUGIN_KENDOX_ENVIRONMENT,
							'api_url' => PLUGIN_KENDOX_API_URL,
							'api_url_test' => PLUGIN_KENDOX_API_URL_TEST,
							'dialog_url' => PLUGIN_KENDOX_DIALOG_URL,
							'dialog_url_test' => PLUGIN_KENDOX_DIALOG_URL_TEST,
							'path' => PATH_PLUGIN_DIR . '/kendox',
						],
					],
				],
			],
		]);
	}
}
