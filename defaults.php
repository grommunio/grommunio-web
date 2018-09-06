<?php
/**
 * This file is used to set configuration options to a default value that have
 * not been set in the config.php.Each definition of a configuration value must
 * be preceeded by "if(!defined('KEY'))"
 */
if(!defined('CONFIG_CHECK')) define('CONFIG_CHECK', TRUE);
if(!defined('CONFIG_CHECK_COOKIES_HTTP')) define('CONFIG_CHECK_COOKIES_HTTP', FALSE);
if(!defined('CONFIG_CHECK_COOKIES_SSL')) define('CONFIG_CHECK_COOKIES_SSL', FALSE);

if(!defined('STATE_FILE_MAX_LIFETIME')) define('STATE_FILE_MAX_LIFETIME', 28*60*60);
if(!defined('UPLOADED_ATTACHMENT_MAX_LIFETIME')) define('UPLOADED_ATTACHMENT_MAX_LIFETIME', 6*60*60);
if(!defined('ENABLE_PUBLIC_FOLDERS')) define('ENABLE_PUBLIC_FOLDERS', true);


/**
 * Set to true to give users the possiblity to edit and create mail filters on the store
 * of other users. The user needs owner permissions on the store and folder permissions on
 * the inbox of the other user.
 * SECURITY NOTE: This makes it possible for a user to create a filter on a folder for which
 * he does not have read permissions to forward e-mail to his own mailbox and read it anyway.
 */
if(!defined('ENABLE_SHARED_RULES')) define('ENABLE_SHARED_RULES', false);

/**
 * When set to true, we enable GZIP
 */
if(!defined('ENABLE_RESPONSE_COMPRESSION')) define('ENABLE_RESPONSE_COMPRESSION', true);

/**
 * When set to true this disables the fitlering of the HTML body.
 */
if(!defined('DISABLE_HTMLBODY_FILTER')) define('DISABLE_HTMLBODY_FILTER', false);

/**
 * Set to true to load HTML filtered body's from kopano-server instead
 * of letting WebApp sanitize the HTML mail body.
 */
if(!defined('KC_FILTERED_BODY')) define('KC_FILTERED_BODY', false);

/**
 * Set to true to disable login with Single Sign-On (SSO) on SSO environments.
 */
if(!defined('DISABLE_REMOTE_USER_LOGIN')) define('DISABLE_REMOTE_USER_LOGIN', false);

/**
 * When set to true this disables the welcome screen to be shown for first time users.
 */
if(!defined('DISABLE_WELCOME_SCREEN')) define('DISABLE_WELCOME_SCREEN', false);

/**
 * By default we won't disable the FULL GAB, as it is a performance option
 * which, when enabled, prevents the full GAB to be loaded'
 */
if(!defined('DISABLE_FULL_GAB')) define('DISABLE_FULL_GAB', false);

/**
 * By default we disable the public contact folders, as it is a performance option
 * which, when enabled, may cause delay in loading of address-book
 */
if(!defined('DISABLE_PUBLIC_CONTACT_FOLDERS')) define('DISABLE_PUBLIC_CONTACT_FOLDERS', true);

/**
 * By default we disable the shared contact folders, as it is a performance option
 * which, when enabled, may cause delay in loading of address-book
 */
if(!defined('DISABLE_SHARED_CONTACT_FOLDERS')) define('DISABLE_SHARED_CONTACT_FOLDERS', true);

/**
 * Limit the amount of members shown in the addressbook details dialog for a distlist. If the list
 * is too great the browser will hang loading and rendereing all the items. By default set to 0
 * which means it loads all members.
 */
if(!defined('ABITEMDETAILS_MAX_NUM_DISTLIST_MEMBERS')) define('ABITEMDETAILS_MAX_NUM_DISTLIST_MEMBERS', 0);

/**
 * Use direct booking by default (books resources directly in the calendar instead of sending a meeting
 * request)
 */
if(!defined('ENABLE_DIRECT_BOOKING')) define('ENABLE_DIRECT_BOOKING', true);

if(!defined('ENABLED_LANGUAGES')) define("ENABLED_LANGUAGES", "bg_BG;ca_ES;da_DK;el_GR;et_EE;fa_IR;gl_ES;hr_HR;ko_KR;lt_LT;pt_PT;si_SI;sv_SE;uk_UA;cs_CZ;de_DE;en_GB;en_US;es_ES;fr_FR;he_IL;it_IT;nl_NL;pt_BR;ru_RU;zh_CN;zh_TW;ja_JP;fi_FI;hu_HU;tr_TR;nb_NO;pl_PL");

/**
 * Defines the domains to which redirection after login is allowed. The redirect url will be read from
 * the GET-parameter 'continue'.
 */
if(!defined('REDIRECT_ALLOWED_DOMAINS')) define('REDIRECT_ALLOWED_DOMAINS', '');

if(!defined('ENABLE_PLUGINS')) define('ENABLE_PLUGINS', true);
if(!defined('PATH_PLUGIN_CONFIG_DIR')) define('PATH_PLUGIN_CONFIG_DIR', PATH_PLUGIN_DIR);

/**
 * Defines a list of plugins that cannot be disabled by users.
 */
if(!defined('ALWAYS_ENABLED_PLUGINS_LIST')) define('ALWAYS_ENABLED_PLUGINS_LIST', '');

/**
 * A theme. When this is not defined or empty or 'default', the default Kopano theme will be loaded.
 * The theme should the (directory)name of a installed theme plugin.
 */
if(!defined('THEME')) define('THEME', '');

/**
 * Set to true to give users the ability to chose a personal theme that will be shown
 * when they are logged in.
 */
if(!defined('PERSONAL_THEMES_ENABLED')) define('PERSONAL_THEMES_ENABLED', false);

// Disable/enabled advanced settings
if(!defined('ENABLE_ADVANCED_SETTINGS')) define('ENABLE_ADVANCED_SETTINGS', false);

// Freebusy start offset that will be used to load freebusy data in appointments, number is subtracted from current time
if(!defined('FREEBUSY_LOAD_START_OFFSET')) define('FREEBUSY_LOAD_START_OFFSET', 7);

// Freebusy end offset that will be used to load freebusy data in appointments, number is added to current time
if(!defined('FREEBUSY_LOAD_END_OFFSET')) define('FREEBUSY_LOAD_END_OFFSET', 90);

// Maximum eml files to be included in a single ZIP archive
if(!defined('MAX_EML_FILES_IN_ZIP')) define('MAX_EML_FILES_IN_ZIP', 50);

// CONTACT_PREFIX used for contact name
if (!defined('CONTACT_PREFIX')) define('CONTACT_PREFIX', false);

// CONTACT_SUFFIX used for contact name
if (!defined('CONTACT_SUFFIX')) define('CONTACT_SUFFIX', false);

// Color schemes used for the calendars
if (!defined('COLOR_SCHEMES')) define('COLOR_SCHEMES', json_encode(array(
	array(
		'name' => 'pink',
		'displayName' => _('Pink'),
		'base' => '#ff0099'
	),
	array(
		'name' => 'charmpink',
		'displayName' => _('Charm pink'),
		'base' => '#f17daa'
	),
	array(
		'name' => 'cadmiumred',
		'displayName' => _('Cadmium red'),
		'base' => '#e30022'
	),
	array(
		'name' => 'apricot',
		'displayName' => _('Apricot'),
		'base' => '#f7b884'
	),
	array(
		'name' => 'california',
		'displayName' => _('California'),
		'base' => '#f89406'
	),
	array(
		'name' => 'yellow',
		'displayName' => _('Yellow'),
		'base' => '#f7ca18'
	),
	array(
		'name' => 'softgreen',
		'displayName' => _('Soft green'),
		'base' => '#d3e28b'
	),
	array(
		'name' => 'green',
		'displayName' => _('Green'),
		'base' => '#5ab557'
	),
	array(
		'name' => 'mint',
		'displayName' => _('Mint'),
		'base' => '#1fa480'
	),
	array(
		'name' => 'pearlaqua',
		'displayName' => _('Pearl aqua'),
		'base' => '#88d8c0'
	),
	array(
		'name' => 'kopanoblue',
		'displayName' => _('Kopano blue'),
		'base' => '#00b3f0'
	),
	array(
		'name' => 'babyblue',
		'displayName' => _('Baby blue'),
		'base' => '#7bd0f0'
	),
	array(
		'name' => 'blue',
		'displayName' => _('Blue'),
		'base' => '#0f70bd'
	),
	array(
		'name' => 'mauve',
		'displayName' => _('Mauve'),
		'base' => '#9a8bbc'
	),
	array(
		'name' => 'purple',
		'displayName' => _('Purple'),
		'base' => '#912787'
	),
	array(
		'name' => 'silversand',
		'displayName' => _('Silver sand'),
		'base' => '#bdc3c7'
	)
)));

/*
 * Predefined categories. Categories should have at least a name and a color. The
 * quickAccess property can be set to true to 'pin' the category to the menu. (i.e. it
 * will be shown in the categories menu). The sortIndex property can be used to support
 * the categories in the menu and 'Manage categories' dialog.
 *
 * The first six categories have the additional fields standardIndex. This field maps
 * these categories to the colored flag that could have been set on an item. These
 * flags will be shown as categories in the WebApp.
 */
if (!defined('DEFAULT_CATEGORIES')) define('DEFAULT_CATEGORIES', json_encode(array(
	array(
		'name' => _('Red'),
		'color' => '#e40023',
		'standardIndex' => 6,
		'quickAccess' => true,
		'sortIndex' => 0,
		'used' => false
	),
	array(
		'name' => _('Orange'),
		'color' => '#f99406',
		'standardIndex' => 2,
		'quickAccess' => true,
		'sortIndex' => 1,
		'used' => false
	),
	array(
		'name' => _('Yellow'),
		'color' => '#f7ca17',
		'standardIndex' => 4,
		'quickAccess' => true,
		'sortIndex' => 2,
		'used' => false
	),
	array(
		'name' => _('Green'),
		'color' => '#5ab556',
		'standardIndex' => 3,
		'quickAccess' => true,
		'sortIndex' => 3,
		'used' => false
	),
	array(
		'name' => _('Blue'),
		'color' => '#0f70bd',
		'standardIndex' => 5,
		'quickAccess' => true,
		'sortIndex' => 4,
		'used' => false
	),
	array(
		'name' => _('Purple'),
		'color' => '#912887',
		'standardIndex' => 1,
		'quickAccess' => true,
		'sortIndex' => 5,
		'used' => false
	),
	array(
		'name' => _('Important'),
		'color' => '#F4B7B5'
	),
	array(
		'name' => _('Work'),
		'color' => '#B6CAE9'
	),
	array(
		'name' => _('Personal'),
		'color' => '#D9E9B6'
	),
	array(
		'name' => _('Holiday'),
		'color' => '#EBDA6C'
	),
	array(
		'name' => _('Required'),
		'color' => '#E9DAB6'
	),
	array(
		'name' => _('Travel Required'),
		'color' => '#B6DDE9'
	),
	array(
		'name' => _('Preparation Required'),
		'color' => '#B6B6E9'
	),
	array(
		'name' => _('Birthday'),
		'color' => '#DCB6E9'
	),
	array(
		'name' => _('Special Date'),
		'color' => '#E9BBB6'
	),
	array(
		'name' => _('Phone Interview'),
		'color' => '#C1E9B6'
	),
	array(
		'name' => _('Business'),
		'color' => '#BDC3C7'
	),
	array(
		'name' => _('Competition'),
		'color' => '#BDC3C7'
	),
	array(
		'name' => _('Favorites'),
		'color' => '#BDC3C7'
	),
	array(
		'name' => _('Gifts'),
		'color' => '#BDC3C7'
	),
	array(
		'name' => _('Goals/Objectives'),
		'color' => '#BDC3C7'
	),
	array(
		'name' => _('Holiday Cards'),
		'color' => '#BDC3C7'
	),
	array(
		'name' => _('Hot Contacts'),
		'color' => '#BDC3C7'
	),
	array(
		'name' => _('Ideas'),
		'color' => '#BDC3C7'
	),
	array(
		'name' => _('International'),
		'color' => '#BDC3C7'
	),
	array(
		'name' => _('Key Customer'),
		'color' => '#BDC3C7'
	),
	array(
		'name' => _('Miscellaneous'),
		'color' => '#BDC3C7'
	),
	array(
		'name' => _('Phone Calls'),
		'color' => '#BDC3C7'
	),
	array(
		'name' => _('Status'),
		'color' => '#BDC3C7'
	),
	array(
		'name' => _('Strategies'),
		'color' => '#BDC3C7'
	),
	array(
		'name' => _('Suppliers'),
		'color' => '#BDC3C7'
	),
	array(
		'name' => _('Time & Expenses'),
		'color' => '#BDC3C7'
	),
	array(
		'name' => _('VIP'),
		'color' => '#BDC3C7'
	),
	array(
		'name' => _('Waiting'),
		'color' => '#BDC3C7'
	)
)));

// Maximum reminder items we can show on client side.
if(!defined('MAX_NUM_REMINDERS')) define('MAX_NUM_REMINDERS', 99);

// Shared store polling timer in minutes
if(!defined('SHARED_STORE_POLLING_INTERVAL')) define('SHARED_STORE_POLLING_INTERVAL', 15);

// Defaults for powerpaste
if(!defined('POWERPASTE_WORD_IMPORT')) define('POWERPASTE_WORD_IMPORT', 'merge');
if(!defined('POWERPASTE_HTML_IMPORT')) define('POWERPASTE_HTML_IMPORT', 'merge');
if(!defined('POWERPASTE_ALLOW_LOCAL_IMAGES')) define('POWERPASTE_ALLOW_LOCAL_IMAGES', true);

/*
 * The following options are taken from the debug.php
 */
if(!defined('DEBUG_LOADER')) define('DEBUG_LOADER', LOAD_RELEASE);
if(!defined('DEBUG_JSONOUT')) define('DEBUG_JSONOUT', false);
if(!defined('DEBUG_JSONOUT_DIR')) define('DEBUG_JSONOUT_DIR', 'debug_json/');
if(!defined('DEBUG_JSONOUT_GZIP')) define('DEBUG_JSONOUT_GZIP', false);
if(!defined('DEBUG_PLUGINS')) define('DEBUG_PLUGINS', false);
if(!defined('DEBUG_PLUGINS_DISABLE_CACHE')) define('DEBUG_PLUGINS_DISABLE_CACHE', false);
if(!defined('DEBUG_DUMP_FILE')) define('DEBUG_DUMP_FILE', 'debug.txt');

// Defaults for Logger
if(!defined('LOG_USER_LEVEL')) define('LOG_USER_LEVEL', LOGLEVEL_OFF);
if(!defined('LOG_USERS')) define('LOG_USERS', '');
if(!defined('LOG_FILE_DIR')) define('LOG_FILE_DIR', '');
?>
