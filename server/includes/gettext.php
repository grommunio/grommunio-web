<?php
/*
 * Implementation of the missing (context) gettext functionalities in PHP. The 
 * character \004 is used as glue to be able to use contexts in our translations. 
 */
if (!function_exists('pgettext')) {
	/**
	 * Gettext function.
	 * @param $msgctxt {string} The Context
	 * @param $msgid {string} The message
	 * @return {string} The translation
	 */
	function pgettext($msgctxt, $msgid) {
		$contextString = "{$msgctxt}\004{$msgid}";
		$translation = _($contextString);
		if($translation == $contextString){
			return $msgid;
		}else{
			return $translation;
		}
	}
	/**
	 * Gettext function.
	 * @param $msgctxt {string} The Context
	 * @param $msgid {string} The message
	 * @param $msgid_plural {string} The plural text
	 * @param $num {Number} The count
	 * @return {string} The translation
	 */
	function npgettext($msgctxt, $msgid, $msgid_plural, $num) {
		$contextString = "{$msgctxt}\004{$msgid}";
		$contextStringPlural = "{$msgctxt}\004{$msgid_plural}";
		$translation = ngettext($contextString, $contextStringPlural, $num);
		if($translation == $contextString || $translation == $contextStringPlural){
			return $msgid;
		}else{
			return $translation;
		}
	}
}
?>
