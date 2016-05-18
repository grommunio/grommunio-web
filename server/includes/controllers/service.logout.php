<?php

	/*
	 * 	This controller handles the following request:
	 * 
	 *  authenticated
	 * 
	 * 		Method: GET
	 * 		GET Parameters: 
	 * 			service=logout
	 * 		Response: 
	 * 			200/Ok
	 * 			JSON 
	 * 				{
	 * 					'authenticated' : 'false'
	 * 				}
	 * 
	 *		 
	 */
	 
	require_once(BASE_PATH . 'server/includes/core/class.response.php');
	require_once( BASE_PATH . 'server/includes/core/class.webappauthentication.php');

	// This request only works whit GET
	if ( $_SERVER['REQUEST_METHOD'] !== 'GET' ){
		Response::wrongMethod();
	}
	
	// Add CORS headers if necessary
	Response::addCorsHeaders();

	// Destroy the session. This will effectively logout the user
	WebAppSession::getInstance()->destroy();
	die();
	
