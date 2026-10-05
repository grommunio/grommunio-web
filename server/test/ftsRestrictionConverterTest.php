<?php

/*
 * SPDX-FileCopyrightText: Copyright 2020 - 2026 grommunio GmbH
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

foreach ([
	'RES_AND' => 0, 'RES_OR' => 1, 'RES_NOT' => 2, 'RES_CONTENT' => 3, 'RES_PROPERTY' => 4,
	'RES_BITMASK' => 6, 'RES_SUBRESTRICTION' => 9, 'RES_COMMENT' => 10,
	'ULPROPTAG' => 'ulPropTag', 'VALUE' => 'value', 'RELOP' => 'relop', 'ULTYPE' => 'ulType', 'RESTRICTION' => 'restriction',
	'RELOP_LT' => 0, 'RELOP_LE' => 1, 'RELOP_GT' => 2, 'RELOP_GE' => 3, 'BMR_EQZ' => 0,
	'PR_MESSAGE_CLASS' => 0x001A001F, 'PR_MESSAGE_DELIVERY_TIME' => 0x0E060040, 'PR_LAST_MODIFICATION_TIME' => 0x30080040,
	'PR_MESSAGE_FLAGS' => 0x0E070003, 'PR_MESSAGE_ATTACHMENTS' => 0x0E13000D, 'PR_MESSAGE_RECIPIENTS' => 0x0E12000D,
	'PR_SUBJECT' => 0x0037001F, 'PR_BODY' => 0x1000001F, 'PR_SENDER_NAME' => 0x0C1A001F, 'PR_SENDER_EMAIL_ADDRESS' => 0x0C1F001F,
	'PR_SENT_REPRESENTING_NAME' => 0x0042001F, 'PR_SENT_REPRESENTING_EMAIL_ADDRESS' => 0x0065001F,
	'PR_DISPLAY_TO' => 0x0E04001F, 'PR_DISPLAY_CC' => 0x0E03001F, 'PR_DISPLAY_BCC' => 0x0E02001F,
	'PR_EMAIL_ADDRESS' => 0x3003001F, 'PR_SMTP_ADDRESS' => 0x39FE001F, 'PR_DISPLAY_NAME' => 0x3001001F,
	'PR_ATTACH_LONG_FILENAME' => 0x3707001F,
] as $name => $value) {
	defined($name) || define($name, $value);
}

require_once dirname(__DIR__) . '/includes/core/class.ftsrestrictionconverter.php';

function ftsExpect($actual, $expected, $message) {
	if ($actual !== $expected) {
		throw new RuntimeException($message . ': ' . var_export($actual, true));
	}
}

function ftsContent($propTag, $value) {
	return [RES_CONTENT, [ULPROPTAG => $propTag, VALUE => [$propTag => $value]]];
}

function ftsTerm(array $fields, $value) {
	return ['type' => 'term', 'fields' => $fields, 'value' => $value];
}

$converter = new FtsRestrictionConverter(['categories' => 0x8001101F, 'hide_attachments' => 0x8002000B]);

$empty = $converter->buildDescriptor(null);
ftsExpect($empty, [
	'ast' => null,
	'message_classes' => [],
	'date_start' => null,
	'date_end' => null,
	'unread' => false,
	'has_attachments' => false,
], 'An empty restriction produced a query');

ftsExpect($converter->buildDescriptor(ftsContent(PR_SUBJECT, ''))['ast'], ftsTerm(['subject'], ''), 'A scalar empty value lost its term');
ftsExpect($converter->buildDescriptor(ftsContent(PR_SUBJECT, ['', null]))['ast'], null, 'Empty array entries produced terms');
ftsExpect($converter->buildDescriptor(ftsContent(PR_SUBJECT, ['a', '', 'b']))['ast'], [
	'op' => 'OR',
	'children' => [ftsTerm(['subject'], 'a'), ftsTerm(['subject'], 'b')],
], 'Multiple values were not joined with OR');
ftsExpect($converter->buildDescriptor(ftsContent(0x8001101F, 'red'))['ast'], ftsTerm(['others'], 'red'), 'Categories were not mapped');
ftsExpect($converter->buildDescriptor(ftsContent(0x12340003, 'x'))['ast'], null, 'An unmapped property produced a term');

$descriptor = $converter->buildDescriptor([RES_AND, [
	ftsContent(PR_MESSAGE_CLASS, 'IPM.Note'),
	ftsContent(PR_MESSAGE_CLASS, 'IPM.Note'),
	[RES_PROPERTY, [RELOP => RELOP_GE, ULPROPTAG => PR_MESSAGE_DELIVERY_TIME, VALUE => [PR_MESSAGE_DELIVERY_TIME => 100]]],
	[RES_PROPERTY, [RELOP => RELOP_GT, ULPROPTAG => PR_MESSAGE_DELIVERY_TIME, VALUE => [PR_MESSAGE_DELIVERY_TIME => 200]]],
	[RES_PROPERTY, [RELOP => RELOP_LT, ULPROPTAG => PR_LAST_MODIFICATION_TIME, VALUE => [PR_LAST_MODIFICATION_TIME => 900]]],
	[RES_PROPERTY, [RELOP => RELOP_LE, ULPROPTAG => PR_LAST_MODIFICATION_TIME, VALUE => [PR_LAST_MODIFICATION_TIME => 800]]],
	[RES_BITMASK, [ULTYPE => BMR_EQZ, ULPROPTAG => PR_MESSAGE_FLAGS]],
	[RES_NOT, [ftsContent(PR_BODY, 'spam')]],
	[RES_OR, [
		ftsContent(PR_SENDER_NAME, 'alice'),
		[RES_SUBRESTRICTION, [ULPROPTAG => PR_MESSAGE_RECIPIENTS, RESTRICTION => ftsContent(PR_DISPLAY_NAME, 'bob')]],
	]],
	[RES_COMMENT, [RESTRICTION => [RES_SUBRESTRICTION, [
		ULPROPTAG => PR_MESSAGE_ATTACHMENTS,
		RESTRICTION => ftsContent(PR_ATTACH_LONG_FILENAME, 'report'),
	]]]],
]]);
ftsExpect($descriptor, [
	'ast' => [
		'op' => 'AND',
		'children' => [
			['op' => 'NOT', 'children' => [ftsTerm(['content', 'attachments'], 'spam')]],
			['op' => 'OR', 'children' => [ftsTerm(['sender'], 'alice'), ftsTerm(['recipients'], 'bob')]],
			ftsTerm(['attachments'], 'report'),
		],
	],
	'message_classes' => ['IPM.Note'],
	'date_start' => 200,
	'date_end' => 800,
	'unread' => true,
	'has_attachments' => true,
], 'A combined restriction was converted incorrectly');

$hidden = $converter->buildDescriptor([RES_PROPERTY, [RELOP => RELOP_GE, ULPROPTAG => 0x8002000B, VALUE => [0x8002000B => false]]]);
ftsExpect($hidden['has_attachments'], true, 'The attachment filter property was ignored');

echo "FTS restriction converter checks passed\n";
