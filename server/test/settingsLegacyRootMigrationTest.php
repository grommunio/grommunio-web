<?php

/*
 * SPDX-FileCopyrightText: Copyright 2020 - 2026 grommunio GmbH
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

// Settings pulls in the exception chain, which bottoms out in BaseException.
if (!class_exists('BaseException')) {
	class BaseException extends Exception {}
}
if (!class_exists('GrommunioException')) {
	class GrommunioException extends BaseException {}
}

require_once dirname(__DIR__) . '/includes/core/class.settings.php';

$settings = new Settings();
$migrate = new ReflectionMethod(Settings::class, 'migrateLegacyRoot');
$flag = new ReflectionProperty(Settings::class, 'legacyRootMigrated');

function migrate(Settings $settings, ReflectionMethod $migrate, ReflectionProperty $flag, array $tree): array {
	$flag->setValue($settings, false);

	return [$migrate->invoke($settings, $tree), $flag->getValue($settings)];
}

// A legacy tree moves over wholesale, nested values and all.
[$result, $migrated] = migrate($settings, $migrate, $flag, [
	'zarafa' => ['v1' => [
		'main' => ['language' => 'de_DE', 'unread_borders' => true],
		'state' => ['dialogs' => ['mailcreatecontentpanel' => ['width' => 900]]],
	]],
]);
if (!$migrated) {
	throw new RuntimeException('Migrating a legacy tree did not set the migrated flag.');
}
if (isset($result['zarafa'])) {
	throw new RuntimeException('The legacy root survived the migration.');
}
if ($result['grommunio']['v1']['main']['language'] !== 'de_DE') {
	throw new RuntimeException('A scalar setting was lost while migrating.');
}
if ($result['grommunio']['v1']['state']['dialogs']['mailcreatecontentpanel']['width'] !== 900) {
	throw new RuntimeException('Persisted dialog state was lost while migrating.');
}

// Both roots present: the newer root wins per key, the legacy one only fills gaps.
[$result, $migrated] = migrate($settings, $migrate, $flag, [
	'zarafa' => ['v1' => ['main' => ['language' => 'de_DE', 'show_welcome' => false]]],
	'grommunio' => ['v1' => ['main' => ['language' => 'nl_NL']]],
]);
if (!$migrated || isset($result['zarafa'])) {
	throw new RuntimeException('An interrupted migration was not completed.');
}
if ($result['grommunio']['v1']['main']['language'] !== 'nl_NL') {
	throw new RuntimeException('The legacy root overwrote a newer value.');
}
if ($result['grommunio']['v1']['main']['show_welcome'] !== false) {
	throw new RuntimeException('A legacy-only key was dropped instead of filling a gap.');
}

// An already migrated store is left alone, so the write-back happens only once.
[$result, $migrated] = migrate($settings, $migrate, $flag, [
	'grommunio' => ['v1' => ['main' => ['language' => 'en_GB']]],
]);
if ($migrated) {
	throw new RuntimeException('A migrated store was migrated again.');
}
if ($result['grommunio']['v1']['main']['language'] !== 'en_GB') {
	throw new RuntimeException('A migrated store was modified.');
}

// A store with neither root, and one whose legacy value is not an array, must not fatal.
foreach ([[], ['zarafa' => 'corrupt']] as $tree) {
	[$result, $migrated] = migrate($settings, $migrate, $flag, $tree);
	if (isset($result['zarafa'])) {
		throw new RuntimeException('The legacy root survived on a degenerate tree.');
	}
}

echo "Settings legacy root migration checks passed\n";
