<?php
require_once('classes/KopanoUser.php');
require_once('classes/CalendarUser.php');
require_once('classes/TestData.php');
require_once('classes/KopanoTest.php');

/**
 * MeetingRequestTest
 *
 */
class MeetingRequestTest extends KopanoTest {
	/**
	 * The default user
	 */
	private $user;

	/**
	 * The meeting request which will be handled
	 */
	private $mr;

	/**
	 * Disable direct booking
	 */
	private $directBookingMeetingRequest = false;

	/**
	 * During setUp we create the user
	 */
	protected function setUp()
	{
		parent::setUp();

		$this->user = $this->addUser(new CalendarUser(new KopanoUser(KOPANO_USER1_NAME, KOPANO_USER1_PASSWORD)));
		$this->getMeetingRequest();
	}

	private function getMeetingRequest()
	{
		if (!$this->mr) {
			$session = $this->user->getSession();
			$store = $this->user->getDefaultMessageStore();
			$addrbook = mapi_openaddressbook($session);
			$inbox = mapi_msgstore_getreceivefolder($store);

			$eml = file_get_contents('./tests/meetings/meeting_request.eml');
			$message = mapi_folder_createmessage($inbox);
			mapi_inetmapi_imtomapi($session, $store, $addrbook, $message, $eml, array());
			mapi_savechanges($message);
			$this->mr = new Meetingrequest($store, $message, $session, $this->directBookingMeetingRequest);
		}

		return $this->mr;
	}

	private function isInboxEmpty()
	{
		$entryid = $this->user->getReceiveFolderEntryID();
		$store = $this->user->getDefaultMessageStore();
		$folder = mapi_msgstore_openentry($store, $entryid);
		$table = mapi_folder_getcontentstable($folder);
		$rows = mapi_table_queryallrows($table);
		return empty($rows);
	}

	public function testIsMeetingRequest()
	{
		$this->assertTrue($this->mr->isMeetingRequest());
	}

	public function testIsMeetingRequestResponse()
	{
		$this->assertFalse($this->mr->isMeetingRequestResponse());
	}

	public function testIsLocalOrganiser()
	{
		$this->assertFalse($this->mr->isLocalOrganiser());
	}

	public function testIsMeetingCancellation()
	{
		$this->assertFalse($this->mr->isMeetingCancellation());
	}

	public function testIsMeetingOutOfDate()
	{
		$this->assertFalse($this->mr->isMeetingOutOfDate());
	}

	public function testIsMeetingConflicting()
	{
		$this->assertFalse($this->mr->isMeetingConflicting());
	}

	public function testIsMeetingUpdated()
	{
		$this->assertFalse($this->mr->isMeetingUpdated());
	}

	public function testIsInCalendar()
	{
		$this->assertFalse($this->mr->isInCalendar());
	}

	public function testOpenParentFolder()
	{
		$this->assertInternalType(PHPUnit_Framework_Constraint_IsType::TYPE_RESOURCE, $this->mr->openParentFolder());
	}

	public function testOpenDefaultCalendar()
	{
		$this->assertInternalType(PHPUnit_Framework_Constraint_IsType::TYPE_RESOURCE, $this->mr->openDefaultCalendar());
	}

	public function testOpenDefaultOutbox()
	{
		$this->assertInternalType(PHPUnit_Framework_Constraint_IsType::TYPE_RESOURCE, $this->mr->openDefaultOutBox());
	}

	public function testOpenDefaultWastebasket()
	{
		$this->assertInternalType(PHPUnit_Framework_Constraint_IsType::TYPE_RESOURCE, $this->mr->openDefaultWastebasket());
	}

	/**
	 * Test decline a meeting request, sending no mail to the organizer.
	 */
	public function testDecline()
	{
		$this->assertFalse($this->isInboxEmpty());
		$this->mr->doDecline(false);
		$this->assertTrue($this->isInboxEmpty());
	}

	/**
	 * Test accepting an meeting request.
	 * FIXME: check organizer has received an update.
	 */
	public function testAccept()
	{
		$this->assertFalse($this->isInboxEmpty());
		$this->mr->doAccept(true, false, true, false, false, false, true);
		$this->assertTrue($this->isInboxEmpty());

		$calendarItem = $this->mr->getCorrespondentCalendarItem(true);
		
		$proposalTag = $this->mr->proptags['counter_proposal'];
		$props = mapi_getprops($calendarItem, array($proposalTag));
		$this->assertNull($props[$proposalTag]);
	}

	/**
	 * Test proposing a new time, sending no mail to the organizer.
	 * FIXME: check organizer has received an update.
	 */
	public function testProposeNewTime()
	{
		$this->assertFalse($this->isInboxEmpty());
		$this->mr->doAccept(true, false, true, 1538467200, 1538469000, "", true);
		$this->assertTrue($this->isInboxEmpty());
		$calendarItem = $this->mr->getCorrespondentCalendarItem(true);
		$proposalTag = $this->mr->proptags['counter_proposal'];
		$props = mapi_getprops($calendarItem, array($proposalTag));
		$this->assertTrue($props[$proposalTag]);
	}
}
?>
