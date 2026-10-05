<?php

/*
 * SPDX-FileCopyrightText: Copyright 2020 - 2026 grommunio GmbH
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

require_once dirname(__DIR__) . '/includes/class.jsloadorder.php';

$directory = sys_get_temp_dir() . '/grommunio-loadorder-' . bin2hex(random_bytes(8));
if (!mkdir($directory, 0700)) {
	throw new RuntimeException('Unable to create the load order test directory.');
}

$sources = [
	'lib.js' => "@class Grommunio.Lib\n",
	'child.js' => "@class Grommunio.Child\n@extends Grommunio.Base\n@extends Grommunio.Lib\n@extends Ext.Panel\n",
	'base.js' => "@class Grommunio.Base\n",
	'core/main.js' => "@class Grommunio.Main\n@extends Grommunio.Base\n",
	'helper.js' => "#dependsFile {$directory}/child.js\n#dependsFile {$directory}/helper.js\n",
	'loop-a.js' => "@class Grommunio.LoopA\n@extends Grommunio.LoopB\n",
	'loop-b.js' => "@class Grommunio.LoopB\n@extends Grommunio.LoopA\n",
	'broken.js' => "@extends Grommunio.Missing\n#dependsFile {$directory}/missing.js\n",
];
mkdir($directory . '/core');
foreach ($sources as $name => $content) {
	file_put_contents($directory . '/' . $name, $content);
}

$errors = [];
set_error_handler(function ($severity, $message) use (&$errors) {
	$errors[] = $message;

	return true;
});

try {
	$path = fn ($name) => $directory . '/' . $name;
	$order = JsLoadOrder::sort(
		array_map($path, ['child.js', 'helper.js', 'loop-a.js', 'base.js', 'core/main.js', 'loop-b.js', 'broken.js?v=1']),
		[$directory . '/core'],
		[$path('lib.js')]
	);
	$expected = array_map($path, ['base.js', 'broken.js?v=1', 'core/main.js', 'child.js', 'helper.js', 'loop-a.js', 'loop-b.js']);
	if ($order !== $expected) {
		throw new RuntimeException('Unexpected load order: ' . implode(', ', $order));
	}
	if (count($errors) !== 3 || !str_contains($errors[0], 'Grommunio.Missing') || !str_contains($errors[1], 'missing.js') || !str_contains($errors[2], 'loop-a.js, ' . $path('loop-b.js'))) {
		throw new RuntimeException('Unexpected load order errors: ' . implode(' | ', $errors));
	}
}
finally {
	restore_error_handler();
	foreach (array_keys($sources) as $name) {
		unlink($directory . '/' . $name);
	}
	rmdir($directory . '/core');
	rmdir($directory);
}

echo "JS load order checks passed\n";
