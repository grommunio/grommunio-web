<?php

/*
 * SPDX-FileCopyrightText: Copyright 2020 - 2026 grommunio GmbH
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

if (extension_loaded('mapi')) {
	echo "Special folder checks skipped with php-mapi loaded\n";

	return;
}

$constants = ['PR_MDB_PROVIDER', 'PR_IPM_SUBTREE_ENTRYID', 'PR_IPM_OUTBOX_ENTRYID', 'PR_IPM_SENTMAIL_ENTRYID',
	'PR_IPM_WASTEBASKET_ENTRYID', 'PR_IPM_PUBLIC_FOLDERS_ENTRYID', 'PR_IPM_FAVORITES_ENTRYID',
	'PR_IPM_APPOINTMENT_ENTRYID', 'PR_IPM_CONTACT_ENTRYID', 'PR_IPM_DRAFTS_ENTRYID', 'PR_IPM_JOURNAL_ENTRYID',
	'PR_IPM_NOTE_ENTRYID', 'PR_IPM_TASK_ENTRYID', 'PR_ADDITIONAL_REN_ENTRYIDS', 'PR_ENTRYID'];
foreach ($constants as $index => $constant) {
	define($constant, 4000 + $index);
}
define('ZARAFA_STORE_PUBLIC_GUID', 'public-provider');

class MAPIException extends Exception {
	public function setHandled() {}
}

if (!function_exists('mapi_getprops')) {
	function mapi_getprops($object, $tags) {
		if ($tags === [PR_MDB_PROVIDER]) {
			return [PR_MDB_PROVIDER => 'private-provider'];
		}
		if (in_array(PR_ADDITIONAL_REN_ENTRYIDS, $tags, true)) {
			return [PR_ADDITIONAL_REN_ENTRYIDS => ['conflicts', 'sync-issues', 'local-failures']];
		}
		if ($tags === [PR_ENTRYID]) {
			return [PR_ENTRYID => 'inbox'];
		}

		return [];
	}

	function mapi_msgstore_openentry($store, $entryid = null) {
		return 'root';
	}

	function mapi_msgstore_getreceivefolder($store) {
		return 'inbox-folder';
	}
}

require_once dirname(__DIR__) . '/includes/core/class.operations.php';

$operations = new Operations();
foreach (['conflicts', 'sync-issues', 'inbox'] as $entryid) {
	if (!$operations->isSpecialFolder('store', $entryid)) {
		throw new RuntimeException("Folder {$entryid} was not treated as special");
	}
}
if ($operations->isSpecialFolder('store', 'plain')) {
	throw new RuntimeException('An ordinary folder was treated as special');
}

echo "Special folder checks passed\n";
