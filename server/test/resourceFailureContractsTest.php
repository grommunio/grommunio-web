<?php

defined('BASE_PATH') || define('BASE_PATH', dirname(__DIR__, 2) . '/');
defined('ecLoginPerm') || define('ecLoginPerm', 1);
defined('MAPI_E_CALL_FAILED') || define('MAPI_E_CALL_FAILED', 2);
defined('MAPI_E_NOT_FOUND') || define('MAPI_E_NOT_FOUND', 3);

if (!class_exists('ZarafaException')) {
	class ZarafaException extends Exception {}
}

require_once dirname(__DIR__) . '/includes/core/class.operations.php';
require_once dirname(__DIR__) . '/includes/modules/class.module.php';
require_once dirname(__DIR__) . '/includes/modules/class.itemmodule.php';
require_once dirname(__DIR__) . '/includes/modules/class.createmailitemmodule.php';

$messageProps = [];
$operations = new Operations();
if ($operations->saveMessage(false, false, false, [], $messageProps) !== false) {
	throw new RuntimeException('A message without a parent folder was not rejected.');
}

$createMail = (new ReflectionClass(CreateMailItemModule::class))->newInstanceWithoutConstructor();
$resolveStore = new ReflectionMethod(CreateMailItemModule::class, 'resolveStore');
$store = fopen('php://memory', 'r');
if ($store === false || $resolveStore->invoke($createMail, $store) !== $store) {
	throw new RuntimeException('A valid resource was not preserved by mail store resolution.');
}
fclose($store);

$restoreDoc = (new ReflectionMethod(CreateMailItemModule::class, 'restoreSendAsPropsFromDraft'))->getDocComment();
if (!is_string($restoreDoc) || !str_contains($restoreDoc, '@param false|string $entryid')) {
	throw new RuntimeException('Draft identity restoration does not accept an unsaved message entry ID.');
}

if (!function_exists('mapi_msgstore_createentryid')) {
	$GLOBALS['resourceFailureEntryIdCalls'] = 0;
	function mapi_msgstore_createentryid($store, $username) {
		++$GLOBALS['resourceFailureEntryIdCalls'];

		return false;
	}

	require_once dirname(__DIR__) . '/includes/core/class.mapisession.php';

	class ResourceFailureMAPISession extends MAPISession {
		public $openStoreCalls = 0;
		public $defaultStore = 'default-store';

		public function retrieveOtherUsersFromSettings() {
			return ['missing@example.test' => ['folder']];
		}

		public function getDefaultMessageStore($reopen = false) {
			return $this->defaultStore;
		}

		public function openMessageStore($entryid, $name = '') {
			++$this->openStoreCalls;

			return 'unexpected-store';
		}
	}

	$session = new ResourceFailureMAPISession();
	if ($session->getOtherUserStore() !== [] || $session->openStoreCalls !== 0) {
		throw new RuntimeException('A failed shared-store entry ID was passed to the store opener.');
	}
	if ($GLOBALS['resourceFailureEntryIdCalls'] !== 1) {
		throw new RuntimeException('The shared-store entry ID failure path was not exercised.');
	}

	$session = new ResourceFailureMAPISession();
	$session->defaultStore = false;
	if ($session->getOtherUserStore() !== [] || $GLOBALS['resourceFailureEntryIdCalls'] !== 1) {
		throw new RuntimeException('An unavailable default store reached entry ID creation.');
	}
}

echo "Resource failure contract checks passed\n";
