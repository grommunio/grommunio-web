<?php

/**
 * Per-recipient capability storage and algorithm negotiation.
 *
 * Stores SMIMECapabilities received from correspondents and uses them
 * to select the best common algorithm when encrypting to multiple recipients.
 *
 * Capabilities are stored as MAPI associated messages with class
 * 'WebApp.Security.Capabilities'.
 */
class AlgorithmStore {
	/** @var resource MAPI message store */
	private $store;

	// Algorithm preference order (most preferred first)
	private const CIPHER_PREFERENCE = [
		'aes-256-gcm',
		'aes-128-gcm',
		'aes-256-cbc',
		'aes-128-cbc',
	];

	// OID to cipher name mapping
	private const OID_TO_CIPHER = [
		'2.16.840.1.101.3.4.1.46' => 'aes-256-gcm',
		'2.16.840.1.101.3.4.1.6'  => 'aes-128-gcm',
		'2.16.840.1.101.3.4.1.42' => 'aes-256-cbc',
		'2.16.840.1.101.3.4.1.2'  => 'aes-128-cbc',
		'1.2.840.113549.3.7'      => '3des-cbc',
	];

	public function __construct($store) {
		$this->store = $store;
	}

	/**
	 * Get stored capabilities for an email address.
	 *
	 * @param string $email recipient email address
	 *
	 * @return null|array capabilities data or null if not stored
	 */
	public function getCapabilities(string $email): ?array {
		$root = mapi_msgstore_openentry($this->store);
		$table = mapi_folder_getcontentstable($root, MAPI_ASSOCIATED);

		$restrict = [RES_AND, [
			[RES_PROPERTY, [
				RELOP => RELOP_EQ,
				ULPROPTAG => PR_MESSAGE_CLASS,
				VALUE => [PR_MESSAGE_CLASS => 'WebApp.Security.Capabilities'],
			]],
			[RES_CONTENT, [
				FUZZYLEVEL => FL_FULLSTRING | FL_IGNORECASE,
				ULPROPTAG => PR_SUBJECT,
				VALUE => [PR_SUBJECT => $email],
			]],
		]];

		mapi_table_restrict($table, $restrict, TBL_BATCH);
		$rows = mapi_table_queryallrows($table, [PR_ENTRYID, PR_BODY, PR_CLIENT_SUBMIT_TIME]);

		if (empty($rows)) {
			return null;
		}

		// Get the most recent entry
		$msg = mapi_msgstore_openentry($this->store, $rows[0][PR_ENTRYID]);
		if ($msg === false) {
			return null;
		}

		$stream = mapi_openproperty($msg, PR_BODY, IID_IStream, 0, 0);
		if (!$stream) {
			return null;
		}

		$stat = mapi_stream_stat($stream);
		mapi_stream_seek($stream, 0, STREAM_SEEK_SET);
		$json = '';
		for ($i = 0; $i < $stat['cb']; $i += 1024) {
			$json .= mapi_stream_read($stream, 1024);
		}

		$data = json_decode($json, true);
		if (!is_array($data)) {
			return null;
		}

		return $data;
	}

	/**
	 * Store capabilities for an email address.
	 * Only updates if the signing time is newer than what's stored.
	 *
	 * @param string   $email       correspondent's email
	 * @param array    $caps        list of capability OIDs
	 * @param null|int $signingTime Unix timestamp from the signing-time attribute
	 */
	public function storeCapabilities(string $email, array $caps, ?int $signingTime = null): void {
		$existing = $this->getCapabilities($email);
		if ($existing !== null && $signingTime !== null) {
			$existingTime = $existing['signing_time'] ?? 0;
			if ($signingTime <= $existingTime) {
				return; // Don't overwrite newer data
			}
		}

		$data = [
			'capabilities' => $caps,
			'signing_time' => $signingTime ?? time(),
			'updated_at' => time(),
		];

		$json = json_encode($data);

		// Delete existing entry for this email
		$this->deleteCapabilities($email);

		// Create new entry
		$root = mapi_msgstore_openentry($this->store);
		$msg = mapi_folder_createmessage($root, MAPI_ASSOCIATED);
		mapi_setprops($msg, [
			PR_SUBJECT => $email,
			PR_MESSAGE_CLASS => 'WebApp.Security.Capabilities',
			PR_CLIENT_SUBMIT_TIME => $signingTime ?? time(),
		]);

		$stream = mapi_openproperty($msg, PR_BODY, IID_IStream, 0, MAPI_CREATE | MAPI_MODIFY);
		mapi_stream_setsize($stream, strlen($json));
		mapi_stream_write($stream, $json);
		mapi_stream_commit($stream);
		mapi_message_savechanges($msg);
	}

	/**
	 * Select the best common algorithm for a set of recipients.
	 *
	 * Returns the most-preferred cipher that all recipients support.
	 * If no common cipher exists (or no capabilities are stored),
	 * falls back to AES-256-CBC (universal support per RFC).
	 *
	 * @param array $recipientEmails list of recipient email addresses
	 *
	 * @return string cipher name
	 */
	public function selectAlgorithm(array $recipientEmails): string {
		if (empty($recipientEmails)) {
			return defined('PLUGIN_SMIME_CIPHER_NAME') ? PLUGIN_SMIME_CIPHER_NAME : 'aes-256-cbc';
		}

		$recipientCaps = [];
		$allHaveCaps = true;

		foreach ($recipientEmails as $email) {
			$caps = $this->getCapabilities($email);
			if ($caps === null || empty($caps['capabilities'])) {
				$allHaveCaps = false;
				break;
			}

			// Convert OIDs to cipher names
			$cipherNames = [];
			foreach ($caps['capabilities'] as $oid) {
				if (isset(self::OID_TO_CIPHER[$oid])) {
					$cipherNames[] = self::OID_TO_CIPHER[$oid];
				}
			}
			$recipientCaps[] = $cipherNames;
		}

		if (!$allHaveCaps || empty($recipientCaps)) {
			return 'aes-256-cbc';
		}

		// Find the best common cipher
		foreach (self::CIPHER_PREFERENCE as $cipher) {
			$supported = true;
			foreach ($recipientCaps as $caps) {
				if (!in_array($cipher, $caps, true)) {
					$supported = false;
					break;
				}
			}
			if ($supported) {
				return $cipher;
			}
		}

		return 'aes-256-cbc';
	}

	/**
	 * Delete stored capabilities for an email.
	 */
	private function deleteCapabilities(string $email): void {
		$root = mapi_msgstore_openentry($this->store);
		$table = mapi_folder_getcontentstable($root, MAPI_ASSOCIATED);

		$restrict = [RES_AND, [
			[RES_PROPERTY, [
				RELOP => RELOP_EQ,
				ULPROPTAG => PR_MESSAGE_CLASS,
				VALUE => [PR_MESSAGE_CLASS => 'WebApp.Security.Capabilities'],
			]],
			[RES_CONTENT, [
				FUZZYLEVEL => FL_FULLSTRING | FL_IGNORECASE,
				ULPROPTAG => PR_SUBJECT,
				VALUE => [PR_SUBJECT => $email],
			]],
		]];

		mapi_table_restrict($table, $restrict, TBL_BATCH);
		$rows = mapi_table_queryallrows($table, [PR_ENTRYID]);

		foreach ($rows as $row) {
			mapi_folder_deletemessages($root, [$row[PR_ENTRYID]]);
		}
	}
}
