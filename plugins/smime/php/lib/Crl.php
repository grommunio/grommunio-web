<?php

namespace WAYF;

require_once __DIR__ . '/Der.php';

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
	 *               'nextUpdate' => string|null, 'revokedSerials' => string[]
	 */
	public function parseCrl(string $der): array {
		$result = [
			'issuer' => '',
			'thisUpdate' => '',
			'nextUpdate' => null,
			'revokedSerials' => [],
		];

		$this->init($der);

		// CertificateList SEQUENCE
		$this->beginsequence();

		// TBSCertList SEQUENCE
		$this->beginsequence();

		// version (optional)
		if ($this->peek() === 2) {
			$this->next(2); // Version INTEGER
		}

		// signature AlgorithmIdentifier
		$this->signatureAlgorithm();

		// issuer Name
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
					$this->der(null, true); // skip extensions
				}
				$this->end();
			}
			$this->end();
		}

		// Skip remaining (crlExtensions, etc.)
		$this->end(); // end TBSCertList

		$this->end(); // end CertificateList

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
