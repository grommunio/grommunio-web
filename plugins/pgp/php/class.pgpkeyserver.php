<?php

require_once __DIR__ . '/class.pgpkeystore.php';

/** Explicit fingerprint-only HTTPS lookup, with address pinning against SSRF. */
class PgpKeyserver {
	public static function lookup(PgpKeyStore $store, string $server, string $fingerprint): array {
		$fingerprint = PgpKeyStore::fingerprint($fingerprint);
		if (!in_array($server, $store->servers(), true)) {
			throw new RuntimeException('Select one of your configured HTTPS keyservers.');
		}
		$parts = parse_url($server);
		if (!$parts || ($parts['scheme'] ?? '') !== 'https' || empty($parts['host']) || isset($parts['user']) || isset($parts['pass']) || isset($parts['query']) || isset($parts['fragment']) || isset($parts['port']) && $parts['port'] !== 443 || !in_array($parts['path'] ?? '', ['', '/'], true)) {
			throw new RuntimeException('Keyservers must be HTTPS origins on port 443.');
		}
		$host = $parts['host'];
		$records = dns_get_record($host, DNS_A | DNS_AAAA);
		$addresses = [];
		foreach ($records ?: [] as $record) {
			$address = $record['ip'] ?? $record['ipv6'] ?? '';
			if (self::publicAddress($address)) {
				$addresses[] = $address;
			}
		}
		if (!$addresses || !function_exists('curl_init')) {
			throw new RuntimeException('The HTTPS keyserver cannot be reached.');
		}
		$url = rtrim($server, '/') . '/pks/lookup?op=get&options=mr&search=0x' . $fingerprint;
		$curl = curl_init($url);
		$body = '';
		$address = str_contains($addresses[0], ':') ? '[' . $addresses[0] . ']' : $addresses[0];
		curl_setopt_array($curl, [
			CURLOPT_CONNECTTIMEOUT => 5,
			CURLOPT_TIMEOUT => 15,
			CURLOPT_FOLLOWLOCATION => false,
			CURLOPT_SSL_VERIFYPEER => true,
			CURLOPT_SSL_VERIFYHOST => 2,
			CURLOPT_PROTOCOLS => CURLPROTO_HTTPS,
			CURLOPT_PROXY => '',
			CURLOPT_RESOLVE => [$host . ':443:' . $address],
			CURLOPT_HTTPHEADER => ['Accept: application/pgp-keys'],
			CURLOPT_WRITEFUNCTION => static function ($curl, $chunk) use (&$body) {
				if (strlen($body) + strlen($chunk) > PLUGIN_PGP_MAX_KEY_BYTES) {
					return 0;
				}
				$body .= $chunk;
				return strlen($chunk);
			},
		]);
		$ok = curl_exec($curl);
		$status = curl_getinfo($curl, CURLINFO_RESPONSE_CODE);
		curl_close($curl);
		if (!$ok || $status !== 200 || !str_contains($body, '-----BEGIN PGP PUBLIC KEY BLOCK-----') || str_contains($body, 'PRIVATE KEY BLOCK')) {
			throw new RuntimeException('The keyserver did not return a public key for this fingerprint.');
		}
		// Read-only proxy: OpenPGP.js validates the fingerprint, certifications
		// and user IDs in the browser before a separate explicit mailbox import.
		// No server-side keyring and no implicit fingerprint trust pin.
		return ['armored' => $body, 'fingerprint' => $fingerprint];
	}

	/** Require globally routable unicast, including on PHP versions with incomplete reserved-range flags. */
	private static function publicAddress(string $address): bool {
		if (!filter_var($address, FILTER_VALIDATE_IP, FILTER_FLAG_NO_PRIV_RANGE | FILTER_FLAG_NO_RES_RANGE)) {
			return false;
		}
		$packed = inet_pton($address);
		if (strlen($packed) === 16) {
			// Global IPv6 unicast only; reject transition/tunnel and documentation prefixes.
			if ((ord($packed[0]) & 0xe0) !== 0x20 || substr($packed, 0, 2) === "\x20\x02" || (substr($packed, 0, 2) === "\x20\x01" && ord($packed[2]) < 2) || substr($packed, 0, 4) === "\x20\x01\x0d\xb8" || (substr($packed, 0, 2) === "\x3f\xff" && (ord($packed[2]) & 0xf0) === 0)) {
				return false;
			}
			return true;
		}
		$bytes = array_values(unpack('C4', $packed));
		[$a, $b, $c] = $bytes;
		return !($a === 0 || $a >= 224 || ($a === 100 && $b >= 64 && $b <= 127) || ($a === 192 && (($b === 0 && ($c === 0 || $c === 2)) || ($b === 88 && $c === 99))) || ($a === 198 && ($b === 18 || $b === 19 || ($b === 51 && $c === 100))) || ($a === 203 && $b === 0 && $c === 113));
	}
}
