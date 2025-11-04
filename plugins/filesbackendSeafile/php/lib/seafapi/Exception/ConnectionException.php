<?php

declare(strict_types=1);

namespace Datamate\SeafileApi\Exception;

use Datamate\SeafileApi\Exception;

/**
 * Class ConnectionException.
 *
 * @internal
 */
final class ConnectionException extends Exception {
	/**
	 * HTTP status code of the response.
	 */
	private ?int $responseCode = null;

	/**
	 * HTTP raw response (if any).
	 */
	private ?string $responseBodyRaw = null;

	private const HTTP_STATUS = [
		200 => 'OK',
		201 => 'Created',
		202 => 'Accepted',
		301 => 'Moved Permanently',
		400 => 'Bad Request',
		401 => 'Unauthorized',
		403 => 'Forbidden',
		404 => 'Not Found',
		409 => 'Conflict',
		429 => 'Too Many Requests',
		440 => 'REPO_PASSWD_REQUIRED',
		441 => 'REPO_PASSWD_MAGIC_REQUIRED',
		500 => 'Internal Server Error',
		520 => 'OPERATION_FAILED',
	];

	/**
	 * @param int         $code       HTTP status code, e.g. curl_getinfo($curl)['http_code']
	 * @param bool|string $curlResult return value from curl_exec();
	 *
	 * @throws ConnectionException
	 */
	public static function throwCurlResult(int $code, bool|string $curlResult): never {
		$exception = new self(self::reasonPhrase($code), $code);
		$exception->responseCode = $code;
		$exception->responseBodyRaw = is_string($curlResult) ? $curlResult : null;

		throw $exception;
	}

	private static function reasonPhrase(int $code): string {
		return sprintf('%s %s', $code, self::HTTP_STATUS[$code] ?? "UNKNOWN_PHRASE");
	}

	public function __construct(string $message = "", int $code = 0, ?\Throwable $previous = null) {
		// trigger E_USER_NOTICE if code is not known
		$isHttpCode = $code >= 100 && $code < 600;
		$isKnownHttpCode = $isHttpCode && isset(self::HTTP_STATUS[$code]);
		$isKnownCode = $code === -1 || $isKnownHttpCode;
		$this->responseCode = $isHttpCode ? $code : null;
		$isKnownCode || trigger_error(sprintf("%s: Unknown code: %s (%s)", self::class, $code, gettype($code)), E_USER_NOTICE);

		parent::__construct($message, $code, $previous);
	}

	public function getStatusCode(): ?int {
		return $this->responseCode;
	}

	/**
	 * @throws ConnectionException
	 */
	public function assertStatusCode(int $code): void {
		if ($this->responseCode !== $code) {
			throw $this;
		}
	}

	/**
	 * The raw response body.
	 */
	public function getRawResponse(): ?string {
		return $this->responseBodyRaw;
	}

	/**
	 * Response body parsed as JSON Object.
	 *
	 * @return null|object - null either if the parsed response is NULL or if it can't be parsed as object
	 */
	public function tryParsedResponse(): ?object {
		/**
		 * @noinspection JsonEncodingApiUsageInspection
		 * @noinspection RedundantSuppression
		 */
		$result = json_decode((string) $this->responseBodyRaw, false);

		return is_object($result) ? $result : null;
	}

	public function getReasonPhrase(): ?string {
		$code = $this->responseCode;

		if (!is_int($code)) {
			return null;
		}

		return self::HTTP_STATUS[$code] ?? null;
	}

	/**
	 * A seafile JSON response may contain error information, try to get them.
	 *
	 * It is not fool-proof or overly complete but often more informative than just looking at JSON response dumps.
	 *
	 * @return null|array|string[] messages, null if n/a otherwise array of messages (which can not be empty)
	 */
	public function tryApiErrorMessages(): ?array {
		$response = $this->tryParsedResponse();
		if ($response === null) {
			return null;
		}

		$buffer = [];

		// {"error_msg": ... }
		if (isset($response->error_msg) && is_string($response->error_msg)) {
			$buffer[] = $response->error_msg;
		}

		// {"detail": "Invalid token header. No credentials provided."}
		if (isset($response->detail) && is_string($response->detail)) {
			$buffer[] = $response->detail;
		}

		// {"non_field_errors": [ "string...", ...]}
		if (isset($response->non_field_errors) && is_array($response->non_field_errors)) {
			foreach ($response->non_field_errors as $message) {
				if (is_string($message)) {
					$buffer[] = $message;
				}
			}
		}

		return empty($buffer) ? null : $buffer;
	}
}
