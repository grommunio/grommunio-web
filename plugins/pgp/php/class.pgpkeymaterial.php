<?php

/**
 * Bounded OpenPGP storage-envelope validation only. This class never decrypts,
 * signs, executes GnuPG, verifies identities, or receives a passphrase.
 * OpenPGP.js must validate certifications and key usability in the browser.
 */
final class PgpKeyMaterial {
	public static function inspect(string $armor, bool $private, int $limit): array {
		$binary = self::decodeArmor($armor, $private, $limit);
		$offset = 0;
		$primary = null;
		$secretCount = 0;
		$packetCount = 0;
		while ($offset < strlen($binary)) {
			if (++$packetCount > 10000) { throw new InvalidArgumentException('Too many OpenPGP key packets.'); }
			[$tag, $body] = self::packet($binary, $offset);
			if (!in_array($tag, [2, 5, 6, 7, 10, 12, 13, 14, 17], true)) {
				throw new InvalidArgumentException('Supply an uncompressed OpenPGP key block only.');
			}
			if ($primary === null && !in_array($tag, [5, 6, 10], true)) {
				throw new InvalidArgumentException('The OpenPGP primary key must precede its other packets.');
			}
			if (!in_array($tag, [5, 6, 7, 14], true)) { continue; }
			$secret = $tag === 5 || $tag === 7;
			if ($secret && !$private) { throw new InvalidArgumentException('Public key material must not contain private-key packets.'); }
			$publicLength = self::publicLength($body);
			$public = substr($body, 0, $publicLength);
			if ($secret) {
				++$secretCount;
				$cursor = $publicLength;
				$usage = self::number($body, $cursor, 1);
				if (!in_array($usage, [253, 254], true) || strlen($body) - $cursor < 16) {
					throw new InvalidArgumentException('Private keys must already be encrypted with a passphrase in the browser before upload.');
				}
			}
			elseif ($publicLength !== strlen($body)) {
				throw new InvalidArgumentException('Unexpected data after an OpenPGP public-key packet.');
			}
			if ($tag === 5 || $tag === 6) {
				if ($primary !== null) { throw new InvalidArgumentException('Store exactly one OpenPGP primary key per record.'); }
				$version = ord($public[0]);
				$prefix = $version === 4 ? "\x99" . pack('n', strlen($public)) : "\x9b" . pack('N', strlen($public));
				$primary = ['fingerprint' => strtoupper(hash($version === 4 ? 'sha1' : 'sha256', $prefix . $public)),
					'version' => $version, 'created' => unpack('N', substr($public, 1, 4))[1], 'algorithm' => ord($public[5])];
			}
		}
		if ($primary === null || ($private && $secretCount === 0)) {
			throw new InvalidArgumentException('The supplied block does not contain the requested OpenPGP key material.');
		}
		return $primary;
	}

	private static function decodeArmor(string $armor, bool $private, int $limit): string {
		if ($armor === '' || strlen($armor) > $limit || str_contains($armor, "\0")) {
			throw new InvalidArgumentException('OpenPGP key data is empty or exceeds the administrator size limit.');
		}
		$normalized = str_replace("\r\n", "\n", trim($armor));
		if (str_contains($normalized, "\r")) { throw new InvalidArgumentException('Invalid OpenPGP armor line endings.'); }
		$lines = explode("\n", $normalized);
		$kind = $private ? 'PRIVATE' : 'PUBLIC';
		if (array_shift($lines) !== '-----BEGIN PGP ' . $kind . ' KEY BLOCK-----' ||
			array_pop($lines) !== '-----END PGP ' . $kind . ' KEY BLOCK-----') {
			throw new InvalidArgumentException('Supply exactly one armored OpenPGP ' . strtolower($kind) . ' key block.');
		}
		$payload = '';
		$inHeaders = true;
		$checksum = null;
		foreach ($lines as $line) {
			if ($inHeaders) {
				if ($line === '') { $inHeaders = false; continue; }
				if (!preg_match('/^[A-Za-z][A-Za-z0-9-]*: [\x20-\x7e]*$/D', $line)) {
					throw new InvalidArgumentException('Invalid OpenPGP armor header.');
				}
				continue;
			}
			if ($checksum !== null) { throw new InvalidArgumentException('Unexpected data after OpenPGP armor checksum.'); }
			if (preg_match('/^=([A-Za-z0-9+\/]{4})$/D', $line, $match)) { $checksum = base64_decode($match[1], true); continue; }
			if (!preg_match('/^[A-Za-z0-9+\/]{1,76}={0,2}$/D', $line)) { throw new InvalidArgumentException('Invalid OpenPGP armor encoding.'); }
			$payload .= $line;
		}
		$binary = base64_decode($payload, true);
		if ($inHeaders || $binary === false || $binary === '' || base64_encode($binary) !== $payload) {
			throw new InvalidArgumentException('Invalid OpenPGP armor payload.');
		}
		if ($checksum !== null) {
			$crc = 0xb704ce;
			foreach (str_split($binary) as $byte) {
				$crc ^= ord($byte) << 16;
				for ($bit = 0; $bit < 8; ++$bit) { $crc <<= 1; if ($crc & 0x1000000) { $crc ^= 0x1864cfb; } }
			}
			if (substr(pack('N', $crc & 0xffffff), 1) !== $checksum) { throw new InvalidArgumentException('OpenPGP armor checksum mismatch.'); }
		}
		return $binary;
	}

	private static function packet(string $binary, int &$offset): array {
		$header = self::number($binary, $offset, 1);
		if (($header & 0x80) === 0) { throw new InvalidArgumentException('Malformed OpenPGP packet.'); }
		if (($header & 0x40) === 0) {
			$kind = $header & 3;
			if ($kind === 3) { throw new InvalidArgumentException('Indeterminate-length key packets are not supported.'); }
			$length = self::number($binary, $offset, 1 << $kind);
			return [($header >> 2) & 15, self::bytes($binary, $offset, $length)];
		}
		$body = '';
		do {
			$first = self::number($binary, $offset, 1);
			$partial = $first >= 224 && $first < 255;
			if ($first < 192) { $length = $first; }
			elseif ($first < 224) { $length = (($first - 192) << 8) + self::number($binary, $offset, 1) + 192; }
			else { $length = $partial ? 1 << ($first & 31) : self::number($binary, $offset, 4); }
			$body .= self::bytes($binary, $offset, $length);
		} while ($partial);
		return [$header & 63, $body];
	}

	private static function publicLength(string $body): int {
		$cursor = 0;
		$version = self::number($body, $cursor, 1);
		self::bytes($body, $cursor, 4);
		$algorithm = self::number($body, $cursor, 1);
		if ($version === 6) {
			$length = self::number($body, $cursor, 4);
			self::bytes($body, $cursor, $length);
			return $cursor;
		}
		if ($version !== 4) { throw new InvalidArgumentException('Only OpenPGP version 4 and version 6 keys are supported.'); }
		if (in_array($algorithm, [18, 19, 22], true)) {
			$oid = self::number($body, $cursor, 1);
			self::bytes($body, $cursor, $oid);
			$mpiCount = 1;
		}
		elseif (isset([25 => 32, 26 => 56, 27 => 32, 28 => 57][$algorithm])) {
			self::bytes($body, $cursor, [25 => 32, 26 => 56, 27 => 32, 28 => 57][$algorithm]);
			return $cursor;
		}
		else {
			$mpiCount = [1 => 2, 2 => 2, 3 => 2, 16 => 3, 17 => 4][$algorithm] ?? null;
			if ($mpiCount === null) { throw new InvalidArgumentException('Unsupported OpenPGP key packet algorithm.'); }
		}
		for ($i = 0; $i < $mpiCount; ++$i) {
			$bits = self::number($body, $cursor, 2);
			self::bytes($body, $cursor, intdiv($bits + 7, 8));
		}
		if ($algorithm === 18) {
			$length = self::number($body, $cursor, 1);
			self::bytes($body, $cursor, $length);
		}
		if ($cursor > 65535) { throw new InvalidArgumentException('Oversized version 4 OpenPGP public key.'); }
		return $cursor;
	}

	private static function bytes(string $bytes, int &$offset, int $length): string {
		if ($length < 0 || $length > strlen($bytes) - $offset) { throw new InvalidArgumentException('Truncated OpenPGP key packet.'); }
		$value = substr($bytes, $offset, $length);
		$offset += $length;
		return $value;
	}
	private static function number(string $bytes, int &$offset, int $length): int {
		$value = 0;
		foreach (str_split(self::bytes($bytes, $offset, $length)) as $byte) { $value = ($value << 8) | ord($byte); }
		return $value;
	}
}
