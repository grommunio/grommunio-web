<?php
/**
 * This file handles the delivery of javascript files.
 */

header('Content-type: application/x-javascript');
require_once("../config.php");

$debug = $_GET['debug'] == "true" ? "-debug" : "";

$content = "";

$content .= file_get_contents("../js/external/Ext.ux.form.MetaForm" . $debug . ".js");
$content .= @file_get_contents("../js/files" . $debug . ".js");

// try to load all backend form config javascript files
$BACKEND_PATH = __DIR__ . "/Files/Backend/";
$BACKEND_JS_LOADER = "/jsloader.php";

// Populate the list of directories to check against
if (($directoryHandle = opendir($BACKEND_PATH)) !== FALSE) {
	while (($backend = readdir($directoryHandle)) !== false) {
		// Make sure we're not dealing with a file or a link to the parent directory
		if (is_dir($BACKEND_PATH . $backend) && ($backend == '.' || $backend == '..') !== true) {
			if (is_file($BACKEND_PATH . $backend . $BACKEND_JS_LOADER)) {
				include($BACKEND_PATH . $backend . $BACKEND_JS_LOADER);
				$class = "\\Files\\Backend\\$backend\\BackendJSLoader";
				$jsloader = new $class();
				$content .= $jsloader->get_combined_js($_GET['debug']);
			}
		}
	}
}

echo $content;
