<?php

/*
 * SPDX-FileCopyrightText: Copyright 2020 - 2026 grommunio GmbH
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

// A meeting request still opens when the calendar it belongs to cannot be read.
// Runs in a child PHP without extensions so the mapi functions can be stubbed.
$child = <<<'PHP'
	define('MAPI_E_NOT_FOUND', (int) 0x8004010F);
	define('MAPI_E_NO_ACCESS', (int) 0x80070005);
	define('MAPI_E_STORE_FULL', (int) 0x8004060C);
	define('MAPI_E_CALL_FAILED', (int) 0x80004005);
	define('PR_MESSAGE_CLASS', 1);
	define('PR_IPM_SENTMAIL_ENTRYID', 2);
	define('PR_PARENT_ENTRYID', 3);

	class GrommunioException extends Exception {}

	class MAPIException extends Exception {}

	function mapi_getprops($object, $props = null) {
		return $object === 'message' ? [PR_MESSAGE_CLASS => 'IPM.Schedule.Meeting.Request'] : [];
	}

	function class_match_prefix($h, $n) {
		return strncasecmp($h, $n, strlen($n)) === 0;
	}

	class Meetingrequest {
		public function __construct(...$args) {}

		public function isMeetingRequestResponse($class = null) {
			return false;
		}

		public function isMeetingRequest($class = null) {
			return true;
		}

		public function isLocalOrganiser() {
			// what gromox answers for a calendar the user has no read rights on
			throw new MAPIException('not found', $GLOBALS['code']);
		}
	}

	$GLOBALS['operations'] = new class {
		public function openMessage($store, $entryid) {
			return 'message';
		}

		public function getMessageProps($store, $message, $properties, $plaintext, $html) {
			return ['props' => ['message_class' => 'IPM.Schedule.Meeting.Request', 'subject' => '190 Delegat']];
		}
	};
	$GLOBALS['mapisession'] = new class {
		public function getSession() {
			return 'session';
		}
	};
	$GLOBALS['PluginManager'] = new class {
		public function triggerHook($name, $data) {}
	};
	$GLOBALS['bus'] = new class {
		public $data;

		public function addData($data) {
			$this->data = $data;
		}
	};

	require $argv[1] . '/includes/modules/class.module.php';
	require $argv[1] . '/includes/modules/class.itemmodule.php';

	class Harness extends ItemModule {
		public function __construct() {
			$this->properties = [];
			$this->plaintext = false;
			$this->directBookingMeetingRequest = false;
		}

		public function addActionData($type, $data) {
			$this->opened = $data;
		}

		public function getResponseData() {
			return [];
		}
	}

	$GLOBALS['code'] = MAPI_E_NOT_FOUND;
	$module = new Harness();
	$module->open('store', 'entryid', []);
	if (($module->opened['item']['props']['subject'] ?? null) !== '190 Delegat') {
		echo "the request did not open\n";

		exit(1);
	}

	$GLOBALS['code'] = MAPI_E_CALL_FAILED;
	try {
		(new Harness())->open('store', 'entryid', []);
		echo "other MAPI errors are swallowed\n";

		exit(1);
	}
	catch (MAPIException $e) {
	}
	echo "ok\n";
PHP;

$file = tempnam(sys_get_temp_dir(), 'imuc');
file_put_contents($file, "<?php\n" . $child);
$out = [];
exec(escapeshellarg(PHP_BINARY) . ' -n ' . escapeshellarg($file) . ' ' . escapeshellarg(dirname(__DIR__)) . ' 2>&1', $out, $status);
unlink($file);
if ($status !== 0 || end($out) !== 'ok') {
	throw new RuntimeException("Unreadable calendar checks failed:\n" . implode("\n", $out));
}
echo "Unreadable calendar checks passed\n";
