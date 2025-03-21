<?php

/**
 * Create Mail ItemModule
 * Module which openes, creates, saves and deletes an item. It
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
	}

	/**
	 * Function which saves and/or sends an item.
	 *
	 * @param object $store         MAPI Message Store Object
	 * @param string $parententryid parent entryid of the message
	 * @param string $entryid       entryid of the message
	 * @param array  $action        the action data, sent by the client
	 */
	public function save($store, $parententryid, $entryid, $action) {
		$result = false;
		$send = false;
		$saveChanges = true;

		if (!$store) {
			$store = $GLOBALS['mapisession']->getDefaultMessageStore();
		}
		if (!$parententryid) {
			if (isset($action['props'], $action['props']['message_class'])) {
				$parententryid = $this->getDefaultFolderEntryID($store, $action['props']['message_class']);
			}
			else {
				$parententryid = $this->getDefaultFolderEntryID($store, '');
			}
		}

		if ($store) {
			// Reference to an array which will be filled with PR_ENTRYID, PR_STORE_ENTRYID and PR_PARENT_ENTRYID of the message
			$messageProps = [];
			$attachments = !empty($action['attachments']) ? $action['attachments'] : [];
			$recipients = !empty($action['recipients']) ? $action['recipients'] : [];

			// Set message flags first, because this has to be possible even if the user does not have write permissions
			if (isset($action['props'], $action['props']['message_flags']) && $entryid) {
				$msg_action = $action['message_action'] ?? false;
				$result = $GLOBALS['operations']->setMessageFlag($store, $entryid, $action['props']['message_flags'], $msg_action, $messageProps);

				unset($action['props']['message_flags']);
			}

			if (isset($action['message_action'], $action['message_action']['send'])) {
				$send = $action['message_action']['send'];
			}

			// if we are sending mail then no need to check if anything is modified or not just send the mail
			if (!$send) {
				// If there is any property changed then save
				$saveChanges = !empty($action['props']);

				// Check if we are dealing with drafts and recipients or attachments information is modified
				if (!$saveChanges) {
					// check for changes in attachments
					if (isset($attachments['dialog_attachments'])) {
						$attachment_state = new AttachmentState();
						$attachment_state->open();
						$saveChanges = $attachment_state->isChangesPending($attachments['dialog_attachments']);
						$attachment_state->close();
					}

					// check for changes in recipients info
					$saveChanges = $saveChanges || !empty($recipients);
				}
			}

			// check we should send/save mail
			if ($saveChanges) {
				$copyAttachments = false;
				$copyFromStore = false;
				$copyFromMessage = false;
				$copyInlineAttachmentsOnly = false;

				if (isset($action['message_action'], $action['message_action']['action_type'])) {
					$actions = ['reply', 'replyall', 'forward', 'edit_as_new'];
					if (array_search($action['message_action']['action_type'], $actions) !== false) {
						/**
						 * we need to copy the original attachments when it is a forwarded message, or an "edit as new" message
						 * OR
						 * we need to copy ONLY original inline(HIDDEN) attachments when it is reply/replyall message.
						 */
						$copyFromMessage = hex2bin((string) $action['message_action']['source_entryid']);
						$copyFromStore = hex2bin((string) $action['message_action']['source_store_entryid']);
						$copyFromAttachNum = !empty($action['message_action']['source_attach_num']) ? $action['message_action']['source_attach_num'] : false;
						$copyAttachments = true;

						// get resources of store and message
						$copyFromStore = $GLOBALS['mapisession']->openMessageStore($copyFromStore);
						$copyFromMessage = $GLOBALS['operations']->openMessage($copyFromStore, $copyFromMessage, $copyFromAttachNum);
						if ($copyFromStore && $send) {
							$store = $copyFromStore;
						}

						// Decode smime signed messages on this message
						parse_smime($copyFromStore, $copyFromMessage);

						if ($action['message_action']['action_type'] === 'reply' || $action['message_action']['action_type'] === 'replyall') {
							$copyInlineAttachmentsOnly = true;
						}
					}
				}
				elseif (isset($action['props']['sent_representing_email_address'], $action['props']['sent_representing_address_type']) &&
					strcasecmp($action['props']['sent_representing_address_type'], 'EX') == 0) {
					$otherstore = $GLOBALS["mapisession"]->addUserStore($action['props']['sent_representing_email_address']);
					if ($otherstore && $send) {
						$store = $otherstore;
					}
				}

				if ($send) {
					// Allowing to hook in just before the data sent away to be sent to the client
					$succes = true;
					$GLOBALS['PluginManager']->triggerHook('server.module.createmailitemmodule.beforesend', [
						'moduleObject' => $this,
						'store' => $store,
						'entryid' => $entryid,
						'action' => $action,
						'success' => &$succes,
						'properties' => $this->properties,
						'messageProps' => $messageProps,
						'parententryid' => $parententryid,
					]);
					// Break out, hook should use sendFeedback to return a response to the client.
					if (!$succes) {
						return;
					}

					if (!(isset($action['message_action']['action_type']) && $action['message_action']['action_type'] === 'edit_as_new')) {
						$this->setReplyForwardInfo($action);
					}

					$savedUnsavedRecipients = [];

					/*
					 * If message was saved then open that message and retrieve
					 * all recipients from message and prepare array under "saved" key
					 */
					if ($entryid) {
						$message = $GLOBALS['operations']->openMessage($store, $entryid);
						$savedRecipients = $GLOBALS['operations']->getRecipientsInfo($message);
						foreach ($savedRecipients as $recipient) {
							$savedUnsavedRecipients["saved"][] = $recipient['props'];
						}
					}

					/*
					 * If message some unsaved recipients then prepare array under the "unsaved"
					 * key.
					 */
					if (!empty($recipients) && !empty($recipients["add"])) {
						foreach ($recipients["add"] as $recipient) {
							$savedUnsavedRecipients["unsaved"][] = $recipient;
						}
					}

					$remove = [];
					if (!empty($recipients) && !empty($recipients["remove"])) {
						$remove = $recipients["remove"];
					}

					$members = $GLOBALS['operations']->convertLocalDistlistMembersToRecipients($savedUnsavedRecipients, $remove);

					$action["recipients"]["add"] = $members["add"];

					if (!empty($remove)) {
						$action["recipients"]["remove"] = array_merge($action["recipients"]["remove"], $members["remove"]);
					}
					else {
						$action["recipients"]["remove"] = $members["remove"];
					}

					$error = $GLOBALS['operations']->submitMessage($store, $entryid, Conversion::mapXML2MAPI($this->properties, $action['props']), $messageProps, $action['recipients'] ?? [], $action['attachments'] ?? [], $copyFromMessage, $copyAttachments, false, $copyInlineAttachmentsOnly, isset($action['props']['isHTML']) ? !$action['props']['isHTML'] : false);

					// If draft is sent from the drafts folder, delete notification
					if (!$error) {
						$result = true;
						$GLOBALS['operations']->parseDistListAndAddToRecipientHistory($savedUnsavedRecipients, $remove);

						if (isset($entryid) && !empty($entryid)) {
							$props = [];
							$props[PR_ENTRYID] = $entryid;
							$props[PR_PARENT_ENTRYID] = $parententryid;

							$storeprops = mapi_getprops($store, [PR_ENTRYID]);
							$props[PR_STORE_ENTRYID] = $storeprops[PR_ENTRYID];

							$GLOBALS['bus']->addData($this->getResponseData());
							$GLOBALS['bus']->notify(bin2hex($parententryid), TABLE_DELETE, $props);
						}
						$this->sendFeedback($result ? true : false, [], false);
					}
					else {
						if ($error === 'MAPI_E_NO_ACCESS') {
							// Handling error: not able to handle this type of object
							$data = [];
							$data["type"] = 1; // MAPI
							$data["info"] = [];
							$data["info"]['title'] = _("Insufficient permissions");
							$data["info"]['display_message'] = _("You don't have the permission to complete this action");
							$this->addActionData("error", $data);
						}
						if ($error === "ecQuotaExceeded") {
							// Handling error: Send quota error
							$data = [];
							$data["type"] = 1; // MAPI
							$data["info"] = [];
							$data["info"]['title'] = _("Quota error");
							$data["info"]['display_message'] = _("Send quota limit reached");
							$this->addActionData("error", $data);
						}
						if ($error === "ecRpcFailed") {
							// Handling error: mapi_message_submitmessage failed
							$data = [];
							$data["type"] = 1; // MAPI
							$data["info"] = [];
							$data["info"]['title'] = _("Operation failed");
							$data["info"]['display_message'] = _("Email sending failed. Check the log files for more information.");
							$this->addActionData("error", $data);
						}
					}
				}
				else {
					$propertiesToDelete = [];
					$mapiProps = Conversion::mapXML2MAPI($this->properties, $action['props']);

					/*
					 * PR_SENT_REPRESENTING_ENTRYID and PR_SENT_REPRESENTING_SEARCH_KEY properties needs to be deleted while user removes
					 * any previously configured recipient from FROM field.
					 * This property was simply ignored by Conversion::mapXML2MAPI function
					 * as it is configured with empty string in request.
					 */
					if (isset($action['props']['sent_representing_entryid']) && empty($action['props']['sent_representing_entryid'])) {
						array_push($propertiesToDelete, PR_SENT_REPRESENTING_ENTRYID, PR_SENT_REPRESENTING_SEARCH_KEY);
					}

					$result = $GLOBALS['operations']->saveMessage($store, $entryid, $parententryid, $mapiProps, $messageProps, $action['recipients'] ?? [], $action['attachments'] ?? [], $propertiesToDelete, $copyFromMessage, $copyAttachments, false, $copyInlineAttachmentsOnly);

					// Update the client with the (new) entryid and parententryid to allow the draft message to be removed when submitting.
					// this will also update rowids of attachments which is required when deleting attachments
					$props = [];
					$props = mapi_getprops($result, [PR_ENTRYID]);
					$savedMsg = $GLOBALS['operations']->openMessage($store, $props[PR_ENTRYID]);

					$attachNum = !empty($action['attach_num']) ? $action['attach_num'] : false;

					// If embedded message is being saved currently than we need to obtain all the
					// properties of 'embedded' message instead of simple message and send it in response
					if ($attachNum) {
						$message = $GLOBALS['operations']->openMessage($store, $props[PR_ENTRYID], $attachNum);

						if (empty($message)) {
							return;
						}

						$data['item'] = $GLOBALS['operations']->getEmbeddedMessageProps($store, $message, $this->properties, $savedMsg, $attachNum);
					}
					else {
						$data = $GLOBALS['operations']->getMessageProps($store, $savedMsg, $this->properties);
					}

					/*
					 * html filter modifies body of the message when opening the message
					 * but we have just saved the message and even if there are changes in body because of html filter
					 * we shouldn't send updated body to client otherwise it will mark it as changed
					 */
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
				}
			}
			if ($result === false && isset($action['message_action']['soft_delete'])) {
				$result = true;
			}

			// Feedback for successful save (without send)
			if ($result && !$send && isset($messageProps[PR_PARENT_ENTRYID])) {
				$GLOBALS['bus']->notify(bin2hex($messageProps[PR_PARENT_ENTRYID]), TABLE_SAVE, $messageProps);
			}

			// Feedback for send
			if ($send) {
				$this->addActionData('update', ['item' => Conversion::mapMAPI2XML($this->properties, $messageProps)]);
			}

			$this->sendFeedback($result ? true : false, [], true);
		}
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
			$message = $GLOBALS['operations']->openMessage($store, $entryid);
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
