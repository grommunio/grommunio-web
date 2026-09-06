<?php

require_once BASE_PATH . 'server/includes/core/class.publichttpsresource.php';

/**
 * Serves the BIMI logo of a sender domain (RFC draft-brand-indicators-for-message-identification).
 * The logo is looked up once per domain and cached in TMP_PATH, so a mailbox full of mails from
 * the same sender costs one DNS query and one HTTPS fetch a week.
 */
class BimiLogo {
	public const TTL = 7 * 86400;
	public const NEGATIVE_TTL = 86400;
	public const MAX_SIZE = 65536;

	public function serve($domain) {
		$dir = TMP_PATH . DIRECTORY_SEPARATOR . 'bimi';
		$base = $dir . DIRECTORY_SEPARATOR . hash('sha256', $domain);
		$logo = $base . '.svg';
		$miss = $base . '.miss';
		$cacheReady = $this->ensureCacheDir($dir);

		$cachedLogo = $cacheReady ? $this->readCacheFile($logo, self::TTL, self::MAX_SIZE) : null;
		if ($cachedLogo !== null && $this->isLogo($cachedLogo)) {
			$this->output($cachedLogo);

			return;
		}
		$cachedMiss = $cacheReady ? $this->readCacheFile($miss, self::NEGATIVE_TTL, 0) : null;
		if ($cachedMiss !== null) {
			$this->notFound();

			return;
		}

		$data = $this->fetch($domain);
		if ($data === null) {
			if ($cacheReady) {
				$this->writeCacheFile($dir, $miss, '');
			}
			$this->notFound();

			return;
		}

		if ($cacheReady) {
			$this->writeCacheFile($dir, $logo, $data);
			@unlink($miss);
		}
		$this->output($data);
	}

	private function ensureCacheDir($dir) {
		if (is_link($dir)) {
			return false;
		}
		if (!is_dir($dir) && !@mkdir($dir, 0700, true) && !is_dir($dir)) {
			return false;
		}

		// Tighten directories made group-writable by older releases. If the
		// process does not own the directory, never trust entries from it.
		if (!@chmod($dir, 0700)) {
			return false;
		}
		clearstatcache(true, $dir);
		$stat = @lstat($dir);
		if ($stat === false || ($stat['mode'] & 0170000) !== 0040000 || ($stat['mode'] & 0077) !== 0 ||
			(function_exists('posix_geteuid') && $stat['uid'] !== posix_geteuid())) {
			return false;
		}

		return is_writable($dir);
	}

	private function readCacheFile($file, $maxAge, $maxSize) {
		if (!is_file($file) || is_link($file)) {
			return null;
		}
		$stat = @lstat($file);
		$dirStat = @lstat(dirname($file));
		if ($stat === false || $dirStat === false ||
			($stat['mode'] & 0170000) !== 0100000 ||
			($dirStat['mode'] & 0170000) !== 0040000 ||
			($stat['mode'] & 0077) !== 0 || ($dirStat['mode'] & 0077) !== 0 ||
			$stat['uid'] !== $dirStat['uid'] || $stat['size'] > $maxSize ||
			time() - $stat['mtime'] >= $maxAge) {
			return null;
		}

		$data = @file_get_contents($file);

		return is_string($data) && strlen($data) <= $maxSize ? $data : null;
	}

	private function writeCacheFile($dir, $file, $data) {
		if (!$this->ensureCacheDir($dir)) {
			return false;
		}
		$tmpFile = tempnam($dir, '.bimi-');
		if ($tmpFile === false) {
			return false;
		}

		try {
			$written = file_put_contents($tmpFile, $data, LOCK_EX);
			if ($written !== strlen($data) || !@chmod($tmpFile, 0600)) {
				return false;
			}

			return @rename($tmpFile, $file);
		}
		finally {
			if ((is_file($tmpFile) || is_link($tmpFile)) && !@unlink($tmpFile)) {
				error_log("[bimi] Could not remove temporary cache file: {$tmpFile}");
			}
		}
	}

	private function fetch($domain) {
		$records = @dns_get_record('default._bimi.' . $domain, DNS_TXT);
		if (empty($records)) {
			return null;
		}

		$url = null;
		foreach ($records as $record) {
			$txt = $record['txt'] ?? '';
			if (stripos($txt, 'v=BIMI1') !== 0) {
				continue;
			}
			foreach (explode(';', $txt) as $tag) {
				$tag = trim($tag);
				if (stripos($tag, 'l=') === 0) {
					$url = trim(substr($tag, 2));
				}
			}
		}
		if (empty($url) || !preg_match('#^https://#i', $url)) {
			return null;
		}

		$data = PublicHttpsResource::fetch($url, self::MAX_SIZE, 2, [
			'Accept: image/svg+xml',
			'User-Agent: grommunio-web',
		]);

		return $data !== null && $this->isLogo($data) ? $data : null;
	}

	private function isLogo($data) {
		$previous = libxml_use_internal_errors(true);
		$doc = new DOMDocument();
		$ok = $doc->loadXML($data, LIBXML_NONET) && $doc->documentElement !== null &&
			strtolower($doc->documentElement->localName) === 'svg' &&
			$doc->getElementsByTagName('script')->length === 0 &&
			$doc->getElementsByTagName('foreignObject')->length === 0;
		libxml_clear_errors();
		libxml_use_internal_errors($previous);

		return $ok;
	}

	private function output($data) {
		header('Content-Type: image/svg+xml');
		header('Content-Length: ' . strlen($data));
		header('Content-Disposition: inline; filename="bimi.svg"');
		header('Cache-Control: private, max-age=86400');
		header('X-Content-Type-Options: nosniff');
		header("Content-Security-Policy: default-src 'none'; style-src 'unsafe-inline'");
		echo $data;
	}

	private function notFound() {
		header('HTTP/1.1 404 Not Found');
		header('Cache-Control: private, max-age=3600');
	}
}

if (!WebAppAuthentication::isAuthenticated()) {
	header('HTTP/1.1 401 Unauthorized');

	exit;
}
$domain = strtolower(sanitizeGetValue('domain', '', '/^[a-z0-9.-]{3,253}$/i'));
if (!ENABLE_BIMI || $domain === '' || str_contains($domain, '..')) {
	header('HTTP/1.1 404 Not Found');

	exit;
}
(new BimiLogo())->serve($domain);
