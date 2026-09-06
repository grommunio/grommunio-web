<?php

/**
 * This file is the dispatcher of the whole application, every request for data enters
 * here. JSON is received and send to the client.
 */

// Bootstrap the script
require_once 'server/includes/bootstrap.grommunio.php';

// Reject foreign service requests before authentication or a controller can
// refresh, create, or destroy session state. Requests without Origin remain
// available to legacy and non-browser clients.
if (isset($_GET['service'])) {
	require_once BASE_PATH . 'server/includes/core/class.response.php';
	$service = $_GET['service'];
	$serviceMethods = [
		'authenticate' => 'POST',
		'authenticated' => 'GET',
		'fingerprint' => 'POST',
		'logout' => 'POST',
		'token' => 'POST',
	];
	if (!is_string($service) || !isset($serviceMethods[$service])) {
		Response::notFound();
	}
	Response::enforceCors($serviceMethods[$service]);
}

// Callback function for unserialize
// Notifier objects of the previous request are stored in the session. With this
// function they are restored to PHP objects.
ini_set("unserialize_callback_func", "sessionNotifierLoader");

// Try to authenticate the user
WebAppAuthentication::authenticate();

// Globals suck, but we use it still in many files, so we will
// store the mapisession as global
$GLOBALS["mapisession"] = WebAppAuthentication::getMAPISession();

// Get the language from the session
// before we close the session.
if (isset($_SESSION["lang"])) {
	$session_lang = $_SESSION["lang"];
}
else {
	$session_lang = LANG;
}

// Set headers for JSON
header("Content-Type: application/json; charset=utf-8");
header("Expires: " . gmdate("D, d M Y H:i:s") . "GMT");
header("Last-Modified: " . gmdate("D, d M Y H:i:s") . "GMT");
header("Cache-Control: no-cache, must-revalidate");
header("Pragma: no-cache");
if (WebAppAuthentication::isAuthenticated()) {
	header("X-grommunio: " . trim(file_get_contents(BASE_PATH . 'version')));
}

// If a service request was sent (a REST call), the service controller will handle it.
if (isset($_GET['service'])) {
	require_once BASE_PATH . 'server/includes/controllers/service.php';

	exit;
}

// Close the session now, so we're not blocking other requests
session_write_close();

// If a ping request was sent, we the ping controller will handle it.
if (isset($_GET['ping'])) {
	require_once BASE_PATH . 'server/includes/controllers/ping.php';

	exit;
}

if (!WebAppAuthentication::isAuthenticated()) {
	if (WebAppAuthentication::getErrorCode() === MAPI_E_NETWORK_ERROR) {
		// The user is not logged in because the Gromox server could not be reached.
		// Return a HTTP 503 error so the client can act upon this event correctly.
		header('HTTP/1.1 503 Service unavailable');
		header("X-grommunio-Hresult: " . get_mapi_error_name(WebAppAuthentication::getErrorCode()));
	}
	else {
		// The session expired, or the user is otherwise not logged on.
		// Return a HTTP 401 error so the client can act upon this event correctly.
		header('HTTP/1.1 401 Unauthorized');
		header("X-grommunio-Hresult: " . get_mapi_error_name(WebAppAuthentication::getErrorCode()));
	}

	exit;
}

// The dispatcher only accepts JSON POST requests. Besides rejecting malformed
// clients early, requiring a non-simple request content type prevents a foreign
// website from submitting authenticated actions with a plain HTML form. Browser
// requests using application/json are subject to the same-origin/CORS checks.
if (($_SERVER['REQUEST_METHOD'] ?? '') !== 'POST') {
	header('Allow: POST');
	http_response_code(405);

	exit;
}

$contentType = strtolower(trim(explode(';', (string) ($_SERVER['CONTENT_TYPE'] ?? ''), 2)[0]));
if ($contentType !== 'application/json') {
	http_response_code(415);

	exit;
}

// get the disabled plugin list from the config and admin-api
$disabledPlugins = getDisabledPluginsList();

// Instantiate Plugin Manager
$GLOBALS['PluginManager'] = new PluginManager(ENABLE_PLUGINS);
$GLOBALS['PluginManager']->detectPlugins($disabledPlugins);

// Initialize plugins and prevent any output which might be written as
// plugins might be uncleanly output white-space and other stuff. We must
// not allow this here as it can destroy the response data.
ob_start();
$GLOBALS['PluginManager']->initPlugins(DEBUG_LOADER);
ob_end_clean();

// Create global dispatcher object
$GLOBALS["dispatcher"] = new Dispatcher();

// Create global operations object
$GLOBALS["operations"] = new Operations();

// Create global language object
$Language = new Language();

// Create global settings object
$GLOBALS["settings"] = new Settings();

// Set the correct language
$Language->setLanguage($session_lang);

// Eagerly initialize settings before the state lock.  Init() loads
// settings from the MAPI store (network I/O to Gromox) and does not
// depend on the per-subsystem bus/properties, so running it here
// keeps those MAPI round-trips out of the critical lock section.
$GLOBALS["settings"]->Init();

// Create new request object and read input data before acquiring the
// state lock — neither depends on state and this keeps the lock duration
// as short as possible.
$request = new JSONRequest();
$json = readData();

if (DEBUG_JSONOUT) {
	dump_json($json, "in"); // debugging
}

// Keep custom request identifiers separate from internal state names.
if (!array_key_exists('subsystem', $_GET)) {
	$subsystem = 'anonymous';
}
elseif (!is_string($_GET['subsystem']) || preg_match('/\A[a-z0-9_]{1,128}\z/iD', $_GET['subsystem']) !== 1) {
	http_response_code(400);

	exit;
}
elseif ($_GET['subsystem'] === 'anonymous' || preg_match('/\Awebapp_[0-9]{1,20}\z/D', $_GET['subsystem']) === 1) {
	$subsystem = $_GET['subsystem'];
}
else {
	$subsystem = 'request-' . hash('sha256', $_GET['subsystem']);
}
$GLOBALS['request_state_id'] = $subsystem;

// Load a snapshot under a short lock. Request execution must not hold the
// per-tab state lock across backend I/O.
$state = new State($subsystem);
$bus = false;
$properties = false;
if (!$state->open()) {
	http_response_code(503);

	exit;
}

try {
	$bus = $state->read("bus");
	$properties = $state->read("properties");
}
finally {
	$state->close();
}

if (!$bus instanceof Bus) {
	$bus = new Bus();
}

// Make bus global
$GLOBALS["bus"] = $bus;

// Reset any spurious information in the bus state
$GLOBALS["bus"]->reset();
$busSnapshot = serialize($GLOBALS["bus"]);
$baseBus = unserialize($busSnapshot);
$GLOBALS['request_bus_base'] = $baseBus;

// Create global properties object
if (!$properties instanceof Properties) {
	$properties = new Properties();
}
$GLOBALS["properties"] = $properties;

// Reset any spurious information in the properties state
$GLOBALS["properties"]->reset();
$propertiesSnapshot = serialize($GLOBALS["properties"]);

// Execute the request
try {
	$json = $request->execute($json);
}
catch (Exception $e) {
	// invalid requestdata exception
	dump($e);
}

// Merge with requests that completed while this one was executing, then
// persist under a short lock. Response data is already encoded in $json.
$GLOBALS["bus"]->reset();
$GLOBALS["properties"]->reset();

$state = new State($subsystem);
if ($state->open()) {
	try {
		$currentBus = $state->read("bus");
		if ($currentBus instanceof Bus) {
			$currentBus->reset();
			if (serialize($currentBus) !== $busSnapshot) {
				$baseBus = $GLOBALS['request_bus_base'] ?? $baseBus;
				$currentBus->mergePersistentState($GLOBALS["bus"], $baseBus instanceof Bus ? $baseBus : null);
				$GLOBALS["bus"] = $currentBus;
			}
		}

		$currentProperties = $state->read("properties");
		if ($currentProperties instanceof Properties) {
			$currentProperties->reset();
			if (serialize($currentProperties) !== $propertiesSnapshot) {
				$currentProperties->mergePersistentState($GLOBALS["properties"]);
				$GLOBALS["properties"] = $currentProperties;
			}
		}

		$state->write("bus", $GLOBALS["bus"], false);
		$state->write("properties", $GLOBALS["properties"], false);
		$state->flush();
	}
	finally {
		$state->close();
	}
}

if (DEBUG_JSONOUT) {
	dump_json($json, "out"); // debugging
}

// Check if we can use gzip compression
if (ENABLE_RESPONSE_COMPRESSION && function_exists("gzencode") && isset($_SERVER["HTTP_ACCEPT_ENCODING"]) && str_contains((string) $_SERVER["HTTP_ACCEPT_ENCODING"], "gzip")) {
	// Set the correct header and compress the response
	header("Content-Encoding: gzip");
	echo gzencode($json);
}
else {
	echo $json;
}
