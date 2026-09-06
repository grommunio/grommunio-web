<?php

/**
 * This class has some methods to utilize http responses.
 */
class Response {
	/**
	 * Sends a 405 Method Not Allowed header and stops the script.
	 */
	public static function wrongMethod(): never {
		header('HTTP/1.1 405 Method Not Allowed');

		exit;
	}

	/**
	 * Sends a 404 Not Found header and stops the script.
	 */
	public static function notFound(): never {
		header('HTTP/1.1 404 Not Found');

		exit;
	}

	/**
	 * Sends a 401 Unauthorized and stops the script.
	 */
	public static function unAuthorized(): never {
		header('HTTP/1.1 401 Unauthorized');

		exit;
	}

	/**
	 * Sends a 403 Forbidden and stops the script.
	 */
	public static function forbidden(): never {
		header('HTTP/1.1 403 Forbidden');

		exit;
	}

	/**
	 * Authorize the request origin and answer CORS preflight requests.
	 *
	 * @param string $allowedMethod method accepted by the controller
	 */
	public static function enforceCors($allowedMethod) {
		if (!self::addCorsHeaders()) {
			self::forbidden();
		}

		if (strtoupper((string) ($_SERVER['REQUEST_METHOD'] ?? '')) !== 'OPTIONS') {
			return;
		}

		$allowedMethod = strtoupper((string) $allowedMethod);
		$requestedMethod = strtoupper((string) ($_SERVER['HTTP_ACCESS_CONTROL_REQUEST_METHOD'] ?? ''));
		if ($requestedMethod !== $allowedMethod) {
			header('Allow: ' . $allowedMethod);
			self::wrongMethod();
		}

		$allowedHeaders = ['content-type', 'x-requested-with'];
		$requestedHeaders = trim((string) ($_SERVER['HTTP_ACCESS_CONTROL_REQUEST_HEADERS'] ?? ''));
		if ($requestedHeaders !== '') {
			foreach (explode(',', strtolower($requestedHeaders)) as $header) {
				$header = trim($header);
				if (!in_array($header, $allowedHeaders, true)) {
					self::forbidden();
				}
			}
			header('Access-Control-Allow-Headers: Content-Type, X-Requested-With');
		}

		header('Access-Control-Allow-Methods: ' . $allowedMethod);
		header('Vary: Access-Control-Request-Method', false);
		header('Vary: Access-Control-Request-Headers', false);
		http_response_code(204);

		exit;
	}

	/**
	 * Check whether the request origin is permitted without granting response access.
	 *
	 * @return bool true when the request origin is permitted
	 */
	public static function isOriginAllowed() {
		return self::checkOrigin(false);
	}

	/**
	 * Check whether browser metadata proves that a GET request originated here.
	 *
	 * This is only intended for compatibility endpoints whose state-changing GET
	 * behavior predates CSRF protection. Cross-site top-level navigations commonly
	 * omit Origin, so a request without trustworthy browser metadata fails closed.
	 *
	 * @return bool true when the browser identifies a same-origin initiator
	 */
	public static function isSameOriginRequestSource() {
		$requestOrigin = self::requestOrigin();
		if ($requestOrigin === null) {
			return false;
		}

		if (isset($_SERVER['HTTP_ORIGIN'])) {
			return self::normalizeOrigin($_SERVER['HTTP_ORIGIN']) === $requestOrigin;
		}

		// "none" marks a navigation the user started (typed URL, bookmark);
		// no other site can produce it.
		$fetchSite = strtolower(trim((string) ($_SERVER['HTTP_SEC_FETCH_SITE'] ?? '')));
		if ($fetchSite !== '') {
			return $fetchSite === 'same-origin' || $fetchSite === 'none';
		}

		if (isset($_SERVER['HTTP_REFERER'])) {
			return self::originFromUrl($_SERVER['HTTP_REFERER']) === $requestOrigin;
		}

		// XMLHttpRequest is not a CORS-safelisted header, so a cross-origin page
		// cannot add it without a successful preflight. The logout endpoints reject
		// preflight, making this a safe fallback for older same-origin AJAX clients.
		return isset($_SERVER['HTTP_X_REQUESTED_WITH']) &&
			is_string($_SERVER['HTTP_X_REQUESTED_WITH']) &&
			strcasecmp(trim($_SERVER['HTTP_X_REQUESTED_WITH']), 'XMLHttpRequest') === 0;
	}

	/**
	 * Will add the necessary CORS headers to the response, in order to enable
	 * cross domain requests. Will only add the headers if the administrator
	 * has enabled it for the domain that sent the request.
	 *
	 * @return bool true when the request origin is permitted
	 */
	public static function addCorsHeaders() {
		return self::checkOrigin(true);
	}

	/**
	 * Evaluate the configured request-origin policy.
	 *
	 * @param bool $addHeaders grant cross-origin response access when permitted
	 *
	 * @return bool true when the request origin is permitted
	 */
	private static function checkOrigin($addHeaders) {
		$allowedDomains = defined('CROSS_DOMAIN_AUTHENTICATION_ALLOWED_DOMAINS') ? CROSS_DOMAIN_AUTHENTICATION_ALLOWED_DOMAINS : '';
		$originHeader = $_SERVER['HTTP_ORIGIN'] ?? null;
		if ($originHeader === null) {
			// Preserve non-browser and legacy same-origin clients which omit Origin.
			return true;
		}

		$origin = self::normalizeOrigin($originHeader);
		if ($origin === null) {
			return false;
		}

		$requestOrigin = self::requestOrigin();
		if ($requestOrigin === null) {
			return false;
		}

		if ($origin === $requestOrigin) {
			return true;
		}

		if ($allowedDomains === '*') {
			// All domains are allowed
			if ($addHeaders) {
				header('Access-Control-Allow-Origin: *');
			}

			return true;
		}

		if (gettype($allowedDomains) !== 'string') {
			// Misconfigured. Don't add any CORS headers.
			$webAppTitle = defined('WEBAPP_TITLE') && WEBAPP_TITLE ? WEBAPP_TITLE : 'grommunio Web';
			error_log($webAppTitle . ': CROSS_DOMAIN_AUTHENTICATION_ALLOWED_DOMAINS misconfigured');

			return false;
		}

		$allowedDomains = preg_split('/\s+/', trim($allowedDomains)) ?: [];
		foreach ($allowedDomains as $domain) {
			if (self::normalizeOrigin($domain) === $origin) {
				if ($addHeaders) {
					// This domain was granted access by the administrator, so add the CORS headers
					header('Access-Control-Allow-Origin: ' . $origin);
					header('Access-Control-Allow-Credentials: true');
					header('Vary: Origin', false);
				}

				return true;
			}
		}

		return false;
	}

	/**
	 * Return the normalized origin of this request.
	 *
	 * @return null|string
	 */
	private static function requestOrigin() {
		$directHttps = (!empty($_SERVER['HTTPS']) && strtolower((string) $_SERVER['HTTPS']) !== 'off') ||
			(int) ($_SERVER['SERVER_PORT'] ?? 0) === 443;
		$https = $directHttps;
		// Secure cookies are the default and require the public application URL to use HTTPS.
		if (!$https && (!defined('SECURE_COOKIES') || SECURE_COOKIES !== false)) {
			$https = true;
		}
		$scheme = $https ? 'https' : 'http';
		// HTTP_HOST is the authority the browser used for this request and carries
		// aliases and public ports through common reverse proxies. Use it only for
		// this same-request origin comparison; redirects and OAuth callbacks must
		// continue to use separately trusted configuration.
		if (isset($_SERVER['HTTP_HOST'])) {
			if (!is_string($_SERVER['HTTP_HOST']) ||
				preg_match('/[\x00-\x20\x23\x2f\x3f\x40\x5c\x7f]/', $_SERVER['HTTP_HOST']) === 1 ||
				str_ends_with($_SERVER['HTTP_HOST'], ':')) {
				return null;
			}
			$hostOrigin = self::normalizeOrigin($scheme . '://' . $_SERVER['HTTP_HOST']);
			if ($hostOrigin === null) {
				return null;
			}

			return $hostOrigin;
		}

		$host = trim((string) ($_SERVER['SERVER_NAME'] ?? ''), '[]');
		$serverAuthority = str_contains($host, ':') ? '[' . $host . ']' : $host;
		if (self::normalizeOrigin($scheme . '://' . $serverAuthority) === null) {
			return null;
		}

		$authority = $serverAuthority;
		$port = (int) ($_SERVER['SERVER_PORT'] ?? 0);
		// A TLS-terminating proxy can expose any HTTP upstream port here.
		if ($https && !$directHttps) {
			$port = 443;
		}
		if ($port > 0 && $port !== ($https ? 443 : 80)) {
			$authority .= ':' . $port;
		}

		return self::normalizeOrigin($scheme . '://' . $authority);
	}

	/**
	 * Extract and normalize the origin portion of an absolute HTTP(S) URL.
	 *
	 * @param mixed $url
	 *
	 * @return null|string
	 */
	private static function originFromUrl($url) {
		if (!is_string($url) || $url === '' || strlen($url) > 4096 ||
			preg_match('/[\x00-\x20\x5c\x7f]/', $url) === 1) {
			return null;
		}

		$parts = @parse_url($url);
		if ($parts === false || !isset($parts['scheme'], $parts['host']) ||
			isset($parts['user']) || isset($parts['pass'])) {
			return null;
		}

		$host = trim((string) $parts['host'], '[]');
		$authority = str_contains($host, ':') ? '[' . $host . ']' : $host;
		if (isset($parts['port'])) {
			$authority .= ':' . $parts['port'];
		}

		return self::normalizeOrigin($parts['scheme'] . '://' . $authority);
	}

	/**
	 * Normalize an HTTP origin for exact comparisons and safe reflection.
	 *
	 * @param mixed $origin
	 *
	 * @return null|string
	 */
	private static function normalizeOrigin($origin) {
		if (!is_string($origin) || $origin === '' || strlen($origin) > 4096 ||
			preg_match('/[\x00-\x20\x5c\x7f]/', $origin) === 1) {
			return null;
		}

		$parts = @parse_url($origin);
		if ($parts === false || !in_array(strtolower($parts['scheme'] ?? ''), ['http', 'https'], true) ||
			empty($parts['host']) || isset($parts['user']) || isset($parts['pass']) ||
			isset($parts['query']) || isset($parts['fragment']) ||
			(isset($parts['path']) && $parts['path'] !== '' && $parts['path'] !== '/')) {
			return null;
		}

		$scheme = strtolower($parts['scheme']);
		$host = trim(strtolower((string) $parts['host']), '[]');
		if (filter_var($host, FILTER_VALIDATE_IP) === false) {
			$host = rtrim($host, '.');
			if ($host === '' || strlen($host) > 253 ||
				preg_match('/\A(?:[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?)(?:\.(?:[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?))*\z/iD', $host) !== 1) {
				return null;
			}
		}

		$defaultPort = $scheme === 'https' ? 443 : 80;
		$port = $parts['port'] ?? $defaultPort;
		if (!is_int($port) || $port < 1 || $port > 65535) {
			return null;
		}

		$authority = str_contains($host, ':') ? '[' . $host . ']' : $host;
		if ($port !== $defaultPort) {
			$authority .= ':' . $port;
		}

		return $scheme . '://' . $authority;
	}
}
