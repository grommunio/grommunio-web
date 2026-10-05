<?php

/*
 * SPDX-FileCopyrightText: Copyright 2020 - 2026 grommunio GmbH
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

/**
 * Validates and normalizes HTTP(S) origins.
 */
class HttpOrigin {
	/**
	 * Extract and normalize the origin portion of an absolute HTTP(S) URL.
	 *
	 * @param mixed $url
	 *
	 * @return null|string
	 */
	public static function fromUrl($url) {
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

		return self::normalize($parts['scheme'] . '://' . $authority);
	}

	/**
	 * Normalize an HTTP origin for exact comparisons and safe reflection.
	 *
	 * @param mixed $origin
	 *
	 * @return null|string
	 */
	public static function normalize($origin) {
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
