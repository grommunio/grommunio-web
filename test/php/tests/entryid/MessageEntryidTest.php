<?php
require_once('classes/KopanoTest.php');

/**
 * MessageEntryidTest
 *
 * Tests comparing message entryids
 */
class MessageEntryidTest extends KopanoTest {

	private $msgEntryId1 = '0000000009744DEFBBCF4305A3E904250834910801000000050000007A483717159548D3A5BA63B743BEED9500000000';
	private $msgEntryId2 = '0000000009744defbbcf4305a3e9042508349108010000000500000003cf8977e8cd48529088946e312983d400000000';

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
		$this->assertTrue(self::$entryid->compareEntryIds($this->msgEntryId1, $this->msgEntryId1), 'Test that comparing equal message entryids return true');
	}

	/**
	 * Test comparing different entryids
	 */
	public function testCompareUnequalEntryIds()
	{
		$this->assertFalse(self::$entryid->compareEntryIds($this->msgEntryId1, $this->msgEntryId2), 'Test that comparing unequal message entryids return false');
	}
}

?>
