<?php

/*
 * SPDX-FileCopyrightText: Copyright 2020 - 2026 grommunio GmbH
 * SPDX-FileCopyrightText: Copyright 2016 Kopano and its licensors
 * SPDX-FileCopyrightText: Copyright 2005 - 2016 Zarafa B.V. and its licensors
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

$serverVersion = $GLOBALS['mapisession']->getServerVersion();
if (empty($serverVersion)) {
	$serverVersion = phpversion('mapi');
}

$versionInfo = [
	'zcp' => $serverVersion,
];

$serverConfig = [
	'enable_plugins' => ENABLE_PLUGINS ? true : false,
	'max_attachment_size' => getMaxUploadSize(),
	'freebusy_load_start_offset' => FREEBUSY_LOAD_START_OFFSET,
	'freebusy_load_end_offset' => FREEBUSY_LOAD_END_OFFSET,
	'json_themes' => Theming::getJsonThemes(),
	'active_theme' => Theming::getActiveTheme(),
];
