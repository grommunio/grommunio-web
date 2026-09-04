<?php

if (function_exists('mapi_msgstore_openentry')) {
	echo "MAPI failure handling checks skipped with php-mapi loaded\n";

	return;
}

define('PR_ADDITIONAL_REN_ENTRYIDS_EX', 1);
define('PR_IPM_SUBTREE_ENTRYID', 2);
define('OPEN_IF_EXISTS', 1);
define('FOLDER_SEARCH', 2);
define('PR_DISPLAY_NAME', 3);
define('PR_STORE_ENTRYID', 4);
define('PR_ENTRYID', 5);
define('PR_IPM_APPOINTMENT_ENTRYID', 6);
define('ACCESS_TYPE_GRANT', 1);

class Module {
	protected function getExecutionLockName() {}

	public function getEntryID() {}

	public function execute() {}

	public function handleException(&$e, $actionType = null, $store = null, $parententryid = null, $entryid = null, $action = null) {}
}

class ItemModule extends Module {
	public function open($store, $entryid, $action) {}

	public function save($store, $parententryid, $entryid, $action, $actionType = 'save') {}

	public function delete($store, $parententryid, $entryid, $action) {}
}

class State {
	public static function forStore($name) {
		return new self();
	}

	public function open() {
		return true;
	}

	public function close() {}
}

$GLOBALS['testOneOffEntryId'] = false;
$GLOBALS['openEntryIds'] = [];
$GLOBALS['mapisession'] = new class {
	public function getDefaultMessageStore() {
		return 'store';
	}

	public function openMessageStore($entryId) {
		return 'store';
	}
};
$GLOBALS['entryid'] = new class {
	public function createMsgStoreEntryIdObj($entryId) {
		return ['MailboxDN' => '/o=test/cn=user'];
	}
};

if (!function_exists('mapi_msgstore_openentry')) {
	function mapi_createoneoff($displayName, $addressType, $emailAddress, $flags = 0) {
		return $GLOBALS['testOneOffEntryId'];
	}

	function mapi_msgstore_openentry($store, $entryId = null) {
		if (func_num_args() > 1 && $entryId === false) {
			throw new RuntimeException('A false entry ID reached mapi_msgstore_openentry.');
		}
		$GLOBALS['openEntryIds'][] = $entryId;

		return new stdClass();
	}

	function mapi_getprops($object, $properties) {
		if (in_array(PR_IPM_SUBTREE_ENTRYID, $properties, true)) {
			return [PR_IPM_SUBTREE_ENTRYID => 'subtree'];
		}
		if (in_array(PR_STORE_ENTRYID, $properties, true)) {
			return [
				PR_DISPLAY_NAME => 'Folder',
				PR_STORE_ENTRYID => 'store-entry-id',
				PR_ENTRYID => 'folder-entry-id',
			];
		}
		if (in_array(PR_IPM_APPOINTMENT_ENTRYID, $properties, true)) {
			return [PR_IPM_APPOINTMENT_ENTRYID => 'calendar-entry-id'];
		}

		return [];
	}

	function mapi_folder_createfolder($root, $name, $comment, $flags, $folderType) {
		return false;
	}

	function mapi_zarafa_getpermissionrules($folder, $type) {
		return false;
	}
}

require_once dirname(__DIR__) . '/includes/core/class.todolist.php';
require_once dirname(__DIR__) . '/includes/modules/class.contactitemmodule.php';
require_once dirname(__DIR__) . '/includes/modules/class.hierarchymodule.php';

if (TodoList::getTodoSearchFolder('store') !== false) {
	throw new RuntimeException('An unavailable To-do list was treated as a valid folder.');
}

$contact = (new ReflectionClass(ContactItemModule::class))->newInstanceWithoutConstructor();
$createOneOff = new ReflectionMethod(ContactItemModule::class, 'createOneOffEntryId');
$GLOBALS['testOneOffEntryId'] = "\x01\x02";
if ($createOneOff->invoke($contact, 'User', 'SMTP', 'user@example.test') !== "\x01\x02") {
	throw new RuntimeException('A valid one-off entry ID was not returned.');
}

$GLOBALS['testOneOffEntryId'] = false;

try {
	$createOneOff->invoke($contact, 'User', 'SMTP', 'user@example.test');

	throw new RuntimeException('A failed one-off entry ID was accepted.');
}
catch (RuntimeException $e) {
	if ($e->getMessage() !== 'Unable to create one-off entry ID') {
		throw $e;
	}
}

$hierarchy = (new ReflectionClass(HierarchyModule::class))->newInstanceWithoutConstructor();
$storeEntryId = new ReflectionProperty(HierarchyModule::class, 'store_entryid');
$storeEntryId->setValue($hierarchy, '00');
if ($hierarchy->getFolderPermissions(new stdClass()) !== false) {
	throw new RuntimeException('A failed ACL read was treated as a permission list.');
}

try {
	$hierarchy->setFolderPermissions(new stdClass(), []);

	throw new RuntimeException('An ACL update continued after its read failed.');
}
catch (RuntimeException $e) {
	if ($e->getMessage() !== 'Unable to read folder permissions') {
		throw $e;
	}
}

echo "MAPI failure handling checks passed\n";
