<?php

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
	 * Constructor.
	 *
	 * @param int   $id   unique id
	 * @param array $data list of all actions
	 */
	public function __construct($id, $data) {
		parent::__construct($id, $data);
		$this->properties = $GLOBALS["properties"]->getMailListProperties();
	}

	/**
	 * Checks if the conversation view may be used. The message list itself is not
	 * affected by this (the client groups the messages by their conversation id),
	 * this only gates the conversationitems action that fetches the sent items
	 * belonging to a conversation.
	 *
	 * @return bool true if the conversation view may be used, false otherwise
	 */
	public function useConversationView() {
		// ENABLE_CONVERSATION_VIEW acts as an administrative kill-switch.
		return
			(!defined('ENABLE_CONVERSATION_VIEW') || ENABLE_CONVERSATION_VIEW) &&
			$GLOBALS['settings']->get('zarafa/v1/contexts/mail/enable_conversation_view') === true;
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

						case "conversationitems":
							$this->getDelegateFolderInfo($this->store);
							$this->getConversationItems($this->store, $action);
							break;

						case "conversationcounts":
							$this->getConversationCounts($this->store, $action);
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
	 * Returns, for the given list of conversation ids, how many messages of each
	 * conversation are in the Sent Items folder. The client uses this to know
	 * which messages must be presented as a conversation even though only one
	 * of them is in the Inbox (a mail that was replied to).
	 *
	 * @param object $store  MAPI message store object
	 * @param array  $action the action data, sent by the client
	 */
	public function getConversationCounts($store, $action) {
		$counts = [];
		$ids = $action['conversation_ids'] ?? [];

		if ($this->useConversationView() && is_array($ids) && !empty($ids)) {
			$validIds = [];
			foreach ($ids as $id) {
				if (is_string($id) && $id !== '' && ctype_xdigit($id)) {
					$validIds[] = $id;
					// The client asks per loaded page; cap the restriction size.
					if (count($validIds) >= 500) {
						break;
					}
				}
			}

			$msgstoreProps = mapi_getprops($store, [PR_IPM_SENTMAIL_ENTRYID]);
			if (!empty($validIds) && isset($msgstoreProps[PR_IPM_SENTMAIL_ENTRYID])) {
				$sentFolder = mapi_msgstore_openentry($store, $msgstoreProps[PR_IPM_SENTMAIL_ENTRYID]);
				$table = mapi_folder_getcontentstable($sentFolder, MAPI_DEFERRED_ERRORS);

				$subRestrictions = [];
				foreach ($validIds as $id) {
					$subRestrictions[] = [
						RES_PROPERTY,
						[
							RELOP => RELOP_EQ,
							ULPROPTAG => PR_CONVERSATION_ID,
							VALUE => [PR_CONVERSATION_ID => hex2bin($id)],
						],
					];
				}
				mapi_table_restrict($table, [RES_OR, $subRestrictions], TBL_BATCH);

				$rows = mapi_table_queryallrows($table, [PR_CONVERSATION_ID]);
				foreach ($rows as $row) {
					if (isset($row[PR_CONVERSATION_ID])) {
						$id = bin2hex((string) $row[PR_CONVERSATION_ID]);
						$counts[$id] = ($counts[$id] ?? 0) + 1;
					}
				}
			}
		}

		$this->addActionData('conversationcounts', [
			// Force an object so an empty result is {} instead of [].
			'counts' => empty($counts) ? new stdClass() : $counts,
		]);
		$GLOBALS['bus']->addData($this->getResponseData());
	}

	/**
	 * Returns the messages from the Sent Items folder that belong to the given
	 * conversation, identified by its PR_CONVERSATION_ID. The inbox part of a
	 * conversation is already available to the client through the normal message
	 * list; this action supplies the sent counterparts when the user expands a
	 * conversation.
	 *
	 * @param object $store  MAPI message store object
	 * @param array  $action the action data, sent by the client
	 */
	public function getConversationItems($store, $action) {
		$data = ['item' => []];
		$conversationId = $action['conversation_id'] ?? '';
		$data['conversation_id'] = $conversationId;

		if ($this->useConversationView() && is_string($conversationId) && $conversationId !== '' &&
			ctype_xdigit($conversationId)) {
			$restriction = [
				RES_PROPERTY,
				[
					RELOP => RELOP_EQ,
					ULPROPTAG => PR_CONVERSATION_ID,
					VALUE => [PR_CONVERSATION_ID => hex2bin($conversationId)],
				],
			];

			$folders = [];
			$msgstoreProps = mapi_getprops($store, [PR_IPM_SENTMAIL_ENTRYID]);
			if (isset($msgstoreProps[PR_IPM_SENTMAIL_ENTRYID])) {
				$folders['sent_items'] = mapi_msgstore_openentry($store, $msgstoreProps[PR_IPM_SENTMAIL_ENTRYID]);
			}
			// The mail list already contains the inbox part of a conversation,
			// but callers without that context (e.g. the search results
			// preview) need the complete conversation.
			if (!empty($action['include_inbox'])) {
				try {
					$folders['inbox'] = mapi_msgstore_getreceivefolder($store);
				}
				catch (MAPIException $e) {
					$e->setHandled();
				}
			}

			foreach ($folders as $folderName => $folder) {
				$table = mapi_folder_getcontentstable($folder, MAPI_DEFERRED_ERRORS);
				mapi_table_restrict($table, $restriction, TBL_BATCH);

				$rows = mapi_table_queryallrows($table, $this->properties);
				foreach ($rows as $row) {
					$item = Conversion::mapMAPI2XML($this->properties, $row);
					$item['props']['folder_name'] = $folderName;
					$data['item'][] = $item;
				}
			}

			// Newest first, like the conversation items in the mail list.
			usort($data['item'], function ($a, $b) {
				$dateA = $a['props']['message_delivery_time'] ?? $a['props']['client_submit_time'] ?? 0;
				$dateB = $b['props']['message_delivery_time'] ?? $b['props']['client_submit_time'] ?? 0;

				return $dateB <=> $dateA;
			});

			$data = $this->filterPrivateItems($data);
			$data['item'] = array_values($data['item']);
		}

		$this->addActionData('conversationitems', $data);
		$GLOBALS['bus']->addData($this->getResponseData());
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
