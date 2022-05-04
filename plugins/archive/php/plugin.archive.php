<?php
/**
 * Archive Plugin
 * Plugin which will enable desktop notifications for new mails
 */
class PluginArchive extends Plugin {
	/**
	 * Function initializes the Plugin and registers all hooks
	 */
	function init() {
		$this->registerHook('server.core.settings.init.before');
	}

	/**
	 * Function is executed when a hook is triggered by the PluginManager
	 *
	 * @param string $eventID the id of the triggered hook
	 * @param mixed $data object(s) related to the hook
	 */
	function execute($eventID, &$data) {
		switch($eventID) {
			case 'server.core.settings.init.before' :
				$this->injectPluginSettings($data);
				break;
		}
	}


	/**
	 * Called when the core Settings class is initialized and ready to accept sysadmin default
	 * settings. Registers the sysadmin defaults for the desktopnotifications plugin.
	 * @param Array $data Reference to the data of the triggered hook
	 */
	function injectPluginSettings(&$data) {

		$defaultIcon = 'data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIxNiIgaGVpZ2h0PSIxNiI+PHBhdGggZmlsbD0ibm9uZSIgc3Ryb2tlPSIjMDAwIiBzdHJva2Utd2lkdGg9IjYuMDA5IiBzdHJva2UtbGluZWpvaW49InJvdW5kIiBzdHJva2UtbWl0ZXJsaW1pdD0iMi42MTMxIiBkPSJNNC4yMTMgMy4wMDVjLS4zMjggMC0uNjE0LjEwMy0uODQuMzQ4LS4yNDYuMjQ2LS4zNjguNTMyLS4zNjguODR2MjguNDQ2YzAgLjMwOC4xMjIuNTczLjM2OC43NzguMjI2LjIwNS41MTIuMzA4Ljg0LjMwOGgxMjAuNDYzYy4zMjggMCAuNjE0LS4xMDMuODQtLjMwOC4yNDYtLjIwNS4zNjgtLjQ3MS4zNjgtLjc3OFY0LjE5MmMwLS4zMDgtLjEyMi0uNTk0LS4zNjgtLjg0LS4yMjYtLjI0NS0uNTEyLS4zNDgtLjg0LS4zNDhINC4yMTN2LjAwMXptNiAzMC43OTNjLS4yMzUgMC0uNDcxLjEwMy0uNjc1LjMwNy0uMTg1LjIwNS0uMjg3LjQ0LS4yODcuNjU2djc3LjQ0MmMwIC4yMTYuMTAzLjQ1MS4yODcuNjU1YS45MS45MSAwIDAgMCAuNjc1LjI4N2gxMDguNDYyYS45MS45MSAwIDAgMCAuNjc2LS4yODdjLjE4NS0uMjA0LjI4Ny0uNDMuMjg3LS42NTVWMzQuNzYxYzAtLjIyNi0uMTAzLS40NTEtLjI4Ny0uNjU2LS4yMDQtLjIwNC0uNDM5LS4zMDctLjY3Ni0uMzA3SDEwLjIxM2gwem0zNy43ODYgMTguNDNIODAuODljMS43NjIgMCAzLjI1Ny42MTQgNC40ODUgMS44NDQgMS4yNDkgMS4yNDkgMS44NjMgMi43NDQgMS44NjMgNC41MDVoMGMwIDEuNzYxLS42MTQgMy4yNzctMS44NjMgNC41NjctMS4yMjkgMS4yNy0yLjcyNSAxLjkyNS00LjQ4NSAxLjkyNUg0Ny45OTljLTEuNzYxIDAtMy4yNTctLjY1NS00LjQ4NS0xLjkyNS0xLjI0OS0xLjI5LTEuODYzLTIuODA3LTEuODYzLTQuNTY3aDBjMC0xLjc2MS42MTQtMy4yNTYgMS44NjMtNC41MDUgMS4yMjgtMS4yMyAyLjcyMy0xLjg0NCA0LjQ4NS0xLjg0NGgweiIgZmlsbD0iIzZkNmQ3MCIvPjwvc3ZnPgo=';
		$pluginData = array(
			'enable' => PLUGIN_ARCHIVE_USER_DEFAULT_ENABLE,
			'button-title' => _('Archive'),
			'url' => PLUGIN_ARCHIVE_URL,
			'autostart' => defined('PLUGIN_ARCHIVE_AUTOSTART') ? !!PLUGIN_ARCHIVE_AUTOSTART : false,
			'icon' => $defaultIcon
		);

		$data['settingsObj']->addSysAdminDefaults(Array(
			'zarafa' => Array(
				'v1' => Array(
					'plugins' => Array(
						'archive' => $pluginData
					)
				)
			)
		));
	}
}
?>
