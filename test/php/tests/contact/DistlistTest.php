<?php
require_once('classes/KopanoUser.php');
require_once('classes/DistlistUser.php');
require_once('classes/TestData.php');
require_once('classes/KopanoTest.php');
require_once('classes/RestoreMessageUser.php');

/**
 * DistlistTest
 *
 * Tests small Distlist operations (create, delete, open).
 * @group distlist
 */
class DistlistTest extends KopanoTest {
	/**
	 * The default user
	 */
	private $user;

	/**
	 * The default user which will be sending request to retrieve soft deleted folders
	 */
	private $restoreUser;

	/**
	 * The message which will be handled
	 */
	private $message;

	/**
	 * The message which doesn't contain any member information
	 */
	private $message2;

	/**
	 * Array of named properties for user which can be present on Distlists.
	 */
	private $userTags;

	/**
	 * During setUp we create the user
	 */
	protected function setUp()
	{
		parent::setUp();

		$this->user = $this->addUser(new DistlistUser(new KopanoUser(KOPANO_USER1_NAME, KOPANO_USER1_PASSWORD)));
		$this->restoreUser = $this->addUser(new RestoreMessageUser(new KopanoUser(KOPANO_USER1_NAME, KOPANO_USER1_PASSWORD)));
		$this->restoreUser->setDefaultTestFolderEntryId($this->user->getDefaultTestFolderEntryId());

		$this->userTags = $this->user->getDistlistPropTags();

		$this->message = array(
			'props' => TestData::getDistlist(),
			'members' => TestData::getDistlistMembers(array(1))
		);

		$this->message2 = array(
			'props' => TestData::getDistlist(array(
				'fileas' => 'new distlist 2',
				'subject' => 'new Distlist 2',
				'display_name' => 'new distlist 2',
				'dl_name' => 'new distlist 2'
			))
		);
	}

	/**
	 * Test if a distlist can be saved to the contacts folder without problems
	 */
	public function testSavingDistlist()
	{
		try {
			$savedDistlist = $this->user->saveDistlist($this->message);
		} catch(Exception $e) {
			$this->fail('Test that the Distlist can be saved: ' . $e->getMessage() . PHP_EOL . $e->getTraceAsString());
		}

		$this->assertInternalType(PHPUnit_Framework_Constraint_IsType::TYPE_RESOURCE, $savedDistlist, 'Test that the saved Distlist is a resource');
	}

	/**
	 * Test if the distlist is saved into the correct folder
	 */
	public function testSavingDistlistResult()
	{
		$savedDistlist = $this->user->saveDistlist($this->message);
		$entryid = $this->user->getDistlistProps($savedDistlist, array(PR_ENTRYID));
		$foundDistlist = $this->user->getDistlist($entryid[PR_ENTRYID]);

		$this->assertInternalType(PHPUnit_Framework_Constraint_IsType::TYPE_RESOURCE, $foundDistlist, 'Test that the found Distlist is a resource');
	}

	/**
	 * Test if all properties in the new distlist are correct
	 */
	public function testSavingDistlistProperties()
	{
		$savedDistlist = $this->user->saveDistlist($this->message);
		$props = $this->user->getDistlistProps($savedDistlist);

		$this->assertEquals($this->message['props']['message_class'], $props[PR_MESSAGE_CLASS], 'Test that the \'PR_MESSAGE_CLASS\' is correctly saved');
		$this->assertEquals($this->message['props']['fileas'], $props[$this->userTags['fileas']], 'Test that the \'fileas\' is correctly saved');
		$this->assertEquals($this->message['props']['body'], $props[PR_BODY], 'Test that the \'PR_BODY\' is correctly saved');
	}

	/**
	 * Test if the distlist can be opened
	 */
	public function xtestOpeningDistlist()
	{
		try {
			$savedDistlist = $this->user->saveDistlist($this->message);
			$entryid = $this->user->getDistlistProps($savedDistlist, array(PR_ENTRYID));

			$openedDistlist = $this->user->openDistlist($entryid[PR_ENTRYID]);
		} catch (Exception $e) {
			$this->fail('Test that the Distlist can be opened: ' . $e->getMessage() . PHP_EOL . $e->getTraceAsString());
		}

		$this->assertArrayHasKey('item', $openedDistlist, 'Test that the opened Distlist returns an \'item\' array');
		$this->assertArrayHasKey('item', $openedDistlist['item'], 'Test that the \'item\' array contains items');
		$this->assertArrayHasKey('props', $openedDistlist['item']['item'], 'Test that the item contains properties');
	}

	/**
	 * Test if the opened distlist contains the correct properties
	 */
	public function xtestOpeningDistlistProperties()
	{
		$savedDistlist = $this->user->saveDistlist($this->message);
		$entryid = $this->user->getDistlistProps($savedDistlist, array(PR_ENTRYID));

		$openedDistlist = $this->user->openDistlist($entryid[PR_ENTRYID]);
		$props = $openedDistlist['item']['item']['props'];
		$this->assertEquals($this->message['props']['message_class'], $props['message_class'], 'Test that the \'PR_MESSAGE_CLASS\' is correctly obtained');
		$this->assertEquals($this->message['props']['fileas'], $props['fileas'], 'Test that the \'fileas\' is correctly obtained');
		$this->assertEquals($this->message['props']['body'], $props['body'], 'Test that the \'body\' is correctly obtained');
	}

	/**
	 * Test if the Distlist can be modified by emptying the body
	 */
	public function xtestUpdatingDistlistEmptyBody()
	{
		$savedDistlist = $this->user->saveDistlist($this->message);
		$entryid = $this->user->getDistlistProps($savedDistlist, array(PR_ENTRYID, PR_PARENT_ENTRYID, PR_STORE_ENTRYID));
		$openedDistlist = $this->user->openDistlist($entryid[PR_ENTRYID]);
		$savedDistlist = $this->user->saveDistlist(array(
			'entryid' => bin2hex($entryid[PR_ENTRYID]),
			'parent_entryid' => bin2hex($entryid[PR_PARENT_ENTRYID]),
			'store_entryid' => bin2hex($entryid[PR_STORE_ENTRYID]),
			'props' => array(
				'body' => '',
				'subject' => ''
			)
		));
		$openedDistlist = $this->user->openDistlist($entryid[PR_ENTRYID]);
		$props = $openedDistlist['item']['item']['props'];

		$this->assertEquals($this->message['props']['message_class'], $props['message_class'], 'Test that the \'PR_MESSAGE_CLASS\' is correctly obtained');
		$this->assertEquals('', $props['subject'], 'Test that the \'PR_SUBJECT\' is correctly updated');
		$this->assertEquals('', $props['body'], 'Test that the \'PR_BODY\' is correctly updated');
	}

	/**
	 * Test if a distlist can be deleted
	 */
	public function testDeletingDistlist()
	{
		try {
			$savedDistlist = $this->user->saveDistlist($this->message);
			$props = $this->user->getDistlistProps($savedDistlist, array(PR_ENTRYID));

			$this->user->deleteDistlist($props[PR_ENTRYID]);
		} catch (Exception $e) {
			$this->fail('Test that the Distlist can be deleted: ' . $e->getMessage() . PHP_EOL . $e->getTraceAsString());
		}

		$distlist = $this->user->getDistlist($props[PR_ENTRYID]);

		$this->assertEmpty($distlist, 'Test that the deleted Distlist is no longer in the Contacts folder');

		$deletedDistlist = $this->user->getAllDeletedDistlists();

		$this->assertNotEmpty($deletedDistlist, 'Test that the deleted Distlist is in the Deleted Items folder');

		$softDeletedDistlist = $this->restoreUser->loadSoftdeletedItems();

		$this->assertEmpty($softDeletedDistlist, 'Test that the deleted Distlist is not there in the Contacts folder as a soft deleted Distlist');
	}

	/**
	 * Test if a distlist can be Moved
	 */
	public function testMovingDistlists()
	{
		try {
			$savedDistlist = $this->user->saveDistlist($this->message);
			$props = $this->user->getDistlistProps($savedDistlist, array(PR_ENTRYID));
			$this->user->copyDistlist($props[PR_ENTRYID], array(), true);
		} catch (Exception $e) {
			$this->fail('Test that the Distlist can be moved: ' . $e->getMessage() . PHP_EOL . $e->getTraceAsString());
		}

		$distlistItems = $this->user->loadDistlists();

		$this->assertCount(1, $distlistItems, 'Test that 1 distlist was found in the folder');
		//For simplicity we are moving a message into same folder, so check entryid is changed or not
		$this->assertNotEquals(bin2hex($props[PR_ENTRYID]), $distlistItems[0]['entryid'], 'Test that the entryid is not equal');

		$softdeletedItems = $this->restoreUser->loadSoftdeletedItems();
		$this->assertEmpty($softdeletedItems, 'Test that no messages exists in the soft delete system');
	}

	/**
	 * Test if a distlist can be copied
	 */
	public function testCopyingDistlists()
	{
		try {
			$savedDistlist = $this->user->saveDistlist($this->message);
			$props = $this->user->getDistlistProps($savedDistlist, array(PR_ENTRYID));

			$this->user->copyDistlist($props[PR_ENTRYID]);
		} catch (Exception $e) {
			$this->fail('Test that the Distlist can be copied: ' . $e->getMessage() . PHP_EOL . $e->getTraceAsString());
		}

		$distlistItems = $this->user->loadDistlists();
		$props = $this->user->getDistlistProps($distlistItems);

		$copy = $props[0];
		$orig = $props[1];

		// Here, test system Copies item into the same folder
		$this->assertCount(2, $props, 'Test that 2 Distlists was found in the folder');

		$this->assertNotEquals($copy[PR_ENTRYID], $orig[PR_ENTRYID], 'Test that the entryid is not equal');

		$softdeletedItems = $this->restoreUser->loadSoftdeletedItems();
		$this->assertEmpty($softdeletedItems, 'Test that no messages exists in the soft delete system');
	}

	/**
	 * Test if a distlist with no members can be saved to the contacts folder without problems
	 */
	public function testSavingDistlistWithNoMembers()
	{
		try {
			$savedDistlist = $this->user->saveDistlist($this->message2);

			$entryid = $this->user->getDistlistProps($savedDistlist, array(PR_ENTRYID));
			$foundDistlist = $this->user->getDistlist($entryid[PR_ENTRYID]);

		} catch(Exception $e) {
			$this->fail('Test that the Distlist can be saved: ' . $e->getMessage() . PHP_EOL . $e->getTraceAsString());
		}

		$this->assertInternalType(PHPUnit_Framework_Constraint_IsType::TYPE_RESOURCE, $savedDistlist, 'Test that the saved Distlist is a resource');

		$this->assertInternalType(PHPUnit_Framework_Constraint_IsType::TYPE_RESOURCE, $foundDistlist, 'Test that the found Distlist is a resource');
	}

	/**
	 * Test if the distlist with no members is saved and can be opened correctly
	 */
	public function testSavingDistlistWithNoMembersProperties()
	{
		$distlist = $this->user->saveDistlist($this->message2);

		$entryid = $this->user->getDistlistProps($distlist, array(PR_ENTRYID));
		$distlist = $this->user->openDistlist($entryid[PR_ENTRYID]);

		$this->assertArrayNotHasKey('members', $distlist['item']['item'], 'Test that distlist is saved with no members.');
	}

	/**
	 * Test if a distlist with all types of members can be saved to the contacts folder without problems
	 * @param {Array} $membersIndex array containing index of members to get from TestData::getDistlistMembers.
	 * @param {String} $typeOfMember String to show type of user.
	 * @dataProvider providerMemberRestriction
	 */
	public function testSavingDistlistWithEveryMember($membersIndex, $typeOfMember)
	{
		try {
			// add addressbook members
			$this->message2['members'] = TestData::getDistlistMembers($membersIndex);

			$savedDistlist = $this->user->saveDistlist($this->message2);

			$entryid = $this->user->getDistlistProps($savedDistlist, array(PR_ENTRYID));
			$foundDistlist = $this->user->getDistlist($entryid[PR_ENTRYID]);

		} catch(Exception $e) {
			$this->fail('Test that the Distlist can be saved: ' . $e->getMessage() . PHP_EOL . $e->getTraceAsString());
		}

		$this->assertInternalType(PHPUnit_Framework_Constraint_IsType::TYPE_RESOURCE, $savedDistlist, 'Test that the saved Distlist is a resource');

		$this->assertInternalType(PHPUnit_Framework_Constraint_IsType::TYPE_RESOURCE, $foundDistlist, 'Test that the found Distlist is a resource');
	}

	/**
	 * Test if the distlist with all types of members is saved and can be opened correctly
	 * @param {Array} $membersIndex array containing index of members to get from TestData::getDistlistMembers.
	 * @param {String} $typeOfMember String to show type of user.
	 * @dataProvider providerMemberRestriction
	 */
	public function testSavingDistlistWithEveryMemberProperties($membersIndex, $typeOfMember)
	{
		// add addressbook members
		$providerMembersData = $this->message2['members'] = TestData::getDistlistMembers($membersIndex);

		$distlist = $this->user->saveDistlist($this->message2);

		$entryid = $this->user->getDistlistProps($distlist, array(PR_ENTRYID));
		$distlist = $this->user->openDistlist($entryid[PR_ENTRYID]);

		$distlist = $distlist['item']['item'];


		for($index = 0, $len = count($providerMembersData); $index < $len; $index++) {
			$providerMember = $providerMembersData[$index];

			$member = $this->user->getMembersFromDistlist($distlist, $providerMember['distlist_type']);
			$member = $member['props'];

			$this->assertEquals($providerMember['display_name'], $member['display_name'], 'Test that the property \'display_name\' is correctly obtained for ' . $typeOfMember . 'member');
			$this->assertEquals($providerMember['address_type'], $member['address_type'], 'Test that the property \'address_type\' is correctly obtained for ' . $typeOfMember . 'member');

			// Distlist members don't have an email_address
			if (empty($providerMember['email_address'])) {
				$this->assertArrayNotHasKey('email_address', $member, 'Test that the property \'email_address\' is not present for ' . $typeOfMember . 'member');
			} else {
				$this->assertEquals($providerMember['email_address'], $member['email_address'], 'Test that the property \'email_address\' is correctly obtained for ' . $typeOfMember . 'member');
			}

			// external members don't have entryid, so check this only for non external members
			if(isset($providerMember['entryid'])) {
				$this->assertEquals($providerMember['entryid'], $member['entryid'], 'Test that the property \'entryid\' is correctly obtained for ' . $typeOfMember . 'member');
			}
		}
	}

	/**
	 * Special Data provider which generates different combinations for members
	 * The first argument is an array containing the member numbers that can be used in TestData::getDistlistMembers.
	 * The second argument is a string explaining type of the member.
	 */
	public function providerMemberRestriction()
	{
		return array(
			// FIX: failing cases
			//array(array( 1 ), 'Addressbook user'),
			//array(array( 2 ), 'Addressbook group'),
			array(array( 3 ), 'Contact distribution list'),
			array(array( 4 ), 'Contact user 1'),
			array(array( 5 ), 'Contact user 2'),
			array(array( 6 ), 'Contact user 3'),
			array(array( 7 ), 'External user')
		);
	}
}
?>
