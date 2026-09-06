<?php

require_once 'test/smimeTest.php';
require_once 'php/util.php';
require_once 'php/class.certificate.php';
require_once 'php/class.crl.php';

use WAYF\DerEncoder;
use WAYF\X509;

/**
 * @internal
 *
 * @covers \CrlManager
 * @covers \WAYF\CrlParser
 */
class CrlValidationTest extends SMIMETest {
	private $configFile;
	private $issuerKey;
	private $issuerPem;

	protected function setUp() {
		$this->configFile = tempnam(sys_get_temp_dir(), 'smime_crl_openssl_');
		if ($this->configFile === false || file_put_contents($this->configFile, $this->opensslConfig()) === false) {
			$this->fail('Unable to create the OpenSSL test configuration');
		}

		$this->issuerKey = openssl_pkey_new([
			'config' => $this->configFile,
			'private_key_bits' => 2048,
			'private_key_type' => OPENSSL_KEYTYPE_RSA,
		]);
		$csr = openssl_csr_new(
			['commonName' => 'CRL test CA'],
			$this->issuerKey,
			['config' => $this->configFile, 'digest_alg' => 'sha256']
		);
		$certificate = openssl_csr_sign(
			$csr,
			null,
			$this->issuerKey,
			2,
			['config' => $this->configFile, 'x509_extensions' => 'v3_ca', 'digest_alg' => 'sha256'],
			random_int(1, PHP_INT_MAX)
		);
		if ($certificate === false || !openssl_x509_export($certificate, $this->issuerPem)) {
			$this->fail('Unable to create the CRL test certificate');
		}
	}

	protected function tearDown() {
		if (is_string($this->configFile)) {
			@unlink($this->configFile);
		}
	}

	public function testAuthenticatedCurrentCrlIsUsed() {
		$crl = $this->signedCrl([1]);
		$manager = new CrlManager();
		$issuer = new Certificate($this->issuerPem);

		$this->assertTrue($manager->checkCrlForSerial($crl, '1', $issuer));
		$this->assertFalse($manager->checkCrlForSerial($crl, '2', $issuer));
	}

	public function testCrlWithBadSignatureIsRejected() {
		$crl = $this->signedCrl([1]);
		$crl[strlen($crl) - 1] = chr(ord($crl[strlen($crl) - 1]) ^ 0x01);

		$this->assertNull((new CrlManager())->checkCrlForSerial(
			$crl,
			'1',
			new Certificate($this->issuerPem)
		));
	}

	public function testStaleCrlIsRejected() {
		$crl = $this->signedCrl([1], time() - 3600, time() - 600);

		$this->assertNull((new CrlManager())->checkCrlForSerial(
			$crl,
			'1',
			new Certificate($this->issuerPem)
		));
	}

	public function testCurrentCrlWithoutNextUpdateIsAccepted() {
		$crl = $this->signedCrl([1], time() - 60, null, false);

		$this->assertTrue($this->managerWithMaxAge(3600)->checkCrlForSerial(
			$crl,
			'1',
			new Certificate($this->issuerPem)
		));
	}

	public function testOldCrlWithoutNextUpdateIsRejected() {
		$crl = $this->signedCrl([1], time() - 7200, null, false);

		$this->assertNull($this->managerWithMaxAge(3600)->checkCrlForSerial(
			$crl,
			'1',
			new Certificate($this->issuerPem)
		));
	}

	private function managerWithMaxAge(int $maxAge): CrlManager {
		$manager = new CrlManager();
		$property = new ReflectionProperty($manager, 'maxAge');
		$property->setAccessible(true);
		$property->setValue($manager, $maxAge);

		return $manager;
	}

	private function signedCrl(
		array $revokedSerials,
		?int $thisUpdate = null,
		?int $nextUpdate = null,
		bool $includeNextUpdate = true
	): string {
		$now = time();
		$thisUpdate ??= $now - 60;
		$nextUpdate ??= $now + 3600;
		$x509 = new X509();
		$issuerData = $x509->certificate($this->pemToDer($this->issuerPem));
		$algorithm = DerEncoder::algorithmIdentifier('1.2.840.113549.1.1.11', '');
		$revoked = '';
		foreach ($revokedSerials as $serial) {
			$revoked .= DerEncoder::sequence(
				DerEncoder::integer($serial) .
				DerEncoder::generalizedTime(gmdate('YmdHis\Z', $thisUpdate))
			);
		}
		$tbsCertList = DerEncoder::sequence(
			DerEncoder::integer(1) .
			$algorithm .
			$issuerData['tbsCertificate']['subject_der'] .
			DerEncoder::generalizedTime(gmdate('YmdHis\Z', $thisUpdate)) .
			($includeNextUpdate ? DerEncoder::generalizedTime(gmdate('YmdHis\Z', $nextUpdate)) : '') .
			($revoked === '' ? '' : DerEncoder::sequence($revoked))
		);
		if (!openssl_sign($tbsCertList, $signature, $this->issuerKey, OPENSSL_ALGO_SHA256)) {
			$this->fail('Unable to sign the CRL test fixture');
		}

		return DerEncoder::sequence(
			$tbsCertList .
			$algorithm .
			DerEncoder::bitString($signature)
		);
	}

	private function pemToDer(string $pem): string {
		$der = base64_decode((string) preg_replace('/-----[^-]+-----|\s/', '', $pem), true);
		if ($der === false) {
			$this->fail('Unable to decode the CRL test certificate');
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
CONF;
	}
}
