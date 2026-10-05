<?php

/*
 * SPDX-FileCopyrightText: Copyright 2020 - 2026 grommunio GmbH
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

/**
 * Store and folder lookups behind the new mail notification.
 */
class NewMailFolderQuery {
	/**
	 * Collect the default folders for which the client never shows a new mail
	 * notification.
	 *
	 * @param mixed $store the store to inspect
	 *
	 * @return array hex entryids of the excluded folders
	 */
	public static function excludedFolders($store) {
		$excluded = [];

		try {
			$storeProps = mapi_getprops($store, [PR_IPM_WASTEBASKET_ENTRYID, PR_IPM_OUTBOX_ENTRYID, PR_IPM_SENTMAIL_ENTRYID]);
			$root = mapi_msgstore_openentry($store);
			$rootProps = $root ? mapi_getprops($root, [PR_IPM_DRAFTS_ENTRYID, PR_IPM_JOURNAL_ENTRYID, PR_ADDITIONAL_REN_ENTRYIDS]) : [];

			$entryids = [
				$storeProps[PR_IPM_WASTEBASKET_ENTRYID] ?? null,
				$storeProps[PR_IPM_OUTBOX_ENTRYID] ?? null,
				$storeProps[PR_IPM_SENTMAIL_ENTRYID] ?? null,
				$rootProps[PR_IPM_DRAFTS_ENTRYID] ?? null,
				$rootProps[PR_IPM_JOURNAL_ENTRYID] ?? null,
				// Junk mail, see MS-OXOSFLD.
				$rootProps[PR_ADDITIONAL_REN_ENTRYIDS][4] ?? null,
			];

			foreach ($entryids as $folderEntryid) {
				if (!empty($folderEntryid)) {
					$excluded[] = bin2hex((string) $folderEntryid);
				}
			}
		}
		catch (MAPIException $e) {
			$e->setHandled();
		}

		return $excluded;
	}

	/**
	 * @param array  $entryids hex entryids
	 * @param string $entryid  hex entryid to look for
	 *
	 * @return bool true when $entryid is one of $entryids
	 */
	public static function containsEntryid($entryids, $entryid) {
		foreach ($entryids as $candidate) {
			if ($GLOBALS["entryid"]->compareEntryIds($candidate, $entryid)) {
				return true;
			}
		}

		return false;
	}

	/**
	 * Fetch sender and subject of the newest unread message in a folder, used
	 * to enrich the notification when exactly one new message arrived.
	 *
	 * @param mixed  $store   store containing the folder
	 * @param string $entryid hex folder entryid
	 *
	 * @return null|array sender_name and subject, or null when unavailable
	 */
	public static function newestUnreadMessage($store, $entryid) {
		try {
			$folder = mapi_msgstore_openentry($store, hex2bin($entryid));
			$table = mapi_folder_getcontentstable($folder, MAPI_DEFERRED_ERRORS);
			mapi_table_restrict($table, [RES_BITMASK,
				[
					ULTYPE => BMR_EQZ,
					ULPROPTAG => PR_MESSAGE_FLAGS,
					ULMASK => MSGFLAG_READ,
				],
			], TBL_BATCH);
			mapi_table_sort($table, [PR_MESSAGE_DELIVERY_TIME => TABLE_SORT_DESCEND], TBL_BATCH);
			$rows = mapi_table_queryrows($table, [PR_SENT_REPRESENTING_NAME, PR_SENDER_NAME, PR_SENT_REPRESENTING_SMTP_ADDRESS, PR_SUBJECT], 0, 1);
			if (empty($rows)) {
				return null;
			}

			$row = $rows[0];
			$sender = $row[PR_SENT_REPRESENTING_NAME] ?? $row[PR_SENDER_NAME] ?? $row[PR_SENT_REPRESENTING_SMTP_ADDRESS] ?? '';
			$subject = $row[PR_SUBJECT] ?? '';
			if ($sender === '' && $subject === '') {
				return null;
			}

			return [
				'sender_name' => $sender,
				'subject' => $subject,
			];
		}
		catch (MAPIException $e) {
			$e->setHandled();

			return null;
		}
	}
}
