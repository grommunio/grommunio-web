<?php

use Files\Backend\Webdav\Backend;

/*
 * SPDX-FileCopyrightText: Copyright 2020 - 2026 grommunio GmbH
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

/* HTTP 423 Locked and 424 Failed Dependency map to their own messages. */
defined('PLUGIN_FILESBROWSER_LOGLEVEL') || define('PLUGIN_FILESBROWSER_LOGLEVEL', 'ERROR');
if (!function_exists('_')) {
	function _($message) {
		return $message;
	}
}

require_once dirname(__DIR__, 2) . '/plugins/files/php/Files/Backend/Webdav/class.backend.php';
require_once dirname(__DIR__, 2) . '/plugins/filesbackendDefault/php/class.backend.php';
require_once dirname(__DIR__, 2) . '/plugins/filesbackendSeafile/php/class.backend.php';

$checks = 0;
foreach ([Backend::class, Files\Backend\Default\Backend::class, Files\Backend\Seafile\Backend::class] as $class) {
	$backend = (new ReflectionClass($class))->newInstanceWithoutConstructor();
	$parse = new ReflectionMethod($class, 'parseErrorCodeToMessage');
	$locked = $parse->invoke($backend, 423);
	$failedDependency = $parse->invoke($backend, 424);
	if (!str_contains($locked, 'locked') || $failedDependency === $locked || $failedDependency === _('Unknown error')) {
		throw new RuntimeException("{$class}: 423 and 424 are not told apart");
	}
	++$checks;
}

echo "OK: {$checks} files backend error code assertions\n";
