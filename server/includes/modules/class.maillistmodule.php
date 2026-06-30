<?php

// Maximum number of items that will be fetched to create conversations
define('CONVERSATION_MAXFETCH', 1500);
// Number of conversations that will be fetched per batch
// (Conversations will be fetched in batches)
define('CONVERSATION_BATCH_COUNT', 25);
// Maximum number of items in a conversation that will be returned in the list response.
// Others can be fetched later.
define('CONVERSATION_MAXITEMS', 300000);
// Time difference (in seconds) to decide whether to include an item in an existing
// conversation or to create a new conversation. (3 months = 3600*24*30*3)
define('MAX_TIME_DIFF', 7776000);

/**
 * Mail Module.
 */
class MailListModule extends ListModule {
	// Temporary var to store the inbox entryid of the processed store
	private $_inboxEntryId;

	private $_inbox;

	private $_inboxTotal;

	private $_inboxTotalUnread;

	private $store;

	private $currentActionData;

	/**
	 * True when the mail list should be returned grouped as conversations.
	 */
	private $showAsConversations = false;

	/**
	 * State object used to keep track of the conversation batches while
	 * the user scrolls through the (infinite scroll) mail list.
	 */
	private $state;

	/**
	 * Constructor.
	 *
	 * @param int   $id   unique id
	 * @param array $data list of all actions
	 */
	public function __construct($id, $data) {
		parent::__construct($id, $data);
		$this->showAsConversations = $this->useConversationView();
		$this->properties = $GLOBALS["properties"]->getMailListProperties();
	}

	/**
	 * Checks if the list should be returned as conversations or as a plain list.
	 *
	 * @return bool true if the list should be returned as conversations, false otherwise
	 */
	public function useConversationView() {
		// Conversation view also requires live scroll to be enabled, because the
		// conversations are fetched in batches while the user scrolls.
		return
			$GLOBALS['settings']->get('zarafa/v1/contexts/mail/enable_conversation_view') === true &&
			$GLOBALS['settings']->get('zarafa/v1/contexts/mail/enable_live_scroll') !== false;
	}

	/**
	 * Creates the notifiers for this module,
	 * and register them to the Bus.
	 */
	public function createNotifiers() {
		$entryid = $this->getEntryID();
		$GLOBALS["bus"]->registerNotifier('maillistnotifier', $entryid);
	}

	/**
	 * Executes all the actions in the $data variable.
	 */
	#[Override]
	public function execute() {
		$GLOBALS['PluginManager']->triggerHook("server.module.maillistmodule.execute.before", ['moduleObject' => &$this]);

		foreach ($this->data as $actionType => $action) {
			if (isset($actionType)) {
				try {
					$this->store = $this->getActionStore($action);
					$entryid = $this->getActionEntryID($action);

					// Reset variables
					$this->_inbox = null;
					$this->_inboxEntryId = null;
					$this->_inboxTotal = null;
					$this->_inboxTotalUnread = null;

					$this->currentActionData = [
						'store' => $this->store,
						'entryid' => $entryid,
						'actionType' => $actionType,
						'action' => $action,
					];

					switch ($actionType) {
						case "list":
						case "updatelist":
							$this->getDelegateFolderInfo($this->store);
							$this->messageList($this->store, $entryid, $action, $actionType);
							break;

						case "search":
							// @FIXME add handling for private items
							$this->search($this->store, $entryid, $action, $actionType);
							break;

						case "updatesearch":
							$this->updatesearch($this->store, $entryid, $action);
							break;

						case "stopsearch":
							$this->stopSearch($this->store, $entryid, $action);
							break;

						default:
							$this->handleUnknownActionType($actionType);
					}
				}
				catch (MAPIException|SearchException $e) {
					$this->processException($e, $actionType);
				}
			}
		}
		$GLOBALS['PluginManager']->triggerHook("server.module.maillistmodule.execute.after", ['moduleObject' => &$this]);
	}

	/**
	 * Returns the Inbox folder of the currently used store if found, NULL otherwise.
	 *
	 * @return resource The inbox folder of the currently used store
	 */
	public function getInbox() {
		if ($this->_inbox === null) {
			try {
				$this->_inbox = mapi_msgstore_getreceivefolder($this->store);
			}
			catch (MAPIException $e) {
				// don't propagate this error to parent handlers, if store doesn't support it
				if ($e->getCode() === MAPI_E_NO_SUPPORT) {
					$e->setHandled();

					return null;
				}
			}
		}

		return $this->_inbox;
	}

	/**
	 * Returns the entryid of the Inbox folder of the currently used store if found, false otherwise.
	 *
	 * @return string hexamdecimal representation of the entryid of the Inbox
	 */
	public function getInboxEntryId() {
		if ($this->_inboxEntryId === null) {
			$inbox = $this->getInbox();

			try {
				$inboxProps = mapi_getprops($inbox, [PR_ENTRYID]);
				$this->_inboxEntryId = bin2hex((string) $inboxProps[PR_ENTRYID]);
			}
			catch (MAPIException $e) {
				// don't propagate this error to parent handlers, if store doesn't support it
				if ($e->getCode() === MAPI_E_NO_SUPPORT) {
					$e->setHandled();

					return false;
				}
			}
		}

		return $this->_inboxEntryId;
	}

	/**
	 * Returns the total number of items in the Inbox of the currently used store.
	 *
	 * @param mixed $force
	 *
	 * @return int the number if items in the Inbox folder
	 */
	public function getInboxTotal($force = false) {
		if ($this->_inboxTotal === null || $force) {
			$inbox = $this->getInbox();
			$contentcount = mapi_getprops($inbox, [PR_CONTENT_COUNT, PR_CONTENT_UNREAD]);
			$this->_inboxTotal = $contentcount[PR_CONTENT_COUNT];
			$this->_inboxTotalUnread = $contentcount[PR_CONTENT_UNREAD];
		}

		return $this->_inboxTotal;
	}

	/**
	 * Returns the number of unread items in the Inbox of the currently used store.
	 *
	 * @param mixed $force
	 *
	 * @return int the number of unread items in the Inbox folder
	 */
	public function getInboxTotalUnread($force = false) {
		if ($this->_inboxTotalUnread === null || $force) {
			$this->getInboxTotal($force);
		}

		return $this->_inboxTotalUnread;
	}

	/**
	 * Retrieves a list of messages for a folder.
	 *
	 * Overridden to group the messages of the Inbox as conversations when the
	 * conversation view is enabled. For all other cases the default (plain) list
	 * of the parent class is returned.
	 *
	 * @param object $store      MAPI message store object
	 * @param string $entryid    entryid of the folder
	 * @param array  $action     the action data, sent by the client
	 * @param string $actionType the action type, sent by the client
	 *
	 * @return bool true on success or false on failure
	 */
	#[Override]
	public function messageList($store, $entryid, $action, $actionType) {
		// Get the entryid of the inbox. Public stores don't have an inbox.
		$inboxEntryid = false;

		try {
			$inbox = mapi_msgstore_getreceivefolder($store);
			$inboxProps = mapi_getprops($inbox, [PR_ENTRYID]);
			$inboxEntryid = bin2hex((string) $inboxProps[PR_ENTRYID]);
			$this->_inboxEntryId = $inboxEntryid;
		}
		catch (MAPIException $e) {
			// don't propagate this error to parent handlers, if store doesn't support it
			if ($e->getCode() === MAPI_E_NO_SUPPORT) {
				$e->setHandled();
			}
		}

		// Only the Inbox can be rendered as conversations.
		if (!$this->showAsConversations || $inboxEntryid === false || !$GLOBALS['entryid']->compareEntryIds($inboxEntryid, bin2hex((string) $entryid))) {
			return parent::messageList($store, $entryid, $action, $actionType);
		}

		if (isset($action['restriction']['filter']) && $action['restriction']['filter'] !== false) {
			return $this->prepareFilteredData($store, $action, $actionType);
		}

		return $this->conversationList($store, $entryid, $action, $actionType);
	}

	/**
	 * Function will prepare filtered data in the list form by applying a restriction on the
	 * conversation search folder. This is used when a filter (e.g. unread) is applied while
	 * the conversation view is active.
	 *
	 * @param object $store      MAPI message store object
	 * @param array  $action     the action data, sent by the client
	 * @param string $actionType the action type, sent by the client
	 *
	 * @return bool true on success or false on failure
	 */
	public function prepareFilteredData($store, $action, $actionType) {
		$searchFolder = $this->getConversationSearchFolder($this->currentActionData['store']);
		if (!$searchFolder) {
			error_log('grommunio-web: conversation view: no search folder found');

			return [];
		}

		$entryid = mapi_getprops($searchFolder, [PR_ENTRYID])[PR_ENTRYID];
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

		// Get the table and merge the arrays
		$data = $GLOBALS["operations"]->getTable($store, $entryid, $this->properties, $this->sort, $this->start, $limit, $this->restriction);

		$data = $this->filterPrivateItems($data);

		// Allowing to hook in just before the data sent away to be sent to the client
		$GLOBALS['PluginManager']->triggerHook('server.module.listmodule.list.after', [
			'moduleObject' => &$this,
			'store' => $store,
			'entryid' => $entryid,
			'action' => $action,
			'data' => &$data,
		]);

		foreach ($data["item"] as $key => $itemData) {
			$itemData['props']['folder_name'] = $GLOBALS['entryid']->compareEntryIds($itemData['parent_entryid'], $this->_inboxEntryId) ? 'inbox' : 'sent_items';
			$data["item"][$key] = $itemData;
		}

		// unset will remove the value but will not regenerate array keys, so we need to
		// do it here
		$data["item"] = array_values($data["item"]);

		$this->addActionData($actionType, $data);
		$GLOBALS["bus"]->addData($this->getResponseData());

		return true;
	}

	/**
	 * Function which retrieves a list of messages grouped as conversations in a folder.
	 *
	 * @param object $store      MAPI message store object
	 * @param string $entryid    entryid of the folder
	 * @param array  $action     the action data, sent by the client
	 * @param string $actionType the action type, sent by the client
	 *
	 * @return bool true on success or false on failure
	 */
	public function conversationList($store, $entryid, $action, $actionType) {
		// Set to indicate this is not the search result, but a normal folder content
		$this->searchFolderList = false;

		if (!$store || !$entryid) {
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
			$count = $action['restriction']['limit'] ?? CONVERSATION_BATCH_COUNT;
		}

		$items = $this->getConversations($count);

		$this->state->close();

		$folderData = [];

		// Obtain some statistics from the folder contents
		if ($this->getInboxTotal()) {
			$folderData["content_count"] = $this->getInboxTotal();
			$folderData["content_unread"] = $this->getInboxTotalUnread();
		}

		// Get the number of 'real' inbox records that is sent back (i.e. without the
		// conversation header records and without the sent items).
		$itemCount = 0;
		foreach ($items as $item) {
			if ($item['props']['folder_name'] === 'inbox') {
				++$itemCount;
			}
		}

		$data = [
			'folder' => $folderData,
			'item' => $items,
			'page' => [
				'start' => 0,
				'rowcount' => $itemCount,
				'totalrowcount' => $folderData["content_count"] ?? $itemCount,
			],
		];

		$data = $this->filterPrivateItems($data);

		// Allowing to hook in just before the data sent away to be sent to the client
		$GLOBALS['PluginManager']->triggerHook('server.module.listmodule.list.after', [
			'moduleObject' => &$this,
			'store' => $store,
			'entryid' => $entryid,
			'action' => $action,
			'data' => &$data,
		]);

		$this->addActionData($actionType, $data);
		$GLOBALS["bus"]->addData($this->getResponseData());

		return true;
	}

	/**
	 * Will iterate to retrieve the requested number of conversations (or whatever is left).
	 *
	 * @param int $count Number of conversations to fetch
	 *
	 * @return array Array of item objects grouped by conversation (together with headers)
	 */
	public function getConversations($count = CONVERSATION_BATCH_COUNT) {
		$conversations = [];
		$totalConversationCount = 0;
		$requestedBatchFetched = false;

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
			$items = $this->groupConversationItems($items, $limit, !($infiniteScrollRequest || $c > 0));

			// addConversationHeaders returns the number of conversations that are contained
			// in the $items after the headers have been added.
			$batchConversationCount = $this->addConversationHeaders($items);

			$requestedBatchFetched = $batchConversationCount === $limit;
			$remainingInboxItems = $this->getInboxTotal() - $this->state->read('sentInboxItems');

			$totalConversationCount += $batchConversationCount;

			$conversations = array_merge($conversations, $items);

			// Next iteration should always start where the previous one stopped
			$start = $this->state->read('firstUnusedInboxItemIndex');
			if ($start === -1) {
				// We fetched all items
				$remainingInboxItems = 0;
			}

			// Don't fetch more conversations than requested
			$limit = min(CONVERSATION_BATCH_COUNT, $count - $totalConversationCount);

			// If something goes wrong we don't want to hang here forever, so we'll use
			// the counter to do no more than 30 iterations.
			if ($c++ > 30) {
				break;
			}
		}
		while (!$requestedBatchFetched && $remainingInboxItems > 0 && $limit > 0);

		return $conversations;
	}

	/**
	 * Gets a batch of items from the conversation search folder, starting at the given index.
	 *
	 * @param int $start Index of the first item to fetch from the search folder
	 *
	 * @return array An array with items (array of props) sorted by client submit time
	 */
	public function getConversationItems($start) {
		$searchFolder = $this->getConversationSearchFolder($this->currentActionData['store']);
		if (!$searchFolder) {
			error_log('grommunio-web: conversation view: no search folder found');

			return [];
		}

		// Get the items from the search folder
		$table = mapi_folder_getcontentstable($searchFolder, MAPI_DEFERRED_ERRORS);

		$usedItemsAfterFirstUnusedInboxItems = $start > 0 ? $this->state->read('usedItemsAfterFirstUnusedInboxItems') : [];
		$fetchCount = CONVERSATION_MAXFETCH + count((array) $usedItemsAfterFirstUnusedInboxItems);

		// Get the items from the search folder
		$rows = mapi_table_queryrows($table, $this->properties, $start, $fetchCount);

		foreach ($rows as $i => $row) {
			$itemData = Conversion::mapMAPI2XML($this->properties, $row);

			// For ZARAFA type users the email_address properties are filled with the username.
			// Here we will copy that property to the *_username property for consistency with
			// the getMessageProps() function.
			if (isset($itemData['props']["sent_representing_email_address"])) {
				$itemData['props']["sent_representing_username"] = $itemData['props']["sent_representing_email_address"];
			}
			if (isset($itemData['props']["sender_email_address"])) {
				$itemData['props']["sender_username"] = $itemData['props']["sender_email_address"];
			}
			if (isset($itemData['props']["received_by_email_address"])) {
				$itemData['props']["received_by_username"] = $itemData['props']["received_by_email_address"];
			}

			// Make sure we have a normalized subject
			if (!isset($itemData['props']['normalized_subject'])) {
				$itemData['props']['normalized_subject'] = '';
			}

			$itemData['props']['folder_name'] = $GLOBALS['entryid']->compareEntryIds($itemData['parent_entryid'], $this->_inboxEntryId) ? 'inbox' : 'sent_items';
			$itemData['props']['depth'] = 0;
			$itemData['props']['conversation_count'] = 0;
			$itemData['props']['tableindex'] = $i + $start;
			$rows[$i] = $itemData;
		}

		return $rows;
	}

	/**
	 * Group the given items by conversation (normalized subject + time heuristic) and
	 * sort them by date. Conversations without any inbox item are dropped (we only render
	 * conversations that contain at least one item in the inbox). The state is updated so
	 * subsequent batches can continue where this one stopped.
	 *
	 * @param array $items          The items to group
	 * @param int   $limit          Maximum number of conversations to keep
	 * @param bool  $skipStoredItems True for the first batch, where no previously stored items should be skipped
	 *
	 * @return array The grouped (and sorted) items
	 */
	public function groupConversationItems($items, $limit, $skipStoredItems) {
		$previousUsedItemsAfterFirstUnusedInboxItems = $skipStoredItems ? [] : (array) $this->state->read('usedItemsAfterFirstUnusedInboxItems');

		$conversations = [];

		// Group the items per conversation
		foreach ($items as $item) {
			// Don't use previously used items
			if (!$skipStoredItems && count($previousUsedItemsAfterFirstUnusedInboxItems)) {
				foreach ($previousUsedItemsAfterFirstUnusedInboxItems as $p) {
					if ($GLOBALS['entryid']->compareEntryIds($p, $item['entryid'])) {
						continue 2;
					}
				}
			}

			$sub = $item['props']['normalized_subject'];

			// Don't group mails with empty subject and undelivered mails in a conversation.
			if ($sub === '' || $item['props']['message_class'] === 'REPORT.IPM.Note.NDR') {
				// Don't include sent items with empty subject.
				if ($item['props']['folder_name'] === 'sent_items') {
					continue;
				}
				// To avoid grouping of empty subject mails and undelivered mails and also treat
				// them as a single conversation item, we need to add the item with a unique key.
				$sub = $this->createUniqueConversationKey($item);
			}

			if (isset($conversations[$sub])) {
				// Create a different conversation group if the time difference is more than
				// MAX_TIME_DIFF even if the normalized subject is the same.
				$timeDiff = abs($conversations[$sub]['date'] - $item['props']['client_submit_time']);
				if ($timeDiff >= MAX_TIME_DIFF) {
					$conversationKey = $this->findNearestConversationKey($conversations, $item);
					$sub = $conversationKey ?: $this->createUniqueConversationKey($item);
				}

				$conversations[$sub]['items'][] = $item;
				if (!isset($conversations[$sub]['date']) || $conversations[$sub]['date'] < $item['props']['client_submit_time']) {
					$conversations[$sub]['date'] = $item['props']['client_submit_time'];
				}
			}
			else {
				$conversations[$sub] = [
					'date' => $item['props']['client_submit_time'],
					'items' => [$item],
				];
			}
		}

		// Remove conversations without inbox items
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
					++$removedConversationsCount;

					// Store the removed items, because we need them later
					$removedItems = array_merge($removedItems, $conversation['items']);

					// Remove this conversation
					unset($conversations[$sub]);
				}
			}

			++$index;
		}

		$conversationKeys = array_keys($conversations);

		// Store the first item that will not be sent back
		$firstUnusedInboxItem = null;
		$firstUnusedInboxItemIndex = -1;
		if (count($conversationKeys) > $limit) {
			$item = $conversations[$conversationKeys[$limit]]['items'][0];
			$firstUnusedInboxItem = $item['entryid'];
			$firstUnusedInboxItemIndex = $item['props']['tableindex'];
			for ($i = $limit; $i < count($conversationKeys); ++$i) {
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
		for ($i = 0; $i < min($limit, count($conversationKeys)); ++$i) {
			// sort the items to make sure that sent items to yourself are shown in the correct order
			usort($conversations[$conversationKeys[$i]]['items'], function ($a, $b) {
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

		$sortedItems = [];
		for ($counter = 0; $counter < min($limit, count($conversationKeys)); ++$counter) {
			// Get the number of requested conversations. Add a maximum of CONVERSATION_MAXITEMS
			// items. The rest can be loaded later.
			$sortedItems = array_merge($sortedItems, array_slice($conversations[$conversationKeys[$counter]]['items'], 0, CONVERSATION_MAXITEMS));
		}

		// Get the number of inbox items in the conversations
		$inboxCounter = $skipStoredItems ? 0 : $this->state->read('sentInboxItems');
		foreach ($sortedItems as $item) {
			if ($item['props']['folder_name'] === 'inbox') {
				++$inboxCounter;
			}
		}

		// Update the conversation batch number
		$firstConversationGroupItemIndex = $sortedItems[0]['props']['tableindex'] ?? 0;
		$previousUnusedItemIndex = $this->state->read('firstUnusedInboxItemIndex');

		if ($previousUnusedItemIndex > 0 && $firstConversationGroupItemIndex >= $previousUnusedItemIndex) {
			$batchNo = $this->state->read('batchNumber');
			$this->state->write('batchNumber', $batchNo + 1, false);
		}
		else {
			$this->state->write('batchNumber', 0, false);
		}

		// Store the data we need for the next batch in the state
		$this->state->write('firstUnusedInboxItem', $firstUnusedInboxItem, false);
		$this->state->write('firstUnusedInboxItemIndex', $firstUnusedInboxItemIndex, false);
		$this->state->write('usedItemsAfterFirstUnusedInboxItems', $usedItemsAfterFirstUnusedInboxItems, false);
		$this->state->write('sentInboxItems', $inboxCounter, false);
		$this->state->flush();

		return $sortedItems;
	}

	/**
	 * Helper function which will create a unique conversation key to avoid the same-subject-key
	 * issue, based on a hash value of the normalized subject and the entryid of the given item.
	 *
	 * @param array $item item for which a conversation key is needed
	 *
	 * @return string conversation key which will be used to group items in a conversation
	 */
	public function createUniqueConversationKey($item) {
		$sub = $item['props']['normalized_subject'];
		$prefix = md5((string) $sub) . '/';

		// Append the entryid after the hash of the normalized subject. The entryid is unique so
		// it has the first priority; 'tableindex' and a random number have lower priority.
		if (isset($item['entryid'])) {
			return $prefix . $item['entryid'];
		}
		if (isset($item['props']['tableindex'])) {
			return $prefix . $item['props']['tableindex'];
		}

		return $prefix . random_int(0, mt_getrandmax());
	}

	/**
	 * Helper function which will return the key of the conversation group that is nearest in time
	 * to the given item, so that we can add the item to that group.
	 *
	 * @param array $conversations array which contains the conversation groups as key/value pairs
	 * @param array $item          item for which a conversation key is needed
	 *
	 * @return bool|string conversation key to use to group the item, or false if none found
	 */
	public function findNearestConversationKey($conversations, $item) {
		$sub = md5((string) $item['props']['normalized_subject']);
		$time = $item['props']['client_submit_time'];
		$minTimeDiff = MAX_TIME_DIFF;
		$nearestConversationKey = false;

		foreach ($conversations as $key => $value) {
			$str = explode('/', $key);
			$doesSubExist = count($str) === 2 && $str[0] === $sub;

			if ($doesSubExist && abs($value['date'] - $time) < $minTimeDiff) {
				$minTimeDiff = $value['date'];
				$nearestConversationKey = $key;
			}
		}

		return $nearestConversationKey;
	}

	/**
	 * Adds fake records to the items that denote conversation headers. These fake records
	 * will have the following properties:
	 *  - 'entryid'            : a fake entryid based on the subject and position in the list
	 *  - 'depth'             : 0 for conversation headers or single items, 1 for the rest
	 *  - 'subject'           : the normalized subject
	 *  - 'normalized_subject' : the normalized subject
	 *  - 'conversation_count' : the number of items in the conversation
	 *  - 'message_flags'      : message flags based on the items in the conversation
	 *
	 * The 'real' items will also get the depth property set: 0 for single items and 1 for items
	 * that are part of a conversation.
	 *
	 * @param array $items The (grouped) items that will get headers added
	 *
	 * @return int The number of headers added (i.e. the number of conversations)
	 */
	public function addConversationHeaders(&$items) {
		$conversationCount = 0;
		$currentNormalizedSubject = false;
		$currentConversationTimeStamp = false;
		$currentHeaderIndex = -1;
		$i = 0;

		// We maintain a batch number to make the header entryid unique per batch.
		$batchNo = $this->state->read('batchNumber');
		$currentBatchSubjects = [];
		while ($i < count($items)) {
			// Don't add empty subject mails and undelivered mails to a conversation group,
			// so the depth for those mails must remain '0'.
			$isNonConversationGroupItem = $currentNormalizedSubject === '' || $items[$i]['props']['message_class'] === 'REPORT.IPM.Note.NDR';
			$timeDiff = abs($currentConversationTimeStamp - $items[$i]['props']['client_submit_time']);
			$isDifferentConversationGroup = ($items[$i]['props']['normalized_subject'] === $currentNormalizedSubject) && $timeDiff >= MAX_TIME_DIFF;

			if ($items[$i]['props']['normalized_subject'] !== $currentNormalizedSubject || $isNonConversationGroupItem || $isDifferentConversationGroup) {
				++$conversationCount;
				$currentHeaderIndex = $i;
				$currentNormalizedSubject = $items[$i]['props']['normalized_subject'];
				$currentConversationTimeStamp = $items[$i]['props']['client_submit_time'];
			}
			elseif ($i === $currentHeaderIndex + 1) {
				// We have a conversation, so add a header
				$items[$currentHeaderIndex]['props']['depth'] = 1;
				$items[$i]['props']['depth'] = 1;

				if (isset($currentBatchSubjects[$currentNormalizedSubject])) {
					$currentBatchSubjects[$currentNormalizedSubject] = ++$currentBatchSubjects[$currentNormalizedSubject];
				}
				else {
					$currentBatchSubjects[$currentNormalizedSubject] = 0;
				}

				// Create a fake entryid for the headers based on the normalized subject. A batch
				// number and repeated item number are added to make the entryid of groups with
				// the same normalized subject in the same item batch unique.
				$id = md5((string) $currentNormalizedSubject) . $batchNo . $currentBatchSubjects[$currentNormalizedSubject];

				// Create a fake header object
				$header = [
					'entryid' => $id,
					'props' => [
						'depth' => 0,
						'entryid' => $id,
						'subject' => $currentNormalizedSubject,
						'normalized_subject' => $currentNormalizedSubject,
						'conversation_count' => 1,
						'message_flags' => $items[$currentHeaderIndex]['props']['message_flags'],
					],
				];
				array_splice($items, $currentHeaderIndex, 0, [$header]);
				++$i;
			}
			else {
				$items[$i]['props']['depth'] = 1;
			}

			// Update the header properties
			if ($i > $currentHeaderIndex) {
				++$items[$currentHeaderIndex]['props']['conversation_count'];
				if (($items[$i]['props']['message_flags'] & 1) === 0) {
					$items[$currentHeaderIndex]['props']['message_flags'] = 0;
				}
			}
			++$i;
		}

		return $conversationCount;
	}

	/**
	 * Returns the search folder that holds the items that are used to create the conversations in
	 * the Inbox. If the folder does not exist yet, it will be created and this function will wait
	 * (with a maximum of 20 seconds) until the folder is filled.
	 *
	 * @param resource $store The store in which the conversation search folder will be created
	 *
	 * @return bool|resource The search folder, or false on failure
	 */
	public function getConversationSearchFolder($store) {
		$searchRoot = $this->getSearchFoldersRoot($store);

		try {
			// Return the search folder if it exists.
			if ($this->doesSearchFolderExist($searchRoot)) {
				return mapi_folder_createfolder($searchRoot, 'Conversation view search (grommunio Web)', null, OPEN_IF_EXISTS, FOLDER_SEARCH);
			}

			// Try to create a new search folder for the conversations if it doesn't exist.
			$searchFolder = mapi_folder_createfolder($searchRoot, 'Conversation view search (grommunio Web)', null, 0, FOLDER_SEARCH);

			// Find the entryids of the folders we want to search in. For now we use the inbox and
			// sent items folders.
			$msgstore_props = mapi_getprops($store, [PR_ENTRYID, PR_IPM_SENTMAIL_ENTRYID]);

			$foldersToSearch = [
				hex2bin((string) $this->_inboxEntryId),
				$msgstore_props[PR_IPM_SENTMAIL_ENTRYID],
			];
			$res = [
				RES_OR,
				[
					[
						RES_PROPERTY,
						[
							RELOP => RELOP_EQ,
							ULPROPTAG => PR_PARENT_ENTRYID,
							VALUE => [PR_PARENT_ENTRYID => hex2bin((string) $this->_inboxEntryId)],
						],
					],
					[
						RES_PROPERTY,
						[
							RELOP => RELOP_EQ,
							ULPROPTAG => PR_PARENT_ENTRYID,
							VALUE => [PR_PARENT_ENTRYID => $msgstore_props[PR_IPM_SENTMAIL_ENTRYID]],
						],
					],
				],
			];

			// SHALLOW_SEARCH means to search only in the specified folders and not in child folders
			mapi_folder_setsearchcriteria($searchFolder, $res, $foldersToSearch, SHALLOW_SEARCH);

			// Wait until we have some data, no point in returning before we have data. Stop waiting
			// after 20 seconds.
			$start = time();

			// Sleep for 0.2 seconds initially, since it usually takes ~0.2 seconds to fill the
			// search folder.
			usleep(200000);

			while (time() - $start < 20) {
				$result = mapi_folder_getsearchcriteria($searchFolder);

				// Stop looping if the search is finished
				if (($result["searchstate"] & SEARCH_REBUILD) == 0) {
					break; // Search is done
				}

				usleep(100000);
			}
		}
		catch (MAPIException $e) {
			error_log('grommunio-web: error creating search folder for conversation view: ' . $e->getMessage());

			// don't propagate the event to higher level exception handlers
			$e->setHandled();

			return false;
		}

		return $searchFolder;
	}

	/**
	 * Helper function which determines whether the conversation search folder already exists.
	 *
	 * @param resource $searchRoot FINDER_ROOT folder of the store in which we need to find the
	 *                             conversation search folder
	 *
	 * @return bool true if the conversation search folder already exists, false otherwise
	 */
	public function doesSearchFolderExist($searchRoot) {
		$searchRootFolderTable = mapi_folder_gethierarchytable($searchRoot);
		$restriction = [
			RES_AND,
			[
				[
					RES_PROPERTY,
					[
						RELOP => RELOP_EQ,
						ULPROPTAG => PR_FOLDER_TYPE,
						VALUE => [PR_FOLDER_TYPE => FOLDER_SEARCH],
					],
				],
				[
					RES_CONTENT,
					[
						ULPROPTAG => PR_DISPLAY_NAME,
						FUZZYLEVEL => FL_FULLSTRING,
						VALUE => [PR_DISPLAY_NAME => 'Conversation view search (grommunio Web)'],
					],
				],
			],
		];

		mapi_table_restrict($searchRootFolderTable, $restriction);
		$folders = mapi_table_queryallrows($searchRootFolderTable, [PR_DISPLAY_NAME]);

		// If we get data that means we already have the search folder.
		return !empty($folders);
	}

	/**
	 * Function does customization of exception based on module data.
	 * like, here it will generate display message based on actionType
	 * for particular exception.
	 *
	 * @param object     $e             Exception object
	 * @param string     $actionType    the action type, sent by the client
	 * @param MAPIobject $store         store object of the current user
	 * @param string     $parententryid parent entryid of the message
	 * @param string     $entryid       entryid of the message
	 * @param array      $action        the action data, sent by the client
	 */
	#[Override]
	public function handleException(&$e, $actionType = null, $store = null, $parententryid = null, $entryid = null, $action = null) {
		if (is_null($e->displayMessage)) {
			switch ($actionType) {
				case "list":
					if ($e->getCode() == MAPI_E_NO_ACCESS) {
						$e->setDisplayMessage(_("You have insufficient privileges to see the contents of this folder."));
					}
					else {
						$e->setDisplayMessage(_("Could not load the contents of this folder."));
					}
					break;

				case "search":
					if ($e->getCode() == MAPI_E_NO_ACCESS) {
						$e->setDisplayMessage(_("You have insufficient privileges to perform search operation in this folder."));
					}
					else {
						$e->setDisplayMessage(_("Error in search, please try again"));
					}
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
	 * Overridden to rewrite the sorting for flags. (because the flags that are shown in grommunio Web
	 * are a combination of several properties).
	 *
	 * @param array      $action               the action data, sent by the client
	 * @param array|bool $map                  Normally properties are mapped from the XML to MAPI by the standard
	 *                                         $this->properties mapping. However, if you want other mappings, you can specify them in this parameter.
	 * @param bool       $allow_multi_instance Sort as multi-value instance (every value a different row)
	 * @param array|bool a custom set of properties to use instead of the properties stored in module
	 * @param mixed $properties
	 */
	#[Override]
	public function parseSortOrder($action, $map = false, $allow_multi_instance = false, $properties = false) {
		if (isset($action['sort'])) {
			// Check if the user wants to sort the maillist on flags.
			// If so, we will rewrite the sorting a little
			if (is_array($action['sort']) && count($action['sort']) > 0 && $action['sort'][0]['field'] === 'flag_due_by') {
				$dir = $action['sort'][0]['direction'];
				$action['sort'] = [
					[
						'field' => 'flag_status',
						'direction' => $dir,
					],
					[
						'field' => 'duedate',
						'direction' => $dir === 'ASC' ? 'DESC' : 'ASC',
					],
					[
						'field' => 'flag_due_by',
						'direction' => $dir,
					],
				];
			}
		}

		parent::parseSortOrder($action, $map, $allow_multi_instance, $properties);
	}
}
