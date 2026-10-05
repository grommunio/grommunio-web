<?php

/*
 * SPDX-FileCopyrightText: Copyright 2020 - 2026 grommunio GmbH
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

if (function_exists('mapi_folder_copyfolder')) {
	echo "Restore all folders checks skipped with php-mapi loaded\n";

	return;
}

foreach (['MAPI_DEFERRED_ERRORS', 'SHOW_SOFT_DELETES', 'PR_ENTRYID', 'PR_DISPLAY_NAME', 'FOLDER_MOVE', 'MAPI_E_COLLISION'] as $index => $constant) {
	defined($constant) || define($constant, $index + 2);
}

if (!function_exists('mapi_folder_copyfolder')) {
	class MAPIException extends Exception {}

	class ListModule {
		public function execute() {}
	}

	$GLOBALS['copies'] = [];

	function mapi_folder_gethierarchytable($folder, $flags) {
		return 'table';
	}

	function mapi_table_queryallrows($table, $props) {
		return [[PR_ENTRYID => 'child-a'], [PR_ENTRYID => 'child-b']];
	}

	function mapi_msgstore_openentry($store, $entryid, $flags = 0) {
		return 'opened:' . $entryid;
	}

	function mapi_getprops($object, $props) {
		return [PR_DISPLAY_NAME => 'Name'];
	}

	function mapi_folder_copyfolder($src, $entryid, $dest, $name, $flags) {
		if ($name === '') {
			throw new MAPIException('collision', MAPI_E_COLLISION);
		}
		$GLOBALS['copies'][] = [$src, $entryid, $dest, $name];
	}
}

require_once dirname(__DIR__) . '/includes/modules/class.restoreitemslistmodule.php';

class RestoreItemsListModuleTestDouble extends RestoreItemsListModule {
	public $notified;

	public function __construct() {}

	#[Override]
	public function notifyParentFolder($store, $folder, $parentFolder) {
		$this->notified = [$folder, $parentFolder];
	}
}

$GLOBALS['operations'] = new class {
	public $conflictFolders = [];

	public function checkFolderNameConflict($store, $folder, $name) {
		$this->conflictFolders[] = $folder;

		return $name . ' (2)';
	}
};

$module = new RestoreItemsListModuleTestDouble();
$module->restoreAllFolders('store', 'parent');

$expected = [['parent', 'child-a', 'parent', 'Name (2)'], ['parent', 'child-b', 'parent', 'Name (2)']];
if ($GLOBALS['copies'] !== $expected) {
	throw new RuntimeException('Colliding folders were not restored into the parent folder.');
}
if ($GLOBALS['operations']->conflictFolders !== ['parent', 'parent'] || $module->notified !== ['parent', 'parent']) {
	throw new RuntimeException('Name conflicts or notifications did not use the parent folder.');
}

echo "Restore all folders checks passed\n";
