<?php

use WAYF\OCSP;
use WAYF\X509;
use WAYF\X509Helper;

include_once 'lib/X509.php';
include_once 'lib/Ocsp.php';

define('OCSP_CERT_EXPIRED', 1);
define('OCSP_NO_ISSUER', 2);
define('OCSP_NO_RESPONSE', 3);
define('OCSP_RESPONSE_STATUS', 4);
define('OCSP_CERT_STATUS', 5);
define('OCSP_CERT_MISMATCH', 6);
define('OCSP_RESPONSE_TIME_EARLY', 7);
define('OCSP_RESPONSE_TIME_INVALID', 8);
define('OCSP_RESPONSE_SIGNATURE_INVALID', 9);
define('OCSP_RESPONDER_UNAUTHORIZED', 10);
define('OCSP_RESPONSE_MALFORMED', 11);

define('OCSP_CERT_STATUS_GOOD', 1);
define('OCSP_CERT_STATUS_REVOKED', 2);
define('OCSP_CERT_STATUS_UNKOWN', 3);

class OCSPException extends Exception {
	/** @var null|string OCSP certificate status from the response */
	private $status;

	public function setCertStatus($status) {
		$this->status = $status;
	}

	/**
	 * Return the normalized certificate status for an OCSP status exception.
	 *
	 * @return null|int one of OCSP_CERT_STATUS_*, or null for other exceptions
	 */
	public function getCertStatus() {
		if (!$this->status) {
			return;
		}

		if ($this->code !== OCSP_CERT_STATUS) {
			return;
		}

		return match ($this->status) {
			'good' => OCSP_CERT_STATUS_GOOD,
			'revoked' => OCSP_CERT_STATUS_REVOKED,
			default => OCSP_CERT_STATUS_UNKOWN,
		};
	}
}

class Certificate {
	private $cert;
	private $data;
	private $issuer;

	private const OCSP_SIGNATURE_DIGESTS = [
		'sha1WithRSAEncryption' => 'sha1',
		'sha224WithRSAEncryption' => 'sha224',
		'sha256WithRSAEncryption' => 'sha256',
		'sha384WithRSAEncryption' => 'sha384',
		'sha512WithRSAEncryption' => 'sha512',
		'ecdsaWithSHA1' => 'sha1',
		'ecdsaWithSHA224' => 'sha224',
		'ecdsaWithSHA256' => 'sha256',
		'ecdsaWithSHA384' => 'sha384',
		'ecdsaWithSHA512' => 'sha512',
	];

	public function __construct($cert, $issuer = '') {
		// XXX: error handling
		$this->data = openssl_x509_parse($cert);
		$this->cert = $cert;
		$this->issuer = $issuer;
	}

	/**
	 * The name of the certificate in DN notation.
	 *
	 * @return string the name of the certificate
	 */
	public function getName() {
		return $this->data['name'];
	}

	/**
	 * Issuer of the certificate.
	 *
	 * @return string The issuer of the certificate in DN notation
	 */
	public function getIssuerName() {
		$issuer = '';
		foreach ($this->data['issuer'] as $key => $value) {
			$issuer .= "/{$key}={$value}";
		}

		return $issuer;
	}

	/**
	 * Converts X509 DER format string to PEM format.
	 *
	 * @param string $cert X.509 certificate in DER format
	 *
	 * @return string X.509 certificate in PEM format
	 */
	protected function der2pem($cert) {
		return "-----BEGIN CERTIFICATE-----\n" . chunk_split(base64_encode((string) $cert), 64, "\n") . "-----END CERTIFICATE-----\n";
	}

	/**
	 * Converts X509 PEM format string to DER format.
	 *
	 * @param string $pem_data X.509 certificate in PEM format
	 *
	 * @return string X.509 certificate in DER format
	 */
	protected function pem2der($pem_data) {
		$begin = "CERTIFICATE-----";
		$end = "-----END";
		$pem_data = substr((string) $pem_data, strpos((string) $pem_data, $begin) + strlen($begin));
		$pem_data = substr($pem_data, 0, strpos($pem_data, $end));

		return base64_decode($pem_data);
	}

	/**
	 * The subject/emailAddress or subjectAltName.
	 *
	 * @return string The email address belonging to the certificate
	 */
	public function emailAddress() {
		$certEmailAddress = "";
		// If subject/emailAddress is not set, try subjectAltName
		if (isset($this->data['subject']['emailAddress'])) {
			$certEmailAddress = $this->data['subject']['emailAddress'];
		}
		elseif (isset($this->data['extensions'], $this->data['extensions']['subjectAltName'])) {
			// Example [subjectAltName] => email:foo@bar.com, DNS:example.com
			$altNames = explode(',', $this->data['extensions']['subjectAltName']);
			foreach ($altNames as $altName) {
				$altName = trim($altName);
				if (strpos($altName, 'email:') === 0) {
					$certEmailAddress = substr($altName, 6);
					break;
				}
			}
		}

		return $certEmailAddress;
	}

	/**
	 * Return the certificate in DER format.
	 *
	 * @return string certificate in DER format
	 */
	public function der() {
		return $this->pem2der($this->cert);
	}

	/**
	 * Return the certificate in PEM format.
	 *
	 * @return string certificate in PEM format
	 */
	public function pem() {
		return $this->cert;
	}

	/**
	 * The beginning of the valid period of the certificate.
	 *
	 * @return int timestamp from which the certificate is valid
	 */
	public function validFrom() {
		return $this->data['validFrom_time_t'];
	}

	/**
	 * The end of the valid period of the certificate.
	 *
	 * @return int timestamp from which the certificate is invalid
	 */
	public function validTo() {
		return $this->data['validTo_time_t'];
	}

	/**
	 * Determines if the certificate is valid.
	 *
	 * @return bool the valid status
	 */
	public function valid() {
		$time = time();

		return $time > $this->validFrom() && $time < $this->validTo();
	}

	/**
	 * The caURL of the certififcate.
	 *
	 * @return string return an empty string or the CA URL
	 */
	public function caURL() {
		$authorityInfoAccess = $this->authorityInfoAccess();
		if (preg_match("/CA Issuers - URI:(.*)/", $authorityInfoAccess, $matches)) {
			return array_pop($matches);
		}

		return '';
	}

	/**
	 * The OCSP URL of the certificate.
	 *
	 * @return string return an empty string or the OCSP URL
	 */
	public function ocspURL() {
		$authorityInfoAccess = $this->authorityInfoAccess();
		if (preg_match("/OCSP - URI:(.*)/", $authorityInfoAccess, $matches)) {
			return array_pop($matches);
		}

		return '';
	}

	/**
	 * Internal helper to obtain the authorityInfoAccess information.
	 *
	 * @return string authorityInfoAccess if set
	 */
	protected function authorityInfoAccess() {
		if (!isset($this->data['extensions'])) {
			return '';
		}

		if (!isset($this->data['extensions']['authorityInfoAccess'])) {
			return '';
		}

		return $this->data['extensions']['authorityInfoAccess'];
	}

	/**
	 * Get key type information.
	 *
	 * @return array ['type' => string, 'bits' => int, 'curve' => string|null]
	 */
	public function keyType(): array {
		return getKeyTypeInfo($this->cert);
	}

	/**
	 * Get the number of bits in the key.
	 *
	 * @return int key size in bits
	 */
	public function keyBits(): int {
		$info = $this->keyType();

		return $info['bits'];
	}

	/**
	 * Get the EC curve name (if applicable).
	 *
	 * @return null|string curve name or null for non-EC keys
	 */
	public function curveName(): ?string {
		$info = $this->keyType();

		return $info['curve'];
	}

	/**
	 * Get Key Usage flags.
	 *
	 * @return array key usage flags
	 */
	public function keyUsage(): array {
		return getKeyUsage($this->cert);
	}

	/**
	 * Get Extended Key Usage.
	 *
	 * @return array EKU names
	 */
	public function extendedKeyUsage(): array {
		return getExtendedKeyUsage($this->cert);
	}

	/**
	 * Get the Subject Key Identifier.
	 *
	 * @return string hex-encoded SKI or empty string
	 */
	public function subjectKeyIdentifier(): string {
		if (!isset($this->data['extensions']['subjectKeyIdentifier'])) {
			return '';
		}

		return $this->data['extensions']['subjectKeyIdentifier'];
	}

	/**
	 * Get certificate purpose based on Key Usage.
	 *
	 * @return string 'sign', 'encrypt', 'both', or 'unknown'
	 */
	public function purpose(): string {
		return getCertPurpose($this->cert);
	}

	/**
	 * Get CRL Distribution Point URLs.
	 *
	 * @return array list of CRL URLs
	 */
	public function crlURLs(): array {
		if (!isset($this->data['extensions']['crlDistributionPoints'])) {
			return [];
		}

		$urls = [];
		$raw = $this->data['extensions']['crlDistributionPoints'];
		if (preg_match_all('/URI:(https?:\/\/[^\s,]+)/i', $raw, $matches)) {
			$urls = $matches[1];
		}

		return $urls;
	}

	/**
	 * The fingerprint (hash) of the certificate body.
	 *
	 * @param string $hash_algorithm hash algorithm: 'sha256', 'sha1', or 'md5'
	 *
	 * @return string the formatted hash of the certificate's DER body
	 */
	public function fingerprint($hash_algorithm = "sha256") {
		// Prefer openssl_x509_fingerprint() when available (PHP 5.6+)
		if (function_exists('openssl_x509_fingerprint')) {
			$fp = openssl_x509_fingerprint($this->cert, $hash_algorithm);
			if ($fp !== false) {
				return strtoupper(implode(':', str_split($fp, 2)));
			}
		}

		$body = str_replace('-----BEGIN CERTIFICATE-----', '', $this->cert);
		$body = str_replace('-----END CERTIFICATE-----', '', $body);
		$body = base64_decode($body);
		$fingerprint = hash($hash_algorithm, $body);

		// Format 1000AB as 10:00:AB
		return strtoupper(implode(':', str_split($fingerprint, 2)));
	}

	/**
	 * The issuer of this certificate.
	 *
	 * @return null|Certificate the issuer certificate, or null when unavailable
	 */
	public function issuer() {
		if (!empty($this->issuer)) {
			return $this->issuer;
		}

		$caUrl = $this->caURL();
		if (empty($caUrl)) {
			return null;
		}

		foreach (fetchCaIssuerCerts(trim($caUrl)) as $cert) {
			// An AIA response may contain a bundle. Only accept the certificate
			// that actually signed this certificate.
			if (@openssl_x509_verify($this->cert, $cert) === 1) {
				$this->issuer = new Certificate($cert);

				return $this->issuer;
			}
		}

		return null;
	}

	/**
	 * Set the issuer of a certificate.
	 *
	 * @param Certificate $issuer issuer certificate
	 */
	public function setIssuer($issuer) {
		if ($issuer instanceof self) {
			$this->issuer = $issuer;
		}
	}

	/**
	 * Verify the certificate status using OCSP.
	 *
	 * @return bool verification succeeded or failed
	 */
	public function verify() {
		if (!$this->valid()) {
			throw new OCSPException('Certificate expired', OCSP_CERT_EXPIRED);
		}

		$issuerCertificate = $this->issuer();
		if (!$issuerCertificate instanceof self) {
			throw new OCSPException('No issuer', OCSP_NO_ISSUER);
		}
		if (openssl_x509_verify($this->pem(), $issuerCertificate->pem()) !== 1) {
			throw new OCSPException('Certificate issuer signature mismatch', OCSP_NO_ISSUER);
		}

		try {
			$x509 = new X509();
			$issuer = $x509->certificate($issuerCertificate->der(), true);
			$certificate = $x509->certificate($this->der());

			$ocspclient = new OCSP();
			$certID = $ocspclient->certOcspID(
				[
					'issuerName' => $issuer['tbsCertificate']['subject_der'],
					// remember to skip the first byte it is the number of
					// unused bits and it is always 0 for keys and certificates
					'issuerKey' => substr((string) $issuer['tbsCertificate']['subjectPublicKeyInfo']['subjectPublicKey'], 1),
					'serialNumber_der' => $certificate['tbsCertificate']['serialNumber_der'],
					'serialNumber' => $certificate['tbsCertificate']['serialNumber'],
				],
				'sha1'
			);

			$ocspreq = $ocspclient->request([$certID]);

			$ocspUrl = $this->ocspURL();
			// The OCSP URL is empty, import certificate, but show a warning.
			if (strlen($ocspUrl) == 0) {
				throw new OCSPException('The OCSP URL is empty', OCSP_NO_RESPONSE);
			}
			// Do the OCSP request through the same SSRF-safe transport as AIA.
			$derresponse = fetchSmimeHttpResource(
				trim($ocspUrl),
				'POST',
				$ocspreq,
				['Content-Type: application/ocsp-request', 'Accept: application/ocsp-response'],
				1,
				1048576
			);
			// OCSP service not available, import certificate, but show a warning.
			if ($derresponse === false) {
				throw new OCSPException('No response', OCSP_NO_RESPONSE);
			}
			$ocspresponse = $ocspclient->response($derresponse);

			$this->validateOcspResponse($ocspresponse, $certID, $issuerCertificate);
		}
		catch (OCSPException $e) {
			throw $e;
		}
		catch (Throwable $e) {
			throw new OCSPException('Malformed OCSP response: ' . $e->getMessage(), OCSP_RESPONSE_MALFORMED, $e);
		}

		return true;
	}

	/**
	 * Authenticate an OCSP response and return the matching SingleResponse.
	 *
	 * @param array $ocspResponse decoded OCSPResponse
	 * @param array $certId      identifier sent in the request
	 * @param self  $issuer      certificate issuer and responder trust anchor
	 *
	 * @return array matching SingleResponse
	 */
	protected function validateOcspResponse(array $ocspResponse, array $certId, self $issuer): array {
		$status = $ocspResponse['responseStatus'] ?? null;
		if ($status !== 'successful') {
			throw new OCSPException('Response status ' . (string) $status, OCSP_RESPONSE_STATUS);
		}
		if (($ocspResponse['responseBytes']['responseType'] ?? null) !== 'ocspBasic' ||
			!isset($ocspResponse['responseBytes']['BasicOCSPResponse']) ||
			!is_array($ocspResponse['responseBytes']['BasicOCSPResponse'])) {
			throw new OCSPException('Unsupported or missing BasicOCSPResponse', OCSP_RESPONSE_MALFORMED);
		}

		$basicResponse = $ocspResponse['responseBytes']['BasicOCSPResponse'];
		$this->verifyOcspResponseSignature($basicResponse, $issuer);

		$responses = $basicResponse['tbsResponseData']['responses'] ?? null;
		if (!is_array($responses) || $responses === []) {
			throw new OCSPException('OCSP response contains no certificate status', OCSP_RESPONSE_MALFORMED);
		}

		$matchingResponse = null;
		foreach ($responses as $response) {
			if (is_array($response) && $this->ocspCertIdMatches($response['certID'] ?? null, $certId)) {
				$matchingResponse = $response;
				break;
			}
		}
		if ($matchingResponse === null) {
			throw new OCSPException('Certificate mismatch', OCSP_CERT_MISMATCH);
		}

		$this->validateOcspTimes($basicResponse['tbsResponseData'], $matchingResponse);
		if (($matchingResponse['certStatus'] ?? null) !== 'good') {
			$certStatus = (string) ($matchingResponse['certStatus'] ?? 'unknown');
			$exception = new OCSPException('Certificate status ' . $certStatus, OCSP_CERT_STATUS);
			$exception->setCertStatus($certStatus);

			throw $exception;
		}

		return $matchingResponse;
	}

	/**
	 * Verify the BasicOCSPResponse signature and responder authorization.
	 */
	private function verifyOcspResponseSignature(array $basicResponse, self $issuer): void {
		$tbsResponseData = $basicResponse['tbsResponseData'] ?? null;
		$tbsDer = $basicResponse['tbsResponseData_der'] ?? null;
		$signature = $basicResponse['signature'] ?? null;
		$signatureAlgorithm = $basicResponse['signatureAlgorithm'] ?? null;
		if (!is_array($tbsResponseData) || !is_string($tbsDer) || !is_string($signature) ||
			strlen($signature) < 2 || ord($signature[0]) !== 0 || !is_string($signatureAlgorithm)) {
			throw new OCSPException('Invalid BasicOCSPResponse signature fields', OCSP_RESPONSE_MALFORMED);
		}

		$digest = self::OCSP_SIGNATURE_DIGESTS[$signatureAlgorithm] ?? null;
		$pssParameters = null;
		if ($signatureAlgorithm === 'rsaPSS') {
			$parametersDer = $basicResponse['signatureAlgorithmParameters'] ?? null;
			if (!is_string($parametersDer)) {
				throw new OCSPException('RSASSA-PSS response has no parameters', OCSP_RESPONSE_SIGNATURE_INVALID);
			}

			try {
				$pssParameters = (new OCSP())->rsaPssParameters($parametersDer);
			}
			catch (Throwable $e) {
				throw new OCSPException('Invalid RSASSA-PSS parameters: ' . $e->getMessage(), OCSP_RESPONSE_SIGNATURE_INVALID, $e);
			}
			if ($pssParameters['trailerField'] !== 1) {
				throw new OCSPException('Unsupported RSASSA-PSS trailer field', OCSP_RESPONSE_SIGNATURE_INVALID);
			}
		}
		elseif ($digest === null) {
			throw new OCSPException("Unsupported OCSP signature algorithm {$signatureAlgorithm}", OCSP_RESPONSE_SIGNATURE_INVALID);
		}

		$x509 = new X509();
		// OpenSSL checked the issuer relationship before OCSP decoding. The
		// minimal decoder may leave name constraints uninterpreted, but unknown
		// critical and delegated-responder extensions remain fail-closed.
		$issuerData = $x509->certificate($issuer->der(), true);
		$candidates = [[
			'certificate' => $issuer->pem(),
			'data' => $issuerData,
			'isIssuer' => true,
		]];
		foreach ($basicResponse['certs'] ?? [] as $certificateData) {
			if (!is_array($certificateData) || !isset($certificateData['certificate_der'])) {
				throw new OCSPException('Malformed embedded OCSP responder certificate', OCSP_RESPONSE_MALFORMED);
			}
			$certificateDer = $certificateData['certificate_der'];
			if (!is_string($certificateDer)) {
				throw new OCSPException('Malformed embedded OCSP responder certificate', OCSP_RESPONSE_MALFORMED);
			}
			$candidates[] = [
				'certificate' => $this->der2pem($certificateDer),
				'data' => $certificateData,
				'isIssuer' => hash_equals(hash('sha256', $issuer->der(), true), hash('sha256', $certificateDer, true)),
			];
		}

		$responderId = $tbsResponseData['responderID'] ?? null;
		$signer = null;
		foreach ($candidates as $candidate) {
			if ($this->ocspResponderMatches($responderId, $candidate['data'])) {
				$signer = $candidate;
				break;
			}
		}
		if ($signer === null) {
			throw new OCSPException('OCSP responderID does not match a signer certificate', OCSP_RESPONDER_UNAUTHORIZED);
		}

		$this->authorizeOcspResponder($signer, $issuer);
		$publicKey = openssl_pkey_get_public($signer['certificate']);
		$signatureValue = substr($signature, 1);
		if ($publicKey === false || ($pssParameters === null
			? openssl_verify($tbsDer, $signatureValue, $publicKey, $digest) !== 1
			: !$this->verifyRsaPssSignature($tbsDer, $signatureValue, $publicKey, $pssParameters))) {
			throw new OCSPException('Invalid OCSP response signature', OCSP_RESPONSE_SIGNATURE_INVALID);
		}
	}

	/**
	 * Verify an RSASSA-PSS signature without relying on version-specific PHP padding APIs.
	 *
	 * @param OpenSSLAsymmetricKey|resource $publicKey
	 * @param array{hash: string, mgfHash: string, saltLength: int, trailerField: int} $parameters
	 */
	private function verifyRsaPssSignature(string $data, string $signature, $publicKey, array $parameters): bool {
		$keyDetails = openssl_pkey_get_details($publicKey);
		if ($keyDetails === false || ($keyDetails['type'] ?? null) !== OPENSSL_KEYTYPE_RSA ||
			!isset($keyDetails['bits']) || $keyDetails['bits'] < 512) {
			return false;
		}

		$modulusBits = (int) $keyDetails['bits'];
		$encodedLength = intdiv($modulusBits - 1 + 7, 8);
		if (strlen($signature) !== intdiv($modulusBits + 7, 8) ||
			!@openssl_public_decrypt($signature, $encoded, $publicKey, OPENSSL_NO_PADDING)) {
			return false;
		}
		if (strlen($encoded) > $encodedLength &&
			trim(substr($encoded, 0, -$encodedLength), "\x00") !== '') {
			return false;
		}
		if (strlen($encoded) > $encodedLength) {
			$encoded = substr($encoded, -$encodedLength);
		}

		$hash = $parameters['hash'];
		$mgfHash = $parameters['mgfHash'];
		$saltLength = $parameters['saltLength'];
		$hashLength = strlen(hash($hash, '', true));
		if (strlen($encoded) !== $encodedLength || $saltLength < 0 ||
			$encodedLength < $hashLength + $saltLength + 2 ||
			$encoded[$encodedLength - 1] !== "\xBC") {
			return false;
		}

		$dataBlockLength = $encodedLength - $hashLength - 1;
		$maskedDataBlock = substr($encoded, 0, $dataBlockLength);
		$encodedHash = substr($encoded, $dataBlockLength, $hashLength);
		$unusedBits = (8 * $encodedLength) - ($modulusBits - 1);
		if ($unusedBits > 0 && (ord($maskedDataBlock[0]) & (0xFF << (8 - $unusedBits))) !== 0) {
			return false;
		}

		$dataBlock = $maskedDataBlock ^ $this->mgf1($encodedHash, $dataBlockLength, $mgfHash);
		if ($unusedBits > 0) {
			$dataBlock[0] = chr(ord($dataBlock[0]) & (0xFF >> $unusedBits));
		}
		$paddingLength = $encodedLength - $hashLength - $saltLength - 2;
		if (substr($dataBlock, 0, $paddingLength) !== str_repeat("\x00", $paddingLength) ||
			$dataBlock[$paddingLength] !== "\x01") {
			return false;
		}

		$salt = $saltLength === 0 ? '' : substr($dataBlock, -$saltLength);
		$messageHash = hash($hash, $data, true);
		$expectedHash = hash($hash, str_repeat("\x00", 8) . $messageHash . $salt, true);

		return hash_equals($expectedHash, $encodedHash);
	}

	private function mgf1(string $seed, int $length, string $algorithm): string {
		$mask = '';
		for ($counter = 0; strlen($mask) < $length; ++$counter) {
			$mask .= hash($algorithm, $seed . pack('N', $counter), true);
		}

		return substr($mask, 0, $length);
	}

	/**
	 * Require either the issuing CA or a directly delegated OCSP signing certificate.
	 *
	 * @param array $signer candidate certificate and decoded fields
	 */
	private function authorizeOcspResponder(array $signer, self $issuer): void {
		$parsed = openssl_x509_parse($signer['certificate']);
		$now = time();
		if ($parsed === false || ($parsed['validFrom_time_t'] ?? PHP_INT_MAX) > $now ||
			($parsed['validTo_time_t'] ?? 0) < $now) {
			throw new OCSPException('OCSP responder certificate is not currently valid', OCSP_RESPONDER_UNAUTHORIZED);
		}
		if ($signer['isIssuer']) {
			return;
		}

		if (openssl_x509_verify($signer['certificate'], $issuer->pem()) !== 1) {
			throw new OCSPException('OCSP responder was not issued by the certificate issuer', OCSP_RESPONDER_UNAUTHORIZED);
		}
		$extensions = $signer['data']['tbsCertificate']['extensions'] ?? [];
		if (empty($extensions['extKeyUsage']['extnValue']['ocspSigning'])) {
			throw new OCSPException('Delegated OCSP responder lacks the OCSPSigning EKU', OCSP_RESPONDER_UNAUTHORIZED);
		}
		if (isset($extensions['keyUsage']) && empty($extensions['keyUsage']['extnValue']['digitalSignature'])) {
			throw new OCSPException('Delegated OCSP responder cannot sign digitally', OCSP_RESPONDER_UNAUTHORIZED);
		}
	}

	/**
	 * Check that a responderID identifies the certificate used to sign the response.
	 *
	 * @param mixed $responderId
	 */
	private function ocspResponderMatches($responderId, array $certificateData): bool {
		if (!is_array($responderId)) {
			return false;
		}
		if (isset($responderId['byName']) && is_array($responderId['byName'])) {
			$helper = new X509Helper();
			$subject = $certificateData['tbsCertificate']['subject_'] ?? null;

			return is_string($subject) && hash_equals($subject, $helper->nameasstring($responderId['byName']));
		}
		if (isset($responderId['byKey']) && is_string($responderId['byKey'])) {
			$subjectPublicKey = $certificateData['tbsCertificate']['subjectPublicKeyInfo']['subjectPublicKey'] ?? null;
			if (!is_string($subjectPublicKey) || strlen($subjectPublicKey) < 2 || ord($subjectPublicKey[0]) !== 0) {
				return false;
			}
			$expected = strtolower((string) preg_replace('/[^0-9a-f]/i', '', $responderId['byKey']));
			$actual = sha1(substr($subjectPublicKey, 1));

			return strlen($expected) === 40 && hash_equals($expected, $actual);
		}

		return false;
	}

	/**
	 * Compare a decoded CertID with the request without timing-dependent hash comparisons.
	 *
	 * @param mixed $responseCertId
	 */
	private function ocspCertIdMatches($responseCertId, array $requestCertId): bool {
		if (!is_array($responseCertId) ||
			!isset($requestCertId['hash_alg_name'], $requestCertId['issuerNameHash'],
				$requestCertId['issuerKeyHash'], $requestCertId['serialNumber'])) {
			return false;
		}
		$responseAlgorithm = str_replace('-', '', strtolower((string) ($responseCertId['hashAlgorithm'] ?? '')));
		$requestAlgorithm = str_replace('-', '', strtolower((string) $requestCertId['hash_alg_name']));

		return $responseAlgorithm === $requestAlgorithm &&
			$this->ocspValueMatches($responseCertId['issuerNameHash'] ?? null, $requestCertId['issuerNameHash']) &&
			$this->ocspValueMatches($responseCertId['issuerKeyHash'] ?? null, $requestCertId['issuerKeyHash']) &&
			(string) ($responseCertId['serialNumber'] ?? '') === (string) $requestCertId['serialNumber'];
	}

	private function ocspValueMatches($actual, $expected): bool {
		return is_string($actual) && is_string($expected) && strlen($actual) === strlen($expected) && hash_equals($expected, $actual);
	}

	/**
	 * Enforce the OCSP production/status validity window and local replay limit.
	 */
	private function validateOcspTimes(array $responseData, array $singleResponse): void {
		$producedAt = $this->parseOcspTime($responseData['producedAt'] ?? null);
		$thisUpdate = $this->parseOcspTime($singleResponse['thisUpdate'] ?? null);
		$now = time();
		$clockSkew = defined('PLUGIN_SMIME_OCSP_CLOCK_SKEW') ? max(0, (int) PLUGIN_SMIME_OCSP_CLOCK_SKEW) : 300;
		$maxAge = defined('PLUGIN_SMIME_OCSP_MAX_AGE') ? max(1, (int) PLUGIN_SMIME_OCSP_MAX_AGE) : 86400;

		if ($producedAt > $now + $clockSkew || $thisUpdate > $now + $clockSkew) {
			throw new OCSPException('OCSP response time is in the future', OCSP_RESPONSE_TIME_EARLY);
		}
		if ($thisUpdate > $producedAt + $clockSkew) {
			throw new OCSPException('OCSP thisUpdate is later than producedAt', OCSP_RESPONSE_TIME_INVALID);
		}
		if ($thisUpdate < $now - $maxAge - $clockSkew) {
			throw new OCSPException('OCSP response is older than the configured maximum age', OCSP_RESPONSE_TIME_INVALID);
		}
		if (isset($singleResponse['nextupdate'])) {
			$nextUpdate = $this->parseOcspTime($singleResponse['nextupdate']);
			if ($nextUpdate < $thisUpdate || $nextUpdate < $now - $clockSkew) {
				throw new OCSPException('OCSP response has expired', OCSP_RESPONSE_TIME_INVALID);
			}
		}
	}

	/**
	 * Parse the normalized DER GeneralizedTime emitted by the OCSP decoder.
	 *
	 * @param mixed $value
	 */
	private function parseOcspTime($value): int {
		if (!is_string($value)) {
			throw new OCSPException('Missing OCSP response time', OCSP_RESPONSE_MALFORMED);
		}
		$time = DateTimeImmutable::createFromFormat('!YmdHis\Z', $value, new DateTimeZone('UTC'));
		$errors = DateTimeImmutable::getLastErrors();
		if ($time === false || ($errors !== false && ($errors['warning_count'] > 0 || $errors['error_count'] > 0))) {
			throw new OCSPException('Invalid OCSP response time', OCSP_RESPONSE_MALFORMED);
		}

		return $time->getTimestamp();
	}
}
