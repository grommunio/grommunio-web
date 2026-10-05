<?php

/*
 * SPDX-FileCopyrightText: Copyright 2020 - 2026 grommunio GmbH
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

defined('MAPI_E_NOT_FOUND') || define('MAPI_E_NOT_FOUND', (int) 0x8004010F);
defined('MAPI_E_NO_ACCESS') || define('MAPI_E_NO_ACCESS', (int) 0x80070005);
defined('MAPI_E_CALL_FAILED') || define('MAPI_E_CALL_FAILED', (int) 0x80004005);

if (!function_exists('_')) {
	function _($text) {
		return $text;
	}
}

class MAPIException extends Exception {
	public $displayMessage;

	public function setDisplayMessage($message) {
		$this->displayMessage = $message;
	}
}

class Module {
	public $data;

	protected function getExecutionLockName() {}

	public function getEntryID() {}

	public function execute() {}

	public function handleException(&$e, $actionType = null, $store = null, $parententryid = null, $entryid = null, $action = null) {}
}

require_once dirname(__DIR__) . '/includes/modules/class.hierarchymodule.php';

$module = (new ReflectionClass(HierarchyModule::class))->newInstanceWithoutConstructor();

function sharedFolderMessage($module, $code, $folderType) {
	$e = new MAPIException('failed', $code);
	$module->handleException($e, 'opensharedfolder', null, null, null, ['folder_type' => $folderType]);

	return $e->displayMessage;
}

if (sharedFolderMessage($module, MAPI_E_NOT_FOUND, 'inbox') !== 'User could not be resolved.') {
	throw new RuntimeException('Unknown users did not get the unresolved-user message.');
}
if (!str_contains((string) sharedFolderMessage($module, MAPI_E_NO_ACCESS, 'calendar'), 'open this Calendar folder')) {
	throw new RuntimeException('Denied shared folders did not get the folder-type privileges message.');
}
if (sharedFolderMessage($module, MAPI_E_CALL_FAILED, 'inbox') !== 'Could not open the shared store.') {
	throw new RuntimeException('Other shared folder failures lost the generic message.');
}

$GLOBALS['mapisession'] = new class {
	public function addUserStore($username) {
		throw new MAPIException('createentryid', MAPI_E_CALL_FAILED);
	}
};

try {
	(new ReflectionMethod(HierarchyModule::class, 'openSharedFolder'))->invoke($module, ['user_name' => 'Nobody', 'folder_type' => 'inbox']);

	throw new RuntimeException('Opening an unknown user store did not fail.');
}
catch (MAPIException $e) {
	if ($e->getCode() !== MAPI_E_NOT_FOUND) {
		throw new RuntimeException('Unresolvable shared store users were not reported as not found.');
	}
}

$GLOBALS['mapisession'] = new class {
	public function addUserStore($username) {
		return false;
	}
};

try {
	(new ReflectionMethod(HierarchyModule::class, 'openSharedFolder'))->invoke($module, ['user_name' => 'group', 'folder_type' => 'calendar']);

	throw new RuntimeException('Opening an unopenable store did not fail.');
}
catch (MAPIException $e) {
	$module->handleException($e, 'opensharedfolder', null, null, null, ['folder_type' => 'calendar']);
	if ($e->displayMessage !== 'Could not open the shared store.') {
		throw new RuntimeException('An unopenable shared store was reported as missing folder permissions.');
	}
}

echo "Hierarchy shared folder message checks passed\n";
