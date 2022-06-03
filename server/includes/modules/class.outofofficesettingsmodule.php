<?php

	/**
	 * OutOfOfficeSettingsModule Module.
	 */
	class OutOfOfficeSettingsModule extends Module {
		/**
		 * Constructor.
		 *
		 * @param int   $id   unique id
		 * @param array $data list of all actions
		 */
		public function __construct($id, $data) {
			parent::__construct($id, $data);

			$this->properties = $GLOBALS["properties"]->getOutOfOfficeProperties();
		}

		/**
		 * Executes all the actions in the $data variable.
		 */
		public function execute() {
			foreach ($this->data as $actionType => $action) {
				if (isset($actionType)) {
					try {
						switch ($actionType) {
							case "list" :
								$this->getOofSettings();
								break;

							case "save" :
								$this->saveOofSettings($action);
								break;

							default:
								$this->handleUnknownActionType($actionType);
						}
					}
					catch (SettingsException $e) {
						$this->processException($e, $actionType);
					}
					catch (MAPIException $e) {
						$this->processException($e, $actionType);
					}
				}
			}
		}

		/**
		 * Read 'out of office' settings from PR_EC_OUTOFOFFICE_*.
		 *
		 * Internal function to retrieve the 'out of office' settings from the store, these settings are normal properties on the store
		 */
		public function getOofSettings() {
			$otherStores = $this->getOwnerPermissionStores();
			array_unshift($otherStores, $GLOBALS['mapisession']->getDefaultMessageStore());

			$oofSettings = [];
			foreach ($otherStores as $storeEntryId => $storeObj) {
				$props = mapi_getprops($storeObj, $this->properties);
				if (!isset($props[PR_EC_OUTOFOFFICE_STATE])) {
					$props[PR_EC_OUTOFOFFICE_STATE] = false;
				}
				if (!isset($props[PR_EC_OUTOFOFFICE_INTERNALREPLY])) {
					$props[PR_EC_OUTOFOFFICE_INTERNALREPLY] = '';
				}
				if (!isset($props[PR_EC_OUTOFOFFICE_INTERNALSUBJECT])) {
					$props[PR_EC_OUTOFOFFICE_INTERNALSUBJECT] = '';
				}
				if (!isset($props[PR_EC_OUTOFOFFICE_BEGIN])) {
					$props[PR_EC_OUTOFOFFICE_BEGIN] = 0;
				}
				if (!isset($props[PR_EC_OUTOFOFFICE_END]) || $props[PR_EC_OUTOFOFFICE_END] === FUTURE_ENDDATE) {
					$props[PR_EC_OUTOFOFFICE_END] = 0;
				}
				if (!isset($props[PR_EC_OUTOFOFFICE_ALLOWEXTERNAL])) {
					$props[PR_EC_OUTOFOFFICE_ALLOWEXTERNAL] = 0;
				}
				if (!isset($props[PR_EC_OUTOFOFFICE_EXTERNALAUDIENCE])) {
					$props[PR_EC_OUTOFOFFICE_EXTERNALAUDIENCE] = 0;
				}
				if (!isset($props[PR_EC_OUTOFOFFICE_EXTERNALREPLY])) {
					$props[PR_EC_OUTOFOFFICE_EXTERNALREPLY] = '';
				}
				if (!isset($props[PR_EC_OUTOFOFFICE_EXTERNALSUBJECT])) {
					$props[PR_EC_OUTOFOFFICE_EXTERNALSUBJECT] = '';
				}

				$externalProps['props']['entryid'] = bin2hex($props[PR_MAILBOX_OWNER_ENTRYID]);
				$externalProps['props']['store_entryid'] = bin2hex($props[PR_ENTRYID]);
				$externalProps['props']['set'] = $props[PR_EC_OUTOFOFFICE_STATE];
				$externalProps['props']['internal_reply'] = trim($props[PR_EC_OUTOFOFFICE_INTERNALREPLY]);
				$externalProps['props']['internal_subject'] = trim($props[PR_EC_OUTOFOFFICE_INTERNALSUBJECT]);
				$externalProps['props']['from'] = $props[PR_EC_OUTOFOFFICE_BEGIN];
				$externalProps['props']['until'] = $props[PR_EC_OUTOFOFFICE_END];
				$externalProps['props']['allow_external'] = $props[PR_EC_OUTOFOFFICE_ALLOWEXTERNAL];
				$externalProps['props']['external_audience'] = $props[PR_EC_OUTOFOFFICE_EXTERNALAUDIENCE];
				$externalProps['props']['external_reply'] = trim($props[PR_EC_OUTOFOFFICE_EXTERNALREPLY]);
				$externalProps['props']['external_subject'] = trim($props[PR_EC_OUTOFOFFICE_EXTERNALSUBJECT]);

				array_push($oofSettings, $externalProps);
			}

			// Send success message to client
			$this->addActionData('list', ['item' => $oofSettings]);

			$GLOBALS["bus"]->addData($this->getResponseData());
		}

		/**
		 * Function returns array of user stores who has given 'Owner' permission to logged in user.
		 * Internal function to retrieve the shared stores with 'owner' permission.
		 *
		 * @return {Array} array of user stores who has given 'owner' permission
		 */
		public function getOwnerPermissionStores() {
			$stores = $GLOBALS['mapisession']->getOtherUserStore();

			// $sharedOwnerStores array will contains store of users who has given 'owner' permission.
			// Or store of users which can be fully accessible by default user in case of 'Admin User'.
			$sharedOwnerStores = [];

			foreach ($stores as $storeEntryId => $storeObj) {
				$subTree = mapi_getprops($storeObj, [PR_IPM_SUBTREE_ENTRYID]);

				try {
					$subtreeObj = mapi_msgstore_openentry($storeObj, $subTree[PR_IPM_SUBTREE_ENTRYID]);
				}
				catch (MAPIException $e) {
					// we don't have rights to open folder, so don't include User's store.
					if ($e->getCode() === MAPI_E_NO_ACCESS) {
						continue;
					}
					// rethrow other errors
					throw $e;
				}

				$permission = mapi_getprops($subtreeObj, [PR_RIGHTS]);
				$hasSufficientPermission = $permission[PR_RIGHTS] & ecRightsSecretary === ecRightsSecretary;

				// If User store's IPM subtree has rights higher than 'secretary' then include that User's store.
				if ($hasSufficientPermission) {
					$sharedOwnerStores[$storeEntryId] = $storeObj;
				}
			}

			return $sharedOwnerStores;
		}

		/**
		 * Internal function to save the 'out of office' settings to the correct properties on the store.
		 * On success function will send 'success' feedback to user.
		 *
		 * Writes some properties to the PR_EC_OUTOFOFFICE_* properties
		 *
		 * @param array $action the action data, sent by the client
		 */
		public function saveOofSettings($action) {
			$storeEntryId = $action['store_entryid'];
			$oofSettings = $action['props'];
			$store = $GLOBALS['mapisession']->openMessageStore(hex2bin($storeEntryId));
			$props = Conversion::mapXML2MAPI($this->properties, $oofSettings);

			// If client sent until value as 0 or User set OOF to true but don't set until
			// then save FUTURE_ENDDATE as until date. Also when OOF is already ON and User
			// don't change 'until' field then check if 'until' value is available in User's store
			// and if not then set until date to FUTURE_ENDDATE.
			// Note: If we remove PR_EC_OUTOFOFFICE_END property from User's store,
			// then gromox is setting past value "1970-01-01 00:00:00" as until date.
			// To avoid this issue and for OOF to work as expected, we are setting until date as FUTURE_ENDDATE.
			if (isset($oofSettings['until']) && $oofSettings['until'] === 0 ||
				!isset($oofSettings['until']) && isset($oofSettings['set'])) {
				$props[$this->properties['until']] = FUTURE_ENDDATE;
			}
			elseif (!isset($oofSettings['until'], $oofSettings['set'])) {
				$untilProp = mapi_getprops($store, [PR_EC_OUTOFOFFICE_END]);
				if (!isset($untilProp[PR_EC_OUTOFOFFICE_END]) || $untilProp[PR_EC_OUTOFOFFICE_END] === 0) {
					$props[$this->properties['until']] = FUTURE_ENDDATE;
				}
			}

			if (!empty($props)) {
				mapi_setprops($store, $props);
				mapi_savechanges($store);
			}
			$this->sendFeedback(true);
		}
	}
