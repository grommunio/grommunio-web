<?php

$temporaryDirectory = sys_get_temp_dir() . '/grommunio-state-' . bin2hex(random_bytes(8));
if (!mkdir($temporaryDirectory, 0700)) {
	throw new RuntimeException('Unable to create the state test directory.');
}

define('TMP_PATH', $temporaryDirectory);
define('STATE_FILE_MAX_LIFETIME', 3600);

$stateErrors = [];
function dump($message) {
	$GLOBALS['stateErrors'][] = $message;
}

require_once dirname(__DIR__) . '/includes/core/class.state.php';

try {
	$state = new State('roundtrip', 'test-owner');
	if (!$state->open() || !$state->open()) {
		throw new RuntimeException('The state file could not be opened idempotently.');
	}

	$payload = (object) ['name' => 'stored value'];
	$state->write('payload', $payload, false);
	$state->write('zero', 0, false);
	$state->flush();
	$state->close();
	$state->close();

	$restored = new State('roundtrip', 'test-owner');
	if (!$restored->open()) {
		throw new RuntimeException('The persisted state file could not be reopened.');
	}
	$restoredPayload = $restored->read('payload');
	if (!$restoredPayload instanceof stdClass || $restoredPayload->name !== 'stored value') {
		throw new RuntimeException('The object state did not survive a round trip.');
	}
	if ($restored->read('zero') !== 0 || $restored->read('missing') !== null) {
		throw new RuntimeException('State values were not returned with their original types.');
	}
	$restored->close();

	if ($restored->read('payload') !== null || count($stateErrors) !== 1) {
		throw new RuntimeException('Reading a closed state did not fail safely.');
	}
}
finally {
	$sessionDirectory = $temporaryDirectory . '/session';
	if (is_dir($sessionDirectory)) {
		$files = scandir($sessionDirectory);
		if ($files === false) {
			throw new RuntimeException('Unable to inspect the state test directory.');
		}
		foreach ($files as $filename) {
			if ($filename !== '.' && $filename !== '..') {
				if (!unlink($sessionDirectory . '/' . $filename)) {
					throw new RuntimeException('Unable to remove a state test file.');
				}
			}
		}
		if (!rmdir($sessionDirectory)) {
			throw new RuntimeException('Unable to remove the state session directory.');
		}
	}
	if (!rmdir($temporaryDirectory)) {
		throw new RuntimeException('Unable to remove the state test directory.');
	}
}

echo "State storage checks passed\n";
