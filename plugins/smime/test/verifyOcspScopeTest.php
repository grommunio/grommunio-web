<?php

require_once 'test/smimeTest.php';

class FakeOcspScopeCertificate {
	public static $verifyCalls = [];
	public static $failedNames = [];

	private $name;
	private $issuerName;
	private $issuer;

	public function __construct($certificate) {
		$names = [
			'leaf' => ['/CN=Leaf', '/CN=Intermediate'],
			'intermediate' => ['/CN=Intermediate', '/CN=Root'],
			'root' => ['/CN=Root', '/CN=Root'],
		];
		[$this->name, $this->issuerName] = $names[$certificate];
	}

	public function getName() {
		return $this->name;
	}

	public function getIssuerName() {
		return $this->issuerName;
	}

	public function setIssuer($issuer) {
		$this->issuer = $issuer;
	}

	public function issuer() {
		return $this->issuer;
	}

	public function verify() {
		self::$verifyCalls[$this->name] = (self::$verifyCalls[$this->name] ?? 0) + 1;
		if (in_array($this->name, self::$failedNames, true)) {
			throw new OCSPException('OCSP unavailable', OCSP_NO_ISSUER);
		}

		return true;
	}
}

class FakeOcspScopeException extends Exception {
	public function getCertStatus() {
		return null;
	}
}

class FakeOcspScopeCrlManager {
	public static $checks = [];
	public static $results = [];

	public function isRevoked($certificate) {
		$name = $certificate->getName();
		self::$checks[] = $name;

		return self::$results[$name] ?? null;
	}
}

/**
 * @internal
 *
 * @coversNothing
 */
class VerifyOcspScopeTest extends SMIMETest {
	/**
	 * @runInSeparateProcess
	 *
	 * @preserveGlobalState disabled
	 */
	public function testEveryNonRootCertificateStatusIsChecked() {
		if (class_exists('Certificate', false) || function_exists('verifyOCSP')) {
			$this->markTestSkipped('This regression test requires PHPUnit process isolation');
		}

		class_alias(FakeOcspScopeCertificate::class, 'Certificate');
		define('PLUGIN_SMIME_ENABLE_OCSP', true);
		define('SMIME_STATUS_SUCCESS', 1);
		define('SMIME_STATUS_FAIL', 0);
		define('SMIME_SUCCESS', 'success');
		define('SMIME_REVOKED', 'revoked');
		define('SMIME_OCSP_FAILED', 'ocsp failed');
		define('SMIME_OCSP_DISABLED', 'ocsp disabled');
		require_once 'php/util.php';

		$message = [];
		$this->assertTrue(verifyOCSP('leaf', ['root', 'intermediate'], $message));
		$this->assertSame([
			'/CN=Leaf' => 1,
			'/CN=Intermediate' => 1,
		], FakeOcspScopeCertificate::$verifyCalls);
	}

	/**
	 * @runInSeparateProcess
	 *
	 * @preserveGlobalState disabled
	 */
	public function testCrlFallbackChecksEachCertificateWhoseOcspStatusIsUnavailable() {
		if (class_exists('Certificate', false) || class_exists('CrlManager', false) || function_exists('verifyOCSP')) {
			$this->markTestSkipped('This regression test requires PHPUnit process isolation');
		}

		class_alias(FakeOcspScopeCertificate::class, 'Certificate');
		class_alias(FakeOcspScopeException::class, 'OCSPException');
		class_alias(FakeOcspScopeCrlManager::class, 'CrlManager');
		define('PLUGIN_SMIME_ENABLE_OCSP', true);
		define('PLUGIN_SMIME_ENABLE_CRL', true);
		define('OCSP_CERT_STATUS', 1);
		define('OCSP_CERT_STATUS_REVOKED', 1);
		define('OCSP_NO_ISSUER', 2);
		define('SMIME_STATUS_SUCCESS', 1);
		define('SMIME_STATUS_FAIL', 0);
		define('SMIME_SUCCESS', 'success');
		define('SMIME_REVOKED', 'revoked');
		define('SMIME_OCSP_FAILED', 'ocsp failed');
		define('SMIME_OCSP_DISABLED', 'ocsp disabled');
		define('SMIME_CRL_REVOKED', 'crl revoked');
		define('SMIME_CRL_UNAVAILABLE', 'crl unavailable');
		require_once 'php/util.php';

		FakeOcspScopeCertificate::$failedNames = ['/CN=Leaf', '/CN=Intermediate'];
		ini_set('error_log', '/dev/null');
		FakeOcspScopeCrlManager::$results = [
			'/CN=Leaf' => false,
			'/CN=Intermediate' => false,
		];
		$message = [];
		$this->assertTrue(verifyRevocation('leaf', ['root', 'intermediate'], $message));
		$this->assertSame(['/CN=Leaf', '/CN=Intermediate'], FakeOcspScopeCrlManager::$checks);
		$this->assertSame(SMIME_SUCCESS, $message['info']);
	}

	/**
	 * @runInSeparateProcess
	 *
	 * @preserveGlobalState disabled
	 */
	public function testCrlChecksEveryNonRootCertificateWhenOcspIsDisabled() {
		if (class_exists('Certificate', false) || class_exists('CrlManager', false) || function_exists('verifyOCSP')) {
			$this->markTestSkipped('This regression test requires PHPUnit process isolation');
		}

		class_alias(FakeOcspScopeCertificate::class, 'Certificate');
		class_alias(FakeOcspScopeCrlManager::class, 'CrlManager');
		define('PLUGIN_SMIME_ENABLE_OCSP', false);
		define('PLUGIN_SMIME_ENABLE_CRL', true);
		define('SMIME_STATUS_SUCCESS', 1);
		define('SMIME_STATUS_FAIL', 0);
		define('SMIME_SUCCESS', 'success');
		define('SMIME_REVOKED', 'revoked');
		define('SMIME_OCSP_FAILED', 'ocsp failed');
		define('SMIME_OCSP_DISABLED', 'ocsp disabled');
		define('SMIME_CRL_REVOKED', 'crl revoked');
		define('SMIME_CRL_UNAVAILABLE', 'crl unavailable');
		require_once 'php/util.php';

		FakeOcspScopeCrlManager::$results = [
			'/CN=Leaf' => false,
			'/CN=Intermediate' => false,
		];
		$message = [];
		$this->assertTrue(verifyRevocation('leaf', ['root', 'intermediate'], $message));
		$this->assertSame(['/CN=Leaf', '/CN=Intermediate'], FakeOcspScopeCrlManager::$checks);
		$this->assertSame(SMIME_SUCCESS, $message['info']);
	}
}
