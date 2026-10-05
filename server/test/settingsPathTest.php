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
(new ReflectionProperty(Settings::class, 'init'))->setValue($settings, true);
$tree = new ReflectionProperty(Settings::class, 'settings');
$tree->setValue($settings, []);
$persistent = new ReflectionProperty(Settings::class, 'persistentSettings');
$persistent->setValue($settings, []);

$settings->set('/grommunio/v1/main/language', 'de_DE');
$settings->set('grommunio//v1/main/startup/', 'mail');
$settings->set('/grommunio/v1/state/width', 900, false, true);
if ($tree->getValue($settings) !== ['grommunio' => ['v1' => ['main' => ['language' => 'de_DE', 'startup' => 'mail']]]]) {
	throw new RuntimeException('Empty path segments became keys: ' . json_encode($tree->getValue($settings)));
}
if ($persistent->getValue($settings) !== ['grommunio' => ['v1' => ['state' => ['width' => 900]]]]) {
	throw new RuntimeException('Empty persistent path segments became keys.');
}

$settings->delete('/grommunio/v1/main/language');
$settings->delete('grommunio/v1/main/startup');
if ($tree->getValue($settings) !== ['grommunio' => ['v1' => ['main' => []]]]) {
	throw new RuntimeException('A value set with a leading slash could not be deleted.');
}

// An empty path names no setting.
$settings->set('/', 'value');
if ($tree->getValue($settings) !== ['grommunio' => ['v1' => ['main' => []]]]) {
	throw new RuntimeException('An empty path created a setting.');
}

echo "Settings path checks passed\n";
