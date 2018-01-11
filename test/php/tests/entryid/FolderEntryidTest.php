<?php
require_once('classes/KopanoTest.php');

/**
 * FolderEntryidTest
 *
 * Tests comparing folder entryids
 */
class FolderEntryidTest extends KopanoTest {

	/**
	 * Calendar folder
	 */
	private $fldEntryId1 = '000000001A2BB1DF088E453CB94B73D67E0BAB100100000003000000CB0942D278F2427E92A144FD14A49E9A00000000';
	/**
	 * Contact folder
	 */
	private $fldEntryId2 = '000000001A2BB1DF088E453CB94B73D67E0BAB1001000000030000004FF7D3A825534895B4CA5AC93F06388C00000000';
	/**
	 * Favourite folder
	 */
	private $fldEntryId3 = '00000001434D3D38F4414020A03B93FB33FCB5D20100000003000000B963619E6AC6408CA540FEED858719BC00000000';
	/**
	 * same folder but from original location
	 */
	private $fldEntryId4 = '00000000434D3D38F4414020A03B93FB33FCB5D20100000003000000B963619E6AC6408CA540FEED858719BC00000000';
	/**
	 * entryid of Favorites folder
	 */
	private $fldEntryId5 = '00000000CC4AB09973954587A150637E0F30515901000000030000000000000000000000000000000000000200000000';
	/**
	 * entryid of ipm_subtree of public store
	 */
	private $fldEntryId6 = '00000000CC4AB09973954587A150637E0F30515901000000030000000000000000000000000000000000000100000000';
	/**
	 * entryid of root folder of public store
	 */
	private $fldEntryId7 = '00000000CC4AB09973954587A150637E0F30515901000000030000000000000000000000000000000000000300000000';

	protected static $entryid;

	public static function setUpBeforeClass()
	{
		self::$entryid = new EntryId();
	}

	/**
	 * Test comparing equal entryids
	 */
	public function testCompareEqualEntryIds()
	{
		$this->assertTrue(self::$entryid->compareEntryIds($this->fldEntryId1, $this->fldEntryId1), 'Test that comparing equal entryids return true');
	}

	/**
	 * Test comparing different entryids
	 */
	public function testCompareUnequalEntryIds()
	{
		$this->assertFalse(self::$entryid->compareEntryIds($this->fldEntryId1, $this->fldEntryId2), 'Test that comparing unequal entryids return false');
	}

	/**
	 * Test compare two folder entryids, where one is the actual folder, and the second is the favorite folder
	 */
	public function testCompareNormalEntryIdWithFavoriteEntryId()
	{
		$this->assertFalse(self::$entryid->compareEntryIds($this->fldEntryId3, $this->fldEntryId4), 'Test that comparing non-favorite with favorite entryids return false');
	}

	/**
	 * Test that we can check if the folder is favorite
	 */
	public function testCheckIsFavorite()
	{
		$this->assertTrue(self::$entryid->isFavoriteFolder($this->fldEntryId3), 'Test that the folder is recognized as favorite');
	}

	/**
	 * Test that we can check if the folder is not favorite
	 */
	public function testCheckIsNotFavorite()
	{
		$this->assertFalse(self::$entryid->isFavoriteFolder($this->fldEntryId4), 'Test that the folder is recognized as favorite');
	}

	/**
	 * Test if the folder is a favorite root folder
	 */
	public function testCheckIsFavoriteRoot()
	{
		$this->assertTrue(self::$entryid->isFavoriteRootFolder($this->fldEntryId5), 'Test that the folder is recognized as favorites root');
	}

	/**
	 * Test if the folder is the IPM_SUBTREE of the public store
	 */
	public function testCheckIsPublicSubtree()
	{
		$this->assertTrue(self::$entryid->isPublicSubtreeFolder($this->fldEntryId6), 'Test that the folder is recognized as the public subtree');
	}

	/**
	 * Test if the folder is the root of the public store
	 */
	public function testCheckIsPublicRoot()
	{
		$this->assertTrue(self::$entryid->isPublicRootFolder($this->fldEntryId7), 'Test that the folder is recognized as public root');
	}
}

?>
