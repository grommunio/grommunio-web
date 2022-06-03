<?php

require_once 'classes/grommunioTest.php';

/**
 * Test the Conversion class.
 *
 * @internal
 * @coversNothing
 */
class ConversionTest extends grommunioTest {
	public function testCOleDateTimeToUnixTime() {
		$time = 1546600770;
		$olTime = Conversion::UnixTimeToCOleDateTime($time);
		$newTime = intval(Conversion::COleDateTimeToUnixTime($olTime));
		$this->assertEquals($time, $newTime);
	}

	public function testConvertCodepageStringToUtf8() {
		$str = "woop";
		$this->assertEquals(Conversion::convertCodepageStringToUtf8("iso-8859-1", $str), $str);

		// BS charset
		$this->assertEquals(Conversion::convertCodepageStringToUtf8("iso-234234-1", $str), $str);
	}

	public function testRestrictionJson() {
		$restriction = [RES_PROPERTY,
			[
				RELOP => RELOP_EQ,
				ULPROPTAG => PR_MESSAGE_CLASS,
				VALUE => [
					PR_MESSAGE_CLASS => "IPM.Note",
				],
			],
		];
		$json = Conversion::restriction2json($restriction);
		$convertedRestriction = Conversion::json2restriction($properties, $json);
		$this->assertEquals($restriction, $convertedRestriction);
	}

	public function testProperty2json() {
		$this->assertEquals(Conversion::property2json(0x37001E), 'PR_SUBJECT');
	}
}
