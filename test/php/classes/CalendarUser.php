<?php

require_once 'IPMUser.php';
require_once 'Restriction.php';

/**
 * CalendarUser.
 *
 * An extension to the IPMUser to represent a user which
 * uses his calendar (e.g. loading and saving appointments).
 */
class CalendarUser extends IPMUser {
	/**
	 * Initialize the TestUser.
	 */
	protected function initialize() {
		parent::initialize();

		$this->logon();

		$this->defaultStoreEntryId = $this->getDefaultMessageStoreEntryID();
		$this->defaultFolderEntryId = $this->getDefaultFolderEntryID(PR_IPM_APPOINTMENT_ENTRYID);
		$this->defaultItemModule = 'appointmentitemmodule';
		$this->defaultListModule = 'appointmentlistmodule';
	}

	/**
	 * Obtain the array of named properties which can be present on Calendar.
	 *
	 * @return array The array of Named property tags
	 */
	public function getCalendarPropTags() {
		return $GLOBALS['properties']->getAppointmentProperties();
	}

	/**
	 * Save an appointment into the calendar.
	 *
	 * @param array $appointment The appointment which should be saved
	 * @param bool  $open        true if the saved item should be opened, otherwise the
	 *                           saved properties will be returned
	 *
	 * @return MAPI_MESSAGE The saved appointment
	 */
	public function saveAppointment($appointment, $open = true) {
		return $this->saveItem($appointment, $open);
	}

	/**
	 * Save an occurrence into the calendar.
	 *
	 * @param array  $appointment The appointment which should be saved
	 * @param Number $basedate    The basedate of the occurrence which should be deleted
	 * @param bool   $open        true if the saved item should be opened, otherwise the
	 *                            saved properties will be returned
	 * @param mixed  $exception
	 * @param mixed  $entryid
	 *
	 * @return MAPI_MESSAGE The saved appointment
	 */
	public function saveAppointmentOccurence($exception, $entryid, $basedate, $open = true) {
		$appointment = $this->openAppointment($entryid);
		$item = $appointment['item']['item'];

		$exceptionProps = [
			'entryid' => $item['entryid'],
			'parent_entryid' => $item['parent_entryid'],
			'store_entryid' => $item['store_entryid'],
			'basedate' => $basedate,
			'props' => isset($exception['props']) ? $exception['props'] : [],
			'message_action' => isset($exception['message_action']) ? $exception['message_action'] : [],
		];

		return $this->saveAppointment($exceptionProps, $open);
	}

	/**
	 * Open the given appointment from the calendar folder.
	 *
	 * @param Binary $entryid    The entryid of the item which should be opened
	 * @param array  $extraProps The array of extra properties which should be
	 *                           send to the server together with this request
	 *
	 * @return array The response from the PHP
	 */
	public function openAppointment($entryid, $extraProps = []) {
		return $this->openItem($entryid, $extraProps);
	}

	/**
	 * Open the given occurrence from the calendar folder.
	 *
	 * @param Binary $entryid    The entryid of the item which should be opened
	 * @param Number $basedate   The basedate of the occurrence which should be deleted
	 * @param array  $extraProps The array of extra properties which should be
	 *                           send to the server together with this request
	 *
	 * @return array The response from the PHP
	 */
	public function openAppointmentOccurence($entryid, $basedate, $extraProps = []) {
		if ($extraProps) {
			$extraProps = array_merge(['basedate' => $basedate], $extraProps);
		}
		else {
			$extraProps = ['basedate' => $basedate];
		}

		return $this->openItem($entryid, $extraProps);
	}

	/**
	 * Delete the given appointment from the calendar folder.
	 *
	 * @param Binary $entryid    The entryid of the item which should be deleted
	 * @param array  $extraProps The array of extra properties which should be
	 *                           send to the server together with this request
	 *
	 * @return array The response from the PHP
	 */
	public function deleteAppointment($entryid, $extraProps = []) {
		return $this->deleteItem($entryid, $extraProps);
	}

	/**
	 * Delete the occurrence from the calendar folder.
	 *
	 * @param Binary $entryid    The entryid of the item which should be deleted
	 * @param Number $basedate   The basedate of the occurrence which should be deleted
	 * @param array  $extraProps The array of extra properties which should be
	 *                           send to the server together with this request
	 *
	 * @return array The response from the PHP
	 */
	public function deleteAppointmentOccurence($entryid, $basedate, $extraProps = []) {
		if (!is_array($extraProps)) {
			$extraProps = [];
		}

		$extraProps = array_merge([
			'basedate' => $basedate,
		], $extraProps);

		return $this->deleteItem($entryid, $extraProps);
	}

	/**
	 * Copy/Move the given appointment.
	 *
	 * @param Binary $entryid    The entryid of the item which should be copied/moved
	 * @param array  $extraProps The array of extra properties which should be
	 *                           send to the server together with this request
	 * @param bool   $move       True to move the item rather then copy
	 *
	 * @return array The response from the PHP
	 */
	public function copyAppointment($entryid, $extraProps = [], $move = false) {
		return $this->copyItem($entryid, $extraProps, $move);
	}

	/**
	 * Load all appointments from the calendar folder for the given restriction.
	 *
	 * @param array $extraProps The array of extra properties which should be
	 *                          send to the server together with this request
	 * @param bool  $open       true if the saved item should be opened, otherwise the
	 *                          appointment props will be returned
	 *
	 * @return array The array of appointments for the given range
	 */
	public function loadAppointments($extraProps = [], $open = true) {
		return $this->loadItems($extraProps, $open);
	}

	/**
	 * Obtains the appointment from the default folder based on the entryid.
	 *
	 * @param Binary $entryid The entryid of the item to obtain
	 * @param bool   $open    true if the found item should be opened, otherwise the
	 *                        entryid's will be returned
	 *
	 * @return mixed The appointment with the given entryid
	 */
	public function getAppointment($entryid, $open = true) {
		$items = $this->getItems(Restriction::ResProperty(PR_ENTRYID, $entryid, RELOP_EQ), $open);

		return array_shift($items);
	}

	/**
	 * Obtain the entryid of the appointment from the appointment resource.
	 *
	 * @param MAPIMessage $appointment the appointment message
	 *
	 * @return Binary The entryid of the appointment
	 */
	public function getAppointmentEntryId($appointment) {
		$entryid = $this->getAppointmentProps($appointment, [PR_ENTRYID]);

		return $entryid[PR_ENTRYID];
	}

	/**
	 * Obtains all appointments from the default folder.
	 *
	 * @param bool $open true if the found item should be opened, otherwise the
	 *                   entryid's will be returned
	 *
	 * @return mixed The appointment with the given entryid
	 */
	public function getAllAppointments($open = true) {
		return $this->getItems(Restriction::ResContent(PR_MESSAGE_CLASS, 'IPM.Appointment', FL_SUBSTRING | FL_IGNORECASE), $open);
	}

	/**
	 * Obtains the appointment from the wastebasket folder based on the entryid.
	 *
	 * @param Binary $entryid The entryid of the item to obtain
	 * @param bool   $open    true if the found item should be opened, otherwise the
	 *                        entryid's will be returned
	 *
	 * @return mixed The appointment with the given entryid
	 */
	public function getDeletedAppointment($entryid, $open = true) {
		$items = $this->getDeletedItems(Restriction::ResProperty(PR_ENTRYID, $entryid, RELOP_EQ), $open);

		return array_shift($items);
	}

	/**
	 * Obtain all appointments which are present in the wastebastet folder.
	 *
	 * @param bool $open true if the found item should be opened, otherwise the
	 *                   entryid's will be returned
	 *
	 * @return array list of items
	 */
	public function getAllDeletedAppointments($open = true) {
		return $this->getDeletedItems(Restriction::ResContent(PR_MESSAGE_CLASS, 'IPM.Appointment', FL_SUBSTRING | FL_IGNORECASE), $open);
	}

	/**
	 * Obtain the properties for the appointment.
	 *
	 * @param array $items array of the MAPI_MESSAGES
	 * @param array $tags  the list of property tags to fetch
	 *
	 * @return array returns array of props of all MAPI_MESSAGE items passed to the function
	 */
	public function getAppointmentProps($items, $tags = []) {
		return $this->getItemProps($items, $tags);
	}
}
