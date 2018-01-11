<?php
require_once('classes/KopanoUser.php');
require_once('classes/ContactUser.php');
require_once('classes/TestData.php');
require_once('classes/KopanoTest.php');

/**
 * LoadingContactsTest
 *
 * Tests all possible cases for loading Contacts
 */
class LoadContactsTest extends KopanoTest {
	/**
	 * The default user which is creating the contacts
	 */
	private $user;

	/**
	 * The default settings for the message
	 */
	private $message;

	/**
	 * During setup we are going to create the $user which will create the contacts
	 */
	protected function setUp()
	{
		parent::setUp();

		$this->user = $this->addUser(new ContactUser(new KopanoUser(KOPANO_USER1_NAME, KOPANO_USER1_PASSWORD)));

		$this->message = array(
			'props' => TestData::getContact()
		);
	}

	/**
	 * Test loading contacts using different forms of restrictions
	 * @dataProvider providerLoadContacts
	 */
	public function testLoadContacts($restriction, $props, $expectedCount, $msg)
	{
		$contact = $this->user->saveContact(array( 'props' => array_merge($this->message['props'], $props)));
		$contacts = $this->user->loadContacts($restriction);

		$this->assertCount($expectedCount, $contacts, $msg);
	}

	/**
	 * Provide combinations of an contact with different 'fileas' values and restrictions.
	 * The purpose is to test different cases where the contact does or does not match the
	 * given restriction.
	 *
	 * The test functions using this provider should accept 4 arguments. Where the first
	 * argument is the restriction whihc must be applied to the load of the contacts.
	 * The second argument is the properties array which must be applied on the message which
	 * should be loaded. The third argument is the expected contact count which should be
	 * returned by the load command, and the fourth argument is the message that should be
	 * shown when the test fails.
	 */
	public static function providerLoadContacts()
	{
		return array
			(
				// Load all data without using any restrictions
				array(
					array(
						'search' => array(),
						'start' => 0,
					),
					array(),
					1, 'Test that all contacts can be loaded without a restriction'
				),

				// Test the the alphanumeric restriction with a contact inside the range
				array(
					array(
						'search' => array(
							RES_AND, array(
								array(
									RES_PROPERTY,
									array(
										VALUE => array('0x80B5001E' => '0'),
										RELOP => RELOP_GE,
										ULPROPTAG => '0x80B5001E',
									),
								),
								array(
									RES_PROPERTY,
									array(
										VALUE => array('0x80B5001E' => '9'),
										RELOP => RELOP_LE,
										ULPROPTAG => '0x80B5001E',
									),
								),
							),
						),
						'start' => 0,
					),
					array( 'fileas' => '5 new Contacts'	),
					1, 'Test that contacts can be loaded using a numeric restriction'
				),

				// Test the the alphanumeric restriction with a contact outside the range
				array(
					array(
						'search' => array(
							RES_AND, array(
								array(
									RES_PROPERTY,
									array(
										VALUE => array('0x80B5001E' => '0'),
										RELOP => RELOP_GE,
										ULPROPTAG => '0x80B5001E',
									),
								),
								array(
									RES_PROPERTY,
									array(
										VALUE => array('0x80B5001E' => '9'),
										RELOP => RELOP_LE,
										ULPROPTAG => '0x80B5001E',
									),
								),
							),
						),
						'start' => 0,
					), array( 'fileas' => 'new Contact' ),
					0, 'Test that only contacts which start with number are loaded using the numeric restriction'
				),

				// Test the the alphabetical restriction with a contact inside the range
				array(
					array(
						'search' => array(
							RES_AND, array(
								array(
									RES_PROPERTY,
									array(
										VALUE => array('0x80B5001E' => 'a'),
										RELOP => RELOP_GE,
										ULPROPTAG => '0x80B5001E',
									),
								),
								array(
									RES_PROPERTY,
									array(
										VALUE => array('0x80B5001E' => 'b'),
										RELOP => RELOP_LE,
										ULPROPTAG => '0x80B5001E',
									),
								),
							),
						),
						'start' => 0,
					), array( 'fileas' => 'Anand' ),
					1, 'Test that contacts can be loaded using a alphabetic restriction'
				),

				// Test the the alphabetical restriction with a contact outside the range
				array(
					array(
						'search' => array(
							RES_AND, array(
								array(
									RES_PROPERTY,
									array(
										VALUE => array('0x80B5001E' => 'r'),
										RELOP => RELOP_GE,
										ULPROPTAG => '0x80B5001E',
									),
								),
								array(
									RES_PROPERTY,
									array(
										VALUE => array('0x80B5001E' => 's'),
										RELOP => RELOP_LE,
										ULPROPTAG => '0x80B5001E',
									),
								),
							),
						),
						'start' => 0,
					), array( 'fileas' => 'Saket' ),
					0, 'Test that only contacts which start with the requested letter are loaded using the alphabetic restriction'
				),
		);
	}
}
?>
