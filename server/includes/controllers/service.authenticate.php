<?php

	/*
	 * 	This controller handles the following request:
	 * 
	 *  authenticate (login)
	 * 		
	 * 		Method: POST
	 * 		GET Parameters:
	 * 			service=authenticate
	 * 		POST Parameters:
	 * 			username=username
	 * 			password=password
	 * 		Response: 
	 * 			200 Ok
	 * 			JSON
	 * 				{
	 * 					'authenticated' : 'true',
	 * 					'username' : '<username>'
	 * 				}
	 * 
	 * 			401 Unauthorized
	 * 			JSON
	 * 				{
	 * 					'error' : {
	 * 						'code' : <nr>
	 * 						'message : '<error message>'
	 * 					}
	 * 				}
	 * 
	 */
	 
	require_once(BASE_PATH . 'server/includes/core/class.response.php');
	require_once( BASE_PATH . 'server/includes/core/class.webappauthentication.php');

	// This request only works when POSTed
	if ( $_SERVER['REQUEST_METHOD'] !== 'POST' ){
		Response::wrongMethod();
	}
	
	// Add CORS headers if necessary
	Response::addCorsHeaders();

	if ( isset($_POST['username']) && isset($_POST['password']) ){
		WebAppAuthentication::authenticateWithPostedCredentials();
	}
	
	if ( WebAppAuthentication::getErrorCode() !== NOERROR ){
		// If we have an error, we will communicate it in our response
		$response['error'] = array(
			'code' => WebAppAuthentication::getErrorCode(),
			'hcode' => get_mapi_error_name(WebAppAuthentication::getErrorCode()),
			'message' => WebAppAuthentication::getErrorMessage()
		);
	} else {
		// We successfully logged in, so we can communicate this in our response
		$response = array(
			'authenticated' => WebAppAuthentication::isAuthenticated(),
			'user' => WebAppAuthentication::getUserName()
		);
	}
	
	// We will send a 401 header when the user is not authenticated
	// We also send it when there was an error when we tried to log in. This error
	// could be that another user is already logged in. (Not sure if 401 is logical then)
	if ( !WebAppAuthentication::isAuthenticated() || WebAppAuthentication::getErrorCode() !== NOERROR ){
		header('HTTP/1.1 401 Unauthorized');
	}
	
	// Send the response and stop the script
	echo json_encode($response);
	die();
	