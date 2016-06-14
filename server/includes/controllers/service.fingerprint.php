<?php

/*
 * This service should read the fingerprint that was sent by the frontend. 
 * If the user is not yet logged in, the fingerprint will be stored in the
 * session. If the user is logged in and the fingerprint request is sent,
 * the fingerprint will be compared to the one stored in the session. If 
 * the fingerprint do not match, the session will be destroyed.
 * 
 * This controller handles the following request:
 * 
 *  fingerprint
 * 		
 * 		Method: POST
 * 		GET Parameters:
 * 			service=fingerprint
 * 		POST Parameters:
 * 			fingerprint=<fingerprint>
 * 		Response: 
 * 			200 Ok
 * 
 * 			401 Unauthorized
 * 
 */
	 
	require_once(BASE_PATH . 'server/includes/core/class.response.php');
	require_once( BASE_PATH . 'server/includes/core/class.webappauthentication.php');
	require_once( BASE_PATH . 'server/includes/core/class.webappsession.php');

	// This request only works when POSTed
	if ( $_SERVER['REQUEST_METHOD'] !== 'POST' ){
		Response::wrongMethod();
	}

	// Make sure the session is started
	$phpSession = WebAppSession::getInstance();
	
	// If we get a keep-alive request from the fingerprint script
	// and the user is not authenticated (i.e. user is at login page)
	// we will respond with the php session expiration time
	// The fingerprint script will then send another keep-alive request
	// after half the expiration time has been passed.
	if ( isset($_GET['type']) && $_GET['type']==='keepalive' ) {
		if ( !WebAppAuthentication::isAuthenticated() ){
			echo ini_get('session.gc_maxlifetime');
		}
		die();
	}


	// Store the fingerprint in the session when the user is not yet
	// authenticated. (i.e. when the login page is loaded)
	if ( !WebAppAuthentication::isAuthenticated() ){
		$_SESSION['frontend-fingerprint'] = $_POST['fingerprint'];
		die();
	}
	
	// Single sign on will never go through the login page. So we cannot check
	// the fingerprint there!
	if ( !WebAppAuthentication::isUsingSingleSignOn() && (!isset($_SESSION['frontend-fingerprint']) || $_POST['fingerprint'] !== $_SESSION['frontend-fingerprint']) ){
		error_log('frontend-fingerprint did not match. Session terminated. ' . WebAppAuthentication::getUserName());
		$phpSession->destroy();
		Response::unAuthorized();
	}

	// If we get here, then everything is fine. The user is authenticated and the
	// frontend fingerprints match. So we don't have to do anything anymore.
	die();
