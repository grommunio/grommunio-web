<?php

/*
 * SPDX-FileCopyrightText: Copyright 2026 grommunio GmbH
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

namespace Files\Core\Util;

require_once __DIR__ . "/class.logger.php";
require_once __DIR__ . "/../../Backend/class.exception.php";

use Files\Backend\Exception as BackendException;

/**
 * Vets the destination of every request a Files backend sends.
 *
 * The server address of a Files account is chosen by the user, so the web
 * server must not become a relay into services that only expect local peers.
 * Destinations on this machine are reachable on the HTTPS port only,
 * which keeps a grommunio Files on the same host working however its name
 * resolves locally; link-local (cloud metadata), multicast and reserved
 * addresses are never reachable.
 *
 * The TLS certificate of the file server is verified, except on the way to
 * this machine, which cannot be intercepted, and to the hosts listed in
 * PLUGIN_FILES_UNVERIFIED_HOSTS.
 */
class OutboundGuard {
	private const LOCAL_PORT = 443;

	private const DENIED_RANGES = [
		'0.0.0.0/8', '169.254.0.0/16', '224.0.0.0/4', '240.0.0.0/4',
		'::/128', '::/96', '100::/64', 'fe80::/10', 'ff00::/8',
	];

	private const LOOPBACK_RANGES = ['127.0.0.0/8', '::1/128'];

	private const PRIVATE_RANGES = [
		'10.0.0.0/8', '100.64.0.0/10', '172.16.0.0/12', '192.168.0.0/16',
		'fc00::/7', 'fec0::/10', '64:ff9b:1::/48',
	];

	private static $localAddresses;

	/**
	 * Check a URL and return it rebuilt from the vetted parts, together with
	 * the CURLOPT_RESOLVE entries that pin curl to the vetted addresses and
	 * whether the peer certificate is to be verified.
	 *
	 * @param string $url
	 *
	 * @return array [url, resolve entries, verify]
	 *
	 * @throws BackendException if the destination is not allowed
	 */
	public static function check($url) {
		$parts = parse_url((string) $url) ?: [];
		$scheme = strtolower($parts['scheme'] ?? '');
		$host = strtolower($parts['host'] ?? '');
		if (!in_array($scheme, ['http', 'https'], true) || $host === '' ||
			isset($parts['user']) || isset($parts['pass'])) {
			self::deny($url, 'malformed URL');
		}
		$port = $parts['port'] ?? ($scheme === 'https' ? 443 : 80);
		$path = $parts['path'] ?? '/';
		if (!str_starts_with($path, '/')) {
			self::deny($url, 'malformed URL');
		}

		$name = trim($host, '[]');
		$isIp = filter_var($name, FILTER_VALIDATE_IP) !== false;
		if (!$isIp) {
			if (preg_match('/[^\x00-\x7f]/', $name) && function_exists('idn_to_ascii')) {
				$name = idn_to_ascii($name, IDNA_DEFAULT, INTL_IDNA_VARIANT_UTS46) ?: $name;
			}
			if (!preg_match('/^[a-z0-9_-]+(\.[a-z0-9_-]+)*\.?$/', $name)) {
				self::deny($url, 'malformed host name');
			}
		}
		$urlHost = str_contains($name, ':') ? "[{$name}]" : $name;
		$rebuilt = "{$scheme}://{$urlHost}:{$port}{$path}" . (isset($parts['query']) ? '?' . $parts['query'] : '');
		$verify = !self::isListed('PLUGIN_FILES_UNVERIFIED_HOSTS', $name, $port);
		if (self::isListed('PLUGIN_FILES_ALLOWED_HOSTS', $name, $port)) {
			return [$rebuilt, [], $verify];
		}

		$addresses = self::resolve($name);
		if (empty($addresses)) {
			self::deny($url, 'host name does not resolve');
		}
		$local = true;
		foreach ($addresses as $address) {
			$reason = self::refusal($address, $port);
			if ($reason !== null) {
				self::deny($url, "{$address} is {$reason}");
			}
			$local = $local && self::isLocal($address);
		}
		// nothing sits between this machine and itself to impersonate the server
		$verify = $verify && !$local;
		if ($isIp) {
			return [$rebuilt, [], $verify];
		}
		// curl connects to exactly the addresses vetted here, a second lookup could differ
		$pinned = array_map(fn ($a) => str_contains($a, ':') ? "[{$a}]" : $a, $addresses);

		return [$rebuilt, ["{$name}:{$port}:" . implode(',', $pinned)], $verify];
	}

	/**
	 * The curl options that send a request to a vetted destination.
	 *
	 * @param string $url
	 *
	 * @return array
	 *
	 * @throws BackendException if the destination is not allowed
	 */
	public static function curlOptions($url) {
		[$target, $resolve, $verify] = self::check($url);

		return [
			CURLOPT_URL => $target,
			CURLOPT_RESOLVE => $resolve,
			CURLOPT_FOLLOWLOCATION => false,
			CURLOPT_PROTOCOLS => CURLPROTO_HTTP | CURLPROTO_HTTPS,
			CURLOPT_SSL_VERIFYPEER => $verify,
			CURLOPT_SSL_VERIFYHOST => $verify ? 2 : 0,
		];
	}

	/**
	 * curl_exec() on a prepared handle, following redirects here instead of in
	 * curl so that every hop is vetted. Like curl, credentials only go to the
	 * host they were set for.
	 *
	 * @param \CurlHandle $ch
	 * @param string      $url
	 * @param int         $maxRedirects
	 * @param callable    $rewind       called before a redirect is followed, e.g. to truncate an output file
	 *
	 * @return bool|string curl_exec() result of the last hop
	 *
	 * @throws BackendException if a destination is not allowed
	 */
	public static function exec($ch, $url, $maxRedirects = 5, $rewind = null) {
		$origin = strtolower((string) parse_url((string) $url, PHP_URL_HOST));
		for ($hop = 0;; ++$hop) {
			curl_setopt_array($ch, self::curlOptions($url));
			$result = curl_exec($ch);
			$next = curl_getinfo($ch, CURLINFO_REDIRECT_URL);
			if ($result === false || !is_string($next) || $next === '' || $hop >= $maxRedirects) {
				return $result;
			}
			if (strtolower((string) parse_url($next, PHP_URL_HOST)) !== $origin) {
				curl_setopt($ch, CURLOPT_USERPWD, null);
				curl_setopt($ch, CURLOPT_XOAUTH2_BEARER, null);
			}
			if ($rewind !== null) {
				$rewind();
			}
			$url = $next;
		}
	}

	/**
	 * @param string $address IP address
	 * @param int    $port
	 *
	 * @return null|string why the address may not be contacted, null if it may
	 */
	public static function refusal($address, $port) {
		$embedded = self::embeddedIpv4($address);
		if ($embedded !== null) {
			return self::refusal($embedded, $port);
		}
		if (self::isLocal($address)) {
			return (int) $port === self::LOCAL_PORT ? null : 'this server (port ' . (int) $port . ')';
		}
		if (self::inRanges($address, self::DENIED_RANGES)) {
			return 'a reserved address';
		}
		if (self::inRanges($address, self::PRIVATE_RANGES) &&
			defined('PLUGIN_FILES_BLOCK_PRIVATE_NETWORKS') && PLUGIN_FILES_BLOCK_PRIVATE_NETWORKS) {
			return 'a private network address';
		}

		return null;
	}

	/**
	 * @param string $url
	 * @param string $reason
	 *
	 * @throws BackendException
	 */
	private static function deny($url, $reason) {
		Logger::error("OutboundGuard", "Refused request to {$url}: {$reason}");
		$e = new BackendException(_('The file server address is not allowed. Please contact your system administrator.'), 403);
		$e->setTitle(_('Connection refused'));

		throw $e;
	}

	/**
	 * @param string $address IP address
	 *
	 * @return bool whether the address is one of this machine's
	 */
	private static function isLocal($address) {
		$embedded = self::embeddedIpv4($address);
		if ($embedded !== null) {
			return self::isLocal($embedded);
		}

		return self::inRanges($address, self::LOOPBACK_RANGES) || in_array(inet_pton($address), self::localAddresses(), true);
	}

	/**
	 * Whether the "host" or "host:port" entries listed in $constant include this destination.
	 *
	 * @param string $constant
	 * @param string $host
	 * @param int    $port
	 *
	 * @return bool
	 */
	private static function isListed($constant, $host, $port) {
		if (!defined($constant)) {
			return false;
		}
		foreach (preg_split('/[\s,]+/', strtolower((string) constant($constant)), -1, PREG_SPLIT_NO_EMPTY) as $entry) {
			// host, host:port, bare IPv6 address or [IPv6]:port
			if (substr_count($entry, ':') > 1 && $entry[0] !== '[') {
				$entry = "[{$entry}]";
			}
			if (preg_match('/^(?:\[([^\]]+)\]|([^:]+))(?::(\d+))?$/', $entry, $m) &&
				($m[1] !== '' ? $m[1] : $m[2]) === $host && (!isset($m[3]) || (int) $m[3] === (int) $port)) {
				return true;
			}
		}

		return false;
	}

	/**
	 * @param string $host host name or IP address without brackets
	 *
	 * @return string[] IPv4 and IPv6 addresses
	 */
	private static function resolve($host) {
		if (filter_var($host, FILTER_VALIDATE_IP)) {
			return [$host];
		}
		$addresses = gethostbynamel($host) ?: [];
		foreach (@dns_get_record($host, DNS_AAAA) ?: [] as $record) {
			if (isset($record['ipv6'])) {
				$addresses[] = $record['ipv6'];
			}
		}

		return array_values(array_unique($addresses));
	}

	/**
	 * @param string $address
	 *
	 * @return null|string the IPv4 address carried by a v4-mapped, NAT64 or 6to4 address
	 */
	private static function embeddedIpv4($address) {
		$bin = inet_pton($address);
		if ($bin === false || strlen($bin) !== 16) {
			return null;
		}
		if (str_starts_with($bin, str_repeat("\0", 10) . "\xff\xff") ||
			str_starts_with($bin, "\x00\x64\xff\x9b" . str_repeat("\0", 8))) {
			return inet_ntop(substr($bin, 12));
		}
		if (str_starts_with($bin, "\x20\x02")) {
			return inet_ntop(substr($bin, 2, 4));
		}

		return null;
	}

	/**
	 * @param string   $address
	 * @param string[] $ranges  CIDR notation
	 *
	 * @return bool
	 */
	private static function inRanges($address, $ranges) {
		$bin = inet_pton($address);
		if ($bin === false) {
			return false;
		}
		foreach ($ranges as $range) {
			[$net, $bits] = explode('/', $range);
			$netBin = inet_pton($net);
			if (strlen($netBin) !== strlen($bin)) {
				continue;
			}
			$bytes = intdiv((int) $bits, 8);
			$rest = (int) $bits % 8;
			if (substr($bin, 0, $bytes) !== substr($netBin, 0, $bytes)) {
				continue;
			}
			if ($rest === 0 || ((ord($bin[$bytes]) ^ ord($netBin[$bytes])) & (0xFF << (8 - $rest)) & 0xFF) === 0) {
				return true;
			}
		}

		return false;
	}

	/**
	 * @return string[] packed addresses of this machine's interfaces
	 */
	private static function localAddresses() {
		if (self::$localAddresses === null) {
			self::$localAddresses = [];
			foreach (function_exists('net_get_interfaces') ? (net_get_interfaces() ?: []) : [] as $interface) {
				foreach ($interface['unicast'] ?? [] as $unicast) {
					$packed = isset($unicast['address']) ? @inet_pton(explode('%', $unicast['address'])[0]) : false;
					if ($packed !== false) {
						self::$localAddresses[] = $packed;
					}
				}
			}
		}

		return self::$localAddresses;
	}
}
