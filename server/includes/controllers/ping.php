<?php

	/************************************************************************************
	 * 	This file handles the ping request that is sent by the front-end of the WebApp
	 * 	to check if a broken connection with the server can be re-established. 
	 ***********************************************************************************/

	// Include the files that this script need
	require_once(BASE_PATH . 'server/includes/core/class.webappauthentication.php');
	require_once(BASE_PATH . 'server/includes/mapi/mapicode.php');

	$pingTag = array(
		'info' => array(
			'hresult' => WebAppAuthentication::getErrorCode(),
			'hresult_name' => get_mapi_error_name($hresult)
		)
	);

	switch ( WebAppAuthentication::getErrorCode() ) {
		
		// A network error indicates that the connection
		// to the server could not be established.
		case MAPI_E_NETWORK_ERROR:
			$pingTag['success'] = false;
			break;
			
		// The following errors are specific to logging on,
		// it means the connection to the server did work,
		// but the user simply isn't logged in.
		case MAPI_E_PASSWORD_CHANGE_REQUIRED:
		case MAPI_E_PASSWORD_EXPIRED:
		case MAPI_E_INVALID_WORKSTATION_ACCOUNT:
		case MAPI_E_INVALID_ACCESS_TIME:
		case MAPI_E_ACCOUNT_DISABLED:
			
		// Error name says it all, connection exists, but cannot logon.
		case MAPI_E_LOGON_FAILED:
			
		// MAPI_E_UNCONFIGURED means we didn't try to connect to the server,
		// but the user is not logged in, so the state has changed for the user.
		case MAPI_E_UNCONFIGURED:
			
		// NOERROR means the logon was successfull, and the connection to the
		// server is working as expected.
		case NOERROR:
			
		// All other errors are considered a 'success' for connecting to the
		// server and the 'active' property will indicate if the user still
		// has an active session to the server.
		default:
			$pingTag['success'] = true;
			$pingTag['active'] = WebAppAuthentication::isAuthenticated();
			break;
	}

	// Write the JSON response
	echo json_encode($pingTag);
