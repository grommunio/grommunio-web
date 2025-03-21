<?php

require_once BASE_PATH . 'server/includes/core/class.properties.php';

/**
 * MAPI session handling.
 *
 * This class handles MAPI authentication and stores
 */
class MAPISession {
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
	 * @var int Makes sure retrieveUserData is called only once
	 */
	private $userDataRetrieved;

	public function __construct() {
		$this->stores = [];
		$this->defaultstore = 0;
		$this->publicStore = 0;
		$this->session = false;
		$this->ab = false;
		$this->userstores = [];
		$this->userDataRetrieved = false;
	}

	/**
	 * Logon to via php_mapi extension.
	 *
	 * Logs on to Gromox with the specified username and password. If the server is not specified,
	 * it will logon to the local server.
	 *
	 * @param string $username     the username of the user
	 * @param string $password     the password of the user
	 * @param string $server       the server address
	 * @param string $sslcert_file the optional ssl certificate file
	 * @param string $sslcert_pass the optional ssl certificate password
	 * @param string $flags        the optional logon flags
	 *
	 * @return int 0 on no error, otherwise a MAPI error code
	 */
	public function logon($username = '', $password = '', $server = DEFAULT_SERVER, $sslcert_file = '', $sslcert_pass = '', $flags = 0) {
		$result = NOERROR;
		$username = (string) $username;
		$password = (string) $password;
		$flags |= 1; // Always disable notifications

		try {
			$webapp_version = 'WebApp-' . trim(file_get_contents(BASE_PATH . 'version'));
			$browser_version = isset($_SERVER['HTTP_USER_AGENT']) ? $_SERVER['HTTP_USER_AGENT'] : '';
			$this->session = mapi_logon_zarafa(
				$username,
				$password,
				$server,
				$sslcert_file,
				$sslcert_pass,
				$flags,
				$webapp_version,
				$browser_version
			);
			if ($this->session !== false) {
				$this->session_info["username"] = $username;
			}
		}
		catch (MAPIException $e) {
			$result = $e->getCode();
		}

		return $result;
	}

	/**
	 * Logons to gromox using the access token.
	 *
	 * @param mixed $email the username/email of the user
	 * @param mixed $token the access token
	 *
	 * @return int 0 on no error, otherwise a MAPI error code
	 */
	public function logon_token($email = null, $token = null) {
		$result = NOERROR;
		$email = (string) $email;
		$token = (string) $token;

		try {
			$this->session = mapi_logon_token($token);
			if ($this->session !== false) {
				$this->session_info["username"] = $email;
			}
		}
		catch (MAPIException $e) {
			$result = $e->getCode();
		}

		return $result;
	}

	/**
	 * Get the user MAPI Object.
	 *
	 * @param string $userEntryid The user entryid which is going to open. default is false.
	 *
	 * @return object an user MAPI object
	 */
	public function getUser($userEntryid = false) {
		if ($userEntryid === false) {
			// get user entryid
			$store_props = mapi_getprops($this->getDefaultMessageStore(), [PR_USER_ENTRYID]);
			$userEntryid = $store_props[PR_USER_ENTRYID];
		}

		// open the user entry
		return mapi_ab_openentry($this->getAddressbook(true), $userEntryid);
	}

	/**
	 * Get logged-in user information.
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
	 */
	public function retrieveUserData() {
		if ($this->userDataRetrieved) {
			return;
		}

		$result = NOERROR;

		try {
			$store_props = mapi_getprops($this->getDefaultMessageStore(), [PR_USER_ENTRYID]);
			$user = $this->getUser($store_props[PR_USER_ENTRYID]);

			// receive userdata
			$user_props = [ PR_ASSISTANT, PR_ASSISTANT_TELEPHONE_NUMBER, PR_BUSINESS2_TELEPHONE_NUMBER, PR_BUSINESS_TELEPHONE_NUMBER,
				PR_COMPANY_NAME, PR_COUNTRY, PR_DEPARTMENT_NAME, PR_DISPLAY_NAME,
				PR_EMAIL_ADDRESS, PR_EMS_AB_THUMBNAIL_PHOTO, PR_GIVEN_NAME, PR_HOME2_TELEPHONE_NUMBER,
				PR_STREET_ADDRESS, PR_HOME_TELEPHONE_NUMBER, PR_INITIALS, PR_LOCALITY,
				PR_MOBILE_TELEPHONE_NUMBER, PR_OFFICE_LOCATION, PR_PAGER_TELEPHONE_NUMBER, PR_POSTAL_CODE,
				PR_PRIMARY_FAX_NUMBER, PR_PRIMARY_TELEPHONE_NUMBER, PR_SEARCH_KEY, PR_SMTP_ADDRESS,
				PR_STATE_OR_PROVINCE, PR_SURNAME, PR_TITLE ];

			$user_props = mapi_getprops($user, $user_props);

			if (is_array($user_props) && isset($user_props[PR_DISPLAY_NAME], $user_props[PR_SMTP_ADDRESS])) {
				$this->session_info["userentryid"] = $store_props[PR_USER_ENTRYID];
				$this->session_info["fullname"] = $user_props[PR_DISPLAY_NAME];
				$this->session_info["smtpaddress"] = $user_props[PR_SMTP_ADDRESS];
				$this->session_info["emailaddress"] = $user_props[PR_EMAIL_ADDRESS];
				$this->session_info["searchkey"] = $user_props[PR_SEARCH_KEY];
				$this->session_info["userimage"] = isset($user_props[PR_EMS_AB_THUMBNAIL_PHOTO]) ? "data:image/jpeg;base64," . base64_encode((string) $user_props[PR_EMS_AB_THUMBNAIL_PHOTO]) : "";

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
				$this->session_info["office_telephone_number"] = isset($user_props[PR_PRIMARY_TELEPHONE_NUMBER]) ? $user_props[PR_PRIMARY_TELEPHONE_NUMBER] : '';
				$this->session_info["business_telephone_number"] = isset($user_props[PR_BUSINESS_TELEPHONE_NUMBER]) ? $user_props[PR_BUSINESS_TELEPHONE_NUMBER] : '';
				$this->session_info["business2_telephone_number"] = isset($user_props[PR_BUSINESS2_TELEPHONE_NUMBER]) ? $user_props[PR_BUSINESS2_TELEPHONE_NUMBER] : '';
				$this->session_info["primary_fax_number"] = isset($user_props[PR_PRIMARY_FAX_NUMBER]) ? $user_props[PR_PRIMARY_FAX_NUMBER] : '';
				$this->session_info["home_telephone_number"] = isset($user_props[PR_HOME_TELEPHONE_NUMBER]) ? $user_props[PR_HOME_TELEPHONE_NUMBER] : '';
				$this->session_info["home2_telephone_number"] = isset($user_props[PR_HOME2_TELEPHONE_NUMBER]) ? $user_props[PR_HOME2_TELEPHONE_NUMBER] : '';
				$this->session_info["mobile_telephone_number"] = isset($user_props[PR_MOBILE_TELEPHONE_NUMBER]) ? $user_props[PR_MOBILE_TELEPHONE_NUMBER] : '';
				$this->session_info["pager_telephone_number"] = isset($user_props[PR_PAGER_TELEPHONE_NUMBER]) ? $user_props[PR_PAGER_TELEPHONE_NUMBER] : '';
			}

			$this->userDataRetrieved = true;
		}
		catch (MAPIException $e) {
			$result = $e->getCode();
		}

		return $result;
	}

	/**
	 * Get MAPI session object.
	 *
	 * @return mapisession Current MAPI session
	 */
	public function getSession() {
		return $this->session;
	}

	/**
	 * Set MAPI session object.
	 *
	 * @param mapisession The MAPI session
	 * @param mixed $session
	 */
	public function setSession($session) {
		$this->session = $session;
	}

	/**
	 * Get MAPI addressbook object.
	 *
	 * @param bool $providerless When set to true it will return an addressbook resource
	 *                           without any Contact Provider set on it, defaults to false
	 * @param bool $loadSharedContactsProvider when set to true it denotes that shared folders are
	 *                                         required to be configured to load the contacts from
	 *
	 * @return mixed An addressbook object to be used with mapi_ab_* or an error code
	 */
	public function getAddressbook($providerless = false, $loadSharedContactsProvider = false) {
		if ($providerless) {
			try {
				return mapi_openaddressbook($this->session);
			}
			catch (MAPIException $e) {
				return $e->getCode();
			}
		}

		$result = NOERROR;

		if ($this->ab === false) {
			$this->setupContactProviderAddressbook($loadSharedContactsProvider);
		}

		try {
			if ($this->ab === false) {
				$this->ab = mapi_openaddressbook($this->session);
			}

			if ($this->ab !== false) {
				$result = $this->ab;
			}
		}
		catch (MAPIException $e) {
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
	 * @return bool true on logged on, false on not logged on
	 */
	public function isLoggedOn() {
		trigger_error("isLoggedOn is deprecated, use WebAppAuthentication::isAuthenticated()", E_USER_NOTICE);

		return WebAppAuthentication::isAuthenticated();
	}

	/**
	 * Get current session id.
	 *
	 * @deprecated 2.2.0 This function only exists for backward compatibility with
	 * 		 older plugins that want to send the session id as a GET parameter with
	 * 		 requests that they make to grommunio.php. The script grommunio.php does not
	 * 		 expect this parameter anymore, but plugins that are not updated might
	 * 		 still call this function.
	 *
	 * @return string Always empty
	 */
	public function getSessionID() {
		return '';
	}

	/**
	 * Get current user entryid.
	 *
	 * @return string Current user's entryid
	 */
	public function getUserEntryID() {
		$this->retrieveUserData();
		return $this->session_info["userentryid"] ?? '';
	}

	/**
	 * Get current username.
	 *
	 * @return string Current user's username (equal to username passed in logon() )
	 */
	public function getUserName() {
		$encryptionStore = EncryptionStore::getInstance();
		return $encryptionStore->get('username') ? $encryptionStore->get('username') : '';
	}

	/**
	 * Get current user's full name.
	 *
	 * @return string User's full name
	 */
	public function getFullName() {
		$this->retrieveUserData();
		return array_key_exists("fullname", $this->session_info) ? $this->session_info["fullname"] : false;
	}

	/**
	 * Get current user's smtp address.
	 *
	 * @return string User's smtp address
	 */
	public function getSMTPAddress() {
		$this->retrieveUserData();
		return array_key_exists("smtpaddress", $this->session_info) ? $this->session_info["smtpaddress"] : false;
	}

	/**
	 * Get current user's email address.
	 *
	 * @return string User's email address
	 */
	public function getEmailAddress() {
		$this->retrieveUserData();
		return array_key_exists("emailaddress", $this->session_info) ? $this->session_info["emailaddress"] : false;
	}

	/**
	 * Get current user's image from the LDAP server.
	 *
	 * @return string A base64 encoded string (data url)
	 */
	public function getUserImage() {
		$this->retrieveUserData();
		return array_key_exists("userimage", $this->session_info) ? $this->session_info["userimage"] : false;
	}

	public function setUserImage($user_image) {
		if ($this->userDataRetrieved && is_array($this->session_info)) {
			$this->session_info["userimage"] = $user_image;
		}
	}

	public function getGivenName() {
		$this->retrieveUserData();
		return array_key_exists("given_name", $this->session_info) ? $this->session_info["given_name"] : false;
	}

	public function getInitials() {
		$this->retrieveUserData();
		return array_key_exists("initials", $this->session_info) ? $this->session_info["initials"] : false;
	}

	public function getSurname() {
		$this->retrieveUserData();
		return array_key_exists("surname", $this->session_info) ? $this->session_info["surname"] : false;
	}

	public function getStreetAddress() {
		$this->retrieveUserData();
		return array_key_exists("street_address", $this->session_info) ? $this->session_info["street_address"] : false;
	}

	public function getLocality() {
		$this->retrieveUserData();
		return array_key_exists("locality", $this->session_info) ? $this->session_info["locality"] : false;
	}

	public function getStateOrProvince() {
		$this->retrieveUserData();
		return array_key_exists("state_or_province", $this->session_info) ? $this->session_info["state_or_province"] : false;
	}

	public function getPostalCode() {
		$this->retrieveUserData();
		return array_key_exists("postal_code", $this->session_info) ? $this->session_info["postal_code"] : false;
	}

	public function getCountry() {
		$this->retrieveUserData();
		return array_key_exists("country", $this->session_info) ? $this->session_info["country"] : false;
	}

	public function getTitle() {
		$this->retrieveUserData();
		return array_key_exists("title", $this->session_info) ? $this->session_info["title"] : false;
	}

	public function getCompanyName() {
		$this->retrieveUserData();
		return array_key_exists("company_name", $this->session_info) ? $this->session_info["company_name"] : false;
	}

	public function getDepartmentName() {
		$this->retrieveUserData();
		return array_key_exists("department_name", $this->session_info) ? $this->session_info["department_name"] : false;
	}

	public function getOfficeLocation() {
		$this->retrieveUserData();
		return array_key_exists("office_location", $this->session_info) ? $this->session_info["office_location"] : false;
	}

	public function getAssistant() {
		$this->retrieveUserData();
		return array_key_exists("assistant", $this->session_info) ? $this->session_info["assistant"] : false;
	}

	public function getAssistantTelephoneNumber() {
		$this->retrieveUserData();
		return array_key_exists("assistant_telephone_number", $this->session_info) ? $this->session_info["assistant_telephone_number"] : false;
	}

	public function getOfficeTelephoneNumber() {
		$this->retrieveUserData();
		return array_key_exists("office_telephone_number", $this->session_info) ? $this->session_info["office_telephone_number"] : false;
	}

	public function getBusinessTelephoneNumber() {
		$this->retrieveUserData();
		return array_key_exists("business_telephone_number", $this->session_info) ? $this->session_info["business_telephone_number"] : false;
	}

	public function getBusiness2TelephoneNumber() {
		$this->retrieveUserData();
		return array_key_exists("business2_telephone_number", $this->session_info) ? $this->session_info["business2_telephone_number"] : false;
	}

	public function getPrimaryFaxNumber() {
		$this->retrieveUserData();
		return array_key_exists("primary_fax_number", $this->session_info) ? $this->session_info["primary_fax_number"] : false;
	}

	public function getHomeTelephoneNumber() {
		$this->retrieveUserData();
		return array_key_exists("home_telephone_number", $this->session_info) ? $this->session_info["home_telephone_number"] : false;
	}

	public function getHome2TelephoneNumber() {
		$this->retrieveUserData();
		return array_key_exists("home2_telephone_number", $this->session_info) ? $this->session_info["home2_telephone_number"] : false;
	}

	public function getMobileTelephoneNumber() {
		$this->retrieveUserData();
		return array_key_exists("mobile_telephone_number", $this->session_info) ? $this->session_info["mobile_telephone_number"] : false;
	}

	public function getPagerTelephoneNumber() {
		$this->retrieveUserData();
		return array_key_exists("pager_telephone_number", $this->session_info) ? $this->session_info["pager_telephone_number"] : false;
	}

	/**
	 * Checks whether the user is enabled for grommunio-web.
	 *
	 * @return bool
	 */
	public function isGwebEnabled() {
		$store_props = mapi_getprops($this->getDefaultMessageStore(), [PR_EC_ENABLED_FEATURES_L]);
		return $store_props[PR_EC_ENABLED_FEATURES_L] & UP_WEB;
	}

	/**
	 * @return bool true if webapp is disabled feature else return false
	 */
	public function isWebappDisableAsFeature() {
		return !$this->isGwebEnabled();
	}

	/**
	 * Magic method to get properties from the session_info. When a method of this class if called
	 * and there is no method of this name defined this function will be called
	 * It creates getter methods for the properties stored in $session_info using the following syntax:
	 * getSomeUserProperty() will look return a property called some_user_property if it exists and
	 * throw an exception otherwise.
	 *
	 * @param string $methodName The name of the method that was called
	 * @param array  $arguments  The arguments that were passed in the call
	 *
	 * @return string The requested property if it exists
	 *
	 * @throws Exception
	 */
	public function __call($methodName, $arguments) {
		if (!preg_match('/^get(.+)$/', $methodName, $matches)) {
			// We don't know this function, so let's throw an error
			throw new Exception('Method ' . $methodName . ' does not exist');
		}
		$this->retrieveUserData();
		$propertyName = strtolower((string) preg_replace('/([^A-Z])([A-Z])/', '$1_$2', $matches[1]));
		if (!array_key_exists($propertyName, $this->session_info)) {
			// We don't know this function, so let's throw an error
			throw new Exception('Method ' . $methodName . ' does not exist ' . $propertyName);
		}

		return $this->session_info[$propertyName];
	}

	/**
	 * Returns a hash with information about the user that is logged in.
	 *
	 * @return array
	 */
	public function getUserInfo() {
		return [
			'username' => $this->getUserName(),
			'fullname' => $this->getFullName(),
			'entryid' => bin2hex($this->getUserEntryid()),
			'email_address' => $this->getEmailAddress(),
			'smtp_address' => $this->getSMTPAddress(),
			'search_key' => bin2hex($this->getSearchKey()),
			'user_image' => $this->getUserImage(),
			'given_name' => $this->getGivenName(),
			'initials' => $this->getInitials(),
			'surname' => $this->getSurname(),
			'street_address' => $this->getStreetAddress(),
			'locality' => $this->getLocality(),
			'state_or_province' => $this->getStateOrProvince(),
			'postal_code' => $this->getPostalCode(),
			'country' => $this->getCountry(),
			'title' => $this->getTitle(),
			'company_name' => $this->getCompanyName(),
			'department_name' => $this->getDepartmentName(),
			'office_location' => $this->getOfficeLocation(),
			'assistant' => $this->getAssistant(),
			'assistant_telephone_number' => $this->getAssistantTelephoneNumber(),
			'office_telephone_number' => $this->getOfficeTelephoneNumber(),
			'business_telephone_number' => $this->getBusinessTelephoneNumber(),
			'business2_telephone_number' => $this->getBusiness2TelephoneNumber(),
			'primary_fax_number' => $this->getPrimaryFaxNumber(),
			'home_telephone_number' => $this->getHomeTelephoneNumber(),
			'home2_telephone_number' => $this->getHome2TelephoneNumber(),
			'mobile_telephone_number' => $this->getMobileTelephoneNumber(),
			'pager_telephone_number' => $this->getPagerTelephoneNumber(),
		];
	}

	/**
	 * Get current user's search key.
	 *
	 * @return string Current user's searchkey
	 */
	public function getSearchKey() {
		$this->retrieveUserData();
		return $this->session_info["searchkey"] ?? '';
	}

	/**
	 * Get the message stores from the message store table from your session. Standard stores
	 * like the default store and the public store are made them easily accessible through the
	 * defaultstore and publicStore properties.
	 */
	public function loadMessageStoresFromSession() {
		$storestables = mapi_getmsgstorestable($this->session);
		$rows = mapi_table_queryallrows($storestables, [PR_ENTRYID, PR_DEFAULT_STORE, PR_MDB_PROVIDER]);
		foreach ($rows as $row) {
			if (!$row[PR_ENTRYID]) {
				continue;
			}

			if (isset($row[PR_DEFAULT_STORE]) && $row[PR_DEFAULT_STORE] == true) {
				$this->defaultstore = $row[PR_ENTRYID];
			}
			elseif ($row[PR_MDB_PROVIDER] == ZARAFA_STORE_PUBLIC_GUID) {
				$this->publicStore = $row[PR_ENTRYID];
			}
			elseif ($row[PR_MDB_PROVIDER] == ZARAFA_STORE_DELEGATE_GUID) {
				$eidObj = $GLOBALS["entryid"]->createMsgStoreEntryIdObj($row[PR_ENTRYID]);
				if (isset($eidObj['MailboxDN'])) {
					$this->openMessageStore($row[PR_ENTRYID], strtolower($eidObj['MailboxDN']));
				}
			}
		}
	}

	/**
	 * Get the current user's default message store.
	 *
	 * The store is opened only once, subsequent calls will return the previous store object
	 *
	 * @param bool reopen force re-open
	 * @param mixed $reopen
	 *
	 * @return mapistore User's default message store object
	 */
	public function getDefaultMessageStore($reopen = false) {
		// Return cached default store if we have one
		if (!$reopen && isset($this->defaultstore, $this->stores[$this->defaultstore])) {
			return $this->stores[$this->defaultstore];
		}

		$this->loadMessageStoresFromSession();

		return $this->openMessageStore($this->defaultstore, 'Default store');
	}

	/**
	 * The default messagestore entryid.
	 *
	 * @return string the entryid of the default messagestore
	 */
	public function getDefaultMessageStoreEntryId() {
		if (!isset($this->defaultstore)) {
			$this->loadMessageStoresFromSession();
		}

		return bin2hex($this->defaultstore);
	}

	/**
	 * Get single store if we are opening full store.
	 *
	 * @param object $store        the store of the user
	 * @param array  $storeOptions contains folder_type of which folder to open
	 *                             It is mapped to username, If folder_type is 'all' (i.e. Open Entire Inbox)
	 *                             then we will open full store.
	 * @param string $username     The username
	 *
	 * @return array storeArray The array of stores containing user's store
	 */
	public function getSingleMessageStores($store, $storeOptions, $username) {
		return [$store];
	}

	/**
	 * Get the public message store.
	 *
	 * The store is opened only once, subsequent calls will return the previous store object
	 *
	 * @return mapistore Public message store object
	 */
	public function getPublicMessageStore() {
		// Return cached public store if we have one
		if (isset($this->publicStore, $this->stores[$this->publicStore])) {
			return $this->stores[$this->publicStore];
		}

		$this->loadMessageStoresFromSession();

		return $this->openMessageStore($this->publicStore, 'Public store');
	}

	/**
	 * Get all message stores currently open in the session.
	 *
	 * @return array Associative array with entryid -> mapistore of all open stores (private, public, delegate)
	 */
	public function getAllMessageStores() {
		$this->getDefaultMessageStore();
		$this->getPublicMessageStore();
		// The cache now contains all the stores in our profile. Next, add the stores
		// for other users.
		$this->getOtherUserStore();

		// Just return all the stores in our cache, even if we have some error in mapi
		return $this->stores;
	}

	/**
	 * Open the message store with entryid $entryid.
	 *
	 * @param string $entryid string representation of the binary entryid of the store
	 * @param string $name    The name of the store. Will be logged when opening fails.
	 *
	 * @return mapistore The opened store on success, false otherwise
	 */
	public function openMessageStore($entryid, $name = '') {
		// Check the cache before opening
		foreach ($this->stores as $storeEntryId => $storeObj) {
			if ($GLOBALS["entryid"]->compareEntryIds(bin2hex($entryid), bin2hex($storeEntryId))) {
				return $storeObj;
			}
		}

		try {
			$store = mapi_openmsgstore($this->session, $entryid);
			$store_props = mapi_getprops($store, [PR_ENTRYID]);
			$entryid = $store_props[PR_ENTRYID];

			// Cache the store for later use
			$this->stores[$entryid] = $store;
			$this->userstores[$name] = $entryid;
		}
		catch (MAPIException $e) {
			error_log('Failed to open store. ' . $this->session_info["username"] .
					  ' requested ' . bin2hex($entryid) . ($name ? " ({$name})" : ''));

			return $e->getCode();
		}
		catch (Exception $e) {
			// mapi_openmsgstore seems to throw another exception than MAPIException
			// sometimes, so we add a safety net.
			error_log('Failed to open store. ' . $this->session_info["username"] .
					  ' requested ' . bin2hex($entryid) . ($name ? " ({$name})" : ''));

			return $e->getCode();
		}

		return $store;
	}

	/**
	 * Get all the available shared stores.
	 *
	 * The store is opened only once, subsequent calls will return the previous store object
	 */
	public function getOtherUserStore() {
		$otherusers = $this->retrieveOtherUsersFromSettings();
		$otherUsersStores = [];

		foreach ($otherusers as $username => $folder) {
			if (isset($this->userstores[$username])) {
				continue;
			}
			$storeOk = true;

			if (is_array($folder) && !empty($folder)) {
				try {
					$user_entryid = mapi_msgstore_createentryid($this->getDefaultMessageStore(), $username);

					$sharedStore = $this->openMessageStore($user_entryid, $username);
					if ($sharedStore === false && $sharedStore === ecLoginPerm &&
						$sharedStore === MAPI_E_CALL_FAILED && $sharedStore === MAPI_E_NOT_FOUND) {
						$storeOk = false;
					}
				}
				catch (MAPIException $e) {
					if ($e->getCode() == MAPI_E_NOT_FOUND) {
						// The user or the corresponding store couldn't be found,
						// print an error to the log, and remove the user from the settings.
						dump('Failed to load store for user ' . $username . ', user was not found. Removing it from settings.');
						$GLOBALS["settings"]->delete("zarafa/v1/contexts/hierarchy/shared_stores/" . bin2hex($username), true);
					}
					else {
						// That is odd, something else went wrong. Lets not be hasty and preserve
						// the user in the settings, but do print something to the log to indicate
						// something happened...
						dump('Failed to load store for user ' . $username . '. ' . $e->getDisplayMessage());
					}
				}
				finally {
					if (!$storeOk && ($sharedStore == ecLoginPerm || $sharedStore == MAPI_E_NOT_FOUND)) {
						// The user or the corresponding store couldn't be opened
						// (e.g. the user was deleted or permissions revoked),
						// print an error to the log, and remove the user from the settings.
						dump(sprintf("The user %s failed to load store of the user %s. Removing it from settings.", $this->session_info["username"], $username));
						$GLOBALS["settings"]->delete("zarafa/v1/contexts/hierarchy/shared_stores/" . bin2hex($username), true);
					}
				}
			}
		}

		foreach ($this->userstores as $entryid) {
			$otherUsersStores[$entryid] = $this->stores[$entryid];
		}

		return $otherUsersStores;
	}

	/**
	 * Resolve the username strictly by opening that user's store and returning the
	 * PR_MAILBOX_OWNER_ENTRYID. This can be used for resolving an username without the risk of
	 * ambiguity since mapi_ab_resolve() does not strictly resolve on the username.
	 *
	 * @param string $username The username
	 *
	 * @return Binary|int Entryid of the user on success otherwise the hresult error code
	 */
	public function resolveStrictUserName($username) {
		$storeEntryid = mapi_msgstore_createentryid($this->getDefaultMessageStore(), $username);
		$store = $this->openMessageStore($storeEntryid, $username);
		$storeProps = mapi_getprops($store, [PR_MAILBOX_OWNER_ENTRYID]);

		return $storeProps[PR_MAILBOX_OWNER_ENTRYID];
	}

	/**
	 * Get other users from settings.
	 *
	 * @return array Array of usernames of delegate stores
	 */
	public function retrieveOtherUsersFromSettings() {
		$other_users = $GLOBALS["settings"]->get("zarafa/v1/contexts/hierarchy/shared_stores", []);
		$result = [];
		foreach ($other_users as $username => $folders) {
			// No folders are being shared, the store has probably been closed by the user,
			// but the username is still lingering in the settings...
			if (!isset($folders) || empty($folders)) {
				continue;
			}

			$username = strtolower(hex2bin((string) $username));
			if (!isset($result[$username])) {
				$result[$username] = [];
			}

			foreach ($folders as $folder) {
				if (is_array($folder)) {
					$result[$username][$folder["folder_type"]] = [];
					$result[$username][$folder["folder_type"]]["folder_type"] = $folder["folder_type"];
					$result[$username][$folder["folder_type"]]["show_subfolders"] = $folder["show_subfolders"];
				}
			}
		}

		return $result;
	}

	/**
	 * Add the store of another user to the list of other user stores.
	 *
	 * @param string $username The username whose store should be added to the list of other users' stores
	 *
	 * @return mapistore The store of the user or false on error;
	 */
	public function addUserStore($username) {
		$user_entryid = mapi_msgstore_createentryid($this->getDefaultMessageStore(), $username);

		if ($user_entryid) {
			// mapi_msgstore_createentryid and mapi_getprops(PR_ENTRYID) have different
			// values for shared stores, so save the one from mapi_getprops(PR_ENTRYID)
			// $this->userstores[$username] = $user_entryid;

			return $this->openMessageStore($user_entryid, $username);
		}
	}

	/**
	 * Remove the store of another user from the list of other user stores.
	 *
	 * @param string $username The username whose store should be deleted from the list of other users' stores
	 *
	 * @return string The entryid of the store which was removed
	 */
	public function removeUserStore($username) {
		// Remove the reference to the store if we had one
		if (isset($this->userstores[$username])) {
			$entryid = $this->userstores[$username];
			unset($this->userstores[$username], $this->stores[$entryid]);

			return $entryid;
		}
	}

	/**
	 * Get the store entryid of the specified user.
	 *
	 * The store must have been previously added via addUserStores.
	 *
	 * @param string $username The username whose store is being looked up
	 *
	 * @return string The entryid of the store of the user
	 */
	public function getStoreEntryIdOfUser($username) {
		return $this->userstores[$username];
	}

	/**
	 * Get the username of the user store.
	 *
	 * @param string $username the loginname of whom we want to full name
	 *
	 * @return string the display name of the user
	 */
	public function getDisplayNameofUser($username) {
		$user_entryid = $this->getStoreEntryIdOfUser($username);
		$store = $this->openMessageStore($user_entryid, $username);
		$props = mapi_getprops($store, [PR_DISPLAY_NAME]);

		return str_replace('Inbox - ', '', $props[PR_DISPLAY_NAME]);
	}

	/**
	 * Get the username of the owner of the specified store.
	 *
	 * The store must have been previously added via addUserStores.
	 *
	 * @param string $entryid EntryID of the store
	 *
	 * @return string Username of the specified store or false if it is not found
	 */
	public function getUserNameOfStore($entryid) {
		foreach ($this->userstores as $username => $storeentryid) {
			if ($GLOBALS["entryid"]->compareEntryIds(bin2hex((string) $storeentryid), bin2hex($entryid))) {
				return $username;
			}
		}

		return false;
	}

	/**
	 * Open a MAPI message using session object.
	 * The function is used to open message when we dont' know
	 * the specific store and we want to open message using entryid.
	 *
	 * @param string $entryid entryid of the message
	 *
	 * @return object MAPI Message
	 */
	public function openMessage($entryid) {
		return mapi_openentry($this->session, $entryid);
	}

	/**
	 * Setup the contact provider for the addressbook. It asks getContactFoldersForABContactProvider
	 * for the entryids and display names for the contact folders in the user's store.
	 *
	 * @param bool $loadSharedContactsProvider when set to true it denotes that shared folders are
	 *                                         required to be configured to load the contacts from
	 */
	public function setupContactProviderAddressbook($loadSharedContactsProvider) {
		$profsect = mapi_openprofilesection($GLOBALS['mapisession']->getSession(), pbGlobalProfileSectionGuid);
		if ($profsect) {
			// Get information about all contact folders from own store, shared stores and public store
			$defaultStore = $this->getDefaultMessageStore();
			$contactFolders = $this->getContactFoldersForABContactProvider($defaultStore);

			// include shared contact folders in addressbook if shared contact folders are enabled
			if (ENABLE_SHARED_CONTACT_FOLDERS && $loadSharedContactsProvider) {
				if (empty($this->userstores)) {
					$this->getOtherUserStore();
				}

				$sharedSetting = $GLOBALS["settings"]->get("zarafa/v1/contexts/hierarchy/shared_stores", []);
				// Find available contact folders from all user stores, one by one.
				foreach ($this->userstores as $username => $storeEntryID) {
					$userContactFolders = [];
					$sharedUserSetting = [];
					$openedUserStore = $this->openMessageStore($storeEntryID, $username);

					// Get settings of respective shared folder of given user
					if (array_key_exists(strtolower(bin2hex($username)), $sharedSetting)) {
						$sharedUserSetting = $sharedSetting[strtolower(bin2hex($username))];
					}

					// Only add opened shared folders into addressbook contacts provider.
					// If entire inbox is opened then add each and every contact folders of that particular user.
					if (isset($sharedUserSetting['all'])) {
						$userContactFolders = $this->getContactFoldersForABContactProvider($openedUserStore);
					}
					elseif (isset($sharedUserSetting['contact'])) {
						// Add respective default contact folder which is opened.
						// Get entryid of default contact folder from root.
						$root = mapi_msgstore_openentry($openedUserStore);
						$rootProps = mapi_getprops($root, [PR_IPM_CONTACT_ENTRYID]);

						// Just add the default contact folder only.
						$defaultContactFolder = [
							PR_STORE_ENTRYID => $storeEntryID,
							PR_ENTRYID => $rootProps[PR_IPM_CONTACT_ENTRYID],
							PR_DISPLAY_NAME => _("Contacts"),
						];
						array_push($userContactFolders, $defaultContactFolder);

						// Go for sub folders only if configured in settings
						if ($sharedUserSetting['contact']['show_subfolders'] == true) {
							$subContactFolders = $this->getContactFolders($openedUserStore, $rootProps[PR_IPM_CONTACT_ENTRYID], true);
							if (is_array($subContactFolders)) {
								$userContactFolders = array_merge($userContactFolders, $subContactFolders);
							}
						}
					}

					// Postfix display name of every contact folder with respective owner name
					// it is mandatory to keep display-name different
					$userStoreProps = mapi_getprops($openedUserStore, [PR_MAILBOX_OWNER_NAME]);
					for ($i = 0,$len = count($userContactFolders); $i < $len; ++$i) {
						$userContactFolders[$i][PR_DISPLAY_NAME] = $userContactFolders[$i][PR_DISPLAY_NAME] . " - " . $userStoreProps[PR_MAILBOX_OWNER_NAME];
					}

					$contactFolders = array_merge($contactFolders, $userContactFolders);
				}
			}

			// Include public contact folders in addressbook if public folders and public contacts folders are enabled
			if (ENABLE_PUBLIC_CONTACT_FOLDERS && ENABLE_PUBLIC_FOLDERS) {
				$publicStore = $this->getPublicMessageStore();
				if ($publicStore !== false) {
					$contactFolders = array_merge($contactFolders, $this->getContactFoldersForABContactProvider($publicStore));
				}
			}
			// TODO: The shared stores are not opened as there still is a bug that does not allow resolving from shared contact folders

			// These lists will be used to put set in the profile section
			$contact_store_entryids = [];
			$contact_folder_entryids = [];
			$contact_folder_names = [];

			// Create the lists of store entryids, folder entryids and folder names to be added
			// to the profile section
			for ($i = 0, $len = count($contactFolders); $i < $len; ++$i) {
				$contact_store_entryids[] = $contactFolders[$i][PR_STORE_ENTRYID];
				$contact_folder_entryids[] = $contactFolders[$i][PR_ENTRYID];
				$contact_folder_names[] = $contactFolders[$i][PR_DISPLAY_NAME];
			}

			if (!empty($contact_store_entryids)) {
				// add the defaults contacts folder in the addressbook hierarchy under 'Contacts Folders'
				mapi_setprops($profsect, [PR_ZC_CONTACT_STORE_ENTRYIDS => $contact_store_entryids,
					PR_ZC_CONTACT_FOLDER_ENTRYIDS => $contact_folder_entryids,
					PR_ZC_CONTACT_FOLDER_NAMES => $contact_folder_names, ]);
			}
		}
	}

	/**
	 * Get the store entryid, folder entryid and display name of the contact folders in the
	 * user's store. It returns an array prepared by getContactFolders.
	 *
	 * @param mapiStore $store The mapi store to look for folders in
	 *
	 * @return array Contact folder information
	 */
	public function getContactFoldersForABContactProvider($store) {
		$storeProps = mapi_getprops($store, [PR_ENTRYID, PR_MDB_PROVIDER, PR_IPM_SUBTREE_ENTRYID, PR_IPM_PUBLIC_FOLDERS_ENTRYID]);
		$contactFolders = [];

		try {
			// Only searches one level deep, otherwise deleted contact folders will also be included.
			$contactFolders = $this->getContactFolders($store, $storeProps[PR_IPM_SUBTREE_ENTRYID], $storeProps[PR_MDB_PROVIDER] === ZARAFA_STORE_PUBLIC_GUID ? true : false);
		}
		catch (Exception $e) {
			return $contactFolders;
		}

		// Need to search all the contact-subfolders within first level contact folders.
		if ($storeProps[PR_MDB_PROVIDER] != ZARAFA_STORE_PUBLIC_GUID) {
			$firstLevelHierarchyNodes = $contactFolders;
			foreach ($firstLevelHierarchyNodes as $firstLevelNode) {
				// To search for multiple levels CONVENIENT_DEPTH needs to be passed as well.
				$contactFolders = array_merge($contactFolders, $this->getContactFolders($store, $firstLevelNode[PR_ENTRYID], true));
			}
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
	 * ).
	 *
	 * @param mapiStore $store         The mapi store of the user
	 * @param string    $folderEntryid EntryID of the folder to look for contact folders in
	 * @param int       $depthSearch   flag to search into all the folder levels
	 *
	 * @return array an array in which founded contact-folders will be pushed
	 */
	public function getContactFolders($store, $folderEntryid, $depthSearch) {
		$restriction = [RES_CONTENT,
			[
				// Fuzzylevel PF_PREFIX also allows IPF.Contact.Custom folders to be included.
				// Otherwise FL_FULLSTRING would only allow IPF.Contact folders.
				FUZZYLEVEL => FL_PREFIX,
				ULPROPTAG => PR_CONTAINER_CLASS,
				VALUE => [
					PR_CONTAINER_CLASS => "IPF.Contact",
				],
			],
		];

		// Set necessary flag(s) to search considering all the sub folders or not
		$depthFlag = MAPI_DEFERRED_ERRORS;
		if ($depthSearch) {
			$depthFlag |= CONVENIENT_DEPTH;
		}

		$hierarchyFolder = mapi_msgstore_openentry($store, $folderEntryid);

		// Filter-out contact folders only
		$contactFolderTable = mapi_folder_gethierarchytable($hierarchyFolder, $depthFlag);
		mapi_table_restrict($contactFolderTable, $restriction, TBL_BATCH);

		return mapi_table_queryallrows($contactFolderTable, [PR_STORE_ENTRYID, PR_ENTRYID, PR_DISPLAY_NAME, PR_PARENT_ENTRYID, PR_DEPTH]);
	}

	/**
	 * Obtains server version from the PR_EC_SERVER_VERSION property.
	 */
	public function getServerVersion() {
		$props = mapi_getprops($this->getDefaultMessageStore(), [PR_EC_SERVER_VERSION]);
		if (propIsError(PR_EC_SERVER_VERSION, $props) === MAPI_E_NOT_FOUND) {
			return '';
		}

		return $props[PR_EC_SERVER_VERSION];
	}

	/**
	 * Checks if the entryid is of the public store.
	 *
	 * @param string $entryid
	 *
	 * @return bool true if public store entryid false otherwise
	 */
	public function isPublicStore($entryid) {
		return $GLOBALS["entryid"]->compareEntryIds(bin2hex($this->publicStore), $entryid);
	}
}
