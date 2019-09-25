<?php

/**
 * fileviewer plugin
 *
 * For opening PDF and ODF attachments in e-mails.
 */

class Pluginfilepreviewer extends Plugin {
	/**
	 * Function initializes the Plugin and registers all hooks
	 *
	 * @return void
	 */
	function init() {
		$this->registerHook('server.core.settings.init.before');
	}

	/**
	 * Function is executed when a hook is triggered by the PluginManager
	 *
	 * @param string $eventID the id of the triggered hook
	 * @param mixed $data object(s) related to the hook
	 * @return void
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
	 * settings. Registers the sysadmin defaults for the pdfbox plugin.
	 * @param Array $data Reference to the data of the triggered hook
	 */
	function injectPluginSettings(&$data) {
		$data['settingsObj']->addSysAdminDefaults(Array(
			'zarafa' => Array(
				'v1' => Array(
					'plugins' => Array(
						'filepreviewer' => Array(
							'enable' => PLUGIN_FILEPREVIEWER_USER_DEFAULT_ENABLE,
							'config_pdf_default_zoom' => PLUGIN_FILEPREVIEWER_PDF_DEFAULT_ZOOM,
							'config_odf_default_zoom' => PLUGIN_FILEPREVIEWER_ODF_DEFAULT_ZOOM,
							// WebApp unfortunately does not have the path to the plugins at the client side,
							// so we will pass it ourselves through the settings
							'path' => PATH_PLUGIN_DIR . '/filepreviewer',
						)
					)
				)
			)
		));
	}
}
