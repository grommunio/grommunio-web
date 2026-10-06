<?php

/*
 * SPDX-FileCopyrightText: Copyright 2020 - 2026 grommunio GmbH
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

if (extension_loaded('mapi')) {
	echo "Soft delete folder checks skipped with php-mapi loaded\n";

	return;
}

$constants = ['PR_IPM_WASTEBASKET_ENTRYID', 'PR_ENTRYID', 'PR_STORE_ENTRYID', 'DEL_MESSAGES', 'DEL_FOLDERS', 'DELETE_HARD_DELETE',
	'MAPI_DEFERRED_ERRORS', 'RES_PROPERTY', 'RELOP', 'RELOP_EQ', 'ULPROPTAG', 'VALUE', 'MAPI_E_CALL_FAILED'];
foreach ($constants as $index => $constant) {
	defined($constant) || define($constant, 1 << $index);
}

if (!function_exists('_')) {
	function _($text) {
		return $text;
	}
}

class MAPIException extends Exception {}

if (!function_exists('mapi_folder_deletefolder')) {
	// the wastebasket holds a plain folder and one with subfolders, which the store keeps
	$GLOBALS['live'] = ['plain' => 0, 'parent' => 2];

	function mapi_getprops($object, $tags) {
		return [PR_IPM_WASTEBASKET_ENTRYID => 'wastebasket'];
	}

	function mapi_msgstore_openentry($store, $entryid) {
		return $entryid;
	}

	function mapi_folder_deletefolder($folder, $entryid, $flags) {
		if ($GLOBALS['live'][$entryid] === 0 || ($flags & DELETE_HARD_DELETE)) {
			unset($GLOBALS['live'][$entryid]);
		}

		return true;
	}

	function mapi_folder_gethierarchytable($folder, $flags) {
		return new ArrayObject(array_keys($GLOBALS['live']));
	}

	function mapi_table_restrict($table, $restriction) {
		$entryid = $restriction[1][VALUE][PR_ENTRYID];
		$table->exchangeArray(array_values(array_filter($table->getArrayCopy(), fn ($id) => $id === $entryid)));
	}

	function mapi_table_getrowcount($table) {
		return count($table);
	}
}

$GLOBALS['settings'] = new class {
	public function delete($path) {}
};

require_once dirname(__DIR__) . '/includes/core/class.operations.php';

$operations = new class extends Operations {
	#[Override]
	public function isSpecialFolder($store, $entryid) {
		return false;
	}
};

$props = [];
if ($operations->deleteFolder('store', 'wastebasket', 'plain', $props) !== true) {
	throw new RuntimeException('A plain folder in the wastebasket was not deleted.');
}

try {
	$operations->deleteFolder('store', 'wastebasket', 'parent', $props);

	throw new RuntimeException('A folder the store kept was reported as deleted.');
}
catch (MAPIException $e) {
	if ($e->getCode() !== MAPI_E_CALL_FAILED || !isset($GLOBALS['live']['parent'])) {
		throw new RuntimeException('A kept folder was not reported as a failed delete.');
	}
}

echo "Soft delete folder checks passed\n";
