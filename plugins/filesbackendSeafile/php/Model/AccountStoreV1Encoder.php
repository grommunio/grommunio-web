<?php

declare(strict_types=1);

namespace Files\Backend\Seafile\Model;

/**
 * Encoder for Account Store V1 encoding.
 */
class AccountStoreV1Encoder {
	/**
	 * Encode an account setting value.
	 *
	 * {@see AccountStore::encryptBackendConfigProperty()}
	 *
	 * @return string encoded
	 */
	public static function encode(string $value): string {
		$nonce = random_bytes(SODIUM_CRYPTO_SECRETBOX_NONCEBYTES);
		$encrypted = sodium_crypto_secretbox($value, $nonce, hex2bin(FILES_ACCOUNTSTORE_V1_SECRET_KEY));

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
		$result = sodium_crypto_secretbox_open($encrypted, $nonce, hex2bin(FILES_ACCOUNTSTORE_V1_SECRET_KEY));
		// Decryption failed, password might have changed
		if ($result === false) {
			throw new \UnexpectedValueException("invalid password");
		}

		return $result;
	}
}
