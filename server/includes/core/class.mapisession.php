<?php

	require_once( BASE_PATH . 'server/includes/core/class.properties.php' );

	/**
	 * MAPI session handling
	 *
	 * This class handles MAPI authentication and stores
	 *
	 * @package core
	 */
	class MAPISession
	{
		/**
		 * @var resource This holds the MAPI Session
		 */
		private $session;

		/**
		 * @var resource This can hold the addressbook resource
		 */
		private $ab;

		/**
		 * @var array List with all the currently opened stores
		 */
		private $stores;

		/**
		 * @var string The entryid (binary) of the default store
		 */
		private $defaultstore;

		/**
		 * @var string The entryid (binary) of the public store
		 */
		private $publicStore;

		/**
		 * @var array Information about the current session (username/email/password/etc)
		 */
		private $session_info;

		/**
		 * @var array Mapping username -> entryid for other stores
		 */
		private $userstores;

		/**
		 * @var array Cache for userentryid -> archive properties
		 */
		private $archivePropsCache;

		/**
		 * @var int Makes sure retrieveUserData is called only once
		 */
		private $userDataRetrieved;

		function __construct()
		{
			$this->stores = array();
			$this->defaultstore = null;
			$this->publicStore = null;
			$this->session = false;
			$this->ab = false;
			$this->userstores = array();
			$this->archivePropsCache = array();
			$this->userDataRetrieved = false;
		}

		/**
		 * Logon to Kopano's MAPI system via php MAPI extension
		 *
		 * Logs on to Kopano with the specified username and password. If the server is not specified,
		 * it will logon to the local server.
		 *
		 * @param string $username the username of the user
		 * @param string $password the password of the user
		 * @param string $server the server address
		 * @param string $sslcert_file the optional ssl certificate file
		 * @param string $sslcert_pass the optional ssl certificate password
		 * @param string $flags the optional logon flags
		 * @result int 0 on no error, otherwise a MAPI error code
		 */
		function logon($username = NULL, $password = NULL, $server = DEFAULT_SERVER, $sslcert_file = NULL, $sslcert_pass = NULL, $flags = 0)
		{
			$result = NOERROR;
			$username = (string) $username;
			$password = (string) $password;
			$flags |= 1; // Always disable notifications

			try {
				$webapp_version = 'WebApp-'.trim(file_get_contents(BASE_PATH . 'version'));
				$browser_version = isset($_SERVER['HTTP_USER_AGENT']) ? $_SERVER['HTTP_USER_AGENT'] : '';
				$this->session = mapi_logon_zarafa($username, $password, $server, $sslcert_file,
								   $sslcert_pass, $flags, $webapp_version, $browser_version);
				if ($this->session !== false){
					$this->session_info["username"] = $username;
				}
			} catch (MAPIException $e) {
				$result = $e->getCode();
			}

			return $result;
		}

		/**
		 * Get the user MAPI Object
		 *
		 * @param string $userEntryid The user entryid which is going to open. default is false.
		 * @return object An user MAPI object.
		 */
		function getUser($userEntryid = false){
			if($userEntryid === false) {
				// get user entryid
				$store_props = mapi_getprops($this->getDefaultMessageStore(), array(PR_USER_ENTRYID));
				$userEntryid = $store_props[PR_USER_ENTRYID];
			}
			// open the user entry
			return mapi_ab_openentry($this->getAddressbook(true), $userEntryid);
		}

		/**
		* Get logged-in user information
		*
		* This function populates the 'session_info' property of this class with the following information:
		* - userentryid: the MAPI entryid of the current user
		* - fullname: the fullname of the current user
		* - emailaddress: the email address of the current user
		*
		* The function only populates the information once, subsequent calls will return without error and without
		* doing anything.
		*
		* @return array Array of information about the currently logged-on user
		* @access private
		*/
		function retrieveUserData()
		{
			if($this->userDataRetrieved)
				return;

			$result = NOERROR;

			try {
				$store_props = mapi_getprops($this->getDefaultMessageStore(), array(PR_USER_ENTRYID));
				$user = $this->getUser($store_props[PR_USER_ENTRYID]);

				// receive userdata
				// TODO: 0x8C9E0102 represents an LDAP jpegPhoto and should get a named property PR_EMS_AB_THUMBNAIL_PHOTO
				$user_props = array(PR_DISPLAY_NAME, PR_SMTP_ADDRESS, PR_EMAIL_ADDRESS, PR_SEARCH_KEY, 0x8C9E0102, PR_ASSISTANT_TELEPHONE_NUMBER);
				$properties = new properties();
				$user_props = array_merge($user_props, $properties->getAddressBookItemMailuserProperties());

				$user_props = mapi_getprops($user, $user_props);

				if (is_array($user_props) && isset($user_props[PR_DISPLAY_NAME]) && isset($user_props[PR_SMTP_ADDRESS])){
					$this->session_info["userentryid"] = $store_props[PR_USER_ENTRYID];
					$this->session_info["fullname"] = $user_props[PR_DISPLAY_NAME];
					$this->session_info["smtpaddress"] = $user_props[PR_SMTP_ADDRESS];
					$this->session_info["emailaddress"] = $user_props[PR_EMAIL_ADDRESS];
					$this->session_info["searchkey"] = $user_props[PR_SEARCH_KEY];
					$this->session_info["userimage"] = isset($user_props[-1935802110]) ? base64_encode($user_props[-1935802110]) : "";
					$this->session_info["userimage"] = strlen($this->session_info["userimage"]) > 0 ? "data:image/png;base64," . $this->session_info["userimage"] : "" ;

					$this->session_info["given_name"] = isset($user_props[PR_GIVEN_NAME]) ? $user_props[PR_GIVEN_NAME] : '';
					$this->session_info["initials"] = isset($user_props[PR_INITIALS]) ? $user_props[PR_INITIALS] : '';
					$this->session_info["surname"] = isset($user_props[PR_SURNAME]) ? $user_props[PR_SURNAME] : '';
					$this->session_info["street_address"] = isset($user_props[PR_STREET_ADDRESS]) ? $user_props[PR_STREET_ADDRESS] : '';
					$this->session_info["locality"] = isset($user_props[PR_LOCALITY]) ? $user_props[PR_LOCALITY] : '';
					$this->session_info["state_or_province"] = isset($user_props[PR_STATE_OR_PROVINCE]) ? $user_props[PR_STATE_OR_PROVINCE] : '';
					$this->session_info["postal_code"] = isset($user_props[PR_POSTAL_CODE]) ? $user_props[PR_POSTAL_CODE] : '';
					$this->session_info["country"] = isset($user_props[PR_COUNTRY]) ? $user_props[PR_COUNTRY] : '';
					$this->session_info["title"] = isset($user_props[PR_TITLE]) ? $user_props[PR_TITLE] : '';
					$this->session_info["company_name"] = isset($user_props[PR_COMPANY_NAME]) ? $user_props[PR_COMPANY_NAME] : '';
					$this->session_info["department_name"] = isset($user_props[PR_DEPARTMENT_NAME]) ? $user_props[PR_DEPARTMENT_NAME] : '';
					$this->session_info["office_location"] = isset($user_props[PR_OFFICE_LOCATION]) ? $user_props[PR_OFFICE_LOCATION] : '';
					$this->session_info["assistant"] = isset($user_props[PR_ASSISTANT]) ? $user_props[PR_ASSISTANT] : '';
					$this->session_info["assistant_telephone_number"] = isset($user_props[PR_ASSISTANT_TELEPHONE_NUMBER]) ? $user_props[PR_ASSISTANT_TELEPHONE_NUMBER] : '';
					$this->session_info["office_telephone_number"] = isset($user_props[PR_BUSINESS_TELEPHONE_NUMBER]) ? $user_props[PR_BUSINESS_TELEPHONE_NUMBER] : '';
					$this->session_info["business_telephone_number"] = isset($user_props[PR_BUSINESS_TELEPHONE_NUMBER]) ? $user_props[PR_BUSINESS_TELEPHONE_NUMBER] : '';
					$this->session_info["business2_telephone_number"] = isset($user_props[PR_BUSINESS2_TELEPHONE_NUMBER]) ? $user_props[PR_BUSINESS2_TELEPHONE_NUMBER] : '';
					$this->session_info["primary_fax_number"] = isset($user_props[PR_PRIMARY_FAX_NUMBER]) ? $user_props[PR_PRIMARY_FAX_NUMBER] : '';
					$this->session_info["home_telephone_number"] = isset($user_props[PR_HOME_TELEPHONE_NUMBER]) ? $user_props[PR_HOME_TELEPHONE_NUMBER] : '';
					$this->session_info["home2_telephone_number"] = isset($user_props[PR_HOME2_TELEPHONE_NUMBER]) ? $user_props[PR_HOME2_TELEPHONE_NUMBER] : '';
					$this->session_info["mobile_telephone_number"] = isset($user_props[PR_MOBILE_TELEPHONE_NUMBER]) ? $user_props[PR_MOBILE_TELEPHONE_NUMBER] : '';
					$this->session_info["pager_telephone_number"] = isset($user_props[PR_PAGER_TELEPHONE_NUMBER]) ? $user_props[PR_PAGER_TELEPHONE_NUMBER] : '';
				}

				$this->userDataRetrieved = true;

			} catch (MAPIException $e) {
				$result = $e->getCode();
			}

			return $result;
		}

		/**
		 * Get MAPI session object
		 *
		 * @return mapisession Current MAPI session
		 */
		function getSession()
		{
			return $this->session;
		}

		/**
		 * Set MAPI session object
		 *
		 * @param mapisession The MAPI session
		 */
		function setSession($session) {
			$this->session = $session;
		}

		/**
		 * Get MAPI addressbook object
		 *
		 * @param string $fresh (optional) When set to true it will return an addressbook resource
		 * without any Contact Provider set on it, defaults to false.
		 * @param boolean $loadSharedContactsProvider When set to true it denotes that shared folders are
		 * required to be configured to load the contacts from.
		 * @return mapiaddressbook An addressbook object to be used with mapi_ab_*
		 */
		function getAddressbook($providerless = false, $loadSharedContactsProvider = false)
		{
			if($providerless){
				try {
					return mapi_openaddressbook($this->session);
				} catch (MAPIException $e) {
					return $e->getCode();
				}
			}

			$result = NOERROR;

			if($this->ab === false){
				$this->setupContactProviderAddressbook($loadSharedContactsProvider);
			}

			try {
				if ($this->ab === false){
					$this->ab = mapi_openaddressbook($this->session);
				}

				if ($this->ab !== false){
					$result = $this->ab;
				}
			} catch (MAPIException $e) {
				$result = $e->getCode();
			}

			return $result;
		}


		/**
		 * Get logon status
		 * NOTE: This function only exists for backward compatibility with older plugins.
		 * 		 Currently the preferred way to check if a user is logged in, is using
		 * 		 the isAuthenticated() method of WebAppAuthentication.
		 *
		 * @return boolean true on logged on, false on not logged on
		 */
		function isLoggedOn()
		{
			trigger_error("isLoggedOn is deprecated, use WebAppAuthentication::isAuthenticated()", E_USER_NOTICE);
			return WebAppAuthentication::isAuthenticated();
		}

		/**
		 * Get current session id
		 * @deprecated 2.2.0 This function only exists for backward compatibility with
		 * 		 older plugins that want to send the session id as a GET parameter with
		 * 		 requests that they make to kopano.php. The script kopano.php does not
		 * 		 expect this parameter anymore, but plugins that are not updated might
		 * 		 still call this function.
		 * @return string Always empty
		 */
		function getSessionID()
		{
			return '';
		}

		/**
		 * Get current user entryid
		 * @return string Current user's entryid
		 */
		function getUserEntryID()
		{
			$this->retrieveUserData();

			return array_key_exists("userentryid",$this->session_info)?$this->session_info["userentryid"]:false;
		}

		/**
		 * Get current username
		 * @return string Current user's username (equal to username passed in logon() )
		 */
		function getUserName()
		{
			$encryptionStore = EncryptionStore::getInstance();
			return $encryptionStore->get('username') ? $encryptionStore->get('username'): '';
		}

		/**
		 * Get current user's full name
		 * @return string User's full name
		 */
		function getFullName()
		{
			$this->retrieveUserData();

			return array_key_exists("fullname",$this->session_info)?$this->session_info["fullname"]:false;
		}

		/**
		 * Get current user's smtp address
		 * @return string User's smtp address
		 */
		function getSMTPAddress()
		{
			$this->retrieveUserData();

			return array_key_exists("smtpaddress",$this->session_info)?$this->session_info["smtpaddress"]:false;
		}

		/**
		 * Get current user's email address
		 * @return string User's email address
		 */
		function getEmailAddress()
		{
			$this->retrieveUserData();

			return array_key_exists("emailaddress",$this->session_info)?$this->session_info["emailaddress"]:false;
		}

		/**
		 * Get current user's image from the LDAP server
		 * @return string A base64 encoded string (data url)
		 */
		function getUserImage()
		{
			$this->retrieveUserData();

			return array_key_exists("userimage",$this->session_info)? $this->session_info["userimage"]:false;
		}

		/**
		 * Get currently disabled features for the user
		 * @return array An disabled features list.
		 */
		function getDisabledFeatures()
		{
			$userProps = mapi_getprops($this->getUser(), array(PR_EC_DISABLED_FEATURES));
			return isset($userProps[PR_EC_DISABLED_FEATURES]) ? $userProps[PR_EC_DISABLED_FEATURES] : [];
		}

		/**
		 * @return boolean True if webapp is disabled feature else return false.
		 */
		function isWebappDisableAsFeature()
		{
			return array_search('webapp', $this->getDisabledFeatures()) !== false;
		}

		 /**
		  * Magic method to get properties from the session_info. When a method of this class if called
		  * and there is no method of this name defined this function will be called
		  * It creates getter methods for the properties stored in $session_info using the following syntax:
		  * getSomeUserProperty() will look return a property called some_user_property if it exists and
		  * throw an exception otherwise.
		  * @param string $methodName The name of the method that was called
		  * @param array $arguments The arguments that were passed in the call
		  * @return String The requested property if it exists
		  * @throws Exception
		  */
		 public function __call($methodName, $arguments)
		 {
		 	if ( !preg_match('/^get(.+)$/', $methodName, $matches) ){
		 		// We don't know this function, so let's throw an error
		 		throw new Exception('Method ' . $methodName . ' does not exist');
		 	}else{
		 		$this->retrieveUserData();
		 		$propertyName = strtolower(preg_replace('/([^A-Z])([A-Z])/', '$1_$2', $matches[1]));
				if ( !array_key_exists($propertyName, $this->session_info) ){
			 		// We don't know this function, so let's throw an error
			 		throw new Exception('Method ' . $methodName . ' does not exist '.$propertyName);
				}else{
					return $this->session_info[$propertyName];
				}
		 	}
		 }

		/**
		 * Returns a hash with information about the user that is logged in
		 * @return array
		 */
		public function getUserInfo() {
			return array(
				'username'					=> $this->getUserName(),
				'fullname'					=> $this->getFullName(),
				'entryid'					=> bin2hex($this->getUserEntryid()),
				'email_address'				=> $this->getEmailAddress(),
				'smtp_address'				=> $this->getSMTPAddress(),
				'search_key'				=> bin2hex($this->getSearchKey()),
				'user_image'				=> bin2hex($this->getUserImage()),
				'given_name'				=> $this->getGivenName(),
				'initials'					=> $this->getInitials(),
				'surname'					=> $this->getSurname(),
				'street_address'			=> $this->getStreetAddress(),
				'locality'					=> $this->getLocality(),
				'state_or_province'			=> $this->getStateOrProvince(),
				'postal_code'				=> $this->getPostalCode(),
				'country'					=> $this->getCountry(),
				'title'						=> $this->getTitle(),
				'company_name'				=> $this->getCompanyName(),
				'department_name'			=> $this->getDepartmentName(),
				'office_location'			=> $this->getOfficeLocation(),
				'assistant'					=> $this->getAssistant(),
				'assistant_telephone_number'=> $this->getAssistantTelephoneNumber(),
				'office_telephone_number'	=> $this->getOfficeTelephoneNumber(),
				'business_telephone_number'	=> $this->getBusinessTelephoneNumber(),
				'business2_telephone_number'=> $this->getBusiness2TelephoneNumber(),
				'primary_fax_number'		=> $this->getPrimaryFaxNumber(),
				'home_telephone_number'		=> $this->getHomeTelephoneNumber(),
				'home2_telephone_number'	=> $this->getHome2TelephoneNumber(),
				'mobile_telephone_number'	=> $this->getMobileTelephoneNumber(),
				'pager_telephone_number'	=> $this->getPagerTelephoneNumber(),
			);
		}

		/**
		 * Get current user's search key
		 * @return string Current user's searchkey
		 */
		function getSearchKey()
		{
			$this->retrieveUserData();

			return array_key_exists("searchkey",$this->session_info)?$this->session_info["searchkey"]:false;
		}

		/**
		 * Get the message stores from the messge store table from your session. Standard stores
		 * like the default store and the public store are made them easily accessible through the
		 * defaultstore and publicStore properties.
		 */
		function loadMessageStoresFromSession()
		{
			$storestables = mapi_getmsgstorestable($this->session);
			$rows = mapi_table_queryallrows($storestables, array(PR_ENTRYID, PR_DEFAULT_STORE, PR_MDB_PROVIDER));
			foreach($rows as $row) {
				if (!$row[PR_ENTRYID]) {
					continue;
				}

				if (isset($row[PR_DEFAULT_STORE]) && $row[PR_DEFAULT_STORE] == true) {
					$this->defaultStore = $row[PR_ENTRYID];
				} elseif ($row[PR_MDB_PROVIDER] == ZARAFA_STORE_PUBLIC_GUID) {
					$this->publicStore = $row[PR_ENTRYID];
				}
			}
		}

		/**
		 * Get the current user's default message store
		 *
		 * The store is opened only once, subsequent calls will return the previous store object
		 * @param boolean reopen force re-open
		 * @return mapistore User's default message store object
		 */
		function getDefaultMessageStore($reopen = False)
		{
			// Return cached default store if we have one
			if (!$reopen && isset($this->defaultstore) && isset($this->stores[$this->defaultstore])) {
				return $this->stores[$this->defaultstore];
			}

			$this->loadMessageStoresFromSession();
			return $this->openMessageStore($this->defaultStore, 'Default store');
		}

		/**
		 * The default messagestore entryid
		 * @return string the entryid of the default messagestore
		 */
		function getDefaultMessageStoreEntryId()
		{
			if (!isset($this->defaultStore)) {
				$this->loadMessageStoresFromSession();
			}

			return bin2hex($this->defaultStore);
		}

		/**
		 * Get single store and it's archive store aswell if we are openig full store.
		 *
		 * @param $store object the store of the user
		 * @param array $storeOptions contains folder_type of which folder to open
		 * It is mapped to username, If folder_type is 'all' (i.e. Open Entire Inbox)
		 * then we will open full store and it's archived stores.
		 * @param String $username The username
		 * @return Array storeArray The array of stores containing user's store and archived stores
		 */
		function getSingleMessageStores($store, $storeOptions, $username)
		{
			$storeArray = array($store);
			$archivedStores = array();

			// Get archived stores for user if there's any
			if(!empty($username)) {
				// Check whether we should open the whole store or just single folders
				if(is_array($storeOptions) && isset($storeOptions[ $username ]) && isset($storeOptions[ $username ]['all'])) {
					$archivedStores = $this->getArchivedStores($this->resolveStrictUserName($username));
				}
			}

			foreach($archivedStores as $archivedStore) {
				$storeArray[]= $archivedStore;
			}
			return $storeArray;
		}

		/**
		 * Get the public message store
		 *
		 * The store is opened only once, subsequent calls will return the previous store object
		 * @return mapistore Public message store object
		 */
		function getPublicMessageStore()
		{
			// Return cached public store if we have one
			if(isset($this->publicStore) && isset($this->stores[$this->publicStore])) {
				return $this->stores[$this->publicStore];
			}

			$this->loadMessageStoresFromSession();
			if(!isset($this->publicStore)) {
				return false;
			}
			return $this->openMessageStore($this->publicStore, 'Public store');
		}

		/**
		 * Get all message stores currently open in the session
		 *
		 * @return array Associative array with entryid -> mapistore of all open stores (private, public, delegate)
		 */
		function getAllMessageStores()
		{
			$this->getDefaultMessageStore();
			$this->getPublicMessageStore();
			$this->getArchivedStores($this->getUserEntryID());
			// The cache now contains all the stores in our profile. Next, add the stores
			// for other users.
			$this->getOtherUserStore();

			// Just return all the stores in our cache, even if we have some error in mapi
			return $this->stores;
		}

		/**
		 * Open the message store with entryid $entryid
		 *
		 * @param String $entryid String representation of the binary entryid of the store.
		 * @param String $name The name of the store. Will be logged when opening fails.
		 *
		 * @return mapistore The opened store on success, false otherwise
		 */
		function openMessageStore($entryid, $name='')
		{
			// Check the cache before opening
			foreach($this->stores as $storeEntryId => $storeObj) {
				if($GLOBALS["entryid"]->compareStoreEntryIds(bin2hex($entryid), bin2hex($storeEntryId))) {
					return $storeObj;
				}
			}

			try {
				$store = mapi_openmsgstore($this->session, $entryid);

				// Cache the store for later use
				$this->stores[$entryid] = $store;
			} catch (MAPIException $e) {
				error_log('Failed to open store with entryid ' . $entryid . ($name ? " ($name)":''));
				error_log($e);
				return $e->getCode();
			} catch (Exception $e ) {
				// mapi_openmsgstore seems to throw another exception than MAPIException
				// sometimes, so we add a safety net.
				error_log('Failed to open store with entryid ' . $entryid . ($name ? " ($name)":''));
				error_log($e);
				return $e->getCode();
			}

			return $store;
		}

		/**
		 * Searches for the PR_EC_ARCHIVE_SERVERS property of the user of the passed entryid in the
		 * Addressbook. It will get all his archive store objects and add those to the $this->stores
		 * list. It will return an array with the list of archive stores where the key is the
		 * entryid of the store and the value the store resource.
		 * @param String $userEntryid Binary entryid of the user
		 * @return MAPIStore[] List of store resources with the key being the entryid of the store
		 */
		function getArchivedStores($userEntryid)
		{
			if (!isset($this->archivePropsCache[$userEntryid])) {
				$this->archivePropsCache[$userEntryid] = $this->getArchiveProps($userEntryid);
			}

			$userData = $this->archivePropsCache[$userEntryid];

			$archiveStores = Array();
			if(isset($userData[PR_EC_ARCHIVE_SERVERS]) && count($userData[PR_EC_ARCHIVE_SERVERS]) > 0){
				// Get the store of the user, need this for the call to mapi_msgstore_getarchiveentryid()
				$userStoreEntryid = mapi_msgstore_createentryid($this->getDefaultMessageStore(), $userData[PR_ACCOUNT]);
				$userStore = mapi_openmsgstore($GLOBALS['mapisession']->getSession(), $userStoreEntryid);

				for($i=0;$i<count($userData[PR_EC_ARCHIVE_SERVERS]);$i++){
					try{
						// Check if the store exists. It can be that the store archiving has been enabled, but no
						// archived store has been created an none can be found in the PR_EC_ARCHIVE_SERVERS property.
						$archiveStoreEntryid = mapi_msgstore_getarchiveentryid($userStore, $userData[PR_ACCOUNT], $userData[PR_EC_ARCHIVE_SERVERS][$i]);
						$archiveStores[$archiveStoreEntryid] = mapi_openmsgstore($GLOBALS['mapisession']->getSession(), $archiveStoreEntryid);
						// Add the archive store to the list
						$this->stores[$archiveStoreEntryid] = $archiveStores[$archiveStoreEntryid];
					} catch (MAPIException $e) {
						$e->setHandled();
						if ($e->getCode() == MAPI_E_UNKNOWN_ENTRYID){
							dump('Failed to load archive store as entryid is not valid' . $e->getDisplayMessage());
						} else if ($e->getCode() == MAPI_E_NOT_FOUND) {
							// The corresponding store couldn't be found, print an error to the log.
							dump('Corresponding archive store couldn\'t be found' . $e->getDisplayMessage());
						} else {
							dump('Failed to load archive store' . $e->getDisplayMessage());
						}
					}
				}
			}
			return $archiveStores;
		}

		/**
		 * @param String $userEntryid binary entryid of the user
		 * @return Array Address Archive Properties of the user.
		 */
		private function getArchiveProps($userEntryid) {
			$ab = $this->getAddressbook();
			$abitem = mapi_ab_openentry($ab, $userEntryid);
			return mapi_getprops($abitem, Array(PR_ACCOUNT, PR_EC_ARCHIVE_SERVERS));
		}

		/**
		 * Get all the available shared stores
		 *
		 * The store is opened only once, subsequent calls will return the previous store object
		 */
		function getOtherUserStore()
		{
			$otherusers = $this->retrieveOtherUsersFromSettings();
			$otheUsersStores = Array();

			foreach($otherusers as $username=>$folder) {
				if (isset($this->userstores[$username])) {
					continue;
				}

				if(is_array($folder) && !empty($folder)) {
					try {
						$user_entryid = mapi_msgstore_createentryid($this->getDefaultMessageStore(), $username);

						$sharedStore =  $this->openMessageStore($user_entryid, $username);
						if($sharedStore !== false) {
							array_push($otheUsersStores ,$sharedStore);
						}

						$this->userstores[$username] = $user_entryid;

						// Check if an entire store will be loaded, if so load the archive store as well
						if(isset($folder['all']) && $folder['all']['folder_type'] == 'all'){
							$this->getArchivedStores($this->resolveStrictUserName($username));
						}
					} catch (MAPIException $e) {
						if ($e->getCode() == MAPI_E_NOT_FOUND) {
							// The user or the corresponding store couldn't be found,
							// print an error to the log, and remove the user from the settings.
							dump('Failed to load store for user ' . $username . ', user was not found. Removing it from settings.');
							$GLOBALS["settings"]->delete("zarafa/v1/contexts/hierarchy/shared_stores/" . $username, true);
						} else {
							// That is odd, something else went wrong. Lets not be hasty and preserve
							// the user in the settings, but do print something to the log to indicate
							// something happened...
							dump('Failed to load store for user ' . $username . '. ' . $e->getDisplayMessage());
						}
					}
				}
			}
			return $otheUsersStores;
		}

		/**
		 * Resolve the username strictly by opening that user's store and returning the
		 * PR_MAILBOX_OWNER_ENTRYID. This can be used for resolving an username without the risk of
		 * ambiguity since mapi_ab_resolve() does not strictly resolve on the username.
		 * @param String $username The username
		 * @return Binary|Integer Entryid of the user on success otherwise the hresult error code
		 */
		function resolveStrictUserName($username)
		{
			$storeEntryid = mapi_msgstore_createentryid($this->getDefaultMessageStore(), $username);
			$store = $this->openMessageStore($storeEntryid, $username);
			$storeProps = mapi_getprops($store, Array(PR_MAILBOX_OWNER_ENTRYID));
			return $storeProps[PR_MAILBOX_OWNER_ENTRYID];
		}

		/**
		 * Get other users from settings
		 *
		 * @return array Array of usernames of delegate stores
		 */
		function retrieveOtherUsersFromSettings()
		{
			$other_users = $GLOBALS["settings"]->get("zarafa/v1/contexts/hierarchy/shared_stores", []);

			$uppercaseUsers = array_filter(array_keys($other_users), function($string) {
				return (bool) preg_match('/[A-Z]/', $string);
			});

			if ($uppercaseUsers) {
				return $this->convertUpperCaseOtherUsersSettings($other_users);
			}

			return $other_users;
		}


		/*
		 * Convert old settings to new settings format. Due to a
		 * previous bug you were able to open folders from both user_a
		 * and USER_A so we have to filter that here. We do that by
		 * making everything lower-case
		 * @param array $other_users the shared_stores settings
		 * @return array Array of usernames of delegate stores
		 */
		private function convertUpperCaseOtherUsersSettings($other_users) {
			$result = [];

			foreach($other_users as $username=>$folders) {
				// No folders are being shared, the store has probably been closed by the user,
				// but the username is still lingering in the settings...
				if (!isset($folders) || empty($folders)) {
					continue;
				}

				$username = strtolower($username);
				if(!isset($result[$username])) {
					$result[$username] = Array();
				}

				foreach($folders as $type => $folder) {
					if(is_array($folder)) {
						$result[$username][$folder["folder_type"]] = Array();
						$result[$username][$folder["folder_type"]]["folder_type"] = $folder["folder_type"];
						$result[$username][$folder["folder_type"]]["show_subfolders"] = $folder["show_subfolders"];
					}
				}
			}

			$GLOBALS["settings"]->set("zarafa/v1/contexts/hierarchy/shared_stores", $result);
		}

		/**
		 * Add the store of another user to the list of other user stores
		 *
		 * @param string $username The username whose store should be added to the list of other users' stores
		 * @return mapistore The store of the user or false on error;
		 */
		function addUserStore($username)
		{
			$user_entryid = mapi_msgstore_createentryid($this->getDefaultMessageStore(), $username);

			if($user_entryid) {
				$this->userstores[$username] = $user_entryid;

				return $this->openMessageStore($user_entryid, $username);
			}
		}

		/**
		 * Remove the store of another user from the list of other user stores
		 *
		 * @param string $username The username whose store should be deleted from the list of other users' stores
		 * @return string The entryid of the store which was removed
		 */
		function removeUserStore($username)
		{
			// Remove the reference to the store if we had one
			if (isset($this->userstores[$username])){
				$entryid = $this->userstores[$username];
				unset($this->userstores[$username]);
				unset($this->stores[$entryid]);
				return $entryid;
			}
		}

		/**
		 * Get the store entryid of the specified user
		 *
		 * The store must have been previously added via addUserStores.
		 *
		 * @param string $username The username whose store is being looked up
		 * @return string The entryid of the store of the user
		 */
		function getStoreEntryIdOfUser($username)
		{
			return $this->userstores[$username];
		}

		/**
		 * Get the username of the user store
		 *
		 * @param string $username The loginname of whom we want to full name.
		 * @return string the display name of the user.
		 */
		function getDisplayNameofUser($username)
		{
			$user_entryid = $this->getStoreEntryIdOfUser($username);
			$store = $this->openMessageStore($user_entryid, $username);
			$props = mapi_getprops($store, array(PR_DISPLAY_NAME));
			return str_replace('Inbox - ', '', $props[PR_DISPLAY_NAME]);
		}

		/**
		 * Get the username of the owner of the specified store
		 *
		 * The store must have been previously added via addUserStores.
		 *
		 * @param string $entryid EntryID of the store
		 * @return string Username of the specified store or false if it is not found
		 */
		function getUserNameOfStore($entryid)
		{
			foreach($this->userstores as $username => $storeentryid) {
				if($GLOBALS["entryid"]->compareStoreEntryIds(bin2hex($storeentryid), bin2hex($entryid)))
					return $username;
			}

			return false;
		}

		/**
		 * Open a MAPI message using session object.
		 * The function is used to open message when we dont' know
		 * the specific store and we want to open message using entryid.
		 *
		 * @param string $entryid entryid of the message
		 * @return object MAPI Message
		 */
		function openMessage($entryid)
		{
			return mapi_openentry($this->session, $entryid);
		}

		/**
		 * Setup the contact provider for the addressbook. It asks getContactFoldersForABContactProvider
		 * for the entryids and display names for the contact folders in the user's store.
		 * @param boolean $loadSharedContactsProvider When set to true it denotes that shared folders are
		 * required to be configured to load the contacts from.
		 */
		function setupContactProviderAddressbook($loadSharedContactsProvider)
		{
			$profsect = mapi_openprofilesection($GLOBALS['mapisession']->getSession(), pbGlobalProfileSectionGuid);
			if ($profsect){
				// Get information about all contact folders from own store, shared stores and public store
				$defaultStore = $this->getDefaultMessageStore();
				$contactFolders = $this->getContactFoldersForABContactProvider($defaultStore);

				// include shared contact folders in addressbook if shared contact folders are not disabled
				if (!DISABLE_SHARED_CONTACT_FOLDERS && $loadSharedContactsProvider) {
					if (empty($this->userstores)) {
						$this->getOtherUserStore();
					}

					// Find available contact folders from all user stores, one by one.
					foreach($this->userstores as $username => $storeEntryID) {
						$userContactFolders = array();
						$openedUserStore = $this->openMessageStore($storeEntryID, $username);

						// Get settings of respective shared folder of given user
						$sharedSetting = $GLOBALS["settings"]->get("zarafa/v1/contexts/hierarchy/shared_stores", null);
						$sharedUserSetting = $sharedSetting[$username];

						// Only add opened shared folders into addressbook contacts provider.
						// If entire inbox is opened then add each and every contact folders of that particular user.
						if (isset($sharedUserSetting['all'])) {
							$userContactFolders = $this->getContactFoldersForABContactProvider($openedUserStore);
						} else if (isset($sharedUserSetting['contact'])) {
							// Add respective default contact folder which is opened.
							// Get entryid of default contact folder from root.
							$root = mapi_msgstore_openentry($openedUserStore, null);
							$rootProps = mapi_getprops($root, array(PR_IPM_CONTACT_ENTRYID));

							// Just add the default contact folder only.
							$defaultContactFolder = array(
								PR_STORE_ENTRYID => $storeEntryID,
								PR_ENTRYID       => $rootProps[PR_IPM_CONTACT_ENTRYID],
								PR_DISPLAY_NAME  => _("Contacts")
							);
							array_push($userContactFolders, $defaultContactFolder);

							// Go for sub folders only if configured in settings
							if ($sharedUserSetting['contact']['show_subfolders'] == true) {
								$subContactFolders =  $this->getContactFolders($openedUserStore, $rootProps[PR_IPM_CONTACT_ENTRYID], true);
								if(is_array($subContactFolders)){
									$userContactFolders = array_merge($userContactFolders, $subContactFolders);
								}
							}
						}

						// Postfix display name of every contact folder with respective owner name
						// it is mandatory to keep display-name different
						$userStoreProps = mapi_getprops($openedUserStore, array(PR_MAILBOX_OWNER_NAME));
						for($i=0,$len=count($userContactFolders);$i<$len;$i++){
							$userContactFolders[$i][PR_DISPLAY_NAME] = $userContactFolders[$i][PR_DISPLAY_NAME] . " - " . $userStoreProps[PR_MAILBOX_OWNER_NAME];
						}

						$contactFolders = array_merge($contactFolders, $userContactFolders);
					}
				}

				// include public contact folders in addressbook if public folders are enabled, and Public contact folders is not disabled
				if (!DISABLE_PUBLIC_CONTACT_FOLDERS && ENABLE_PUBLIC_FOLDERS) {
					$publicStore = $this->getPublicMessageStore();
					if($publicStore !== false) {
						$contactFolders = array_merge($contactFolders, $this->getContactFoldersForABContactProvider($publicStore));
					}
				}
				//TODO: The shared stores are not opened as there still is a bug that does not allow resolving from shared contact folders

				// These lists will be used to put set in the profile section
				$contact_store_entryids = Array();
				$contact_folder_entryids = Array();
				$contact_folder_names = Array();

				// Create the lists of store entryids, folder entryids and folder names to be added
				// to the profile section
				for($i=0,$len=count($contactFolders);$i<$len;$i++){
					$contact_store_entryids[] = $contactFolders[$i][PR_STORE_ENTRYID];
					$contact_folder_entryids[] = $contactFolders[$i][PR_ENTRYID];
					$contact_folder_names[] = $contactFolders[$i][PR_DISPLAY_NAME];
				}

				if(!empty($contact_store_entryids)){
					// add the defaults contacts folder in the addressbook hierarchy under 'Kopano Contacts Folders'
					mapi_setprops($profsect, Array(PR_ZC_CONTACT_STORE_ENTRYIDS => $contact_store_entryids,
												   PR_ZC_CONTACT_FOLDER_ENTRYIDS =>	$contact_folder_entryids,
												   PR_ZC_CONTACT_FOLDER_NAMES => $contact_folder_names));
				}
			}
		}

		/**
		 * Get the store entryid, folder entryid and display name of the contact folders in the
		 * user's store. It returns an array prepared by getContactFolders.
		 *
		 * @param mapiStore $store The mapi store to look for folders in
		 * @return Array Contact folder information
		 */
		function getContactFoldersForABContactProvider($store)
		{
			$storeProps = mapi_getprops($store, array(PR_ENTRYID, PR_MDB_PROVIDER, PR_IPM_SUBTREE_ENTRYID, PR_IPM_PUBLIC_FOLDERS_ENTRYID));

			// For the public store we need to use the PR_IPM_PUBLIC_FOLDERS_ENTRYID instead of the
			// PR_IPM_SUBTREE_ENTRYID that can be used on your own and delegate stores.
			if($storeProps[PR_MDB_PROVIDER] == ZARAFA_STORE_PUBLIC_GUID){
				$subtreeEntryid = $storeProps[PR_IPM_PUBLIC_FOLDERS_ENTRYID];
			}else{
				$subtreeEntryid = $storeProps[PR_IPM_SUBTREE_ENTRYID];
			}

			$contactFolders = array();
			try{
				// Only searches one level deep, otherwise deleted contact folders will also be included.
				$contactFolders = $this->getContactFolders($store, $subtreeEntryid, false);
			}catch (Exception $e) {
				return $contactFolders;
			}

			// Need to search all the contact-subfolders within first level contact folders.
			$firstLevelHierarchyNodes = $contactFolders;
			foreach ($firstLevelHierarchyNodes as $key => $firstLevelNode) {
				// To search for multiple levels CONVENIENT_DEPTH needs to be passed as well.
				$contactFolders = array_merge($contactFolders, $this->getContactFolders($store, $firstLevelNode[PR_ENTRYID], true));
			}
			return $contactFolders;
		}

		/**
		 * Get the store entryid, folder entryid and display name of the contact folders from within given folder, in the
		 * user's store. It provides an array where each item contains the information of a folder
		 * formatted like this:
		 * Array(
		 *     PR_STORE_ENTRYID => '1234567890ABCDEF',
		 *     PR_ENTRYID       => '1234567890ABCDEF',
		 *     PR_DISPLAY_NAME  => 'Contact folder'
		 * )
		 * @param mapiStore $store The mapi store of the user
		 * @param string $folderEntryid EntryID of the folder to look for contact folders in
		 * @param int $depthSearch flag to search into all the folder levels
		 * @return Array an array in which founded contact-folders will be pushed
		 */
		function getContactFolders($store, $folderEntryid, $depthSearch)
		{
			$restriction = array(RES_CONTENT,
				array(
					// Fuzzylevel PF_PREFIX also allows IPF.Contact.Custom folders to be included.
					// Otherwise FL_FULLSTRING would only allow IPF.Contact folders.
					FUZZYLEVEL => FL_PREFIX,
					ULPROPTAG => PR_CONTAINER_CLASS,
					VALUE => array(
						PR_CONTAINER_CLASS => "IPF.Contact"
					)
				)
			);

			// Set necessary flag(s) to search considering all the sub folders or not
			$depthFlag = MAPI_DEFERRED_ERRORS;
			if ($depthSearch) {
				$depthFlag |= CONVENIENT_DEPTH;
			}

			$hierarchyFolder = mapi_msgstore_openentry($store, $folderEntryid);

			// Filter-out contact folders only
			$contactFolderTable = mapi_folder_gethierarchytable($hierarchyFolder, $depthFlag);
			mapi_table_restrict($contactFolderTable, $restriction, TBL_BATCH);

			return mapi_table_queryallrows($contactFolderTable, array(PR_STORE_ENTRYID, PR_ENTRYID, PR_DISPLAY_NAME));
		}

		/**
		 * Obtains server version from the PR_EC_SERVER_VERSION property.
		 */
		public function getServerVersion()
		{
			$props = mapi_getprops($this->getDefaultMessageStore(), array(PR_EC_SERVER_VERSION));
			if (propIsError(PR_EC_SERVER_VERSION, $props) === MAPI_E_NOT_FOUND) {
				return '';
			}
			return $props[PR_EC_SERVER_VERSION];
		}
	}
?>
