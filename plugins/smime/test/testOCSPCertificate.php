<?php

require_once('php/class.certificate.php');
require_once('php/util.php');

class OCSPCertificateTest extends \PHPUnit_Framework_TestCase
{
	protected $cert;

	protected function setUp() {
		$this->certdata = file_get_contents('./test/user.crt');
		$this->cert = new Certificate($this->certdata);
	}

	public function testEmailaddress()
	{
		$this->assertEquals($this->cert->emailAddress(), 'user1@farmer.lan');
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
		$this->assertEquals($this->cert->validFrom(), 1491298233);
	}

	public function testValidTo()
	{
		$this->assertEquals($this->cert->validTo(), 1523698233);
	}

	public function testExpired()
	{
		$this->assertEquals($this->cert->valid(), false);
	}

	public function testCAURL()
	{
		$this->assertNotEmpty($this->cert->caURL());
	}	

	public function testOCSPURL()
	{
		$this->assertNotEmpty($this->cert->ocspURL());
	}	
}

?>
