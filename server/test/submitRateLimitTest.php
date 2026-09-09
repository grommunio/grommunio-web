<?php

if (function_exists('mapi_logon_zarafa')) {
	echo "Submit rate limit checks skipped with php-mapi loaded\n";

	return;
}

define('MAX_SUBMITS_PER_MINUTE', 3);

if (!class_exists('BaseException')) {
	class BaseException extends Exception {
		public $displayMessage;
		public $title;

		public function __construct(string $message, int $code = 0, ?Throwable $previous = null, ?string $displayMessage = null) {
			parent::__construct($message, $code, $previous);
			$this->displayMessage = $displayMessage;
		}

		public function setTitle(string $title): void {
			$this->title = $title;
		}
	}
}

if (!class_exists('ZarafaException')) {
	class ZarafaException extends BaseException {}
}

if (!function_exists('_')) {
	function _($message) {
		return $message;
	}
}

$GLOBALS['rateState'] = [];
$GLOBALS['rateOpenResult'] = true;
$GLOBALS['rateOpenCalls'] = 0;
$GLOBALS['rateWriteCalls'] = 0;
$GLOBALS['rateCloseCalls'] = 0;
$GLOBALS['rateSubsystem'] = '';

class State {
	public static function forStore($subsystem) {
		$GLOBALS['rateSubsystem'] = $subsystem;

		return new self();
	}

	public function open($retry = 2) {
		++$GLOBALS['rateOpenCalls'];

		return $GLOBALS['rateOpenResult'];
	}

	public function read($name) {
		return $GLOBALS['rateState'][$name] ?? false;
	}

	public function write($name, $object, $flush = true) {
		++$GLOBALS['rateWriteCalls'];
		$GLOBALS['rateState'][$name] = $object;
	}

	public function close() {
		++$GLOBALS['rateCloseCalls'];
	}
}

require_once dirname(__DIR__) . '/includes/core/class.operations.php';

$send = static function (): bool {
	try {
		Operations::assertSubmitRateLimit();

		return true;
	}
	catch (ZarafaException $e) {
		$GLOBALS['rateLastError'] = $e;

		return false;
	}
};

// The first messages of the minute go out, the one past the limit does not.
for ($i = 1; $i <= 3; ++$i) {
	if (!$send()) {
		throw new RuntimeException(sprintf('Message %d was refused while still within the limit.', $i));
	}
}
if ($send()) {
	throw new RuntimeException('A message past the limit was still submitted.');
}
if ($GLOBALS['rateSubsystem'] !== 'submitrate') {
	throw new RuntimeException('The tally is not kept in the per-mailbox state.');
}
if (!isset($GLOBALS['rateLastError']) || empty($GLOBALS['rateLastError']->displayMessage)) {
	throw new RuntimeException('The refusal carries no message for the user.');
}
if (empty($GLOBALS['rateLastError']->title)) {
	throw new RuntimeException('The refusal carries no title.');
}
if ($GLOBALS['rateWriteCalls'] !== 3) {
	throw new RuntimeException('A refused message was still counted against the next minute.');
}
if ($GLOBALS['rateCloseCalls'] !== 4) {
	throw new RuntimeException('The state file was left locked by the refusal.');
}

// Once the timestamps fall out of the window, sending resumes and the old ones
// are dropped rather than accumulating.
$GLOBALS['rateState']['submits'] = array_fill(0, 3, time() - 61);
if (!$send()) {
	throw new RuntimeException('Sending did not resume after the window passed.');
}
if (count($GLOBALS['rateState']['submits']) !== 1) {
	throw new RuntimeException('Timestamps older than the window were kept.');
}

// Entries that are not timestamps must not count towards the limit.
$GLOBALS['rateState']['submits'] = ['nonsense', null, 1.5, time()];
if (!$send()) {
	throw new RuntimeException('Junk in the state file blocked a legitimate message.');
}

// A state file that cannot be locked must not stop sending.
$GLOBALS['rateOpenResult'] = false;
$GLOBALS['rateState']['submits'] = array_fill(0, 9, time());
if (!$send()) {
	throw new RuntimeException('An unavailable state file stopped a message.');
}
$GLOBALS['rateOpenResult'] = true;

// And the limit is really in force: a full window refuses again.
$GLOBALS['rateState']['submits'] = array_fill(0, 9, time());
$opensBefore = $GLOBALS['rateOpenCalls'];
if ($send()) {
	throw new RuntimeException('The limit is not in force at all.');
}
if ($GLOBALS['rateOpenCalls'] !== $opensBefore + 1) {
	throw new RuntimeException('The guard did not consult the state file.');
}

echo "Submit rate limit checks passed\n";
