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
	#[Override]
	public function execute() {
		foreach ($this->data as $actionType => $action) {
			if (isset($actionType)) {
				try {
					match ($actionType) {
						"list" => $this->getOofSettings(),
						"save" => $this->saveOofSettings($action),
						default => $this->handleUnknownActionType($actionType),
					};
				}
				catch (MAPIException|SettingsException $e) {
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
			if (!isset($props[PR_EC_OUTOFOFFICE])) {
				$props[PR_EC_OUTOFOFFICE] = false;
			}
			if (!isset($props[PR_EC_OUTOFOFFICE_MSG])) {
				$props[PR_EC_OUTOFOFFICE_MSG] = '';
			}
			if (!isset($props[PR_EC_OUTOFOFFICE_SUBJECT])) {
				$props[PR_EC_OUTOFOFFICE_SUBJECT] = '';
			}
			if (!isset($props[PR_EC_OUTOFOFFICE_FROM])) {
				$props[PR_EC_OUTOFOFFICE_FROM] = 0;
			}
			if (!isset($props[PR_EC_OUTOFOFFICE_UNTIL]) || $props[PR_EC_OUTOFOFFICE_UNTIL] === FUTURE_ENDDATE) {
				$props[PR_EC_OUTOFOFFICE_UNTIL] = 0;
			}
			if (!isset($props[PR_EC_ALLOW_EXTERNAL])) {
				$props[PR_EC_ALLOW_EXTERNAL] = 0;
			}
			if (!isset($props[PR_EC_EXTERNAL_AUDIENCE])) {
				$props[PR_EC_EXTERNAL_AUDIENCE] = 0;
			}
			if (!isset($props[PR_EC_EXTERNAL_REPLY])) {
				$props[PR_EC_EXTERNAL_REPLY] = '';
			}
			if (!isset($props[PR_EC_EXTERNAL_SUBJECT])) {
				$props[PR_EC_EXTERNAL_SUBJECT] = '';
			}

			$externalProps['props']['entryid'] = bin2hex((string) $props[PR_MAILBOX_OWNER_ENTRYID]);
			$externalProps['props']['store_entryid'] = bin2hex((string) $props[PR_ENTRYID]);
			$externalProps['props']['set'] = $props[PR_EC_OUTOFOFFICE];
			$externalProps['props']['internal_reply'] = trim((string) $props[PR_EC_OUTOFOFFICE_MSG]);
			$externalProps['props']['internal_subject'] = trim((string) $props[PR_EC_OUTOFOFFICE_SUBJECT]);
			$externalProps['props']['from'] = $props[PR_EC_OUTOFOFFICE_FROM];
			$externalProps['props']['until'] = $props[PR_EC_OUTOFOFFICE_UNTIL];
			$externalProps['props']['allow_external'] = $props[PR_EC_ALLOW_EXTERNAL];
			$externalProps['props']['external_audience'] = $props[PR_EC_EXTERNAL_AUDIENCE];
			$externalProps['props']['external_reply'] = trim((string) $props[PR_EC_EXTERNAL_REPLY]);
			$externalProps['props']['external_subject'] = trim((string) $props[PR_EC_EXTERNAL_SUBJECT]);

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
	 * @return array array of user stores who has given 'owner' permission
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
		$store = $GLOBALS['mapisession']->openMessageStore(hex2bin((string) $storeEntryId));
		$props = Conversion::mapXML2MAPI($this->properties, $oofSettings);
		$oofProps = mapi_getprops($store, [PR_EC_OUTOFOFFICE, PR_EC_OUTOFOFFICE_FROM, PR_EC_OUTOFOFFICE_UNTIL]);

		// If client sent until value as 0 or User set OOF to true but don't set until
		// then save FUTURE_ENDDATE as until date. Also when OOF is already ON and User
		// don't change 'until' field then check if 'until' value is available in User's store
		// and if not then set until date to FUTURE_ENDDATE.
		// Note: If we remove PR_EC_OUTOFOFFICE_UNTIL property from User's store,
		// then gromox is setting past value "1970-01-01 00:00:00" as until date.
		// To avoid this issue and for OOF to work as expected, we are setting until date as FUTURE_ENDDATE.
		if (isset($oofSettings['until']) && $oofSettings['until'] === 0 ||
			!isset($oofSettings['until']) && isset($oofSettings['set']) ||
			(!isset($oofSettings['until'], $oofSettings['set']) &&
				(!isset($oofProps[PR_EC_OUTOFOFFICE_UNTIL]) || $oofProps[PR_EC_OUTOFOFFICE_UNTIL] === 0))) {
			$props[$this->properties['until']] = FUTURE_ENDDATE;
		}

		// Check if the OOF is set for the future
		$oofSet = (isset($oofSettings['set']) && $oofSettings['set']) || (!isset($oofSettings['set']) && $oofProps[PR_EC_OUTOFOFFICE]);
		if ($oofSet && isset($oofSettings['from']) && intval($oofSettings['from']) > time()) {
			$props[$this->properties['set']] = 2;
		}
		if (!empty($props)) {
			mapi_setprops($store, $props);
			mapi_savechanges($store);
		}
		$this->sendFeedback(true);
	}
}
