<?php

/*
 * SPDX-FileCopyrightText: Copyright 2020 - 2026 grommunio GmbH
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

if (function_exists('mapi_msgstore_openentry')) {
	echo "Hierarchy search folder save checks skipped with php-mapi loaded\n";

	return;
}

defined('ADDRESSBOOK_ENTRYID') || define('ADDRESSBOOK_ENTRYID', 'addressbook');
defined('OBJECT_SAVE') || define('OBJECT_SAVE', 1);

class Module {
	protected function getExecutionLockName() {}

	public function getEntryID() {}

	public function execute() {}

	public function handleException(&$e, $actionType = null, $store = null, $parententryid = null, $entryid = null, $action = null) {}
}

if (!function_exists('mapi_msgstore_openentry')) {
	function mapi_msgstore_openentry($store, $entryid) {
		return 'searchfolder';
	}
}

require_once dirname(__DIR__) . '/includes/modules/class.hierarchymodule.php';

class HierarchySearchFolderSaveDouble extends HierarchyModule {
	public $saved = 0;
	public $feedback;

	public function __construct() {}

	#[Override]
	public function save($store, $folder, $action) {
		++$this->saved;
	}

	public function sendFeedback($success = false, $data = [], $addResponseDataToBus = true) {
		$this->feedback = $success;
	}
}

$GLOBALS['bus'] = new class {
	public $notifications = 0;

	public function notify(...$arguments) {
		++$this->notifications;
	}
};

set_error_handler(function ($severity, $message) {
	throw new ErrorException($message, 0, $severity);
});

$module = new HierarchySearchFolderSaveDouble();
(new ReflectionMethod(HierarchyModule::class, 'saveFolderAction'))->invoke($module, 'store', 'parent', 'entry', [
	'entryid' => '01',
	'props' => ['display_name' => 'Renamed'],
	'message_action' => ['isSearchFolder' => true],
]);

if ($module->saved !== 1 || $module->feedback !== true || $GLOBALS['bus']->notifications !== 0) {
	throw new RuntimeException('Saving a search folder without an action type did not complete cleanly.');
}

echo "Hierarchy search folder save checks passed\n";
