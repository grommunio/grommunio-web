<?php

require_once UMAPI_PATH . '/mapi.util.php';
require_once UMAPI_PATH . '/class.keycloak.php';

require_once BASE_PATH . 'server/includes/core/class.encryptionstore.php';
require_once BASE_PATH . 'server/includes/core/class.webappsession.php';
require_once BASE_PATH . 'server/includes/core/class.mapisession.php';
require_once BASE_PATH . 'server/includes/core/class.browserfingerprint.php';

/*
* Class that handles authentication.
*
* @singleton
*/
class WebAppAuthentication {
	/**
	 * @var null|self A reference to the only instance of this class
	 */
	private static $_instance;

	/**
	 * @var bool|false True if the user is authenticated, false otherwise
	 */
	private static $_authenticated = false;

	/**
	 * @var null|WebAppSession A reference to the php session object
	 */
	private static $_phpSession;

	/**
	 * @var null|MAPISession A reference to the MAPISession object
	 */
	private static $_mapiSession;

	/**
	 * @var 0|int An code that reflects the latest error
	 *
	 * @see $UMAPI_PATH/mapicodes.php
	 */
	private static $_errorCode = NOERROR;

	/**
	 * @var bool True if MAPI session savng support exists
	 */
	private static $_sessionSaveSupport = false;

	/**
	 * Returns the only instance of the WebAppAuthentication class.
	 * If it does not exist yet, it will create an instance, and
	 * also an MAPISession object, and it will start a php session
	 * by instantiating a WebAppSession.
	 *
	 * @return self
	 */
	public static function getInstance() {
		if (is_null(WebAppAuthentication::$_instance)) {
			// Make sure a php session is started
			WebAppAuthentication::$_phpSession = WebAppSession::getInstance();

			// Instantiate this class
			WebAppAuthentication::$_instance = new WebAppAuthentication();

			// Instantiate the mapiSession
			WebAppAuthentication::$_mapiSession = new MAPISession();

			// Check if MAPI Saving session support exists
			WebAppAuthentication::$_sessionSaveSupport = function_exists('kc_session_save') && function_exists('kc_session_restore');
		}

		return WebAppAuthentication::$_instance;
	}

	/**
	 * Returns the error code of the last logon attempt.
	 *
	 * @return int
	 */
	public static function getErrorCode() {
		return WebAppAuthentication::$_errorCode;
	}

	/**
	 * Returns an error message that goed with the error code of
	 * the last logon attempt.
	 *
	 * @return string
	 */
	public static function getErrorMessage() {
		return match (WebAppAuthentication::getErrorCode()) {
			NOERROR => '',
			ecUnknownUser, MAPI_E_LOGON_FAILED, MAPI_E_UNCONFIGURED => _('Logon failed. Please verify your credentials and try again.'),
			MAPI_E_NETWORK_ERROR => _('Cannot connect to Gromox.'),
			MAPI_E_INVALID_WORKSTATION_ACCOUNT => _('Login did not work due to a duplicate session. The issue was automatically resolved, please log in again.'),
			MAPI_E_END_OF_SESSION => '',
			default => _('Unknown MAPI Error') . ': ' . get_mapi_error_name(WebAppAuthentication::getErrorCode()),
		};
	}

	/**
	 * Returns the MAPISession instance.
	 *
	 * @see server/includes/core/class.mapisession.php
	 *
	 * @return MAPISession
	 */
	public static function getMAPISession() {
		return WebAppAuthentication::$_mapiSession;
	}

	/**
	 * Set the MAPISession instance.
	 *
	 * @param MAPISession $session the mapisession to set
	 */
	public static function setMAPISession($session) {
		WebAppAuthentication::$_mapiSession->setSession($session);
	}

	/**
	 * Tries to authenticate the user. First it will check if the
	 * user is using the login-form. And finally if not of above
	 * methods apply, it will try to find credentials in the
	 * php session.
	 */
	public static function authenticate() {
		WebAppAuthentication::regenerate_access_token();
		if (isset($_GET['code']) && (!defined('DISABLE_KEYCLOAK') || !DISABLE_KEYCLOAK)) {
			WebAppAuthentication::authenticateWithAccessToken($_GET['code']);
		}
		elseif (WebAppAuthentication::isUsingLoginForm()) {
			WebAppAuthentication::authenticateWithPostedCredentials();
		}
		// At last check if we have credentials in the session
		// and if found, try to login with those
		else {
			WebAppAuthentication::_authenticateWithSession();
		}
	}

	/*
	* Checks if keycloak features are enabled and regenerates
	* the access token before expiration.
	*/
	public static function regenerate_access_token() {
		if (isset($_SESSION['_keycloak_auth'])) {
			$_keycloak_auth = $_SESSION['_keycloak_auth'];
			if (time() - $_keycloak_auth->get_last_refresh_time() > 280) {
				if (!$_keycloak_auth->refresh_grant_req() && !$_keycloak_auth->validate_grant()) {
					header('Location:' . $_keycloak_auth->login_url($_keycloak_auth->redirect_url) . '');
				}
				$token = $_keycloak_auth->access_token->get_payload();
				$user = $_keycloak_auth->access_token->get_claims('email');
				WebAppAuthentication::_storeCredentialsInSession($user, $token);
				$_keycloak_auth->set_last_refresh_time(time());
				$_SESSION['_keycloak_auth'] = $_keycloak_auth;
			}
		}
	}

	/**
	 * Returns true if a user is authenticated, or false otherwise.
	 *
	 * @return bool
	 */
	public static function isAuthenticated() {
		return WebAppAuthentication::$_authenticated;
	}

	/**
	 * Tries to logon to Gromox with the given username and password/token. Returns
	 * the error code that was given back.
	 *
	 * @param string $username The username
	 * @param string $pass     The password/token
	 *
	 * @return int
	 */
	public static function login($username, $pass) {
		if (!WebAppAuthentication::_restoreMAPISession()) {
			// TODO: move logon from MAPISession to here

			WebAppAuthentication::$_errorCode = isset($_SESSION['_keycloak_auth']) ?
				WebAppAuthentication::$_mapiSession->logon_token($username, $pass) :
				WebAppAuthentication::$_mapiSession->logon($username, $pass, DEFAULT_SERVER);

			// Include external login plugins to be loaded
			if (file_exists(BASE_PATH . 'extlogin.php')) {
				include BASE_PATH . 'extlogin.php';
			}
			if (WebAppAuthentication::$_errorCode === NOERROR) {
				WebAppAuthentication::$_authenticated = true;
				WebAppAuthentication::_storeMAPISession(WebAppAuthentication::$_mapiSession->getSession());
				$tmp = explode('@', $username);
				if (count($tmp) == 2) {
					setcookie('domainname', $tmp[1], ['expires' => time() + 31536000, 'path' => '/', 'domain' => '', 'secure' => true, 'httponly' => true, 'samesite' => 'Strict']);
				}
				$wa_title = WebAppAuthentication::$_mapiSession->getFullName();
				$companyname = WebAppAuthentication::$_mapiSession->getCompanyName();
				if (isset($companyname) && strlen($companyname) != 0) {
					$wa_title .= " ({$companyname})";
				}
				if (strlen($wa_title) != 0) {
					setcookie('webapp_title', $wa_title, ['expires' => time() + 31536000, 'path' => '/', 'domain' => '', 'secure' => true, 'httponly' => true, 'samesite' => 'Strict']);
				}
			}
			elseif (WebAppAuthentication::$_errorCode == MAPI_E_LOGON_FAILED || WebAppAuthentication::$_errorCode == MAPI_E_UNCONFIGURED) {
				error_log('grommunio Web user: ' . $username . ': authentication failure at MAPI');
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
		$data = '';
		if (kc_session_save($session, $data) === NOERROR) {
			$encryptionStore->add('savedsession', bin2hex((string) $data));
		}
	}

	/**
	 * Restore a MAPISession from the serialized with kc_session_restore.
	 *
	 * @return bool true if session has been restored successfully
	 */
	private static function _restoreMAPISession() {
		$encryptionStore = EncryptionStore::getInstance();

		if (!WebAppAuthentication::$_sessionSaveSupport || $encryptionStore->get('savedsession') === null) {
			return false;
		}

		if (kc_session_restore(hex2bin((string) $encryptionStore->get('savedsession')), $session) === NOERROR) {
			WebAppAuthentication::$_errorCode = NOERROR;
			WebAppAuthentication::$_authenticated = true;
			WebAppAuthentication::setMAPISession($session);

			return true;
		}

		return false;
	}

	/**
	 * Stores the given username and password in the session using the encryptionstore.
	 *
	 * @param string The username
	 * @param string The password
	 * @param mixed $username
	 * @param mixed $password
	 */
	private static function _storeCredentialsInSession($username, $password) {
		$encryptionStore = EncryptionStore::getInstance();
		$encryptionStore->add('username', $username);
		$encryptionStore->add('password', $password);
	}

	/**
	 * Checks if a user tries to log in by submitting the login form.
	 *
	 * @return bool
	 */
	public static function isUsingLoginForm() {
		// Login form is only found on index.php
		// If we don't check it, then posting to grommunio.php would
		// also make authenticating possible.
		if (basename((string) $_SERVER['SCRIPT_NAME']) !== 'index.php') {
			return false;
		}

		return isset($_POST) && isset($_POST['username'], $_POST['password']);
	}

	/**
	 * Tries to authenticate the user with credentials that were posted.
	 * Returns the error code from the logon attempt.
	 *
	 * @return int
	 */
	public static function authenticateWithPostedCredentials() {
		$email = appendDefaultDomain($_POST['username']);
		if (empty($email) || empty($_POST['password'])) {
			WebAppAuthentication::$_errorCode = MAPI_E_LOGON_FAILED;

			return WebAppAuthentication::getErrorCode();
		}
		// Check if a session is already running and if the credentials match
		$encryptionStore = EncryptionStore::getInstance();
		$username = $encryptionStore->get('username');
		$password = $encryptionStore->get('password');

		if (!is_null($username) && !is_null($password)) {
			if ($username != $email || $password != $_POST['password']) {
				WebAppAuthentication::$_errorCode = MAPI_E_INVALID_WORKSTATION_ACCOUNT;
				WebAppAuthentication::$_phpSession->destroy();

				return WebAppAuthentication::getErrorCode();
			}
		}
		else {
			// If no session is currently running, then store a fingerprint of the requester
			// in the session.
			$_SESSION['fingerprint'] = BrowserFingerprint::getFingerprint();
		}

		// Give the session a new id
		session_regenerate_id();

		WebAppAuthentication::login($email, $_POST['password']);

		// Store the credentials in the session if logging in was successful
		if (WebAppAuthentication::$_errorCode === NOERROR) {
			WebAppAuthentication::_storeCredentialsInSession($email, $_POST['password']);

			return WebAppAuthentication::getErrorCode();
		}

		return WebAppAuthentication::getErrorCode();
	}

	/**
	 * Login with Oauth2.0 keycloak access token.
	 * User selects login with keycloak, then gets redirected to keycloak server.
	 * If login is successful, the user is redirected with code grant back to gromox server.
	 * gromox requests access token with the received grant.
	 * keycloak server verifies grant, and sends access token.
	 * access token is used to authenticate user.
	 *
	 * @param mixed $code
	 */
	public static function authenticateWithAccessToken($code) {
		$keycloak = KeyCloak::getInstance();
		if (!is_null($keycloak)) {
			if ($keycloak->client_credential_grant_req($code) && $keycloak->validate_grant()) {
				$keycloak->set_last_refresh_time(time());
				$_SESSION['_keycloak_auth'] = $keycloak;

				if (isset($_SESSION['_keycloak_auth'])) {
					$email = appendDefaultDomain($_SESSION['_keycloak_auth']->access_token->get_claims('email'));
					$token = $_SESSION['_keycloak_auth']->access_token->get_payload();

					// Check if a session is already running and if the credentials match
					$encryptionStore = EncryptionStore::getInstance();
					$username = $encryptionStore->get('username');
					$password = $encryptionStore->get('password');

					if (!is_null($username) && !is_null($password)) {
						if ($username != $email || $password != $token) {
							WebAppAuthentication::$_errorCode = MAPI_E_INVALID_WORKSTATION_ACCOUNT;
							WebAppAuthentication::$_phpSession->destroy();

							return WebAppAuthentication::getErrorCode();
						}
					}
					else {
						// If no session is currently running, then store a fingerprint of the requester
						// in the session.
						$_SESSION['fingerprint'] = BrowserFingerprint::getFingerprint();
					}
					// Give the session a new id
					session_regenerate_id();

					WebAppAuthentication::login($email, $token);
					// Store the credentials in the session if logging in was successful
					if (WebAppAuthentication::$_errorCode === NOERROR) {
						WebAppAuthentication::_storeCredentialsInSession($email, $token);

						return WebAppAuthentication::getErrorCode();
					}
				}
			}
			header('Location:' . $keycloak->login_url($keycloak->redirect_url) . '');
		}

		return WebAppAuthentication::getErrorCode();
	}

	/**
	 * Logs the user in with a given username and token in $_POST and logs
	 * in with the special flag for token authentication enabled. If $new
	 * is true it's assumed that a session does not exists and there will
	 * be a new one generated and fingerprint stored in session which is
	 * later compared after logon. After successful logon the session is stored.
	 *
	 * @param bool $new true if user has no session yet
	 *
	 * @return int|void
	 */
	public static function authenticateWithToken($new = true) {
		if (empty($_POST['token'])) {
			WebAppAuthentication::$_errorCode = MAPI_E_LOGON_FAILED;

			return WebAppAuthentication::getErrorCode();
		}

		if ($new) {
			// If no session is currently running, then store a fingerprint of the requester
			// in the session.
			$_SESSION['fingerprint'] = BrowserFingerprint::getFingerprint();

			// Give the session a new id
			session_regenerate_id();
		}

		WebAppAuthentication::$_errorCode = WebAppAuthentication::getMAPISession()->logon(
			$_POST['username'],
			$_POST['token'],
			DEFAULT_SERVER,
			null,
			null,
			0
		);

		// Store the credentials in the session if logging in was successful
		if (WebAppAuthentication::$_errorCode === NOERROR) {
			WebAppAuthentication::_storeCredentialsInSession($_POST['username'], $_POST['token']);
			WebAppAuthentication::_storeMAPISession(WebAppAuthentication::$_mapiSession->getSession());
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
	 *
	 * @return int|void
	 */
	private static function _authenticateWithSession() {
		// Check if the session hasn't timed out
		if (WebAppAuthentication::$_phpSession->hasTimedOut()) {
			// Using a MAPI error code here, while it is not really a MAPI session timeout
			// However to the user this should make no difference, so the MAPI error will do.
			WebAppAuthentication::$_errorCode = MAPI_E_END_OF_SESSION;

			return WebAppAuthentication::getErrorCode();
		}

		// Now check if we stored credentials in the session (in the encryption store)
		$encryptionStore = EncryptionStore::getInstance();
		$username = $encryptionStore->get('username');
		$password = $encryptionStore->get('password');
		if (is_null($username) || is_null($password)) {
			return;
		}

		// Check if the browser fingerprint is the same as that of the browser that was
		// used to login in the first place.
		if ($_SESSION['fingerprint'] !== BrowserFingerprint::getFingerprint()) {
			// Something bad has happened. This must be someone who stole a session cookie!!!
			// We will delete the session and stop the script without any error message
			WebAppAuthentication::$_phpSession->destroy();

			exit;
		}

		return WebAppAuthentication::login($username, $password);
	}

	/**
	 * Returns the username that is stored in the session.
	 *
	 * @return string
	 */
	public static function getUserName() {
		$encryptionStore = EncryptionStore::getInstance();

		return $encryptionStore->get('username');
	}
}

// Instantiate the class
WebAppAuthentication::getInstance();
