<?php

/*
 * SPDX-FileCopyrightText: Copyright 2020 - 2026 grommunio GmbH
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

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

/*
 * Seconds a folder listing stays cached before the backend is asked again, a positive number.
 */
define('PLUGIN_FILES_CACHE_TTL', 900);

/*
 * The server address of a Files account is chosen by the user, so grommunio Web
 * refuses to send requests to link-local (cloud metadata), multicast and reserved
 * addresses, and reaches this server itself only on port 443.
 * Hosts listed here are exempt, as "host" or "host:port" separated by spaces,
 * e.g. "localhost:8080 files.example.lan".
 */
define('PLUGIN_FILES_ALLOWED_HOSTS', '');

/*
 * Also refuse private network addresses (10/8, 172.16/12, 192.168/16, 100.64/10, fc00::/7).
 * Leave this off when file servers live in the local network, or list them above.
 */
define('PLUGIN_FILES_BLOCK_PRIVATE_NETWORKS', false);
