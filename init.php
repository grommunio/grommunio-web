<?php
	// Load the release files (concatenated, compressed)
	define("LOAD_RELEASE", 1);
	// Load the debug files (concatenated, not compressed)
	define("LOAD_DEBUG", 2);
	// Load the original source files (for developers)
	define("LOAD_SOURCE", 3);
	// Defines the base path on the server, terminated by a slash
	define('BASE_PATH', realpath(dirname(__FILE__)) . '/');
	define('UMAPI_PATH', '/usr/share/php-mapi');
	define('GROMOX_CONFIG_PATH', '/etc/gromox/');
