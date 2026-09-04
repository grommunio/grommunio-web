<?php

require_once 'test/smimeTest.php';
require_once 'php/lib/Nemid.php';

use WAYF\NemidCertificateCheck;
use WAYF\X509Helper;

class TestableNemidCertificateCheck extends NemidCertificateCheck {
	public function findRequiredElement(DOMXPath $xpath, string $query): DOMElement {
		return $this->requireXPathElement($xpath, $query);
	}

	public function replaceText(DOMDocument $document, DOMElement $element, $value): void {
		$this->replaceElementText($document, $element, $value);
	}

	public function remove(DOMElement $element): void {
		$this->removeElement($element);
	}
}

class TestableX509Helper extends X509Helper {
	public function decodeGeneralName(string $der): array {
		$this->init($der);
		$this->beginsequence();

		return $this->generalName();
	}
}

/**
 * @internal
 *
 * @covers \WAYF\NemidCertificateCheck
 * @covers \WAYF\X509Helper
 */
class NemidValidationTest extends SMIMETest {
	public function testRequiredNemidElementMustExist() {
		$document = new DOMDocument();
		$document->loadXML('<method><request/></method>');

		$this->expectException(UnexpectedValueException::class);
		$this->expectExceptionMessage('Missing NemID XML element: /method/request/pid');
		(new TestableNemidCertificateCheck())->findRequiredElement(new DOMXPath($document), '/method/request/pid');
	}

	public function testNemidElementValueNodeMustExist() {
		$document = new DOMDocument();
		$element = $document->createElement('pid');

		$this->expectException(UnexpectedValueException::class);
		$this->expectExceptionMessage("NemID XML element 'pid' has no value node");
		(new TestableNemidCertificateCheck())->replaceText($document, $element, 'value');
	}

	public function testNemidElementMustHaveParentBeforeRemoval() {
		$document = new DOMDocument();
		$element = $document->createElement('cpr');

		$this->expectException(UnexpectedValueException::class);
		$this->expectExceptionMessage("NemID XML element 'cpr' has no parent node");
		(new TestableNemidCertificateCheck())->remove($element);
	}

	public function testEmptyGeneralNameSequenceIsRejected() {
		$this->expectException(UnexpectedValueException::class);
		$this->expectExceptionMessage('Missing GeneralName value');
		(new TestableX509Helper())->decodeGeneralName("\x30\x00");
	}
}
