<?php

/*
 * SPDX-FileCopyrightText: Copyright 2020 - 2026 grommunio GmbH
 * SPDX-FileCopyrightText: Copyright 2016 Kopano and its licensors
 * SPDX-FileCopyrightText: Copyright 2005 - 2016 Zarafa B.V. and its licensors
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

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
		if ($translation == $contextString) {
			return $msgid;
		}
		if ($translation == $contextStringPlural) {
			return $msgid_plural;
		}

		return $translation;
	}
}
