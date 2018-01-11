<?php
require_once('classes/KopanoUser.php');
require_once('classes/HierarchyUser.php');
require_once('classes/TestData.php');
require_once('classes/KopanoTest.php');
require_once('classes/RestoreFolderUser.php');

class RestoreSoftDeletedFolders extends KopanoTest {
	/**
	 * The default user which will be sending request to retrieve soft deleted folders
	 */
	private $restoreUser;

	/**
	 * The user for which we will open the hierarchy
	 */
	private $hierarchyUser;

	/**
	 * The folder which will be saved
	 */
	private $folder;

	/**
	 * The entryid of the soft-deleted folder
	 */
	private $softDeletedId;

	/**
	 * The entryid of the parent folder from which folder will be soft-deleted
	 */
	private $parentId;

	/**
	 * During setUp we create the user
	 */
	protected function setUp()
	{
		parent::setUp();

		$this->restoreUser = $this->addUser(new RestoreFolderUser(new KopanoUser(KOPANO_USER1_NAME, KOPANO_USER1_PASSWORD)));
		$this->hierarchyUser = $this->addUser(new HierarchyUser(new KopanoUser(KOPANO_USER1_NAME, KOPANO_USER1_PASSWORD)));

		$this->folder = array(
			'props' => TestData::getFolder()
		);

		$folder = $this->hierarchyUser->saveFolder($this->folder);
		$this->softDeletedId = $this->hierarchyUser->getFolderProps($folder, array(PR_ENTRYID));
		$this->softDeletedId = $this->softDeletedId[PR_ENTRYID];
		$this->hierarchyUser->deleteFolder($this->softDeletedId, array('soft_delete' => true));

		$this->parentId = $this->hierarchyUser->getReceiveFolderEntryID();
	}

	/**
	 * Tests if soft deleted folder will be restored
	 */
	public function testRestoreSoftDeletedFolder()
	{
		try {
			$response = $this->restoreUser->restoreSoftdeletedItems(array($this->softDeletedId));
		} catch (Exception $e) {
			$this->fail('Test that a folder can be restored: ' . $e->getMessage() . PHP_EOL . $e->getTraceAsString());
		}

		$this->assertArrayHasKey('success', $response[0], 'Test that the response contains the \'success\' property');
	}

	/**
	 * Tests if soft deleted the folder is restored successfully and is present into the 'Inbox'
	 */
	public function testSoftDeletedFoldersRestoredInInbox()
	{
		try {
			$this->restoreUser->restoreSoftdeletedItems(array($this->softDeletedId));
		} catch(Exception $e) {
			$this->fail('Test that a folder can be restored: ' . $e->getMessage() . PHP_EOL . $e->getTraceAsString());
		}

		// assert that the soft-deleted folder list is empty
		$softDeletedFolders = $this->restoreUser->loadSoftdeletedItems();
		$this->assertEmpty($softDeletedFolders, 'Test that there is no soft deleted folders after restore');

		// the restriction is used to obtain the list of folders based on the folder's display name
		$restriction = Restriction::ResContent(PR_DISPLAY_NAME, 'Test folder', FL_FULLSTRING | FL_IGNORECASE);

		// assert that the folder is restored successfully and is present into the 'Inbox' folder
		$foldersList = $this->hierarchyUser->getFolders($restriction);
		$folderProps = $this->hierarchyUser->getFolderProps($foldersList[0], array(PR_PARENT_ENTRYID));

		$this->assertEntryIdEquals($this->parentId, $folderProps[PR_PARENT_ENTRYID], 'Test that the folder is there into the Inbox');
	}

	/*
	 * Tests if all the soft deleted folders will be restored
	 */
	public function testRestoreAllSoftDeletedFolders()
	{
		$folderObjA = array(
			'props' => TestData::getFolder(array(
				'display_name' => 'A'
			))
		);

		$folderObjB = array(
			'props' => TestData::getFolder(array(
				'display_name' => 'B'
			))
		);

		try {
			$folderA = $this->hierarchyUser->saveFolder($folderObjA);
			$folderB = $this->hierarchyUser->saveFolder($folderObjB);

			$propsA = $this->hierarchyUser->getFolderProps($folderA, array(PR_ENTRYID));
			$propsB = $this->hierarchyUser->getFolderProps($folderB, array(PR_ENTRYID));

			$this->hierarchyUser->deleteFolder($propsA[PR_ENTRYID], array('soft_delete' => true));
			$this->hierarchyUser->deleteFolder($propsB[PR_ENTRYID], array('soft_delete' => true));

			$props = array($propsA[PR_ENTRYID], $propsB[PR_ENTRYID], $this->softDeletedId);
			$response = $this->restoreUser->restoreSoftdeletedItems($props);
		} catch (Exception $e) {
			$this->fail('Test that some folders can be soft deleted and restored: ' . $e->getMessage() . PHP_EOL . $e->getTraceAsString());
		}

		$this->assertArrayHasKey('success', $response[0], 'Test that the first response contains the \'success\' property');
		$this->assertArrayHasKey('success', $response[1], 'Test that the second response contains the \'success\' property');
		$this->assertArrayHasKey('success', $response[2], 'Test that the third response contains the \'success\' property');
	}

	/**
	 * Tests if all the soft deleted folders are restored successfully and is present into the 'Inbox' folder
	 */
	public function testRestoreAllSoftDeletedFoldersInInbox()
	{
		$folderObjA = array(
			'props' => TestData::getFolder(array(
				'display_name' => 'A'
			))
		);

		$folderObjB = array(
			'props' => TestData::getFolder(array(
				'display_name' => 'B'
			))
		);

		try {
			$folderA = $this->hierarchyUser->saveFolder($folderObjA);
			$folderB = $this->hierarchyUser->saveFolder($folderObjB);

			$propsA = $this->hierarchyUser->getFolderProps($folderA, array(PR_ENTRYID));
			$propsB = $this->hierarchyUser->getFolderProps($folderB, array(PR_ENTRYID));

			$this->hierarchyUser->deleteFolder($propsA[PR_ENTRYID], array('soft_delete' => true));
			$this->hierarchyUser->deleteFolder($propsB[PR_ENTRYID], array('soft_delete' => true));

			$props = array($propsA[PR_ENTRYID], $propsB[PR_ENTRYID], $this->softDeletedId);
			$this->restoreUser->restoreSoftdeletedItems($props);
		} catch (Exception $e) {
			$this->fail('Test that some folders can be soft deleted and restored: ' . $e->getMessage() . PHP_EOL . $e->getTraceAsString());
		}

		// assert that the soft-deleted folder list is empty
		$softDeletedFolders = $this->restoreUser->loadSoftdeletedItems();
		$this->assertEmpty($softDeletedFolders, 'Test that there is no soft deleted folders after restore');

		// assert that the folders are restored successfully and is present into the hierarchy
		$restriction = Restriction::ResOr(array(
			Restriction::ResContent(PR_DISPLAY_NAME, 'A', FL_FULLSTRING | FL_IGNORECASE),
			Restriction::ResContent(PR_DISPLAY_NAME, 'B', FL_FULLSTRING | FL_IGNORECASE),
			Restriction::ResContent(PR_DISPLAY_NAME, 'Test folder', FL_FULLSTRING | FL_IGNORECASE),
		));

		$foldersList = $this->hierarchyUser->getFolders($restriction);

		$folderPropsA = $this->hierarchyUser->getFolderProps($foldersList[0], array(PR_PARENT_ENTRYID));
		$folderPropsB = $this->hierarchyUser->getFolderProps($foldersList[1], array(PR_PARENT_ENTRYID));
		$folderPropsC = $this->hierarchyUser->getFolderProps($foldersList[2], array(PR_PARENT_ENTRYID));

		$this->assertEntryIdEquals($this->parentId, $folderPropsA[PR_PARENT_ENTRYID], 'Test that the folder is there into the Inbox');
		$this->assertEntryIdEquals($this->parentId, $folderPropsB[PR_PARENT_ENTRYID], 'Test that the folder is there into the Inbox');
		$this->assertEntryIdEquals($this->parentId, $folderPropsC[PR_PARENT_ENTRYID], 'Test that the folder is there into the Inbox');
	}

	/**
	 * Tests if soft deleted folder will be restored with updated name to handle folder name conflicts
	 */
	public function testRestoreSoftDeletedFolderWithNameConflict()
	{
		$folderObj = array(
			'props' => TestData::getFolder(array(
				'display_name' => 'Test folder'
			))
		);

		try {
			$this->hierarchyUser->saveFolder($folderObj);
			$this->restoreUser->restoreSoftdeletedItems(array($this->softDeletedId));
		} catch (Exception $e) {
			$this->fail('Test that another folder with same name can be created under the same parent folder and soft deleted folder will be restored: ' . $e->getMessage() . PHP_EOL . $e->getTraceAsString());
		}

		// here, we are asserting that both the original and restored folder are there with modified name due to name conflicts
		$restriction = array(RES_CONTENT,
			array(FUZZYLEVEL => FL_PREFIX | FL_IGNORECASE,
				ULPROPTAG => PR_DISPLAY_NAME,
				VALUE => array(PR_DISPLAY_NAME => "Test folder")
			)
		);

		$foldersList = $this->hierarchyUser->getFolders($restriction);

		$fFolderProps = $this->hierarchyUser->getFolderProps($foldersList[0], array(PR_DISPLAY_NAME));
		$sFolderProps = $this->hierarchyUser->getFolderProps($foldersList[1], array(PR_DISPLAY_NAME));

		$this->assertEquals($fFolderProps[PR_DISPLAY_NAME], 'Test folder', 'Test that the original folder is there into the hierarchy');

		$this->assertEquals($sFolderProps[PR_DISPLAY_NAME], 'Test folder1', 'Test that the restored folder is there into the hierarchy with modified name');

		$fParentProps = $this->hierarchyUser->getFolderProps($foldersList[0], array(PR_PARENT_ENTRYID));
		$sParentProps = $this->hierarchyUser->getFolderProps($foldersList[1], array(PR_PARENT_ENTRYID));

		$this->assertEntryIdEquals($this->parentId, $fParentProps[PR_PARENT_ENTRYID], 'Test that the folder is there into the Inbox');
		$this->assertEntryIdEquals($this->parentId, $sParentProps[PR_PARENT_ENTRYID], 'Test that the folder is there into the Inbox');
	}
}
?>
