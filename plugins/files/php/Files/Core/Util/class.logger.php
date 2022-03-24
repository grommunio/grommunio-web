<?php
namespace Files\Core\Util;

// TODO: implement logging levels
class Logger
{
	public static function log($context, $msg)
	{
		if (PLUGIN_FILESBROWSER_LOGLEVEL === "DEBUG" || PLUGIN_FILESBROWSER_LOGLEVEL === "NORMAL") {
			error_log("[INFO][$context] " . print_r($msg, true));
		}
	}

	public static function error($context, $msg)
	{
		if (PLUGIN_FILESBROWSER_LOGLEVEL === "ERROR" || PLUGIN_FILESBROWSER_LOGLEVEL === "DEBUG" || PLUGIN_FILESBROWSER_LOGLEVEL === "NORMAL") {
			error_log("[ERROR][$context] " . print_r($msg, true));
		}
	}

	public static function debug($context, $msg)
	{
		if (PLUGIN_FILESBROWSER_LOGLEVEL === "DEBUG") {
			error_log("[DBG][$context] " . print_r($msg, true));
		}
	}
}