<?php

require_once( BASE_PATH . 'server/includes/core/class.webappsession.php');

/**
 * The EncryptionStore class can be used to store strings in an encrypted
 * way in the PHP session. The initialization vector will be stored in the
 * session, but the encryption key will be stored in a cookie.
 * This way the encrypted strings and the encryption key will not be 
 * stored on the same computer.
 * 
 * The class uses the openssl libs to handle the encryption. This means
 * that the openssl libs should be available on the system, and PHP
 * should be compiled with the following option --with-openssl[=DIR]
 * See http://php.net/manual/en/openssl.installation.php for more information.
 * 
 * @singleton
 */
class EncryptionStore
{
	/**
	 * Holds the only instance of this class
	 * @property
	 */
	private static $_instance = null;
	
	// TODO: Should this be moved to config.php???
	const _CIPHER_METHOD = 'aes-256-cbc';

	const _SESSION_KEY = 'encryption-store';

	private static $_initializionVector = '';
	private static $_encryptionKey = '';
	
	/**
	 * Will create a store and an initialization vector in the session
	 * if that hasn't been done yet.
	 */
	private function __construct() {
		// Make sure the php session is started
		WebAppSession::getInstance();

		// Create an encryption store in the session if it doesn't exist yet
		if ( !isset($_SESSION[EncryptionStore::_SESSION_KEY]) ){
			$_SESSION[EncryptionStore::_SESSION_KEY] = array();
		}

		// Check if we have an initializing vector stored in the session
		// If we don't, then we will create a new one, together with a new
		// encryption key
		$iv = $this->getInitializationVector();
		if ( empty($iv) ){
			$this->createInitializationVector();
			$this->createEncryptionKey();
		} else {
			// If there is a encryption store in the session then we
			// can get the encryption key from the cookie.
			EncryptionStore::getEncryptionKey();
		}

		$this->removeExpiredEntries();
	}
	
	/**
	 * Returns the only instance of this class.
	 * Creates one if it doesn't exist yet.
	 * @return {EncryptionStore}
	 */
	public static function getInstance() {
		if ( is_null(EncryptionStore::$_instance) ){
			EncryptionStore::$_instance = new EncryptionStore();
		}
		
		return EncryptionStore::$_instance;
	}
	
	/**
	 * Creates a random initialization vector and stores it in the php session
	 */
	private function createInitializationVector() {
		EncryptionStore::$_initializionVector = openssl_random_pseudo_bytes(openssl_cipher_iv_length(EncryptionStore::_CIPHER_METHOD));
		
		// Store it in the session
		$_SESSION['encryption-store-iv'] = bin2hex(EncryptionStore::$_initializionVector);
	}
	
	/**
	 * Returns the initialization vector. If necessary it will try to find the vector
	 * in the php session.
	 * @return {String}
	 */
	private function getInitializationVector() {
		if ( empty(EncryptionStore::$_initializionVector) ){
			// Try to find the initialization vector in the session
			if ( isset($_SESSION['encryption-store-iv']) ){
				EncryptionStore::$_initializionVector = hex2bin($_SESSION['encryption-store-iv']);
			}
		}
		
		return EncryptionStore::$_initializionVector;
	}
	
	/**
	 * Creates a random encryption key and stores it in the cookie.
	 */
	private function createEncryptionKey() {
		EncryptionStore::$_encryptionKey = openssl_random_pseudo_bytes(openssl_cipher_iv_length(EncryptionStore::_CIPHER_METHOD));
		$cookieName = 'encryption-store-key';
		$secure = useSecureCookies();
		if ($secure) {
			$cookieName = '__Secure-'.$cookieName;
		}
		$path = ini_get('session.cookie_path');
		$domain = ini_get('session.cookie_domain');
		setcookie($cookieName, bin2hex(EncryptionStore::$_encryptionKey), 0, $path, $domain, $secure, true);
	}
	
	/**
	 * Returns the encryption key. If necessary it will try to find the key in
	 * the cookie.
	 * 
	 * @return {String}
	 */
	private function getEncryptionKey() {
		if ( empty(EncryptionStore::$_encryptionKey) ){
			// Try to find the encryption key in the cookie
			if ( isset($_COOKIE['encryption-store-key']) ){
				EncryptionStore::$_encryptionKey = hex2bin($_COOKIE['encryption-store-key']);
			}
		}
		
		return EncryptionStore::$_encryptionKey;
	}

	/*
	 * Remove expired entries from the $_SESSION
	*/
	private function removeExpiredEntries() {
		// Remove expired entries
		foreach($_SESSION[EncryptionStore::_SESSION_KEY] as $key => $value) {
			if (!isset($value['exp'])) {
				continue;
			}

			if ($value['exp'] < time()) {
				unset($_SESSION[EncryptionStore::_SESSION_KEY][$key]);
			}
		}
	}
	
	/**
	 * Adds a key/value combination to the encryption store
	 * 
	 * @param {String} $key The key that will be added (or overwritten)
	 * @param {String} $value The value that will be stored for the given $key
	 * @param {String} $expiration The expiration time in epoch for the given $key
	 */
	public function add($key, $value, $expiration = 0) {
		$session_did_exists = $this->open_session();
		$encryptedValue = openssl_encrypt($value, EncryptionStore::_CIPHER_METHOD, EncryptionStore::$_encryptionKey, 0, EncryptionStore::$_initializionVector);
		$_SESSION[EncryptionStore::_SESSION_KEY][$key] = array('val' => $encryptedValue);
		if ($expiration) {
			$_SESSION[EncryptionStore::_SESSION_KEY][$key]['exp'] = $expiration;
		}
		$this->close_session($session_did_exists);
	}
	
	/**
	 * Returns the value that has been stored for the given $key
	 * 
	 * @param {String} The key for which the value will be retrieved\
	 * @return {String|null} 
	 */
	public function get($key) {
		$session_did_exists = $this->open_session();
		// Remove expired entries before checking the $_SESSION
		$this->removeExpiredEntries();
		$values = isset($_SESSION[EncryptionStore::_SESSION_KEY][$key]) ? $_SESSION[EncryptionStore::_SESSION_KEY][$key] : null;
		if ( !isset($values['val']) || is_null($values['val']) ) {
			return null;
		}
		$encrypted = $values['val'];
		
		$value = openssl_decrypt($encrypted, EncryptionStore::_CIPHER_METHOD, EncryptionStore::$_encryptionKey, 0, EncryptionStore::$_initializionVector);
		$this->close_session($session_did_exists);
		return $value;
	}

	/**
	 * Open the php session if it isn't open
	 * @return {Boolean} return if the session was opened or not
	 */
	private function open_session() {
		if (!$this->session_exists()) {
			session_start();
			return true;
		}
		return false;
	}

	/**
	 * Close session if it was explicitly opened
	 * @param {Boolean} True if session was opened, false if not.
	 */
	private function close_session($opened) {
		if ($this->session_exists() && $opened) {
			session_write_close();
		}
	}

	/**
	 * Returns true if the session exists otherwise false.
	 *
	 * @return {Boolean} true if session exists
	 */
	private function session_exists() {
		return session_status() === PHP_SESSION_ACTIVE;
	}
}
