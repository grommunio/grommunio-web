<?php
require_once('classes/KopanoTest.php');

/**
 * ABEntryidTest
 *
 * Tests comparing entryids
 */
class ABEntryidTest extends KopanoTest {

	// Addressbook entryid
	private $abEntryId1 = '00000000AC21A95040D3EE48B319FBA7533044250100000006000000390400004D6A41334D5449774E7A453D00000000';
	private $abEntryId2 = '00000000AC21A95040D3EE48B319FBA7533044250100000006000000C90300004D6A41334D5449774E7A453D00000000';
	private $abEntryId3 = '00000000AC21A95040D3EE48B319FBA7533044250100000006000000C90400004D6B41334D5449774E7A453D00000000';
	// Addressbook OneOff entryid
	private $abEntryId4 = '00000000812B1FA4BEA310199D6E00DD010F54020000018041006E006400720065006100730020005200F60073006C0065007200000053004D0054005000000061002E0072006F00650073006C006500720040007A00610072006100660061007300650072007600650072002E00640065000000';
	// Addressbook contact provider entryid
	private $abEntryId5 = '00000000FE42AA0A18C71A10E8850B651C2400000300000004000000000000003000000000000000F27A29F89E9E488D941107E300C2142F0100000005000000A025B2462C601245A0A04D72C50D400C00000000000000';
	// Addressbook global addressbook container entryid
	private $abEntryId6 = '00000000AC21A95040D3EE48B319FBA75330442500000000040000000100000000000000';

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
		$this->assertTrue(self::$entryid->compareABEntryIds($this->abEntryId1, $this->abEntryId1), 'Test that comparing equal addressbook entryids return true');
	}

	/**
	 * Test comparing unequal entryids for the same server
	 */
	public function testCompareUnequalEntryIdsSameServer()
	{
		$this->assertTrue(self::$entryid->compareABEntryIds($this->abEntryId1, $this->abEntryId2), 'Test that comparing unequal addressbook entryids for the same user return true');
	}

	/**
	 * Test comparing different entryids
	 */
	public function testCompareUnequalEntryIds()
	{
		$this->assertFalse(self::$entryid->compareABEntryIds($this->abEntryId1, $this->abEntryId3), 'Test that comparing unequal addressbook entryids return false');
	}

	/**
	 * Check if an entryid is a one-off entryid
	 */
	public function testIsOneOff()
	{
		$this->assertTrue(self::$entryid->isOneOffEntryId($this->abEntryId4), 'Test that a one-off entryid is correctly detected');
	}

	/**
	 * Check if an entryid is not a one-off entryid
	 */
	public function testIsNotOneOff()
	{
		$this->assertFalse(self::$entryid->isOneOffEntryId($this->abEntryId1), 'Test that a non-one-off entryid is correctly detected');
	}

	/**
	 * Check if an entryid is contact provider entryid
	 * @FIXME not working
	 */
	public function xtestIsContactProvider()
	{
		$this->assertTrue(self::$entryid->hasContactProviderGUID($this->abEntryId5), 'Test that a contact provider entryid is correctly detected');
	}

	/**
	 * Check if an entryid is not contact provider entryid
	 */
	public function testIsNotContactProvider()
	{
		$this->assertFalse(self::$entryid->hasContactProviderGUID($this->abEntryId1), 'Test that a non contact provider entryid is correctly detected');
	}

	/**
	 * Check if an entryid is global addressbook entryid
	 */
	public function testIsGlobalAddressbook()
	{
		$this->assertTrue(self::$entryid->hasAddressBookGUID($this->abEntryId1), 'Test that a global addressbook entryid is correctly detected');
	}

	/**
	 * Check if an entryid is not global addressbook entryid
	 */
	public function testIsNotGlobalAddressbook()
	{
		$this->assertFalse(self::$entryid->hasAddressBookGUID($this->abEntryId5), 'Test that non global addressbook entryid is correctly detected');
	}

	/**
	 * Check if an entryid is global addressbook container entryid
	 */
	public function testIsGlobalAddressbookContainer()
	{
		$this->assertTrue(self::$entryid->isGlobalAddressbookContainer($this->abEntryId6), 'Test that a global addressbook root entryid is correctly detected');
	}

	/**
	 * Check if an entryid is not global addressbook entryid
	 */
	public function testIsNotGlobalAddressbookRoot()
	{
		$this->assertFalse(self::$entryid->isGlobalAddressbookContainer($this->abEntryId1), 'Test that not global addressbook root entryid is correctly detected');
	}
}

?>
