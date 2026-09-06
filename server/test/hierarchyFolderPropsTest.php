<?php

if (function_exists('mapi_msgstore_openentry')) {
	echo "Hierarchy folder property checks skipped with php-mapi loaded\n";

	return;
}

define('PR_WLINK_ENTRYID', 1);
define('PR_IPM_SUBTREE_ENTRYID', 2);
define('PR_MAILBOX_OWNER_ENTRYID', 3);
define('PR_DISPLAY_NAME', 4);
define('PR_MESSAGE_SIZE_EXTENDED', 5);
define('PR_CONTENT_COUNT', 6);
define('PR_QUOTA_WARNING_THRESHOLD', 7);
define('PR_PROHIBIT_SEND_QUOTA', 8);
define('PR_PROHIBIT_RECEIVE_QUOTA', 9);
define('ADDRESSBOOK_ENTRYID', 'addressbook');
define('OBJECT_SAVE', 1);

class Module {
	public $data;

	protected function getExecutionLockName() {}

	public function getEntryID() {}

	public function execute() {}

	public function handleException(&$e, $actionType = null, $store = null, $parententryid = null, $entryid = null, $action = null) {}

	public function getActionStore($action) {}

	public function getActionParentEntryID($action) {}

	public function getActionEntryID($action) {}

	protected function getActionSingleEntryID($action) {
		return $this->getActionEntryID($action);
	}
}

if (!function_exists('mapi_msgstore_openentry')) {
	function mapi_msgstore_openentry($store, $entryid) {
		return 'folder';
	}

	function mapi_getprops($object, $properties) {
		if ($properties === [PR_IPM_SUBTREE_ENTRYID]) {
			return [PR_IPM_SUBTREE_ENTRYID => "\x01"];
		}

		return [
			PR_MAILBOX_OWNER_ENTRYID => 'owner',
			PR_DISPLAY_NAME => 'store',
			PR_MESSAGE_SIZE_EXTENDED => 0,
			PR_CONTENT_COUNT => 0,
		];
	}
}

require_once dirname(__DIR__) . '/includes/modules/class.hierarchymodule.php';

class HierarchyModuleTestDouble extends HierarchyModule {
	public $folderPropsLoads = 0;
	public $copies = 0;

	public function __construct(array $data) {
		$this->data = $data;
	}

	public function getActionStore($action) {
		return 'store';
	}

	public function getActionParentEntryID($action) {
		return 'parent';
	}

	public function getActionEntryID($action) {
		return 'entry';
	}

	public function getFolderProps($store, $folder) {
		++$this->folderPropsLoads;

		return ['props' => ['container_class' => 'IPF.Contact']];
	}

	public function copyFolder($store, $parententryid, $sourcefolderentryid, $destfolderentryid, $deststore, $moveFolder) {
		++$this->copies;
	}
}

class HierarchyPermissionsTestDouble extends HierarchyModule {
	public $properties;
	public $storeGrantInput;

	public function __construct() {
		$this->properties = [];
	}

	public function getFolderPermissions($folder) {
		return false;
	}

	public function getStoreGrants(array $permissions): array {
		$this->storeGrantInput = $permissions;

		return $permissions;
	}
}

$GLOBALS['bus'] = new class {
	public $notifications = 0;

	public function notify(...$arguments) {
		++$this->notifications;
	}
};

$regularFolder = new HierarchyModuleTestDouble([
	'save' => [
		'store_entryid' => 'store',
		'message_action' => [
			'action_type' => 'copy',
			'destination_parent_entryid' => '01',
			'isSearchFolder' => false,
		],
	],
]);
$regularFolder->execute();

if ($regularFolder->folderPropsLoads !== 1 || $regularFolder->copies !== 1 || $GLOBALS['bus']->notifications !== 1) {
	throw new RuntimeException('Regular folder properties were not loaded before the copy notification.');
}

$GLOBALS['bus']->notifications = 0;
$searchFolder = new HierarchyModuleTestDouble([
	'save' => [
		'store_entryid' => 'store',
		'message_action' => [
			'action_type' => 'copy',
			'destination_parent_entryid' => '01',
			'isSearchFolder' => true,
		],
	],
]);
$searchFolder->execute();

if ($searchFolder->folderPropsLoads !== 0 || $searchFolder->copies !== 1 || $GLOBALS['bus']->notifications !== 0) {
	throw new RuntimeException('Search folder handling unexpectedly loaded regular folder properties.');
}

$GLOBALS['operations'] = new class {
	public function getProps($folder, $properties) {
		return [
			'entryid' => '01',
			'props' => [
				'container_class' => 'IPF.Note',
				'message_size' => 0,
			],
		];
	}
};
$GLOBALS['entryid'] = new class {
	public function compareEntryIds($left, $right) {
		return false;
	}
};
$GLOBALS['mapisession'] = new class {
	public function getUserEntryID() {
		return 'user';
	}
};

$permissionsFolder = new HierarchyPermissionsTestDouble();
$folderData = $permissionsFolder->getFolderProps('store', 'folder');

if ($permissionsFolder->storeGrantInput !== [] || $folderData['permissions']['item'] !== []) {
	throw new RuntimeException('Failed permission reads were not normalized before filtering.');
}

echo "Hierarchy folder property checks passed\n";
