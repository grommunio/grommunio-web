<?php
	/**
	 * ResolveNames Module
	 */
	class ResolveNamesModule extends Module
	{
		/**
		 * Constructor
		 */
		function __construct($id, $data)
		{
			parent::__construct($id, $data);
		}

		/**
		 * Executes all the actions in the $data variable.
		 * @return boolean true on success of false on fialure.
		 */
		function execute()
		{
			foreach($this->data as $actionType => $action)
			{
				if(isset($actionType)) {
					try {
						switch($actionType)
						{
							case 'checknames':
								$this->checkNames($action);
								break;
							default:
								$this->handleUnknownActionType($actionType);
						}
					} catch (MAPIException $e) {
						$this->processException($e, $actionType);
					}
				}
			}
		}
		
		/**
		 * Function which checks the names, sent by the client. This function is used
		 * when a user wants to sent an email and want to check the names filled in
		 * by the user in the to, cc and bcc field. This function uses the global
		 * user list of Kopano to check if the names are correct.
		 * @param array $action the action data, sent by the client
		 * @return boolean true on success or false on failure
		 */
		function checkNames($action)
		{
			if(isset($action['resolverequests'])) {
				$data = array();
				$excludeLocalContacts = !empty($action['exclude_local_contacts']) ? $action['exclude_local_contacts'] : false;
				$excludeGABGroups = !empty($action['exclude_gab_groups']) ? $action['exclude_gab_groups'] : false;

				$resolveRequest = $action['resolverequests'];
				if(!is_array($resolveRequest)) {
					$resolveRequest = array($resolveRequest);
				}

				// open addressbook
				// When local contacts need to be excluded we have pass true as the first argument 
				// so we will not have any Contact Providers set on the Addressbook resource.
				$ab = $GLOBALS['mapisession']->getAddressbook($excludeLocalContacts);

				$ab_entryid = mapi_ab_getdefaultdir($ab);
				$ab_dir = mapi_ab_openentry($ab, $ab_entryid);
				$resolveResponse = Array();

				// check names
				foreach($resolveRequest as $query) {
					if (is_array($query) && isset($query['id'])) {
						$responseEntry = Array();
						$responseEntry['id'] = $query['id'];

						if (!empty($query['display_name']) || !empty($query['email_address'])) {
							$responseEntry['result'] = $this->searchAddressBook($ab, $ab_dir, $query, $excludeGABGroups);
							$resolveResponse[] = $responseEntry;
						}
					}
				}

				$data['resolveresponse'] = $resolveResponse;

				$this->addActionData('checknames', $data);
				$GLOBALS['bus']->addData($this->getResponseData());
			}
		}

		/**
		 * This function searches the addressbook specified for users and returns an array with data
		 * Please note that the returning array must be UTF8
		 * 
		 * @param {MAPIAddressbook} $ab The addressbook
		 * @param {MAPIAbContainer} $ab_dir The addressbook container
		 * @param {String} $query The search query, case is ignored
		 * @param {Boolean} $excludeGABGroups flag to exclude groups from resolving
		 */
		function searchAddressBook($ab, $ab_dir, $query, $excludeGABGroups)
		{
			// Prefer resolving the email_address. This allows the user
			// to resolve recipients with a display name that matches a ZARAFA
			// user with an alternative (external) email address.
			$searchstr = empty($query['email_address']) ? $query['display_name'] : $query['email_address'];
			// If the address_type is 'ZARAFA' then we are resolving something which must be found in
			// the GAB as an exact match. So add the flag EMS_AB_ADDRESS_LOOKUP to ensure we will not
			// get multiple results when multiple items have a partial match.
			$flags = $query['address_type'] === 'ZARAFA' ? EMS_AB_ADDRESS_LOOKUP : 0;

			try {
				// First, try an addressbook lookup
				$rows = mapi_ab_resolvename($ab, array ( array(PR_DISPLAY_NAME => $searchstr) ) , $flags);
			} catch (MAPIException $e) {
				if ($e->getCode() == MAPI_E_AMBIGUOUS_RECIP) {
					// Ambiguous, show possiblities:
					$table = mapi_folder_getcontentstable($ab_dir, MAPI_DEFERRED_ERRORS);
					$restriction = $this->getAmbigiousContactRestriction($searchstr, $excludeGABGroups, PR_ACCOUNT);

					mapi_table_restrict($table, $restriction, TBL_BATCH);
					mapi_table_sort($table, array(PR_DISPLAY_NAME => TABLE_SORT_ASCEND), TBL_BATCH);

					$rows = mapi_table_queryallrows($table, array(PR_ACCOUNT, PR_ADDRTYPE, PR_DISPLAY_NAME, PR_ENTRYID, PR_SEARCH_KEY, PR_OBJECT_TYPE, PR_SMTP_ADDRESS, PR_DISPLAY_TYPE_EX, PR_EMAIL_ADDRESS, PR_OBJECT_TYPE, PR_DISPLAY_TYPE));

					$rows = array_merge($rows, $this->getAmbigiousContactResolveResults($ab, $searchstr, $excludeGABGroups));
				} else if ($e->getCode() == MAPI_E_NOT_FOUND) {
					$rows = array();
					// If we still can't find anything, and we were searching for a SMTP user
					// we can generate a oneoff entry which contains the information of the user.
					if ($query['address_type'] === 'SMTP' && !empty($query['email_address'])) {
						$rows[] = array(
							PR_ENTRYID => mapi_createoneoff($query['display_name'], 'SMTP', $query['email_address'])
						);
					}
				} else {
					// all other errors should be propagated to higher level exception handlers
					throw $e;
				}
			}

			$items = array();
			if ($rows) {
				foreach($rows as $user_data) {
					$item = array();

					if (!isset($user_data[PR_ACCOUNT])) {
						$abitem = mapi_ab_openentry($ab, $user_data[PR_ENTRYID]);
						$user_data = mapi_getprops($abitem, array(PR_ACCOUNT, PR_ADDRTYPE, PR_DISPLAY_NAME, PR_DISPLAY_TYPE_EX, PR_ENTRYID, PR_SEARCH_KEY, PR_EMAIL_ADDRESS, PR_SMTP_ADDRESS, PR_OBJECT_TYPE, PR_DISPLAY_TYPE));
					}

					if($excludeGABGroups && $user_data[PR_OBJECT_TYPE] === MAPI_DISTLIST) {
						// exclude groups from result
						continue;
					}

					$item = array();
					$item['object_type'] = isset($user_data[PR_OBJECT_TYPE]) ? $user_data[PR_OBJECT_TYPE] : MAPI_MAILUSER;
					$item['entryid'] = isset($user_data[PR_ENTRYID]) ? bin2hex($user_data[PR_ENTRYID]) : '';
					$item['display_name'] = isset($user_data[PR_DISPLAY_NAME]) ? $user_data[PR_DISPLAY_NAME] : '';
					$item['display_type'] = isset($user_data[PR_DISPLAY_TYPE]) ? $user_data[PR_DISPLAY_TYPE] : DT_MAILUSER;

					// Test whether the GUID in the entryid is from the Contact Provider
					if($GLOBALS['entryid']->hasContactProviderGUID($item['entryid'])){
						// The properties for a Distribution List differs from the other objects
						if($item['object_type'] == MAPI_DISTLIST) {
							$item['address_type'] = 'MAPIPDL';
							// The email_address is empty for DistList, using display name for resolving
							$item['email_address'] = $item['display_name'];
							$item['smtp_address'] = isset($item['smtp_address']) ? $item['smtp_address']: '';
						}else{
							$item['address_type'] = 'ZARAFA';
							if (isset($user_data['address_type']) && $user_data['address_type'] === 'ZARAFA') {
								$item['email_address'] = isset($user_data[PR_EMAIL_ADDRESS]) ? $user_data[PR_EMAIL_ADDRESS] : '';
							} else {
								// Fake being an ZARAFA account, since it's actually an SMTP addrtype the email address is in a different property.
								$item['smtp_address'] = isset($user_data[PR_EMAIL_ADDRESS]) ? $user_data[PR_EMAIL_ADDRESS] : '';
								// Keep the old scenario happy.
								$item['email_address'] = isset($user_data[PR_EMAIL_ADDRESS]) ? $user_data[PR_EMAIL_ADDRESS] : '';
							}
						}
					// It can be considered a GAB entry
					} else {
						$item['user_name'] = isset($user_data[PR_ACCOUNT]) ? $user_data[PR_ACCOUNT] : $item['display_name'];
						$item['display_type_ex'] = isset($user_data[PR_DISPLAY_TYPE_EX]) ? $user_data[PR_DISPLAY_TYPE_EX] : MAPI_MAILUSER;
						$item['email_address'] = isset($user_data[PR_EMAIL_ADDRESS]) ? $user_data[PR_EMAIL_ADDRESS] : '';
						$item['smtp_address'] = isset($user_data[PR_SMTP_ADDRESS]) ? $user_data[PR_SMTP_ADDRESS] : $item['email_address'];
						$item['address_type'] = isset($user_data[PR_ADDRTYPE]) ? $user_data[PR_ADDRTYPE] : 'SMTP';
					}

					if (isset($user_data[PR_SEARCH_KEY])) {
						$item['search_key'] = bin2hex($user_data[PR_SEARCH_KEY]);
					} else {
						$emailAddress = isset($item['smtp_address']) ? $item['smtp_address'] : $item['email_address'];
						$item['search_key'] = bin2hex(strtoupper($item['address_type'] . ':' . $emailAddress)) . '00';
					}

					array_push($items, $item);
				}
			}
			
			return $items;
		}

		/**
		 * Used to find multiple entries from the contact folders in the Addressbook when resolving 
		 * returned an ambigious result. It will find the Contact folders in the Addressbook and 
		 * apply a restriction to extract the entries.
		 * @param {MAPIAddressbook} $ab The addressbook
		 * @param {String} $query The search query, case is ignored
		 * @param {Boolean} $excludeGABGroups flag to exclude groups from resolving
		 */
		function getAmbigiousContactResolveResults($ab, $query, $excludeGABGroups)
		{
			/* We need to look for the Contact folders at the bottom of the following tree.
			* 
			 * IAddrBook
			 *  - Root Container
			 *     - HIERARCHY TABLE
			 *        - Kopano Contacts Folders    (Contact Container)
			 *           - HIERARCHY TABLE         (Contact Container Hierarchy)
			 *              - Contact folder 1
			 *              - Contact folder 2
			 **/

			$rows = Array();
			$contactFolderRestriction = $this->getAmbigiousContactRestriction($query, $excludeGABGroups, PR_EMAIL_ADDRESS);
			// Open the AB Root Container by not supplying an entryid
			$abRootContainer = mapi_ab_openentry($ab);

			// Get the 'Kopano Contact Folders'
			$hierarchyTable = mapi_folder_gethierarchytable($abRootContainer, MAPI_DEFERRED_ERRORS);
			$abHierarchyRows = mapi_table_queryallrows($hierarchyTable, array(PR_AB_PROVIDER_ID, PR_ENTRYID));

			// Look for the 'Kopano Contacts Folders'
			for($i=0,$len=count($abHierarchyRows);$i<$len;$i++){
				// Check if the folder matches the Contact Provider GUID
				if($abHierarchyRows[$i][PR_AB_PROVIDER_ID] == MUIDZCSAB){
					$abContactContainerEntryid = $abHierarchyRows[$i][PR_ENTRYID];
					break;
				}
			}

			// Next go into the 'Kopano Contacts Folders' and look in the hierarchy table for the Contact folders.
			if($abContactContainerEntryid){
				// Get the rows from hierarchy table of the 'Kopano Contacts Folders'
				$abContactContainer = mapi_ab_openentry($ab, $abContactContainerEntryid);
				$abContactContainerHierarchyTable = mapi_folder_gethierarchytable($abContactContainer, MAPI_DEFERRED_ERRORS);
				$abContactContainerHierarchyRows = mapi_table_queryallrows($abContactContainerHierarchyTable, array(PR_DISPLAY_NAME, PR_OBJECT_TYPE, PR_ENTRYID));

				// Loop through all the contact folders found under the 'Kopano Contacts Folders' hierarchy
				for($j=0,$len=count($abContactContainerHierarchyRows);$j<$len;$j++){
					
					// Open, get contents table, restrict, sort and then merge the result in the list of $rows
					$abContactFolder = mapi_ab_openentry($ab, $abContactContainerHierarchyRows[$j][PR_ENTRYID]);
					$abContactFolderTable = mapi_folder_getcontentstable($abContactFolder, MAPI_DEFERRED_ERRORS);
					
					mapi_table_restrict($abContactFolderTable, $contactFolderRestriction, TBL_BATCH);
					mapi_table_sort($abContactFolderTable, array(PR_DISPLAY_NAME => TABLE_SORT_ASCEND), TBL_BATCH);

					// Go go gadget, merge!
					$rows = array_merge($rows, mapi_table_queryallrows($abContactFolderTable, array(PR_ACCOUNT, PR_DISPLAY_NAME, PR_ENTRYID, PR_OBJECT_TYPE, PR_SMTP_ADDRESS, PR_DISPLAY_TYPE_EX, PR_EMAIL_ADDRESS, PR_OBJECT_TYPE, PR_DISPLAY_TYPE)));
				}
			}

			return $rows;
		}

		/**
		 * Setup the restriction used for resolving in the Contact folders or GAB.
		 * @param {String} $query The search query, case is ignored
		 * @param {Boolean} $excludeGABGroups flag to exclude groups from resolving
		 * @param {Number} $content the PROPTAG to search in.
		 */
		function getAmbigiousContactRestriction($query, $excludeGABGroups, $content)
		{
			// only return users from who the displayName or the username starts with $name
			// TODO: use PR_ANR for this restriction instead of PR_DISPLAY_NAME and $content.
			$resAnd = array(
				array(RES_OR, 
					array(
						array(RES_CONTENT,
							array(
								FUZZYLEVEL => FL_PREFIX | FL_IGNORECASE,
								ULPROPTAG => PR_DISPLAY_NAME,
								VALUE => $query
							)
						),
						array(RES_CONTENT,
							array(
								FUZZYLEVEL => FL_PREFIX | FL_IGNORECASE,
								ULPROPTAG => $content,
								VALUE => $query
							)
						)
					) // RES_OR
				)
			);

			// create restrictions based on excludeGABGroups flag
			if($excludeGABGroups) {
				array_push($resAnd, array(
					RES_PROPERTY,
					array(
						RELOP => RELOP_EQ,
						ULPROPTAG => PR_OBJECT_TYPE,
						VALUE => MAPI_MAILUSER
					)
				));
			} else {
				array_push($resAnd, array(RES_OR,
					array(
						array(RES_PROPERTY,
							array(
								RELOP => RELOP_EQ,
								ULPROPTAG => PR_OBJECT_TYPE,
								VALUE => MAPI_MAILUSER
							)
						),
						array(RES_PROPERTY,
							array(
								RELOP => RELOP_EQ,
								ULPROPTAG => PR_OBJECT_TYPE,
								VALUE => MAPI_DISTLIST
							)
						)
					)
				));
			}
			$restriction = array(RES_AND, $resAnd);

			return $restriction;
		}

		/**
		 * Function does customization of exception based on module data.
		 * like, here it will generate display message based on actionType
		 * for particular exception.
		 * 
		 * @param object $e Exception object
		 * @param string $actionType the action type, sent by the client
		 * @param MAPIobject $store Store object of message.
		 * @param string $parententryid parent entryid of the message.
		 * @param string $entryid entryid of the message.
		 * @param array $action the action data, sent by the client
		 */
		function handleException(&$e, $actionType = null, $store = null, $parententryid = null, $entryid = null, $action = null)
		{
			if(is_null($e->displayMessage)) {
				switch($actionType)
				{
					case 'checknames':
						if($e->getCode() == MAPI_E_NO_ACCESS) {
							$e->setDisplayMessage(_('You have insufficient privileges to perform this action.'));
						} else {
							$e->setDisplayMessage(_('Could not resolve user.'));
						}
						break;
				}
			}

			parent::handleException($e, $actionType, $store, $parententryid, $entryid, $action);
		}
	}
?>
