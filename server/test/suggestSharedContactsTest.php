<?php

/*
 * SPDX-FileCopyrightText: Copyright 2020 - 2026 grommunio GmbH
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

/*
 * Recipient suggestions from the contacts of shared stores and of the public store.
 *
 * The ENABLE_* switches are constants, so every scenario runs in its own PHP process:
 * this file starts itself once per scenario and checks the result of each.
 */

// Not function_exists(): the stubs below are declared in this file and are hoisted by PHP.
if (extension_loaded('mapi')) {
	echo "Shared contact suggestion checks skipped with php-mapi loaded\n";

	return;
}

$scenarios = [
	// name => [ENABLE_SHARED_CONTACT_FOLDERS, ENABLE_PUBLIC_CONTACT_FOLDERS, ENABLE_PUBLIC_FOLDERS]
	'all' => [1, 1, 1],
	'none' => [0, 0, 1],
	'shared-only' => [1, 0, 1],
	'public-without-public-folders' => [0, 1, 0],
];

$scenario = getenv('SUGGEST_SHARED_SCENARIO');
if ($scenario === false) {
	$failed = 0;
	foreach (array_keys($scenarios) as $name) {
		$cmd = 'SUGGEST_SHARED_SCENARIO=' . escapeshellarg($name) . ' ' . escapeshellarg(PHP_BINARY) . ' ' . escapeshellarg(__FILE__);
		passthru($cmd, $code);
		$failed += $code === 0 ? 0 : 1;
	}
	if ($failed > 0) {
		fwrite(STDERR, "Shared contact suggestion checks failed in {$failed} scenario(s)\n");
		exit(1);
	}
	echo "Shared contact suggestion checks passed\n";

	return;
}

[$shared, $public, $publicFolders] = $scenarios[$scenario];
define('ENABLE_SHARED_CONTACT_FOLDERS', (bool) $shared);
define('ENABLE_PUBLIC_CONTACT_FOLDERS', (bool) $public);
define('ENABLE_PUBLIC_FOLDERS', (bool) $publicFolders);

define('BASE_PATH', dirname(__DIR__, 2) . '/');
$tags = [
	'PR_ACCOUNT', 'PR_ADDRTYPE', 'PR_DISPLAY_NAME', 'PR_DISPLAY_TYPE', 'PR_DISPLAY_TYPE_EX', 'PR_EC_RECIPIENT_HISTORY_JSON',
	'PR_EMAIL_ADDRESS', 'PR_ENTRYID', 'PR_IPM_CONTACT_ENTRYID', 'PR_MDB_PROVIDER', 'PR_MESSAGE_CLASS', 'PR_OBJECT_TYPE',
	'PR_SEARCH_KEY', 'PR_SMTP_ADDRESS',
];
foreach ($tags as $i => $tag) {
	define($tag, 0x1000 + $i);
}
foreach (['RES_AND' => 1, 'RES_OR' => 2, 'RES_CONTENT' => 3, 'RES_PROPERTY' => 4, 'FUZZYLEVEL' => 5, 'ULPROPTAG' => 6,
	'VALUE' => 7, 'RELOP' => 8, 'RELOP_EQ' => 9, 'FL_SUBSTRING' => 1, 'FL_IGNORECASE' => 2, 'TBL_BATCH' => 1,
	'MAPI_DEFERRED_ERRORS' => 1, 'MAPI_MAILUSER' => 6, 'DT_MAILUSER' => 0, 'PidLidEmail1EmailAddress' => 1,
	'PidLidEmail2EmailAddress' => 2, 'PidLidEmail3EmailAddress' => 3] as $name => $value) {
	define($name, $value);
}
define('ZARAFA_STORE_DELEGATE_GUID', 'delegate');
define('ZARAFA_STORE_PUBLIC_GUID', 'public');

class GrommunioException extends Exception {}
class MAPIException extends Exception {
	public bool $handled = false;

	public function setHandled() {
		$this->handled = true;
	}
}

require_once dirname(__DIR__) . '/includes/modules/class.module.php';
require_once dirname(__DIR__) . '/includes/modules/class.suggestemailaddressmodule.php';

function assertSame($expected, $actual, $label) {
	if ($expected !== $actual) {
		throw new RuntimeException("[{$GLOBALS['scenario']}] {$label}: expected " . var_export($expected, true) . ', got ' . var_export($actual, true));
	}
}

// ---- fake MAPI layer: stores hold contact folders, tables filter rows by restriction ----

class FakeStore {
	public function __construct(public int $id, public string $provider, public array $folders = [], public ?string $defaultContacts = null) {}
}

class FakeFolder {
	public function __construct(public ?FakeStore $store, public $rows, public bool $unreadable = false) {}
}

class FakeTable {
	public $restriction;

	public function __construct(public FakeFolder $folder) {}
}

// Named properties are numbered per store, which is what the module has to cope with.
function emailTag(FakeStore $store, int $n): int {
	return 0x9000 + $store->id * 0x10 + $n;
}

function getPropIdsFromStrings($store, $names) {
	$out = [];
	foreach (array_keys($names) as $i => $key) {
		$out[$key] = emailTag($store, $i + 1);
	}

	return $out;
}

function mapi_getprops($object, $props = null) {
	if ($object instanceof FakeStore) {
		return [PR_MDB_PROVIDER => $object->provider, PR_IPM_CONTACT_ENTRYID => $object->defaultContacts];
	}
	if ($object instanceof FakeFolder) {
		return [PR_IPM_CONTACT_ENTRYID => $object->store->defaultContacts];
	}

	return [];
}

function mapi_msgstore_openentry($store, $entryid = null) {
	if ($entryid === null) {
		return new FakeFolder($store, []);
	}
	$folder = $store->folders[$entryid] ?? null;
	if ($folder === null || ($folder['unreadable'] ?? false)) {
		throw new MAPIException('not readable');
	}

	return new FakeFolder($store, $folder['rows']);
}

function mapi_ab_getdefaultdir($ab) {
	return 'gal';
}

function mapi_ab_openentry($ab, $entryid = null) {
	return new FakeFolder(null, $GLOBALS['galRows']);
}

function mapi_folder_getcontentstable($folder, $flags = 0) {
	return new FakeTable($folder);
}

function mapi_table_restrict($table, $restriction, $flags = 0) {
	$table->restriction = $restriction;
}

function fakeMatches(array $row, array $res): bool {
	[$type, $arg] = $res;

	return match ($type) {
		RES_AND => array_reduce($arg, fn ($ok, $r) => $ok && fakeMatches($row, $r), true),
		RES_OR => array_reduce($arg, fn ($ok, $r) => $ok || fakeMatches($row, $r), false),
		RES_CONTENT => isset($row[$arg[ULPROPTAG]]) && stripos((string) $row[$arg[ULPROPTAG]], $arg[VALUE]) !== false,
		RES_PROPERTY => ($row[$arg[ULPROPTAG]] ?? null) === $arg[VALUE],
	};
}

function mapi_table_queryrows($table, $props, $start, $limit) {
	$out = [];
	foreach ($table->folder->rows as $row) {
		if (!fakeMatches($row, $table->restriction)) {
			continue;
		}
		$out[] = array_intersect_key($row, array_flip($props));
		if (count($out) >= $limit) {
			break;
		}
	}

	return $out;
}

class FakeSession {
	public int $otherStoreCalls = 0;
	public array $otherStores = [];
	public $publicStore = false;
	public FakeStore $default;

	public function getAddressbook() {
		return 'ab';
	}

	public function getDefaultMessageStore() {
		return $this->default;
	}

	public function getOtherUserStore() {
		++$this->otherStoreCalls;

		return $this->otherStores;
	}

	public function getPublicMessageStore() {
		return $this->publicStore;
	}

	public function getContactFoldersForABContactProvider($store) {
		return array_map(fn ($id) => [PR_ENTRYID => $id], array_keys($store->folders));
	}
}

function contact(FakeStore $store, string $name, array $mails): array {
	$row = [PR_DISPLAY_NAME => $name, PR_MESSAGE_CLASS => 'IPM.Contact'];
	foreach ($mails as $i => $mail) {
		$row[emailTag($store, $i + 1)] = $mail;
	}

	return $row;
}

function galEntry(string $name, string $mail): array {
	return [PR_ENTRYID => "gal-{$mail}", PR_DISPLAY_NAME => $name, PR_SMTP_ADDRESS => $mail, PR_EMAIL_ADDRESS => $mail,
		PR_ADDRTYPE => 'SMTP', PR_OBJECT_TYPE => MAPI_MAILUSER, PR_DISPLAY_TYPE => DT_MAILUSER, PR_DISPLAY_TYPE_EX => DT_MAILUSER,
		PR_SEARCH_KEY => 'k'];
}

function addresses(array $results): array {
	$list = array_map(fn ($r) => $r['smtp_address'], $results);
	sort($list);

	return $list;
}

class SuggestHarness extends suggestEmailAddressModule {
	public function __construct() {}
}

// ---- fixtures ----
$own = new FakeStore(1, 'private', defaultContacts: 'own');
$own->folders['own'] = ['rows' => [
	contact($own, 'Olga Own', ['olga@own.example']),
	contact($own, 'Duplicate Dora', ['dora@shared.example']),
]];
$sharedA = new FakeStore(2, ZARAFA_STORE_DELEGATE_GUID);
$sharedA->folders['a1'] = ['rows' => [
	contact($sharedA, 'Sam Shared', ['sam@shared.example', 'sam2@shared.example']),
	contact($sharedA, 'Duplicate Dora', ['dora@shared.example']),
]];
$sharedA->folders['a2'] = ['rows' => [contact($sharedA, 'Sasha Sub', ['sasha@shared.example'])]];
$sharedBroken = new FakeStore(3, ZARAFA_STORE_DELEGATE_GUID);
$sharedBroken->folders['b1'] = ['rows' => [], 'unreadable' => true];
$notDelegate = new FakeStore(4, 'private');
$notDelegate->folders['n1'] = ['rows' => [contact($notDelegate, 'Nora Notshared', ['nora@other.example'])]];
$sharedC = new FakeStore(5, ZARAFA_STORE_DELEGATE_GUID);
$sharedC->folders['c1'] = ['rows' => [contact($sharedC, 'Sonja Late', ['sonja@shared.example'])]];
$publicStore = new FakeStore(6, ZARAFA_STORE_PUBLIC_GUID);
$publicStore->folders['p1'] = ['rows' => [contact($publicStore, 'Paul Public', ['paul@public.example'])]];

$session = new FakeSession();
$session->default = $own;
$session->otherStores = ['a' => $sharedA, 'broken' => $sharedBroken, 'n' => $notDelegate, 'c' => $sharedC];
$session->publicStore = $publicStore;
$GLOBALS['mapisession'] = $session;
$GLOBALS['galRows'] = [galEntry('Gabi Gal', 'gabi@gal.example')];
$module = new SuggestHarness();

// ---- checks ----
$found = fn (string $q, int $limit = 10) => addresses($module->getDirectoryRecipients($q, $limit, []));

assertSame(['olga@own.example'], $found('olga'), 'own contact folder stays a source');
assertSame(['gabi@gal.example'], $found('gabi'), 'global address book stays a source');

assertSame($shared ? ['sam2@shared.example', 'sam@shared.example'] : [], $found('sam'), 'shared contact folder, every address of a contact');
assertSame($shared ? ['sasha@shared.example'] : [], $found('sasha'), 'second folder of a shared store');
assertSame($shared ? ['sonja@shared.example'] : [], $found('sonja'), 'folder behind an unreadable one is still searched');
assertSame([], $found('nora'), 'a store that is not a delegate store is ignored');
assertSame($public && $publicFolders ? ['paul@public.example'] : [], $found('paul'), 'public contact folder');

// the same person in the own and in a shared folder is suggested once
assertSame(['dora@shared.example'], $found('dora'), 'duplicates collapse');

// entries look like those from the own folder, so the client treats them the same
$entry = $module->getDirectoryRecipients('olga', 10, [])[0];
assertSame('directory', $entry['source'], 'source marker');
assertSame(MAPI_MAILUSER, $entry['object_type'], 'object type');

// addresses that are already suggested from the history are not repeated
assertSame([], addresses($module->getDirectoryRecipients('olga', 10, ['olga@own.example' => true])), 'known addresses are skipped');

// the shared stores are not even opened when the earlier sources fill the list
$session->otherStoreCalls = 0;
$GLOBALS['galRows'] = [galEntry('Many One', 'm1@gal.example'), galEntry('Many Two', 'm2@gal.example')];
$module->getDirectoryRecipients('many', 2, []);
assertSame(0, $session->otherStoreCalls, 'no store lookup when the limit is reached');

// without the switches the module does not touch the shared stores at all
$session->otherStoreCalls = 0;
$module->getDirectoryRecipients('zzz', 10, []);
assertSame($shared ? 1 : 0, $session->otherStoreCalls, 'shared stores are only listed when enabled');

// a missing public store is no error
$session->publicStore = false;
assertSame($shared ? ['sam2@shared.example', 'sam@shared.example'] : [], $found('sam'), 'no public store available');

echo "Shared contact suggestion checks passed ({$scenario})\n";
