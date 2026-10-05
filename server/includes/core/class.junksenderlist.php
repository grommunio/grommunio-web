<?php

/*
 * SPDX-FileCopyrightText: Copyright 2020 - 2026 grommunio GmbH
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

/**
 * Entry rules of the junk sender lists and the merge of the old webapp
 * safe_senders_list setting into them.
 */
class JunkSenderList {
	public const MAX_ENTRY_LENGTH = 256;

	/**
	 * @param string $entry
	 *
	 * @return bool True when the entry can live in a sender list
	 */
	public static function isSaneEntry($entry) {
		return strlen($entry) <= self::MAX_ENTRY_LENGTH && !preg_match('/[;,\s\x00-\x1F]/', $entry);
	}

	/**
	 * @param mixed $old value of the old safe_senders_list setting
	 *
	 * @return array usable entries, bare domains prefixed with '@'
	 */
	public static function legacyEntries($old) {
		if (!is_array($old)) {
			return [];
		}
		$out = [];
		foreach ($old as $entry) {
			$entry = trim((string) $entry);
			if ($entry === '' || !self::isSaneEntry($entry)) {
				continue;
			}
			$out[] = str_contains($entry, '@') ? $entry : '@' . $entry;
		}

		return $out;
	}

	/**
	 * Appends the legacy entries missing from $lists['safe_senders'] and sets
	 * $lists['migrated_pending'] when there were any.
	 *
	 * @param mixed $old   value of the old safe_senders_list setting
	 * @param array $lists sender lists as returned by JunkMailModule::getSenderLists
	 */
	public static function mergeLegacy($old, array &$lists) {
		$known = array_map('strtolower', $lists['safe_senders']);
		foreach (self::legacyEntries($old) as $entry) {
			if (!in_array(strtolower($entry), $known, true)) {
				$lists['safe_senders'][] = $entry;
				$known[] = strtolower($entry);
				$lists['migrated_pending'] = true;
			}
		}
	}

	/**
	 * @param mixed $old         value of the old safe_senders_list setting
	 * @param array $safeSenders safe senders list
	 *
	 * @return bool True when every legacy entry is in $safeSenders
	 */
	public static function legacyCoveredBy($old, array $safeSenders) {
		$known = array_map('strtolower', $safeSenders);
		$legacy = array_map('strtolower', self::legacyEntries($old));

		return !array_diff($legacy, $known);
	}
}
