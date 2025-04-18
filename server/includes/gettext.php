<?php

/*
 * Implementation of the missing (context) gettext functionalities in PHP. The
 * character \004 is used as glue to be able to use contexts in our translations.
 */
if (!function_exists('pgettext')) {
	/**
	 * Gettext function.
	 *
	 * @param string $msgctxt The Context
	 * @param string $msgid   The message
	 *
	 * @return string The translation
	 */
	function pgettext($msgctxt, $msgid) {
		$contextString = "{$msgctxt}\004{$msgid}";
		$translation = _($contextString);
		if ($translation == $contextString) {
			return $msgid;
		}

		return $translation;
	}

	/**
	 * Gettext function.
	 *
	 * @param string $msgctxt      The Context
	 * @param string $msgid        The message
	 * @param string $msgid_plural The plural text
	 * @param int    $num          The count
	 *
	 * @return string The translation
	 */
	function npgettext($msgctxt, $msgid, $msgid_plural, $num) {
		$contextString = "{$msgctxt}\004{$msgid}";
		$contextStringPlural = "{$msgctxt}\004{$msgid_plural}";
		$translation = ngettext($contextString, $contextStringPlural, $num);
		if ($translation == $contextString || $translation == $contextStringPlural) {
			return $msgid;
		}

		return $translation;
	}

	/**
	 * Gettext function.
	 *
	 * @param string $domain  The Domain
	 * @param string $msgctxt The Context
	 * @param string $msgid   The message
	 *
	 * @return string The translation
	 */
	function dpgettext($domain, $msgctxt, $msgid) {
		$contextString = "{$msgctxt}\004{$msgid}";
		$translation = dcgettext($domain, $contextString, LC_MESSAGES);
		if ($translation == $contextString) {
			return $msgid;
		}

		return $translation;
	}

	/**
	 * Gettext function.
	 *
	 * @param string $domain   The Domain
	 * @param string $msgctxt  The Context
	 * @param string $msgid    The message
	 * @param int    $category The category
	 *
	 * @return string The translation
	 */
	function dcpgettext($domain, $msgctxt, $msgid, $category) {
		$contextString = "{$msgctxt}\004{$msgid}";
		$translation = dcgettext($domain, $contextString, $category);
		if ($translation == $contextString) {
			return $msgid;
		}

		return $translation;
	}
}
