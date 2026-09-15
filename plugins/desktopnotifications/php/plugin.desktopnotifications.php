<?php

/*
 * SPDX-FileCopyrightText: Copyright 2020 - 2026 grommunio GmbH
 * SPDX-FileCopyrightText: Copyright 2016 Kopano and its licensors
 * SPDX-FileCopyrightText: Copyright 2005 - 2016 Zarafa B.V. and its licensors
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

/**
 * desktopnotifications Plugin
 * Plugin which will enable desktop notifications for new mails.
 */
class Plugindesktopnotifications extends Plugin {
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
		$data['settingsObj']->addSysAdminDefaults([
			'grommunio' => [
				'v1' => [
					'plugins' => [
						'desktopnotifications' => [
							'enable' => PLUGIN_DESKTOPNOTIFICATION_USER_DEFAULT_ENABLE,
						],
					],
				],
			],
		]);
	}
}
