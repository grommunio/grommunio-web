<?php

require_once 'classes/grommunioUser.php';
require_once 'classes/DistlistUser.php';
require_once 'classes/TestData.php';
require_once 'classes/grommunioTest.php';

/**
 * LoadingDistlistTest.
 *
 * Tests all possible cases for loading Distlists
 *
 * @group distlist
 *
 * @internal
 * @coversNothing
 */
class LoadDistlistsTest extends grommunioTest {
	/**
	 * The default user which is creating the distlists.
	 */
	private $user;

	/**
	 * The default settings for the message.
	 */
	private $message;

	/**
	 * During setup we are going to create the $user which will create the distlists.
	 */
	protected function setUp() {
		parent::setUp();

		$this->user = $this->addUser(new DistlistUser(new grommunioUser(GROMMUNIO_USER1_NAME, GROMMUNIO_USER1_PASSWORD)));

		$this->message = [
			'props' => TestData::getDistlist(),
			'members' => TestData::getDistlistMembers([1]),
		];
	}

	/**
	 * Test loading distlists using different forms of restrictions.
	 *
	 * @dataProvider providerLoadDistlists
	 *
	 * @param mixed $restriction
	 * @param mixed $props
	 * @param mixed $expectedCount
	 * @param mixed $msg
	 */
	public function testLoadDistlists($restriction, $props, $expectedCount, $msg) {
		$this->user->saveDistlist(['props' => array_merge($this->message['props'], $props)]);
		$distlists = $this->user->loadDistlists($restriction);

		$this->assertCount($expectedCount, $distlists, $msg);
	}

	/**
	 * Provide combinations of a distlist with different 'fileas' values and restrictions.
	 * The purpose is to test different cases where the distlist does or does not match the
	 * given restriction.
	 *
	 * The test functions using this provider should accept 4 arguments. Where the first
	 * argument is the restriction which must be applied to the load of the distlists.
	 * The second argument is the properties array which must be applied on the message which
	 * should be loaded. The third argument is the expected distlist count which should be
	 * returned by the load command, and the fourth argument is the message that should be
	 * shown when the test fails.
	 */
	public static function providerLoadDistlists() {
		return [
			// Load all data without using any restrictions
			[
				[
					'search' => [],
					'start' => 0,
				],
				[],
				1, 'Test that all distlists can be loaded without a restriction',
			],

			// Test the the alphanumeric restriction with a distlist inside the range
			[
				[
					'search' => [
						RES_AND, [
							[
								RES_PROPERTY,
								[
									VALUE => ['0x80B5001E' => '0'],
									RELOP => RELOP_GE,
									ULPROPTAG => '0x80B5001E',
								],
							],
							[
								RES_PROPERTY,
								[
									VALUE => ['0x80B5001E' => '9'],
									RELOP => RELOP_LE,
									ULPROPTAG => '0x80B5001E',
								],
							],
						],
					],
					'start' => 0,
				],
				['fileas' => '5 new Distlists'],
				1, 'Test that distlists can be loaded using a numeric restriction',
			],

			// Test the the alphanumeric restriction with a distlist outside the range
			[
				[
					'search' => [
						RES_AND, [
							[
								RES_PROPERTY,
								[
									VALUE => ['0x80B5001E' => '0'],
									RELOP => RELOP_GE,
									ULPROPTAG => '0x80B5001E',
								],
							],
							[
								RES_PROPERTY,
								[
									VALUE => ['0x80B5001E' => '9'],
									RELOP => RELOP_LE,
									ULPROPTAG => '0x80B5001E',
								],
							],
						],
					],
					'start' => 0,
				], ['fileas' => 'new Distlist'],
				0, 'Test that only distlists which start with number are loaded using the numeric restriction',
			],

			// Test the the alphabetical restriction with a distlist inside the range
			[
				[
					'search' => [
						RES_AND, [
							[
								RES_PROPERTY,
								[
									VALUE => ['0x80B5001E' => 'a'],
									RELOP => RELOP_GE,
									ULPROPTAG => '0x80B5001E',
								],
							],
							[
								RES_PROPERTY,
								[
									VALUE => ['0x80B5001E' => 'b'],
									RELOP => RELOP_LE,
									ULPROPTAG => '0x80B5001E',
								],
							],
						],
					],
					'start' => 0,
				], ['fileas' => 'Anand'],
				1, 'Test that distlists can be loaded using a alphabetic restriction',
			],

			// Test the the alphabetical restriction with a distlist outside the range
			[
				[
					'search' => [
						RES_AND, [
							[
								RES_PROPERTY,
								[
									VALUE => ['0x80B5001E' => 'r'],
									RELOP => RELOP_GE,
									ULPROPTAG => '0x80B5001E',
								],
							],
							[
								RES_PROPERTY,
								[
									VALUE => ['0x80B5001E' => 's'],
									RELOP => RELOP_LE,
									ULPROPTAG => '0x80B5001E',
								],
							],
						],
					],
					'start' => 0,
				], ['fileas' => 'Saket'],
				0, 'Test that only distlists which start with the requested letter are loaded using the alphabetic restriction',
			],
		];
	}
}
