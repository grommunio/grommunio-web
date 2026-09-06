<?php

if (function_exists('mapi_msgstore_openentry')) {
	echo "Exception-path contract checks skipped with php-mapi loaded\n";

	return;
}

set_error_handler(static function (int $severity, string $message, string $file, int $line): never {
	throw new ErrorException($message, 0, $severity, $file, $line);
});
ini_set('error_log', '/dev/null');

define('BASE_PATH', dirname(__DIR__, 2) . '/');
define('PR_ENTRYID', 1);
define('PR_PARENT_ENTRYID', 2);
define('PR_STORE_ENTRYID', 3);
define('PR_MDB_PROVIDER', 4);
define('PR_IPM_SUBTREE_ENTRYID', 5);
define('PR_IPM_PUBLIC_FOLDERS_ENTRYID', 6);
define('PR_STORE_SUPPORT_MASK', 7);
define('PR_FINDER_ENTRYID', 8);
define('PR_DISPLAY_NAME', 9);
define('ZARAFA_STORE_PUBLIC_GUID', 'public-store');
define('STORE_SEARCH_OK', 1);

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

class MAPIException extends Exception {
	public bool $handled = false;

	public function setHandled(): void {
		$this->handled = true;
	}
}

class Module {
	public $data = [];
	public $id = 1;
	public $properties = [];
	public $responseData = [];

	public function execute() {}

	public function handleException(&$e, $actionType = null, $store = null, $parententryid = null, $entryid = null, $action = null) {}

	public function addActionData($actionType, $data) {
		$this->responseData[$actionType] = $data;
	}

	public function getResponseData() {
		return $this->responseData;
	}

	public function sendFeedback($success = false, $data = [], $addResponseDataToBus = true) {}
}

class Conversion {
	public static function mapXML2MAPI($properties, $values) {
		return [];
	}

	public static function mapMAPI2XML($properties, $values) {
		return [];
	}
}

$GLOBALS['exceptionPathMapiGetPropsCalls'] = 0;
$GLOBALS['exceptionPathOpenMode'] = 'success';
$GLOBALS['exceptionPathOpenExceptions'] = [];

if (!function_exists('mapi_msgstore_openentry')) {
	function mapi_getprops($object, $properties = null) {
		++$GLOBALS['exceptionPathMapiGetPropsCalls'];

		return [
			PR_ENTRYID => 'store-entry-id',
			PR_MDB_PROVIDER => 'private-store',
			PR_IPM_SUBTREE_ENTRYID => 'subtree',
			PR_IPM_PUBLIC_FOLDERS_ENTRYID => 'public-folders',
			PR_STORE_SUPPORT_MASK => STORE_SEARCH_OK,
			PR_FINDER_ENTRYID => 'finder-root-id',
			PR_DISPLAY_NAME => 'store',
		];
	}

	function mapi_msgstore_openentry($store, $entryid = null) {
		if ($GLOBALS['exceptionPathOpenMode'] === 'throw') {
			$exception = new MAPIException('open failed');
			$GLOBALS['exceptionPathOpenExceptions'][] = $exception;

			throw $exception;
		}

		return 'finder-root';
	}
}

require_once dirname(__DIR__) . '/includes/core/class.mapisession.php';
require_once dirname(__DIR__) . '/includes/modules/class.itemmodule.php';
require_once dirname(__DIR__) . '/includes/modules/class.createmailitemmodule.php';
require_once dirname(__DIR__) . '/includes/modules/class.listmodule.php';

class ExceptionPathMapiSession extends MAPISession {
	public function getContactFolders($store, $folderEntryid, $depthSearch) {
		throw new RuntimeException('contact folder unavailable');
	}
}

class ExceptionPathCreateMailModule extends CreateMailItemModule {
	public array $sourceInfo = [];

	public function getSourceMsgInfo($action) {
		return $this->sourceInfo;
	}
}

class ExceptionPathItemModule extends ItemModule {
	public array $feedback = [];

	public function sendFeedback($success = false, $data = [], $addResponseDataToBus = true) {
		$this->feedback[] = $success;
	}
}

class ExceptionPathOperations {
	public array $openResults = [];
	public array $openedStores = [];
	public array $handledExceptions = [];
	public array $recipientInputs = [];
	public int $saveCalls = 0;
	public int $copyCalls = 0;

	public function openMessage($store, $entryid) {
		$this->openedStores[] = $store;
		$result = array_shift($this->openResults);
		if ($result instanceof MAPIException) {
			$this->handledExceptions[] = $result;

			throw $result;
		}

		return $result;
	}

	public function getRecipientsInfo($message) {
		return [['props' => ['email_address' => 'saved@example.test']]];
	}

	public function convertLocalDistlistMembersToRecipients($recipients, $remove) {
		$this->recipientInputs[] = $recipients;

		return ['add' => [], 'remove' => []];
	}

	public function submitMessage(...$arguments) {
		return 'test-error';
	}

	public function parseDistListAndAddToRecipientHistory(...$arguments) {}

	public function saveMessage(...$arguments) {
		++$this->saveCalls;

		return false;
	}

	public function copyMessages(...$arguments) {
		++$this->copyCalls;

		return false;
	}
}

$GLOBALS['PluginManager'] = new class {
	public function triggerHook($name, $arguments) {}
};
$GLOBALS['mapisession'] = new class {
	public $defaultStore = 'default-store';

	public function getDefaultMessageStore() {
		return $this->defaultStore;
	}

	public function openMessageStore($entryid) {
		return 'source-store';
	}
};
$GLOBALS['bus'] = new class {
	public int $notifications = 0;

	public function addData($data) {}

	public function notify(...$arguments) {
		++$this->notifications;
	}
};

$mapiSession = (new ReflectionClass(ExceptionPathMapiSession::class))->newInstanceWithoutConstructor();
if ($mapiSession->getContactFoldersForABContactProvider('store') !== []) {
	throw new RuntimeException('A failed contact-folder lookup did not return an empty list');
}

$createMail = (new ReflectionClass(ExceptionPathCreateMailModule::class))->newInstanceWithoutConstructor();
$createMail->properties = [];
$handleSend = new ReflectionMethod(CreateMailItemModule::class, 'handleSend');

$operations = new ExceptionPathOperations();
$fallbackException = new MAPIException('active store unavailable');
$operations->openResults = [$fallbackException, 'draft-message'];
$GLOBALS['operations'] = $operations;
$action = ['message_action' => ['action_type' => 'edit_as_new'], 'props' => []];
$messageProps = [];
$arguments = ['active-store', 'draft-entry-id', 'parent', &$action, [], &$messageProps, false, false, false];
$handleSend->invokeArgs($createMail, $arguments);
if ($operations->openedStores !== ['active-store', 'default-store'] || !$fallbackException->handled ||
	$operations->recipientInputs !== [['saved' => [['email_address' => 'saved@example.test']]]]) {
	throw new RuntimeException('Draft recipient lookup did not use the default-store fallback');
}

$operations = new ExceptionPathOperations();
$firstException = new MAPIException('active store unavailable');
$secondException = new MAPIException('default store unavailable');
$operations->openResults = [$firstException, $secondException];
$GLOBALS['operations'] = $operations;
$action = ['message_action' => ['action_type' => 'edit_as_new'], 'props' => []];
$messageProps = [];
$arguments = ['active-store', 'draft-entry-id', 'parent', &$action, [], &$messageProps, false, false, false];
$handleSend->invokeArgs($createMail, $arguments);
if (!$firstException->handled || !$secondException->handled || $operations->recipientInputs !== [[]]) {
	throw new RuntimeException('A double draft-open failure did not preserve the empty-recipient path');
}

$operations = new ExceptionPathOperations();
$fallbackException = new MAPIException('active store unavailable');
$operations->openResults = [$fallbackException];
$GLOBALS['operations'] = $operations;
$GLOBALS['mapisession']->defaultStore = false;
$action = ['message_action' => ['action_type' => 'edit_as_new'], 'props' => []];
$messageProps = [];
$arguments = ['active-store', 'draft-entry-id', 'parent', &$action, [], &$messageProps, false, false, false];
$handleSend->invokeArgs($createMail, $arguments);
if (!$fallbackException->handled || $operations->openedStores !== ['active-store'] ||
	$operations->recipientInputs !== [[]]) {
	throw new RuntimeException('An unavailable default store was passed to the draft-open fallback');
}
$GLOBALS['mapisession']->defaultStore = 'default-store';

$operations = new ExceptionPathOperations();
$operations->openResults = [false, 'unexpected-fallback-message'];
$GLOBALS['operations'] = $operations;
$action = ['message_action' => ['action_type' => 'edit_as_new'], 'props' => []];
$messageProps = [];
$arguments = ['active-store', 'draft-entry-id', 'parent', &$action, [], &$messageProps, false, false, false];
$handleSend->invokeArgs($createMail, $arguments);
if ($operations->openedStores !== ['active-store'] || $operations->recipientInputs !== [[]]) {
	throw new RuntimeException('A false active-store result unexpectedly triggered the fallback');
}

$operations = new ExceptionPathOperations();
$sourceException = new MAPIException('source message unavailable');
$operations->openResults = [$sourceException];
$GLOBALS['operations'] = $operations;
$createMail->sourceInfo = [
	'source_message_info' => str_repeat('0', 48) . '00',
	'storeEntryid' => 'source-store-id',
];
$getPropsCalls = $GLOBALS['exceptionPathMapiGetPropsCalls'];
$createMail->setReplyForwardInfo([]);
if (!$sourceException->handled || $operations->saveCalls !== 0 ||
	$GLOBALS['exceptionPathMapiGetPropsCalls'] !== $getPropsCalls || $GLOBALS['bus']->notifications !== 0) {
	throw new RuntimeException('A failed reply-source lookup continued into message updates');
}

$operations = new ExceptionPathOperations();
$GLOBALS['operations'] = $operations;
$itemModule = (new ReflectionClass(ExceptionPathItemModule::class))->newInstanceWithoutConstructor();
$itemModule->skipCopyProperties = [];
$itemModule->copy('store', 'parent', 'entry-id', [
	'message_action' => [
		'action_type' => 'copy',
		'destination_parent_entryid' => '64657374',
	],
]);
if ($operations->copyCalls !== 1 || $itemModule->feedback !== [false]) {
	throw new RuntimeException('A failed copy did not report its assigned operation result');
}

$listModule = (new ReflectionClass(ListModule::class))->newInstanceWithoutConstructor();
$GLOBALS['exceptionPathOpenMode'] = 'success';
if ($listModule->getSearchFoldersRoot('store') !== 'finder-root') {
	throw new RuntimeException('A successful finder-root open was not returned');
}
$GLOBALS['exceptionPathOpenMode'] = 'throw';
if ($listModule->getSearchFoldersRoot('store') !== false ||
	!end($GLOBALS['exceptionPathOpenExceptions'])->handled) {
	throw new RuntimeException('A failed finder-root open was not handled as unavailable');
}

restore_error_handler();
echo "Exception-path contract checks passed\n";
