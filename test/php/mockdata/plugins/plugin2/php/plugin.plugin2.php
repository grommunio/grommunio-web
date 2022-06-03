<?php

class PluginPlugin2 extends Plugin {
	/**
	 * Called to initialize the plugin and register for hooks.
	 */
	public function init() {
		$this->registerHook('server.core.settings.init.before');
	}

	/**
	 * @param string $eventID Identifier of the hook
	 * @param array  $data    Reference to the data of the triggered hook
	 */
	public function execute($eventID, &$data) {
		switch ($eventID) {
			case 'server.core.settings.init.before':
				$this->onBeforeSettingsInit($data);
				break;
		}
	}

	/**
	 * Called when the core Settings class is initialized and ready to accept sysadmin default
	 * settings.
	 *
	 * @param array $data Reference to the data of the triggered hook
	 */
	public function onBeforeSettingsInit(&$data) {
		$data['settingsObj']->addSysAdminDefaults([
			'zarafa' => [
				'v1' => [
					'plugins' => [
						'statslogging' => [
							'enable' => true,
						],
					],
				],
			],
		]);
	}
}
