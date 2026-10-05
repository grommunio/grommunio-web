<?php

/*
 * SPDX-FileCopyrightText: Copyright 2020 - 2026 grommunio GmbH
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

if (function_exists('mapi_folder_copyfolder')) {
	echo "Restore all folders checks skipped with php-mapi loaded\n";

	return;
}

foreach (['MAPI_DEFERRED_ERRORS', 'SHOW_SOFT_DELETES', 'PR_ENTRYID', 'PR_DISPLAY_NAME', 'FOLDER_MOVE', 'MAPI_E_COLLISION', 'DEL_MESSAGES', 'DEL_FOLDERS', 'DELETE_HARD_DELETE'] as $index => $constant) {
	defined($constant) || define($constant, $index + 2);
}

if (!function_exists('mapi_folder_copyfolder')) {
	class MAPIException extends Exception {}

	class ListModule {
		public function execute() {}
	}

	$GLOBALS['copies'] = [];
	$GLOBALS['deletes'] = [];
	$GLOBALS['live'] = ['X'];

	function mapi_folder_gethierarchytable($folder, $flags) {
		return 'table';
	}

	function mapi_table_queryallrows($table, $props) {
		return [
			[PR_ENTRYID => 'soft-x1', PR_DISPLAY_NAME => 'X'],
			[PR_ENTRYID => 'soft-x2', PR_DISPLAY_NAME => 'X'],
			[PR_ENTRYID => 'soft-y', PR_DISPLAY_NAME => 'Y'],
		];
	}

	function mapi_folder_copyfolder($src, $entryid, $dest, $name, $flags = 0) {
		if ($flags !== 0 || $name === '') {
			throw new RuntimeException('Restore must copy under the real name.');
		}
		if (in_array($name, $GLOBALS['live'], true)) {
			throw new MAPIException('collision', MAPI_E_COLLISION);
		}
		$GLOBALS['live'][] = $name;
		$GLOBALS['copies'][] = [$src, $entryid, $dest, $name];
	}

	function mapi_folder_deletefolder($folder, $entryid, $flags) {
		if ($flags !== (DEL_MESSAGES | DEL_FOLDERS | DELETE_HARD_DELETE)) {
			throw new RuntimeException('Source must be hard-deleted.');
		}
		$GLOBALS['deletes'][] = [$folder, $entryid];
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
		$n = 2;
		while (in_array("{$name} ({$n})", $GLOBALS['live'], true)) {
			++$n;
		}

		return "{$name} ({$n})";
	}
};

$module = new RestoreItemsListModuleTestDouble();
$module->restoreAllFolders('store', 'parent');

$expected = [['parent', 'soft-x1', 'parent', 'X (2)'], ['parent', 'soft-x2', 'parent', 'X (3)'], ['parent', 'soft-y', 'parent', 'Y']];
if ($GLOBALS['copies'] !== $expected) {
	throw new RuntimeException('Soft-deleted folders were not restored under their names.');
}
if ($GLOBALS['deletes'] !== [['parent', 'soft-x1'], ['parent', 'soft-x2'], ['parent', 'soft-y']]) {
	throw new RuntimeException('Restored sources were not hard-deleted.');
}
if ($GLOBALS['operations']->conflictFolders !== ['parent', 'parent'] || $module->notified !== ['parent', 'parent']) {
	throw new RuntimeException('Name conflicts or notifications did not use the parent folder.');
}

echo "Restore all folders checks passed\n";
