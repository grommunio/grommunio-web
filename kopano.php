<?php
	/**
	* This file is the dispatcher of the whole application, every request for data enters
	* here. JSON is received and send to the client.
	*/

	// Bootstrap the script
	require_once('server/includes/bootstrap.kopano.php');

	// Callback function for unserialize
	// Notifier objects of the previous request are stored in the session. With this
	// function they are restored to PHP objects.
	ini_set("unserialize_callback_func", "sessionNotifierLoader");

	// Try to authenticate the user
	WebAppAuthentication::authenticate();

	// Globals suck, but we use it still in many files, so we will
	// store the mapisession as global
	$GLOBALS["mapisession"] = WebAppAuthentication::getMapiSession();

	// Get the language from the session
	// before we close the session.
	if (isset($_SESSION["lang"])) {
		$session_lang = $_SESSION["lang"];
	} else {
		$session_lang = LANG;
	}

	// Set headers for JSON
	header("Content-Type: application/json; charset=utf-8");
	header("Expires: ".gmdate( "D, d M Y H:i:s")."GMT");
	header("Last-Modified: ".gmdate( "D, d M Y H:i:s")."GMT");
	header("Cache-Control: no-cache, must-revalidate");
	header("Pragma: no-cache");
	if ( WebAppAuthentication::isAuthenticated() ) {
		header("X-Zarafa: " . trim(file_get_contents(BASE_PATH . 'version')));
	}

	// If a service request was sent (a REST call), the service controller will handle it.
	if ( isset($_GET['service']) ) {
		require_once(BASE_PATH . 'server/includes/controllers/service.php');
		die();
 	}

	// Close the session now, so we're not blocking other requests
	session_write_close();

	// If a ping request was sent, we the ping controller will handle it.
	if ( isset($_GET['ping']) ) {
		require_once(BASE_PATH . 'server/includes/controllers/ping.php');
		die();
 	}

	if ( !WebAppAuthentication::isAuthenticated() ) {
		if (WebAppAuthentication::getErrorCode() === MAPI_E_NETWORK_ERROR) {

			// The user is not logged in because the Kopano Core server could not be reached.
			// Return a HTTP 503 error so the client can act upon this event correctly.
			header('HTTP/1.1 503 Service unavailable');
			header("X-Zarafa-Hresult: " . get_mapi_error_name(WebAppAuthentication::getErrorCode()));

		} else {

			// The session expired, or the user is otherwise not logged on.
			// Return a HTTP 401 error so the client can act upon this event correctly.
			header('HTTP/1.1 401 Unauthorized');
			header("X-Zarafa-Hresult: " . get_mapi_error_name(WebAppAuthentication::getErrorCode()));
		}

		die();
	}

	// Instantiate Plugin Manager
	$GLOBALS['PluginManager'] = new PluginManager(ENABLE_PLUGINS);
	$GLOBALS['PluginManager']->detectPlugins(DISABLED_PLUGINS_LIST);
	$GLOBALS['PluginManager']->initPlugins(DEBUG_LOADER);

	// Create global dispatcher object
	$GLOBALS["dispatcher"] = new Dispatcher();

	// Create global operations object
	$GLOBALS["operations"] = new Operations();

	// Create global language object
	$Language = new Language();

	// Create global settings object
	$GLOBALS["settings"] = new Settings($Language);

	// Set the correct language
	$Language->setLanguage($session_lang);

	// Get the state information for this subsystem
	$subsystem = sanitizeGetValue('subsystem', 'anonymous', ID_REGEX);

	$state = new State($subsystem);

	// Lock the state of this subsystem
	$state->open();

	// Get the bus object for this subsystem
	$bus = $state->read("bus");

	if ( !$bus ) {
		// Create global bus object
		$bus = new Bus();
	}

	// Make bus global
	$GLOBALS["bus"] = $bus;

	// Reset any spurious information in the bus state
	$GLOBALS["bus"]->reset();

	// Create global properties object
	$properties = $state->read("properties");

	if (!$properties) {
		$properties = new Properties();
	}
	$GLOBALS["properties"] = $properties;

	// Reset any spurious information in the properties state
	$GLOBALS["properties"]->reset();

	// Create new request object
	$request = new JSONRequest();

	// Get the JSON that the client sent with the request
	$json = readData();

	if (DEBUG_JSONOUT) {
		dump_json($json, "in"); // debugging
	}

	// Execute the request
	try {
		$json = $request->execute($json);
	} catch (Exception $e) {
		// invalid requestdata exception
		dump($e);
	}

	if (DEBUG_JSONOUT) {
		dump_json($json, "out"); // debugging
	}

	// Check if we can use gzip compression
	if (ENABLE_RESPONSE_COMPRESSION && function_exists("gzencode") && isset($_SERVER["HTTP_ACCEPT_ENCODING"]) && strpos($_SERVER["HTTP_ACCEPT_ENCODING"], "gzip")!==false){
		// Set the correct header and compress the response
		header("Content-Encoding: gzip");
		echo gzencode($json);
	}else {
		echo $json;
	}

	// Reset the BUS, and save it to the state file
	$GLOBALS["bus"]->reset();
	$state->write("bus", $GLOBALS["bus"], false);

	// Reset the properties and save it to the state file
	$GLOBALS["properties"]->reset();
	$state->write("properties", $GLOBALS["properties"], false);

	// Write all changes to disk
	$state->flush();

	// You can skip this as well because the lock is freed after the PHP script ends
	// anyway. (only for PHP < 5.3.2)
	$state->close();

