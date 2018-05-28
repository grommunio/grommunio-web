<?php

require_once( BASE_PATH . 'server/includes/mapi/mapicode.php');

require_once( BASE_PATH . 'server/includes/core/class.encryptionstore.php');
require_once( BASE_PATH . 'server/includes/core/class.webappsession.php');
require_once( BASE_PATH . 'server/includes/core/class.mapisession.php');
require_once( BASE_PATH . 'server/includes/core/class.browserfingerprint.php');

/**
 * Class that handles authentication.
 * @singleton
 */
class WebAppAuthentication
{
	/**
	 * @var self|null A reference to the only instance of this class
	 */
	private static $_instance = null;

	/**
	 * @var boolean|false True if the user is authenticated, false otherwise
	 */
	private static $_authenticated = false;

	/**
	 * @var WebAppSession|null A reference to the php session object
	 */
	private static $_phpSession = null;

	/**
	 * @var MapiSession|null A reference to the MapiSession object
	 */
	private static $_mapiSession = null;

	/**
	 * @var integer|0 An code that reflects the latest error
	 * @see server/includes/mapi/mapicodes.php
	 */
	private static $_errorCode = NOERROR;

	/**
	 * @var boolean True if MAPI session savng support exists
	 */
	private static $_sessionSaveSupport = false;

	/**
	 * Returns the only instance of the WebAppAuthentication class.
	 * If it does not exist yet, it will create an instance, and
	 * also an MapiSession object, and it will start a php session
	 * by instantiating a WebAppSession.
	 * @return self
	 */
	public static function getInstance() {
		if ( is_null(WebAppAuthentication::$_instance) ) {

			// Make sure a php session is started
			WebAppAuthentication::$_phpSession = WebAppSession::getInstance();

			// Instantiate this class
			WebAppAuthentication::$_instance = new WebAppAuthentication();

			// Instantiate the mapiSession
			WebAppAuthentication::$_mapiSession = new MapiSession();

			// Check if MAPI Saving session support exists
			WebAppAuthentication::$_sessionSaveSupport = function_exists('kc_session_save') && function_exists('kc_session_restore');
		}

		return WebAppAuthentication::$_instance;
	}

	/**
	 * Returns the error code of the last logon attempt
	 * @return integer
	 */
	public static function getErrorCode() {
		return WebAppAuthentication::$_errorCode;
	}
	/**
	 * Returns an error message that goed with the error code of
	 * the last logon attempt.
	 * @return string
	 */
	public static function getErrorMessage() {
		switch (WebAppAuthentication::getErrorCode()){
			case NOERROR:
				return '';
			case MAPI_E_LOGON_FAILED:
			case MAPI_E_UNCONFIGURED:
				return  _('Logon failed. Please verify your credentials and try again.');
			case MAPI_E_NETWORK_ERROR:
				return _('Cannot connect to Kopano Core.');
			case MAPI_E_INVALID_WORKSTATION_ACCOUNT:
				return _('Login did not work due to a duplicate session. The issue was automatically resolved, please log in again.');
			case MAPI_E_END_OF_SESSION:
				return '';
			default:
				return _('Unknown MAPI Error') . ': ' . get_mapi_error_name(WebAppAuthentication::getErrorCode());
		}
	}

	/**
	 * Returns the MapiSession instance
	 * @see server/includes/core/class.mapisession.php
	 * @return MapiSession
	 */
	public static function getMapiSession() {
		return WebAppAuthentication::$_mapiSession;
	}

	/**
	 * Set the MapiSession instance
	 * @param MAPISession $session the mapisession to set
	 */
	public static function setMapiSession($session) {
		WebAppAuthentication::$_mapiSession->setSession($session);
	}

	/**
	 * Tries to authenticate the user. First it will check if the user
	 * should be authenticated using single-sign-on. If not it will
	 * check if the user is using the login-form. And finally if not of
	 * above methods apply, it will try to find credentials in the
	 * php session.
	 */
	public static function authenticate() {

		// First check if the user is authenticating using SSO
		if ( WebAppAuthentication::isUsingSingleSignOn() ){
			WebAppAuthentication::_authenticateWithSingleSignOn();

		// Then check if login credentials were posted
		} elseif ( WebAppAuthentication::isUsingLoginForm() ){
			WebAppAuthentication::authenticateWithPostedCredentials();

		// At last check if we have credentials in the session
		// and if found, try to login with those
		} else {
			WebAppAuthentication::_authenticateWithSession();
		}
	}

	/**
	 * Returns true if a user is authenticated, or false otherwise
	 * @return boolean
	 */
	public static function isAuthenticated() {
		return WebAppAuthentication::$_authenticated;
	}

	/**
	 * Tries to logon to Kopano Core with the given username and password. Returns
	 * the error code that was given back.
	 * @param string $username The username
	 * @param string $password The password
	 * @return integer
	 */
	public static function login($username, $password) {
		$sslcert_file = defined('SSLCERT_FILE') ? SSLCERT_FILE : null;
		$sslcert_pass = defined('SSLCERT_PASS') ? SSLCERT_PASS : null;

		if (!WebAppAuthentication::_restoreMAPISession()) {
			// TODO: move logon from MapiSession to here
			WebAppAuthentication::$_errorCode = WebAppAuthentication::$_mapiSession->logon(
				$username,
				$password,
				DEFAULT_SERVER,
				$sslcert_file,
				$sslcert_pass
			);

			if (WebAppAuthentication::$_errorCode === NOERROR ) {
				WebAppAuthentication::$_authenticated = true;
				WebAppAuthentication::_storeMAPISession(WebAppAuthentication::$_mapiSession->getSession());
			} elseif ( WebAppAuthentication::$_errorCode == MAPI_E_LOGON_FAILED || WebAppAuthentication::$_errorCode == MAPI_E_UNCONFIGURED ) {
				// Print error message to error_log of webserver
				error_log('Kopano WebApp user: ' . $username . ': authentication failure at MAPI');
			}
		}

		return WebAppAuthentication::$_errorCode;
	}

	/**
	 * Store a serialized MAPI Session, which can be used by _restoreMAPISession to re-create
	 * a MAPISession, which saves a login call.
	 *
	 * @param MAPISession $session the session to serialize and save
	 */
	private static function _storeMAPISession($session) {
		if (!WebAppAuthentication::$_sessionSaveSupport) {
			return;
		}

		$encryptionStore = EncryptionStore::getInstance();

		if (kc_session_save($session, $data) === NOERROR) {
			$encryptionStore->add('savedsession', bin2hex($data));
		}

	}

	/**
	 * Restore a MAPISession from the serialized with kc_session_restore.
	 *
	 * @return boolean true if session has been restored succesfully
	 */
	private static function _restoreMAPISession() {
		$encryptionStore = EncryptionStore::getInstance();

		if (!WebAppAuthentication::$_sessionSaveSupport || $encryptionStore->get('savedsession') === null) {
			return false;
		}

		if (kc_session_restore(hex2bin($encryptionStore->get('savedsession')), $session) === NOERROR) {
			WebAppAuthentication::$_errorCode = NOERROR;
			WebAppAuthentication::$_authenticated = true;
			WebAppAuthentication::setMapiSession($session);
			return true;
		}

		return false;
	}

	/**
	 * Stores the given username and password in the session using the encryptionstore
	 * @param string The username
	 * @param string The password
	 */
	private static function _storeCredentialsInSession($username, $password) {
		$encryptionStore = EncryptionStore::getInstance();
		$encryptionStore->add('username', $username);
		$encryptionStore->add('password', $password);
	}

	/**
	 * Checks if a user should be logged in using Single Sign-On.
	 * @return boolean
	 */
	public static function isUsingSingleSignOn() {
		// First check if the admin disabled using SSO on SSO systems
		if ( DISABLE_REMOTE_USER_LOGIN ){
			return false;
		}

		// REMOTE_USER is set when apache has authenticated the user,
		// meaning Single Sign-on environment is in effect.
		return isset($_SERVER['REMOTE_USER']);
	}

	/**
	 * Tries to authenticate the user by using Single Sign-On. Returns
	 * the error code from the logon attempt.
	 * @return integer
	 */
	private static function _authenticateWithSingleSignOn() {
		// Check if we should strip the domain to get the username
		if ( LOGINNAME_STRIP_DOMAIN ) {
			// WebApp supports two types of SSO: NTLM and Kerberos. They use different methods
			// to store the domain with the username in $_SERVER['REMOTE_USER'], so we must
			// check which type of SSO we are facing before we can strip the domain from the
			// username.
			// NTLM uses DOMAIN\\username
			// Kerberos uses username@DOMAIN
			if ( strpos($_SERVER['REMOTE_USER'], '\\') !== false ){
				// NTLM
				$username = preg_replace('/.*\\\\/', '', $_SERVER['REMOTE_USER']);
			} else {
				// Kerberos
				$username = preg_replace('/@.*/', '', $_SERVER['REMOTE_USER']);
			}
		} else {
			$username = $_SERVER['REMOTE_USER'];
		}

		WebAppAuthentication::login($username, '');

		// Store the username in the session if logging in was successful
		if ( WebAppAuthentication::$_errorCode === NOERROR ){
			WebAppAuthentication::_storeCredentialsInSession($username, '');
		}

		return WebAppAuthentication::getErrorCode();
	}

	/**
	 * Checks if a user tries to log in by submitting the login form.
	 * @return boolean
	 */
	public static function isUsingLoginForm() {
		// Login form is only found on index.php
		// If we don't check it, then posting to kopano.php would
		// also make authenticating possible.
		if ( basename($_SERVER['SCRIPT_NAME']) !== 'index.php' ){
			return false;
		}

		return isset($_POST) && isset($_POST['username']) && isset($_POST['password']);
	}

	/**
	 * Tries to authenticate the user with credentials that were posted.
	 * Returns the error code from the logon attempt.
	 * @return integer
	 */
	public static function authenticateWithPostedCredentials() {

		if (empty($_POST['username']) || empty($_POST['password'])) {
			WebAppAuthentication::$_errorCode = MAPI_E_LOGON_FAILED;
			return WebAppAuthentication::getErrorCode();
		}

		// Check if a session is already running and if the credentials match
		$encryptionStore = EncryptionStore::getInstance();
		$username = $encryptionStore->get('username');
		$password = $encryptionStore->get('password');

		if ( !is_null($username) && !is_null($password) ){
			if ( $username!=$_POST['username'] || $password!=$_POST['password'] ) {
				WebAppAuthentication::$_errorCode = MAPI_E_INVALID_WORKSTATION_ACCOUNT;
				WebAppAuthentication::$_phpSession->destroy();
				return WebAppAuthentication::getErrorCode();
			}
		} else {
			// If no session is currently running, then store a fingerprint of the requester
			// in the session.
			$_SESSION['fingerprint'] = BrowserFingerprint::getFingerprint();
		}

		// Give the session a new id
		session_regenerate_id();

		WebAppAuthentication::login($_POST['username'], $_POST['password']);

		// Store the credentials in the session if logging in was succesfull
		if ( WebAppAuthentication::$_errorCode === NOERROR ){
			WebAppAuthentication::_storeCredentialsInSession($_POST['username'], $_POST['password']);
		}

		return WebAppAuthentication::getErrorCode();
	}

	/**
	 * Tries to authenticate the user with credentials from the session. When credentials
	 * are found in the session it will return the error code from the logon attempt with
	 * those credentials, otherwise it will return void.
	 *
	 * Before trying to logon, it will compare the requesters fingerprint with the
	 * fingerprint stored in the session. If they are not the same, the session will be
	 * destroyed and the script will be killed.
	 * @return integer|void
	 */
	private static function _authenticateWithSession() {

		// Check if the session hasn't timed out
		if ( WebAppAuthentication::$_phpSession->hasTimedOut() ){
			// Using a MAPI error code here, while it is not really a MAPI session timeout
			// However to the user this should make no difference, so the MAPI error will do.
			WebAppAuthentication::$_errorCode = MAPI_E_END_OF_SESSION;
			return WebAppAuthentication::getErrorCode();
		}

		// Now check if we stored credentials in the session (in the encryption store)
		$encryptionStore = EncryptionStore::getInstance();
		$username = $encryptionStore->get('username');
		$password = $encryptionStore->get('password');
		if ( is_null($username) || is_null($password) ){
			return;
		}

		// Check if the browser fingerprint is the same as that of the browser that was
		// used to login in the first place.
		if ( $_SESSION['fingerprint'] !== BrowserFingerprint::getFingerprint() ){
			// Something bad has happened. This must be someone who stole a session cookie!!!
			// We will delete the session and stop the script without any error message
			WebAppAuthentication::$_phpSession->destroy();
			die();
		}

		return WebAppAuthentication::login($username, $password);
	}

	/**
	 * Returns the username that is stored in the session
	 * @return string
	 */
	public static function getUserName() {
		$encryptionStore = EncryptionStore::getInstance();
		return $encryptionStore->get('username');
	}
}

// Instantiate the class
WebAppAuthentication::getInstance();
