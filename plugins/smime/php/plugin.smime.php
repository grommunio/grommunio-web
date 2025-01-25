<?php

include_once 'util.php';
require_once 'class.certificate.php';

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
	 * Cipher to use.
	 */
	private $cipher = PLUGIN_SMIME_CIPHER;

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

		if (version_compare(phpversion(), '5.4', '<')) {
			$this->cipher = OPENSSL_CIPHER_AES_256_CBC;
		}
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

		function missingMyself($email) {
			return $GLOBALS['mapisession']->getSMTPAddress() === $email;
		}

		if (array_filter($missingCerts, "missingMyself") === []) {
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
		$userCert = '';
		$tmpUserCert = tempnam(sys_get_temp_dir(), true);
		$importMessageCert = true;
		$fromGAB = false;

		// TODO: worth to split fetching public certificate in a separate function?

		// If user entry exists in GAB, try to retrieve public cert
		// Public certificate from GAB in combination with LDAP saved in PR_EMS_AB_X509_CERT
		$userProps = mapi_getprops($message, [PR_SENT_REPRESENTING_ENTRYID, PR_SENT_REPRESENTING_NAME]);
		if (isset($userProps[PR_SENT_REPRESENTING_ENTRYID])) {
			try {
				$user = mapi_ab_openentry($GLOBALS['mapisession']->getAddressbook(), $userProps[PR_SENT_REPRESENTING_ENTRYID]);
				$gabCert = $this->getGABCert($user);
				if (!empty($gabCert)) {
					$fromGAB = true;
					// Put empty string into file? dafuq?
					file_put_contents($tmpUserCert, $userCert);
				}
			}
			catch (MAPIException $e) {
				$msg = "[smime] Unable to open PR_SENT_REPRESENTING_ENTRYID. Maybe %s was does not exists or deleted from server.";
				Log::write(LOGLEVEL_ERROR, sprintf($msg, $userProps[PR_SENT_REPRESENTING_NAME]));
				error_log("[smime] Unable to open PR_SENT_REPRESENTING_NAME: " . print_r($userProps[PR_SENT_REPRESENTING_NAME], true));
				$this->message['success'] = SMIME_NOPUB;
				$this->message['info'] = SMIME_USER_DETECT_FAILURE;
			}
		}

		// When downloading an email as eml, $GLOBALS['operations'] isn't set, so add a check so that downloading works
		// If the certificate is already fetch from the GAB, skip checking the userStore.
		if (!$fromGAB && isset($GLOBALS['operations'])) {
			$senderAddressArray = $this->getSenderAddress($message);
			$senderAddressArray = $senderAddressArray['props'];
			if ($senderAddressArray['address_type'] === 'SMTP') {
				$emailAddr = $senderAddressArray['email_address'];
			}
			else {
				$emailAddr = $senderAddressArray['smtp_address'];
			}

			// User not in AB,
			// so get email address from either PR_SENT_REPRESENTING_NAME, PR_SEARCH_KEY or PR_SENT_REPRESENTING_SEARCH_KEY
			// of the message
			if (!$emailAddr) {
				if (!empty($userProps[PR_SENT_REPRESENTING_NAME])) {
					$emailAddr = $userProps[PR_SENT_REPRESENTING_NAME];
				}
				else {
					$searchKeys = mapi_getprops($message, [PR_SEARCH_KEY, PR_SENT_REPRESENTING_SEARCH_KEY]);
					$searchKey = $searchKeys[PR_SEARCH_KEY] ?? $searchKeys[PR_SENT_REPRESENTING_SEARCH_KEY];
					if ($searchKey) {
						$sk = strtolower(explode(':', $searchKey)[1]);
						$emailAddr = trim($sk);
					}
				}
			}

			if ($emailAddr) {
				// Get all public certificates of $emailAddr stored on the server
				$userCerts = $this->getPublicKey($emailAddr, true);
			}
		}

		// Save signed message in a random file
		$tmpfname = tempnam(sys_get_temp_dir(), true);
		file_put_contents($tmpfname, $eml);

		// Create random file for saving the signed message
		$outcert = tempnam(sys_get_temp_dir(), true);

		// Verify signed message
		// Returns True if verified, False if tampered or signing certificate invalid OR -1 on error
		if (count($userCerts) > 0) {
			// Try to verify a certificate in the MAPI store
			foreach ($userCerts as $userCert) {
				$userCert = base64_decode($userCert);
				// Save signed message in a random file
				$tmpfname = tempnam(sys_get_temp_dir(), true);
				file_put_contents($tmpfname, $eml);

				// Create random file for saving the signed message
				$outcert = tempnam(sys_get_temp_dir(), true);

				if (!empty($userCert)) { // Check MAPI UserStore
					file_put_contents($tmpUserCert, $userCert);
				}
				$signed_ok = openssl_pkcs7_verify($tmpfname, PKCS7_NOINTERN, $outcert, explode(';', PLUGIN_SMIME_CACERTS), $tmpUserCert);
				$openssl_error_code = $this->extract_openssl_error();
				$this->validateSignedMessage($signed_ok, $openssl_error_code);
				// Check if we need to import a newer certificate
				$importCert = file_get_contents($outcert);
				$parsedImportCert = openssl_x509_parse($importCert);
				$parsedUserCert = openssl_x509_parse($userCert);
				if (!$signed_ok || $openssl_error_code === OPENSSL_CA_VERIFY_FAIL) {
					continue;
				}

				// CA Checks out
				$caCerts = $this->extractCAs($tmpfname);
				// If validTo and validFrom are more in the future, emailAddress matches and OCSP check is valid, import newer certificate
				if (is_array($parsedImportCert) && is_array($parsedUserCert) &&
					$parsedImportCert['validTo'] > $parsedUserCert['validTo'] &&
					$parsedImportCert['validFrom'] > $parsedUserCert['validFrom'] &&
					getCertEmail($parsedImportCert) === getCertEmail($parsedUserCert) &&
					verifyOCSP($importCert, $caCerts, $this->message) &&
					$importMessageCert !== false) {
					// Redundant
					$importMessageCert = true;
				}
				else {
					$importMessageCert = false;
					verifyOCSP($userCert, $caCerts, $this->message);
					break;
				}
			}
		}
		else {
			// Works. Just leave it.
			$signed_ok = openssl_pkcs7_verify($tmpfname, PKCS7_NOSIGS, $outcert, explode(';', PLUGIN_SMIME_CACERTS));
			$openssl_error_code = $this->extract_openssl_error();
			$this->validateSignedMessage($signed_ok, $openssl_error_code);

			// OCSP check
			if ($signed_ok && $openssl_error_code !== OPENSSL_CA_VERIFY_FAIL) { // CA Checks out
				$userCert = file_get_contents($outcert);
				$parsedImportCert = openssl_x509_parse($userCert);

				$caCerts = $this->extractCAs($tmpfname);
				if (!is_array($parsedImportCert) || !verifyOCSP($userCert, $caCerts, $this->message)) {
					$importMessageCert = false;
				}
			// We don't have a certificate from the MAPI UserStore or LDAP, so we will set $userCert to $importCert
			// so that we can verify the message according to the be imported certificate.
			}
			else { // No pubkey
				$importMessageCert = false;
				Log::write(LOGLEVEL_INFO, sprintf("[smime] Unable to verify message without public key, openssl error: '%s'", $this->openssl_error));
				$this->message['success'] = SMIME_STATUS_FAIL;
				$this->message['info'] = SMIME_CA;
			}
		}
		// Certificate is newer or not yet imported to the user store and not revoked
		// If certificate is from the GAB, then don't import it.
		if ($importMessageCert && !$fromGAB) {
			$signed_ok = openssl_pkcs7_verify($tmpfname, PKCS7_NOSIGS, $outcert, explode(';', PLUGIN_SMIME_CACERTS));
			$openssl_error_code = $this->extract_openssl_error();
			$this->validateSignedMessage($signed_ok, $openssl_error_code);
			$userCert = file_get_contents($outcert);
			$parsedImportCert = openssl_x509_parse($userCert);
			// FIXME: doing this in importPublicKey too...
			$certEmail = getCertEmail($parsedImportCert);
			if (!empty($certEmail)) {
				$this->importCertificate($userCert, $parsedImportCert, 'public', true);
			}
		}

		// Remove extracted certificate from openssl_pkcs7_verify
		unlink($outcert);

		// remove the temporary file
		unlink($tmpfname);

		// Clean up temp cert
		unlink($tmpUserCert);
	}

	function join_xph(&$prop, $msg)
	{
		$a = mapi_getprops($msg, [PR_TRANSPORT_MESSAGE_HEADERS]);
		$a = $a === false ? "" : ($a[PR_TRANSPORT_MESSAGE_HEADERS] ?? "");
		$prop[PR_TRANSPORT_MESSAGE_HEADERS] =
			"# Outer headers:\n".($prop[PR_TRANSPORT_MESSAGE_HEADERS] ?? "").
			"# Inner headers:\n".$a;
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

		$tmpFile = tempnam(sys_get_temp_dir(), true);
		// Write mime header. Because it's not provided in the attachment, otherwise openssl won't parse it
		$fp = fopen($tmpFile, 'w');
		fwrite($fp, "Content-Type: application/pkcs7-mime; name=\"smime.p7m\"; smime-type=enveloped-data\n");
		fwrite($fp, "Content-Transfer-Encoding: base64\nContent-Disposition: attachment; filename=\"smime.p7m\"\n");
		fwrite($fp, "Content-Description: S/MIME Encrypted Message\n\n");
		fwrite($fp, chunk_split(base64_encode($data['data']), 72) . "\n");
		fclose($fp);
		if (isset($pass) && !empty($pass)) {
			$certs = readPrivateCert($this->getStore(), $pass, false);
			// create random file for saving the encrypted and body message
			$tmpDecrypted = tempnam(sys_get_temp_dir(), true);

			$decryptStatus = false;
			// If multiple private certs were decrypted with supplied password
			if (!$certs['cert'] && count($certs) > 0) {
				foreach ($certs as $cert) {
					$decryptStatus = openssl_pkcs7_decrypt($tmpFile, $tmpDecrypted, $cert['cert'], [$cert['pkey'], $pass]);
					if ($decryptStatus !== false) {
						break;
					}
				}
			}
			else {
				$decryptStatus = openssl_pkcs7_decrypt($tmpFile, $tmpDecrypted, $certs['cert'], [$certs['pkey'], $pass]);
			}

			$content = file_get_contents($tmpDecrypted);
			// Handle OL empty body Outlook Signed & Encrypted mails.
			// The S/MIME plugin has to extract the body from the signed message.
			if (strpos($content, 'signed-data') !== false) {
				$this->message['type'] = 'encryptsigned';
				$olcert = tempnam(sys_get_temp_dir(), true);
				$olmsg = tempnam(sys_get_temp_dir(), true);
				openssl_pkcs7_verify($tmpDecrypted, PKCS7_NOVERIFY, $olcert);
				openssl_pkcs7_verify($tmpDecrypted, PKCS7_NOVERIFY, $olcert, [], $olcert, $olmsg);
				$content = file_get_contents($olmsg);
				unlink($olmsg);
				unlink($olcert);
			}

			$copyProps = mapi_getprops($data['message'], [PR_MESSAGE_DELIVERY_TIME, PR_SENDER_ENTRYID, PR_SENT_REPRESENTING_ENTRYID, PR_TRANSPORT_MESSAGE_HEADERS]);
			mapi_inetmapi_imtomapi($GLOBALS['mapisession']->getSession(), $data['store'], $GLOBALS['mapisession']->getAddressbook(), $data['message'], $content, ['parse_smime_signed' => true]);
			$this->join_xph($copyProps, $data['message']);
			// Manually set time back to the received time, since mapi_inetmapi_imtomapi overwrites this
			mapi_setprops($data['message'], $copyProps);

			// remove temporary files
			unlink($tmpFile);
			unlink($tmpDecrypted);

			// mapi_inetmapi_imtomapi removes the PR_MESSAGE_CLASS = 'IPM.Note.SMIME.MultipartSigned'
			// So we need to check if the message was also signed by looking at the MIME_TAG in the eml
			if (strpos($content, 'multipart/signed') !== false || strpos($content, 'signed-data') !== false) {
				$this->message['type'] = 'encryptsigned';
				$this->verifyMessage($data['message'], $content);
			}
			elseif ($decryptStatus) {
				$this->message['info'] = SMIME_DECRYPT_SUCCESS;
				$this->message['success'] = SMIME_STATUS_SUCCESS;
			}
			elseif ($this->extract_openssl_error() === OPENSSL_RECIPIENT_CERTIFICATE_MISMATCH) {
				error_log("[smime] Error when decrypting email, openssl error: " . print_r($this->openssl_error, true));
				Log::Write(LOGLEVEL_ERROR, sprintf("[smime] Error when decrypting email, openssl error: '%s'", $this->openssl_error));
				$this->message['info'] = SMIME_DECRYPT_CERT_MISMATCH;
				$this->message['success'] = SMIME_STATUS_FAIL;
			}
		}
		else {
			// it might also be a signed message only. Verify it.
			$msg = tempnam(sys_get_temp_dir(), true);
			$ret = openssl_pkcs7_verify($tmpFile, PKCS7_NOVERIFY, null, [], null, $msg);
			$content = file_get_contents($msg);
			unlink($tmpFile);
			unlink($msg);
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
				// Manually set time back to the received time, since mapi_inetmapi_imtomapi overwrites this
				mapi_setprops($data['message'], $copyProps);
				$this->message['type'] = 'encryptsigned';
				$this->message['info'] = SMIME_DECRYPT_SUCCESS;
				$this->message['success'] = SMIME_STATUS_SUCCESS;
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
		list($message, $publickey, $publickeyData, $imported) = validateUploadedPKCS($certificate, $passphrase, $emailAddress);

		// All checks completed successful
		// Store private cert in users associated store (check for duplicates)
		if ($imported) {
			$certMessage = getMAPICert($this->getStore());
			// TODO: update to serialNumber check
			if ($certMessage && $certMessage[0][PR_MESSAGE_DELIVERY_TIME] == $publickeyData['validTo_time_t']) {
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
		if (stripos($messageClass, 'IPM.Note.deferSMIME') === false &&
			stripos($messageClass, 'IPM.Note.SMIME') === false) {
			return;
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
		// NOTE: setting message class to IPM.Note, so that mapi_inetmapi_imtoinet converts the message to plain email
		// and doesn't fail when handling the attachments.
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
		$tmpSendEmail = tempnam(sys_get_temp_dir(), true);
		$tmpSendSmimeEmail = tempnam(sys_get_temp_dir(), true);

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

		// Sign then Encrypt email
		switch ($messageClass) {
			case 'IPM.Note.deferSMIME.SignedEncrypt':
			case 'IPM.Note.SMIME.SignedEncrypt':
				$tmpFile = tempnam(sys_get_temp_dir(), true);
				$this->sign($tmpSendEmail, $tmpFile, $message, $signedAttach, $smimeProps);
				$this->encrypt($tmpFile, $tmpSendSmimeEmail, $message, $signedAttach, $smimeProps);
				unlink($tmpFile);
				break;

			case 'IPM.Note.deferSMIME.MultipartSigned':
			case 'IPM.Note.SMIME.MultipartSigned':
				$this->sign($tmpSendEmail, $tmpSendSmimeEmail, $message, $signedAttach, $smimeProps);
				break;

			case 'IPM.Note.deferSMIME':
			case 'IPM.Note.SMIME':
				$this->encrypt($tmpSendEmail, $tmpSendSmimeEmail, $message, $signedAttach, $smimeProps);
				break;
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

		// remove tmp files
		unlink($tmpSendSmimeEmail);
		unlink($tmpSendEmail);

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
	 */
	public function sign(&$infile, &$outfile, &$message, &$signedAttach, $smimeProps) {
		// Set mesageclass back to IPM.Note.SMIME.MultipartSigned
		mapi_setprops($message, [PR_MESSAGE_CLASS => 'IPM.Note.SMIME.MultipartSigned']);
		mapi_setprops($signedAttach, $smimeProps);

		// Obtain private certificate
		$encryptionStore = EncryptionStore::getInstance();
		// Only the newest one is returned
		$certs = readPrivateCert($this->getStore(), $encryptionStore->get('smime'));

		// Retrieve intermediate CA's for verification, if available
		if (isset($certs['extracerts'])) {
			$tmpFile = tempnam(sys_get_temp_dir(), true);
			file_put_contents($tmpFile, implode('', $certs['extracerts']));
			$ok = openssl_pkcs7_sign($infile, $outfile, $certs['cert'], [$certs['pkey'], ''], [], PKCS7_DETACHED, $tmpFile);
			if (!$ok) {
				Log::Write(LOGLEVEL_ERROR, sprintf("[smime] Unable to sign message with intermediate certificates, openssl error: '%s'", @openssl_error_string()));
			}
			unlink($tmpFile);
		}
		else {
			$ok = openssl_pkcs7_sign($infile, $outfile, $certs['cert'], [$certs['pkey'], ''], [], PKCS7_DETACHED);
			if (!$ok) {
				Log::Write(LOGLEVEL_ERROR, sprintf("[smime] Unable to sign message, openssl error: '%s'", @openssl_error_string()));
			}
		}
	}

	/**
	 * Function to encrypt an email.
	 *
	 * @param string $infile       File eml to be encrypted
	 * @param string $outfile      File
	 * @param object $message      Mapi Message Object
	 * @param object $signedAttach
	 * @param array  $smimeProps
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

		$ok = openssl_pkcs7_encrypt($infile, $outfile, $publicCerts, [], 0, $this->cipher);
		if (!$ok) {
			error_log("[smime] unable to encrypt message, openssl error: " . print_r(@openssl_error_string(), true));
			Log::Write(LOGLEVEL_ERROR, sprintf("[smime] unable to encrypt message, openssl error: '%s'", @openssl_error_string()));
		}
		$tmpEml = file_get_contents($outfile);

		// Grab the base64 data, since MAPI requires it saved as decoded base64 string.
		// FIXME: we can do better here
		$matches = explode("\n\n", $tmpEml);
		$base64 = str_replace("\n", "", $matches[1]);
		file_put_contents($outfile, base64_decode($base64));

		// Empty the body
		mapi_setprops($message, [PR_BODY => ""]);
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
			$emailAddr = $recip[PR_SMTP_ADDRESS];
			$addrType = $recip[PR_ADDRTYPE];

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
				if ($pubkey == false) {
					continue;
				}
				// retrieve pkcs#11 certificate from body
				$stream = mapi_openproperty($pubkey, PR_BODY, IID_IStream, 0, 0);
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
			[RES_PROPERTY,
				[
					RELOP => RELOP_EQ,
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

	/**
	 * Helper functions which extracts the errors from openssl_error_string()
	 * Example error from openssl_error_string(): error:21075075:PKCS7 routines:PKCS7_verify:certificate verify error
	 * Note that openssl_error_string() returns an error when verifying is successful, this is a bug in PHP https://bugs.php.net/bug.php?id=50713.
	 *
	 * @return string
	 */
	public function extract_openssl_error() {
		// TODO: should catch more errors by using while($error = @openssl_error_string())
		$this->openssl_error = @openssl_error_string();
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
		$certfile = tempnam(sys_get_temp_dir(), true);
		$outfile = tempnam(sys_get_temp_dir(), true);
		$p7bfile = tempnam(sys_get_temp_dir(), true);
		openssl_pkcs7_verify($emlfile, PKCS7_NOVERIFY, $certfile);
		openssl_pkcs7_verify($emlfile, PKCS7_NOVERIFY, $certfile, [], $certfile, $outfile, $p7bfile);

		$p7b = file_get_contents($p7bfile);

		openssl_pkcs7_read($p7b, $cas);
		unlink($certfile);
		unlink($outfile);
		unlink($p7bfile);

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

		$root = mapi_msgstore_openentry($this->getStore());
		$assocMessage = mapi_folder_createmessage($root, MAPI_ASSOCIATED);
		// TODO: write these properties down.
		mapi_setprops($assocMessage, [
			PR_SUBJECT => $certEmail,
			PR_MESSAGE_CLASS => $type == 'public' ? 'WebApp.Security.Public' : 'WebApp.Security.Private',
			PR_MESSAGE_DELIVERY_TIME => $certData['validTo_time_t'],
			PR_CLIENT_SUBMIT_TIME => $certData['validFrom_time_t'],
			PR_SENDER_NAME => $certData['serialNumber'], // serial
			PR_SENDER_EMAIL_ADDRESS => $issued_by, // Issuer To
			PR_SUBJECT_PREFIX => '',
			PR_RECEIVED_BY_NAME => $this->fingerprint_cert($cert, 'sha1'), // SHA1 Fingerprint
			PR_INTERNET_MESSAGE_ID => $this->fingerprint_cert($cert), // MD5 FingerPrint
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
	 * @param string $hash optional hash algorithm
	 * @param mixed  $body
	 */
	public function fingerprint_cert($body, $hash = 'md5') {
		// TODO: Note for PHP > 5.6 we can use openssl_x509_fingerprint
		$body = str_replace('-----BEGIN CERTIFICATE-----', '', $body);
		$body = str_replace('-----END CERTIFICATE-----', '', $body);
		$body = base64_decode($body);

		if ($hash === 'sha1') {
			$fingerprint = sha1($body);
		}
		else {
			$fingerprint = md5($body);
		}

		// Format 1000AB as 10:00:AB
		return strtoupper(implode(':', str_split($fingerprint, 2)));
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
		$userCertArray = mapi_getprops($user, [PR_EMS_AB_X509_CERT]);
		if (isset($userCertArray[PR_EMS_AB_X509_CERT])) {
			$cert = der2pem($userCertArray[PR_EMS_AB_X509_CERT][0]);
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
		$senderEntryID = isset($messageProps[PR_SENT_REPRESENTING_ENTRYID]) ? $messageProps[PR_SENT_REPRESENTING_ENTRYID] : $messageProps[PR_SENDER_ENTRYID];

		try {
			$senderUser = mapi_ab_openentry($GLOBALS["mapisession"]->getAddressbook(), $senderEntryID);
			if ($senderUser) {
				$userprops = mapi_getprops($senderUser, [PR_ADDRTYPE, PR_DISPLAY_NAME, PR_EMAIL_ADDRESS, PR_SMTP_ADDRESS, PR_OBJECT_TYPE, PR_RECIPIENT_TYPE, PR_DISPLAY_TYPE, PR_DISPLAY_TYPE_EX, PR_ENTRYID]);

				$senderStructure = [];
				$senderStructure["props"]['entryid'] = isset($userprops[PR_ENTRYID]) ? bin2hex($userprops[PR_ENTRYID]) : '';
				$senderStructure["props"]['display_name'] = $userprops[PR_DISPLAY_NAME] ?? '';
				$senderStructure["props"]['email_address'] = $userprops[PR_EMAIL_ADDRESS] ?? '';
				$senderStructure["props"]['smtp_address'] = $userprops[PR_SMTP_ADDRESS] ?? '';
				$senderStructure["props"]['address_type'] = $userprops[PR_ADDRTYPE] ?? '';
				$senderStructure["props"]['object_type'] = $userprops[PR_OBJECT_TYPE];
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
