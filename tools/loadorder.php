<?php
// Load the release files (concatenated, compressed)
define("LOAD_RELEASE", 1);
// Load the debug files (concatenated, not compressed)
define("LOAD_DEBUG", 2);
// Load the original source files (for developers)
define("LOAD_SOURCE", 3);

define('DEBUG_LOADER', LOAD_SOURCE);
define('PATH_PLUGIN_DIR', '.');

include('defaults.php');
include('server/includes/loader.php');
include('server/includes/core/class.pluginmanager.php');

function create_arg($files) {
	$output = '';
	foreach($files as $file) {
		$output .= file_get_contents($file);
	}
	return $output;
}

// Only include extjs-mod
function filter_extjsmod($file) {
	return strpos($file, "extjs-mod") !== FALSE;
}

if ($argc < 3 ) {
    exit("Usage: loadorder <extjs|kopano> <filename>\n");
}

$arg = $argv[1];
$filename = $argv[2];
if ($arg !== "extjs" && $arg !== "kopano") {
	exit("Invalid argument $arg");
}

# TODO: refactor pluginmanager out
$GLOBALS['PluginManager'] = new PluginManager(false);
$loader = new FileLoader();

if ($arg === "extjs") {
	$files = array_filter($loader->getExtjsJavascriptFiles(LOAD_SOURCE), "filter_extjsmod");
	file_put_contents($filename, create_arg($files));
}

if ($arg === "kopano") {
	$files = $loader->getZarafaJavascriptFiles(LOAD_SOURCE);
	file_put_contents($filename, create_arg($files));
}

?>
