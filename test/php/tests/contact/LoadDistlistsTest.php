<?php
require_once('classes/KopanoUser.php');
require_once('classes/DistlistUser.php');
require_once('classes/TestData.php');
require_once('classes/KopanoTest.php');

/**
 * LoadingDistlistTest
 *
 * Tests all possible cases for loading Distlists
 * @group distlist
 */
class LoadDistlistsTest extends KopanoTest {
	/**
	 * The default user which is creating the distlists
	 */
	private $user;

	/**
	 * The default settings for the message
	 */
	private $message;

	/**
	 * During setup we are going to create the $user which will create the distlists
	 */
	protected function setUp()
	{
		parent::setUp();

		$this->user = $this->addUser(new DistlistUser(new KopanoUser(KOPANO_USER1_NAME, KOPANO_USER1_PASSWORD)));

		$this->message = array(
			'props' => TestData::getDistlist(),
			'members' => TestData::getDistlistMembers(array(1))
		);
	}

	/**
	 * Test loading distlists using different forms of restrictions
	 * @dataProvider providerLoadDistlists
	 */
	public function testLoadDistlists($restriction, $props, $expectedCount, $msg)
	{
		$this->user->saveDistlist(array( 'props' => array_merge($this->message['props'], $props)));
		$distlists = $this->user->loadDistlists($restriction);

		$this->assertCount($expectedCount, $distlists, $msg);
	}

	/**
	 * Provide combinations of a distlist with different 'fileas' values and restrictions.
	 * The purpose is to test different cases where the distlist does or does not match the
	 * given restriction.
	 *
	 * The test functions using this provider should accept 4 arguments. Where the first
	 * argument is the restriction whihc must be applied to the load of the distlists.
	 * The second argument is the properties array which must be applied on the message which
	 * should be loaded. The third argument is the expected distlist count which should be
	 * returned by the load command, and the fourth argument is the message that should be
	 * shown when the test fails.
	 */
	public static function providerLoadDistlists()
	{
		return array(
			// Load all data without using any restrictions
			array(
				array(
					'search' => array(),
					'start' => 0,
				),
				array(),
				1, 'Test that all distlists can be loaded without a restriction'
			),

			// Test the the alphanumeric restriction with a distlist inside the range
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
				array( 'fileas' => '5 new Distlists'	),
				1, 'Test that distlists can be loaded using a numeric restriction'
			),

			// Test the the alphanumeric restriction with a distlist outside the range
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
				), array( 'fileas' => 'new Distlist' ),
				0, 'Test that only distlists which start with number are loaded using the numeric restriction'
			),

			// Test the the alphabetical restriction with a distlist inside the range
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
				1, 'Test that distlists can be loaded using a alphabetic restriction'
			),

			// Test the the alphabetical restriction with a distlist outside the range
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
				0, 'Test that only distlists which start with the requested letter are loaded using the alphabetic restriction'
			)
		);
	}
}
?>
