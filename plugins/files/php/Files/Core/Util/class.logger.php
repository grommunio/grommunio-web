<?php

/*
 * SPDX-FileCopyrightText: Copyright 2020 - 2026 grommunio GmbH
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

namespace Files\Core\Util;

// TODO: implement logging levels
class Logger {
	public static function log($context, $msg) {
		if (PLUGIN_FILESBROWSER_LOGLEVEL === "DEBUG" || PLUGIN_FILESBROWSER_LOGLEVEL === "NORMAL") {
			error_log("[INFO][{$context}] " . (string) print_r($msg, true));
		}
	}

	public static function error($context, $msg) {
		if (PLUGIN_FILESBROWSER_LOGLEVEL === "ERROR" || PLUGIN_FILESBROWSER_LOGLEVEL === "DEBUG" || PLUGIN_FILESBROWSER_LOGLEVEL === "NORMAL") {
			error_log("[ERROR][{$context}] " . (string) print_r($msg, true));
		}
	}

	public static function debug($context, $msg) {
		if (PLUGIN_FILESBROWSER_LOGLEVEL === "DEBUG") {
			error_log("[DBG][{$context}] " . (string) print_r($msg, true));
		}
	}
}
