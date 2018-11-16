<?php
	
	require_once(BASE_PATH . 'server/includes/core/class.webappauthentication.php');

	// Return a nice error when we are not authenticated
	if ( !WebAppAuthentication::isAuthenticated() ){
		if ( WebAppAuthentication::getErrorCode() === MAPI_E_NETWORK_ERROR) {
			// The user is not logged in because the kopano-server could not be reached.
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

	// Instantiate Plugin Manager and init the plugins (btw: globals suck)
	$GLOBALS['PluginManager'] = new PluginManager(ENABLE_PLUGINS);
	$GLOBALS['PluginManager']->detectPlugins(DISABLED_PLUGINS_LIST);
	$GLOBALS['PluginManager']->initPlugins(DEBUG_LOADER);

	switch ( $_GET['load'] ) {
		case "translations.js":
			$GLOBALS['PluginManager']->triggerHook("server.index.load.jstranslations.before");
			include(BASE_PATH . 'server/includes/translations.js.php');
			$GLOBALS['PluginManager']->triggerHook("server.index.load.jstranslations.after");
			break;
		case "custom":
			$name = sanitizeGetValue('name', '', STRING_REGEX);
			$GLOBALS['PluginManager']->triggerHook("server.index.load.custom", array('name' => $name));
			break;
		case "upload_attachment":
			$GLOBALS['PluginManager']->triggerHook("server.index.load.upload_attachment.before");
			include(BASE_PATH . 'server/includes/upload_attachment.php');
			$GLOBALS['PluginManager']->triggerHook("server.index.load.upload_attachment.after");
			break;
		case "download_attachment":
			$GLOBALS['PluginManager']->triggerHook("server.index.load.download_attachment.before");
			include(BASE_PATH . 'server/includes/download_attachment.php');
			$GLOBALS['PluginManager']->triggerHook("server.index.load.download_attachment.after");
			break;
		case "download_message":
			$GLOBALS['PluginManager']->triggerHook("server.index.load.download_message.before");
			include(BASE_PATH . 'server/includes/download_message.php');
			$GLOBALS['PluginManager']->triggerHook("server.index.load.download_message.after");
			break;
		case "download_contact":
			$GLOBALS['PluginManager']->triggerHook("server.index.load.download_contact.before");
			include(BASE_PATH . 'server/includes/download_contact.php');
			$GLOBALS['PluginManager']->triggerHook("server.index.load.download_contact.after");
			break;
		case "download_appointment":
			include(BASE_PATH . 'server/includes/download_appointment.php');
			break;
		case "separate_window":
			$GLOBALS['PluginManager']->triggerHook("server.index.load.separate_window.before");
			include(BASE_PATH .'server/includes/templates/webclient_separatewindow.php');
			$GLOBALS['PluginManager']->triggerHook("server.index.load.separate_window.after");
			break;
		default:
			// The session expired, or the user is otherwise not logged on.
			// Return a HTTP 401 error so the client can act upon this event correctly.
			header('HTTP/1.1 404 Not Found');
			break;
	}
	
