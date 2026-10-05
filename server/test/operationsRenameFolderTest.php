<?php

/*
 * SPDX-FileCopyrightText: Copyright 2020 - 2026 grommunio GmbH
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

if (extension_loaded('mapi')) {
	echo "Rename folder checks skipped with php-mapi loaded\n";

	return;
}

foreach (['PR_ENTRYID', 'PR_STORE_ENTRYID', 'PR_DISPLAY_NAME', 'MAPI_E_COLLISION'] as $index => $constant) {
	defined($constant) || define($constant, 5000 + $index);
}

if (!function_exists('_')) {
	function _($text) {
		return $text;
	}
}

class MAPIException extends Exception {}

if (!function_exists('mapi_getprops')) {
	// sibling names; the store keeps the old name on a collision without failing
	$GLOBALS['names'] = ['a' => 'A', 'b' => 'B'];

	function mapi_msgstore_openentry($store, $entryid) {
		return $entryid;
	}

	function mapi_getprops($folder, $tags) {
		return [PR_ENTRYID => $folder, PR_STORE_ENTRYID => 'store', PR_DISPLAY_NAME => $GLOBALS['names'][$folder]];
	}

	function mapi_setprops($folder, $props) {
		$name = $props[PR_DISPLAY_NAME];
		$others = array_diff_key($GLOBALS['names'], [$folder => true]);
		if (!in_array(strtolower((string) $name), array_map('strtolower', $others), true)) {
			$GLOBALS['names'][$folder] = $name;
		}

		return true;
	}

	function mapi_savechanges($folder) {
		return true;
	}
}

require_once dirname(__DIR__) . '/includes/core/class.operations.php';

$operations = new Operations();
$props = [];

try {
	$operations->renameFolder('store', 'b', 'A', $props);

	throw new RuntimeException('A rename onto a sibling name reported success.');
}
catch (MAPIException $e) {
	if ($e->getCode() !== MAPI_E_COLLISION) {
		throw new RuntimeException('A dropped rename was not reported as a collision.');
	}
}

if ($operations->renameFolder('store', 'b', 'C', $props) !== true || $GLOBALS['names']['b'] !== 'C') {
	throw new RuntimeException('A free name was not accepted.');
}
if ($operations->renameFolder('store', 'b', 'C', $props) !== true) {
	throw new RuntimeException('Keeping the same name was reported as a collision.');
}

echo "Rename folder checks passed\n";
