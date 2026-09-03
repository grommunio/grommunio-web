<?php

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
		if (!is_dir($dir) && !mkdir($dir, 0770, true)) {
			$this->notFound();

			return;
		}

		$base = $dir . DIRECTORY_SEPARATOR . hash('sha256', $domain);
		$logo = $base . '.svg';
		$miss = $base . '.miss';

		if (is_file($logo) && filemtime($logo) > time() - self::TTL) {
			$this->output($logo);

			return;
		}
		if (is_file($miss) && filemtime($miss) > time() - self::NEGATIVE_TTL) {
			$this->notFound();

			return;
		}

		$data = $this->fetch($domain);
		if ($data === null) {
			touch($miss);
			$this->notFound();

			return;
		}

		file_put_contents($logo, $data, LOCK_EX);
		@unlink($miss);
		$this->output($logo);
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

		$data = '';
		$ch = curl_init($url);
		curl_setopt_array($ch, [
			CURLOPT_FOLLOWLOCATION => true,
			CURLOPT_MAXREDIRS => 2,
			CURLOPT_PROTOCOLS => CURLPROTO_HTTPS,
			CURLOPT_REDIR_PROTOCOLS => CURLPROTO_HTTPS,
			CURLOPT_CONNECTTIMEOUT => 3,
			CURLOPT_TIMEOUT => 5,
			CURLOPT_USERAGENT => 'grommunio-web',
			CURLOPT_HTTPHEADER => ['Accept: image/svg+xml'],
			CURLOPT_WRITEFUNCTION => function ($ch, $chunk) use (&$data) {
				$data .= $chunk;

				return strlen($data) > self::MAX_SIZE ? 0 : strlen($chunk);
			},
		]);
		$ok = curl_exec($ch) && curl_getinfo($ch, CURLINFO_RESPONSE_CODE) === 200;
		curl_close($ch);

		return $ok && $this->isLogo($data) ? $data : null;
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

	private function output($file) {
		header('Content-Type: image/svg+xml');
		header('Content-Length: ' . filesize($file));
		header('Content-Disposition: inline; filename="bimi.svg"');
		header('Cache-Control: private, max-age=86400');
		header('X-Content-Type-Options: nosniff');
		header("Content-Security-Policy: default-src 'none'; style-src 'unsafe-inline'");
		readfile($file);
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
