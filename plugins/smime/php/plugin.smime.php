<?php

include_once 'util.php';
require_once 'class.certificate.php';
require_once 'class.cmsoperations.php';
require_once 'class.smimecapabilities.php';
require_once 'class.signedattributes.php';

// Green, everything was good
define('SMIME_STATUS_SUCCESS', 0);
// Orange, CA is missing or OCSP is not available
define('SMIME_STATUS_PARTIAL', 1);
// Red, something really went wrong
define('SMIME_STATUS_FAIL', 2);
// Blue, info message
define('SMIME_STATUS_INFO', 3);

define('SMIME_SUCCESS', 0);
define('SMIME_NOPUB', 1);
define('SMIME_CERT_EXPIRED', 2);
define('SMIME_ERROR', 3);
define('SMIME_REVOKED', 4);
define('SMIME_CA', 5);
define('SMIME_DECRYPT_SUCCESS', 6);
define('SMIME_DECRYPT_FAILURE', 7);
define('SMIME_UNLOCK_CERT', 8);
define('SMIME_OCSP_NOSUPPORT', 9);
define('SMIME_OCSP_DISABLED', 10);
define('SMIME_OCSP_FAILED', 11);
define('SMIME_DECRYPT_CERT_MISMATCH', 12);
define('SMIME_USER_DETECT_FAILURE', 13);
define('SMIME_CRL_REVOKED', 14);
define('SMIME_CRL_UNAVAILABLE', 15);
define('SMIME_WEAK_RSA', 16);
define('SMIME_KEY_USAGE_MISMATCH', 17);
define('SMIME_EFAIL_CBC_WARNING', 18);
define('SMIME_SIGNING_TIME_SKEW', 19);

// OpenSSL Error Constants
// openssl_error_string() returns error codes when an operation fails, since we return custom error strings
// in our plugin we keep a list of openssl error codes in these defines
define('OPENSSL_CA_VERIFY_FAIL', '21075075');
define('OPENSSL_RECIPIENT_CERTIFICATE_MISMATCH', '21070073');

class Pluginsmime extends Plugin {
	/**
	 * decrypted/verified message.
	 */
	private $message = [];

	/**
	 * Default MAPI Message Store.
	 */
	private $store;

	/**
	 * Last openssl error string.
	 */
	private $openssl_error = "";

	/**
	 * Cipher name (string). Default from PLUGIN_SMIME_CIPHER_NAME.
	 */
	private string $cipher;

	/**
	 * Digest algorithm name. Default from PLUGIN_SMIME_DIGEST_ALG.
	 */
	private string $digest;

	/**
	 * Whether cipher/digest were overridden by per-message selection.
	 */
	private bool $hasMessageOverride = false;

	/**
	 * CMS operations wrapper.
	 */
	private CmsOperations $cms;

	/**
	 * Called to initialize the plugin and register for hooks.
	 */
	public function init() {
		$this->registerHook('server.core.settings.init.before');
		$this->registerHook('server.util.parse_smime.signed');
		$this->registerHook('server.util.parse_smime.encrypted');
		$this->registerHook('server.module.itemmodule.open.after');
		$this->registerHook('server.core.operations.submitmessage');
		$this->registerHook('server.upload_attachment.upload');
		$this->registerHook('server.module.createmailitemmodule.beforesend');
		$this->registerHook('server.index.load.custom');

		$this->cms = new CmsOperations();
		$this->cipher = $this->resolveCipher();
		$this->digest = defined('PLUGIN_SMIME_DIGEST_ALG') ? PLUGIN_SMIME_DIGEST_ALG : 'sha256';
	}

	/**
	 * Resolve the cipher to use.
	 * Prefers PLUGIN_SMIME_CIPHER_NAME (string), falls back to PLUGIN_SMIME_CIPHER (integer).
	 */
	private function resolveCipher(): string {
		if (defined('PLUGIN_SMIME_CIPHER_NAME')) {
			$name = PLUGIN_SMIME_CIPHER_NAME;
			// Validate GCM availability
			if ($this->cms->isGcmCipher($name) && !$this->cms->supportsAesGcm()) {
				error_log("[smime] AES-GCM cipher '{$name}' not available, falling back to aes-256-cbc");

				return 'aes-256-cbc';
			}

			return $name;
		}

		// Map legacy integer constant to string
		return $this->cms->normalizeCipher(PLUGIN_SMIME_CIPHER);
	}

	/**
	 * Default message store.
	 *
	 * @return object MAPI Message store
	 */
	public function getStore() {
		if (!$this->store) {
			$this->store = $GLOBALS['mapisession']->getDefaultMessageStore();
		}

		return $this->store;
	}

	/**
	 * Process the incoming events that where fired by the client.
	 *
	 * @param string $eventID Identifier of the hook
	 * @param array  $data    Reference to the data of the triggered hook
	 */
	public function execute($eventID, &$data) {
		switch ($eventID) {
			// Register plugin
			case 'server.core.settings.init.before':
				$this->onBeforeSettingsInit($data);
				break;

				// Verify a signed or encrypted message when an email is opened
			case 'server.util.parse_smime.signed':
				$this->onSignedMessage($data);
				break;

			case 'server.util.parse_smime.encrypted':
				$this->onEncrypted($data);
				break;

				// Add S/MIME property, which is send to the client
			case 'server.module.itemmodule.open.after':
				$this->onAfterOpen($data);
				break;

				// Catch uploaded certificate
			case 'server.upload_attachment.upload':
				$this->onUploadCertificate($data);
				break;

				// Sign email before sending
			case 'server.core.operations.submitmessage':
				$this->onBeforeSend($data);
				break;

				// Verify that we have public certificates for all recipients
			case 'server.module.createmailitemmodule.beforesend':
				$this->onCertificateCheck($data);
				break;

			case 'server.index.load.custom':
				if ($data['name'] === 'smime_passphrase') {
					include 'templates/passphrase.tpl.php';

					exit;
				}
				if ($data['name'] === 'smime_passphrasecheck') {
					// No need to do anything, this is just used to trigger
					// the browser's autofill save password dialog.
					exit;
				}
				break;
		}
	}

	/**
	 * Function checks if public certificate exists for all recipients and creates an error
	 * message for the frontend which includes the email address of the missing public
	 * certificates.
	 *
	 * If my own certificate is missing, a different error message is shown which informs the
	 * user that his own public certificate is missing and required for reading encrypted emails
	 * in the 'Sent items' folder.
	 *
	 * @param array $data Reference to the data of the triggered hook
	 */
	public function onCertificateCheck($data) {
		// Extract per-message algorithm preferences before any early return.
		// These are set by the frontend when the user selects from the dropdown.
		$props = $data['action']['props'] ?? [];
		if (!empty($props['smime_digest']) && is_string($props['smime_digest'])) {
			$allowed = ['sha256', 'sha384', 'sha512'];
			if (in_array($props['smime_digest'], $allowed, true)) {
				$this->digest = $props['smime_digest'];
				$this->hasMessageOverride = true;
			}
		}
		if (!empty($props['smime_cipher']) && is_string($props['smime_cipher'])) {
			$allowed = ['aes-256-gcm', 'aes-128-gcm', 'aes-256-cbc', 'aes-128-cbc'];
			if (in_array($props['smime_cipher'], $allowed, true)) {
				$this->cipher = $props['smime_cipher'];
				$this->hasMessageOverride = true;
			}
		}

		$entryid = $data['entryid'];
		// FIXME: unittests, save trigger will pass $entryid is 0 (which will open the root folder and not the message we want)
		if ($entryid === false) {
			return;
		}

		if (!isset($data['action']['props']['smime']) || empty($data['action']['props']['smime'])) {
			return;
		}

		$message = mapi_msgstore_openentry($data['store'], $entryid);
		$module = $data['moduleObject'];
		$data['success'] = true;

		$messageClass = mapi_getprops($message, [PR_MESSAGE_CLASS]);
		$messageClass = $messageClass[PR_MESSAGE_CLASS];
		if ($messageClass !== 'IPM.Note.SMIME' &&
			$messageClass !== 'IPM.Note.SMIME.SignedEncrypt' &&
			$messageClass !== 'IPM.Note.deferSMIME' &&
			$messageClass !== 'IPM.Note.deferSMIME.SignedEncrypt') {
			return;
		}

		$recipients = $data['action']['props']['smime'];
		$missingCerts = [];

		foreach ($recipients as $recipient) {
			$email = $recipient['email'];

			if (!$this->pubcertExists($email, $recipient['internal'])) {
				array_push($missingCerts, $email);
			}
		}

		if (empty($missingCerts)) {
			return;
		}

		$missingMyself = function ($email) {
			return strcasecmp($GLOBALS['mapisession']->getSMTPAddress(), $email) === 0;
		};

		if (array_filter($missingCerts, $missingMyself) === []) {
			$errorMsg = _('Missing public certificates for the following recipients: ') . implode(', ', $missingCerts) . _('. Please contact your system administrator for details');
		}
		else {
			$errorMsg = _("Your public certificate is not installed. Without this certificate, you will not be able to read encrypted messages you have sent to others.");
		}

		$module->sendFeedback(false, ["type" => ERROR_GENERAL, "info" => ['display_message' => $errorMsg]]);
		$data['success'] = false;
	}

	/**
	 * Function which verifies a message.
	 *
	 * TODO: Clean up flow
	 *
	 * @param mixed $message
	 * @param mixed $eml
	 */
	public function verifyMessage($message, $eml) {
		$userProps = mapi_getprops($message, [PR_SENT_REPRESENTING_ENTRYID, PR_SENT_REPRESENTING_NAME]);
		$tmpUserCert = $this->createTempFile('smime_cert_');
		$tmpMessageFile = $this->createTempFile('smime_msg_');
		$tmpOutCert = $this->createTempFile('smime_out_');

		file_put_contents($tmpMessageFile, $eml);

		// Extract algorithm details for display in the frontend
		$algos = $this->extractCmsAlgorithms($tmpMessageFile);
		if (!empty($algos)) {
			$this->message['algorithms'] = $algos;
		}

		[$fromGAB, $availableCerts] = $this->collectGabCertificate($userProps);

		if (!$fromGAB && isset($GLOBALS['operations'])) {
			$emailAddr = $this->resolveSenderEmail($message, $userProps);
			if (!empty($emailAddr)) {
				$availableCerts = array_merge($availableCerts, $this->getUserStoreCertificates($emailAddr));
			}
		}

		try {
			$verification = $this->verifyUsingCertificates($availableCerts, $tmpMessageFile, $tmpOutCert, $tmpUserCert);
			if ($verification['status'] === 'retry') {
				$verification = $this->verifyUsingMessageCertificate($tmpMessageFile, $tmpOutCert);
			}

			if ($verification['status'] === 'import' && !$fromGAB && !empty($verification['parsedImportCert'])) {
				$this->importVerifiedCertificate($verification['importCert'], $verification['parsedImportCert']);
			}
		}
		finally {
			$this->cleanupTempFiles([$tmpOutCert, $tmpMessageFile, $tmpUserCert]);
		}
	}

	/**
	 * Retrieve public certificate from the GAB when available for the sender.
	 *
	 * @param array $userProps sender related MAPI properties
	 *
	 * @return array two-element array with GAB flag and certificate list
	 */
	private function collectGabCertificate(array $userProps) {
		$certificates = [];
		$fromGAB = false;

		if (!isset($userProps[PR_SENT_REPRESENTING_ENTRYID])) {
			return [$fromGAB, $certificates];
		}

		try {
			$user = mapi_ab_openentry($GLOBALS['mapisession']->getAddressbook(), $userProps[PR_SENT_REPRESENTING_ENTRYID]);
			$gabCert = $this->getGABCert($user);
			if (!empty($gabCert)) {
				$fromGAB = true;
				$certificates[] = $gabCert;
			}
		}
		catch (MAPIException $exception) {
			$exception->setHandled();
			$msg = "[smime] Unable to open PR_SENT_REPRESENTING_ENTRYID. Maybe %s does not exist or was deleted from server.";
			Log::write(LOGLEVEL_ERROR, sprintf($msg, $userProps[PR_SENT_REPRESENTING_NAME] ?? ''));
			error_log("[smime] Unable to open PR_SENT_REPRESENTING_NAME: " . var_export($userProps[PR_SENT_REPRESENTING_NAME] ?? null, true));
			$this->message['success'] = SMIME_NOPUB;
			$this->message['info'] = SMIME_USER_DETECT_FAILURE;
		}

		return [$fromGAB, $certificates];
	}

	/**
	 * Derive sender SMTP address through message or fallback properties.
	 *
	 * @param mixed $message   MAPI message resource
	 * @param array $userProps sender related MAPI properties
	 *
	 * @return null|string SMTP address when resolved, null otherwise
	 */
	private function resolveSenderEmail($message, array $userProps) {
		$senderAddressArray = $this->getSenderAddress($message);
		$senderProps = $senderAddressArray['props'] ?? [];
		$addressType = $senderProps['address_type'] ?? '';
		$emailAddr = '';

		if ($addressType === 'SMTP') {
			$emailAddr = $senderProps['email_address'] ?? '';
		}
		else {
			$emailAddr = $senderProps['smtp_address'] ?? '';
		}

		if (!empty($emailAddr)) {
			return $emailAddr;
		}

		if (!empty($userProps[PR_SENT_REPRESENTING_NAME])) {
			return $userProps[PR_SENT_REPRESENTING_NAME];
		}

		$searchKeys = mapi_getprops($message, [PR_SEARCH_KEY, PR_SENT_REPRESENTING_SEARCH_KEY]);
		$searchKey = $searchKeys[PR_SEARCH_KEY] ?? $searchKeys[PR_SENT_REPRESENTING_SEARCH_KEY] ?? null;
		if ($searchKey) {
			$parts = explode(':', (string) $searchKey, 2);
			if (count($parts) === 2) {
				return trim(strtolower($parts[1]));
			}
		}

		return null;
	}

	/**
	 * Fetch and decode public certificates stored in the user store for an address.
	 *
	 * @param string $emailAddr SMTP address of the sender
	 *
	 * @return array list of decoded certificates
	 */
	private function getUserStoreCertificates($emailAddr) {
		$userCerts = (array) $this->getPublicKey($emailAddr, true);
		if ($userCerts === []) {
			return [];
		}

		$decoded = [];
		foreach ($userCerts as $cert) {
			$decodedCert = base64_decode((string) $cert);
			if (!empty($decodedCert)) {
				$decoded[] = $decodedCert;
			}
		}

		return $decoded;
	}

	/**
	 * Attempt verification using certificates already known to the system.
	 *
	 * @param array  $certs       candidate certificates in PEM format
	 * @param string $messageFile temporary file containing the message payload
	 * @param string $outCertFile temporary file to receive the extracted certificate
	 * @param string $tmpUserCert temporary file for passing certificates to OpenSSL
	 *
	 * @return array verification result metadata
	 */
	private function verifyUsingCertificates(array $certs, $messageFile, $outCertFile, $tmpUserCert) {
		if (empty($certs)) {
			return ['status' => 'retry', 'importCert' => null, 'parsedImportCert' => null, 'caCerts' => null];
		}

		$caBundle = explode(';', PLUGIN_SMIME_CACERTS);
		$caCerts = $this->extractCAs($messageFile);

		// Collect intermediate certificates so OpenSSL can build the full
		// chain even with PKCS7_NOINTERN (which excludes message-embedded
		// certificates).
		$intermediatesPem = '';
		if (!empty($caCerts)) {
			$intermediatesPem = "\n" . implode("\n", $caCerts);
		}

		foreach ($certs as $cert) {
			if (empty($cert)) {
				continue;
			}

			file_put_contents($tmpUserCert, $cert . $intermediatesPem);
			$this->clear_openssl_error();
			$signedOk = $this->cms->verify($messageFile, PKCS7_NOINTERN, $outCertFile, $caBundle, $tmpUserCert);
			$opensslError = $this->extract_openssl_error();
			$this->validateSignedMessage($signedOk, $opensslError);

			if (!$signedOk || $opensslError === OPENSSL_CA_VERIFY_FAIL) {
				continue;
			}

			$importCert = file_get_contents($outCertFile);
			if ($importCert === false || $importCert === '') {
				continue;
			}

			$parsedImport = openssl_x509_parse($importCert);
			$parsedUser = openssl_x509_parse($cert);
			if (
				$parsedImport !== false &&
				$parsedUser !== false &&
				($parsedImport['validTo_time_t'] ?? 0) > ($parsedUser['validTo_time_t'] ?? 0) &&
				($parsedImport['validFrom_time_t'] ?? 0) > ($parsedUser['validFrom_time_t'] ?? 0) &&
				strcasecmp(getCertEmail($parsedImport), getCertEmail($parsedUser)) === 0 &&
				verifyOCSP($importCert, $caCerts, $this->message)
			) {
				return [
					'status' => 'import',
					'importCert' => $importCert,
					'parsedImportCert' => $parsedImport,
					'caCerts' => $caCerts,
				];
			}

			verifyOCSP($cert, $caCerts, $this->message);

			return ['status' => 'skip', 'importCert' => null, 'parsedImportCert' => null, 'caCerts' => $caCerts];
		}

		return ['status' => 'retry', 'importCert' => null, 'parsedImportCert' => null, 'caCerts' => null];
	}

	/**
	 * Fallback verification that relies on the certificate bundled with the message.
	 * Performs full signature and CA chain verification (flags=0).
	 *
	 * @param string $messageFile temporary file containing the message payload
	 * @param string $outCertFile temporary file for certificate extraction
	 *
	 * @return array verification result metadata
	 */
	private function verifyUsingMessageCertificate($messageFile, $outCertFile) {
		$caBundle = explode(';', PLUGIN_SMIME_CACERTS);
		$this->clear_openssl_error();
		$signedOk = $this->cms->verify($messageFile, 0, $outCertFile, $caBundle);
		$opensslError = $this->extract_openssl_error();
		$this->validateSignedMessage($signedOk, $opensslError);

		if (!$signedOk || $opensslError === OPENSSL_CA_VERIFY_FAIL) {
			$this->handleMissingPublicKey();

			return ['status' => 'skip', 'importCert' => null, 'parsedImportCert' => null, 'caCerts' => null];
		}

		$importCert = file_get_contents($outCertFile);
		if ($importCert === false || $importCert === '') {
			return ['status' => 'skip', 'importCert' => null, 'parsedImportCert' => null, 'caCerts' => null];
		}

		$parsedImport = openssl_x509_parse($importCert);
		$caCerts = $this->extractCAs($messageFile);

		if ($parsedImport === false || !verifyOCSP($importCert, $caCerts, $this->message)) {
			return ['status' => 'skip', 'importCert' => null, 'parsedImportCert' => null, 'caCerts' => $caCerts];
		}

		return ['status' => 'import', 'importCert' => $importCert, 'parsedImportCert' => $parsedImport, 'caCerts' => $caCerts];
	}

	/**
	 * Import a verified certificate into the user store with force-overwrite semantics.
	 *
	 * @param string $rawCertificate    certificate body in PEM format
	 * @param array  $parsedCertificate parsed certificate meta data from OpenSSL
	 */
	private function importVerifiedCertificate($rawCertificate, array $parsedCertificate) {
		$certEmail = getCertEmail($parsedCertificate);
		if (!empty($certEmail)) {
			$this->importCertificate($rawCertificate, $parsedCertificate, 'public', true);
		}
	}

	/**
	 * Record diagnostics when a message cannot be verified due to missing keys.
	 */
	private function handleMissingPublicKey() {
		Log::write(LOGLEVEL_INFO, sprintf("[smime] Unable to verify message without public key, openssl error: '%s'", $this->openssl_error));
		$this->message['success'] = SMIME_STATUS_FAIL;
		$this->message['info'] = SMIME_CA;
	}

	/**
	 * Remove temporary files with defensive existence checks.
	 *
	 * @param array $paths paths scheduled for cleanup
	 */
	private function cleanupTempFiles(array $paths) {
		foreach ($paths as $path) {
			if (is_string($path) && $path !== '' && file_exists($path) && !unlink($path)) {
				Log::write(LOGLEVEL_WARN, sprintf('[smime] Failed to remove temporary file %s', $path));
			}
		}
	}

	/**
	 * Create a unique temp file using the supplied prefix.
	 *
	 * @param string $prefix file name prefix
	 *
	 * @return string path to the created temp file
	 */
	private function createTempFile($prefix) {
		return tempnam(sys_get_temp_dir(), $prefix);
	}

	/**
	 * Detect if raw DER data is an AuthEnvelopedData structure (AES-GCM).
	 *
	 * AuthEnvelopedData OID: 1.2.840.113549.1.9.16.1.23
	 * DER encoding of this OID: 06 0B 2A 86 48 86 F7 0D 01 09 10 01 17
	 *
	 * @param string $derData raw DER binary
	 *
	 * @return bool true if AuthEnvelopedData
	 */
	private function isAuthEnvelopedData(string $derData): bool {
		// AuthEnvelopedData OID in DER: 2a 86 48 86 f7 0d 01 09 10 01 17
		$authEnvOid = "\x06\x0B\x2A\x86\x48\x86\xF7\x0D\x01\x09\x10\x01\x17";

		return str_contains($derData, $authEnvOid);
	}

	public function join_xph(&$prop, $msg) {
		$a = mapi_getprops($msg, [PR_TRANSPORT_MESSAGE_HEADERS]);
		$a = $a === false ? "" : ($a[PR_TRANSPORT_MESSAGE_HEADERS] ?? "");
		$prop[PR_TRANSPORT_MESSAGE_HEADERS] =
			"# Outer headers:\n" . ($prop[PR_TRANSPORT_MESSAGE_HEADERS] ?? "") .
			"# Inner headers:\n" . $a;
	}

	/**
	 * Function which decrypts an encrypted message.
	 * The key should be unlocked and stored in the EncryptionStore for a successful decrypt
	 * If the key isn't in the session, we give the user a message to unlock his certificate.
	 *
	 * @param mixed $data array of data from hook
	 */
	public function onEncrypted($data) {
		// Cert unlocked, decode message
		$this->message['success'] = SMIME_STATUS_INFO;
		$this->message['info'] = SMIME_DECRYPT_FAILURE;

		$this->message['type'] = 'encrypted';
		$encryptionStore = EncryptionStore::getInstance();
		$pass = $encryptionStore->get('smime');

		$tmpFile = $this->createTempFile('smime_enc_');
		// Write mime header. Because it's not provided in the attachment, otherwise openssl won't parse it.
		// Detect AuthEnvelopedData (AES-GCM) by checking OID in raw DER data.
		$isAuthEnveloped = $this->isAuthEnvelopedData($data['data']);
		$smimeType = $isAuthEnveloped ? 'authEnveloped-data' : 'enveloped-data';
		$fp = fopen($tmpFile, 'w');
		fwrite($fp, "Content-Type: application/pkcs7-mime; name=\"smime.p7m\"; smime-type={$smimeType}\n");
		fwrite($fp, "Content-Transfer-Encoding: base64\nContent-Disposition: attachment; filename=\"smime.p7m\"\n");
		fwrite($fp, "Content-Description: S/MIME Encrypted Message\n\n");
		fwrite($fp, chunk_split(base64_encode((string) $data['data']), 72) . "\n");
		fclose($fp);

		// Extract algorithm details for display in the frontend
		$algos = $this->extractCmsAlgorithms($tmpFile);
		if (!empty($algos)) {
			$this->message['algorithms'] = $algos;
		}

		// Detect opaque-signed messages (signed-data) arriving through
		// the encrypted hook.  Both opaque-signed and encrypted use the
		// same IPM.Note.SMIME message class, but only signed-data can
		// be processed by openssl_pkcs7_verify.
		$opaqueMsg = $this->createTempFile('smime_opaque_');
		$opaqueCert = $this->createTempFile('smime_opcert_');
		$isOpaqueSigned = $this->cms->verify($tmpFile, PKCS7_NOVERIFY, $opaqueCert, [], $opaqueCert, $opaqueMsg);
		$opaqueContent = ($isOpaqueSigned === true) ? file_get_contents($opaqueMsg) : '';
		$this->cleanupTempFiles([$opaqueMsg, $opaqueCert]);

		if ($isOpaqueSigned === true && !empty($opaqueContent)) {
			$this->message['type'] = 'signed';
			$copyProps = mapi_getprops($data['message'], [PR_MESSAGE_DELIVERY_TIME, PR_SENDER_ENTRYID, PR_SENT_REPRESENTING_ENTRYID, PR_TRANSPORT_MESSAGE_HEADERS]);
			mapi_inetmapi_imtomapi(
				$GLOBALS['mapisession']->getSession(),
				$data['store'],
				$GLOBALS['mapisession']->getAddressbook(),
				$data['message'],
				$opaqueContent,
				['parse_smime_signed' => true]
			);
			$this->join_xph($copyProps, $data['message']);
			mapi_setprops($data['message'], $copyProps);

			$eml = file_get_contents($tmpFile);
			$this->cleanupTempFiles([$tmpFile]);
			$this->verifyMessage($data['message'], $eml);

			return;
		}

		if (isset($pass) && !empty($pass)) {
			$certs = readPrivateCert($this->getStore(), $pass, false);
			// create random file for saving the encrypted and body message
			$tmpDecrypted = $this->createTempFile('smime_dec_');

			$decryptStatus = false;
			// If multiple private certs were decrypted with supplied password
			if (!isset($certs['cert']) && !empty($certs)) {
				foreach ($certs as $cert) {
					$this->clear_openssl_error();
					$decryptStatus = $this->cms->decrypt($tmpFile, $tmpDecrypted, $cert['cert'], [$cert['pkey'], $pass]);
					if ($decryptStatus !== false) {
						break;
					}
				}
			}
			elseif (isset($certs['cert'])) {
				$this->clear_openssl_error();
				$decryptStatus = $this->cms->decrypt($tmpFile, $tmpDecrypted, $certs['cert'], [$certs['pkey'], $pass]);
			}

			$ossl_error = $this->extract_openssl_error();
			$content = file_get_contents($tmpDecrypted);
			if ($content === false) {
				$content = '';
			}
			// Handle OL empty body Outlook Signed & Encrypted mails.
			// The S/MIME plugin has to extract the body from the signed message.
			// Keep the original decrypted EML for signature verification,
			// since the extraction below replaces $content with the
			// unwrapped body that no longer contains 'signed-data'.
			$signedEml = '';
			if (str_contains($content, 'signed-data')) {
				$this->message['type'] = 'encryptsigned';
				$signedEml = $content;
				$olcert = $this->createTempFile('smime_olcert_');
				$olmsg = $this->createTempFile('smime_olmsg_');
				$this->cms->verify($tmpDecrypted, PKCS7_NOVERIFY, $olcert);
				$this->cms->verify($tmpDecrypted, PKCS7_NOVERIFY, $olcert, [], $olcert, $olmsg);
				$content = file_get_contents($olmsg);
				if ($content === false) {
					$content = '';
				}
				$this->cleanupTempFiles([$olmsg, $olcert]);
			}

			$copyProps = mapi_getprops($data['message'], [PR_MESSAGE_DELIVERY_TIME, PR_SENDER_ENTRYID, PR_SENT_REPRESENTING_ENTRYID, PR_TRANSPORT_MESSAGE_HEADERS]);
			mapi_inetmapi_imtomapi($GLOBALS['mapisession']->getSession(), $data['store'], $GLOBALS['mapisession']->getAddressbook(), $data['message'], $content, ['parse_smime_signed' => true]);
			$this->join_xph($copyProps, $data['message']);
			// Manually set time back to the received time, since mapi_inetmapi_imtomapi overwrites this
			mapi_setprops($data['message'], $copyProps);

			// remove temporary files
			$this->cleanupTempFiles([$tmpFile, $tmpDecrypted]);

			// mapi_inetmapi_imtomapi removes the PR_MESSAGE_CLASS = 'IPM.Note.SMIME.MultipartSigned'
			// So we need to check if the message was also signed by looking at the MIME_TAG in the eml
			if (str_contains($content, 'multipart/signed') || str_contains($content, 'signed-data')) {
				$this->message['type'] = 'encryptsigned';
				$this->verifyMessage($data['message'], $content);
			}
			elseif (!empty($signedEml)) {
				$this->verifyMessage($data['message'], $signedEml);
			}
			elseif ($decryptStatus) {
				$this->message['info'] = SMIME_DECRYPT_SUCCESS;
				$this->message['success'] = SMIME_STATUS_SUCCESS;
				// EFAIL mitigation: warn when CBC-mode encryption was used
				if (!$isAuthEnveloped) {
					$this->message['efail_warning'] = true;
				}
			}
			elseif ($ossl_error === OPENSSL_RECIPIENT_CERTIFICATE_MISMATCH) {
				error_log("[smime] Error when decrypting email, openssl error: " . print_r($this->openssl_error, true));
				Log::Write(LOGLEVEL_ERROR, sprintf("[smime] Error when decrypting email, openssl error: '%s'", $this->openssl_error));
				$this->message['info'] = SMIME_DECRYPT_CERT_MISMATCH;
				$this->message['success'] = SMIME_STATUS_FAIL;
			}
		}
		else {
			// Opaque-signed messages are normally caught by the early
			// detection above.  This branch acts as a defensive
			// fallback and handles the encrypted-without-passphrase
			// case ("unlock cert").
			$msg = $this->createTempFile('smime_fallback_');
			$ret = $this->cms->verify($tmpFile, PKCS7_NOVERIFY, null, [], null, $msg);
			$content = file_get_contents($msg);
			$eml = file_get_contents($tmpFile);
			$this->cleanupTempFiles([$tmpFile, $msg]);
			if ($ret === true && !empty($content)) {
				$copyProps = mapi_getprops($data['message'], [PR_MESSAGE_DELIVERY_TIME, PR_SENDER_ENTRYID, PR_SENT_REPRESENTING_ENTRYID, PR_TRANSPORT_MESSAGE_HEADERS]);
				mapi_inetmapi_imtomapi(
					$GLOBALS['mapisession']->getSession(),
					$data['store'],
					$GLOBALS['mapisession']->getAddressbook(),
					$data['message'],
					$content,
					['parse_smime_signed' => true]
				);
				$this->join_xph($copyProps, $data['message']);
				mapi_setprops($data['message'], $copyProps);
				$this->message['type'] = 'signed';
				$this->verifyMessage($data['message'], $eml);
			}
			else {
				$this->message['info'] = SMIME_UNLOCK_CERT;
			}
		}

		if (!encryptionStoreExpirationSupport()) {
			withPHPSession(function () use ($encryptionStore) {
				$encryptionStore->add('smime', '');
			});
		}
	}

	/**
	 * Function which calls verifyMessage to verify if the message isn't malformed during transport.
	 *
	 * @param mixed $data array of data from hook
	 */
	public function onSignedMessage($data) {
		$this->message['type'] = 'signed';
		$this->verifyMessage($data['message'], $data['data']);
	}

	/**
	 * General function which parses the openssl_pkcs7_verify return value and the errors generated by
	 * openssl_error_string().
	 *
	 * @param mixed $openssl_return
	 * @param mixed $openssl_errors
	 */
	public function validateSignedMessage($openssl_return, $openssl_errors) {
		if ($openssl_return === -1) {
			$this->message['info'] = SMIME_ERROR;
			$this->message['success'] = SMIME_STATUS_FAIL;

			return;
			// Verification was successful
		}
		if ($openssl_return) {
			$this->message['info'] = SMIME_SUCCESS;
			$this->message['success'] = SMIME_STATUS_SUCCESS;

			return;
			// Verification was not successful, display extra information.
		}
		$this->message['success'] = SMIME_STATUS_FAIL;
		if ($openssl_errors === OPENSSL_CA_VERIFY_FAIL) {
			$this->message['info'] = SMIME_CA;
		}
		else { // Catch general errors
			$this->message['info'] = SMIME_ERROR;
		}
	}

	/**
	 * Set smime key in $data array, which is send back to client
	 * Since we can't create this array key in the hooks:
	 * 'server.util.parse_smime.signed'
	 * 'server.util.parse_smime.encrypted'.
	 *
	 * TODO: investigate if we can move away from this hook
	 *
	 * @param mixed $data
	 */
	public function onAfterOpen($data) {
		if (isset($this->message) && !empty($this->message)) {
			$data['data']['item']['props']['smime'] = $this->message;
		}
	}

	/**
	 * Handles the uploaded certificate in the settingsmenu in grommunio Web
	 * - Opens the certificate with provided passphrase
	 * - Checks if it can be used for signing/decrypting
	 * - Verifies that the email address is equal to the
	 * - Verifies that the certificate isn't expired and inform user.
	 *
	 * @param mixed $data
	 */
	public function onUploadCertificate($data) {
		if ($data['sourcetype'] !== 'certificate') {
			return;
		}
		$passphrase = $_POST['passphrase'];
		$saveCert = false;
		$tmpname = $data['tmpname'];
		$message = '';
		$imported = false;

		$certificate = file_get_contents($tmpname);
		$emailAddress = $GLOBALS['mapisession']->getSMTPAddress();
		[$message, $publickey, $publickeyData, $imported] = validateUploadedPKCS($certificate, $passphrase, $emailAddress);

		// All checks completed successful
		// Store private cert in users associated store (check for duplicates)
		if ($imported) {
			$certMessage = getMAPICert($this->getStore());
			// TODO: update to serialNumber check
			if ($certMessage && $certMessage[0][PR_MESSAGE_DELIVERY_TIME] === $publickeyData['validTo_time_t']) {
				$message = _('Certificate is already stored on the server');
			}
			else {
				$saveCert = true;
				$root = mapi_msgstore_openentry($this->getStore());
				// Remove old certificate
				/*
				if($certMessage) {
					// Delete private key
					mapi_folder_deletemessages($root, array($certMessage[PR_ENTRYID]));

					// Delete public key
					$pubCert = getMAPICert($this->getStore, 'WebApp.Security.Public', getCertEmail($certMessage));
					if($pubCert) {
						mapi_folder_deletemessages($root, array($pubCert[PR_ENTRYID]));
					}
					$message = _('New certificate uploaded');
				} else {
					$message = _('Certificate uploaded');
				}*/

				$this->importCertificate($certificate, $publickeyData, 'private');

				// Check if the user has a public key in the GAB.
				$store_props = mapi_getprops($this->getStore(), [PR_USER_ENTRYID]);
				$user = mapi_ab_openentry($GLOBALS['mapisession']->getAddressbook(), $store_props[PR_USER_ENTRYID]);

				$this->importCertificate($publickey, $publickeyData, 'public', true);
			}
		}

		$returnfiles = [];
		$returnfiles[] = [
			'props' => [
				'attach_num' => -1,
				'size' => $data['size'],
				'name' => $data['name'],
				'cert' => $saveCert,
				'cert_warning' => $message,
			],
		];
		$data['returnfiles'] = $returnfiles;
	}

	/**
	 * This function handles the 'beforesend' hook which is triggered before sending the email.
	 * If the PR_MESSAGE_CLASS is set to a signed email (IPM.Note.SMIME.Multipartsigned), this function
	 * will convert the mapi message to RFC822, sign the eml and attach the signed email to the mapi message.
	 *
	 * @param mixed $data from php hook
	 */
	public function onBeforeSend(&$data) {
		$store = $data['store'];
		$message = $data['message'];

		// Retrieve message class
		$props = mapi_getprops($message, [PR_MESSAGE_CLASS]);
		$messageClass = $props[PR_MESSAGE_CLASS];

		if (!isset($messageClass)) {
			return;
		}
		if (!class_match_prefix($messageClass, "IPM.Note.deferSMIME") &&
		    !class_match_prefix($messageClass, "IPM.Note.SMIME"))
			return;

		// Apply user settings as fallback when no per-message override was set
		// by onCertificateCheck (e.g. for sign-only messages).
		if (!$this->hasMessageOverride && isset($GLOBALS['settings'])) {
			$userDigest = $GLOBALS['settings']->get('zarafa/v1/plugins/smime/default_digest');
			$userCipher = $GLOBALS['settings']->get('zarafa/v1/plugins/smime/default_cipher');
			$allowedDigests = ['sha256', 'sha384', 'sha512'];
			$allowedCiphers = ['aes-256-gcm', 'aes-128-gcm', 'aes-256-cbc', 'aes-128-cbc'];
			if ($userDigest && in_array($userDigest, $allowedDigests, true)) {
				$this->digest = $userDigest;
			}
			if ($userCipher && in_array($userCipher, $allowedCiphers, true)) {
				$this->cipher = $userCipher;
			}
		}

		// FIXME: for now return when we are going to sign but we don't have the passphrase set
		// This should never happen sign
		$encryptionStore = EncryptionStore::getInstance();
		if (($messageClass === 'IPM.Note.deferSMIME.SignedEncrypt' ||
			$messageClass === 'IPM.Note.deferSMIME.MultipartSigned' ||
			$messageClass === 'IPM.Note.SMIME.SignedEncrypt' ||
			$messageClass === 'IPM.Note.SMIME.MultipartSigned') &&
			!$encryptionStore->get('smime')) {
			return;
		}
		// Temporarily set IPM.Note so mapi_inetmapi_imtoinet produces
		// a plain RFC822 stream.  Restore on failure.
		$origMessageClass = $messageClass;
		mapi_setprops($message, [PR_MESSAGE_CLASS => 'IPM.Note']);
		mapi_savechanges($message);

		// Read the message as RFC822-formatted e-mail stream.
		$emlMessageStream = mapi_inetmapi_imtoinet($GLOBALS['mapisession']->getSession(), $GLOBALS['mapisession']->getAddressbook(), $message, []);

		// Remove all attachments, since they are stored in the attached signed message
		$atable = mapi_message_getattachmenttable($message);
		$rows = mapi_table_queryallrows($atable, [PR_ATTACH_MIME_TAG, PR_ATTACH_NUM]);
		foreach ($rows as $row) {
			$attnum = $row[PR_ATTACH_NUM];
			mapi_message_deleteattach($message, $attnum);
		}

		// create temporary files
		$tmpSendEmail = $this->createTempFile('smime_send_');
		$tmpSendSmimeEmail = $this->createTempFile('smime_out_');

		// Save message stream to a file
		$stat = mapi_stream_stat($emlMessageStream);

		$fhandle = fopen($tmpSendEmail, 'w');
		$buffer = null;
		for ($i = 0; $i < $stat["cb"]; $i += BLOCK_SIZE) {
			// Write stream
			$buffer = mapi_stream_read($emlMessageStream, BLOCK_SIZE);
			fwrite($fhandle, $buffer, strlen($buffer));
		}
		fclose($fhandle);

		// Create attachment for S/MIME message
		$signedAttach = mapi_message_createattach($message);
		$smimeProps = [
			PR_ATTACH_LONG_FILENAME => 'smime.p7m',
			PR_DISPLAY_NAME => 'smime.p7m',
			PR_ATTACH_METHOD => ATTACH_BY_VALUE,
			PR_ATTACH_MIME_TAG => 'multipart/signed',
			PR_ATTACHMENT_HIDDEN => true,
		];

		$tmpExtra = [];
		$ok = false;
		// Sign then Encrypt email
		switch ($messageClass) {
			case 'IPM.Note.deferSMIME.SignedEncrypt':
			case 'IPM.Note.SMIME.SignedEncrypt':
				$tmpFile = $this->createTempFile('smime_se_');
				$tmpExtra[] = $tmpFile;
				$ok = $this->sign($tmpSendEmail, $tmpFile, $message, $signedAttach, $smimeProps);
				if ($ok !== false) {
					$ok = $this->encrypt($tmpFile, $tmpSendSmimeEmail, $message, $signedAttach, $smimeProps);
				}
				break;

			case 'IPM.Note.deferSMIME.MultipartSigned':
			case 'IPM.Note.SMIME.MultipartSigned':
				$ok = $this->sign($tmpSendEmail, $tmpSendSmimeEmail, $message, $signedAttach, $smimeProps);
				break;

			case 'IPM.Note.deferSMIME':
			case 'IPM.Note.SMIME':
				$ok = $this->encrypt($tmpSendEmail, $tmpSendSmimeEmail, $message, $signedAttach, $smimeProps);
				break;
		}

		if ($ok === false) {
			mapi_setprops($message, [PR_MESSAGE_CLASS => $origMessageClass]);
			mapi_savechanges($message);
			$this->cleanupTempFiles(array_merge([$tmpSendEmail, $tmpSendSmimeEmail], $tmpExtra));

			return;
		}

		// Save the signed message as attachment of the send email
		$stream = mapi_openproperty($signedAttach, PR_ATTACH_DATA_BIN, IID_IStream, 0, MAPI_CREATE | MAPI_MODIFY);
		$handle = fopen($tmpSendSmimeEmail, 'r');
		while (!feof($handle)) {
			$contents = fread($handle, BLOCK_SIZE);
			mapi_stream_write($stream, $contents);
		}
		fclose($handle);

		mapi_stream_commit($stream);

		$this->cleanupTempFiles(array_merge([$tmpSendEmail, $tmpSendSmimeEmail], $tmpExtra));

		mapi_savechanges($signedAttach);
		mapi_savechanges($message);
	}

	/**
	 * Function to sign an email.
	 *
	 * @param string $infile       File eml to be encrypted
	 * @param string $outfile      File
	 * @param object $message      Mapi Message Object
	 * @param object $signedAttach
	 * @param array  $smimeProps
	 *
	 * @return bool true on success, false on failure
	 */
	public function sign(&$infile, &$outfile, &$message, &$signedAttach, $smimeProps) {
		// Set mesageclass back to IPM.Note.SMIME.MultipartSigned
		mapi_setprops($message, [PR_MESSAGE_CLASS => 'IPM.Note.SMIME.MultipartSigned']);
		mapi_setprops($signedAttach, $smimeProps);

		// Obtain private certificate
		$encryptionStore = EncryptionStore::getInstance();
		$certs = readPrivateCert($this->getStore(), $encryptionStore->get('smime'));
		$flags = PKCS7_DETACHED;
		if (isset($certs['extracerts'])) {
			$tmpFile = $this->createTempFile('smime_xtra_');
			file_put_contents($tmpFile, implode('', $certs['extracerts']));
			$ok = $this->cms->sign($infile, $outfile, $certs['cert'], [$certs['pkey'], ''], [], $flags, $tmpFile, $this->digest);
			if (!$ok) {
				Log::Write(LOGLEVEL_ERROR, sprintf("[smime] Unable to sign message with intermediate certificates, openssl error: '%s'", @openssl_error_string()));
			}
			$this->cleanupTempFiles([$tmpFile]);
		}
		else {
			$ok = $this->cms->sign($infile, $outfile, $certs['cert'], [$certs['pkey'], ''], [], $flags, null, $this->digest);
			if (!$ok) {
				Log::Write(LOGLEVEL_ERROR, sprintf("[smime] Unable to sign message, openssl error: '%s'", @openssl_error_string()));
			}
		}

		return $ok;
	}

	/**
	 * Function to encrypt an email.
	 *
	 * @param string $infile       File eml to be encrypted
	 * @param string $outfile      File
	 * @param object $message      Mapi Message Object
	 * @param object $signedAttach
	 * @param array  $smimeProps
	 *
	 * @return bool true on success, false on failure
	 */
	public function encrypt(&$infile, &$outfile, &$message, &$signedAttach, $smimeProps) {
		mapi_setprops($message, [PR_MESSAGE_CLASS => 'IPM.Note.SMIME']);
		$smimeProps[PR_ATTACH_MIME_TAG] = "application/pkcs7-mime";
		mapi_setprops($signedAttach, $smimeProps);

		$publicCerts = $this->getPublicKeyForMessage($message);
		// Always append our own certificate, so that the mail can be decrypted in 'Sent items'
		// Prefer GAB public certificate above MAPI Store certificate.
		$email = $GLOBALS['mapisession']->getSMTPAddress();
		$user = $this->getGABUser($email);
		$cert = $this->getGABCert($user);
		if (empty($cert)) {
			$cert = base64_decode($this->getPublicKey($email));
		}

		if (!empty($cert)) {
			array_push($publicCerts, $cert);
		}

		$ok = $this->cms->encrypt($infile, $outfile, $publicCerts, [], 0, $this->cipher);
		if (!$ok) {
			error_log("[smime] unable to encrypt message, openssl error: " . print_r(@openssl_error_string(), true));
			Log::Write(LOGLEVEL_ERROR, sprintf("[smime] unable to encrypt message, openssl error: '%s'", @openssl_error_string()));
		}
		if ($ok) {
			$tmpEml = file_get_contents($outfile);

			// Extract base64 body after the MIME headers.  The header/body
			// boundary is a blank line; handle both LF and CRLF.
			$bodyStart = strpos($tmpEml, "\r\n\r\n");
			if ($bodyStart !== false) {
				$bodyStart += 4;
			}
			else {
				$bodyStart = strpos($tmpEml, "\n\n");
				$bodyStart = ($bodyStart !== false) ? $bodyStart + 2 : 0;
			}
			$base64 = str_replace(["\r", "\n"], '', substr($tmpEml, $bodyStart));
			file_put_contents($outfile, base64_decode($base64));

			// Empty the body
			mapi_setprops($message, [PR_BODY => ""]);
		}

		return $ok;
	}

	/**
	 * Function which fetches the public certificates for all recipients (TO/CC/BCC) of a message
	 * Always get the certificate of an address which expires last.
	 *
	 * @param object $message Mapi Message Object
	 *
	 * @return array of public certificates
	 */
	public function getPublicKeyForMessage($message) {
		$recipientTable = mapi_message_getrecipienttable($message);
		$recips = mapi_table_queryallrows($recipientTable, [PR_SMTP_ADDRESS, PR_RECIPIENT_TYPE, PR_ADDRTYPE], [RES_OR, [
			[RES_PROPERTY,
				[
					RELOP => RELOP_EQ,
					ULPROPTAG => PR_RECIPIENT_TYPE,
					VALUE => MAPI_BCC,
				],
			],
			[RES_PROPERTY,
				[
					RELOP => RELOP_EQ,
					ULPROPTAG => PR_RECIPIENT_TYPE,
					VALUE => MAPI_CC,
				],
			],
			[RES_PROPERTY,
				[
					RELOP => RELOP_EQ,
					ULPROPTAG => PR_RECIPIENT_TYPE,
					VALUE => MAPI_TO,
				],
			],
		]]);

		$publicCerts = [];
		$storeCert = '';
		$gabCert = '';

		foreach ($recips as $recip) {
			$emailAddr = $recip[PR_SMTP_ADDRESS] ?? '';
			$addrType = $recip[PR_ADDRTYPE] ?? '';

			if (empty($emailAddr)) {
				continue;
			}

			if ($addrType === "ZARAFA" || $addrType === "EX") {
				$user = $this->getGABUser($emailAddr);
				$gabCert = $this->getGABCert($user);
			}

			$storeCert = $this->getPublicKey($emailAddr);

			if (!empty($gabCert)) {
				array_push($publicCerts, $gabCert);
			}
			elseif (!empty($storeCert)) {
				array_push($publicCerts, base64_decode($storeCert));
			}
		}

		return $publicCerts;
	}

	/**
	 * Retrieves the public certificates stored in the MAPI UserStore and belonging to the
	 * emailAdddress, returns "" if there is no certificate for that user.
	 *
	 * @param string emailAddress
	 * @param mixed $emailAddress
	 * @param mixed $multiple
	 *
	 * @return string $certificate
	 */
	public function getPublicKey($emailAddress, $multiple = false) {
		$certificates = [];

		$certs = getMAPICert($this->getStore(), 'WebApp.Security.Public', $emailAddress);

		if ($certs && count($certs) > 0) {
			foreach ($certs as $cert) {
				$pubkey = mapi_msgstore_openentry($this->getStore(), $cert[PR_ENTRYID]);
				$certificate = "";
				if ($pubkey === false) {
					continue;
				}
				// retrieve pkcs#11 certificate from body
				$stream = mapi_openproperty($pubkey, PR_BODY, IID_IStream, 0, 0);
				if (!$stream) {
					continue;
				}
				$stat = mapi_stream_stat($stream);
				mapi_stream_seek($stream, 0, STREAM_SEEK_SET);
				for ($i = 0; $i < $stat['cb']; $i += 1024) {
					$certificate .= mapi_stream_read($stream, 1024);
				}
				array_push($certificates, $certificate);
			}
		}

		return $multiple ? $certificates : ($certificates[0] ?? '');
	}

	/**
	 * Function which is used to check if there is a public certificate for the provided emailAddress.
	 *
	 * @param string emailAddress emailAddres of recipient
	 * @param bool gabUser is the user of PR_ADDRTYPE == ZARAFA
	 * @param mixed $emailAddress
	 * @param mixed $gabUser
	 *
	 * @return bool true if public certificate exists
	 */
	public function pubcertExists($emailAddress, $gabUser = false) {
		if ($gabUser) {
			$user = $this->getGABUser($emailAddress);
			$gabCert = $this->getGABCert($user);
			if ($user && !empty($gabCert)) {
				return true;
			}
		}

		$root = mapi_msgstore_openentry($this->getStore());
		$table = mapi_folder_getcontentstable($root, MAPI_ASSOCIATED);

		// Restriction for public certificates which are from the recipient of the email, are active and have the correct message_class
		$restrict = [RES_AND, [
			[RES_PROPERTY,
				[
					RELOP => RELOP_EQ,
					ULPROPTAG => PR_MESSAGE_CLASS,
					VALUE => [PR_MESSAGE_CLASS => "WebApp.Security.Public"],
				],
			],
			[RES_CONTENT,
				[
					FUZZYLEVEL => FL_FULLSTRING | FL_IGNORECASE,
					ULPROPTAG => PR_SUBJECT,
					VALUE => [PR_SUBJECT => $emailAddress],
				],
			],
		]];
		mapi_table_restrict($table, $restrict, TBL_BATCH);
		mapi_table_sort($table, [PR_MESSAGE_DELIVERY_TIME => TABLE_SORT_DESCEND], TBL_BATCH);

		$rows = mapi_table_queryallrows($table, [PR_SUBJECT, PR_ENTRYID, PR_MESSAGE_DELIVERY_TIME, PR_CLIENT_SUBMIT_TIME], $restrict);

		return !empty($rows);
	}

	public function clear_openssl_error() {
		while (@openssl_error_string() !== false)
		/* nothing */;
	}

	/**
	 * Helper functions which extracts the errors from openssl_error_string()
	 * Example error from openssl_error_string(): error:21075075:PKCS7 routines:PKCS7_verify:certificate verify error
	 * Note that openssl_error_string() returns an error when verifying is successful, this is a bug in PHP https://bugs.php.net/bug.php?id=50713.
	 *
	 * @return string
	 */
	public function extract_openssl_error() {
		$this->openssl_error = "";
		while (($s = @openssl_error_string()) !== false) {
			if ($this->openssl_error === '') {
				$this->openssl_error = $s;
			}
			else {
				$this->openssl_error .= "\n" . $s;
			}
		}
		$openssl_error_code = 0;
		if ($this->openssl_error) {
			$openssl_error_list = explode(":", $this->openssl_error);
			$openssl_error_code = $openssl_error_list[1];
		}

		return $openssl_error_code;
	}

	/**
	 * Extract the intermediate certificates from the signed email.
	 * Uses openssl_pkcs7_verify to extract the PKCS#7 blob and then converts the PKCS#7 blob to
	 * X509 certificates using openssl_pkcs7_read.
	 *
	 * @param string $emlfile - the s/mime message
	 *
	 * @return array a list of extracted intermediate certificates
	 */
	public function extractCAs($emlfile) {
		$cas = [];
		$certfile = $this->createTempFile('smime_cacert_');
		$outfile = $this->createTempFile('smime_caout_');
		$p7bfile = $this->createTempFile('smime_p7b_');
		$this->cms->verify($emlfile, PKCS7_NOVERIFY, $certfile);
		$this->cms->verify($emlfile, PKCS7_NOVERIFY, $certfile, [], $certfile, $outfile, $p7bfile);

		$p7b = file_get_contents($p7bfile);
		if ($p7b !== false) {
			$this->cms->read($p7b, $cas);
		}
		$this->cleanupTempFiles([$certfile, $outfile, $p7bfile]);

		return $cas;
	}

	/**
	 * Imports certificate in the MAPI Root Associated Folder.
	 *
	 * Private key, always insert certificate
	 * Public key, check if we already have one stored
	 *
	 * @param string $cert     certificate body as a string
	 * @param mixed  $certData an array with the parsed certificate data
	 * @param string $type     certificate type, default 'public'
	 * @param bool   $force    force import the certificate even though we have one already stored in the MAPI Store.
	 *                         FIXME: remove $force in the future and move the check for newer certificate in this function.
	 */
	public function importCertificate($cert, $certData, $type = 'public', $force = false) {
		$certEmail = getCertEmail($certData);
		if ($this->pubcertExists($certEmail) && !$force && $type !== 'private') {
			return;
		}
		$issued_by = "";
		foreach (array_keys($certData['issuer']) as $key) {
			$issued_by .= $key . '=' . $certData['issuer'][$key] . "\n";
		}

		// Get key type metadata for storage
		$keyTypeJson = '';
		if ($type === 'public' || is_string($cert)) {
			$keyInfo = getKeyTypeInfo($cert);
			$purpose = getCertPurpose($cert);
			$keyTypeJson = json_encode([
				'type' => $keyInfo['type'],
				'bits' => $keyInfo['bits'],
				'curve' => $keyInfo['curve'],
				'purpose' => $purpose,
			]);
		}

		$root = mapi_msgstore_openentry($this->getStore());
		$assocMessage = mapi_folder_createmessage($root, MAPI_ASSOCIATED);
		mapi_setprops($assocMessage, [
			PR_SUBJECT => $certEmail,
			PR_MESSAGE_CLASS => $type === 'public' ? 'WebApp.Security.Public' : 'WebApp.Security.Private',
			PR_MESSAGE_DELIVERY_TIME => $certData['validTo_time_t'],
			PR_CLIENT_SUBMIT_TIME => $certData['validFrom_time_t'],
			PR_SENDER_NAME => $certData['serialNumber'], // serial
			PR_SENDER_EMAIL_ADDRESS => $issued_by, // Issuer To
			PR_SUBJECT_PREFIX => $keyTypeJson, // Key type metadata (JSON)
			PR_RECEIVED_BY_NAME => $this->fingerprint_cert($cert, 'sha1'), // SHA-1 Fingerprint
			PR_INTERNET_MESSAGE_ID => $this->fingerprint_cert($cert, 'sha256'), // SHA-256 Fingerprint (primary)
		]);
		// Save attachment
		$msgBody = base64_encode($cert);
		$stream = mapi_openproperty($assocMessage, PR_BODY, IID_IStream, 0, MAPI_CREATE | MAPI_MODIFY);
		mapi_stream_setsize($stream, strlen($msgBody));
		mapi_stream_write($stream, $msgBody);
		mapi_stream_commit($stream);
		mapi_message_savechanges($assocMessage);
	}

	/**
	 * Function which returns the fingerprint (hash) of the certificate.
	 *
	 * @param string $body PEM certificate body
	 * @param string $hash hash algorithm ('sha256', 'sha1', 'md5')
	 *
	 * @return string formatted fingerprint
	 */
	public function fingerprint_cert($body, $hash = 'sha256') {
		// Prefer openssl_x509_fingerprint() when available
		if (function_exists('openssl_x509_fingerprint')) {
			$fp = openssl_x509_fingerprint($body, $hash);
			if ($fp !== false) {
				return strtoupper(implode(':', str_split($fp, 2)));
			}
		}

		$body = str_replace('-----BEGIN CERTIFICATE-----', '', $body);
		$body = str_replace('-----END CERTIFICATE-----', '', $body);
		$body = base64_decode($body);
		$fingerprint = hash($hash, $body);

		// Format 1000AB as 10:00:AB
		return strtoupper(implode(':', str_split($fingerprint, 2)));
	}

	/**
	 * Extract algorithm details from a CMS/PKCS7 message using openssl cms -cmsout -print.
	 *
	 * Returns an associative array with the algorithms used in the message:
	 * - digest: hash algorithm for signing (e.g. "sha256", "sha384", "sha512")
	 * - signature: signature algorithm (e.g. "rsaEncryption", "rsaPSS", "ecdsa-with-SHA256")
	 * - encryption: content encryption cipher (e.g. "aes-256-cbc", "aes-256-gcm")
	 * - key_transport: key encryption algorithm (e.g. "rsaEncryption", "rsaesOaep")
	 *
	 * @param string $emlfile path to the MIME message file
	 *
	 * @return array algorithm details (keys may be absent if not found)
	 */
	public function extractCmsAlgorithms(string $emlfile): array {
		$result = [];

		if (!$this->cms->hasCmsCli()) {
			return $result;
		}

		$cmd = sprintf(
			'%s cms -cmsout -print -in %s -inform SMIME 2>/dev/null',
			escapeshellarg($this->cms->getOpensslBin()),
			escapeshellarg($emlfile)
		);

		$output = @shell_exec($cmd);
		if (empty($output)) {
			return $result;
		}

		// Digest algorithm from signer info (signed messages)
		// Matches: "digestAlgorithm:" or "digest_alg:" followed by "algorithm: sha512 (...)"
		if (preg_match('/digestAlgorithm:\s*\n\s*algorithm:\s*(\S+)/s', $output, $m) ||
			preg_match('/digest_alg:\s*\n\s*algorithm:\s*(\S+)/s', $output, $m)) {
			$result['digest'] = strtolower(preg_replace('/\s*\(.*\)/', '', $m[1]));
		}

		// Signature algorithm from signer info
		// Matches: "signatureAlgorithm:" or "sign_alg:"
		if (preg_match('/signatureAlgorithm:\s*\n\s*algorithm:\s*(\S+)/s', $output, $m) ||
			preg_match('/sign_alg:\s*\n\s*algorithm:\s*(\S+)/s', $output, $m)) {
			$result['signature'] = preg_replace('/\s*\(.*\)/', '', $m[1]);
		}

		// Content encryption algorithm (encrypted messages)
		// Matches: "contentEncryptionAlgorithm:" or "enc_data:" section
		if (preg_match('/contentEncryptionAlgorithm:\s*\n\s*algorithm:\s*(\S+)/s', $output, $m) ||
			preg_match('/enc_data:.*?algorithm:\s*\n\s*algorithm:\s*(\S+)/s', $output, $m)) {
			$result['encryption'] = strtolower(preg_replace('/\s*\(.*\)/', '', $m[1]));
		}

		// Key transport algorithm (from recipientInfos)
		// Matches: "keyEncryptionAlgorithm:" or "key_enc_alg:"
		if (preg_match('/keyEncryptionAlgorithm:\s*\n\s*algorithm:\s*(\S+)/s', $output, $m) ||
			preg_match('/key_enc_alg:\s*\n\s*algorithm:\s*(\S+)/s', $output, $m)) {
			$result['key_transport'] = preg_replace('/\s*\(.*\)/', '', $m[1]);
		}

		return $result;
	}

	/**
	 * Verify signing-time attribute from a signed message.
	 *
	 * Checks that the signing-time (if present) is within acceptable
	 * clock skew of the current time.  Per RFC 8551, signing-time
	 * SHOULD be checked.
	 *
	 * @param string $emlfile path to signed message file
	 * @param int    $maxSkew maximum allowed clock skew in seconds (default 5 min)
	 *
	 * @return null|bool true = valid, false = excessive skew, null = no signing-time present
	 */
	public function verifySigningTime(string $emlfile, int $maxSkew = 300): ?bool {
		if (!$this->cms->hasCmsCli()) {
			return null;
		}

		// Use openssl cms -cmsout to dump the CMS structure
		$cmd = sprintf(
			'%s cms -cmsout -print -in %s -inform SMIME 2>/dev/null',
			escapeshellarg($this->cms->getOpensslBin()),
			escapeshellarg($emlfile)
		);

		$output = @shell_exec($cmd);
		if (empty($output)) {
			return null;
		}

		// Look for signingTime attribute in the output
		if (preg_match('/signingTime.*?:\s*([A-Z][a-z]{2}\s+\d{1,2}\s+\d{2}:\d{2}:\d{2}\s+\d{4}\s+\w+)/s', $output, $matches)) {
			$signingTimeStr = trim($matches[1]);
			$signingTime = @strtotime($signingTimeStr);
			if ($signingTime === false) {
				return null;
			}

			$now = time();
			$skew = abs($now - $signingTime);

			if ($skew > $maxSkew) {
				error_log(sprintf("[smime] Signing-time skew of %d seconds exceeds maximum of %d", $skew, $maxSkew));

				return false;
			}

			return true;
		}

		return null;
	}

	/**
	 * Triple-wrap a message: sign → encrypt → sign (RFC 2634 Section 3.3).
	 *
	 * Produces a signed envelope where the inner content is encrypted,
	 * and that encrypted content is itself signed.
	 *
	 * @param string $infile       original plain-text input file
	 * @param string $outfile      output file for the triple-wrapped message
	 * @param object $message      MAPI message object
	 * @param object $signedAttach attachment for the signed message
	 * @param array  $smimeProps   MAPI properties for the attachment
	 *
	 * @return bool true on success
	 */
	public function tripleWrap(&$infile, &$outfile, &$message, &$signedAttach, $smimeProps) {
		$tmpSignedInner = $this->createTempFile('smime_tw_s1_');
		$tmpEncrypted = $this->createTempFile('smime_tw_enc_');

		// Step 1: Inner sign
		$ok = $this->sign($infile, $tmpSignedInner, $message, $signedAttach, $smimeProps);
		if (!$ok) {
			$this->cleanupTempFiles([$tmpSignedInner, $tmpEncrypted]);

			return false;
		}

		// Step 2: Encrypt the signed message
		$ok = $this->encrypt($tmpSignedInner, $tmpEncrypted, $message, $signedAttach, $smimeProps);
		if (!$ok) {
			$this->cleanupTempFiles([$tmpSignedInner, $tmpEncrypted]);

			return false;
		}

		// Step 3: Outer sign over the encrypted content
		$ok = $this->sign($tmpEncrypted, $outfile, $message, $signedAttach, $smimeProps);

		$this->cleanupTempFiles([$tmpSignedInner, $tmpEncrypted]);

		return $ok;
	}

	/**
	 * Generate a certs-only message for certificate exchange.
	 *
	 * Produces an application/pkcs7-mime; smime-type=certs-only message
	 * per RFC 8551 Section 3.2.2.
	 *
	 * @param array $certPems list of PEM certificates to include
	 *
	 * @return null|string MIME message content, or null on failure
	 */
	public function generateCertsOnlyMessage(array $certPems): ?string {
		$tmpOut = $this->createTempFile('smime_certsonly_');
		$ok = $this->cms->generateCertsOnly($certPems, $tmpOut);

		if (!$ok) {
			$this->cleanupTempFiles([$tmpOut]);

			return null;
		}

		$p7b = file_get_contents($tmpOut);
		$this->cleanupTempFiles([$tmpOut]);

		if ($p7b === false || empty($p7b)) {
			return null;
		}

		// Build MIME message
		$mime = "Content-Type: application/pkcs7-mime; smime-type=certs-only; name=\"smime.p7c\"\r\n";
		$mime .= "Content-Transfer-Encoding: base64\r\n";
		$mime .= "Content-Disposition: attachment; filename=\"smime.p7c\"\r\n";
		$mime .= "\r\n";

		// Extract DER from PEM, re-encode as base64
		$derStart = strpos($p7b, '-----BEGIN PKCS7-----');
		if ($derStart !== false) {
			$p7b = substr($p7b, $derStart + strlen('-----BEGIN PKCS7-----'));
			$p7b = substr($p7b, 0, strpos($p7b, '-----END PKCS7-----'));
			$mime .= chunk_split(trim($p7b), 76, "\r\n");
		}
		else {
			$mime .= chunk_split(base64_encode($p7b), 76, "\r\n");
		}

		return $mime;
	}

	/**
	 * Retrieve the GAB User.
	 *
	 * FIXME: ideally this would be a public function in grommunio Web.
	 *
	 * @param string $email the email address of the user
	 *
	 * @return mixed $user boolean if false else MAPIObject
	 */
	public function getGABUser($email) {
		$addrbook = $GLOBALS["mapisession"]->getAddressbook();
		$userArr = [[PR_DISPLAY_NAME => $email]];
		$user = false;

		try {
			$user = mapi_ab_resolvename($addrbook, $userArr, EMS_AB_ADDRESS_LOOKUP);
			$user = mapi_ab_openentry($addrbook, $user[0][PR_ENTRYID]);
		}
		catch (MAPIException $e) {
			$e->setHandled();
		}

		return $user;
	}

	/**
	 * Retrieve the PR_EMS_AB_X509_CERT.
	 *
	 * @param MAPIObject $user the GAB user
	 *
	 * @return string $cert the certificate, empty if not found
	 */
	public function getGABCert($user) {
		$cert = '';
		if (!$user) {
			return $cert;
		}
		$userCertArray = mapi_getprops($user, [PR_EMS_AB_X509_CERT]);
		if (!isset($userCertArray[PR_EMS_AB_X509_CERT])) {
			return $cert;
		}

		$certs = $userCertArray[PR_EMS_AB_X509_CERT];
		if (count($certs) === 1) {
			return der2pem($certs[0]);
		}

		$bestExpiry = 0;
		$now = time();
		foreach ($certs as $derCert) {
			$pem = der2pem($derCert);
			$parsed = openssl_x509_parse($pem);
			if ($parsed === false) {
				continue;
			}
			$validFrom = $parsed['validFrom_time_t'] ?? 0;
			$validTo = $parsed['validTo_time_t'] ?? 0;
			if ($now >= $validFrom && $now < $validTo && $validTo > $bestExpiry) {
				$bestExpiry = $validTo;
				$cert = $pem;
			}
		}

		if (empty($cert)) {
			$cert = der2pem($certs[0]);
		}

		return $cert;
	}

	/**
	 * Called when the core Settings class is initialized and ready to accept sysadmin default
	 * settings. Registers the sysadmin defaults for the example plugin.
	 *
	 * @param mixed $data Reference to the data of the triggered hook
	 */
	public function onBeforeSettingsInit(&$data) {
		$data['settingsObj']->addSysAdminDefaults([
			'zarafa' => [
				'v1' => [
					'plugins' => [
						'smime' => [
							'enable' => defined('PLUGIN_SMIME_USER_DEFAULT_ENABLE_SMIME') && PLUGIN_SMIME_USER_DEFAULT_ENABLE_SMIME,
							'passphrase_cache' => defined('PLUGIN_SMIME_PASSPHRASE_REMEMBER_BROWSER') && PLUGIN_SMIME_PASSPHRASE_REMEMBER_BROWSER,
							'default_cipher' => 'aes-256-gcm',
							'default_digest' => 'sha256',
						],
					],
				],
			],
		]);
	}

	/**
	 * Get sender structure of the MAPI Message.
	 *
	 * @param mapimessage $mapiMessage MAPI Message resource from which we need to get the sender
	 *
	 * @return array with properties
	 */
	public function getSenderAddress($mapiMessage) {
		if (method_exists($GLOBALS['operations'], 'getSenderAddress')) {
			return $GLOBALS["operations"]->getSenderAddress($mapiMessage);
		}

		$messageProps = mapi_getprops($mapiMessage, [PR_SENT_REPRESENTING_ENTRYID, PR_SENDER_ENTRYID]);
		$senderEntryID = $messageProps[PR_SENT_REPRESENTING_ENTRYID] ?? ($messageProps[PR_SENDER_ENTRYID] ?? null);
		$senderStructure = [];

		if (!$senderEntryID) {
			return $senderStructure;
		}

		try {
			$senderUser = mapi_ab_openentry($GLOBALS["mapisession"]->getAddressbook(), $senderEntryID);
			if ($senderUser) {
				$userprops = mapi_getprops($senderUser, [PR_ADDRTYPE, PR_DISPLAY_NAME, PR_EMAIL_ADDRESS, PR_SMTP_ADDRESS, PR_OBJECT_TYPE, PR_RECIPIENT_TYPE, PR_DISPLAY_TYPE, PR_DISPLAY_TYPE_EX, PR_ENTRYID]);

				$senderStructure["props"]['entryid'] = isset($userprops[PR_ENTRYID]) ? bin2hex((string) $userprops[PR_ENTRYID]) : '';
				$senderStructure["props"]['display_name'] = $userprops[PR_DISPLAY_NAME] ?? '';
				$senderStructure["props"]['email_address'] = $userprops[PR_EMAIL_ADDRESS] ?? '';
				$senderStructure["props"]['smtp_address'] = $userprops[PR_SMTP_ADDRESS] ?? '';
				$senderStructure["props"]['address_type'] = $userprops[PR_ADDRTYPE] ?? '';
				$senderStructure["props"]['object_type'] = $userprops[PR_OBJECT_TYPE] ?? MAPI_MAILUSER;
				$senderStructure["props"]['recipient_type'] = MAPI_TO;
				$senderStructure["props"]['display_type'] = $userprops[PR_DISPLAY_TYPE] ?? MAPI_MAILUSER;
				$senderStructure["props"]['display_type_ex'] = $userprops[PR_DISPLAY_TYPE_EX] ?? MAPI_MAILUSER;
			}
		}
		catch (MAPIException $e) {
			error_log(sprintf("[smime] getSenderAddress(): Exception %s", $e));
		}

		return $senderStructure;
	}
}
