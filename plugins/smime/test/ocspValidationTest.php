<?php

require_once 'test/smimeTest.php';
require_once 'php/class.certificate.php';

use WAYF\DerEncoder;
use WAYF\X509;

class TestableOcspCertificate extends Certificate {
	public function validateResponse(array $response, array $certId, Certificate $issuer): array {
		return $this->validateOcspResponse($response, $certId, $issuer);
	}
}

/**
 * @internal
 *
 * @covers \Certificate
 */
class OcspValidationTest extends SMIMETest {
	private $configFile;
	private $issuerKey;
	private $issuerCertificate;
	private $issuerPem;
	private $responderKey;
	private $responderData;
	private $responderWithoutEkuKey;
	private $responderWithoutEkuData;

	protected function setUp(): void {
		$this->configFile = tempnam(sys_get_temp_dir(), 'smime_openssl_');
		if ($this->configFile === false || file_put_contents($this->configFile, $this->opensslConfig()) === false) {
			$this->fail('Unable to create the OpenSSL test configuration');
		}

		[$this->issuerKey, $this->issuerCertificate, $this->issuerPem] = $this->createCertificate('Test CA', 'v3_ca');
		[$this->responderKey, , $responderPem] = $this->createCertificate(
			'Authorized OCSP responder',
			'v3_ocsp',
			$this->issuerCertificate,
			$this->issuerKey
		);
		[$this->responderWithoutEkuKey, , $responderWithoutEkuPem] = $this->createCertificate(
			'Unauthorized OCSP responder',
			'v3_noeku',
			$this->issuerCertificate,
			$this->issuerKey
		);

		$x509 = new X509();
		$this->responderData = $x509->certificate($this->pemToDer($responderPem));
		$this->responderWithoutEkuData = $x509->certificate($this->pemToDer($responderWithoutEkuPem));
	}

	protected function tearDown(): void {
		if (is_string($this->configFile) &&
			(is_file($this->configFile) || is_link($this->configFile)) &&
			!unlink($this->configFile)) {
			$this->fail("Unable to remove OCSP test configuration: {$this->configFile}");
		}
	}

	public function testIssuerSignedResponseIsAccepted() {
		$x509 = new X509();
		$issuerData = $x509->certificate($this->pemToDer($this->issuerPem), true);
		$response = $this->signedResponse($this->issuerKey, $issuerData);

		$this->assertSame('good', $this->validator()->validateResponse(
			$response,
			$this->certId(),
			new Certificate($this->issuerPem)
		)['certStatus']);
	}

	public function testAuthorizedDelegatedResponderIsAccepted() {
		$response = $this->signedResponse($this->responderKey, $this->responderData, [$this->responderData]);

		$this->assertSame('good', $this->validator()->validateResponse(
			$response,
			$this->certId(),
			new Certificate($this->issuerPem)
		)['certStatus']);
	}

	public function testRsaPssSignedResponseIsAccepted() {
		$x509 = new X509();
		$issuerData = $x509->certificate($this->pemToDer($this->issuerPem), true);
		$response = $this->signedResponse($this->issuerKey, $issuerData, [], null, true);

		$this->assertSame('good', $this->validator()->validateResponse(
			$response,
			$this->certId(),
			new Certificate($this->issuerPem)
		)['certStatus']);
	}

	public function testBadRsaPssSignatureIsRejected() {
		$issuerData = (new X509())->certificate($this->pemToDer($this->issuerPem), true);
		$response = $this->signedResponse($this->issuerKey, $issuerData, [], null, true);
		$response['responseBytes']['BasicOCSPResponse']['signature'][1] = chr(
			ord($response['responseBytes']['BasicOCSPResponse']['signature'][1]) ^ 0x01
		);

		$this->assertOcspFailure($response, OCSP_RESPONSE_SIGNATURE_INVALID);
	}

	public function testIssuerWithCriticalNameConstraintsIsAccepted() {
		$x509 = new X509();
		$issuerDer = $this->pemToDer($this->issuerPem);

		try {
			$x509->certificate($issuerDer);
			$this->fail('Strict standalone parsing must reject unsupported critical extensions');
		}
		catch (UnexpectedValueException $e) {
			$this->assertStringContainsString('nameConstraints', $e->getMessage());
		}

		$issuerData = $x509->certificate($issuerDer, true);
		$response = $this->signedResponse($this->issuerKey, $issuerData);
		$this->assertSame('good', $this->validator()->validateResponse(
			$response,
			$this->certId(),
			new Certificate($this->issuerPem)
		)['certStatus']);
	}

	public function testUnknownCriticalIssuerExtensionIsRejected() {
		[, , $issuerPem] = $this->createCertificate('Unknown Critical CA', 'v3_unknown_ca');

		try {
			(new X509())->certificate($this->pemToDer($issuerPem), true);
			$this->fail('An arbitrary unknown critical issuer extension was accepted');
		}
		catch (UnexpectedValueException $e) {
			$this->assertStringContainsString('1.2.3.4', $e->getMessage());
		}
	}

	public function testBadResponseSignatureIsRejected() {
		$response = $this->signedResponse($this->issuerKey, (new X509())->certificate($this->pemToDer($this->issuerPem), true));
		$response['responseBytes']['BasicOCSPResponse']['signature'][1] = chr(
			ord($response['responseBytes']['BasicOCSPResponse']['signature'][1]) ^ 0x01
		);

		$this->assertOcspFailure($response, OCSP_RESPONSE_SIGNATURE_INVALID);
	}

	public function testDelegatedResponderWithoutOcspSigningEkuIsRejected() {
		$response = $this->signedResponse(
			$this->responderWithoutEkuKey,
			$this->responderWithoutEkuData,
			[$this->responderWithoutEkuData]
		);

		$this->assertOcspFailure($response, OCSP_RESPONDER_UNAUTHORIZED);
	}

	public function testStaleResponseIsRejected() {
		$x509 = new X509();
		$issuerData = $x509->certificate($this->pemToDer($this->issuerPem), true);
		$response = $this->signedResponse($this->issuerKey, $issuerData, [], time() - 172800);

		$this->assertOcspFailure($response, OCSP_RESPONSE_TIME_INVALID);
	}

	private function validator(): TestableOcspCertificate {
		return new TestableOcspCertificate($this->issuerPem);
	}

	private function assertOcspFailure(array $response, int $expectedCode): void {
		try {
			$this->validator()->validateResponse($response, $this->certId(), new Certificate($this->issuerPem));
			$this->fail('The invalid OCSP response was accepted');
		}
		catch (OCSPException $e) {
			$this->assertSame($expectedCode, $e->getCode());
		}
	}

	private function signedResponse(
		$signingKey,
		array $signerData,
		array $embeddedCertificates = [],
		?int $thisUpdate = null,
		bool $rsaPss = false
	): array {
		$now = time();
		$thisUpdate ??= $now - 60;
		$tbsResponseData = 'signed OCSP response data';
		if ($rsaPss) {
			$signature = $this->signRsaPss($tbsResponseData, $signingKey, 'sha256', 32);
		}
		elseif (!openssl_sign($tbsResponseData, $signature, $signingKey, OPENSSL_ALGO_SHA256)) {
			$this->fail('Unable to sign the OCSP test response');
		}

		$singleResponse = [
			'certID' => [
				'hashAlgorithm' => 'sha1',
				'issuerNameHash' => str_repeat('n', 20),
				'issuerKeyHash' => str_repeat('k', 20),
				'serialNumber' => '1',
			],
			'certStatus' => 'good',
			'thisUpdate' => gmdate('YmdHis\Z', $thisUpdate),
			'nextupdate' => gmdate('YmdHis\Z', $now + 3600),
		];
		$basicResponse = [
			'tbsResponseData_der' => $tbsResponseData,
			'tbsResponseData' => [
				'responderID' => ['byName' => $signerData['tbsCertificate']['subject']],
				'producedAt' => gmdate('YmdHis\Z', $now),
				'responses' => [$singleResponse],
			],
			'signatureAlgorithm' => $rsaPss ? 'rsaPSS' : 'sha256WithRSAEncryption',
			'signature' => "\0" . $signature,
		];
		if ($rsaPss) {
			$basicResponse['signatureAlgorithmParameters'] = $this->rsaPssParameters();
		}
		if ($embeddedCertificates !== []) {
			$basicResponse['certs'] = $embeddedCertificates;
		}

		return [
			'responseStatus' => 'successful',
			'responseBytes' => [
				'responseType' => 'ocspBasic',
				'BasicOCSPResponse' => $basicResponse,
			],
		];
	}

	private function signRsaPss(string $data, $privateKey, string $algorithm, int $saltLength): string {
		$keyDetails = openssl_pkey_get_details($privateKey);
		if ($keyDetails === false || !isset($keyDetails['bits'])) {
			$this->fail('Unable to inspect the RSA test key');
		}
		$encodedLength = intdiv((int) $keyDetails['bits'] - 1 + 7, 8);
		$hashLength = strlen(hash($algorithm, '', true));
		$salt = random_bytes($saltLength);
		$encodedHash = hash($algorithm, str_repeat("\x00", 8) . hash($algorithm, $data, true) . $salt, true);
		$dataBlock = str_repeat("\x00", $encodedLength - $hashLength - $saltLength - 2) . "\x01" . $salt;
		$maskedDataBlock = $dataBlock ^ $this->mgf1($encodedHash, strlen($dataBlock), $algorithm);
		$unusedBits = (8 * $encodedLength) - ((int) $keyDetails['bits'] - 1);
		if ($unusedBits > 0) {
			$maskedDataBlock[0] = chr(ord($maskedDataBlock[0]) & (0xFF >> $unusedBits));
		}
		$encoded = $maskedDataBlock . $encodedHash . "\xBC";
		if (!@openssl_private_encrypt($encoded, $signature, $privateKey, OPENSSL_NO_PADDING)) {
			$this->fail('Unable to create the RSA-PSS test signature');
		}

		return $signature;
	}

	private function mgf1(string $seed, int $length, string $algorithm): string {
		$mask = '';
		for ($counter = 0; strlen($mask) < $length; ++$counter) {
			$mask .= hash($algorithm, $seed . pack('N', $counter), true);
		}

		return substr($mask, 0, $length);
	}

	private function rsaPssParameters(): string {
		$hash = DerEncoder::algorithmIdentifier('2.16.840.1.101.3.4.2.1', '');
		$mgf = DerEncoder::algorithmIdentifier('1.2.840.113549.1.1.8', $hash);

		return DerEncoder::sequence(
			DerEncoder::explicit(0, $hash) .
			DerEncoder::explicit(1, $mgf) .
			DerEncoder::explicit(2, DerEncoder::integer(32))
		);
	}

	private function certId(): array {
		return [
			'hash_alg_name' => 'sha1',
			'issuerNameHash' => str_repeat('n', 20),
			'issuerKeyHash' => str_repeat('k', 20),
			'serialNumber' => '1',
		];
	}

	private function createCertificate(string $commonName, string $extension, $issuer = null, $issuerKey = null): array {
		$key = openssl_pkey_new([
			'config' => $this->configFile,
			'private_key_bits' => 2048,
			'private_key_type' => OPENSSL_KEYTYPE_RSA,
		]);
		if (!$key instanceof OpenSSLAsymmetricKey) {
			throw new RuntimeException('Unable to create an OCSP test key');
		}
		$csr = openssl_csr_new(
			['commonName' => $commonName],
			$key,
			['config' => $this->configFile, 'digest_alg' => 'sha256']
		);
		if ($csr === false) {
			throw new RuntimeException('Unable to create an OCSP test certificate request');
		}
		$certificate = openssl_csr_sign(
			$csr,
			$issuer,
			$issuerKey ?? $key,
			2,
			['config' => $this->configFile, 'x509_extensions' => $extension, 'digest_alg' => 'sha256'],
			random_int(1, PHP_INT_MAX)
		);
		$pem = '';
		if ($certificate === false || !openssl_x509_export($certificate, $pem)) {
			throw new RuntimeException('Unable to create an OCSP test certificate');
		}

		return [$key, $certificate, $pem];
	}

	private function pemToDer(string $pem): string {
		$der = base64_decode((string) preg_replace('/-----[^-]+-----|\s/', '', $pem), true);
		if ($der === false) {
			$this->fail('Unable to decode an OCSP test certificate');
		}

		return $der;
	}

	private function opensslConfig(): string {
		return <<<'CONF'
[ req ]
distinguished_name = req_dn
prompt = no

[ req_dn ]
CN = test

[ v3_ca ]
subjectKeyIdentifier = hash
authorityKeyIdentifier = keyid:always
basicConstraints = critical,CA:true
keyUsage = critical,digitalSignature,keyCertSign,cRLSign
nameConstraints = critical,permitted;DNS:.example.test

[ v3_ocsp ]
subjectKeyIdentifier = hash
authorityKeyIdentifier = keyid:always
basicConstraints = critical,CA:false
keyUsage = critical,digitalSignature
extendedKeyUsage = critical,OCSPSigning

[ v3_unknown_ca ]
subjectKeyIdentifier = hash
authorityKeyIdentifier = keyid:always
basicConstraints = critical,CA:true
keyUsage = critical,digitalSignature,keyCertSign,cRLSign
1.2.3.4 = critical,DER:05:00

[ v3_noeku ]
subjectKeyIdentifier = hash
authorityKeyIdentifier = keyid:always
basicConstraints = critical,CA:false
keyUsage = critical,digitalSignature
CONF;
	}
}
