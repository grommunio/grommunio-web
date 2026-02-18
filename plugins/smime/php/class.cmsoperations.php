<?php

/**
 * CMS abstraction layer — wraps openssl_cms_*, openssl_pkcs7_*, and
 * OpenSSL CLI to provide a unified interface for S/MIME operations.
 *
 * Strategy per PHP/OpenSSL version:
 *   PHP 8.5+ with OpenSSL 3.0+: native openssl_cms_* with string cipher
 *   PHP 8.0-8.4 with OpenSSL 3.0+: native for CBC; CLI fallback for GCM
 *   PHP 8.0-8.4 with OpenSSL 1.x: openssl_pkcs7_* only (CBC)
 *
 * The caller never needs to know which backend is in use.
 */
class CmsOperations {
	/** @var bool native openssl_cms_* functions available (PHP 8.0+) */
	private bool $hasCmsApi;

	/** @var bool openssl_cms_encrypt() accepts string cipher (PHP 8.5+) */
	private bool $hasCmsStringCipher;

	/** @var bool openssl cms CLI binary is usable */
	private bool $hasCmsCli;

	/** @var string path to OpenSSL CLI binary */
	private string $opensslBin;

	/** @var string OpenSSL library version string */
	private string $opensslVersion;

	/** @var int OpenSSL library version number */
	private int $opensslVersionNumber;

	// CMS flag mapping — mirrors PKCS7 flags where CMS equivalents exist
	public const CMS_DETACHED    = 0x0040;
	public const CMS_NOINTERN    = 0x0010;
	public const CMS_NOVERIFY    = 0x0020;
	public const CMS_NOATTR      = 0x0100;
	public const CMS_BINARY      = 0x0080;
	public const CMS_TEXT        = 0x0001;
	public const CMS_NOSMIMECAP  = 0x0200;

	// Cipher mapping: string name → PKCS7 integer constant (fallback)
	private const CIPHER_MAP = [
		'aes-128-cbc' => OPENSSL_CIPHER_AES_128_CBC,
		'aes-256-cbc' => OPENSSL_CIPHER_AES_256_CBC,
		// GCM ciphers have no PKCS7 constant — require CLI or CMS API
		'aes-128-gcm' => null,
		'aes-256-gcm' => null,
	];

	// Digest algorithm mapping
	private const DIGEST_MAP = [
		'sha1'   => OPENSSL_ALGO_SHA1,
		'sha256' => OPENSSL_ALGO_SHA256,
		'sha384' => OPENSSL_ALGO_SHA384,
		'sha512' => OPENSSL_ALGO_SHA512,
	];

	public function __construct() {
		$this->hasCmsApi = function_exists('openssl_cms_encrypt');
		$this->hasCmsStringCipher = $this->hasCmsApi && $this->detectStringCipherSupport();
		$this->opensslVersion = OPENSSL_VERSION_TEXT;
		$this->opensslVersionNumber = OPENSSL_VERSION_NUMBER;
		$this->detectCli();
	}

	// ----------------------------------------------------------------
	// Capability queries
	// ----------------------------------------------------------------

	/**
	 * Whether AES-GCM (AuthEnvelopedData) encryption is available.
	 */
	public function supportsAesGcm(): bool {
		return $this->hasCmsStringCipher || $this->hasCmsCli;
	}

	/**
	 * Whether EdDSA key types are available.
	 */
	public function supportsEddsa(): bool {
		return defined('OPENSSL_KEYTYPE_ED25519') || PHP_VERSION_ID >= 80400;
	}

	/**
	 * Whether ECDSA/ECDH key types are available.
	 */
	public function supportsEc(): bool {
		return defined('OPENSSL_KEYTYPE_EC');
	}

	/**
	 * Whether the CMS API is available.
	 */
	public function hasCmsApi(): bool {
		return $this->hasCmsApi;
	}

	/**
	 * Whether CLI fallback is available.
	 */
	public function hasCmsCli(): bool {
		return $this->hasCmsCli;
	}

	/**
	 * Return list of available encryption ciphers.
	 *
	 * @return array cipher names
	 */
	public function getAvailableCiphers(): array {
		$ciphers = ['aes-256-cbc', 'aes-128-cbc'];
		if ($this->supportsAesGcm()) {
			array_unshift($ciphers, 'aes-256-gcm', 'aes-128-gcm');
		}

		return $ciphers;
	}

	/**
	 * Return list of available digest algorithms.
	 *
	 * @return array digest names
	 */
	public function getAvailableDigests(): array {
		return ['sha256', 'sha384', 'sha512'];
	}

	// ----------------------------------------------------------------
	// Core CMS operations
	// ----------------------------------------------------------------

	/**
	 * Sign a message.
	 *
	 * @param string      $infile         path to input file
	 * @param string      $outfile        path to output file
	 * @param mixed       $certificate    signing certificate (PEM string or OpenSSL resource)
	 * @param mixed       $privateKey     private key (PEM string, resource, or [key, passphrase])
	 * @param array       $headers        additional MIME headers
	 * @param int         $flags          CMS/PKCS7 flags
	 * @param null|string $extraCertsFile path to file with intermediate certificates
	 * @param string      $digest         digest algorithm name
	 *
	 * @return bool true on success
	 */
	public function sign(
		string $infile,
		string $outfile,
		$certificate,
		$privateKey,
		array $headers = [],
		int $flags = PKCS7_DETACHED,
		?string $extraCertsFile = null,
		string $digest = 'sha256'
	): bool {
		// openssl_cms_sign() and openssl_pkcs7_sign() do not accept a
		// digest parameter — they always use SHA-256.  When a different
		// digest is requested, use the CLI which supports -md.
		if ($digest !== 'sha256' && $this->hasCmsCli) {
			return $this->signCli($infile, $outfile, $certificate, $privateKey, $flags, $extraCertsFile, $digest);
		}

		$cmsFlags = $this->mapFlags($flags);

		// Try native CMS API first
		if ($this->hasCmsApi) {
			$encoding = OPENSSL_ENCODING_SMIME;

			if ($extraCertsFile !== null) {
				$result = @openssl_cms_sign(
					$infile, $outfile, $certificate, $privateKey,
					$headers, $cmsFlags, $encoding, $extraCertsFile
				);
			}
			else {
				$result = @openssl_cms_sign(
					$infile, $outfile, $certificate, $privateKey,
					$headers, $cmsFlags, $encoding
				);
			}
			if ($result !== false) {
				return true;
			}
			// Fall through to PKCS7 if CMS fails
		}

		// Fallback to PKCS7
		$pkcs7Flags = $flags;
		if ($extraCertsFile !== null) {
			return openssl_pkcs7_sign($infile, $outfile, $certificate, $privateKey, $headers, $pkcs7Flags, $extraCertsFile);
		}

		return openssl_pkcs7_sign($infile, $outfile, $certificate, $privateKey, $headers, $pkcs7Flags);
	}

	/**
	 * Sign a message using CLI with a specific digest algorithm.
	 *
	 * @param string      $infile          input file
	 * @param string      $outfile         output file
	 * @param mixed       $certificate     signer certificate (PEM or resource)
	 * @param mixed       $privateKey      private key (PEM, resource, or [key, passphrase])
	 * @param int         $flags           PKCS7 flags
	 * @param null|string $extraCertsFile  extra certificates file
	 * @param string      $digest          digest algorithm (sha256, sha384, sha512)
	 *
	 * @return bool true on success
	 */
	private function signCli(
		string $infile,
		string $outfile,
		$certificate,
		$privateKey,
		int $flags = PKCS7_DETACHED,
		?string $extraCertsFile = null,
		string $digest = 'sha256'
	): bool {
		$tmpCert = tempnam(sys_get_temp_dir(), 'smime_sign_cert_');
		$tmpKey = tempnam(sys_get_temp_dir(), 'smime_sign_key_');

		$this->exportCertAndKey($certificate, $privateKey, $tmpCert, $tmpKey, $passArg);

		$extraArg = '';
		if ($extraCertsFile !== null) {
			$extraArg = sprintf(' -certfile %s', escapeshellarg($extraCertsFile));
		}

		$nodetach = '';
		if (!($flags & PKCS7_DETACHED)) {
			$nodetach = ' -nodetach';
		}

		$cmd = sprintf(
			'%s cms -sign -in %s -out %s -signer %s -inkey %s -md %s -outform SMIME%s%s%s 2>&1',
			escapeshellarg($this->opensslBin),
			escapeshellarg($infile),
			escapeshellarg($outfile),
			escapeshellarg($tmpCert),
			escapeshellarg($tmpKey),
			escapeshellarg($digest),
			$passArg,
			$extraArg,
			$nodetach
		);

		$result = $this->execCli($cmd);
		@unlink($tmpCert);
		@unlink($tmpKey);

		return $result;
	}

	/**
	 * Verify a signed message.
	 *
	 * @param string      $infile      path to signed message
	 * @param int         $flags       CMS/PKCS7 flags
	 * @param null|string $outCertFile path to write signer certificates
	 * @param array       $caInfo      list of CA bundle paths
	 * @param null|string $signerCert  path to expected signer certificate
	 * @param null|string $contentFile path to write verified content
	 * @param null|string $p7bFile     path to write PKCS#7 structure
	 *
	 * @return bool|int true on success, false/int on error
	 */
	public function verify(
		string $infile,
		int $flags = 0,
		?string $outCertFile = null,
		array $caInfo = [],
		?string $signerCert = null,
		?string $contentFile = null,
		?string $p7bFile = null
	) {
		$cmsFlags = $this->mapFlags($flags);

		// Try native CMS API
		if ($this->hasCmsApi) {
			$encoding = OPENSSL_ENCODING_SMIME;
			$result = @openssl_cms_verify(
				$infile, $cmsFlags, $outCertFile, $caInfo,
				$signerCert, $contentFile, $p7bFile, $encoding
			);
			if ($result !== -1) {
				return $result;
			}
			// CMS verify returned -1 (parse error) — try PKCS7
		}

		// PKCS7 fallback
		$pkcs7Flags = $flags;

		if ($p7bFile !== null) {
			return openssl_pkcs7_verify($infile, $pkcs7Flags, $outCertFile, $caInfo, $signerCert, $contentFile, $p7bFile);
		}
		if ($contentFile !== null) {
			return openssl_pkcs7_verify($infile, $pkcs7Flags, $outCertFile, $caInfo, $signerCert, $contentFile);
		}
		if ($signerCert !== null) {
			return openssl_pkcs7_verify($infile, $pkcs7Flags, $outCertFile, $caInfo, $signerCert);
		}

		return openssl_pkcs7_verify($infile, $pkcs7Flags, $outCertFile, $caInfo);
	}

	/**
	 * Encrypt a message.
	 *
	 * @param string      $infile  path to input file
	 * @param string      $outfile path to output file
	 * @param array       $certs   recipient certificates (PEM strings or resources)
	 * @param array       $headers additional MIME headers
	 * @param int         $flags   CMS/PKCS7 flags
	 * @param string|int  $cipher  cipher name (string) or OPENSSL_CIPHER_* constant
	 *
	 * @return bool true on success
	 */
	public function encrypt(
		string $infile,
		string $outfile,
		array $certs,
		array $headers = [],
		int $flags = 0,
		$cipher = 'aes-256-cbc'
	): bool {
		$cipherName = $this->normalizeCipher($cipher);
		$isGcm = str_contains($cipherName, 'gcm');

		// GCM requires special handling
		if ($isGcm) {
			// PHP 8.5+ with string cipher support
			if ($this->hasCmsStringCipher) {
				return $this->encryptCmsNative($infile, $outfile, $certs, $headers, $flags, $cipherName);
			}
			// CLI fallback for GCM
			if ($this->hasCmsCli) {
				return $this->encryptCli($infile, $outfile, $certs, $cipherName);
			}
			// No GCM support — log and fall back to CBC
			error_log("[smime] AES-GCM not available, falling back to AES-256-CBC");
			$cipherName = 'aes-256-cbc';
		}

		// CBC encryption — native API
		$pkcs7Const = self::CIPHER_MAP[$cipherName] ?? OPENSSL_CIPHER_AES_256_CBC;

		if ($this->hasCmsApi) {
			$encoding = OPENSSL_ENCODING_SMIME;
			$cmsFlags = $this->mapFlags($flags);
			$result = @openssl_cms_encrypt(
				$infile, $outfile, $certs, $headers,
				$cmsFlags, $encoding, $pkcs7Const
			);
			if ($result !== false) {
				return true;
			}
		}

		// PKCS7 fallback
		return openssl_pkcs7_encrypt($infile, $outfile, $certs, $headers, $flags, $pkcs7Const);
	}

	/**
	 * Decrypt a message.
	 *
	 * @param string $infile      path to encrypted message
	 * @param string $outfile     path to output file
	 * @param mixed  $certificate recipient certificate
	 * @param mixed  $privateKey  private key (or [key, passphrase])
	 *
	 * @return bool true on success
	 */
	public function decrypt(
		string $infile,
		string $outfile,
		$certificate,
		$privateKey
	): bool {
		// Try CMS API first — it handles both EnvelopedData and AuthEnvelopedData
		if ($this->hasCmsApi) {
			$encoding = OPENSSL_ENCODING_SMIME;
			$result = @openssl_cms_decrypt($infile, $outfile, $certificate, $privateKey, $encoding);
			if ($result !== false) {
				return true;
			}
			// If CMS fails, try CLI for AuthEnvelopedData
			if ($this->hasCmsCli) {
				$cliResult = $this->decryptCli($infile, $outfile, $certificate, $privateKey);
				if ($cliResult) {
					return true;
				}
			}
		}

		// PKCS7 fallback
		return openssl_pkcs7_decrypt($infile, $outfile, $certificate, $privateKey);
	}

	/**
	 * Read certificates from a PKCS#7/CMS structure.
	 *
	 * @param string $p7b    PKCS#7/CMS data (PEM)
	 * @param array  $certs  output array of certificates
	 *
	 * @return bool true on success
	 */
	public function read(string $p7b, ?array &$certs): bool {
		if ($this->hasCmsApi && function_exists('openssl_cms_read')) {
			$result = @openssl_cms_read($p7b, $certs);
			if ($result !== false) {
				return true;
			}
		}

		return openssl_pkcs7_read($p7b, $certs);
	}

	/**
	 * Compress data using CMS CompressedData (RFC 3274).
	 * Requires OpenSSL CLI.
	 *
	 * @param string $infile  input file path
	 * @param string $outfile output file path
	 *
	 * @return bool true on success
	 */
	public function compress(string $infile, string $outfile): bool {
		if (!$this->hasCmsCli) {
			return false;
		}
		$cmd = sprintf(
			'%s cms -compress -in %s -out %s -outform SMIME',
			escapeshellarg($this->opensslBin),
			escapeshellarg($infile),
			escapeshellarg($outfile)
		);

		return $this->execCli($cmd);
	}

	/**
	 * Decompress CMS CompressedData.
	 *
	 * @param string $infile  input file path
	 * @param string $outfile output file path
	 *
	 * @return bool true on success
	 */
	public function decompress(string $infile, string $outfile): bool {
		if (!$this->hasCmsCli) {
			return false;
		}
		$cmd = sprintf(
			'%s cms -uncompress -in %s -out %s',
			escapeshellarg($this->opensslBin),
			escapeshellarg($infile),
			escapeshellarg($outfile)
		);

		return $this->execCli($cmd);
	}

	// ----------------------------------------------------------------
	// Cipher / flag helpers
	// ----------------------------------------------------------------

	/**
	 * Normalize a cipher specification to a canonical string name.
	 *
	 * @param string|int $cipher string name or OPENSSL_CIPHER_* constant
	 *
	 * @return string canonical cipher name
	 */
	public function normalizeCipher($cipher): string {
		if (is_string($cipher)) {
			return strtolower($cipher);
		}

		// Map integer constants to string names
		foreach (self::CIPHER_MAP as $name => $const) {
			if ($const === $cipher) {
				return $name;
			}
		}

		return 'aes-256-cbc';
	}

	/**
	 * Check whether a given cipher is a GCM (AEAD) cipher.
	 *
	 * @param string $cipher cipher name
	 *
	 * @return bool
	 */
	public function isGcmCipher(string $cipher): bool {
		return str_contains(strtolower($cipher), 'gcm');
	}

	/**
	 * Map PKCS7_* flags to their OPENSSL_CMS_* equivalents.
	 *
	 * @param int $flags PKCS7 flags
	 *
	 * @return int CMS flags
	 */
	public function mapFlags(int $flags): int {
		if (!$this->hasCmsApi) {
			return $flags;
		}

		$map = [
			PKCS7_DETACHED  => defined('OPENSSL_CMS_DETACHED')  ? OPENSSL_CMS_DETACHED  : 0x0040,
			PKCS7_NOINTERN  => defined('OPENSSL_CMS_NOINTERN')  ? OPENSSL_CMS_NOINTERN  : 0x0010,
			PKCS7_NOVERIFY  => defined('OPENSSL_CMS_NOVERIFY')  ? OPENSSL_CMS_NOVERIFY  : 0x0020,
			PKCS7_NOATTR    => defined('OPENSSL_CMS_NOATTR')    ? OPENSSL_CMS_NOATTR    : 0x0100,
			PKCS7_BINARY    => defined('OPENSSL_CMS_BINARY')    ? OPENSSL_CMS_BINARY    : 0x0080,
			PKCS7_TEXT      => defined('OPENSSL_CMS_TEXT')       ? OPENSSL_CMS_TEXT       : 0x0001,
		];

		// PKCS7_NOSMIMECAP is not available in all PHP builds
		$noSmimeCap = defined('PKCS7_NOSMIMECAP') ? PKCS7_NOSMIMECAP : 0x0200;
		$map[$noSmimeCap] = defined('OPENSSL_CMS_NOSMIMECAP') ? OPENSSL_CMS_NOSMIMECAP : 0x0200;

		$cmsFlags = 0;
		foreach ($map as $pkcs7Flag => $cmsFlag) {
			if ($flags & $pkcs7Flag) {
				$cmsFlags |= $cmsFlag;
			}
		}

		return $cmsFlags;
	}

	// ----------------------------------------------------------------
	// Private helpers
	// ----------------------------------------------------------------

	/**
	 * Detect whether openssl_cms_encrypt() accepts a string cipher argument.
	 * Available from PHP 8.5+.
	 */
	private function detectStringCipherSupport(): bool {
		if (!$this->hasCmsApi) {
			return false;
		}

		try {
			$ref = new ReflectionFunction('openssl_cms_encrypt');
			$params = $ref->getParameters();
			// The cipher parameter is the 7th parameter (index 6)
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
			// Ignore
		}

		return false;
	}

	/**
	 * Detect and validate OpenSSL CLI binary.
	 */
	private function detectCli(): void {
		$this->hasCmsCli = false;
		$this->opensslBin = '/usr/bin/openssl';

		// Check common paths
		$paths = ['/usr/bin/openssl', '/usr/local/bin/openssl', '/opt/homebrew/bin/openssl'];
		foreach ($paths as $path) {
			if (is_executable($path)) {
				$this->opensslBin = $path;
				$this->hasCmsCli = true;

				return;
			}
		}

		// Try PATH
		$which = @shell_exec('which openssl 2>/dev/null');
		if ($which !== null) {
			$which = trim($which);
			if (!empty($which) && is_executable($which)) {
				$this->opensslBin = $which;
				$this->hasCmsCli = true;
			}
		}
	}

	/**
	 * Encrypt using native CMS API with string cipher.
	 */
	private function encryptCmsNative(
		string $infile,
		string $outfile,
		array $certs,
		array $headers,
		int $flags,
		string $cipher
	): bool {
		$encoding = OPENSSL_ENCODING_SMIME;
		$cmsFlags = $this->mapFlags($flags);

		// PHP 8.5+ accepts cipher as string
		return @openssl_cms_encrypt(
			$infile, $outfile, $certs, $headers,
			$cmsFlags, $encoding, $cipher
		);
	}

	/**
	 * Encrypt using OpenSSL CLI (for GCM support on older PHP).
	 */
	private function encryptCli(
		string $infile,
		string $outfile,
		array $certs,
		string $cipher
	): bool {
		$tmpCerts = [];
		$recipArgs = '';

		foreach ($certs as $cert) {
			$tmpFile = tempnam(sys_get_temp_dir(), 'smime_cert_');
			if (is_resource($cert) || (is_object($cert) && $cert instanceof OpenSSLCertificate)) {
				openssl_x509_export($cert, $pem);
				file_put_contents($tmpFile, $pem);
			}
			else {
				file_put_contents($tmpFile, $cert);
			}
			$tmpCerts[] = $tmpFile;
			$recipArgs .= ' -recip ' . escapeshellarg($tmpFile);
		}

		$cmd = sprintf(
			'%s cms -encrypt -%s -in %s -out %s -outform SMIME %s 2>&1',
			escapeshellarg($this->opensslBin),
			escapeshellarg($cipher),
			escapeshellarg($infile),
			escapeshellarg($outfile),
			$recipArgs
		);

		$result = $this->execCli($cmd);

		foreach ($tmpCerts as $tmp) {
			@unlink($tmp);
		}

		return $result;
	}

	/**
	 * Decrypt using OpenSSL CLI (for AuthEnvelopedData).
	 */
	private function decryptCli(
		string $infile,
		string $outfile,
		$certificate,
		$privateKey
	): bool {
		$tmpCert = tempnam(sys_get_temp_dir(), 'smime_dcert_');
		$tmpKey = tempnam(sys_get_temp_dir(), 'smime_dkey_');

		// Export cert
		if (is_resource($certificate) || (is_object($certificate) && $certificate instanceof OpenSSLCertificate)) {
			openssl_x509_export($certificate, $certPem);
			file_put_contents($tmpCert, $certPem);
		}
		else {
			file_put_contents($tmpCert, $certificate);
		}

		// Export key
		$passphrase = '';
		if (is_array($privateKey)) {
			$key = $privateKey[0];
			$passphrase = $privateKey[1] ?? '';
		}
		else {
			$key = $privateKey;
		}

		if (is_resource($key) || (is_object($key) && $key instanceof OpenSSLAsymmetricKey)) {
			openssl_pkey_export($key, $keyPem, $passphrase);
			file_put_contents($tmpKey, $keyPem);
		}
		else {
			file_put_contents($tmpKey, $key);
		}

		$passArg = '';
		if (!empty($passphrase)) {
			$passArg = sprintf(' -passin pass:%s', escapeshellarg($passphrase));
		}

		$cmd = sprintf(
			'%s cms -decrypt -in %s -out %s -recip %s -inkey %s%s 2>&1',
			escapeshellarg($this->opensslBin),
			escapeshellarg($infile),
			escapeshellarg($outfile),
			escapeshellarg($tmpCert),
			escapeshellarg($tmpKey),
			$passArg
		);

		$result = $this->execCli($cmd);

		@unlink($tmpCert);
		@unlink($tmpKey);

		return $result;
	}

	/**
	 * Sign a message using RSASSA-PSS padding (RFC 4056).
	 * Requires OpenSSL CLI with CMS support.
	 *
	 * @param string      $infile         input file
	 * @param string      $outfile        output file
	 * @param mixed       $certificate    signing certificate
	 * @param mixed       $privateKey     private key (or [key, passphrase])
	 * @param int         $flags          CMS/PKCS7 flags
	 * @param null|string $extraCertsFile intermediate certificates
	 * @param string      $digest         digest algorithm
	 *
	 * @return bool true on success
	 */
	public function signPss(
		string $infile,
		string $outfile,
		$certificate,
		$privateKey,
		int $flags = PKCS7_DETACHED,
		?string $extraCertsFile = null,
		string $digest = 'sha256'
	): bool {
		if (!$this->hasCmsCli) {
			error_log("[smime] RSASSA-PSS requires OpenSSL CLI");

			return false;
		}

		$tmpCert = tempnam(sys_get_temp_dir(), 'smime_pss_cert_');
		$tmpKey = tempnam(sys_get_temp_dir(), 'smime_pss_key_');

		$this->exportCertAndKey($certificate, $privateKey, $tmpCert, $tmpKey, $passArg);

		$extraArg = '';
		if ($extraCertsFile !== null) {
			$extraArg = sprintf(' -certfile %s', escapeshellarg($extraCertsFile));
		}

		$cmd = sprintf(
			'%s cms -sign -in %s -out %s -signer %s -inkey %s -keyopt rsa_padding_mode:pss -md %s -outform SMIME%s%s 2>&1',
			escapeshellarg($this->opensslBin),
			escapeshellarg($infile),
			escapeshellarg($outfile),
			escapeshellarg($tmpCert),
			escapeshellarg($tmpKey),
			escapeshellarg($digest),
			$passArg,
			$extraArg
		);

		$result = $this->execCli($cmd);
		@unlink($tmpCert);
		@unlink($tmpKey);

		return $result;
	}

	/**
	 * Encrypt a message using RSAES-OAEP key transport (RFC 3560).
	 * Requires OpenSSL CLI.
	 *
	 * @param string $infile  input file
	 * @param string $outfile output file
	 * @param array  $certs   recipient certificates
	 * @param string $cipher  cipher name
	 *
	 * @return bool true on success
	 */
	public function encryptOaep(
		string $infile,
		string $outfile,
		array $certs,
		string $cipher = 'aes-256-cbc'
	): bool {
		if (!$this->hasCmsCli) {
			error_log("[smime] RSAES-OAEP requires OpenSSL CLI");

			return false;
		}

		$tmpCerts = [];
		$recipArgs = '';

		foreach ($certs as $cert) {
			$tmpFile = tempnam(sys_get_temp_dir(), 'smime_oaep_cert_');
			if (is_resource($cert) || (is_object($cert) && $cert instanceof OpenSSLCertificate)) {
				openssl_x509_export($cert, $pem);
				file_put_contents($tmpFile, $pem);
			}
			else {
				file_put_contents($tmpFile, $cert);
			}
			$tmpCerts[] = $tmpFile;
			$recipArgs .= ' -recip ' . escapeshellarg($tmpFile);
		}

		$cmd = sprintf(
			'%s cms -encrypt -%s -keyopt rsa_padding_mode:oaep -in %s -out %s -outform SMIME %s 2>&1',
			escapeshellarg($this->opensslBin),
			escapeshellarg($cipher),
			escapeshellarg($infile),
			escapeshellarg($outfile),
			$recipArgs
		);

		$result = $this->execCli($cmd);

		foreach ($tmpCerts as $tmp) {
			@unlink($tmp);
		}

		return $result;
	}

	/**
	 * Generate a certs-only message (application/pkcs7-mime; smime-type=certs-only).
	 * Used for certificate exchange per RFC 8551.
	 *
	 * @param array  $certPems list of PEM certificates
	 * @param string $outfile  output file path
	 *
	 * @return bool true on success
	 */
	public function generateCertsOnly(array $certPems, string $outfile): bool {
		if (!$this->hasCmsCli) {
			return false;
		}

		$tmpCerts = [];
		$certArgs = '';
		foreach ($certPems as $i => $pem) {
			$tmpFile = tempnam(sys_get_temp_dir(), 'smime_co_');
			file_put_contents($tmpFile, $pem);
			$tmpCerts[] = $tmpFile;
			if ($i === 0) {
				$certArgs .= ' -certfile ' . escapeshellarg($tmpFile);
			}
			else {
				$certArgs .= ' -certfile ' . escapeshellarg($tmpFile);
			}
		}

		if (empty($tmpCerts)) {
			return false;
		}

		// Use the first cert as the primary
		$cmd = sprintf(
			'%s crl2pkcs7 -nocrl %s -out %s -outform PEM 2>&1',
			escapeshellarg($this->opensslBin),
			$certArgs,
			escapeshellarg($outfile)
		);

		$result = $this->execCli($cmd);

		foreach ($tmpCerts as $tmp) {
			@unlink($tmp);
		}

		return $result;
	}

	/**
	 * Get the path to the OpenSSL binary.
	 *
	 * @return string OpenSSL binary path
	 */
	public function getOpensslBin(): string {
		return $this->opensslBin;
	}

	/**
	 * Execute an OpenSSL CLI command.
	 *
	 * @param string $cmd full command string
	 *
	 * @return bool true if exit code is 0
	 */
	private function execCli(string $cmd): bool {
		$output = [];
		$exitCode = -1;
		@exec($cmd, $output, $exitCode);

		if ($exitCode !== 0) {
			$outputStr = implode("\n", $output);
			error_log("[smime] OpenSSL CLI error (exit {$exitCode}): {$outputStr}");

			return false;
		}

		return true;
	}

	/**
	 * Export certificate and key to temporary files for CLI operations.
	 *
	 * @param mixed  $certificate signer certificate
	 * @param mixed  $privateKey  private key (or [key, passphrase])
	 * @param string $tmpCert     output cert file path
	 * @param string $tmpKey      output key file path
	 * @param string $passArg     output CLI passphrase argument
	 */
	private function exportCertAndKey($certificate, $privateKey, string $tmpCert, string $tmpKey, ?string &$passArg): void {
		$passArg = '';

		if (is_resource($certificate) || (is_object($certificate) && $certificate instanceof OpenSSLCertificate)) {
			openssl_x509_export($certificate, $certPem);
			file_put_contents($tmpCert, $certPem);
		}
		else {
			file_put_contents($tmpCert, $certificate);
		}

		$passphrase = '';
		if (is_array($privateKey)) {
			$key = $privateKey[0];
			$passphrase = $privateKey[1] ?? '';
		}
		else {
			$key = $privateKey;
		}

		if (is_resource($key) || (is_object($key) && $key instanceof OpenSSLAsymmetricKey)) {
			openssl_pkey_export($key, $keyPem, $passphrase);
			file_put_contents($tmpKey, $keyPem);
		}
		else {
			file_put_contents($tmpKey, $key);
		}

		if (!empty($passphrase)) {
			$passArg = sprintf(' -passin pass:%s', escapeshellarg($passphrase));
		}
	}
}
