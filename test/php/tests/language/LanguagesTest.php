<?php
require_once('classes/KopanoTest.php');

/**
 * LanguagesTest
 *
 * Test the Language class for detecting and enabling languages
 */
class LanguagesTest extends KopanoTest {
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
		$this->assertArrayHasKey('en_GB', $langs, 'Test that the \'en_GB\' language was found');
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

		$this->assertArrayHasKey('zarafa_webapp', $data, 'Test that the \'zarafa_webapp\' key is found');
		$this->assertNotEmpty($data['zarafa_webapp'], 'Test that the \'zarafa_webapp\' array contains items');
		$this->assertArrayHasKey('msgctxt', $data['zarafa_webapp'][0], 'Test that the translation contains the \'msgctxt\' key.');
		$this->assertArrayHasKey('msgid_plural', $data['zarafa_webapp'][0], 'Test that the translation contains the \'msgid_plural\' key.');
		$this->assertArrayHasKey('msgid', $data['zarafa_webapp'][0], 'Test that the translation contains the \'msgid\' key.');
		$this->assertArrayHasKey('msgstr', $data['zarafa_webapp'][0], 'Test that the translation contains the \'msgstr\' key.');
	}
}

?>
