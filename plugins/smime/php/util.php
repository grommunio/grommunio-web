<?php
/**
 * This file contains functions which are used in plugin.smime.php and class.pluginsmimemodule.php and therefore
 * exists here to avoid code-duplication
 */

/**
 * Function which extracts the email address from a certificate, and tries to get the subjectAltName if
 * subject/emailAddress is not set.
 *
 * @param {Mixed} $certificate certificate data
 */
function getCertEmail($certificate)
{
	$certEmailAddress = "";
	// If subject/emailAddress is not set, try subjectAltName
	if(isset($certificate['subject']['emailAddress'])) {
		$certEmailAddress = $certificate['subject']['emailAddress'];
	} else if(isset($certificate['extensions']) && isset($certificate['extensions']['subjectAltName'])) { 
		// Example [subjectAltName] => email:foo@bar.com
		$tmp = explode('email:', $certificate['extensions']['subjectAltName']);
		// Only get the first match
		if(isset($tmp[1]) && !empty($tmp[1])) {
			$certEmailAddress = $tmp[1];
		}
	}
	return $certEmailAddress;
}

/**
 * Function that will return the private certificate of the user from the user store where it is stored in pkcs#12 format
 * @param {MAPIStore} $store user's store
 * @param {String} $type of message_class.
 * @param {String} $emailAddress emailaddress to specify.
 * @return {MAPIObject} the mapi message containing the private certificate, returns false if no certifcate is found
 *
 */
function getMAPICert($store, $type = 'WebApp.Security.Private', $emailAddress = '')
{
	$root = mapi_msgstore_openentry($store, null);
	$table = mapi_folder_getcontentstable($root, MAPI_ASSOCIATED);

	$restrict = array(RES_PROPERTY,
		array( 
			RELOP => RELOP_EQ,
			ULPROPTAG => PR_MESSAGE_CLASS,
			VALUE => array(PR_MESSAGE_CLASS => $type)
		)
	);
	if($type == 'WebApp.Security.Public' && !empty($emailAddress)) {
		$restrict = array(RES_AND, array(
			$restrict,
			array(RES_CONTENT,
				array(
					FUZZYLEVEL => FL_FULLSTRING | FL_IGNORECASE,
					ULPROPTAG => PR_SUBJECT,
					VALUE => array(PR_SUBJECT => $emailAddress)
				),
			)
		));
	}

	
	// PR_MESSAGE_DELIVERY_TIME validTo / PR_CLIENT_SUBMIT_TIME validFrom
	mapi_table_restrict($table, $restrict, TBL_BATCH);
	mapi_table_sort($table, array(PR_MESSAGE_DELIVERY_TIME => TABLE_SORT_DESCEND), TBL_BATCH);

	$privateCerts = mapi_table_queryallrows($table, array(PR_ENTRYID, PR_SUBJECT, PR_MESSAGE_DELIVERY_TIME, PR_CLIENT_SUBMIT_TIME), $restrict);


	if($privateCerts && count($privateCerts) > 0) {
		return $privateCerts;
	}
	return false;
}

/**
 * Function that will decrypt the private certificate using a supplied password
 * If multiple private certificates can be decrypted with the supplied password,
 * all of them will be returned, if $singleCert == false, otherwise only the first one
 *
 * @param {MAPIStore} $store user's store
 * @param {String} $passphrase passphrase for private certificate
 * @param {boolean} $singleCert if true, returns the first certificate, which was successfully decrypted with $passphrase
 * @return {Mixed} collection of certificates, empty if none if decrypting fails or stored private certificate isn't found
 *
 */
function readPrivateCert($store, $passphrase, $singleCert = true)
{
	$unlockedCerts = array();
	// Get all private certificates saved in the store
	$privateCerts = getMAPICert($store);
	if($singleCert) {
		$privateCerts = array($privateCerts[0]);
	}
	
	// Get messages from certificates
	foreach($privateCerts as $privateCert) {
		$privateCertMessage = mapi_msgstore_openentry($store, $privateCert[PR_ENTRYID]);
		if($privateCertMessage !== false) {
			$pkcs12 = "";
			$certs = array();
			// Read pkcs12 cert from message
			$stream = mapi_openproperty($privateCertMessage, PR_BODY, IID_IStream, 0, 0);
			$stat = mapi_stream_stat($stream);
			mapi_stream_seek($stream, 0, STREAM_SEEK_SET);
			for ($i = 0; $i < $stat['cb']; $i += 1024) {
				$pkcs12 .= mapi_stream_read($stream,1024);
			}
			$ok = openssl_pkcs12_read(base64_decode($pkcs12), $certs, $passphrase);
			if($ok !== false) {
				array_push($unlockedCerts, $certs);
			}
		}
	}
	
	return ($singleCert !== false && count($unlockedCerts) > 0) ? $unlockedCerts[0] : $unlockedCerts;
}

/**
 * Converts X509 DER format string to PEM format
 *
 * @param {string} X509 Certificate in DER format
 * @return {string} X509 Certificate in PEM format
 */
function der2pem($certificate) {
	return "-----BEGIN CERTIFICATE-----\n" . chunk_split(base64_encode($certificate),64,"\n") . "-----END CERTIFICATE-----\n";
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
 * The issuer certificate is fetched once and stored in /var/lib/kopano-webapp/tmp/smime
 * We create the directory if it does not exists, check if the certificate is already stored. If it is already
 * stored we, use stat() to determine if it is not very old (> 1 Month) and otherwise fetch the certificate and store it.
 *
 * @param {String} $certificate
 * @param {Array} $extracerts an array of intermediate certificates
 * @return {Boolean} true is OCSP verification has succeeded or when there is no OCSP support, false if it hasn't
 */
function verifyOCSP($certificate, $extracerts = [], &$message) {
	if (!PLUGIN_SMIME_ENABLE_OCSP) {
		$message['success'] = SMIME_STATUS_SUCCESS;
		$message['info'] = SMIME_OCSP_DISABLED;
		return true;
	}

	$pubcert = new Certificate($certificate);

	/*
	 * Walk over the provided extra intermediate certificates and setup the issuer
	 * chain.
	 */
	$parent = $pubcert;
	while($cert = array_shift($extracerts)) {
		$cert = new Certificate($cert);

		if ($cert->getName() === $pubcert->getName()) {
			continue;
		}

		if ($cert->getName() === $parent->getIssuerName()) {
			$parent->setIssuer($cert);
			$parent = $cert;
		}
	}

	try {
		$pubcert->verify();
		$issuer = $pubcert->issuer();
		if ($issuer->issuer()) {
			$issuer->verify();
		}
	} catch (OCSPException $e) {
		if ($e->getCode() === OCSP_CERT_STATUS && $e->getCertStatus() == OCSP_CERT_STATUS_REVOKED) {
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
function validateUploadedPKCS($certificate, $passphrase, $emailAddress)
{
	if (!openssl_pkcs12_read($certificate, $certs, $passphrase)) {
		return [dgettext('plugin_smime', 'Unable to decrypt certificate'), '', ''];
	}

	$message = '';
	$data = [];
	$privatekey = $certs['pkey'];
	$publickey = $certs['cert'];
	$extracerts = isset($certs['extracerts']) ? $certs['extracerts']: [];
	$publickeyData = openssl_x509_parse($publickey);

	if ($publickeyData) {
		$certEmailAddress = getCertEmail($publickeyData);
		$validFrom = $publickeyData['validFrom_time_t'];
		$validTo = $publickeyData['validTo_time_t'];

		// Check priv key for signing capabilities
		if(!openssl_x509_checkpurpose($privatekey, X509_PURPOSE_SMIME_SIGN)) {
			$message = dgettext('plugin_smime', 'Private key can\'t be used to sign email');
		}
		// Check if the certificate owner matches the WebApp users email address
		else if (strcasecmp($certEmailAddress, $emailAddress) !== 0) {
			$message = dgettext('plugin_smime', 'Certificate email address doesn\'t match WebApp account ') . $certEmailAddress;
		}
		// Check if certificate is not expired, still import the certificate since a user wants to decrypt his old email
		else if($validTo < time()) {
			$message = dgettext('plugin_smime', 'Certificate was expired on ') . date('Y-m-d', $validTo) .  '. ' . dgettext('plugin_smime', 'Certificate has not been imported');
		}
		// Check if the certificate is validFrom date is not in the future
		else if($validFrom > time()) {
			$message = dgettext('plugin_smime', 'Certificate is not yet valid ') . date('Y-m-d', $validFrom) . '. ' . dgettext('plugin_smime', 'Certificate has not been imported');
		}
		// We allow users to import private certificate which have no OCSP support
		else if(!verifyOCSP($certs['cert'], $extracerts, $data)) {
			$message = dgettext('plugin_smime', 'Certificate is revoked');
		}
	} else { // Can't parse public certificate pkcs#12 file might be corrupt
		$message = dgettext('plugin_smime', 'Unable to read public certificate');
	}

	return [$message, $publickey, $publickeyData];
}

/**
 * Detect if the encryptionstore has a third parameter which sets the expiration.
 * Remove when WebApp 3.4.0 is removed.
 * @return {boolean} true is expiration is supported
 */
function encryptionStoreExpirationSupport() {
	$refClass = new ReflectionClass('EncryptionStore');
	return count($refClass->getMethod('add')->getParameters()) === 3;
}

/**
 * Open PHP session if it not open closed. Returns if the session was opened.
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

?>
