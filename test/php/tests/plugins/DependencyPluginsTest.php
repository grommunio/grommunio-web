<?php
require_once('classes/KopanoUser.php');
require_once('classes/TestUser.php');
require_once('classes/KopanoTest.php');

/**
 * DependencyPluginsTest
 *
 * Tests loading the plugins which have dependencies
 */
class DependencyPluginsTest extends KopanoTest {

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
	 * Test if the plugins from the 'test-dependencies' folder has correctly been loaded.
	 * These are the plugins with correct dependencies
	 */
	public function testLoadDependencyPluginsResult()
	{
		$GLOBALS['PluginManager'] = new PluginManager(true);
		$GLOBALS['PluginManager']->pluginpath = $this->base . DIRECTORY_SEPARATOR . 'test-dependencies';
		$GLOBALS['PluginManager']->detectPlugins();
		$GLOBALS['PluginManager']->initPlugins(LOAD_DEBUG);

		$this->assertCount(6, $GLOBALS['PluginManager']->pluginorder, 'Test that all plugins have been loaded');
		foreach ($GLOBALS['PluginManager']->pluginorder as $plugin) {
			$this->assertArrayHasKey($plugin, $GLOBALS['PluginManager']->plugindata, 'Test that the plugindata contains the plugin \'' . $plugin . '\'');
		}
	}

	/*
	 * Test if the clientfiles from the 'test-dependencies' folder can be correctlty obtained.
	 * These are the plugins with correct dependencies, the dependencies are as follows
	 *	- Plugin 01 depends on nothing
	 *	- Plugin 02 depends on Plugin 03 and 05
	 *	- Plugin 03 depends on nothing
	 *	- Plugin 04 depends on Plugin 02
	 *	- Plugin 05 depends on Plugin 03
	 *	- Plugin 06 depends on nothing
	 */
	public function testLoadDependencyPluginsClientFiles()
	{
		$GLOBALS['PluginManager'] = new PluginManager(true);
		$GLOBALS['PluginManager']->pluginpath = $this->base . DIRECTORY_SEPARATOR . 'test-dependencies';
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
		// f3 < f5 < f2 < f4
		// And f1 and f6 are freely ordered
		$this->assertNotFalse($f1, 'Test that Plugin 01 is ordered');
		$this->assertGreaterThan($f3, $f2, 'Test that Plugin 02 is ordered after Plugin 03');
		$this->assertGreaterThan($f3, $f2, 'Test that Plugin 02 is ordered after Plugin 05');
		$this->assertNotFalse($f3, 'Test that Plugin 03 is ordered');
		$this->assertGreaterThan($f2, $f4, 'Test that Plugin 04 is ordered after Plugin 02');
		$this->assertGreaterThan($f3, $f5, 'Test that Plugin 05 is ordered after Plugin 03');
		$this->assertNotFalse($f6, 'Test that Plugin 06 is ordered');
	}

	/*
	 * Test if the plugins from the 'test-unmet-dependencies' folder has correctly been loaded.
	 * These are the plugins with some unmet dependencies
	 */
	public function testLoadUnmetDependencyPluginsResult()
	{
		$GLOBALS['PluginManager'] = new PluginManager(true);
		$GLOBALS['PluginManager']->pluginpath = $this->base . DIRECTORY_SEPARATOR . 'test-unmet-dependencies';
		$GLOBALS['PluginManager']->detectPlugins();
		$GLOBALS['PluginManager']->initPlugins(LOAD_DEBUG);

		$this->assertCount(4, $GLOBALS['PluginManager']->pluginorder, 'Test that all plugins have been loaded');
		foreach ($GLOBALS['PluginManager']->pluginorder as $plugin) {
			$this->assertArrayHasKey($plugin, $GLOBALS['PluginManager']->plugindata, 'Test that the plugindata contains the plugin \'' . $plugin . '\'');
		}
	}

	/*
	 * Test if the clientfiles from the 'test-unmet-dependencies' folder can be correctlty obtained.
	 * These are the plugins with some unmet dependencies, the dependencies are as follows
	 *	- Plugin 01 depends on nothing
	 *	- Plugin 02 depends on Plugin 03 and 05
	 *	- Plugin 03 depends on Plugin 01
	 *	- Plugin 04 depends on Plugin 03
	 *	- Plugin 05 depends on Plugin 07
	 *	- Plugin 06 depends on nothing
	 */
	public function testLoadUnmetDependencyPluginsClientFiles()
	{
		$GLOBALS['PluginManager'] = new PluginManager(true);
		$GLOBALS['PluginManager']->pluginpath = $this->base . DIRECTORY_SEPARATOR . 'test-unmet-dependencies';
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
		// f1 < f3 < f4
		// And f6 is freely ordered
		// And f2 and f5 cannot be ordered
		$this->assertNotFalse($f1, 'Test that Plugin 01 is ordered');
		$this->assertFalse($f2, 'Test that Plugin 02 is not ordered');
		$this->assertGreaterThan($f1,  $f3, 'Test that Plugin 03 is ordered after Plugin 01');
		$this->assertGreaterThan($f3, $f4, 'Test that Plugin 04 is ordered after Plugin 03');
		$this->assertFalse($f5, 'Test that Plugin 05 is not ordered');
		$this->assertNotFalse($f6, 'Test that Plugin 06 is ordered');
	}

	/*
	 * Test if the plugins from the 'test-circular-dependencies' folder has correctly been loaded.
	 * These are the plugins with some circular dependencies
	 */
	public function testLoadCircularDependencyPluginsResult()
	{
		$GLOBALS['PluginManager'] = new PluginManager(true);
		$GLOBALS['PluginManager']->pluginpath = $this->base . DIRECTORY_SEPARATOR . 'test-circular-dependencies';
		$GLOBALS['PluginManager']->detectPlugins();
		$GLOBALS['PluginManager']->initPlugins(LOAD_DEBUG);

		$this->assertCount(2, $GLOBALS['PluginManager']->pluginorder, 'Test that all plugins have been loaded');
		foreach ($GLOBALS['PluginManager']->pluginorder as $plugin) {
			$this->assertArrayHasKey($plugin, $GLOBALS['PluginManager']->plugindata, 'Test that the plugindata contains the plugin \'' . $plugin . '\'');
		}
	}

	/*
	 * Test if the clientfiles from the 'test-circular-dependencies' folder can be correctlty obtained.
	 * These are the plugins with some circular dependencies, the dependencies are as follows
	 *	- Plugin 01 depends on Plugin 02
	 *	- Plugin 02 depends on Plugin 03 and 05
	 *	- Plugin 03 depends on nothing
	 *	- Plugin 04 depends on Plugin 01
	 *	- Plugin 05 depends on Plugin 04
	 *	- Plugin 06 depends on nothing
	 */
	public function testLoadCircularDependencyPluginsClientFiles()
	{
		$GLOBALS['PluginManager'] = new PluginManager(true);
		$GLOBALS['PluginManager']->pluginpath = $this->base . DIRECTORY_SEPARATOR . 'test-circular-dependencies';
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
		// f3 and f6 are freely ordered
		// And f1, f2, f4 and f5 cannot be ordered
		$this->assertFalse($f1, 'Test that Plugin 01 is not ordered');
		$this->assertFalse($f2, 'Test that Plugin 02 is not ordered');
		$this->assertNotFalse($f3, 'Test that Plugin 03 is ordered');
		$this->assertFalse($f4, 'Test that Plugin 04 is not ordered');
		$this->assertFalse($f5, 'Test that Plugin 05 is not ordered');
		$this->assertNotFalse($f6, 'Test that Plugin 06 is ordered');
	}
}

?>
