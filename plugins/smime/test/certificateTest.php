<?php

require_once('test/smimeTest.php');
require_once('php/class.certificate.php');
require_once('php/util.php');

class CertificateTest extends SMIMETest
{
	protected function setUp()
	{
		$this->countryName = "NL";
		$this->stateOrProvinceName = "Zuid Holland";
		$this->localityName = "Delft";
		$this->organizationName = "Kopano";
		$this->organizationalUnitName = "Dev";
		$this->commonName = "John";
		$this->emailAddress = "john@kopano.com";
		$dn = [
			 "countryName" => $this->countryName,
			 "stateOrProvinceName" => $this->stateOrProvinceName,
			 "localityName" => $this->localityName,
			 "organizationName" => $this->organizationName,
			 "organizationalUnitName" => $this->organizationalUnitName,
			 "commonName" => $this->commonName,
			 "emailAddress" => $this->emailAddress
		];
		$config = ['config' => OPENSSL_CONF_PATH];
		$daysvalid = 365;
		$privkey = openssl_pkey_new();
		$csr = openssl_csr_new($dn, $privkey, $config);
		$this->validFrom = time();
		$this->validTo =  time() + (86400*365);
	      	$sscert = openssl_csr_sign($csr, null, $privkey, $daysvalid, $config);
		openssl_x509_export($sscert, $publickey);

		$this->certdata = $publickey;
		$this->cert = new Certificate($this->certdata);
	}

	public function testEmailaddress()
	{
		$this->assertEquals($this->cert->emailAddress(), $this->emailAddress);
	}

	public function testDerPem()
	{
		$pem = $this->cert->pem();
		$der = $this->cert->der();

		// FIXME: remove der2pem
		$this->assertEquals($pem, der2pem($der));
		$this->assertEquals($this->certdata, $pem);
	}

	public function testValidFrom()
	{
		$this->assertEquals($this->cert->validFrom(), $this->validFrom);
	}

	public function testValidTo()
	{
		$this->assertEquals($this->cert->validTo(), $this->validTo);
	}

	public function testExpired()
	{
		$this->assertEquals($this->cert->valid(), false);
	}

	public function testCAURL()
	{
		$this->assertEmpty($this->cert->caURL());
	}	

	public function testOCSPURL()
	{
		$this->assertEmpty($this->cert->ocspURL());
	}	

	public function testIssuer()
	{
		$issuer = $this->cert->issuer(True);
		$this->assertInternalType('object',  $issuer);
	}

	public function testFingerprint()
	{
		$this->assertNotEmpty($this->cert->fingerprint());
		$this->assertNotEmpty($this->cert->fingerprint('md5'));
	}

	public function testGetName()
	{
		$name = $this->cert->getName();
		$this->assertContains($this->emailAddress, $name);
		$this->assertContains($this->countryName, $name);
		$this->assertContains($this->stateOrProvinceName, $name);
	}
}

?>
