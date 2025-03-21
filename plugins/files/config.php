<?php

/**
 * This enables/disables the WHOLE plugin.
 */
define('PLUGIN_FILES_USER_DEFAULT_ENABLE', false);

/*
 * This enables/disables the Onlyoffice Tab(s) when doubleclicking office-type files.
 * Default: false
 */
define('PLUGIN_FILES_ONLYOFFICE_ENABLE', false);

/*
 * This defined the filetypes which will be opened inside an onlyoffice tab.
 * If a filetype isn't set here, those files will just be downloaded
 * Available filetypes:
 * .csv,.doc,.docm,.docxf,.oform,.dotx,.epub,.html,.odp,.ods,.odt,.otp,.ots,.ott,.pdf,.potm,
 * .potx,.ppsm,.ppsx,.ppt,.pptm,.pptx,.rtf,.txt,.xls,.xlsm,.xlsx,.xltm,.xltx
 */
define('PLUGIN_FILES_ONLYOFFICE_FILETYPES', ".doc,.docx,.docxf,.oform,.odp,.ods,.odt,.ppt,.pptx,.xls,.xlsx");

/*
 * Display a confirmation popup to the user before a file gets deleted.
 */
define('PLUGIN_FILES_ASK_BEFORE_DELETE', true);

/*
 * The directory where to save cache files for phpfastcache.
 * This is a fallback setting, redis should be always available.
 */
define('PLUGIN_FILES_CACHE_DIR', "/var/lib/grommunio-web/plugin_files");

/*
 * Set the verbosity of the plugin.
 *
 * Possible values: DEBUG, NORMAL, ERROR, NONE
 *
 * This setting is not editable within grommunio Web
 */
define('PLUGIN_FILESBROWSER_LOGLEVEL', "ERROR");

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
