<?php

require_once 'IPMUser.php';
require_once 'Restriction.php';

/**
 * MailUser.
 *
 * An extension to the IPMUser to represent a user which
 * uses his mail (e.g. saving and sending mail).
 */
class MailUser extends IPMUser {
	/**
	 * Initialize the TestUser.
	 */
	protected function initialize() {
		parent::initialize();

		$this->logon();

		// The MailUser works in the Drafts folder, as this is the folder
		// where the mails will end up when a Mail has been saved. For
		// accessing the Inbox, the functions getReceivedMail() are provided
		// which apply delays to ensure the spooler will do its work.
		$this->defaultStoreEntryId = $this->getDefaultMessageStoreEntryID();
		$this->defaultFolderEntryId = $this->getDefaultFolderEntryID(PR_IPM_DRAFTS_ENTRYID);
		$this->defaultItemModule = 'createmailitemmodule';
		$this->defaultListModule = 'maillistmodule';
	}

	/**
	 * Save a mail to the drafts folder.
	 *
	 * @param array $message The message which should be saved
	 * @param bool  $open    true if the saved item should be opened, otherwise the
	 *                       saved properties will be returned
	 *
	 * @return MAPI_MESSAGE The saved message
	 */
	public function saveMail($message, $open = true) {
		$this->logon();

		return $this->saveItem($message, $open);
	}

	/**
	 * Mark an existing mail as Read.
	 *
	 * @param array $message      The message which should be marked as read
	 * @param array $extraActions The extra message actions to be send
	 *
	 * @return server response
	 */
	public function markAsRead($message, $extraActions = []) {
		$this->logon();

		return $this->execute($this->defaultItemModule, [
			'save' => [
				'entryid' => $message['entryid'],
				'parent_entryid' => $message['parent_entryid'],
				'store_entryid' => $message['store_entryid'],
				'message_action' => $extraActions,
				'props' => [
					'message_flags' => isset($message['props']['message_flags']) ? $message['props']['message_flags'] : 0,
				],
			],
		]);
	}

	/**
	 * Send a mail to a recipient.
	 *
	 * @param array $message      The message which should be saved
	 * @param array $extraActions the extra message actions to be send (besides 'send')
	 * @param bool  $open         true if the sent item should be opened, otherwise the
	 *                            saved properties will be returned
	 *
	 * @return MAPI_MESSAGE The sent message
	 */
	public function sendMail($message, $extraActions = [], $open = true) {
		$actions = array_merge($extraActions, ['send' => true]);

		return $this->saveMail(array_merge(['message_action' => $actions], $message), $open);
	}

	/**
	 * Open the given mail from the mail folder.
	 *
	 * @param Binary $entryid    The entryid of the item which should be opened
	 * @param array  $extraProps The array of extra properties which should be
	 *                           send to the server together with this request
	 *
	 * @return array The response from the PHP
	 */
	public function openMail($entryid, $extraProps = []) {
		$this->logon();

		return $this->openItem($entryid, $extraProps);
	}

	/**
	 * Delete the given mail from the mail folder.
	 *
	 * @param Binary $entryid    The entryid of the item which should be deleted
	 * @param array  $extraProps The array of extra properties which should be
	 *                           send to the server together with this request
	 * @param bool   $softDelete (optional) True to soft-delete the item rather then delete
	 *
	 * @return array The response from the PHP
	 */
	public function deleteMail($entryid, $extraProps = [], $softDelete = false) {
		$this->logon();

		return $this->deleteItem($entryid, $extraProps, $softDelete);
	}

	/**
	 * Copy/Move the given Mail.
	 *
	 * @param Binary $entryid    The entryid of the item which should be copied/moved
	 * @param array  $extraProps The array of extra properties which should be
	 *                           send to the server together with this request
	 * @param bool   $move       True to move the item rather then copy
	 *
	 * @return array The response from the PHP
	 */
	public function copyMail($entryid, $extraProps = [], $move = false) {
		$this->logon();

		return $this->copyItem($entryid, $extraProps, $move);
	}

	/**
	 * Load all mails from the mail folder.
	 *
	 * @param bool $open true if the saved item should be opened, otherwise the
	 *                   item props will be returned
	 *
	 * @return array The array of items for the given range
	 */
	public function loadMails($open = true) {
		$this->logon();

		return $this->loadItems([], $open);
	}

	/**
	 * Obtains the mail from the default folder based on the entryid.
	 *
	 * @param Binary $entryid The entryid of the item to obtain
	 * @param bool   $open    true if the found item should be opened, otherwise the
	 *                        entryid's will be returned
	 *
	 * @return mixed The mail with the given entryid
	 */
	public function getMail($entryid, $open = true) {
		$this->logon();
		$items = $this->getItems(Restriction::ResProperty(PR_ENTRYID, $entryid, RELOP_EQ), $open);

		return array_shift($items);
	}

	/**
	 * Obtains all mail from the Inbox folder.
	 *
	 * @param Number $expectedCount the number of items that is expected to be returned
	 * @param bool   $open          true if the found item should be opened, otherwise the
	 *                              entryid's will be returned
	 * @param int    $delay         delay in seconds to wait for spooler/dagent to actually send/receive meeting requests
	 *
	 * @return array list of items
	 */
	public function getAllReceivedMails($expectedCount = 1, $open = true, $delay = 30) {
		$this->logon();

		return $this->getReceivedItems(Restriction::ResContent(PR_MESSAGE_CLASS, 'IPM.Note', FL_SUBSTRING | FL_IGNORECASE), $expectedCount, $open, $delay);
	}

	/**
	 * Obtains all mail from the Sent Items folder.
	 *
	 * @param Number $expectedCount the number of items that is expected to be returned
	 * @param bool   $open          true if the found item should be opened, otherwise the
	 *                              entryid's will be returned
	 * @param int    $delay         delay in seconds to wait for spooler/dagent to actually send/receive meeting requests
	 *
	 * @return array list of items
	 */
	public function getAllSentMails($expectedCount = 1, $open = true, $delay = 30) {
		$this->logon();

		return $this->getSentItems(Restriction::ResContent(PR_MESSAGE_CLASS, 'IPM.Note', FL_SUBSTRING | FL_IGNORECASE), $expectedCount, $open, $delay);
	}

	/**
	 * Obtains all mail from the Outbox Items folder.
	 *
	 * @param Number $expectedCount the number of items that is expected to be returned
	 * @param bool   $open          true if the found item should be opened, otherwise the
	 *                              entryid's will be returned
	 * @param int    $delay         delay in seconds to wait for spooler/dagent to actually send/receive meeting requests
	 *
	 * @return array list of items
	 */
	public function getAllOutboxMails($expectedCount = 1, $open = true, $delay = 30) {
		$this->logon();

		return $this->getOutboxItems(Restriction::ResContent(PR_MESSAGE_CLASS, 'IPM.Note', FL_SUBSTRING | FL_IGNORECASE), $expectedCount, $open, $delay);
	}

	/**
	 * Obtains all mail from the Inbox Items folder.
	 *
	 * @return array list of items
	 */
	public function getInboxMails() {
		$this->logon();

		return $this->getItems(Restriction::ResContent(PR_MESSAGE_CLASS, 'IPM.Note', FL_SUBSTRING | FL_IGNORECASE));
	}

	/**
	 * Obtains the mail from the wastebasket folder based on the entryid.
	 *
	 * @param Binary $entryid The entryid of the item to obtain
	 * @param bool   $open    true if the found item should be opened, otherwise the
	 *                        entryid's will be returned
	 *
	 * @return mixed The mail with the given entryid
	 */
	public function getDeletedMail($entryid, $open = true) {
		$this->logon();
		$items = $this->getDeletedItems(Restriction::ResProperty(PR_ENTRYID, $entryid, RELOP_EQ), $open);

		return array_shift($items);
	}

	/**
	 * Obtain all mails which are present in the wastebastet folder.
	 *
	 * @param bool $open true if the found item should be opened, otherwise the
	 *                   entryid's will be returned
	 *
	 * @return array list of items
	 */
	public function getAllDeletedMails($open = true) {
		$this->logon();

		return $this->getDeletedItems(Restriction::ResContent(PR_MESSAGE_CLASS, 'IPM.Note', FL_SUBSTRING | FL_IGNORECASE), $open);
	}

	/**
	 * Obtain the properties for the mail.
	 *
	 * @param array $items array of the MAPI_MESSAGES
	 * @param array $tags  the list of property tags to fetch
	 *
	 * @return array returns array of props of all MAPI_MESSAGE items passed to the function
	 */
	public function getMailProps($items, $tags = []) {
		$this->logon();

		return $this->getItemProps($items, $tags);
	}
}
