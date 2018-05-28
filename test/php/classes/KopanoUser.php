<?php

/**
 * KopanoUser
 *
 * A helper class which will provide all necessary session information for a particular user.
 */
class KopanoUser {
	/**
	 * The Reference to the KopanoUser which is currently logged in.
	 */
	private static $currentUser;

	/**
	 * The username to logon to the session
	 */
	protected $username;

	/**
	 * The entryid of user which is logged on currently
	 */
	private $userEntryID;

	/**
	 * The password to logon to the session
	 */
	private $password;

	/**
	 * The server to logon to
	 */
	private $server;

	/**
	 * The default store for this user
	 */
	private $defaultStore;

	/**
	 * The shared stores opened by this user
	 */
	private $sharedStores;

	/**
	 * The session used by this user
	 */
	private $session;

	/**
	 * The MAPI Addressbook object for the current user
	 */
	private $ab;

	/**
	 * Constructor
	 * @param string $user The user to login with
	 * @param string $pwd The password for the user
	 * @param string $server The server to connect to
	 */
	public function __construct($user, $pwd, $server = false)
	{
		$this->username = $user;
		$this->password = $pwd;
		$this->server = $server;
	}

	/**
	 * Let the user logon to the server.
	 */
	public function logon()
	{
		if (self::$currentUser !== $this) {
			// Ensure that the other user is logged out cleanly
			if (self::$currentUser) {
				self::$currentUser->logout();
			}

			$this->preLogon();

			// Logon to the session
			$GLOBALS['mapisession']->logon($this->username, $this->password);

			$this->postLogon();

			self::$currentUser = $this;
			$this->defaultStore = null;
			$this->sharedStores = null;
			$this->session = null;
			$this->userEntryID = null;
			$this->ab = null;
		}
	}

	/**
	 * Function which can be overridden by subclasses to add some additional
	 * initialization steps as preperation for the logon of the user.
	 * @access protected
	 */
	protected function preLogon()
	{
		$GLOBALS['mapisession'] = new MAPISession("abcdef0123456789");
	}

	/**
	 * Function which can be overridden by subclasses to add some additional
	 * initialization steps after logon of the user.
	 * @access protected
	 */
	protected function postLogon()
	{
		// Reset the GLOBALS environment to ensure that we start
		// with a clean environment during each action.
		$GLOBALS['PluginManager'] = new PluginManager(false);
		$GLOBALS['dispatcher'] = new Dispatcher();
		$GLOBALS['operations'] = new Operations();
		$GLOBALS['settings'] = new Settings();
		$GLOBALS['bus'] =  new Bus();
		$GLOBALS['properties'] = new Properties();
		$GLOBALS['state'] = new State('webapp-test');
		$GLOBALS['attachment_state'] = new AttachmentState();
	}

	/**
	 * Let the user logout from the server.
	 */
	public function logout()
	{
		if (self::$currentUser === $this) {
			$this->preLogout();

			self::$currentUser = null;
			$this->defaultStore = null;
			$this->sharedStores = null;
			$this->session = null;
			$this->userEntryID = null;
			$this->ab = null;
		}
	}

	/**
	 * Function which can be overridden by subclasses to add some additional
	 * initialization steps as preperation for the logout of the user.
	 * @access protected
	 */
	protected function preLogout()
	{
		// Unset all globals.
		unset($GLOBALS['dispatcher']);
		unset($GLOBALS['mapisession']);
		unset($GLOBALS['operations']);
		unset($GLOBALS['properties']);
		unset($GLOBALS['PluginManager']);
		unset($GLOBALS['settings']);
		unset($GLOBALS['bus']);
		unset($GLOBALS['state']);
		unset($GLOBALS['attachment_state']);
	}

	/**
	 * @return String The username
	 */
	public function getUserName()
	{
		return $this->username;
	}

	/**
	 * @return RESOURCE The session object
	 */
	public function getSession()
	{
		$this->logon();

		if (!isset($this->session)) {
			$this->session = $GLOBALS['mapisession']->getSession();
		}

		return $this->session;
	}

	/**
	 * @return The default message store for this session
	 */
	public function getDefaultMessageStore()
	{
		$this->logon();

		if (!isset($this->defaultStore)) {
			$this->defaultStore = $GLOBALS['mapisession']->getDefaultMessageStore();
		}

		return $this->defaultStore;
	}

	/**
	 * Returns the store for the given user
	 * @param string $user The user for which the store should be opened
	 */
	public function getSharedStore($user)
	{
		$this->logon();

		if (!isset($this->sharedStores)) {
			$this->sharedStores = array();
		}

		if (!isset($this->sharedStores[$user])) {
			$this->sharedStores[$user] = $GLOBALS['mapisession']->addUserStore($user);
		}

		return $this->sharedStores[$user];
	}

	/**
	 * Returns entryid of the current user
	 * @return BinString entryid
	 */
	public function getUserEntryID()
	{
		$this->logon();

		if (!isset($this->userEntryID)) {
			$this->userEntryID = $GLOBALS['mapisession']->getUserEntryID();
		}

		return $this->userEntryID;
	}

	/**
	 * Returns MAPI addressbook object for current user
	 * @return MAPIAddressBook
	 */
	public function getAddressbook()
	{
		$this->logon();

		if (!isset($this->ab)) {
			$this->ab = $GLOBALS['mapisession']->getAddressbook();
		}

		return $this->ab;
	}
}
?>
