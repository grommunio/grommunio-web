<?php

/**
 * ResolveNames Module.
 */
class ResolveNamesModule extends Module {
	/**
	 * Constructor.
	 *
	 * @param mixed $id
	 * @param mixed $data
	 */
	public function __construct($id, $data) {
		parent::__construct($id, $data);
	}

	/**
	 * Executes all the actions in the $data variable.
	 */
	public function execute() {
		foreach ($this->data as $actionType => $action) {
			if (isset($actionType)) {
				try {
					match ($actionType) {
                        'checknames' => $this->checkNames($action),
                        default => $this->handleUnknownActionType($actionType),
                    };
				}
				catch (MAPIException $e) {
					$this->processException($e, $actionType);
				}
			}
		}
	}

	/**
	 * Function which checks the names, sent by the client. This function is used
	 * when a user wants to sent an email and want to check the names filled in
	 * by the user in the to, cc and bcc field. This function uses the global
	 * user list to check if the names are correct.
	 *
	 * @param array $action the action data, sent by the client
	 */
	public function checkNames($action) {
		if (isset($action['resolverequests'])) {
			$data = [];
			$excludeLocalContacts = $action['exclude_local_contacts'] ?? false;
			$excludeGABGroups = $action['exclude_gab_groups'] ?? false;
			$resolveRequest = $action['resolverequests'];
			if (!is_array($resolveRequest)) {
				$resolveRequest = [$resolveRequest];
			}

			// open addressbook
			// When local contacts need to be excluded we have pass true as the first argument
			// so we will not have any Contact Providers set on the Addressbook resource.
			$ab = $GLOBALS['mapisession']->getAddressbook($excludeLocalContacts);

			$ab_dir = mapi_ab_openentry($ab);
			$resolveResponse = [];

			// check names
			foreach ($resolveRequest as $query) {
				if (is_array($query) && isset($query['id'])) {
					$responseEntry = [];
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
	 * Please note that the returning array must be UTF8.
	 *
	 * @param resource $ab               The addressbook
	 * @param resource $ab_dir           The addressbook container
	 * @param string   $query            The search query, case is ignored
	 * @param bool     $excludeGABGroups flag to exclude groups from resolving
	 */
	public function searchAddressBook($ab, $ab_dir, $query, $excludeGABGroups) {
		// Prefer resolving the email_address. This allows the user
		// to resolve recipients with a display name that matches a EX
		// user with an alternative (external) email address.
		$searchstr = empty($query['email_address']) ? $query['display_name'] : $query['email_address'];
		// If the address_type is 'EX' then we are resolving something which must be found in
		// the GAB as an exact match. So add the flag EMS_AB_ADDRESS_LOOKUP to ensure we will not
		// get multiple results when multiple items have a partial match.
		$flags = $query['address_type'] === 'EX' ? EMS_AB_ADDRESS_LOOKUP : 0;

		try {
			// First, try an addressbook lookup
			$rows = mapi_ab_resolvename($ab, [[PR_DISPLAY_NAME => $searchstr]], $flags);
			$this->searchContactsFolders($ab, $ab_dir, $searchstr, $rows);
		}
		catch (MAPIException $e) {
			if ($e->getCode() == MAPI_E_AMBIGUOUS_RECIP) {
				$ab_entryid = mapi_ab_getdefaultdir($ab);
				$ab_dir = mapi_ab_openentry($ab, $ab_entryid);
				// Ambiguous, show possibilities:
				$table = mapi_folder_getcontentstable($ab_dir, MAPI_DEFERRED_ERRORS);
				$restriction = $this->getAmbigiousContactRestriction($searchstr, $excludeGABGroups, PR_ACCOUNT);

				mapi_table_restrict($table, $restriction, TBL_BATCH);
				mapi_table_sort($table, [PR_DISPLAY_NAME => TABLE_SORT_ASCEND], TBL_BATCH);

				$rows = mapi_table_queryallrows($table, [PR_ACCOUNT, PR_ADDRTYPE, PR_DISPLAY_NAME, PR_ENTRYID, PR_SEARCH_KEY, PR_OBJECT_TYPE, PR_SMTP_ADDRESS, PR_DISPLAY_TYPE_EX, PR_EMAIL_ADDRESS, PR_OBJECT_TYPE, PR_DISPLAY_TYPE]);

				$rows = array_merge($rows, $this->getAmbigiousContactResolveResults($ab, $searchstr, $excludeGABGroups));
			}
			elseif ($e->getCode() == MAPI_E_NOT_FOUND) {
				$rows = [];
				if ($query['address_type'] === 'SMTP') {
					// If we still can't find anything, and we were searching for a SMTP user
					// we can generate a oneoff entry which contains the information of the user.
					if (!empty($query['email_address'])) {
						$rows[] = [
							PR_ACCOUNT => $query['email_address'], PR_ADDRTYPE => 'SMTP', PR_EMAIL_ADDRESS => $query['email_address'],
							PR_DISPLAY_NAME => $query['display_name'], PR_DISPLAY_TYPE_EX => DT_REMOTE_MAILUSER, PR_DISPLAY_TYPE => DT_MAILUSER,
							PR_SMTP_ADDRESS => $query['email_address'], PR_OBJECT_TYPE => MAPI_MAILUSER,
							PR_ENTRYID => mapi_createoneoff($query['display_name'], 'SMTP', $query['email_address']),
						];
					}
					// Check also the user's contacts folders
					else {
						$this->searchContactsFolders($ab, $ab_dir, $searchstr, $rows);
					}
				}
			}
			else {
				// all other errors should be propagated to higher level exception handlers
				throw $e;
			}
		}

		$items = [];
		if ($rows) {
			foreach ($rows as $user_data) {
				$item = [];

				if (!isset($user_data[PR_ACCOUNT])) {
					$abitem = mapi_ab_openentry($ab, $user_data[PR_ENTRYID]);
					$user_data = mapi_getprops($abitem, [PR_ACCOUNT, PR_ADDRTYPE, PR_DISPLAY_NAME, PR_DISPLAY_TYPE_EX, PR_ENTRYID, PR_SEARCH_KEY, PR_EMAIL_ADDRESS, PR_SMTP_ADDRESS, PR_OBJECT_TYPE, PR_DISPLAY_TYPE]);
				}

				if ($excludeGABGroups && $user_data[PR_OBJECT_TYPE] === MAPI_DISTLIST) {
					// exclude groups from result
					continue;
				}

				$item = [];
				$item['object_type'] = $user_data[PR_OBJECT_TYPE] ?? MAPI_MAILUSER;
				$item['entryid'] = isset($user_data[PR_ENTRYID]) ? bin2hex($user_data[PR_ENTRYID]) : '';
				$item['display_name'] = $user_data[PR_DISPLAY_NAME] ?? '';
				$item['display_type'] = $user_data[PR_DISPLAY_TYPE] ?? DT_MAILUSER;

				// Test whether the GUID in the entryid is from the Contact Provider
				if ($GLOBALS['entryid']->hasContactProviderGUID($item['entryid'])) {
					// The properties for a Distribution List differs from the other objects
					if ($item['object_type'] == MAPI_DISTLIST) {
						$item['address_type'] = 'MAPIPDL';
						// The email_address is empty for DistList, using display name for resolving
						$item['email_address'] = $item['display_name'];
						$item['smtp_address'] = $item['smtp_address'] ?? '';
					}
					else {
						$item['address_type'] = $user_data[PR_ADDRTYPE] ?? 'SMTP';
						if (isset($user_data['address_type']) && $user_data['address_type'] === 'EX') {
							$item['email_address'] = $user_data[PR_EMAIL_ADDRESS] ?? '';
						}
						else {
							// Fake being an EX account, since it's actually an SMTP addrtype the email address is in a different property.
							$item['smtp_address'] = $user_data[PR_EMAIL_ADDRESS] ?? '';
							// Keep the old scenario happy.
							$item['email_address'] = $user_data[PR_EMAIL_ADDRESS] ?? '';
						}
					}
				// It can be considered a GAB entry
				}
				else {
					$item['user_name'] = $user_data[PR_ACCOUNT] ?? $item['display_name'];
					$item['display_type_ex'] = $user_data[PR_DISPLAY_TYPE_EX] ?? MAPI_MAILUSER;
					$item['email_address'] = $user_data[PR_EMAIL_ADDRESS] ?? '';
					$item['smtp_address'] = $user_data[PR_SMTP_ADDRESS] ?? $item['email_address'];
					$item['address_type'] = $user_data[PR_ADDRTYPE] ?? 'SMTP';
				}

				if (isset($user_data[PR_SEARCH_KEY])) {
					$item['search_key'] = bin2hex($user_data[PR_SEARCH_KEY]);
				}
				else {
					$emailAddress = $item['smtp_address'] ?? $item['email_address'];
					$item['search_key'] = bin2hex(strtoupper($item['address_type'] . ':' . $emailAddress)) . '00';
				}

				array_push($items, $item);
			}
		}

		return $items;
	}

	/**
	 * Used to find multiple entries from the contact folders in the Addressbook when resolving
	 * returned an ambiguous result. It will find the Contact folders in the Addressbook and
	 * apply a restriction to extract the entries.
	 *
	 * @param resource $ab               The addressbook
	 * @param string   $query            The search query, case is ignored
	 * @param bool     $excludeGABGroups flag to exclude groups from resolving
	 */
	public function getAmbigiousContactResolveResults($ab, $query, $excludeGABGroups) {
		/* We need to look for the Contact folders at the bottom of the following tree.
		*
		 * IAddrBook
		 *  - Root Container
		 *     - HIERARCHY TABLE
		 *        - Contacts Folders    (Contact Container)
		 *           - HIERARCHY TABLE         (Contact Container Hierarchy)
		 *              - Contact folder 1
		 *              - Contact folder 2
		 */

		$rows = [];
		$contactFolderRestriction = $this->getAmbigiousContactRestriction($query, $excludeGABGroups, PR_EMAIL_ADDRESS);
		// Open the AB Root Container by not supplying an entryid
		$abRootContainer = mapi_ab_openentry($ab);

		// Get the 'Contact Folders'
		$hierarchyTable = mapi_folder_gethierarchytable($abRootContainer, MAPI_DEFERRED_ERRORS);
		$abHierarchyRows = mapi_table_queryallrows($hierarchyTable, [PR_AB_PROVIDER_ID, PR_ENTRYID]);

		// Look for the 'Contacts Folders'
		for ($i = 0,$len = count($abHierarchyRows); $i < $len; ++$i) {
			// Check if the folder matches the Contact Provider GUID
			if ($abHierarchyRows[$i][PR_AB_PROVIDER_ID] == MUIDZCSAB) {
				$abContactContainerEntryid = $abHierarchyRows[$i][PR_ENTRYID];
				break;
			}
		}

		// Next go into the 'Contacts Folders' and look in the hierarchy table for the Contact folders.
		if ($abContactContainerEntryid) {
			// Get the rows from hierarchy table of the 'Contacts Folders'
			$abContactContainer = mapi_ab_openentry($ab, $abContactContainerEntryid);
			$abContactContainerHierarchyTable = mapi_folder_gethierarchytable($abContactContainer, MAPI_DEFERRED_ERRORS);
			$abContactContainerHierarchyRows = mapi_table_queryallrows($abContactContainerHierarchyTable, [PR_DISPLAY_NAME, PR_OBJECT_TYPE, PR_ENTRYID]);

			// Loop through all the contact folders found under the 'Contacts Folders' hierarchy
			for ($j = 0,$len = count($abContactContainerHierarchyRows); $j < $len; ++$j) {
				// Open, get contents table, restrict, sort and then merge the result in the list of $rows
				$abContactFolder = mapi_ab_openentry($ab, $abContactContainerHierarchyRows[$j][PR_ENTRYID]);
				$abContactFolderTable = mapi_folder_getcontentstable($abContactFolder, MAPI_DEFERRED_ERRORS);

				mapi_table_restrict($abContactFolderTable, $contactFolderRestriction, TBL_BATCH);
				mapi_table_sort($abContactFolderTable, [PR_DISPLAY_NAME => TABLE_SORT_ASCEND], TBL_BATCH);

				// Go go gadget, merge!
				$rows = array_merge($rows, mapi_table_queryallrows($abContactFolderTable, [PR_ACCOUNT, PR_DISPLAY_NAME, PR_ENTRYID, PR_OBJECT_TYPE, PR_SMTP_ADDRESS, PR_DISPLAY_TYPE_EX, PR_EMAIL_ADDRESS, PR_OBJECT_TYPE, PR_DISPLAY_TYPE]));
			}
		}

		return $rows;
	}

	/**
	 * Setup the restriction used for resolving in the Contact folders or GAB.
	 *
	 * @param string $query            The search query, case is ignored
	 * @param bool   $excludeGABGroups flag to exclude groups from resolving
	 * @param int    $content          the PROPTAG to search in
	 */
	public function getAmbigiousContactRestriction($query, $excludeGABGroups, $content) {
		// only return users from who the displayName or the username starts with $name
		// TODO: use PR_ANR for this restriction instead of PR_DISPLAY_NAME and $content.
		$resAnd = [
			[RES_OR,
				[
					[RES_CONTENT,
						[
							FUZZYLEVEL => FL_PREFIX | FL_IGNORECASE,
							ULPROPTAG => PR_DISPLAY_NAME,
							VALUE => $query,
						],
					],
					[RES_CONTENT,
						[
							FUZZYLEVEL => FL_PREFIX | FL_IGNORECASE,
							ULPROPTAG => $content,
							VALUE => $query,
						],
					],
				], // RES_OR
			],
		];

		// create restrictions based on excludeGABGroups flag
		if ($excludeGABGroups) {
			array_push($resAnd, [
				RES_PROPERTY,
				[
					RELOP => RELOP_EQ,
					ULPROPTAG => PR_OBJECT_TYPE,
					VALUE => MAPI_MAILUSER,
				],
			]);
		}
		else {
			array_push($resAnd, [RES_OR,
				[
					[RES_PROPERTY,
						[
							RELOP => RELOP_EQ,
							ULPROPTAG => PR_OBJECT_TYPE,
							VALUE => MAPI_MAILUSER,
						],
					],
					[RES_PROPERTY,
						[
							RELOP => RELOP_EQ,
							ULPROPTAG => PR_OBJECT_TYPE,
							VALUE => MAPI_DISTLIST,
						],
					],
				],
			]);
		}

		return [RES_AND, $resAnd];
	}

	/**
	 * Function does customization of exception based on module data.
	 * like, here it will generate display message based on actionType
	 * for particular exception.
	 *
	 * @param object     $e             Exception object
	 * @param string     $actionType    the action type, sent by the client
	 * @param MAPIobject $store         store object of message
	 * @param string     $parententryid parent entryid of the message
	 * @param string     $entryid       entryid of the message
	 * @param array      $action        the action data, sent by the client
	 */
	public function handleException(&$e, $actionType = null, $store = null, $parententryid = null, $entryid = null, $action = null) {
		if (is_null($e->displayMessage)) {
			switch ($actionType) {
				case 'checknames':
					if ($e->getCode() == MAPI_E_NO_ACCESS) {
						$e->setDisplayMessage(_('You have insufficient privileges to perform this action.'));
					}
					else {
						$e->setDisplayMessage(_('Could not resolve user.'));
					}
					break;
			}
		}

		parent::handleException($e, $actionType, $store, $parententryid, $entryid, $action);
	}

	/**
	 * This function searches the private contact folders for users and returns an array with data.
	 * Please note that the returning array must be UTF8.
	 *
	 * @param resource $ab        The addressbook
	 * @param resource $ab_dir    The addressbook container
	 * @param string   $searchstr The search query, case is ignored
	 * @param array    $rows      Array of the found contacts
	 */
	public function searchContactsFolders($ab, $ab_dir, $searchstr, &$rows) {
		$abhtable = mapi_folder_gethierarchytable($ab_dir, MAPI_DEFERRED_ERRORS | CONVENIENT_DEPTH);
		$abcntfolders = mapi_table_queryallrows($abhtable, [PR_ENTRYID, PR_AB_PROVIDER_ID]);
		$restriction = [
			RES_CONTENT,
			[
				FUZZYLEVEL => FL_SUBSTRING | FL_IGNORECASE,
				ULPROPTAG => PR_DISPLAY_NAME,
				VALUE => [PR_DISPLAY_NAME => $searchstr],
			],
		];
		// restriction on hierarchy table for PR_AB_PROVIDER_ID
		// seems not to work, just loop through
		foreach ($abcntfolders as $abcntfolder) {
			if ($abcntfolder[PR_AB_PROVIDER_ID] == ZARAFA_CONTACTS_GUID) {
				$abfldentry = mapi_ab_openentry($ab, $abcntfolder[PR_ENTRYID]);
				$abfldcontents = mapi_folder_getcontentstable($abfldentry);
				mapi_table_restrict($abfldcontents, $restriction);
				$r = mapi_table_queryallrows($abfldcontents, [PR_ACCOUNT, PR_ADDRTYPE, PR_DISPLAY_NAME, PR_ENTRYID,
					PR_SEARCH_KEY, PR_OBJECT_TYPE, PR_SMTP_ADDRESS, PR_DISPLAY_TYPE_EX, PR_EMAIL_ADDRESS,
					PR_OBJECT_TYPE, PR_DISPLAY_TYPE]);
				if (is_array($r) && !empty($r)) {
					$rows = array_merge($rows, $r);
				}
			}
		}
	}
}
