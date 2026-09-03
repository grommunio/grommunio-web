<?php

/*
 * 	This controller handles the following request:
 *
 *  authenticated
 *
 * 		Method: POST (GET is accepted only with same-origin browser metadata)
 * 		GET Parameters:
 * 			service=logout
 * 		Response:
 * 			200/Ok
 * 			JSON
 * 				{
 * 					'authenticated': 'false'
 * 				}
 *
 *
 */

require_once BASE_PATH . 'server/includes/core/class.response.php';
require_once BASE_PATH . 'server/includes/core/class.webappauthentication.php';

// Preserve the historical GET endpoint for same-origin callers only. A bare
// cross-site navigation has no trustworthy initiator metadata and must fail.
$requestMethod = strtoupper((string) ($_SERVER['REQUEST_METHOD'] ?? ''));
if ($requestMethod !== 'POST' &&
	($requestMethod !== 'GET' || !Response::isSameOriginRequestSource())) {
	header('Allow: POST');
	Response::wrongMethod();
}

// Destroy the session. This will effectively logout the user
WebAppSession::getInstance()->destroy();

exit;
