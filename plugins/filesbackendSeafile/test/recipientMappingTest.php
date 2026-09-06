<?php

require_once dirname(__DIR__) . '/php/class.backend.php';

use Files\Backend\Seafile\Backend;

$formatRecipients = new ReflectionMethod(Backend::class, 'formatRecipients');

$users = (object) [
	'users' => [
		(object) ['email' => 'ada@example.test', 'name' => 'Ada Lovelace'],
		(object) ['email' => 'grace@example.test', 'contact_email' => 'Grace Hopper'],
		(object) ['name' => 'Missing address'],
	],
];
$groups = [
	(object) [
		'id' => 17,
		'name' => 'Current API group',
		'group_id' => 99,
		'group_name' => 'Legacy fields must not win',
	],
	(object) ['group_id' => '23', 'group_name' => 'Legacy API group'],
];

$recipients = $formatRecipients->invoke(null, $users, $groups, '');
$expected = [
	['Ada Lovelace', 'ada@example.test', 0],
	['Grace Hopper', 'grace@example.test', 0],
	['Current API group', 17, 1],
	['Legacy API group', '23', 1],
];

if ($recipients !== $expected) {
	throw new RuntimeException('Seafile recipients were not mapped to positional ArrayStore rows.');
}

$filtered = $formatRecipients->invoke(null, (object) ['users' => []], $groups, 'legacy');
if ($filtered !== [['Legacy API group', '23', 1]]) {
	throw new RuntimeException('Seafile group filtering did not support legacy group fields.');
}

echo "Seafile recipient mapping checks passed\n";
