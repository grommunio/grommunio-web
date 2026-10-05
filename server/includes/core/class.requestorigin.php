<?php

/*
 * SPDX-FileCopyrightText: Copyright 2020 - 2026 grommunio GmbH
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

require_once __DIR__ . '/class.httporigin.php';

/**
 * Derives and compares the origin of the current request.
 */
class RequestOrigin {
	/**
	 * Check whether browser metadata proves that a GET request originated here.
	 *
	 * This is only intended for compatibility endpoints whose state-changing GET
	 * behavior predates CSRF protection. Cross-site top-level navigations commonly
	 * omit Origin, so a request without trustworthy browser metadata fails closed.
	 *
	 * @return bool true when the browser identifies a same-origin initiator
	 */
	public static function isSameOriginSource() {
		$requestOrigin = self::get();
		if ($requestOrigin === null) {
			return false;
		}

		if (isset($_SERVER['HTTP_ORIGIN'])) {
			return HttpOrigin::normalize($_SERVER['HTTP_ORIGIN']) === $requestOrigin;
		}

		// "none" marks a navigation the user started (typed URL, bookmark);
		// no other site can produce it.
		$fetchSite = strtolower(trim((string) ($_SERVER['HTTP_SEC_FETCH_SITE'] ?? '')));
		if ($fetchSite !== '') {
			return $fetchSite === 'same-origin' || $fetchSite === 'none';
		}

		if (isset($_SERVER['HTTP_REFERER'])) {
			return HttpOrigin::fromUrl($_SERVER['HTTP_REFERER']) === $requestOrigin;
		}

		// XMLHttpRequest is not a CORS-safelisted header, so a cross-origin page
		// cannot add it without a successful preflight. The logout endpoints reject
		// preflight, making this a safe fallback for older same-origin AJAX clients.
		return isset($_SERVER['HTTP_X_REQUESTED_WITH']) &&
			is_string($_SERVER['HTTP_X_REQUESTED_WITH']) &&
			strcasecmp(trim($_SERVER['HTTP_X_REQUESTED_WITH']), 'XMLHttpRequest') === 0;
	}

	/**
	 * Return the normalized origin of this request.
	 *
	 * @return null|string
	 */
	public static function get() {
		$directHttps = (!empty($_SERVER['HTTPS']) && strtolower((string) $_SERVER['HTTPS']) !== 'off') ||
			(int) ($_SERVER['SERVER_PORT'] ?? 0) === 443;
		$https = $directHttps;
		// A TLS-terminating proxy reports the public scheme in X-Forwarded-Proto.
		$forwardedProto = strtolower(trim(explode(',', (string) ($_SERVER['HTTP_X_FORWARDED_PROTO'] ?? ''), 2)[0]));
		if ($forwardedProto === 'https') {
			$https = true;
		}
		// Secure cookies are the default and require the public application URL to use HTTPS.
		if (!$https && (!defined('SECURE_COOKIES') || SECURE_COOKIES !== false)) {
			$https = true;
		}
		$scheme = $https ? 'https' : 'http';
		// HTTP_HOST is the authority the browser used for this request and carries
		// aliases and public ports through common reverse proxies. A proxy that
		// rewrites Host passes the public authority in X-Forwarded-Host. Use them
		// only for this same-request origin comparison; redirects and OAuth
		// callbacks must continue to use separately trusted configuration.
		$forwardedHost = trim(explode(',', (string) ($_SERVER['HTTP_X_FORWARDED_HOST'] ?? ''), 2)[0]);
		$host = $forwardedHost !== '' ? $forwardedHost : ($_SERVER['HTTP_HOST'] ?? null);
		if ($host !== null) {
			if (!is_string($host) ||
				preg_match('/[\x00-\x20\x23\x2f\x3f\x40\x5c\x7f]/', $host) === 1 ||
				str_ends_with($host, ':')) {
				return null;
			}
			return HttpOrigin::normalize($scheme . '://' . $host);
		}

		$host = trim((string) ($_SERVER['SERVER_NAME'] ?? ''), '[]');
		$serverAuthority = str_contains($host, ':') ? '[' . $host . ']' : $host;
		if (HttpOrigin::normalize($scheme . '://' . $serverAuthority) === null) {
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

		return HttpOrigin::normalize($scheme . '://' . $authority);
	}
}
