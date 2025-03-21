<?php

require_once BASE_PATH . 'server/includes/core/class.indexsqlite.php';

class AdvancedSearchListModule extends ListModule {
	/**
	 * Constructor.
	 *
	 * @param int   $id   unique id
	 * @param array $data list of all actions
	 */
	public function __construct($id, $data) {
		parent::__construct($id, $data);
		// TODO: create a new method in Properties class that will return only the properties we
		// need for search list (and perhaps for preview???)
		$this->properties = $GLOBALS["properties"]->getMailListProperties();
		$this->properties = array_merge($this->properties, $GLOBALS["properties"]->getAppointmentListProperties());
		$this->properties = array_merge($this->properties, $GLOBALS["properties"]->getContactListProperties());
		$this->properties = array_merge($this->properties, $GLOBALS["properties"]->getStickyNoteListProperties());
		$this->properties = array_merge($this->properties, $GLOBALS["properties"]->getTaskListProperties());
		$this->properties = array_merge($this->properties, [
			'body' => PR_BODY,
			'html_body' => PR_HTML,
			'startdate' => "PT_SYSTIME:PSETID_Appointment:" . PidLidAppointmentStartWhole,
			'duedate' => "PT_SYSTIME:PSETID_Appointment:" . PidLidAppointmentEndWhole,
			'creation_time' => PR_CREATION_TIME,
			"task_duedate" => "PT_SYSTIME:PSETID_Task:" . PidLidTaskDueDate,
		]);
		$this->properties = getPropIdsFromStrings($GLOBALS["mapisession"]->getDefaultMessageStore(), $this->properties);
		$this->sort = [
			PR_MESSAGE_DELIVERY_TIME => TABLE_SORT_DESCEND,
		];
	}

	/**
	 * Executes all the actions in the $data variable.
	 */
	#[Override]
	public function execute() {
		foreach ($this->data as $actionType => $action) {
			if (isset($actionType)) {
				try {
					$store = $this->getActionStore($action);
					$parententryid = $this->getActionParentEntryID($action);
					$entryid = $this->getActionEntryID($action);

					switch ($actionType) {
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

						case "delete_searchfolder":
							$this->deleteSearchFolder($store, $entryid, $action);
							break;
					}
				}
				catch (MAPIException $e) {
					// This is a very nasty hack that makes sure that grommunio Web doesn't show an error message when
					// search wants to throw an error. This is only done because a proper fix for this bug has not
					// been found yet. When WA-9161 is really solved, this should be removed again.
					if ($actionType !== 'search' && $actionType !== 'updatesearch' && $actionType !== 'stopsearch') {
						$this->processException($e, $actionType);
					}
					else {
						if (DEBUG_LOADER === 0) {
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

	/**
	 * Function which retrieves a list of messages in a folder.
	 *
	 * @param object $store      MAPI Message Store Object
	 * @param string $entryid    entryid of the folder
	 * @param array  $action     the action data, sent by the client
	 * @param string $actionType the action type, sent by the client
	 */
	#[Override]
	public function messageList($store, $entryid, $action, $actionType) {
		$this->searchFolderList = false; // Set to indicate this is not the search result, but a normal folder content
		$data = [];

		if ($store && $entryid) {
			// Restriction
			$this->parseRestriction($action);

			// Sort
			$this->parseSortOrder($action, null, true);

			$limit = $action['restriction']['limit'] ?? 1000;

			$isSearchFolder = isset($action['search_folder_entryid']);
			$entryid = $isSearchFolder ? hex2bin((string) $action['search_folder_entryid']) : $entryid;

			if ($actionType == 'search') {
				$rows = [[PR_ENTRYID => $entryid]];
				if (isset($action['subfolders']) && $action['subfolders']) {
					$folder = mapi_msgstore_openentry($store, $entryid);
					$htable = mapi_folder_gethierarchytable($folder, CONVENIENT_DEPTH | MAPI_DEFERRED_ERRORS);
					$rows = mapi_table_queryallrows($htable, [PR_ENTRYID]);
				}
				$data['item'] = [];
				foreach ($rows as $row) {
					$items = $GLOBALS["operations"]->getTable($store, $row[PR_ENTRYID], $this->properties, $this->sort, $this->start, $limit, $this->restriction);
					$data['item'] = array_merge($data['item'], $items['item']);
					if (count($data['item']) >= $limit) {
						break;
					}
				}
				$data['page'] = [];
				$data['page']['start'] = 0;
				$data['page']['rowcount'] = 0;
				$data['page']['totalrowcount'] = count($data['item']);
				$data['search_meta'] = [];
				$data['search_meta']['searchfolder_entryid'] = null;
				$data['search_meta']['search_store_entryid'] = $action['store_entryid'];
				$data['search_meta']['searchstate'] = null;
				$data['search_meta']['results'] = count($data['item']);
				$data['folder'] = [];
				$data['folder']['content_count'] = count($data['item']);
				$data['folder']['content_unread'] = 0;
			}
			else {
				// Get the table and merge the arrays
				$data = $GLOBALS["operations"]->getTable($store, $entryid, $this->properties, $this->sort, $this->start, $limit, $this->restriction);
			}

			// If the request come from search folder then no need to send folder information
			if (!$isSearchFolder && !isset($data['folder'])) {
				// Open the folder.
				$folder = mapi_msgstore_openentry($store, $entryid);
				$data["folder"] = [];

				// Obtain some statistics from the folder contents
				$contentcount = mapi_getprops($folder, [PR_CONTENT_COUNT, PR_CONTENT_UNREAD]);
				if (isset($contentcount[PR_CONTENT_COUNT])) {
					$data["folder"]["content_count"] = $contentcount[PR_CONTENT_COUNT];
				}

				if (isset($contentcount[PR_CONTENT_UNREAD])) {
					$data["folder"]["content_unread"] = $contentcount[PR_CONTENT_UNREAD];
				}
			}

			$data = $this->filterPrivateItems($data);

			// Allowing to hook in just before the data sent away to be sent to the client
			$GLOBALS['PluginManager']->triggerHook('server.module.listmodule.list.after', [
				'moduleObject' => &$this,
				'store' => $store,
				'entryid' => $entryid,
				'action' => $action,
				'data' => &$data,
			]);

			// unset will remove the value but will not regenerate array keys, so we need to
			// do it here
			$data["item"] = array_values($data["item"]);
			$this->addActionData($actionType, $data);
			$GLOBALS["bus"]->addData($this->getResponseData());
		}
	}

	private function parsePatterns($restriction, &$patterns) {
		if (empty($restriction)) {
			return;
		}
		$type = $restriction[0];
		if ($type == RES_CONTENT) {
			$subres = $restriction[1];

			switch ($subres[ULPROPTAG]) {
				case PR_SUBJECT:
					$patterns['subject'] = $subres[VALUE][$subres[ULPROPTAG]];
					break;

				case PR_BODY:
					$patterns['content'] = $subres[VALUE][$subres[ULPROPTAG]];
					$patterns['attachments'] = $subres[VALUE][$subres[ULPROPTAG]];
					break;

				case PR_SENDER_NAME:
					$patterns['sender'] = $subres[VALUE][$subres[ULPROPTAG]];
					break;

				case PR_SENT_REPRESENTING_NAME:
					$patterns['sending'] = $subres[VALUE][$subres[ULPROPTAG]];
					break;

				case PR_DISPLAY_TO:
				case PR_DISPLAY_CC:
					$patterns['recipients'] = $subres[VALUE][$subres[ULPROPTAG]];
					break;

				case PR_MESSAGE_CLASS:
					if (empty($patterns['message_classes'])) {
						$patterns['message_classes'] = [];
					}
					$patterns['message_classes'][] = $subres[VALUE][$subres[ULPROPTAG]];
					break;

				case PR_DISPLAY_NAME:
					$patterns['others'] = $subres[VALUE][$subres[ULPROPTAG]];
					break;

				case $this->properties['categories']:
					if (!isset($patterns['categories'])) {
						$patterns['categories'] = [];
					}
					if (isset($subres[VALUE][$subres[ULPROPTAG]][0])) {
						$patterns['categories'][] = $subres[VALUE][$subres[ULPROPTAG]][0];
					}
					break;
			}
		}
		elseif ($type == RES_AND || $type == RES_OR) {
			foreach ($restriction[1] as $subres) {
				$this->parsePatterns($subres, $patterns);
			}
		}
		elseif ($type == RES_BITMASK) {
			$subres = $restriction[1];
			if ($subres[ULPROPTAG] == PR_MESSAGE_FLAGS && $subres[ULTYPE] == BMR_EQZ) {
				$patterns['unread'] = MSGFLAG_READ & $subres[ULMASK];
			}
		}
		elseif ($type == RES_PROPERTY) {
			$subres = $restriction[1];
			if ($subres[ULPROPTAG] == PR_MESSAGE_DELIVERY_TIME ||
				$subres[ULPROPTAG] == PR_LAST_MODIFICATION_TIME) {
				if ($subres[RELOP] == RELOP_LT ||
					$subres[RELOP] == RELOP_LE) {
					$patterns['date_end'] = $subres[VALUE][$subres[ULPROPTAG]];
				}
				elseif ($subres[RELOP] == RELOP_GT ||
					$subres[RELOP] == RELOP_GE) {
					$patterns['date_start'] = $subres[VALUE][$subres[ULPROPTAG]];
				}
			}
		}
		elseif ($type == RES_SUBRESTRICTION) {
			$subres = $restriction[1];
			$patterns['has_attachments'] = $subres[ULPROPTAG] == PR_MESSAGE_ATTACHMENTS;
		}
	}

	/**
	 *	Function will set search restrictions on search folder and start search process
	 *	and it will also parse visible columns and sorting data when sending results to client.
	 *
	 * @param object $store      MAPI Message Store Object
	 * @param string $entryid    entryid of the folder
	 * @param object $action     the action data, sent by the client
	 * @param string $actionType the action type, sent by the client
	 */
	#[Override]
	public function search($store, $entryid, $action, $actionType) {
		$useSearchFolder = $action["use_searchfolder"] ?? false;
		if (!$useSearchFolder) {
			/*
			 * store doesn't support search folders so we can't use this
			 * method instead we will pass restriction to messageList and
			 * it will give us the restricted results
			 */
			return parent::messageList($store, $entryid, $action, "list");
		}
		$store_props = mapi_getprops($store, [PR_MDB_PROVIDER, PR_DEFAULT_STORE, PR_IPM_SUBTREE_ENTRYID]);
		if ($store_props[PR_MDB_PROVIDER] == ZARAFA_STORE_PUBLIC_GUID) {
			// public store does not support search folders
			return parent::messageList($store, $entryid, $action, "search");
		}
		if ($GLOBALS['entryid']->compareEntryIds(bin2hex($entryid), bin2hex(TodoList::getEntryId()))) {
			// todo list do not need to perform full text index search
			return parent::messageList($store, $entryid, $action, "list");
		}

		$this->searchFolderList = true; // Set to indicate this is not the normal folder, but a search folder
		$this->restriction = false;

		// Parse Restriction
		$this->parseRestriction($action);
		if ($this->restriction == false) {
			// if error in creating restriction then send error to client
			$errorInfo = [];
			$errorInfo["error_message"] = _("Error in search, please try again") . ".";
			$errorInfo["original_error_message"] = "Error in parsing restrictions.";

			return $this->sendSearchErrorToClient($store, $entryid, $action, $errorInfo);
		}

		$isSetSearchFolderEntryId = isset($action['search_folder_entryid']);
		if ($isSetSearchFolderEntryId) {
			$this->sessionData['searchFolderEntryId'] = $action['search_folder_entryid'];
		}

		if (isset($action['forceCreateSearchFolder']) && $action['forceCreateSearchFolder']) {
			$isSetSearchFolderEntryId = false;
		}

		// create or open search folder
		$searchFolder = $this->createSearchFolder($store, $isSetSearchFolderEntryId);
		if ($searchFolder === false) {
			if ($store_props[PR_MDB_PROVIDER] == ZARAFA_STORE_DELEGATE_GUID) {
				$this->messageList($store, $entryid, $action, "search");

				return true;
			}
			// if error in creating search folder then send error to client
			$errorInfo = [];

			$errorInfo["error_message"] = match (mapi_last_hresult()) {
				MAPI_E_NO_ACCESS => _("Unable to perform search query, no permissions to create search folder."),
				MAPI_E_NOT_FOUND => _("Unable to perform search query, search folder not found."),
				default => _("Unable to perform search query, store might not support searching."),
			};

			$errorInfo["original_error_message"] = _("Error in creating search folder.");

			return $this->sendSearchErrorToClient($store, $entryid, $action, $errorInfo);
		}

		$subfolder_flag = 0;
		$recursive = false;
		if (isset($action["subfolders"]) && $action["subfolders"] == "true") {
			$recursive = true;
			$subfolder_flag = RECURSIVE_SEARCH;
		}

		if (!is_array($entryid)) {
			$entryids = [$entryid];
		}
		else {
			$entryids = $entryid;
		}

		$searchFolderEntryId = $this->sessionData['searchFolderEntryId'];

		// check if searchcriteria has changed
		$restrictionCheck = md5(serialize($this->restriction) . $searchFolderEntryId . $subfolder_flag);

		// check if there is need to set searchcriteria again
		if (!isset($this->sessionData['searchCriteriaCheck']) || $restrictionCheck != $this->sessionData['searchCriteriaCheck']) {
			if (!empty($this->sessionData['searchOriginalEntryids']) &&
				isset($action['entryid']) &&
				in_array($action['entryid'], $this->sessionData['searchOriginalEntryids'])
			) {
				// get entryids of original folders, and use it to set new search criteria
				$entryids = [];
				$entryIdsCount = count($this->sessionData['searchOriginalEntryids']);
				for ($index = 0; $index < $entryIdsCount; ++$index) {
					$entryids[] = hex2bin((string) $this->sessionData['searchOriginalEntryids'][$index]);
				}
			}
			else {
				// store entryids of original folders, so that can be used for re-setting the search criteria if needed
				$this->sessionData['searchOriginalEntryids'] = [];
				for ($index = 0, $len = count($entryids); $index < $len; ++$index) {
					$this->sessionData['searchOriginalEntryids'][] = bin2hex($entryids[$index]);
				}
			}
			// we never start the search folder because we will populate the search folder by ourselves
			mapi_folder_setsearchcriteria($searchFolder, $this->restriction, $entryids, $subfolder_flag | STOP_SEARCH);
			$this->sessionData['searchCriteriaCheck'] = $restrictionCheck;
		}

		if (isset($this->sessionData['searchCriteriaCheck']) || $restrictionCheck == $this->sessionData['searchCriteriaCheck']) {
			$folderEntryid = bin2hex($entryid);
			if ($this->sessionData['searchOriginalEntryids'][0] !== $folderEntryid) {
				$this->sessionData['searchOriginalEntryids'][0] = $folderEntryid;
				// we never start the search folder because we will populate the search folder by ourselves
				mapi_folder_setsearchcriteria($searchFolder, $this->restriction, [$entryid], $subfolder_flag | STOP_SEARCH);
			}
		}

		// Sort
		$this->parseSortOrder($action);
		// Initialize search patterns with default values
		$search_patterns = array_fill_keys(
			['sender', 'sending', 'recipients',
				'subject', 'content', 'attachments', 'others', 'message_classes',
				'date_start', 'date_end', 'unread', 'has_attachments', 'categories'],
			null
		);
		$this->parsePatterns($this->restriction, $search_patterns);
		if (isset($search_patterns['message_classes']) &&
			count($search_patterns['message_classes']) >= 7) {
			$search_patterns['message_classes'] = null;
		}

		if ($store_props[PR_MDB_PROVIDER] == ZARAFA_STORE_DELEGATE_GUID) {
			$eidObj = $GLOBALS["entryid"]->createMsgStoreEntryIdObj(hex2bin((string) $action['store_entryid']));
			$username = $eidObj['ServerShortname'];
			$session = $GLOBALS["mapisession"]->getSession();

			if ($username) {
				$indexDB = new IndexSqlite($username, $session, $store);
			}
		}
		else {
			$indexDB = new IndexSqlite();
		}

		$search_result = $indexDB->search(hex2bin((string) $searchFolderEntryId), $search_patterns, $entryid, $recursive);
		// Use the query search if search in index fails or is not available.
		if ($search_result == false) {
			// Search in the inbox instead of Top of Information Store
			if (isset($store_props[PR_IPM_SUBTREE_ENTRYID]) &&
				$GLOBALS['entryid']->compareEntryIds(bin2hex($entryid), bin2hex((string) $store_props[PR_IPM_SUBTREE_ENTRYID]))) {
				$inbox = mapi_msgstore_getreceivefolder($store);
				$inboxProps = mapi_getprops($inbox, [PR_ENTRYID]);
				$entryid = $inboxProps[PR_ENTRYID];
			}

			return parent::messageList($store, $entryid, $action, "search");
		}

		unset($action["restriction"]);

		// Get the table and merge the arrays
		$table = $GLOBALS["operations"]->getTable($store, hex2bin((string) $searchFolderEntryId), $this->properties, $this->sort, $this->start);
		// Create the data array, which will be send back to the client
		$data = [];
		$data = array_merge($data, $table);

		$this->getDelegateFolderInfo($store);
		$data = $this->filterPrivateItems($data);

		// remember which entryid's are send to the client
		$searchResults = [];
		foreach ($table["item"] as $item) {
			// store entryid => last_modification_time mapping
			$searchResults[$item["entryid"]] = $item["props"]["last_modification_time"];
		}

		// store search results into session data
		if (!isset($this->sessionData['searchResults'])) {
			$this->sessionData['searchResults'] = [];
		}
		$this->sessionData['searchResults'][$searchFolderEntryId] = $searchResults;

		$result = mapi_folder_getsearchcriteria($searchFolder);

		$data["search_meta"] = [];
		$data["search_meta"]["searchfolder_entryid"] = $searchFolderEntryId;
		$data["search_meta"]["search_store_entryid"] = $action["store_entryid"];
		$data["search_meta"]["searchstate"] = $result["searchstate"];
		$data["search_meta"]["results"] = count($searchResults);

		// Reopen the search folder, because otherwise the suggestion property will
		// not have been updated
		$searchFolder = $this->createSearchFolder($store, true);
		$storeProps = mapi_getprops($searchFolder, [PR_EC_SUGGESTION]);
		if (isset($storeProps[PR_EC_SUGGESTION])) {
			$data["search_meta"]["suggestion"] = $storeProps[PR_EC_SUGGESTION];
		}

		$this->addActionData("search", $data);
		$GLOBALS["bus"]->addData($this->getResponseData());

		return true;
	}
}
