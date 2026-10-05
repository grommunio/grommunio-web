<?php

/*
 * SPDX-FileCopyrightText: Copyright 2020 - 2026 grommunio GmbH
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

/* A failing certificate lookup must yield the empty list callers check for. */
if (function_exists('mapi_table_queryallrows')) {
	echo "Certificate lookup checks skipped with php-mapi loaded\n";

	return;
}

chdir(dirname(__DIR__));

foreach (['RES_AND', 'RES_PROPERTY', 'RES_CONTENT', 'RELOP', 'RELOP_EQ', 'ULPROPTAG', 'VALUE', 'FUZZYLEVEL',
	'FL_FULLSTRING', 'FL_IGNORECASE', 'MAPI_ASSOCIATED', 'TBL_BATCH', 'TABLE_SORT_DESCEND', 'PR_ENTRYID',
	'PR_MESSAGE_CLASS', 'PR_SUBJECT', 'PR_SUBJECT_PREFIX', 'PR_MESSAGE_DELIVERY_TIME',
	'PR_CLIENT_SUBMIT_TIME'] as $index => $constant) {
	if (!defined($constant)) {
		define($constant, $index + 500);
	}
}

if (!class_exists('MAPIException')) {
	class MAPIException extends Exception {}
}

$GLOBALS['rows'] = [];
if (!function_exists('mapi_table_queryallrows')) {
	function mapi_msgstore_openentry($store, $entryid = null) {
		return 'root';
	}
	function mapi_folder_getcontentstable($folder, $flags) {
		return 'table';
	}
	function mapi_table_restrict($table, $restriction, $flags) {
		return true;
	}
	function mapi_table_sort($table, $order, $flags) {
		return true;
	}
	function mapi_table_queryallrows($table, $columns) {
		if ($GLOBALS['rows'] instanceof Exception) {
			throw $GLOBALS['rows'];
		}

		return $GLOBALS['rows'];
	}
}

require_once 'php/util.php';

function checkLookup(bool $condition, string $message): void {
	if (!$condition) {
		fwrite(STDERR, "FAIL: {$message}\n");

		exit(1);
	}
}

ini_set('error_log', '/dev/null');

$GLOBALS['rows'] = new MAPIException('table failed', 0x80004005);
checkLookup(getMAPICert('store') === [], 'MAPI failure yields no certificates');
checkLookup(readPrivateCert('store', 'secret') === [], 'private certificate read survives a MAPI failure');
checkLookup(getMAPICert('store', 'WebApp.Security.Public', 'a@example.com') === [], 'public lookup yields no certificates');

$GLOBALS['rows'] = false;
checkLookup(getMAPICert('store') === [], 'false table result yields no certificates');

$GLOBALS['rows'] = [[PR_ENTRYID => 'e1']];
checkLookup(getMAPICert('store') === [[PR_ENTRYID => 'e1']], 'rows are returned unchanged');

echo "Certificate lookup checks passed\n";
