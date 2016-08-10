<?php
	/**
	 * Contact ItemModule
	 * Module which openes, creates, saves and deletes an item. It 
	 * extends the Module class.
	 */
	class ContactItemModule extends ItemModule
	{
		/**
		 * Constructor
		 * @param int $id unique id.
		 * @param array $data list of all actions.
		 */
		function __construct($id, $data)
		{
			$this->properties = $GLOBALS['properties']->getContactProperties();

			parent::__construct($id, $data);

			$this->plaintext = true;
		}

		/**
		 * Function which opens an item.
		 * @param object $store MAPI Message Store Object
		 * @param string $entryid entryid of the message
		 * @param array $action the action data, sent by the client
		 * @return boolean true on success or false on failure 
		 */
		function open($store, $entryid, $action)
		{
			$data = array();

			if($entryid) {

				/* Check if given entryid is shared folder distlist then
				* get the store of distlist for fetching it's members.
				*
				* FIXME: isExternalDistList is broken and also returns true for normal contacts
				* in a shared store when we already have the valid $store. Which causes a
				* performance issue. A simple hack could be checking if $action['store_entryid'] is set.
				*
				* FIXME: isExternalDistList is also true when viewing the details of a shared contact
				* in a new mail. Therefore we have to rename it to something more meaningful.
				*/
				if ($GLOBALS["operations"]->isExternalDistList($entryid)) {
					$store = $GLOBALS['operations']->getOtherStoreFromEntryid(bin2hex($entryid));
				}
				if($store) {
					$message = $GLOBALS['operations']->openMessage($store, $entryid);
				} else {
					// store is not passed so we need to open the message first to get the store resource
					$message = $GLOBALS['mapisession']->openMessage($entryid);

					$messageStoreInfo = mapi_getprops($message, array(PR_STORE_ENTRYID));
					$store = $GLOBALS['mapisession']->openMessageStore($messageStoreInfo[PR_STORE_ENTRYID]);
				}
			}

			if(empty($message)) {
				return;
			}

			// Open embedded message if requested
			$attachNum = !empty($action['attach_num']) ? $action['attach_num'] : false;
			if($attachNum) {
				// get message props of sub message
				$parentMessage = $message;
				$message = $GLOBALS['operations']->openMessage($store, $entryid, $attachNum);

				if(empty($message)) {
					return;
				}

				// Check if message is distlist then we need to use different set of properties
				$props = mapi_getprops($message, array(PR_MESSAGE_CLASS));

				if(stripos($props[PR_MESSAGE_CLASS], 'IPM.Distlist') !== false) {
					// for distlist we need to use different set of properties
					$this->properties = $GLOBALS['properties']->getDistListProperties();
				}

				$data['item'] = $GLOBALS['operations']->getEmbeddedMessageProps($store, $message, $this->properties, $parentMessage, $attachNum);
			} else {
				// Check if message is distlist then we need to use different set of properties
				$props = mapi_getprops($message, array(PR_MESSAGE_CLASS));

				if(stripos($props[PR_MESSAGE_CLASS], 'IPM.Distlist') !== false) {
					// for distlist we need to use different set of properties
					$this->properties = $GLOBALS['properties']->getDistListProperties();
				}

				// get message props of the message
				$data['item'] = $GLOBALS['operations']->getMessageProps($store, $message, $this->properties, $this->plaintext);
			}

			// Allowing to hook in just before the data sent away to be sent to the client
			$GLOBALS['PluginManager']->triggerHook('server.module.contactitemmodule.open.after', array(
				'moduleObject' =>& $this,
				'store' => $store,
				'entryid' => $entryid,
				'action' => $action,
				'message' =>& $message,
				'data' =>& $data
			));

			$this->addActionData('item', $data);
			$GLOBALS['bus']->addData($this->getResponseData());
		}

		/**
		 * Function which saves an item. It sets the right properties for a contact
		 * item (address book properties).		 
		 * @param object $store MAPI Message Store Object
		 * @param string $parententryid parent entryid of the message
		 * @param string $entryid entryid of the message
		 * @param array $action the action data, sent by the client
		 * @return boolean true on success or false on failure		 		 
		 */
		function save($store, $parententryid, $entryid, $action)
		{
			$properiesToDelete = array();		// create an array of properties which should be deleted 
												// this array is passed to $GLOBALS['operations']->saveMessage() function

			if(!$store && !$parententryid) {
				if(isset($action['props']['message_class'])) {
					$store = $GLOBALS['mapisession']->getDefaultMessageStore();
					$parententryid = $this->getDefaultFolderEntryID($store, $action['props']['message_class']);
				}
			} else if(!$parententryid) {
				if(isset($action['props']['message_class']))
					$parententryid = $this->getDefaultFolderEntryID($store, $action['props']['message_class']);
			}

			if($store && $parententryid && isset($action['props'])) {
				if(isset($action['members'])) {
					// DistList

					// for distlist we need to use different set of properties
					$this->properties = $GLOBALS['properties']->getDistListProperties();

					// do conversion of client data
					$props = Conversion::mapXML2MAPI($this->properties, $action['props']);

					// collect members
					$members = array();
					$oneoff_members = array();

					$items = $action['members'];

					foreach($items as $item) {
						if(empty($item['email_address'])) {
							// if no email address is given then mapi_parseoneoff fails, so always give
							// email address, OL07 uses Unknown as email address so we do same here
							$item['email_address'] = 'Unknown';
						}

						$oneoff = mapi_createoneoff($item['display_name'], $item['address_type'], $item['email_address']);

						if ($item['distlist_type'] == DL_EXTERNAL_MEMBER) {
							$member = $oneoff;
						} else {
							$parts = array();
							$parts['distlist_guid'] = DL_GUID;
							$parts['distlist_type'] = $item['distlist_type'];
							$parts['entryid'] = hex2bin($item['entryid']);
							$member = pack('VA16CA*', 0, $parts['distlist_guid'], $parts['distlist_type'], $parts['entryid']);
						}

						$oneoff_members[] = $oneoff;
						$members[] = $member;
					}

					if (!empty($members) && !empty($oneoff_members)) {
						$props[$this->properties['members']] = $members;
						$props[$this->properties['oneoff_members']] = $oneoff_members;
					} else {
						$properiesToDelete[] = $this->properties['members'];
						$properiesToDelete[] = $this->properties['oneoff_members'];
					}

					unset($action['members']);
				} else {
					// Contact

					// generate one-off entryids for email addresses
					for($index = 1; $index < 4; $index++)
					{
						if(!empty($action['props']['email_address_' . $index]) && !empty($action['props']['email_address_display_name_' . $index])) {
							$action['props']['email_address_entryid_' . $index] = bin2hex(mapi_createoneoff($action['props']['email_address_display_name_' . $index], $action['props']['email_address_type_' . $index], $action['props']['email_address_' . $index]));
						}
					}

					// set properties for primary fax number
					if(isset($action['props']['fax_1_email_address']) && !empty($action['props']['fax_1_email_address'])) {
						$action['props']['fax_1_original_entryid'] = bin2hex(mapi_createoneoff($action['props']['fax_1_original_display_name'], $action['props']['fax_1_address_type'], $action['props']['fax_1_email_address'], MAPI_UNICODE));
					} else {
						// delete properties to remove previous values
						$properiesToDelete[] = $this->properties['fax_1_address_type'];
						$properiesToDelete[] = $this->properties['fax_1_original_display_name'];
						$properiesToDelete[] = $this->properties['fax_1_email_address'];
						$properiesToDelete[] = $this->properties['fax_1_original_entryid'];
					}

					// set properties for business fax number
					if(isset($action['props']['fax_2_email_address']) && !empty($action['props']['fax_2_email_address'])) {
						$action['props']['fax_2_original_entryid'] = bin2hex(mapi_createoneoff($action['props']['fax_2_original_display_name'], $action['props']['fax_2_address_type'], $action['props']['fax_2_email_address'], MAPI_UNICODE));
					} else {
						$properiesToDelete[] = $this->properties['fax_2_address_type'];
						$properiesToDelete[] = $this->properties['fax_2_original_display_name'];
						$properiesToDelete[] = $this->properties['fax_2_email_address'];
						$properiesToDelete[] = $this->properties['fax_2_original_entryid'];
					}

					// set properties for home fax number
					if(isset($action['props']['fax_3_email_address']) && !empty($action['props']['fax_3_email_address'])) {
						$action['props']['fax_3_original_entryid'] = bin2hex(mapi_createoneoff($action['props']['fax_3_original_display_name'], $action['props']['fax_3_address_type'], $action['props']['fax_3_email_address'], MAPI_UNICODE));
					} else {
						$properiesToDelete[] = $this->properties['fax_3_address_type'];
						$properiesToDelete[] = $this->properties['fax_3_original_display_name'];
						$properiesToDelete[] = $this->properties['fax_3_email_address'];
						$properiesToDelete[] = $this->properties['fax_3_original_entryid'];
					}

					// check for properties which should be deleted
					if(isset($action['entryid']) && !empty($action['entryid'])) {
						// check for empty email address properties
						for($i = 1; $i < 4; $i++)
						{
							if(isset($action['props']['email_address_' . $i]) && empty($action['props']['email_address_' . $i])) {
								array_push($properiesToDelete, $this->properties['email_address_entryid_' . $i]);
								array_push($properiesToDelete, $this->properties['email_address_' . $i]);
								array_push($properiesToDelete, $this->properties['email_address_display_name_' . $i]);
								array_push($properiesToDelete, $this->properties['email_address_display_name_email_' . $i]);
								array_push($properiesToDelete, $this->properties['email_address_type_' . $i]);
							}
						}

						// check for empty address_book_mv and address_book_long properties
						if(isset($action['props']['address_book_long']) && $action['props']['address_book_long'] === 0) {
							$properiesToDelete[] = $this->properties['address_book_mv'];
							$properiesToDelete[] = $this->properties['address_book_long'];
						}

						// Check if the birthday and anniversary properties are empty. If so delete them.
						if(array_key_exists('birthday', $action['props']) && empty($action['props']['birthday'])){
							array_push($properiesToDelete, $this->properties['birthday']);
							array_push($properiesToDelete, $this->properties['birthday_eventid']);
							if(!empty($action['props']['birthday_eventid'])) {
								$this->deleteSpecialDateAppointment($store, $action['props']['birthday_eventid']);
							}
						}

						if(array_key_exists('wedding_anniversary', $action['props']) && empty($action['props']['wedding_anniversary'])){
							array_push($properiesToDelete, $this->properties['wedding_anniversary']);
							array_push($properiesToDelete, $this->properties['anniversary_eventid']);
							if(!empty($action['props']['anniversary_eventid'])) {
								$this->deleteSpecialDateAppointment($store, $action['props']['anniversary_eventid']);
							}
						}
					}

					/** 
					 * convert all line endings(LF) into CRLF
					 * XML parser will normalize all CR, LF and CRLF into LF
					 * but outlook(windows) uses CRLF as line ending
					 */
					if(isset($action['props']['business_address'])) {
						$action['props']['business_address'] = str_replace('\n', '\r\n', $action['props']['business_address']);
					}

					if(isset($action['props']['home_address'])) {
						$action['props']['home_address'] = str_replace('\n', '\r\n', $action['props']['home_address']);
					}

					if(isset($action['props']['other_address'])) {
						$action['props']['other_address'] = str_replace('\n', '\r\n', $action['props']['other_address']);
					}

					// check birthday props to make an appointment
					if(!empty($action['props']['birthday'])){
						$action['props']['birthday_eventid'] = $this->updateAppointments($store, $action, 'birthday');
					}

					// check anniversary props to make an appointment
					if(!empty($action['props']['wedding_anniversary'])){
						$action['props']['anniversary_eventid'] = $this->updateAppointments($store, $action, 'wedding_anniversary');
					}

					// do the conversion when all processing has been finished
					$props = Conversion::mapXML2MAPI($this->properties, $action['props']);
				}

				$messageProps = array();

				$result = $GLOBALS['operations']->saveMessage($store, $entryid, $parententryid, $props, $messageProps, array(), isset($action['attachments']) ? $action['attachments'] : array(), $properiesToDelete);

				if($result) {
					$GLOBALS['bus']->notify(bin2hex($parententryid), TABLE_SAVE, $messageProps);

					$this->addActionData('update', array('item' => Conversion::mapMAPI2XML($this->properties, $messageProps)));
					$GLOBALS['bus']->addData($this->getResponseData());
				}
			}
		}

		/**
		 * Function which deletes an item. Extended here to also delete corresponding birthday/anniversary
		 * appointments from calendar.
		 * @param object $store MAPI Message Store Object
		 * @param string $parententryid parent entryid of the message
		 * @param string $entryid entryid of the message
		 * @param array $action the action data, sent by the client
		 */
		function delete($store, $parententryid, $entryid, $action)
		{
			if($store && $entryid) {
				try {
					$message = $GLOBALS["operations"]->openMessage($store, $entryid);

					$props = mapi_getprops($message, array($this->properties['anniversary_eventid'], $this->properties['birthday_eventid']));

					// if any of the appointment entryid exists then delete it
					if(!empty($props[$this->properties['birthday_eventid']])) {
						$this->deleteSpecialDateAppointment($store, bin2hex($props[$this->properties['birthday_eventid']]));
					}

					if(!empty($props[$this->properties['anniversary_eventid']])) {
						$this->deleteSpecialDateAppointment($store, bin2hex($props[$this->properties['anniversary_eventid']]));
					}
				} catch(MAPIException $e) {
					// if any error occurs in deleting appointments then we shouldn't block deletion of contact item
					// so ignore errors now
					$e->setHandled();
				}

				parent::delete($store, $parententryid, $entryid, $action);
			}
		}

		/**
		 * Function will create/update a yearly recurring appointment on the respective date of birthday or anniversary in user's calendar.	 
		 * @param object $store MAPI Message Store Object
		 * @param array $action the action data, sent by the client
		 * @param string $type type of appointment that should be created/updated, valid values are 'birthday' and 'wedding_anniversary'.
		 * @return HexString entryid of the newly created appointment in hex format.
		 */
		function updateAppointments($store, $action, $type)
		{
			$result = false;

			$root = mapi_msgstore_openentry($store, null);
			$rootProps = mapi_getprops($root, Array(PR_IPM_APPOINTMENT_ENTRYID, PR_STORE_ENTRYID));
			$parentEntryId = bin2hex($rootProps[PR_IPM_APPOINTMENT_ENTRYID]);
			$storeEntryId = bin2hex($rootProps[PR_STORE_ENTRYID]);

			$actionProps = $action['props'];
			$subject = !empty($actionProps['subject']) ? $actionProps['subject'] : _('Untitled');
			$subject = ($type === 'birthday' ? sprintf(_('%s\'s Birthday'), $subject) : sprintf(_('%s\'s Anniversary'), $subject));

			// UTC time
			$startDateUTC = $actionProps[$type];
			$dueDateUTC = $actionProps[$type] + (24 * 60 * 60);	// ONE DAY is added to set duedate of item.

			// get local time from UTC time
			$recur = new Recurrence($store, array());
			$startDate = $recur->fromGMT($actionProps, $startDateUTC);
			$dueDate = $recur->fromGMT($actionProps, $dueDateUTC);

			// Find the number of minutes since the start of the year to the given month,
			// taking leap years into account.
			$month =  strftime('%m', $startDate);
			$year =  strftime('%y', $startDate);

			$d1 = new DateTime();
			$d1->setDate($year, 1, 1);
			$d2 = new DateTime();
			$d2->setDate($year, $month, 1);

			$diff = $d2->diff($d1);
			$month = $diff->days * 24 * 60;

			$props = array (
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
				'reminder_minutes' => 1080,
				'reminder_time' => $startDateUTC,
				'flagdueby' => $startDateUTC - (1080 * 60),

				'recurring' => true,
				'recurring_reset' => true,
				'startocc' => 0,
				'endocc' => 1440,
				'start' => $startDate,
				'end' => $dueDate,
				'term' => 35,
				'everyn' => 12,
				'subtype' => 2,
				'type' => 13,
				'regen' => 0,
				'month' => $month,
				'monthday' => strftime('%e', $startDate),
				'timezone' => $actionProps['timezone'],
				'timezonedst' => $actionProps['timezonedst'],
				'dststartmonth' => $actionProps['dststartmonth'],
				'dststartweek' => $actionProps['dststartweek'],
				'dststartday' => $actionProps['dststartday'],
				'dststarthour' => $actionProps['dststarthour'],
				'dstendmonth' => $actionProps['dstendmonth'],
				'dstendweek' => $actionProps['dstendweek'],
				'dstendday' => $actionProps['dstendday'],
				'dstendhour' => $actionProps['dstendhour']
			);

			$data = array();
			$data['store'] = $storeEntryId;
			$data['parententryid'] = $parentEntryId;

			$entryid = false;
			// if entryid is provided then update existing appointment, else create new one
			if($type === 'birthday' && !empty($actionProps['birthday_eventid'])) {
				$entryid = $actionProps['birthday_eventid'];
			} else if($type === 'wedding_anniversary' && !empty($actionProps['anniversary_eventid'])) {
				$entryid = $actionProps['anniversary_eventid'];
			}

			if($entryid !== false) {
				$data['entryid'] = $entryid;
			}

			$data['props'] = $props;

			// Save appointment (saveAppointment takes care of creating/modifying exceptions to recurring
			// items if necessary)
			try {
				$messageProps = $GLOBALS['operations']->saveAppointment($store, hex2bin($entryid), hex2bin($parentEntryId), $data);
			} catch (MAPIException $e) {
				// if the appointment is deleted then create a new one
				if($e->getCode() == MAPI_E_NOT_FOUND) {
					$e->setHandled();
					$messageProps = $GLOBALS['operations']->saveAppointment($store, false, hex2bin($parentEntryId), $data);
				}
			}

			// Notify the bus if the save was OK
			if($messageProps && !(is_array($messageProps) && isset($messageProps['error'])) ){
				$GLOBALS['bus']->notify($parentEntryId, TABLE_SAVE, $messageProps);
				$result = bin2hex($messageProps[PR_ENTRYID]);
			}

			return $result;
		}

		/**
		 * Function will delete the appointment on the respective date of birthday or anniversary in user's calendar.
		 * @param object $store MAPI Message Store Object
		 * @param $entryid of the message with will be deleted,sent by the client
		 */
		function deleteSpecialDateAppointment($store, $entryid)
		{
			$root = mapi_msgstore_openentry($store, null);
			$rootProps = mapi_getprops($root, Array(PR_IPM_APPOINTMENT_ENTRYID, PR_STORE_ENTRYID));
			$parentEntryId = $rootProps[PR_IPM_APPOINTMENT_ENTRYID];
			$storeEntryId = $rootProps[PR_STORE_ENTRYID];

			$props = array();
			$props[PR_PARENT_ENTRYID] = $parentEntryId;
			$props[PR_ENTRYID] = hex2bin($entryid);
			$props[PR_STORE_ENTRYID] = $storeEntryId;

			$result = $GLOBALS['operations']->deleteMessages($store, $parentEntryId, $props[PR_ENTRYID]);

			if($result) {
				$GLOBALS['bus']->notify(bin2hex($parentEntryId), TABLE_DELETE, $props);
			}
		}
	}
?>
