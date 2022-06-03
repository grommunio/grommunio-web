<?php

class Pluginmeet extends Plugin {
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
		if ($eventID == 'server.core.settings.init.before') {
			$this->injectPluginSettings($data);
		}
	}

	/**
	 * Called when the core Settings class is initialized and ready to accept sysadmin default
	 * settings.
	 *
	 * @param array $data Reference to the data of the triggered hook
	 */
	public function injectPluginSettings(&$data) {
		if (defined('MEET_DEFAULTS') && is_array(MEET_DEFAULTS)) {
			$data['settingsObj']->addSysAdminDefaults(
				[
					'zarafa' => [
						'v1' => [
							'plugins' => [
								'meet' => MEET_DEFAULTS,
							],
						],
					],
				]
			);
		}
	}
}
