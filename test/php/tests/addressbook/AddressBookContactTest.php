<?php
require_once('classes/KopanoUser.php');
require_once('classes/AddressBookUser.php');
require_once('classes/ContactUser.php');
require_once('classes/TestData.php');
require_once('classes/KopanoTest.php');
require_once('classes/Util.php');

/**
 * AddressBookContactTest
 *
 * Tests loading the Address Book contents of the Contacts containers
 */
class AddressBookContactTest extends KopanoTest {

	/**
	 * The user for which we will open the addressbook
	 */
	private $user;

	/**
	 * The user used for creating the contacts
	 */
	private $contactUser;

	/**
	 * The message which will be handled
	 */
	private $message;

	/**
	 * The message which will be handled for multiple contacts
	 */
	private $multipleMessage;

	/**
	 * During setup we create the user, and clear the shared stores settings
	 */
	protected function setUp()
	{
		parent::setUp();

		$this->user = $this->addUser(new AddressBookUser(new KopanoUser(KOPANO_USER1_NAME, KOPANO_USER1_PASSWORD)));
		$this->contactUser = $this->addUser(new ContactUser(new KopanoUser(KOPANO_USER1_NAME, KOPANO_USER1_PASSWORD)));

		$this->message = array(
			'props' => TestData::getContact()
		);

		$this->multipleMessage = array(
			'props' => TestData::getContact(array(
				// add extra email address properties, so single contact will be converted to multiple contacts
				'email_address_2' => 'email2@local.kopano.com',
				'email_address_display_name_2' => 'new Contact (email2@local.kopano.com)',
				'email_address_display_name_email_2' => 'email2@local.kopano.com',
				'email_address_type_2' => 'SMTP',
				'fax_2_original_display_name' => 'new Contact',
				'fax_2_email_address' => 'new Contact@5678',
				'fax_2_address_type' => 'FAX',
				'address_book_long' => 43,
				'address_book_mv' => array(0, 1, 3, 5)
			))
		);
	}

	/**
	 * Test if the contact addressbook returns valid objects
	 */
	public function testLoadingContactAddressBookResults()
	{
		$this->contactUser->saveContact($this->message, false);

		$response = $this->user->loadContactsAddressBook();

		$this->assertArrayHasKey('list', $response, 'Test that the response contains the \'list\' object');
		$this->assertArrayHasKey('item', $response['list'], 'Test that the response contains the \'item\' object');

		// The contact has both an email as a fax address so it is shown twice in the list
		$this->assertCount(2, $response['list']['item'], 'Test that the number of items in the \'item\' array matches the number of contacts');

		$props = Util::pluckFromObject($response['list']['item'], 'props');
		$contact1 = Util::searchInArray($props, 'address_type', $this->message['props']['email_address_type_1']);

		$this->assertNotEmpty($contact1, 'Test that the contact 1 exists');
		$this->assertEquals($this->message['props']['email_address_type_1'], $contact1['address_type'], 'Test that the contact 1 has the correct \'address_type\' property set');
		$this->assertEquals($this->message['props']['email_address_display_name_1'], $contact1['display_name'], 'Test that the contact 1 has the correct \'display_name\' property set');
		$this->assertEquals($this->message['props']['email_address_1'], $contact1['email_address'], 'Test that the contact 1 has the correct \'email_address\' property set');
		$this->assertEquals(MAPI_MAILUSER, $contact1['object_type'], 'Test that the contact 1 has the correct \'object_type\' property set');

		$contact2 = Util::searchInArray($props, 'address_type', $this->message['props']['fax_1_address_type']);

		$this->assertNotEmpty($contact2, 'Test that the contact 2 exists');
		$this->assertEquals($this->message['props']['fax_1_address_type'], $contact2['address_type'], 'Test that the contact 2 has the correct \'address_type\' property set');
		$this->assertEquals($this->message['props']['fax_1_original_display_name'], $contact2['display_name'], 'Test that the contact 2 has the correct \'display_name\' property set');
		$this->assertEquals($this->message['props']['fax_1_email_address'], $contact2['email_address'], 'Test that the contact 2 has the correct \'email_address\' property set');
		$this->assertEquals(MAPI_MAILUSER, $contact2['object_type'], 'Test that the contact 2 has the correct \'object_type\' property set');
	}

	/**
	 * Test if the contact addressbook returns valid objects for mutliple email addresses
	 */
	public function testLoadingMultipleContactAddressBookResults()
	{
		$this->contactUser->saveContact($this->multipleMessage, false);

		$response = $this->user->loadContactsAddressBook();

		$this->assertArrayHasKey('list', $response, 'Test that the response contains the \'list\' object');
		$this->assertArrayHasKey('item', $response['list'], 'Test that the response contains the \'item\' object');

		// The contact has two email addresses and two fax addresses so it is shown four times in the list
		$this->assertCount(4, $response['list']['item'], 'Test that the number of items in the \'item\' array matches the number of email address and fax addresses a contact contains');

		$props = Util::pluckFromObject($response['list']['item'], 'props');

		// for first contact with first email address
		$contact1 = Util::searchInArray($props, 'email_address', $this->multipleMessage['props']['email_address_1']);

		$this->assertNotEmpty($contact1, 'Test that the contact 1 exists');
		$this->assertEquals($this->multipleMessage['props']['email_address_type_1'], $contact1['address_type'], 'Test that the contact 1 has the correct \'address_type\' property set');
		$this->assertEquals($this->multipleMessage['props']['email_address_1'], $contact1['email_address'], 'Test that the contact 1 has the correct \'email_address\' property set');
		$this->assertEquals($this->multipleMessage['props']['email_address_display_name_1'], $contact1['display_name'], 'Test that the contact 1 has the correct \'display_name\' property set');
		$this->assertEquals(MAPI_MAILUSER, $contact1['object_type'], 'Test that the contact 1 has the correct \'object_type\' property set');

		// for second contact with first fax address
		$contact2 = Util::searchInArray($props, 'email_address', $this->multipleMessage['props']['fax_1_email_address']);

		$this->assertNotEmpty($contact2, 'Test that the contact 2 exists');
		$this->assertEquals($this->multipleMessage['props']['fax_1_address_type'], $contact2['address_type'], 'Test that the contact 2 has the correct \'address_type\' property set');
		$this->assertEquals($this->multipleMessage['props']['fax_1_email_address'], $contact2['email_address'], 'Test that the contact 2 has the correct \'email_address\' property set');
		$this->assertEquals($this->multipleMessage['props']['fax_1_original_display_name'], $contact2['display_name'], 'Test that the contact 2 has the correct \'display_name\' property set');
		$this->assertEquals(MAPI_MAILUSER, $contact2['object_type'], 'Test that the contact 2 has the correct \'object_type\' property set');

		// for third contact with second email address
		$contact3 = Util::searchInArray($props, 'email_address', $this->multipleMessage['props']['email_address_2']);

		$this->assertNotEmpty($contact3, 'Test that the contact 3 exists');
		$this->assertEquals($this->multipleMessage['props']['email_address_type_2'], $contact3['address_type'], 'Test that the contact 3 has the correct \'address_type\' property set');
		$this->assertEquals($this->multipleMessage['props']['email_address_2'], $contact3['email_address'], 'Test that the contact 3 has the correct \'email_address\' property set');
		$this->assertEquals($this->multipleMessage['props']['email_address_display_name_2'], $contact3['display_name'], 'Test that the contact 3 has the correct \'display_name\' property set');
		$this->assertEquals(MAPI_MAILUSER, $contact3['object_type'], 'Test that the contact 3 has the correct \'object_type\' property set');

		// for fourth contact with second fax address
		$contact4 = Util::searchInArray($props, 'email_address', $this->multipleMessage['props']['fax_2_email_address']);

		$this->assertNotEmpty($contact4, 'Test that the contact 4 exists');
		$this->assertEquals($this->multipleMessage['props']['fax_2_address_type'], $contact4['address_type'], 'Test that the contact 4 has the correct \'address_type\' property set');
		$this->assertEquals($this->multipleMessage['props']['fax_2_email_address'], $contact4['email_address'], 'Test that the contact 4 has the correct \'email_address\' property set');
		$this->assertEquals($this->multipleMessage['props']['fax_2_original_display_name'], $contact4['display_name'], 'Test that the contact 4 has the correct \'display_name\' property set');
		$this->assertEquals(MAPI_MAILUSER, $contact4['object_type'], 'Test that the contact 4 has the correct \'object_type\' property set');
	}

	/**
	 * Test the results when the contact addressbook is loaded with an restriction
	 * @dataProvider providerRestriction
	 */
	public function testLoadingContactAddressBookWithRestrictionResults($restriction, $allowedContacts, $blockedContacts)
	{
		$this->contactUser->saveContact($this->message, false);

		$response = $this->user->loadContactsAddressBook($restriction);

		$this->assertArrayHasKey('list', $response, 'Test that the response contains the \'list\' object');
		$this->assertArrayHasKey('item', $response['list'], 'Test that the response contains the \'item\' object');

		$props = Util::pluckFromObject($response['list']['item'], 'props');

		$names = Util::pluckFromObject($props, 'fileas');
		foreach ($allowedContacts as $key => $item) {
			$this->assertContains($item, $names, 'Test that the \'' . $item . '\' object exists');
		}
		foreach ($blockedContacts as $key => $item) {
			$this->assertNotContains($item, $names, 'Test that the \'' . $item . '\' object does not exists');
		}
	}

	/**
	 * Test that the contact will not be displayed if there is no Email address present in that partiular ontact.
	 */
	public function testLoadingContactAddressBookWithoutEmailAddress()
	{
		// To obtain the contact without Email address, We need to unset all these properties.
		unset($this->message['props']['fax_1_address_type']);
		unset($this->message['props']['email_address_type_1']);
		unset($this->message['props']['email_address_1']);
		unset($this->message['props']['email_address_display_name_1']);
		unset($this->message['props']['email_address_display_name_email_1']);
		unset($this->message['props']['fax_1_email_address']);
		unset($this->message['props']['address_book_long']);
		unset($this->message['props']['address_book_mv']);
		unset($this->message['props']['fax_1_original_display_name']);

		$this->contactUser->saveContact($this->message, false);
		$response = $this->user->loadContactsAddressBook();

		$this->assertEmpty($response['list']['item'], 'Test that the Contact will not be displayed as there is no email address present');
	}

	/**
	 * Special Data provider which generates different combinations for restrictions
	 * The first argument is an array containing the restriction which must be send to the PHP.
	 * The second argument is an array of usernames which should be visible in the addressbook list.
	 * The third argument is an array of usernames which should have been filtered out by the restriction.
	 */
	public function providerRestriction()
	{
		$contact = TestData::getContact();

		return array(
			array(array( 'searchstring' => 'SYSTEM' ), array( ), array( $contact['fileas'] )),
			array(array( 'searchstring' => $contact['fileas'] ), array( $contact['fileas'] ), array( )),
			array(array( 'searchstring' => $contact['display_name'] ), array( $contact['fileas'] ), array( )),
			array(array( 'searchstring' => $contact['email_address_1'] ), array( $contact['fileas'] ), array( )),
			array(array( 'searchstring' => $contact['email_address_display_name_1'] ), array( $contact['fileas'] ), array( )),
			array(array( 'searchstring' => $contact['fax_1_email_address'] ), array( $contact['fileas'] ), array( )),
			array(array( 'searchstring' => $contact['fax_1_original_display_name'] ), array( $contact['fileas'] ), array( )),
		);
	}
}

?>
