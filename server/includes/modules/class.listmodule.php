<?php

	/**
	 * ListModule
	 * Superclass of every module, which retrieves a MAPI message list. It
	 * extends the Module class.
	 */
	class ListModule extends Module {
		/**
		 * @var array list of columns which are selected in the previous request
		 */
		public $properties;

		/**
		 * @var array sort
		 */
		public $sort;

		/**
		 * @var int startrow in the table
		 */
		public $start;

		/**
		 * @var array contains (when needed) a restriction used when searching and filtering the records
		 */
		public $restriction;

		/**
		 * @var bool contains check whether a search result is listed or just the contents of a normal folder
		 */
		public $searchFolderList;

		/**
		 * @var array stores entryids and last modification time of
		 *            messages that are already sent to the server
		 */
		public $searchResults;

		/**
		 * @var MAPIMessage resource of the freebusy message which holds
		 *                  information regarding delegation details, this variable will
		 *                  only be populated when user is a delegate
		 */
		public $localFreeBusyMessage;

		/**
		 * @var BinString binary string of PR_MDB_PROVIDER property
		 *                of a store, this variable will only be populated when user is a delegate
		 */
		public $storeProviderGuid;

		/**
		 * Constructor.
		 *
		 * @param int   $id     unique id
		 * @param array $data   list of all actions
		 * @param mixed $events
		 */
		public function __construct($id, $data, $events = false) {
			$this->start = 0;

			$this->restriction = false;
			$this->searchFolderList = false;
			$this->localFreeBusyMessage = false;
			$this->storeProviderGuid = false;

			$this->sort = [
				PR_IMPORTANCE => TABLE_SORT_DESCEND,
				PR_MESSAGE_DELIVERY_TIME => TABLE_SORT_DESCEND,
			];

			parent::__construct($id, $data);
		}

		/**
		 * Executes all the actions in the $data variable.
		 *
		 * @return bool true on success or false on failure
		 */
		public function execute() {
			foreach ($this->data as $actionType => $action) {
				if (isset($actionType)) {
					try {
						$store = $this->getActionStore($action);
						$parententryid = $this->getActionParentEntryID($action);
						$entryid = $this->getActionEntryID($action);

						switch ($actionType) {
							case "list":
								$this->getDelegateFolderInfo($store);
								$this->messageList($store, $entryid, $action, $actionType);
								break;

							default:
								$this->handleUnknownActionType($actionType);
						}
					}
					catch (MAPIException $e) {
						$this->processException($e, $actionType, $store, $parententryid, $entryid, $action);
					}
					catch (SearchException $e) {
						$this->processException($e, $actionType, $store, $parententryid, $entryid, $action);
					}
				}
			}
		}

		/**
		 * Function does customization of MAPIException based on module data.
		 * like, here it will generate display message based on actionType
		 * for particular exception.
		 *
		 * @param object     $e             Exception object
		 * @param string     $actionType    the action type, sent by the client
		 * @param MAPIobject $store         store object of the current user
		 * @param string     $parententryid parent entryid of the message
		 * @param string     $entryid       entryid of the message/folder
		 * @param array      $action        the action data, sent by the client
		 */
		public function handleException(&$e, $actionType = null, $store = null, $parententryid = null, $entryid = null, $action = null) {
			if (is_null($e->displayMessage)) {
				$hexEntryid = $entryid != null ? bin2hex($entryid) : 'null';
				switch ($actionType) {
					case "list":
						if ($e->getCode() == MAPI_E_NO_ACCESS) {
							$e->setDisplayMessage(_("You have insufficient privileges to see the contents of this folder.") . " ($hexEntryid)");
						}
						else {
							$e->setDisplayMessage(_("Could not load the contents of this folder.") . " ($hexEntryid)");
						}
						break;
				}
			}

			parent::handleException($e, $actionType, $store, $parententryid, $entryid, $action);
		}

		/**
		 * Function which retrieves a list of messages in a folder.
		 *
		 * @param object $store      MAPI Message Store Object
		 * @param string $entryid    entryid of the folder
		 * @param array  $action     the action data, sent by the client
		 * @param string $actionType the action type, sent by the client
		 *
		 * @return bool true on success or false on failure
		 */
		public function messageList($store, $entryid, $action, $actionType) {
			$this->searchFolderList = false; // Set to indicate this is not the search result, but a normal folder content

			if ($store && $entryid) {
				// Restriction
				$this->parseRestriction($action);

				// Sort
				$this->parseSortOrder($action, null, true);

				$limit = false;
				if (isset($action['restriction']['limit'])) {
					$limit = $action['restriction']['limit'];
				}
				else {
					$limit = $GLOBALS['settings']->get('zarafa/v1/main/page_size', 50);
				}

				$isSearchFolder = isset($action['search_folder_entryid']);
				$entryid = $isSearchFolder ? hex2bin($action['search_folder_entryid']) : $entryid;

				// Get the table and merge the arrays
				$data = $GLOBALS["operations"]->getTable($store, $entryid, $this->properties, $this->sort, $this->start, $limit, $this->restriction);

				// If the request come from search folder then no need to send folder information
				if (!$isSearchFolder) {
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

				if (isset($action['use_searchfolder']) && $action['use_searchfolder'] === true) {
					$data["search_meta"] = [];
					$data["search_meta"]["search_store_entryid"] = $action["store_entryid"];
					$data["search_meta"]["results"] = count($data["item"]);
				}

				$this->addActionData($actionType, $data);
				$GLOBALS["bus"]->addData($this->getResponseData());
			}
		}

		/**
		 *	Function will set search restrictions on search folder and start search process
		 *	and it will also parse visible columns and sorting data when sending results to client.
		 *
		 *	@param		object		$store		MAPI Message Store Object
		 *	@param		hexString	$entryid	entryid of the folder
		 *	@param		object		$action		the action data, sent by the client
		 *  @param		string		$actionType	the action type, sent by the client
		 */
		public function search($store, $entryid, $action, $actionType) {
			$useSearchFolder = isset($action["use_searchfolder"]) ? $action["use_searchfolder"] : false;
			if (!$useSearchFolder) {
				/*
				 * store doesn't support search folders so we can't use this
				 * method instead we will pass restriction to messageList and
				 * it will give us the restricted results
				 */
				return $this->messageList($store, $entryid, $action, "list");
			}

			$this->searchFolderList = true; // Set to indicate this is not the normal folder, but a search folder
			$this->restriction = false;
			$searchInTodoList = $GLOBALS['entryid']->compareEntryIds(bin2hex($entryid), bin2hex(TodoList::getEntryId()));

			// Parse Restriction
			$this->parseRestriction($action);
			if ($this->restriction == false) {
				// if error in creating restriction then send error to client
				$errorInfo = [];
				$errorInfo["error_message"] = _("Error in search, please try again") . ".";
				$errorInfo["original_error_message"] = "Error in parsing restrictions.";

				return $this->sendSearchErrorToClient($store, $entryid, $action, $errorInfo);
			}

			if ($searchInTodoList) {
				// Since we cannot search in a search folder, we will combine the search restriction
				// with the search restriction of the to-do list to mimic searching in the To-do list
				$this->restriction = [
					RES_AND,
					[
						$this->restriction,
						TodoList::_createRestriction(),
					],
				];

				// When searching in the To-do list we will actually always search in the IPM subtree, so
				// set the entryid to that.
				$userStore = WebAppAuthentication::getMAPISession()->getDefaultMessageStore();
				$props = mapi_getprops($userStore, [PR_IPM_SUBTREE_ENTRYID]);
				$entryid = $props[PR_IPM_SUBTREE_ENTRYID];
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
				// if error in creating search folder then send error to client
				$errorInfo = [];

				switch (mapi_last_hresult()) {
					case MAPI_E_NO_ACCESS:
						$errorInfo["error_message"] = _("Unable to perform search query, no permissions to create search folder.");
						break;

					case MAPI_E_NOT_FOUND:
						$errorInfo["error_message"] = _("Unable to perform search query, search folder not found.");
						break;

					default:
						$errorInfo["error_message"] = _("Unable to perform search query, store might not support searching.");
				}

				$errorInfo["original_error_message"] = _("Error in creating search folder.");

				return $this->sendSearchErrorToClient($store, $entryid, $action, $errorInfo);
			}

			$subfolder_flag = 0;
			if ($searchInTodoList || (isset($action["subfolders"]) && $action["subfolders"] == "true")) {
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
				if (!empty($this->sessionData['searchOriginalEntryids'])) {
					// get entryids of original folders, and use it to set new search criteria
					$entryids = [];
					for ($index = 0; $index < count($this->sessionData['searchOriginalEntryids']); ++$index) {
						$entryids[] = hex2bin($this->sessionData['searchOriginalEntryids'][$index]);
					}
				}
				else {
					// store entryids of original folders, so that can be used for re-setting the search criteria if needed
					$this->sessionData['searchOriginalEntryids'] = [];
					for ($index = 0, $len = count($entryids); $index < $len; ++$index) {
						$this->sessionData['searchOriginalEntryids'][] = bin2hex($entryids[$index]);
					}
				}

				mapi_folder_setsearchcriteria($searchFolder, $this->restriction, $entryids, $subfolder_flag);
				$this->sessionData['searchCriteriaCheck'] = $restrictionCheck;
			}

			if (isset($this->sessionData['searchCriteriaCheck']) || $restrictionCheck == $this->sessionData['searchCriteriaCheck']) {
				$folderEntryid = bin2hex($entryid);
				if ($this->sessionData['searchOriginalEntryids'][0] !== $folderEntryid) {
					$this->sessionData['searchOriginalEntryids'][0] = $folderEntryid;
					mapi_folder_setsearchcriteria($searchFolder, $this->restriction, [$entryid], $subfolder_flag);
				}
			}

			unset($action["restriction"]);

			// Sort
			$this->parseSortOrder($action);

			// Create the data array, which will be send back to the client
			$data = [];

			// Wait until we have some data, no point in returning before we have data. Stop waiting after 10 seconds
			$start = time();
			$table = mapi_folder_getcontentstable($searchFolder, MAPI_DEFERRED_ERRORS);

			sleep(1);

			while (time() - $start < 10) {
				$count = mapi_table_getrowcount($table);
				$result = mapi_folder_getsearchcriteria($searchFolder);

				// Stop looping if we have data or the search is finished
				if ($count > 0) {
					break;
				}

				if (($result["searchstate"] & SEARCH_REBUILD) == 0) {
					break;
				} // Search is done

				sleep(1);
			}

			// Get the table and merge the arrays
			$table = $GLOBALS["operations"]->getTable($store, hex2bin($searchFolderEntryId), $this->properties, $this->sort, $this->start);
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

		/**
		 *	Function will check for the status of the search on server
		 *	and it will also send intermediate results of search, so we don't have to wait
		 *	until search is finished on server to send results.
		 *
		 *	@param		object		$store		MAPI Message Store Object
		 *	@param		hexString	$entryid	entryid of the folder
		 *	@param		object		$action		the action data, sent by the client
		 */
		public function updatesearch($store, $entryid, $action) {
			if (!isset($entryid) || !$entryid) {
				// if no entryid is present then we can't do anything here
				return;
			}

			$listData = [];
			if (isset($action['search_folder_entryid'])) {
				$entryid = hex2bin($action['search_folder_entryid']);
			}
			$searchFolder = mapi_msgstore_openentry($store, $entryid);
			$searchResult = mapi_folder_getsearchcriteria($searchFolder);
			$searchState = $searchResult["searchstate"];
			$table = mapi_folder_getcontentstable($searchFolder, MAPI_DEFERRED_ERRORS);

			if (is_array($this->sort) && !empty($this->sort)) {
				// this sorting will be done on currently fetched results, not all results
				// @TODO find a way to do sorting on all search results
				mapi_table_sort($table, $this->sort, TBL_BATCH);
			}

			$rowCount = $GLOBALS['settings']->get('zarafa/v1/main/page_size', 50);

			$searchResults = [];
			$entryid = bin2hex($entryid);
			if (isset($this->sessionData['searchResults'][$entryid])) {
				$searchResults = $this->sessionData['searchResults'][$entryid];
			}

			// searchResults contains entryids of messages
			// that are already sent to the server
			$numberOfResults = count($searchResults);

			if ($numberOfResults < $rowCount) {
				$items = mapi_table_queryallrows($table, [PR_ENTRYID, PR_LAST_MODIFICATION_TIME]);

				foreach ($items as $props) {
					$sendItemToClient = false;

					if (!array_key_exists(bin2hex($props[PR_ENTRYID]), $searchResults)) {
						$sendItemToClient = true;
					}
					else {
						/*
						 * it could happen that an item in search folder has been changed
						 * after we have sent it to client, so we have to again send it
						 * so we will have to use last_modification_time of item to check
						 * that item has been modified since we have sent it to client
						 */
						// TODO if any item is deleted from search folder it will be not notified to client
						if ($searchResults[bin2hex($props[PR_ENTRYID])] < $props[PR_LAST_MODIFICATION_TIME]) {
							$sendItemToClient = true;
						}
					}

					if ($sendItemToClient) {
						// only get primitive properties, no need to get body, attachments or recipient information
						$message = $GLOBALS["operations"]->openMessage($store, $props[PR_ENTRYID]);
						array_push($listData, $GLOBALS["operations"]->getProps($message, $this->properties));

						// store entryid => last_modification_time mapping
						$searchResults[bin2hex($props[PR_ENTRYID])] = $props[PR_LAST_MODIFICATION_TIME];
					}

					// when we have more results then fit in the client, we break here,
					// we only need to update the counters from this point
					$numberOfResults = count($searchResults);
					if ($numberOfResults >= $rowCount) {
						break;
					}
				}
			}

			$totalRowCount = mapi_table_getrowcount($table);

			$data = [];
			$data["search_meta"] = [];
			$data["search_meta"]["searchfolder_entryid"] = $entryid;
			$data["search_meta"]["search_store_entryid"] = $action["store_entryid"];
			$data["search_meta"]["searchstate"] = $searchState;
			$data["search_meta"]["results"] = $numberOfResults;		// actual number of items that we are sending to client

			$data["page"] = [];
			$data["page"]["start"] = 0;
			$data["page"]["rowcount"] = $rowCount;
			$data["page"]["totalrowcount"] = $totalRowCount;	// total number of items

			if (!empty($listData)) {
				$data["item"] = array_merge([], $listData);
			}

			// search is finished so we no more need entryids of search results so clear it up
			if ($searchState & SEARCH_REBUILD === 0) {
				// remove search result entryids stored in session
				unset($this->sessionData['searchResults'][$entryid]);
			}
			else {
				// store data for next request
				$this->sessionData['searchResults'][$entryid] = $searchResults;
			}

			$this->addActionData("updatesearch", $data);
			$GLOBALS["bus"]->addData($this->getResponseData());

			return true;
		}

		/**
		 *	Function will stop search on the server if search folder exists.
		 *
		 *	@param		object		$store		MAPI Message Store Object
		 *	@param		hexString	$entryid	entryid of the folder
		 *	@param		object		$action		the action data, sent by the client
		 */
		public function stopSearch($store, $entryid, $action) {
			// if no entryid is present in the request then get the search folder entryid from session data
			$entryid = !empty($entryid) ? $entryid : hex2bin($action['search_folder_entryid']);

			if (empty($entryid)) {
				// still no entryid? sorry i can't help you anymore
				$this->addActionData("stopsearch", ['success' => false]);
				$GLOBALS["bus"]->addData($this->getResponseData());

				return;
			}

			// remove search result entryids stored in session
			unset($this->sessionData['searchResults'][bin2hex($entryid)], $this->sessionData['searchCriteriaCheck'], $this->sessionData['searchFolderEntryId'], $this->sessionData['searchOriginalEntryids']);

			$searchFolder = mapi_msgstore_openentry($store, $entryid);
			$searchResult = mapi_folder_getsearchcriteria($searchFolder);

			// check if search folder exists and search is in progress
			if ($searchResult !== false && ($searchResult["searchstate"] & SEARCH_REBUILD !== 0)) {
				mapi_folder_setsearchcriteria($searchFolder, $searchResult['restriction'], $searchResult['folderlist'], STOP_SEARCH);
			}

			/*
			 * when stopping search process, we have to remove search folder also,
			 * so next search request with same restriction will not get uncompleted results
			 */
			$this->deleteSearchFolder($store, $entryid, $action);

			// send success message to client
			$this->addActionData("stopsearch", ['success' => true]);
			$GLOBALS["bus"]->addData($this->getResponseData());
		}

		/**
		 * Function will delete search folder.
		 *
		 * @param object    $store   MAPI Message Store Object
		 * @param hexString $entryid entryid of the folder
		 * @param array     $action  the action data, sent by the client
		 *
		 * @return bool true on success or false on failure
		 */
		public function deleteSearchFolder($store, $entryid, $action) {
			if ($entryid && $store) {
				$storeProps = mapi_getprops($store, [PR_FINDER_ENTRYID]);

				$finderFolder = mapi_msgstore_openentry($store, $storeProps[PR_FINDER_ENTRYID]);

				if (mapi_last_hresult() != NOERROR) {
					return;
				}

				$hierarchyTable = mapi_folder_gethierarchytable($finderFolder, MAPI_DEFERRED_ERRORS);

				$restriction = [RES_CONTENT,
					[
						FUZZYLEVEL => FL_FULLSTRING,
						ULPROPTAG => PR_ENTRYID,
						VALUE => [PR_ENTRYID => $entryid],
					],
				];

				mapi_table_restrict($hierarchyTable, $restriction, TBL_BATCH);

				// entryids are unique so there would be only one matching row,
				// so only fetch first row
				$folders = mapi_table_queryrows($hierarchyTable, [PR_ENTRYID], 0, 1);

				// delete search folder
				if (is_array($folders) && is_array($folders[0])) {
					mapi_folder_deletefolder($finderFolder, $folders[0][PR_ENTRYID]);
				}

				return true;
			}

			return false;
		}

		/**
		 *	Function will create a search folder in FINDER_ROOT folder
		 *	if folder exists then it will open it.
		 *
		 *	@param		object				$store			MAPI Message Store Object
		 *	@param		bool				$openIfExists		open if folder exists
		 *
		 *	@return		bool|resource		$folder			created search folder
		 */
		public function createSearchFolder($store, $openIfExists = true) {
			if (isset($this->sessionData['searchFolderEntryId']) && $openIfExists) {
				try {
					$searchFolder = mapi_msgstore_openentry($store, hex2bin($this->sessionData['searchFolderEntryId']));

					if ($searchFolder !== false) {
						// search folder exists, don't create new search folder
						return $searchFolder;
					}
				}
				catch (MAPIException $e) {
					// ignore error and continue creation of search folder
					unset($this->sessionData['searchFolderEntryId']);
				}
			}

			// create new search folder
			$searchFolderRoot = $this->getSearchFoldersRoot($store);
			if ($searchFolderRoot === false) {
				// error in finding search root folder
				// or store doesn't support search folders
				return false;
			}

			// check for folder name, if exists then delete it
			$folderName = "grommunio Web Search Folder";

			try {
				$table = mapi_folder_gethierarchytable($searchFolderRoot, 0);
				$rows = mapi_table_queryrows($table, [PR_DISPLAY_NAME, PR_ENTRYID], 0, 0xFFFF);
				foreach ($rows as $row) {
					if (strcasecmp($folderName, $row[PR_DISPLAY_NAME]) == 0) {
						mapi_folder_deletefolder($searchFolderRoot, $row[PR_ENTRYID], DEL_FOLDERS | DEL_MESSAGES | DELETE_HARD_DELETE);
						break;
					}
				}
				$searchFolder = mapi_folder_createfolder($searchFolderRoot, $folderName, null, OPEN_IF_EXISTS, FOLDER_SEARCH);

				$props = mapi_getprops($searchFolder, [PR_ENTRYID]);
				$this->sessionData['searchFolderEntryId'] = bin2hex($props[PR_ENTRYID]);

				// we have created new search folder so search criteria check should be removed
				unset($this->sessionData['searchCriteriaCheck']);

				return $searchFolder;
			}
			catch (MAPIException $e) {
				// don't propagate the event to higher level exception handlers
				$e->setHandled();
			}

			return false;
		}

		/**
		 *	Function will open FINDER_ROOT folder in root container
		 *	public folder's don't have FINDER_ROOT folder.
		 *
		 *	@param		object			store MAPI message store object
		 * @param mixed $store
		 *
		 *	@return		bool|resource	finder root folder for search folders
		 */
		public function getSearchFoldersRoot($store) {
			$searchRootFolder = false;

			// check if we can create search folders
			$storeProps = mapi_getprops($store, [PR_STORE_SUPPORT_MASK, PR_FINDER_ENTRYID, PR_DISPLAY_NAME]);
			if (($storeProps[PR_STORE_SUPPORT_MASK] & STORE_SEARCH_OK) !== STORE_SEARCH_OK) {
				// store doesn't support search folders, public store don't have FINDER_ROOT folder
				return false;
			}

			try {
				$searchRootFolder = mapi_msgstore_openentry($store, $storeProps[PR_FINDER_ENTRYID]);
			}
			catch (MAPIException $e) {
				$msg = "Unable to open FINDER_ROOT for store: %s.";
				error_log(sprintf($msg, $storeProps[PR_DISPLAY_NAME]));
				// don't propagate the event to higher level exception handlers
				$e->setHandled();
			}

			return $searchRootFolder;
		}

		/**
		 *	Function will send error message to client if any error has occurred in search.
		 *
		 *	@param		object		$store		MAPI Message Store Object
		 *	@param		hexString	$entryid	entryid of the folder
		 *	@param		object		$action		the action data, sent by the client
		 *	@param		object		$errorInfo	the error information object
		 */
		public function sendSearchErrorToClient($store, $entryid, $action, $errorInfo) {
			if ($errorInfo) {
				$exception = new SearchException(isset($errorInfo["original_error_message"]) ? $errorInfo["original_error_message"] : $errorInfo['error_message'], mapi_last_hresult());
				$exception->setDisplayMessage($errorInfo['error_message']);

				// after sending error, remove error data
				$errorInfo = [];

				throw $exception;
			}

			return false;
		}

		/**
		 *	Function will create restriction based on restriction array.
		 *
		 *	@param	object		$action		the action data, sent by the client
		 */
		public function parseRestriction($action) {
			if (isset($action["restriction"]) && is_array($action['restriction'])) {
				if (isset($action["restriction"]["start"])) {
					// Set start variable
					$this->start = $action["restriction"]["start"];
				}
				foreach ($action["restriction"] as $key => $value) {
					$props = $this->properties;
					if (!empty($value)) {
						switch ($key) {
							case "search":
								$props = array_merge($this->properties, ['body' => PR_BODY]);
								// no break
							case "task":
							case "note":
							case "filter":
								$this->restriction = Conversion::json2restriction($props, $value);
								break;
						}
					}
				}
			}
		}

		/**
		 * Parses the incoming sort request and builds a MAPI sort order. Normally
		 * properties are mapped from the XML to MAPI by the standard $this->properties mapping. However,
		 * if you want other mappings, you can specify them in the optional $map mapping.
		 *
		 * $allow_multi_instance is used for creating multiple instance of MV property related items.
		 * $properties is used for using a custom set of properties instead of properties stored in module
		 *
		 * @param mixed $action
		 * @param mixed $map
		 * @param mixed $allow_multi_instance
		 * @param mixed $properties
		 */
		public function parseSortOrder($action, $map = false, $allow_multi_instance = false, $properties = false) {
			if (isset($action["sort"])) {
				$this->sort = [];

				if (!$properties) {
					$properties = $this->properties;
				}

				// Unshift MVI_FLAG of MV properties. So the table is not sort on it anymore.
				// Otherwise the server would generate multiple rows for one item (categories).
				foreach ($properties as $id => $property) {
					switch (mapi_prop_type($property)) {
						case PT_MV_STRING8 | MVI_FLAG:
						case PT_MV_LONG | MVI_FLAG:
							$properties[$id] = $properties[$id] & ~MV_INSTANCE;
							break;
					}
				}

				// Loop through the sort columns
				foreach ($action["sort"] as $column) {
					if (isset($column["direction"])) {
						if (isset($properties[$column["field"]]) || ($map && isset($map[$column["field"]]))) {
							if ($map && isset($map[$column["field"]])) {
								$property = $map[$column["field"]];
							}
							else {
								$property = $properties[$column["field"]];
							}

							// Check if column is a MV property
							switch (mapi_prop_type($property)) {
								case PT_MV_STRING8:
								case PT_MV_LONG:
									// Set MVI_FLAG.
									// The server will generate multiple rows for one item (for example: categories)
									if ($allow_multi_instance) {
										$properties[$column["field"]] = $properties[$column["field"]] | MVI_FLAG;
									}
									$property = $properties[$column["field"]];
									break;
							}

							// Set sort direction
							switch (strtolower($column["direction"])) {
								default:
								case "asc":
									$this->sort[$property] = TABLE_SORT_ASCEND;
									break;

								case "desc":
									$this->sort[$property] = TABLE_SORT_DESCEND;
									break;
							}
						}
					}
				}
			}
		}

		/**
		 * Function which gets the delegation details from localfreebusy message to use in
		 * processPrivateItems function.
		 *
		 * @param {MAPIStore} $store MAPI Message Store Object
		 */
		public function getDelegateFolderInfo($store) {
			$this->localFreeBusyMessage = false;
			$this->storeProviderGuid = false;

			try {
				$this->storeProviderGuid = mapi_getprops($store, [PR_MDB_PROVIDER]);
				$this->storeProviderGuid = $this->storeProviderGuid[PR_MDB_PROVIDER];

				if ($this->storeProviderGuid !== ZARAFA_STORE_DELEGATE_GUID) {
					// user is not a delegate, so no point of processing further
					return;
				}

				// get localfreebusy message
				$this->localFreeBusyMessage = FreeBusy::getLocalFreeBusyMessage($store);
			}
			catch (MAPIException $e) {
				// we got some error, but we don't care about that error instead just continue
				$e->setHandled();

				$this->localFreeBusyMessage = false;
				$this->storeProviderGuid = false;
			}
		}

		/**
		 * Helper function which loop through each item and filter out
		 * private items, if any.
		 *
		 * @param {array} array structure with row search data
		 * @param mixed $data
		 *
		 * @return {array} array structure with row search data
		 */
		public function filterPrivateItems($data) {
			// Disable private items
			if (isset($data["item"]) && is_array($data["item"])) {
				for ($index = 0, $len = count($data["item"]); $index < $len; ++$index) {
					$data["item"][$index] = $this->processPrivateItem($data["item"][$index]);

					if (empty($data["item"][$index])) {
						// remove empty results from data
						unset($data["item"][$index]);
					}
				}
			}

			return $data;
		}

		/**
		 * Function will be used to process private items in a list response, modules can
		 * can decide what to do with the private items, remove the entire row or just
		 * hide the data. This function will entirely remove the private message but
		 * if any child class needs different behavior then this can be overridden.
		 *
		 * @param {Object} $item item properties
		 *
		 * @return {Object} item properties if its non private item otherwise empty array
		 */
		public function processPrivateItem($item) {
			if ($this->checkPrivateItem($item)) {
				// hide the item by returning empty array, that can be removed from response
				return [];
			}

			return $item;
		}

		/**
		 * Function will be used check if any item is private or not and if it private then
		 * we should process it as private, because you don't want to process private items in
		 * user's default store.
		 * This function will check we are dealing with delegate stores or not if it is then
		 * the delegator has permission to see private items of delegate.
		 *
		 * @param {Object} $item item properties
		 *
		 * @return {Boolean} true if items should be processed as private else false
		 */
		public function checkPrivateItem($item) {
			// flag to indicate that item should be considered as private
			$private = false;

			$isPrivate = (isset($item['props']['private']) && $item['props']['private'] === true);
			$isSensitive = (isset($item['props']['sensitivity']) && $item['props']['sensitivity'] === SENSITIVITY_PRIVATE);

			if ($isPrivate || $isSensitive) {
				// check for delegate permissions for delegate store
				if ($this->storeProviderGuid !== false && $this->storeProviderGuid === ZARAFA_STORE_DELEGATE_GUID) {
					// by default we should always hide the item if we are in delegate store
					$private = true;

					// find delegate properties
					if ($this->localFreeBusyMessage !== false) {
						try {
							$localFreeBusyMessageProps = mapi_getprops($this->localFreeBusyMessage, [PR_SCHDINFO_DELEGATE_ENTRYIDS, PR_DELEGATE_FLAGS]);

							if (isset($localFreeBusyMessageProps[PR_SCHDINFO_DELEGATE_ENTRYIDS], $localFreeBusyMessageProps[PR_DELEGATE_FLAGS])) {
								// if more then one delegates info is stored then find index of
								// current user
								$userEntryId = $GLOBALS['mapisession']->getUserEntryID();

								$userFound = false;
								$seePrivate = false;
								foreach ($localFreeBusyMessageProps[PR_SCHDINFO_DELEGATE_ENTRYIDS] as $key => $entryId) {
									if ($GLOBALS['entryid']->compareABEntryIds(bin2hex($userEntryId), bin2hex($entryId))) {
										$userFound = true;
										$seePrivate = $localFreeBusyMessageProps[PR_DELEGATE_FLAGS][$key];
										break;
									}
								}

								if ($userFound !== false && $seePrivate === 1) {
									// if delegate has permission then don't hide the item
									$private = false;
								}
							}
						}
						catch (MAPIException $e) {
							if ($e->getCode() === MAPI_E_NOT_FOUND) {
								// no information available for delegates, ignore error
								$e->setHandled();
							}
						}
					}
				}
			}

			return $private;
		}
	}
