<?php

/** Core fail-closed check must work even when no OpenPGP code is installed. */
if (function_exists('mapi_msgstore_openentry')) {
	echo "OpenPGP availability checks skipped with php-mapi loaded\n";
	return;
}

define('MAPI_E_NO_SUPPORT', 0x80040102);
class MAPIException extends Exception {
	public function setTitle($title) {}
	public function setDisplayMessage($message) {}
}
function getPropIdsFromStrings($store, $names) {
	return ['pgp_sign' => 10001, 'pgp_encrypt' => 10002];
}
function mapi_getprops($message, $names) {
	return $message;
}
require_once dirname(__DIR__) . '/includes/core/class.operations.php';

$assertions = 0;
function availabilityCheck(bool $expected, array $props): void {
	global $assertions;
	$allowed = true;
	try {
		Operations::assertOpenPgpAvailable($props);
	}
	catch (MAPIException $error) {
		$allowed = false;
		if ($error->getCode() !== MAPI_E_NO_SUPPORT) {
			throw $error;
		}
	}
	++$assertions;
	if ($allowed !== $expected) {
		throw new RuntimeException('OpenPGP availability did not preserve the requested protection intent.');
	}
}

$GLOBALS['PluginManager'] = (object) ['plugins' => []];
availabilityCheck(true, []);
availabilityCheck(true, ['pgp_sign' => false, 'pgp_encrypt' => false]);
availabilityCheck(false, ['pgp_sign' => true]);
availabilityCheck(false, ['pgp_encrypt' => true]);
availabilityCheck(false, ['pgp_sign' => true, 'pgp_encrypt' => true]);

$enabled = ($argv[1] ?? '') === 'enabled';
define('PLUGIN_PGP_ENABLE', $enabled);
availabilityCheck(false, ['pgp_sign' => true]);
availabilityCheck(false, ['pgp_encrypt' => true]);
$GLOBALS['PluginManager']->plugins['pgp'] = new stdClass();
availabilityCheck(false, ['pgp_sign' => true]);

// Define the class at runtime: the first cases above exercise class absence.
if (!class_exists('Pluginpgp', false)) {
	class Pluginpgp {}
}
$GLOBALS['PluginManager']->plugins['pgp'] = new Pluginpgp();
availabilityCheck($enabled, ['pgp_sign' => true]);
availabilityCheck($enabled, ['pgp_encrypt' => true]);
availabilityCheck($enabled, ['pgp_sign' => true, 'pgp_encrypt' => true]);
availabilityCheck(true, ['pgp_sign' => false, 'pgp_encrypt' => false]);

foreach ([[[], true], [[10001 => false, 10002 => false], true], [[10001 => true], false], [[10002 => true], false], [false, false]] as [$saved, $expected]) {
	$allowed = true;
	try {
		Operations::assertOpenPgpApplied('store', $saved);
	}
	catch (MAPIException $error) {
		$allowed = false;
	}
	++$assertions;
	if ($allowed !== $expected) {
		throw new RuntimeException('Unapplied saved OpenPGP intent was not rejected.');
	}
}

echo "OK: {$assertions} OpenPGP availability assertions (" . ($enabled ? 'enabled' : 'disabled') . ")\n";
