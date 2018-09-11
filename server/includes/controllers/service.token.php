<?php

	/*
	 * 	This controller handles the following request:
	 * 
	 *  update token (login)
	 * 		
	 * 		Method: POST
	 * 		GET Parameters:
	 * 			service=authenticate
	 * 		POST Parameters:
	 * 			username=username
	 * 			token=token
	 * 			new=new
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

	/**
	 * Decode an JWT access token which contains of a header, payload and
	 * verify signature separated by a dot.
	 * @param string $accessToken the accessToken to extract the user entryid from
	 * @return string empty string when entryid is not found 
	 */
	function extractUserEntryId($accessToken) {
		$parts = explode(".", $accessToken);
		if (count($parts) !== 3) {
			return '';
		}

		$data = base64_decode($parts[1]);
		if (!$data) {
			return '';
		}

		$json = json_decode($data, true);
		if (!$json) {
			return '';
		}

		if (!isset($json['kc.identity']) || !isset($json['kc.identity']['kc.i.id'])) {
			return '';
		}

		return $json['kc.identity']['kc.i.id'];
	}

	// This request only works when POSTed
	if ( $_SERVER['REQUEST_METHOD'] !== 'POST' ){
		Response::wrongMethod();
	}

	// Add CORS headers if necessary
	Response::addCorsHeaders();

	$new = isset($_POST['new']);

	if ( isset($_POST['token']) ){
		$_POST['username'] = extractUserEntryid($_POST['token']);
		WebAppAuthentication::authenticateWithToken($new);
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
