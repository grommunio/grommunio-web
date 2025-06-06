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
	 * Will add the necessary CORS headers to the response, in order to enable
	 * cross domain requests. Will only add the headers if the administrator
	 * has enabled it for the domain that sent the request.
	 */
	public static function addCorsHeaders() {
		$allowedDomains = defined('CROSS_DOMAIN_AUTHENTICATION_ALLOWED_DOMAINS') ? CROSS_DOMAIN_AUTHENTICATION_ALLOWED_DOMAINS : '';

		if ($allowedDomains === '*') {
			// All domains are allowed
			header('Access-Control-Allow-Origin: *');

			return;
		}

		if (gettype($allowedDomains) !== 'string') {
			// Misconfigured. Don't add any CORS headers.
			$webAppTitle = defined('WEBAPP_TITLE') && WEBAPP_TITLE ? WEBAPP_TITLE : 'grommunio Web';
			error_log($webAppTitle . ': CROSS_DOMAIN_AUTHENTICATION_ALLOWED_DOMAINS misconfigured');

			return;
		}

		if (!isset($_SERVER['HTTP_ORIGIN'])) {
			// Not a valid ajax request
			return;
		}

		$allowedDomains = explode(' ', (string) preg_replace('/\s+/', ' ', $allowedDomains));
		if (count($allowedDomains) && !empty($allowedDomains[0])) {
			foreach ($allowedDomains as $domain) {
				if ($domain === $_SERVER['HTTP_ORIGIN']) {
					// This domain was granted access by the administrator, so add the CORS headers
					header('Access-Control-Allow-Origin: ' . $_SERVER['HTTP_ORIGIN']);

					return;
				}
			}
		}
	}
}
