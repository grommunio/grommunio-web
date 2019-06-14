<?php

	require_once(__DIR__ . '/../exceptions/class.DispatcherException.php');

	/**
	* On-demand module loader
	*
	* The dispatcher is simply a class instance factory, returning an instance of a class. If
	* the source was not loaded yet, then the specified file is loaded.
	*
	* @package core
	*/
	class Dispatcher
	{
		function __construct(){}
		
		/**
		 * Load a module with a specific name
		 *
		 * If required, loads the source for the module, then instantiates a module of that type
		 * with the specified id and initial data. The $id and $data parameters are directly
		 * forwarded to the module constructor. 
		 *
		 * Source is loaded from server/modules/class.$modulename.php
		 *
		 * @param string $moduleName The name of the module which should be loaded (eg 'hierarchymodule')
		 * @param integer $id Unique id number which represents this module
		 * @param array $data Array of data which is received from the client
		 * @return object Module object on success, false on failed
		 */
		function loadModule($moduleName, $id, $data)
		{
			$module = false;

			$path = BASE_PATH . 'server/includes/modules/class.' . $moduleName . '.php';
			if (is_file($path) === true) {
				require_once($path);
				$module = new $moduleName($id, $data);
			} else {
				$path = $GLOBALS['PluginManager']->getModuleFilePath($moduleName);
				if (is_file($path)) {
					require_once($path);
					$module = new $moduleName($id, $data);
				} else {
					throw new DispatcherException(sprintf(_("Unknown module '%s' with id '%s'"), $moduleName, $id), 0, null, _("Server encountered some problem, so it was not able to handle the request."));
				}
			}
			return $module;
		}

		/**
		 * Load a notifier with a specific name
		 *
		 * If required, loads the source for the notifier, then instantiates a notifier of that type.
		 *
		 * Source is loaded from server/notifiers/class.$notifiername.php
		 *
		 * @param string $notifierName The name of the module which should be loaded (eg 'hierarchynotifier')
		 * @return object Notifier object on success, false on failed
		 */
		function loadNotifier($notifierName)
		{
			$notifier = false;

			$path = BASE_PATH . 'server/includes/notifiers/class.' . $notifierName . '.php';
			if (is_file($path) === true) {
				require_once($path);
				$notifier = new $notifierName();
			} else {
				$path = $GLOBALS['PluginManager']->getNotifierFilePath($notifierName);

				if (is_file($path)) {
					require_once($path);
					$notifier = new $notifierName();
				} else {
					throw new DispatcherException(sprintf(_("Unknown notifier '%s'"), $notifierName), 0, null, _("Server encountered some problem, so it was not able to handle the request."));
				}
			}
			return $notifier;
		}
	}
?>
