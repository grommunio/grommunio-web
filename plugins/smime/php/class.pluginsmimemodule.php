<?php

include_once 'util.php';
require_once 'class.cmsoperations.php';
require_once 'class.smimecapabilities.php';

define('CHANGE_PASSPHRASE_SUCCESS', 1);
define('CHANGE_PASSPHRASE_ERROR', 2);
define('CHANGE_PASSPHRASE_WRONG', 3);

class PluginSmimeModule extends Module {
	private $store;

	/**
	 * Constructor.
	 *
	 * @param int   $id   unique id
	 * @param array $data list of all actions
	 */
	public function __construct($id, $data) {
		$this->store = $GLOBALS['mapisession']->getDefaultMessageStore();
		parent::__construct($id, $data);
	}

	/**
	 * Executes all the actions in the $data variable.
	 *
	 * @return bool true on success or false on failure
	 */
	#[Override]
	public function execute() {
		foreach ($this->data as $actionType => $actionData) {
			try {
				switch ($actionType) {
					case 'certificate':
						$data = $this->verifyCertificate($actionData);
						$response = [
							'type' => 3,
							'status' => $data['status'],
							'message' => $data['message'],
							'data' => $data['data'],
						];
						$this->addActionData('certificate', $response);
						$GLOBALS['bus']->addData($this->getResponseData());
						break;

					case 'passphrase':
						$data = $this->verifyPassphrase($actionData);
						$response = [
							'type' => 3,
							'status' => $data['status'],
						];
						$this->addActionData('passphrase', $response);
						$GLOBALS['bus']->addData($this->getResponseData());
						break;

					case 'changepassphrase':
						$data = $this->changePassphrase($actionData);
						if ($data === CHANGE_PASSPHRASE_SUCCESS) {
							// Reset cached passphrase.
							$encryptionStore = EncryptionStore::getInstance();
							withPHPSession(function () use ($encryptionStore) {
								$encryptionStore->add('smime', '');
							});
						}
						$response = [
							'type' => 3,
							'code' => $data,
						];
						$this->addActionData('changepassphrase', $response);
						$GLOBALS['bus']->addData($this->getResponseData());
						break;

					case 'list':
						$data = $this->getPublicCertificates();
						$this->addActionData('list', $data);
						$GLOBALS['bus']->addData($this->getResponseData());
						break;

					case 'delete':
						// FIXME: handle multiple deletes? Separate function?
						$entryid = $actionData['entryid'];
						$root = mapi_msgstore_openentry($this->store);
						mapi_folder_deletemessages($root, [hex2bin((string) $entryid)]);

						$this->sendFeedback(true);
						break;

					case 'algorithms':
						$data = $this->getSupportedAlgorithms();
						$this->addActionData('algorithms', $data);
						$GLOBALS['bus']->addData($this->getResponseData());
						break;

					case 'certsonly':
						$data = $this->generateCertsOnlyMessage($actionData);
						$this->addActionData('certsonly', $data);
						$GLOBALS['bus']->addData($this->getResponseData());
						break;

					case 'danelookup':
						$data = $this->lookupDaneCertificates($actionData);
						$this->addActionData('danelookup', $data);
						$GLOBALS['bus']->addData($this->getResponseData());
						break;

					case 'ldaplookup':
						$data = $this->lookupLdapCertificates($actionData);
						$this->addActionData('ldaplookup', $data);
						$GLOBALS['bus']->addData($this->getResponseData());
						break;

					default:
						$this->handleUnknownActionType($actionType);
				}
			}
			catch (Exception $e) {
				$this->sendFeedback(false, parent::errorDetailsFromException($e));
			}
		}
	}

	/**
	 * Verifies the users private certificate,
	 * returns array with three statuses and a message key containing a message for the user.
	 * 1. There is a certificate and valid
	 * 2. There is a certificate and not valid
	 * 3. No certificate
	 * FIXME: in the future we might support multiple private certs.
	 *
	 * @param array $data which contains the data send from JavaScript
	 *
	 * @return array $data which returns two keys containing the certificate
	 */
	public function verifyCertificate($data) {
		$message = '';
		$status = false;

		$privateCerts = getMAPICert($this->store);
		$certIdx = -1;

		// No certificates
		if (!$privateCerts || count($privateCerts) === 0) {
			$message = _('No certificate available');
		}
		else {
			// For each certificate in MAPI store
			$smtpAddress = $GLOBALS['mapisession']->getSMTPAddress();
			for ($i = 0, $cnt = count($privateCerts); $i < $cnt; ++$i) {
				// Check if certificate is still valid
				// TODO: create a more generic function which verifies if the certificate is valid
				// And remove possible duplication from plugin.smime.php->onUploadCertificate
				if ($privateCerts[$i][PR_MESSAGE_DELIVERY_TIME] < time()) { // validTo
					$message = _('Private certificate has expired, unable to sign email');
				}
				elseif ($privateCerts[$i][PR_CLIENT_SUBMIT_TIME] >= time()) { // validFrom
					$message = _('Private certificate is not valid yet, unable to sign email');
				}
				elseif (strcasecmp((string) $privateCerts[$i][PR_SUBJECT], (string) $smtpAddress) !== 0) {
					$message = _('Private certificate does not match email address');
				}
				else {
					$status = true;
					$message = '';
					$certIdx = $i;
					break;
				}
			}
		}

		$data = [];
		if ($certIdx >= 0) {
			$data = [
				'validto' => $privateCerts[$certIdx][PR_MESSAGE_DELIVERY_TIME] ?? '',
				'validFrom' => $privateCerts[$certIdx][PR_CLIENT_SUBMIT_TIME] ?? '',
				'subject' => $privateCerts[$certIdx][PR_SUBJECT] ?? 'Unknown',
			];

			// Try to get key type info from the actual certificate
			$certBody = $this->readCertificateBody($privateCerts[$certIdx][PR_ENTRYID]);
			if ($certBody !== '') {
				$certs = [];
				if (openssl_pkcs12_read(base64_decode($certBody), $certs, '')) {
					// Can't read without passphrase, key type info will be added from MAPI props
				}
				// Add basic key type from stored metadata if available
				$keyTypeInfo = $this->getStoredKeyType($privateCerts[$certIdx]);
				if ($keyTypeInfo !== null) {
					$data['key_type'] = $keyTypeInfo['type'];
					$data['key_bits'] = $keyTypeInfo['bits'];
					$data['curve_name'] = $keyTypeInfo['curve'];
				}
			}
		}

		return [
			'message' => $message,
			'status' => $status,
			'data' => $data,
		];
	}

	/**
	 * Verify if the supplied passphrase unlocks the private certificate stored in the mapi
	 * userstore.
	 *
	 * @param array $data which contains the data send from JavaScript
	 *
	 * @return array $data which contains a key 'stats'
	 */
	public function verifyPassphrase($data) {
		$result = readPrivateCert($this->store, $data['passphrase']);

		if ($result) {
			$encryptionStore = EncryptionStore::getInstance();
			if (encryptionStoreExpirationSupport()) {
				$encryptionStore->add('smime', $data['passphrase'], time() + (5 * 60));
			}
			else {
				withPHPSession(function () use ($encryptionStore, $data) {
					$encryptionStore->add('smime', $data['passphrase']);
				});
			}
			$result = true;
		}
		else {
			$result = false;
		}

		return [
			'status' => $result,
		];
	}

	/**
	 * Returns data for the JavaScript CertificateStore 'list' call.
	 *
	 * @return array $data which contains a list of public certificates
	 */
	public function getPublicCertificates() {
		$items = [];
		$data['page'] = [];

		$root = mapi_msgstore_openentry($this->store);
		$table = mapi_folder_getcontentstable($root, MAPI_ASSOCIATED);

		// restriction for public/private certificates which are stored in the root associated folder
		$restrict = [RES_OR, [
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
					ULPROPTAG => PR_MESSAGE_CLASS,
					VALUE => [PR_MESSAGE_CLASS => "WebApp.Security.Private"],
				],
			], ],
		];
		mapi_table_restrict($table, $restrict, TBL_BATCH);
		mapi_table_sort($table, [PR_MESSAGE_DELIVERY_TIME => TABLE_SORT_DESCEND], TBL_BATCH);
		$certs = mapi_table_queryallrows($table, [PR_SUBJECT, PR_ENTRYID, PR_MESSAGE_DELIVERY_TIME, PR_CLIENT_SUBMIT_TIME, PR_MESSAGE_CLASS, PR_SENDER_NAME, PR_SENDER_EMAIL_ADDRESS, PR_SUBJECT_PREFIX, PR_RECEIVED_BY_NAME, PR_INTERNET_MESSAGE_ID], $restrict);
		foreach ($certs as $cert) {
			$item = [];
			$item['entryid'] = bin2hex((string) $cert[PR_ENTRYID]);
			$item['email'] = $cert[PR_SUBJECT];
			$item['validto'] = $cert[PR_MESSAGE_DELIVERY_TIME];
			$item['validfrom'] = $cert[PR_CLIENT_SUBMIT_TIME];
			$item['serial'] = $cert[PR_SENDER_NAME];
			$item['issued_by'] = $cert[PR_SENDER_EMAIL_ADDRESS];
			$item['issued_to'] = $cert[PR_SUBJECT_PREFIX];
			$item['fingerprint_sha1'] = $cert[PR_RECEIVED_BY_NAME];
			$item['fingerprint_md5'] = $cert[PR_INTERNET_MESSAGE_ID]; // Now stores SHA-256 (field name kept for backward compat)
			$msgClass = strtolower((string) $cert[PR_MESSAGE_CLASS]);
			$item['type'] = ($msgClass === 'webapp.security.public') ? 'public' : 'private';

			// Extract key type info from the certificate body
			$certBody = $this->readCertificateBody($cert[PR_ENTRYID]);
			$keyTypeInfo = $this->getKeyTypeFromBody($certBody, $item['type']);
			$item['key_type'] = $keyTypeInfo['type'] ?? 'unknown';
			$item['key_bits'] = $keyTypeInfo['bits'] ?? 0;
			$item['curve_name'] = $keyTypeInfo['curve'] ?? '';
			$item['purpose'] = $keyTypeInfo['purpose'] ?? 'both';

			array_push($items, ['props' => $item]);
		}
		$data['page']['start'] = 0;
		$data['page']['rowcount'] = mapi_table_getrowcount($table);
		$data['page']['totalrowcount'] = $data['page']['rowcount'];

		return array_merge($data, ['item' => $items]);
	}

	/*
	 * Changes the passphrase of an already stored certificate by generating
	 * a new PKCS12 container.
	 *
	 * @param Array $actionData contains the passphrase and new passphrase
	 * return Number error number
	 */
	public function changePassphrase($actionData) {
		$certs = readPrivateCert($this->store, $actionData['passphrase']);

		if (empty($certs)) {
			return CHANGE_PASSPHRASE_WRONG;
		}

		$cert = $this->pkcs12_change_passphrase($certs, $actionData['new_passphrase']);

		if ($cert === false) {
			return CHANGE_PASSPHRASE_ERROR;
		}

		$mapiCerts = getMAPICert($this->store);
		$mapiCert = $mapiCerts[0] ?? [];
		if (!$mapiCert || empty($mapiCert)) {
			return CHANGE_PASSPHRASE_ERROR;
		}
		$privateCert = mapi_msgstore_openentry($this->store, $mapiCert[PR_ENTRYID]);

		$msgBody = base64_encode((string) $cert);
		$stream = mapi_openproperty($privateCert, PR_BODY, IID_IStream, 0, MAPI_CREATE | MAPI_MODIFY);
		mapi_stream_setsize($stream, strlen($msgBody));
		mapi_stream_write($stream, $msgBody);
		mapi_stream_commit($stream);
		mapi_message_savechanges($privateCert);

		return CHANGE_PASSPHRASE_SUCCESS;
	}

	/**
	 * Return supported algorithms from SmimeCapabilities.
	 *
	 * @return array algorithms data
	 */
	public function getSupportedAlgorithms() {
		$caps = SmimeCapabilities::getInstance();

		return [
			'encryption' => $caps->getSupportedEncryptionAlgorithms(),
			'signature' => $caps->getSupportedSignatureAlgorithms(),
			'digest' => $caps->getSupportedDigestAlgorithms(),
			'environment' => $caps->getEnvironmentInfo(),
		];
	}

	/**
	 * Read certificate body from MAPI store.
	 *
	 * @param string $entryid binary entry ID
	 *
	 * @return string base64-encoded certificate body or empty string
	 */
	private function readCertificateBody($entryid) {
		$msg = mapi_msgstore_openentry($this->store, $entryid);
		if ($msg === false) {
			return '';
		}

		$stream = mapi_openproperty($msg, PR_BODY, IID_IStream, 0, 0);
		if (!$stream) {
			return '';
		}

		$stat = mapi_stream_stat($stream);
		mapi_stream_seek($stream, 0, STREAM_SEEK_SET);
		$body = '';
		for ($i = 0; $i < $stat['cb']; $i += 1024) {
			$body .= mapi_stream_read($stream, 1024);
		}

		return $body;
	}

	/**
	 * Get key type information from a certificate body.
	 *
	 * @param string $certBody base64-encoded certificate
	 * @param string $type     'public' or 'private'
	 *
	 * @return array key type info
	 */
	private function getKeyTypeFromBody($certBody, $type) {
		$result = ['type' => 'unknown', 'bits' => 0, 'curve' => null, 'purpose' => 'both'];

		if (empty($certBody)) {
			return $result;
		}

		$decoded = base64_decode($certBody);
		if ($decoded === false) {
			return $result;
		}

		if ($type === 'public') {
			// Public cert is PEM
			$pem = $decoded;
			if (strpos($pem, '-----BEGIN') === false) {
				$pem = "-----BEGIN CERTIFICATE-----\n" . chunk_split(base64_encode($decoded), 64, "\n") . "-----END CERTIFICATE-----\n";
			}
		}
		else {
			// Private is PKCS#12 — can't read without passphrase for key type
			// Try to read just the cert part
			$pem = $decoded;
		}

		$keyInfo = getKeyTypeInfo($pem);
		if ($keyInfo['type'] !== 'unknown') {
			$result['type'] = $keyInfo['type'];
			$result['bits'] = $keyInfo['bits'];
			$result['curve'] = $keyInfo['curve'];
			$result['purpose'] = getCertPurpose($pem);
		}

		return $result;
	}

	/**
	 * Get stored key type metadata from MAPI properties.
	 *
	 * @param array $certProps MAPI certificate properties
	 *
	 * @return null|array key type info or null
	 */
	private function getStoredKeyType($certProps) {
		// Key type metadata is stored in PR_SUBJECT_PREFIX as JSON
		$prefix = $certProps[PR_SUBJECT_PREFIX] ?? '';
		if (empty($prefix)) {
			return null;
		}

		$data = json_decode($prefix, true);
		if (!is_array($data) || !isset($data['type'])) {
			return null;
		}

		return $data;
	}

	/**
	 * Generate a certs-only PKCS7 message for certificate exchange.
	 *
	 * @param array $actionData action data with 'email' key
	 *
	 * @return array result with certs-only data
	 */
	private function generateCertsOnlyMessage($actionData) {
		$email = $actionData['email'] ?? '';
		if (empty($email)) {
			return ['status' => false, 'message' => _('No email address specified')];
		}

		// Collect public certs for this email
		$certs = getMAPICert($this->store, 'WebApp.Security.Public', $email);
		if (!$certs || count($certs) === 0) {
			return ['status' => false, 'message' => _('No certificates found for this email address')];
		}

		$certPems = [];
		foreach ($certs as $cert) {
			$msg = mapi_msgstore_openentry($this->store, $cert[PR_ENTRYID]);
			if ($msg === false) {
				continue;
			}
			$stream = mapi_openproperty($msg, PR_BODY, IID_IStream, 0, 0);
			if (!$stream) {
				continue;
			}
			$stat = mapi_stream_stat($stream);
			mapi_stream_seek($stream, 0, STREAM_SEEK_SET);
			$body = '';
			for ($i = 0; $i < $stat['cb']; $i += 1024) {
				$body .= mapi_stream_read($stream, 1024);
			}
			$decoded = base64_decode($body);
			if (!empty($decoded)) {
				$certPems[] = $decoded;
			}
		}

		if (empty($certPems)) {
			return ['status' => false, 'message' => _('Unable to read certificates')];
		}

		$cms = new CmsOperations();
		$tmpOut = tempnam(sys_get_temp_dir(), 'smime_co_');
		$ok = $cms->generateCertsOnly($certPems, $tmpOut);

		if (!$ok) {
			@unlink($tmpOut);

			return ['status' => false, 'message' => _('Unable to generate certs-only message')];
		}

		$content = file_get_contents($tmpOut);
		@unlink($tmpOut);

		return [
			'status' => true,
			'data' => base64_encode($content),
			'content_type' => 'application/pkcs7-mime; smime-type=certs-only; name="smime.p7c"',
		];
	}

	/**
	 * Look up certificates for an email via DANE/SMIMEA (RFC 8162).
	 *
	 * @param array $actionData action data with 'email' key
	 *
	 * @return array lookup result
	 */
	private function lookupDaneCertificates($actionData) {
		$email = $actionData['email'] ?? '';
		if (empty($email)) {
			return ['status' => false, 'records' => []];
		}

		require_once __DIR__ . '/class.dane.php';
		$dane = new DaneLookup();
		$records = $dane->lookup($email);

		return [
			'status' => !empty($records),
			'records' => array_map(function ($r) {
				return [
					'usage' => $r['usage'],
					'selector' => $r['selector'],
					'matching_type' => $r['matching_type'],
					'data' => base64_encode($r['data']),
				];
			}, $records),
		];
	}

	/**
	 * Look up certificates for an email via LDAP.
	 *
	 * @param array $actionData action data with 'email' and optional LDAP config
	 *
	 * @return array lookup result
	 */
	private function lookupLdapCertificates($actionData) {
		$email = $actionData['email'] ?? '';
		if (empty($email)) {
			return ['status' => false, 'certs' => []];
		}

		require_once __DIR__ . '/class.ldapcerts.php';

		$ldapUri = $actionData['ldap_uri'] ?? (defined('PLUGIN_SMIME_LDAP_URI') ? PLUGIN_SMIME_LDAP_URI : '');
		$baseDn = $actionData['base_dn'] ?? (defined('PLUGIN_SMIME_LDAP_BASE_DN') ? PLUGIN_SMIME_LDAP_BASE_DN : '');
		$bindDn = defined('PLUGIN_SMIME_LDAP_BIND_DN') ? PLUGIN_SMIME_LDAP_BIND_DN : '';
		$bindPw = defined('PLUGIN_SMIME_LDAP_BIND_PASSWORD') ? PLUGIN_SMIME_LDAP_BIND_PASSWORD : '';

		if (empty($ldapUri) || empty($baseDn)) {
			return ['status' => false, 'certs' => [], 'message' => _('LDAP not configured')];
		}

		$ldap = new LdapCertLookup($ldapUri, $baseDn, $bindDn, $bindPw);
		$certs = $ldap->lookup($email);

		return [
			'status' => !empty($certs),
			'certs' => array_map('base64_encode', $certs),
		];
	}

	/**
	 * Generate a new  PKCS#12 certificate store file with a new passphrase.
	 *
	 * @param array $certs          the original certificate
	 * @param mixed $new_passphrase
	 *
	 * @return mixed boolean or string certificate
	 */
	public function pkcs12_change_passphrase($certs, $new_passphrase) {
		$cert = "";
		$extracerts = $certs['extracerts'] ?? [];
		if (openssl_pkcs12_export($certs['cert'], $cert, $certs['pkey'], $new_passphrase, ['extracerts' => $extracerts])) {
			return $cert;
		}

		return false;
	}
}
