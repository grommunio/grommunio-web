<?php
/**
 * intranet Plugin
 * Plugin which will enable desktop notifications for new mails.
 */
class Pluginintranet extends Plugin {
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
		$defaultIcon = 'data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIyNCIgaGVpZ2h0PSIyNCIgZmlsbD0ibm9uZSI+PHBhdGggZmlsbD0iIzIxMjEyMSIgZD0iTTEyIDEuOTk5YzUuNTI0IDAgMTAuMDAyIDQuNDc4IDEwLjAwMiAxMC4wMDIgMCA1LjUyMy00LjQ3OCAxMC4wMDEtMTAuMDAyIDEwLjAwMS01LjUyNCAwLTEwLjAwMi00LjQ3OC0xMC4wMDItMTAuMDAxQzEuOTk4IDYuNDc3IDYuNDc2IDEuOTk5IDEyIDEuOTk5Wk0xNC45MzkgMTYuNUg5LjA2Yy42NTIgMi40MTQgMS43ODYgNC4wMDIgMi45MzkgNC4wMDJzMi4yODctMS41ODggMi45MzktNC4wMDJabS03LjQzIDBINC43ODVhOC41MzIgOC41MzIgMCAwIDAgNC4wOTQgMy40MTFjLS41MjItLjgyLS45NTMtMS44NDYtMS4yNy0zLjAxNWwtLjEwMi0uMzk1Wm0xMS43MDUgMGgtMi43MjJjLS4zMjQgMS4zMzUtLjc5MiAyLjUtMS4zNzMgMy40MTFhOC41MjggOC41MjggMCAwIDAgMy45MS0zLjEyN2wuMTg1LS4yODNaTTcuMDk0IDEwSDMuNzM1bC0uMDA1LjAxN2E4LjUyNSA4LjUyNSAwIDAgMC0uMjMzIDEuOTg0YzAgMS4wNTYuMTkzIDIuMDY3LjU0NSAzaDMuMTczYTIwLjg0NyAyMC44NDcgMCAwIDEtLjEyMy01Wm04LjMwMyAwSDguNjAzYTE4Ljk2NiAxOC45NjYgMCAwIDAgLjEzNSA1aDYuNTI0YTE4Ljk3NCAxOC45NzQgMCAwIDAgLjEzNS01Wm00Ljg2OCAwaC0zLjM1OGMuMDYyLjY0Ny4wOTUgMS4zMTcuMDk1IDJhMjAuMyAyMC4zIDAgMCAxLS4yMTggM2gzLjE3M2E4LjQ4MiA4LjQ4MiAwIDAgMCAuNTQ0LTNjMC0uNjg5LS4wODItMS4zNi0uMjM2LTJaTTguODggNC4wOWwtLjAyMy4wMDhBOC41MzEgOC41MzEgMCAwIDAgNC4yNSA4LjVoMy4wNDhjLjMxNC0xLjc1Mi44Ni0zLjI3OCAxLjU4My00LjQxWk0xMiAzLjQ5OWwtLjExNi4wMDVDMTAuNjIgMy42MiA5LjM5NiA1LjYyMiA4LjgzIDguNWg2LjM0MmMtLjU2Ni0yLjg3LTEuNzgzLTQuODY5LTMuMDQ1LTQuOTk1TDEyIDMuNVptMy4xMi41OS4xMDcuMTc1Yy42NjkgMS4xMTIgMS4xNzcgMi41NzIgMS40NzUgNC4yMzdoMy4wNDhhOC41MzMgOC41MzMgMCAwIDAtNC4zMzktNC4yOWwtLjI5MS0uMTIxWiIvPjwvc3ZnPg==';
		$pluginData = [
			'enable' => PLUGIN_INTRANET_USER_DEFAULT_ENABLE,
			'button-title' => PLUGIN_INTRANET_BUTTON_TITLE,
			'url' => PLUGIN_INTRANET_URL,
			'autostart' => defined('PLUGIN_INTRANET_AUTOSTART') ? (bool) PLUGIN_INTRANET_AUTOSTART : false,
			'icon' => defined('PLUGIN_INTRANET_ICON') ? PATH_PLUGIN_DIR . '/intranet/' . PLUGIN_INTRANET_ICON : $defaultIcon,
		];

		$i = 1;
		while (defined('PLUGIN_INTRANET_URL_' . $i)) {
			$pluginData['button-title-' . $i] = constant('PLUGIN_INTRANET_BUTTON_TITLE_' . $i);
			$pluginData['url-' . $i] = constant('PLUGIN_INTRANET_URL_' . $i);
			$pluginData['autostart-' . $i] = defined('PLUGIN_INTRANET_AUTOSTART_' . $i) ? (bool) constant('PLUGIN_INTRANET_AUTOSTART_' . $i) : false;
			$pluginData['icon-' . $i] = defined('PLUGIN_INTRANET_ICON_' . $i) ? PATH_PLUGIN_DIR . '/intranet/' . constant('PLUGIN_INTRANET_ICON_' . $i) : $defaultIcon;
			++$i;
		}

		$data['settingsObj']->addSysAdminDefaults([
			'zarafa' => [
				'v1' => [
					'plugins' => [
						'intranet' => $pluginData,
					],
				],
			],
		]);
	}
}
