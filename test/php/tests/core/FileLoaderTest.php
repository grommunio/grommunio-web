<?php
require_once('classes/KopanoTest.php');
require_once(BASE_PATH . 'server/includes/loader.php');

/**
 * Test the FileLoader
 */
class FileLoaderTest extends KopanoTest {

	public function testExtjsJavascriptFiles() {
		$loader = new FileLoader();
		$files = $loader->getExtjsJavascriptFiles(LOAD_RELEASE);
		$this->assertNotEmpty($files);
		$this->assertContains('client/extjs/ext-base-all.js', $files);

		$files = $loader->getExtjsJavascriptFiles(LOAD_DEBUG);
		$this->assertNotEmpty($files);
		$this->assertContains('client/extjs/ext-all-debug.js', $files);
	}

	public function testgetExtjsCSSFiles() {
		$loader = new FileLoader();
		$files = $loader->getExtjsCSSFiles(LOAD_RELEASE);
		$this->assertNotEmpty($files);

		$files = $loader->getExtjsCSSFiles(LOAD_DEBUG);
		$this->assertNotEmpty($files);

		$files = $loader->getExtjsCSSFiles(LOAD_SOURCE);
		$this->assertNotEmpty($files);
	}

	public function testgetZarafaJavascriptFiles() {
		$loader = new Fileloader();

		$files = $loader->getZarafaJavascriptFiles(LOAD_RELEASE);
		$this->assertNotEmpty($files);

		$files = $loader->getZarafaJavascriptFiles(LOAD_DEBUG);
		$this->assertNotEmpty($files);
	}
}
