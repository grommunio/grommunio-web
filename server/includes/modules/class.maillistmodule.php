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
	 * @return int the numer of unread items in the Inbox folder
	 */
	public function getInboxTotalUnread($force = false) {
		if ($this->_inboxTotalUnread === null || $force) {
			$this->getInboxTotal($force);
		}

		return $this->_inboxTotalUnread;
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
