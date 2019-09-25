<?php
require_once('classes/KopanoUser.php');
require_once('classes/TestUser.php');
require_once('classes/KopanoTest.php');

/**
 * SettingsTest
 *
 * Tests the logic behind the saving and deleting of settings.
 */
class SettingsTest extends KopanoTest {
	/**
	 * The user which is saving the settings
	 */
	private $user;

	/**
	 * During setup we are going to create the core Settings object.
	 */
	protected function setUp()
	{
		$this->cleanFolders = false;
		parent::setUp();

		$this->user = $this->addUser(new TestUser(new KopanoUser(KOPANO_USER1_NAME, KOPANO_USER1_PASSWORD)));
	}

	/**
	 * Test the results from the retrieving of settings
	 */
	public function testRetrieveSettingResults()
	{
		$settings = $this->user->retrieveSettings();

		$this->assertArrayHasKey('retrieveAll', $settings, 'Test that the object contains the \'retrieveAll\' property');
		$this->assertArrayHasKey('zarafa', $settings['retrieveAll'], 'Test that the object contains the \'zarafa\' property');
		$this->assertArrayHasKey('v1', $settings['retrieveAll']['zarafa'], 'Test that the object contains the \'v1\' property');
	}

	/**
	 * Test that the settings still have the Out-Of-Office settings after saving
	 */
	public function testSaveSettings()
	{
		$settings = $this->user->retrieveSettings();

		$GLOBALS["settings"]->retrieveSettings();
		$GLOBALS["settings"]->saveSettings();
		$settings = $GLOBALS["settings"]->get('zarafa/v1/contexts/mail');

		$this->assertArrayHasKey('outofoffice', $settings, 'Test that the object contains the outofoffice settings after saving');
	}

	/**
	 * Test that a setting can be set
	 * @dataProvider providerSetSettings
	 */
	public function testSetSetting($path, $value)
	{
		try {
			$result = $this->user->setSetting($path, $value);
		} catch (Exception $e) {
			$this->fail('Test that the settings can be saved: ' . $e->getMessage() . PHP_EOL . $e->getTraceAsString());
		}

		$this->assertArrayHasKey('success', $result, 'Test that the result contains the \'success\' property');
	}

	/**
	 * Test if the setting has been set correctly
	 * @dataProvider providerSetSettings
	 */
	public function testSetSettingResult($path, $value, $testMessage)
	{
		$this->user->setSetting($path, $value);
		$settings = $this->user->retrieveSettings();

		$this->assertArrayHasKey('retrieveAll', $settings, 'Test that the object contains the \'retrieveAll\' property');
		$settings = $settings['retrieveAll'];

		$path = explode('/', $path);

		for ($i = 0, $len = count($path); $i < $len; $i++) {
			$key = $path[$i];

			$this->assertArrayHasKey($key, $settings, 'Test that the object contains the \'' . $key . '\' property');

			$settings = $settings[$key];
		}

		$this->assertEquals($value, $settings, $testMessage);
	}

	/**
	 * Test if multiple settings can be set
	 */
	public function testSetMultipleSettings()
	{
		try {
			$result = $this->user->setSetting(array(
				array(
					'path' => 'zarafa/v1/test1',
					'value' => 'a'
				),
				array(
					'path' => 'zarafa/v1/test2',
					'value' => 'b'
				)
			));
		} catch (Exception $e) {
			$this->fail('Test that multiple settings can be saved: ' . $e->getMessage() . PHP_EOL . $e->getTraceAsString());
		}

		$this->assertArrayHasKey('success', $result, 'Test that the result contains the \'success\' property');
	}

	/**
	 * Test if the multiple settings were saved correctlty
	 */
	public function testSetMultipleSettingsResult()
	{
		$this->user->setSetting(array(
			array(
				'path' => 'zarafa/v1/test1',
				'value' => 'a'
			),
			array(
				'path' => 'zarafa/v1/test2',
				'value' => 'b'
			)
		));
		$settings = $this->user->retrieveSettings();

		$this->assertArrayHasKey('retrieveAll', $settings, 'Test that the object contains the \'retrieveAll\' property');
		$this->assertArrayHasKey('zarafa', $settings['retrieveAll'], 'Test that the object contains the \'zarafa\' property');
		$this->assertArrayHasKey('v1', $settings['retrieveAll']['zarafa'], 'Test that the object contains the \'v1\' property');
		$this->assertArrayHasKey('test1', $settings['retrieveAll']['zarafa']['v1'], 'Test that the object contains the \'test1\' property');
		$this->assertArrayHasKey('test2', $settings['retrieveAll']['zarafa']['v1'], 'Test that the object contains the \'test2\' property');

		$this->assertEquals('a', $settings['retrieveAll']['zarafa']['v1']['test1'], 'Test that the first setting has been correctly saved');
		$this->assertEquals('b', $settings['retrieveAll']['zarafa']['v1']['test2'], 'Test that the second setting has been correctly saved');
	}

	/**
	 * Test if an array can be overridden
	 */
	public function testOverrideArray()
	{
		$this->user->setSetting('zarafa/v1/test', array(0 => 'first', 1 => 'second', 2 => 'third' ));
		$this->user->setSetting('zarafa/v1/test', array(0 => 'fourth', 1 => 'fifth' ));

		$settings = $this->user->retrieveSettings();

		$settings = $settings['retrieveAll']['zarafa']['v1'];
		$this->assertArrayHasKey('test', $settings, 'Test that the object contains the \'test\' property');

		$this->assertEquals(array(0 => 'fourth', 1 => 'fifth' ), $settings['test'], 'Test that the array has been properly overridden');
	}

	/**
	 * Test if an object can be overidden
	 */
	public function testOverrideObject()
	{
		$this->user->setSetting('zarafa/v1/test', array('first' => 'un', 'second' => 'deux', 'third' => 'trois' ));
		$this->user->setSetting('zarafa/v1/test', array('fourth' => 'quatre', 'fifth' => 'cinq' ));

		$settings = $this->user->retrieveSettings();

		$settings = $settings['retrieveAll']['zarafa']['v1'];
		$this->assertArrayHasKey('test', $settings, 'Test that the object contains the \'test\' property');

		$this->assertEquals(array('fourth' => 'quatre', 'fifth' => 'cinq' ), $settings['test'], 'Test that the object has been properly overridden');
	}

	/**
	 * Test that a setting can be deleted
	 * @dataProvider providerDeleteSettings
	 */
	public function testDeleteSetting($path, $value)
	{
		try {
			$this->user->setSetting($path, $value);
			$result = $this->user->deleteSetting($path);
		} catch (Exception $e) {
			$this->fail('Test that the settings can be deleted: ' . $e->getMessage() . PHP_EOL . $e->getTraceAsString());
		}

		$this->assertArrayHasKey('success', $result, 'Test that the result contains the \'success\' property');
	}

	/**
	 * Test if the deletion has been done correctly
	 * @dataProvider providerDeleteSettings
	 */
	public function testDeleteSettingResult($path, $value, $testMessage)
	{
		$this->user->setSetting($path, $value);
		$this->user->deleteSetting($path);
		$settings = $this->user->retrieveSettings();

		$this->assertArrayHasKey('retrieveAll', $settings, 'Test that the object contains the \'retrieveAll\' property');
		$settings = $settings['retrieveAll'];

		$path = explode('/', $path);

		for ($i = 0, $len = count($path) - 1; $i < $len; $i++) {
			$key = $path[$i];

			$this->assertArrayHasKey($key, $settings, 'Test that the object contains the \'' . $key . '\' property');

			$settings = $settings[$key];
		}

		$this->assertArrayNotHasKey($path[$i], $settings, $testMessage);
	}

	/**
	 * Test that a non-existing setting can be deleted
	 */
	public function testDeleteNonExistingSetting()
	{
		try {
			$this->user->setSetting('zarafa/v1/test1', 'a');
			$result = $this->user->deleteSetting('zarafa/v2/unknown_setting');
		} catch (Exception $e) {
			$this->fail('Test that the settings can be deleted: ' . $e->getMessage() . PHP_EOL . $e->getTraceAsString());
		}

		$this->assertArrayHasKey('success', $result, 'Test that the result contains the \'success\' property');
	}

	/**
	 * Test if the non-existing setting was deleted without errors
	 */
	public function testDeleteNonExistingSettingResult()
	{
		$this->user->setSetting('zarafa/v1/test1', 'a');
		$this->user->deleteSetting('zarafa/v2/unknown_setting');
		$settings = $this->user->retrieveSettings();

		$this->assertArrayHasKey('retrieveAll', $settings, 'Test that the object contains the \'retrieveAll\' property');
		$this->assertArrayHasKey('zarafa', $settings['retrieveAll'], 'Test that the object contains the \'zarafa\' property');
		$this->assertArrayHasKey('v1', $settings['retrieveAll']['zarafa'], 'Test that the object contains the \'v1\' property');
		$this->assertArrayHasKey('test1', $settings['retrieveAll']['zarafa']['v1'], 'Test that the object does contain the \'test1\' property');
	}

	/**
	 * Test if multiple settings can be deleted
	 */
	public function testDeleteMultipleSettings()
	{
		try {
			$this->user->setSetting(array(
				array(
					'path' => 'zarafa/v1/test1',
					'value' => 'a'
				),
				array(
					'path' => 'zarafa/v1/test2',
					'value' => 'b'
				)
			));
			$result = $this->user->deleteSetting(array(
				'zarafa/v1/test1',
				'zarafa/v1/test2'
			));
		} catch (Exception $e) {
			$this->fail('Test that multiple settings can be deleted: ' . $e->getMessage() . PHP_EOL . $e->getTraceAsString());
		}

		$this->assertArrayHasKey('success', $result, 'Test that the result contains the \'success\' property');
	}

	/**
	 * Test if the multiple settings were deleted correctly
	 */
	public function testDeleteMultipleSettingsResult()
	{
		$this->user->setSetting(array(
			array(
				'path' => 'zarafa/v1/test1',
				'value' => 'a'
			),
			array(
				'path' => 'zarafa/v1/test2',
				'value' => 'b'
			)
		));
		$this->user->deleteSetting(array(
			'zarafa/v1/test1',
			'zarafa/v1/test2'
		));
		$settings = $this->user->retrieveSettings();

		$this->assertArrayHasKey('retrieveAll', $settings, 'Test that the object contains the \'retrieveAll\' property');
		$this->assertArrayHasKey('zarafa', $settings['retrieveAll'], 'Test that the object contains the \'zarafa\' property');
		$this->assertArrayHasKey('v1', $settings['retrieveAll']['zarafa'], 'Test that the object contains the \'v1\' property');
		$this->assertArrayNotHasKey('test1', $settings['retrieveAll']['zarafa']['v1'], 'Test that the object does not contain the \'test1\' property');
		$this->assertArrayNotHasKey('test2', $settings['retrieveAll']['zarafa']['v1'], 'Test that the object does not contain the \'test2\' property');
	}

	/**
	 * Special Data provider which generates settings which can be set.
	 * The first argument is path which should be changed
	 * The second argument is the value which should be saved into the settings
	 * The third argument is the message which should be printed when the test fails
	 */
	public function providerSetSettings()
	{
		return array(
			array('zarafa/v1/test', 10, 'Test that a number can be saved into the settings'),
			array('zarafa/v1/test', 'test', 'Test that a string can be saved into the settings'),
			array('zarafa/v1/test', true, 'Test that a boolean can be saved into the settings'),
			array('zarafa/v1/test', array( 'sub' => 'value' ), 'Test that an object can be saved into the settings'),
			array('zarafa/v1/test', array( 0 => 'first', 1 => 'second' ), 'Test that an arrat can be saved into the settings'),
		);
	}

	/**
	 * Special Data provider which generates settings which can be set.
	 * The first argument is path which should be changed
	 * The second argument is the value which should be saved into the settings
	 * The third argument is the message which should be printed when the test fails
	 */
	public function providerDeleteSettings()
	{
		return array(
			array('zarafa/v1/test', 10, 'Test that a number can be deleted from the settings'),
			array('zarafa/v1/test', 'test', 'Test that a string can be deleted from the settings'),
			array('zarafa/v1/test', true, 'Test that a boolean can be deleted from the settings'),
			array('zarafa/v1/test', array( 'sub' => 'value' ), 'Test that an object can be deleted from the settings'),
			array('zarafa/v1/test', array( 0 => 'first', 1 => 'second' ), 'Test that an arrat can be deleted from the settings'),
		);
	}
}

?>
