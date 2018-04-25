<?php
require_once('classes/KopanoUser.php');
require_once('classes/AddressBookUser.php');
require_once('classes/HierarchyUser.php');
require_once('classes/TestData.php');
require_once('classes/KopanoTest.php');
require_once('classes/Util.php');

/**
 * AddressBookHierarchyTest
 *
 * Tests loading the Address Book Hierarchy
 */
class AddressBookHierarchyTest extends KopanoTest {

	/**
	 * The user for which we will open the addressbook
	 */
	private $user;

	/**
	 * The user that will be used to modify hierarchy
	 */
	private $hierarchyUser;

	/**
	 * The folder which will be saved
	 */
	private $folder;

	/**
	 * During setup we create the user, and clear the shared stores settings
	 */
	protected function setUp()
	{
		parent::setUp();

		$this->user = $this->addUser(new AddressBookUser(new KopanoUser(KOPANO_USER1_NAME, KOPANO_USER1_PASSWORD)));
		$this->hierarchyUser = $this->addUser(new HierarchyUser(new KopanoUser(KOPANO_USER1_NAME, KOPANO_USER1_PASSWORD)));

		// Add some permissions to USER1 so it is allowed to open the store of user 2.
		$storeUser = $this->addUser(new HierarchyUser(new KopanoUser(KOPANO_USER3_NAME, KOPANO_USER3_PASSWORD)));
		$entryid = $storeUser->getDefaultFolderEntryID(PR_IPM_SUBTREE_ENTRYID);
		$storeUser->addPermissions($this->user, ecRightsFullControl, $entryid);
	}

	/**
	 * Test the response when we load the addressbook hierarchy
	 */
	public function testLoadingNormalAddressBookHierarchyResults()
	{
		$response = $this->user->loadHierarchy();

		$this->assertArrayHasKey('list', $response, 'Test that the response contains the \'list\' object');
		$this->assertArrayHasKey('item', $response['list'], 'Test that the response contains the \'item\' object');

		$folderProps = Util::pluckFromObject($response['list']['item'], 'props');

		$gab = Util::searchInArray($folderProps, 'display_name', 'Global Address Book');
		$this->assertNotEmpty($gab, 'Test that the \'Global Address Book\' folder exists');
		$this->assertEquals(0, $gab['depth'], 'Test that the Global Address Book has the correct \'depth\' property set');
		$this->assertEquals(MAPI_ABCONT, $gab['object_type'], 'Test that the Global Address Book has the correct \'object_type\' property set');
		$this->assertEquals('gab', $gab['type'], 'Test that the Global Address Book has the correct \'type\' property set');

		$gab = Util::searchInArray($folderProps, 'display_name', 'All Address Lists');
		$this->assertNotEmpty($gab, 'Test that the \'All Address Lists\' folder exists');
		$this->assertEquals(0, $gab['depth'], 'Test that the Address Lists folder has the correct \'depth\' property set');
		$this->assertEquals(MAPI_ABCONT, $gab['object_type'], 'Test that the Address Lists folder has the correct \'object_type\' property set');
		$this->assertEquals('gab', $gab['type'], 'Test that the Address Lists folder has the correct \'type\' property set');

		$contacts = Util::searchInArray($folderProps, 'display_name', 'Contacts - ' . KOPANO_USER1_DISPLAY_NAME);
		$this->assertEmpty($contacts, 'Test that the \'Contacts - ' . KOPANO_USER1_DISPLAY_NAME . '\' folder does not exist');
	}

	/**
	 * Test the response when we load the addressbook hierarchy including the contacts folders and sub folders of our own store
	 */
	public function testLoadingAddressBookHierarchyWithContactsResults()
	{
		// Create a sub folder into Contacts folder
		$this->folder = $this->hierarchyUser->saveFolder(array(
			'parent_entryid' => bin2hex($this->user->getDefaultTestFolderEntryId()),
			'props' => TestData::getFolder(array(
				'container_class' => 'IPF.Contact',
				'display_name' => 'Sub contacts'
			))
		));

		// load folder hierarchy
		$response = $this->user->loadHierarchy();

		$this->assertArrayHasKey('list', $response, 'Test that the response contains the \'list\' object');
		$this->assertArrayHasKey('item', $response['list'], 'Test that the response contains the \'item\' object');

		$folderProps = Util::pluckFromObject($response['list']['item'], 'props');

		$gab = Util::searchInArray($folderProps, 'display_name', 'Global Address Book');
		$this->assertNotEmpty($gab, 'Test that the \'Global Address Book\' folder exists');
		$this->assertEquals(0, $gab['depth'], 'Test that the Global Address Book has the correct \'depth\' property set');
		$this->assertEquals(MAPI_ABCONT, $gab['object_type'], 'Test that the Global Address Book has the correct \'object_type\' property set');
		$this->assertEquals('gab', $gab['type'], 'Test that the Global Address Book has the correct \'type\' property set');

		$gab = Util::searchInArray($folderProps, 'display_name', 'All Address Lists');
		$this->assertNotEmpty($gab, 'Test that the \'All Address Lists\' folder exists');
		$this->assertEquals(0, $gab['depth'], 'Test that the Address Lists folder has the correct \'depth\' property set');
		$this->assertEquals(MAPI_ABCONT, $gab['object_type'], 'Test that the Address Lists folder has the correct \'object_type\' property set');
		$this->assertEquals('gab', $gab['type'], 'Test that the Address Lists folder has the correct \'type\' property set');

		$contacts = Util::searchInArray($folderProps, 'display_name', 'Contacts');
		$this->assertNotEmpty($contacts, 'Test that the \'Contacts\' folder exists');
		$this->assertEquals(1, $contacts['depth'], 'Test that the Personal Contacts folder has the correct \'depth\' property set');
		$this->assertEquals(MAPI_ABCONT, $contacts['object_type'], 'Test that the Personal Contacts folder has the correct \'display_type\' property set');
		$this->assertEquals('contacts', $contacts['type'], 'Test that the Personal Contacts folder has the correct \'type\' property set');

		// assert that contact folders within the folders are included too
		$subContacts = Util::searchInArray($folderProps, 'display_name', 'Sub contacts');
		$this->assertNotEmpty($subContacts, 'Test that the \'Sub contacts\' folder exists');
		$this->assertEquals(1, $subContacts['depth'], 'Test that the Sub Contacts folder has the correct \'depth\' property set');
		$this->assertEquals(MAPI_ABCONT, $subContacts['object_type'], 'Test that the Sub Contacts folder has the correct \'display_type\' property set');
		$this->assertEquals('contacts', $subContacts['type'], 'Test that the Sub Contacts folder has the correct \'type\' property set');
	}

	/**
	 * Test the response when we load the addressbook hierarchy excluding the contacts folder of wastebasket
	 */
	public function testLoadingABHierarchyWithoutWasteBasketContactsResults()
	{
		// Create a sub folder into Contacts folder
		$this->folder = $this->hierarchyUser->saveFolder(array(
			'parent_entryid' => bin2hex($this->user->getDefaultTestFolderEntryId()),
			'props' => TestData::getFolder(array(
				'container_class' => 'IPF.Contact',
				'display_name' => 'Sub contacts'
			))
		));

		$props = $this->hierarchyUser->getFolderProps($this->folder, array(PR_ENTRYID));

		// move folder into wastebasket by deleting it
		$this->hierarchyUser->deleteFolder($props[PR_ENTRYID]);

		// load addressbook hierarchy
		$response = $this->user->loadHierarchy();
		$folderProps = Util::pluckFromObject($response['list']['item'], 'props');

		// assert that the folder is not there in addressbook hierarchy
		$subContacts = Util::searchInArray($folderProps, 'display_name', 'Sub contacts');
		$this->assertEmpty($subContacts, 'Test that the \'Sub contacts\' folder does not included into addressbook hierarchy');
	}

	/**
	 * Test the response when we load the addressbook hierarchy including the contacts folder of our own
	 * store and that of another user.
	 */
	public function testLoadingAddressBookHierarchyWithSharedContactsResults()
	{
		$this->hierarchyUser->setSetting('zarafa/v1/contexts/hierarchy/shared_stores/' . KOPANO_USER3_NAME . '/all', array(
			'folder_type' => 'all',
			'show_subfolders' => false
		));
		$this->hierarchyUser->openSharedFolder(array(
			'user_name' => KOPANO_USER3_NAME,
			'folder_type' => 'all',
			'show_subfolders' => false
		));

		$response = $this->user->loadHierarchy();

		$this->assertArrayHasKey('list', $response, 'Test that the response contains the \'list\' object');
		$this->assertArrayHasKey('item', $response['list'], 'Test that the response contains the \'item\' object');

		$folderProps = Util::pluckFromObject($response['list']['item'], 'props');

		$gab = Util::searchInArray($folderProps, 'display_name', 'Global Address Book');
		$this->assertNotEmpty($gab, 'Test that the \'Global Address Book\' folder exists');
		$this->assertEquals(0, $gab['depth'], 'Test that the Global Address Book has the correct \'depth\' property set');
		$this->assertEquals(MAPI_ABCONT, $gab['object_type'], 'Test that the Global Address Book has the correct \'object_type\' property set');
		$this->assertEquals('gab', $gab['type'], 'Test that the Global Address Book has the correct \'type\' property set');

		$gab = Util::searchInArray($folderProps, 'display_name', 'All Address Lists');
		$this->assertNotEmpty($gab, 'Test that the \'All Address Lists\' folder exists');
		$this->assertEquals(0, $gab['depth'], 'Test that the Address Lists folder has the correct \'depth\' property set');
		$this->assertEquals(MAPI_ABCONT, $gab['object_type'], 'Test that the Address Lists folder has the correct \'object_type\' property set');
		$this->assertEquals('gab', $gab['type'], 'Test that the Address Lists folder has the correct \'type\' property set');

		$contacts = Util::searchInArray($folderProps, 'display_name', 'Contacts');
		$this->assertNotEmpty($contacts, 'Test that the \'Contacts\' folder exists');
		$this->assertEquals(1, $contacts['depth'], 'Test that the Personal Contacts folder has the correct \'depth\' property set');
		$this->assertEquals(MAPI_ABCONT, $contacts['object_type'], 'Test that the Personal Contacts folder has the correct \'display_type\' property set');
		$this->assertEquals('contacts', $contacts['type'], 'Test that the Personal Contacts folder has the correct \'type\' property set');

		$contacts = Util::searchInArray($folderProps, 'display_name', 'Contacts - '. KOPANO_USER3_DISPLAY_NAME);
		$this->assertNotEmpty($contacts, 'Test that the \'Contacts\' folder exists');
		$this->assertEquals(1, $contacts['depth'], 'Test that the Shared Contacts folder has the correct \'depth\' property set');
		$this->assertEquals(MAPI_ABCONT, $contacts['object_type'], 'Test that the Shared Contacts folder has the correct \'display_type\' property set');
		$this->assertEquals('contacts', $contacts['type'], 'Test that the Shared Contacts folder has the correct \'type\' property set');
	}

	/**
	 * Test the response when we load the addressbook hierarchy excluding the contacts folder of our own store.
	 */
	public function testLoadingAddressBookWithoutContactsResults()
	{
		$response = $this->user->loadHierarchy(array(
			'hide_contacts' => true
		));

		$this->assertArrayHasKey('list', $response, 'Test that the response contains the \'list\' object');
		$this->assertArrayHasKey('item', $response['list'], 'Test that the response contains the \'item\' object');

		$folderProps = Util::pluckFromObject($response['list']['item'], 'props');

		$gab = Util::searchInArray($folderProps, 'display_name', 'Global Address Book');
		$this->assertNotEmpty($gab, 'Test that the \'Global Address Book\' folder exists');
		$this->assertEquals(0, $gab['depth'], 'Test that the Global Address Book has the correct \'depth\' property set');
		$this->assertEquals(MAPI_ABCONT, $gab['object_type'], 'Test that the Global Address Book has the correct \'object_type\' property set');
		$this->assertEquals('gab', $gab['type'], 'Test that the Global Address Book has the correct \'type\' property set');

		$gab = Util::searchInArray($folderProps, 'display_name', 'All Address Lists');
		$this->assertNotEmpty($gab, 'Test that the \'All Address Lists\' folder exists');
		$this->assertEquals(0, $gab['depth'], 'Test that the Address Lists folder has the correct \'depth\' property set');
		$this->assertEquals(MAPI_ABCONT, $gab['object_type'], 'Test that the Address Lists folder has the correct \'object_type\' property set');
		$this->assertEquals('gab', $gab['type'], 'Test that the Address Lists folder has the correct \'type\' property set');

		$contacts = Util::searchInArray($folderProps, 'display_name', 'Contacts');
		$this->assertEmpty($contacts, 'Test that the \'Contacts\' folder exists');
	}
}

?>
