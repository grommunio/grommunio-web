<?php

/** RFC 3156 envelopes. Signed MIME bytes are never parsed and reserialized. */
class PgpMime {
	public static function split(string $mime): array {
		if (!preg_match('/\r?\n\r?\n/', $mime, $match, PREG_OFFSET_CAPTURE)) {
			throw new RuntimeException('The OpenPGP MIME entity has no header separator.');
		}
		$offset = $match[0][1];
		if ($offset > 65536) {
			throw new RuntimeException('The OpenPGP MIME headers are too large.');
		}
		return [substr($mime, 0, $offset), substr($mime, $offset + strlen($match[0][0]))];
	}

	public static function headers(string $text): array {
		if (preg_match('/[\x00-\x08\x0b\x0c\x0e-\x1f\x7f]|\r(?!\n)/', $text)) {
			throw new RuntimeException('Invalid control character in OpenPGP MIME headers.');
		}
		$text = preg_replace('/\r?\n[ \t]+/', ' ', $text);
		$headers = [];
		foreach (preg_split('/\r?\n/', $text) as $line) {
			if (!preg_match('/^([!-9;-~]+):[ \t]*(.*)$/D', $line, $match)) {
				throw new RuntimeException('Malformed OpenPGP MIME header.');
			}
			$name = strtolower($match[1]);
			if (isset($headers[$name]) && in_array($name, ['content-type', 'content-transfer-encoding'], true)) {
				throw new RuntimeException('Ambiguous OpenPGP MIME headers.');
			}
			$headers[$name] = $match[2];
		}
		return $headers;
	}

	public static function contentType(string $value): array {
		if (preg_match('/[\x00-\x08\x0a-\x1f\x7f]/', $value)) {
			throw new RuntimeException('Invalid control character in OpenPGP MIME content type.');
		}
		$separator = strpos($value, ';');
		$type = strtolower(trim($separator === false ? $value : substr($value, 0, $separator)));
		$types = explode('/', $type);
		if (count($types) !== 2 || !self::token($types[0]) || !self::token($types[1])) {
			throw new RuntimeException('Malformed OpenPGP MIME content type.');
		}
		$params = [];
		$offset = $separator === false ? strlen($value) : $separator;
		while ($offset < strlen($value)) {
			if ($value[$offset++] !== ';') {
				throw new RuntimeException('Malformed OpenPGP MIME parameter.');
			}
			$offset += strspn($value, " \t", $offset);
			$length = strcspn($value, "=; \t", $offset);
			$name = strtolower(substr($value, $offset, $length));
			$offset += $length;
			$offset += strspn($value, " \t", $offset);
			if (!self::token($name) || $offset >= strlen($value) || $value[$offset++] !== '=') {
				throw new RuntimeException('Malformed OpenPGP MIME parameter name.');
			}
			if (isset($params[$name])) {
				throw new RuntimeException('Duplicate OpenPGP MIME parameter.');
			}
			$offset += strspn($value, " \t", $offset);
			$parameter = '';
			if (($value[$offset] ?? '') === '"') {
				++$offset;
				$closed = false;
				while ($offset < strlen($value)) {
					$character = $value[$offset++];
					if ($character === '"') {
						$closed = true;
						break;
					}
					if ($character === '\\') {
						if ($offset >= strlen($value)) {
							break;
						}
						$character = $value[$offset++];
					}
					$parameter .= $character;
				}
				if (!$closed) {
					throw new RuntimeException('Unclosed OpenPGP MIME quoted parameter.');
				}
			}
			else {
				$length = strcspn($value, "; \t", $offset);
				$parameter = substr($value, $offset, $length);
				$offset += $length;
				if (!self::token($parameter)) {
					throw new RuntimeException('Malformed OpenPGP MIME parameter value.');
				}
			}
			$offset += strspn($value, " \t", $offset);
			$params[$name] = $parameter;
		}
		return [$type, $params];
	}

	private static function token(string $value): bool {
		return $value !== '' && !preg_match('/[\x00-\x20\x7f-\xff]/', $value) && strpbrk($value, "()<>@,;:\\\"/[]?=") === false;
	}

	public static function kind(string $headers): ?string {
		$map = self::headers($headers);
		[$type, $params] = self::contentType($map['content-type'] ?? 'text/plain');
		$protocol = strtolower($params['protocol'] ?? '');
		if ($type === 'multipart/encrypted' && $protocol === 'application/pgp-encrypted') {
			return 'encrypted';
		}
		if ($type === 'multipart/signed' && $protocol === 'application/pgp-signature') {
			return 'signed';
		}
		return null;
	}

	/** Extract only MIME headers; Bcc and other envelope fields stay outside. */
	public static function entity(string $rfc822, bool $canonicalize = true): string {
		if ($canonicalize) {
			$rfc822 = preg_replace('/\r\n|\r|\n/', "\r\n", $rfc822);
			// RFC 3156 section 5: transport-safe signing canonicalization. The
			// outgoing MAPI converter has already encoded binary MIME parts.
			$rfc822 = preg_replace('/[ \t]+(?=\r\n|\z)/', '', $rfc822);
		}
		[$headers, $body] = self::split($rfc822);
		$lines = preg_split('/\r?\n(?![ \t])/', $headers);
		self::headers($headers);
		$content = [];
		foreach ($lines as $line) {
			if (preg_match('/^Content-[A-Za-z-]+:/i', $line)) {
				$content[] = $line;
			}
		}
		if (!$content) {
			$content[] = 'Content-Type: text/plain; charset=utf-8';
		}
		return implode("\r\n", $content) . "\r\n\r\n" . $body;
	}

	public static function signed(string $entity, string $signature): string {
		$boundary = '=_grommunio_pgp_' . bin2hex(random_bytes(18));
		return 'Content-Type: multipart/signed; protocol="application/pgp-signature";' . "\r\n" .
			' micalg=pgp-sha256; boundary="' . $boundary . '"' . "\r\n\r\n" .
			'--' . $boundary . "\r\n" . $entity . "\r\n--" . $boundary . "\r\n" .
			'Content-Type: application/pgp-signature; name="signature.asc"' . "\r\n" .
			'Content-Description: OpenPGP digital signature' . "\r\n" .
			'Content-Disposition: attachment; filename="signature.asc"' . "\r\n\r\n" .
			$signature . "\r\n--" . $boundary . "--\r\n";
	}

	public static function encrypted(string $ciphertext): string {
		$boundary = '=_grommunio_pgp_' . bin2hex(random_bytes(18));
		return 'Content-Type: multipart/encrypted; protocol="application/pgp-encrypted";' . "\r\n" .
			' boundary="' . $boundary . '"' . "\r\n\r\n" .
			'--' . $boundary . "\r\nContent-Type: application/pgp-encrypted\r\n\r\nVersion: 1\r\n" .
			'--' . $boundary . "\r\nContent-Type: application/octet-stream; name=\"encrypted.asc\"\r\n" .
			'Content-Disposition: inline; filename="encrypted.asc"' . "\r\n\r\n" .
			$ciphertext . "\r\n--" . $boundary . "--\r\n";
	}

	public static function unwrap(string $mime): array {
		[$headerText, $body] = self::split($mime);
		$headers = self::headers($headerText);
		[$type, $params] = self::contentType($headers['content-type'] ?? '');
		$kind = self::kind($headerText);
		if ($kind === null || empty($params['boundary']) || strlen($params['boundary']) > 70 || !preg_match("/^[0-9A-Za-z'()+_,.\\/:=? -]*[0-9A-Za-z'()+_,.\\/:=?-]$/D", $params['boundary'])) {
			throw new RuntimeException('Not a supported OpenPGP/MIME envelope.');
		}
		if (isset($headers['content-transfer-encoding']) && !in_array(strtolower($headers['content-transfer-encoding']), ['7bit', '8bit', 'binary'], true)) {
			throw new RuntimeException('Invalid transfer encoding for an OpenPGP multipart envelope.');
		}
		$pattern = '/^--' . preg_quote($params['boundary'], '/') . '(--)?[ \t]*(?:\r?\n|$)/m';
		preg_match_all($pattern, $body, $matches, PREG_OFFSET_CAPTURE | PREG_SET_ORDER);
		if (count($matches) !== 3 || ($matches[0][1][0] ?? '') !== '' || ($matches[1][1][0] ?? '') !== '' || ($matches[2][1][0] ?? '') !== '--') {
			throw new RuntimeException('An OpenPGP/MIME envelope must contain exactly two parts.');
		}
		$parts = [];
		for ($i = 0; $i < 2; ++$i) {
			$start = $matches[$i][0][1] + strlen($matches[$i][0][0]);
			$part = substr($body, $start, $matches[$i + 1][0][1] - $start);
			$parts[] = preg_replace('/\r?\n$/D', '', $part);
		}
		[$secondHeaders, $secondBody] = self::split($parts[1]);
		$second = self::headers($secondHeaders);
		[$secondType] = self::contentType($second['content-type'] ?? '');
		$decoded = self::decode($secondBody, $second['content-transfer-encoding'] ?? '7bit');
		if ($kind === 'signed') {
			if ($secondType !== 'application/pgp-signature') {
				throw new RuntimeException('Missing OpenPGP signature MIME part.');
			}
			return ['kind' => 'signed', 'entity' => $parts[0], 'signature' => $decoded];
		}
		[$firstHeaders, $version] = self::split($parts[0]);
		$first = self::headers($firstHeaders);
		[$firstType] = self::contentType($first['content-type'] ?? '');
		$version = self::decode($version, $first['content-transfer-encoding'] ?? '7bit');
		if ($firstType !== 'application/pgp-encrypted' || !preg_match('/^Version:\s*1\s*$/iD', trim($version)) || $secondType !== 'application/octet-stream') {
			throw new RuntimeException('Invalid OpenPGP encrypted MIME parts.');
		}
		return ['kind' => 'encrypted', 'ciphertext' => $decoded];
	}

	private static function decode(string $body, string $encoding): string {
		switch (strtolower(trim($encoding))) {
			case 'base64':
				$result = base64_decode($body, true);
				if ($result === false) {
					throw new RuntimeException('Invalid OpenPGP MIME base64.');
				}
				return $result;
			case 'quoted-printable':
				return quoted_printable_decode($body);
			case '7bit':
			case '8bit':
			case 'binary':
				return $body;
			default:
				throw new RuntimeException('Unsupported OpenPGP MIME transfer encoding.');
		}
	}
}
