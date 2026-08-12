<?php

/** Read-only network boundary policy. Key trust and mailbox isolation are in testMapiKeyStore.php. */
require_once __DIR__ . '/../php/class.pgpkeyserver.php';
$method = new ReflectionMethod(PgpKeyserver::class, 'publicAddress');
$checks = 0;
foreach ([false => ['127.0.0.1', '10.0.0.1', '172.16.0.1', '192.168.1.1', '169.254.169.254', '100.64.0.1', '192.0.2.1', '198.18.0.1', '198.51.100.1', '203.0.113.1', '224.0.0.1', '::', '::1', '::ffff:127.0.0.1', 'fe80::1', 'fec0::1', 'ff02::1', '2001:db8::1', '2002:7f00:1::', '3fff::1', '', 'not an address'], true => ['1.1.1.1', '8.8.8.8', '2606:4700:4700::1111', '2001:4860:4860::8888']] as $expected => $addresses) {
	foreach ($addresses as $address) {
		if ($method->invoke(null, $address) !== (bool) $expected) { throw new RuntimeException('Wrong SSRF policy for ' . $address); }
		++$checks;
	}
}
if (class_exists('Gpg', false)) { throw new RuntimeException('Production keyserver loaded the GnuPG test oracle.'); }
echo "Keyserver SSRF policy: $checks assertions passed\n";
