<?php

/*
 * SPDX-FileCopyrightText: Copyright 2020 - 2026 grommunio GmbH
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

namespace OCSAPI;

require_once __DIR__ . "/class.ocsshare.php";
require_once __DIR__ . "/Exception/class.FileNotFoundException.php";
require_once __DIR__ . "/Exception/class.InvalidArgumentException.php";
require_once __DIR__ . "/Exception/class.PermissionDeniedException.php";
require_once __DIR__ . "/Exception/class.InvalidResponseException.php";
require_once __DIR__ . "/Exception/class.InvalidRequestException.php";

use OCSAPI\Exception\FileNotFoundException;
use OCSAPI\Exception\InvalidArgumentException;
use OCSAPI\Exception\InvalidRequestException;
use OCSAPI\Exception\InvalidResponseException;
use OCSAPI\Exception\PermissionDeniedException;

/**
 * Parses OCS sharing API responses.
 */
class ocsresponseparser {
	/**
	 * Parse the response of a create or modify request.
	 *
	 * @param string $response
	 *
	 * @return false|ocsshare
	 *
	 * @throws FileNotFoundException
	 * @throws InvalidArgumentException
	 * @throws InvalidRequestException
	 * @throws InvalidResponseException
	 * @throws PermissionDeniedException
	 */
	public static function parseModificationResponse($response) {
		if (!$response) {
			throw new InvalidResponseException($response);
		}
		$xmldata = self::parseXMLResponse($response);
		if (!isset($xmldata->meta) || !self::parseResponseMeta($xmldata->meta)) {
			return false;
		}
		if (isset($xmldata->data)) {
			return new ocsshare($xmldata->data);
		}

		return false;
	}

	/**
	 * Parse a share listing response.
	 *
	 * @param string $response
	 * @param string $baseurl  used to generate the share URLs
	 *
	 * @return ocsshare[] indexed by share ID
	 *
	 * @throws FileNotFoundException
	 * @throws InvalidArgumentException
	 * @throws InvalidRequestException
	 * @throws InvalidResponseException
	 * @throws PermissionDeniedException
	 */
	public static function parseListingResponse($response, $baseurl) {
		if (!$response) {
			throw new InvalidResponseException($response);
		}

		$xmldata = self::parseXMLResponse($response);
		if (!isset($xmldata->meta) || !self::parseResponseMeta($xmldata->meta) || !isset($xmldata->data)) {
			return [];
		}

		$shares = [];
		foreach ($xmldata->data->element as $element) {
			$parsedShare = new ocsshare($element);
			$parsedShare->generateShareURL($baseurl);

			$shares[$parsedShare->getId()] = $parsedShare;
		}

		return $shares;
	}

	/**
	 * Parse a sharee search response.
	 *
	 * @param bool|string $response
	 *
	 * @return array|false [[label, shareWith, shareType], ...], or false for an invalid response
	 *
	 * @throws FileNotFoundException
	 * @throws InvalidArgumentException
	 * @throws InvalidRequestException
	 * @throws InvalidResponseException
	 * @throws PermissionDeniedException
	 */
	public static function parseRecipientResponse($response) {
		$xmldata = self::parseXMLResponse($response);
		if (!isset($xmldata->meta) || !self::parseResponseMeta($xmldata->meta) || !isset($xmldata->data)) {
			return false;
		}

		$data = $xmldata->data;
		$result = [];
		foreach ([$data->exact->users, $data->users, $data->exact->groups, $data->groups] as $list) {
			foreach ($list->element as $recipient) {
				$result[] = [
					$recipient->label->__toString(),
					$recipient->value->shareWith->__toString(),
					$recipient->value->shareType->__toString(),
				];
			}
		}

		return $result;
	}

	/**
	 * Convert an OCS response body into XML.
	 *
	 * @param bool|string $response response body returned by cURL
	 *
	 * @return \SimpleXMLElement parsed response
	 *
	 * @throws InvalidResponseException
	 */
	private static function parseXMLResponse($response) {
		if (!is_string($response)) {
			throw new InvalidResponseException('Invalid response body');
		}

		try {
			return new \SimpleXMLElement($response);
		}
		catch (\Exception) {
			throw new InvalidResponseException($response);
		}
	}

	/**
	 * Parse the response meta block and its error codes.
	 *
	 * @param mixed $response
	 *
	 * @return bool
	 *
	 * @throws FileNotFoundException
	 * @throws InvalidArgumentException
	 * @throws InvalidRequestException
	 * @throws InvalidResponseException
	 * @throws PermissionDeniedException
	 */
	private static function parseResponseMeta($response) {
		if ($response) {
			$statuscode = intval($response->statuscode);
			$message = $response->message;

			// check status code - it must be 100, otherwise it failed
			if ($statuscode == 100) {
				return true;
			}

			match ($statuscode) {
				400 => throw new InvalidArgumentException($message),
				403 => throw new PermissionDeniedException($message),
				404 => throw new FileNotFoundException($message),
				999 => throw new InvalidRequestException($message),
				default => throw new InvalidResponseException($message),
			};
		}
		else {
			throw new InvalidResponseException("Response contains no meta block.");
		}
	}
}
