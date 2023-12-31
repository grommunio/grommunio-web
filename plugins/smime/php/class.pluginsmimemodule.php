<?php

include_once 'util.php';

define('CHANGE_PASSPHRASE_SUCCESS', 1);
define('CHANGE_PASSPHRASE_ERROR', 2);
define('CHANGE_PASSPHRASE_WRONG', 3);

class PluginSmimeModule extends Module {
	/**
	 * Constructor.
	 *
	 * @param int    $id            unique id
	 * @param string $folderentryid Entryid of the folder. Data will be selected from this folder.
	 * @param array  $data          list of all actions
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
	public function execute() {
		foreach ($this->data as $actionType => $actionData) try {
			if (!isset($actionType))
				continue;
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
				$root = mapi_msgstore_openentry($this->store, null);
				mapi_folder_deletemessages($root, [hex2bin($entryid)]);

				$this->sendFeedback(true);
				break;

			default:
				$this->handleUnknownActionType($actionType);
			}
		}
		catch (Exception $e) {
			$this->sendFeedback(false, parent::errorDetailsFromException($e));
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
			$message = _('No certificate avaliable');
		}
		else {
			// For each certificate in MAPI store
			$smtpAddress = $GLOBALS['mapisession']->getSMTPAddress();
			for ($i = 0, $cnt = count($privateCerts); $i < $cnt; ++$i) {
				// Check if certificate is still valid
				// TODO: create a more generic function which verifyies if the certificate is valid
				// And remove possible duplication from plugin.smime.php->onUploadCertificate
				if ($privateCerts[$i][PR_MESSAGE_DELIVERY_TIME] < time()) { // validTo
					$message = _('Private certificate is not valid yet, unable to sign email');
				}
				elseif ($privateCerts[$i][PR_CLIENT_SUBMIT_TIME] >= time()) { // validFrom
					$message = _('Private certificate has been expired, unable to sign email');
				}
				elseif (strcasecmp($privateCerts[$i][PR_SUBJECT], $smtpAddress) !== 0) {
					$message = _('Private certificate does not match email address');
				}
				else {
					$status = true;
					$message = '';
					$certIdx = $i;
				}
			}
		}

		return [
			'message' => $message,
			'status' => $status,
			'data' => [
				'validto' => $privateCerts[$certIdx][PR_MESSAGE_DELIVERY_TIME] ?? '',
				'validFrom' => $privateCerts[$certIdx][PR_CLIENT_SUBMIT_TIME] ?? '',
				'subject' => $privateCerts[$certIdx][PR_SUBJECT] ?? 'Unknown',
			],
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

		$root = mapi_msgstore_openentry($this->store, null);
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
			$item['entryid'] = bin2hex($cert[PR_ENTRYID]);
			$item['email'] = $cert[PR_SUBJECT];
			$item['validto'] = $cert[PR_MESSAGE_DELIVERY_TIME];
			$item['validfrom'] = $cert[PR_CLIENT_SUBMIT_TIME];
			$item['serial'] = $cert[PR_SENDER_NAME];
			$item['issued_by'] = $cert[PR_SENDER_EMAIL_ADDRESS];
			$item['issued_to'] = $cert[PR_SUBJECT_PREFIX];
			$item['fingerprint_sha1'] = $cert[PR_RECEIVED_BY_NAME];
			$item['fingerprint_md5'] = $cert[PR_INTERNET_MESSAGE_ID];
			$item['type'] = strtolower($cert[PR_MESSAGE_CLASS]) == 'webapp.security.public' ? 'public' : 'private';
			array_push($items, ['props' => $item]);
		}
		$data['page']['start'] = 0;
		$data['page']['rowcount'] = mapi_table_getrowcount($table);
		$data['page']['totalrowcount'] = $data['page']['rowcount'];

		return array_merge($data, ['item' => $items]);
	}

	/*
	 * Changes the passphrase of an already stored certificatem by generating
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

		$msgBody = base64_encode($cert);
		$stream = mapi_openproperty($privateCert, PR_BODY, IID_IStream, 0, MAPI_CREATE | MAPI_MODIFY);
		mapi_stream_setsize($stream, strlen($msgBody));
		mapi_stream_write($stream, $msgBody);
		mapi_stream_commit($stream);
		mapi_message_savechanges($privateCert);

		return CHANGE_PASSPHRASE_SUCCESS;
	}

	/**
	 * Generate a new  PKCS#12 certificate store file with a new passphrase.
	 *
	 * @param array  $certs          the original certificate
	 * @param string $passphrase     the passphrase
	 * @param mixed  $new_passphrase
	 *
	 * @return mixed boolean or string certificate
	 */
	public function pkcs12_change_passphrase($certs, $new_passphrase) {
		$cert = "";
		$extracerts = isset($certs['extracerts']) ? $certs['extracerts'] : [];
		if (openssl_pkcs12_export($certs['cert'], $cert, $certs['pkey'], $new_passphrase, ['extracerts' => $extracerts])) {
			return $cert;
		}

		return false;
	}
}
