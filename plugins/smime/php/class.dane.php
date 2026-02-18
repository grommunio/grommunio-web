<?php

/**
 * DANE/SMIMEA DNS lookup (RFC 8162).
 *
 * Queries DNS for SMIMEA records that contain S/MIME certificates
 * or certificate constraints for a given email address.
 *
 * Record format: _<hash>._smimecert.<domain>
 * where <hash> = SHA-256(UTF-8(local-part))[0:28] in hex
 */
class DaneLookup {
	// SMIMEA certificate usage values
	public const USAGE_PKIX_TA = 0;  // CA constraint
	public const USAGE_PKIX_EE = 1;  // Service certificate constraint
	public const USAGE_DANE_TA = 2;  // Trust anchor assertion
	public const USAGE_DANE_EE = 3;  // Domain-issued certificate

	// SMIMEA selector values
	public const SELECTOR_FULL = 0;     // Full certificate
	public const SELECTOR_SPKI = 1;     // SubjectPublicKeyInfo

	// SMIMEA matching type values
	public const MATCH_EXACT  = 0;   // Exact match
	public const MATCH_SHA256 = 1;   // SHA-256 hash
	public const MATCH_SHA512 = 2;   // SHA-512 hash

	/**
	 * Look up SMIMEA records for an email address.
	 *
	 * @param string $email email address to look up
	 *
	 * @return array list of SMIMEA records, each with keys:
	 *               'usage', 'selector', 'matching_type', 'data'
	 */
	public function lookup(string $email): array {
		$parts = explode('@', $email, 2);
		if (count($parts) !== 2) {
			return [];
		}

		[$localPart, $domain] = $parts;

		// SHA-256 hash of the local part, truncated to 28 octets (56 hex chars)
		$hash = substr(hash('sha256', mb_strtolower($localPart, 'UTF-8')), 0, 56);
		$qname = $hash . '._smimecert.' . $domain;

		return $this->querySmimea($qname);
	}

	/**
	 * Query DNS for SMIMEA (type 53) records.
	 *
	 * @param string $qname DNS query name
	 *
	 * @return array parsed records
	 */
	private function querySmimea(string $qname): array {
		$records = [];

		// Try dns_get_record with raw type 53 (SMIMEA)
		// Note: PHP's dns_get_record may not support type 53 on all systems
		$dnsRecords = @dns_get_record($qname, DNS_ANY);
		if ($dnsRecords === false || empty($dnsRecords)) {
			// Fallback: try using dig command
			return $this->querySmimeaDig($qname);
		}

		foreach ($dnsRecords as $record) {
			if (($record['type'] ?? '') === 'SMIMEA' || ($record['type'] ?? '') === 'TYPE53') {
				$parsed = $this->parseSmimeaRdata($record['txt'] ?? $record['data'] ?? '');
				if ($parsed !== null) {
					$records[] = $parsed;
				}
			}
		}

		return $records;
	}

	/**
	 * Query SMIMEA using dig CLI as fallback.
	 */
	private function querySmimeaDig(string $qname): array {
		$records = [];

		$cmd = sprintf(
			'dig +short +dnssec SMIMEA %s 2>/dev/null',
			escapeshellarg($qname)
		);

		$output = @shell_exec($cmd);
		if (empty($output)) {
			return [];
		}

		foreach (explode("\n", trim($output)) as $line) {
			$line = trim($line);
			if (empty($line)) {
				continue;
			}

			$parts = preg_split('/\s+/', $line, 4);
			if (count($parts) >= 4) {
				$records[] = [
					'usage' => (int) $parts[0],
					'selector' => (int) $parts[1],
					'matching_type' => (int) $parts[2],
					'data' => hex2bin(str_replace(' ', '', $parts[3])),
				];
			}
		}

		return $records;
	}

	/**
	 * Parse SMIMEA RDATA from a hex or binary string.
	 */
	private function parseSmimeaRdata(string $data): ?array {
		if (strlen($data) < 4) {
			return null;
		}

		// If hex-encoded, decode first
		if (ctype_xdigit(str_replace(' ', '', $data))) {
			$data = hex2bin(str_replace(' ', '', $data));
		}

		if (strlen($data) < 4) {
			return null;
		}

		return [
			'usage' => ord($data[0]),
			'selector' => ord($data[1]),
			'matching_type' => ord($data[2]),
			'data' => substr($data, 3),
		];
	}

	/**
	 * Verify a certificate against a SMIMEA record.
	 *
	 * @param string $certPem PEM certificate
	 * @param array  $record  SMIMEA record
	 *
	 * @return bool true if certificate matches the record
	 */
	public function verifyCertificate(string $certPem, array $record): bool {
		$certDer = $this->pem2der($certPem);
		if ($certDer === false) {
			return false;
		}

		$selector = $record['selector'];
		$matchingType = $record['matching_type'];
		$recordData = $record['data'];

		// Select the data to compare
		if ($selector === self::SELECTOR_FULL) {
			$certData = $certDer;
		}
		elseif ($selector === self::SELECTOR_SPKI) {
			// Extract SubjectPublicKeyInfo — would need ASN.1 parsing
			// For now, use openssl to extract the public key
			$pubkey = openssl_pkey_get_public($certPem);
			if ($pubkey === false) {
				return false;
			}
			$details = openssl_pkey_get_details($pubkey);
			$certData = $details['key'] ?? '';
		}
		else {
			return false;
		}

		// Compare based on matching type
		switch ($matchingType) {
			case self::MATCH_EXACT:
				return $certData === $recordData;

			case self::MATCH_SHA256:
				return hash('sha256', $certData, true) === $recordData;

			case self::MATCH_SHA512:
				return hash('sha512', $certData, true) === $recordData;

			default:
				return false;
		}
	}

	/**
	 * Convert PEM to DER.
	 */
	private function pem2der(string $pem): string|false {
		$begin = 'CERTIFICATE-----';
		$end = '-----END';
		$start = strpos($pem, $begin);
		if ($start === false) {
			return false;
		}
		$pem = substr($pem, $start + strlen($begin));
		$endPos = strpos($pem, $end);
		if ($endPos === false) {
			return false;
		}
		$pem = substr($pem, 0, $endPos);

		return base64_decode(trim($pem));
	}
}
