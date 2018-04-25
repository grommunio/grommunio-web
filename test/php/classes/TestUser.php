<?php
require_once('classes/Util.php');
require_once('classes/Restriction.php');

/**
 * TestUser
 *
 * A wrapper around the KopanoUser which adds utility functions.
 * This wrapper allows us to use a different subclass for the
 * KopanoUser while still being able to combine it with the
 * utility functions we wish.
 */
class TestUser {
	/**
	 * The actual KopanoUser object, this is the oject used to logon
	 * to the server with.
	 */
	private $user;

	/**
	 * The json request class used to mimic requests coming from the JS client.
	 */
	private $jsonRequest;

	/**
	 * The counter used for generating the unique module id's
	 */
	private $moduleId;

	/**
	 * Constructor
	 * @param KopanoUser $user The user to login with
	 */
	public function __construct($user)
	{
		$this->user = $user;
		$this->jsonRequest = new JSONRequest();
		$this->moduleId = 0;
		$this->initialize();
	}

	/**
	 * Initialize the TestUser.
	 * Should be overridden by subclasses
	 */
	protected function initialize()
	{
	}

	/**
	 * Let the user logon to the server.
	 * Wrapper for $user logon() function
	 */
	public function logon()
	{
		$this->user->logon();
	}

	/**
	 * Let the user logout of the server.
	 * Wrapper for $user logout() function
	 */
	public function logout()
	{
		$this->user->logout();
	}

	/**
	 * @return RESOURCE The session object
	 * Wrapper for $user getSession() function
	 */
	public function getSession()
	{
		$this->logon();
		return $this->user->getSession();
	}

	/**
	 * @return The default message store for this session
	 * Wrapper for $user getDefaultMessageStore() function
	 */
	public function getDefaultMessageStore()
	{
		$this->logon();
		return $this->user->getDefaultMessageStore();
	}

	/**
	 * Returns the entryid of the default message store for this session
	 * @return String The entryid of the default message store
	 */
	public function getDefaultMessageStoreEntryID()
	{
		$this->logon();
		$store = $this->getDefaultMessageStore();
		$props = mapi_getprops($store, Array(PR_ENTRYID));

		if (!isset($props[PR_ENTRYID])) {
			return;
		}

		return $props[PR_ENTRYID];
	}

	/**
	 * Returns the store for the given user
	 * @param string $user The user for which the store should be opened
	 * Wrapper for $user getSharedStore() function
	 */
	public function getSharedStore($user)
	{
		$this->logon();
		return $this->user->getSharedStore($user);
	}

	/**
	 * Returns the entryid of the store for the given user
	 * @param string $user The user for which the entryid is requested
	 * @return String the entryid of the users store
	 */
	public function getSharedStoreEntryID($user)
	{
		$this->logon();
		$store = $this->getSharedStore($user);
		$props = mapi_getprops($store, Array(PR_ENTRYID));

		if (!isset($props[PR_ENTRYID])) {
			return;
		}

		return $props[PR_ENTRYID];
	}

	/**
	 * Returns the default receive folder.
	 * @param Store The store for which the default folder is requested. If not provided, the defaultMessageStore
	 * is used.
	 * @return String The entryid of the default receive folder
	 */
	public function getReceiveFolderEntryID($store = false)
	{
		$this->logon();

		if (!$store) {
			$store = $this->getDefaultMessageStore();
		}

		$folder = $this->getReceiveFolder($store);
		$prop = mapi_getprops($folder, array(PR_ENTRYID));

		return $prop[PR_ENTRYID];
	}

	/**
	 * Returns the default receive folder.
	 * @param Store The store for which the default folder is requested. If not provided, the defaultMessageStore
	 * is used.
	 * @return MAPI_FOLDER The default receive folder
	 */
	public function getReceiveFolder($store = false)
	{
		$this->logon();

		if (!$store) {
			$store = $this->getDefaultMessageStore();
		}

		return mapi_msgstore_getreceivefolder($store);
	}

	/**
	 * Returns default folder entryid for the given folder prop
	 * @param MAPI_PROP_TAG $propTag could be PR_IPM_APPOINTMENT_ENTRYID, PR_IPM_CONTACT_ENTRYID etc
	 * @param Store The store for which the default entryid is requested. If not provided, the defaultMessageStore
	 * is used.
	 * @return String The entryid of the default folder
	 */
	public function getDefaultFolderEntryID($propTag, $store = false)
	{
		$this->logon();

		if (!$store) {
			$store = $this->getDefaultMessageStore();
		}

		$storeDefaultFolderProps = Array(
			PR_IPM_FAVORITES_ENTRYID, PR_IPM_OUTBOX_ENTRYID, PR_IPM_SENTMAIL_ENTRYID, 
			PR_IPM_SUBTREE_ENTRYID, PR_IPM_WASTEBASKET_ENTRYID);

		// The default folder properties for favorites, outbox, sent folder, subtree or the 
		// wastebasket is defined under the store instead of the root folder.
		if (in_array($propTag, $storeDefaultFolderProps)) {
			$props = mapi_getprops($store, Array($propTag));
		} else {
			$root = mapi_msgstore_openentry($store, null);
			$props = mapi_getprops($root, array($propTag));
		}

		if (!isset($props[$propTag])) {
			return;
		}
			
		return $props[$propTag];
	}

	/**
	 * Returns default folder object for the given folder prop
	 * @param MAPI_PROP_TAG $propTag could be PR_IPM_APPOINTMENT_ENTRYID, PR_IPM_CONTACT_ENTRYID etc
	 * @param Store The store for which the default folder is requested. If not provided, the defaultMessageStore
	 * is used.
	 * @return MAPI_FOLDER The default folder
	 */
	public function getDefaultFolder($propTag, $store = false)
	{
		$this->logon();

		if (!$store) {
			$store = $this->getDefaultMessageStore();
		}

		$entryid = $this->getDefaultFolderEntryID($propTag, $store);
		$folder = mapi_msgstore_openentry($store, $entryid);
		
		return $folder;
	}

	/**
	 * Function will return resource of the local freebusy message of the user's store.
	 * @param {MAPIStore} $store (optional) user's store.
	 * @return {MAPIMessage} local freebusy message.
	 */
	function getLocalFreeBusyMessage($store = false)
	{
		$this->logon();

		if (!$store) {
			$store = $this->getDefaultMessageStore();
		}

		// Get 'LocalFreeBusy' message from FreeBusy Store
		$root = mapi_msgstore_openentry($store, null);
		$storeProps = mapi_getprops($root, array(PR_FREEBUSY_ENTRYIDS));
		$localFreeBusyMessage = mapi_msgstore_openentry($store, $storeProps[PR_FREEBUSY_ENTRYIDS][1]);

		return $localFreeBusyMessage;
	}

	/**
	 * Function will return resource of the freebusy folder of the user's store.
	 * @param {MAPIStore} $store (optional) user's store.
	 * @return {MAPIFolder} freebusy folder.
	 */
	function getFreeBusyFolder($store = false)
	{
		$this->logon();

		if (!$store) {
			$store = $this->getDefaultMessageStore();
		}

		// Get 'LocalFreeBusy' message from FreeBusy Store
		$root = mapi_msgstore_openentry($store, null);
		$storeProps = mapi_getprops($root, array(PR_FREEBUSY_ENTRYIDS));
		$freeBusyFolder = mapi_msgstore_openentry($store, $storeProps[PR_FREEBUSY_ENTRYIDS][3]);

		return $freeBusyFolder;
	}

	/**
	 * Function will return resource of the rules table that can be used to create/update rules in user's store.
	 * @param {Boolean} $returnTable (optional) defines what will be returned by function
	 * if true then the function will return instance of rules table which can be used to get rules from table,
	 * if false then the function will return instance of IExchangeModifyTable which can be used to save rules data.
	 * @param {MAPIStore} $store (optional) current user's store.
	 * @return {MAPITable} rules table resource.
	 */
	function getRulesTable($returnTable = false, $store = false)
	{
		if($store === false) {
			$store = $this->getDefaultMessageStore();
		}

		$inbox = $this->getReceiveFolder($store);

		// get IExchangeModifyTable interface
		$rulesTable = mapi_folder_openmodifytable($inbox);

		if($returnTable === false) {
			return $rulesTable;
		}

		return mapi_rules_gettable($rulesTable);
	}

	/**
	 * Cleanup all folders inside the store which might have been affected during testing.
	 *
	 * @param MAPI_STORE The store which must be cleaned. Defaults to getDefaultMessageStore().
	 */
	public function cleanFolders($store = false)
	{
		$this->logon();

		if (!$store) {
			$store = $this->getDefaultMessageStore();
		}

		$storeProps = mapi_getprops($store, array(PR_IPM_SUBTREE_ENTRYID));
		$root = mapi_msgstore_openentry($store, $storeProps[PR_IPM_SUBTREE_ENTRYID]);
		$hierarchy = mapi_folder_gethierarchytable($root, CONVENIENT_DEPTH);
		$props = array(PR_CONTENT_COUNT, PR_ENTRYID, PR_SUBFOLDERS);
		$rows = mapi_table_queryallrows($hierarchy, $props);

		foreach($rows as $folder) {
			if ($folder[PR_CONTENT_COUNT] > 0 || $folder[PR_SUBFOLDERS]) {
				try {
					$folder = mapi_msgstore_openentry($store, $folder[PR_ENTRYID]);
					$flag = DELETE_HARD_DELETE;
					$result = mapi_folder_emptyfolder($folder, $flag);

				} catch (MAPIException $e) {
					if($e->getCode() !== MAPI_E_NO_ACCESS) {
						throw $e;
					}
				}
			}

			// Keep fallback for inherited classes such as PermissionsUser
			$this->cleanFolder($store, $folder[PR_ENTRYID]);
		}
	}

	public function cleanFolder($store = false, $entryid)
	{
	}

	/**
	 * Cleanup the rules of the user
	 */
	public function cleanRules()
	{
		$this->logon();

		try {
			$restrict = Restriction::ResContent(PR_RULE_PROVIDER, 'RuleOrganizer', FL_FULLSTRING | FL_IGNORECASE);
			$delete = array();

			$modifyTable = $this->getRulesTable();
			$table = mapi_rules_gettable($modifyTable);
			$rows = mapi_table_queryallrows($table, array( PR_RULE_ID ), $restrict);

			foreach ($rows as $row) {
				$delete[] = array(
					'rowflags' => ROW_REMOVE,
					'properties' => Array( PR_RULE_ID => $row[PR_RULE_ID])
				);
			}

			mapi_rules_modifytable($modifyTable, $delete);
		} catch (MAPIException $e) {
			if($e->getCode() !== MAPI_E_NO_ACCESS) {
				throw $e;
			}
		}
	}

	/**
	 * Cleanup the settings of the user by deleting the entire contents.
	 */
	public function cleanSettings()
	{
		$this->logon();

		try {
			$store = $this->getDefaultMessageStore();
			mapi_deleteprops($store, array(
				PR_EC_WEBACCESS_SETTINGS_JSON,
			));
		} catch (MAPIException $e) {
			if($e->getCode() !== MAPI_E_NO_ACCESS) {
				throw $e;
			}
		}
	}

	/**
	 * Function uses dispatcher to send dummy requests to the modules used in serverside.
	 * 
	 * @param String $module name of the module to which request is sent.
	 * eg. appointmentitemmodule ,createmailitemmodule
	 * @param Object $data The object data which is passed to the module.
	 * @return Object The return data
	 */
	public function execute($module, $data)
	{
		// Logout and in again, this ensures that we fully mimick the
		// PHP behavior of multiple requests (which also resets the
		// envionment).
		$this->logout();
		$this->logon();

		$moduleId = $this->moduleId++;

		// Generate a Json request
		$json = array();
		$json['zarafa'] = array();
		$json['zarafa'][$module] = array();
		$json['zarafa'][$module][$module . $moduleId] = $data;
		$json = json_encode($json);

		// Send the request
		$response = $this->jsonRequest->execute($json);

		// Decode the response so it can be returned to caller
		$response = json_decode_data($response, true);

		// Filter the response, check if we really have the response
		if(isset($response['zarafa'][$module]) && $response['zarafa'][$module][$module . $moduleId]) {
			return $response['zarafa'][$module][$module . $moduleId];
		}

		return null;
	}

	/**
	 * Retrieve all settings
	 * @return Object the return data
	 */
	public function retrieveSettings()
	{
		return $this->execute('settingsmodule', array(
			'retrieveAll' => array()
		));
	}

	/**
	 * Set a setting
	 * @param String $setting The settings path
	 * @param Mixed $value The value to set
	 * @return Object the return data
	 */
	public function setSetting($setting, $value = null)
	{
		$this->logon();

		return $this->execute('settingsmodule', array(
			'set' => array(
				'setting' => 
					($value === null) ?
						$setting :
						array(
							array(
								'path' => $setting,
								'value' => $value
							)
						)
			)
		));
	}

	/**
	 * Delete a setting
	 * @param String $setting The setting to delete
	 * @return Object the return data
	 */
	public function deleteSetting($setting)
	{
		$this->logon();

		return $this->execute('settingsmodule', array(
			'delete' => array(
				'setting' => $setting
			)
		));
	}

	/**
	 * Returns properties of current user
	 * @param Array $tags properties of user that should be returned
	 * @return Array The properties of user
	 */
	public function getUserProps($tags = false)
	{
		$this->logon();

		$props = array();
		$userEntryId = $this->getUserEntryID();

		if ($userEntryId) {
			// open the user entry
			$user = mapi_ab_openentry($this->user->getAddressbook(), $userEntryId);

			// receive userdata
			if ($tags) {
				$props = mapi_getprops($user, $tags);
			} else {
				$props = mapi_getprops($user);
			}
		}

		return $props;
	}

	/**
	 * Returns entryid of the current user
	 * @return BinString entryid
	 */
	public function getUserEntryID()
	{
		$this->logon();

		return $this->user->getUserEntryID();
	}

	/**
	 * Convert the current user into a recipient object which can
	 * be used to send messages to.
	 * @param Number $recipientType The recipient type (defaults to MAPI_TO)
	 * @return Array The recipient object
	 */
	public function getRecipient($recipientType = MAPI_TO)
	{
		$this->logon();

		$user = $this->getUserProps();

		return array(
			'entryid' => bin2hex($user[PR_ENTRYID]),
			'object_type' => $user[PR_OBJECT_TYPE],
			'display_name' => $user[PR_DISPLAY_NAME],
			'email_address' => $user[PR_EMAIL_ADDRESS],
			'smtp_address' => isset($user[PR_SMTP_ADDRESS]) ? $user[PR_SMTP_ADDRESS] : '',
			'address_type' => $user[PR_ADDRTYPE],
			'recipient_type' => $recipientType,
			'recipient_flags' => recipSendable,
			'display_type' => isset($user[PR_DISPLAY_TYPE]) ? $user[PR_DISPLAY_TYPE] : DT_MAILUSER,
			'display_type_ex' => isset($user[PR_DISPLAY_TYPE_EX]) ? $user[PR_DISPLAY_TYPE_EX] : DTE_FLAG_ACL_CAPABLE,
			'search_key' => bin2hex($user[PR_SEARCH_KEY]),
		);
	}

	/**
	 * Convert the current user into a delegate object which can
	 * be used to assign delegate permissions to.
	 * @param Array $props The permissions which should be set
	 * @return Array The delegate object
	 */
	public function getDelegate($props = array())
	{
		$this->logon();

		$user = $this->getUserProps();

		$props = array_merge(array(
			'display_name' => $user[PR_DISPLAY_NAME],
			'can_see_private' => false,
			'has_meeting_rule' => false,
			'rights_calendar' => ecRightsNone,
			'rights_contacts' => ecRightsNone,
			'rights_inbox' => ecRightsNone,
			'rights_journal' => ecRightsNone,
			'rights_notes' => ecRightsNone,
			'rights_tasks' => ecRightsNone
		), $props);

		return array(
			'entryid' => bin2hex($user[PR_ENTRYID]),
			'props' => $props
		);
	}

	/**
	 * Obtain the Recipient object for this user from a PHP response message
	 * @param array $message The message from where the recipient
	 * should be obtained
	 * @return array The recipient
	 */
	public function getRecipientFromMessage($message)
	{
		$username = $this->user->getUserName();

		if (isset($message['recipients']) && isset($message['recipients']['item'])) {
			$props = Util::pluckFromObject($message['recipients']['item'], 'props');
			$index = Util::indexInArray($props, 'email_address', $username);
			if ($index >= 0) {
				return $message['recipients']['item'][$index];
			}
		}

		return null;
	}

	public function getUserName()
	{
		return $this->user->getUserName();
	}
}
?>
