<?php

use WAYF\CrlParser;
use WAYF\X509;

require_once __DIR__ . '/lib/Crl.php';

/**
 * CRL manager — fetches, caches, and checks certificate revocation lists.
 *
 * CRL Distribution Points are extracted from the certificate's extensions.
 * Downloaded CRLs are cached to disk with a configurable TTL.
 */
class CrlManager {
	/** @var string cache directory */
	private string $cacheDir;

	/** @var int maximum cache age in seconds */
	private int $maxAge;

	/** @var int maximum downloaded CRL size in bytes */
	private int $maxBytes;

	private const SIGNATURE_DIGESTS = [
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

	public function __construct() {
		$this->cacheDir = defined('PLUGIN_SMIME_CRL_CACHE_DIR')
			? PLUGIN_SMIME_CRL_CACHE_DIR
			: (defined('TMP_PATH') ? TMP_PATH : sys_get_temp_dir()) . '/smime/crl';
		$this->maxAge = defined('PLUGIN_SMIME_CRL_MAX_AGE')
			? max(0, (int) PLUGIN_SMIME_CRL_MAX_AGE)
			: 86400;
		$this->maxBytes = defined('PLUGIN_SMIME_CRL_MAX_BYTES')
			? max(1, (int) PLUGIN_SMIME_CRL_MAX_BYTES)
			: 8388608;
	}

	/**
	 * Check if a certificate has been revoked via CRL.
	 *
	 * @param Certificate $cert certificate to check
	 *
	 * @return null|bool true if revoked, false if not revoked, null if CRL unavailable
	 */
	public function isRevoked(Certificate $cert): ?bool {
		$cdpUrls = $cert->crlURLs();
		if (empty($cdpUrls)) {
			return null;
		}

		$parsed = openssl_x509_parse($cert->pem());
		if ($parsed === false) {
			return null;
		}
		$serial = $parsed['serialNumber'] ?? '';
		if (empty($serial)) {
			return null;
		}
		$issuer = $cert->issuer();
		if (!$issuer instanceof Certificate || openssl_x509_verify($cert->pem(), $issuer->pem()) !== 1) {
			return null;
		}

		$checked = false;
		foreach ($cdpUrls as $url) {
			$crlDer = $this->fetchCrl($url, $issuer);
			if ($crlDer === null) {
				continue;
			}

			$revoked = $this->checkCrlForSerial($crlDer, (string) $serial, $issuer);
			if ($revoked === null) {
				continue;
			}
			$checked = true;
			if ($revoked) {
				return true;
			}
		}

		return $checked ? false : null;
	}

	/**
	 * Fetch a CRL from a URL, using cache if available.
	 *
	 * @param string $url CRL distribution point URL
	 * @param null|Certificate $issuer issuer used to authenticate cached/downloaded CRLs
	 *
	 * @return null|string raw DER CRL data, or null on failure
	 */
	public function fetchCrl(string $url, ?Certificate $issuer = null): ?string {
		$cacheFile = $this->getCachePath($url);

		// Only use a structurally valid, current cache entry. Signature and
		// issuer checks are performed by checkCrlForSerial() before it is trusted.
		if ($cacheFile !== null && is_file($cacheFile) && !is_link($cacheFile)) {
			$stat = stat($cacheFile);
			if ($stat !== false && (time() - $stat['mtime']) < $this->maxAge && $stat['size'] <= $this->maxBytes) {
				$content = file_get_contents($cacheFile);
				if (is_string($content)) {
					$parsed = $this->parseCurrentCrl($content);
					if ($parsed !== null && ($issuer === null || $this->authenticateCrl($parsed, $issuer))) {
						return $content;
					}
				}
			}
		}

		// CRL URLs come from untrusted certificates. Reuse the AIA/OCSP
		// transport so private destinations, redirects and oversized responses
		// are rejected and the checked DNS result is pinned.
		if (!function_exists('fetchSmimeHttpResource')) {
			return null;
		}
		$data = fetchSmimeHttpResource($url, 'GET', '', [], 15, $this->maxBytes);
		if (!is_string($data) || $data === '') {
			$logUrl = preg_replace('/[^\x20-\x7e]/', '?', $url);
			error_log(sprintf("[smime] Refused or failed to fetch CRL from '%s'", $logUrl));

			return null;
		}

		// Detect PEM vs DER
		if (str_contains($data, '-----BEGIN X509 CRL-----')) {
			if (preg_match('/-----BEGIN X509 CRL-----\s*([A-Za-z0-9+\/=\r\n]+)\s*-----END X509 CRL-----/', $data, $matches) !== 1) {
				return null;
			}
			$data = base64_decode(preg_replace('/\s+/', '', $matches[1]), true);
			if (!is_string($data)) {
				return null;
			}
		}
		$parsed = $this->parseCurrentCrl($data);
		if ($parsed === null || ($issuer !== null && !$this->authenticateCrl($parsed, $issuer))) {
			return null;
		}

		// Cache atomically. The entry remains untrusted until its signature is
		// checked against the certificate issuer by the caller.
		if ($cacheFile !== null && $issuer !== null) {
			$this->writeCacheFile($cacheFile, $data);
		}

		return $data;
	}

	/**
	 * Check if a serial number appears in a CRL.
	 *
	 * @param string $crlDer raw DER CRL data
	 * @param string $serial certificate serial number (decimal)
	 * @param null|Certificate $issuer certificate that issued both the CRL and certificate
	 *
	 * @return null|bool true if revoked, false if not revoked, null if the CRL cannot be authenticated
	 */
	public function checkCrlForSerial(string $crlDer, string $serial, ?Certificate $issuer = null): ?bool {
		if ($issuer === null) {
			return null;
		}

		try {
			$parsed = $this->parseCurrentCrl($crlDer);
			if ($parsed === null || !$this->authenticateCrl($parsed, $issuer)) {
				return null;
			}

			return in_array($serial, $parsed['revokedSerials'], true);
		}
		catch (Throwable $e) {
			error_log(sprintf("[smime] CRL parsing error: %s", $e->getMessage()));

			return null;
		}
	}

	/**
	 * Get CRL Distribution Point URLs from a certificate.
	 *
	 * @param Certificate $cert certificate to inspect
	 *
	 * @return array list of URL strings
	 */
	public function getCrlDistributionPoints(Certificate $cert): array {
		return $cert->crlURLs();
	}

	/**
	 * Cache a CRL obtained from a CMS message.
	 *
	 * CMS signed messages may include CRLs inline.  This method stores
	 * such CRLs in the local cache so that future revocation checks can
	 * use them without a network round-trip.
	 *
	 * @param string $crlDer raw DER-encoded CRL data
	 * @param string $issuer issuer identifier (used to derive cache filename)
	 *
	 * @return bool true if cached successfully
	 */
	public function cacheCrlFromDer(string $crlDer, string $issuer = ''): bool {
		if (empty($this->cacheDir) || empty($crlDer) || $this->parseCurrentCrl($crlDer) === null) {
			return false;
		}

		// Use a content-derived filename when no issuer hint is available. CRLs
		// obtained from messages remain untrusted and are verified when read.
		$cacheKey = hash('sha256', empty($issuer) ? $crlDer : $issuer);
		$cacheFile = $this->cacheDir . '/' . $cacheKey . '_msg.crl';

		return $this->writeCacheFile($cacheFile, $crlDer);
	}

	/**
	 * Check a certificate against all cached CRLs (including those from messages).
	 *
	 * @param string $serial certificate serial number
	 * @param null|Certificate $issuer certificate that issued the relevant CRLs
	 *
	 * @return null|bool true = revoked, false = not found in any CRL, null = no CRLs available
	 */
	public function checkAgainstCachedCrls(string $serial, ?Certificate $issuer = null): ?bool {
		if ($issuer === null || empty($this->cacheDir) || !is_dir($this->cacheDir) || is_link($this->cacheDir)) {
			return null;
		}

		$files = glob($this->cacheDir . '/*.crl');
		if (empty($files)) {
			return null;
		}

		$checked = false;
		foreach ($files as $file) {
			if (!is_file($file) || is_link($file) || filesize($file) > $this->maxBytes) {
				continue;
			}
			$crlDer = file_get_contents($file);
			if ($crlDer === false || empty($crlDer)) {
				continue;
			}

			$revoked = $this->checkCrlForSerial($crlDer, $serial, $issuer);
			if ($revoked === null) {
				continue;
			}
			$checked = true;
			if ($revoked) {
				return true;
			}
		}

		return $checked ? false : null;
	}

	/**
	 * Derive a cache file path from a URL.
	 */
	private function getCachePath(string $url): ?string {
		if (empty($this->cacheDir) || is_link($this->cacheDir)) {
			return null;
		}

		return $this->cacheDir . '/' . hash('sha256', $url) . '.crl';
	}

	/**
	 * Ensure the cache directory exists.
	 */
	private function ensureCacheDir(): bool {
		if (is_link($this->cacheDir)) {
			return false;
		}
		if (!is_dir($this->cacheDir) && !@mkdir($this->cacheDir, 0750, true) && !is_dir($this->cacheDir)) {
			return false;
		}
		$permissions = fileperms($this->cacheDir);
		if ($permissions === false || ($permissions & 0002) !== 0) {
			return false;
		}

		return is_writable($this->cacheDir);
	}

	/**
	 * Atomically replace a cache file without following a pre-created file link.
	 */
	private function writeCacheFile(string $cacheFile, string $data): bool {
		if (!$this->ensureCacheDir()) {
			return false;
		}
		$tmpFile = tempnam($this->cacheDir, '.crl-');
		if ($tmpFile === false) {
			return false;
		}

		try {
			$written = file_put_contents($tmpFile, $data, LOCK_EX);
			if ($written !== strlen($data) || !@chmod($tmpFile, 0640)) {
				return false;
			}

			return @rename($tmpFile, $cacheFile);
		}
		finally {
			if ((is_file($tmpFile) || is_link($tmpFile)) && !@unlink($tmpFile)) {
				error_log("[smime] Could not remove temporary CRL cache file: {$tmpFile}");
			}
		}
	}

	/**
	 * Verify the CRL issuer, signature algorithm and signature.
	 */
	private function authenticateCrl(array $parsed, Certificate $issuer): bool {
		try {
			if (($parsed['tbsSignatureAlgorithm'] ?? null) !== ($parsed['signatureAlgorithm'] ?? null)) {
				return false;
			}
			$x509 = new X509();
			$issuerData = $x509->certificate($issuer->der());
			if (($issuerData['tbsCertificate']['subject_'] ?? null) !== ($parsed['issuer'] ?? null)) {
				return false;
			}
			$issuerExtensions = $issuerData['tbsCertificate']['extensions'] ?? [];
			if (isset($issuerExtensions['keyUsage']) && empty($issuerExtensions['keyUsage']['extnValue']['cRLSign'])) {
				return false;
			}

			$signature = $parsed['signature'] ?? null;
			$signatureAlgorithm = $parsed['signatureAlgorithm'] ?? null;
			$digest = is_string($signatureAlgorithm) ? (self::SIGNATURE_DIGESTS[$signatureAlgorithm] ?? null) : null;
			if (!is_string($signature) || strlen($signature) < 2 || ord($signature[0]) !== 0 || $digest === null ||
				!isset($parsed['tbsCertList_der']) || !is_string($parsed['tbsCertList_der'])) {
				return false;
			}
			$publicKey = openssl_pkey_get_public($issuer->pem());

			return $publicKey !== false && openssl_verify($parsed['tbsCertList_der'], substr($signature, 1), $publicKey, $digest) === 1;
		}
		catch (Throwable $e) {
			error_log(sprintf("[smime] CRL authentication error: %s", $e->getMessage()));

			return false;
		}
	}

	/**
	 * Parse a CRL and require a currently usable update window.
	 *
	 * @return null|array decoded CRL, or null if malformed/stale
	 */
	private function parseCurrentCrl(string $crlDer): ?array {
		try {
			$parsed = (new CrlParser())->parseCrl($crlDer);
			$thisUpdate = $this->parseCrlTime($parsed['thisUpdate'] ?? null);
			$nextUpdate = isset($parsed['nextUpdate'])
				? $this->parseCrlTime($parsed['nextUpdate'])
				: null;
			$now = time();
			$clockSkew = defined('PLUGIN_SMIME_CRL_CLOCK_SKEW') ? max(0, (int) PLUGIN_SMIME_CRL_CLOCK_SKEW) : 300;
			if ($thisUpdate > $now + $clockSkew) {
				return null;
			}
			if ($nextUpdate !== null && ($nextUpdate <= $thisUpdate || $nextUpdate < $now - $clockSkew)) {
				return null;
			}
			if ($nextUpdate === null && $thisUpdate < $now - $this->maxAge - $clockSkew) {
				return null;
			}

			return $parsed;
		}
		catch (Throwable $e) {
			error_log(sprintf("[smime] Invalid CRL: %s", $e->getMessage()));

			return null;
		}
	}

	/**
	 * Parse the normalized DER time emitted by CrlParser.
	 *
	 * @param mixed $value
	 */
	private function parseCrlTime($value): int {
		if (!is_string($value)) {
			throw new UnexpectedValueException('CRL does not contain nextUpdate');
		}
		$time = DateTimeImmutable::createFromFormat('!YmdHis\Z', $value, new DateTimeZone('UTC'));
		$errors = DateTimeImmutable::getLastErrors();
		if ($time === false || ($errors !== false && ($errors['warning_count'] > 0 || $errors['error_count'] > 0))) {
			throw new UnexpectedValueException('Invalid CRL update time');
		}

		return $time->getTimestamp();
	}
}
