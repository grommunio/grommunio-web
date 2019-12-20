<?php

	// Maximum number of items that will be fetched to create conversations
	define('CONVERSATION_MAXFETCH', 1500);
	// Number of conversations that will be fetched per batch
	// (Conversations will be fetched in batches)
	define('CONVERSATION_BATCH_COUNT', 25);
	// Maximum number of items in a conversation that will be returned in the list response
	// Others can be fetched later
	//define('CONVERSATION_MAXITEMS', 30);
	define('CONVERSATION_MAXITEMS', 300000);

	/**
	 * Mail Module
	 */
	class MailListModule extends ListModule
	{
		// Temporary var to store the inbox entryid of the processed store
		private $inboxEntryId;

		/**
		 * Constructor
		 * @param int $id unique id.
		 * @param array $data list of all actions.
		 */
		function __construct($id, $data)
		{
			$this->properties = $GLOBALS["properties"]->getMailListProperties();

			$this->showAsConversations = $this->useConversationView();

			parent::__construct($id, $data);
		}

		/**
		 * Checks if the list should be returned as conversations or as a plain list.
		 *
		 * @return Boolean True if the list should be returned as conversations, false otherwise
		 */
		function useConversationView() {
			return
				ENABLE_CONVERSATION_VIEW === true &&
				$GLOBALS['settings']->get('zarafa/v1/contexts/mail/enable_conversation_view') === true &&
				$GLOBALS['settings']->get('zarafa/v1/contexts/mail/enable_live_scroll') !== false;
		}

		/**
		 * Creates the notifiers for this module,
		 * and register them to the Bus.
		 */
		function createNotifiers()
		{
			$entryid = $this->getEntryID();
			$GLOBALS["bus"]->registerNotifier('maillistnotifier', $entryid);
		}

		/**
		 * Executes all the actions in the $data variable.
		 * @return boolean true on success of false on fialure.
		 */
		function execute()
		{
			$GLOBALS['PluginManager']->triggerHook("server.module.maillistmodule.execute.before", array('moduleObject' =>& $this));

			foreach($this->data as $actionType => $action)
			{
				if(isset($actionType)) {
					try {
						$store = $this->getActionStore($action);
						$entryid = $this->getActionEntryID($action);

						$this->currentActionData = array(
							'store' => $store,
							'entryid' => $entryid,
							'actionType' => $actionType,
							'action' => $action,
						);

						switch($actionType)
						{
							case "list":
							case "updatelist":
								$this->getDelegateFolderInfo($store);
								$this->messageList($store, $entryid, $action, $actionType);
								break;
							case "search":
								// @FIXME add handling for private items
								$this->search($store, $entryid, $action, $actionType);
								break;
							case "updatesearch":
								$this->updatesearch($store, $entryid, $action);
								break;
							case "stopsearch":
								$this->stopSearch($store, $entryid, $action);
								break;
							default:
								$this->handleUnknownActionType($actionType);
						}
					} catch (MAPIException $e) {
						$this->processException($e, $actionType);
					} catch (SearchException $e) {
						$this->processException($e, $actionType);
					}
				}
			}
			$GLOBALS['PluginManager']->triggerHook("server.module.maillistmodule.execute.after", array('moduleObject' =>& $this));
		}

		function messageList($store, $entryid, $action, $actionType) {
			// Get the entryid of the inbox
			// public store doesn't have inbox
			try {
				$inbox = mapi_msgstore_getreceivefolder($store);
				$inboxProps = mapi_getprops($inbox, array(PR_ENTRYID));
				$inboxEntryid = bin2hex($inboxProps[PR_ENTRYID]);
				$this->inboxEntryId = $inboxEntryid;
			} catch (MAPIException $e) {
				// don't propagate this error to parent handlers, if store doesn't support it
				if($e->getCode() === MAPI_E_NO_SUPPORT) {
					$e->setHandled();
				}
			}

			if (!$this->showAsConversations || !$GLOBALS['entryid']->compareEntryIds($inboxEntryid, bin2hex($entryid))) {
				return parent::messageList($store, $entryid, $action, $actionType);
			}

			return $this->conversationList($store, $entryid, $action, $actionType);
		}

		/**
		 * Function which retrieves a list of messages as conversations in a folder
		 * @param object $store MAPI Message Store Object
		 * @param string $entryid entryid of the folder
		 * @param array $action the action data, sent by the client
		 * @param string $actionType the action type, sent by the client
		 * @return boolean true on success or false on failure
		 */
		function conversationList($store, $entryid, $action, $actionType)
		{
			// Set to indicate this is not the search result, but a normal folder content
			$this->searchFolderList = false;

			if(!$store || !$entryid) {
				return [];
			}

			// Restriction
			$this->parseRestriction($action);

			// Sort
			$this->parseSortOrder($action, null, true);

			// Open the state
			$this->state = new State('conversation');
			$this->state->open();

			// Get the next CONVERSATION_BATCH_COUNT conversations from the folders
			$count = CONVERSATION_BATCH_COUNT;
			if ($actionType === 'updatelist' && $this->start === 0) {
				// This will happen when the user updates the list because a new item was received
				$count = $action['restriction']['limit'];
			}

			$items = $this->getConversations($count);
			$removedSentItemsCount = $this->state->read('removedSentItemsCount');

			$this->state->close();

			// Open the folder.
			$folder = mapi_msgstore_openentry($store, $entryid);
			$folderData = array();

			// Obtain some statistics from the folder contents
			$contentcount = mapi_getprops($folder, array(PR_CONTENT_COUNT, PR_CONTENT_UNREAD));
			if (isset($contentcount[PR_CONTENT_COUNT])) {
				$folderData["content_count"] = $contentcount[PR_CONTENT_COUNT];
			}
			if (isset($contentcount[PR_CONTENT_UNREAD])) {
				$folderData["content_unread"] = $contentcount[PR_CONTENT_UNREAD];
			}

			$searchFolder = $this->getConversationSearchFolder($store);
			$totalRowCount = 0;
			if ($searchFolder) {
				$table = mapi_folder_getcontentstable($searchFolder, MAPI_DEFERRED_ERRORS);
				$totalRowCount = mapi_table_getrowcount($table);
			}

			// Get the number of 'real' records that is sent back (i.e. without the conversation header records)
			$itemCount = 0;
			foreach ($items as $item) {
				if ($item['props']['depth'] > 0 || $item['props']['conversation_count'] === 0) {
					$itemCount++;
				}
			}

			$data = array(
				'folder' => $folderData,
				'item' => $items,
				'page' => array(
					'start' => 0,
					'rowcount' => $itemCount,
					'totalrowcount' => $totalRowCount,
					// TODO: removedsentitems is not part of pagination info, so it
					// should probably not be in the page property
					'removedsentitems' => $removedSentItemsCount,
				),
			);

			$data = $this->filterPrivateItems($data);

			// Allowing to hook in just before the data sent away to be sent to the client
			$GLOBALS['PluginManager']->triggerHook('server.module.listmodule.list.after', array(
				'moduleObject' =>& $this,
				'store' => $store,
				'entryid' => $entryid,
				'action' => $action,
				'data' =>& $data
			));

			$this->addActionData($actionType, $data);
			$GLOBALS["bus"]->addData($this->getResponseData());
		}

		/**
		 * Will iterate to retreive the requested number of conversations (or whatever is left)
		 *
		 * @param Integer $count Number of conversations to fetch
		 * @return Array Array of item objects grouped by conversation (together with headers)
		 */
		function getConversations($count = CONVERSATION_BATCH_COUNT) {
			$conversations = [];
			$totalConversationCount = 0;

			$infiniteScrollRequest = $this->currentActionData['actionType'] && $this->start > 0;
			$start = $infiniteScrollRequest ? $this->state->read('firstUnusedInboxItemIndex') : 0;

			// First batch will always contain max CONVERSATION_BATCH_COUNT conversations
			$limit = min(CONVERSATION_BATCH_COUNT, $count);

			$c = 0;
			do {
				$items = $this->getConversationItems($start);
				if (count($items) === 0) {
					break;
				}
				$lastItemsFetched = count($items) < CONVERSATION_MAXFETCH;

				$items = $this->groupConversationItems($items, $limit, !($infiniteScrollRequest || $c > 0));

				// addConversationHeaders returns the number of conversations that are contained
				// in the $items after the headers have been added.
				$batchConversationCount = $this->addConversationHeaders($items);
				$requestedBatchFetched = $batchConversationCount === $limit;
				$conversationsLeft = !$lastItemsFetched || $requestedBatchFetched;

				$totalConversationCount += $batchConversationCount;

				$conversations = array_merge($conversations, $items);

				// Next iteration should always start where the previous one stopped
				$start = $this->state->read('firstUnusedInboxItemIndex');
				if ($start === -1) {
					// We fetched all items
					$conversationsLeft = false;
				}

				// Don't fetch more conversations than requested
				$limit = min(CONVERSATION_BATCH_COUNT, $count-$totalConversationCount);

				// If something goes wrong we don't want to hang here forever, so we'll use
				// the counter to do no more than 30 iterations. Anybody who scrolls more
				// than a 30 times is a fool anyway, or more likely a QA'er. (or both) ;-)
				if ($c++ > 30) break;

			} while ($conversationsLeft && $limit > 0) ;

			return $conversations;
		}

		/**
		 * Gets CONVERSATION_MAXFETCH items from the conversation search folder
		 *
		 * @param Resource $store The store from which the conversation search folder will be used
		 * @param String $actionType The action type as sent by the client. Can be 'list' or 'updatelist'
		 * @return Array An array with items (array of props) sorted by client submit time
		 */
		function getConversationItems($start)
		{
			$searchFolder = $this->getConversationSearchFolder($this->currentActionData['store']);
			if (!$searchFolder) {
				// TODO: Improve error logging
				error_log('no search folder found');
				return [];
			}

			// Get the items from the search folder
			$table = mapi_folder_getcontentstable($searchFolder, MAPI_DEFERRED_ERRORS);

			// TODO: Seems like the items are already sorted in the correct order by default.
			// Needs to be checked though!
			// Conversations are always sorted descending
			//$sort = array(PR_CLIENT_SUBMIT_TIME => TABLE_SORT_DESCEND);
			//mapi_table_sort($table, $sort);

			$usedItemsAfterFirstUnusedInboxItems = $start > 0 ? $this->state->read('usedItemsAfterFirstUnusedInboxItems') : [];
			$fetchCount = CONVERSATION_MAXFETCH + count($usedItemsAfterFirstUnusedInboxItems);

			// Get CONVERSATION_MAXFETCH items from the folders
			// TODO: number should be configurable (could even be per user)
			$rows = mapi_table_queryrows($table, $this->properties, $start, $fetchCount);

			foreach ($rows as $i=>$row) {
				$itemData = Conversion::mapMAPI2XML($this->properties, $row);

				// For ZARAFA type users the email_address properties are filled with the username
				// Here we will copy that property to the *_username property for consistency with
				// the getMessageProps() function
				// We will not retrieve the real email address (like the getMessageProps function does)
				// for all items because that would be a performance decrease!
				if ( isset($itemData['props']["sent_representing_email_address"]) ){
					$itemData['props']["sent_representing_username"] = $itemData['props']["sent_representing_email_address"];
				}
				if ( isset($itemData['props']["sender_email_address"]) ){
					$itemData['props']["sender_username"] = $itemData['props']["sender_email_address"];
				}
				if ( isset($itemData['props']["received_by_email_address"]) ){
					$itemData['props']["received_by_username"] = $itemData['props']["received_by_email_address"];
				}

				// Make sure we have a normalized subject
				if (!isset($itemData['props']['normalized_subject'])) {
					$itemData['props']['normalized_subject'] = '';
				}

				$itemData['props']['folder_name'] = $GLOBALS['entryid']->compareEntryIds($itemData['parent_entryid'], $this->inboxEntryId) ? 'inbox' : 'sent_items';
				$itemData['props']['depth'] = 0;
				$itemData['props']['conversation_count'] = 0;
				$itemData['props']['tableindex'] = $i + $start;
				$rows[$i] = $itemData;
			}

			return $rows;
		}

		/**
		 * Group by conversation and sort by date
		 */
		function groupConversationItems($items, $limit, $skipStoredItems) {
			$previousUsedItemsAfterFirstUnusedInboxItems = $skipStoredItems ? [] : $this->state->read('usedItemsAfterFirstUnusedInboxItems');

			$conversations = [];

			// Group the items per conversation
			foreach ($items as $i => $item) {
				// Don't use previously used items
				if (!$skipStoredItems && count($previousUsedItemsAfterFirstUnusedInboxItems)) {
					foreach ($previousUsedItemsAfterFirstUnusedInboxItems as $p) {
						if ($GLOBALS['entryid']->compareEntryIds($p, $item['entryid'])) {
						//if ($p === $item['entryid']) {
								continue 2;
						}
					}
				}

				$sub = $item['props']['normalized_subject'];
				if (isset($conversations[$sub])) {
					$conversations[$sub]['items'][] = $item;
					if ($conversations[$sub]['date'] < $item['props']['client_submit_time']) {
						$conversations[$sub]['date'] = $item['props']['client_submit_time'];
					}
				} else {
					$conversations[$sub] = array(
						'date' => $item['props']['client_submit_time'],
						'items' => array($item),
					);
				}
			}

			// Remove conversations without inbox items
			$removedSentItemsCount = 0;
			$removedConversationsCount = 0;
			$removedItems = [];
			$index = 0;
			foreach ($conversations as $sub => $conversation) {
				if ($index - $removedConversationsCount >= $limit) {
					break;
				}

				$inboxItemFound = false;
				foreach ($conversation['items'] as $item) {
					if ($item['props']['folder_name'] === 'inbox') {
						$inboxItemFound = true;
						break;
					}
				}
				if (!$inboxItemFound) {
					if ($index < $limit + $removedConversationsCount) {
						$removedConversationsCount++;
						$removedSentItemsCount += count($conversation['items']);

						// Store the removed items, because we need them later
						$removedItems = array_merge($removedItems, $conversation['items']);

						// Remove this conversation
						unset($conversations[$sub]);
					}
				}

				$index++;
			}

			$removedSentItemsCount += ($skipStoredItems ? 0 : $this->state->read('removedSentItemsCount'));

			$conversationKeys = array_keys($conversations);

			// Store the first item that will not be sent back
			$firstUnusedInboxItem = null;
			$firstUnusedInboxItemIndex = -1;
			if (count($conversationKeys) > $limit) {
				$item = $conversations[$conversationKeys[$limit]]['items'][0];
				$firstUnusedInboxItem = $item['entryid'];
				$firstUnusedInboxItemIndex = $item['props']['tableindex'];
				for ($i=$limit; $i<count($conversationKeys); $i++) {
					foreach ($conversations[$conversationKeys[$i]]['items'] as $item) {
						if ($item['props']['tableindex'] < $firstUnusedInboxItemIndex) {
							$firstUnusedInboxItem = $item['entryid'];
							$firstUnusedInboxItemIndex = $item['props']['tableindex'];
						}
					}
				}
			}

			// Get the items that are part of sent conversations but that come after the first non-sent item
			$usedItemsAfterFirstUnusedInboxItems = $previousUsedItemsAfterFirstUnusedInboxItems;
			for ($i = 0; $i < min($limit, count($conversationKeys)); $i++) {
				// sort the items to make sure that sent items to yourself are shown in the correct order
				usort($conversations[$conversationKeys[$i]]['items'], function($a, $b) {
					if ($a['props']['client_submit_time'] === $b['props']['client_submit_time']) {
						return $a['props']['folder_name'] === 'inbox' ? -1 : 1;
					}

					return $b['props']['client_submit_time'] - $a['props']['client_submit_time'];
				});

				foreach ($conversations[$conversationKeys[$i]]['items'] as $item) {
					if ($item['props']['tableindex'] > $firstUnusedInboxItemIndex) {
						$usedItemsAfterFirstUnusedInboxItems[] = $item['entryid'];
					}
				}
			}

			// Add the removed items that come after the first non-sent item
			foreach ($removedItems as $item) {
				if ($item['props']['tableindex'] > $firstUnusedInboxItemIndex) {
					$usedItemsAfterFirstUnusedInboxItems[] = $item['entryid'];
				}
			}


			// Get the number of requested conversations
			$sortedItems = [];
			for ($counter = 0; $counter < min($limit, count($conversationKeys)); $counter++) {
				// Add a maximum of CONVERSATION_MAXITEMS items. Rest can be loaded later.
				$sortedItems = array_merge($sortedItems, array_slice($conversations[$conversationKeys[$counter]]['items'], 0, CONVERSATION_MAXITEMS));
			}

			// Store the data we need for the next batch in the state
			$this->state->write('firstUnusedInboxItem', $firstUnusedInboxItem, false);
			$this->state->write('firstUnusedInboxItemIndex', $firstUnusedInboxItemIndex, false);
			$this->state->write('usedItemsAfterFirstUnusedInboxItems', $usedItemsAfterFirstUnusedInboxItems, false);
			$this->state->write('removedSentItemsCount', $removedSentItemsCount, false);
			$this->state->flush();

			return $sortedItems;
		}

		/**
		 * Adds fake records to the items that denote conversation headers. These fake records
		 * will have the following properties:
		 *  - 'entryid'             : a fake entryid bsed on the subject and position in the list
		 *  - 'depth'               : 0 for conversation headers or single items (conversation of 1 item) or 1 for the rest
		 *  - 'subject'             : the normalized subject
		 *  - 'normalized_subject'  : the normalized subject
		 *  - 'conversation_count'  : the number of items in the conversation
		 *  - 'message_flags'        : message flags based on the items in the conversation
		 *
		 * The 'real' items will also get the depth property set, 0 for single items and 1 for items that
		 * are part of a conversation
		 *
		 * @param Array $items The (grouped) items that will get headers added
		 * @return Integer The number of headers added (i.e. the number of conversations)
		 */
		function addConversationHeaders(&$items) {
			$conversationCount = 0;
			$currentNormalizedSubject = false;
			$currentHeaderIndex = -1;
			$i = 0;
			while ($i < count($items)) {
				if ($items[$i]['props']['normalized_subject'] !== $currentNormalizedSubject) {
					$conversationCount++;
					$currentHeaderIndex = $i;
					$currentNormalizedSubject = $items[$i]['props']['normalized_subject'];
				} elseif ($i === $currentHeaderIndex + 1) {
					// We have a conversation, so add a header
					$items[$currentHeaderIndex]['props']['depth'] = 1;
					$items[$i]['props']['depth'] = 1;

					// Create a fake entryid for the headers based on the normalized subject
					// A number is added because the same normalized subject could be found in
					// another (later fetched) item batch
					$id = md5($currentNormalizedSubject) . floor($currentHeaderIndex / CONVERSATION_MAXFETCH);

					// Create a fake header object
					$header = array(
						'entryid' => $id,
						'props' => array(
							'depth' => 0,
							'entryid' => $id,
							'subject' => $currentNormalizedSubject,
							'normalized_subject' => $currentNormalizedSubject,
							'conversation_count' => 1,
							'message_flags' => $items[$currentHeaderIndex]['props']['message_flags'],
						),
					);
					array_splice($items, $currentHeaderIndex, 0, array($header));
					$i++;
				} else {
					$items[$i]['props']['depth'] = 1;
				}

				// Update the header properties
				if ($i > $currentHeaderIndex) {
					$items[$currentHeaderIndex]['props']['conversation_count']++;
					if (($items[$i]['props']['message_flags'] & 1) === 0) {
						$items[$currentHeaderIndex]['props']['message_flags'] = 0;
					}
				}
				$i++;
			}

			return $conversationCount;
		}

		/**
		 * Returns the search folder that holds the items that are used to create the conversations in the Inbox.
		 * If the folder does not exist yet, it will be created and this function will wait (with a maximum 0f
		 * 10 seconds) until the folder is filled.
		 *
		 * @param Resource $store The store in which the conversation search folder will be created
		 * @return Resource The search folder
		 */
		function getConversationSearchFolder($store) {
			$searchRoot = $this->getSearchFoldersRoot($store);

			try {
				// Try to create a new search folder for the conversations. If it fails, we'll assume it already exists.
				$searchFolder = mapi_folder_createfolder($searchRoot, 'Conversation view search (WebApp)', NULL, NULL, FOLDER_SEARCH);

				// Find the entryids of the folders we want to search in
				// For now we will use the inbox and send items folder. Later we could change this.
				// Note: If we decide to use only inbox and sent items (and possibly other fixed folders)
				// a merge of the results of restrictions on those folders might perform better!
				$msgstore_props = mapi_getprops($store, array(PR_ENTRYID, PR_IPM_SENTMAIL_ENTRYID));

				$foldersToSearch = array(
					hex2bin($this->inboxEntryId),
					$msgstore_props[PR_IPM_SENTMAIL_ENTRYID],
				);
				$res = array(
					RES_OR,
					array(
						array(
							RES_PROPERTY,
							array(
								RELOP => RELOP_EQ,
								ULPROPTAG => PR_PARENT_ENTRYID,
								VALUE => array(PR_PARENT_ENTRYID => hex2bin($this->inboxEntryId)),
							),
						),
						array(
							RES_PROPERTY,
							array(
								RELOP => RELOP_EQ,
								ULPROPTAG => PR_PARENT_ENTRYID,
								VALUE => array(PR_PARENT_ENTRYID => $msgstore_props[PR_IPM_SENTMAIL_ENTRYID]),
							),
						),
					)
				);

				// SHALLOW_SEARCH means to search only in the specified folders and not in child folders
				mapi_folder_setsearchcriteria($searchFolder, $res, $foldersToSearch, SHALLOW_SEARCH);

				// Wait until we have some data, no point in returning before we have data. Stop waiting after 10 seconds
				$start = time();

				// Sleep for 0.2 seconds initially, since it usually takes ~  0.2 seconds to fill the search folder.
				sleep(0.2);

				while (time() - $start < 20) {
					$result = mapi_folder_getsearchcriteria($searchFolder);

					// Stop looping if the search is finished
					if (($result["searchstate"] & SEARCH_REBUILD) == 0) {
						break; // Search is done
					}

					sleep(0.1);
				}

				// TODO: Let the client know if the search has not finished, so it can choose to continue
			} catch (MAPIException $e) {
				// Folder already exists. Let's open it
				try {
					$searchFolder = mapi_folder_createfolder($searchRoot, 'Conversation view search (WebApp)', NULL, OPEN_IF_EXISTS, FOLDER_SEARCH);
				} catch (MAPIException $e) {
					// TODO: Improve error logging
					error_log('Error creating search folder for conversation view: ' . $e->getMessage());

					// don't propagate the event to higher level exception handlers
					$e->setHandled();

					return false;
				}

				// don't propagate the event to higher level exception handlers
				$e->setHandled();
			}

			return $searchFolder;
		}

		/**
		 * Function does customization of exception based on module data.
		 * like, here it will generate display message based on actionType
		 * for particular exception.
		 *
		 * @param object $e Exception object
		 * @param string $actionType the action type, sent by the client
		 * @param MAPIobject $store Store object of the current user.
		 * @param string $parententryid parent entryid of the message.
		 * @param string $entryid entryid of the message.
		 * @param array $action the action data, sent by the client
		 */
		function handleException(&$e, $actionType = null, $store = null, $parententryid = null, $entryid = null, $action = null)
		{
			if(is_null($e->displayMessage)) {
				switch($actionType)
				{
					case "list":
						if($e->getCode() == MAPI_E_NO_ACCESS)
							$e->setDisplayMessage(_("You have insufficient privileges to see the contents of this folder."));
						else
							$e->setDisplayMessage(_("Could not load the contents of this folder."));
						break;

					case "search":
						if($e->getCode() == MAPI_E_NO_ACCESS)
							$e->setDisplayMessage(_("You have insufficient privileges to perform search operation in this folder."));
						else
							$e->setDisplayMessage(_("Error in search, please try again"));
						break;

					case "updatesearch":
						$e->setDisplayMessage(_("Could not update search results."));
						break;

					case "stopsearch":
						$e->setDisplayMessage(_("Could not stop search operation."));
						break;
				}
			}

			parent::handleException($e, $actionType, $store, $parententryid, $entryid, $action);
		}

		/**
		 * Parses the incoming sort request and builds a MAPI sort order.
		 * Overridden to rewrite the sorting for flags. (because the flags that are shown in the WebApp
		 * are a combination of several properties)
		 *
		 * @param array $action the action data, sent by the client
		 * @param array|bool $map Normally properties are mapped from the XML to MAPI by the standard
		 * $this->properties mapping. However, if you want other mappings, you can specify them in this parameter.
		 * @param bool $allow_multi_instance Sort as multi-value instance (every value a different row)
		 * @param array|bool a custom set of properties to use instead of the properties stored in module
		 */
		function parseSortOrder($action, $map = false, $allow_multi_instance = false, $properties = false)
		{
			if(isset($action['sort'])) {
				// Check if the user wants to sort the maillist on flags.
				// If so, we will rewrite the sorting a little
				if ( is_array($action['sort']) && count($action['sort'])>0 && $action['sort'][0]['field'] === 'flag_due_by' ) {
					$dir = $action['sort'][0]['direction'];
					$action['sort'] = array(
						array(
							'field' => 'flag_status',
							'direction' => $dir,
						),
						array(
							'field' => 'duedate',
							'direction' => $dir === 'ASC' ? 'DESC' : 'ASC',
						),
						array(
							'field' => 'flag_due_by',
							'direction' => $dir,
						),
					);
				}
			}

			parent::parseSortOrder($action, $map, $allow_multi_instance, $properties);
		}
	}
?>
