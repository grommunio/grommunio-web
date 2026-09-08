<?php

defined('BASE_PATH') || define('BASE_PATH', dirname(__DIR__, 2) . '/');
if (!class_exists('SQLite3')) {
	class SQLite3 {}
}

require_once dirname(__DIR__) . '/includes/core/class.operations.php';
if (!class_exists('BaseException')) {
	class BaseException extends Exception {}
}
require_once dirname(__DIR__) . '/includes/exceptions/class.ZarafaException.php';
require_once dirname(__DIR__) . '/includes/modules/class.module.php';
require_once dirname(__DIR__) . '/includes/modules/class.listmodule.php';
require_once dirname(__DIR__) . '/includes/modules/class.appointmentlistmodule.php';
defined('DEBUG_FULLTEXT_SEARCH') || define('DEBUG_FULLTEXT_SEARCH', false);
require_once dirname(__DIR__) . '/includes/modules/class.advancedsearchlistmodule.php';
require_once dirname(__DIR__) . '/includes/modules/class.itemmodule.php';
require_once dirname(__DIR__) . '/includes/modules/class.hierarchymodule.php';
defined('ENABLE_SHARED_RULES') || define('ENABLE_SHARED_RULES', true);
require_once dirname(__DIR__) . '/includes/modules/class.rulesmodule.php';

class ControlFlowOperations extends Operations {
	public array $searchKeys = [];

	public function getEmailAddressFromEntryID($entryid) {
		return '';
	}

	public function getEmailAddressFromSearchKey($searchKey) {
		$this->searchKeys[] = $searchKey;

		return 'resolved@example.test';
	}
}

class ControlFlowModule extends Module {
	public function singleEntryId(array $action) {
		return $this->getActionSingleEntryID($action);
	}
}

class ControlFlowListModule extends ListModule {
	public array $feedback = [];
	public array $listCalls = [];

	public function messageList($store, $entryid, $action, $actionType) {
		$this->listCalls[] = [$store, $entryid, $action, $actionType];
	}

	public function sendFeedback($success = false, $data = [], $addResponseDataToBus = true) {
		$this->feedback[] = $success;
	}
}

class ControlFlowAppointmentListModule extends AppointmentListModule {
	public array $feedback = [];
	public array $stopCalls = [];

	public function getActionStore($action) {
		return $action['test_store'] ?? false;
	}

	public function getActionEntryID($action) {
		return $action['entryid'] ?? false;
	}

	public function stopSearch($store, $entryid, $action) {
		$this->stopCalls[] = [$store, $entryid, $action];
	}

	public function sendFeedback($success = false, $data = [], $addResponseDataToBus = true) {
		$this->feedback[] = $success;
	}
}

class ControlFlowAdvancedSearchListModule extends AdvancedSearchListModule {
	public array $feedback = [];

	public function sendFeedback($success = false, $data = [], $addResponseDataToBus = true) {
		$this->feedback[] = $success;
	}
}

class ControlFlowItemModule extends ItemModule {
	public array $copyCalls = [];
	public array $deleteCalls = [];
	public array $feedback = [];
	public array $forwardCalls = [];

	public function getActionStore($action) {
		return 'store';
	}

	public function getActionParentEntryID($action) {
		return 'parent';
	}

	public function getActionEntryID($action) {
		return $action['test_entryid'] ?? false;
	}

	public function copy($store, $parententryid, $entryids, $action) {
		$this->copyCalls[] = $entryids;
	}

	public function delete($store, $parententryid, $entryid, $action) {
		$this->deleteCalls[] = $entryid;
	}

	public function forwardMeetingRequest($store, $entryid, $action, $directBookingMeetingRequest) {
		$this->forwardCalls[] = $entryid;
	}

	public function sendFeedback($success = false, $data = [], $addResponseDataToBus = true) {
		$this->feedback[] = $success;
	}
}

class ControlFlowCopyModule extends ItemModule {
	public array $feedback = [];

	public function sendFeedback($success = false, $data = [], $addResponseDataToBus = true) {
		$this->feedback[] = $success;
	}
}

class ControlFlowMapiSession {
	public array $openedStoreEntryids = [];

	public function getDefaultMessageStoreEntryId() {
		return 'store';
	}

	public function openMessageStore($entryid) {
		$this->openedStoreEntryids[] = $entryid;

		return false;
	}
}

class ControlFlowRulesModule extends RulesModule {
	public array $feedback = [];

	public function deleteRules($store) {}

	public function deleteOLClientRules($store = false) {}

	public function getRules($store) {
		return ['item' => []];
	}

	public function sendFeedback($success = false, $data = [], $addResponseDataToBus = true) {
		$this->feedback[] = $success;
	}
}

class ControlFlowBus {
	public array $data = [];

	public function addData($data) {
		$this->data[] = $data;
	}
}

class ControlFlowHierarchyModule extends HierarchyModule {
	public array $feedback = [];
	public int $folderPropsCalls = 0;

	public function getActionStore($action) {
		return 'store';
	}

	public function getActionParentEntryID($action) {
		return 'parent';
	}

	public function getFolderProps($store, $folder) {
		++$this->folderPropsCalls;

		return ['props' => []];
	}

	public function sendFeedback($success = false, $data = [], $addResponseDataToBus = true) {
		$this->feedback[] = $success;
	}
}

$operations = new ControlFlowOperations();
if ($operations->getEmailAddress('entry-id', true) !== '' || $operations->searchKeys !== []) {
	throw new RuntimeException('A boolean search-key sentinel reached the address-book lookup.');
}
if ($operations->getEmailAddress('entry-id', 'SMTP:user@example.test') !== 'resolved@example.test' ||
	$operations->searchKeys !== ['SMTP:user@example.test']) {
	throw new RuntimeException('A valid search key was not resolved.');
}

$recipients = $operations->convertLocalDistlistMembersToRecipients([]);
if ($recipients !== ['add' => [], 'remove' => []]) {
	throw new RuntimeException('An empty recipient list did not produce a complete result structure.');
}

$invalidateDoc = (new ReflectionMethod(Operations::class, 'invalidateResponseStore'))->getDocComment();
if (!is_string($invalidateDoc) || !preg_match('/@param\s+false\|string\s+\$folderEntryID\b/', $invalidateDoc)) {
	throw new RuntimeException('The response-store folder entry ID does not document its native conversion failure.');
}

$module = (new ReflectionClass(ControlFlowModule::class))->newInstanceWithoutConstructor();
if ($module->singleEntryId(['entryid' => ['6669727374', '7365636f6e64']]) !== false) {
	throw new RuntimeException('A multi-folder entry ID reached a scalar action.');
}
if ($module->singleEntryId(['entryid' => '666f6c646572']) !== 'folder') {
	throw new RuntimeException('A valid scalar folder entry ID was rejected.');
}

$listModule = (new ReflectionClass(ControlFlowListModule::class))->newInstanceWithoutConstructor();
$listModule->search(['first-store', 'second-store'], ['first-folder', 'second-folder'], ['use_searchfolder' => false], 'search');
if (count($listModule->listCalls) !== 1 || $listModule->feedback !== []) {
	throw new RuntimeException('A multi-folder calendar list search was rejected.');
}
$listModule->search(['first-store', 'second-store'], ['first-folder', 'second-folder'], ['use_searchfolder' => true], 'search');
if ($listModule->feedback !== [false]) {
	throw new RuntimeException('A multi-store server-side search reached scalar MAPI calls.');
}

$advancedSearchModule = (new ReflectionClass(ControlFlowAdvancedSearchListModule::class))->newInstanceWithoutConstructor();
$advancedSearchModule->search('store', false, ['use_searchfolder' => true], 'search');
$advancedSearchModule->search('store', '', ['use_searchfolder' => true], 'search');
$advancedSearchModule->search('store', ['first-item', 'second-item'], ['use_searchfolder' => true], 'search');
$advancedSearchDoc = (new ReflectionMethod(AdvancedSearchListModule::class, 'search'))->getDocComment();
if ($advancedSearchModule->feedback !== [false, false, false] || !is_string($advancedSearchDoc) ||
	!preg_match('/@param\s+false\|string\s+\$entryid\b/', $advancedSearchDoc)) {
	throw new RuntimeException('A malformed advanced-search entry ID reached MAPI operations.');
}

$appointmentModule = (new ReflectionClass(ControlFlowAppointmentListModule::class))->newInstanceWithoutConstructor();
$appointmentModule->data = ['stopsearch' => ['test_store' => 'store', 'search_folder_entryid' => '736561726368']];
$appointmentModule->execute();
if (count($appointmentModule->stopCalls) !== 1 || $appointmentModule->stopCalls[0][1] !== false || $appointmentModule->feedback !== []) {
	throw new RuntimeException('A stop-search request without a normal folder entry ID was rejected.');
}

$itemModule = (new ReflectionClass(ControlFlowItemModule::class))->newInstanceWithoutConstructor();
$bulkEntryids = ['first-item', 'second-item'];
$itemModule->data = [
	'save' => ['test_entryid' => $bulkEntryids, 'message_action' => ['action_type' => 'copy']],
	'delete' => ['test_entryid' => $bulkEntryids],
];
$itemModule->execute();
if ($itemModule->copyCalls !== [$bulkEntryids] || $itemModule->deleteCalls !== [$bulkEntryids]) {
	throw new RuntimeException('A bulk item copy or delete lost its entry ID list.');
}

$scalarMessageActionTypes = [
	'acceptMeetingRequest',
	'declineMeetingRequest',
	'acceptTaskRequest',
	'declineTaskRequest',
];
foreach ([false, ['first-item', 'second-item']] as $invalidEntryid) {
	foreach ($scalarMessageActionTypes as $messageActionType) {
		$itemModule->data = [
			'save' => [
				'test_entryid' => $invalidEntryid,
				'message_action' => ['action_type' => $messageActionType],
			],
		];
		$itemModule->execute();
	}
}
if ($itemModule->feedback !== array_fill(0, 8, false)) {
	throw new RuntimeException('A malformed meeting or task request entry ID reached message handling.');
}
$itemModule->feedback = [];

$itemModule->data = [
	'save' => ['test_entryid' => false, 'message_action' => ['action_type' => 'forwardMeetingRequest']],
];
$itemModule->execute();
$itemModule->data = [
	'save' => ['test_entryid' => ['first-item', 'second-item'], 'message_action' => ['action_type' => 'forwardMeetingRequest']],
];
$itemModule->execute();
$itemModule->data = [
	'save' => ['test_entryid' => 'appointment', 'message_action' => ['action_type' => 'forwardMeetingRequest']],
];
$itemModule->execute();
if ($itemModule->feedback !== [false, false] || $itemModule->forwardCalls !== ['appointment']) {
	throw new RuntimeException('A malformed meeting-forward entry ID reached message handling.');
}

$copyModule = (new ReflectionClass(ControlFlowCopyModule::class))->newInstanceWithoutConstructor();
foreach ([null, '0', 'not-hexadecimal'] as $destinationParentEntryid) {
	$messageAction = [];
	if ($destinationParentEntryid !== null) {
		$messageAction['destination_parent_entryid'] = $destinationParentEntryid;
	}
	$copyModule->copy('store', 'parent', 'entry-id', ['message_action' => $messageAction]);
}
foreach (['', '0', 'not-hexadecimal', []] as $destinationStoreEntryid) {
	$copyModule->copy('store', 'parent', 'entry-id', ['message_action' => [
		'destination_parent_entryid' => '706172656e74',
		'destination_store_entryid' => $destinationStoreEntryid,
	]]);
}
if ($copyModule->feedback !== [false, false, false, false, false, false, false]) {
	throw new RuntimeException('A missing or malformed copy destination reached MAPI operations.');
}

$mapiSession = new ControlFlowMapiSession();
$GLOBALS['mapisession'] = $mapiSession;
$copyModule->feedback = [];
$copyModule->copy('store', 'parent', 'entry-id', ['message_action' => [
	'destination_parent_entryid' => '706172656e74',
	'destination_store_entryid' => '73746f7265',
]]);
if ($mapiSession->openedStoreEntryids !== ['store'] || $copyModule->feedback !== [false]) {
	throw new RuntimeException('A valid copy destination store entry ID was rejected.');
}

$hierarchyModule = (new ReflectionClass(ControlFlowHierarchyModule::class))->newInstanceWithoutConstructor();
foreach (['open', 'foldersize'] as $actionType) {
	$hierarchyModule->data = [$actionType => []];
	$hierarchyModule->execute();
}
if ($hierarchyModule->feedback !== [false, false] || $hierarchyModule->folderPropsCalls !== 0) {
	throw new RuntimeException('A missing hierarchy entry ID opened the store root.');
}

$rulesModule = (new ReflectionClass(ControlFlowRulesModule::class))->newInstanceWithoutConstructor();
$rulesModule->id = 1;
$rulesModule->data = [
	'list' => ['store_entryid' => '73746f7265'],
	'save' => ['store_entryid' => '73746f7265'],
];
$rulesModule->errors = [];
$rulesModule->responseData = [];
$rulesBus = new ControlFlowBus();
$GLOBALS['bus'] = $rulesBus;
$executeRules = new ReflectionMethod(RulesModule::class, 'executeLocked');
$executeRules->invoke($rulesModule);
if ($rulesModule->feedback !== [] || count($rulesBus->data) !== 2 ||
	($rulesBus->data[0]['controlflowrulesmodule'][1]['list']['item'] ?? false) !== [] ||
	($rulesBus->data[1]['controlflowrulesmodule'][1]['update']['item'] ?? false) !== []) {
	throw new RuntimeException('An empty rules list was reported as a failed operation.');
}

echo "Operations control-flow checks passed\n";
