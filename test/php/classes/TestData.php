<?php

/**
 * TestData
 *
 * Data class which can provide all Test Data used for testing.
 */
class TestData {

	/**
	 * Returns SMTP recipient.
	 * @param String $displayName The display name for the recipient
	 * @param String $emailAddress The email address for the recipient
	 * @param Integer $recipientType The RecipientType that should be used for 
	 * all the returned recipients. Defaults to MAPI_TO.
	 * @return Array the SMTP recipient
	 */
	public static function getSMTPRecipient($displayName, $emailAddress, $recipientType = MAPI_TO)
	{
		return array(
			'object_type' => MAPI_MAILUSER,
			'display_name' => $displayName,
			'email_address' => $emailAddress,
			'smtp_address' => $emailAddress,
			'address_type' => 'SMTP',
			'recipient_type' => $recipientType,
			'recipient_flags' => '',
			'display_type' => DT_MAILUSER,
			'display_type_ex' => DTE_FLAG_ACL_CAPABLE,
			'search_key' => bin2hex('SMTP' . ':' . strtoupper($emailAddress)) . '00'
		);
	}

	/**
	 * Returns Attachments structure.
	 * @return Array the attachments
	 */
	public static function getAttachments()
	{
		return array(
			'dialog_attachments' => uniqid('zarafa-', true)
		);
	}

	/**
	 * Returns a list of Distlist members.
	 * @param {Array} $ids The list of IDs of the users
	 * who should be added as members (starting from 1).
	 * @return {Array} the list of members
	 */
	public static function getDistlistMembers($ids)
	{
		$members = array();
		$membersData = array(
			1 => array(
				'distlist_type' => DL_USER_AB,
				'display_name' => KOPANO_USER1_DISPLAY_NAME,
				'address_type' => 'ZARAFA',
				'email_address' => KOPANO_USER1_NAME,
                'entryid' => '00000000ac21a95040d3ee48b319fba7533044250100000006000000110000004d5441314d673d3d00000000'
			),
			2 => array(
				'distlist_type' => DL_DIST_AB,
				'display_name' => KOPANO_GROUP1_DISPLAY_NAME,
				'address_type' => 'ZARAFA',
				'email_address' => KOPANO_GROUP1_NAME,
				'entryid' => '00000000ac21a95040d3ee48b319fba753304425010000'
			),
			3 => array(
				'distlist_type' => DL_DIST,
				'display_name' => 'developers group',
				'address_type' => 'ZARAFA',
				'email_address' => '',
				'entryid' => '00000000ac21a95040d3ee48b319fba753304425010000'
			),
			4 => array(
				'distlist_type' => DL_USER,
				'display_name' => 'ol, from (ol@zarafa.local)',
				'address_type' => 'SMTP',
				'email_address' => 'ol@zarafa.local',
				'entryid' => '000000003578d16c68104cba843fc3b0478b5037010000'
			),
			5 => array(
				'distlist_type' => DL_USER2,
				'display_name' => 'ol2, from (ol2@zarafa.local)',
				'address_type' => 'SMTP',
				'email_address' => 'ol2@zarafa.local',
				'entryid' => '000000003578d16c6810333a843fc3b0478b5037010000'
			),
			6 => array(
				'distlist_type' => DL_USER3,
				'display_name' => 'ol3, from (ol3@zarafa.local)',
				'address_type' => 'SMTP',
				'email_address' => 'ol3@zarafa.local',
				'entryid' => '000000003578d16c6810444a843fc3b0478b5037010000'
			),
			7 => array(
				'distlist_type' => DL_EXTERNAL_MEMBER,
				'display_name' => 'External User',
				'address_type' => 'SMTP',
				'email_address' => 'external@external.com'
			)
		);

		$i = 0;
		foreach($ids as $id) {
			$members[$i++] = $membersData[$id];
		}

		return $members;
	}

	/**
	 * Returns the properties for a meeting request which will
	 * start in 1 hour and has a duration of 30minutes.
	 * @param Array $props The properties to be merged into the defaults
	 * @return Array The Meeting request properties.
	 */
	public static function getMeetingRequest($props = array())
	{
		$start = isset($props['startdate']) ? $props['startdate'] : gmmktime(date('H') + 1, date('i'), 0);
		$end = isset($props['duedate']) ? $props['duedate'] : gmmktime(date('H') + 1, date('i') + 30, 0);
		$duration = ($end - $start) / 60;

		return array_merge(array(
			'message_class' => 'IPM.Appointment',
			'body' => 'This is a body',
			'message_flags' => MSGFLAG_UNSENT,
			'subject' => 'meet abc',
			'importance' => IMPORTANCE_NORMAL,
			'sensitivity' => SENSITIVITY_NONE,
			'startdate' => $start,
			'duedate' => $end,
			'basedate' => null,
			'recurring' => false,
			'recurring_reset' => false,
			'startdate_recurring' => null,
			'enddate_recurring' => null,
			'busystatus' => fbBusy,
			'label' => 0,
			'alldayevent' => false,
			'meeting' => olMeeting,
			'location' => 'meeting',
			'duration' => $duration,
			'responsestatus' => olResponseOrganized,
			'reminder' => true,
			'reminder_minutes' => 15,
			'reminder_time' => $start,
			'flagdueby' => $end,
			'commonstart' => $start,
			'commonend' => $end
		), $props);
	}

	/**
	 * Returns the properties for a meeting request which will
	 * start in 1 hour and has a duration of 30minutes. The meeting will
	 * recur weekly every day for 10 occurences.
	 * @param Array $props The properties to be merged into the defaults
	 * @return Array The Meeting request properties.
	 */
	public static function getRecurringMeetingRequest($props = array())
	{
		$startRecur = gmmktime(0, 0, 0);
		$start = isset($props['startdate']) ? $props['startdate'] : gmmktime(date('H') + 1, date('i'), 0);
		$end = isset($props['duedate']) ? $props['duedate'] : gmmktime(date('H') + 1, date('i') + 30, 0);
		$duration = ($end - $start) / 60;

		$timezone = new DateTimeZone(ini_get('date.timezone'));
		$winterDate = new DateTime(date('d-M-Y', gmmktime(0, 0, 0, 1, 1, date('Y'))), $timezone);
		$summerDate = new DateTime(date('d-M-Y', gmmktime(0, 0, 0, 7, 1, date('Y'))), $timezone);
		$tzOffset = $winterDate->getOffset() / 60;
		$dstOffset = ($summerDate->getOffset() - $winterDate->getOffset()) / 60;

		return array_merge(array(
			'message_class' => 'IPM.Appointment',
			'body' => 'This is a body',
			'message_flags' => MSGFLAG_UNSENT,
			'subject' => 'meet abc',
			'importance' => IMPORTANCE_NORMAL,
			'sensitivity' => SENSITIVITY_NONE,
			'startdate' => $start,
			'duedate' => $end,
			'busystatus' => fbBusy,
			'label' => 0,
			'alldayevent' => false,
			'meeting' => olMeeting,
			'location' => 'meeting',
			'duration' => $duration,
			'responsestatus' => olResponseOrganized,
			'reminder' => true,
			'reminder_minutes' => 15,
			'reminder_time' => $start,
			'flagdueby' => $end,
			'commonstart' => $start,
			'commonend' => $end,

			'recurring' => true,
			'recurring_reset' => true,
			'basedate' => null,
			'startdate_recurring' => null,
			'enddate_recurring' => null,
			'type' => 11, // Weekly recurring
			'subtype' => 1,
			'everyn' => 1, // every week
			'regen' => 0,
			'weekdays' => pow(2, (int) date('w', $start)), // this weekday
			'term' => 34, // End after
			'numoccur' => 10, // 10 occurences
			'numexcept' => '',
			'numexceptmod' => '',
			'start' => $startRecur,
			'end' => 79870665600, // Jan 01 4501
			'startocc' => (((int) date('G', $start)) * 60) + ((int) date('i', $start)),
			'endocc' => (((int) date('G', $end)) * 60) + ((int) date('i', $end)),
			'timezone' => -$tzOffset,
			'unk' => '',
			'timezonedst' => -$dstOffset,
			'dstendmonth' => 10,
			'dstendweek' => 5,
			'dstendday' => 0,
			'dstendhour' => 3,
			'dststartmonth' => 3,
			'dststartweek' => 5,
			'dststartday' => 0,
			'dststarthour' => 2
		), $props);
	}

	/**
	 * Returns the properties for an appointment which will start
	 * start in 1 hour and has a duration of 30 minutes.
	 * @param Array $props The properties to be merged into the defaults
	 * @return Array The appointment properties
	 */
	public static function getAppointment($props = array())
	{
		$start = isset($props['startdate']) ? $props['startdate'] : gmmktime(date('H') + 1, date('i'), 0);
		$end = isset($props['duedate']) ? $props['duedate'] : gmmktime(date('H') + 1, date('i') + 30, 0);
		$duration = ($end - $start) / 60;

		return array_merge(array(
			'message_class' => 'IPM.Appointment',
			'body' => 'This is a body',
			'message_flags' => MSGFLAG_UNSENT,
			'subject' => 'meet abc',
			'importance' => IMPORTANCE_NORMAL,
			'sensitivity' => SENSITIVITY_NONE,
			'startdate' => $start,
			'duedate' => $end,
			'recurring' => false,
			'recurring_reset' => false,
			'busystatus' => fbBusy,
			'label' => 0,
			'alldayevent' => false,
			'duration' => $duration,
			'commonstart' => $start,
			'commonend' => $end
		), $props);
	}

	/**
	 * Returns the properties for a recurring appointment which will start
	 * start in 1 hour and has a duration of 30 minutes.  The appointment will
	 * recur weekly every day for 10 occurences.
	 * @param Array $props The properties to be merged into the defaults
	 * @return Array The appointment properties
	 */
	public static function getRecurringAppointment($props = array())
	{
		$startRecur = gmmktime(0, 0, 0);
		$start = isset($props['startdate']) ? $props['startdate'] : gmmktime(date('H') + 1, date('i'), 0);
		$end = isset($props['duedate']) ? $props['duedate'] : gmmktime(date('H') + 1, date('i') + 30, 0);
		$duration = ($end - $start) / 60;

		$timezone = new DateTimeZone(ini_get('date.timezone'));
		$winterDate = new DateTime(date('d-M-Y', gmmktime(0, 0, 0, 1, 1, date('Y'))), $timezone);
		$summerDate = new DateTime(date('d-M-Y', gmmktime(0, 0, 0, 7, 1, date('Y'))), $timezone);
		$tzOffset = $winterDate->getOffset() / 60;
		$dstOffset = ($summerDate->getOffset() - $winterDate->getOffset()) / 60;

		return array_merge(array(
			'message_class' => 'IPM.Appointment',
			'body' => 'This is a body',
			'message_flags' => MSGFLAG_UNSENT,
			'subject' => 'meet abc',
			'importance' => IMPORTANCE_NORMAL,
			'sensitivity' => SENSITIVITY_NONE,
			'startdate' => $start,
			'duedate' => $end,
			'busystatus' => fbBusy,
			'label' => 0,
			'alldayevent' => false,
			'duration' => $duration,
			'commonstart' => $start,
			'commonend' => $end,

			'recurring' => true,
			'recurring_reset' => true,
			'startdate_recurring' => null,
			'enddate_recurring' => null,
			'type' => 11, // Weekly recurring
			'subtype' => 1,
			'everyn' => 1, // every week
			'regen' => 0,
			'weekdays' => pow(2, (int) date('w', $start)), // this weekday
			'term' => 34, // End after
			'numoccur' => 10, // 10 occurences
			'numexcept' => '',
			'numexceptmod' => '',
			'start' => $startRecur,
			'end' => 79870665600, // Jan 01 4501
			'startocc' => (((int) date('G', $start)) * 60) + ((int) date('i', $start)),
			'endocc' => (((int) date('G', $end)) * 60) + ((int) date('i', $end)),
			'timezone' => -$tzOffset,
			'unk' => '',
			'timezonedst' => -$dstOffset,
			'dstendmonth' => 10,
			'dstendweek' => 5,
			'dstendday' => 0,
			'dstendhour' => 3,
			'dststartmonth' => 3,
			'dststartweek' => 5,
			'dststartday' => 0,
			'dststarthour' => 2
		), $props);
	}

	/**
	 * Returns the properties for an E-mail
	 * @param Array $props The properties to be merged into the defaults
	 * @return Array The mail properties
	 */
	public static function getMail($props = array())
	{
		return array_merge(array(
			'message_class' => 'IPM.Note',
			'body' => 'This is a body',
			'message_flags' => MSGFLAG_UNSENT,
			'subject' => 'new mail',
			'importance' => IMPORTANCE_NORMAL,
			'sensitivity' => SENSITIVITY_NONE,
		), $props);
	}

	/**
	 * Returns the properties for a normal task
	 * @param Array $props The properties to be merged into the defaults
	 * @return Array The task properties
	 */
	public static function getTask($props = array())
	{
		return array_merge(array(
			'message_class' => 'IPM.Task',
			'body' => 'This is a body',
			'subject' => 'new task',
		), $props);
	}

	/**
	 * Returns the properties for a normal sticky notes
	 * @param Array $props The properties to be merged into the defaults
	 * @return Array The notes properties
	 */
	public static function getNote($props = array())
	{
		return array_merge(array(
			'message_class' => 'IPM.StickyNote',
			'body' => 'This is a body',
			'subject' => 'new sticky Note',
		), $props);
	}

	/**
	 * Returns the properties for a normal contact
	 * @param Array $props The properties to be merged into the defaults
	 * @return {Array} The contact properties
	 */
	public static function getContact($props = array())
	{
		$birthday = isset($props['birthday']) ? $props['birthday'] : mktime(0, 0, 0, date('n') + 1);
		$anniversary = isset($props['wedding_anniversary']) ? $props['wedding_anniversary'] : mktime(0, 0, 0, date('n') + 2);

		$timezone = new DateTimeZone(ini_get('date.timezone'));
		$winterDate = new DateTime(date('d-M-Y', gmmktime(0, 0, 0, 1, 1, date('Y'))), $timezone);
		$summerDate = new DateTime(date('d-M-Y', gmmktime(0, 0, 0, 7, 1, date('Y'))), $timezone);
		$tzOffset = $winterDate->getOffset() / 60;
		$dstOffset = ($summerDate->getOffset() - $winterDate->getOffset()) / 60;

		return array_merge(array(
			'message_class' => 'IPM.Contact',
			'object_type' => MAPI_MESSAGE,
			'fileas' => 'new Contact',
			'fileas_selection' => -1,
			'subject' => 'new Contact',
			'display_name' => 'new Contact',
			'email_address_1' => 'email@zarafa.local',
			'email_address_display_name_1' => 'new Contact (email@zarafa.local)',
			'email_address_display_name_email_1' => 'email@zarafa.local',
			'email_address_type_1' => 'SMTP',
			'fax_1_address_type' => 'FAX',
			'fax_1_original_display_name' => 'new Contact',
			'fax_1_email_address' => 'new Contact@1234',
			'address_book_long' => 33,
			'address_book_mv' => array(0, 5),
			'body' => 'This is a body',

			'birthday' => $birthday,
			'wedding_anniversary' => $anniversary,
			'timezone' => -$tzOffset,
			'unk' => '',
			'timezonedst' => -$dstOffset,
			'dstendmonth' => 10,
			'dstendweek' => 5,
			'dstendday' => 0,
			'dstendhour' => 3,
			'dststartmonth' => 3,
			'dststartweek' => 5,
			'dststartday' => 0,
			'dststarthour' => 2
		), $props);
	}

	/**
	 * Returns the properties for a normal distlist
	 * @param Array $props The properties to be merged into the defaults
	 * @return {Array} The distlist properties
	 */
	public static function getDistlist($props = array())
	{
		return array_merge(array(
			'message_class' => 'IPM.DistList',
			'object_type' => MAPI_MESSAGE,
			'fileas' => 'new distlist',
			'subject' => 'new Distlist',
			'display_name' => 'new distlist',
			'dl_name' => 'new distlist',
			'body' => 'This is a body'
		), $props);
	}

	/**
	 * Returns the properties for a normal folder
	 * @param Array $props The properties to be merged into the defaults
	 * @return {Array} The folder properties
	 */
	public static function getFolder($props = array())
	{
		return array_merge(array(
			'container_class' => 'IPF.Note',
			'object_type' => MAPI_FOLDER,
			'display_name' => 'Test folder',
			'comment' => ''
		), $props);
	}
}
