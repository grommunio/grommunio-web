<?php

require_once __DIR__ . "/Files/Core/class.downloadhandler.php";
require_once __DIR__ . "/Files/Core/class.uploadhandler.php";
require_once __DIR__ . "/Files/Core/class.recipienthandler.php";
require_once __DIR__ . "/Files/Backend/class.backendstore.php";

use Files\Backend\BackendStore;
use Files\Core\DownloadHandler;
use Files\Core\RecipientHandler;
use Files\Core\UploadHandler;

define("FILES_FOLDER", 0);
define("FILES_FILE", 1);
define("FILES_STORE", 2);

define('ICON_HOME_FOLDER', 0x00001501);
define('ICON_FOLDER', 0x00001502);
define('ICON_FILES', 0x00001506);

/**
 * Files Plugin.
 *
 * Integrates Files into the grommunio environment.
 */
class Pluginfiles extends Plugin {
	/**
	 * Function initializes the Plugin and registers all hooks.
	 */
	public function init() {
		$this->registerHook('server.core.settings.init.before');
		$this->registerHook('server.index.load.custom');
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

			case 'server.index.load.custom':
				switch ($data['name']) {
					case 'files_get_recipients':
						RecipientHandler::doGetRecipients();
						break;

					case 'download_file':
						DownloadHandler::doDownload();
						break;

					case 'upload_file':
						UploadHandler::doUpload();
						break;

					case 'form':
						if (isset($_GET['backend'])) {
							$backend = urldecode((string) $_GET["backend"]);
						}
						else {
							$backend = '';
						}
						$backendstore = BackendStore::getInstance();

						if ($backendstore->backendExists($backend)) {
							try {
								$backendInstance = $backendstore->getInstanceOfBackend($backend);
								$formdata = $backendInstance->getFormConfig();
							}
							catch (Throwable $t) {
								error_log('[Files][Form] ' . $t->getMessage());
								$formdata = json_encode(['success' => false, 'message' => 'Unable to load backend form']);
							}

							exit($formdata);
						}

						exit("Specified backend does not exist!");

						break;
				}
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
					'main' => [
						'notifier' => [
							'info' => [
								'files' => [
									'value' => "dropdown",
								],
							],
						],
					],
					'contexts' => [
						'files' => [
							'ask_before_delete' => PLUGIN_FILES_ASK_BEFORE_DELETE,
							'webapp_tmp' => TMP_PATH,
						],
					],
					'plugins' => [
						'files' => [
							'enable' => PLUGIN_FILES_USER_DEFAULT_ENABLE,
							'onlyoffice_enabled' => PLUGIN_FILES_ONLYOFFICE_ENABLE,
							'onlyoffice_filetypes' => PLUGIN_FILES_ONLYOFFICE_FILETYPES,
						],
					],
				],
			],
		]);
	}
}
