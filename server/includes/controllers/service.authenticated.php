<?php

/*
 * SPDX-FileCopyrightText: Copyright 2020 - 2026 grommunio GmbH
 * SPDX-FileCopyrightText: Copyright 2016 Kopano and its licensors
 * SPDX-FileCopyrightText: Copyright 2005 - 2016 Zarafa B.V. and its licensors
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

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
 * 					'authenticated': 'true' | 'false',
 * 					'username': '<username>'
 * 				}
 *
 *
 */

require_once BASE_PATH . 'server/includes/core/class.response.php';
require_once BASE_PATH . 'server/includes/core/class.webappauthentication.php';

// This request only works with GET
if ($_SERVER['REQUEST_METHOD'] !== 'GET') {
	Response::wrongMethod();
}

// We will always respond with status 200 for this request.
// The response will tell the requester if he is authenticated
// or not.
echo json_encode([
	'authenticated' => WebAppAuthentication::isAuthenticated(),
	'username' => WebAppAuthentication::getUserName(),
]);

exit;
