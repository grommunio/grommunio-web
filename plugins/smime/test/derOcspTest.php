<?php

require_once 'test/smimeTest.php';
require_once 'php/lib/Ocsp.php';

use WAYF\DerEncoder;
use WAYF\OCSP;

class TestableDerOcsp extends OCSP {
	public function decodeOid(string $der): string {
		$this->init($der);

		return $this->oid();
	}

	public function decodeContainedOctetString(string $der): string {
		$this->init($der);
		$this->beginsequence();
		$value = $this->next(4);
		$this->end();
		if (!is_string($value)) {
			throw new UnexpectedValueException('Expected DER OCTET STRING contents');
		}

		return $value;
	}
}

/**
 * @internal
 *
 * @covers \WAYF\Der
 * @covers \WAYF\OCSP
 */
class DerOcspTest extends SMIMETest {
	public function testOptionalOcspExtensionsAreParsed() {
		$response = (new OCSP())->response($this->buildResponse());
		$data = $response['responseBytes']['BasicOCSPResponse']['tbsResponseData'];

		$this->assertArrayHasKey('ocspNonce', $data['responseExtensions']);
		$this->assertArrayHasKey('ocspNonce', $data['responses'][0]['singleExtensions']);
		$this->assertEquals('20260907010000Z', $data['responses'][0]['nextupdate']);
	}

	public function testUnknownCriticalOcspExtensionIsRejected() {
		try {
			(new OCSP())->response($this->buildResponse(true));
			$this->fail('An unsupported critical extension must be rejected');
		}
		catch (UnexpectedValueException $e) {
			$this->assertStringContainsString('Unsupported critical extension', $e->getMessage());
		}
	}

	public function testTruncatedDerIsRejected() {
		$der = $this->buildResponse();

		try {
			(new OCSP())->response(substr($der, 0, -1));
			$this->fail('A truncated OCSP response must be rejected');
		}
		catch (UnexpectedValueException $e) {
			$this->assertStringContainsString('Truncated DER', $e->getMessage());
		}
	}

	public function testLargeObjectIdentifierArcsRoundTrip() {
		$oid = '2.999.123456789012345678901234567890';

		$this->assertSame($oid . '*', (new TestableDerOcsp())->decodeOid(DerEncoder::oid($oid)));
	}

	public function testRsaPssAlgorithmParametersAreParsedAndConsumed() {
		$response = (new OCSP())->response($this->buildResponse(false, true));
		$basicResponse = $response['responseBytes']['BasicOCSPResponse'];

		$this->assertSame('rsaPSS', $basicResponse['signatureAlgorithm']);
		$this->assertSame([
			'hash' => 'sha256',
			'mgfHash' => 'sha256',
			'saltLength' => 32,
			'trailerField' => 1,
		], (new OCSP())->rsaPssParameters($basicResponse['signatureAlgorithmParameters']));
		$this->assertSame("\0signature", $basicResponse['signature']);
	}

	public function testNegativeRsaPssIntegerIsRejected() {
		$parameters = DerEncoder::sequence(
			DerEncoder::explicit(2, "\x02\x01\xff")
		);

		$this->expectException(UnexpectedValueException::class);
		$this->expectExceptionMessage('must be non-negative');
		(new OCSP())->rsaPssParameters($parameters);
	}

	public function testNonCanonicalRsaPssIntegerIsRejected() {
		$parameters = DerEncoder::sequence(
			DerEncoder::explicit(2, "\x02\x02\x00\x01")
		);

		$this->expectException(UnexpectedValueException::class);
		$this->expectExceptionMessage('Non-canonical');
		(new OCSP())->rsaPssParameters($parameters);
	}

	public function testValueCannotExtendBeyondContainingSequence() {
		$malformed = "\x30\x02\x04\x03abc";

		try {
			(new TestableDerOcsp())->decodeContainedOctetString($malformed);
			$this->fail('A value extending beyond its containing sequence must be rejected');
		}
		catch (UnexpectedValueException $e) {
			$this->assertStringContainsString('Truncated DER', $e->getMessage());
		}
	}

	private function buildResponse(bool $criticalExtension = false, bool $rsaPss = false): string {
		$extensions = DerEncoder::sequence($this->extension(
			'1.3.6.1.5.5.7.48.1.2',
			'nonce',
			$criticalExtension
		));
		$certId = DerEncoder::sequence(
			DerEncoder::algorithmIdentifier('1.3.14.3.2.26', '') .
			DerEncoder::octetString(str_repeat('n', 20)) .
			DerEncoder::octetString(str_repeat('k', 20)) .
			DerEncoder::integer(1)
		);
		$singleResponse = DerEncoder::sequence(
			$certId .
			DerEncoder::implicit(0, '') .
			DerEncoder::generalizedTime('20260906010000Z') .
			DerEncoder::explicit(0, DerEncoder::generalizedTime('20260907010000Z')) .
			DerEncoder::explicit(1, $extensions)
		);
		$responseData = DerEncoder::sequence(
			DerEncoder::explicit(2, DerEncoder::octetString(str_repeat('r', 20))) .
			DerEncoder::generalizedTime('20260906010000Z') .
			DerEncoder::sequence($singleResponse) .
			DerEncoder::explicit(1, $extensions)
		);
		$signatureAlgorithm = $rsaPss
			? DerEncoder::algorithmIdentifier('1.2.840.113549.1.1.10', $this->rsaPssParameters())
			: DerEncoder::algorithmIdentifier('1.2.840.113549.1.1.11', '');
		$basicResponse = DerEncoder::sequence(
			$responseData .
			$signatureAlgorithm .
			DerEncoder::bitString('signature')
		);
		$responseBytes = DerEncoder::sequence(
			DerEncoder::oid('1.3.6.1.5.5.7.48.1.1') .
			DerEncoder::octetString($basicResponse)
		);

		return DerEncoder::sequence(
			DerEncoder::enumerated(0) .
			DerEncoder::explicit(0, $responseBytes)
		);
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

	private function extension(string $oid, string $value, bool $critical): string {
		return DerEncoder::sequence(
			DerEncoder::oid($oid) .
			($critical ? DerEncoder::boolean(true) : '') .
			DerEncoder::octetString($value)
		);
	}
}
