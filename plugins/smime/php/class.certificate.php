<?php

use WAYF\OCSP;
use WAYF\X509;

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

define('OCSP_CERT_STATUS_GOOD', 1);
define('OCSP_CERT_STATUS_REVOKED', 2);
define('OCSP_CERT_STATUS_UNKOWN', 3);

class OCSPException extends Exception {
	private $status;

	public function setCertStatus($status) {
		$this->status = $status;
	}

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

function tempErrorHandler($errno, $errstr, $errfile, $errline) {
	return true;
}

class Certificate {
	private $cert;
	private $data;
	private $issuer;

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
	 * @param string X509 Certificate in DER format
	 * @param mixed $cert
	 *
	 * @return string X509 Certificate in PEM format
	 */
	protected function der2pem($cert) {
		return "-----BEGIN CERTIFICATE-----\n" . chunk_split(base64_encode((string) $cert), 64, "\n") . "-----END CERTIFICATE-----\n";
	}

	/**
	 * Converts X509 PEM format string to DER format.
	 *
	 * @param string X509 Certificate in PEM format
	 * @param mixed $pem_data
	 *
	 * @return string X509 Certificate in DER format
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

		$ch = curl_init();
		curl_setopt($ch, CURLOPT_URL, $caUrl);
		curl_setopt($ch, CURLOPT_FAILONERROR, true);
		curl_setopt($ch, CURLOPT_RETURNTRANSFER, 1);
		curl_setopt($ch, CURLOPT_TIMEOUT, 10);

		// HTTP Proxy settings
		if (defined('PLUGIN_SMIME_PROXY') && PLUGIN_SMIME_PROXY != '') {
			curl_setopt($ch, CURLOPT_PROXY, PLUGIN_SMIME_PROXY);
		}
		if (defined('PLUGIN_SMIME_PROXY_PORT') && PLUGIN_SMIME_PROXY_PORT != '') {
			curl_setopt($ch, CURLOPT_PROXYPORT, PLUGIN_SMIME_PROXY_PORT);
		}
		if (defined('PLUGIN_SMIME_PROXY_USERPWD') && PLUGIN_SMIME_PROXY_USERPWD != '') {
			curl_setopt($ch, CURLOPT_PROXYUSERPWD, PLUGIN_SMIME_PROXY_USERPWD);
		}

		$output = curl_exec($ch);
		$http_status = curl_getinfo($ch, CURLINFO_HTTP_CODE);
		$curl_error = curl_error($ch);
		curl_close($ch);

		if ($curl_error || $http_status !== 200 || empty($output)) {
			Log::Write(LOGLEVEL_ERROR, sprintf("[smime] Error when downloading intermediate certificate '%s', http status: '%s'", $curl_error, $http_status));

			return null;
		}

		// Detect PEM vs DER format — AIA URLs typically serve DER, but
		// some CAs return PEM.
		if (strpos($output, '-----BEGIN CERTIFICATE-----') !== false) {
			$cert = $output;
		}
		else {
			$cert = $this->der2pem($output);
		}

		$this->issuer = new Certificate($cert);

		return $this->issuer;
	}

	/**
	 * Set the issuer of a certificate.
	 *
	 * @param string the issuer certificate
	 * @param mixed $issuer
	 */
	public function setIssuer($issuer) {
		if (is_object($issuer)) {
			$this->issuer = $issuer;
		}
	}

	/**
	 * Verify the certificate status using OCSP.
	 *
	 * @return bool verification succeeded or failed
	 */
	public function verify() {
		$message = [];

		if (!$this->valid()) {
			throw new OCSPException('Certificate expired', OCSP_CERT_EXPIRED);
		}

		$issuer = $this->issuer();
		if (!is_object($issuer)) {
			throw new OCSPException('No issuer', OCSP_NO_ISSUER);
		}

		/* Set custom error handler since the nemid ocsp library uses
		 * trigger_error() to throw errors when it cannot parse certain
		 * x509 fields which are not required for the OCSP Request.
		 * Also when receiving the OCSP request, the OCSP library
		 * triggers errors when the request does not adhere to the
		 * standard.
		 */
		set_error_handler("tempErrorHandler");

		$x509 = new X509();
		$issuer = $x509->certificate($issuer->der());
		$certificate = $x509->certificate($this->der());

		$ocspclient = new OCSP();
		$certID = $ocspclient->certOcspID(
			[
				'issuerName' => $issuer['tbsCertificate']['subject_der'],
				// remember to skip the first byte it is the number of
				// unused bits and it is always 0 for keys and certificates
				'issuerKey' => substr((string) $issuer['tbsCertificate']['subjectPublicKeyInfo']['subjectPublicKey'], 1),
				'serialNumber_der' => $certificate['tbsCertificate']['serialNumber_der'],
			],
			'sha1'
		);

		$ocspreq = $ocspclient->request([$certID]);

		$stream_options = [
			'http' => [
				'ignore_errors' => false,
				'method' => 'POST',
				'header' => 'Content-type: application/ocsp-request' . "\r\n",
				'content' => $ocspreq,
				'timeout' => 1,
			],
		];

		$ocspUrl = $this->ocspURL();
		// The OCSP URL is empty, import certificate, but show a warning.
		if (strlen($ocspUrl) == 0) {
			throw new OCSPException('The OCSP URL is empty', OCSP_NO_RESPONSE);
		}
		// Do the OCSP request
		$context = stream_context_create($stream_options);
		$derresponse = file_get_contents($ocspUrl, false, $context);
		// OCSP service not available, import certificate, but show a warning.
		if ($derresponse === false) {
			throw new OCSPException('No response', OCSP_NO_RESPONSE);
		}
		$ocspresponse = $ocspclient->response($derresponse);

		// Restore the previous error handler
		restore_error_handler();

		// responseStatuses: successful, malformedRequest,
		// internalError, tryLater, sigRequired, unauthorized.
		if (isset($ocspresponse['responseStatus']) &&
			$ocspresponse['responseStatus'] !== 'successful') {
			throw new OCSPException('Response status' . $ocspresponse['responseStatus'], OCSP_RESPONSE_STATUS);
		}

		$resp = $ocspresponse['responseBytes']['BasicOCSPResponse']['tbsResponseData']['responses'][0];
		/*
		 * OCSP response status, possible values are: good, revoked,
		 * unknown according to the RFC
		 * https://www.ietf.org/rfc/rfc2560.txt
		 */
		if ($resp['certStatus'] !== 'good') {
			// Certificate status is not good, revoked or unknown
			$exception = new OCSPException('Certificate status ' . $resp['certStatus'], OCSP_CERT_STATUS);
			$exception->setCertStatus($resp['certStatus']);

			throw $exception;
		}

		/* Check if:
		 * - hash algorithm is equal
		 * - check if issuerNamehash is the same from response
		 * - check if issuerKeyHash is the same from response
		 * - check if serialNumber is the same from response
		 */
		if ($resp['certID']['hashAlgorithm'] !== 'sha1' ||
			$resp['certID']['issuerNameHash'] !== $certID['issuerNameHash'] ||
			$resp['certID']['issuerKeyHash'] !== $certID['issuerKeyHash'] ||
			$resp['certID']['serialNumber'] !== $certID['serialNumber']) {
			// OCSP Revocation, mismatch between original and checked certificate
			throw new OCSPException('Certificate mismatch', OCSP_CERT_MISMATCH);
		}

		// RFC 2560: response is current if thisUpdate <= now <= nextUpdate
		$now = new DateTime(gmdate('YmdHis\Z'));
		$thisUpdate = new DateTime($resp['thisUpdate']);

		if ($thisUpdate > $now) {
			throw new OCSPException('OCSP response thisUpdate is in the future', OCSP_RESPONSE_TIME_EARLY);
		}

		if (isset($resp['nextUpdate'])) {
			$nextUpdate = new DateTime($resp['nextUpdate']);
			if ($now > $nextUpdate) {
				throw new OCSPException('OCSP response has expired (now > nextUpdate)', OCSP_RESPONSE_TIME_INVALID);
			}
		}
	}
}
