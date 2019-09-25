<?php
require_once('classes/KopanoUser.php');
require_once('classes/TestUser.php');
require_once('classes/KopanoTest.php');

/**
 * LoadPluginsTest
 *
 * Tests loading the plugins
 */
class LoadPluginsTest extends KopanoTest {

	/**
	 * The default user.
	 */
	private $user;

	/**
	 * During setUp we create the user
	 */
	protected function setUp()
	{
		parent::setUp();

		$this->user = $this->addUser(new TestUser(new KopanoUser(KOPANO_USER1_NAME, KOPANO_USER1_PASSWORD)));
		// Ensure the user is logged in, that creates a valid session environment
		// in which we can safely replace the PluginManager.
		$this->user->logon();

		$this->cleanFolders = false;
	}

	/**
	 * Test if the plugins will not be loaded when the Plugin Manager is disabled
	 * @dataProvider providerLoaderTypes
	 */
	public function testDisabledPlugins($type)
	{
		$GLOBALS['PluginManager'] = new PluginManager(false);
		$GLOBALS['PluginManager']->detectPlugins();
		$GLOBALS['PluginManager']->initPlugins($type);
		$this->assertFalse($GLOBALS['PluginManager']->pluginExists('plugin2'), 'Test that the \'plugin2\' plugindata was not loaded');
		$this->assertFalse($GLOBALS['PluginManager']->pluginExists('plugin1'), 'Test that the \'plugin1\' plugindata was not loaded');
		$this->assertFalse($GLOBALS['PluginManager']->pluginExists('plugin3'), 'Test that the \'plugin3\' plugindata was not loaded');
	}

	/**
	 * Test if the XML has not been read when the plugin manager is disabled
	 * @dataProvider providerLoaderTypes
	 */
	public function testDisabledPluginFiles()
	{
		$GLOBALS['PluginManager'] = new PluginManager(false);
		$GLOBALS['PluginManager']->detectPlugins();

		$this->assertEmpty($GLOBALS['PluginManager']->plugindata, 'Test that the \'plugindata\' is empty');
		$this->assertEmpty($GLOBALS['PluginManager']->plugins, 'Test that the \'plugins\' is empty');
		$this->assertEmpty($GLOBALS['PluginManager']->modules, 'Test that the \'modules\' is empty');
	}

	/**
	 * Test if the XML has been properly read
	 * @dataProvider providerLoaderTypes
	 */
	public function testInitPluginFiles($type)
	{
		$GLOBALS['PluginManager'] = new PluginManager(true);
		$GLOBALS['PluginManager']->detectPlugins();
		$GLOBALS['PluginManager']->initPlugins($type);

		// Test the 'plugin2' plugindata
		$this->assertTrue($GLOBALS['PluginManager']->pluginExists('plugin2'), 'Test that the \'plugin2\' plugindata was loaded');
		$plugindata = $GLOBALS['PluginManager']->plugindata['plugin2'];
		$this->assertCount(2, $plugindata['components'], 'Test that 2 components were provided');

		// Test the config component
		$config = $plugindata['components'][0];
		if ($type === LOAD_RELEASE) {
			$this->assertCount(1, $config['serverfiles'][$type], 'Test that the config component of \'plugin2\' contains one serverfiles');
			$this->assertEquals('config.php', $config['serverfiles'][$type][0]['file'], 'Test that the \'file\' property is \'config.php\'');
			$this->assertEquals(TYPE_CONFIG, $config['serverfiles'][$type][0]['type'], 'Test that the \'type\' property is \'config\'');
			$this->assertEquals(LOAD_RELEASE, $config['serverfiles'][$type][0]['load'], 'Test that the \'load\' property is \'release\'');
			$this->assertEmpty($config['serverfiles'][$type][0]['module'], 'Test that the \'module\' property is empty');
		} else {
			$this->assertEmpty($config['serverfiles'][$type], 'Test that the config component of \'plugin2\' doesn\'t contain serverfiles');
		}
		$this->assertArrayNotHasKey($type, $config['clientfiles'], 'Test that the config component of \'plugin2\' doesn\'t contain clientfiles');
		$this->assertArrayNotHasKey($type, $config['resourcefiles'], 'Test that the config component of \'plugin2\' doesn\'t contain resourcefiles');

		// Test the plugin2 component
		$component = $plugindata['components'][1];
		if ($type === LOAD_RELEASE) {
			$this->assertCount(2, $component['serverfiles'][$type], 'Test that the component of \'plugin2\' contains two serverfiles');
			$this->assertEquals('php/plugin.plugin2.php', $component['serverfiles'][$type][0]['file'], 'Test that the \'file\' property is \'plugin.plugin2.php\'');
			$this->assertEquals(TYPE_PLUGIN, $component['serverfiles'][$type][0]['type'], 'Test that the \'type\' property is \'plugin\'');
			$this->assertEquals(LOAD_RELEASE, $component['serverfiles'][$type][0]['load'], 'Test that the \'load\' property is \'release\'');
			$this->assertEmpty($component['serverfiles'][$type][0]['module'], 'Test that the \'module\' property is empty');
			$this->assertEquals('php/class.pluginplugin2module.php', $component['serverfiles'][$type][1]['file'], 'Test that the \'file\' property is \'class.pluginplugin2module.php\'');
			$this->assertEquals(TYPE_MODULE, $component['serverfiles'][$type][1]['type'], 'Test that the \'type\' property is \'module\'');
			$this->assertEquals(LOAD_RELEASE, $component['serverfiles'][$type][1]['load'], 'Test that the \'load\' property is \'release\'');
			$this->assertEquals('pluginplugin2module', $component['serverfiles'][$type][1]['module'], 'Test that the \'module\' property is \'pluginplugin2module\'');
		} else {
			$this->assertEmpty($config['serverfiles'][$type], 'Test that the component of \'plugin2\' doesn\'t contain serverfiles');
		}
		$this->assertCount(1, $component['clientfiles'][$type], 'Test that the component of \'plugin2\' contains one clientfiles');
		$this->assertEquals($type, $component['clientfiles'][$type][0]['load'], 'Test that the \'load\' property is correct');
		if ($type == LOAD_RELEASE) {
			$this->assertEquals('js/plugin2.js', $component['clientfiles'][$type][0]['file'], 'Test that the \'file\' property is \'plugin2.js\'');
		} else if ($type == LOAD_DEBUG) {
			$this->assertEquals('js/plugin2-debug.js', $component['clientfiles'][$type][0]['file'], 'Test that the \'file\' property is \'plugin2-debug.js\'');
		} else {
			$this->assertEquals('js/Plugin2.js', $component['clientfiles'][$type][0]['file'], 'Test that the \'file\' property is \'Plugin2.js\'');
		}
		$this->assertArrayNotHasKey($type, $config['resourcefiles'], 'Test that the config component of \'plugin2\' doesn\'t contain resourcefiles');

		// Test the 'plugin2' plugin
		$this->assertArrayHasKey('plugin2', $GLOBALS['PluginManager']->plugins, 'Test that the \'plugin2\' plugindata was loaded');
		$plugin = $GLOBALS['PluginManager']->plugins['plugin2'];
		$this->assertEquals('plugin2', $plugin->getPluginName(), 'Test that the plugin the \'pluginname\' is \'plugin2\'');
		$this->assertFalse($plugin->getSessionData(), 'Test that the plugin has the \'sessionData\' array');

		// Test the 'plugin2' modules
		$this->assertArrayHasKey('pluginplugin2module', $GLOBALS['PluginManager']->modules, 'Test that the \'pluginplugin2module\' module was registered');
		$this->assertEquals('class.pluginplugin2module.php', basename($GLOBALS['PluginManager']->modules['pluginplugin2module']), 'Test that correct module file is registered');
	}

	/**
	 * Test if the XML will not be read when a particular plugin is disabled
	 * @dataProvider providerLoaderTypes
	 */
	public function testInitDisabledPluginFiles($type)
	{
		$GLOBALS['PluginManager'] = new PluginManager(true);
		$GLOBALS['PluginManager']->detectPlugins('plugin2');
		$GLOBALS['PluginManager']->initPlugins($type);

		$this->assertFalse($GLOBALS['PluginManager']->pluginExists('plugin2'), 'Test that the \'plugin2\' plugindata was not loaded');
		$this->assertTrue($GLOBALS['PluginManager']->pluginExists('plugin1'), 'Test that the \'plugin1\' plugindata was loaded');
	}

	/**
	 * Test if the correct client files can be loaded
	 * @dataProvider providerLoaderTypes
	 */
	public function testLoadClientFiles($type)
	{
		$GLOBALS['PluginManager'] = new PluginManager(true);
		$GLOBALS['PluginManager']->detectPlugins();

		$files = $GLOBALS['PluginManager']->getClientFiles($type);
		$basedir = PATH_PLUGIN_DIR . '/' . 'plugin2' . '/' . 'js' . '/';

		if ($type === LOAD_RELEASE) {
			$this->assertTrue(in_array($basedir . 'plugin2.js', $files), 'Test that the release clientfile is correctly loaded');
			$this->assertFalse(in_array($basedir . 'plugin2-debug.js', $files), 'Test that the debug clientfile is not loaded');
			$this->assertFalse(in_array($basedir . 'Plugin2.js', $files), 'Test that the source file is not loaded');
		} else if ($type === LOAD_DEBUG) {
			$this->assertFalse(in_array($basedir . 'plugin2.js', $files), 'Test that the release clientfile is not loaded');
			$this->assertTrue(in_array($basedir . 'plugin2-debug.js', $files), 'Test that the debug clientfile is correctly loaded');
			$this->assertFalse(in_array($basedir . 'Plugin2.js', $files), 'Test that the source clientfile is not loaded');
		} else if ($type === LOAD_SOURCE) {
			$this->assertFalse(in_array($basedir . 'plugin2.js', $files), 'Test that the release clientfile is not loaded');
			$this->assertFalse(in_array($basedir . 'plugin2-debug.js', $files), 'Test that the debug clientfile is not loaded');
			$this->assertTrue(in_array($basedir . 'Plugin2.js', $files), 'Test that the source clientfile is correctly loaded');
		}
	}

	/**
	 * Test if the correct server files can be loaded
	 * @dataProvider providerLoaderTypes
	 */
	public function testLoadServerFiles($type)
	{
		$GLOBALS['PluginManager'] = new PluginManager(true);
		$GLOBALS['PluginManager']->detectPlugins();

		$files = $GLOBALS['PluginManager']->getServerFiles('plugin2', $type);
		$basedir = PATH_PLUGIN_DIR . '/' . 'plugin2' . '/' . 'php' . '/';

		$this->assertCount(3, $files, 'Test that 3 serverfiles are returned');
		$this->assertTrue(in_array($basedir . 'plugin.plugin2.php', $files['server']), 'Test that the serverfile is correctly loaded');
	}

	/**
	 * Test if the correct resource files can be loaded
	 * @dataProvider providerLoaderTypes
	 */
	public function testLoadResourceFiles($type)
	{
		$GLOBALS['PluginManager'] = new PluginManager(true);
		$GLOBALS['PluginManager']->detectPlugins();

		$files = $GLOBALS['PluginManager']->getResourceFiles($type);
		$basedir = PATH_PLUGIN_DIR . '/' . 'plugin3' . '/' . 'resources' . '/' . 'css' . '/';

		if ($type === LOAD_RELEASE) {
			$this->assertTrue(in_array($basedir . 'plugin3.css', $files), 'Test that the release/debug resourcefile is correctly loaded');
			$this->assertFalse(in_array($basedir . 'plugin3-styles.css', $files), 'Test that the source resourcefile is not loaded');
		} else if ($type === LOAD_DEBUG) {
			$this->assertTrue(in_array($basedir . 'plugin3.css', $files), 'Test that the release/debug resourcefile is correctly loaded');
			$this->assertFalse(in_array($basedir . 'plugin3-styles.css', $files), 'Test that the source file is not loaded');
		} else if ($type === LOAD_SOURCE) {
			$this->assertFalse(in_array($basedir . 'plugin3.css', $files), 'Test that the release/debug file is not loaded');
			$this->assertTrue(in_array($basedir . 'plugin3-styles.css', $files), 'Test that the source resourcefile is not loaded');
		}
	}

	/**
	 * Data provider for the different Load types which are available.
	 * The first argument to the test cases which use this provider is the type
	 */
	public function providerLoaderTypes()
	{
		return array(
			array(LOAD_RELEASE),
			array(LOAD_DEBUG),
			array(LOAD_SOURCE),
		);
	}
}

?>
