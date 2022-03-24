<?php

/**
 * Function which is convert the non UTF-8 string to UTF-8 string.
 *
 * @param String $str which may need to encode in UTF-8 string.
 * @return string $str utf8 encoded string.
 */
function stringToUTF8Encode($str)
{
//	if (!mb_detect_encoding($str, "UTF-8", true)) {
//		$str = utf8_encode($str);
//	}
	return $str;
}


