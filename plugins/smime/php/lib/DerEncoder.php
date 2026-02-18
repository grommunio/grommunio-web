<?php

namespace WAYF;

/**
 * ASN.1/DER encoder — complement to the existing Der.php decoder.
 *
 * Provides primitive and constructed type encoders following ITU-T X.690 DER
 * rules.  Higher-level helpers build CMS / S/MIME specific structures
 * (AlgorithmIdentifier, Attribute, etc.).
 */
class DerEncoder {
	// ----------------------------------------------------------------
	// Tag constants (universal class)
	// ----------------------------------------------------------------
	public const TAG_BOOLEAN          = 0x01;
	public const TAG_INTEGER          = 0x02;
	public const TAG_BIT_STRING       = 0x03;
	public const TAG_OCTET_STRING     = 0x04;
	public const TAG_NULL             = 0x05;
	public const TAG_OID              = 0x06;
	public const TAG_ENUMERATED       = 0x0A;
	public const TAG_UTF8_STRING      = 0x0C;
	public const TAG_SEQUENCE         = 0x30;
	public const TAG_SET              = 0x31;
	public const TAG_PRINTABLE_STRING = 0x13;
	public const TAG_IA5_STRING       = 0x16;
	public const TAG_UTC_TIME         = 0x17;
	public const TAG_GENERALIZED_TIME = 0x18;

	// ----------------------------------------------------------------
	// Length encoding
	// ----------------------------------------------------------------

	/**
	 * Encode a DER definite-length field.
	 *
	 * @param string $data the content whose length to encode
	 *
	 * @return string DER length bytes
	 */
	public static function len(string $data): string {
		$i = strlen($data);
		if ($i <= 127) {
			return pack('C', $i);
		}
		if ($i <= 255) {
			return pack('CC', 0x81, $i);
		}
		if ($i <= 65535) {
			return pack('Cn', 0x82, $i);
		}

		return pack('CN', 0x84, $i);
	}

	// ----------------------------------------------------------------
	// Primitive encoders
	// ----------------------------------------------------------------

	/**
	 * BOOLEAN (tag 0x01).
	 */
	public static function boolean(bool $value): string {
		$v = $value ? "\xFF" : "\x00";

		return "\x01\x01" . $v;
	}

	/**
	 * INTEGER (tag 0x02).
	 *
	 * Accepts a PHP integer, a binary big-endian string, or a
	 * hex-encoded string prefixed with "0x".
	 *
	 * @param int|string $value
	 */
	public static function integer($value): string {
		if (is_int($value)) {
			if ($value === 0) {
				$bytes = "\x00";
			}
			elseif ($value > 0) {
				$hex = dechex($value);
				if (strlen($hex) % 2 !== 0) {
					$hex = '0' . $hex;
				}
				$bytes = hex2bin($hex);
				// Ensure positive encoding: prepend 0x00 if high bit set
				if (ord($bytes[0]) & 0x80) {
					$bytes = "\x00" . $bytes;
				}
			}
			else {
				// Negative integers via two's complement
				$abs = -$value;
				$hex = dechex($abs);
				if (strlen($hex) % 2 !== 0) {
					$hex = '0' . $hex;
				}
				$len = strlen($hex) / 2;
				// Compute two's complement
				$tc = '';
				$carry = 1;
				for ($i = $len - 1; $i >= 0; --$i) {
					$b = ~ord(hex2bin(substr($hex, $i * 2, 2))) & 0xFF;
					$b += $carry;
					$carry = ($b >> 8) & 1;
					$tc = chr($b & 0xFF) . $tc;
				}
				// If high bit is not set, need 0xFF prefix
				if (!(ord($tc[0]) & 0x80)) {
					$tc = "\xFF" . $tc;
				}
				$bytes = $tc;
			}
		}
		elseif (is_string($value) && str_starts_with($value, '0x')) {
			$hex = substr($value, 2);
			if (strlen($hex) % 2 !== 0) {
				$hex = '0' . $hex;
			}
			$bytes = hex2bin($hex);
			if (ord($bytes[0]) & 0x80) {
				$bytes = "\x00" . $bytes;
			}
		}
		else {
			// Raw binary
			$bytes = (string) $value;
			if ($bytes === '') {
				$bytes = "\x00";
			}
		}

		return "\x02" . self::len($bytes) . $bytes;
	}

	/**
	 * BIT STRING (tag 0x03).
	 *
	 * @param string $data       raw bit data
	 * @param int    $unusedBits number of unused bits in the last octet
	 */
	public static function bitString(string $data, int $unusedBits = 0): string {
		$content = chr($unusedBits) . $data;

		return "\x03" . self::len($content) . $content;
	}

	/**
	 * OCTET STRING (tag 0x04).
	 */
	public static function octetString(string $data): string {
		return "\x04" . self::len($data) . $data;
	}

	/**
	 * NULL (tag 0x05).
	 */
	public static function null(): string {
		return "\x05\x00";
	}

	/**
	 * OBJECT IDENTIFIER (tag 0x06).
	 *
	 * @param string $oid dotted-notation OID (e.g., "1.2.840.113549.1.7.1")
	 */
	public static function oid(string $oid): string {
		$arcs = explode('.', $oid);
		$der = chr(40 * (int) $arcs[0] + (int) $arcs[1]);

		foreach (array_slice($arcs, 2) as $arc) {
			$mask = 0;
			$rev = '';
			$c = $arc;
			while ($c > 0) {
				$rev .= chr(bcmod($c, '128') + $mask);
				$c = bcdiv($c, '128', 0);
				$mask = 128;
			}
			if ($rev === '') {
				$rev = "\x00";
			}
			$der .= strrev($rev);
		}

		return "\x06" . self::len($der) . $der;
	}

	/**
	 * ENUMERATED (tag 0x0A).
	 */
	public static function enumerated(int $value): string {
		$inner = self::integer($value);
		// Replace integer tag with enumerated tag
		return "\x0A" . substr($inner, 1);
	}

	/**
	 * UTF8String (tag 0x0C).
	 */
	public static function utf8String(string $data): string {
		return "\x0C" . self::len($data) . $data;
	}

	/**
	 * PrintableString (tag 0x13).
	 */
	public static function printableString(string $data): string {
		return "\x13" . self::len($data) . $data;
	}

	/**
	 * IA5String (tag 0x16).
	 */
	public static function ia5String(string $data): string {
		return "\x16" . self::len($data) . $data;
	}

	/**
	 * UTCTime (tag 0x17).
	 *
	 * @param string $time in format "YYMMDDhhmmssZ"
	 */
	public static function utcTime(string $time): string {
		return "\x17" . self::len($time) . $time;
	}

	/**
	 * GeneralizedTime (tag 0x18).
	 *
	 * @param string $time in format "YYYYMMDDhhmmssZ"
	 */
	public static function generalizedTime(string $time): string {
		return "\x18" . self::len($time) . $time;
	}

	// ----------------------------------------------------------------
	// Constructed encoders
	// ----------------------------------------------------------------

	/**
	 * SEQUENCE (tag 0x30).
	 *
	 * @param string $contents concatenated DER-encoded elements
	 */
	public static function sequence(string $contents): string {
		return "\x30" . self::len($contents) . $contents;
	}

	/**
	 * SET (tag 0x31).
	 *
	 * @param string $contents concatenated DER-encoded elements
	 */
	public static function set(string $contents): string {
		return "\x31" . self::len($contents) . $contents;
	}

	// ----------------------------------------------------------------
	// Context-specific tagging
	// ----------------------------------------------------------------

	/**
	 * EXPLICIT context-specific tag (constructed).
	 *
	 * @param int    $tagNumber context tag number (0, 1, 2, ...)
	 * @param string $contents  DER-encoded inner value
	 */
	public static function explicit(int $tagNumber, string $contents): string {
		$tag = chr(0xA0 | ($tagNumber & 0x1F));

		return $tag . self::len($contents) . $contents;
	}

	/**
	 * IMPLICIT context-specific tag (primitive).
	 *
	 * @param int    $tagNumber context tag number
	 * @param string $contents  raw value (without original tag+length)
	 */
	public static function implicit(int $tagNumber, string $contents): string {
		$tag = chr(0x80 | ($tagNumber & 0x1F));

		return $tag . self::len($contents) . $contents;
	}

	/**
	 * IMPLICIT context-specific tag (constructed).
	 *
	 * @param int    $tagNumber context tag number
	 * @param string $contents  DER-encoded inner elements
	 */
	public static function implicitConstructed(int $tagNumber, string $contents): string {
		$tag = chr(0xA0 | ($tagNumber & 0x1F));

		return $tag . self::len($contents) . $contents;
	}

	/**
	 * Raw tag+length+value wrapper for arbitrary tags.
	 *
	 * @param int    $tag      single-byte tag value
	 * @param string $contents raw content
	 */
	public static function raw(int $tag, string $contents): string {
		return chr($tag) . self::len($contents) . $contents;
	}

	// ----------------------------------------------------------------
	// Higher-level helpers
	// ----------------------------------------------------------------

	/**
	 * AlgorithmIdentifier ::= SEQUENCE { algorithm OID, parameters ANY OPTIONAL }
	 *
	 * @param string      $algorithmOid dotted notation
	 * @param null|string $parameters   DER-encoded parameters (null = absent, '' = NULL)
	 */
	public static function algorithmIdentifier(string $algorithmOid, ?string $parameters = null): string {
		$inner = self::oid($algorithmOid);
		if ($parameters === '') {
			$inner .= self::null();
		}
		elseif ($parameters !== null) {
			$inner .= $parameters;
		}

		return self::sequence($inner);
	}

	/**
	 * Attribute ::= SEQUENCE { attrType OID, attrValues SET OF ANY }
	 *
	 * @param string $oid    dotted notation
	 * @param string $values DER-encoded concatenation of attribute values
	 */
	public static function attribute(string $oid, string $values): string {
		return self::sequence(
			self::oid($oid) .
			self::set($values)
		);
	}

	/**
	 * Build a DER-encoded IssuerAndSerialNumber.
	 *
	 * @param string $issuerDer    DER-encoded issuer Name
	 * @param string $serialNumDer DER-encoded serial number (with INTEGER tag)
	 */
	public static function issuerAndSerialNumber(string $issuerDer, string $serialNumDer): string {
		return self::sequence($issuerDer . $serialNumDer);
	}
}
