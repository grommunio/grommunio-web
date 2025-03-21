<?php
/**
 * Created by PhpStorm.
 * User: zdev
 * Date: 10.01.15
 * Time: 11:54.
 */

namespace Files\Core\Util;

class StringUtil {
	/**
	 * Return size to human readable filesize.
	 *
	 * @static
	 *
	 * @param int   $filesize in bytes
	 * @param int   $decimals digits
	 * @param mixed $bytes
	 *
	 * @return string human readable filesize
	 */
	public static function human_filesize($bytes, $decimals = 2) {
		$sz = ' KMGTP';
		$factor = (int) floor((strlen((string) $bytes) - 1) / 3);

		return sprintf("%.{$decimals}f", $bytes / 1024 ** $factor) . " " . @$sz[$factor] . "B";
	}

	/**
	 * check if a string starts with a specific char.
	 *
	 * @static
	 *
	 * @param string $haystack
	 * @param string $needle
	 *
	 * @return bool true if $needle is found in $haystack
	 */
	public static function startsWith($haystack, $needle) {
		return !strncmp($haystack, $needle, strlen($needle));
	}

	/**
	 * Creates a random string.
	 *
	 * @static
	 *
	 * @param int length The length of the random string
	 * @param mixed $length
	 *
	 * @return string a random string
	 */
	public static function randomstring($length = 6) {
		// $chars - all allowed characters
		$chars = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ1234567890";

		mt_srand((float) microtime() * 1000000);
		$i = 0;
		$pass = "";
		while ($i < $length) {
			$num = random_int(0, mt_getrandmax()) % strlen($chars);
			$tmp = substr($chars, $num, 1);
			$pass = $pass . $tmp;
			++$i;
		}

		return $pass;
	}

	/**
	 * check if a string ends with a specific char.
	 *
	 * @static
	 *
	 * @param string $haystack
	 * @param string $needle
	 *
	 * @return bool true if $haystack ends with $needle
	 */
	public static function endsWith($haystack, $needle) {
		$length = strlen($needle);
		if ($length == 0) {
			return true;
		}

		return substr($haystack, -$length) === $needle;
	}
}
