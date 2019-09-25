<?php
require_once('classes/KopanoUser.php');
require_once('classes/HierarchyUser.php');
require_once('classes/TestData.php');
require_once('classes/KopanoTest.php');

/**
 * PermissionsTest
 *
 * Tests all possible cases for applying permissions on a folder
 */
class PermissionsTest extends KopanoTest {
	/**
	 * The user for which we will add and close Shared Stores
	 */
	private $user;

	/**
	 * The user which will receive the permissions
	 */
	private $permissionUser;

	/**
	 * The second user which will receive the permissions
	 */
	private $permissionUser2;

	/**
	 * During setup we create the user, and clear the shared stores settings
	 */
	protected function setUp()
	{   
		parent::setUp();

		$this->user = $this->addUser(new HierarchyUser(new KopanoUser(KOPANO_USER1_NAME, KOPANO_USER1_PASSWORD)));
		$this->permissionUser = $this->addUser(new HierarchyUser(new KopanoUser(KOPANO_USER2_NAME, KOPANO_USER2_PASSWORD)));
		$this->permissionUser2 = $this->addUser(new HierarchyUser(new KopanoUser(KOPANO_USER3_NAME, KOPANO_USER3_PASSWORD)));
	}

	/**
	 * Test if permissions can be loaded from a folder
	 * @dataProvider providerPermissionsFolder
	 */
	public function testListPermissions($entryid, $type)
	{
		try {
			$entryid = $entryid ? $this->user->getDefaultFolderEntryID($entryid) : $entryid;
			$folder = $this->user->openFolder($entryid);
		} catch(Exception $e) {
			$this->fail('Test that a ' . $type . ' can be opened: ' . $e->getMessage() . PHP_EOL . $e->getTraceAsString());
		}

		$this->assertArrayHasKey('item', $folder, 'Test that the opened folder returns an \'item\' array');
		$this->assertArrayHasKey('permissions', $folder['item'], 'Test that the opened folder returns an \'permissions\' array');
		$this->assertEmpty($folder['item']['permissions']['item'], 'Test that by default a folder doesn\'t have permissions set');
	}

	/**
	 * Test if permissions to a user can be given on a folder
	 * @dataProvider providerPermissionsFolder
	 */
	public function testAddPermissionsToFolder($entryid, $type)
	{
		try {
			$entryid = $entryid ? $this->user->getDefaultFolderEntryID($entryid) : $entryid;
			$response = $this->user->addPermissions($this->permissionUser, ecRightsFolderVisible, $entryid);
		} catch(Exception $e) {
			$this->fail('Test that permissions can be set on a ' . $type . ': ' . $e->getMessage() . PHP_EOL . $e->getTraceAsString());
		}

		$this->assertArrayHasKey('success', $response, 'Test that the response contains the \'success\' property');
	}

	/**
	 * Test if the added permissions are properly saved
	 * @dataProvider providerPermissionsFolder
	 */
	public function testAddedPermissionsInFolder($entryid, $type)
	{
		$entryid = $entryid ? $this->user->getDefaultFolderEntryID($entryid) : $entryid;
		$this->user->addPermissions($this->permissionUser, ecRightsFolderVisible, $entryid);
		$folder = $this->user->openFolder($entryid);

		$this->assertArrayHasKey('item', $folder, 'Test that the opened folder returns an \'item\' array');
		$this->assertArrayHasKey('permissions', $folder['item'], 'Test that the opened folder returns an \'permissions\' array');
		$this->assertCount(1, $folder['item']['permissions']['item'], 'Test that the permissions list contains 1 item');

		$user = $this->permissionUser->getUserProps(array( PR_ENTRYID, PR_OBJECT_TYPE, PR_DISPLAY_NAME ));
		$permission = $folder['item']['permissions']['item'][0];

		$this->assertEquals(bin2hex($user[PR_ENTRYID]), $permission['entryid'], 'Test that the entry is correct set');
		$this->assertEquals($user[PR_OBJECT_TYPE], $permission['props']['object_type'], 'Test that the object type is correctly set');
		$this->assertEquals($user[PR_DISPLAY_NAME], $permission['props']['display_name'], 'Test that the display name is correctly set');
		$this->assertEquals(ecRightsFolderVisible, $permission['props']['rights'], 'Test that the rights are correctly set');
	}

	/**
	 * Test if another use can also receive permissions on the folder
	 * @dataProvider providerPermissionsFolder
	 */
	public function testAddingSecondPermissionToFolder($entryid, $type)
	{
		try {
			$entryid = $entryid ? $this->user->getDefaultFolderEntryID($entryid) : $entryid;
			$this->user->addPermissions($this->permissionUser, ecRightsFolderVisible, $entryid);
			$response = $this->user->addPermissions($this->permissionUser2, ecRightsFolderVisible, $entryid);
		} catch(Exception $e) {
			$this->fail('Test that permissions can be set on a ' . $type . ': ' . $e->getMessage() . PHP_EOL . $e->getTraceAsString());
		}

		$this->assertArrayHasKey('success', $response, 'Test that the response contains the \'success\' property');
	}

	/**
	 * Test if the properties are correcly applied on the folder
	 * @dataProvider providerPermissionsFolder
	 */
	public function testSecondAddedPermissionInFolder($entryid, $type)
	{
		$entryid = $entryid ? $this->user->getDefaultFolderEntryID($entryid) : $entryid;
		$this->user->addPermissions($this->permissionUser, ecRightsFolderVisible, $entryid);
		$this->user->addPermissions($this->permissionUser2, ecRightsFolderAccess, $entryid);
		$folder = $this->user->openFolder($entryid);

		$this->assertArrayHasKey('item', $folder, 'Test that the opened folder returns an \'item\' array');
		$this->assertArrayHasKey('permissions', $folder['item'], 'Test that the opened folder returns an \'permissions\' array');
		$this->assertCount(2, $folder['item']['permissions']['item'], 'Test that the permissions list contains 2 items');

		$user = $this->permissionUser->getUserProps(array( PR_ENTRYID, PR_OBJECT_TYPE, PR_DISPLAY_NAME ));
		$permission = Util::searchInArray($folder['item']['permissions']['item'], 'entryid', bin2hex($user[PR_ENTRYID]));

		$this->assertEquals(bin2hex($user[PR_ENTRYID]), $permission['entryid'], 'Test that the entry is correct set');
		$this->assertEquals($user[PR_OBJECT_TYPE], $permission['props']['object_type'], 'Test that the object type is correctly set');
		$this->assertEquals($user[PR_DISPLAY_NAME], $permission['props']['display_name'], 'Test that the display name is correctly set');
		$this->assertEquals(ecRightsFolderVisible, $permission['props']['rights'], 'Test that the rights are correctly set');

		$user = $this->permissionUser2->getUserProps(array( PR_ENTRYID, PR_OBJECT_TYPE, PR_DISPLAY_NAME ));
		$permission = Util::searchInArray($folder['item']['permissions']['item'], 'entryid', bin2hex($user[PR_ENTRYID]));

		$this->assertEquals(bin2hex($user[PR_ENTRYID]), $permission['entryid'], 'Test that the entry is correct set');
		$this->assertEquals($user[PR_OBJECT_TYPE], $permission['props']['object_type'], 'Test that the object type is correctly set');
		$this->assertEquals($user[PR_DISPLAY_NAME], $permission['props']['display_name'], 'Test that the display name is correctly set');
		$this->assertEquals(ecRightsFolderAccess, $permission['props']['rights'], 'Test that the rights are correctly set');
	}

	/**
	 * Test if existing permissions can be modified on a folder
	 * @dataProvider providerPermissionsFolder
	 */
	public function testModifyPermissionsOnFolder($entryid, $type)
	{
		try {
			$entryid = $entryid ? $this->user->getDefaultFolderEntryID($entryid) : $entryid;
			$this->user->addPermissions($this->permissionUser, ecRightsFolderVisible, $entryid);
			$response = $this->user->modifyPermissions($this->permissionUser, ecRightsFolderVisible | ecRightsFolderAccess, $entryid);
		} catch(Exception $e) {
			$this->fail('Test that permissions can be modified on a folder ' . $type . ': ' . $e->getMessage() . PHP_EOL . $e->getTraceAsString());
		}

		$this->assertArrayHasKey('success', $response, 'Test that the response contains the \'success\' property');
	}

	/**
	 * Test if the modified permissions have been correctly saved.
	 * @dataProvider providerPermissionsFolder
	 */
	public function testModifiedPermissionsInFolder($entryid, $type)
	{
		$entryid = $entryid ? $this->user->getDefaultFolderEntryID($entryid) : $entryid;
		$this->user->addPermissions($this->permissionUser, ecRightsFolderVisible, $entryid);
		$this->user->modifyPermissions($this->permissionUser, ecRightsFolderVisible | ecRightsFolderAccess, $entryid);
		$folder = $this->user->openFolder($entryid);

		$this->assertArrayHasKey('item', $folder, 'Test that the opened folder returns an \'item\' array');
		$this->assertArrayHasKey('permissions', $folder['item'], 'Test that the opened folder returns an \'permissions\' array');
		$this->assertCount(1, $folder['item']['permissions']['item'], 'Test that the permissions list contains 1 item');

		$user = $this->permissionUser->getUserProps(array( PR_ENTRYID, PR_OBJECT_TYPE, PR_DISPLAY_NAME ));
		$permission = $folder['item']['permissions']['item'][0];

		$this->assertEquals(bin2hex($user[PR_ENTRYID]), $permission['entryid'], 'Test that the entry is correct set');
		$this->assertEquals($user[PR_OBJECT_TYPE], $permission['props']['object_type'], 'Test that the object type is correctly set');
		$this->assertEquals($user[PR_DISPLAY_NAME], $permission['props']['display_name'], 'Test that the display name is correctly set');
		$this->assertEquals(ecRightsFolderVisible | ecRightsFolderAccess, $permission['props']['rights'], 'Test that the rights are correctly set');
	}

	/**
	 * Test if permissions on a folder can be removed
	 * @dataProvider providerPermissionsFolder
	 */
	public function testDeletePermissionsFromFolder($entryid, $type)
	{
		try {
			$entryid = $entryid ? $this->user->getDefaultFolderEntryID($entryid) : $entryid;
			$this->user->addPermissions($this->permissionUser, ecRightsFolderVisible, $entryid);
			$response = $this->user->deletePermissions($this->permissionUser, $entryid);
		} catch(Exception $e) {
			$this->fail('Test that permissions can be deleted from a folder ' . $type . ': ' . $e->getMessage() . PHP_EOL . $e->getTraceAsString());
		}

		$this->assertArrayHasKey('success', $response, 'Test that the response contains the \'success\' property');
	}

	/**
	 * Test if the removed permissions are correctly removed from the folder.
	 * @dataProvider providerPermissionsFolder
	 */
	public function testDeletedPermissionsInFolder($entryid, $type)
	{
		$entryid = $entryid ? $this->user->getDefaultFolderEntryID($entryid) : $entryid;
		$this->user->addPermissions($this->permissionUser, ecRightsFolderVisible, $entryid);
		$this->user->deletePermissions($this->permissionUser, $entryid);
		$folder = $this->user->openFolder($entryid);

		$this->assertArrayHasKey('item', $folder, 'Test that the opened folder returns an \'item\' array');
		$this->assertArrayHasKey('permissions', $folder['item'], 'Test that the opened folder returns an \'permissions\' array');
		$this->assertEmpty($folder['item']['permissions']['item'], 'Test that the permissions list is empty');
	}

	/**
	 * Special Data provider which indicates the folders for which the permissions should be modified.
	 * The first argument is the identifier for TestUser::getDefaultFolderEntryID to obtain the correct entryid
	 * The second argument is the string which represents the foldertype
	 */
	public function providerPermissionsFolder()
	{
		return array(
			array(null, 'Inbox'),
			array(PR_IPM_APPOINTMENT_ENTRYID, 'calendar'),
			//array(PR_IPM_SUBTREE_ENTRYID, 'store') // FIXME: teardown does not up the root store permissions.
		);
	}
}
