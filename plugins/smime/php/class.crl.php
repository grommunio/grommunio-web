<?php

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

	public function __construct() {
		$this->cacheDir = defined('PLUGIN_SMIME_CRL_CACHE_DIR')
			? PLUGIN_SMIME_CRL_CACHE_DIR
			: '/tmp/grommunio-web-crl';
		$this->maxAge = defined('PLUGIN_SMIME_CRL_MAX_AGE')
			? (int) PLUGIN_SMIME_CRL_MAX_AGE
			: 86400;
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

		foreach ($cdpUrls as $url) {
			$crlDer = $this->fetchCrl($url);
			if ($crlDer === null) {
				continue;
			}

			if ($this->checkCrlForSerial($crlDer, $serial)) {
				return true;
			}

			return false;
		}

		return null;
	}

	/**
	 * Fetch a CRL from a URL, using cache if available.
	 *
	 * @param string $url CRL distribution point URL
	 *
	 * @return null|string raw DER CRL data, or null on failure
	 */
	public function fetchCrl(string $url): ?string {
		$cacheFile = $this->getCachePath($url);

		// Check cache
		if ($cacheFile !== null && file_exists($cacheFile)) {
			$stat = stat($cacheFile);
			if ($stat !== false && (time() - $stat['mtime']) < $this->maxAge) {
				$content = file_get_contents($cacheFile);
				if ($content !== false) {
					return $content;
				}
			}
		}

		// Download
		$ch = curl_init();
		curl_setopt($ch, CURLOPT_URL, $url);
		curl_setopt($ch, CURLOPT_FAILONERROR, true);
		curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
		curl_setopt($ch, CURLOPT_TIMEOUT, 15);
		curl_setopt($ch, CURLOPT_FOLLOWLOCATION, true);
		curl_setopt($ch, CURLOPT_MAXREDIRS, 3);

		// Proxy settings
		if (defined('PLUGIN_SMIME_PROXY') && PLUGIN_SMIME_PROXY !== '') {
			curl_setopt($ch, CURLOPT_PROXY, PLUGIN_SMIME_PROXY);
		}
		if (defined('PLUGIN_SMIME_PROXY_PORT') && PLUGIN_SMIME_PROXY_PORT !== '') {
			curl_setopt($ch, CURLOPT_PROXYPORT, (int) PLUGIN_SMIME_PROXY_PORT);
		}
		if (defined('PLUGIN_SMIME_PROXY_USERPWD') && PLUGIN_SMIME_PROXY_USERPWD !== '') {
			curl_setopt($ch, CURLOPT_PROXYUSERPWD, PLUGIN_SMIME_PROXY_USERPWD);
		}

		$data = curl_exec($ch);
		$httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
		$error = curl_error($ch);
		curl_close($ch);

		if ($data === false || $httpCode !== 200 || empty($data)) {
			error_log(sprintf("[smime] CRL download failed for %s: HTTP %d, error: %s", $url, $httpCode, $error));

			return null;
		}

		// Detect PEM vs DER
		if (str_contains($data, '-----BEGIN X509 CRL-----')) {
			$pem = $data;
			$begin = strpos($pem, '-----BEGIN X509 CRL-----');
			$end = strpos($pem, '-----END X509 CRL-----');
			if ($begin !== false && $end !== false) {
				$b64 = substr($pem, $begin + 24, $end - $begin - 24);
				$data = base64_decode(trim($b64));
			}
		}

		// Cache
		if ($cacheFile !== null) {
			$this->ensureCacheDir();
			file_put_contents($cacheFile, $data);
		}

		return $data;
	}

	/**
	 * Check if a serial number appears in a CRL.
	 *
	 * @param string $crlDer raw DER CRL data
	 * @param string $serial certificate serial number (decimal)
	 *
	 * @return bool true if serial is revoked
	 */
	public function checkCrlForSerial(string $crlDer, string $serial): bool {
		try {
			// Suppress errors from the DER parser for malformed CRLs
			set_error_handler(function () { return true; });
			$parser = new \WAYF\CrlParser();
			$result = $parser->checkSerial($crlDer, $serial);
			restore_error_handler();

			return $result;
		}
		catch (\Throwable $e) {
			restore_error_handler();
			error_log(sprintf("[smime] CRL parsing error: %s", $e->getMessage()));

			return false;
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
		if (empty($this->cacheDir) || empty($crlDer)) {
			return false;
		}

		$this->ensureCacheDir();

		// Use hash of CRL data as filename to avoid duplicates
		$cacheKey = empty($issuer) ? sha1($crlDer) : sha1($issuer);
		$cacheFile = $this->cacheDir . '/' . $cacheKey . '_msg.crl';

		return file_put_contents($cacheFile, $crlDer) !== false;
	}

	/**
	 * Check a certificate against all cached CRLs (including those from messages).
	 *
	 * @param string $serial certificate serial number
	 *
	 * @return null|bool true = revoked, false = not found in any CRL, null = no CRLs available
	 */
	public function checkAgainstCachedCrls(string $serial): ?bool {
		if (empty($this->cacheDir) || !is_dir($this->cacheDir)) {
			return null;
		}

		$files = glob($this->cacheDir . '/*.crl');
		if (empty($files)) {
			return null;
		}

		foreach ($files as $file) {
			$crlDer = file_get_contents($file);
			if ($crlDer === false || empty($crlDer)) {
				continue;
			}

			if ($this->checkCrlForSerial($crlDer, $serial)) {
				return true;
			}
		}

		return false;
	}

	/**
	 * Derive a cache file path from a URL.
	 */
	private function getCachePath(string $url): ?string {
		if (empty($this->cacheDir)) {
			return null;
		}

		return $this->cacheDir . '/' . sha1($url) . '.crl';
	}

	/**
	 * Ensure the cache directory exists.
	 */
	private function ensureCacheDir(): void {
		if (!is_dir($this->cacheDir)) {
			@mkdir($this->cacheDir, 0750, true);
		}
	}
}
