<?php

/*
 * SPDX-FileCopyrightText: Copyright 2020 - 2026 grommunio GmbH
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

if (!extension_loaded('sqlite3')) {
	echo "FTS query builder checks skipped (sqlite3 is unavailable)\n";

	return;
}

define('MAX_FTS_RESULT_ITEMS', 10);
define('MAX_FTS_QUERY_TERMS', 3);
define('SQLITE_FTS_TOKENIZER', 'trigram');

require_once dirname(__DIR__) . '/includes/core/class.ftsquerybuilder.php';

$logged = [];
$builder = new FtsQueryBuilder(function ($message, $context) use (&$logged) {
	$logged[] = $message;
});

function term($value, $fields = ['subject']) {
	return ['type' => 'term', 'fields' => $fields, 'value' => $value];
}

$expressions = [
	[term('needle'), 'subject:"needle"*'],
	[term('needle hay', ['subject', 'body']), '((subject:"needle"* subject:"hay"*) OR (body:"needle"* body:"hay"*))'],
	[term('ab cd'), null],
	[term('one two three four'), 'subject:"one"* subject:"two"* subject:"three"*'],
	[term("it's"), 'subject:"it\'\'s"*'],
	[['op' => 'NOT', 'children' => [term('spam')]], 'NOT (subject:"spam"*)'],
	[['op' => 'AND', 'children' => [['op' => 'NOT', 'children' => [term('spam')]]]], null],
	[['op' => 'AND', 'children' => [term('foo'), ['op' => 'NOT', 'children' => [term('spam')]]]], '(subject:"foo"*) NOT (subject:"spam"*)'],
	[['op' => 'OR', 'children' => [term('foo'), term('bar', ['body'])]], '(subject:"foo"*) OR (body:"bar"*)'],
	[['op' => 'XOR', 'children' => [term('foo')]], null],
];
foreach ($expressions as [$ast, $expected]) {
	$actual = $builder->compile($ast);
	if ($actual !== $expected) {
		throw new RuntimeException('Compiled ' . json_encode($ast) . ' to ' . var_export($actual, true));
	}
}
if (!in_array('Skipping short search term', $logged, true) || !in_array('Search term limit reached', $logged, true)) {
	throw new RuntimeException('Skipped search terms were not logged.');
}

if ($builder->build(['ast' => term('ab')], [1]) !== null) {
	throw new RuntimeException('An empty expression produced a query.');
}

[$sql, $bindings, $ftsQuery] = (new FtsQueryBuilder())->build([
	'ast' => term('needle'),
	'message_classes' => ['IPM.Note', 'IPM.Appointment'],
	'date_start' => '100',
	'date_end' => 200,
	'unread' => true,
	'has_attachments' => 1,
], ['7', 7, 9]);
$expectedSql = 'SELECT c.message_id, c.entryid, c.folder_id, c.message_class, c.date, c.readflag, c.attach_indexed ' .
	'FROM msg_content c JOIN messages m ON c.message_id = m.rowid ' .
	'WHERE c.folder_id in (:folder_id_0, :folder_id_1) AND messages MATCH :fts_query AND c.date >= :date_start AND c.date <= :date_end ' .
	'AND (c.readflag IS NULL OR c.readflag = 0) AND c.attach_indexed = 1 ' .
	'AND (c.message_class LIKE :message_class_0 OR c.message_class LIKE :message_class_1) ORDER BY c.date DESC LIMIT :limit';
$expectedBindings = [
	[':folder_id_0', 7, SQLITE3_INTEGER],
	[':folder_id_1', 9, SQLITE3_INTEGER],
	[':fts_query', 'subject:"needle"*', SQLITE3_TEXT],
	[':date_start', 100, SQLITE3_INTEGER],
	[':date_end', 200, SQLITE3_INTEGER],
	[':message_class_0', 'IPM.Note%', SQLITE3_TEXT],
	[':message_class_1', 'IPM.Appointment%', SQLITE3_TEXT],
	[':limit', 10, SQLITE3_INTEGER],
];
if ($sql !== $expectedSql || $bindings !== $expectedBindings || $ftsQuery !== 'subject:"needle"*') {
	throw new RuntimeException("Unexpected query: {$sql} " . json_encode($bindings));
}

[$sql, $bindings] = (new FtsQueryBuilder())->build(['ast' => term('needle')], []);
if (!str_contains($sql, 'WHERE messages MATCH :fts_query ORDER BY') || count($bindings) !== 2) {
	throw new RuntimeException("Unexpected unfiltered query: {$sql}");
}

// exclusion-only queries run against a real FTS5 table
$db = new SQLite3(':memory:');
$db->exec('CREATE TABLE msg_content (message_id INTEGER PRIMARY KEY, entryid BLOB, folder_id INTEGER, message_class TEXT, ' .
	'date INTEGER, readflag INTEGER, attach_indexed INTEGER);' .
	"CREATE VIRTUAL TABLE messages USING fts5 (subject, content, tokenize='trigram', content='', contentless_delete=1);");
foreach ([1 => 'spam offer', 2 => 'weekly report', 3 => 'phishing alert'] as $id => $subject) {
	$db->exec("INSERT INTO msg_content VALUES ({$id}, 'e{$id}', 1, 'IPM.Note', {$id}, 0, 0)");
	$db->exec("INSERT INTO messages (rowid, subject, content) VALUES ({$id}, '{$subject}', '')");
}
$not = fn ($value) => ['op' => 'NOT', 'children' => [term($value)]];
$cases = [
	[$not('spam'), ['e3', 'e2']],
	[['op' => 'AND', 'children' => [$not('spam'), $not('phishing')]], ['e2']],
	[['op' => 'AND', 'children' => [term('report'), $not('spam')]], ['e2']],
];
foreach ($cases as [$ast, $expected]) {
	[$sql, $bindings] = (new FtsQueryBuilder())->build(['ast' => $ast], []);
	$stmt = $db->prepare($sql);
	foreach ($bindings as $binding) {
		$stmt->bindValue(...$binding);
	}
	$rows = [];
	$result = $stmt->execute();
	while ($result && ($row = $result->fetchArray(SQLITE3_ASSOC))) {
		$rows[] = $row['entryid'];
	}
	if ($rows !== $expected) {
		throw new RuntimeException('Query ' . json_encode($ast) . ' matched ' . json_encode($rows));
	}
}

echo "FTS query builder checks passed\n";
