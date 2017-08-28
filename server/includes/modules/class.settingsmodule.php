<?php
	/**
	* Settings Module
	*/
	class SettingsModule extends Module
	{
		/**
		* Constructor
		* @param int $id unique id.
		* @param array $data list of all actions.
		*/
		function __construct($id, $data)
		{
			parent::__construct($id, $data);
		}

		/**
		* Executes all the actions in the $data variable.
		* @return boolean true on success or false on fialure.
		*/
		function execute()
		{
			foreach($this->data as $actionType => $action)
			{
				if(isset($actionType)) {
					try {
						switch ($actionType) {
							case "retrieveAll":
								$this->retrieveAll($actionType);
								break;
							case "set":
								if ( isset($action["setting"]) ){
									$this->set($action["setting"], false);
								}
								if ( isset($action["persistentSetting"]) ){
									$this->set($action["persistentSetting"], true);
								}
								break;
							case "delete":
							case "reset":
								$this->delete($action["setting"]);
								break;
							default:
								$this->handleUnknownActionType($actionType);
						}
					} catch (SettingsException $e) {
						$this->processException($e, $actionType);
					} catch (MAPIException $e) {
						$this->processException($e, $actionType);
					}
				}
			}
		}

		/**
		 * Function will retrieve all settings stored in PR_EC_WEBACCESS_SETTINGS_JSON property
		 * if property is not defined then it will return generate SettingsException but silently ignores it.
		 */
		function retrieveAll($type)
		{
			$data = $GLOBALS['settings']->get();

			$this->addActionData($type, $data);
			$GLOBALS["bus"]->addData($this->getResponseData());
		}

		/**
		 * Function will set a value of a setting indicated by path of the setting.
		 *
		 * @param $settings object/array Object containing a $path and $value of the setting
		 * which must be modified.
		 * @param $persistent boolean If true the settings will be stored in the persistent settings
		 * as opposed to the normal settings
		 */
		function set($settings, $persistent=false)
		{
			if (isset($settings)) {
				// we will set the settings but wait with saving until the entire batch has been applied.
				if (is_array($settings)) {
					foreach ($settings as $setting) {
						if (isset($setting['path']) && isset($setting['value'])) {
							if ( !!$persistent ){
								$GLOBALS['settings']->setPersistent($setting['path'], $setting['value']);
							} else {
								$GLOBALS['settings']->set($setting['path'], $setting['value']);
							}
						}
					}
				} else if (isset($settings['path']) && isset($settings['value'])) {
					if ( !!$persistent ){
						$GLOBALS['settings']->setPersistent($settings['path'], $settings['value']);
					} else {
						$GLOBALS['settings']->set($settings['path'], $settings['value']);
					}
				}

				// Finally save the settings, this can throw exception when it fails saving settings
				if ( !!$persistent ){
					$GLOBALS['settings']->savePersistentSettings();
				} else {
					$GLOBALS['settings']->saveSettings();
				}

				// send success notification to client
				$this->sendFeedback(true);
			}
		}

		/**
		 * Function will delete a setting indicated by setting path.
		 *
		 * @param $path string/array path of the setting that needs to be deleted
		 */
		function delete($path)
		{
			if(isset($path)) {
				// we will delete the settings but wait with saving until the entire batch has been applied.
				if (is_array($path)) {
					foreach ($path as $item) {
						$GLOBALS['settings']->delete($item);
					}
				} else {
					$GLOBALS['settings']->delete($path);
				}

				// Finally save the settings, this can throw exception when it fails saving settings
				$GLOBALS['settings']->saveSettings();

				// send success notification to client
				$this->sendFeedback(true);
			}
		}
	}
?>
