<?php
require_once('classes/grommunioTest.php');

/**
 * LanguagesTest
 *
 * Test the Language class for detecting and enabling languages
 */
class LanguagesTest extends grommunioTest {
	/**
	 * Test that languages can be loaded
	 */
	public function testLoadLanguages()
	{
		try {
			$lang = new Language();
			$langs = $lang->getLanguages();
		} catch (Exception $e) {
			$this->fail('Test that the languages can be obtained: ' . $e->getMessage() . PHP_EOL . $e->getTraceAsString());
		}

		$this->assertNotEmpty($langs, 'Test that multiple languages were detected');
		$this->assertArrayHasKey('en_GB.UTF-8', $langs, 'Test that the \'en_GB\' language was found');
		$this->assertArrayHasKey('de_DE.UTF-8', $langs, 'Test that the \'de_DE\' language was found');
		$this->assertArrayHasKey('nl_NL.UTF-8', $langs, 'Test that the \'nl_NL\' language was found');
	}

	/**
	 * Test that the json object can be obtained
	 */
	public function testGetJSON()
	{
		$lang = new Language();
		$lang->loadLanguages();

		$data = $lang->getJSON();

		$this->assertNotEmpty($data, 'Test that a javascript string is returned');
	}

	/**
	 * Test that the translations can be obtained
	 */
	public function testGetTranslations()
	{
		$lang = new Language();
		$lang->loadLanguages();
		$lang->setLanguage('nl_NL.UTF-8');
		$data = $lang->getTranslations();

		$this->assertArrayHasKey('grommunio_web', $data, 'Test that the \'grommunio_web\' key is found');
		$this->assertNotEmpty($data['grommunio_web'], 'Test that the \'grommunio_web\' array contains items');
		$this->assertArrayHasKey('msgctxt', $data['grommunio_web'][0], 'Test that the translation contains the \'msgctxt\' key.');
		$this->assertArrayHasKey('msgid_plural', $data['grommunio_web'][0], 'Test that the translation contains the \'msgid_plural\' key.');
		$this->assertArrayHasKey('msgid', $data['grommunio_web'][0], 'Test that the translation contains the \'msgid\' key.');
		$this->assertArrayHasKey('msgstr', $data['grommunio_web'][0], 'Test that the translation contains the \'msgstr\' key.');
	}
}

?>
