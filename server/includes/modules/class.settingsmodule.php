<?php

/**
 * Settings Module.
 */
class SettingsModule extends Module {
	/**
	 * Constructor.
	 *
	 * @param int   $id   unique id
	 * @param array $data list of all actions
	 */
	public function __construct($id, $data) {
		parent::__construct($id, $data);
	}

	/**
	 * Executes all the actions in the $data variable.
	 *
	 * All setting mutations (set, delete, reset) are applied first and
	 * then flushed to the MAPI store in a single saveSettings() /
	 * savePersistentSettings() call at the end, avoiding redundant
	 * MAPI round-trips when multiple action types arrive in the same
	 * HTTP request (e.g. a batched delete + set).
	 */
	#[Override]
	public function execute() {
		$needsSave = false;
		$needsPersistentSave = false;

		foreach ($this->data as $actionType => $action) {
			if (isset($actionType)) {
				try {
					switch ($actionType) {
						case "retrieveAll":
							$this->retrieveAll($actionType);
							break;

						case "set":
							if (isset($action["setting"])) {
								$this->set($action["setting"], false, false);
								$needsSave = true;
							}
							if (isset($action["persistentSetting"])) {
								$this->set($action["persistentSetting"], true, false);
								$needsPersistentSave = true;
							}
							break;

						case "delete":
						case "reset":
							$userStore = $GLOBALS['mapisession']->getDefaultMessageStore();
							$inbox = mapi_msgstore_getreceivefolder($userStore);
							mapi_deleteprops($inbox, [PR_ADDITIONAL_REN_ENTRYIDS_EX, PR_ADDITIONAL_REN_ENTRYIDS]);
							$this->delete($action["setting"], false);
							$needsSave = true;
							break;

						default:
							$this->handleUnknownActionType($actionType);
					}
				}
				catch (MAPIException|SettingsException $e) {
					$this->processException($e, $actionType);
				}
			}
		}

		// Flush all accumulated mutations to the MAPI store in one go.
		if ($needsSave) {
			$GLOBALS['settings']->saveSettings();
		}
		if ($needsPersistentSave) {
			$GLOBALS['settings']->savePersistentSettings();
		}
	}

	/**
	 * Function will retrieve all settings stored in PR_EC_WEBACCESS_SETTINGS_JSON property
	 * if property is not defined then it will return generate SettingsException but silently ignores it.
	 *
	 * @param mixed $type
	 */
	public function retrieveAll($type) {
		$data = $GLOBALS['settings']->get();

		$this->addActionData($type, $data);
		$GLOBALS["bus"]->addData($this->getResponseData());
	}

	/**
	 * Function will set a value of a setting indicated by path of the setting.
	 *
	 * @param mixed $settings   Object containing a $path and $value of the setting
	 *                          which must be modified
	 * @param bool  $persistent If true the settings will be stored in the persistent settings
	 *                          as opposed to the normal settings
	 * @param bool  $save       If true the settings will be saved to the MAPI store
	 *                          immediately.  Pass false to defer saving (caller is
	 *                          responsible for calling saveSettings()).
	 */
	public function set($settings, $persistent = false, $save = true) {
		if (isset($settings)) {
			// we will set the settings but wait with saving until the entire batch has been applied.
			if (is_array($settings)) {
				foreach ($settings as $setting) {
					if (isset($setting['path'], $setting['value'])) {
						if ((bool) $persistent) {
							$GLOBALS['settings']->setPersistent($setting['path'], $setting['value']);
						}
						else {
							$GLOBALS['settings']->set($setting['path'], $setting['value']);
						}
					}
				}
			}
			elseif (isset($settings['path'], $settings['value'])) {
				if ((bool) $persistent) {
					$GLOBALS['settings']->setPersistent($settings['path'], $settings['value']);
				}
				else {
					$GLOBALS['settings']->set($settings['path'], $settings['value']);
				}
			}

			if ($save) {
				// Save the settings to the MAPI store.
				if ((bool) $persistent) {
					$GLOBALS['settings']->savePersistentSettings();
				}
				else {
					$GLOBALS['settings']->saveSettings();
				}
			}

			// send success notification to client
			$this->sendFeedback(true);
		}
	}

	/**
	 * Function will delete a setting indicated by setting path.
	 *
	 * @param $path string/array path of the setting that needs to be deleted
	 * @param bool $save If true the settings will be saved to the MAPI store
	 *                   immediately.  Pass false to defer saving.
	 */
	public function delete($path, $save = true) {
		if (isset($path)) {
			// we will delete the settings but wait with saving until the entire batch has been applied.
			if (is_array($path)) {
				foreach ($path as $item) {
					$GLOBALS['settings']->delete($item);
				}
			}
			else {
				$GLOBALS['settings']->delete($path);
			}

			if ($save) {
				// Save the settings to the MAPI store.
				$GLOBALS['settings']->saveSettings();
			}

			// send success notification to client
			$this->sendFeedback(true);
		}
	}
}
