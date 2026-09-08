<?php

if (!extension_loaded('sqlite3')) {
	echo "SQLite resource checks skipped (sqlite3 is unavailable)\n";

	return;
}
if (function_exists('mapi_linkmessages')) {
	echo "SQLite resource checks skipped with php-mapi loaded\n";

	return;
}

$temporaryDirectory = sys_get_temp_dir() . '/grommunio-index-' . bin2hex(random_bytes(8));
$userDirectory = $temporaryDirectory . '/test-user';
if (!mkdir($userDirectory, 0700, true)) {
	throw new RuntimeException('Unable to create the SQLite test directory.');
}

define('SQLITE_INDEX_PATH', $temporaryDirectory);
define('DEBUG_FULLTEXT_SEARCH', false);
define('MAX_FTS_RESULT_ITEMS', 10);
define('MAX_FTS_EXECUTION_TIME', 1);
define('MAX_FTS_QUERY_TERMS', 10);
define('SQLITE_FTS_TOKENIZER', 'unicode61');

$linkCall = [];
if (!function_exists('mapi_linkmessages')) {
	function mapi_linkmessages($session, $searchEntryid, $entryids) {
		$GLOBALS['linkCall'] = [$session, $searchEntryid, $entryids];
	}
}

require_once dirname(__DIR__) . '/includes/core/class.indexsqlite.php';

$databasePath = $userDirectory . '/index.sqlite3';

try {
	$database = new SQLite3($databasePath);
	if (!$database->exec('CREATE VIRTUAL TABLE messages USING fts5(subject, body)') ||
		!$database->exec('CREATE TABLE msg_content (' .
			'message_id INTEGER PRIMARY KEY, entryid BLOB, folder_id INTEGER, ' .
			'message_class TEXT, date INTEGER, readflag INTEGER, attach_indexed INTEGER)') ||
		!$database->exec("INSERT INTO messages(rowid, subject, body) VALUES (1, 'Needle', 'Test body')")) {
		throw new RuntimeException('Unable to create the SQLite search fixture.');
	}

	$statement = $database->prepare(
		'INSERT INTO msg_content ' .
		'(message_id, entryid, folder_id, message_class, date, readflag, attach_indexed) ' .
		'VALUES (1, :entryid, 7, :message_class, 100, 0, 1)'
	);
	if ($statement === false ||
		!$statement->bindValue(':entryid', "\x01\x02", SQLITE3_BLOB) ||
		!$statement->bindValue(':message_class', 'IPM.Note', SQLITE3_TEXT)) {
		throw new RuntimeException('Unable to prepare the SQLite search fixture.');
	}
	$result = $statement->execute();
	if ($result === false) {
		throw new RuntimeException('Unable to populate the SQLite search fixture.');
	}
	$resultFinalized = $result->finalize();
	$statementClosed = $statement->close();
	$databaseClosed = $database->close();
	if (!$resultFinalized || !$statementClosed || !$databaseClosed) {
		throw new RuntimeException('Unable to close the SQLite search fixture.');
	}

	$index = new IndexSqlite('test-user', 'test-session', 'test-store');
	$descriptor = [
		'ast' => [
			'type' => 'term',
			'fields' => ['subject'],
			'value' => 'Needle',
		],
	];
	if (!$index->is_open() || !$index->search('search-folder', $descriptor, null, false)) {
		throw new RuntimeException('The SQLite search fixture could not be searched.');
	}
	if ($linkCall !== ['test-session', 'search-folder', ["\x01\x02"]]) {
		throw new RuntimeException('The SQLite search did not release and link its matching result.');
	}
	if (!$index->close()) {
		throw new RuntimeException('Unable to close the SQLite search index.');
	}
}
finally {
	if (is_file($databasePath) && !unlink($databasePath)) {
		throw new RuntimeException('Unable to remove the SQLite test database.');
	}
	if (is_dir($userDirectory) && !rmdir($userDirectory)) {
		throw new RuntimeException('Unable to remove the SQLite test user directory.');
	}
	if (is_dir($temporaryDirectory) && !rmdir($temporaryDirectory)) {
		throw new RuntimeException('Unable to remove the SQLite test directory.');
	}
}

echo "SQLite resource checks passed\n";
