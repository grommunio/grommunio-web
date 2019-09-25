<?php

// Include main configuration file which
// will setup the include paths correctly.
require("config.php");
require("defaults.php");

// Include the files
require("server/includes/mapi/mapi.util.php");
require("server/includes/mapi/mapicode.php");
require("server/includes/mapi/mapidefs.php");
require("server/includes/mapi/mapitags.php");
require("server/includes/mapi/mapiguid.php");
require("server/includes/mapi/class.baseexception.php");
require("server/includes/mapi/class.mapiexception.php");
require("server/includes/mapi/class.meetingrequest.php");

require("server/includes/exceptions/class.ZarafaException.php");
require("server/includes/exceptions/class.ZarafaErrorException.php");

require("server/includes/util.php");
require("server/includes/gettext.php");

require("server/includes/core/class.conversion.php");
require("server/includes/core/class.mapisession.php");
require("server/includes/core/class.entryid.php");

include("server/includes/core/constants.php");

include("server/includes/core/class.state.php");
include("server/includes/core/class.attachmentstate.php");
include("server/includes/core/class.jsonrequest.php");
include("server/includes/notifiers/class.notifier.php");
include("server/includes/modules/class.module.php");
include("server/includes/modules/class.listmodule.php");
include("server/includes/modules/class.itemmodule.php");
include("server/includes/core/class.dispatcher.php");
include("server/includes/core/class.operations.php");
include("server/includes/core/class.bus.php");
include("server/includes/core/class.settings.php");
include("server/includes/core/class.language.php");
include("server/includes/core/class.pluginmanager.php");
include("server/includes/core/class.plugin.php");
include("server/includes/core/class.todolist.php");
include("server/includes/core/class.freebusy.php");
include('server/includes/core/class.log.php');
include('server/includes/logger/class.baselogger.php');
include('server/includes/logger/class.filelog.php');
/**
 * KopanoTest
 *
 * Superclass of test case classes where we can initialize/destroy $GLOBAL elements
 */
abstract class KopanoTest extends PHPUnit_Framework_TestCase {

	/**
	 * The array of users which have been instantiated for
	 * this test.
	 */
	private $users;

	/**
	 * The array of groups which have been instantiated for
	 * this test.
	 */
	private $groups;

	/**
	 * Should folders be removed
	 */
	protected $cleanFolders = true;

	/**
	 * Constructs a test case with the given name.
	 *
	 * @param  string $name
	 * @param  array  $data
	 * @param  string $dataName
	 * @access public
	 */		
	public function __construct($name = NULL, array $data = array(), $dataName = '')
	{
		parent::__construct($name, $data, $dataName);
	}

	/**
	 * Sets up the fixture, for example, open a network connection.
	 * This method is called before a test is executed.
	 *
	 * @access protected
	 */
	protected function setUp()
	{
		// Create the users/groups array which will be operating during this test
		$this->users = array();
		$this->groups = array();

		// Create tmp directory
		$this->setupTemp();

		// Create plugin configuration directory
		$this->setupPlugins();
	}

	/**
	 * Tears down the fixture, for example, close a network connection.
	 * This method is called after a test is executed.
	 *
	 * @access protected
	 */
	protected function tearDown()
	{
		$this->cleanTemp();
		$this->cleanPlugins();

		$this->cleanAllUsers();
	}

	/**
	 * Creates the temp directory which will be used to save the state files in.
	 * The folder which will be created is defined in TMP_PATH
	 *
	 * @access private
	 */
	private function setupTemp()
	{
		if (is_dir(TMP_PATH)) {
			print('ERROR: Cannot create ' . TMP_PATH . ' as it already exists.' . PHP_EOL);
		} else {
			mkdir(TMP_PATH, 0755, true /* recursive */);
		}
	}

	/**
	 * Cleans the temp directory by removing all files, if the folder is empty,
	 * the folder will be deleted as well.
	 *
	 * @access private
	 */
	private function cleanTemp()
	{
		// Clean tmp folder, we only clear state (session subfolder) and attachment folder
		// explicitely. All subclasses are in chared of cleaning other files they created.
		// To clean recently created files instantly we are passing -1
		if(isset($GLOBALS['attachment_state'])) {
			$GLOBALS['attachment_state']->clean(-1);

			if(is_dir(TMP_PATH . DIRECTORY_SEPARATOR . 'attachments')) {
				rmdir(TMP_PATH . DIRECTORY_SEPARATOR . 'attachments');
			}
		}

		if(isset($GLOBALS['state'])) {
			$GLOBALS['state']->clean(-1);

			if(is_dir(TMP_PATH . DIRECTORY_SEPARATOR . 'session')) {
				rmdir(TMP_PATH . DIRECTORY_SEPARATOR . 'session');
			}
		}

		// remove entire temporary directory
		rmdir(TMP_PATH);
	}

	/**
	 * Checks in the Plugin configuration directory (PATH_PLUGIN_CONFIG_DIR) to see
	 * if there are any plugins not explicitely configured. If there are, those plugins
	 * are configured using the default values from the main plugins directory (PATH_PLUGIN_DIR)
	 * using a symlink to that folder.
	 *
	 * @access private
	 */
	private function setupPlugins()
	{
		// Check which Plugin configuration files we are missing, and initialize those
		if (PATH_PLUGIN_CONFIG_DIR !== PATH_PLUGIN_DIR && is_dir(PATH_PLUGIN_CONFIG_DIR) && is_dir(PATH_PLUGIN_DIR)) {
			$plugins = opendir(PATH_PLUGIN_DIR);

			while ($plugin = readdir($plugins)) {
				$realConfig = realpath(PATH_PLUGIN_DIR . '/' . $plugin);
				$testConfig = PATH_PLUGIN_CONFIG_DIR . '/' . $plugin;

				if (is_dir($realConfig) && !is_dir($testConfig)) {
					if (is_file($testConfig)) {
						print('ERROR: Cannot create ' . $testConfig . ' as it already exists.' . PHP_EOL);
					} else {
						symlink($realConfig, $testConfig);
					}
				}
			}
		}
	}

	/**
	 * Cleans up all default Plugin configurations which were created during setupPlugins.
	 *
	 * @access private
	 */
	private function cleanPlugins()
	{
		// During setUp we might have created some symlinks to the plugin configuration
		// files. Time to remove those again.
		if (PATH_PLUGIN_CONFIG_DIR !== PATH_PLUGIN_DIR && is_dir(PATH_PLUGIN_CONFIG_DIR) && is_dir(PATH_PLUGIN_DIR)) {
			$plugins = opendir(PATH_PLUGIN_CONFIG_DIR);

			while ($plugin = readdir($plugins)) {
				$testConfig = PATH_PLUGIN_CONFIG_DIR . '/' . $plugin;

				if (is_link($testConfig)) {
					unlink($testConfig);
				}
			}
		}
	}

	/**
	 * Register a user to this test system
	 * @param TestUser $user The user to register
	 */
	protected function addUser($user)
	{
		$this->users[] = $user;
		return $user;
	}

	/**
	 * Register a group to this test system
	 * @param TestGroup $group The group to register
	 */
	protected function addGroup($group)
	{
		$this->groups[] = $group;
		return $group;
	}

	/**
	 * Call TestUser#cleanFolders on all users which were registered by addUser.
	 */
	private function cleanAllUsers()
	{
		// Quite annoying, but cleaning the folders could cause races against the Spooler
		// which is busy sending the mails from the outbox. However, cleaning the folders
		// multiple times doesn't help, neither seems changing the order in which the folders
		// are being cleaned. So as a last resort, we now simply sleep for 0.5 seconds to give
		// the spooler some time to do its work.
		//
		// If a user is a MailUser, we probably send emails so sleep for 0.5 seconds.
		if(count($this->users) > 0 &&  $this->users[0] instanceof MailUser) {
			sleep(0.5);
		}

		$cache = [];
		foreach ($this->users as $user) {
			if (isset($cache[$user->getUserName()])) {
				continue;
			}

			if ($this->cleanFolders) {
				$user->cleanFolders();
			}
			$user->cleanSettings();
			$user->logout();
			$cache[$user->getUserName()] = true;
		}
	}

	/**
	 * Asserts the number of elements of an array.
	 * @param integer $expectedCount
	 * @param mixed $haystack
	 * @param string $message
	 */
	public static function assertCount($expectedCount, $haystack, $message = '')
	{
		if(!is_array($haystack)){
			$haystack = array($haystack);
		}

		parent::assertCount($expectedCount, $haystack, $message = '');
	}

	/**
	 * Determine if the entryids are equal
	 *
	 * @param mixed $expected
	 * @param mixed $actual
	 * @param string $message
	 */
	protected function assertEntryIdEquals($expected, $actual, $message = '')
	{
		$this->assertTrue($GLOBALS["entryid"]->compareEntryIds($expected, $actual), $message);
	}

	/**
	 * Determine if the store entryids are equal
	 *
	 * @param mixed $expected
	 * @param mixed $actual
	 * @param string $message
	 */
	protected function assertStoreEntryIdEquals($expected, $actual, $message = '')
	{
		$this->assertTrue($GLOBALS["entryid"]->compareStoreEntryIds($expected, $actual), $message);
	}

	/**
	 * Determine if the expected value is equals to actual value after masking actual value with expected value.
	 *
	 * @param mixed $expected
	 * @param mixed $actual
	 * @param string $message
	 */
	protected function assertMaskEquals($expected, $actual, $message = '')
	{
		$this->assertEquals($expected, $actual & $expected, $message);
	}

	/**
	 * Determine if the expected value does not equals to actual value after masking actual value with expected value.
	 *
	 * @param mixed $expected
	 * @param mixed $actual
	 * @param string $message
	 */
	protected function assertMaskNotEquals($expected, $actual, $message = '')
	{
		$this->assertNotEquals($expected, $actual & $expected, $message);
	}

	/**
	 * Data provider to check search works with unicode characters and special characters
	 * - first argument provides subject of the contact that should be saved
	 * - second argument provides search keywords to use saved contact
	 */
	public function providerSpecialCharacterProps()
	{
		return array(
			array('some junk data surrounding laß the actual Thümmel unicode strings', 'Thümmel'),
			array('some junk data surrounding laß the actual Thümmel unicode strings', 'laß'),
			array('Frédéric François', 'François'),
			array('Sîne klâwen durh die wolken sint geslagen', 'klâwen'),
			array('Björk Guðmundsdóttir', 'Guðmundsdóttir'),
			array('Sinéad O\'Connor', 'Sinéad'),
			array('Trịnh Công Sơn', 'Công'),
			array('Đorđe Balašević', 'Đorđe'),
			array('Cron <root@intranet> /root/bin/backup/kopano.customer.de', 'Cron customer'),
			array('Cron <root@intranet> /root/bin/backup/kopano.customer.de', 'cron CUSTOMER'),
			array('Cron <root@intranet> /root/bin/backup/kopano.customer.de', 'kopano.de'),
			array('Cron <root@intranet> /root/bin/backup/kopano.customer.de', 'customer'),
			array('Cron <root@intranet> /root/bin/backup/kopano.customer.de', 'kopano customer'),
			array('Cron <root@intranet> /root/bin/backup/kopano.customer.de', 'root@intranet'),
			array('Cron <root@intranet> /root/bin/backup/kopano.customer.de', 'backup'),
			array('Cron <root@intranet> /root/bin/backup/kopano.customer.de', '/root/bin/backup'),
			array('TRORDER NR.52177 CHANGED 2002-EXP.', '52177'),
			array('TRORDER NR.52177 CHANGED 2002-EXP.', 'NR 52177'),
			array('TRORDER NR.52177 CHANGED 2002-EXP.', '2002 52177'),
			array('TRORDER NR.52177 CHANGED 2002-EXP.', '52177 20022222', false),
			array('TRORDER NR.52177 CHANGED 2002-EXP.', 'word NR.52177', false),
			array('some string including ~ and, signs', 'including'),
			array('some string including ~ and, signs', 'and signs'),
			array('dummy@kopano.com', 'kopano.com'),
			array('dummy@kopano.com', 'dummy'),
			array('dummy@kopano.com', 'micheal.schofield@kopano.com', false),
			array('micheal.schofield@kopano.com', 'micheal.schofield@kopano.co.eu', false)
		);
	}
}

?>
