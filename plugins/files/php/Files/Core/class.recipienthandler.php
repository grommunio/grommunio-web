<?php

namespace Files\Core;

require_once __DIR__ . "/class.accountstore.php";

require_once __DIR__ . "/Util/class.pathutil.php";
require_once __DIR__ . "/Util/class.logger.php";

use Files\Backend\BackendStore;
use Files\Backend\iFeatureRecipientSearch;
use Files\Core\Util\Logger;

class RecipientHandler {
	public const LOG_CONTEXT = "RecipientHandler"; // Context for the Logger

	public static function doGetRecipients() {
		// parse account id.
		// wo only need to parse one string because it is
		// only possible to download files from one backend at a time.
		if (isset($_GET["ids"])) {
			$tmpId = $_GET["ids"][0];
		}
		else {
			$tmpId = $_GET["id"];
		}
		$accountID = substr((string) $tmpId, 3, strpos((string) $tmpId, '/') - 3);

		// Initialize the account and backendstore
		$accountStore = new AccountStore();
		$backendStore = BackendStore::getInstance();

		$account = $accountStore->getAccount($accountID);
		if ($account === null) {
			Logger::error(self::LOG_CONTEXT, "Unknown account ID: " . $accountID);
			echo json_encode(['success' => false, 'response' => 'Unknown account ID', 'message' => _('Unknown account ID')]);

			exit;
		}

		// initialize the backend
		$initializedBackend = $backendStore->getInstanceOfBackend($account->getBackend());
		if (!$initializedBackend || (!$initializedBackend instanceof iFeatureRecipientSearch && !is_callable([$initializedBackend, 'getRecipients']))) {
			Logger::error(self::LOG_CONTEXT, "Recipient search is not supported by backend: " . $account->getBackend());
			header('Content-Type: application/json');
			echo json_encode(['success' => false, 'response' => 'Unsupported backend feature', 'message' => _('Recipient search is not supported by this backend')]);

			return;
		}

		try {
			$initializedBackend->init_backend($account->getBackendConfig());
			$initializedBackend->open();
			$responsedata = $initializedBackend->getRecipients((string) ($_GET["query"] ?? ''));
		}
		catch (\Throwable $e) {
			Logger::error(self::LOG_CONTEXT, "Recipient lookup failed: " . $e->getMessage());
			header('Content-Type: application/json');
			echo json_encode(['success' => false, 'response' => 'Recipient lookup failed', 'message' => _('Unable to look up recipients')]);

			return;
		}
		header('Content-Type: application/json');
		echo json_encode($responsedata);
	}
}
