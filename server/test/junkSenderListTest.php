<?php

/*
 * SPDX-FileCopyrightText: Copyright 2020 - 2026 grommunio GmbH
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

require_once dirname(__DIR__) . '/includes/core/class.junksenderlist.php';

function assertSame($expected, $actual, $label) {
	if ($expected !== $actual) {
		throw new RuntimeException($label . ': expected ' . var_export($expected, true) . ', got ' . var_export($actual, true));
	}
}

assertSame(true, JunkSenderList::isSaneEntry('a@example.com'), 'plain address');
assertSame(false, JunkSenderList::isSaneEntry('a@example.com;b@example.com'), 'separator');
assertSame(false, JunkSenderList::isSaneEntry('a b'), 'whitespace');
assertSame(false, JunkSenderList::isSaneEntry(str_repeat('a', 257)), 'too long');
assertSame(true, JunkSenderList::isSaneEntry(str_repeat('a', 256)), 'max length');

assertSame([], JunkSenderList::legacyEntries(null), 'unset setting');
assertSame([], JunkSenderList::legacyEntries('example.com'), 'scalar setting');
assertSame(
	['@example.com', 'Bob@Example.org'],
	JunkSenderList::legacyEntries([' example.com ', '', 'bad entry', 'Bob@Example.org']),
	'normalised entries'
);

$lists = ['safe_senders' => ['bob@example.org'], 'migrated_pending' => false];
JunkSenderList::mergeLegacy(['Bob@Example.org'], $lists);
assertSame(['bob@example.org'], $lists['safe_senders'], 'known entry not merged');
assertSame(false, $lists['migrated_pending'], 'nothing pending');

JunkSenderList::mergeLegacy(['example.com', 'EXAMPLE.com', 'Bob@Example.org'], $lists);
assertSame(['bob@example.org', '@example.com'], $lists['safe_senders'], 'new entry merged once');
assertSame(true, $lists['migrated_pending'], 'migration pending');

assertSame(true, JunkSenderList::legacyCoveredBy(['example.com', 'x y'], ['@EXAMPLE.COM']), 'covered');
assertSame(false, JunkSenderList::legacyCoveredBy(['example.com', 'b@c.d'], ['@example.com']), 'not covered');
assertSame(true, JunkSenderList::legacyCoveredBy([], []), 'empty setting');

echo "Junk sender list checks passed\n";
