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
							default:
								$this->handleUnknownActionType($actionType);
						}
					} catch (MAPIException $e) {
						$this->processException($e, $actionType, $store, null, $entryid, $action);
					}
				}
			}
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
	}
?>
