<?php

/*
 *
 * This script bootstraps the entry scripts (index.php and grommunio.php) by:
 * 	- including all classes that are used by both entry scripts
 * 	- check the correctness of the configuration file (if configured to do so)
 * 	- start buffering output (so we can add headers at any time)
 * 	- set the locale for character classification and conversion to en_US.UTF-8
 * 	- start a php session
 *
 * Note: Additional includes for grommunio.php are added by bootstrap.grommunio.php
 *
 */

// It would be better if we could just put the few lines of code that are in init.php
// in this script. Unfortunately that would break plugins that include init.php on their
// own. (e.g. the spellchecker plugin)
require_once __DIR__ . '/../../init.php';

// Polyfill for PHP 8.3's built-in #[\Override] attribute on PHP 8.1/8.2
// Define only if it doesn't already exist (i.e., when running on < 8.3).
if (!class_exists('Override')) {
	if (class_exists('Attribute')) {
		#[Attribute(Attribute::TARGET_METHOD)]
		class Override {}
	}
}

// load configuration file
if (!file_exists(BASE_PATH . 'config.php')) {
	exit("<strong>config.php is missing!</strong>");
}
require_once BASE_PATH . 'server/includes/core/constants.php';
require_once BASE_PATH . 'config.php';
require_once BASE_PATH . 'defaults.php';

// check if configuration is correct (only for the index.php)
if (defined("CONFIG_CHECK") && basename((string) $_SERVER['SCRIPT_NAME']) === 'index.php') {
	require_once BASE_PATH . 'server/includes/core/class.configcheck.php';
	new ConfigCheck(CONFIG_CHECK);
}

// Include the files
require_once UMAPI_PATH . '/mapi.util.php';
require_once UMAPI_PATH . '/mapidefs.php';
require_once UMAPI_PATH . '/mapitags.php';
require_once UMAPI_PATH . '/mapiguid.php';
require_once UMAPI_PATH . '/class.baseexception.php';
require_once UMAPI_PATH . '/class.mapiexception.php';

require_once BASE_PATH . 'server/includes/exceptions/class.ZarafaException.php';
require_once BASE_PATH . 'server/includes/exceptions/class.ZarafaErrorException.php';
require_once BASE_PATH . 'server/includes/core/class.webappsession.php';
require_once UMAPI_PATH . '/class.baserecurrence.php';
require_once UMAPI_PATH . '/class.recurrence.php';
require_once UMAPI_PATH . '/class.meetingrequest.php';
require_once UMAPI_PATH . '/class.taskrecurrence.php';
require_once UMAPI_PATH . '/class.taskrequest.php';

require_once BASE_PATH . 'server/includes/util.php';
require_once BASE_PATH . 'server/includes/gettext.php';

require_once BASE_PATH . 'server/includes/core/class.conversion.php';
require_once BASE_PATH . 'server/includes/core/class.mapisession.php';
require_once BASE_PATH . 'server/includes/core/class.properties.php';
require_once BASE_PATH . 'server/includes/core/class.operations.php';
require_once BASE_PATH . 'server/includes/core/class.entryid.php';

require_once BASE_PATH . 'server/includes/core/class.settings.php';
require_once BASE_PATH . 'server/includes/core/class.language.php';

require_once BASE_PATH . 'server/includes/core/class.state.php';
require_once BASE_PATH . 'server/includes/core/class.attachmentstate.php';

require_once BASE_PATH . 'server/includes/core/class.pluginmanager.php';
require_once BASE_PATH . 'server/includes/core/class.plugin.php';

require_once BASE_PATH . 'server/includes/core/class.encryptionstore.php';
require_once BASE_PATH . 'server/includes/core/class.webappauthentication.php';

require_once BASE_PATH . 'server/includes/core/class.todolist.php';

require_once UMAPI_PATH . '/class.freebusy.php';

require_once BASE_PATH . 'server/includes/core/class.theming.php';
require_once BASE_PATH . 'server/includes/core/class.iconsets.php';

require_once BASE_PATH . 'server/includes/core/class.log.php';
require_once BASE_PATH . 'server/includes/logger/class.baselogger.php';
require_once BASE_PATH . 'server/includes/logger/class.filelog.php';

ob_start();
setlocale(LC_CTYPE, Language::resolveLanguage(LANG));

// Start a new session
$webappSession = WebAppSession::getInstance();
