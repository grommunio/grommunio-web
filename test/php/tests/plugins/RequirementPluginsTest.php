<?php
require_once('classes/KopanoUser.php');
require_once('classes/TestUser.php');
require_once('classes/KopanoTest.php');

/**
 * RequirementPluginsTest
 *
 * Tests loading the plugins which have requirements
 */
class RequirementPluginsTest extends KopanoTest {

	/**
	 * The default user.
	 */
	private $user;

	/**
	 * The base folder in which the various test setups can be found
	 */
	private $base;

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

		$this->base = dirname(__FILE__) . DIRECTORY_SEPARATOR . 'manifests';

		$this->cleanFolders = false;
	}

	/*
	 * Test if the plugins from the 'test-requirements' folder has correctly been loaded.
	 * These are the plugins with correct requirements
	 */
	public function testLoadRequirementPluginsResult()
	{
		$GLOBALS['PluginManager'] = new PluginManager(true);
		$GLOBALS['PluginManager']->pluginpath = $this->base . DIRECTORY_SEPARATOR . 'test-requirements';
		$GLOBALS['PluginManager']->detectPlugins();
		$GLOBALS['PluginManager']->initPlugins(LOAD_DEBUG);

		$this->assertCount(6, $GLOBALS['PluginManager']->pluginorder, 'Test that all plugins have been loaded');
		foreach ($GLOBALS['PluginManager']->pluginorder as $plugin) {
			$this->assertArrayHasKey($plugin, $GLOBALS['PluginManager']->plugindata, 'Test that the plugindata contains the plugin \'' . $plugin . '\'');
		}
	}

	/*
	 * Test if the clientfiles from the 'test-requirements' folder can be correctlty obtained.
	 * These are the plugins with correct requirements, the requirements are as follows
	 *	- Plugin 01 requires nothing
	 *	- Plugin 02 requires Plugin 03 and 05
	 *	- Plugin 03 requires nothing
	 *	- Plugin 04 requires Plugin 02
	 *	- Plugin 05 requires Plugin 03
	 *	- Plugin 06 requires nothing
	 */
	public function testLoadRequirementPluginsClientFiles()
	{
		$GLOBALS['PluginManager'] = new PluginManager(true);
		$GLOBALS['PluginManager']->pluginpath = $this->base . DIRECTORY_SEPARATOR . 'test-requirements';
		$GLOBALS['PluginManager']->detectPlugins();
		$GLOBALS['PluginManager']->initPlugins(LOAD_DEBUG);

		$files = $GLOBALS['PluginManager']->getClientFiles(LOAD_DEBUG);

		$f1 = array_search($GLOBALS['PluginManager']->pluginpath . DIRECTORY_SEPARATOR . 'plugin01/js/p1-debug-file.js', $files);
		$f2 = array_search($GLOBALS['PluginManager']->pluginpath . DIRECTORY_SEPARATOR . 'plugin02/js/p2-debug-file.js', $files);
		$f3 = array_search($GLOBALS['PluginManager']->pluginpath . DIRECTORY_SEPARATOR . 'plugin03/js/p3-debug-file.js', $files);
		$f4 = array_search($GLOBALS['PluginManager']->pluginpath . DIRECTORY_SEPARATOR . 'plugin04/js/p4-debug-file.js', $files);
		$f5 = array_search($GLOBALS['PluginManager']->pluginpath . DIRECTORY_SEPARATOR . 'plugin05/js/p5-debug-file.js', $files);
		$f6 = array_search($GLOBALS['PluginManager']->pluginpath . DIRECTORY_SEPARATOR . 'plugin06/js/p6-debug-file.js', $files);

		// From this follows that the dependency order is:
		// f1, f2, f3, f4, f5 and f6 are freely ordered
		$this->assertNotFalse($f1, 'Test that Plugin 01 is ordered');
		$this->assertNotFalse($f2, 'Test that Plugin 02 is ordered');
		$this->assertNotFalse($f3, 'Test that Plugin 03 is ordered');
		$this->assertNotFalse($f4, 'Test that Plugin 04 is ordered');
		$this->assertNotFalse($f5, 'Test that Plugin 05 is ordered');
		$this->assertNotFalse($f6, 'Test that Plugin 06 is ordered');
	}

	/*
	 * Test if the plugins from the 'test-unmet-requirements' folder has correctly been loaded.
	 * These are the plugins with some unmet requirements
	 */
	public function testLoadUnmetRequirementPluginsResult()
	{
		$GLOBALS['PluginManager'] = new PluginManager(true);
		$GLOBALS['PluginManager']->pluginpath = $this->base . DIRECTORY_SEPARATOR . 'test-unmet-requirements';
		$GLOBALS['PluginManager']->detectPlugins();
		$GLOBALS['PluginManager']->initPlugins(LOAD_DEBUG);

		$this->assertCount(4, $GLOBALS['PluginManager']->pluginorder, 'Test that all plugins have been loaded');
		foreach ($GLOBALS['PluginManager']->pluginorder as $plugin) {
			$this->assertArrayHasKey($plugin, $GLOBALS['PluginManager']->plugindata, 'Test that the plugindata contains the plugin \'' . $plugin . '\'');
		}
	}

	/*
	 * Test if the clientfiles from the 'test-unmet-requirements' folder can be correctlty obtained.
	 * These are the plugins with some unmet requirements, the requirements are as follows
	 *	- Plugin 01 requires nothing
	 *	- Plugin 02 requires Plugin 03 and 05
	 *	- Plugin 03 requires Plugin 01
	 *	- Plugin 04 requires Plugin 03
	 *	- Plugin 05 requires Plugin 07
	 *	- Plugin 06 requires nothing
	 */
	public function testLoadUnmetRequirementPluginsClientFiles()
	{
		$GLOBALS['PluginManager'] = new PluginManager(true);
		$GLOBALS['PluginManager']->pluginpath = $this->base . DIRECTORY_SEPARATOR . 'test-unmet-requirements';
		$GLOBALS['PluginManager']->detectPlugins();
		$GLOBALS['PluginManager']->initPlugins(LOAD_DEBUG);

		$files = $GLOBALS['PluginManager']->getClientFiles(LOAD_DEBUG);

		$f1 = array_search($GLOBALS['PluginManager']->pluginpath . DIRECTORY_SEPARATOR . 'plugin01/js/p1-debug-file.js', $files);
		$f2 = array_search($GLOBALS['PluginManager']->pluginpath . DIRECTORY_SEPARATOR . 'plugin02/js/p2-debug-file.js', $files);
		$f3 = array_search($GLOBALS['PluginManager']->pluginpath . DIRECTORY_SEPARATOR . 'plugin03/js/p3-debug-file.js', $files);
		$f4 = array_search($GLOBALS['PluginManager']->pluginpath . DIRECTORY_SEPARATOR . 'plugin04/js/p4-debug-file.js', $files);
		$f5 = array_search($GLOBALS['PluginManager']->pluginpath . DIRECTORY_SEPARATOR . 'plugin05/js/p5-debug-file.js', $files);
		$f6 = array_search($GLOBALS['PluginManager']->pluginpath . DIRECTORY_SEPARATOR . 'plugin06/js/p6-debug-file.js', $files);

		// From this follows that the dependency order is:
		// f1, f3, f4 and f6 are freely ordered
		// And f2 and f5 cannot be ordered
		$this->assertNotFalse($f1, 'Test that Plugin 01 is ordered');
		$this->assertFalse($f2, 'Test that Plugin 02 is not ordered');
		$this->assertNotFalse($f3, 'Test that Plugin 03 is ordered');
		$this->assertNotFalse($f4, 'Test that Plugin 04 is ordered');
		$this->assertFalse($f5, 'Test that Plugin 05 is not ordered');
		$this->assertNotFalse($f6, 'Test that Plugin 06 is ordered');
	}

	/*
	 * Test if the plugins from the 'test-circular-requirements' folder has correctly been loaded.
	 * These are the plugins with some circular requirements
	 */
	public function testLoadCircularRequirementPluginsResult()
	{
		$GLOBALS['PluginManager'] = new PluginManager(true);
		$GLOBALS['PluginManager']->pluginpath = $this->base . DIRECTORY_SEPARATOR . 'test-circular-requirements';
		$GLOBALS['PluginManager']->detectPlugins();
		$GLOBALS['PluginManager']->initPlugins(LOAD_DEBUG);

		$this->assertCount(6, $GLOBALS['PluginManager']->pluginorder, 'Test that all plugins have been loaded');
		foreach ($GLOBALS['PluginManager']->pluginorder as $plugin) {
			$this->assertArrayHasKey($plugin, $GLOBALS['PluginManager']->plugindata, 'Test that the plugindata contains the plugin \'' . $plugin . '\'');
		}
	}

	/*
	 * Test if the clientfiles from the 'test-circular-requirements' folder can be correctlty obtained.
	 * These are the plugins with some circular requirements, the requirements are as follows
	 *	- Plugin 01 requires Plugin 02
	 *	- Plugin 02 requires Plugin 03 and 05
	 *	- Plugin 03 requires nothing
	 *	- Plugin 04 requires Plugin 01
	 *	- Plugin 05 requires Plugin 04
	 *	- Plugin 06 requires nothing
	 */
	public function testLoadCircularRequirementPluginsClientFiles()
	{
		$GLOBALS['PluginManager'] = new PluginManager(true);
		$GLOBALS['PluginManager']->pluginpath = $this->base . DIRECTORY_SEPARATOR . 'test-circular-requirements';
		$GLOBALS['PluginManager']->detectPlugins();
		$GLOBALS['PluginManager']->initPlugins(LOAD_DEBUG);

		$files = $GLOBALS['PluginManager']->getClientFiles(LOAD_DEBUG);

		$f1 = array_search($GLOBALS['PluginManager']->pluginpath . DIRECTORY_SEPARATOR . 'plugin01/js/p1-debug-file.js', $files);
		$f2 = array_search($GLOBALS['PluginManager']->pluginpath . DIRECTORY_SEPARATOR . 'plugin02/js/p2-debug-file.js', $files);
		$f3 = array_search($GLOBALS['PluginManager']->pluginpath . DIRECTORY_SEPARATOR . 'plugin03/js/p3-debug-file.js', $files);
		$f4 = array_search($GLOBALS['PluginManager']->pluginpath . DIRECTORY_SEPARATOR . 'plugin04/js/p4-debug-file.js', $files);
		$f5 = array_search($GLOBALS['PluginManager']->pluginpath . DIRECTORY_SEPARATOR . 'plugin05/js/p5-debug-file.js', $files);
		$f6 = array_search($GLOBALS['PluginManager']->pluginpath . DIRECTORY_SEPARATOR . 'plugin06/js/p6-debug-file.js', $files);

		// From this follows that the dependency order is:
		// f1, f2, f3, f3, f5 and f6 are freely ordered
		$this->assertNotFalse($f1, 'Test that Plugin 01 is ordered');
		$this->assertNotFalse($f2, 'Test that Plugin 02 is ordered');
		$this->assertNotFalse($f3, 'Test that Plugin 03 is ordered');
		$this->assertNotFalse($f4, 'Test that Plugin 04 is ordered');
		$this->assertNotFalse($f5, 'Test that Plugin 05 is ordered');
		$this->assertNotFalse($f6, 'Test that Plugin 06 is ordered');
	}
}

?>
