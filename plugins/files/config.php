<?php
/**
 * This enables/disables the WHOLE plugin.
 */
define('PLUGIN_FILES_USER_DEFAULT_ENABLE', false);

/**
 * Display a confirmation popup to the user before a file gets deleted.
 */
define('PLUGIN_FILES_ASK_BEFORE_DELETE', true);

/**
 * The directory where to save cache files for phpfastcache.
 * This is a fallback setting, redis should be always available.
 */
define('PLUGIN_FILES_CACHE_DIR', "/var/lib/grommunio-web/plugin_files");

/**
 * Set the verbosity of the plugin.
 *
 * Possible values: DEBUG, NORMAL, ERROR, NONE
 *
 * This setting is not editable within webapp!!
 */
define('PLUGIN_FILESBROWSER_LOGLEVEL', "ERROR");

/**
 * The secret key for the acount data encryption when "Use grommunio Credentials" is not used.
 * A random secret can be generated with: openssl rand -hex 32
 */
define('FILES_ACCOUNTSTORE_V1_SECRET_KEY', "");

/*
 * Redis host for phpFastCache.
 */
define('PLUGIN_FILES_REDIS_HOST', 'localhost');

/*
 * Redis port for phpFastCache.
 */
define('PLUGIN_FILES_REDIS_PORT', '6379');

/*
 * Redis authentication for phpFastCache - leave empty to connect without authentication (default)
 */
define('PLUGIN_FILES_REDIS_AUTH', '');
