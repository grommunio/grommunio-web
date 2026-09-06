<?php

defined('PLUGIN_FILESBROWSER_LOGLEVEL') || define('PLUGIN_FILESBROWSER_LOGLEVEL', 'ERROR');
defined('BASE_PATH') || define('BASE_PATH', __DIR__ . '/fixtures/');

require_once dirname(__DIR__, 2) . '/plugins/files/php/Files/Core/class.accountstore.php';

use Files\Backend\BackendStore;
use Files\Core\Account;
use Files\Core\AccountStore;
use Files\Core\Exception as AccountException;

$backendStoreReflection = new ReflectionClass(BackendStore::class);
$backendStore = $backendStoreReflection->newInstanceWithoutConstructor();
$backendStoreInstance = $backendStoreReflection->getProperty('_instance');
$backendStoreInstance->setValue(null, $backendStore);

$GLOBALS['settings'] = new class {
	public function get($key) {
		return null;
	}
};

$accountStore = new AccountStore();

try {
	$accountStore->createAccount('Missing backend', 'Unavailable', []);
}
catch (AccountException) {
	$account = new Account('missing', 'Missing backend', Account::STATUS_NEW, '', 'Unavailable', [], [], 1, false);

	try {
		$accountStore->updateAccount($account);
	}
	catch (AccountException) {
		echo "Files account backend validation checks passed\n";

		return;
	}

	throw new RuntimeException('Updating an account with an unavailable backend did not fail cleanly.');
}

throw new RuntimeException('Creating an account with an unavailable backend did not fail cleanly.');
