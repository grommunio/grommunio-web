<?php
require_once('classes/KopanoUser.php');
require_once('classes/HierarchyUser.php');
require_once('classes/TestData.php');
require_once('classes/KopanoTest.php');

/**
 * FolderTest
 *
 * Tests creating/opening and deleting folders
 */
class FolderTest extends KopanoTest {

	/**
	 * The user for which we will open the hierarchy
	 */
	private $user;

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

		$this->user = $this->addUser(new HierarchyUser(new KopanoUser(KOPANO_USER1_NAME, KOPANO_USER1_PASSWORD)));

		$this->folder = array(
			'props' => TestData::getFolder()
		);
	}

	/*
	 * Test if a folder can be created
	 */
	public function testCreateFolder()
	{
		try {
			$folder = $this->user->saveFolder($this->folder);
		} catch(Exception $e) {
			$this->fail('Test that a folder can be created: ' . $e->getMessage() . PHP_EOL . $e->getTraceAsString());
		}

		$this->assertInternalType(PHPUnit_Framework_Constraint_IsType::TYPE_RESOURCE, $folder, 'Test that the created folder is a resource');
	}

	/*
	 * Test the folder properties
	 */
	public function testOpenFolderResult()
	{
		$folder = $this->user->saveFolder($this->folder);
		$props = $this->user->getFolderProps($folder, array(PR_ENTRYID));
		$folder = $this->user->openFolder($props[PR_ENTRYID]);

		$this->assertArrayHasKey('item', $folder, 'Test that the opened folder returns an \'item\' array');
		$this->assertArrayHasKey('props', $folder['item'], 'Test that the opened folder returns an \'props\' array');

		$props = $folder['item']['props'];

		$this->assertEquals(MAPI_FOLDER, $props['object_type'], 'Test that the \'object_type\' equals MAPI_FOLDER');
		$this->assertEquals($this->folder['props']['display_name'], $props['display_name'], 'Test that the display name is correctly set');
		$this->assertEquals($this->folder['props']['container_class'], $props['container_class'], 'Test that the \'container_class\' is correctly set');
		$this->assertArrayHasKey('creation_time', $props, 'Test that the \'creation_time\' property has been set');
		$this->assertEquals(0, $props['content_count'], 'Test that the \'content_count\' is 0');
		$this->assertEquals(0, $props['content_unread'], 'Test that the \'content_unread\' is 0');
		$this->assertEquals(0, $props['message_size'], 'Test that the \'message_size\' is 0');
		$this->assertFalse($props['subfolders'], 'Test that no subfolders are present');
	}

	/*
	 * Test the folder properties from the IPM_SUBTREE
	 */
	public function testOpenSubtreeResult()
	{
		$subtree = $this->user->getDefaultFolderEntryID(PR_IPM_SUBTREE_ENTRYID);
		$folder = $this->user->openFolder($subtree);

		$this->assertArrayHasKey('item', $folder, 'Test that the opened folder returns an \'item\' array');
		$this->assertArrayHasKey('props', $folder['item'], 'Test that the opened folder returns an \'props\' array');

		$props = $folder['item']['props'];

		$this->assertEquals(MAPI_FOLDER, $props['object_type'], 'Test that the \'object_type\' equals MAPI_FOLDER');
		$this->assertEquals('Inbox - ' . KOPANO_USER1_DISPLAY_NAME, $props['display_name'], 'Test that the display name is correctly set');
		$this->assertEquals('IPF.Note', $props['container_class'], 'Test that the \'container_class\' is correctly set');
		$this->assertArrayHasKey('creation_time', $props, 'Test that the \'creation_time\' property has been set');
		$this->assertEquals(0, $props['content_count'], 'Test that the \'content_count\' is 0');
		$this->assertEquals(0, $props['content_unread'], 'Test that the \'content_unread\' is 0');
		$this->assertArrayHasKey('message_size', $props, 'Test that the \'message_size\' property has been set');
		$this->assertArrayHasKey('store_size', $props, 'Test that the \'store_size\' property has been set');
		$this->assertTrue($props['subfolders'], 'Test that no subfolders are present');
	}

	/*
	 * Test the if the properties were correctly saved
	 */
	public function testSaveFolderResult()
	{
		$folder = $this->user->saveFolder($this->folder);
		$props = $this->user->getFolderProps($folder, array(PR_ENTRYID, PR_PARENT_ENTRYID, PR_STORE_ENTRYID));

		$folder = array(
			'entryid' => bin2hex($props[PR_ENTRYID]),
			'parent_entryid' => bin2hex($props[PR_PARENT_ENTRYID]),
			'store_entryid' => bin2hex($props[PR_STORE_ENTRYID]),
			'props' => array(
				'display_name' => 'Second test',
				'comment' => 'Test comment',
				'container_class' => 'IPF.Appointment'
			)
		);

		$this->user->saveFolder($folder);

		$folder = $this->user->openFolder($props[PR_ENTRYID]);
		$props = $folder['item']['props'];

		$this->assertEquals('Second test', $props['display_name'], 'Test that we have opened the \'Inbox\'');
		$this->assertEquals('IPF.Note', $props['container_class'], 'Test that the \'container_class\' is correctly set');
		$this->assertEquals('Test comment', $props['comment'], 'Test that the comment is set on the folder');
	}

	/*
	 * Test that the folder can be deleted
	 */
	public function testDeleteFolder()
	{
		try {
			$folder = $this->user->saveFolder($this->folder);
			$props = $this->user->getFolderProps($folder, array(PR_ENTRYID));
			$response = $this->user->deleteFolder($props[PR_ENTRYID]);
		} catch (Exception $e) {
			$this->fail('Test that a folder can be deleted: ' . $e->getMessage() . PHP_EOL . $e->getTraceAsString());
		}

		$this->assertArrayHasKey('success', $response, 'Test that the response contains the \'success\' property');

		$folder = $this->user->openFolder($props[PR_ENTRYID]);

		$this->assertEquals(bin2hex($this->user->getDefaultFolderEntryID(PR_IPM_WASTEBASKET_ENTRYID)), $folder['item']['parent_entryid'], 'Test that the folder is located in the trash');
	}

	/*
	 * Test if the folder were correctly renamed
	 */
	public function testRenameFolder()
	{
		$folder = $this->user->saveFolder($this->folder);
		$props = $this->user->getFolderProps($folder, array(PR_ENTRYID, PR_PARENT_ENTRYID, PR_STORE_ENTRYID));

		$folder = array(
			'entryid' => bin2hex($props[PR_ENTRYID]),
			'parent_entryid' => bin2hex($props[PR_PARENT_ENTRYID]),
			'store_entryid' => bin2hex($props[PR_STORE_ENTRYID]),
			'props' => array(
				'display_name' => 'Folder Name',
			)
		);

		$this->user->saveFolder($folder);

		// the restriction is used to obtain the list of folders based on the folder's entryid
		$restriction = Restriction::ResProperty(PR_ENTRYID, $props[PR_ENTRYID], RELOP_EQ);
		
		// assert that the folder is found based on given entryid
		$folderList = $this->user->getFolders($restriction);
		$this->assertNotEmpty($folderList, 'Test that the folder is found based on the restriction');

		// assert that the folder is renamed successfully
		$folderProps = $this->user->getFolderProps($folderList[0], array(PR_DISPLAY_NAME));
		$this->assertEquals('Folder Name', $folderProps[PR_DISPLAY_NAME], 'Test that the folder is renamed successfully');
	}

	/*
	 * Test if the folder were correctly renamed while there is another folder with same name already available
	 */
	public function testRenameFolderConflict()
	{
		$folder = $this->user->saveFolder($this->folder);

		// create another folder, and save it
		$folderObj = array(
			'props' => TestData::getFolder(array(
				'display_name' => 'Folder Name'
			))
		);
		$this->user->saveFolder($folderObj);

		$props = $this->user->getFolderProps($folder, array(PR_ENTRYID, PR_PARENT_ENTRYID, PR_STORE_ENTRYID));

		$folder = array(
			'entryid' => bin2hex($props[PR_ENTRYID]),
			'parent_entryid' => bin2hex($props[PR_PARENT_ENTRYID]),
			'store_entryid' => bin2hex($props[PR_STORE_ENTRYID]),
			'props' => array(
				'display_name' => 'Folder Name',
			)
		);

		$this->user->saveFolder($folder);

		// the restriction is used to obtain the list of folders based on the folder's entryid
		$restriction = Restriction::ResProperty(PR_ENTRYID, $props[PR_ENTRYID], RELOP_EQ);
		// assert that the folder is renamed successfully
		$folderList = $this->user->getFolders($restriction);
		$folderProps = $this->user->getFolderProps($folderList[0], array(PR_DISPLAY_NAME));

		$this->assertNotEquals('Folder Name', $folderProps[PR_DISPLAY_NAME], 'Test that the folder is not renamed as there is another folder with same name');
	}

	/*
	 * Test if proper Exception will be thrown for rename while
	 * there is another folder with same name already available.
	 */
	public function testRenameFolderConflictException()
	{
		$folder = $this->user->saveFolder($this->folder);

		// create another folder, and save it
		$folderObj = array(
			'props' => TestData::getFolder(array(
				'display_name' => 'Folder Name'
			))
		);
		$this->user->saveFolder($folderObj);

		$props = $this->user->getFolderProps($folder, array(PR_ENTRYID, PR_PARENT_ENTRYID, PR_STORE_ENTRYID));

		$folder = array(
			'entryid' => bin2hex($props[PR_ENTRYID]),
			'parent_entryid' => bin2hex($props[PR_PARENT_ENTRYID]),
			'store_entryid' => bin2hex($props[PR_STORE_ENTRYID]),
			'props' => array(
				'display_name' => 'Folder Name',
			)
		);

		$response = $this->user->saveFolder($folder);

		$this->assertArrayHasKey('error', $response, 'Test that the response contains the \'error\' array');
		$this->assertArrayHasKey('info', $response['error'], 'Test that the response contains the \'info\' array');
		$this->assertArrayHasKey('display_message', $response['error']['info'], 'Test that the response contains the error message');
		$this->assertEquals(MAPI_E_COLLISION, $response['error']['info']['hresult'], 'Test that the response contains the error code for collision');
	}

	/*
	 * Test if the name will be reconfigured to its original value while
	 * there is another folder with same name already available.
	 */
	function testRenameFolderDisplayNameConflict()
	{
		$folder = $this->user->saveFolder($this->folder);

		// create another folder, and save it
		$folderObj = array(
			'props' => TestData::getFolder(array(
				'display_name' => 'Folder Name'
			))
		);
		$this->user->saveFolder($folderObj);

		$props = $this->user->getFolderProps($folder, array(PR_ENTRYID, PR_PARENT_ENTRYID, PR_STORE_ENTRYID, PR_DISPLAY_NAME));

		$folder = array(
			'entryid' => bin2hex($props[PR_ENTRYID]),
			'parent_entryid' => bin2hex($props[PR_PARENT_ENTRYID]),
			'store_entryid' => bin2hex($props[PR_STORE_ENTRYID]),
			'props' => array(
				'display_name' => 'Folder Name',
			)
		);
		$this->user->saveFolder($folder);

		// Get Inbox folder, in which there is conflicting folder name
		$parentFolder = $this->user->getReceiveFolder();

		// Find the folder on which we tried to rename, by applying entryid restriction
		$hierarchyTable = mapi_folder_gethierarchytable($parentFolder, MAPI_DEFERRED_ERRORS);
		$restriction = Restriction::ResProperty(PR_ENTRYID, $props[PR_ENTRYID], RELOP_EQ);
		mapi_table_restrict($hierarchyTable, $restriction);
		$folderList = mapi_table_queryallrows($hierarchyTable, array(PR_DISPLAY_NAME));

		// Check that the folder is there in Inbox, and make sure that folder name is as it was before
		$this->assertNotEmpty($folderList, 'Test that the folder is found based on the restriction');
		$this->assertEquals($props[PR_DISPLAY_NAME], $folderList[0][PR_DISPLAY_NAME], 'Test that the folder name is as it was due to name conflict');
	}
}

?>
