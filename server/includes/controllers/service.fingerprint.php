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
 * 		JSON body:
 * 			{"fingerprint":"<fingerprint>"}
 * 		Response:
 * 			200 Ok
 *
 * 			401 Unauthorized
 *
 */

require_once BASE_PATH . 'server/includes/core/class.response.php';
require_once BASE_PATH . 'server/includes/core/class.webappauthentication.php';
require_once BASE_PATH . 'server/includes/core/class.webappsession.php';

// This request only works when POSTed
if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
	Response::wrongMethod();
}

// Make sure the session is started
$phpSession = WebAppSession::getInstance();

// If we get a keep-alive request from the fingerprint script
// and the user is not authenticated (i.e. user is at login page)
// we will respond with the php session expiration time
// The fingerprint script will then send another keep-alive request
// after half the expiration time has been passed.
if (isset($_GET['type']) && $_GET['type'] === 'keepalive') {
	if (!WebAppAuthentication::isAuthenticated()) {
		echo ini_get('session.gc_maxlifetime');
	}

	exit;
}

// The fingerprint can destroy an authenticated session when it differs. Do
// not accept CORS-simple form posts that another website can submit with the
// victim's cookies.
$contentType = strtolower(trim(explode(';', (string) ($_SERVER['CONTENT_TYPE'] ?? ''), 2)[0]));
if ($contentType !== 'application/json') {
	http_response_code(415);

	exit;
}

$input = json_decode((string) file_get_contents('php://input'), true);
if (!is_array($input) || !array_key_exists('fingerprint', $input)) {
	http_response_code(400);

	exit;
}
$fingerprint = (string) $input['fingerprint'];

// Store the fingerprint in the session when the user is not yet
// authenticated. (i.e. when the login page is loaded)
if (!WebAppAuthentication::isAuthenticated()) {
	updateSession(function () use ($fingerprint) {
		$_SESSION['frontend-fingerprint'] = $fingerprint;
	});

	exit;
}

// If the frontend fingerprint was never stored (e.g. SSO/Keycloak where
// the login page is skipped or the fingerprint request was cancelled
// during redirect), store it now instead of killing the session.
if (!isset($_SESSION['frontend-fingerprint'])) {
	updateSession(function () use ($fingerprint) {
		$_SESSION['frontend-fingerprint'] = $fingerprint;
	});
}
elseif (!DISABLE_FINGERPRINT_CHECK && $fingerprint !== $_SESSION['frontend-fingerprint']) {
	error_log('frontend-fingerprint did not match. Session terminated. ' . WebAppAuthentication::getUserName());
	$phpSession->destroy();
	Response::unAuthorized();
}

// If we get here, then everything is fine. The user is authenticated and the
// frontend fingerprints match. So we don't have to do anything anymore.
exit;
