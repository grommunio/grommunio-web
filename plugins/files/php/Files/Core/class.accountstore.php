<?php
/**
 * This class offers functions to handle file backend accounts.
 *
 * @class AccountStore
 */

namespace Files\Core;

require_once __DIR__ . "/class.account.php";
require_once __DIR__ . "/class.exception.php";
require_once __DIR__ . "/../Backend/class.backendstore.php";
require_once __DIR__ . "/../Backend/class.exception.php";

use \Files\Backend\BackendStore;
use \Files\Backend\Exception as BackendException;
use Files\Core\Util\Logger;

class AccountStore
{
	const LOG_CONTEXT = "AccountStore"; // Context for the Logger
	const ACCOUNT_STORAGE_PATH = "zarafa/v1/plugins/files/accounts";
	const ACCOUNT_VERSION = 1;

	/**
	 * @var Account[] Account array
	 */
	private $accounts = [];

	/**
	 *
	 */
	function __construct()
	{
		$this->initialiseAccounts();
	}

	/**
	 * @param $name
	 * @param $backend
	 * @param Array $backendConfig Backend specific account settings
	 *     like username, password, serveraddress, ...
	 *
	 * @return Account
	 */
	public function createAccount($name, $backend, $backendConfig)
	{
		$newID = $this->createNewId($backendConfig); // create id out of the configuration

		// create instance of backend to get features
		$backendStore = BackendStore::getInstance();
		$backendInstance = $backendStore->getInstanceOfBackend($backend);
		$features = $backendInstance->getAvailableFeatures();

		// check backend_config for validity
		$status = $this->checkBackendConfig($backendInstance, $backendConfig);

		// get sequence number
		$sequence = $this->getNewSequenceNumber();

		$newAccount = new Account($newID, strip_tags($name), $status[0], $status[1], strip_tags($backend), $backendConfig, $features, $sequence, false);

		// now store all the values to the user settings
		$GLOBALS["settings"]->set(self::ACCOUNT_STORAGE_PATH . "/" . $newID . "/id", $newAccount->getId());
		$GLOBALS["settings"]->set(self::ACCOUNT_STORAGE_PATH . "/" . $newID . "/name", $newAccount->getName());
		$GLOBALS["settings"]->set(self::ACCOUNT_STORAGE_PATH . "/" . $newID . "/status", $newAccount->getStatus());
		$GLOBALS["settings"]->set(self::ACCOUNT_STORAGE_PATH . "/" . $newID . "/status_description", $newAccount->getStatusDescription());
		$GLOBALS["settings"]->set(self::ACCOUNT_STORAGE_PATH . "/" . $newID . "/backend", $newAccount->getBackend());
		$GLOBALS["settings"]->set(self::ACCOUNT_STORAGE_PATH . "/" . $newID . "/account_sequence", $newAccount->getSequence());
		// User defined accounts are never administrative. So set cannot_change to false.
		$GLOBALS["settings"]->set(self::ACCOUNT_STORAGE_PATH . "/" . $newID . "/cannot_change", false);
		$GLOBALS["settings"]->set(self::ACCOUNT_STORAGE_PATH . "/" . $newID . "/backend_config/version", self::ACCOUNT_VERSION);
		// store all backend configurations
		foreach ($newAccount->getBackendConfig() as $key => $value) {
			if ($key !== "version") {
				$GLOBALS["settings"]->set(self::ACCOUNT_STORAGE_PATH . "/" . $newID . "/backend_config/" . $key, $this->encryptBackendConfigProperty($value, self::ACCOUNT_VERSION));
			}
		}

		// store all features
		foreach ($newAccount->getFeatures() as $feature) {
			$GLOBALS["settings"]->set(self::ACCOUNT_STORAGE_PATH . "/" . $newID . "/backend_features/" . $feature, true);
		}

		$GLOBALS["settings"]->saveSettings(); // save to MAPI storage

		// add account to our local store after it was saved to the zarafa-settings
		$this->accounts[$newID] = $newAccount;

		return $newAccount;
	}

	/**
	 * @param Account $account
	 *
	 * @return Account
	 */
	public function updateAccount($account)
	{
		$accId = $account->getId();
		$isAdministrativeAccount = $account->getCannotChangeFlag();

		// create instance of backend to get features
		$backendStore = BackendStore::getInstance();
		$backendInstance = $backendStore->getInstanceOfBackend($account->getBackend());
		$features = $backendInstance->getAvailableFeatures();
		$account->setFeatures($features);

		// check backend_config for validity
		$status = $this->checkBackendConfig($backendInstance, $account->getBackendConfig());
		$account->setStatus($status[0]); // update status
		$account->setStatusDescription($status[1]); // update status description

		// add account to local store
		$this->accounts[$accId] = $account;

		// save values to MAPI settings
		// now store all the values to the user settings
		// but if we have an administrative account only save the account sequence
		if (!$isAdministrativeAccount) {
			$GLOBALS["settings"]->set(self::ACCOUNT_STORAGE_PATH . "/" . $accId . "/name", $account->getName());
			$GLOBALS["settings"]->set(self::ACCOUNT_STORAGE_PATH . "/" . $accId . "/status", $account->getStatus());
			$GLOBALS["settings"]->set(self::ACCOUNT_STORAGE_PATH . "/" . $accId . "/status_description", $account->getStatusDescription());
			$GLOBALS["settings"]->set(self::ACCOUNT_STORAGE_PATH . "/" . $accId . "/backend", $account->getBackend());

			$acc = $account->getBackendConfig();
			$version = 0;
			if (isset($acc["version"])) {
				$version = $acc["version"];
			}

			// Unable to decrypt, don't update
			if ($version == 0 && !defined('FILES_PASSWORD_IV') && !defined('FILES_PASSWORD_KEY'))  {
				Logger::error(self::LOG_CONTEXT, "Unable to update the account to as FILES_PASSWORD_IV/FILES_PASSWORD_KEY is not set");
			} else {
				// store all backend configurations
				foreach ($account->getBackendConfig() as $key => $value) {
					if ($key !== "version") {
						$GLOBALS["settings"]->set(self::ACCOUNT_STORAGE_PATH . "/" . $accId . "/backend_config/" . $key, $this->encryptBackendConfigProperty($value, self::ACCOUNT_VERSION));
					}
				}

				$GLOBALS["settings"]->set(self::ACCOUNT_STORAGE_PATH . "/" . $accId . "/backend_config/version", self::ACCOUNT_VERSION);
			}

			// store all features
			foreach ($account->getFeatures() as $feature) {
				$GLOBALS["settings"]->set(self::ACCOUNT_STORAGE_PATH . "/" . $accId . "/backend_features/" . $feature, true);
			}
		}
		// when getSequence returns 0, there is no account_sequence setting yet. So create one.
		$account_sequence = ($account->getSequence() === 0 ? $this->getNewSequenceNumber() : $account->getSequence());
		$GLOBALS["settings"]->set(self::ACCOUNT_STORAGE_PATH . "/" . $accId . "/account_sequence", $account_sequence);

		$GLOBALS["settings"]->saveSettings(); // save to MAPI storage

		return $account;
	}

	/**
	 * Delete account from local store and from the MAPI settings
	 *
	 * @param $accountId
	 *
	 * @return bool
	 */
	public function deleteAccount($accountId)
	{
		$account = $this->getAccount($accountId);
		// Do not allow deleting administrative accounts, but fail silently.
		if (!$account->getCannotChangeFlag()) {
			$GLOBALS["settings"]->delete(self::ACCOUNT_STORAGE_PATH . "/" . $accountId);
			$GLOBALS["settings"]->saveSettings(); // save to MAPI storage
		}

		return true;
	}

	/**
	 * Return the instance of the local account
	 *
	 * @param $accountId
	 *
	 * @return Account
	 */
	public function getAccount($accountId)
	{
		return $this->accounts[$accountId];
	}

	/**
	 * @return Account[] alls Accounts
	 */
	public function getAllAccounts()
	{
		return $this->accounts;
	}

	/**
	 * Initialize the accountstore. Reads all accountinformation from the MAPI settings.
	 */
	private function initialiseAccounts()
	{
		// Parse accounts from the Settings
		$tmpAccs = $GLOBALS["settings"]->get(self::ACCOUNT_STORAGE_PATH);

		if (is_array($tmpAccs)) {
			$this->accounts = array();

			foreach ($tmpAccs as $acc) {
				// set backend_features if it is not set to prevent warning
				if (!isset($acc["backend_features"])) {
					$acc["backend_features"] = array();
				}
				// account_sequence was introduced later. So set and save it if missing.
				if (!isset($acc["account_sequence"])) {
					$acc["account_sequence"] = $this->getNewSequenceNumber();
					Logger::debug(self::LOG_CONTEXT, "Account sequence missing. New seq: " . $acc["account_sequence"]);
					$GLOBALS["settings"]->set(self::ACCOUNT_STORAGE_PATH . "/" . $acc["id"] . "/account_sequence", $acc["account_sequence"]);
					$GLOBALS["settings"]->saveSettings();
				}
				// cannot_change flag was introduced later. So set it to false and save it if missing.
				if (!isset($acc["cannot_change"])) {
					$acc["cannot_change"] = false;
					Logger::debug(self::LOG_CONTEXT, "Cannot change flag missing. Setting to false.");
					$GLOBALS["settings"]->set(self::ACCOUNT_STORAGE_PATH . "/" . $acc["id"] . "/cannot_change", false);
					$GLOBALS["settings"]->saveSettings();
				}

				$backend_config = $acc["backend_config"];
				$version = 0;

				if (isset($acc["backend_config"]) && isset($acc["backend_config"]["version"])) {
					$version = $acc["backend_config"]["version"];
				}

				if (($version === 0 && defined('FILES_PASSWORD_IV') && defined('FILES_PASSWORD_KEY')) || $version === self::ACCOUNT_VERSION) {
					$backend_config = $this->decryptBackendConfig($acc["backend_config"], $version);
					// version is lost after decryption, add it again
					$backend_config["version"] = $version;
				} else if ($version === 0) {
					Logger::error(self::LOG_CONTEXT, "FILES_PASSWORD_IV or FILES_PASSWORD_KEY not set, unable to decrypt backend configuration");
				} else {
					Logger::error(self::LOG_CONTEXT, "Unsupported account version $version, unable to decrypt backend configuration");
				}

				$this->accounts[$acc["id"]] = new Account($acc["id"],
					$acc["name"],
					$acc["status"],
					$acc["status_description"],
					$acc["backend"],
					$backend_config,
					array_keys($acc["backend_features"]),
					$acc["account_sequence"],
					$acc["cannot_change"]
				);
			}
		}
		Logger::debug(self::LOG_CONTEXT, "Found " . count($this->accounts) . " accounts.");
	}

	/**
	 * @param AbstractBackend $backendInstance
	 * @param Array $backendConfig Backend specific account settings
	 *     like username, password, serveraddress, ...
	 *
	 * @return Array
	 */
	private function checkBackendConfig($backendInstance, $backendConfig)
	{
		$status = Account::STATUS_NEW;
		$description = _('Account is ready to use.');
		try {
			$backendInstance->init_backend($backendConfig);
			$backendInstance->open();
			$backendInstance->ls("/");
			$status = Account::STATUS_OK;
		} catch (BackendException $e) {
			$status = Account::STATUS_ERROR;
			$description = $e->getMessage();

			Logger::error(self::LOG_CONTEXT, "Account check failed: " . $description);
		}

		return array($status, $description);
	}

	/**
	 * @param Array $backendConfig Backend specific account settings
	 *     like username, password, serveraddress, ...
	 *
	 * @return  an unique id
	 */
	private function createNewId($backendConfig)
	{
		// lets create a hash
		return md5(json_encode($backendConfig) . time()); // json_encode is faster than serialize
	}

	/**
	 * Generate a new sequence number. It will always be the highest used sequence number +1.
	 *
	 * @return int
	 */
	private function getNewSequenceNumber() {
		$seq = 0;
		foreach($this->accounts as $acc) {
			if($acc->getSequence() > $seq) {
				$seq = $acc->getSequence();
			}
		}

		return $seq + 1;
	}

	/**
	 * Decrypt the backend configuration using the standard grommunio Web key.
	 *
	 * @param Array $backendConfig Backend specific account settings
	 *     like username, password, serveraddress, ...
	 * @return array
	 */
	private function decryptBackendConfig($backendConfig, $version=0) {
		$decBackendConfig = array();

		foreach($backendConfig as $key => $value) {
			if ($key !== "version") {
				try {
					$decBackendConfig[$key] = $this->decryptBackendConfigProperty($value, $version);
				} catch (Exception $e) {
					Logger::error(self::LOG_CONTEXT, sprintf("Unable to decrypt backend configuration: '%s'", $e->getMessage()));
				}
			}
		}

		return $decBackendConfig;
	}

	/**
	 * Encrypt the given string.
	 *
	 * @param $value
	 * @param $version the storage version used to identify what encryption to use
	 * @return string
	 */
	private function encryptBackendConfigProperty($value, $version=0) {
		if ($version == self::ACCOUNT_VERSION && !is_bool($value)) {
			$nonce = random_bytes(SODIUM_CRYPTO_SECRETBOX_NONCEBYTES);
			$key = $GLOBALS["operations"]->getFilesEncryptionKey();
			$encrypted = sodium_crypto_secretbox($value, $nonce, $key);
			$value = bin2hex($nonce) . bin2hex($encrypted);
		} else if ($version !== self::ACCOUNT_VERSION) {
			throw Exception("Unable to encrypt backend configuration unsupported version $version");
		}

		return $value;
	}

	/**
	 * Decrypt the given string.
	 *
	 * @param $value
	 * @param $version the storage version used to identify what encryption to use
	 * @return string
	 */
	private function decryptBackendConfigProperty($value, $version=0) {
		if (is_bool($value)) {
			return $value;
		}

		if ($version == self::ACCOUNT_VERSION) {
			$value = hex2bin($value);
			$nonce = substr($value, 0, SODIUM_CRYPTO_SECRETBOX_NONCEBYTES);
			$encrypted = substr($value, SODIUM_CRYPTO_SECRETBOX_NONCEBYTES, strlen($value));
			$key = $GLOBALS["operations"]->getFilesEncryptionKey();
			$value = sodium_crypto_secretbox_open($encrypted, $nonce, $key);

			// Decryption failed, password might have changed
			if ($value === false) {
				throw new Exception("invalid password");
			}
		}

		return $value;
	}
}
