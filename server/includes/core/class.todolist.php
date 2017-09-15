<?php

/**
 * This class contains the functionality for the To-do list.
 * Since there is only one To-do list this class will be a singleton.
 */
class TodoList {
    /**
     * The entryid of the Todo-list search folder. TodoList::getEntryId will retrieve it
     * if it isn't yet.
     * @var String
     */
    static private $_entryId = false;

    /**
     * Returns the entryid of the To-do list search folder
     * @return String The entryid of the To-do list search folder
     */
    public static function getEntryId() {
        if ( !TodoList::$_entryId ){
            TodoList::_retrieveEntryId();
        }

        return TodoList::$_entryId;
    }

    /**
     * Retrieves the entryid of the To-do list from the property PR_ADDITIONAL_REN_ENTRYIDS_EX
     * of the user store. Will create a new to-do search folder if it does not yet exist.
     * @see https://msdn.microsoft.com/en-us/library/office/cc842311.aspx
     *
     * @return {String|Boolean} The entryid of the Todo-list search folder
     */
    private static function _retrieveEntryId() {
        $userStore = $GLOBALS['mapisession']->getDefaultMessageStore();

        $root = mapi_msgstore_openentry($userStore, null);
        $rootProperties = mapi_getprops($root, array(PR_ADDITIONAL_REN_ENTRYIDS_EX));
        $additionalRenEntryidsEx = $rootProperties[PR_ADDITIONAL_REN_ENTRYIDS_EX];

		$headerFormat = 'Sid/Ssize';
		while ( strlen($additionalRenEntryidsEx) > 0 ){
			$header = unpack($headerFormat, substr($additionalRenEntryidsEx, 0, 4));
			$additionalRenEntryidsEx = substr($additionalRenEntryidsEx, 4);

			if ( $header['id'] === PERSIST_SENTINEL ){
				// We found the end block
				break;
			}

			// We're only interested in the entryid of the to-do search folder
			if ( $header['id'] === RSF_PID_TODO_SEARCH ){
    			// Now read the PersistElementBlock
    			$dataHeader = unpack($headerFormat, substr($additionalRenEntryidsEx, 0, 4));
                TodoList::$_entryId = substr($additionalRenEntryidsEx, 4, $dataHeader['size']);
                return TodoList::$_entryId;
			}

			$additionalRenEntryidsEx = substr($additionalRenEntryidsEx, $header['size']);
		}

        if ( !TodoList::$_entryId ){
            TodoList::createTodoSearchFolder();
        }

        return TodoList::$_entryId;
    }

    /**
     * Creates a search folder for the To-do list under the root folder of the store. Adds the entryid
     * to the PR_ADDITIONAL_REN_ENTRYIDS_EX property of the root folder, and also stores it in TodoList::$_entryId
     *
     * @return String Entryid of the new search folder for the To-do list
     */
    public static function createTodoSearchFolder() {
        $userStore = $GLOBALS['mapisession']->getDefaultMessageStore();
        $root = mapi_msgstore_openentry($userStore, null);
        $props = mapi_getprops($userStore, array(PR_IPM_SUBTREE_ENTRYID));
        $ipmSubTreeEntryId = $props[PR_IPM_SUBTREE_ENTRYID];
        $entryid = false;

        try {
            if ( $resource = mapi_folder_createfolder($root, 'To-do Search (WebApp)', null, OPEN_IF_EXISTS, FOLDER_SEARCH) ){
                mapi_setprops($resource, array(PR_CONTAINER_CLASS => 'IPF.Task'));
                mapi_folder_setsearchcriteria($resource, TodoList::_createRestriction(), array($ipmSubTreeEntryId), RECURSIVE_SEARCH);

                $props = mapi_getprops($resource, array(PR_ENTRYID));
                $entryid = $props[PR_ENTRYID];
            }
        } catch (MAPIException $e) {
            // don't propogate the event to higher level exception handlers
            $e->setHandled();
        }

        if ( !$entryid ){
            return false;
        }

        // Now add the entryid to the PR_ADDITIONAL_REN_ENTRYIDS_EX property of the store root
        $rootProperties = mapi_getprops($root, array(PR_ADDITIONAL_REN_ENTRYIDS_EX));
        $additionalRenEntryidsEx = $rootProperties[PR_ADDITIONAL_REN_ENTRYIDS_EX];

		$dataHeader = pack('SS', RSF_ELID_ENTRYID, strlen($entryid));
		$dataElement = $dataHeader . $entryid;
        $blockHeader = pack('SS', RSF_PID_TODO_SEARCH, strlen($dataElement));

        // We'll just put it at the beginning of the property, so we don't have to bother with
        // the end block (PERSIST_SENTINEL)
        $additionalRenEntryidsEx = $blockHeader . $dataElement . $additionalRenEntryidsEx;
        try {
            mapi_setprops($root, array(PR_ADDITIONAL_REN_ENTRYIDS_EX => $additionalRenEntryidsEx));
            mapi_savechanges($root);
        } catch (MAPIException $e) {
            // Entryid could not be saved, so don't use it.
            $entryid = false;

            // don't propogate the event to higher level exception handlers
            $e->setHandled();
        }

        if ( $entryid ){
            TodoList::$_entryId = $entryid;
        }

        return $entryid;
    }

    /**
     * Creates the restriction for the To-do list search folder for the currently logged in user. The
     * restriction was 'copied' from Outlook to show exactly the same items in the To-do list.
     *
     * @return Array The restriction for the To-do list search folder for the currently logged in user
     */
    public static function _createRestriction() {
        $userStore = $GLOBALS['mapisession']->getDefaultMessageStore();

        // First get some entryids that we need for the restriction
        $storeProperties = mapi_getprops($userStore, array(PR_IPM_OUTBOX_ENTRYID, PR_IPM_WASTEBASKET_ENTRYID));
        $root = mapi_msgstore_openentry($userStore, null);
        $rootProperties = mapi_getprops($root, array(PR_IPM_DRAFTS_ENTRYID, PR_ADDITIONAL_REN_ENTRYIDS));
        $additionalRenEntryids = $rootProperties[PR_ADDITIONAL_REN_ENTRYIDS];
        $entryIds = array(
            'deletedItems'  => $storeProperties[PR_IPM_WASTEBASKET_ENTRYID],
            'junk'          => $additionalRenEntryids[4],
            'drafts'        => $rootProperties[PR_IPM_DRAFTS_ENTRYID],
            'outbox'        => $storeProperties[PR_IPM_OUTBOX_ENTRYID]
        );

        // Now get some task request properties that we need in the restriction
        $properties = array(
            'taskstate'     => "PT_LONG:PSETID_Task:0x8113",
            'taskaccepted'  => "PT_BOOLEAN:PSETID_Task:0x8108",
            'taskstatus'    => "PT_LONG:PSETID_Task:0x8101"
        );
        $propertyIds = getPropIdsFromStrings($userStore, $properties);

        return array(
            RES_AND,
            array(
                array(
                    RES_AND,
                    array(
                        array(
                            RES_NOT,
                            array(
                                array(
                                    RES_CONTENT,
                                    array(
                                        FUZZYLEVEL    => FL_PREFIX | FL_IGNORECASE,
                                        ULPROPTAG     => PR_MESSAGE_CLASS,
                                        VALUE         => "IPM.Appointment"
                                    )
                                )
                            )
                        ),
                        array(
                            RES_NOT,
                            array(
                                array(
                                    RES_CONTENT,
                                    array(
                                        FUZZYLEVEL  => FL_PREFIX | FL_IGNORECASE,
                                        ULPROPTAG   => PR_MESSAGE_CLASS,
                                        VALUE       => "IPM.Activity"
                                    )
                                )
                            )
                        ),
                        array(
                            RES_NOT,
                            array(
                                array(
                                    RES_CONTENT,
                                    array(
                                        FUZZYLEVEL  => FL_PREFIX | FL_IGNORECASE,
                                        ULPROPTAG   => PR_MESSAGE_CLASS,
                                        VALUE       => "IPM.StickyNote"
                                    )
                                )
                            )
                        )
                    )
                ),
                array(
                    RES_AND,
                    array(
                        array(
                            RES_AND,
                            array(
                                array(
                                    RES_PROPERTY,
                                    array(
                                        RELOP       => RELOP_NE,
                                        ULPROPTAG   => PR_PARENT_ENTRYID,
                                        VALUE       => $entryIds['deletedItems']
                                    )
                                ),
                                array(
                                    RES_PROPERTY,
                                    array(
                                        RELOP       => RELOP_NE,
                                        ULPROPTAG   => PR_PARENT_ENTRYID,
                                        VALUE       => $entryIds['junk']
                                    )
                                ),
                                array(
                                    RES_PROPERTY,
                                    array(
                                        RELOP       => RELOP_NE,
                                        ULPROPTAG   => PR_PARENT_ENTRYID,
                                        VALUE       => $entryIds['drafts']
                                    )
                                ),
                                array(
                                    RES_PROPERTY,
                                    array(
                                        RELOP       => RELOP_NE,
                                        ULPROPTAG   => PR_PARENT_ENTRYID,
                                        VALUE       => $entryIds['outbox']
                                    )
                                ),
                            )
                        ),
                        array(
                            RES_OR,
                            array(
                                array(
                                    RES_OR,
                                    array(
                                        array(
                                            RES_AND,
                                            array(
                                                array(
                                                    RES_OR,
                                                    array(
                                                        array(
                                                            RES_NOT,
                                                            array(
                                                                array(
                                                                    RES_EXIST,
                                                                    array(
                                                                        ULPROPTAG => PR_FLAG_ICON
                                                                    )
                                                                )
                                                            )
                                                        ),
                                                        array(
                                                          RES_PROPERTY,
                                                          array(
                                                            RELOP       => RELOP_EQ,
                                                            ULPROPTAG   => PR_FLAG_ICON,
                                                            VALUE       => 0
                                                            )
                                                        )
                                                    )
                                                ),
                                                array(
                                                    RES_EXIST,
                                                    array(
                                                        ULPROPTAG => PR_FLAG_STATUS
                                                    )
                                                ),
                                                array(
                                                    RES_PROPERTY,
                                                    array(
                                                        RELOP       => RELOP_EQ,
                                                        ULPROPTAG   => PR_FLAG_STATUS,
                                                        VALUE       => 1
                                                    )
                                                )
                                            )
                                        ),
                                        array(
                                            RES_AND,
                                            array(
                                                array(
                                                    RES_PROPERTY,
                                                    array(
                                                        RELOP       => RELOP_EQ,
                                                        ULPROPTAG   => $propertyIds['taskstatus'],
                                                        VALUE       => olTaskComplete
                                                    )
                                                ),
                                                array(
                                                    RES_EXIST,
                                                    array(
                                                        ULPROPTAG => $propertyIds['taskstatus']
                                                    )
                                                )
                                            )
                                        )
                                    )
                                ),
                                array(
                                    RES_AND,
                                    array(
                                        array(
                                            RES_EXIST,
                                            array(
                                                ULPROPTAG  => PR_TODO_ITEM_FLAGS
                                            )
                                        ),
                                        array(
                                            RES_BITMASK,
                                            array(
                                                ULPROPTAG   => PR_TODO_ITEM_FLAGS,
                                                ULTYPE      => BMR_NEZ,
                                                ULMASK      => 1
                                            )
                                        )
                                    )
                                ),
                                array(
                                    RES_AND,
                                    array(
                                        array(
                                            RES_EXIST,
                                            array(
                                                ULPROPTAG => PR_FLAG_ICON
                                            )
                                        ),
                                        array(
                                            RES_PROPERTY,
                                            array(
                                                RELOP       => RELOP_GT,
                                                ULPROPTAG   => PR_FLAG_ICON,
                                                VALUE       => 0
                                            )
                                        )
                                    )
                                ),
                                array(
                                    RES_AND,
                                    array(
                                        array(
                                            RES_NOT,
                                            array(
                                                array(
                                                    RES_AND,
                                                    array(
                                                        array(
                                                            RES_PROPERTY,
                                                            array(
                                                                RELOP => RELOP_NE,
                                                                ULPROPTAG => $propertyIds['taskaccepted'],
                                                                VALUE => true
                                                            )
                                                        ),
                                                        array(
                                                            RES_PROPERTY,
                                                            array(
                                                                RELOP => RELOP_EQ,
                                                                ULPROPTAG => $propertyIds['taskstate'],
                                                                VALUE => 2
                                                            )
                                                        )
                                                    )
                                                )
                                            )
                                        ),
                                        array(
                                            RES_OR,
                                            array(
                                                array(
                                                    RES_CONTENT,
                                                    array(
                                                        FUZZYLEVEL => FL_PREFIX | FL_IGNORECASE,
                                                        ULPROPTAG => PR_MESSAGE_CLASS,
                                                        VALUE => "IPM.Task."
                                                    )
                                                ),
                                                array(
                                                    RES_CONTENT,
                                                    array(
                                                        FUZZYLEVEL => FL_FULLSTRING | FL_IGNORECASE,
                                                        ULPROPTAG => PR_MESSAGE_CLASS,
                                                        VALUE => "IPM.Task"
                                                    )
                                                )
                                            )
                                        )
                                    )
                                )
                            )
                        )
                    )
                )
            )
        );
    }
}
