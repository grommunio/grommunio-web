<?php

/*
 * SPDX-FileCopyrightText: Copyright 2020 - 2026 grommunio GmbH
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

namespace Files\Core\Util {
	// Namespaced stand-ins take precedence over the MAPI extension.
	const PR_ATTACH_LONG_FILENAME = 1;
	const PR_ATTACH_FILENAME = 2;
	const PR_DISPLAY_NAME = 3;
	const PR_ATTACH_DATA_BIN = 4;
	const IID_IStream = 'stream';
	const BLOCK_SIZE = 1024;

	function mapi_msgstore_openentry($store, $entryid) {
		return ['message' => $entryid];
	}

	function mapi_message_openattach($message, $num) {
		return ['name' => $message['message']];
	}

	function mapi_attach_getprops($attachment, $tags) {
		return [PR_ATTACH_LONG_FILENAME => $attachment['name'] . '.txt'];
	}

	function mapi_openproperty($attachment, $tag, $iid, $a, $b) {
		return (object) ['data' => 'data', 'pos' => 0];
	}

	function mapi_stream_stat($stream) {
		return ['cb' => strlen((string) $stream->data)];
	}

	function mapi_stream_read($stream, $len) {
		$chunk = substr((string) $stream->data, $stream->pos, $len);
		$stream->pos += $len;

		return $chunk;
	}
}

namespace {
	use Files\Backend\Exception as BackendException;

	if (!function_exists('_')) {
		function _($message) {
			return $message;
		}
	}
	if (!class_exists('GrommunioException')) {
		class GrommunioException extends Exception {}
	}
	if (!class_exists('MAPIException')) {
		class MAPIException extends Exception {}
	}

	$temporaryDirectory = sys_get_temp_dir() . '/grommunio-files-browser-' . bin2hex(random_bytes(8));
	mkdir($temporaryDirectory, 0700);
	define('TMP_PATH', $temporaryDirectory);
	$root = dirname(__DIR__, 3) . '/';
	// keeps the session-bound encryption store out
	define('BASE_PATH', $temporaryDirectory . '/');
	define('PLUGIN_FILESBROWSER_LOGLEVEL', 'NONE');
	defined('ERROR_GENERAL') || define('ERROR_GENERAL', 2);
	defined('REQUEST_ENTRYID') || define('REQUEST_ENTRYID', 'entryid');
	defined('OBJECT_SAVE') || define('OBJECT_SAVE', 1);
	defined('OBJECT_DELETE') || define('OBJECT_DELETE', 2);

	require_once $root . 'server/includes/core/class.bus.php';
	require_once $root . 'server/includes/modules/class.module.php';
	require_once $root . 'server/includes/modules/class.listmodule.php';
	chdir($root);

	require_once $root . 'plugins/files/php/class.filesbrowsermodule.php';

	$GLOBALS['mapisession'] = new class {
		public function openMessageStore($id) {
			return 'store';
		}
	};

	class FakeBackend {
		public $uploaded = [];
		public $listed = [];
		public $failing = [];
		public $throwing = [];
		public $moveFails = false;
		public $lsFails = false;
		public $backendDisplayName = 'fake';
		public $backendVersion = '1';

		public function getAccountID() {
			return 'acc';
		}

		public function put_file($path, $tmpname) {
			if (in_array($path, $this->throwing, true)) {
				throw new BackendException('Connection failed', 500);
			}
			if (in_array($path, $this->failing, true)) {
				return false;
			}
			$this->uploaded[] = $path;

			return true;
		}

		public function ls($path) {
			if ($this->lsFails) {
				throw new BackendException('The file or folder is not available anymore.', 404);
			}
			$this->listed[] = $path;

			return array_fill_keys($this->uploaded, ['resourcetype' => 'file']);
		}

		public function move($src, $dst, $overwrite) {
			if ($this->moveFails) {
				throw new BackendException('The file or folder is not available anymore.', 404);
			}

			return true;
		}
	}

	class TestBrowser extends FilesBrowserModule {
		public $backend;
		public $cached = [];

		public function __construct() {
			$this->id = 'browser';
			$this->responseData = [];
			$this->uid = 'u';
		}

		public function accountFromNode($nodeID) {
			return new class {
				public function getId() {
					return 'acc';
				}
			};
		}

		public function initializeBackend($account, $setID = false) {
			return $this->backend;
		}

		public function getCache($accountID, $path) {
			return $this->cached[$path] ?? null;
		}

		public function setCache($accountID, $path, $data) {
			$this->cached[$path] = $data;
		}

		public function deleteCache($accountID, $path) {
			unset($this->cached[$path]);
		}

		public function getVersionFromCache($displayName, $accountID = '') {
			return null;
		}

		public function setVersionInCache($displayName, $version, $accountID = '') {}
	}

	class QuietBus extends Bus {
		public function notify($entryID, $event, $data = null) {}
	}

	function check($cond, $msg) {
		if (!$cond) {
			throw new RuntimeException($msg);
		}
	}

	function attachment($name) {
		return ['store' => bin2hex('s'), 'entryid' => bin2hex($name), 'attachNum' => [0]];
	}

	// a failed upload neither stops the remaining ones nor reaches the directory cache
	$GLOBALS['bus'] = new Bus();
	$module = new TestBrowser();
	$module->backend = new FakeBackend();
	$module->backend->failing = ['/dir/b.txt'];
	$upload = new ReflectionMethod(FilesBrowserModule::class, 'uploadToBackend');
	$result = $upload->invoke($module, 'uploadtobackend', [
		'destdir' => '#R#acc/dir/',
		'type' => 'attachment',
		'items' => [attachment('a'), attachment('b'), attachment('c')],
	]);
	check($result === false, 'a failed upload is reported');
	check($module->backend->uploaded === ['/dir/a.txt', '/dir/c.txt'], 'remaining files are uploaded');
	check(array_keys($module->cached['/dir']) === ['/dir/a.txt', '/dir/c.txt'], 'only uploaded files are cached');
	check($GLOBALS['bus']->getData()[$module->getModuleName()]['browser']['uploadtobackend']['status'] === false, 'failure status');
	check(glob($temporaryDirectory . '/*') === [], 'temporary files removed');

	// a throwing upload still removes its temporary file
	$module->backend = new FakeBackend();
	$module->backend->throwing = ['/dir/a.txt'];
	try {
		$upload->invoke($module, 'uploadtobackend', ['destdir' => '#R#acc/dir/', 'type' => 'attachment', 'items' => [attachment('a')]]);
		check(false, 'upload exception swallowed');
	}
	catch (BackendException $e) {
		check(glob($temporaryDirectory . '/*') === [], 'temporary file removed after an exception');
	}

	// an unknown type answers with the error alone
	$GLOBALS['bus'] = new Bus();
	$module = new TestBrowser();
	$module->backend = new FakeBackend();
	$result = $upload->invoke($module, 'uploadtobackend', ['destdir' => '#R#acc/dir/', 'type' => 'contact', 'items' => []]);
	check($result === false, 'unknown type fails');
	check(array_keys($GLOBALS['bus']->getData()[$module->getModuleName()]['browser']) === ['error'], 'unknown type reports only the error');

	function runRename($backend, $source = '#R#acc/dir/old/') {
		$GLOBALS['bus'] = new QuietBus();
		$module = new TestBrowser();
		$module->backend = $backend;
		$module->data = ['save' => [
			'entryid' => 'e', 'parent_entryid' => 'p', 'store_entryid' => 's',
			'props' => ['filename' => 'q'],
			'message_action' => ['source_folder_id' => $source],
		]];
		$module->execute();

		return $GLOBALS['bus']->getData()[$module->getModuleName()]['browser'];
	}

	// a failure after the rename response reaches the bus adds only the error
	$backend = new FakeBackend();
	$backend->lsFails = true;
	$response = runRename($backend);
	check(isset($response['update']['item']), 'rename response kept');
	check($response['error']['info']['code'] === 404, 'follow-up error reported');

	$backend = new FakeBackend();
	$backend->moveFails = true;
	$response = runRename($backend);
	check(array_keys($response) === ['error'], 'failed rename reports only the error');

	// without an isFolder hint only a folder rename refreshes the subfolders
	$backend = new FakeBackend();
	runRename($backend, '#R#acc/dir/old.txt');
	check($backend->listed === [], 'file rename lists no subfolders');
	$backend = new FakeBackend();
	runRename($backend);
	check($backend->listed !== [], 'folder rename lists its subfolders');

	rmdir($temporaryDirectory);
	echo "browserModuleTest: OK\n";
}
