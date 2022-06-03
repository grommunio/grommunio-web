<?php

require_once 'classes/grommunioUser.php';
require_once 'classes/HierarchyUser.php';
require_once 'classes/TestData.php';
require_once 'classes/grommunioTest.php';
require_once 'classes/RestoreFolderUser.php';

/**
 * @internal
 * @coversNothing
 */
class LoadRestoreFolders extends grommunioTest {
	/**
	 * The default user which will be sending request to retrieve soft deleted folders.
	 */
	private $restoreUser;

	/**
	 * The user for which we will open the hierarchy.
	 */
	private $hierarchyUser;

	/**
	 * The folder which will be saved.
	 */
	private $folder;

	/**
	 * During setUp we create the user.
	 */
	protected function setUp() {
		parent::setUp();

		$this->restoreUser = $this->addUser(new RestoreFolderUser(new grommunioUser(GROMMUNIO_USER1_NAME, GROMMUNIO_USER1_PASSWORD)));
		$this->hierarchyUser = $this->addUser(new HierarchyUser(new grommunioUser(GROMMUNIO_USER1_NAME, GROMMUNIO_USER1_PASSWORD)));

		$this->folder = [
			'props' => TestData::getFolder(),
		];
	}

	/*
	 * Test if there is no soft deleted folders
	 */
	public function testEmptySoftDeletedFolderList() {
		$softDeletedFolders = $this->restoreUser->loadSoftdeletedItems();

		$this->assertEmpty($softDeletedFolders, 'Test that there is no soft deleted Folders');
	}

	/*
	 * Test that the folder can be soft deleted
	 */
	public function testSoftDeleteFolder() {
		$folder = $this->hierarchyUser->saveFolder($this->folder);
		$props = $this->hierarchyUser->getFolderProps($folder, [PR_ENTRYID]);
		$response = $this->hierarchyUser->deleteFolder($props[PR_ENTRYID], ['soft_delete' => true]);

		$this->assertArrayHasKey('success', $response, 'Test that the response contains the \'success\' property');
	}

	/*
	 * Test that the folder can be soft deleted and correct folder will be returned in response
	 */
	public function testCompareSoftDeletedFolder() {
		$folder = $this->hierarchyUser->saveFolder($this->folder);
		$props = $this->hierarchyUser->getFolderProps($folder, [PR_ENTRYID]);
		$response = $this->hierarchyUser->deleteFolder($props[PR_ENTRYID], ['soft_delete' => true]);

		$this->assertArrayHasKey('success', $response, 'Test that the response contains the \'success\' property');

		$softDeletedFolders = $this->restoreUser->loadSoftdeletedItems();

		$this->assertNotEmpty($softDeletedFolders, 'Test that there is some soft deleted Folders');

		$this->assertEntryIdEquals($softDeletedFolders[0]['entryid'], bin2hex($props[PR_ENTRYID]), 'Test that the correct folder is deleted by comparing \'entryid\'');
	}

	/*
	 * Test that the soft deleted folder list display with proper 'sort' order
	 */
	public function xtestSoftDeletedFolderSortOrder() {
		$folderObjA = [
			'props' => TestData::getFolder([
				'display_name' => 'A',
			]),
		];

		$folderObjB = [
			'props' => TestData::getFolder([
				'display_name' => 'B',
			]),
		];

		$folderObjC = [
			'props' => TestData::getFolder([
				'display_name' => 'C',
			]),
		];

		try {
			$folderA = $this->hierarchyUser->saveFolder($folderObjA);
			$folderB = $this->hierarchyUser->saveFolder($folderObjB);
			$folderC = $this->hierarchyUser->saveFolder($folderObjC);

			$propsA = $this->hierarchyUser->getFolderProps($folderA, [PR_ENTRYID]);
			$propsB = $this->hierarchyUser->getFolderProps($folderB, [PR_ENTRYID]);
			$propsC = $this->hierarchyUser->getFolderProps($folderC, [PR_ENTRYID]);

			$this->hierarchyUser->deleteFolder($propsA[PR_ENTRYID], ['soft_delete' => true]);
			$this->hierarchyUser->deleteFolder($propsB[PR_ENTRYID], ['soft_delete' => true]);
			$this->hierarchyUser->deleteFolder($propsC[PR_ENTRYID], ['soft_delete' => true]);
		}
		catch (Exception $e) {
			$this->fail('Test that some folders can be soft deleted: ' . $e->getMessage() . PHP_EOL . $e->getTraceAsString());
		}

		$sortOrder = [
			'sort' => [
				0 => [
					'direction' => 'ASC',
					'field' => 'display_name',
				],
			],
		];

		$softDeletedFolders = $this->restoreUser->loadSoftdeletedItems($sortOrder);

		$this->assertEquals($softDeletedFolders[0]['props']['display_name'], 'A', 'Test that the soft deleted folder list is correctly sorted in Ascending order');

		$sortOrder['sort'][0]['direction'] = 'DESC';

		$softDeletedFolders = $this->restoreUser->loadSoftdeletedItems($sortOrder);

		$this->assertEquals($softDeletedFolders[0]['props']['display_name'], 'C', 'Test that the soft deleted folder list is correctly sorted in Descending order');
	}
}
