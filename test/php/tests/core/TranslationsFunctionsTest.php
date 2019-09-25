<?php
require_once('classes/KopanoTest.php');

define('EXPIRES_TIME', 0);
// Horrible global required for translations.js.php
$Language = new Language();

require(BASE_PATH . 'server/includes/translations.js.php');
ob_end_clean();

/**
 * Test the translation.js.php
 */
class TranslationJSTest extends KopanoTest {

	public function testChangeTranslationCharsetToUTF8Str() {
		$str = "foo";
		$value = changeTranslationCharsetToUTF8($str, 'UTF-8');
		$this->assertEquals($str, $value);
	}

	public function testChangeTranslationCharsetToUTF8List() {
		$arr = ["foo", "bar"];
		$value = changeTranslationCharsetToUTF8($arr, 'UTF-8');
		$this->assertEquals($arr, $value);
	}

	public function testChangeTranslationCharsetToUTF8ListNull() {
		$arr = null;
		$value = changeTranslationCharsetToUTF8($arr, 'UTF-8');
		$this->assertEquals($arr, $value);
	}
}
