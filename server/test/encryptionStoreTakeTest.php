<?php

/** Real PHP file-session locks; skip only the unrelated web bootstrap. */
$source = file_get_contents(dirname(__DIR__) . '/includes/core/class.encryptionstore.php');
$source = str_replace("require_once BASE_PATH . 'server/includes/core/class.webappsession.php';", '', $source);
eval('?>' . $source);
ini_set('session.use_cookies', '0');
ini_set('session.cache_limiter', '');
ini_set('session.save_handler', 'files');
$reflection = new ReflectionClass(EncryptionStore::class);
$store = $reflection->newInstanceWithoutConstructor();
foreach (['_initializionVector' => str_repeat('i', 16), '_encryptionKey' => str_repeat('k', 32)] as $field => $value) {
	$reflection->getProperty($field)->setValue(null, $value);
}
if (($argv[1] ?? '') === '--claim') {
	session_save_path($argv[2]);
	session_id($argv[3]);
	// Simulate WebAppSession's stale read_and_close snapshot in two workers.
	$_SESSION = [EncryptionStore::_SESSION_KEY => ['race' => ['val' => 'stale']]];
	echo json_encode($store->take('race'), JSON_THROW_ON_ERROR);
	exit;
}
$directory = sys_get_temp_dir() . '/grommunio-encryption-take-' . bin2hex(random_bytes(8));
if (!mkdir($directory, 0700)) { throw new RuntimeException('Cannot create the isolated session directory.'); }
session_save_path($directory);
session_id('pgptest' . bin2hex(random_bytes(12)));
$checks = 0;
function takeCheck(bool $condition, string $message): void {
	if (!$condition) { throw new RuntimeException($message); }
	++$GLOBALS['checks'];
}
try {
	$store->add('receipt', 'opaque receipt', time() + 60);
	$stale = $_SESSION;
	takeCheck($store->take('receipt') === 'opaque receipt', 'A take returns the original value.');
	takeCheck(session_status() === PHP_SESSION_NONE, 'Take releases a lock it opened.');
	$_SESSION = $stale;
	takeCheck($store->take('receipt') === null, 'A stale snapshot cannot replay a consumed receipt.');
	unset($_SESSION[EncryptionStore::_SESSION_KEY]);
	takeCheck($store->get('missing') === null && session_status() === PHP_SESSION_NONE, 'Missing get releases a newly opened lock.');
	$store->add('expired', 'old', time() - 1);
	takeCheck($store->take('expired') === null, 'Expired receipts cannot be consumed.');
	session_start();
	$_SESSION[EncryptionStore::_SESSION_KEY]['broken'] = ['val' => 'not ciphertext'];
	session_write_close();
	takeCheck($store->take('broken') === false, 'Decryption failure is returned.');
	takeCheck($store->take('broken') === null, 'Decryption failure still consumes the entry.');
	$store->add('owned', 'caller lock');
	session_start();
	takeCheck($store->take('owned') === 'caller lock' && session_status() === PHP_SESSION_ACTIVE, 'Take preserves a lock already owned by its caller.');
	session_write_close();
	$store->add('race', 'exactly one winner');
	$workers = [];
	for ($i = 0; $i < 2; ++$i) {
		$process = proc_open([PHP_BINARY, __FILE__, '--claim', $directory, session_id()], [0 => ['pipe', 'r'], 1 => ['pipe', 'w'], 2 => ['pipe', 'w']], $pipes);
		if (!is_resource($process)) { throw new RuntimeException('Cannot launch session lock test worker.'); }
		fclose($pipes[0]);
		$workers[] = [$process, $pipes];
	}
	$results = [];
	foreach ($workers as [$process, $pipes]) {
		$output = stream_get_contents($pipes[1]);
		$error = stream_get_contents($pipes[2]);
		fclose($pipes[1]); fclose($pipes[2]);
		takeCheck(proc_close($process) === 0 && $error === '', 'Concurrent claim worker completes without errors: ' . $error);
		$results[] = json_decode($output, true, 16, JSON_THROW_ON_ERROR);
	}
	takeCheck(count(array_filter($results, static fn ($value) => $value === 'exactly one winner')) === 1 && count(array_filter($results, 'is_null')) === 1, 'Concurrent requests consume the receipt exactly once.');
}
finally {
	if (session_status() === PHP_SESSION_ACTIVE) { session_write_close(); }
	foreach (scandir($directory) as $file) {
		if ($file !== '.' && $file !== '..') { unlink($directory . '/' . $file); }
	}
	rmdir($directory);
}
echo "EncryptionStore atomic take: $checks assertions passed\n";
