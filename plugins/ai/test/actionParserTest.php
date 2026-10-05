<?php

/*
 * SPDX-FileCopyrightText: Copyright 2020 - 2026 grommunio GmbH
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

require_once dirname(__DIR__) . '/php/lib/class.aiactionparser.php';

function check(bool $ok, string $what): void {
	if (!$ok) {
		throw new RuntimeException("AI action parser: {$what}");
	}
}

$all = ['meeting', 'task', 'contact', 'reply'];
$parse = static fn (array $actions, array $allowed = ['meeting', 'task', 'contact', 'reply']) => AIActionParser::parse(json_encode(['actions' => $actions]), $allowed);

$meeting = $parse([[
	'type' => 'meeting', 'title' => ' Review ', 'attendees' => array_merge(['', 'Ann'], array_fill(0, 30, 'Bob')),
	'date' => '2026-02-30', 'time' => '9:05', 'duration_minutes' => 5000, 'location' => 'Room', 'notes' => 'n',
]]);
check(count($meeting) === 1 && $meeting[0]['title'] === 'Review', 'meeting title');
check(count($meeting[0]['attendees']) === 25 && $meeting[0]['attendees'][0] === 'Ann', 'attendee cap');
check($meeting[0]['date'] === '' && $meeting[0]['time'] === '09:05', 'meeting date/time');
check($meeting[0]['duration_minutes'] === 1440, 'duration cap');
check($parse([['type' => 'meeting', 'title' => 'x']])[0]['duration_minutes'] === 30, 'default duration');
check($parse([['type' => 'meeting', 'title' => 'x', 'time' => '24:00', 'date' => '2026-03-01']])[0]['time'] === '', 'invalid time');
check($parse([['type' => 'meeting', 'title' => 'x', 'date' => '2026-03-01']])[0]['date'] === '2026-03-01', 'valid date');
check($parse([['type' => 'meeting', 'title' => '  ']]) === [], 'empty meeting title');

check($parse([['type' => 'task', 'title' => 'Do', 'due' => '2026-13-01']]) === [['type' => 'task', 'title' => 'Do', 'due' => '', 'notes' => '']], 'task');
check($parse([['type' => 'contact', 'email' => 'a@b.c']]) === [['type' => 'contact', 'name' => '', 'email' => 'a@b.c']], 'contact');
check($parse([['type' => 'contact']]) === [], 'empty contact');
check($parse([['type' => 'reply']]) === [['type' => 'reply', 'intent' => '']], 'reply');
check($parse([['type' => 'reply', 'intent' => 'x']], ['task']) === [], 'disallowed type');
check($parse([['type' => 'unknown'], 'junk']) === [], 'unknown type');
check(count($parse(array_fill(0, 10, ['type' => 'reply', 'intent' => 'x']))) === 6, 'six-action cap');
check(count(AIActionParser::parse("Sure:\n{\"actions\":[{\"type\":\"reply\"}]}\nDone", $all)) === 1, 'embedded JSON');
check(AIActionParser::parse('no json', $all) === [], 'no JSON');

echo "AI action parser checks passed\n";
