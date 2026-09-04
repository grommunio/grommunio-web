<?php

namespace WAYF;

require_once __DIR__ . '/Der.php';
require_once __DIR__ . '/X509.php';

/**
 * CRL DER parser — extracts revoked certificate serial numbers from
 * X.509 CRL structures (RFC 5280 Section 5).
 *
 * CertificateList ::= SEQUENCE {
 *   tbsCertList    TBSCertList,
 *   signatureAlgorithm AlgorithmIdentifier,
 *   signature      BIT STRING
 * }
 *
 * TBSCertList ::= SEQUENCE {
 *   version            Version OPTIONAL, -- if present, MUST be v2
 *   signature          AlgorithmIdentifier,
 *   issuer             Name,
 *   thisUpdate         Time,
 *   nextUpdate         Time OPTIONAL,
 *   revokedCertificates SEQUENCE OF SEQUENCE { ... } OPTIONAL,
 *   crlExtensions      [0] Extensions OPTIONAL
 * }
 */
class CrlParser extends Der {
	/**
	 * Parse a DER-encoded CRL.
	 *
	 * @param string $der raw CRL bytes
	 *
	 * @return array parsed CRL with keys:
	 *               'issuer' => string, 'thisUpdate' => string,
	 *               'nextUpdate' => string|null, 'revokedSerials' => string[],
	 *               'tbsCertList_der' => string, 'signatureAlgorithm' => string,
	 *               'signature' => string
	 */
	public function parseCrl(string $der): array {
		$result = [
			'version' => null,
			'issuer' => '',
			'issuer_der' => '',
			'thisUpdate' => '',
			'nextUpdate' => null,
			'revokedSerials' => [],
		];

		$this->init($der);

		// CertificateList SEQUENCE
		$this->beginsequence();

		// TBSCertList SEQUENCE
		$result['tbsCertList_der'] = $this->der();
		$this->beginsequence();

		// version (optional)
		if ($this->peek() === 2) {
			$result['version'] = $this->next(2);
			if ($result['version'] !== '1') {
				throw new \UnexpectedValueException('Unsupported CRL version');
			}
		}

		// signature AlgorithmIdentifier
		$result['tbsSignatureAlgorithm'] = $this->signatureAlgorithm();

		// issuer Name
		$result['issuer_der'] = $this->der();
		$issuer = $this->name();
		$helper = new X509Helper();
		$result['issuer'] = $helper->nameasstring($issuer);

		// thisUpdate Time
		$result['thisUpdate'] = $this->time();

		// nextUpdate Time (optional)
		if ($this->in()) {
			$peek = $this->peek();
			if ($peek === 23 || $peek === 24) {
				$result['nextUpdate'] = $this->time();
			}
		}

		// revokedCertificates (optional) — SEQUENCE OF SEQUENCE
		if ($this->in() && $this->peek() === 16) {
			$this->beginsequence();
			while ($this->in()) {
				$this->beginsequence();
				// userCertificate CertificateSerialNumber
				$serial = $this->next(2);
				$result['revokedSerials'][] = (string) $serial;
				// revocationDate Time
				$this->time();
				// crlEntryExtensions (optional)
				if ($this->in() && $this->peek() === 16) {
					if ($result['version'] === null) {
						throw new \UnexpectedValueException('CRL entry extensions require a version 2 CRL');
					}
					// Parse the extension wrapper so unsupported critical entry
					// extensions fail closed instead of being silently ignored.
					$this->extensions();
				}
				$this->end();
			}
			$this->end();
		}

		// crlExtensions [0] EXPLICIT Extensions OPTIONAL
		if ($this->in() && $this->peek() === 0) {
			if ($result['version'] === null) {
				throw new \UnexpectedValueException('CRL extensions require a version 2 CRL');
			}
			$this->begin(0);
			$result['extensions'] = $this->extensions();
			$this->end();
		}
		$this->end(); // end TBSCertList

		$result['signatureAlgorithm'] = $this->signatureAlgorithm();
		$result['signature'] = $this->next(3);
		$this->end(); // end CertificateList
		if ($this->i !== strlen($der)) {
			throw new \UnexpectedValueException('Trailing data after DER CRL');
		}

		return $result;
	}

	/**
	 * Check if a specific serial number is in the revoked list.
	 *
	 * @param string $crlDer DER-encoded CRL
	 * @param string $serial serial number to check (as decimal string)
	 *
	 * @return bool true if revoked
	 */
	public function checkSerial(string $crlDer, string $serial): bool {
		$parsed = $this->parseCrl($crlDer);

		return in_array($serial, $parsed['revokedSerials'], true);
	}
}
