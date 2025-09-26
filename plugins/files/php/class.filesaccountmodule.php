<?php

require_once __DIR__ . "/Files/Core/class.exception.php";
require_once __DIR__ . "/Files/Backend/class.exception.php";

require_once __DIR__ . "/Files/Core/class.accountstore.php";
require_once __DIR__ . "/Files/Backend/class.backendstore.php";

require_once __DIR__ . "/Files/Core/Util/class.arrayutil.php";
require_once __DIR__ . "/Files/Core/Util/class.logger.php";

use Files\Backend\BackendStore;
use Files\Backend\Exception;
use Files\Backend\Exception as BackendException;
use Files\Core\AccountStore;
use Files\Core\Exception as AccountException;
use Files\Core\Util\ArrayUtil;
use Files\Core\Util\Logger;

class FilesAccountModule extends ListModule {
	public const LOG_CONTEXT = "FilesAccountModule"; // Context for the Logger

	/**
	 * @constructor
	 *
	 * @param mixed $id
	 * @param mixed $data
	 */
	public function __construct($id, $data) {
		parent::__construct($id, $data);
	}

	/**
	 * Executes all the actions in the $data variable.
	 * Exception part is used for authentication errors also.
	 *
	 * @return bool true on success or false on failure
	 */
	#[Override]
	public function execute() {
		$result = false;

		foreach ($this->data as $actionType => $actionData) {
			if (isset($actionType)) {
				try {
					switch ($actionType) {
						case "save":
							// check if we should create a new account or edit an existing one
							if (isset($actionData["entryid"])) {
								$result = $this->accountUpdate($actionData);
							}
							else {
								$result = $this->accountCreate($actionData);
							}
							break;

						case "delete":
							$result = $this->accountDelete($actionType, $actionData);
							break;

						case "list":
							if (isset($actionData["list_backend"]) && $actionData["list_backend"]) {
								$result = $this->backendInformation($actionType);
							}
							else {
								$result = $this->accountList($actionType, $actionData);
							}
							break;

						case "getquota":
							$result = $this->getQuotaInformation($actionType, $actionData);
							break;

						case "getversion":
							$result = $this->getVersionInformation($actionType, $actionData);
							break;

						case "updatetoken":
							$result = $this->updateOauthToken($actionType, $actionData);
							break;

						default:
							$this->handleUnknownActionType($actionType);
					}
				}
				catch (MAPIException $e) {
					$this->sendFeedback(false, $this->errorDetailsFromException($e));
				}
				catch (AccountException|BackendException $e) {
					$this->sendFeedback(false, [
						'type' => ERROR_GENERAL,
						'info' => [
							'title' => $e->getTitle(),
							'original_message' => $e->getMessage(),
							'display_message' => $e->getMessage(),
						],
					]);
				}
			}
		}

		return $result;
	}

	/**
	 * @param array $actionData
	 */
	public function accountCreate($actionData) {
		$response = [];
		$requestProperties = $actionData["props"];

		// create a new account in our backend
		$accountStore = new AccountStore();
		$newAccount = $accountStore->createAccount($requestProperties["name"], $requestProperties["backend"], $requestProperties["backend_config"]);

		// create the response account object
		$account = [];
		$account[$newAccount->getId()] = [
			'props' => [
				'id' => $newAccount->getId(),
				'status' => $newAccount->getStatus(),
				'status_description' => $newAccount->getStatusDescription(),
				'name' => $newAccount->getName(),
				'backend' => $newAccount->getBackend(),
				'backend_config' => $newAccount->getBackendConfig(),
				'backend_features' => $newAccount->getFeatures(),
				'account_sequence' => $newAccount->getSequence(),
			],
			'entryid' => $newAccount->getId(),
			'store_entryid' => 'filesaccount',
			'parent_entryid' => 'accountstoreroot',
		];
		$response['item'] = array_values($account);

		$this->addActionData("update", $response);
		$GLOBALS["bus"]->addData($this->getResponseData());

		return true;
	}

	/**
	 * remove an account from the store and the MAPI settings.
	 *
	 * @param string $actionType
	 * @param array  $actionData
	 */
	public function accountDelete($actionType, $actionData) {
		$response = [];

		// check if account needs to clean things up before it gets deleted
		try {
			$accountStore = new AccountStore();
			$accountStore->getAccount($actionData['entryid'])->beforeDelete();
		}
		catch (Exception) {
			// ignore errors here
		}

		$response['status'] = $accountStore->deleteAccount($actionData['entryid']);

		$this->addActionData($actionType, $response);
		$GLOBALS["bus"]->addData($this->getResponseData());

		return $response['status'];
	}

	/**
	 * loads content of current folder - list of folders and files from the Files backend.
	 *
	 * @param string $actionType
	 * @param array  $actionData
	 */
	public function accountList($actionType, $actionData) {
		$response = [];

		// get a list of all accounts
		$accountStore = new AccountStore();
		$accounts = $accountStore->getAllAccounts();
		$accountList = [];

		if (is_array($accounts)) {
			foreach ($accounts as $account) {
				$account = $accountStore->updateAccount($account);
				$accountList[$account->getId()] = [
					"props" => [
						"id" => $account->getId(),
						"name" => $account->getName(),
						"type" => "account", // to prevent warning while sorting
						"status" => $account->getStatus(),
						"status_description" => $account->getStatusDescription(),
						"backend" => $account->getBackend(),
						"backend_config" => $account->getBackendConfig(),
						'backend_features' => $account->getFeatures(),
						'account_sequence' => $account->getSequence(),
						'cannot_change' => $account->getCannotChangeFlag(),
					],
					'entryid' => $account->getId(),
					'store_entryid' => 'filesaccount',
					'parent_entryid' => 'accountstoreroot',
				];
			}
		}

		// sort the accounts
		$sortKey = "account_sequence";
		$sortDir = "ASC";

		if (isset($actionData['sort'])) {
			$sortKey = $actionData['sort'][0]['field'];
			$sortDir = $actionData['sort'][0]['direction'];
		}

		Logger::debug(self::LOG_CONTEXT, "Sorting by " . $sortKey . " in direction: " . $sortDir);

		$accountList = ArrayUtil::sort_props_by_key($accountList, $sortKey, $sortDir);

		$response["item"] = array_values($accountList);
		$response['page'] = ["start" => 0, "rowcount" => 50, "totalrowcount" => count($response["item"])];
		$response['folder'] = ["content_count" => count($response["item"]), "content_unread" => 0];

		$this->addActionData($actionType, $response);
		$GLOBALS["bus"]->addData($this->getResponseData());

		return true;
	}

	/**
	 * update some values of an account.
	 *
	 * @param array $actionData
	 */
	public function accountUpdate($actionData) {
		$response = [];

		// create a new account in our backend
		$accountStore = new AccountStore();
		$currentAccount = $accountStore->getAccount($actionData['entryid']);

		// apply changes to the account object
		if (isset($actionData['props']['name'])) {
			$currentAccount->setName(strip_tags($actionData['props']['name']));
		}
		if (isset($actionData['props']['backend'])) {
			$currentAccount->setBackend(strip_tags($actionData['props']['backend']));
		}
		if (isset($actionData['props']['backend_config'])) { // we always get the whole backend config
			$currentAccount->setBackendConfig($actionData['props']['backend_config']);
		}
		if (isset($actionData['props']['account_sequence'])) {
			$currentAccount->setSequence($actionData['props']['account_sequence']);
		}

		// save changes
		$accountStore->updateAccount($currentAccount);

		// create the response object
		$updatedAccount = [];
		$updatedAccount[$currentAccount->getId()] = [
			"props" => [
				"id" => $currentAccount->getId(),
				"name" => $currentAccount->getName(),
				"status" => $currentAccount->getStatus(),
				"status_description" => $currentAccount->getStatusDescription(),
				"backend" => $currentAccount->getBackend(),
				"backend_config" => $currentAccount->getBackendConfig(),
				'backend_features' => $currentAccount->getFeatures(),
				'account_sequence' => $currentAccount->getSequence(),
			],
			'entryid' => $currentAccount->getId(),
			'store_entryid' => 'filesaccount',
			'parent_entryid' => 'accountstoreroot',
		];

		$response['item'] = array_values($updatedAccount);
		$this->addActionData("update", $response);
		$GLOBALS["bus"]->addData($this->getResponseData());

		return true;
	}

	/**
	 * Return all Information about the existing backends.
	 *
	 * @param string $actionType
	 */
	public function backendInformation($actionType) {
		// find all registered backends
		$backendStore = BackendStore::getInstance();
		$backendNames = $backendStore->getRegisteredBackendNames();

		$data = [];
		$items = [];
		foreach ($backendNames as $backendName) {
			$backendInstance = $backendStore->getInstanceOfBackend($backendName);
			if ($backendInstance !== false) {
				array_push($items, ['props' => [
					"name" => $backendName,
					"message_class" => "IPM.FilesBackend",
					"displayName" => $backendInstance->getDisplayName(),
				]]);
			}
		}

		$data = array_merge($data, ['item' => $items]);

		$this->addActionData($actionType, $data);
		$GLOBALS["bus"]->addData($this->getResponseData());

		return true;
	}

	/**
	 * Return all quota information from specified account.
	 *
	 * @param string $actionType
	 * @param string $actionData
	 */
	public function getQuotaInformation($actionType, $actionData) {
		$response = [];

		$accountId = $actionData["accountId"];
		$rootPath = $actionData["folder"];

		// load the accountstore
		$accountStore = new AccountStore();
		$currentAccount = $accountStore->getAccount($accountId);

		// check if ID was valid, if not respond with error.
		if ($currentAccount === null || $currentAccount === false) {
			throw new AccountException(_("Unknown account ID"));
		}

		$backendStore = BackendStore::getInstance();
		$backendInstance = $backendStore->getInstanceOfBackend($currentAccount->getBackend());

		// check if backend really supports this feature
		if (!$backendInstance->supports(BackendStore::FEATURE_QUOTA)) {
			throw new AccountException(_('Feature "Quota Information" is not supported by this backend!'));
		}

		// init backend instance
		$backendInstance->init_backend($currentAccount->getBackendConfig());

		// get quota info
		$backendInstance->open();
		$qUsed = $backendInstance->getQuotaBytesUsed($rootPath);
		$qAvailable = $backendInstance->getQuotaBytesAvailable($rootPath);

		$response['status'] = true;
		$response['quota'] = [
			["state" => _('Used'), "amount" => $qUsed],
			["state" => _('Free'), "amount" => $qAvailable],
		];

		$this->addActionData($actionType, $response);
		$GLOBALS["bus"]->addData($this->getResponseData());

		return $response['status'];
	}

	/**
	 * Return all quota information from specified account.
	 *
	 * @param string $actionType
	 * @param string $actionData
	 */
	public function getVersionInformation($actionType, $actionData) {
		$response = [];

		$accountId = $actionData["accountId"];

		// load the accountstore
		$accountStore = new AccountStore();
		$currentAccount = $accountStore->getAccount($accountId);

		// check if ID was valid, if not respond with error.
		if ($currentAccount === null || $currentAccount === false) {
			throw new AccountException(_("Unknown account ID"));
		}

		$backendStore = BackendStore::getInstance();
		$backendInstance = $backendStore->getInstanceOfBackend($currentAccount->getBackend());

		// check if backend really supports this feature
		if (!$backendInstance->supports(BackendStore::FEATURE_VERSION)) {
			throw new AccountException(_('Feature "Version Information" is not supported by this backend!'));
		}

		// init backend instance
		$backendInstance->init_backend($currentAccount->getBackendConfig());

		// get quota info
		$backendInstance->open();
		$serverVersion = $backendInstance->getServerVersion();
		$backendVersion = $backendInstance->getBackendVersion();

		$response['status'] = true;
		$response['version'] = [
			"backend" => $backendVersion,
			"server" => $serverVersion,
		];

		$this->addActionData($actionType, $response);
		$GLOBALS["bus"]->addData($this->getResponseData());

		return $response['status'];
	}

	/**
	 * Return all quota information from specified account.
	 *
	 * @param string $actionType
	 * @param string $actionData
	 */
	public function updateOauthToken($actionType, $actionData) {
		$response = [];

		$accountId = $actionData["accountId"];

		// load the accountstore
		$accountStore = new AccountStore();
		$currentAccount = $accountStore->getAccount($accountId);

		// check if ID was valid, if not respond with error.
		if ($currentAccount === null || $currentAccount === false) {
			throw new AccountException(_("Unknown account ID"));
		}

		$backendStore = BackendStore::getInstance();
		$backendInstance = $backendStore->getInstanceOfBackend($currentAccount->getBackend());

		// check if backend really supports this feature
		if (!$backendInstance->supports(BackendStore::FEATURE_OAUTH)) {
			throw new AccountException(_('Feature "OAUTH" is not supported by this backend!'));
		}

		// init backend instance
		$backendInstance->init_backend($currentAccount->getBackendConfig());
		$backendInstance->changeAccessToken($actionData["access_token"]);

		$response['status'] = true;
		$response['access_token'] = $actionData["access_token"];

		$this->addActionData($actionType, $response);
		$GLOBALS["bus"]->addData($this->getResponseData());

		return $response['status'];
	}

	/**
	 * Function will retrieve error details from exception object based on exception type.
	 * it should also send type of exception with the data. so client can know which type
	 * of exception is generated.
	 *
	 * @param object $exception the exception object which is generated
	 *
	 * @return array error data
	 *
	 * @overwrite
	 */
	#[Override]
	public function errorDetailsFromException($exception) {
		parent::errorDetailsFromException($exception);
	}
}
