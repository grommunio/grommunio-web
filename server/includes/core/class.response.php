<?php

/*
 * SPDX-FileCopyrightText: Copyright 2020 - 2026 grommunio GmbH
 * SPDX-FileCopyrightText: Copyright 2016 Kopano and its licensors
 * SPDX-FileCopyrightText: Copyright 2005 - 2016 Zarafa B.V. and its licensors
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

require_once __DIR__ . '/class.requestorigin.php';

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
	 * @return bool true when the browser identifies a same-origin initiator
	 */
	public static function isSameOriginRequestSource() {
		return RequestOrigin::isSameOriginSource();
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

		$origin = HttpOrigin::normalize($originHeader);
		if ($origin === null) {
			return false;
		}

		$requestOrigin = RequestOrigin::get();
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
			if (HttpOrigin::normalize($domain) === $origin) {
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
}
