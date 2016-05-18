<?php

/**
 * A class that tries to identify a browser by its fingerprint. It will try to find
 * as many properties of the browser as it can, and use those to create a fingerprint.
 * 
 * Note: 	This is not a very strong method to prevent stealing of sessions, but it will
 * 			make it a little more difficult, as the attacker needs to send the same headers
 * 			as the original user did when he created the session.
 */
class BrowserFingerprint {
	
	public static function getFingerprint() {
		$properties = array();
		
		$properties['HTTP_ACCEPT_LANGUAGE'] = isset($_SERVER['HTTP_ACCEPT_LANGUAGE']) ? $_SERVER['HTTP_ACCEPT_LANGUAGE'] : 'HTTP_ACCEPT_LANGUAGE_NOT_FOUND';
		$properties['HTTP_USER_AGENT'] = isset($_SERVER['HTTP_USER_AGENT']) ? $_SERVER['HTTP_USER_AGENT'] : 'HTTP_USER_AGENT_NOT_FOUND';
		$properties['HTTP_CONNECTION'] = isset($_SERVER['HTTP_CONNECTION']) ? $_SERVER['HTTP_CONNECTION'] : 'HTTP_CONNECTION_NOT_FOUND';
		$properties['REMOTE_USER'] = isset($_SERVER['REMOTE_USER']) ? $_SERVER['REMOTE_USER'] : 'REMOTE_USER_NOT_FOUND';
		
		return md5(json_encode($properties));
	}
}

