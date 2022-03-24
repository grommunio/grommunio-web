<?php
/**
 * This file handles the delivery of cascade style sheet files.
 *
 */

header('Content-type: text/css');
$debug = $_GET['debug'] == "true" ? "-min" : "";

$content = "";

// in source mode load the non minifyed css
if (isset($_GET['source'])) {
	$content .= file_get_contents("../resources/css/files-main.css");
	$content .= file_get_contents("../resources/css/icons.css");
	$content .= file_get_contents("../resources/css/navbar.css");
	$content .= file_get_contents("../resources/css/pdfjspanel.css");
	$content .= file_get_contents("../resources/css/webodfpanel.css");
} else {
	$content .= file_get_contents("../resources/css/files" . $debug . ".css");
}

// try to load all backend form config javascript files
$BACKEND_PATH = __DIR__ . "/Files/Backend/";
$BACKEND_CSS_LOADER = "/cssloader.php";

// Populate the list of directories to check against
if (($directoryHandle = opendir($BACKEND_PATH)) !== FALSE) {
	while (($backend = readdir($directoryHandle)) !== false) {
		// Make sure we're not dealing with a file or a link to the parent directory
		if (is_dir($BACKEND_PATH . $backend) && ($backend == '.' || $backend == '..') !== true) {
			if (is_file($BACKEND_PATH . $backend . $BACKEND_CSS_LOADER)) {
				include($BACKEND_PATH . $backend . $BACKEND_CSS_LOADER);
				$class = "\\Files\\Backend\\$backend\\BackendCSSLoader";
				$cssloader = new $class();
				$content .= $cssloader->get_combined_css($_GET['debug']);
			}
		}
	}
}

echo $content;
