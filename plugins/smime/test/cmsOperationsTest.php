<?php

require_once 'test/smimeTest.php';
require_once 'php/class.cmsoperations.php';
require_once 'php/class.smimecapabilities.php';

/**
 * @internal
 *
 * @covers \CmsOperations
 */
class CmsOperationsTest extends SMIMETest {
	private $keys = [];
	private $certificates = [];
	private $temporaryFiles = [];
	private $inputFile;
	private $encryptedFile;
	private $firstOutputFile;
	private $secondOutputFile;

	protected function setUp() {
		[$this->keys[], $this->certificates[]] = $this->createCertificate('First OAEP recipient');
		[$this->keys[], $this->certificates[]] = $this->createCertificate('Second OAEP recipient');
		$this->inputFile = $this->temporaryFile('smime_oaep_input_');
		$this->encryptedFile = $this->temporaryFile('smime_oaep_encrypted_');
		$this->firstOutputFile = $this->temporaryFile('smime_oaep_first_');
		$this->secondOutputFile = $this->temporaryFile('smime_oaep_second_');
		file_put_contents($this->inputFile, 'OAEP regression payload');
	}

	protected function tearDown() {
		foreach ($this->temporaryFiles as $file) {
			@unlink($file);
		}
	}

	public function testOaepOptionsAreAppliedToEveryRecipient() {
		$cms = new CmsOperations();
		if (!$cms->hasCmsCli()) {
			$this->markTestSkipped('OpenSSL CMS CLI is unavailable');
		}

		$this->assertTrue($cms->encryptOaep(
			$this->inputFile,
			$this->encryptedFile,
			$this->certificates
		));
		$this->assertTrue($cms->decrypt(
			$this->encryptedFile,
			$this->firstOutputFile,
			$this->certificates[0],
			$this->keys[0]
		));
		$this->assertTrue($cms->decrypt(
			$this->encryptedFile,
			$this->secondOutputFile,
			$this->certificates[1],
			$this->keys[1]
		));
		$this->assertSame(file_get_contents($this->inputFile), file_get_contents($this->firstOutputFile));
		$this->assertSame(file_get_contents($this->inputFile), file_get_contents($this->secondOutputFile));
	}

	public function testStringCipherDetectionMatchesRuntimeSignature() {
		$expected = $this->runtimeAcceptsStringCipher();
		$cms = new CmsOperations();
		$property = new ReflectionProperty($cms, 'hasCmsStringCipher');
		$property->setAccessible(true);

		$this->assertSame($expected, $property->getValue($cms));
		SmimeCapabilities::reset();
		$this->assertSame($expected, SmimeCapabilities::getInstance()->hasCmsStringCipher);
	}

	private function createCertificate(string $commonName): array {
		$options = [
			'config' => OPENSSL_CONF_PATH,
			'digest_alg' => 'sha256',
			'private_key_bits' => 2048,
			'private_key_type' => OPENSSL_KEYTYPE_RSA,
		];
		$key = openssl_pkey_new($options);
		$csr = openssl_csr_new(['commonName' => $commonName], $key, $options);
		$certificate = openssl_csr_sign($csr, null, $key, 2, $options, random_int(1, PHP_INT_MAX));
		if ($key === false || $csr === false || $certificate === false ||
			!openssl_x509_export($certificate, $certificatePem)) {
			$this->fail('Unable to create an OAEP test certificate');
		}

		return [$key, $certificatePem];
	}

	private function temporaryFile(string $prefix): string {
		$file = tempnam(sys_get_temp_dir(), $prefix);
		if ($file === false) {
			$this->fail('Unable to create an OAEP test file');
		}
		$this->temporaryFiles[] = $file;

		return $file;
	}

	private function runtimeAcceptsStringCipher(): bool {
		$parameters = (new ReflectionFunction('openssl_cms_encrypt'))->getParameters();
		$type = isset($parameters[6]) ? $parameters[6]->getType() : null;
		if ($type instanceof ReflectionNamedType) {
			return $type->getName() === 'string';
		}
		if ($type instanceof ReflectionUnionType) {
			foreach ($type->getTypes() as $namedType) {
				if ($namedType->getName() === 'string') {
					return true;
				}
			}
		}

		return false;
	}
}
