<?php

/*
 * SPDX-FileCopyrightText: Copyright 2020 - 2026 grommunio GmbH
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

define('PLUGIN_MDM_USER_DEFAULT_ENABLE_MDM', true);

define('PLUGIN_MDM_STORE_STATE_FOLDER', 'GS-SyncState');

// Retrieve and update remote wipe status for a user and device from admin API using the following endpoint
define('PLUGIN_MDM_ADMIN_API_WIPE_ENDPOINT', 'http://[::1]:8080/api/v1/service/wipe/');

// Retrieve the last connection time of a mobile device from admin API using the following endpoint
define('PLUGIN_MDM_ADMIN_API_LASTCONNECT_ENDPOINT', 'http://[::1]:8080/api/v1/service/lastconnect/');
