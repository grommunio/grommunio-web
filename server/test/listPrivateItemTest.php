<?php

/*
 * SPDX-FileCopyrightText: Copyright 2020 - 2026 grommunio GmbH
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

if (function_exists('mapi_getprops')) {
	echo "List private item checks skipped with php-mapi loaded\n";

	return;
}

defined('BASE_PATH') || define('BASE_PATH', dirname(__DIR__, 2) . '/');
$constants = ['SENSITIVITY_PRIVATE', 'PR_SCHDINFO_DELEGATE_ENTRYIDS', 'PR_DELEGATE_FLAGS', 'MAPI_E_NOT_FOUND', 'MAPI_E_CALL_FAILED',
	'TABLE_SORT_ASCEND', 'TABLE_SORT_DESCEND'];
foreach ($constants as $index => $constant) {
	defined($constant) || define($constant, $index + 2);
}
defined('PT_MV_STRING8') || define('PT_MV_STRING8', 0x101E);
defined('PT_MV_LONG') || define('PT_MV_LONG', 0x1003);
defined('MV_INSTANCE') || define('MV_INSTANCE', 0x2000);
defined('MVI_FLAG') || define('MVI_FLAG', 0x3000);
defined('ZARAFA_STORE_DELEGATE_GUID') || define('ZARAFA_STORE_DELEGATE_GUID', 'delegate-provider');

if (!class_exists('GrommunioException')) {
	class GrommunioException extends Exception {}
}
if (!class_exists('SQLite3')) {
	class SQLite3 {}
}

if (!function_exists('mapi_getprops')) {
	class MAPIException extends Exception {
		public $handled = false;

		public function setHandled() {
			$this->handled = true;
		}
	}

	function mapi_getprops($object, $properties = null) {
		++$GLOBALS['privateGetprops'];
		if ($GLOBALS['privateThrow'] !== false) {
			throw new MAPIException('getprops', $GLOBALS['privateThrow']);
		}

		return $GLOBALS['privateProps'];
	}

	function mapi_prop_type($property) {
		return $property & 0xFFFF;
	}
}

require_once dirname(__DIR__) . '/includes/modules/class.module.php';
require_once dirname(__DIR__) . '/includes/modules/class.listmodule.php';

$GLOBALS['mapisession'] = new class {
	public function getUserEntryID() {
		return 'me';
	}
};
$GLOBALS['entryid'] = new class {
	public function compareEntryIds($a, $b) {
		return $a === $b;
	}
};

class PrivateItemList extends ListModule {
	public function __construct() {}
}

function assertPrivate($condition, $message) {
	if (!$condition) {
		throw new RuntimeException($message);
	}
}

function runPrivateChecks($list, $count) {
	$results = [];
	for ($i = 0; $i < $count; ++$i) {
		$results[] = $list->checkPrivateItem(['props' => ['private' => true]]);
	}

	return array_unique($results);
}

$GLOBALS['privateGetprops'] = 0;
$GLOBALS['privateThrow'] = false;
$GLOBALS['privateProps'] = [PR_SCHDINFO_DELEGATE_ENTRYIDS => ['other', 'me'], PR_DELEGATE_FLAGS => [1, 1]];

$list = new PrivateItemList();
$list->storeProviderGuid = false;
$list->localFreeBusyMessage = false;
assertPrivate(!$list->checkPrivateItem(['props' => ['private' => true]]), 'A private item in the own store was hidden');

$list->storeProviderGuid = ZARAFA_STORE_DELEGATE_GUID;
assertPrivate($list->checkPrivateItem(['props' => ['private' => true]]), 'A private item without free/busy data was shown');
assertPrivate(!$list->checkPrivateItem(['props' => ['private' => false, 'sensitivity' => 0]]), 'A public item was hidden');

$list->localFreeBusyMessage = fopen('php://memory', 'r');
assertPrivate(runPrivateChecks($list, 3) === [false], 'A delegate allowed to see private items was refused');
assertPrivate(!$list->checkPrivateItem(['props' => ['sensitivity' => SENSITIVITY_PRIVATE]]), 'A sensitive item was hidden from an allowed delegate');
assertPrivate($GLOBALS['privateGetprops'] === 1, 'Delegate flags were read more than once per free/busy message');

$GLOBALS['privateProps'] = [PR_SCHDINFO_DELEGATE_ENTRYIDS => ['me'], PR_DELEGATE_FLAGS => [0]];
$list->localFreeBusyMessage = fopen('php://memory', 'r');
assertPrivate(runPrivateChecks($list, 2) === [true], 'A delegate without the private flag saw private items');

$GLOBALS['privateProps'] = [PR_SCHDINFO_DELEGATE_ENTRYIDS => ['other'], PR_DELEGATE_FLAGS => [1]];
$list->localFreeBusyMessage = fopen('php://memory', 'r');
assertPrivate(runPrivateChecks($list, 2) === [true], 'An unlisted delegate saw private items');

foreach ([MAPI_E_NOT_FOUND => 1, MAPI_E_CALL_FAILED => 2] as $code => $reads) {
	$GLOBALS['privateThrow'] = $code;
	$GLOBALS['privateGetprops'] = 0;
	$list->localFreeBusyMessage = fopen('php://memory', 'r');
	assertPrivate(runPrivateChecks($list, 2) === [true], 'A failed delegate lookup showed private items');
	assertPrivate($GLOBALS['privateGetprops'] === $reads, 'A failed delegate lookup was cached wrongly');
}

$list->sort = [];
$list->properties = ['subject' => 0x0037001E, 'categories' => 0x8001301E];
$list->parseSortOrder(['sort' => [
	['field' => 'subject', 'direction' => 'DESC'],
	['field' => 'mapped', 'direction' => 'asc'],
	['field' => 'unknown', 'direction' => 'desc'],
	['field' => 'subject'],
	['field' => 'categories', 'direction' => 'sideways'],
]], ['mapped' => 0x0E060040]);
assertPrivate($list->sort === [0x0037001E => TABLE_SORT_DESCEND, 0x0E060040 => TABLE_SORT_ASCEND, 0x8001101E => TABLE_SORT_ASCEND], 'Sort order parsed wrongly');

echo "List private item checks passed\n";
