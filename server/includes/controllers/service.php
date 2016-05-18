<?php

	/*
	 * This controller script handles REST requests. Every request needs its own controller script
	 * to handle the request. This script will only check if a controller for the request
	 * exists, and if so it will delegate control to that script. If a controller for the
	 * request can not be found, this script will respond with
	 * 404 Not Found
	 * 
	 */

	require_once(BASE_PATH . 'server/includes/core/class.response.php');
 	
	// When in dev mode (LOAD_SOURCE) it will be possible to mimic a POST request with a GET request
	// by adding the GET parameter 'post'
	if ( DEBUG_LOADER===LOAD_SOURCE && isset($_GET['post']) ){
		$_POST=$_GET;
		$_SERVER['REQUEST_METHOD']='POST';
	}
  
	if ( file_exists(BASE_PATH . 'server/includes/controllers/service.' . $_GET['service'] . '.php' ) ){
		include(BASE_PATH . 'server/includes/controllers/service.' . $_GET['service'] . '.php');
	} else {
		Response::notFound();
	}
