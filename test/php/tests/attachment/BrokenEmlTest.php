<?php
require_once('classes/KopanoTest.php');
/**
 * BrokenEmlTest
 *
 * Tests if it can be detected that the attachment is broken or valid.
  */
class BrokenEmlTest extends KopanoTest {
	/**
	 * The string which serve as broken eml content
	 */
	private $brokenEml;

	/**
	 * The string which serve as valid eml content
	 */
	private $validEml;

	/**
	 * During setUp we assign hard-coded broken and valid eml string
	 */
	protected function setUp()
	{
		parent::setUp();

		$this->brokenEml = 'Return-Path: <shyam@kopano.local>'.PHP_EOL
			. 'Received: from kopano.local (10.0.0.13:51400) by kopano.local (kopano-dagent)'.PHP_EOL
			. '  with LMTP; Mon, 7 May 2018 16:40:47 +0530'.PHP_EOL
			. 'Received: from kopano.local (localhost [127.0.0.1])  by kopano.local'.PHP_EOL
			. ' (Postfix) with ESMTP id 10841183A23 for <shyam@kopano.local>; Mon, 7 May'.PHP_EOL
			. ' 2018 16:40:47 +0530'.PHP_EOL
			. 'Received: by kopano.local (kopano-spooler) with MAPI; Mon, 7 May 2018'.PHP_EOL
			. ' 16:40:47 +0530'.PHP_EOL
			. 'Subject: HTML mail'.PHP_EOL
			. 'From: =?UTF-8?Q?Shyam_Shroff?= <shyam@kopano.local>'.PHP_EOL;

		$this->validEml = 'Return-Path: <shyam@kopano.local>'.PHP_EOL
			. 'Received: from kopano.local (10.0.0.13:51400) by kopano.local (kopano-dagent)'.PHP_EOL
			. '  with LMTP; Mon, 7 May 2018 16:40:47 +0530'.PHP_EOL
			. 'Received: from kopano.local (localhost [127.0.0.1])  by kopano.local'.PHP_EOL
			. ' (Postfix) with ESMTP id 10841183A23 for <shyam@kopano.local>; Mon, 7 May'.PHP_EOL
			. ' 2018 16:40:47 +0530'.PHP_EOL
			. 'Received: by kopano.local (kopano-spooler) with MAPI; Mon, 7 May 2018'.PHP_EOL
			. ' 16:40:47 +0530'.PHP_EOL
			. 'Subject: HTML mail'.PHP_EOL
			. 'From: =?UTF-8?Q?Shyam_Shroff?= <shyam@kopano.local>'.PHP_EOL
			. 'To: =?utf-8?Q?Shyam_Shroff?= <shyam@kopano.local>'.PHP_EOL
			. 'Date: Mon, 7 May 2018 11:10:47 +0000'.PHP_EOL
			. 'Mime-Version: 1.0'.PHP_EOL
			. 'Content-Type: multipart/mixed; '.PHP_EOL
			. ' boundary="=_2h3YkHf9chTPkC2TcerbkNGpcXXKlcQWPuhw5zKe3SZxRdYT"'.PHP_EOL
			. 'X-Priority: 3 (Normal)'.PHP_EOL
			. 'X-Mailer: Kopano 8.6.80'.PHP_EOL
			. 'Message-Id: <kcis.050E6953E8374CD9A904C3651BCCF237@kopano.local>'.PHP_EOL;
	}

	/**
	 * Test that broken eml can be detected
	 */
	public function testBrokenEml()
	{
		try {
			$isBroken = isBrokenEml($this->brokenEml);

		} catch(Exception $e) {
			$this->fail('Test that the broken eml can be detected: ' . $e->getMessage() . PHP_EOL . $e->getTraceAsString());
		}

		$this->assertTrue($isBroken, 'Test that the eml is broken');
	}

	/**
	 * Test that valid eml can be detected
	 */
	public function testValidEml()
	{
		try {
			$isBroken = isBrokenEml($this->validEml);
		} catch(Exception $e) {
			$this->fail('Test that the valid eml can be detected: ' . $e->getMessage() . PHP_EOL . $e->getTraceAsString());
		}

		$this->assertFalse($isBroken, 'Test that the eml is valid');
	}
}
?>
