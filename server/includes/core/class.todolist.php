<?php

/**
 * This class contains the functionality for the To-do list.
 * Since there is only one To-do list this class will be a singleton.
 */
class TodoList {
	/**
	 * The entryid of the Todo-list search folder. TodoList::getEntryId will retrieve it
	 * if it isn't yet.
	 *
	 * @var string
	 */
	private static $_entryId = false;

	/**
	 * Returns the entryid of the To-do list search folder.
	 *
	 * @return string The entryid of the To-do list search folder
	 */
	public static function getEntryId() {
		if (!TodoList::$_entryId) {
			TodoList::_retrieveEntryId();
		}

		return TodoList::$_entryId;
	}

	/**
	 * Retrieves the entryid of the To-do list from the property PR_ADDITIONAL_REN_ENTRYIDS_EX
	 * of the user store. Will create a new to-do search folder if it does not yet exist.
	 *
	 * @see https://msdn.microsoft.com/en-us/library/office/cc842311.aspx
	 *
	 * @return string|bool The entryid of the Todo-list search folder
	 */
	private static function _retrieveEntryId() {
		$userStore = $GLOBALS['mapisession']->getDefaultMessageStore();

		$root = mapi_msgstore_openentry($userStore);
		$rootProperties = mapi_getprops($root, [PR_ADDITIONAL_REN_ENTRYIDS_EX]);
		$additionalRenEntryidsEx = $rootProperties[PR_ADDITIONAL_REN_ENTRYIDS_EX];

		$headerFormat = 'Sid/Ssize';
		while (strlen($additionalRenEntryidsEx) > 0) {
			$header = unpack($headerFormat, substr($additionalRenEntryidsEx, 0, 4));
			$additionalRenEntryidsEx = substr($additionalRenEntryidsEx, 4);

			if ($header['id'] === PERSIST_SENTINEL) {
				// We found the end block
				break;
			}

			// We're only interested in the entryid of the to-do search folder
			if ($header['id'] === RSF_PID_TODO_SEARCH) {
				// Now read the PersistElementBlock
				$dataHeader = unpack($headerFormat, substr($additionalRenEntryidsEx, 0, 4));
				TodoList::$_entryId = substr($additionalRenEntryidsEx, 4, $dataHeader['size']);

				return TodoList::$_entryId;
			}

			$additionalRenEntryidsEx = substr($additionalRenEntryidsEx, $header['size']);
		}

		if (!TodoList::$_entryId) {
			TodoList::createTodoSearchFolder();
		}

		return TodoList::$_entryId;
	}

	/**
	 * Creates a search folder for the To-do list under the root folder of the store. Adds the entryid
	 * to the PR_ADDITIONAL_REN_ENTRYIDS_EX property of the root folder, and also stores it in TodoList::$_entryId.
	 *
	 * @return string Entryid of the new search folder for the To-do list
	 */
	public static function createTodoSearchFolder() {
		$userStore = $GLOBALS['mapisession']->getDefaultMessageStore();
		$root = mapi_msgstore_openentry($userStore);
		$props = mapi_getprops($userStore, [PR_IPM_SUBTREE_ENTRYID]);
		$ipmSubTreeEntryId = $props[PR_IPM_SUBTREE_ENTRYID];
		$entryid = false;

		try {
			if ($resource = mapi_folder_createfolder($root, 'To-do Search', '', OPEN_IF_EXISTS, FOLDER_SEARCH)) {
				mapi_setprops($resource, [PR_CONTAINER_CLASS => 'IPF.Task']);
				mapi_folder_setsearchcriteria($resource, TodoList::_createRestriction(), [$ipmSubTreeEntryId], RECURSIVE_SEARCH);

				$props = mapi_getprops($resource, [PR_ENTRYID]);
				$entryid = $props[PR_ENTRYID];
			}
		}
		catch (MAPIException $e) {
			// don't propagate the event to higher level exception handlers
			$e->setHandled();
		}

		if (!$entryid) {
			return false;
		}

		// Now add the entryid to the PR_ADDITIONAL_REN_ENTRYIDS_EX property of the store root
		$rootProperties = mapi_getprops($root, [PR_ADDITIONAL_REN_ENTRYIDS_EX]);
		$additionalRenEntryidsEx = $rootProperties[PR_ADDITIONAL_REN_ENTRYIDS_EX];

		$dataHeader = pack('SS', RSF_ELID_ENTRYID, strlen($entryid));
		$dataElement = $dataHeader . $entryid;
		$blockHeader = pack('SS', RSF_PID_TODO_SEARCH, strlen($dataElement));

		// We'll just put it at the beginning of the property, so we don't have to bother with
		// the end block (PERSIST_SENTINEL)
		$additionalRenEntryidsEx = $blockHeader . $dataElement . $additionalRenEntryidsEx;

		try {
			mapi_setprops($root, [PR_ADDITIONAL_REN_ENTRYIDS_EX => $additionalRenEntryidsEx]);
			mapi_savechanges($root);
		}
		catch (MAPIException $e) {
			// Entryid could not be saved, so don't use it.
			$entryid = false;

			// don't propagate the event to higher level exception handlers
			$e->setHandled();
		}

		if ($entryid) {
			TodoList::$_entryId = $entryid;
		}

		return $entryid;
	}

	/**
	 * Retrieves the Todo search folder and creates it if not found.
	 *
	 * @param MAPIObject user store, the store of the user
	 * @param mixed $store
	 *
	 * @return MAPIObject Mapi Search Folder of the To-Do list
	 */
	public static function getTodoSearchFolder($store) {
		$entryid = self::getEntryId();

		try {
			return mapi_msgstore_openentry($store, $entryid);
		}
		catch (MAPIException $e) {
			$e->setHandled();
			if ($e->getCode() === MAPI_E_NOT_FOUND || $e->getCode() === MAPI_E_INVALID_ENTRYID) {
				// Entryid invalid or no not found
				$entryid = self::createTodoSearchFolder();
				if ($entryid) {
					return mapi_msgstore_openentry($store, $entryid);
				}
			}

			// Something went wrong, inform the administrator
			error_log(sprintf("Unable to open 'To-do Search' for user: %s", $GLOBALS["mapisession"]->getUserName()));

			return null;
		}
	}

	/**
	 * Creates the restriction for the To-do list search folder for the currently logged in user. The
	 * restriction was 'copied' from Outlook to show exactly the same items in the To-do list.
	 *
	 * @return array The restriction for the To-do list search folder for the currently logged in user
	 */
	public static function _createRestriction() {
		$userStore = $GLOBALS['mapisession']->getDefaultMessageStore();

		// First get some entryids that we need for the restriction
		$storeProperties = mapi_getprops($userStore, [PR_IPM_OUTBOX_ENTRYID, PR_IPM_WASTEBASKET_ENTRYID]);
		$root = mapi_msgstore_openentry($userStore);
		$rootProperties = mapi_getprops($root, [PR_IPM_DRAFTS_ENTRYID, PR_ADDITIONAL_REN_ENTRYIDS]);
		$additionalRenEntryids = $rootProperties[PR_ADDITIONAL_REN_ENTRYIDS];
		$entryIds = [
			'deletedItems' => $storeProperties[PR_IPM_WASTEBASKET_ENTRYID],
			'junk' => $additionalRenEntryids[4],
			'drafts' => $rootProperties[PR_IPM_DRAFTS_ENTRYID],
			'outbox' => $storeProperties[PR_IPM_OUTBOX_ENTRYID],
		];

		// Now get some task request properties that we need in the restriction
		$properties = [
			'taskstate' => "PT_LONG:PSETID_Task:0x8113",
			'taskaccepted' => "PT_BOOLEAN:PSETID_Task:0x8108",
			'taskstatus' => "PT_LONG:PSETID_Task:" . PidLidTaskStatus,
		];
		$propertyIds = getPropIdsFromStrings($userStore, $properties);

		return [
			RES_AND,
			[
				[
					RES_AND,
					[
						[
							RES_NOT,
							[
								[
									RES_CONTENT,
									[
										FUZZYLEVEL => FL_PREFIX | FL_IGNORECASE,
										ULPROPTAG => PR_MESSAGE_CLASS,
										VALUE => "IPM.Appointment",
									],
								],
							],
						],
						[
							RES_NOT,
							[
								[
									RES_CONTENT,
									[
										FUZZYLEVEL => FL_PREFIX | FL_IGNORECASE,
										ULPROPTAG => PR_MESSAGE_CLASS,
										VALUE => "IPM.Activity",
									],
								],
							],
						],
						[
							RES_NOT,
							[
								[
									RES_CONTENT,
									[
										FUZZYLEVEL => FL_PREFIX | FL_IGNORECASE,
										ULPROPTAG => PR_MESSAGE_CLASS,
										VALUE => "IPM.StickyNote",
									],
								],
							],
						],
					],
				],
				[
					RES_AND,
					[
						[
							RES_AND,
							[
								[
									RES_PROPERTY,
									[
										RELOP => RELOP_NE,
										ULPROPTAG => PR_PARENT_ENTRYID,
										VALUE => $entryIds['deletedItems'],
									],
								],
								[
									RES_PROPERTY,
									[
										RELOP => RELOP_NE,
										ULPROPTAG => PR_PARENT_ENTRYID,
										VALUE => $entryIds['junk'],
									],
								],
								[
									RES_PROPERTY,
									[
										RELOP => RELOP_NE,
										ULPROPTAG => PR_PARENT_ENTRYID,
										VALUE => $entryIds['drafts'],
									],
								],
								[
									RES_PROPERTY,
									[
										RELOP => RELOP_NE,
										ULPROPTAG => PR_PARENT_ENTRYID,
										VALUE => $entryIds['outbox'],
									],
								],
							],
						],
						[
							RES_OR,
							[
								[
									RES_OR,
									[
										[
											RES_AND,
											[
												[
													RES_OR,
													[
														[
															RES_NOT,
															[
																[
																	RES_EXIST,
																	[
																		ULPROPTAG => PR_FOLLOWUP_ICON,
																	],
																],
															],
														],
														[
															RES_PROPERTY,
															[
																RELOP => RELOP_EQ,
																ULPROPTAG => PR_FOLLOWUP_ICON,
																VALUE => 0,
															],
														],
													],
												],
												[
													RES_EXIST,
													[
														ULPROPTAG => PR_FLAG_STATUS,
													],
												],
												[
													RES_PROPERTY,
													[
														RELOP => RELOP_EQ,
														ULPROPTAG => PR_FLAG_STATUS,
														VALUE => 1,
													],
												],
											],
										],
										[
											RES_AND,
											[
												[
													RES_PROPERTY,
													[
														RELOP => RELOP_EQ,
														ULPROPTAG => $propertyIds['taskstatus'],
														VALUE => olTaskComplete,
													],
												],
												[
													RES_EXIST,
													[
														ULPROPTAG => $propertyIds['taskstatus'],
													],
												],
											],
										],
									],
								],
								[
									RES_AND,
									[
										[
											RES_EXIST,
											[
												ULPROPTAG => PR_TODO_ITEM_FLAGS,
											],
										],
										[
											RES_BITMASK,
											[
												ULPROPTAG => PR_TODO_ITEM_FLAGS,
												ULTYPE => BMR_NEZ,
												ULMASK => 1,
											],
										],
									],
								],
								[
									RES_AND,
									[
										[
											RES_EXIST,
											[
												ULPROPTAG => PR_FOLLOWUP_ICON,
											],
										],
										[
											RES_PROPERTY,
											[
												RELOP => RELOP_GT,
												ULPROPTAG => PR_FOLLOWUP_ICON,
												VALUE => 0,
											],
										],
									],
								],
								[
									RES_AND,
									[
										[
											RES_NOT,
											[
												[
													RES_AND,
													[
														[
															RES_PROPERTY,
															[
																RELOP => RELOP_NE,
																ULPROPTAG => $propertyIds['taskaccepted'],
																VALUE => true,
															],
														],
														[
															RES_PROPERTY,
															[
																RELOP => RELOP_EQ,
																ULPROPTAG => $propertyIds['taskstate'],
																VALUE => 2,
															],
														],
													],
												],
											],
										],
										[
											RES_OR,
											[
												[
													RES_CONTENT,
													[
														FUZZYLEVEL => FL_PREFIX | FL_IGNORECASE,
														ULPROPTAG => PR_MESSAGE_CLASS,
														VALUE => "IPM.Task.",
													],
												],
												[
													RES_CONTENT,
													[
														FUZZYLEVEL => FL_FULLSTRING | FL_IGNORECASE,
														ULPROPTAG => PR_MESSAGE_CLASS,
														VALUE => "IPM.Task",
													],
												],
											],
										],
									],
								],
							],
						],
					],
				],
			],
		];
	}
}
