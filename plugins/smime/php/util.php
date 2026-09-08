<?php

/*
 * This file contains functions which are used in plugin.smime.php and class.pluginsmimemodule.php and therefore
 * exists here to avoid code-duplication.
 */

/**
 * Function which extracts the email address from a certificate, and tries to get the subjectAltName if
 * subject/emailAddress is not set.
 *
 * @param array $certificate parsed certificate data
 *
 * @return string certificate email address, or an empty string when absent
 */
function getCertEmail($certificate) {
	$certEmailAddress = "";
	// If subject/emailAddress is not set, try subjectAltName
	if (isset($certificate['subject']['emailAddress'])) {
		$certEmailAddress = $certificate['subject']['emailAddress'];
	}
	elseif (isset($certificate['extensions'], $certificate['extensions']['subjectAltName'])) {
		// Example [subjectAltName] => email:foo@bar.com, DNS:example.com
		$altNames = explode(',', $certificate['extensions']['subjectAltName']);
		foreach ($altNames as $altName) {
			$altName = trim($altName);
			if (strpos($altName, 'email:') === 0) {
				$certEmailAddress = substr($altName, 6);
				break;
			}
		}
	}

	return $certEmailAddress;
}

/**
 * Function that will return the private certificate of the user from the user store where it is stored in pkcs#12 format.
 *
 * @param resource $store        user's store
 * @param string   $type         of message_class
 * @param string   $emailAddress email address to specify
 *
 * @return array<int, array<int, mixed>> certificate message rows
 */
function getMAPICert($store, $type = 'WebApp.Security.Private', $emailAddress = '') {
	$root = mapi_msgstore_openentry($store);
	$table = mapi_folder_getcontentstable($root, MAPI_ASSOCIATED);

	$restrict = [RES_PROPERTY,
		[
			RELOP => RELOP_EQ,
			ULPROPTAG => PR_MESSAGE_CLASS,
			VALUE => [PR_MESSAGE_CLASS => $type],
		],
	];
	if ($type == 'WebApp.Security.Public' && !empty($emailAddress)) {
		$restrict = [RES_AND, [
			$restrict,
			[RES_CONTENT,
				[
					FUZZYLEVEL => FL_FULLSTRING | FL_IGNORECASE,
					ULPROPTAG => PR_SUBJECT,
					VALUE => [PR_SUBJECT => $emailAddress],
				],
			],
		]];
	}

	// PR_MESSAGE_DELIVERY_TIME validTo / PR_CLIENT_SUBMIT_TIME validFrom
	mapi_table_restrict($table, $restrict, TBL_BATCH);
	mapi_table_sort($table, [PR_MESSAGE_DELIVERY_TIME => TABLE_SORT_DESCEND], TBL_BATCH);

	return mapi_table_queryallrows($table, [PR_ENTRYID, PR_SUBJECT, PR_SUBJECT_PREFIX, PR_MESSAGE_DELIVERY_TIME, PR_CLIENT_SUBMIT_TIME], $restrict);
}

/**
 * Function that will decrypt the private certificate using a supplied password
 * If multiple private certificates can be decrypted with the supplied password,
 * all of them will be returned, if $singleCert == false, otherwise only the first one.
 *
 * @param resource $store      user's store
 * @param string   $passphrase passphrase for private certificate
 * @param bool     $singleCert if true, returns the first certificate, which was successfully decrypted with $passphrase
 *
 * @return array<int, array<string, mixed>>|array<string, mixed> unlocked PKCS#12 data, or an empty array
 */
function readPrivateCert($store, $passphrase, $singleCert = true) {
	$unlockedCerts = [];
	// Get all private certificates saved in the store
	$privateCerts = getMAPICert($store);
	if ($privateCerts === []) {
		return [];
	}
	if ($singleCert) {
		$privateCerts = [$privateCerts[0]];
	}

	// Get messages from certificates
	foreach ($privateCerts as $privateCert) {
		$privateCertMessage = mapi_msgstore_openentry($store, $privateCert[PR_ENTRYID]);
		if ($privateCertMessage === false) {
			continue;
		}
		$pkcs12 = "";
		$certs = [];
		// Read pkcs12 cert from message
		$stream = mapi_openproperty($privateCertMessage, PR_BODY, IID_IStream, 0, 0);
		if (!$stream) {
			continue;
		}
		$stat = mapi_stream_stat($stream);
		mapi_stream_seek($stream, 0, STREAM_SEEK_SET);
		for ($i = 0; $i < $stat['cb']; $i += 1024) {
			$pkcs12 .= mapi_stream_read($stream, 1024);
		}
		$ok = openssl_pkcs12_read(base64_decode($pkcs12), $certs, $passphrase);
		if ($ok !== false) {
			array_push($unlockedCerts, $certs);
		}
	}

	return ($singleCert !== false && count($unlockedCerts) > 0) ? $unlockedCerts[0] : $unlockedCerts;
}

/**
 * Converts X509 DER format string to PEM format.
 *
 * @param string $certificate X.509 certificate in DER format
 *
 * @return string X.509 certificate in PEM format
 */
function der2pem($certificate) {
	return "-----BEGIN CERTIFICATE-----\n" . chunk_split(base64_encode((string) $certificate), 64, "\n") . "-----END CERTIFICATE-----\n";
}

/**
 * Resolve PLUGIN_SMIME_CACERTS into the list of CA stores handed to OpenSSL.
 *
 * On SUSE-based systems /etc/ssl/certs is a purpose-filtered trust store
 * (server-auth only) which lacks email-only roots such as the HARICA Client
 * CAs. When the configured store is that filtered directory, the unfiltered
 * anchor store /var/lib/ca-certificates/openssl is appended so chains ending
 * in an email-only root can still be verified. On RHEL-based systems
 * /etc/ssl/certs is not a hashed directory at all; the extracted
 * email-purpose bundle is appended there. On Debian the configured value is
 * used as-is.
 *
 * @return array list of CA bundle paths
 */
function getCaBundle() {
	$paths = [];
	foreach (explode(';', PLUGIN_SMIME_CACERTS) as $path) {
		$path = trim($path);
		if ($path !== '') {
			$paths[] = $path;
		}
	}

	$suseAnchors = '/var/lib/ca-certificates/openssl';
	if (is_dir($suseAnchors) && !in_array($suseAnchors, $paths, true)) {
		$filteredStore = realpath('/var/lib/ca-certificates/pem');
		foreach ($paths as $path) {
			if ($path === '/etc/ssl/certs' ||
				($filteredStore !== false && realpath($path) === $filteredStore)) {
				$paths[] = $suseAnchors;
				break;
			}
		}
	}

	// RHEL: /etc/ssl/certs -> /etc/pki/tls/certs contains only bundle
	// files, not a hashed directory, so OpenSSL directory lookup finds
	// no anchors there. Use the extracted email-purpose bundle instead.
	$rhelEmailBundle = '/etc/pki/ca-trust/extracted/pem/email-ca-bundle.pem';
	if (is_file($rhelEmailBundle) && !in_array($rhelEmailBundle, $paths, true)) {
		$tlsCerts = realpath('/etc/pki/tls/certs');
		foreach ($paths as $path) {
			if ($path === '/etc/ssl/certs' ||
				($tlsCerts !== false && realpath($path) === $tlsCerts)) {
				$paths[] = $rhelEmailBundle;
				break;
			}
		}
	}

	return $paths;
}

/**
 * Build a DN string in /key=value notation from a parsed certificate field.
 *
 * @param array  $parsed openssl_x509_parse() result
 * @param string $field  'subject' or 'issuer'
 *
 * @return string
 */
function certDnString($parsed, $field) {
	$dn = '';
	foreach ($parsed[$field] ?? [] as $key => $value) {
		foreach ((array) $value as $entry) {
			$dn .= "/{$key}={$entry}";
		}
	}

	return $dn;
}

/**
 * Extract all PEM certificate blocks from a string.
 *
 * @param string $data
 *
 * @return array list of PEM certificates
 */
function extractPemCerts($data) {
	if (preg_match_all('/-----BEGIN CERTIFICATE-----.+?-----END CERTIFICATE-----/s', (string) $data, $matches)) {
		return $matches[0];
	}

	return [];
}

/**
 * Decode an AIA "CA Issuers" response into PEM certificates.
 * Endpoints serve either a single certificate (PEM or DER) or a
 * PKCS#7 certs-only bundle (.p7c).
 *
 * @param string $data raw response body
 *
 * @return array list of PEM certificates
 */
function decodeCaIssuerResponse($data) {
	if (strpos($data, '-----BEGIN CERTIFICATE-----') !== false) {
		return extractPemCerts($data);
	}

	$pem = der2pem($data);
	if (@openssl_x509_parse($pem) !== false) {
		return [$pem];
	}

	if (strpos($data, '-----BEGIN PKCS7-----') !== false) {
		$p7b = $data;
	}
	else {
		$p7b = "-----BEGIN PKCS7-----\n" . chunk_split(base64_encode($data), 64, "\n") . "-----END PKCS7-----\n";
	}
	$certs = [];
	if (@openssl_pkcs7_read($p7b, $certs)) {
		return $certs;
	}

	return [];
}

/**
 * Ensure the AIA cache directory cannot be modified by other local users.
 *
 * @param string $cacheDir cache directory
 *
 * @return bool true when the directory is safe and writable
 */
function ensureAiaCacheDir($cacheDir) {
	if (is_link($cacheDir)) {
		return false;
	}
	if (!is_dir($cacheDir) && !@mkdir($cacheDir, 0700, true) && !is_dir($cacheDir)) {
		return false;
	}
	// Older releases created this directory group-writable. Tighten it when
	// possible; otherwise do not trust or write cache entries in it.
	if (!@chmod($cacheDir, 0700)) {
		return false;
	}
	clearstatcache(true, $cacheDir);
	$stat = @lstat($cacheDir);
	if ($stat === false || ($stat['mode'] & 0170000) !== 0040000 || ($stat['mode'] & 0077) !== 0) {
		return false;
	}
	if (function_exists('posix_geteuid') && $stat['uid'] !== posix_geteuid()) {
		return false;
	}

	return is_writable($cacheDir);
}

/**
 * Read an AIA cache entry without following a pre-created link.
 *
 * @param string $cacheFile cache filename
 *
 * @return null|string cached data, or null for an unsafe/unreadable entry
 */
function readAiaCacheFile($cacheFile) {
	if (!is_file($cacheFile) || is_link($cacheFile)) {
		return null;
	}
	$stat = @lstat($cacheFile);
	$dirStat = @lstat(dirname($cacheFile));
	if ($stat === false || $dirStat === false ||
		($stat['mode'] & 0170000) !== 0100000 ||
		($dirStat['mode'] & 0170000) !== 0040000 ||
		($dirStat['mode'] & 0077) !== 0 ||
		($stat['mode'] & 0077) !== 0 ||
		$stat['uid'] !== $dirStat['uid']) {
		return null;
	}

	$cached = @file_get_contents($cacheFile);

	return is_string($cached) ? $cached : null;
}

/**
 * Atomically replace an AIA cache entry without following a pre-created link.
 *
 * @param string $cacheDir  cache directory
 * @param string $cacheFile cache filename
 * @param string $data      cache contents
 *
 * @return bool true when the cache entry was written
 */
function writeAiaCacheFile($cacheDir, $cacheFile, $data) {
	if (!ensureAiaCacheDir($cacheDir)) {
		return false;
	}
	$tmpFile = tempnam($cacheDir, '.aia-');
	if ($tmpFile === false) {
		return false;
	}

	try {
		$written = file_put_contents($tmpFile, $data, LOCK_EX);
		if ($written !== strlen($data) || !@chmod($tmpFile, 0600)) {
			return false;
		}

		return @rename($tmpFile, $cacheFile);
	}
	finally {
		if ((is_file($tmpFile) || is_link($tmpFile)) && !@unlink($tmpFile)) {
			error_log("[smime] Could not remove temporary AIA cache file: {$tmpFile}");
		}
	}
}

/**
 * Test whether an IP address belongs to a CIDR range.
 *
 * @param string $ip
 * @param string $cidr
 *
 * @return bool
 */
function smimeIpInCidr($ip, $cidr) {
	[$network, $prefix] = explode('/', $cidr, 2);
	$addressBytes = @inet_pton($ip);
	$networkBytes = @inet_pton($network);
	$prefix = (int) $prefix;
	if ($addressBytes === false || $networkBytes === false || strlen($addressBytes) !== strlen($networkBytes) ||
		$prefix < 0 || $prefix > strlen($addressBytes) * 8) {
		return false;
	}

	$wholeBytes = intdiv($prefix, 8);
	if ($wholeBytes > 0 && substr($addressBytes, 0, $wholeBytes) !== substr($networkBytes, 0, $wholeBytes)) {
		return false;
	}
	$remainingBits = $prefix % 8;
	if ($remainingBits === 0) {
		return true;
	}
	$mask = (0xFF << (8 - $remainingBits)) & 0xFF;

	return (ord($addressBytes[$wholeBytes]) & $mask) === (ord($networkBytes[$wholeBytes]) & $mask);
}

/**
 * Require a globally routable unicast address. PHP's NO_RES_RANGE filter
 * does not cover ranges such as carrier-grade NAT, benchmarks,
 * documentation networks, IPv6 translation prefixes or multicast.
 *
 * @param string $ip
 *
 * @return bool
 */
function smimeIsPublicIp($ip) {
	if (filter_var($ip, FILTER_VALIDATE_IP, FILTER_FLAG_NO_PRIV_RANGE | FILTER_FLAG_NO_RES_RANGE) === false) {
		return false;
	}

	$nonPublicRanges = [
		'100.64.0.0/10', '192.0.0.0/24', '192.0.2.0/24',
		'192.88.99.0/24', '198.18.0.0/15', '198.51.100.0/24',
		'203.0.113.0/24', '224.0.0.0/4',
		'64:ff9b::/96', '64:ff9b:1::/48', '100::/64',
		'2001::/23', '2001:db8::/32', '2002::/16',
		'3fff::/20', '5f00::/16', 'ff00::/8',
	];
	foreach ($nonPublicRanges as $range) {
		if (smimeIpInCidr($ip, $range)) {
			return false;
		}
	}

	return true;
}

/**
 * Resolve the host of an AIA URL and require it to point at public
 * addresses only (SSRF hardening, the URL comes from an unauthenticated
 * message). The resolved addresses are returned as a CURLOPT_RESOLVE pin
 * so curl connects to exactly the checked addresses (no DNS rebinding).
 *
 * @param string $url
 * @param bool   $allowPrivate include private destinations for internal PKI
 *
 * @return null|array CURLOPT_RESOLVE entries, empty array for IP literals or
 *                    the private-PKI opt-in, null when no allowed address remains
 */
function aiaResolvePin($url, $allowPrivate = false) {
	$parts = parse_url($url);
	if ($parts === false || empty($parts['host']) ||
		!in_array(strtolower($parts['scheme'] ?? ''), ['http', 'https'], true) ||
		isset($parts['user']) || isset($parts['pass'])) {
		return null;
	}
	$host = $parts['host'];
	$port = $parts['port'] ?? (strtolower($parts['scheme'] ?? 'http') === 'https' ? 443 : 80);
	if ($port < 1 || $port > 65535) {
		return null;
	}

	$literal = trim($host, '[]');
	$isIpLiteral = filter_var($literal, FILTER_VALIDATE_IP) !== false;
	if (!$isIpLiteral) {
		// Keep PHP's and curl's URL parsers from disagreeing about the
		// authority (for example on backslashes or alternate numeric IPs).
		$dnsHost = rtrim($host, '.');
		$legacyNumericHost = preg_match(
			'/\A(?:0[xX][0-9A-Fa-f]+|[0-9]+)(?:\.(?:0[xX][0-9A-Fa-f]+|[0-9]+))*\z/D',
			$dnsHost
		) === 1;
		if ($dnsHost === '' || strlen($dnsHost) > 253 ||
			preg_match('/\A(?:[A-Za-z0-9](?:[A-Za-z0-9-]{0,61}[A-Za-z0-9])?)(?:\.(?:[A-Za-z0-9](?:[A-Za-z0-9-]{0,61}[A-Za-z0-9])?))*\z/D', $dnsHost) !== 1 ||
			$legacyNumericHost) {
			return null;
		}
	}
	if ($allowPrivate) {
		// Preserve libc (/etc/hosts, split DNS) resolution for internal PKIs.
		return [];
	}

	$isPublic = function ($ip) {
		return smimeIsPublicIp($ip);
	};

	if ($isIpLiteral) {
		return $isPublic($literal) ? [] : null;
	}

	$ips = [];
	foreach (@dns_get_record($host, DNS_A | DNS_AAAA) ?: [] as $rr) {
		$ip = $rr['ip'] ?? $rr['ipv6'] ?? '';
		if ($ip !== '' && $isPublic($ip)) {
			$ips[] = $ip;
		}
	}
	if (empty($ips)) {
		return null;
	}

	$ips = array_values(array_unique($ips));
	$pinnedIps = array_map(function ($ip) {
		return strpos($ip, ':') === false ? $ip : "[{$ip}]";
	}, $ips);

	return ["{$host}:{$port}:" . implode(',', $pinnedIps)];
}

/**
 * Fetch an HTTP(S) resource referenced by an untrusted certificate.
 *
 * The destination is restricted to public addresses and pinned to the DNS
 * result checked above, unless the administrator explicitly allows private
 * AIA destinations for an internal PKI. Redirects are never followed and the
 * response is bounded independently of the server's Content-Length header.
 *
 * @param string $url       certificate-supplied URL
 * @param string $method    GET or POST
 * @param string $content   request body
 * @param array  $headers   request headers
 * @param int    $timeout   total timeout in seconds
 * @param int    $maxBytes  maximum response size
 *
 * @return false|string response body, or false on refusal/failure
 */
function fetchSmimeHttpResource($url, $method = 'GET', $content = '', $headers = [], $timeout = 10, $maxBytes = 1048576) {
	$method = strtoupper((string) $method);
	if (!function_exists('curl_init') || !is_string($url) || strlen($url) > 4096 ||
		preg_match('/[\x00-\x20\x7f]/', $url) || !in_array($method, ['GET', 'POST'], true)) {
		return false;
	}

	$allowPrivate = defined('PLUGIN_SMIME_AIA_ALLOW_PRIVATE') && PLUGIN_SMIME_AIA_ALLOW_PRIVATE;
	$pin = aiaResolvePin($url, $allowPrivate);
	if ($pin === null) {
		return false;
	}

	$body = '';
	$maxBytes = max(1, (int) $maxBytes);
	$timeout = max(1, (int) $timeout);
	$ch = curl_init();
	if ($ch === false) {
		return false;
	}

	curl_setopt($ch, CURLOPT_URL, $url);
	curl_setopt($ch, CURLOPT_FAILONERROR, true);
	curl_setopt($ch, CURLOPT_CONNECTTIMEOUT, min(5, $timeout));
	curl_setopt($ch, CURLOPT_TIMEOUT, $timeout);
	curl_setopt($ch, CURLOPT_PROTOCOLS, CURLPROTO_HTTP | CURLPROTO_HTTPS);
	curl_setopt($ch, CURLOPT_FOLLOWLOCATION, false);
	curl_setopt($ch, CURLOPT_MAXREDIRS, 0);
	curl_setopt($ch, CURLOPT_MAXFILESIZE, $maxBytes);
	curl_setopt($ch, CURLOPT_SSL_VERIFYPEER, true);
	curl_setopt($ch, CURLOPT_SSL_VERIFYHOST, 2);
	curl_setopt($ch, CURLOPT_WRITEFUNCTION, function ($ch, $chunk) use (&$body, $maxBytes) {
		$length = strlen($chunk);
		if ($length > $maxBytes - strlen($body)) {
			return 0;
		}
		$body .= $chunk;

		return $length;
	});
	if (!empty($pin)) {
		curl_setopt($ch, CURLOPT_RESOLVE, $pin);
	}
	if ($method === 'POST') {
		curl_setopt($ch, CURLOPT_POST, true);
		curl_setopt($ch, CURLOPT_POSTFIELDS, $content);
	}
	if (!empty($headers)) {
		curl_setopt($ch, CURLOPT_HTTPHEADER, $headers);
	}

	// HTTP Proxy settings. When configured, the trusted proxy controls the
	// ultimate name resolution and must enforce the same egress policy.
	$proxy = defined('PLUGIN_SMIME_PROXY') ? (string) constant('PLUGIN_SMIME_PROXY') : '';
	if ($proxy !== '') {
		curl_setopt($ch, CURLOPT_PROXY, $proxy);
	}
	else {
		// Do not silently inherit HTTP(S)_PROXY from the PHP-FPM environment:
		// a proxy performs its own DNS lookup and would bypass CURLOPT_RESOLVE.
		curl_setopt($ch, CURLOPT_PROXY, '');
	}
	$proxyPort = defined('PLUGIN_SMIME_PROXY_PORT') ? (string) constant('PLUGIN_SMIME_PROXY_PORT') : '';
	if ($proxyPort !== '') {
		curl_setopt($ch, CURLOPT_PROXYPORT, (int) $proxyPort);
	}
	$proxyCredentials = defined('PLUGIN_SMIME_PROXY_USERPWD') ? (string) constant('PLUGIN_SMIME_PROXY_USERPWD') : '';
	if ($proxyCredentials !== '') {
		curl_setopt($ch, CURLOPT_PROXYUSERPWD, $proxyCredentials);
	}

	$result = curl_exec($ch);
	$httpStatus = curl_getinfo($ch, CURLINFO_HTTP_CODE);
	$success = $result !== false && $httpStatus === 200 && $body !== '';
	// PHP 8 uses CurlHandle objects; explicitly release the handle without the
	// PHP 8.5-deprecated curl_close() no-op.
	unset($ch);

	return $success ? $body : false;
}

/**
 * Download certificates from an AIA "CA Issuers" URL (RFC 5280 4.2.2.1).
 *
 * Responses are cached in TMP_PATH/smime, successful downloads for 30 days
 * and failures for one hour to avoid hammering unreachable endpoints.
 * Downloads are capped at 1 MiB, redirects are not followed and private,
 * loopback and link-local destinations are rejected unless
 * PLUGIN_SMIME_AIA_ALLOW_PRIVATE is enabled (internal PKI).
 *
 * @param mixed $url CA Issuers URI
 *
 * @return array list of PEM certificates, empty on failure
 */
function fetchCaIssuerCerts($url) {
	if (!is_string($url)) {
		return [];
	}
	// URLs originate from certificate extensions of unauthenticated mail,
	// keep control characters out of the logs.
	$logUrl = preg_replace('/[^\x20-\x7e]/', '?', $url);

	$cacheDir = (defined('TMP_PATH') ? TMP_PATH : sys_get_temp_dir()) . '/smime';
	$cacheFile = $cacheDir . '/aia-' . hash('sha256', $url) . '.pem';
	$cacheReady = ensureAiaCacheDir($cacheDir);
	if ($cacheReady && is_file($cacheFile) && !is_link($cacheFile)) {
		$age = time() - (int) filemtime($cacheFile);
		$cached = readAiaCacheFile($cacheFile);
		if ($cached !== null && $cached !== '' && $age < 30 * 86400) {
			return extractPemCerts($cached);
		}
		if ($cached === '' && $age < 3600) {
			return [];
		}
	}

	$body = fetchSmimeHttpResource($url);

	$certs = [];
	if ($body === false) {
		error_log(sprintf("[smime] Refused or failed to fetch CA issuer certificate from '%s'", $logUrl));
	}
	else {
		$certs = decodeCaIssuerResponse($body);
		if (empty($certs)) {
			error_log(sprintf("[smime] CA issuer URL '%s' did not return a usable certificate", $logUrl));
		}
	}

	if ($cacheReady) {
		writeAiaCacheFile($cacheDir, $cacheFile, implode("\n", $certs));
	}

	return $certs;
}

/**
 * Complete a signer's certificate chain by downloading missing intermediates
 * through the AIA "CA Issuers" extension. Many senders embed only the
 * end-entity certificate in the p7s (allowed by RFC 8551), in which case
 * OpenSSL cannot build the chain from the message alone.
 *
 * Walks up from the end-entity certificate; issuers already present in
 * $knownCerts are used as-is, missing ones are fetched. Stops at self-signed
 * certificates and after six levels.
 *
 * @param string $signerPem  end-entity certificate in PEM format
 * @param array  $knownCerts intermediate certificates already available (PEM)
 *
 * @return array downloaded certificates (PEM) that belong to the chain
 */
function fetchMissingIntermediates($signerPem, $knownCerts) {
	$fetched = [];
	$pool = [];
	foreach ($knownCerts as $pem) {
		$pool[] = ['pem' => $pem, 'downloaded' => false];
	}

	$findIssuer = function ($issuerDn) use (&$pool) {
		foreach ($pool as $i => $entry) {
			$parsed = @openssl_x509_parse($entry['pem']);
			if ($parsed !== false && certDnString($parsed, 'subject') === $issuerDn) {
				unset($pool[$i]);

				return $entry;
			}
		}

		return null;
	};

	$currentPem = $signerPem;
	for ($depth = 0; $depth < 6; ++$depth) {
		$parsed = @openssl_x509_parse($currentPem);
		if ($parsed === false) {
			break;
		}
		$issuerDn = certDnString($parsed, 'issuer');
		if ($issuerDn === '' || certDnString($parsed, 'subject') === $issuerDn) {
			// Self-signed - chain is complete.
			break;
		}

		$next = $findIssuer($issuerDn);
		if ($next === null) {
			$aia = $parsed['extensions']['authorityInfoAccess'] ?? '';
			if (!preg_match('/CA Issuers - URI:(.*)/', $aia, $matches)) {
				break;
			}
			foreach (fetchCaIssuerCerts(trim($matches[1])) as $pem) {
				$pool[] = ['pem' => $pem, 'downloaded' => true];
			}
			$next = $findIssuer($issuerDn);
			if ($next === null) {
				break;
			}
		}

		if ($next['downloaded']) {
			if (openssl_x509_verify($currentPem, $next['pem']) !== 1) {
				// Served certificate does not actually sign the child.
				break;
			}
			$fetched[] = $next['pem'];
		}
		$currentPem = $next['pem'];
	}

	return $fetched;
}

/**
 * Build the certificate chain represented by a leaf and unordered extra certificates.
 *
 * @param string $certificate leaf certificate
 * @param array  $extracerts  intermediate and root certificates
 *
 * @return array ordered Certificate objects, starting with the leaf
 */
function buildSmimeCertificateChain($certificate, $extracerts) {
	$pubcert = new Certificate($certificate);
	$parent = $pubcert;
	$chain = [$pubcert];
	$remaining = [];
	foreach ($extracerts as $pem) {
		$cert = new Certificate($pem);
		if ($cert->getName() !== $pubcert->getName()) {
			$remaining[] = $cert;
		}
	}
	$changed = true;
	while ($changed && !empty($remaining)) {
		$changed = false;
		foreach ($remaining as $i => $cert) {
			if ($cert->getName() === $parent->getIssuerName()) {
				$parent->setIssuer($cert);
				$parent = $cert;
				$chain[] = $cert;
				unset($remaining[$i]);
				$changed = true;
				break;
			}
		}
	}

	return $chain;
}

/**
 * Check a certificate's OCSP status.
 *
 * For an OCSP request we need the following items:
 * - Client certificate which we need to verify
 * - Issuer certificate (Authority Information Access: Ca Issuers) openssl x509 -in certificate.crt -text
 * - OCSP URL (Authority Information Access: OCSP Url)
 *
 * @param string     $certificate
 * @param array      $extracerts       an array of intermediate certificates
 * @param array      $message          reference to the status message array
 * @param null|array $failedCertificates reference populated with certificates whose OCSP status was unavailable
 *
 * @return bool true when OCSP succeeds or is disabled, false on any OCSP failure
 */
function verifyOCSP($certificate, $extracerts, &$message, &$failedCertificates = null) {
	$failedCertificates = [];
	if (!PLUGIN_SMIME_ENABLE_OCSP) {
		$message['success'] = SMIME_STATUS_SUCCESS;
		$message['info'] = SMIME_OCSP_DISABLED;

		return true;
	}

	$chain = buildSmimeCertificateChain($certificate, $extracerts);

	foreach ($chain as $cert) {
		// Root certificates are trust anchors. Check every certificate below
		// the root so a revoked intermediate cannot validate a leaf.
		if ($cert->getName() !== $cert->getIssuerName()) {
			try {
				$cert->verify();
			}
			catch (OCSPException $e) {
				if ($e->getCode() === OCSP_CERT_STATUS && $e->getCertStatus() === OCSP_CERT_STATUS_REVOKED) {
					$message['info'] = SMIME_REVOKED;
					$message['success'] = SMIME_STATUS_FAIL;

					return false;
				}
				error_log(sprintf("[SMIME] OCSP verification warning: '%s'", $e->getMessage()));
				$failedCertificates[] = $cert;
			}
		}
	}

	if (!empty($failedCertificates) && smimeRevocationFailsClosed()) {
		$message['info'] = SMIME_OCSP_FAILED;
		$message['success'] = SMIME_STATUS_FAIL;

		return false;
	}

	// An inconclusive answer (no responder, no OCSP URL, unreachable) does not
	// invalidate a verified signature unless the administrator opted in.
	$message['info'] = SMIME_SUCCESS;
	$message['success'] = SMIME_STATUS_SUCCESS;

	return true;
}

/**
 * Whether an inconclusive revocation check fails the signature.
 *
 * @return bool
 */
function smimeRevocationFailsClosed() {
	return defined('PLUGIN_SMIME_REVOCATION_FAIL_CLOSED') && PLUGIN_SMIME_REVOCATION_FAIL_CLOSED;
}

/* Validate the certificate of a user, set an error message.
 *
 * @param string $certificate the pkcs#12 cert
 * @param string $passphrase the pkcs#12 passphrase
 * @param string $emailAddress the user's email address (must match certificate email)
 */
function validateUploadedPKCS($certificate, $passphrase, $emailAddress) {
	if (!openssl_pkcs12_read($certificate, $certs, $passphrase)) {
		return [_('Unable to decrypt certificate'), '', '', false];
	}

	$message = '';
	$data = [];
	$privatekey = $certs['pkey'];
	$publickey = $certs['cert'];
	$extracerts = $certs['extracerts'] ?? [];
	$publickeyData = openssl_x509_parse($publickey);
	$imported = false;

	if ($publickeyData !== false) {
		$certEmailAddress = getCertEmail($publickeyData);
		$validFrom = $publickeyData['validFrom_time_t'];
		$validTo = $publickeyData['validTo_time_t'];

		// Validate local key usage without imposing system trust-chain policy at
		// import time. A private key is not valid input for certificate purpose checks.
		$purpose = getCertPurpose($publickey);
		if (!openssl_x509_check_private_key($publickey, $privatekey) ||
			!in_array($purpose, ['sign', 'both'], true)) {
			$message = _('Private key can\'t be used to sign email');
		}
		// Check if the certificate owner matches the grommunio Web users email address
		elseif (!emailMatchesCert((string) $certEmailAddress, (string) $emailAddress)) {
			$message = _('Certificate email address doesn\'t match grommunio Web account ') . $certEmailAddress;
		}
		// Check RSA key size
		elseif (defined('PLUGIN_SMIME_WARN_WEAK_RSA') && PLUGIN_SMIME_WARN_WEAK_RSA) {
			$keyInfo = getKeyTypeInfo($publickey);
			if ($keyInfo['type'] === 'RSA' && $keyInfo['bits'] < (defined('PLUGIN_SMIME_MIN_RSA_BITS') ? PLUGIN_SMIME_MIN_RSA_BITS : 2048)) {
				$message = sprintf(_('RSA key size %d bits is below the recommended minimum of %d bits. Certificate was imported.'), $keyInfo['bits'], PLUGIN_SMIME_MIN_RSA_BITS);
				$imported = true;
			}
			elseif ($keyInfo['type'] === 'Ed25519' && !SmimeCapabilities::getInstance()->supportsEddsa) {
				$message = _('EdDSA (Ed25519) certificates require PHP 8.4+ and may not be fully supported. Certificate was imported.');
				$imported = true;
			}
		}
		// Check if certificate is not expired, still import the certificate since a user wants to decrypt his old email
		if (!$imported && $message === '') {
			if ($validTo < time()) {
				$message = _('Certificate was expired on ') . date('Y-m-d', $validTo) . '. ' . _('Certificate was imported.');
				$imported = true;
			}
			// Check if the certificate is validFrom date is not in the future
			elseif ($validFrom > time()) {
				$message = _('Certificate is not yet valid ') . date('Y-m-d', $validFrom) . '. ' . _('Certificate has not been imported');
			}
			// Allow importing a private certificate even when its revocation status
			// cannot be established; message verification still fails closed.
			elseif (!verifyRevocation($certs['cert'], $extracerts, $data)) {
				if (in_array($data['info'] ?? null, [SMIME_REVOKED, SMIME_CRL_REVOKED], true)) {
					$message = _('Certificate is revoked, but was imported.');
				}
				else {
					$message = _('Certificate revocation status could not be verified. Certificate was imported.');
				}
				$imported = true;
			}
			else {
				$imported = true;
				$message = _('Certificate was imported.');
			}
		}
	}
	else { // Can't parse public certificate pkcs#12 file might be corrupt
		$message = _('Unable to read public certificate');
	}

	return [$message, $publickey, $publickeyData, $imported];
}

/**
 * Get key type information from a certificate or public key.
 *
 * @param OpenSSLCertificate|resource|string $cert PEM certificate or OpenSSL certificate
 *
 * @return array ['type' => 'RSA'|'EC'|'Ed25519'|'unknown', 'bits' => int, 'curve' => string|null]
 */
function getKeyTypeInfo($cert) {
	$result = ['type' => 'unknown', 'bits' => 0, 'curve' => null];

	$pubkey = openssl_pkey_get_public($cert);
	if ($pubkey === false) {
		return $result;
	}

	$details = openssl_pkey_get_details($pubkey);
	if ($details === false) {
		return $result;
	}

	$result['bits'] = $details['bits'] ?? 0;

	switch ($details['type'] ?? -1) {
		case OPENSSL_KEYTYPE_RSA:
			$result['type'] = 'RSA';
			break;

		case OPENSSL_KEYTYPE_EC:
			$result['type'] = 'EC';
			$result['curve'] = $details['ec']['curve_name'] ?? null;
			break;

		default:
			// Check for Ed25519 (type value 6 on some PHP versions)
			if (defined('OPENSSL_KEYTYPE_ED25519') && ($details['type'] ?? -1) === OPENSSL_KEYTYPE_ED25519) {
				$result['type'] = 'Ed25519';
				$result['bits'] = 256;
			}
			break;
	}

	return $result;
}

/**
 * Get Key Usage flags from a certificate.
 *
 * @param string $cert PEM certificate
 *
 * @return array key usage flags as associative array
 */
function getKeyUsage($cert) {
	$parsed = openssl_x509_parse($cert);
	if ($parsed === false || !isset($parsed['extensions']['keyUsage'])) {
		return [];
	}

	$usages = [];
	$raw = $parsed['extensions']['keyUsage'];
	$parts = array_map('trim', explode(',', $raw));
	foreach ($parts as $part) {
		$usages[$part] = true;
	}

	return $usages;
}

/**
 * Get Extended Key Usage OIDs from a certificate.
 *
 * @param string $cert PEM certificate
 *
 * @return array EKU names/OIDs
 */
function getExtendedKeyUsage($cert) {
	$parsed = openssl_x509_parse($cert);
	if ($parsed === false || !isset($parsed['extensions']['extendedKeyUsage'])) {
		return [];
	}

	return array_map('trim', explode(',', $parsed['extensions']['extendedKeyUsage']));
}

/**
 * Determine certificate purpose from Key Usage extension.
 *
 * @param string $cert PEM certificate
 *
 * @return string 'sign', 'encrypt', 'both', or 'unknown'
 */
function getCertPurpose($cert) {
	$ku = getKeyUsage($cert);
	$canSign = isset($ku['Digital Signature']) || isset($ku['Non Repudiation']);
	$canEncrypt = isset($ku['Key Encipherment']) || isset($ku['Key Agreement']);

	if ($canSign && $canEncrypt) {
		return 'both';
	}
	if ($canSign) {
		return 'sign';
	}
	if ($canEncrypt) {
		return 'encrypt';
	}

	// No Key Usage extension or unrecognized — assume dual-purpose
	return empty($ku) ? 'both' : 'unknown';
}

/**
 * Compare email addresses for certificate matching with internationalization support.
 *
 * Per RFC 8550: local-part is case-insensitive for matching purposes,
 * domain is always case-insensitive.
 *
 * @param string $certEmail  email from certificate
 * @param string $userEmail  email to match against
 *
 * @return bool true if emails match
 */
function emailMatchesCert(string $certEmail, string $userEmail): bool {
	return strcasecmp($certEmail, $userEmail) === 0;
}

/**
 * Verify certificate revocation status using OCSP first, then CRL as fallback.
 *
 * @param string $certificate PEM certificate
 * @param array  $extracerts  intermediate certificates
 * @param array  $message     reference to status message array
 *
 * @return bool true if certificate is not revoked (or revocation checking is disabled)
 */
function verifyRevocation($certificate, $extracerts, &$message) {
	// Try OCSP first
	$ocspFailures = [];
	$ocspResult = verifyOCSP($certificate, $extracerts, $message, $ocspFailures);

	// A positive OCSP response for the whole chain is conclusive. If OCSP is
	// disabled or was inconclusive for a certificate, continue into CRL
	// validation when it has been enabled explicitly.
	$crlEnabled = defined('PLUGIN_SMIME_ENABLE_CRL') && PLUGIN_SMIME_ENABLE_CRL;
	if ($ocspResult && (empty($ocspFailures) || !$crlEnabled) && (($message['info'] ?? null) !== SMIME_OCSP_DISABLED || !$crlEnabled)) {
		return true;
	}

	// If OCSP indicates revocation, trust that
	if (isset($message['info']) && $message['info'] === SMIME_REVOKED) {
		return false;
	}

	// OCSP failed/unavailable — try CRL if enabled
	if ($crlEnabled) {
		if (class_exists('CrlManager')) {
			$crlManager = new CrlManager();
			$crlCandidates = $ocspFailures;
			if (($message['info'] ?? null) === SMIME_OCSP_DISABLED) {
				$crlCandidates = array_filter(
					buildSmimeCertificateChain($certificate, $extracerts),
					static function ($cert) {
						return $cert->getName() !== $cert->getIssuerName();
					}
				);
			}
			foreach ($crlCandidates as $pubcert) {
				$revoked = $crlManager->isRevoked($pubcert);

				if ($revoked === true) {
					$message['info'] = SMIME_CRL_REVOKED;
					$message['success'] = SMIME_STATUS_FAIL;

					return false;
				}
				if ($revoked === null && smimeRevocationFailsClosed()) {
					$message['info'] = SMIME_CRL_UNAVAILABLE;
					$message['success'] = SMIME_STATUS_FAIL;

					return false;
				}
			}

			$message['info'] = SMIME_SUCCESS;
			$message['success'] = SMIME_STATUS_SUCCESS;

			return true;
		}
	}

	return $ocspResult;
}

/**
 * Detect if the encryptionstore has a third parameter which sets the expiration.
 *
 * @return bool true if expiration is supported
 */
function encryptionStoreExpirationSupport() {
	$refClass = new ReflectionClass('EncryptionStore');

	return count($refClass->getMethod('add')->getParameters()) === 3;
}

/**
 * Open PHP session if it not open closed. Returns if the session was opened.
 *
 * @param mixed $func
 * @param mixed $sessionOpened
 */
function withPHPSession($func, $sessionOpened = false) {
	if (session_status() === PHP_SESSION_NONE) {
		session_start();
		$sessionOpened = true;
	}

	$func();

	if ($sessionOpened) {
		session_write_close();
	}
}
