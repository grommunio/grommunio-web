<?php
require_once('classes/KopanoUser.php');
require_once('classes/HierarchyUser.php');
require_once('classes/TestData.php');
require_once('classes/KopanoTest.php');
require_once('classes/RestoreFolderUser.php');

class LoadRestoreFolders extends KopanoTest {
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
	}

	/*
	 * Test if there is no soft deleted folders
	 */
	public function testEmptySoftDeletedFolderList()
	{
		$softDeletedFolders = $this->restoreUser->loadSoftdeletedItems();

		$this->assertEmpty($softDeletedFolders, 'Test that there is no soft deleted Folders');
	}

	/*
	 * Test that the folder can be soft deleted
	 */
	public function testSoftDeleteFolder()
	{
		$folder = $this->hierarchyUser->saveFolder($this->folder);
		$props = $this->hierarchyUser->getFolderProps($folder, array(PR_ENTRYID));
		$response = $this->hierarchyUser->deleteFolder($props[PR_ENTRYID], array('soft_delete' => true));

		$this->assertArrayHasKey('success', $response, 'Test that the response contains the \'success\' property');
	}

	/*
	 * Test that the folder can be soft deleted and correct folder will be returned in response
	 */
	public function testCompareSoftDeletedFolder()
	{
		$folder = $this->hierarchyUser->saveFolder($this->folder);
		$props = $this->hierarchyUser->getFolderProps($folder, array(PR_ENTRYID));
		$response = $this->hierarchyUser->deleteFolder($props[PR_ENTRYID], array('soft_delete' => true));

		$this->assertArrayHasKey('success', $response, 'Test that the response contains the \'success\' property');

		$softDeletedFolders = $this->restoreUser->loadSoftdeletedItems();

		$this->assertNotEmpty($softDeletedFolders, 'Test that there is some soft deleted Folders');

		$this->assertEntryIdEquals($softDeletedFolders[0]['entryid'], bin2hex($props[PR_ENTRYID]), 'Test that the correct folder is deleted by comparing \'entryid\'');
	}

	/*
	 * Test that the soft deleted folder list display with proper 'sort' order
	 */
	public function xtestSoftDeletedFolderSortOrder()
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

		$folderObjC = array(
			'props' => TestData::getFolder(array(
				'display_name' => 'C'
			))
		);

		try {
			$folderA = $this->hierarchyUser->saveFolder($folderObjA);
			$folderB = $this->hierarchyUser->saveFolder($folderObjB);
			$folderC = $this->hierarchyUser->saveFolder($folderObjC);

			$propsA = $this->hierarchyUser->getFolderProps($folderA, array(PR_ENTRYID));
			$propsB = $this->hierarchyUser->getFolderProps($folderB, array(PR_ENTRYID));
			$propsC = $this->hierarchyUser->getFolderProps($folderC, array(PR_ENTRYID));

			$this->hierarchyUser->deleteFolder($propsA[PR_ENTRYID], array('soft_delete' => true));
			$this->hierarchyUser->deleteFolder($propsB[PR_ENTRYID], array('soft_delete' => true));
			$this->hierarchyUser->deleteFolder($propsC[PR_ENTRYID], array('soft_delete' => true));

		} catch (Exception $e) {
			$this->fail('Test that some folders can be soft deleted: ' . $e->getMessage() . PHP_EOL . $e->getTraceAsString());
		}

		$sortOrder = array(
			'sort' => array(
				0 => array(
					'direction' => 'ASC',
					'field' => 'display_name'
				)
			)
		);

		$softDeletedFolders = $this->restoreUser->loadSoftdeletedItems($sortOrder);

		$this->assertEquals($softDeletedFolders[0]['props']['display_name'], 'A', 'Test that the soft deleted folder list is correctly sorted in Ascending order');

		$sortOrder['sort'][0]['direction'] = 'DESC';

		$softDeletedFolders = $this->restoreUser->loadSoftdeletedItems($sortOrder);

		$this->assertEquals($softDeletedFolders[0]['props']['display_name'], 'C', 'Test that the soft deleted folder list is correctly sorted in Descending order');
	}
}
?>
