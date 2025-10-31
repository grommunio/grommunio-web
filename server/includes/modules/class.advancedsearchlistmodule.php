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
					$folder = null;
					$inboxEntryId = null;
					try {
						$folder = mapi_msgstore_openentry($store, $entryid);
					}
					catch(Exception) {
						// Probably trying to open a store without having appropriate permissions.
						// Try to open the inbox instead.
						$folder = mapi_msgstore_getreceivefolder($store);
						$props = mapi_getprops($folder, [PR_ENTRYID]);
						$inboxEntryId = $props[PR_ENTRYID];
					}
					if (!is_null($folder)) {
						$htable = mapi_folder_gethierarchytable($folder, CONVENIENT_DEPTH | MAPI_DEFERRED_ERRORS);
						$rows = mapi_table_queryallrows($htable, [PR_ENTRYID]);
					}
					// The inbox itself is not the hierarchy list, add it to the begin.
					if (!is_null($inboxEntryId)) {
						array_unshift($rows, [PR_ENTRYID => $inboxEntryId]);
					}
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

	private function initFtsFilterState() {
		return [
			'message_classes' => [],
			'date_start' => null,
			'date_end' => null,
			'unread' => false,
			'has_attachments' => false,
		];
	}

	private function mergeFtsFilterState(array $base, array $delta) {
		$base['message_classes'] = array_merge($base['message_classes'], $delta['message_classes']);
		if ($delta['date_start'] !== null) {
			$base['date_start'] = $base['date_start'] === null ? $delta['date_start'] : max($base['date_start'], $delta['date_start']);
		}
		if ($delta['date_end'] !== null) {
			$base['date_end'] = $base['date_end'] === null ? $delta['date_end'] : min($base['date_end'], $delta['date_end']);
		}
		$base['unread'] = $base['unread'] || $delta['unread'];
		$base['has_attachments'] = $base['has_attachments'] || $delta['has_attachments'];

		return $base;
	}

	private function buildFtsDescriptor($restriction) {
		[$ast, $filters] = $this->convertRestrictionToAst($restriction);

		$filters['message_classes'] = array_values(array_unique($filters['message_classes']));

		return [
			'ast' => $ast,
			'message_classes' => $filters['message_classes'],
			'date_start' => $filters['date_start'],
			'date_end' => $filters['date_end'],
			'unread' => $filters['unread'],
			'has_attachments' => $filters['has_attachments'],
		];
	}

	private function convertRestrictionToAst($restriction, $context = null) {
		$filters = $this->initFtsFilterState();

		if (!is_array($restriction) || empty($restriction)) {
			return [null, $filters];
		}

		$type = $restriction[0];
		switch ($type) {
			case RES_AND:
			case RES_OR:
				$children = [];
				$subRestrictions = $restriction[1] ?? [];
				if (is_array($subRestrictions)) {
					foreach ($subRestrictions as $subRestriction) {
						[$childAst, $childFilters] = $this->convertRestrictionToAst($subRestriction, $context);
						$filters = $this->mergeFtsFilterState($filters, $childFilters);
						if ($childAst !== null) {
							$children[] = $childAst;
						}
					}
				}
				if (empty($children)) {
					return [null, $filters];
				}
				if (count($children) === 1) {
					return [$children[0], $filters];
				}
				return [[
					'op' => $type == RES_AND ? 'AND' : 'OR',
					'children' => $children,
				], $filters];

			case RES_NOT:
				$sub = $restriction[1][0] ?? null;
				[$childAst, $childFilters] = $this->convertRestrictionToAst($sub, $context);
				$filters = $this->mergeFtsFilterState($filters, $childFilters);
				if ($childAst === null) {
					return [null, $filters];
				}
				return [[
					'op' => 'NOT',
					'children' => [$childAst],
				], $filters];

			case RES_CONTENT:
				$subres = $restriction[1];
				$propTag = $subres[ULPROPTAG] ?? null;
				if ($propTag === null) {
					return [null, $filters];
				}

				if ($propTag == PR_MESSAGE_CLASS) {
					$value = $subres[VALUE][$propTag] ?? null;
					if ($value !== null) {
						$filters['message_classes'][] = $value;
					}
					return [null, $filters];
				}

				$fields = $this->mapPropTagToFtsFields($propTag, $context);
				$value = $subres[VALUE][$propTag] ?? null;
				if (empty($fields) || $value === null) {
					return [null, $filters];
				}

				$terms = [];
				if (is_array($value)) {
					foreach ($value as $entry) {
						if ($entry !== '' && $entry !== null) {
							$terms[] = [
								'type' => 'term',
								'fields' => $fields,
								'value' => (string) $entry,
							];
						}
					}
				} else {
					$terms[] = [
						'type' => 'term',
						'fields' => $fields,
						'value' => (string) $value,
					];
				}

				if (empty($terms)) {
					return [null, $filters];
				}
				if (count($terms) === 1) {
					return [$terms[0], $filters];
				}
				return [[
					'op' => 'OR',
					'children' => $terms,
				], $filters];

			case RES_PROPERTY:
				$subres = $restriction[1];
				$propTag = $subres[ULPROPTAG] ?? null;
				if ($propTag === null) {
					return [null, $filters];
				}

				if ($propTag == PR_MESSAGE_DELIVERY_TIME || $propTag == PR_LAST_MODIFICATION_TIME) {
					$value = $subres[VALUE][$propTag] ?? null;
					if ($value !== null) {
						if ($subres[RELOP] == RELOP_LT || $subres[RELOP] == RELOP_LE) {
							$filters['date_end'] = $value;
						} elseif ($subres[RELOP] == RELOP_GT || $subres[RELOP] == RELOP_GE) {
							$filters['date_start'] = $value;
						}
					}
					return [null, $filters];
				}

				if (isset($this->properties['hide_attachments']) && $propTag == $this->properties['hide_attachments']) {
					$filters['has_attachments'] = true;
				}

				return [null, $filters];

			case RES_BITMASK:
				$subres = $restriction[1];
				if (($subres[ULPROPTAG] ?? null) == PR_MESSAGE_FLAGS && ($subres[ULTYPE] ?? null) == BMR_EQZ) {
					$filters['unread'] = true;
				}
				return [null, $filters];

			case RES_SUBRESTRICTION:
				$subres = $restriction[1];
				$propTag = $subres[ULPROPTAG] ?? null;
				if ($propTag == PR_MESSAGE_ATTACHMENTS) {
					$filters['has_attachments'] = true;
					$inner = $subres[RESTRICTION] ?? null;
					[$childAst, $childFilters] = $this->convertRestrictionToAst($inner, 'attachments');
					$filters = $this->mergeFtsFilterState($filters, $childFilters);
					return [$childAst, $filters];
				}
				if ($propTag == PR_MESSAGE_RECIPIENTS) {
					$inner = $subres[RESTRICTION] ?? null;
					[$childAst, $childFilters] = $this->convertRestrictionToAst($inner, 'recipients');
					$filters = $this->mergeFtsFilterState($filters, $childFilters);
					return [$childAst, $filters];
				}
				$inner = $subres[RESTRICTION] ?? null;
				[$childAst, $childFilters] = $this->convertRestrictionToAst($inner, $context);
				$filters = $this->mergeFtsFilterState($filters, $childFilters);
				return [$childAst, $filters];

			case RES_COMMENT:
				$inner = $restriction[1][RESTRICTION] ?? null;
				[$childAst, $childFilters] = $this->convertRestrictionToAst($inner, $context);
				$filters = $this->mergeFtsFilterState($filters, $childFilters);
				return [$childAst, $filters];

			default:
				return [null, $filters];
		}
	}

	private function mapPropTagToFtsFields($propTag, $context = null) {
		if ($context === 'attachments') {
			return ['attachments'];
		}
		if ($context === 'recipients') {
			return ['recipients'];
		}

		static $map = null;
		if ($map === null) {
			$map = [
				PR_SUBJECT => ['subject'],
				PR_BODY => ['content', 'attachments'],
				PR_SENDER_NAME => ['sender'],
				PR_SENDER_EMAIL_ADDRESS => ['sender'],
				PR_SENT_REPRESENTING_NAME => ['sending'],
				PR_SENT_REPRESENTING_EMAIL_ADDRESS => ['sending'],
				PR_DISPLAY_TO => ['recipients'],
				PR_DISPLAY_CC => ['recipients'],
				PR_DISPLAY_BCC => ['recipients'],
				PR_EMAIL_ADDRESS => ['recipients'],
				PR_SMTP_ADDRESS => ['recipients'],
				PR_DISPLAY_NAME => ['others'],
				PR_ATTACH_LONG_FILENAME => ['attachments'],
			];
			if (defined('PR_NORMALIZED_SUBJECT')) {
				$map[PR_NORMALIZED_SUBJECT] = ['subject'];
			}
			if (isset($this->properties['categories'])) {
				$map[$this->properties['categories']] = ['others'];
			}
		}

		return $map[$propTag] ?? [];
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
		$this->logFtsDebug('Search requested', [
			'store_entryid' => $action['store_entryid'] ?? null,
			'entryid' => $this->formatEntryIdForLog($entryid),
			'subfolders' => $action['subfolders'] ?? null,
			'use_searchfolder' => (bool) $useSearchFolder,
			'restriction_present' => array_key_exists('restriction', $action),
		]);
		if (!$useSearchFolder) {
			$this->logFtsDebug('Search fallback: store does not support search folders', []);
			/*
			 * store doesn't support search folders so we can't use this
			 * method instead we will pass restriction to messageList and
			 * it will give us the restricted results
			 */
			return parent::messageList($store, $entryid, $action, "list");
		}
		$store_props = mapi_getprops($store, [PR_MDB_PROVIDER, PR_DEFAULT_STORE, PR_IPM_SUBTREE_ENTRYID]);
		$this->logFtsDebug('Resolved store properties for search', [
			'provider' => isset($store_props[PR_MDB_PROVIDER]) ? bin2hex((string) $store_props[PR_MDB_PROVIDER]) : null,
			'default_store' => $store_props[PR_DEFAULT_STORE] ?? null,
		]);
		if ($store_props[PR_MDB_PROVIDER] == ZARAFA_STORE_PUBLIC_GUID) {
			$this->logFtsDebug('Search fallback: public store does not support search folders', []);
			// public store does not support search folders
			return parent::messageList($store, $entryid, $action, "search");
		}
		if ($GLOBALS['entryid']->compareEntryIds(bin2hex($entryid), bin2hex(TodoList::getEntryId()))) {
			$this->logFtsDebug('Search fallback: todo list uses legacy restriction path', []);
			// todo list do not need to perform full text index search
			return parent::messageList($store, $entryid, $action, "list");
		}

		$this->searchFolderList = true; // Set to indicate this is not the normal folder, but a search folder
		$this->restriction = false;

		// Parse Restriction
		$this->parseRestriction($action);
		if ($this->restriction == false) {
			$this->logFtsDebug('Restriction parsing failed', [
				'action_type' => $actionType,
			]);
			// if error in creating restriction then send error to client
			$errorInfo = [];
			$errorInfo["error_message"] = _("Error in search, please try again") . ".";
			$errorInfo["original_error_message"] = "Error in parsing restrictions.";

			return $this->sendSearchErrorToClient($store, $entryid, $action, $errorInfo);
		}
		$ftsDescriptor = $this->buildFtsDescriptor($this->restriction);
		if (empty($ftsDescriptor['ast'])) {
			$this->logFtsDebug('Failed to translate restriction to FTS descriptor', [
				'restriction_sample' => array_keys($this->restriction),
			]);
			$errorInfo = [];
			$errorInfo["error_message"] = _("Error in search, please try again") . ".";
			$errorInfo["original_error_message"] = "Unable to translate search query to full-text expression.";

			return $this->sendSearchErrorToClient($store, $entryid, $action, $errorInfo);
		}
		$serializedRestriction = serialize($this->restriction);
		$restrictionSignature = md5($serializedRestriction);
		$this->logFtsDebug('Restriction parsed for full-text search', [
			'restriction_signature' => $restrictionSignature,
			'fts_descriptor' => $ftsDescriptor,
		]);

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
		$restrictionCheck = md5($serializedRestriction . $searchFolderEntryId . $subfolder_flag);

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
			$this->logFtsDebug('Search criteria updated', [
				'search_folder_entryid' => $searchFolderEntryId,
				'restriction_signature' => $restrictionSignature,
				'recursive' => $recursive,
				'scope_entryids' => $this->formatEntryIdForLog($entryids),
			]);
			$this->sessionData['searchCriteriaCheck'] = $restrictionCheck;
		}

		if (isset($this->sessionData['searchCriteriaCheck']) || $restrictionCheck == $this->sessionData['searchCriteriaCheck']) {
			$folderEntryid = bin2hex($entryid);
			if ($this->sessionData['searchOriginalEntryids'][0] !== $folderEntryid) {
				$this->sessionData['searchOriginalEntryids'][0] = $folderEntryid;
				// we never start the search folder because we will populate the search folder by ourselves
				mapi_folder_setsearchcriteria($searchFolder, $this->restriction, [$entryid], $subfolder_flag | STOP_SEARCH);
				$this->logFtsDebug('Search criteria refreshed for active folder', [
					'search_folder_entryid' => $searchFolderEntryId,
					'restriction_signature' => $restrictionSignature,
					'target_entryid' => $this->formatEntryIdForLog($entryid),
					'recursive' => $recursive,
				]);
			}
		}

		// Sort
		$this->parseSortOrder($action);
		// Initialize search patterns with default values
		if (is_array($ftsDescriptor['message_classes']) &&
			count($ftsDescriptor['message_classes']) >= 7) {
			$ftsDescriptor['message_classes'] = null;
		}

		$username = null;
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
		$this->logFtsDebug('Dispatching search to index backend', [
			'search_folder_entryid' => $searchFolderEntryId,
			'restriction_signature' => $restrictionSignature,
			'recursive' => $recursive,
			'delegate_username' => $username,
			'message_classes' => $ftsDescriptor['message_classes'] ?? null,
			'filters' => [
				'date_start' => $ftsDescriptor['date_start'] ?? null,
				'date_end' => $ftsDescriptor['date_end'] ?? null,
				'unread' => !empty($ftsDescriptor['unread']),
				'has_attachments' => !empty($ftsDescriptor['has_attachments']),
			],
			'ast' => $ftsDescriptor['ast'] ?? null,
		]);

		$search_result = $indexDB->search(hex2bin((string) $searchFolderEntryId), $ftsDescriptor, $entryid, $recursive);
		if ($search_result == false) {
			$this->logFtsDebug('Index search returned no data', [
				'search_folder_entryid' => $searchFolderEntryId,
				'restriction_signature' => $restrictionSignature,
				'recursive' => $recursive,
			]);
			$errorInfo = [];
			$errorInfo["error_message"] = _("Unable to perform search query, store might not support searching.");
			$errorInfo["original_error_message"] = "Full-text search backend returned no result set.";

			return $this->sendSearchErrorToClient($store, $entryid, $action, $errorInfo);
		}

		unset($action["restriction"]);

		// Get the table and merge the arrays
		$table = $GLOBALS["operations"]->getTable($store, hex2bin((string) $searchFolderEntryId), $this->properties, $this->sort, $this->start);
		$this->logFtsDebug('Search folder table retrieved', [
			'search_folder_entryid' => $searchFolderEntryId,
			'table_item_count' => isset($table['item']) ? count($table['item']) : null,
			'start' => $this->start,
			'sort' => $this->sort,
		]);
		// Create the data array, which will be send back to the client
		$data = [];
		$data = array_merge($data, $table);

		$this->getDelegateFolderInfo($store);
		$data = $this->filterPrivateItems($data);
		$this->logFtsDebug('Search results filtered for privacy', [
			'search_folder_entryid' => $searchFolderEntryId,
			'item_count_after_filter' => isset($data['item']) ? count($data['item']) : null,
		]);

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
		$this->logFtsDebug('Search results stored in session', [
			'search_folder_entryid' => $searchFolderEntryId,
			'result_count' => count($searchResults),
		]);

		$result = mapi_folder_getsearchcriteria($searchFolder);
		$this->logFtsDebug('Search folder state retrieved', [
			'search_folder_entryid' => $searchFolderEntryId,
			'searchstate' => $result['searchstate'] ?? null,
		]);

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
			$this->logFtsDebug('Search suggestion ready', [
				'search_folder_entryid' => $searchFolderEntryId,
				'suggestion' => $storeProps[PR_EC_SUGGESTION],
			]);
		}

		$this->addActionData("search", $data);
		$GLOBALS["bus"]->addData($this->getResponseData());

		$this->logFtsDebug('Search response dispatched to client', [
			'search_folder_entryid' => $searchFolderEntryId,
			'items_returned' => isset($data['item']) ? count($data['item']) : null,
			'search_meta' => $data['search_meta'] ?? null,
		]);
		return true;
	}

	private function logFtsDebug(string $message, array $context = []): void {
		if (!DEBUG_FULLTEXT_SEARCH) {
			return;
		}
		$prefix = '[fts-debug][module] ';
		if (!empty($context)) {
			$encoded = json_encode($context, JSON_UNESCAPED_SLASHES | JSON_UNESCAPED_UNICODE);
			if ($encoded === false) {
				$encoded = 'context_encoding_failed';
			}
			error_log($prefix . $message . ' ' . $encoded);
		}
		else {
			error_log($prefix . $message);
		}
	}

	private function formatEntryIdForLog($entryid) {
		if ($entryid === null) {
			return null;
		}
		if (is_array($entryid)) {
			return array_map([$this, 'formatEntryIdForLog'], $entryid);
		}
		if (!is_string($entryid)) {
			return $entryid;
		}
		if ($entryid === '') {
			return '';
		}
		if (preg_match('/[^\x20-\x7E]/', $entryid)) {
			return bin2hex($entryid);
		}

		return $entryid;
	}
}
