<?php
	/**
	 * This is the entry point for every request that should return HTML
	 * (one exception is that it also returns translated text for javascript)
	 */

	// Bootstrap the script
	require_once('server/includes/bootstrap.php');

	/*
	 * Get the favicon either from theme or use the default.
	 *
	 * @param string theme the users theme
	 * @return string favicon
	 */
	function getFavicon($theme)
	{

		if ( $theme ) {
			$favicon = Theming::getFavicon($theme);
		}

		if ( !isset($favicon) || $favicon === false) {
			$favicon = 'client/resources/images/favicon.ico?kv2.2.0';
		}

		return $favicon;
	}

	// If the user wants to logout (and is not using single-signon)
	// then destroy the session and redirect to this page, so the login page
	// will be shown
	if ( isset($_GET['logout']) && !WebAppAuthentication::isUsingSingleSignOn() ){

		// GET variable user will be set when the user was logged out because of session timeout
		// or because he logged out in another window.
		$username = sanitizeGetValue('user', '', USERNAME_REGEX);
		$webappSession->destroy();
		header('Location: ' . dirname($_SERVER['PHP_SELF']) . ($username?'?user='.rawurlencode($username):''), true, 303);
		die();
	}

	// Check if an action GET-parameter was sent with the request.
	// This parameter is set when the webapp was opened by clicking on
	// a mailto: link in the browser.
	// If so, we will store it in the session, so we can use it later.
	if ( isset($_GET['action']) && !empty($_GET['action']) ) {
		storeURLDataToSession();
	}

	// Try to authenticate the user
	WebAppAuthentication::authenticate();

	$webappTitle = defined('WEBAPP_TITLE') && WEBAPP_TITLE ? WEBAPP_TITLE : 'Kopano WebApp';

	// If we could not authenticate the user, we will show the login page
	if ( !WebAppAuthentication::isAuthenticated() ){

		// Get language from the cookie, or from the language that is set by the admin
		$Language = new Language();
		$lang = isset($_COOKIE['lang']) ? $_COOKIE['lang'] : LANG;
		$Language->setLanguage($lang);

		// If GET parameter 'load' is defined, we defer handling to the load.php script
		if ( isset($_GET['load']) && $_GET['load']!=='logon' ) {
			include(BASE_PATH . 'server/includes/load.php');
			die();
		}

		// Set some template variables for the login page
		$branch = DEBUG_LOADER===LOAD_SOURCE ? gitversion() : '';
		$server = DEBUG_SHOW_SERVER ? DEBUG_SERVER_ADDRESS : '';
		$version = 'WebApp ' . trim(file_get_contents('version'));
		if (!empty($server)) {
			$version = _('Server') . ': ' . $server . ' - ' . $version;
		}
		$zcpversion = 'Kopano Core' . ' ' . phpversion('mapi');
		$user = sanitizeGetValue('user', '', USERNAME_REGEX);

		$url = '?logon';

		if ( isset($_GET["logout"]) && $_GET["logout"]=="auto" ){
			$error = _("You have been automatically logged out");
		} else {
			$error = WebAppAuthentication::getErrorMessage();
		}

		// If a username was passed as GET parameter we will prefill the username input
		// of the login form with it.
		$user = isset($_GET['user']) ? htmlentities($_GET['user']) : '';

		// Lets add a header when login failed (DeskApp needs it to identify failed login attempts)
		if ( WebAppAuthentication::getErrorCode() !== NOERROR ){
			header("X-Zarafa-Hresult: " . get_mapi_error_name(WebAppAuthentication::getErrorCode()));
		}

		// Set a template variable for the favicon of the login, welcome, and webclient page
		$theme = Theming::getActiveTheme();
		$favicon = getFavicon(Theming::getActiveTheme());

		// Include the login template
		include(BASE_PATH . 'server/includes/templates/login.php');
		die();
	}

	// The user is authenticated! Let's get ready to start the webapp.

	// If the user just logged in or if url data was stored in the session,
	// we will redirect to make sure that a browser refresh will not post
	// the credentials again, and that the url data is taken away from the
	// url in the address bar (so a browser refresh will not pass them again)
	if ( WebAppAuthentication::isUsingLoginForm() || isset($_GET['action']) && !empty($_GET['action']) ){
		header('Location: ' . dirname($_SERVER['PHP_SELF']) , true, 303);
		die();
	}

	// TODO: we could replace all references to $GLOBALS['mapisession']
	// with WebAppAuthentication::getMapiSession(), that way we would
	// lose at least one GLOBAL (because globals suck)
	$GLOBALS['mapisession'] = WebAppAuthentication::getMapiSession();

	// Instantiate Plugin Manager and init the plugins (btw: globals suck)
	$GLOBALS['PluginManager'] = new PluginManager(ENABLE_PLUGINS);
	$GLOBALS['PluginManager']->detectPlugins(DISABLED_PLUGINS_LIST);
	$GLOBALS['PluginManager']->initPlugins(DEBUG_LOADER);

	$Language = new Language();

	// Create globals settings object (btw: globals suck)
	$GLOBALS["settings"] = new Settings($Language);

	// Create global operations object
	$GLOBALS["operations"] = new Operations();

	// Set session settings (language & style)
	foreach($GLOBALS["settings"]->getSessionSettings($Language) as $key=>$value){
		$_SESSION[$key] = $value;
	}

	// Get language from the request, or the session, or the user settings, or the config
	if (isset($_REQUEST["language"]) && $Language->is_language($_REQUEST["language"])) {
		$lang = $_REQUEST["language"];
		$GLOBALS["settings"]->set("zarafa/v1/main/language", $lang);
	} else if(isset($_SESSION["lang"])) {
		$lang = $_SESSION["lang"];
		$GLOBALS["settings"]->set("zarafa/v1/main/language", $lang);
	} else {
		$lang = $GLOBALS["settings"]->get("zarafa/v1/main/language");
		if (empty($lang)) {
			$lang = LANG;
			$GLOBALS["settings"]->set("zarafa/v1/main/language", $lang);
		}
	}

	$Language->setLanguage($lang);
	setcookie('lang', $lang, 0, '/', '', isset($_SERVER["HTTPS"]) && $_SERVER["HTTPS"] ? true : false);

	// add extra header
	header("X-Zarafa: " . trim(file_get_contents('version')));

	// Set a template variable for the favicon of the login, welcome, and webclient page
	$theme = Theming::getActiveTheme();
	$favicon = getFavicon(Theming::getActiveTheme());

	// If GET parameter 'load' is defined, we defer handling to the load.php script
	if ( isset($_GET['load']) ) {
		include(BASE_PATH . 'server/includes/load.php');
		die();
	}

	if (!DISABLE_WELCOME_SCREEN && $GLOBALS["settings"]->get("zarafa/v1/main/show_welcome") !== false) {

		// These hooks are defined twice (also when there is a "load" argument supplied)
		$GLOBALS['PluginManager']->triggerHook("server.index.load.welcome.before");
		include(BASE_PATH . 'server/includes/templates/welcome.php');
		$GLOBALS['PluginManager']->triggerHook("server.index.load.welcome.after");
	} else {

		// Set the show_welcome to true, so that when the admin is changing the
		// DISABLE_WELCOME_SCREEN option to false after some time, the users who are already
		// using the WebApp are not bothered with the Welcome Screen.
		$GLOBALS["settings"]->set("zarafa/v1/main/show_welcome", false);

		// Clean up old state files in tmp/session/
		$state = new State("index");
		$state->clean();

		// Clean up old attachments in tmp/attachments/
		$state = new AttachmentState();
		$state->clean();

		// Fetch the hierarchy state cache for unread counters notifications for subfolders
		$counterState = new State('counters_sessiondata');
		$counterState->open();
		$counterState->write("sessionData", update_hierarchy_counters());
		$counterState->close();

		// clean search folders
		cleanSearchFolders();

		// These hooks are defined twice (also when there is a "load" argument supplied)
		$GLOBALS['PluginManager']->triggerHook("server.index.load.main.before");

		// Include webclient
		include(BASE_PATH . 'server/includes/templates/webclient.php');
		$GLOBALS['PluginManager']->triggerHook("server.index.load.main.after");
	}
