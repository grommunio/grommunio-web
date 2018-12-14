<?php
require_once('classes/KopanoTest.php');
require_once(BASE_PATH . 'server/includes/core/class.colors.php');

/**
 * Test the Colors class
 */
class ColorsTest extends KopanoTest {

	public function testLighter() {
		$lighter = Colors::lighter("#ff6347", 20);
		$this->assertEquals('#ffb9ac', $lighter);
	}

	public function testDarker() {
		$darker = Colors::darker("#ff6347", 4);
		$this->assertEquals("#ff5132", $darker);
	}

	public function testLuminance() {
		$output = Colors::setLuminance("#ff0000", 10);
		$this->assertEquals("#330000", $output);
	}

	public function testColorString2Object() {
		$output = Colors::colorString2Object("#ff0000");
		$this->assertEquals(['r' => 255, 'g' => 0, 'b' => 0], $output);
	}

	public function testColorObject2string() {
		$output = Colors::colorObject2string(['r' => 255, 'g' => 0, 'b' => 0]);
		$this->assertEquals("#ff0000", $output);
	}

	public function testGetHexColorFromCssColor() {
		$output = Colors::getHexColorFromCssColor("black");
		$this->assertEquals("#000000", $output);

		$output = Colors::getHexColorFromCssColor("webapp");
		$this->assertEquals(null, $output);
	}

	public function testGetLuma() {
		$output = Colors::getLuma("#000000");
		$this->assertEquals(0, $output);
	}
}

