<?php

	/*
	 * 	This controller handles the following request:
	 * 
	 *  authenticated
	 * 
	 * 		Method: GET
	 * 		GET Parameters: 
	 * 			service=authenticated
	 * 		Response: 
	 * 			200/Ok
	 * 			JSON 
	 * 				{
	 * 					'authenticated' : 'true' | 'false',
	 * 					'username' : '<username>'
	 * 				}
	 * 
	 *		 
	 */
	 
	require_once(BASE_PATH . 'server/includes/core/class.response.php');
	require_once( BASE_PATH . 'server/includes/core/class.webappauthentication.php');

	// This request only works with GET
	if ( $_SERVER['REQUEST_METHOD'] !== 'GET' ){
		Response::wrongMethod();
	}
	
	// Add CORS headers if necessary
	Response::addCorsHeaders();

	// We will always respond with status 200 for this request.
	// The response will tell the requester if he is authenticated
	// or not.
	echo json_encode(array(
		'authenticated' => WebAppAuthentication::isAuthenticated(),
		'username' => WebAppAuthentication::getUserName()
	));
	die();
