<?php

/*
 * SPDX-FileCopyrightText: Copyright 2020 - 2026 grommunio GmbH
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

require_once dirname(__DIR__) . '/includes/core/class.newmailfolderquery.php';

$GLOBALS['entryid'] = new class {
	public function compareEntryIds($a, $b) {
		return strcasecmp($a, $b) === 0;
	}
};

$excluded = ['00aa', '00bb'];
if (!NewMailFolderQuery::containsEntryid($excluded, '00BB')) {
	throw new RuntimeException('Excluded entryid was not found.');
}
if (NewMailFolderQuery::containsEntryid($excluded, '00cc')) {
	throw new RuntimeException('Unrelated entryid was reported as excluded.');
}
if (NewMailFolderQuery::containsEntryid([], '00aa')) {
	throw new RuntimeException('Empty exclusion list matched.');
}

echo "New mail folder query checks passed\n";
