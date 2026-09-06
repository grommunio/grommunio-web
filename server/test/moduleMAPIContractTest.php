<?php

if (function_exists('mapi_getprops')) {
	echo "Module MAPI contract checks skipped with php-mapi loaded\n";

	return;
}

defined('BASE_PATH') || define('BASE_PATH', dirname(__DIR__, 2) . '/');
defined('PR_MDB_PROVIDER') || define('PR_MDB_PROVIDER', 0x34140102);
defined('ZARAFA_STORE_DELEGATE_GUID') || define('ZARAFA_STORE_DELEGATE_GUID', 'delegate-provider');

if (!class_exists('ZarafaException')) {
	class ZarafaException extends Exception {}
}
if (!class_exists('SQLite3')) {
	class SQLite3 {}
}

$GLOBALS['moduleMAPIContractProperties'] = [];
if (!function_exists('mapi_getprops')) {
	function mapi_getprops($object, $properties = null) {
		return $GLOBALS['moduleMAPIContractProperties'];
	}
}

require_once dirname(__DIR__) . '/includes/modules/class.module.php';
require_once dirname(__DIR__) . '/includes/modules/class.hierarchymodule.php';
require_once dirname(__DIR__) . '/includes/modules/class.itemmodule.php';
require_once dirname(__DIR__) . '/includes/modules/class.listmodule.php';
require_once dirname(__DIR__) . '/includes/modules/class.advancedsearchlistmodule.php';
require_once dirname(__DIR__) . '/includes/modules/class.appointmentlistmodule.php';
require_once dirname(__DIR__) . '/includes/modules/class.contactlistmodule.php';
require_once dirname(__DIR__) . '/includes/modules/class.maillistmodule.php';
require_once dirname(__DIR__) . '/includes/modules/class.stickynotelistmodule.php';
require_once dirname(__DIR__) . '/includes/modules/class.taskitemmodule.php';
require_once dirname(__DIR__) . '/includes/modules/class.tasklistmodule.php';

function assertModuleMAPIContract($condition, $message) {
	if (!$condition) {
		throw new RuntimeException($message);
	}
}

class ModuleMAPIContractHierarchy extends HierarchyModule {
	public $feedback = [];
	private $testStore;

	public function __construct($actionType, $store) {
		$this->id = 1;
		$this->data = [$actionType => []];
		$this->testStore = $store;
	}

	public function getActionStore($action) {
		return $this->testStore;
	}

	public function getActionParentEntryID($action) {
		return 'parent';
	}

	public function getActionEntryID($action) {
		return 'entry';
	}

	public function sendFeedback($success = false, $data = [], $addResponseDataToBus = true) {
		$this->feedback[] = $success;
	}
}

class ModuleMAPIContractItem extends ItemModule {
	public $feedback = [];
	public $unexpectedCalls = 0;
	private $testEntryid;
	private $testStore;

	public function __construct($subActionType, $store, $entryid) {
		$this->id = 1;
		$this->data = [
			'delete' => [
				'message_action' => ['action_type' => $subActionType],
			],
		];
		$this->directBookingMeetingRequest = false;
		$this->testEntryid = $entryid;
		$this->testStore = $store;
	}

	public function getActionStore($action) {
		return $this->testStore;
	}

	public function getActionParentEntryID($action) {
		return 'parent';
	}

	public function getActionEntryID($action) {
		return $this->testEntryid;
	}

	public function sendFeedback($success = false, $data = [], $addResponseDataToBus = true) {
		$this->feedback[] = $success;
	}

	public function cancelInvitation($store, $entryid, $action, $directBookingMeetingRequest) {
		++$this->unexpectedCalls;
	}

	public function removeFromCalendar($store, $entryid, $basedate, $directBookingMeetingRequest) {
		++$this->unexpectedCalls;
	}
}

trait ModuleMAPIContractArrayStoreHarness {
	public $feedback = [];
	public $unexpectedCalls = 0;
	private $testStore;

	public function __construct($store = [false]) {
		$this->id = 1;
		$this->data = ['list' => []];
		$this->testStore = $store;
	}

	public function getActionStore($action) {
		return $this->testStore;
	}

	public function getActionParentEntryID($action) {
		return 'parent';
	}

	public function getActionEntryID($action) {
		return 'entry';
	}

	public function getDelegateFolderInfo($store) {
		++$this->unexpectedCalls;
	}

	public function messageList($store, $entryid, $action, $actionType) {
		++$this->unexpectedCalls;
	}

	public function sendFeedback($success = false, $data = [], $addResponseDataToBus = true) {
		$this->feedback[] = $success;
	}
}

class ModuleMAPIContractList extends ListModule {
	use ModuleMAPIContractArrayStoreHarness;
}

class ModuleMAPIContractAdvancedSearchList extends AdvancedSearchListModule {
	use ModuleMAPIContractArrayStoreHarness;
}

class ModuleMAPIContractAppointmentList extends AppointmentListModule {
	use ModuleMAPIContractArrayStoreHarness;
}

class ModuleMAPIContractContactList extends ContactListModule {
	use ModuleMAPIContractArrayStoreHarness;
}

class ModuleMAPIContractMailList extends MailListModule {
	use ModuleMAPIContractArrayStoreHarness;
}

class ModuleMAPIContractStickyNoteList extends StickyNoteListModule {
	use ModuleMAPIContractArrayStoreHarness;
}

class ModuleMAPIContractTaskList extends TaskListModule {
	use ModuleMAPIContractArrayStoreHarness;
}

class ModuleMAPIContractTaskItem extends TaskItemModule {
	public function __construct() {}
}

class ModuleMAPIContractDelegateInfo extends ListModule {
	public function __construct() {}
}

class ModuleMAPIContractPluginManager {
	public function triggerHook($hook, $data) {}
}

$hierarchy = new ModuleMAPIContractHierarchy('foldersize', false);
$hierarchy->execute();
assertModuleMAPIContract($hierarchy->feedback === [false], 'Hierarchy actions must reject a missing store');

$keepalive = new ModuleMAPIContractHierarchy('keepalive', false);
$keepalive->execute();
assertModuleMAPIContract($keepalive->feedback === [true], 'Keepalive must remain valid without a store');

$hadPluginManager = array_key_exists('PluginManager', $GLOBALS);
$previousPluginManager = $GLOBALS['PluginManager'] ?? null;
$GLOBALS['PluginManager'] = new ModuleMAPIContractPluginManager();
foreach ([
	ModuleMAPIContractList::class,
	ModuleMAPIContractAdvancedSearchList::class,
	ModuleMAPIContractContactList::class,
	ModuleMAPIContractMailList::class,
	ModuleMAPIContractStickyNoteList::class,
	ModuleMAPIContractTaskList::class,
] as $moduleClass) {
	foreach ([[false], false] as $invalidStore) {
		$module = new $moduleClass($invalidStore);
		$module->execute();
		assertModuleMAPIContract($module->feedback === [false], "{$moduleClass} must reject an invalid store");
		assertModuleMAPIContract($module->unexpectedCalls === 0, "{$moduleClass} passed an invalid store to a MAPI operation");
	}
}
if ($hadPluginManager) {
	$GLOBALS['PluginManager'] = $previousPluginManager;
}
else {
	unset($GLOBALS['PluginManager']);
}

$appointmentList = new ModuleMAPIContractAppointmentList();
$appointmentList->execute();
assertModuleMAPIContract($appointmentList->feedback === [], 'Appointment lists must continue to accept multiple stores');
assertModuleMAPIContract($appointmentList->unexpectedCalls === 1, 'Appointment multistore dispatch was rejected');

$store = fopen('php://memory', 'r');
if ($store === false) {
	throw new RuntimeException('Unable to create a test resource');
}

foreach (['removeFromCalendar', 'cancelInvitation', 'declineMeeting'] as $subActionType) {
	foreach ([[false, 'entry'], [$store, false]] as [$testStore, $entryid]) {
		$item = new ModuleMAPIContractItem($subActionType, $testStore, $entryid);
		$item->execute();
		assertModuleMAPIContract($item->feedback === [false], "{$subActionType} must reject incomplete MAPI identifiers");
		assertModuleMAPIContract($item->unexpectedCalls === 0, "{$subActionType} reached a MAPI operation with incomplete identifiers");
	}
}

$task = new ModuleMAPIContractTaskItem();
$task->delete($store, 'parent', false, []);

$undoDoc = (new ReflectionMethod(ItemModule::class, 'prepareDeleteUndo'))->getDocComment();
assertModuleMAPIContract(is_string($undoDoc) && str_contains($undoDoc, '@param resource'), 'Delete undo must accept a MAPI resource');

$restrictionDoc = (new ReflectionProperty(ListModule::class, 'restriction'))->getDocComment();
assertModuleMAPIContract(is_string($restrictionDoc) && str_contains($restrictionDoc, '@var array|false'), 'List restrictions must allow their unset state');

$delegateInfo = new ModuleMAPIContractDelegateInfo();
$delegateInfo->getDelegateFolderInfo($store);
assertModuleMAPIContract($delegateInfo->storeProviderGuid === false, 'A missing store provider was accepted');
$GLOBALS['moduleMAPIContractProperties'] = [PR_MDB_PROVIDER => 'other-provider'];
$delegateInfo->getDelegateFolderInfo($store);
assertModuleMAPIContract($delegateInfo->storeProviderGuid === 'other-provider', 'A valid store provider was not retained');

fclose($store);

echo "Module MAPI contract checks passed\n";
