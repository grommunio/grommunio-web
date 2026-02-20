<?php

/**
 * Create Mail ItemModule
 * Module which opens, creates, saves and deletes an item. It
 * extends the Module class.
 */
class CreateMailItemModule extends ItemModule {
	/**
	 * Constructor.
	 *
	 * @param int   $id   unique id
	 * @param array $data list of all actions
	 */
	public function __construct($id, $data) {
		parent::__construct($id, $data);

		$this->properties = $GLOBALS['properties']->getMailProperties();
		$useHtmlPreview = $GLOBALS['settings']->get('zarafa/v1/contexts/mail/use_html_email_preview', USE_HTML_EMAIL_PREVIEW);
		$this->plaintext = !$useHtmlPreview;
	}

	/**
	 * Function which saves and/or sends an item.
	 *
	 * @param object $store         MAPI Message Store Object
	 * @param string $parententryid parent entryid of the message
	 * @param string $entryid       entryid of the message
	 * @param array  $action        the action data, sent by the client
	 */
	#[Override]
	public function save($store, $parententryid, $entryid, $action, $actionType = 'save') {
		$messageProps = [];
		$result = false;

		$store = $this->resolveStore($store, $action);
		if (!$store) {
			return;
		}

		$parententryid = $this->resolveParentEntryId($store, $parententryid, $action);

		$attachments = !empty($action['attachments']) ? $action['attachments'] : [];
		$recipients = !empty($action['recipients']) ? $action['recipients'] : [];

		$result = $this->applyMessageFlags($store, $entryid, $action, $messageProps);
		$send = $this->shouldSendMessage($action);
		$saveChanges = $this->shouldPersistMessage($send, $action, $attachments, $recipients);

		if ($saveChanges) {
			$copyContext = $this->createCopyContext($store, $action, $send);
			$store = $copyContext['store'];
			$copyFromMessage = $copyContext['copyFromMessage'];
			$copyAttachments = $copyContext['copyAttachments'];
			$copyInlineAttachmentsOnly = $copyContext['copyInlineAttachmentsOnly'];

			if ($send) {
				$sendOutcome = $this->handleSend($store, $entryid, $parententryid, $action, $recipients, $messageProps, $copyFromMessage, $copyAttachments, $copyInlineAttachmentsOnly);
				if ($sendOutcome['aborted']) {
					return;
				}
				$result = $sendOutcome['result'];
			}
			else {
				$draftOutcome = $this->handleDraftSave($store, $entryid, $parententryid, $action, $messageProps, $copyFromMessage, $copyAttachments, $copyInlineAttachmentsOnly);
				if ($draftOutcome['aborted']) {
					return;
				}
				$result = $draftOutcome['result'];
			}
		}

		if ($result === false && isset($action['message_action']['soft_delete'])) {
			$result = true;
		}

		if ($result && !$send && isset($messageProps[PR_PARENT_ENTRYID])) {
			$GLOBALS['bus']->notify(bin2hex($messageProps[PR_PARENT_ENTRYID]), TABLE_SAVE, $messageProps);
		}

		if ($send) {
			$this->addActionData('update', ['item' => Conversion::mapMAPI2XML($this->properties, $messageProps)]);
		}

		$this->sendFeedback($result ? true : false, [], true);
	}

	/**
	 * Resolve the message store that should be used for the save operation.
	 *
	 * @param mixed $store
	 *
	 * @return mixed
	 */
	private function resolveStore($store, array $action) {
		if ($store) {
			return $store;
		}

		return $GLOBALS['mapisession']->getDefaultMessageStore();
	}

	/**
	 * Resolve parent entry id based on provided data or defaults.
	 *
	 * @param mixed  $store
	 * @param string $parententryid
	 *
	 * @return string
	 */
	private function resolveParentEntryId($store, $parententryid, array $action) {
		if ($parententryid) {
			return $parententryid;
		}

		$messageClass = $action['props']['message_class'] ?? '';

		return $this->getDefaultFolderEntryID($store, $messageClass);
	}

	/**
	 * Apply message flag updates if requested by the client.
	 *
	 * @param mixed $store
	 * @param mixed $entryid
	 *
	 * @return bool
	 */
	private function applyMessageFlags($store, $entryid, array &$action, array &$messageProps) {
		if (!isset($action['props']['message_flags']) || !$entryid) {
			return false;
		}

		$msgAction = $action['message_action'] ?? false;
		$result = $GLOBALS['operations']->setMessageFlag($store, $entryid, $action['props']['message_flags'], $msgAction, $messageProps);

		unset($action['props']['message_flags']);

		return (bool) $result;
	}

	/**
	 * Determine whether the current action requests sending the message.
	 *
	 * @return bool
	 */
	private function shouldSendMessage(array $action) {
		return isset($action['message_action']['send']) ? (bool) $action['message_action']['send'] : false;
	}

	/**
	 * Decide if the message requires saving based on provided data.
	 *
	 * @param bool $send
	 *
	 * @return bool
	 */
	private function shouldPersistMessage($send, array $action, array $attachments, array $recipients) {
		if ($send) {
			return true;
		}

		if (!empty($action['props'])) {
			return true;
		}

		if ($this->hasAttachmentChanges($attachments)) {
			return true;
		}

		return !empty($recipients);
	}

	/**
	 * Check if attachment updates are pending in the attachment state.
	 *
	 * @return bool
	 */
	private function hasAttachmentChanges(array $attachments) {
		if (!isset($attachments['dialog_attachments'])) {
			return false;
		}

		$attachmentState = new AttachmentState();
		$attachmentState->open();
		$hasChanges = $attachmentState->isChangesPending($attachments['dialog_attachments']);
		$attachmentState->close();

		return $hasChanges;
	}

	/**
	 * Prepare context data when the new message should copy content from another message.
	 *
	 * @param mixed $store
	 * @param bool  $send
	 *
	 * @return array
	 */
	private function createCopyContext($store, array $action, $send) {
		$context = [
			'store' => $store,
			'copyAttachments' => false,
			'copyFromMessage' => false,
			'copyInlineAttachmentsOnly' => false,
		];

		if (isset($action['message_action']['action_type'])) {
			$actionType = $action['message_action']['action_type'];
			$requiresCopy = in_array($actionType, ['reply', 'replyall', 'forward', 'edit_as_new'], true);

			if ($requiresCopy) {
				$copyFromMessageId = (string) ($action['message_action']['source_entryid'] ?? '');
				$copyFromStoreId = (string) ($action['message_action']['source_store_entryid'] ?? '');
				$copyFromAttachNum = !empty($action['message_action']['source_attach_num']) ? $action['message_action']['source_attach_num'] : false;

				$copyStoreBinary = $copyFromStoreId !== '' ? $this->hexToBinOrFalse($copyFromStoreId) : false;
				$copyMessageBinary = $copyFromMessageId !== '' ? $this->hexToBinOrFalse($copyFromMessageId) : false;
				$copyFromStore = $copyStoreBinary !== false ? $GLOBALS['mapisession']->openMessageStore($copyStoreBinary) : false;
				$copyFromMessage = false;

				if ($copyFromStore && $copyMessageBinary !== false) {
					$copyFromMessage = $GLOBALS['operations']->openMessage($copyFromStore, $copyMessageBinary, $copyFromAttachNum);
				}

				if ($copyFromStore && $send) {
					$context['store'] = $copyFromStore;
				}

				if ($copyFromStore && $copyFromMessage) {
					parse_smime($copyFromStore, $copyFromMessage);
				}

				$context['copyAttachments'] = true;
				$context['copyFromMessage'] = $copyFromMessage;
				$context['copyInlineAttachmentsOnly'] = in_array($actionType, ['reply', 'replyall'], true);
			}
		}
		elseif (isset($action['props']['sent_representing_email_address'], $action['props']['sent_representing_address_type']) && strcasecmp($action['props']['sent_representing_address_type'], 'EX') === 0) {
			$otherStore = $GLOBALS['mapisession']->addUserStore($action['props']['sent_representing_email_address']);
			if ($otherStore && $send) {
				$context['store'] = $otherStore;
			}
		}

		return $context;
	}

	/**
	 * Handle the send flow including plugin hooks and recipient processing.
	 *
	 * @param mixed $store
	 * @param mixed $entryid
	 * @param mixed $parententryid
	 * @param mixed $copyFromMessage
	 * @param bool  $copyAttachments
	 * @param bool  $copyInlineAttachmentsOnly
	 *
	 * @return array
	 */
	private function handleSend($store, $entryid, $parententryid, array &$action, array $recipients, array &$messageProps, $copyFromMessage, $copyAttachments, $copyInlineAttachmentsOnly) {
		$success = true;
		$GLOBALS['PluginManager']->triggerHook('server.module.createmailitemmodule.beforesend', [
			'moduleObject' => $this,
			'store' => $store,
			'entryid' => $entryid,
			'action' => $action,
			'success' => &$success,
			'properties' => $this->properties,
			'messageProps' => $messageProps,
			'parententryid' => $parententryid,
		]);

		if (!$success) {
			return ['result' => false, 'aborted' => true];
		}

		if (!isset($action['message_action']['action_type']) || $action['message_action']['action_type'] !== 'edit_as_new') {
			$this->setReplyForwardInfo($action);
		}

		$savedUnsavedRecipients = [];
		if ($entryid) {
			try {
				$message = $GLOBALS['operations']->openMessage($store, $entryid);
				$savedRecipients = $GLOBALS['operations']->getRecipientsInfo($message);
				foreach ($savedRecipients as $recipient) {
					$savedUnsavedRecipients['saved'][] = $recipient['props'];
				}
			}
			catch (MAPIException $e) {
				$e->setHandled();
			}
		}

		if (!empty($recipients['add'])) {
			foreach ($recipients['add'] as $recipient) {
				$savedUnsavedRecipients['unsaved'][] = $recipient;
			}
		}

		$remove = !empty($recipients['remove']) ? $recipients['remove'] : [];
		$members = $GLOBALS['operations']->convertLocalDistlistMembersToRecipients($savedUnsavedRecipients, $remove);
		$action['recipients'] = $action['recipients'] ?? [];
		$action['recipients']['add'] = $members['add'];
		$action['recipients']['remove'] = !empty($remove) ? array_merge($action['recipients']['remove'] ?? [], $members['remove']) : $members['remove'];

		$error = $GLOBALS['operations']->submitMessage(
			$store,
			$entryid,
			Conversion::mapXML2MAPI($this->properties, $action['props']),
			$messageProps,
			$action['recipients'] ?? [],
			$action['attachments'] ?? [],
			$copyFromMessage,
			$copyAttachments,
			false,
			$copyInlineAttachmentsOnly,
			isset($action['props']['isHTML']) ? !$action['props']['isHTML'] : false
		);

		if (!$error) {
			$GLOBALS['operations']->parseDistListAndAddToRecipientHistory($savedUnsavedRecipients, $remove);
			if ($entryid) {
				$props = [];
				$props[PR_ENTRYID] = $entryid;
				$props[PR_PARENT_ENTRYID] = $parententryid;
				$storeProps = mapi_getprops($store, [PR_ENTRYID]);
				$props[PR_STORE_ENTRYID] = $storeProps[PR_ENTRYID];
				$GLOBALS['bus']->addData($this->getResponseData());
				$GLOBALS['bus']->notify(bin2hex($parententryid), TABLE_DELETE, $props);
			}
			$this->sendFeedback(true, [], false);

			return ['result' => true, 'aborted' => false];
		}

		$data = [];
		$data['type'] = 1;
		$data['info'] = [];

		if ($error === 'MAPI_E_NO_ACCESS') {
			$data['info']['title'] = _('Insufficient permissions');
			$data['info']['display_message'] = _("You don't have the permission to complete this action");
		}
		elseif ($error === 'ecQuotaExceeded') {
			$data['info']['title'] = _('Quota error');
			$data['info']['display_message'] = _('Send quota limit reached');
		}
		else {
			$data['info']['title'] = _('Operation failed');
			$data['info']['display_message'] = sprintf(_('Email sending failed (%s). Check the log files for more information.'), $error);
		}
		$this->addActionData('error', $data);

		return ['result' => false, 'aborted' => false];
	}

	/**
	 * Handle the draft save flow including attachment and plugin updates.
	 *
	 * @param mixed $store
	 * @param mixed $entryid
	 * @param mixed $parententryid
	 * @param mixed $copyFromMessage
	 * @param bool  $copyAttachments
	 * @param bool  $copyInlineAttachmentsOnly
	 *
	 * @return array
	 */
	private function handleDraftSave($store, $entryid, $parententryid, array $action, array &$messageProps, $copyFromMessage, $copyAttachments, $copyInlineAttachmentsOnly) {
		$propertiesToDelete = [];
		$mapiProps = Conversion::mapXML2MAPI($this->properties, $action['props']);
		if (isset($action['props']['sent_representing_entryid']) && empty($action['props']['sent_representing_entryid'])) {
			$propertiesToDelete[] = PR_SENT_REPRESENTING_ENTRYID;
			$propertiesToDelete[] = PR_SENT_REPRESENTING_SEARCH_KEY;
		}

		$result = $GLOBALS['operations']->saveMessage(
			$store,
			$entryid,
			$parententryid,
			$mapiProps,
			$messageProps,
			$action['recipients'] ?? [],
			$action['attachments'] ?? [],
			$propertiesToDelete,
			$copyFromMessage,
			$copyAttachments,
			false,
			$copyInlineAttachmentsOnly
		);

		if (!$result) {
			return ['result' => false, 'aborted' => false];
		}

		$props = mapi_getprops($result, [PR_ENTRYID]);
		$savedMsg = $GLOBALS['operations']->openMessage($store, $props[PR_ENTRYID]);
		$attachNum = !empty($action['attach_num']) ? $action['attach_num'] : false;
		$data = [];

		if ($attachNum) {
			$message = $GLOBALS['operations']->openMessage($store, $props[PR_ENTRYID], $attachNum);
			if (empty($message)) {
				return ['result' => false, 'aborted' => true];
			}
			$data['item'] = $GLOBALS['operations']->getEmbeddedMessageProps($store, $message, $this->properties, $savedMsg, $attachNum);
		}
		else {
			$data = $GLOBALS['operations']->getMessageProps($store, $savedMsg, $this->properties, $this->plaintext, true);
		}

		unset($data['props']['body'], $data['props']['html_body'], $data['props']['isHTML']);

		$GLOBALS['PluginManager']->triggerHook('server.module.createmailitemmodule.aftersave', [
			'data' => &$data,
			'entryid' => $props[PR_ENTRYID],
			'action' => $action,
			'properties' => $this->properties,
			'messageProps' => $messageProps,
			'parententryid' => $parententryid,
		]);

		$this->addActionData('update', ['item' => $data]);

		return ['result' => $result, 'aborted' => false];
	}

	/**
	 * Convert a hexadecimal string to binary data, returning false when invalid.
	 *
	 * @param string $value
	 *
	 * @return false|string
	 */
	private function hexToBinOrFalse($value) {
		if ($value === '') {
			return '';
		}

		if ((strlen($value) % 2) !== 0 || !ctype_xdigit($value)) {
			return false;
		}

		return hex2bin($value);
	}

	/**
	 * Function which is used to get the source message information, which contains the information of
	 * reply/forward and entry id of original mail, where we have to set the reply/forward arrow when
	 * draft(saved mail) is send.
	 *
	 * @param array $action the action data, sent by the client
	 *
	 * @return array|bool false when entryid and source message entryid is missing otherwise array with
	 *                    source store entryid and source message entryid if message has
	 */
	public function getSourceMsgInfo($action) {
		$metaData = [];
		if (isset($action["props"]["source_message_info"]) && !empty($action["props"]["source_message_info"])) {
			if (isset($action["props"]['sent_representing_entryid']) && !empty($action["props"]['sent_representing_entryid'])) {
				$storeEntryid = hex2bin((string) $action['message_action']['source_store_entryid']);
			}
			else {
				$storeEntryid = hex2bin((string) $action['store_entryid']);
			}
			$metaData['source_message_info'] = $action["props"]["source_message_info"];
			$metaData['storeEntryid'] = $storeEntryid;

			return $metaData;
		}
		if (isset($action["entryid"]) && !empty($action["entryid"])) {
			$storeEntryid = hex2bin((string) $action['store_entryid']);
			$store = $GLOBALS['mapisession']->openMessageStore($storeEntryid);

			$entryid = hex2bin((string) $action['entryid']);

			try {
				$message = $GLOBALS['operations']->openMessage($store, $entryid);
			}
			catch (MAPIException $e) {
				$e->setHandled();

				return false;
			}

			$messageProps = mapi_getprops($message);

			$props = Conversion::mapMAPI2XML($this->properties, $messageProps);

			$sourceMsgInfo = !empty($props['props']['source_message_info']) ? $props['props']['source_message_info'] : false;

			if (isset($props["props"]['sent_representing_entryid']) && !empty($props["props"]['sent_representing_entryid'])) {
				$storeEntryid = $this->getSourceStoreEntryId($props);
			}

			$metaData['source_message_info'] = $sourceMsgInfo;
			$metaData['storeEntryid'] = $storeEntryid;

			return $metaData;
		}

		return false;
	}

	/**
	 * Function is used to get the shared or delegate store entryid where
	 * source message was stored on which we have to set replay/forward arrow
	 * when draft(saved mail) is send.
	 *
	 * @param array $props the $props data, which get from saved mail
	 *
	 * @return string source store entryid
	 */
	public function getSourceStoreEntryId($props) {
		$sentRepresentingEntryid = $props['props']['sent_representing_entryid'];
		$user = mapi_ab_openentry($GLOBALS['mapisession']->getAddressbook(), hex2bin((string) $sentRepresentingEntryid));
		$userProps = mapi_getprops($user, [PR_EMAIL_ADDRESS]);

		return $GLOBALS['mapisession']->getStoreEntryIdOfUser(strtolower((string) $userProps[PR_EMAIL_ADDRESS]));
	}

	/**
	 * Function is used to set the reply/forward arrow on original mail.
	 *
	 * @param array $action the action data, sent by the client
	 */
	public function setReplyForwardInfo($action) {
		$message = false;
		$sourceMsgInfo = $this->getSourceMsgInfo($action);
		if (isset($sourceMsgInfo['source_message_info']) && $sourceMsgInfo['source_message_info']) {
			/**
			 * $sourceMsgInfo['source_message_info'] contains the hex value, where first 24byte contains action type
			 * and next 48byte contains entryid of original mail. so we have to extract the action type
			 * from this hex value.
			 *
			 * Example : 01000E000C00000005010000660000000200000030000000 + record entryid
			 * Here 66 represents the REPLY action type. same way 67 and 68 is represent
			 * REPLY ALL and FORWARD respectively.
			 */
			$mailActionType = substr((string) $sourceMsgInfo['source_message_info'], 24, 2);
			// get the entry id of origanal mail's.
			$originalEntryid = substr((string) $sourceMsgInfo['source_message_info'], 48);
			$entryid = hex2bin($originalEntryid);

			$store = $GLOBALS['mapisession']->openMessageStore($sourceMsgInfo['storeEntryid']);

			try {
				// if original mail of reply/forward mail is deleted from inbox then,
				// it will throw an exception so to handle it we need to write this block in try catch.
				$message = $GLOBALS['operations']->openMessage($store, $entryid);
			}
			catch (MAPIException $e) {
				$e->setHandled();
			}

			if ($message) {
				$messageProps = mapi_getprops($message);
				$props = Conversion::mapMAPI2XML($this->properties, $messageProps);

				switch ($mailActionType) {
					case '66': // Reply
					case '67': // Reply All
						$props['icon_index'] = 261;
						break;

					case '68':// Forward
						$props['icon_index'] = 262;
						break;
				}
				$props['last_verb_executed'] = hexdec($mailActionType);
				$props['last_verb_execution_time'] = time();
				$mapiProps = Conversion::mapXML2MAPI($this->properties, $props);
				$messageActionProps = [];
				$messageActionResult = $GLOBALS['operations']->saveMessage($store, $mapiProps[PR_ENTRYID], $mapiProps[PR_PARENT_ENTRYID], $mapiProps, $messageActionProps);
				if ($messageActionResult) {
					if (isset($messageActionProps[PR_PARENT_ENTRYID])) {
						$GLOBALS['bus']->notify(bin2hex($messageActionProps[PR_PARENT_ENTRYID]), TABLE_SAVE, $messageActionProps);
					}
				}
			}
		}
	}
}
