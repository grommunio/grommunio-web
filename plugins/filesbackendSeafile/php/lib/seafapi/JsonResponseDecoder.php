<?php

/*
 * SPDX-FileCopyrightText: Copyright 2020 - 2026 grommunio GmbH
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

declare(strict_types=1);

namespace Datamate\SeafileApi;

use Datamate\SeafileApi\Exception\InvalidResponseException;
use Datamate\SeafileApi\Exception\UnexpectedJsonTextResponseException as JsonDecodeException;

/**
 * Decodes Seafile JSON responses with structural acceptance.
 */
final class JsonResponseDecoder {
	public const ACCEPT_MASK = 31;                         # 1 1111 accept bitmask (five bits with the msb flags)
	public const ACCEPT_JSON = 16;                         # 1 0000 JSON text
	public const ACCEPT_DEFAULT = 23;                      # 1 0111 default: string, array or object
	public const ACCEPT_OBJECT = 17;                       # 1 0001 object
	public const ACCEPT_ARRAY = 18;                        # 1 0010 array
	public const ACCEPT_STRING = 20;                       # 1 0100 string
	public const ACCEPT_ARRAY_OF_OBJECTS = 24;             # 1 1000 array with only objects (incl. none)
	public const ACCEPT_ARRAY_SINGLE_OBJECT = 25;          # 1 1001 array with one single object, return that item
	public const ACCEPT_ARRAY_SINGLE_OBJECT_NULLABLE = 26; # 1 1010 array with one single object, return that item, or empty array, return null
	public const ACCEPT_SUCCESS_STRING = 28;               # 1 1100 string "success"
	public const ACCEPT_SUCCESS_OBJECT = 29;               # 1 1101 object with single "success" property and value true

	private const SHAPES = [
		self::ACCEPT_ARRAY_OF_OBJECTS => 'isArrayOfObjects',
		self::ACCEPT_ARRAY_SINGLE_OBJECT_NULLABLE => 'isSingleObjectOrEmptyArray',
		self::ACCEPT_ARRAY_SINGLE_OBJECT => 'isSingleObjectArray',
		self::ACCEPT_SUCCESS_OBJECT => 'isSuccessObject',
		self::ACCEPT_SUCCESS_STRING => 'isSuccessString',
	];

	private const UNWRAP = [
		self::ACCEPT_ARRAY_SINGLE_OBJECT_NULLABLE => true,
		self::ACCEPT_ARRAY_SINGLE_OBJECT => true,
	];

	/**
	 * @return mixed
	 *
	 * @throws InvalidResponseException
	 */
	public static function decode(bool|string $jsonText, int $flags = self::ACCEPT_DEFAULT) {
		if (!is_string($jsonText)) {
			throw new InvalidResponseException('Expected an HTTP response body from Seafile.');
		}

		$accept = $flags & self::ACCEPT_MASK;
		if ($accept === 0) {
			return $jsonText;
		}

		try {
			$result = json_decode($jsonText, false, 512, JSON_THROW_ON_ERROR);
		} /* @noinspection PhpMultipleClassDeclarationsInspection */ catch (\JsonException $e) {
			throw JsonDecodeException::create(sprintf('json decode error of %s', JsonDecodeException::shorten($jsonText)), $jsonText, $e);
		}

		if ($accept === self::ACCEPT_JSON) {
			return $result;
		}

		$shape = self::SHAPES[$accept] ?? null;
		if ($shape !== null) {
			if (self::$shape($result)) {
				return isset(self::UNWRAP[$accept]) ? ($result[0] ?? null) : $result;
			}

			throw JsonDecodeException::create(sprintf('json decode accept %5d error [%s] of %s', decbin($accept), \gettype($result), JsonDecodeException::shorten($jsonText)), $jsonText);
		}

		if (!self::isTypeAccepted($result, $accept)) {
			throw JsonDecodeException::create(sprintf('json decode type %s not accepted; of %s', \gettype($result), JsonDecodeException::shorten($jsonText)), $jsonText);
		}

		return $result;
	}

	private static function isTypeAccepted(mixed $result, int $accept): bool {
		if (is_string($result)) {
			return self::ACCEPT_STRING === ($accept & self::ACCEPT_STRING);
		}
		if (is_array($result)) {
			return self::ACCEPT_ARRAY === ($accept & self::ACCEPT_ARRAY);
		}
		if (is_object($result)) {
			return self::ACCEPT_OBJECT === ($accept & self::ACCEPT_OBJECT);
		}

		return false;
	}

	private static function isArrayOfObjects(mixed $result): bool {
		return is_array($result) && $result === array_filter($result, 'is_object');
	}

	private static function isSingleObjectOrEmptyArray(mixed $result): bool {
		return is_array($result) && (\count($result) === 0 || self::isSingleObjectArray($result));
	}

	private static function isSingleObjectArray(mixed $result): bool {
		return is_array($result) && is_object($result[0] ?? null) && \count($result) === 1;
	}

	private static function isSuccessObject(mixed $result): bool {
		return is_object($result) && (array) $result === ['success' => true];
	}

	private static function isSuccessString(mixed $result): bool {
		return $result === SeafileApi::STRING_SUCCESS;
	}
}
