<?php

if (function_exists('mapi_openaddressbook')) {
	echo "Runtime contract checks skipped with php-mapi loaded\n";

	return;
}

defined('BASE_PATH') || define('BASE_PATH', dirname(__DIR__, 2) . '/');
defined('PT_BINARY') || define('PT_BINARY', 1);
defined('PR_IPM_APPOINTMENT_ENTRYID') || define('PR_IPM_APPOINTMENT_ENTRYID', 2);
defined('PR_MAPPING_SIGNATURE') || define('PR_MAPPING_SIGNATURE', 3);
defined('PR_ENTRYID') || define('PR_ENTRYID', 4);

if (!class_exists('MAPIException')) {
	class MAPIException extends Exception {
		public function setHandled() {}
	}
}

$GLOBALS['runtimeContractPropertyTag'] = 0x7C080102;
$GLOBALS['runtimeContractAddressbook'] = false;
$GLOBALS['runtimeContractAddressbookCalls'] = 0;
$GLOBALS['runtimeContractOpenEntries'] = [];
$GLOBALS['runtimeContractProperties'] = [];

if (!function_exists('mapi_openaddressbook')) {
	function mapi_prop_tag($type, $id) {
		return $GLOBALS['runtimeContractPropertyTag'];
	}

	function mapi_openaddressbook($session) {
		++$GLOBALS['runtimeContractAddressbookCalls'];

		return $GLOBALS['runtimeContractAddressbook'];
	}

	function mapi_msgstore_openentry($store, $entryid = null) {
		return array_shift($GLOBALS['runtimeContractOpenEntries']);
	}

	function mapi_getprops($object, $properties = null) {
		return $GLOBALS['runtimeContractProperties'];
	}
}

require_once dirname(__DIR__) . '/includes/core/class.categorylist.php';
require_once dirname(__DIR__) . '/includes/core/class.mapisession.php';
require_once dirname(__DIR__) . '/includes/core/class.operations.php';

$propertyTag = new ReflectionMethod(CategoryList::class, 'roamingXmlStreamTag');
if ($propertyTag->invoke(null) !== 0x7C080102) {
	throw new RuntimeException('The category-list property tag was not returned.');
}

$GLOBALS['runtimeContractPropertyTag'] = false;

try {
	$propertyTag->invoke(null);

	throw new RuntimeException('A failed property-tag lookup was accepted.');
}
catch (RuntimeException $e) {
	if ($e->getMessage() === 'A failed property-tag lookup was accepted.') {
		throw $e;
	}
}

$calendarFolder = new ReflectionMethod(CategoryList::class, 'getCalendarFolder');
$GLOBALS['runtimeContractOpenEntries'] = [false];
$categoryList = new CategoryList('store');
if ($calendarFolder->invoke($categoryList) !== false) {
	throw new RuntimeException('A failed Calendar root open was accepted.');
}
$GLOBALS['runtimeContractOpenEntries'] = [false];
if ($categoryList->getXml() !== '') {
	throw new RuntimeException('A missing Calendar did not produce an empty category list.');
}

$GLOBALS['runtimeContractOpenEntries'] = ['root', false];
$GLOBALS['runtimeContractProperties'] = [PR_IPM_APPOINTMENT_ENTRYID => 'calendar-id'];
if ($calendarFolder->invoke(new CategoryList('store')) !== false) {
	throw new RuntimeException('A failed Calendar folder open was accepted.');
}

$GLOBALS['runtimeContractOpenEntries'] = ['root', 'calendar'];
$categoryList = new CategoryList('store');
if ($calendarFolder->invoke($categoryList) !== 'calendar' ||
	$calendarFolder->invoke($categoryList) !== 'calendar' ||
	$GLOBALS['runtimeContractOpenEntries'] !== []) {
	throw new RuntimeException('The opened Calendar folder was not cached.');
}

class RuntimeContractMAPISession extends MAPISession {
	public function setupContactProviderAddressbook($loadSharedContactsProvider) {}
}

$session = new RuntimeContractMAPISession();
$session->setSession('session');
if ($session->getAddressbook(true) !== false) {
	throw new RuntimeException('A failed providerless address-book open did not return false.');
}
if ($session->getAddressbook() !== false) {
	throw new RuntimeException('A failed cached address-book open did not return false.');
}

$GLOBALS['runtimeContractAddressbook'] = 'address-book';
if ($session->getAddressbook() !== 'address-book') {
	throw new RuntimeException('The opened address book was not returned.');
}
$GLOBALS['runtimeContractAddressbook'] = 'unexpected-second-address-book';
if ($session->getAddressbook() !== 'address-book' || $GLOBALS['runtimeContractAddressbookCalls'] !== 3) {
	throw new RuntimeException('The opened address book was not cached.');
}

$operations = new Operations();
$folderProps = [];
$missingTargets = [
	[false, 'parent'],
	['store', false],
	['store', ''],
];
foreach ($missingTargets as [$store, $parentEntryId]) {
	if ($operations->saveAppointment($store, false, $parentEntryId, []) !== false) {
		throw new RuntimeException('An appointment with an incomplete target was accepted.');
	}
}
$GLOBALS['runtimeContractOpenEntries'] = ['unexpected-open'];
if ($operations->copyFolder('store', 'parent', 'source', 'destination', false, false, $folderProps) !== false ||
	$GLOBALS['runtimeContractOpenEntries'] !== ['unexpected-open']) {
	throw new RuntimeException('A missing destination store reached the MAPI folder API.');
}
if ($operations->getMessageProps('store', false, []) !== [] || $operations->getProps(false, []) !== []) {
	throw new RuntimeException('A missing MAPI object was passed to the property API.');
}

$GLOBALS['mapisession'] = new class {
	public $store = false;

	public function getDefaultMessageStore() {
		return $this->store;
	}
};
$properties = new Properties();
$properties->Init();
$initialized = new ReflectionProperty(Properties::class, 'init');
if ($initialized->getValue($properties) !== false || $properties->getStore() !== false) {
	throw new RuntimeException('Properties was initialized without a message store.');
}

$GLOBALS['mapisession']->store = 'store';
$GLOBALS['runtimeContractProperties'] = [PR_MAPPING_SIGNATURE => 'signature'];
$properties->Init();
if ($initialized->getValue($properties) !== true || $properties->getStore() !== 'store') {
	throw new RuntimeException('Properties did not initialize after a store became available.');
}

echo "Runtime contract checks passed\n";
