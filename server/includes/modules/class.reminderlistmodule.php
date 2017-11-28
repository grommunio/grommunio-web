<?php
	/**
	* Reminder Module
	*
	* TODO: add description
	*
	*/
	class ReminderListModule extends ListModule
	{
		/**
		* Constructor
		* @param int $id unique id.
		* @param array $data list of all actions.
		*/
		function __construct($id, $data)
		{
			$this->properties = $GLOBALS["properties"]->getReminderProperties();

			parent::__construct($id, $data);

			$store = $GLOBALS["mapisession"]->getDefaultMessageStore();
			$this->reminderEntryId = $this->getReminderFolderEntryId($store);
		}

		function execute()
		{
			$store = $GLOBALS["mapisession"]->getDefaultMessageStore();
			foreach($this->data as $actionType => $action)
			{
				if(isset($actionType)) {
					try {
						switch($actionType)
						{
							case "list":
								$this->getReminders();
								break;
							case "delete":
								$subActionType = false;
								if (isset($action["message_action"]) && isset($action["message_action"]["action_type"])) {
									$subActionType = $action["message_action"]["action_type"];
								}

								switch($subActionType)
								{
									case "snooze":
										$entryid = $this->getActionEntryID($action);
										$this->snoozeItem($store, $entryid, $action);
										break;
									case "dismiss":
										$entryid = $this->getActionEntryID($action);
										$this->dismissItem($store, $entryid);
										break;
									default:
										$this->handleUnknownActionType($subActionType);
								}
								break;
							default:
								$this->handleUnknownActionType($actionType);
						}
					} catch (MAPIException $e) {
						$this->processException($e, $actionType, $store, null, $entryid, $action);
					}
				}
			}
		}

		/**
		 * Function does customization of exception based on module data.
		 * like, here it will generate display message based on actionType
		 * for particular exception.
		 * 
		 * @param object $e Exception object
		 * @param string $actionType the action type, sent by the client
		 * @param MAPIobject $store Store object of message.
		 * @param string $parententryid parent entryid of the message.
		 * @param string $entryid entryid of the message.
		 * @param array $action the action data, sent by the client
		 */
		function handleException(&$e, $actionType = null, $store = null, $parententryid = null, $entryid = null, $action = null)
		{
			if(is_null($e->displayMessage)) {
				switch($actionType)
				{
					case 'delete':
						if (!empty($action['message_action']['action_type'])) {
							switch($action['message_action']['action_type'])
							{
								case 'snooze':
									if($e->getCode() == MAPI_E_STORE_FULL) {
										$e->setDisplayMessage(_('Cannot snooze the reminder. You may be reminded again.') . '<br />' . $this->getOverQuotaMessage($store));
									} else {
										$e->setDisplayMessage(_('Cannot snooze the reminder. You may be reminded again.'));
									}
									break;
								case 'dismiss':
									if($e->getCode() == MAPI_E_STORE_FULL) {
										$e->setDisplayMessage(_('Cannot dismiss the reminder. You may be reminded again.') . '<br />' . $this->getOverQuotaMessage($store));
									} else {
										$e->setDisplayMessage(_('Cannot dismiss the reminder. You may be reminded again.'));
									}
									break;
							}
						}
						break;
				}
			}

			parent::handleException($e, $actionType, $store, $parententryid, $entryid, $action);
		}

		function getReminderFolderEntryId($store)
		{
			$root = mapi_msgstore_openentry($store, null);
			$rootProps = mapi_getprops($root, array(PR_REM_ONLINE_ENTRYID));
			if (isset($rootProps[PR_REM_ONLINE_ENTRYID])){
				return $rootProps[PR_REM_ONLINE_ENTRYID];
			}

			// Reminder folder didn't exist, create one
			$entryid = $this->createReminderFolder($store);
			return $entryid;
		}

		function createReminderFolder($store)
		{
			$storeProps = mapi_getprops($store, array(PR_IPM_OUTBOX_ENTRYID, PR_IPM_WASTEBASKET_ENTRYID, PR_IPM_SUBTREE_ENTRYID));
			$root = mapi_msgstore_openentry($store, null);
			$rootProps = mapi_getprops($root, array(PR_ADDITIONAL_REN_ENTRYIDS, PR_IPM_DRAFTS_ENTRYID));


			$folders = array();
			if (isset($storeProps[PR_IPM_WASTEBASKET_ENTRYID]))
				$folders[] = $storeProps[PR_IPM_WASTEBASKET_ENTRYID];
			if (isset($rootProps[PR_ADDITIONAL_REN_ENTRYIDS])&&!empty($rootProps[PR_ADDITIONAL_REN_ENTRYIDS][4]))
				$folders[] = $rootProps[PR_ADDITIONAL_REN_ENTRYIDS][4]; // junk mail
			if (isset($rootProps[PR_IPM_DRAFTS_ENTRYID]))
				$folders[] = $rootProps[PR_IPM_DRAFTS_ENTRYID];
			if (isset($storeProps[PR_IPM_OUTBOX_ENTRYID]))
				$folders[] = $storeProps[PR_IPM_OUTBOX_ENTRYID];
			if (isset($rootProps[PR_ADDITIONAL_REN_ENTRYIDS])&&!empty($rootProps[PR_ADDITIONAL_REN_ENTRYIDS][0]))
				$folders[] = $rootProps[PR_ADDITIONAL_REN_ENTRYIDS][0]; // conflicts
			if (isset($rootProps[PR_ADDITIONAL_REN_ENTRYIDS])&&!empty($rootProps[PR_ADDITIONAL_REN_ENTRYIDS][2]))
				$folders[] = $rootProps[PR_ADDITIONAL_REN_ENTRYIDS][2]; // local failures
			if (isset($rootProps[PR_ADDITIONAL_REN_ENTRYIDS])&&!empty($rootProps[PR_ADDITIONAL_REN_ENTRYIDS][1]))
				$folders[] = $rootProps[PR_ADDITIONAL_REN_ENTRYIDS][1]; // sync issues

			$folderRestriction = array();
			foreach($folders as $folder){
				$folderRestriction[] = 	array(RES_PROPERTY,
											array(
												RELOP		=>	RELOP_NE,
												ULPROPTAG	=>	$this->properties["parent_entryid"],
												VALUE		=>	array($this->properties["parent_entryid"]	=>	$folder)
											)
										);
			}

			$res =
				array(RES_AND,
					array(
						array(RES_AND,
							$folderRestriction
						),
						array(RES_AND,
							array(
								array(RES_NOT,
									array(
										array(RES_AND,
											array(
												array(RES_EXIST,
													array(
														ULPROPTAG	=>	$this->properties["message_class"]
													)
												),
												array(RES_CONTENT,
													array(
														FUZZYLEVEL	=>	FL_PREFIX,
														ULPROPTAG	=>	$this->properties["message_class"],
														VALUE		=>	array($this->properties["message_class"]	=>	"IPM.Schedule")
													)
												)
											)
										)
									)
								),
								array(RES_BITMASK,
									array(
										ULTYPE		=>	BMR_EQZ,
										ULPROPTAG	=>	$this->properties["message_flags"],
										ULMASK		=>	MSGFLAG_SUBMIT
									)
								),
								array(RES_OR,
									array(
										array(RES_PROPERTY,
											array(
												RELOP		=>	RELOP_EQ,
												ULPROPTAG	=>	$this->properties["reminder"],
												VALUE		=>	array($this->properties["reminder"]	=>	true)
											)
										),
									)
								)
							)
						)
					)
				);

			$folder = mapi_folder_createfolder($root, _("Reminders"), "", OPEN_IF_EXISTS, FOLDER_SEARCH);
			mapi_setprops($folder, array(PR_CONTAINER_CLASS	=>	"Outlook.Reminder"));
			mapi_savechanges($folder);

			mapi_folder_setsearchcriteria($folder, $res, array($storeProps[PR_IPM_SUBTREE_ENTRYID]), RECURSIVE_SEARCH);
			$folderProps = mapi_getprops($folder, array(PR_ENTRYID));

			mapi_setprops($root, array(PR_REM_ONLINE_ENTRYID	=>	$folderProps[PR_ENTRYID]));
			mapi_savechanges($root);

			return $folderProps[PR_ENTRYID];
		}

		function getReminders()
		{
			$data = array();

			$store = $GLOBALS["mapisession"]->getDefaultMessageStore();

			$restriction = 	array(RES_AND,
								array(
									array(RES_PROPERTY,
										array(
											RELOP		=>	RELOP_LT,
											ULPROPTAG	=>	$this->properties["flagdueby"],
											VALUE		=>	array($this->properties["flagdueby"] =>	time())
										)
									),
									array(RES_PROPERTY,
										array(
											RELOP		=>	RELOP_EQ,
											ULPROPTAG	=>	$this->properties["reminder"],
											VALUE		=>	true
										)
									),
									array(RES_PROPERTY,
										array(
											RELOP		=>	RELOP_NE,
											ULPROPTAG	=>	$this->properties["message_class"],
											VALUE		=>	"IPM.TaskRequest"
										)
									),
									array(RES_PROPERTY,
										array(
											RELOP		=>	RELOP_NE,
											ULPROPTAG	=>	$this->properties["message_class"],
											VALUE		=>	"IPM.TaskRequest.Cancel"
										)
									),
									array(RES_PROPERTY,
										array(
											RELOP		=>	RELOP_NE,
											ULPROPTAG	=>	$this->properties["message_class"],
											VALUE		=>	"IPM.TaskRequest.Accept"
										)
									),
									array(RES_PROPERTY,
										array(
											RELOP		=>	RELOP_NE,
											ULPROPTAG	=>	$this->properties["message_class"],
											VALUE		=>	"IPM.TaskRequest.Update"
										)
									),
									array(RES_PROPERTY,
										array(
											RELOP		=>	RELOP_NE,
											ULPROPTAG	=>	$this->properties["message_class"],
											VALUE		=>	"IPM.TaskRequest.Complete"
										)
									)
								)
			);

			try {
				$reminderfolder = mapi_msgstore_openentry($store, $this->reminderEntryId);
			} catch (MAPIException $e) {
				// if the reminder folder does not exist, try to recreate it.
				if($e->getCode() == MAPI_E_NOT_FOUND) {
					$e->setHandled();

					$this->reminderEntryId = $this->createReminderFolder($store);
					$reminderfolder = mapi_msgstore_openentry($store, $this->reminderEntryId);
				}
			}

			$remindertable = mapi_folder_getcontentstable($reminderfolder, MAPI_DEFERRED_ERRORS);
			if(!$remindertable)
				return false;

			mapi_table_restrict($remindertable, $restriction, TBL_BATCH);
			mapi_table_sort($remindertable, array($this->properties["flagdueby"] => TABLE_SORT_DESCEND), TBL_BATCH);

			$rows = mapi_table_queryallrows($remindertable, $this->properties);

			$data["item"] = array();

			foreach($rows as $row) {
				if(isset($row[$this->properties["appointment_recurring"]]) && $row[$this->properties["appointment_recurring"]]) {
					$recur = new Recurrence($store, $row);

					/**
					 * FlagDueBy == PidLidReminderSignalTime.
					 * FlagDueBy handles whether we should be showing the item; if now() is after FlagDueBy, then we should show a reminder
					 * for this recurrence. However, the item we will show is either the last passed occurrence (overdue), or the next occurrence, depending
					 * on whether we have reached the next occurrence yet (the reminder_time of the next item is ignored).
					 *
					 * The way we handle this is to get all occurrences between the 'flagdueby' moment and the current time. This will
					 * yield N items (may be a lot of it was not dismissed for a long time). We can then take the last item in this list, and this is the item
					 * we will show to the user. The idea here is:
					 *
					 * The item we want to show is the last item in that list (new occurrences that have started uptil now should override old ones)
					 *
					 * Add the reminder_minutes (default 15 minutes for calendar, 0 for tasks) to check over the gap between FlagDueBy and the start time of the
					 * occurrence, if "now" would be in between these values.
					 */
					$remindertimeinseconds = $row[$this->properties["reminder_minutes"]] * 60;
					$occurrences = $recur->getItems($row[$this->properties["flagdueby"]], time() + ($remindertimeinseconds), 0, true);

					if(empty($occurrences))
						continue;

				    // More than one occurrence, use the last one instead of the first one after flagdueby
                    $occ = $occurrences[count($occurrences)-1];

                    // Bydefault, on occurrence reminder is true but if reminder value is set to false then we don't send popup reminder for this occurrence
                    if (!(isset($occ[$this->properties['reminder']]) && $occ[$this->properties['reminder']] == 0)) {
                        $row[$this->properties["reminder_time"]] = $occ[$this->properties["appointment_startdate"]];
                        $row[$this->properties["appointment_startdate"]] = $occ[$this->properties["appointment_startdate"]];
                        $row[$this->properties["appointment_enddate"]] = $occ[$this->properties["appointment_startdate"]];
                    }
				}

				// Add the non-bogus rows
				 array_push($data["item"], Conversion::mapMAPI2XML($this->properties, $row));
			}

			// Generate this handy MD5 so that the client can easily detect changes
			$data["rowchecksum"] = md5(serialize($data["item"]));

			$this->addActionData("list", $data);
			$GLOBALS["bus"]->addData($this->getResponseData());

			// Trigger the newmailnotifier
			$GLOBALS["bus"]->notify(REQUEST_ENTRYID, HIERARCHY_UPDATE);

			return true;
		}

		function snoozeItem($store, $entryid, $action)
		{
			$result = false;
			$message = mapi_msgstore_openentry($store, $entryid);
			if ($message){
				$newProps = array(PR_ENTRYID => $entryid);
				$props = mapi_getprops($message, $this->properties);

				$snoozeTime = $GLOBALS["settings"]->get('zarafa/v1/main/reminder/default_snooze_time', 5);
				if (isset($action["message_action"]["snoozeTime"]) && is_numeric($action["message_action"]["snoozeTime"])) {
					$snoozeTime = $action["message_action"]["snoozeTime"];
				}

				$reminderTime = time() + ($snoozeTime * 60);
				if (stripos($props[$this->properties["message_class"]], "IPM.Appointment") === 0) {
					if (isset($props[$this->properties["appointment_recurring"]]) && $props[$this->properties["appointment_recurring"]]){

						$recurrence = new Recurrence($store, $message);
						$nextReminder = $recurrence->getNextReminderTime(time());

						// flagdueby must be the snooze time or the time of the next instance, whichever is earlier
						if ($reminderTime < $nextReminder)
							$newProps[$this->properties["flagdueby"]] = $reminderTime;
						else
							$newProps[$this->properties["flagdueby"]] = $nextReminder;
					}else{
						$newProps[$this->properties["flagdueby"]] = $reminderTime;
					}
				}else{
					$newProps[$this->properties["flagdueby"]] = $reminderTime;
				}

				// save props
				mapi_setprops($message, $newProps);
				mapi_savechanges($message);

				$result = true;
			}

			if ($result){
				/**
				 * @FIXME: Fix notifications for reminders.
				 * Notifications are currently disabled, because deleting multiple items will notify
				 * hierarchy multiple time but no data is changed with folder item in hierarchy.
				 * so it will push same data again which will lead to an error.
				 */
				//$props = mapi_getprops($message, array(PR_ENTRYID, PR_PARENT_ENTRYID, PR_STORE_ENTRYID));
				//$GLOBALS["bus"]->notify(bin2hex($props[PR_PARENT_ENTRYID]), TABLE_SAVE, $props);
			}
			$this->sendFeedback($result);
		}

		function dismissItem($store, $entryid)
		{
			$result = false;
			$message = mapi_msgstore_openentry($store, $entryid);
			if ($message){
				$newProps = array();
				$props = mapi_getprops($message, $this->properties);

				if (stripos($props[$this->properties["message_class"]], "IPM.Appointment") === 0) {
					if (isset($props[$this->properties["appointment_recurring"]]) && $props[$this->properties["appointment_recurring"]]){

						$recurrence = new Recurrence($store, $message);
						// check for next reminder after "now" for the next instance
						$nextReminder = $recurrence->getNextReminderTime(time());
						if($nextReminder)
    						$newProps[$this->properties["flagdueby"]] = $nextReminder;
                        else
                            $newProps[$this->properties["reminder"]] = false;
					}else{
						$newProps[$this->properties["reminder"]] = false;
					}
				} else if (stripos($props[$this->properties["message_class"]], "IPM.Task") === 0) {
					$newProps[$this->properties["reminder"]] = false;

					if (isset($props[$this->properties['task_recurring']]) && $props[$this->properties['task_recurring']] == 1) {
						$newProps[$this->properties['task_resetreminder']] = true;
					}
				} else {
					$newProps[$this->properties["reminder"]] = false;
				}

				// save props
				mapi_setprops($message, $newProps);
				mapi_savechanges($message);

				$result = true;
			}

			if ($result){
				/**
				 * @FIXME: Fix notifications for reminders.
				 * Notifications are currently disabled, because deleting multiple items will notify
				 * hierarchy multiple time but no data is changed with folder item in hierarchy.
				 * so it will push same data again which will lead to an error.
				 */
				//$props = mapi_getprops($message, array(PR_ENTRYID, PR_PARENT_ENTRYID, PR_STORE_ENTRYID));
				//$GLOBALS["bus"]->notify(bin2hex($props[PR_PARENT_ENTRYID]), TABLE_SAVE, $props);
			}
			$this->sendFeedback($result);
		}
	}
?>
