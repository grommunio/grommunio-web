<?php
require_once('classes/KopanoTest.php');

/**
 * SettingsFilterTest
 *
 * Tests the logic behind the filtering settings.
 */
class SettingsFilterTest extends KopanoTest {

	protected static $settings;

	public static function setUpBeforeClass()
	{
		self::$settings = new Settings();
	}

	/**
	 * Test that the filterOutSettings method filters out the default settings that are not changed.
	 */
	public function testFilterOutUnchangedDefaultSettingValue()
	{
		$defaults = Array(
			'defaultSetting1' => 'unchanged',
			'defaultSetting2' => 'unchanged'
		);
		$settings = Array(
			'defaultSetting1' => 'unchanged',
			'defaultSetting2' => 'unchanged'
		);
		$result = Array();
		$this->assertEquals(self::$settings->filterOutSettings($settings, $defaults), $result, 'Test that it does not save a unchanged default value');
	}
	/**
	 * Test that the filterOutSettings method does not filter out default settings that have changed values.
	 */
	public function testNotFilterOutChangedDefaultSettingValue()
	{
		$defaults = Array(
			'defaultSetting1' => 'changed_old',
			'defaultSetting2' => 'unchanged'
		);
		$settings = Array(
			'defaultSetting1' => 'changed_new',
			'defaultSetting2' => 'unchanged'
		);
		$result = Array(
			'defaultSetting1' => 'changed_new'
		);
		$this->assertEquals(self::$settings->filterOutSettings($settings, $defaults), $result, 'Test that it does not remove a changed value of a default settigns');
	}
	/**
	 * Test that the filterOutSettings method does not filter out non-default settings.
	 */
	public function testNotFilterOutNonDefaultSettings()
	{
		$defaults = Array(
			'defaultSetting1' => 'unchanged'
		);
		$settings = Array(
			'defaultSetting1' => 'unchanged',
			'randomSetting2' => 'value1'
		);
		$result = Array(
			'randomSetting2' => 'value1'
		);
		$this->assertEquals(self::$settings->filterOutSettings($settings, $defaults), $result, 'Test that it does not remove a non-default settings');
	}

	/**
	 * Test that the filterOutSettings method only filters out arrays that are empty.
	 */
	public function testOnlyFiltersOutEmptyArrays()
	{
		$defaults = Array(
			'subset1' => Array(
				'defaultSetting1' => 'unchanged',
				'defaultSetting2' => 'unchanged'
			),
			'subset2' => Array(
				'defaultSetting3' => 'unchanged',
			)
		);
		$settings = Array(
			'subset1' => Array(
				'defaultSetting1' => 'unchanged',
				'defaultSetting2' => 'unchanged'
			),
			'subset2' => Array(
				'defaultSetting3' => 'unchanged',
				'randomSetting4' => 'value1'
			),
			'subset3' => Array(
				'randomSetting5' => 'value1',
				'randomSetting6' => 'value1'
			)
		);
		$result = Array(
			'subset2' => Array(
				'randomSetting4' => 'value1'
			),
			'subset3' => Array(
				'randomSetting5' => 'value1',
				'randomSetting6' => 'value1'
			)
		);
		$this->assertEquals(self::$settings->filterOutSettings($settings, $defaults), $result, 'Test that only empty arrays are filtered out from the settings');
	}

	/**
	 * Test that the filterOutSettings method can handle that the default setting is not in current settings.
	 */
	public function testNonPresentDefaultSettingDoesNotTriggerError()
	{
		$defaults = Array(
			'defaultSetting1' => 'unchanged',
			'defaultSetting2' => 'unchanged'
		);
		$settings = Array();
		$result = Array();
		$this->assertEquals(self::$settings->filterOutSettings($settings, $defaults), $result, 'Test that non-present default settings are not triggering an error.');
		
	}
}

?>
