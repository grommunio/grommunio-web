<?php

declare(strict_types=1);

namespace Files\Backend\Seafile\Model;

/**
 * Encoder for Account Store V1 encoding.
 */
class AccountStoreV1Encoder {
	/**
	 * Resolve the secret key from configuration.
	 *
	 * Source priority:
	 * - constant FILES_ACCOUNTSTORE_V1_SECRET_KEY (hex-encoded)
	 * - env var FILES_ACCOUNTSTORE_V1_SECRET_KEY (hex-encoded)
	 *
	 * @return string binary key with length SODIUM_CRYPTO_SECRETBOX_KEYBYTES
	 */
	private static function getSecretKey(): string {
		$keyHex = null;
		if (\defined('FILES_ACCOUNTSTORE_V1_SECRET_KEY')) {
			$keyHex = (string) \constant('FILES_ACCOUNTSTORE_V1_SECRET_KEY');
		}
		elseif (is_string(getenv('FILES_ACCOUNTSTORE_V1_SECRET_KEY')) && getenv('FILES_ACCOUNTSTORE_V1_SECRET_KEY') !== false) {
			$keyHex = (string) getenv('FILES_ACCOUNTSTORE_V1_SECRET_KEY');
		}

		if (!is_string($keyHex) || $keyHex === '') {
			throw new \RuntimeException('FILES_ACCOUNTSTORE_V1_SECRET_KEY not configured. Define it as a hex-encoded key.');
		}

		if (!ctype_xdigit($keyHex) || (strlen($keyHex) % 2) !== 0) {
			throw new \UnexpectedValueException('FILES_ACCOUNTSTORE_V1_SECRET_KEY must be hex-encoded.');
		}

		$key = hex2bin($keyHex);
		if (!is_string($key) || strlen($key) !== SODIUM_CRYPTO_SECRETBOX_KEYBYTES) {
			throw new \UnexpectedValueException(sprintf(
				'FILES_ACCOUNTSTORE_V1_SECRET_KEY must decode to %d bytes; got %d.',
				SODIUM_CRYPTO_SECRETBOX_KEYBYTES,
				is_string($key) ? strlen($key) : -1
			));
		}

		return $key;
	}

	/**
	 * Encode an account setting value.
	 *
	 * {@see AccountStore::encryptBackendConfigProperty()}
	 *
	 * @return string encoded
	 */
	public static function encode(string $value): string {
		$nonce = random_bytes(SODIUM_CRYPTO_SECRETBOX_NONCEBYTES);
		$encrypted = sodium_crypto_secretbox($value, $nonce, self::getSecretKey());

		return bin2hex($nonce) . bin2hex($encrypted);
	}

	/**
	 * Decode an encoded account setting value.
	 *
	 * {@see AccountStore::decryptBackendConfigProperty()}
	 *
	 * @return string decoded
	 */
	public static function decode(string $valueInHex): string {
		$value = hex2bin($valueInHex);
		if (!is_string($value)) {
			throw new \UnexpectedValueException(sprintf('Not an envelope of an encrypted value. Raw binary length of envelope is %d.', strlen($valueInHex)));
		}
		$nonce = substr($value, 0, SODIUM_CRYPTO_SECRETBOX_NONCEBYTES);
		if (!is_string($nonce) || strlen($nonce) !== SODIUM_CRYPTO_SECRETBOX_NONCEBYTES) {
			throw new \UnexpectedValueException(sprintf('Not an encrypted value. Raw binary length is %d which is below %d.', strlen($value), SODIUM_CRYPTO_SECRETBOX_NONCEBYTES));
		}
		$encrypted = substr($value, SODIUM_CRYPTO_SECRETBOX_NONCEBYTES, strlen($value));
		if (!is_string($encrypted)) {
			throw new \UnexpectedValueException(sprintf('Not an encrypted value. Raw binary length is %d.', strlen($value)));
		}
		$result = sodium_crypto_secretbox_open($encrypted, $nonce, self::getSecretKey());
		// Decryption failed, password might have changed
		if ($result === false) {
			throw new \UnexpectedValueException("invalid password");
		}

		return $result;
	}
}
