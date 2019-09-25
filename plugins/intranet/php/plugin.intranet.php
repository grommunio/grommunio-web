<?php
/**
 * intranet Plugin
 * Plugin which will enable desktop notifications for new mails
 */
class Pluginintranet extends Plugin {
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

		$defaultIcon = PATH_PLUGIN_DIR . '/intranet/resources/icons/icon_default.png';
		$pluginData = array(
			'enable' => PLUGIN_INTRANET_USER_DEFAULT_ENABLE,
			'button-title' => PLUGIN_INTRANET_BUTTON_TITLE,
			'url' => PLUGIN_INTRANET_URL,
			'autostart' => defined('PLUGIN_INTRANET_AUTOSTART') ? !!PLUGIN_INTRANET_AUTOSTART : false,
			'icon' => defined('PLUGIN_INTRANET_ICON') ? PATH_PLUGIN_DIR. '/intranet/' . PLUGIN_INTRANET_ICON : $defaultIcon
		);

		$i=1;
		while ( defined('PLUGIN_INTRANET_URL_'.$i) ){
			$pluginData['button-title-'.$i] = constant('PLUGIN_INTRANET_BUTTON_TITLE_'.$i);
			$pluginData['url-'.$i] = constant('PLUGIN_INTRANET_URL_'.$i);
			$pluginData['autostart-'.$i] = defined('PLUGIN_INTRANET_AUTOSTART_'.$i) ? !!constant('PLUGIN_INTRANET_AUTOSTART_'.$i) : false;
			$pluginData['icon-'.$i] = defined('PLUGIN_INTRANET_ICON_'.$i) ? PATH_PLUGIN_DIR . '/intranet/' .constant('PLUGIN_INTRANET_ICON_'.$i) : $defaultIcon;
			$i++;
		}

		$data['settingsObj']->addSysAdminDefaults(Array(
			'zarafa' => Array(
				'v1' => Array(
					'plugins' => Array(
						'intranet' => $pluginData
					)
				)
			)
		));
	}
}
?>
