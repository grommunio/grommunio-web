<?php

/*
 * SPDX-FileCopyrightText: Copyright 2020 - 2026 grommunio GmbH
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

require_once dirname(__DIR__) . '/includes/hexutil.php';

$cases = [
	['00ff', true, true],
	['ABCDEF0123', true, true],
	['abc', true, false],
	['', false, false],
	['zz', false, false],
	['0x00', false, false],
	[null, false, false],
	[12, false, false],
	[['00'], false, false],
];
foreach ($cases as [$value, $isString, $isEntryid]) {
	if (is_hex_string($value) !== $isString || is_hex_entryid($value) !== $isEntryid) {
		throw new RuntimeException('Hex check failed for ' . var_export($value, true));
	}
}

echo "Hex util checks passed\n";
