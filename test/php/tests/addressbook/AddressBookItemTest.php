<?php
require_once('classes/grommunioUser.php');
require_once('classes/AddressBookUser.php');
require_once('classes/ContactUser.php');
require_once('classes/TestData.php');
require_once('classes/grommunioTest.php');
require_once('classes/Util.php');

/**
 * AddressBookItemTest
 *
 * Tests opening Address Book items
 */
class AddressBookItemTest extends grommunioTest {

	/**
	 * The user for which we will open the addressbook
	 */
	private $user;

	/**
	 * During setup we create the user, and clear the shared stores settings
	 */
	protected function setUp()
	{
		parent::setUp();

		$this->user = $this->addUser(new AddressBookUser(new grommunioUser(GROMMUNIO_USER1_NAME, GROMMUNIO_USER1_PASSWORD)));
		$this->cleanFolders = false;
	}

	/*
	 * Test the returned object when a MAPI_MAILUSER has been opened
	 */
	public function testOpenMailUserResults()
	{
		$response = $this->user->loadGlobalAddressBook();

		$props = Util::pluckFromObject($response['list']['item'], 'props');
		$user = Util::searchInArray($props, 'display_name', GROMMUNIO_USER1_DISPLAY_NAME);

		$item = $this->user->openABItem(hex2bin($user['entryid']));

		$this->assertArrayHasKey('item', $item, 'Test that the returned item has an \'item\' array');
		$this->assertArrayHasKey('item', $item['item'], 'Test that the \'item\' array has an \'item\' object');

		$item = $item['item']['item'];

		$this->assertEquals($user['entryid'], $item['entryid'], 'Test that the entryid of the returned object matches the requested entryid');

		$this->assertArrayHasKey('props', $item, 'Test that the returned object contains the \'props\' object');
		$this->assertEquals(MAPI_MAILUSER, $item['props']['object_type'], 'Test that the \'object_type\' is MAPI_MAILUSER');
		$this->assertEquals(GROMMUNIO_USER1_NAME, $item['props']['account'], 'Test that the \'account\' property is correctly set');
		$this->assertEquals(GROMMUNIO_USER1_DISPLAY_NAME, $item['props']['display_name'], 'Test that the \'display_name\' is correctly set');

		$this->assertArrayHasKey('ems_ab_proxy_addresses', $item, 'Test that the returned object contains the \'ems_ab_proxy_addresses\' substore');
		$this->assertArrayHasKey('item', $item['ems_ab_proxy_addresses'], 'Test that the \'ems_ab_proxy_addresses\' substore contains the \'item\' array');
		$this->assertCount(3, $item['ems_ab_proxy_addresses']['item'], 'Test that there are items inside the \'ems_ab_proxy_addresses\' substore');
		$this->assertEquals('SMTP:' . GROMMUNIO_USER1_EMAIL_ADDRESS, $item['ems_ab_proxy_addresses']['item'][0]['address'], 'Test that the email address is correctly listed');
	}

	/*
	 * Test the returned object when a MAPI_DISTLIST has been opened
	 */
	public function testOpenDistListResults()
	{
		$response = $this->user->loadGlobalAddressBook();

		$props = Util::pluckFromObject($response['list']['item'], 'props');
		$user = Util::searchInArray($props, 'display_name', GROMMUNIO_GROUP1_NAME);

		$item = $this->user->openABItem(hex2bin($user['entryid']));

		$this->assertArrayHasKey('item', $item, 'Test that the returned item has an \'item\' array');
		$this->assertArrayHasKey('item', $item['item'], 'Test that the \'item\' array has an \'item\' object');

		$item = $item['item']['item'];

		$this->assertEquals($user['entryid'], $item['entryid'], 'Test that the entryid of the returned object matches the requested entryid');

		$this->assertArrayHasKey('props', $item, 'Test that the returned object contains the \'props\' object');
		$this->assertEquals(MAPI_DISTLIST, $item['props']['object_type'], 'Test that the \'object_type\' is MAPI_DISTLIST');
		$this->assertEquals(GROMMUNIO_GROUP1_NAME, $item['props']['account'], 'Test that the \'account\' property is correctly set');
		$this->assertEquals(GROMMUNIO_GROUP1_DISPLAY_NAME, $item['props']['display_name'], 'Test that the \'display_name\' is correctly set');

		$this->assertArrayHasKey('members', $item, 'Test that the returned object contains the \'members\' substore');
		$this->assertArrayHasKey('item', $item['members'], 'Test that the \'members\' substore contains the \'item\' array');
		$this->assertNotEmpty($item['members']['item'], 'Test that there are items inside the \'members\' substore');
		$this->assertArrayHasKey('props', $item['members']['item'][0], 'Test that the properties of the items in the \'members\' substore are wrapped in a \'props\' object');

		$this->assertArrayHasKey('ems_ab_proxy_addresses', $item, 'Test that the returned object contains the \'ems_ab_proxy_addresses\' substore');
		$this->assertArrayHasKey('item', $item['ems_ab_proxy_addresses'], 'Test that the \'ems_ab_proxy_addresses\' substore contains the \'item\' array');
		$this->assertCount(1, $item['ems_ab_proxy_addresses']['item'], 'Test that there are items inside the \'ems_ab_proxy_addresses\' substore');
		$this->assertEquals('SMTP:' . GROMMUNIO_GROUP1_EMAIL_ADDRESS, $item['ems_ab_proxy_addresses']['item'][0]['address'], 'Test that the email address is correctly listed');
	}
}

?>
