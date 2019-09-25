<?php
require_once('classes/KopanoUser.php');
require_once('classes/AddressBookUser.php');
require_once('classes/DistlistUser.php');
require_once('classes/TestData.php');
require_once('classes/KopanoTest.php');
require_once('classes/Util.php');

/**
 * AddressBookDistlistTest
 *
 * Tests loading the Address Book contents of the Contacts containers for distlists
 */
class AddressBookDistlistTest extends KopanoTest {

	/**
	 * The user for which we will open the addressbook
	 */
	private $user;

	/**
	 * The user used for creating the distlist
	 */
	private $distlistUser;

	/**
	 * The message which will be handled
	 */
	private $message;

	/**
	 * During setup we create the user, and clear the shared stores settings
	 */
	protected function setUp()
	{
		parent::setUp();

		$this->user = $this->addUser(new AddressBookUser(new KopanoUser(KOPANO_USER1_NAME, KOPANO_USER1_PASSWORD)));
		$this->distlistUser = $this->addUser(new DistlistUser(new KopanoUser(KOPANO_USER1_NAME, KOPANO_USER1_PASSWORD)));

		$this->message = array(
			'props' => TestData::getDistlist(),
			'members' => TestData::getDistlistMembers(array(1))
		);
	}

	/**
	 * Test if the contact addressbook returns valid objects
	 */
	public function testLoadingDistlistAddressBookResults()
	{
		$this->distlistUser->saveDistlist($this->message, false);

		$response = $this->user->loadContactsAddressBook();

		$this->assertArrayHasKey('list', $response, 'Test that the response contains the \'list\' object');
		$this->assertArrayHasKey('item', $response['list'], 'Test that the response contains the \'item\' object');

		$this->assertCount(1, $response['list']['item'], 'Test that the number of items in the \'item\' array matches the number of distlists');

		$props = Util::pluckFromObject($response['list']['item'], 'props');

		$distlist = Util::searchInArray($props, 'fileas', $this->message['props']['dl_name']);

		// check for props
		$this->assertNotEmpty($distlist, 'Test that the distlist exists');
		$this->assertEquals(DT_PRIVATE_DISTLIST, $distlist['display_type'], 'Test that the distlist has the correct \'message_class\' property set');
		$this->assertEquals(MAPI_DISTLIST, $distlist['object_type'], 'Test that the distlist has the correct \'object_type\' property set');
		$this->assertEquals('MAPIPDL', $distlist['address_type'], 'Test that the distlist has the correct \'address_type\' property set');
		$this->assertEquals($this->message['props']['display_name'], $distlist['display_name'], 'Test that the distlist has the correct \'display_name\' property set');
	}

	/**
	 * Test the results when the contact addressbook is loaded with an restriction
	 * @dataProvider providerRestriction
	 */
	public function testLoadingContactDistlistAddressBookWithRestrictionResults($restriction, $allowedDistlists, $blockedDistlists)
	{
		$this->distlistUser->saveDistlist($this->message, false);

		$response = $this->user->loadContactsAddressBook($restriction);

		$this->assertArrayHasKey('list', $response, 'Test that the response contains the \'list\' object');
		$this->assertArrayHasKey('item', $response['list'], 'Test that the response contains the \'item\' object');

		$props = Util::pluckFromObject($response['list']['item'], 'props');

		$names = Util::pluckFromObject($props, 'fileas');

		foreach ($allowedDistlists as $key => $item) {
			$this->assertContains($item, $names, 'Test that the \'' . $item . '\' object exists');
		}

		foreach ($blockedDistlists as $key => $item) {
			$this->assertNotContains($item, $names, 'Test that the \'' . $item . '\' object does not exists');
		}
	}

	/**
	 * Special Data provider which generates different combinations for restrictions
	 * The first argument is an array containing the restriction which must be send to the PHP.
	 * The second argument is an array of usernames which should be visible in the addressbook list.
	 * The third argument is an array of usernames which should have been filtered out by the restriction.
	 */
	public function providerRestriction()
	{
		$distlist = TestData::getDistlist();

		return array(
			array(array( 'searchstring' => 'SYSTEM' ), array( ), array( $distlist['fileas'] )),
			array(array( 'searchstring' => $distlist['fileas'] ), array( $distlist['fileas'] ), array( )),
			array(array( 'hide_groups' => true ), array( ), array( $distlist['fileas'] )),
		);
	}
}

?>
