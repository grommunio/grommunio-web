<?php

if (!class_exists('ZarafaException')) {
	class ZarafaException extends Exception {}
}

require_once dirname(__DIR__) . '/includes/modules/class.module.php';
require_once dirname(__DIR__) . '/includes/modules/class.itemmodule.php';

class ItemModuleStoreContractHarness extends ItemModule {
	public $feedbackCount = 0;

	public function __construct() {
		$this->data = ['open' => []];
	}

	public function getActionStore($action) {
		return ['first-store', 'second-store'];
	}

	public function getActionParentEntryID($action) {
		throw new RuntimeException('A multi-store action was not rejected before dispatch.');
	}

	public function sendFeedback($success = false, $data = [], $addResponseDataToBus = true) {
		++$this->feedbackCount;
	}
}

$module = new ItemModuleStoreContractHarness();
$module->execute();
if ($module->feedbackCount !== 1) {
	throw new RuntimeException('A multi-store item action did not report one failure.');
}

if (!function_exists('mapi_getprops')) {
	defined('PR_STORE_ENTRYID') || define('PR_STORE_ENTRYID', 1);

	$GLOBALS['itemModuleParseSmimeCalls'] = 0;
	$GLOBALS['mapisession'] = new class {
		public function openMessage($entryid) {
			return 'message';
		}

		public function openMessageStore($entryid) {
			return false;
		}
	};

	function mapi_getprops($object, $properties = null) {
		return [PR_STORE_ENTRYID => 'missing-store'];
	}

	function parse_smime($store, $message) {
		++$GLOBALS['itemModuleParseSmimeCalls'];
	}

	$module->open(false, 'message-entryid', []);
	if ($GLOBALS['itemModuleParseSmimeCalls'] !== 0) {
		throw new RuntimeException('S/MIME parsing received an unavailable message store.');
	}
}

echo "Item module store contract checks passed\n";
