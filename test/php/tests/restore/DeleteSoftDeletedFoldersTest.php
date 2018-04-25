<?php
require_once('classes/KopanoUser.php');
require_once('classes/HierarchyUser.php');
require_once('classes/TestData.php');
require_once('classes/KopanoTest.php');
require_once('classes/RestoreFolderUser.php');

class DeleteSoftDeletedFolders extends KopanoTest {
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
	}

	/**
	 * Tests if soft deleted folder will be hard-deleted successfully
	 */
	public function testDeleteSoftDeletedFolder()
	{
		try {
			$response = $this->restoreUser->deleteSoftdeletedItems(array($this->softDeletedId));
		} catch (Exception $e) {
			$this->fail('Test that a folder can be hard-deleted: ' . $e->getMessage() . PHP_EOL . $e->getTraceAsString());
		}

		$this->assertArrayHasKey('success', $response[0], 'Test that the response contains the \'success\' property');
	}

	/**
	 * Tests if the folder is not there into the soft deleted message list after hard-delete
	 * @expectedException MAPIException
	 */
	public function testSoftDeletedFolderDeletedPermanently()
	{
		try {
			$this->restoreUser->deleteSoftdeletedItems(array($this->softDeletedId));
		} catch(Exception $e) {
			$this->fail('Test that a folder can be hard-deleted: ' . $e->getMessage() . PHP_EOL . $e->getTraceAsString());
		}

		// assert that the soft-deleted folder list is empty
		$softDeletedFolders = $this->restoreUser->loadSoftdeletedItems();
		$this->assertEmpty($softDeletedFolders, 'Test that there is no soft deleted folders after hard-delete');

		// assert that MAPIException will be thrown while opening the soft deleted folder which is Permanently Deleted
		mapi_msgstore_openentry($this->hierarchyUser->getDefaultMessageStore(), $this->softDeletedId, SHOW_SOFT_DELETES);
	}

	/*
	 * Tests if all the soft deleted folders will be hard-deleted
	 */
	public function testDeleteAllSoftDeletedFolders()
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
			$response = $this->restoreUser->deleteSoftdeletedItems($props);
		} catch (Exception $e) {
			$this->fail('Test that some folders can be soft deleted and hard-deleted too: ' . $e->getMessage() . PHP_EOL . $e->getTraceAsString());
		}

		$this->assertArrayHasKey('success', $response[0], 'Test that the first response contains the \'success\' property');
		$this->assertArrayHasKey('success', $response[1], 'Test that the second response contains the \'success\' property');
		$this->assertArrayHasKey('success', $response[2], 'Test that the third response contains the \'success\' property');
	}

	/**
	 * Tests if all the folders are not there into the soft deleted folder list after hard-delete all those folders
	 */
	public function testAllSoftDeletedFoldersDeletedPermanently()
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
			$this->restoreUser->deleteSoftdeletedItems($props);
		} catch (Exception $e) {
			$this->fail('Test that some folders can be soft deleted and and hard-deleted too: ' . $e->getMessage() . PHP_EOL . $e->getTraceAsString());
		}

		// assert that the soft-deleted folder list is empty
		$softDeletedFolders = $this->restoreUser->loadSoftdeletedItems();
		$this->assertEmpty($softDeletedFolders, 'Test that there is no soft deleted folders after hard-delete all');
	}
}
?>
