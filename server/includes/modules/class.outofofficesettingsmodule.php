<?php
    /**
     * OutOfOfficeSettingsModule Module
     */
    class OutOfOfficeSettingsModule extends Module
    {
        /**
         * Constructor
         * @param int $id unique id.
         * @param array $data list of all actions.
         */
        function __construct($id, $data)
        {
            $this->properties = $GLOBALS["properties"]->getOutOfOfficeProperties();
            parent::__construct($id, $data);
        }

        /**
         * Executes all the actions in the $data variable.
         */
        function execute()
        {
            foreach ($this->data as $actionType => $action) {
                if (isset($actionType)) {
                    try {
                        switch ($actionType) {
                            case "list" :
                               $this->getOofSettings();
                                break;
                            case "save" :
                                $this->saveOofSettings($action);
                                break;
                            default:
                                $this->handleUnknownActionType($actionType);
                        }
                    } catch (SettingsException $e) {
                        $this->processException($e, $actionType);
                    } catch (MAPIException $e) {
                        $this->processException($e, $actionType);
                    }
                 }
            }
        }

        /**
         * Read 'out of office' settings from PR_EC_OUTOFOFFICE_*
         *
         * Internal function to retrieve the 'out of office' settings from the store, these settings are normal properties on the store
         * @access private
         */
        function getOofSettings()
        {
           $otherStores = $this->getOwnerPermissionStores();
           array_push($otherStores, $GLOBALS['mapisession']->getDefaultMessageStore());

           $oofSettings = Array();
           foreach ($otherStores as $storeEntryId => $storeObj) {
               $props = mapi_getprops($storeObj, $this->properties);
               if (!isset($props[PR_EC_OUTOFOFFICE])) {
                   $props[PR_EC_OUTOFOFFICE] = false;
               }
               if (!isset($props[PR_EC_OUTOFOFFICE_MSG])) {
                   $props[PR_EC_OUTOFOFFICE_MSG] = '';
               }
               if (!isset($props[PR_EC_OUTOFOFFICE_SUBJECT])) {
                   $props[PR_EC_OUTOFOFFICE_SUBJECT] = '';
               }
               if (!isset($props[PR_EC_OUTOFOFFICE_FROM])) {
                   $props[PR_EC_OUTOFOFFICE_FROM] = 0;
               }
               if (!isset($props[PR_EC_OUTOFOFFICE_UNTIL])) {
                   $props[PR_EC_OUTOFOFFICE_UNTIL] = 0;
               }

               $externalProps['props']['entryid'] = bin2hex($props[PR_MAILBOX_OWNER_ENTRYID]);
               $externalProps['props']['store_entryid'] = bin2hex($props[PR_ENTRYID]);
               $externalProps['props']['set'] = $props[PR_EC_OUTOFOFFICE];
               $externalProps['props']['message'] = $props[PR_EC_OUTOFOFFICE_MSG];
               $externalProps['props']['subject'] = $props[PR_EC_OUTOFOFFICE_SUBJECT];
               $externalProps['props']['from'] = $props[PR_EC_OUTOFOFFICE_FROM];
               $externalProps['props']['until'] = $props[PR_EC_OUTOFOFFICE_UNTIL];

               array_push($oofSettings, $externalProps);
           }

            // Send success message to client
            $this->addActionData('list', Array('item' => $oofSettings));

            $GLOBALS["bus"]->addData($this->getResponseData());
        }

        /**
         * Function returns array of user stores who has given 'Owner' permission to logged in user.
         * Internal function to retrieve the shared stores whith 'owner' permission.
         * @access private
         * @return {Array} array of user stores who has given 'owner' permission.
         */
        function getOwnerPermissionStores()
        {
            $stores = $GLOBALS['mapisession']->getOtherUserStore();
            $loggedInUserid = mapi_getprops( $GLOBALS['mapisession']->getDefaultMessageStore(), array(PR_USER_ENTRYID));

            // $sharedOwnerStores array will contains store of users who has given 'owner' permission.
            $sharedOwnerStores = array();

            foreach ($stores as $storeEntryId => $storeObj) {
                $grants = mapi_zarafa_getpermissionrules($storeObj, ACCESS_TYPE_GRANT);

                // Check if user has given 'owner' permission to the logged in user.
                foreach ($grants as $index => $users) {
                    if ($users['userid'] === $loggedInUserid[PR_USER_ENTRYID] && $users['rights'] === ecRightsAll ) {
                        $sharedOwnerStores[$storeEntryId] = $storeObj;
                        break;
                    }
                }
            }

            return $sharedOwnerStores;
        }

        /**
         * Internal function to save the 'out of office' settings to the correct properties on the store.
         * On success function will send 'success' feedback to user.
         *
         * Writes some properties to the PR_EC_OUTOFOFFICE_* properties
         *
         * @param array $action the action data, sent by the client
         * @access private
         */
        function saveOofSettings($action)
        {

            $storeEntryId = $action['store_entryid'];
            $oofSettings = $action['props'];
            $store = $GLOBALS['mapisession']->openMessageStore(hex2bin($storeEntryId));
            $props = Conversion::mapXML2MAPI($this->properties, $oofSettings);

            if  (isset($oofSettings['until'])) {
                // Until is not set, so remove the property else we have to set it to 2999
                if ($oofSettings['until'] === 0) {
                    mapi_deleteprops($store, array($this->properties['until']));
                } else {
                    $props[$this->properties['until']] = $oofSettings['until'];
                }
            }

            if (!empty($props))	{
                mapi_setprops($store, $props);
                mapi_savechanges($store);
            }
            $this->sendFeedback(true);
        }
    }
?>
