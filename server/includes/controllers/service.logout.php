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
