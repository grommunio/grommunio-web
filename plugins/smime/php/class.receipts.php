<?php

/**
 * Signed receipts (ESS, RFC 2634 Section 2).
 *
 * Provides generation and verification of CMS signed receipts, which
 * confirm that a signed message was received and its signature verified.
 */
class SignedReceipts {
	// OIDs
	public const OID_RECEIPT_REQUEST     = '1.2.840.113549.1.9.16.2.1';
	public const OID_RECEIPT             = '1.2.840.113549.1.9.16.1.1';
	public const OID_CONTENT_IDENTIFIER  = '1.2.840.113549.1.9.16.2.7';
	public const OID_MSG_SIG_DIGEST      = '1.2.840.113549.1.9.16.2.5';

	/** @var CmsOperations */
	private CmsOperations $cms;

	public function __construct(CmsOperations $cms) {
		$this->cms = $cms;
	}

	/**
	 * Generate a signed receipt for a received message.
	 *
	 * Uses `openssl cms -sign_receipt` CLI when available.
	 *
	 * @param string $signedMessageFile path to the original signed message
	 * @param string $certFile          path to signer's certificate
	 * @param string $keyFile           path to signer's private key
	 * @param string $outputFile        path for the generated receipt
	 *
	 * @return bool true on success
	 */
	public function generateReceipt(
		string $signedMessageFile,
		string $certFile,
		string $keyFile,
		string $outputFile
	): bool {
		if (!$this->cms->hasCmsCli()) {
			error_log("[smime] Signed receipts require OpenSSL CLI");

			return false;
		}

		$opensslBin = $this->findOpenssl();
		$cmd = sprintf(
			'%s cms -sign_receipt -in %s -signer %s -inkey %s -out %s 2>&1',
			escapeshellarg($opensslBin),
			escapeshellarg($signedMessageFile),
			escapeshellarg($certFile),
			escapeshellarg($keyFile),
			escapeshellarg($outputFile)
		);

		$output = [];
		$exitCode = -1;
		@exec($cmd, $output, $exitCode);

		return $exitCode === 0;
	}

	/**
	 * Verify a signed receipt against the original message.
	 *
	 * @param string $receiptFile path to the receipt
	 * @param string $messageFile path to the original signed message
	 *
	 * @return bool true if receipt is valid
	 */
	public function verifyReceipt(string $receiptFile, string $messageFile): bool {
		if (!$this->cms->hasCmsCli()) {
			return false;
		}

		$opensslBin = $this->findOpenssl();
		$cmd = sprintf(
			'%s cms -verify_receipt %s -in %s 2>&1',
			escapeshellarg($opensslBin),
			escapeshellarg($receiptFile),
			escapeshellarg($messageFile)
		);

		$output = [];
		$exitCode = -1;
		@exec($cmd, $output, $exitCode);

		return $exitCode === 0;
	}

	/**
	 * Find OpenSSL binary.
	 */
	private function findOpenssl(): string {
		$paths = ['/usr/bin/openssl', '/usr/local/bin/openssl', '/opt/homebrew/bin/openssl'];
		foreach ($paths as $path) {
			if (is_executable($path)) {
				return $path;
			}
		}

		return 'openssl';
	}
}
