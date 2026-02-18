<?php

/**
 * This file contains functions which are used in plugin.smime.php and class.pluginsmimemodule.php and therefore
 * exists here to avoid code-duplication.
 *
 * @param mixed $certificate
 */

/**
 * Function which extracts the email address from a certificate, and tries to get the subjectAltName if
 * subject/emailAddress is not set.
 *
 * @param mixed $certificate certificate data
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
 * @param string   $emailAddress emailaddress to specify
 *
 * @return bool|resource the mapi message containing the private certificate, returns false if no certificate is found
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

	$privateCerts = mapi_table_queryallrows($table, [PR_ENTRYID, PR_SUBJECT, PR_MESSAGE_DELIVERY_TIME, PR_CLIENT_SUBMIT_TIME], $restrict);

	if ($privateCerts && count($privateCerts) > 0) {
		return $privateCerts;
	}

	return false;
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
 * @return mixed collection of certificates, empty if none if decrypting fails or stored private certificate isn't found
 */
function readPrivateCert($store, $passphrase, $singleCert = true) {
	$unlockedCerts = [];
	// Get all private certificates saved in the store
	$privateCerts = getMAPICert($store);
	if (!is_array($privateCerts)) {
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
 * @param string X509 Certificate in DER format
 * @param mixed $certificate
 *
 * @return string X509 Certificate in PEM format
 */
function der2pem($certificate) {
	return "-----BEGIN CERTIFICATE-----\n" . chunk_split(base64_encode((string) $certificate), 64, "\n") . "-----END CERTIFICATE-----\n";
}

/**
 * Function which does an OCSP/CRL check on the certificate to find out if it has been
 * revoked.
 *
 * For an OCSP request we need the following items:
 * - Client certificate which we need to verify
 * - Issuer certificate (Authority Information Access: Ca Issuers) openssl x509 -in certificate.crt -text
 * - OCSP URL (Authority Information Access: OCSP Url)
 *
 * The issuer certificate is fetched once and stored in /var/lib/grommunio-web/tmp/smime
 * We create the directory if it does not exists, check if the certificate is already stored. If it is already
 * stored we, use stat() to determine if it is not very old (> 1 Month) and otherwise fetch the certificate and store it.
 *
 * @param string $certificate
 * @param array  $extracerts  an array of intermediate certificates
 * @param mixed  $message
 *
 * @return bool true is OCSP verification has succeeded or when there is no OCSP support, false if it hasn't
 */
function verifyOCSP($certificate, $extracerts, &$message) {
	if (!PLUGIN_SMIME_ENABLE_OCSP) {
		$message['success'] = SMIME_STATUS_SUCCESS;
		$message['info'] = SMIME_OCSP_DISABLED;

		return true;
	}

	$pubcert = new Certificate($certificate);

	/*
	 * Walk over the provided extra intermediate certificates and setup the
	 * issuer chain.  Certificates inside a PKCS#7 structure are not
	 * guaranteed to be in order, so we iteratively match issuers until the
	 * chain is fully built or no more progress can be made.
	 */
	$parent = $pubcert;
	if (!isset($extracerts) || !is_array($extracerts)) {
		$extracerts = [];
	}
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
				unset($remaining[$i]);
				$changed = true;
				break;
			}
		}
	}

	try {
		$pubcert->verify();
		$issuer = $pubcert->issuer();
		if ($issuer && $issuer->issuer()) {
			$issuer->verify();
		}
	}
	catch (OCSPException $e) {
		if ($e->getCode() === OCSP_CERT_STATUS && $e->getCertStatus() === OCSP_CERT_STATUS_REVOKED) {
			$message['info'] = SMIME_REVOKED;
			$message['success'] = SMIME_STATUS_PARTIAL;

			return false;
		}
		error_log(sprintf("[SMIME] OCSP verification warning: '%s'", $e->getMessage()));
	}

	// Certificate does not support OCSP
	$message['info'] = SMIME_SUCCESS;
	$message['success'] = SMIME_STATUS_SUCCESS;

	return true;
}

/* Validate the certificate of a user, set an error message.
 *
 * @param string $certificate the pkcs#12 cert
 * @param string $passphrase the pkcs#12 passphrase
 * @param string $emailAddres the users email address (must match certificate email)
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

	if ($publickeyData) {
		$certEmailAddress = getCertEmail($publickeyData);
		$validFrom = $publickeyData['validFrom_time_t'];
		$validTo = $publickeyData['validTo_time_t'];

		// Check priv key for signing capabilities
		if (!openssl_x509_checkpurpose($privatekey, X509_PURPOSE_SMIME_SIGN)) {
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
			// We allow users to import private certificate which have no OCSP support
			elseif (!verifyOCSP($certs['cert'], $extracerts, $data)) {
				$message = _('Certificate is revoked, but was imported.');
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
 * @param mixed $cert PEM certificate string or OpenSSL resource
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
 * @param mixed $cert PEM certificate string
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
 * @param mixed $cert PEM certificate string
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
 * @param mixed $cert PEM certificate string
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
	$ocspResult = verifyOCSP($certificate, $extracerts, $message);

	// If OCSP succeeded (good or disabled), return that result
	if ($ocspResult) {
		return true;
	}

	// If OCSP indicates revocation, trust that
	if (isset($message['info']) && $message['info'] === SMIME_REVOKED) {
		return false;
	}

	// OCSP failed/unavailable — try CRL if enabled
	if (defined('PLUGIN_SMIME_ENABLE_CRL') && PLUGIN_SMIME_ENABLE_CRL) {
		if (class_exists('CrlManager')) {
			$crlManager = new CrlManager();
			$pubcert = new Certificate($certificate);
			$revoked = $crlManager->isRevoked($pubcert);

			if ($revoked === true) {
				$message['info'] = SMIME_CRL_REVOKED;
				$message['success'] = SMIME_STATUS_FAIL;

				return false;
			}
			if ($revoked === null) {
				$message['info'] = SMIME_CRL_UNAVAILABLE;
				$message['success'] = SMIME_STATUS_PARTIAL;

				// CRL unavailable is not a hard failure
				return true;
			}
		}
	}

	return $ocspResult;
}

/**
 * Detect if the encryptionstore has a third parameter which sets the expiration.
 *
 * @return {boolean} true is expiration is supported
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
