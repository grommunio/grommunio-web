<?php

/*
 * SPDX-FileCopyrightText: Copyright 2020 - 2026 grommunio GmbH
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

// A theme may bring nothing but a favicon; that must not take the page down, and
// the favicon URL must carry the file's own cache buster.
if (extension_loaded('mapi')) {
	echo "Theming favicon checks skipped with php-mapi loaded\n";

	return;
}

$root = sys_get_temp_dir() . '/theming-favicon-' . getmypid();
define('BASE_PATH', $root . '/');
define('DEBUG_LOADER', 'SOURCE');
define('LOAD_SOURCE', 'SOURCE');
define('LOAD_DEBUG', 'DEBUG');
define('LOAD_RELEASE', 'RELEASE');
define('PATH_PLUGIN_DIR', 'plugins');

require_once dirname(__DIR__) . '/includes/core/class.theming.php';

$themeDir = $root . '/' . constant('THEME_PATH_SOURCE') . '/faviconly';
mkdir($themeDir, 0o777, true);
file_put_contents($themeDir . '/favicon.ico', 'icon');

register_shutdown_function(function () use ($root) {
	exec('rm -rf ' . escapeshellarg($root));
});

$favicon = Theming::getFavicon('faviconly');
if ($favicon === false) {
	throw new RuntimeException('A theme favicon was not found.');
}
if (!str_contains((string) $favicon, 'faviconly/favicon.ico?')) {
	throw new RuntimeException('The favicon URL carries no cache buster: ' . var_export($favicon, true));
}
if ((string) substr((string) strrchr((string) $favicon, '?'), 1) !== (string) filemtime($themeDir . '/favicon.ico')) {
	throw new RuntimeException('The cache buster is not the file modification time.');
}

// Without a css directory getCss() used to throw and every page answered 500.
if (Theming::getCss('faviconly') !== []) {
	throw new RuntimeException('A theme without style sheets reported some.');
}

// A theme with style sheets still finds them.
mkdir($themeDir . '/css', 0o777, true);
file_put_contents($themeDir . '/css/theme.css', 'body{}');
$css = Theming::getCss('faviconly');
if (count($css) !== 1 || !str_ends_with((string) $css[0], 'faviconly/css/theme.css')) {
	throw new RuntimeException('A theme style sheet was not picked up: ' . var_export($css, true));
}

// An unknown theme has no favicon and no style sheets.
if (Theming::getFavicon('nosuchtheme') !== false || Theming::getCss('nosuchtheme') !== []) {
	throw new RuntimeException('An unknown theme reported files.');
}

echo "Theming favicon checks passed\n";
