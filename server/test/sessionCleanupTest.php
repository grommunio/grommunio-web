<?php

// The session directory config.php points at is cleaned by nobody on a
// distribution that disables PHP's own garbage collection, so the package
// brings its own cleaner. Check that it reads the real configuration and
// removes only what has expired.

$script = dirname(__DIR__, 2) . '/build/grommunio-web-session-cleanup';
if (!is_readable($script)) {
	echo "Session cleanup checks skipped, the script is not in this tree\n";

	return;
}

$root = sys_get_temp_dir() . '/session-cleanup-' . getmypid();
$sessions = $root . '/session';
mkdir($sessions, 0o700, true);
register_shutdown_function(function () use ($root) {
	exec('rm -rf ' . escapeshellarg($root));
});

$config = $root . '/config.php';
file_put_contents($config, <<<CONFIG
<?php
	define("SESSION_SAVE_HANDLER", "files");
	ini_set("session.save_handler", SESSION_SAVE_HANDLER);
	define("SESSION_SAVE_PATH", "{$sessions}");
	ini_set("session.save_path", SESSION_SAVE_PATH);
	define("SESSION_MAX_LIFETIME", 600);
CONFIG);

function makeFile(string $path, int $ageSeconds): void {
	file_put_contents($path, 'x');
	touch($path, time() - $ageSeconds);
}

function run(string $script, string $config, string $arg = ''): array {
	$command = 'GROMMUNIO_WEB_CONFIG=' . escapeshellarg($config) . ' ' .
		escapeshellarg($script) . ($arg !== '' ? ' ' . escapeshellarg($arg) : '') . ' 2>&1';
	exec($command, $output, $status);

	return [$status, $output];
}

$expired = $sessions . '/sess_expired0000000000000000000000';
$fresh = $sessions . '/sess_fresh000000000000000000000000';
$foreign = $sessions . '/not-a-session';
makeFile($expired, 3600);
makeFile($fresh, 60);
makeFile($foreign, 3600);

// A dry run says what it would do and removes nothing.
[$status, $output] = run($script, $config, '--dry-run');
if ($status !== 0) {
	throw new RuntimeException('The dry run failed: ' . implode("\n", $output));
}
if (implode("\n", $output) !== $expired) {
	throw new RuntimeException('The dry run named the wrong files: ' . implode("\n", $output));
}
if (!file_exists($expired)) {
	throw new RuntimeException('The dry run removed a file.');
}

[$status, $output] = run($script, $config);
if ($status !== 0) {
	throw new RuntimeException('The cleanup failed: ' . implode("\n", $output));
}
if (file_exists($expired)) {
	throw new RuntimeException('An expired session was kept.');
}
if (!file_exists($fresh)) {
	throw new RuntimeException('A session still within its lifetime was removed.');
}
if (!file_exists($foreign)) {
	throw new RuntimeException('A file that is not a session was removed.');
}

// An installation whose config.php predates SESSION_MAX_LIFETIME keeps its
// sessions, rather than falling back to the few minutes of gc_maxlifetime.
$aged = $root . '/config-without-lifetime.php';
file_put_contents($aged, <<<CONFIG
<?php
	define("SESSION_SAVE_HANDLER", "files");
	define("SESSION_SAVE_PATH", "{$sessions}");
	ini_set("session.gc_maxlifetime", 60);
CONFIG);
makeFile($expired, 3600);
[$status, $output] = run($script, $aged, '--dry-run');
if ($status !== 0) {
	throw new RuntimeException('An older configuration failed: ' . implode("\n", $output));
}
if ($output !== []) {
	throw new RuntimeException('An older configuration fell back to gc_maxlifetime: ' . implode("\n", $output));
}
// Two weeks on, the same file goes.
touch($expired, time() - 15 * 24 * 60 * 60);
[, $output] = run($script, $aged, '--dry-run');
if ($output !== [$expired]) {
	throw new RuntimeException('The default lifetime is not two weeks: ' . implode("\n", $output));
}
unlink($expired);

// A real config.php refers to constants only the web application defines, so
// reading it standalone dies part way through. What it managed to define first
// still has to come out.
makeFile($expired, 3600);
file_put_contents($config, file_get_contents($config) . "\n\tdefine(\"LOG_USER_LEVEL\", LOGLEVEL_DEBUG);\n");
[$status] = run($script, $config);
if ($status !== 0) {
	throw new RuntimeException('A configuration that fails to load was treated as a failure.');
}
if (file_exists($expired)) {
	throw new RuntimeException('A configuration that fails part way through stopped the cleanup.');
}

// Another handler stores nothing here, so nothing may be removed.
makeFile($expired, 3600);
file_put_contents($config, str_replace('"files"', '"memcached"', file_get_contents($config)));
[$status] = run($script, $config);
if ($status !== 0 || !file_exists($expired)) {
	throw new RuntimeException('The cleaner acted although sessions are not kept in files.');
}

// No configuration to read means nothing to do, not an error.
[$status] = run($script, $root . '/missing.php');
if ($status !== 0) {
	throw new RuntimeException('A missing configuration was treated as a failure.');
}

echo "Session cleanup checks passed\n";
