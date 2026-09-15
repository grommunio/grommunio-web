<?php

// A json theme has to feed the custom properties grommunio.css is written against,
// not only the handful of selectors Theming::$styles names.
if (extension_loaded('mapi')) {
	echo "Json theme checks skipped with php-mapi loaded\n";

	return;
}

$root = sys_get_temp_dir() . '/theming-json-' . getmypid();
define('BASE_PATH', $root . '/');
define('DEBUG_LOADER', 'SOURCE');
define('LOAD_SOURCE', 'SOURCE');
define('LOAD_DEBUG', 'DEBUG');
define('LOAD_RELEASE', 'RELEASE');
define('PATH_PLUGIN_DIR', 'plugins');

function getWebappVersion() {
	return 'test';
}
function versionedUrl($url) {
	return $url . '?version=' . getWebappVersion();
}

require_once dirname(__DIR__) . '/includes/core/class.theming.php';

register_shutdown_function(function () use ($root) {
	exec('rm -rf ' . escapeshellarg($root));
});

function makeTheme(array $props) {
	$name = 'qatheme' . substr(md5(serialize($props)), 0, 8);
	$dir = BASE_PATH . PATH_PLUGIN_DIR . '/' . $name;
	if (!is_dir($dir)) {
		mkdir($dir, 0o777, true);
	}
	file_put_contents($dir . '/theme.json', json_encode(['id' => $name, 'display-name' => 'QA'] + $props));

	return $name;
}

// --- the palette -----------------------------------------------------------

$css = Theming::getStyles(makeTheme(['primary-color' => '#007bff']));

foreach (['--theme-primary-color: #007bff', '--theme-primary-hover:', '--theme-primary-dark:',
	'--theme-gradient-start:', '--theme-gradient-end:'] as $needle) {
	if (!str_contains($css, $needle)) {
		throw new RuntimeException("The theme css does not carry {$needle}");
	}
}

// The top bar keeps its promise of being primary-color unless a gradient is asked for.
if (!str_contains($css, '--theme-gradient-start: #007bff;') || !str_contains($css, '--theme-gradient-end: #007bff;')) {
	throw new RuntimeException('A theme without gradient keys did not get a flat top bar.');
}

// The hover shade of a normal colour is darker than the colour, not lighter.
$css = Theming::getStyles(makeTheme(['primary-color' => '#007bff']));
if (!str_contains($css, '--theme-primary-hover: #0061cc;')) {
	throw new RuntimeException('The hover shade of a light colour was not darkened.');
}
// A colour too dark to darken goes the other way.
$css = Theming::getStyles(makeTheme(['primary-color' => '#0a0a0a']));
if (!str_contains($css, '--theme-primary-hover: #3d3d3d;')) {
	throw new RuntimeException('The hover shade of a very dark colour was not lightened.');
}

// A theme that wants a gradient gets one.
$css = Theming::getStyles(makeTheme([
	'primary-color' => '#007bff',
	'gradient-start' => '#004080',
	'gradient-end' => '#3399ff',
]));
if (!str_contains($css, '--theme-gradient-start: #004080;') || !str_contains($css, '--theme-gradient-end: #3399ff;')) {
	throw new RuntimeException('An explicit gradient was not passed through.');
}

// An explicitly named shade wins over the derived one.
$css = Theming::getStyles(makeTheme(['primary-color' => '#007bff', 'primary-color:dark' => '#001f3f']));
if (!str_contains($css, '--theme-primary-dark: #001f3f;')) {
	throw new RuntimeException('An explicit dark shade was not passed through.');
}

// --- images ----------------------------------------------------------------

$theme = makeTheme(['spinner-image' => 'img/wait.svg']);
$css = Theming::getStyles($theme);
if (!str_contains($css, '--theme-spinner-image: url(plugins/' . $theme . '/img/wait.svg?version=test);')) {
	throw new RuntimeException('The spinner does not reach the application: ' . $css);
}

// The dark mode logo rule must be answered, or darkmode.css keeps the stock logo.
$theme = makeTheme(['logo-small' => 'img/logo.svg']);
$css = Theming::getStyles($theme);
if (!str_contains($css, 'body.dark-mode .zarafa-maintoolbar')) {
	throw new RuntimeException('A theme logo is not applied in dark mode.');
}
if (substr_count($css, 'plugins/' . $theme . '/img/logo.svg') !== 2) {
	throw new RuntimeException('The dark mode logo does not fall back to logo-small.');
}

$theme = makeTheme(['logo-small' => 'img/logo.svg', 'logo-small:dark' => 'img/logo-light.svg']);
$css = Theming::getStyles($theme);
if (!str_contains($css, 'plugins/' . $theme . '/img/logo-light.svg')) {
	throw new RuntimeException('A separate dark mode logo was ignored.');
}

// --- nothing to say, nothing emitted ---------------------------------------

$css = Theming::getStyles(makeTheme(['stylesheets' => 'css/theme.css']));
if (str_contains($css, '--theme-primary-color')) {
	throw new RuntimeException('A theme without colors still emitted a palette.');
}
if (!str_contains($css, 'css/theme.css')) {
	throw new RuntimeException('The theme stylesheet was not linked.');
}

echo "Json theme checks passed\n";
