<?php

/*
 * SPDX-FileCopyrightText: Copyright 2020 - 2026 grommunio GmbH
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

// Opening a meeting forward notification adds the forwarded attendees to the
// organizer's meeting. Runs in a child PHP without extensions so the mapi
// functions can be stubbed; the second argument picks the scenario.
$child = <<<'PHP'
	define('MAPI_E_NOT_FOUND', (int) 0x8004010F);
	define('MAPI_E_NO_ACCESS', (int) 0x80070005);
	define('MAPI_E_STORE_FULL', (int) 0x8004060C);
	define('PR_MESSAGE_CLASS', 1);
	define('PR_IPM_SENTMAIL_ENTRYID', 2);
	define('PR_PARENT_ENTRYID', 3);
	define('PR_ENTRYID', 4);
	define('PR_STORE_ENTRYID', 5);
	define('TABLE_SAVE', 6);
	define('GOID2', 7);

	[, $root, $scenario] = $argv;
	$class = $scenario === 'other' ? 'IPM.Schedule.Meeting.Notification.Accept' : 'IPM.Schedule.Meeting.Notification.Forward';

	class GrommunioException extends Exception {}

	class MAPIException extends Exception {}

	function mapi_getprops($object, $props = null) {
		return match ($object) {
			'message' => [PR_MESSAGE_CLASS => $GLOBALS['class'], PR_PARENT_ENTRYID => $GLOBALS['scenario'] === 'sent' ? 'sent' : 'inbox', GOID2 => 'goid'],
			'store' => [PR_IPM_SENTMAIL_ENTRYID => 'sent'],
			'calitem' => [PR_ENTRYID => 'cal-eid', PR_PARENT_ENTRYID => 'cal', PR_STORE_ENTRYID => 'store-eid'],
			default => [],
		};
	}

	function mapi_msgstore_openentry($store, $entryid) {
		return $entryid === 'cal-eid' ? 'calitem' : false;
	}

	function class_match_prefix($h, $n) {
		return strncasecmp($h, $n, strlen($n)) === 0;
	}

	if ($scenario === 'old') {
		class Meetingrequest {
			public function __construct(...$args) {
				$GLOBALS['log'][] = 'constructed';
			}
		}
	}
	else {
		class Meetingrequest {
			public $message = 'message';
			public $proptags = ['goid2' => GOID2];

			public function __construct(...$args) {}

			public function processMeetingForwardNotification() {
				$GLOBALS['log'][] = 'processed';

				return true;
			}

			public function findCalendarItems($goid, $calendar = false, $useCleanGlobalId = false) {
				$GLOBALS['log'][] = 'find';

				return ['cal-eid'];
			}

			public function isInCalendar() {
				return false;
			}

			public function __call($name, $args) {
				$GLOBALS['log'][] = $name;

				return false;
			}
		}
	}

	$GLOBALS['log'] = [];
	$GLOBALS['operations'] = new class {
		public function openMessage($store, $entryid) {
			return 'message';
		}

		public function getMessageProps($store, $message, $properties, $plaintext, $html) {
			return ['props' => ['message_class' => $GLOBALS['class'], 'subject' => 'Your meeting has been forwarded']];
		}
	};
	$GLOBALS['mapisession'] = new class {
		public function getSession() {
			return 'session';
		}
	};
	$GLOBALS['entryid'] = new class {
		public function compareEntryIds($a, $b) {
			return $a === $b;
		}
	};
	$GLOBALS['PluginManager'] = new class {
		public function triggerHook($name, $data) {}
	};
	$GLOBALS['bus'] = new class {
		public $notified = [];

		public function notify($id, $type, $props) {
			$this->notified[] = [$id, $type, $props[PR_ENTRYID]];
		}

		public function addData($data) {}
	};

	require $root . '/includes/modules/class.module.php';
	require $root . '/includes/modules/class.itemmodule.php';

	class Harness extends ItemModule {
		public $opened;

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

	$module = new Harness();
	$module->open('store', 'entryid', []);
	echo json_encode([
		'log' => $GLOBALS['log'],
		'notified' => $GLOBALS['bus']->notified,
		'not_found' => $module->opened['item']['props']['appointment_not_found'] ?? false,
	]), "\n";
PHP;

$file = tempnam(sys_get_temp_dir(), 'imfn');
file_put_contents($file, "<?php\n" . $child);

function runForwardNotification($file, $scenario) {
	$out = [];
	exec(escapeshellarg(PHP_BINARY) . ' -n ' . escapeshellarg($file) . ' ' . escapeshellarg(dirname(__DIR__)) . ' ' . $scenario . ' 2>&1', $out, $status);
	$result = $status === 0 ? json_decode((string) end($out), true) : null;
	if (!is_array($result)) {
		throw new RuntimeException("Forward notification child failed:\n" . implode("\n", $out));
	}

	return $result;
}

function assertForwardNotification($condition, $message) {
	if (!$condition) {
		throw new RuntimeException($message);
	}
}

try {
	$inbox = runForwardNotification($file, 'inbox');
	assertForwardNotification($inbox['log'] === ['processed', 'find'], 'The forward notification was not processed: ' . json_encode($inbox['log']));
	assertForwardNotification($inbox['notified'] === [[bin2hex('cal'), 6, 'cal-eid']], 'The calendar was not told about the new attendees');
	assertForwardNotification($inbox['not_found'] === false, 'The forward notification claimed a missing meeting');

	$sent = runForwardNotification($file, 'sent');
	assertForwardNotification($sent['log'] === [] && $sent['notified'] === [], 'A sent forward notification was processed');

	$other = runForwardNotification($file, 'other');
	assertForwardNotification($other['log'] === [] && $other['notified'] === [], 'Another meeting notification was processed');

	$old = runForwardNotification($file, 'old');
	assertForwardNotification($old['log'] === [] && $old['notified'] === [], 'An older mapi-header-php was asked to process a forward notification');
}
finally {
	unlink($file);
}
echo "Forward notification checks passed\n";
