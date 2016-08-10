<?php
	class AdvancedSearchListModule extends ListModule
	{
		/**
		 * Constructor
		 * @param		int		$id			unique id.
		 * @param		array		$data		list of all actions.
		 */
		function __construct($id, $data)
		{
			// TODO: create a new method in Properties class that will return only the properties we
			// need for search list (and perhaps for preview???)
			$this->properties = $GLOBALS["properties"]->getMailListProperties();
			$this->properties = array_merge($this->properties, $GLOBALS["properties"]->getAppointmentListProperties());
			$this->properties = array_merge($this->properties, $GLOBALS["properties"]->getContactListProperties());
			$this->properties = array_merge($this->properties, $GLOBALS["properties"]->getStickyNoteListProperties());
			$this->properties = array_merge($this->properties, $GLOBALS["properties"]->getTaskListProperties());
			$this->properties = array_merge($this->properties, array(
					'body' => PR_BODY,
					'html_body' => PR_HTML,
					'startdate' => "PT_SYSTIME:PSETID_Appointment:0x820d",
					'duedate' => "PT_SYSTIME:PSETID_Appointment:0x820e",
					'creation_time' => PR_CREATION_TIME,
					"task_duedate" => "PT_SYSTIME:PSETID_Task:0x8105"));
			$this->properties = getPropIdsFromStrings($GLOBALS["mapisession"]->getDefaultMessageStore(), $this->properties);

			parent::__construct($id, $data);
		}

		/**
		 * Executes all the actions in the $data variable.
		 * @return		boolean					true on success or false on failure.
		 */
		function execute()
		{
			foreach($this->data as $actionType => $action)
			{
				if(isset($actionType)) {
					try {
						$store = $this->getActionStore($action);
						$parententryid = $this->getActionParentEntryID($action);
						$entryid = $this->getActionEntryID($action);

						switch($actionType)
						{
							case "list":
							case "updatelist":
								$this->getDelegateFolderInfo($store);
								$this->messageList($store, $entryid, $action, $actionType);
								break;
							case "search":
								$this->search($store, $entryid, $action, $actionType);
								break;
							case "updatesearch":
								$this->updatesearch($store, $entryid, $action);
								break;
							case "stopsearch":
								$this->stopSearch($store, $entryid, $action);
								break;
							case "delete":
								$this->delete($store, $parententryid, $entryid, $action);
								break;
							case "delete_searchfolder":
								$this->deleteSearchFolder($store, $entryid, $action);
								break;
							case "save":
								$this->save($store, $parententryid, $action);
								break;
						}
					} catch (MAPIException $e) {
						// This is a very nasty hack that makes sure that the WebApp doesn't show an error message when
						// search wants to throw an error. This is only done because a proper fix for this bug has not
						// been found yet. When WA-9161 is really solved, this should be removed again.
						if ( $actionType !== 'search' && $actionType !== 'updatesearch' && $actionType !== 'stopsearch' ){
							$this->processException($e, $actionType);
						} else {
							if ( DEBUG_LOADER === 'LOAD_SOURCE' ){
								// Log all info we can get about this error to the error log of the web server
								error_log("Error in search: \n" . var_export($e, true) . "\n\n" . var_export(debug_backtrace(), true));
							}
							// Send success feedback without data, as if nothing strange happened...
							$this->sendFeedback(true);
						}
					}
				}
			}
		}
	}
?>
