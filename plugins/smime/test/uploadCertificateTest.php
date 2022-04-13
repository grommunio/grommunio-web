<?php
require_once('test/smimeTest.php');

// Disable OCSP for tests
define('PLUGIN_SMIME_ENABLE_OCSP', false);
define('SMIME_STATUS_SUCCESS', 1);
define('SMIME_OCSP_DISABLED', 1);

require_once('php/util.php');

class UploadCertificateTest extends SMIMETest
{
	const DAY_EPOCH = 86400;
	const PASSPHRASE = 'test';
	const EMAIL_ADDRESS = 'john@kopano.com';
	
	// Cache private key generation
	private $privkey = '';

	private function generatePKCS12($emailAddress = self::EMAIL_ADDRESS, $passphrase = self::PASSPHRASE)
	{
		$validFrom = time();
		$validTo = time() + self::DAY_EPOCH * 365;
		$daysvalid =  ($validTo - $validFrom) / self::DAY_EPOCH;
		$dn = [
			"countryName" => "NL",
			"stateOrProvinceName" => "Zuid Holland",
			"localityName" => "Delft",
			"organizationName" => "Kopano",
			"organizationalUnitName" => "Dev",
			"commonName" => "John",
			"emailAddress" => $emailAddress
		];
		$config = ['config' => OPENSSL_CONF_PATH];
		if (empty($this->privkey)) {
			$this->privkey = openssl_pkey_new();
		}

		$csr = openssl_csr_new($dn, $this->privkey, $config);
		$sscert = openssl_csr_sign($csr, null, $this->privkey, $daysvalid, $config);
		openssl_x509_export($sscert, $publickey);
		openssl_pkcs12_export($publickey, $out, $this->privkey, $passphrase);
		return $out;
	}

	/**
	 * @param string $days string formatted as -500d or +500d.
	 */
	private function generatePKCS12Faketime($days)
	{
		$libfaketime = '/usr/lib/x86_64-linux-gnu/faketime/libfaketime.so.1';
		if (!file_exists($libfaketime)) {
			// Arch libfaketime location
			$libfaketime = '/usr/lib/faketime/libfaketime.so.1';
		}
		return base64_decode(shell_exec("LD_PRELOAD='$libfaketime' FAKETIME=$days php ./test/create_pkcs12.php"));
	}

	/**
	 * Test a valid generate certificate.
	 */
	public function testValidCert()
	{
		$pkcs12 = $this->generatePKCS12();
		list($message, $cert, $data) = validateUploadedPKCS($pkcs12, self::PASSPHRASE, self::EMAIL_ADDRESS);
		$this->assertEquals($message, '');
		$this->assertNotEmpty($cert);
		$this->assertNotEmpty($data);
	}
	/**
	 * Test an invalid PKCS#12 format
	 */
	public function testFaultyPKCS12()
	{
		$this->assertEquals(validateUploadedPKCS('burp', 'burp', 'foo@bar.nl')[0], 'Unable to decrypt certificate');
	}

	/**
	 * Test an incorrect passphrase
	 */
	public function testIncorrectPassphrase()
	{
		$pkcs12 = $this->generatePKCS12();
		$this->assertEquals(validateUploadedPKCS($pkcs12, 'burp', 'foo@bar.nl')[0], 'Unable to decrypt certificate');
	}

	/**
	 * Test incorrect email address, which does not match the account <-> cert.
	 */
	public function testIncorrectEmailAddress()
	{
		$pkcs12 = $this->generatePKCS12();
		$this->assertEquals(validateUploadedPKCS($pkcs12, self::PASSPHRASE, 'foo@bar.nl')[0],
			"Certificate email address doesn't match WebApp account " . self::EMAIL_ADDRESS);
	}

	/**
	 * Test an expired certificate
	 */
	public function testCertificateDateExpired()
	{
		$pkcs12 = $this->generatePKCS12Faketime('-500d');
		list($message, $cert, $data) = validateUploadedPKCS($pkcs12, self::PASSPHRASE, self::EMAIL_ADDRESS);
		$validTo = date('Y-m-d', $data['validTo_time_t']);

		$this->assertEquals($message, sprintf("Certificate was expired on %s. Certificate has not been imported", $validTo));
		$this->assertNotEmpty($cert);
	}

	/**
	 * Test an certificate in the future.
	 */
	public function testCertificateNotValid()
	{
		$pkcs12 = $this->generatePKCS12Faketime('+500d');
		list($message, $cert, $data) = validateUploadedPKCS($pkcs12, self::PASSPHRASE, self::EMAIL_ADDRESS);
		$validFrom = date('Y-m-d', $data['validFrom_time_t']);

		$this->assertEquals($message, sprintf("Certificate is not yet valid %s. Certificate has not been imported", $validFrom));
		$this->assertNotEmpty($cert);
	}
}
?>
