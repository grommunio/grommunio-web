<?php

/*
 * SPDX-FileCopyrightText: Copyright 2020 - 2026 grommunio GmbH
 * SPDX-FileCopyrightText: Copyright 2016 Kopano and its licensors
 * SPDX-FileCopyrightText: Copyright 2005 - 2016 Zarafa B.V. and its licensors
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

// Load the release files (concatenated, compressed)
define("LOAD_RELEASE", 1);
// Load the debug files (concatenated, not compressed)
define("LOAD_DEBUG", 2);
// Load the original source files (for developers)
define("LOAD_SOURCE", 3);
// Defines the base path on the server, terminated by a slash
define('BASE_PATH', realpath(__DIR__) . '/');
define('UMAPI_PATH', '/usr/share/php-mapi');
define('GROMOX_CONFIG_PATH', '/etc/gromox/');
