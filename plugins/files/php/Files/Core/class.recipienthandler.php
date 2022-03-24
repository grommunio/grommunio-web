<?php

namespace Files\Core;

require_once __DIR__ . "/class.accountstore.php";

require_once __DIR__ . "/Util/class.pathutil.php";
require_once __DIR__ . "/Util/class.logger.php";

use \Files\Core\Util\PathUtil;
use \Files\Core\Util\Logger;


class RecipientHandler
{
	const LOG_CONTEXT = "RecipientHandler"; // Context for the Logger

	public static function doGetRecipients()
	{
		// parse account id.
		// wo only need to parse one string because it is
		// only possible to download files from one backend at a time.
		if (isset($_GET["ids"])) {
			$tmpId = $_GET["ids"][0];
		} else {
			$tmpId = $_GET["id"];
		}
		$accountID = substr($tmpId, 3, (strpos($tmpId, '/') - 3));

		// Initialize the account and backendstore
		$accountStore = new \Files\Core\AccountStore();
		$backendStore = \Files\Backend\BackendStore::getInstance();

		$account = $accountStore->getAccount($accountID);

		// initialize the backend
		$initializedBackend = $backendStore->getInstanceOfBackend($account->getBackend());
		$initializedBackend->init_backend($account->getBackendConfig());

		try {
			$initializedBackend->open();
		} catch (\Files\Backend\Exception $e) {
			Logger::error(self::LOG_CONTEXT, "Could not open the backend: " . $e->getMessage());
                        echo json_encode(array('success' => false, 'response' => $e->getCode(), 'message' => $e->getMessage()));
			die();
		}
		$responsedata = $initializedBackend->getRecipients($_GET["query"]);
		header('Content-Type: application/json');
		echo json_encode($responsedata);
	}

}
