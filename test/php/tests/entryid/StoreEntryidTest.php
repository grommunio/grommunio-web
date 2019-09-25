<?php
require_once('classes/KopanoTest.php');

/**
 * StoreEntryidTest
 *
 * Tests comparing store entryids
 */
class StoreEntryidTest extends KopanoTest {

	/**
	 * psuedo url as server name
	 */
	private $strEntryId1 = '0000000038a1bb1005e5101aa1bb08002b2a56c200007a617261666136636c69656e742e646c6c000000000009744defbbcf4305a3e90425083491080100000001000000231e8f3353914e6fbe75a7df49f9a4a870736575646f3a2f2f5a617261666100';
	/**
	 * socket url as server name
	 */
	private $strEntryId2 = '0000000038a1bb1005e5101aa1bb08002b2a56c200007a617261666136636c69656e742e646c6c000000000009744defbbcf4305a3e90425083491080100000001000000231e8f3353914e6fbe75a7df49f9a4a866696c653a2f2f2f7661722f72756e2f7a617261666100';
	private $strEntryId3 = '0000000038A1BB1005E5101AA1BB08002B2A56C200007A617261666136636C69656E742E646C6C00000000001A2BB1DF088E453CB94B73D67E0BAB100100000001000000A9591000F7CC4438BB66A5C355DD8D5670736575646F3A2F2F5A617261666100';

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
		$this->assertTrue(self::$entryid->compareStoreEntryIds($this->strEntryId1, $this->strEntryId1), 'Test that comparing equal store entryids return true');
	}

	/**
	 * Test comparing unequal entryids for the same server
	 */
	public function testCompareUnequalEntryIdsSameServer()
	{
		$this->assertTrue(self::$entryid->compareStoreEntryIds($this->strEntryId1, $this->strEntryId2), 'Test that comparing unequal store entryids for the same store return true');
	}

	/**
	 * Test comparing different entryids
	 */
	public function testCompareUnequalEntryIds()
	{
		$this->assertFalse(self::$entryid->compareStoreEntryIds($this->strEntryId1, $this->strEntryId3), 'Test that comparing unequal store entryids return false');
	}
}

?>
