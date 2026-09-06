<?php

/**
 * Fetches a small HTTPS resource from a public, DNS-pinned destination.
 *
 * This is intended for URLs supplied by untrusted external data. Every
 * redirect is resolved and checked independently so neither redirects nor
 * DNS rebinding can move a request onto an internal network.
 */
final class PublicHttpsResource {
	private const MAX_URL_LENGTH = 4096;

	/**
	 * Fetch an HTTPS resource from a public address.
	 *
	 * @param string $url          URL to fetch
	 * @param int    $maxBytes     maximum response body size
	 * @param int    $maxRedirects maximum number of redirects
	 * @param array  $headers      request headers
	 *
	 * @return null|string response body, or null when the request is refused or fails
	 */
	public static function fetch($url, $maxBytes, $maxRedirects = 0, $headers = []) {
		if (!function_exists('curl_init') || !is_array($headers)) {
			return null;
		}
		foreach ($headers as $header) {
			if (!is_string($header) || strlen($header) > 8192 || preg_match('/[\r\n]/', $header) === 1) {
				return null;
			}
		}

		$maxBytes = max(1, (int) $maxBytes);
		$maxRedirects = max(0, (int) $maxRedirects);
		$url = self::normalizeUrl($url);
		if ($url === null) {
			return null;
		}

		for ($redirects = 0; $redirects <= $maxRedirects; ++$redirects) {
			$response = self::request($url, $maxBytes, $headers);
			if ($response === null) {
				return null;
			}

			if ($response['status'] === 200) {
				return $response['body'];
			}

			if ($response['status'] < 300 || $response['status'] > 399 ||
				$response['location'] === null || $redirects === $maxRedirects) {
				return null;
			}

			$url = self::resolveRedirectUrl($url, $response['location']);
			if ($url === null) {
				return null;
			}
		}

		return null;
	}

	/**
	 * Perform one request after resolving and pinning its destination.
	 *
	 * @param string $url
	 * @param int    $maxBytes
	 * @param array  $headers
	 *
	 * @return null|array{body: string, location: null|string, status: int}
	 */
	private static function request($url, $maxBytes, $headers) {
		$pin = self::resolvePin($url);
		if ($pin === null) {
			return null;
		}

		$body = '';
		$location = null;
		$ch = curl_init();
		if ($ch === false) {
			return null;
		}

		curl_setopt_array($ch, [
			CURLOPT_URL => $url,
			CURLOPT_CONNECTTIMEOUT => 3,
			CURLOPT_TIMEOUT => 5,
			CURLOPT_PROTOCOLS => CURLPROTO_HTTPS,
			CURLOPT_FOLLOWLOCATION => false,
			CURLOPT_MAXREDIRS => 0,
			CURLOPT_MAXFILESIZE => $maxBytes,
			CURLOPT_SSL_VERIFYPEER => true,
			CURLOPT_SSL_VERIFYHOST => 2,
			CURLOPT_PROXY => '',
			CURLOPT_HTTPHEADER => $headers,
			CURLOPT_HEADERFUNCTION => function ($ch, $line) use (&$location) {
				if (stripos($line, 'Location:') === 0) {
					$value = trim(substr($line, 9));
					$location = preg_match('/[\x00-\x20\x7f]/', $value) === 1 ? null : $value;
				}

				return strlen($line);
			},
			CURLOPT_WRITEFUNCTION => function ($ch, $chunk) use (&$body, $maxBytes) {
				$length = strlen($chunk);
				if ($length > $maxBytes - strlen($body)) {
					return 0;
				}
				$body .= $chunk;

				return $length;
			},
		]);
		if (!empty($pin)) {
			curl_setopt($ch, CURLOPT_RESOLVE, $pin);
		}

		$result = curl_exec($ch);
		$status = (int) curl_getinfo($ch, CURLINFO_RESPONSE_CODE);
		unset($ch);

		if ($result === false) {
			return null;
		}

		return [
			'body' => $body,
			'location' => $location,
			'status' => $status,
		];
	}

	/**
	 * Normalize and strictly validate an HTTPS URL.
	 *
	 * @param mixed $url
	 *
	 * @return null|string canonical URL
	 */
	private static function normalizeUrl($url) {
		if (!is_string($url) || $url === '' || strlen($url) > self::MAX_URL_LENGTH ||
			preg_match('/[\x00-\x20\x5c\x7f]/', $url) === 1) {
			return null;
		}

		$parts = @parse_url($url);
		if ($parts === false || strtolower($parts['scheme'] ?? '') !== 'https' ||
			empty($parts['host']) || isset($parts['user']) || isset($parts['pass'])) {
			return null;
		}

		$host = self::normalizeHost($parts['host']);
		if ($host === null) {
			return null;
		}

		$port = $parts['port'] ?? 443;
		if (!is_int($port) || $port < 1 || $port > 65535) {
			return null;
		}

		$authority = str_contains($host, ':') ? '[' . $host . ']' : $host;
		if ($port !== 443) {
			$authority .= ':' . $port;
		}

		$path = $parts['path'] ?? '/';
		if ($path === '') {
			$path = '/';
		}
		$query = isset($parts['query']) ? '?' . $parts['query'] : '';

		return 'https://' . $authority . $path . $query;
	}

	/**
	 * Normalize a hostname and reject ambiguous numeric forms.
	 *
	 * @param string $host
	 *
	 * @return null|string
	 */
	private static function normalizeHost($host) {
		$host = trim((string) $host, '[]');
		if (filter_var($host, FILTER_VALIDATE_IP) !== false) {
			return strtolower($host);
		}

		$host = strtolower(rtrim($host, '.'));
		if ($host === '' || strlen($host) > 253 || preg_match('/\A[0-9.]+\z/D', $host) === 1 ||
			preg_match('/\A(?:0x[0-9a-f]+|[0-9]+)(?:\.(?:0x[0-9a-f]+|[0-9]+)){0,3}\z/iD', $host) === 1 ||
			preg_match('/\A(?:[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?)(?:\.(?:[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?))*\z/D', $host) !== 1) {
			return null;
		}

		return $host;
	}

	/**
	 * Resolve a URL to public addresses and return CURLOPT_RESOLVE entries.
	 *
	 * @param string $url normalized URL
	 *
	 * @return null|array
	 */
	private static function resolvePin($url) {
		$parts = parse_url($url);
		$host = self::normalizeHost($parts['host'] ?? '');
		$port = $parts['port'] ?? 443;
		if ($host === null) {
			return null;
		}

		if (filter_var($host, FILTER_VALIDATE_IP) !== false) {
			return self::isPublicIp($host) ? [] : null;
		}

		$ips = [];
		foreach (@dns_get_record($host, DNS_A | DNS_AAAA) ?: [] as $record) {
			$ip = $record['ip'] ?? $record['ipv6'] ?? '';
			if (is_string($ip) && self::isPublicIp($ip)) {
				$ips[] = $ip;
			}
		}
		foreach (@gethostbynamel($host) ?: [] as $ip) {
			if (self::isPublicIp($ip)) {
				$ips[] = $ip;
			}
		}

		$ips = array_values(array_unique($ips));
		if (empty($ips)) {
			return null;
		}

		$pinned = array_map(function ($ip) {
			return str_contains($ip, ':') ? '[' . $ip . ']' : $ip;
		}, $ips);

		return [$host . ':' . $port . ':' . implode(',', $pinned)];
	}

	/**
	 * Require a globally routable unicast address.
	 *
	 * @param string $ip
	 *
	 * @return bool
	 */
	private static function isPublicIp($ip) {
		$packed = @inet_pton($ip);
		if ($packed === false) {
			return false;
		}

		// Validate IPv4-mapped IPv6 addresses as their embedded IPv4 address.
		if (strlen($packed) === 16 && substr($packed, 0, 12) === str_repeat("\0", 10) . "\xff\xff") {
			$ip = inet_ntop(substr($packed, 12));
			$packed = inet_pton($ip);
		}

		if (filter_var($ip, FILTER_VALIDATE_IP, FILTER_FLAG_NO_PRIV_RANGE | FILTER_FLAG_NO_RES_RANGE) === false) {
			return false;
		}

		if (strlen($packed) === 16 && !self::ipInCidr($ip, '2000::/3')) {
			return false;
		}

		$nonPublicRanges = [
			'100.64.0.0/10', '192.0.0.0/24', '192.0.2.0/24',
			'192.88.99.0/24', '198.18.0.0/15', '198.51.100.0/24',
			'203.0.113.0/24', '224.0.0.0/4',
			'64:ff9b::/96', '64:ff9b:1::/48', '100::/64',
			'2001::/23', '2001:db8::/32', '2002::/16',
			'3fff::/20', '5f00::/16', 'ff00::/8',
		];
		foreach ($nonPublicRanges as $range) {
			if (self::ipInCidr($ip, $range)) {
				return false;
			}
		}

		return true;
	}

	/**
	 * Test whether an IP address belongs to a CIDR block.
	 *
	 * @param string $ip
	 * @param string $cidr
	 *
	 * @return bool
	 */
	private static function ipInCidr($ip, $cidr) {
		[$network, $prefix] = explode('/', $cidr, 2);
		$addressBytes = @inet_pton($ip);
		$networkBytes = @inet_pton($network);
		$prefix = (int) $prefix;
		if ($addressBytes === false || $networkBytes === false || strlen($addressBytes) !== strlen($networkBytes) ||
			$prefix < 0 || $prefix > strlen($addressBytes) * 8) {
			return false;
		}

		$wholeBytes = intdiv($prefix, 8);
		if ($wholeBytes > 0 && substr($addressBytes, 0, $wholeBytes) !== substr($networkBytes, 0, $wholeBytes)) {
			return false;
		}

		$remainingBits = $prefix % 8;
		if ($remainingBits === 0) {
			return true;
		}

		$mask = (0xFF << (8 - $remainingBits)) & 0xFF;

		return (ord($addressBytes[$wholeBytes]) & $mask) === (ord($networkBytes[$wholeBytes]) & $mask);
	}

	/**
	 * Resolve a Location header relative to the request URL.
	 *
	 * @param string $baseUrl
	 * @param string $location
	 *
	 * @return null|string normalized redirect URL
	 */
	private static function resolveRedirectUrl($baseUrl, $location) {
		if (!is_string($location) || $location === '' || strlen($location) > self::MAX_URL_LENGTH ||
			preg_match('/[\x00-\x20\x5c\x7f]/', $location) === 1) {
			return null;
		}

		$locationParts = @parse_url($location);
		if ($locationParts === false) {
			return null;
		}
		if (isset($locationParts['scheme'])) {
			return self::normalizeUrl($location);
		}
		if (str_starts_with($location, '//')) {
			return self::normalizeUrl('https:' . $location);
		}

		$base = parse_url($baseUrl);
		$host = $base['host'];
		$authority = str_contains($host, ':') ? '[' . trim($host, '[]') . ']' : $host;
		if (isset($base['port']) && $base['port'] !== 443) {
			$authority .= ':' . $base['port'];
		}

		if (str_starts_with($location, '/')) {
			$pathAndQuery = $location;
		}
		elseif (str_starts_with($location, '?')) {
			$pathAndQuery = ($base['path'] ?? '/') . $location;
		}
		else {
			$basePath = $base['path'] ?? '/';
			$directory = substr($basePath, 0, strrpos($basePath, '/') + 1);
			$pathAndQuery = $directory . $location;
		}

		$relative = parse_url($pathAndQuery);
		if ($relative === false) {
			return null;
		}
		$path = self::removeDotSegments($relative['path'] ?? '/');
		$query = isset($relative['query']) ? '?' . $relative['query'] : '';

		return self::normalizeUrl('https://' . $authority . $path . $query);
	}

	/**
	 * Remove dot segments from a URL path.
	 *
	 * @param string $path
	 *
	 * @return string
	 */
	private static function removeDotSegments($path) {
		$trailingSlash = str_ends_with($path, '/') || str_ends_with($path, '/.') || str_ends_with($path, '/..');
		$segments = [];
		foreach (explode('/', $path) as $index => $segment) {
			if (($index === 0 && $segment === '') || $segment === '.') {
				continue;
			}
			if ($segment === '..') {
				if (!empty($segments)) {
					array_pop($segments);
				}
			}
			else {
				$segments[] = $segment;
			}
		}

		$result = '/' . implode('/', $segments);

		return $trailingSlash && !str_ends_with($result, '/') ? $result . '/' : $result;
	}
}
