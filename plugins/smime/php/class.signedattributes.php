<?php

require_once __DIR__ . '/lib/DerEncoder.php';

use WAYF\DerEncoder;

/**
 * Builder for CMS signed attributes per RFC 8551 and related RFCs.
 *
 * Produces DER-encoded attribute blobs suitable for inclusion in
 * CMS SignerInfo signedAttrs.
 */
class SignedAttributes {
	// OIDs for signed attributes
	public const OID_SIGNING_CERT_V2      = '1.2.840.113549.1.9.16.2.47';
	public const OID_CMS_ALGO_PROTECTION  = '1.2.840.113549.1.9.52';
	public const OID_SMIME_CAPABILITIES   = '1.2.840.113549.1.9.15';
	public const OID_CONTENT_TYPE         = '1.2.840.113549.1.9.3';
	public const OID_MESSAGE_DIGEST       = '1.2.840.113549.1.9.4';
	public const OID_SIGNING_TIME         = '1.2.840.113549.1.9.5';

	// Algorithm OIDs
	public const OID_SHA256 = '2.16.840.1.101.3.4.2.1';
	public const OID_SHA384 = '2.16.840.1.101.3.4.2.2';
	public const OID_SHA512 = '2.16.840.1.101.3.4.2.3';

	// Encryption OIDs
	public const OID_AES_256_GCM = '2.16.840.1.101.3.4.1.46';
	public const OID_AES_128_GCM = '2.16.840.1.101.3.4.1.6';
	public const OID_AES_256_CBC = '2.16.840.1.101.3.4.1.42';
	public const OID_AES_128_CBC = '2.16.840.1.101.3.4.1.2';

	private const DIGEST_OIDS = [
		'sha256' => '2.16.840.1.101.3.4.2.1',
		'sha384' => '2.16.840.1.101.3.4.2.2',
		'sha512' => '2.16.840.1.101.3.4.2.3',
	];

	/**
	 * Build ESSCertIDv2 / SigningCertificateV2 attribute (RFC 5035).
	 *
	 * SigningCertificateV2 ::= SEQUENCE {
	 *   certs  SEQUENCE OF ESSCertIDv2
	 * }
	 *
	 * ESSCertIDv2 ::= SEQUENCE {
	 *   hashAlgorithm  AlgorithmIdentifier DEFAULT sha-256,
	 *   certHash       OCTET STRING,
	 *   issuerSerial   IssuerSerial OPTIONAL
	 * }
	 *
	 * @param string $certPem PEM-encoded signing certificate
	 * @param string $hashAlg hash algorithm name (default 'sha256')
	 *
	 * @return string DER-encoded SigningCertificateV2 attribute
	 */
	public function buildSigningCertificateV2(string $certPem, string $hashAlg = 'sha256'): string {
		$certDer = $this->pem2der($certPem);
		$certHash = openssl_digest($certDer, $hashAlg, true);

		// Build ESSCertIDv2
		$essCertId = '';

		// hashAlgorithm — omit for sha256 (DEFAULT)
		if ($hashAlg !== 'sha256') {
			$oid = self::DIGEST_OIDS[$hashAlg] ?? self::DIGEST_OIDS['sha256'];
			$essCertId .= DerEncoder::algorithmIdentifier($oid, '');
		}

		// certHash
		$essCertId .= DerEncoder::octetString($certHash);

		// issuerSerial (optional but recommended)
		$parsed = openssl_x509_parse($certPem);
		if ($parsed !== false) {
			$issuerSerial = $this->buildIssuerSerial($parsed);
			if ($issuerSerial !== '') {
				$essCertId .= $issuerSerial;
			}
		}

		$essCertIdV2 = DerEncoder::sequence($essCertId);

		// SigningCertificateV2: SEQUENCE { certs SEQUENCE OF ESSCertIDv2 }
		$signingCertV2 = DerEncoder::sequence(
			DerEncoder::sequence($essCertIdV2)
		);

		// Wrap as Attribute
		return DerEncoder::attribute(self::OID_SIGNING_CERT_V2, $signingCertV2);
	}

	/**
	 * Build CMSAlgorithmProtection attribute (RFC 6211).
	 *
	 * CMSAlgorithmProtection ::= SEQUENCE {
	 *   digestAlgorithm     AlgorithmIdentifier,
	 *   signatureAlgorithm  [1] AlgorithmIdentifier OPTIONAL,
	 *   macAlgorithm        [2] AlgorithmIdentifier OPTIONAL
	 * }
	 *
	 * @param string $digestOid    digest algorithm OID
	 * @param string $signatureOid signature algorithm OID
	 *
	 * @return string DER-encoded CMSAlgorithmProtection attribute
	 */
	public function buildCmsAlgorithmProtection(string $digestOid, string $signatureOid): string {
		$inner = DerEncoder::algorithmIdentifier($digestOid, '');
		$inner .= DerEncoder::explicit(1, DerEncoder::algorithmIdentifier($signatureOid, ''));

		$value = DerEncoder::sequence($inner);

		return DerEncoder::attribute(self::OID_CMS_ALGO_PROTECTION, $value);
	}

	/**
	 * Build SMIMECapabilities attribute (RFC 8551 Section 2.5.2).
	 *
	 * SMIMECapabilities ::= SEQUENCE OF SMIMECapability
	 * SMIMECapability   ::= SEQUENCE { capabilityID OID, parameters ANY OPTIONAL }
	 *
	 * @param null|array $capabilities ordered list of capabilities.
	 *                                 Each: ['oid' => string, 'params' => string|null]
	 *                                 If null, returns default capability list.
	 *
	 * @return string DER-encoded SMIMECapabilities attribute
	 */
	public function buildSmimeCapabilities(?array $capabilities = null): string {
		if ($capabilities === null) {
			$capabilities = $this->getDefaultCapabilities();
		}

		$caps = '';
		foreach ($capabilities as $cap) {
			$inner = DerEncoder::oid($cap['oid']);
			if (isset($cap['params'])) {
				$inner .= $cap['params'];
			}
			$caps .= DerEncoder::sequence($inner);
		}

		$value = DerEncoder::sequence($caps);

		return DerEncoder::attribute(self::OID_SMIME_CAPABILITIES, $value);
	}

	/**
	 * Get the default SMIMECapabilities list in preference order.
	 *
	 * @return array capabilities
	 */
	public function getDefaultCapabilities(): array {
		$caps = [];

		// AES-256-GCM (preferred)
		$caps[] = ['oid' => self::OID_AES_256_GCM];
		// AES-128-GCM
		$caps[] = ['oid' => self::OID_AES_128_GCM];
		// AES-256-CBC
		$caps[] = ['oid' => self::OID_AES_256_CBC];
		// AES-128-CBC
		$caps[] = ['oid' => self::OID_AES_128_CBC];

		return $caps;
	}

	/**
	 * Parse SMIMECapabilities from a DER-encoded attribute value.
	 *
	 * @param string $der DER-encoded SMIMECapabilities value
	 *
	 * @return array list of capability OIDs
	 */
	public function parseSmimeCapabilities(string $der): array {
		$caps = [];
		$parser = new \WAYF\Der();

		try {
			set_error_handler(function () { return true; });
			// We'd need access to the Der parser internals here.
			// For now, extract OIDs by scanning for the OID tag (0x06)
			$pos = 0;
			$len = strlen($der);
			while ($pos < $len) {
				if (ord($der[$pos]) === 0x06 && $pos + 1 < $len) {
					$oidLen = ord($der[$pos + 1]);
					if ($pos + 2 + $oidLen <= $len) {
						$oidBytes = substr($der, $pos + 2, $oidLen);
						$oid = $this->decodeOid($oidBytes);
						if ($oid !== '') {
							$caps[] = $oid;
						}
					}
					$pos += 2 + $oidLen;
				}
				else {
					++$pos;
				}
			}
			restore_error_handler();
		}
		catch (\Throwable $e) {
			restore_error_handler();
		}

		return $caps;
	}

	/**
	 * Build ESSSecurityLabel attribute (RFC 2634 Section 3.4).
	 *
	 * ESSSecurityLabel ::= SET {
	 *   security-policy-identifier  OBJECT IDENTIFIER,
	 *   security-classification     SecurityClassification OPTIONAL,
	 *   privacy-mark                ESSPrivacyMark OPTIONAL,
	 *   security-categories         SecurityCategories OPTIONAL
	 * }
	 *
	 * @param string   $policyOid      security policy OID
	 * @param null|int $classification classification value (0=unmarked, 1=unclassified, etc.)
	 * @param string   $privacyMark    human-readable privacy mark (optional)
	 *
	 * @return string DER-encoded security label attribute
	 */
	public function buildSecurityLabel(string $policyOid, ?int $classification = null, string $privacyMark = ''): string {
		$inner = DerEncoder::oid($policyOid);

		if ($classification !== null) {
			$inner .= DerEncoder::integer(chr($classification));
		}

		if (!empty($privacyMark)) {
			$inner .= DerEncoder::utf8String($privacyMark);
		}

		$value = DerEncoder::set($inner);

		// id-smime-aa-securityLabel: 1.2.840.113549.1.9.16.2.2
		return DerEncoder::attribute('1.2.840.113549.1.9.16.2.2', $value);
	}

	/**
	 * Build SecureHeaderFields attribute (RFC 7508 / draft-ietf-lamps-header-protection).
	 *
	 * SecureHeaderFields ::= SET OF SecureHeaderField
	 * SecureHeaderField ::= SEQUENCE {
	 *   headerName    UTF8String,
	 *   headerValue   UTF8String
	 * }
	 *
	 * @param array $headers associative array of header name => value
	 *                       Typical: ['Subject' => '...', 'From' => '...', 'To' => '...', 'Date' => '...']
	 *
	 * @return string DER-encoded secure headers attribute
	 */
	public function buildSecureHeaders(array $headers): string {
		$fields = '';
		foreach ($headers as $name => $value) {
			$field = DerEncoder::utf8String($name) . DerEncoder::utf8String($value);
			$fields .= DerEncoder::sequence($field);
		}

		$value = DerEncoder::set($fields);

		// id-smime-aa-secureHeaderFieldsIdentifier: 1.3.6.1.5.5.7.16.22
		return DerEncoder::attribute('1.3.6.1.5.5.7.16.22', $value);
	}

	/**
	 * Build IssuerSerial structure.
	 */
	private function buildIssuerSerial(array $parsed): string {
		// We need issuer DN and serial number
		if (!isset($parsed['issuer']) || !isset($parsed['serialNumber'])) {
			return '';
		}

		// Build a simple issuer GeneralNames containing directoryName
		// For simplicity, we encode serial as INTEGER
		$serialHex = $parsed['serialNumberHex'] ?? dechex((int) $parsed['serialNumber']);
		if (strlen($serialHex) % 2 !== 0) {
			$serialHex = '0' . $serialHex;
		}
		$serialBytes = hex2bin($serialHex);
		// Ensure positive encoding
		if (ord($serialBytes[0]) & 0x80) {
			$serialBytes = "\x00" . $serialBytes;
		}
		$serialDer = DerEncoder::integer($serialBytes);

		// IssuerSerial: SEQUENCE { issuer GeneralNames, serialNumber INTEGER }
		// For the issuer, we'd need the full DER encoding of the issuer DN.
		// This is complex to reconstruct from parsed data, so we omit IssuerSerial
		// when we can't get the raw DER. The field is OPTIONAL in ESSCertIDv2.
		return '';
	}

	/**
	 * Decode OID bytes to dotted notation.
	 */
	private function decodeOid(string $bytes): string {
		if (strlen($bytes) === 0) {
			return '';
		}

		$first = ord($bytes[0]);
		$result = intdiv($first, 40) . '.' . ($first % 40);

		$n = 0;
		for ($i = 1, $len = strlen($bytes); $i < $len; ++$i) {
			$byte = ord($bytes[$i]);
			$n = $n * 128 + ($byte & 0x7F);
			if ($byte < 128) {
				$result .= '.' . $n;
				$n = 0;
			}
		}

		return $result;
	}

	/**
	 * Convert PEM to DER.
	 */
	private function pem2der(string $pem): string {
		$begin = 'CERTIFICATE-----';
		$end = '-----END';
		$pem = substr($pem, strpos($pem, $begin) + strlen($begin));
		$pem = substr($pem, 0, strpos($pem, $end));

		return base64_decode(trim($pem));
	}
}
