<?php

/**
 * Runtime capability detection for S/MIME operations (singleton).
 *
 * Probes the PHP + OpenSSL environment once and caches the results.
 * Used by CmsOperations and the plugin to select appropriate algorithms.
 */
class SmimeCapabilities {
	private static ?SmimeCapabilities $instance = null;

	/** @var bool openssl_cms_* available */
	public bool $hasCmsApi;

	/** @var bool openssl_cms_encrypt() accepts string cipher (PHP 8.5+) */
	public bool $hasCmsStringCipher;

	/** @var bool OpenSSL CLI usable */
	public bool $hasCmsCli;

	/** @var bool ECDSA/ECDH key types supported */
	public bool $supportsEcdsa;

	/** @var bool EdDSA key types supported (PHP 8.4+) */
	public bool $supportsEddsa;

	/** @var bool AES-GCM encryption available via any backend */
	public bool $supportsAesGcm;

	/** @var string PHP version */
	public string $phpVersion;

	/** @var string OpenSSL version text */
	public string $opensslVersion;

	/** @var int OpenSSL version number */
	public int $opensslVersionNumber;

	/** @var bool OpenSSL >= 3.0 */
	public bool $opensslV3;

	// Well-known algorithm OIDs
	public const OID_AES_256_GCM  = '2.16.840.1.101.3.4.1.46';
	public const OID_AES_128_GCM  = '2.16.840.1.101.3.4.1.6';
	public const OID_AES_256_CBC  = '2.16.840.1.101.3.4.1.42';
	public const OID_AES_128_CBC  = '2.16.840.1.101.3.4.1.2';
	public const OID_3DES_CBC     = '1.2.840.113549.3.7';

	public const OID_SHA256       = '2.16.840.1.101.3.4.2.1';
	public const OID_SHA384       = '2.16.840.1.101.3.4.2.2';
	public const OID_SHA512       = '2.16.840.1.101.3.4.2.3';
	public const OID_SHA1         = '1.3.14.3.2.26';

	public const OID_RSA_ENC      = '1.2.840.113549.1.1.1';
	public const OID_RSA_SHA256   = '1.2.840.113549.1.1.11';
	public const OID_RSA_SHA384   = '1.2.840.113549.1.1.12';
	public const OID_RSA_SHA512   = '1.2.840.113549.1.1.13';
	public const OID_RSA_PSS      = '1.2.840.113549.1.1.10';
	public const OID_RSA_OAEP     = '1.2.840.113549.1.1.7';

	public const OID_ECDSA_SHA256 = '1.2.840.10045.4.3.2';
	public const OID_ECDSA_SHA384 = '1.2.840.10045.4.3.3';
	public const OID_ECDSA_SHA512 = '1.2.840.10045.4.3.4';

	public const OID_EC_PUBLIC_KEY = '1.2.840.10045.2.1';
	public const OID_ECDH_STD_SHA256 = '1.3.132.1.11.1';
	public const OID_ECDH_STD_SHA384 = '1.3.132.1.11.2';

	// Named curves
	public const OID_SECP256R1    = '1.2.840.10045.3.1.7';
	public const OID_SECP384R1    = '1.3.132.0.34';

	private function __construct() {
		$this->phpVersion = PHP_VERSION;
		$this->opensslVersion = OPENSSL_VERSION_TEXT;
		$this->opensslVersionNumber = OPENSSL_VERSION_NUMBER;
		$this->opensslV3 = OPENSSL_VERSION_NUMBER >= 0x30000000;

		$this->hasCmsApi = function_exists('openssl_cms_encrypt');
		$this->hasCmsStringCipher = $this->hasCmsApi && $this->detectStringCipherParam();
		$this->hasCmsCli = $this->detectCli();
		$this->supportsEcdsa = defined('OPENSSL_KEYTYPE_EC');
		$this->supportsEddsa = PHP_VERSION_ID >= 80400 && $this->detectEddsaSupport();
		$this->supportsAesGcm = $this->hasCmsStringCipher || $this->hasCmsCli;
	}

	/**
	 * Get the singleton instance.
	 */
	public static function getInstance(): self {
		if (self::$instance === null) {
			self::$instance = new self();
		}

		return self::$instance;
	}

	/**
	 * Reset singleton (for testing).
	 */
	public static function reset(): void {
		self::$instance = null;
	}

	/**
	 * Return supported signature algorithms in preference order.
	 *
	 * @return array of ['name' => string, 'oid' => string]
	 */
	public function getSupportedSignatureAlgorithms(): array {
		$algs = [
			['name' => 'sha256WithRSAEncryption', 'oid' => self::OID_RSA_SHA256],
			['name' => 'sha384WithRSAEncryption', 'oid' => self::OID_RSA_SHA384],
			['name' => 'sha512WithRSAEncryption', 'oid' => self::OID_RSA_SHA512],
		];

		if ($this->supportsEcdsa) {
			$algs[] = ['name' => 'ecdsa-with-SHA256', 'oid' => self::OID_ECDSA_SHA256];
			$algs[] = ['name' => 'ecdsa-with-SHA384', 'oid' => self::OID_ECDSA_SHA384];
			$algs[] = ['name' => 'ecdsa-with-SHA512', 'oid' => self::OID_ECDSA_SHA512];
		}

		if ($this->opensslV3) {
			$algs[] = ['name' => 'rsassa-pss', 'oid' => self::OID_RSA_PSS];
		}

		return $algs;
	}

	/**
	 * Return supported encryption algorithms in preference order.
	 *
	 * @return array of ['name' => string, 'oid' => string]
	 */
	public function getSupportedEncryptionAlgorithms(): array {
		$algs = [];

		if ($this->supportsAesGcm) {
			$algs[] = ['name' => 'aes-256-gcm', 'oid' => self::OID_AES_256_GCM];
			$algs[] = ['name' => 'aes-128-gcm', 'oid' => self::OID_AES_128_GCM];
		}

		$algs[] = ['name' => 'aes-256-cbc', 'oid' => self::OID_AES_256_CBC];
		$algs[] = ['name' => 'aes-128-cbc', 'oid' => self::OID_AES_128_CBC];

		return $algs;
	}

	/**
	 * Return supported digest algorithms in preference order.
	 *
	 * @return array of ['name' => string, 'oid' => string]
	 */
	public function getSupportedDigestAlgorithms(): array {
		return [
			['name' => 'sha256', 'oid' => self::OID_SHA256],
			['name' => 'sha384', 'oid' => self::OID_SHA384],
			['name' => 'sha512', 'oid' => self::OID_SHA512],
		];
	}

	/**
	 * Get a summary of the runtime environment.
	 *
	 * @return array environment summary
	 */
	public function getEnvironmentInfo(): array {
		return [
			'php_version' => $this->phpVersion,
			'openssl_version' => $this->opensslVersion,
			'openssl_v3' => $this->opensslV3,
			'cms_api' => $this->hasCmsApi,
			'cms_string_cipher' => $this->hasCmsStringCipher,
			'cms_cli' => $this->hasCmsCli,
			'ecdsa' => $this->supportsEcdsa,
			'eddsa' => $this->supportsEddsa,
			'aes_gcm' => $this->supportsAesGcm,
		];
	}

	/**
	 * Detect whether openssl_cms_encrypt accepts a string cipher parameter.
	 */
	private function detectStringCipherParam(): bool {
		try {
			$ref = new ReflectionFunction('openssl_cms_encrypt');
			$params = $ref->getParameters();
			foreach ($params as $param) {
				if ($param->getName() === 'cipher') {
					$type = $param->getType();
					if ($type instanceof ReflectionUnionType) {
						return true;
					}
					if ($type instanceof ReflectionNamedType && $type->getName() === 'string') {
						return true;
					}
				}
			}
		}
		catch (ReflectionException $e) {
			// ignore
		}

		return false;
	}

	/**
	 * Detect OpenSSL CLI availability.
	 */
	private function detectCli(): bool {
		$paths = ['/usr/bin/openssl', '/usr/local/bin/openssl', '/opt/homebrew/bin/openssl'];
		foreach ($paths as $path) {
			if (is_executable($path)) {
				return true;
			}
		}

		$which = @shell_exec('which openssl 2>/dev/null');
		if ($which !== null) {
			$which = trim($which);
			if (!empty($which) && is_executable($which)) {
				return true;
			}
		}

		return false;
	}

	/**
	 * Detect EdDSA support at runtime.
	 */
	private function detectEddsaSupport(): bool {
		if (defined('OPENSSL_KEYTYPE_ED25519')) {
			return true;
		}

		// Try generating an Ed25519 key as a probe
		$key = @openssl_pkey_new(['private_key_type' => 6 /* ED25519 */]);

		return $key !== false;
	}
}
