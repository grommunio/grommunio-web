<?php

/**
 * Real MAPI FAI test with an already-encrypted, browser-generated key fixture.
 * Required: PGP_TEST_USER (dedicated QA account), PGP_TEST_KEY_RECORD JSON path.
 * Optional: PGP_TEST_PASSWORD_FILE. No private-key passphrase is needed or read.
 * Only this fixture's previously absent fingerprint and a newly created empty
 * policy record are removed. Existing keys and policies are never overwritten.
 */
if (PHP_SAPI !== 'cli' || !getenv('PGP_TEST_USER') || !getenv('PGP_TEST_KEY_RECORD')) {
	fwrite(STDERR, "Set PGP_TEST_USER and PGP_TEST_KEY_RECORD for a dedicated QA mailbox.\n");
	exit(2);
}
require_once '/usr/share/php-mapi/bootstrap.php';
define('PLUGIN_PGP_ENABLE', true);
require_once __DIR__ . '/../php/class.pgpkeystore.php';
$checks = 0;
function liveKeyCheck(bool $condition, string $message): void {
	global $checks;
	++$checks;
	if (!$condition) { throw new RuntimeException($message); }
}
function liveKeyRejects(callable $operation, string $message): void {
	try { $operation(); } catch (RuntimeException | InvalidArgumentException $error) { liveKeyCheck(true, $message); return; }
	liveKeyCheck(false, $message);
}
function liveKeyRows($root, string $class, array $tags, bool $associated = true): array {
	$restriction = [RES_PROPERTY, [RELOP => RELOP_EQ, ULPROPTAG => PR_MESSAGE_CLASS, VALUE => [PR_MESSAGE_CLASS => $class]]];
	$result = mapi_table_queryallrows(mapi_folder_getcontentstable($root, $associated ? MAPI_ASSOCIATED : 0), array_merge([PR_ENTRYID, PR_MESSAGE_CLASS], $tags), $restriction);
	liveKeyCheck(is_array($result), 'Cannot enumerate QA key records.');
	return $result;
}
$record = json_decode(file_get_contents(getenv('PGP_TEST_KEY_RECORD')), true, 32, JSON_THROW_ON_ERROR);
liveKeyCheck(is_array($record) && !isset($record['passphrase'], $record['password']), 'Fixture must contain only encrypted private-key material.');
$fingerprint = PgpKeyStore::fingerprint($record['fingerprint'] ?? '');
liveKeyCheck(PgpKeyMaterial::inspect($record['encrypted_private_key'], true, 1048576)['fingerprint'] === $fingerprint, 'Browser-generated encrypted private key was not accepted.');
$passwordPath = getenv('PGP_TEST_PASSWORD_FILE');
$password = $passwordPath ? rtrim(file_get_contents($passwordPath), "\r\n") : '';
$session = mapi_logon_ex(getenv('PGP_TEST_USER'), $password, 0);
unset($password);
liveKeyCheck($session !== false, 'QA MAPI logon failed.');
$stores = mapi_table_queryallrows(mapi_getmsgstorestable($session), [PR_ENTRYID, PR_DEFAULT_STORE]);
$default = array_values(array_filter($stores, static fn ($store) => !empty($store[PR_DEFAULT_STORE])));
liveKeyCheck(count($default) === 1, 'Cannot identify QA default store.');
$store = mapi_openmsgstore($session, $default[0][PR_ENTRYID]);
$root = mapi_msgstore_openentry($store);
$tags = getPropIdsFromStrings($store, PgpKeyStore::propertyNames());
$GLOBALS['mapisession'] = new class($store) {
	public function __construct(private $store) {}
	public function getDefaultMessageStore() { return $this->store; }
};
$keys = PgpKeyStore::current();
$before = liveKeyRows($root, PgpKeyStore::KEY_CLASS, [$tags['fingerprint']]);
liveKeyCheck(!array_filter($before, static fn ($row) => ($row[$tags['fingerprint']] ?? '') === $fingerprint), 'Refusing to replace an existing fixture fingerprint.');
$policiesBefore = liveKeyRows($root, PgpKeyStore::POLICY_CLASS, []);
liveKeyCheck($policiesBefore === [], 'Use a fresh QA mailbox without an existing OpenPGP policy.');
$created = false;
try {
	$created = true;
	$saved = $keys->importKey($record);
	liveKeyCheck($saved['fingerprint'] === $fingerprint && $saved['secret'], 'Imported encrypted key metadata mismatch.');
	liveKeyCheck(!isset($saved['public_key']) && !isset($saved['encrypted_private_key']), 'Metadata response exposed bulk key material.');
	$actual = (new PgpKeyStore($store))->key($fingerprint);
	liveKeyCheck($actual['public_key'] === $record['public_key'], 'MAPI binary stream changed public key armor.');
	liveKeyCheck($actual['encrypted_private_key'] === $record['encrypted_private_key'], 'MAPI binary stream changed encrypted private key armor.');
	$publicBundle = $keys->publicKeys();
	$publicMatch = array_values(array_filter($publicBundle, static fn ($key) => $key['fingerprint'] === $fingerprint));
	liveKeyCheck(count($publicMatch) === 1 && $publicMatch[0]['public_key'] === $record['public_key'] && !isset($publicMatch[0]['encrypted_private_key']), 'Public verification bundle included private armor or lost the public key.');
	liveKeyCheck($actual['metadata_advisory'] && !$actual['trusted'], 'Storage metadata or trust state incorrectly promoted.');
	$associated = liveKeyRows($root, PgpKeyStore::KEY_CLASS, [$tags['fingerprint']]);
	$mine = array_values(array_filter($associated, static fn ($row) => ($row[$tags['fingerprint']] ?? '') === $fingerprint));
	liveKeyCheck(count($mine) === 1, 'Key is not uniquely stored as folder-associated information.');
	$ordinary = liveKeyRows($root, PgpKeyStore::KEY_CLASS, [$tags['fingerprint']], false);
	liveKeyCheck(!array_filter($ordinary, static fn ($row) => ($row[$tags['fingerprint']] ?? '') === $fingerprint), 'Key leaked into the ordinary folder contents table.');
	$message = mapi_msgstore_openentry($store, $mine[0][PR_ENTRYID]);
	$body = mapi_getprops($message, [PR_BODY, PR_HTML, PR_USER_X509_CERTIFICATE, PR_USER_CERTIFICATE]);
	liveKeyCheck(!array_intersect_key($body, array_flip([PR_BODY, PR_HTML, PR_USER_X509_CERTIFICATE, PR_USER_CERTIFICATE])), 'Key material was written into body/certificate properties.');
	liveKeyRejects(fn () => $keys->importKey($record), 'Update without matching revision did not fail.');
	$update = $record;
	unset($update['encrypted_private_key']);
	$update['revision'] = $saved['revision'];
	$next = $keys->importKey($update);
	liveKeyCheck($next['revision'] !== $saved['revision'], 'Successful update did not change revision.');
	liveKeyCheck((new PgpKeyStore($store))->key($fingerprint)['encrypted_private_key'] === $record['encrypted_private_key'], 'Public refresh destroyed encrypted private material.');
	liveKeyRejects(fn () => $keys->delete($fingerprint), 'Private deletion lacked explicit confirmation.');
	$keys->delete($fingerprint, true);
	$created = false;
	liveKeyRejects(fn () => (new PgpKeyStore($store))->key($fingerprint), 'Deleted key remained accessible.');
	echo "OK: {$checks} real mailbox key-storage assertions\n";
}
finally {
	if ($created) {
		// Exact fixture fingerprint only; do not depend on partially failed metadata.
		foreach (liveKeyRows($root, PgpKeyStore::KEY_CLASS, [$tags['fingerprint']]) as $row) {
			if (($row[$tags['fingerprint']] ?? '') === $fingerprint) { mapi_folder_deletemessages($root, [$row[PR_ENTRYID]]); }
		}
	}
	if (!$policiesBefore) {
		foreach (liveKeyRows($root, PgpKeyStore::POLICY_CLASS, [$tags['policy']]) as $row) {
			$policy = isset($row[$tags['policy']]) ? json_decode($row[$tags['policy']], true) : null;
			if (is_array($policy) && ($policy['trusted'] ?? null) === [] && ($policy['keyservers'] ?? null) === PLUGIN_PGP_KEYSERVER_ALLOWLIST) {
				mapi_folder_deletemessages($root, [$row[PR_ENTRYID]]);
			}
		}
	}
}
