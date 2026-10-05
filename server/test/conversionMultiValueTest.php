<?php

/*
 * SPDX-FileCopyrightText: Copyright 2020 - 2026 grommunio GmbH
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

if (extension_loaded('mapi')) {
	echo "Conversion multi-value checks skipped with php-mapi loaded\n";

	return;
}

foreach ([
	'PT_LONG' => 0x0003, 'PT_DOUBLE' => 0x0005, 'PT_BINARY' => 0x0102, 'PT_MV_STRING8' => 0x101E,
	'PT_MV_BINARY' => 0x1102, 'PT_SRESTRICTION' => 0x00FD, 'PT_ACTIONS' => 0x00FE,
	'MV_INSTANCE' => 0x2000, 'MVI_FLAG' => 0x3000,
	'RES_AND' => 0, 'RES_OR' => 1, 'RES_NOT' => 2, 'RES_CONTENT' => 3, 'RES_PROPERTY' => 4,
	'RES_COMPAREPROPS' => 5, 'RES_BITMASK' => 6, 'RES_SIZE' => 7, 'RES_EXIST' => 8,
	'RES_SUBRESTRICTION' => 9, 'RES_COMMENT' => 10,
	'VALUE' => 0, 'RELOP' => 1, 'ULPROPTAG' => 6, 'PROPS' => 7, 'RESTRICTION' => 8,
	'PR_HTML' => 0x10130102, 'PR_BODY' => 0x1000001E, 'PR_INTERNET_CPID' => 0x3FDE0003,
] as $name => $value) {
	define($name, $value);
}

if (!function_exists('mapi_prop_type')) {
	function mapi_prop_type($proptag) {
		return $proptag & 0xFFFF;
	}
}

require_once __DIR__ . '/../includes/core/class.conversion.php';

$categories = 0x9000101E;
$mapping = ['categories' => $categories, 'mvi_keywords' => 0x9001101E | MVI_FLAG, 'count' => 0x10000003];
$input = ['categories' => 'one; two;;0; three ;', 'mvi_keywords' => ' x;', 'count' => '7'];
$expected = [$categories => ['one', 'two', 'three '], 0x9001101E | 0x1000 => ['x'], 0x10000003 => 7];
$converted = Conversion::mapXML2MAPI($mapping, $input);
if ($converted !== $expected) {
	throw new RuntimeException('Multi-valued strings were not split as expected');
}

$restriction = Conversion::json2restriction($mapping, [RES_PROPERTY, [
	RELOP => 4,
	ULPROPTAG => 'categories',
	VALUE => ['categories' => ' a;;b', 'count' => 3],
]]);
$expected = [RES_PROPERTY, [RELOP => 4, ULPROPTAG => $categories, VALUE => [$categories => ['a', 'b'], 0x10000003 => 3]]];
if ($restriction !== $expected) {
	throw new RuntimeException('Multi-valued restriction values were not split as expected');
}

if (Conversion::property2json('subject') !== 'subject' || Conversion::property2json(0x0037001E) !== '0x0037001E') {
	throw new RuntimeException('Property names were not converted as expected');
}

echo "Conversion multi-value checks passed\n";
