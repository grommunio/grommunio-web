<?php

/*
 * SPDX-FileCopyrightText: Copyright 2020 - 2026 grommunio GmbH
 * SPDX-FileCopyrightText: Copyright 2016 Kopano and its licensors
 * SPDX-FileCopyrightText: Copyright 2005 - 2016 Zarafa B.V. and its licensors
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

// Whether to use AAPI or ZCORE for setpasswd functionality
define("PLUGIN_PASSWD_USE_ZCORE", false);

// Enable the passwd plugin for all clients
define('PLUGIN_PASSWD_USER_DEFAULT_ENABLE', false);

// Enable the passwd plugin for all clients
define('PLUGIN_PASSWD_STRICT_CHECK_ENABLE', true);

// The grommunio admin API passwd endpoint
define('PLUGIN_PASSWD_ADMIN_API_ENDPOINT', 'http://[::1]:8080/api/v1/passwd');
