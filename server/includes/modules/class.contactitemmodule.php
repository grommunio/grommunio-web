<?php

/*
 * SPDX-FileCopyrightText: Copyright 2020 - 2026 grommunio GmbH
 * SPDX-FileCopyrightText: Copyright 2016 Kopano and its licensors
 * SPDX-FileCopyrightText: Copyright 2005 - 2016 Zarafa B.V. and its licensors
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

/**
 * Contact ItemModule
 * Module which opens, creates, saves and deletes an item. It
 * extends the Module class.
 */
class ContactItemModule extends ItemModule {
	/**
	 * Special date properties and the entry ID property of their appointment.
	 */
	private const SPECIAL_DATE_EVENTIDS = [
		'birthday' => 'birthday_eventid',
		'wedding_anniversary' => 'anniversary_eventid',
	];

	/**
	 * Constructor.
	 *
	 * @param int   $id   unique id
	 * @param array $data list of all actions
	 */
	public function __construct($id, $data) {
		$this->properties = $GLOBALS['properties']->getContactProperties();

		parent::__construct($id, $data);

		$this->plaintext = false;
	}

	/**
	 * Create a one-off entry ID and fail the save if MAPI cannot produce one.
	 *
	 * @param mixed $displayName
	 * @param mixed $addressType
	 * @param mixed $emailAddress
	 * @param mixed $flags
	 *
	 * @return string binary one-off entry ID
	 */
	private function createOneOffEntryId($displayName, $addressType, $emailAddress, $flags = 0) {
		$entryId = mapi_createoneoff($displayName, $addressType, $emailAddress, $flags);
		if ($entryId === false) {
			throw new RuntimeException('Unable to create one-off entry ID');
		}

		return $entryId;
	}

	/**
	 * Function which opens an item.
	 *
	 * @param resource $store   MAPI message store
	 * @param string   $entryid entryid of the message
	 * @param array    $action  the action data, sent by the client
	 */
	#[Override]
	public function open($store, $entryid, $action) {
		$data = [];
		$orEntryid = $entryid;
		$message = false;

		if ($entryid) {
			// Check if OneOff entryid is a local contact
			if ($GLOBALS['entryid']->hasAddressBookOneOff(bin2hex($entryid))) {
				try {
					$oneoff = mapi_parseoneoff($entryid);
					$ab = $GLOBALS['mapisession']->getAddressbook();
					$ab_dir = mapi_ab_openentry($ab);
					$res = $this->searchContactsFolders($ab, $ab_dir, $oneoff['address']);
					if (count($res) > 0) {
						$entryid = $res[0][PR_ENTRYID];
					}
				}
				catch (MAPIException $ex) {
					error_log(sprintf(
						"Unable to open contact because mapi_parseoneoff failed: %s - %s",
						get_mapi_error_name($ex->getCode()),
						$ex->getDisplayMessage()
					));
				}
			}
			/* Check if given entryid is shared folder distlist then
			* get the store of distlist for fetching it's members.
			*/
			$storeData = $this->getStoreParentEntryIdFromEntryId($entryid);
			$store = $storeData["store"];
			$message = $storeData["message"];
		}

		if (empty($message)) {
			return;
		}

		// Open embedded message if requested
		$attachNum = !empty($action['attach_num']) ? $action['attach_num'] : false;
		if ($attachNum) {
			// get message props of sub message
			$parentMessage = $message;
			$message = $GLOBALS['operations']->openMessage($store, $entryid, $attachNum);

			if (empty($message)) {
				return;
			}

			// Check if message is distlist then we need to use different set of properties
			$props = mapi_getprops($message, [PR_MESSAGE_CLASS]);

			if (class_match_prefix($props[PR_MESSAGE_CLASS], "IPM.Distlist")) {
				// for distlist we need to use different set of properties
				$this->properties = $GLOBALS['properties']->getDistListProperties();
			}

			$data['item'] = $GLOBALS['operations']->getEmbeddedMessageProps($store, $message, $this->properties, $parentMessage, $attachNum);
		}
		else {
			// Check if message is distlist then we need to use different set of properties
			$props = mapi_getprops($message, [PR_MESSAGE_CLASS]);

			if (class_match_prefix($props[PR_MESSAGE_CLASS], "IPM.Distlist")) {
				// for distlist we need to use different set of properties
				$this->properties = $GLOBALS['properties']->getDistListProperties();
			}

			// get message props of the message
			$data['item'] = $GLOBALS['operations']->getMessageProps($store, $message, $this->properties, $this->plaintext, true);
		}

		// By openentry from address book, the entryid will differ, make it same as the origin
		$data['item']['entryid'] = bin2hex($orEntryid);

		// Allowing to hook in just before the data sent away to be sent to the client
		$GLOBALS['PluginManager']->triggerHook('server.module.contactitemmodule.open.after', [
			'moduleObject' => &$this,
			'store' => $store,
			'entryid' => $entryid,
			'action' => $action,
			'message' => &$message,
			'data' => &$data,
		]);

		$this->addActionData('item', $data);
		$GLOBALS['bus']->addData($this->getResponseData());
	}

	/**
	 * Function which saves an item. It sets the right properties for a contact
	 * item (address book properties).
	 *
	 * @param false|resource $store         MAPI message store, or false to use the default
	 * @param false|string   $parententryid parent folder entry ID, or false to infer it
	 * @param false|string   $entryid       entry ID of the message, or false for a new item
	 * @param array          $action        action data sent by the client
	 * @param string         $actionType    action type that triggered the save
	 */
	#[Override]
	public function save($store, $parententryid, $entryid, $action, $actionType = 'save') {
		$propertiesToDelete = []; // create an array of properties which should be deleted
		$isCopyGABToContact = false;
		// this array is passed to $GLOBALS['operations']->saveMessage() function

		if ($store === false && !$parententryid) {
			if (isset($action['props']['message_class'])) {
				$store = $GLOBALS['mapisession']->getDefaultMessageStore();
				$parententryid = $this->getDefaultFolderEntryID($store, $action['props']['message_class']);
			}
			elseif ($entryid) {
				$data = $this->getStoreParentEntryIdFromEntryId($entryid);
				$store = $data["store"];
				$parententryid = $data["parent_entryid"];
			}
		}
		elseif (!$parententryid) {
			if (isset($action['props']['message_class'])) {
				$parententryid = $this->getDefaultFolderEntryID($store, $action['props']['message_class']);
			}
		}

		if ($store !== false && $parententryid && isset($action['props'])) {
			if (isset($action['members'])) {
				$props = $this->prepareDistListProps($action, $propertiesToDelete);
			}
			else {
				$isCopyGABToContact = ($action["message_action"]["action_type"] ?? null) === "copyToContact";
				$props = $this->prepareContactProps($store, $action, $isCopyGABToContact, $propertiesToDelete);
			}

			$messageProps = [];

			$result = $GLOBALS['operations']->saveMessage($store, $entryid, $parententryid, $props, $messageProps, [], $action['attachments'] ?? [], $propertiesToDelete);

			if ($result) {
				$GLOBALS['bus']->notify(bin2hex($parententryid), TABLE_SAVE, $messageProps);

				if ($isCopyGABToContact) {
					$message = mapi_msgstore_openentry($store, $messageProps[PR_ENTRYID]);
					$messageProps = mapi_getprops($message, $this->properties);
				}

				$this->addActionData('update', ['item' => Conversion::mapMAPI2XML($this->properties, $messageProps)]);
				$GLOBALS['bus']->addData($this->getResponseData());
			}
		}
	}

	/**
	 * Converts the client data of a distribution list, packing its members.
	 *
	 * @param array $action             action data sent by the client
	 * @param array $propertiesToDelete receives the properties to remove
	 *
	 * @return array MAPI properties to save
	 */
	private function prepareDistListProps($action, &$propertiesToDelete) {
		$this->properties = $GLOBALS['properties']->getDistListProperties();

		$props = Conversion::mapXML2MAPI($this->properties, $action['props']);

		$members = [];
		$oneoff_members = [];
		foreach ($action['members'] as $item) {
			if (empty($item['email_address'])) {
				// mapi_parseoneoff fails without an address; OL07 uses Unknown as well
				$item['email_address'] = 'Unknown';
			}
			if (empty($item['address_type']) && in_array($item['distlist_type'], [DL_DIST, DL_DIST_AB])) {
				$item['address_type'] = 'MAPIPDL';
			}

			$oneoff = $this->createOneOffEntryId($item['display_name'], $item['address_type'], $item['email_address']);

			if ($item['distlist_type'] == DL_EXTERNAL_MEMBER) {
				$member = $oneoff;
			}
			else {
				$member = pack('VA16CA*', 0, WAB_GUID, $item['distlist_type'], hex2bin((string) $item['entryid']));
			}

			$oneoff_members[] = $oneoff;
			$members[] = $member;
		}

		if (!empty($members) && !empty($oneoff_members)) {
			$props[$this->properties['members']] = $members;
			$props[$this->properties['oneoff_members']] = $oneoff_members;
		}
		else {
			$propertiesToDelete[] = $this->properties['members'];
			$propertiesToDelete[] = $this->properties['oneoff_members'];
		}

		return $props;
	}

	/**
	 * Converts the client data of a contact, deriving one-off entry IDs and
	 * the birthday and anniversary appointments.
	 *
	 * @param resource $store              MAPI message store
	 * @param array    $action             action data sent by the client
	 * @param bool     $isCopyGABToContact whether the contact is copied from the address book
	 * @param array    $propertiesToDelete receives the properties to remove
	 *
	 * @return array MAPI properties to save
	 */
	private function prepareContactProps($store, $action, $isCopyGABToContact, &$propertiesToDelete) {
		if ($isCopyGABToContact) {
			$this->copyGABRecordProps($action);
		}
		for ($index = 1; $index < 4; ++$index) {
			if (!empty($action['props']['email_address_' . $index]) && !empty($action['props']['email_address_display_name_' . $index])) {
				$action['props']['email_address_entryid_' . $index] = bin2hex($this->createOneOffEntryId($action['props']['email_address_display_name_' . $index], $action['props']['email_address_type_' . $index], $action['props']['email_address_' . $index]));
			}
		}

		// fax 1 is primary, 2 business, 3 home
		for ($index = 1; $index < 4; ++$index) {
			$fax = 'fax_' . $index . '_';
			if (!empty($action['props'][$fax . 'email_address'])) {
				$action['props'][$fax . 'original_entryid'] = bin2hex($this->createOneOffEntryId($action['props'][$fax . 'original_display_name'], $action['props'][$fax . 'address_type'], $action['props'][$fax . 'email_address'], MAPI_UNICODE));
			}
			else {
				$propertiesToDelete[] = $this->properties[$fax . 'address_type'];
				$propertiesToDelete[] = $this->properties[$fax . 'original_display_name'];
				$propertiesToDelete[] = $this->properties[$fax . 'email_address'];
				$propertiesToDelete[] = $this->properties[$fax . 'original_entryid'];
			}
		}

		if (!empty($action['entryid'])) {
			$this->collectClearedContactProps($store, $action['props'], $propertiesToDelete);
		}

		/*
		 * convert all line endings(LF) into CRLF
		 * XML parser will normalize all CR, LF and CRLF into LF
		 * but outlook(windows) uses CRLF as line ending
		 */
		foreach (['business_address', 'home_address', 'other_address'] as $address) {
			if (isset($action['props'][$address])) {
				$action['props'][$address] = str_replace('\n', '\r\n', $action['props'][$address]);
			}
		}

		foreach (self::SPECIAL_DATE_EVENTIDS as $date => $eventid) {
			if (!empty($action['props'][$date])) {
				$action['props'][$eventid] = $this->updateAppointments($store, $action, $date);
			}
		}

		return Conversion::mapXML2MAPI($this->properties, $action['props']);
	}

	/**
	 * Adds the properties an existing contact had cleared to the delete list,
	 * removing the appointments of cleared special dates.
	 *
	 * @param resource $store              MAPI message store
	 * @param array    $props              contact properties sent by the client
	 * @param array    $propertiesToDelete receives the properties to remove
	 */
	private function collectClearedContactProps($store, $props, &$propertiesToDelete) {
		for ($i = 1; $i < 4; ++$i) {
			if (isset($props['email_address_' . $i]) && empty($props['email_address_' . $i])) {
				array_push($propertiesToDelete, $this->properties['email_address_entryid_' . $i]);
				array_push($propertiesToDelete, $this->properties['email_address_' . $i]);
				array_push($propertiesToDelete, $this->properties['email_address_display_name_' . $i]);
				array_push($propertiesToDelete, $this->properties['email_address_display_name_email_' . $i]);
				array_push($propertiesToDelete, $this->properties['email_address_type_' . $i]);
			}
		}

		if (isset($props['address_book_long']) && $props['address_book_long'] === 0) {
			$propertiesToDelete[] = $this->properties['address_book_mv'];
			$propertiesToDelete[] = $this->properties['address_book_long'];
		}

		foreach (self::SPECIAL_DATE_EVENTIDS as $date => $eventid) {
			if (array_key_exists($date, $props) && empty($props[$date])) {
				array_push($propertiesToDelete, $this->properties[$date]);
				array_push($propertiesToDelete, $this->properties[$eventid]);
				if (!empty($props[$eventid])) {
					$this->deleteSpecialDateAppointment($store, $props[$eventid]);
				}
			}
		}
	}

	/**
	 * Function copy the some property from address book record to contact props.
	 *
	 * @param array $action the action data, sent by the client
	 */
	public function copyGABRecordProps(&$action) {
		$addrbook = $GLOBALS["mapisession"]->getAddressbook();
		$abitem = mapi_ab_openentry($addrbook, hex2bin((string) $action["message_action"]["source_entryid"]));
		$abItemProps = mapi_getprops($abitem, [
			PR_COMPANY_NAME,
			PR_ASSISTANT,
			PR_BUSINESS_TELEPHONE_NUMBER,
			PR_BUSINESS2_TELEPHONE_NUMBER,
			PR_HOME2_TELEPHONE_NUMBER,
			PR_STREET_ADDRESS,
			PR_LOCALITY,
			PR_STATE_OR_PROVINCE,
			PR_POSTAL_CODE,
			PR_COUNTRY,
			PR_MOBILE_TELEPHONE_NUMBER,
		]);
		$action["props"]["company_name"] = $abItemProps[PR_COMPANY_NAME] ?? '';
		$action["props"]["assistant"] = $abItemProps[PR_ASSISTANT] ?? '';
		$action["props"]["business_telephone_number"] = $abItemProps[PR_BUSINESS_TELEPHONE_NUMBER] ?? '';
		$action["props"]["business2_telephone_number"] = $abItemProps[PR_BUSINESS2_TELEPHONE_NUMBER] ?? '';
		$action["props"]["home2_telephone_number"] = $abItemProps[PR_HOME2_TELEPHONE_NUMBER] ?? '';
		$action["props"]["home_address_street"] = $abItemProps[PR_STREET_ADDRESS] ?? '';
		$action["props"]["home_address_city"] = $abItemProps[PR_LOCALITY] ?? '';
		$action["props"]["home_address_state"] = $abItemProps[PR_STATE_OR_PROVINCE] ?? '';
		$action["props"]["home_address_postal_code"] = $abItemProps[PR_POSTAL_CODE] ?? '';
		$action["props"]["home_address_country"] = $abItemProps[PR_COUNTRY] ?? '';

		$action["props"]["cellular_telephone_number"] = $abItemProps[PR_MOBILE_TELEPHONE_NUMBER] ?? '';

		// Set the home_address property value
		$props = ["street", "city", "state", "postal_code", "country"];
		$homeAddress = "";
		foreach ($props as $index => $prop) {
			if (isset($action["props"]["home_address_" . $prop]) && !empty($action["props"]["home_address_" . $prop])) {
				$homeAddress .= $action["props"]["home_address_" . $prop] . " ";
				if ($prop == "street" || $prop == "postal_code") {
					$homeAddress .= PHP_EOL;
				}
			}
		}

		$action["props"]["home_address"] = $homeAddress;
	}

	/**
	 * Function which deletes an item. Extended here to also delete corresponding birthday/anniversary
	 * appointments from calendar.
	 *
	 * @param false|resource $store         MAPI message store, or false to infer it
	 * @param false|string   $parententryid parent folder entry ID, or false to infer it
	 * @param false|string   $entryid       entry ID of the message, or false when unavailable
	 * @param array          $action        action data sent by the client
	 */
	#[Override]
	public function delete($store, $parententryid, $entryid, $action) {
		$message = false;
		if ($store === false && !$parententryid && $entryid) {
			$data = $this->getStoreParentEntryIdFromEntryId($entryid);
			$store = $data["store"];
			$message = $data["message"];
			$parententryid = $data["parent_entryid"];
		}

		if ($store !== false && $entryid) {
			try {
				if ($message === false) {
					$message = $GLOBALS["operations"]->openMessage($store, $entryid);
				}

				$props = mapi_getprops($message, [$this->properties['anniversary_eventid'], $this->properties['birthday_eventid']]);

				// if any of the appointment entryid exists then delete it
				if (!empty($props[$this->properties['birthday_eventid']])) {
					$this->deleteSpecialDateAppointment($store, bin2hex((string) $props[$this->properties['birthday_eventid']]));
				}

				if (!empty($props[$this->properties['anniversary_eventid']])) {
					$this->deleteSpecialDateAppointment($store, bin2hex((string) $props[$this->properties['anniversary_eventid']]));
				}
			}
			catch (MAPIException $e) {
				// if any error occurs in deleting appointments then we shouldn't block deletion of contact item
				// so ignore errors now
				$e->setHandled();
			}

			parent::delete($store, $parententryid, $entryid, $action);
		}
	}

	/**
	 * Function which retrieve the store, parent_entryid from record entryid.
	 *
	 * @param $entryid entryid of the message
	 *
	 * @return array which contains store and message object and parent entryid of that message
	 */
	public function getStoreParentEntryIdFromEntryId($entryid) {
		$message = $GLOBALS['mapisession']->openMessage($entryid);
		$messageStoreInfo = mapi_getprops($message, [PR_STORE_ENTRYID, PR_PARENT_ENTRYID]);
		$store = $GLOBALS['mapisession']->openMessageStore($messageStoreInfo[PR_STORE_ENTRYID]);
		$parentEntryid = $messageStoreInfo[PR_PARENT_ENTRYID];

		return ["message" => $message, "store" => $store, "parent_entryid" => $parentEntryid];
	}

	/**
	 * Calculate the number of minutes from the start of a timestamp's year to its month.
	 *
	 * @param int $timestamp
	 *
	 * @return int
	 */
	private static function getMonthOffset($timestamp) {
		$month = (int) date('m', $timestamp);
		$year = (int) date('Y', $timestamp);

		$yearStart = new DateTime();
		$yearStart->setDate($year, 1, 1);
		$monthStart = clone $yearStart;
		$monthStart->setDate($year, $month, 1);

		return $monthStart->diff($yearStart)->days * 24 * 60;
	}

	/**
	 * Function will create/update a yearly recurring appointment on the respective date of birthday or anniversary in user's calendar.
	 *
	 * @param resource $store  MAPI message store
	 * @param array    $action the action data, sent by the client
	 * @param string   $type   type of appointment that should be created/updated, valid values are 'birthday' and 'wedding_anniversary'
	 *
	 * @return false|string entry ID of the newly created appointment in hexadecimal form, or false
	 */
	public function updateAppointments($store, $action, $type) {
		$result = false;

		$root = mapi_msgstore_openentry($store);
		$rootProps = mapi_getprops($root, [PR_IPM_APPOINTMENT_ENTRYID, PR_STORE_ENTRYID]);
		$parentEntryId = bin2hex((string) $rootProps[PR_IPM_APPOINTMENT_ENTRYID]);
		$storeEntryId = bin2hex((string) $rootProps[PR_STORE_ENTRYID]);

		$actionProps = $action['props'];
		$subject = !empty($actionProps['subject']) ? $actionProps['subject'] : _('Untitled');
		$subject = ($type === 'birthday' ? sprintf(_('%s\'s Birthday'), $subject) : sprintf(_('%s\'s Anniversary'), $subject));

		// UTC time
		$startDateUTC = $actionProps[$type];
		$dueDateUTC = $actionProps[$type] + (24 * 60 * 60); // ONE DAY is added to set duedate of item.

		// get local time from UTC time
		$recur = new Recurrence($store, []);
		$startDate = $recur->fromGMT($actionProps, $startDateUTC);
		$dueDate = $recur->fromGMT($actionProps, $dueDateUTC);

		// Find the number of minutes since the start of the year to the given month,
		// taking leap years into account.
		$month = self::getMonthOffset($startDate);

		$defAllDayReminder = $GLOBALS['settings']->get('grommunio/v1/contexts/calendar/default_allday_reminder_time', 1080);

		$props = [
			'message_class' => 'IPM.Appointment',
			'icon_index' => 1025,
			'busystatus' => fbFree,
			'meeting' => olNonMeeting,
			'object_type' => MAPI_MESSAGE,
			'message_flags' => MSGFLAG_READ | MSGFLAG_UNSENT,
			'subject' => $subject,

			'startdate' => $startDateUTC,
			'duedate' => $dueDateUTC,
			'commonstart' => $startDateUTC,
			'commonend' => $dueDateUTC,
			'alldayevent' => true,
			'duration' => 1440,
			'reminder' => true,
			'reminder_minutes' => $defAllDayReminder,
			'reminder_time' => $startDateUTC,
			'flagdueby' => $startDateUTC - ($defAllDayReminder * 60),

			'recurring' => true,
			'recurring_reset' => true,
			'startocc' => 0,
			'endocc' => 1440,
			'start' => $startDate,
			'end' => $dueDate,
			'term' => 35,
			'everyn' => 1,
			'subtype' => 2,
			'type' => 13,
			'regen' => 0,
			'month' => $month,
			'monthday' => date('j', $startDate),
			'timezone' => $actionProps['timezone'],
			'timezonedst' => $actionProps['timezonedst'],
			'dststartmonth' => $actionProps['dststartmonth'],
			'dststartweek' => $actionProps['dststartweek'],
			'dststartday' => $actionProps['dststartday'],
			'dststarthour' => $actionProps['dststarthour'],
			'dstendmonth' => $actionProps['dstendmonth'],
			'dstendweek' => $actionProps['dstendweek'],
			'dstendday' => $actionProps['dstendday'],
			'dstendhour' => $actionProps['dstendhour'],
		];

		$data = [];
		$data['store'] = $storeEntryId;
		$data['parententryid'] = $parentEntryId;

		$entryid = false;
		// if entryid is provided then update existing appointment, else create new one
		if ($type === 'birthday' && !empty($actionProps['birthday_eventid'])) {
			$entryid = $actionProps['birthday_eventid'];
		}
		elseif ($type === 'wedding_anniversary' && !empty($actionProps['anniversary_eventid'])) {
			$entryid = $actionProps['anniversary_eventid'];
		}

		if ($entryid !== false) {
			$data['entryid'] = $entryid;
		}

		if (isset($action['timezone_iana'])) {
			$props['timezone_iana'] = $action['timezone_iana'];
		}

		$data['props'] = $props;

		// Save appointment (saveAppointment takes care of creating/modifying exceptions to recurring
		// items if necessary)
		try {
			$messageProps = $GLOBALS['operations']->saveAppointment($store, hex2bin((string) $entryid), hex2bin($parentEntryId), $data);
		}
		catch (MAPIException $e) {
			// if the appointment is deleted then create a new one
			if ($e->getCode() == MAPI_E_NOT_FOUND) {
				$e->setHandled();
				$messageProps = $GLOBALS['operations']->saveAppointment($store, false, hex2bin($parentEntryId), $data);
			}
			else {
				// The calendar entry is a convenience; the contact is saved regardless.
				$e->setHandled();
				error_log(sprintf('Unable to save the %s appointment of a contact: %s', $type, $e->getMessage()));
				$messageProps = false;
			}
		}

		// Notify the bus if the save was OK
		if ($messageProps && !(is_array($messageProps) && isset($messageProps['error']))) {
			$GLOBALS['bus']->notify($parentEntryId, TABLE_SAVE, $messageProps);
			$result = bin2hex((string) $messageProps[PR_ENTRYID]);
		}

		return $result;
	}

	/**
	 * Function will delete the appointment on the respective date of birthday or anniversary in user's calendar.
	 *
	 * @param resource $store   MAPI message store
	 * @param string   $entryid entry ID of the message to delete
	 */
	public function deleteSpecialDateAppointment($store, $entryid) {
		$root = mapi_msgstore_openentry($store);
		$rootProps = mapi_getprops($root, [PR_IPM_APPOINTMENT_ENTRYID, PR_STORE_ENTRYID]);
		$parentEntryId = $rootProps[PR_IPM_APPOINTMENT_ENTRYID];
		$storeEntryId = $rootProps[PR_STORE_ENTRYID];

		$props = [];
		$props[PR_PARENT_ENTRYID] = $parentEntryId;
		$props[PR_ENTRYID] = hex2bin((string) $entryid);
		$props[PR_STORE_ENTRYID] = $storeEntryId;

		$result = $GLOBALS['operations']->deleteMessages($store, $parentEntryId, $props[PR_ENTRYID]);

		if ($result) {
			$GLOBALS['bus']->notify(bin2hex((string) $parentEntryId), TABLE_DELETE, $props);
		}
	}

	/**
	 * This function searches the private contact folders for users and returns an array with data.
	 * Please note that the returning array must be UTF8.
	 *
	 * @param resource $ab        The addressbook
	 * @param resource $ab_dir    The addressbook container
	 * @param string   $searchstr The search query, case is ignored
	 */
	public function searchContactsFolders($ab, $ab_dir, $searchstr) {
		$r = [];
		$abhtable = mapi_folder_gethierarchytable($ab_dir, MAPI_DEFERRED_ERRORS | CONVENIENT_DEPTH);
		$abcntfolders = mapi_table_queryallrows($abhtable, [PR_ENTRYID, PR_AB_PROVIDER_ID, PR_DISPLAY_NAME]);
		$restriction = [
			RES_CONTENT,
			[
				FUZZYLEVEL => FL_SUBSTRING | FL_IGNORECASE,
				ULPROPTAG => PR_SMTP_ADDRESS,
				VALUE => [PR_SMTP_ADDRESS => $searchstr],
			],
		];
		// restriction on hierarchy table for PR_AB_PROVIDER_ID
		// seems not to work, just loop through
		foreach ($abcntfolders as $abcntfolder) {
			if ($abcntfolder[PR_AB_PROVIDER_ID] == ZARAFA_CONTACTS_GUID) {
				$abfldentry = mapi_ab_openentry($ab, $abcntfolder[PR_ENTRYID]);
				$abfldcontents = mapi_folder_getcontentstable($abfldentry);
				mapi_table_restrict($abfldcontents, $restriction);
				$r = mapi_table_queryallrows($abfldcontents, [PR_ENTRYID]);
				if (is_array($r) && !empty($r)) {
					return $r;
				}
			}
		}

		return $r;
	}
}
