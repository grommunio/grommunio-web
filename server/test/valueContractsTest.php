<?php

if (function_exists('mapi_msgstore_openentry')) {
	echo "Value contract checks skipped with php-mapi loaded\n";

	return;
}

defined('MAPI_DEFERRED_ERRORS') || define('MAPI_DEFERRED_ERRORS', 0);
defined('TBL_BATCH') || define('TBL_BATCH', 1);
defined('PR_SUBJECT') || define('PR_SUBJECT', 2);
defined('PR_NORMALIZED_SUBJECT') || define('PR_NORMALIZED_SUBJECT', 3);
defined('PR_MESSAGE_DELIVERY_TIME') || define('PR_MESSAGE_DELIVERY_TIME', 4);
defined('TABLE_SORT_DESCEND') || define('TABLE_SORT_DESCEND', 5);
defined('MAPI_E_NO_ACCESS') || define('MAPI_E_NO_ACCESS', 6);
defined('PR_ENTRYID') || define('PR_ENTRYID', 7);
defined('PR_FINDER_ENTRYID') || define('PR_FINDER_ENTRYID', 8);
defined('RES_CONTENT') || define('RES_CONTENT', 9);
defined('FUZZYLEVEL') || define('FUZZYLEVEL', 10);
defined('FL_FULLSTRING') || define('FL_FULLSTRING', 11);
defined('ULPROPTAG') || define('ULPROPTAG', 12);
defined('VALUE') || define('VALUE', 13);
defined('NOERROR') || define('NOERROR', 0);

if (!function_exists('_')) {
	function _($message) {
		return $message;
	}
}
if (!function_exists('ctype_xdigit')) {
	function ctype_xdigit($value) {
		return is_string($value) && preg_match('/\A[0-9a-f]+\z/i', $value) === 1;
	}
}

class Module {
	public function __construct($id = null, $data = null) {}

	public function execute() {}

	public function handleException(&$e, $actionType = null, $store = null, $parententryid = null, $entryid = null, $action = null) {}
}

class ItemModule extends Module {
	public $properties;

	public function save($store, $parententryid, $entryid, $action, $actionType = 'save') {}

	public function delete($store, $parententryid, $entryid, $action) {}

	public function sendFeedback($success, $data = [], $send = false) {}
}

class Recurrence {
	public function __construct($store, $message) {}

	public function getNextReminderTime($timestamp) {
		return 0;
	}
}

class ValueContractException extends Exception {
	public $displayMessage;

	public function setDisplayMessage($message) {
		$this->displayMessage = $message;
	}
}

$GLOBALS['valueContractMode'] = 'table';
$GLOBALS['valueContractRowCount'] = null;
$GLOBALS['valueContractMessageProps'] = [];
$GLOBALS['valueContractSavedProps'] = [];
$GLOBALS['valueContractOpenEntryCalls'] = 0;
$GLOBALS['valueContractQueryRows'] = [];
$GLOBALS['valueContractLastHresult'] = NOERROR;
$GLOBALS['valueContractDeletedFolders'] = [];

if (!function_exists('mapi_msgstore_openentry')) {
	function mapi_msgstore_openentry($store, $entryid = null) {
		++$GLOBALS['valueContractOpenEntryCalls'];

		return 'mapi-object';
	}

	function mapi_folder_getcontentstable($folder, $flags) {
		return 'table';
	}

	function mapi_table_queryrows($table, $properties, $start, $rowcount) {
		$GLOBALS['valueContractRowCount'] = $rowcount;

		return $GLOBALS['valueContractQueryRows'];
	}

	function mapi_table_getrowcount($table) {
		return 0;
	}

	function mapi_getprops($object, $properties = null) {
		return $GLOBALS['valueContractMessageProps'];
	}

	function mapi_setprops($object, $properties) {
		$GLOBALS['valueContractSavedProps'] = $properties;
	}

	function mapi_savechanges($object) {}

	function mapi_last_hresult() {
		return $GLOBALS['valueContractLastHresult'];
	}

	function mapi_folder_gethierarchytable($folder, $flags) {
		return 'hierarchy-table';
	}

	function mapi_table_restrict($table, $restriction, $flags) {}

	function mapi_folder_deletefolder($folder, $entryid) {
		$GLOBALS['valueContractDeletedFolders'][] = $entryid;
	}

	function class_match_prefix($messageClass, $prefix) {
		return str_starts_with($messageClass, $prefix);
	}
}

require_once dirname(__DIR__) . '/includes/core/class.operations.php';
require_once dirname(__DIR__) . '/includes/core/class.todolist.php';
require_once dirname(__DIR__) . '/includes/modules/class.listmodule.php';
require_once dirname(__DIR__) . '/includes/modules/class.reminderitemmodule.php';

class ValueContractReminderItemModule extends ReminderItemModule {
	public array $feedback = [];

	public function sendFeedback($success, $data = [], $send = false) {
		$this->feedback[] = $success;
	}
}

$GLOBALS['settings'] = new class {
	public int $calls = 0;

	public function get($path, $default) {
		++$this->calls;

		return 37;
	}
};

$operations = new Operations();
$page = $operations->getTable('store', 'folder', [], [], 0, 0);
if ($GLOBALS['valueContractRowCount'] !== 0 || $page['page']['rowcount'] !== 0 || $GLOBALS['settings']->calls !== 0) {
	throw new RuntimeException('A zero table row count was replaced with the default page size');
}

$page = $operations->getTable('store', 'folder', [], [], 0, false);
if ($GLOBALS['valueContractRowCount'] !== 37 || $page['page']['rowcount'] !== 37 || $GLOBALS['settings']->calls !== 1) {
	throw new RuntimeException('The false row-count sentinel did not select the default page size');
}

$otherStoreDoc = (new ReflectionMethod(Operations::class, 'getOtherStoreFromEntryid'))->getDocComment();
if (!is_string($otherStoreDoc) || !str_contains($otherStoreDoc, '@return false|resource')) {
	throw new RuntimeException('The shared-store lookup does not document its MAPI resource contract');
}

$listModule = (new ReflectionClass(ListModule::class))->newInstanceWithoutConstructor();
$exception = new ValueContractException();
$listModule->handleException($exception, 'list', null, null, '', []);
if (!str_ends_with($exception->displayMessage, '()') || str_contains($exception->displayMessage, '(null)')) {
	throw new RuntimeException('An empty entry ID was handled as a null entry ID');
}

foreach (['updatesearch', 'stopSearch', 'deleteSearchFolder'] as $methodName) {
	$methodDoc = (new ReflectionMethod(ListModule::class, $methodName))->getDocComment();
	if (!is_string($methodDoc) || !preg_match('/@param\s+false\|resource\s+\$store\b/', $methodDoc)) {
		throw new RuntimeException("ListModule::{$methodName} does not document its MAPI store resource contract");
	}
	if (!preg_match('/@param\s+false\|string\s+\$entryid\b/', $methodDoc)) {
		throw new RuntimeException("ListModule::{$methodName} does not document its missing entry ID sentinel");
	}
}

foreach (['updatesearch', 'stopSearch'] as $methodName) {
	$methodDoc = (new ReflectionMethod(ListModule::class, $methodName))->getDocComment();
	if (!is_string($methodDoc) || !preg_match('/@param\s+array\s+\$action\b/', $methodDoc)) {
		throw new RuntimeException("ListModule::{$methodName} does not document its action array contract");
	}
}

$openEntryCalls = $GLOBALS['valueContractOpenEntryCalls'];
foreach ([null, [], '', '0', 'zz'] as $searchFolderEntryid) {
	$listModule->updatesearch('store', 'binary-folder-id', ['search_folder_entryid' => $searchFolderEntryid]);
}
if ($GLOBALS['valueContractOpenEntryCalls'] !== $openEntryCalls) {
	throw new RuntimeException('A malformed search-folder entry ID reached MAPI');
}

$GLOBALS['valueContractMessageProps'] = [PR_FINDER_ENTRYID => 'finder-folder-id'];
$GLOBALS['valueContractLastHresult'] = 1;
if ($listModule->deleteSearchFolder('store', 'search-folder-id', []) !== false) {
	throw new RuntimeException('A finder-folder MAPI error did not satisfy the false return contract');
}

$GLOBALS['valueContractLastHresult'] = NOERROR;
$GLOBALS['valueContractQueryRows'] = [];
$GLOBALS['valueContractDeletedFolders'] = [];
set_error_handler(static function (int $severity, string $message, string $file, int $line): never {
	throw new ErrorException($message, 0, $severity, $file, $line);
});

try {
	$emptyDeleteResult = $listModule->deleteSearchFolder('store', 'search-folder-id', []);
}
finally {
	restore_error_handler();
}
if ($emptyDeleteResult !== true || $GLOBALS['valueContractDeletedFolders'] !== []) {
	throw new RuntimeException('An empty finder-folder query attempted to delete a folder');
}

foreach (['save', 'delete'] as $methodName) {
	$methodDoc = (new ReflectionMethod(ReminderItemModule::class, $methodName))->getDocComment();
	if (!is_string($methodDoc) ||
		!preg_match('/@param\s+false\|resource\s+\$store\b/', $methodDoc) ||
		!preg_match('/@param\s+false\|string\s+\$parententryid\b/', $methodDoc) ||
		!preg_match('/@param\s+array\|false\|string\s+\$entryid\b/', $methodDoc)) {
		throw new RuntimeException("ReminderItemModule::{$methodName} does not document its action value contracts");
	}
}

$GLOBALS['valueContractMessageProps'] = [
	1 => 'IPM.Appointment',
	2 => true,
];
$reminder = (new ReflectionClass(ValueContractReminderItemModule::class))->newInstanceWithoutConstructor();
$reminder->properties = [
	'message_class' => 1,
	'appointment_recurring' => 2,
	'flagdueby' => 3,
	'reminder' => 4,
];
$reminder->dismissItem('store', 'entry-id');
if ($GLOBALS['valueContractSavedProps'] !== [3 => 0]) {
	throw new RuntimeException('A zero reminder timestamp was mistaken for a failed lookup');
}

$openEntryCalls = $GLOBALS['valueContractOpenEntryCalls'];
$reminder->feedback = [];
$reminder->snoozeItem('store', false, []);
$reminder->snoozeItem('store', ['first-item', 'second-item'], []);
$reminder->dismissItem('store', false);
$reminder->dismissItem('store', ['first-item', 'second-item']);
$reminder->snoozeItem(false, 'entry-id', []);
$reminder->dismissItem(false, 'entry-id');
if ($GLOBALS['valueContractOpenEntryCalls'] !== $openEntryCalls || $reminder->feedback !== [false, false, false, false, false, false]) {
	throw new RuntimeException('An unavailable store or malformed reminder entry ID reached MAPI');
}

$normalizeEntryId = new ReflectionMethod(TodoList::class, 'normalizeEntryId');
if ($normalizeEntryId->invoke(null, true) !== false ||
	$normalizeEntryId->invoke(null, '') !== false ||
	$normalizeEntryId->invoke(null, "\x00entry-id") !== "\x00entry-id") {
	throw new RuntimeException('To-do entry ID validation accepted a non-string sentinel');
}

$entryIdType = (new ReflectionProperty(TodoList::class, '_entryId'))->getType();
if (!$entryIdType instanceof ReflectionUnionType) {
	throw new RuntimeException('The static To-do entry ID cache is not constrained by a union type');
}
$entryIdTypes = array_map(static fn (ReflectionNamedType $type) => $type->getName(), $entryIdType->getTypes());
sort($entryIdTypes);
if ($entryIdTypes !== ['false', 'string']) {
	throw new RuntimeException('The static To-do entry ID cache accepts unexpected value types');
}

echo "Value contract checks passed\n";
