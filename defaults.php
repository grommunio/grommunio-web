<?php

/**
 * This file is used to set configuration options to a default value that have
 * not been set in the config.php.Each definition of a configuration value must
 * be preceded by 'if(!defined("KEY"))'.
 */
require_once __DIR__ . '/server/includes/core/constants.php';

// Comment next line to disable the config check (or set FALSE to log the config errors)
if (!defined("CONFIG_CHECK")) {
	define("CONFIG_CHECK", true);
}
if (!defined("CONFIG_CHECK_COOKIES_HTTP")) {
	define("CONFIG_CHECK_COOKIES_HTTP", false);
}
if (!defined("CONFIG_CHECK_COOKIES_SSL")) {
	define("CONFIG_CHECK_COOKIES_SSL", false);
}

// Time that the state files are allowed to survive (in seconds)
// For filesystems on which relatime is used, this value should be larger then the relatime_interval
// for kernels 2.6.30 and above relatime is enabled by default, and the relatime_interval is set to
// 24 hours.
if (!defined("STATE_FILE_MAX_LIFETIME")) {
	define("STATE_FILE_MAX_LIFETIME", 28 * 60 * 60);
}

// Time that attachments are allowed to survive (in seconds)
if (!defined("UPLOADED_ATTACHMENT_MAX_LIFETIME")) {
	define("UPLOADED_ATTACHMENT_MAX_LIFETIME", 6 * 60 * 60);
}

// Set true to show public folders in hierarchy, false will disable public folders in hierarchy.
if (!defined("ENABLE_PUBLIC_FOLDERS")) {
	define("ENABLE_PUBLIC_FOLDERS", true);
}

/*
 * Set to true to give users the option to enable file previewer in their settings
 * Set to false to hide the setting and disable file previewer for all users
 */
if (!defined("ENABLE_FILE_PREVIEWER")) {
	define("ENABLE_FILE_PREVIEWER", true);
}

/*
 * Enable iconsets.
 */
if (!defined("ENABLE_ICONSETS")) {
	define("ENABLE_ICONSETS", true);
}

/*
 * Set to true to give users the possibility to edit and create mail filters on the store
 * of other users. The user needs owner permissions on the store and folder permissions on
 * the inbox of the other user.
 * SECURITY NOTE: This makes it possible for a user to create a filter on a folder for which
 * he does not have read permissions to forward e-mail to his own mailbox and read it anyway.
 */
if (!defined("ENABLE_SHARED_RULES")) {
	define("ENABLE_SHARED_RULES", false);
}

// Enable GZIP compression for responses
if (!defined("ENABLE_RESPONSE_COMPRESSION")) {
	define("ENABLE_RESPONSE_COMPRESSION", true);
}

// Type of full-text search engine in sqlite
if (!defined("SQLITE_FTS_ENGINE")) {
	define("SQLITE_FTS_ENGINE", "fts5");
}

// Tokenizer for sqlite full text search engine
// can be simple, unicode61, icu, ascii, porter
if (!defined("SQLITE_FTS_TOKENIZER")) {
	define("SQLITE_FTS_TOKENIZER", "trigram");
}

/*
 * When set to true this enable the filtering of the HTML body using DOMPurify.
 */
if (!defined("ENABLE_DOMPURIFY_FILTER")) {
	define("ENABLE_DOMPURIFY_FILTER", true);
}

/*
 * Set to false to enable login with Single Sign-On (SSO) on SSO environments.
 */
if (!defined("ENABLE_REMOTE_USER_LOGIN")) {
	define("ENABLE_REMOTE_USER_LOGIN", true);
}

/*
 * When set to false this disables the welcome screen shown to new users.
 */
if (!defined("ENABLE_WELCOME_SCREEN")) {
	define("ENABLE_WELCOME_SCREEN", true);
}

/*
 * By default we won't disable the FULL GAB, as it is a performance option
 * which, when enabled, prevents the full GAB to be loaded'
 */
if (!defined("ENABLE_FULL_GAB")) {
	define("ENABLE_FULL_GAB", true);
}

/*
 * Set a maximum number of (search) results for the addressbook
 * When more results are found no results will be displayed in the client.
 * Set to 0 to disable this feature and show all results.
 */
if (!defined("MAX_GAB_RESULTS")) {
	define("MAX_GAB_RESULTS", 0);
}

/*
 * By default we disable the public contact folders,
 * as it may increase address-book loading time.
 */
if (!defined("ENABLE_PUBLIC_CONTACT_FOLDERS")) {
	define("ENABLE_PUBLIC_CONTACT_FOLDERS", true);
}

/*
 * By default we disable the shared contact folders, as it is a performance option
 * which, when enabled, may cause delay in loading of address-book
 */
if (!defined("ENABLE_SHARED_CONTACT_FOLDERS")) {
	define("ENABLE_SHARED_CONTACT_FOLDERS", true);
}

/*
 * Limit the amount of members shown in the addressbook details dialog for a distlist. If the list
 * is too great the browser will hang loading and rendering all the items. By default set to 0
 * which means it loads all members.
 */
if (!defined("ABITEMDETAILS_MAX_NUM_DISTLIST_MEMBERS")) {
	define("ABITEMDETAILS_MAX_NUM_DISTLIST_MEMBERS", 0);
}

/*
 * Use direct booking by default (books resources directly in the calendar instead of sending a meeting
 * request)
 * Booking method (true = direct booking, false = send meeting request)
 */
if (!defined("ENABLE_DIRECT_BOOKING")) {
	define("ENABLE_DIRECT_BOOKING", true);
}

/*
 List of languages that should be enabled in the settings
 language drop down. Languages should be specified
 using <languagecode>_<regioncode>[.UTF-8], and separated with
 semicolon. A list of available languages can be found in
 the manual or by looking at the list of directories in
 /usr/share/grommunio-web/server/language.
 */
if (!defined('ENABLED_LANGUAGES')) {
	define(
		"ENABLED_LANGUAGES",
		"af_ZA;am_ET;ar_DZ;ar_SA;as_IN;az_AZ;" .
		"be_BY;bg_BG;bn_BD;bn_IN;bs_BA;" .
		"ca_ES;ca_ES@valencia;cs_CZ;cy_GB;" .
		"da_DK;de_CH;de_DE;el_GR;en_GB;en_US;es_ES;et_EE;eu_ES;" .
		"fa_IR;fi_FI;fil_PH;fr_FR;" .
		"ga_IE;gd_GB;gl_ES;gu_IN;" .
		"he_IL;hi_IN;hr_HR;hu_HU;hy_AM;" .
		"id_ID;is_IS;it_IT;" .
		"ja_JP;" .
		"ka_GE;kk_KZ;km_KH;kn_IN;kok_IN;ko_KR;ky_KG;" .
		"lb_LU;lt_LT;lv_LV;" .
		"mi_NZ;mk_MK;ml_IN;mn_MN;mr_IN;ms_MY;mt_MT;" .
		"nb_NO;ne_NP;nl_NL;nn_NO;" .
		"or_IN;" .
		"pa_IN;pl_PL;prs_AF;pt_BR;pt_PT;" .
		"quz_PE;" .
		"ro_RO;ru_RU;" .
		"sd_IN;si_LK;sk_SK;sl_SI;sq_AL;sr_BA;sr_RS;sr_RS@latin;sv_SE;sw_KE;" .
		"ta_IN;te_IN;th_TH;tk_TM;tr_TR;tt_RU;" .
		"ug_CN;uk_UA;ur_PK;uz_UZ;" .
		"vi_VN;" .
		"zh_CN;zh_TW"
	);
}

/*
 * Defines the base URL where the User Manual for grommunio Web can be found
 */
if (!defined("PLUGIN_WEBAPPMANUAL_URL")) {
	define("PLUGIN_WEBAPPMANUAL_URL", "https://docs.grommunio.com/web");
}

/*
 * Defines the domains to which redirection after login is allowed. The redirect url will be read from
 * the GET-parameter 'continue'.
 * Add http(s):// to the domains and separate domains with spaces.
 * Note: The domain under which grommunio Web runs, is always allowed and does
 * not need to be added here.
 */
if (!defined("REDIRECT_ALLOWED_DOMAINS")) {
	define("REDIRECT_ALLOWED_DOMAINS", '');
}

/*
 * Enable plugins
 */
if (!defined("ENABLE_PLUGINS")) {
	define("ENABLE_PLUGINS", true);
}

/*
 * Defines the plugin directory
 */
if (!defined("PATH_PLUGIN_CONFIG_DIR")) {
	define("PATH_PLUGIN_CONFIG_DIR", PATH_PLUGIN_DIR);
}

/*
 * Enable widgets/today context.
 */
if (!defined("ENABLE_WIDGETS")) {
	define("ENABLE_WIDGETS", true);
}

/*
 * Defines a list of plugins that cannot be disabled by users.
 */
if (!defined("ALWAYS_ENABLED_PLUGINS_LIST")) {
	define("ALWAYS_ENABLED_PLUGINS_LIST", "");
}

/*
 * Enable themes.
 */
if (!defined("ENABLE_THEMES")) {
	define("ENABLE_THEMES", true);
}

/*
 * A theme. When this is not defined or empty or 'default', the default theme will be loaded.
 * The theme should the (directory)name of a installed theme plugin.
 */
if (!defined("THEME")) {
	define("THEME", "");
}

/*
 * Use the classic icons as default iconset
 */
if (!defined("ICONSET")) {
	define("ICONSET", "breeze");
}

/*
 * Disable/enabled advanced settings
 */
if (!defined("ENABLE_ADVANCED_SETTINGS")) {
	define("ENABLE_ADVANCED_SETTINGS", false);
}

/*
 * Freebusy start offset that will be used to load freebusy data in appointments, number is subtracted from current time
 */
if (!defined("FREEBUSY_LOAD_START_OFFSET")) {
	define("FREEBUSY_LOAD_START_OFFSET", 7);
}

/*
 * Freebusy end offset that will be used to load freebusy data in appointments, number is added to current time
 */
if (!defined("FREEBUSY_LOAD_END_OFFSET")) {
	define("FREEBUSY_LOAD_END_OFFSET", 90);
}

/*
 * Maximum eml files to be included in a single ZIP archive
 */
if (!defined("MAX_EML_FILES_IN_ZIP")) {
	define("MAX_EML_FILES_IN_ZIP", 50);
}

/*
 * CONTACT_PREFIX used for contact name
 */
if (!defined("CONTACT_PREFIX")) {
	define("CONTACT_PREFIX", false);
}

/*
 * CONTACT_SUFFIX used for contact name
 */
if (!defined("CONTACT_SUFFIX")) {
	define("CONTACT_SUFFIX", false);
}

/*
 * Color schemes used for the calendars
 */
if (!defined("COLOR_SCHEMES")) {
	define("COLOR_SCHEMES", json_encode([
		[
			'name' => 'pink',
			'displayName' => _('Pink'),
			'base' => '#ff0099',
		],
		[
			'name' => 'charmpink',
			'displayName' => _('Charm pink'),
			'base' => '#f17daa',
		],
		[
			'name' => 'cadmiumred',
			'displayName' => _('Cadmium red'),
			'base' => '#e30022',
		],
		[
			'name' => 'apricot',
			'displayName' => _('Apricot'),
			'base' => '#f7b884',
		],
		[
			'name' => 'california',
			'displayName' => _('California'),
			'base' => '#f89406',
		],
		[
			'name' => 'yellow',
			'displayName' => _('Yellow'),
			'base' => '#f7ca18',
		],
		[
			'name' => 'softgreen',
			'displayName' => _('Soft green'),
			'base' => '#d3e28b',
		],
		[
			'name' => 'green',
			'displayName' => _('Green'),
			'base' => '#5ab557',
		],
		[
			'name' => 'mint',
			'displayName' => _('Mint'),
			'base' => '#1fa480',
		],
		[
			'name' => 'pearlaqua',
			'displayName' => _('Pearl aqua'),
			'base' => '#88d8c0',
		],
		[
			'name' => 'grommunioblue',
			'displayName' => _('Grommunio blue'),
			'base' => '#00b3f0',
		],
		[
			'name' => 'babyblue',
			'displayName' => _('Baby blue'),
			'base' => '#7bd0f0',
		],
		[
			'name' => 'blue',
			'displayName' => _('Blue'),
			'base' => '#0f70bd',
		],
		[
			'name' => 'mauve',
			'displayName' => _('Mauve'),
			'base' => '#9a8bbc',
		],
		[
			'name' => 'purple',
			'displayName' => _('Purple'),
			'base' => '#912787',
		],
		[
			'name' => 'silversand',
			'displayName' => _('Silver sand'),
			'base' => '#bdc3c7',
		],
	]));
}

/*
 * Predefined categories. Categories should have at least a name and a color. The
 * quickAccess property can be set to true to 'pin' the category to the menu. (i.e. it
 * will be shown in the categories menu). The sortIndex property can be used to support
 * the categories in the menu and 'Manage categories' dialog.
 *
 * The first six categories have the additional fields standardIndex. This field maps
 * these categories to the colored flag that could have been set on an item. These
 * flags will be shown as categories in grommunio Web.
 */
if (!defined("DEFAULT_CATEGORIES")) {
	define("DEFAULT_CATEGORIES", json_encode([
		[
			'name' => _('Red'),
			'color' => '#e40023',
			'standardIndex' => 6,
			'quickAccess' => true,
			'sortIndex' => 0,
			'used' => false,
		],
		[
			'name' => _('Orange'),
			'color' => '#f99406',
			'standardIndex' => 2,
			'quickAccess' => true,
			'sortIndex' => 1,
			'used' => false,
		],
		[
			'name' => _('Yellow'),
			'color' => '#f7ca17',
			'standardIndex' => 4,
			'quickAccess' => true,
			'sortIndex' => 2,
			'used' => false,
		],
		[
			'name' => _('Green'),
			'color' => '#5ab556',
			'standardIndex' => 3,
			'quickAccess' => true,
			'sortIndex' => 3,
			'used' => false,
		],
		[
			'name' => _('Blue'),
			'color' => '#0f70bd',
			'standardIndex' => 5,
			'quickAccess' => true,
			'sortIndex' => 4,
			'used' => false,
		],
		[
			'name' => _('Purple'),
			'color' => '#912887',
			'standardIndex' => 1,
			'quickAccess' => true,
			'sortIndex' => 5,
			'used' => false,
		],
		[
			'name' => _('Important'),
			'color' => '#F4B7B5',
		],
		[
			'name' => _('Work'),
			'color' => '#B6CAE9',
		],
		[
			'name' => _('Personal'),
			'color' => '#D9E9B6',
		],
		[
			'name' => _('Holiday'),
			'color' => '#EBDA6C',
		],
		[
			'name' => _('Required'),
			'color' => '#E9DAB6',
		],
		[
			'name' => _('Travel Required'),
			'color' => '#B6DDE9',
		],
		[
			'name' => _('Preparation Required'),
			'color' => '#B6B6E9',
		],
		[
			'name' => _('Birthday'),
			'color' => '#DCB6E9',
		],
		[
			'name' => _('Special Date'),
			'color' => '#E9BBB6',
		],
		[
			'name' => _('Phone Interview'),
			'color' => '#C1E9B6',
		],
		[
			'name' => _('Business'),
			'color' => '#BDC3C7',
		],
		[
			'name' => _('Competition'),
			'color' => '#BDC3C7',
		],
		[
			'name' => _('Favorites'),
			'color' => '#BDC3C7',
		],
		[
			'name' => _('Gifts'),
			'color' => '#BDC3C7',
		],
		[
			'name' => _('Goals/Objectives'),
			'color' => '#BDC3C7',
		],
		[
			'name' => _('Holiday Cards'),
			'color' => '#BDC3C7',
		],
		[
			'name' => _('Hot Contacts'),
			'color' => '#BDC3C7',
		],
		[
			'name' => _('Ideas'),
			'color' => '#BDC3C7',
		],
		[
			'name' => _('International'),
			'color' => '#BDC3C7',
		],
		[
			'name' => _('Key Customer'),
			'color' => '#BDC3C7',
		],
		[
			'name' => _('Miscellaneous'),
			'color' => '#BDC3C7',
		],
		[
			'name' => _('Phone Calls'),
			'color' => '#BDC3C7',
		],
		[
			'name' => _('Status'),
			'color' => '#BDC3C7',
		],
		[
			'name' => _('Strategies'),
			'color' => '#BDC3C7',
		],
		[
			'name' => _('Suppliers'),
			'color' => '#BDC3C7',
		],
		[
			'name' => _('Time & Expenses'),
			'color' => '#BDC3C7',
		],
		[
			'name' => _('VIP'),
			'color' => '#BDC3C7',
		],
		[
			'name' => _('Waiting'),
			'color' => '#BDC3C7',
		],
	]));
}

/*
 * Maximum reminder items we can show on client side.
 */
if (!defined("MAX_NUM_REMINDERS")) {
	define("MAX_NUM_REMINDERS", 99);
}

/*
 * Set true to default soft delete the shared store items
 */
if (!defined("ENABLE_DEFAULT_SOFT_DELETE")) {
	define("ENABLE_DEFAULT_SOFT_DELETE", false);
}

/*
 * Shared store polling timer in minutes
 */
if (!defined("SHARED_STORE_POLLING_INTERVAL")) {
	define("SHARED_STORE_POLLING_INTERVAL", 15);
}

/*
 * Enable background prefetching of message bodies for the mails that are visible in the
 * mail list. When enabled the client will asynchronously fetch all visible messages so
 * that opening a mail does not require an additional round-trip.
 */
if (!defined("PREFETCH_EMAIL_ENABLED")) {
	define("PREFETCH_EMAIL_ENABLED", true);
}

/*
 * Prefetch email count (deprecated - kept for backwards compatibility only).
 */
if (!defined("PREFETCH_EMAIL_COUNT")) {
	define("PREFETCH_EMAIL_COUNT", 10);
}

// Define the interval between loading of new emails in the background (deprecated).
if (!defined("PREFETCH_EMAIL_INTERVAL")) {
	define("PREFETCH_EMAIL_INTERVAL", 30);
}

/*\
* Powerpaste                           *
\*/

// Options for TinyMCE's powerpaste plugin, see https://www.tiny.cloud/docs/plugins/powerpaste/#configurationoptions
// for more details.
if (!defined("POWERPASTE_WORD_IMPORT")) {
	define("POWERPASTE_WORD_IMPORT", "merge");
}
if (!defined("POWERPASTE_HTML_IMPORT")) {
	define("POWERPASTE_HTML_IMPORT", "merge");
}
if (!defined("POWERPASTE_ALLOW_LOCAL_IMAGES")) {
	define("POWERPASTE_ALLOW_LOCAL_IMAGES", true);
}

/*
 * Defaults for sqlite search index
 */
if (!defined("MAX_FTS_RESULT_ITEMS")) {
	define("MAX_FTS_RESULT_ITEMS", 1000);
}

/*
 * The following options are taken from the debug.php
 */
if (!defined("DEBUG_LOADER")) {
	define("DEBUG_LOADER", LOAD_RELEASE);
}
if (!defined("DEBUG_JSONOUT")) {
	define("DEBUG_JSONOUT", false);
}
if (!defined("DEBUG_JSONOUT_DIR")) {
	define("DEBUG_JSONOUT_DIR", 'debug_json/');
}
if (!defined("DEBUG_JSONOUT_GZIP")) {
	define("DEBUG_JSONOUT_GZIP", false);
}
if (!defined("DEBUG_PLUGINS")) {
	define("DEBUG_PLUGINS", false);
}
if (!defined("DEBUG_PLUGINS_DISABLE_CACHE")) {
	define("DEBUG_PLUGINS_DISABLE_CACHE", false);
}
if (!defined("DEBUG_DUMP_FILE")) {
	define("DEBUG_DUMP_FILE", "debug.txt");
}

/*
 * Defaults for Logger
 */
if (!defined("LOG_USER_LEVEL")) {
	define("LOG_USER_LEVEL", LOGLEVEL_OFF);
}

// To save e.g. user activity data only for selected users, provide the username followed by semicolon.
// The data will be saved into a dedicated file per user in the LOG_FILE_DIR
// Users have to be encapsulated in quotes, several users are semicolon separated, like:
// define('LOG_USERS', 'user1;user2;user3');
if (!defined("LOG_USERS")) {
	define("LOG_USERS", "");
}

// Location of the log directory
// e.g /var/log/grommunio/
if (!defined("LOG_FILE_DIR")) {
	define("LOG_FILE_DIR", "");
}
if (!defined("LOG_SUCCESSFUL_LOGINS")) {
	define("LOG_SUCCESSFUL_LOGINS", false);
}

// Default incoming email preview style:
// true -> HTML
// false -> Plain
if (!defined("USE_HTML_EMAIL_PREVIEW")) {
	define("USE_HTML_EMAIL_PREVIEW", true);
}
