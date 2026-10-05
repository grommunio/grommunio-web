<?php

/*
 * SPDX-FileCopyrightText: Copyright 2020 - 2026 grommunio GmbH
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

/* MAPI errors other than MAPI_E_NOT_FOUND must reach the module error handling. */
if (function_exists('mapi_msgstore_openentry')) {
	echo "MAPI error rethrow checks skipped with php-mapi loaded\n";

	return;
}

foreach (['RES_AND', 'RES_PROPERTY', 'RELOP', 'RELOP_LT', 'RELOP_NE', 'RELOP_EQ', 'ULPROPTAG', 'VALUE',
	'PR_DISPLAY_NAME'] as $index => $constant) {
	define($constant, $index + 400);
}
define('MAPI_E_NOT_FOUND', 0x8004010F);
define('MAPI_E_NO_ACCESS', 0x80070005);

class MAPIException extends Exception {
	public bool $handled = false;

	public function setHandled() {
		$this->handled = true;
	}
}

class Module {
	public function __construct($id, $data) {}

	protected function getExecutionLockName() {}

	public function execute() {}

	public function handleException(&$e, $actionType = null, $store = null, $parententryid = null, $entryid = null, $action = null) {}
}

class ListModule extends Module {
	public $properties = [];
}

$GLOBALS['mapisession'] = new class {
	public function getAddressbook() {
		return 'addressbook';
	}

	public function getDefaultMessageStore() {
		return 'store';
	}
};

$GLOBALS['openError'] = MAPI_E_NO_ACCESS;
if (!function_exists('mapi_ab_openentry')) {
	function mapi_ab_openentry($ab, $entryid) {
		throw new MAPIException('openentry failed', $GLOBALS['openError']);
	}

	function mapi_msgstore_openentry($store, $entryid) {
		throw new MAPIException('openentry failed', $GLOBALS['openError']);
	}
}

require_once dirname(__DIR__) . '/includes/modules/class.delegatesmodule.php';
require_once dirname(__DIR__) . '/includes/modules/class.reminderlistmodule.php';

$checks = 0;
function rethrowCheck(callable $call, string $label): void {
	try {
		$call();
	}
	catch (MAPIException $e) {
		if ($e->getCode() !== MAPI_E_NO_ACCESS || $e->handled) {
			throw new RuntimeException($label . ': wrong exception');
		}
		++$GLOBALS['checks'];

		return;
	}

	throw new RuntimeException($label . ': the MAPI error was swallowed');
}

$delegates = (new ReflectionClass(DelegatesModule::class))->newInstanceWithoutConstructor();
rethrowCheck(fn () => $delegates->getUserInfo('user'), 'DelegatesModule::getUserInfo');

$GLOBALS['openError'] = MAPI_E_NOT_FOUND;
$userInfo = $delegates->getUserInfo('user');
if ($userInfo['entryid'] !== null) {
	throw new RuntimeException('DelegatesModule::getUserInfo: an unknown user was resolved');
}
++$checks;

$GLOBALS['openError'] = MAPI_E_NO_ACCESS;
$reminders = (new ReflectionClass(ReminderListModule::class))->newInstanceWithoutConstructor();
$reminders->properties = ['flagdueby' => 1, 'reminder' => 2, 'message_class' => 3];
rethrowCheck(fn () => $reminders->getReminders(), 'ReminderListModule::getReminders');

echo "OK: {$checks} MAPI error rethrow assertions\n";
