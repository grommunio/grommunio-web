<?php

/*
 * This controller script handles REST requests. Every request needs its own controller script
 * to handle the request. This script will only check if a controller for the request
 * exists, and if so it will delegate control to that script. If a controller for the
 * request can not be found, this script will respond with
 * 404 Not Found
 *
 */

require_once BASE_PATH . 'server/includes/core/class.response.php';

$service = $_GET['service'] ?? null;
if (!is_string($service) || preg_match('/\A[a-z]+\z/D', $service) !== 1 ||
	!file_exists(BASE_PATH . 'server/includes/controllers/service.' . $service . '.php')) {
	Response::notFound();
}

include BASE_PATH . 'server/includes/controllers/service.' . $service . '.php';
