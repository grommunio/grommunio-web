<?php

	/*************************************************************************************
	 *
	 * This script bootstraps the entry scripts (index.php and kopano.php) by:
	 * 	- including all classes that are used by both entry scripts
	 * 	- check the correctness of the configuration file (if configured to do so)
	 * 	- start buffering output (so we can add headers at any time)
	 * 	- set the locale for character classification and conversion to en_US.UTF-8
	 * 	- start a php session
	 *
	 * Note: Additional includes for kopano.php are added by bootstrap.kopano.php
	 *
	 *************************************************************************************/

	// It would be better if we could just put the few lines of code that are in init.php
	// in this script. Unfortunately that would break plugins that include init.php on their
	// own. (e.g. the spellchecker plugin)
	require_once(dirname(__FILE__) . '/../../init.php');

	// load configuration file
	if ( !file_exists( BASE_PATH . 'config.php') ){
		die("<strong>config.php is missing!</strong>");
	}
	require_once(BASE_PATH . 'server/includes/core/constants.php');
	require_once(BASE_PATH . 'config.php');
	require_once(BASE_PATH . 'defaults.php');

	// check if configuration is correct (only for the index.php)
	if (defined("CONFIG_CHECK") && basename($_SERVER['SCRIPT_NAME']) === 'index.php' ){
		require_once(BASE_PATH . 'server/includes/core/class.configcheck.php');
		new ConfigCheck(CONFIG_CHECK);
	}

	// Include the files
	require_once(BASE_PATH . 'server/includes/core/class.webappsession.php');

	require_once(BASE_PATH . 'server/includes/mapi/mapi.util.php');
	require_once(BASE_PATH . 'server/includes/mapi/mapicode.php');
	require_once(BASE_PATH . 'server/includes/mapi/mapidefs.php');
	require_once(BASE_PATH . 'server/includes/mapi/mapitags.php');
	require_once(BASE_PATH . 'server/includes/mapi/mapiguid.php');
	require_once(BASE_PATH . 'server/includes/mapi/class.baseexception.php');
	require_once(BASE_PATH . 'server/includes/mapi/class.mapiexception.php');

	require_once(BASE_PATH . 'server/includes/exceptions/class.ZarafaException.php');
	require_once(BASE_PATH . 'server/includes/exceptions/class.ZarafaErrorException.php');
	require_once(BASE_PATH . 'server/includes/util.php');
	require_once(BASE_PATH . 'server/includes/gettext.php');

	require_once(BASE_PATH . 'server/includes/core/class.conversion.php');
	require_once(BASE_PATH . 'server/includes/core/class.mapisession.php');
	require_once(BASE_PATH . 'server/includes/core/class.properties.php');
	require_once(BASE_PATH . 'server/includes/core/class.operations.php');
	require_once(BASE_PATH . 'server/includes/core/class.entryid.php');

	require_once(BASE_PATH . 'server/includes/core/class.settings.php');
	require_once(BASE_PATH . 'server/includes/core/class.language.php');

	require_once(BASE_PATH . 'server/includes/core/class.state.php');
	require_once(BASE_PATH . 'server/includes/core/class.attachmentstate.php');

	require_once(BASE_PATH . 'server/includes/core/class.pluginmanager.php');
	require_once(BASE_PATH . 'server/includes/core/class.plugin.php');

	require_once(BASE_PATH . 'server/includes/core/class.encryptionstore.php');
	require_once(BASE_PATH . 'server/includes/core/class.webappauthentication.php');

	require_once(BASE_PATH . 'server/includes/core/class.todolist.php');

	require_once(BASE_PATH . 'server/includes/core/class.freebusy.php');

	require_once(BASE_PATH . 'server/includes/core/class.theming.php');
	require_once(BASE_PATH . 'server/includes/core/class.iconsets.php');

	require_once(BASE_PATH . 'server/includes/core/class.log.php');
	require_once(BASE_PATH . 'server/includes/logger/class.baselogger.php');
	require_once(BASE_PATH . 'server/includes/logger/class.filelog.php');

	ob_start();
	setlocale(LC_CTYPE, Language::resolveLanguage(LANG));

	// Start a new session
	$webappSession = WebAppSession::getInstance();
