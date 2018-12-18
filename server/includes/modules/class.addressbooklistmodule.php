<?php
	/**
	 * Addressbook Module
	 */
	class AddressbookListModule extends ListModule
	{
		/**
		 * Constructor
		 * @param int $id unique id.
		 * @param array $data list of all actions.
		 */
		function __construct($id, $data)
		{
			$this->properties = $GLOBALS['properties']->getAddressBookListProperties();

			parent::__construct($id, $data);
		}

		/**
		 * Creates the notifiers for this module,
		 * and register them to the Bus.
		 */
		function createNotifiers()
		{
			$GLOBALS["bus"]->registerNotifier('addressbooknotifier', ADDRESSBOOK_ENTRYID);
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
						$store = $this->getActionStore($action);
						$parententryid = $this->getActionParentEntryID($action);
						$entryid = $this->getActionEntryID($action);

						if(isset($action['subActionType']) && $action['subActionType'] != '') {
							$subActionType = $action['subActionType'];
						}

						switch($actionType)
						{
							case 'list':
								switch($subActionType)
								{
									case 'hierarchy':
										$this->getHierarchy($action);
										break;
									case 'globaladdressbook':
										$this->GABUsers($action, $subActionType);
										break;
									default:
										$this->handleUnknownActionType($actionType);
								}
								break;
							default:
								$this->handleUnknownActionType($actionType);
						}
					} catch (MAPIException $e) {
						$this->processException($e, $actionType, $store, $parententryid, $entryid, $action);
					}
				}
			}
		}

		/**
		 * Function which retrieves the list of system users in Zarafa.
		 * @param object $store MAPI Message Store Object
		 * @param array $action the action data, sent by the client
		 * @param string $actionType the action type, sent by the client
		 * @return boolean true on success or false on failure
		 */
		function GABUsers($action, $actionType)
		{
			$searchstring = '';
			$hide_users = false;
			$hide_groups = false;
			$hide_companies = false;

			if(isset($action['restriction'])) {
				if(isset($action['restriction']['searchstring'])) {
					// Get search string for searching in AB.
					$searchstring = $action['restriction']['searchstring'];
				}

				if(isset($action['restriction']['hide_users'])) {
					$hide_users = $action['restriction']['hide_users'];
				}
				if(isset($action['restriction']['hide_groups'])) {
					$hide_groups = $action['restriction']['hide_groups'];
				}
				if(isset($action['restriction']['hide_companies'])) {
					$hide_companies = $action['restriction']['hide_companies'];
				}
			}

			$items = array();

			$data['page'] = array();
			$data['page']['start'] = 0;
			$data['page']['rowcount'] = 0;
			$data['page']['totalrowcount'] = 0;

			$data = array();

			$this->sort = array();

			$map = array();
			$map['fileas'] = $this->properties['account'];

			// Rewrite the sort info when sorting on full name as this is a combination of multiple fields
			$sortingOnName = false;
			if ( isset($action["sort"]) && is_array($action["sort"]) && count($action["sort"])===1 && $action["sort"][0]["field"]==="full_name" ) {
				$sortingOnName = true;
				$sortingDir = $action["sort"][0]["direction"];
				$action["sort"] = array(
					array(
						"field" 	=> "surname",
						"direction" => $sortingDir
					),
					array(
						"field" 	=> "given_name",
						"direction" => $sortingDir
					),
					array(
						"field" 	=> "middle_name",
						"direction" => $sortingDir
					),
					array(
						"field" 	=> "display_name",
						"direction" => $sortingDir
					),
				);
			}

			// Parse incoming sort order
			$this->parseSortOrder($action, $map, true);

			$folderType = $action['folderType'];

			if (($folderType!=='gab' || !DISABLE_FULL_GAB) || !empty($searchstring)) {
				$ab = $GLOBALS['mapisession']->getAddressbook(false, true);

				if (!empty($action['entryid'])) {
					$entryid = hex2bin($action['entryid']);
				}else{
					$entryid = mapi_ab_getdefaultdir($ab);
				}

				$dir = mapi_ab_openentry($ab,$entryid);

				/**
				 * @TODO: 'All Address Lists' on IABContainer gives MAPI_E_INVALID_PARAMETER,
				 * as it contains subfolders only. When #7344 is fixed, MAPI will return error here,
				 * handle it here and return false.
				 */
				$table = mapi_folder_getcontentstable($dir, MAPI_DEFERRED_ERRORS);

				$restriction = false;
				$tempRestriction = false;
				$userGroupRestriction = false;

				if($hide_users || $hide_groups || $hide_companies) {
					$userRestrictions = array();
					if ($hide_users) {
						$tmp = $this->createUsersRestriction($hide_users);
						if ($tmp) {
							$userRestrictions[] = $tmp;
						}
					}
					if ($hide_groups) {
						$tmp = $this->createGroupsRestriction($hide_groups);
						if ($tmp) {
							$userRestrictions[] = $tmp;
						}
					}
					if ($hide_companies) {
						$tmp = $this->createCompanyRestriction($hide_companies);
						if ($tmp) {
							$userRestrictions[] = $tmp;
						}
					}
					$userGroupRestriction = Array(RES_AND, $userRestrictions);
				}

				if(!empty($searchstring)){
					// create restriction for search
					// only return users from who the displayName or the username starts with $searchstring
					// TODO: use PR_ANR for this restriction instead of PR_DISPLAY_NAME and PR_ACCOUNT
					$tempRestriction = array(RES_OR,
								array(
									// Display name of user from GAB and contacts.
									array(
										RES_CONTENT,
											array(FUZZYLEVEL => FL_SUBSTRING|FL_IGNORECASE,
												ULPROPTAG => PR_DISPLAY_NAME,
												VALUE => $searchstring
											)
										),
									// fileas value of user from GAB.
									array(
										RES_CONTENT,
											array(FUZZYLEVEL => FL_SUBSTRING|FL_IGNORECASE,
												ULPROPTAG => PR_ACCOUNT,
												VALUE => $searchstring
											)
										),
									// smtp_address of user from GAB.
									array(
										RES_CONTENT,
											array(FUZZYLEVEL => FL_SUBSTRING|FL_IGNORECASE,
												ULPROPTAG => PR_SMTP_ADDRESS,
												VALUE => $searchstring
											)
										),
									// email_address of user from GAB and contacts.
									array(
										RES_CONTENT,
											array(FUZZYLEVEL => FL_SUBSTRING|FL_IGNORECASE,
												ULPROPTAG => PR_EMAIL_ADDRESS,
												VALUE => $searchstring
											)
										),
									// department of user from GAB.
									array(
										RES_CONTENT,
											array(FUZZYLEVEL => FL_SUBSTRING|FL_IGNORECASE,
												ULPROPTAG => PR_DEPARTMENT_NAME,
												VALUE => $searchstring
											)
										),
									// fileas of user from Contacts.
									array(
										RES_CONTENT,
											array(FUZZYLEVEL => FL_SUBSTRING|FL_IGNORECASE,
												ULPROPTAG => PR_ORIGINAL_DISPLAY_NAME,
												VALUE => $searchstring
											)
										)
								)
							);
 				}

				if($tempRestriction && $userGroupRestriction) {
					$restriction = Array(
								RES_AND,
								Array(
									$tempRestriction, // restriction for search/alphabet bar
									$userGroupRestriction // restriction for hiding users/groups
					));
				} else if($tempRestriction) {
					$restriction = $tempRestriction;							// restriction for search/alphabet bar
				} else {
					$restriction = $userGroupRestriction;						// restriction for hiding users/groups
				}

				// Only add restriction when it is used
				if($restriction) {
					mapi_table_restrict($table, $restriction, TBL_BATCH);
				}
				mapi_table_sort($table, $this->sort, TBL_BATCH);

				$rows = mapi_table_queryallrows($table, $this->properties);

				for ($i = 0, $len = count($rows); $i < $len; $i++) {
					$user_data = array_shift($rows);

					$item = array();
					$item['entryid'] = bin2hex($user_data[$this->properties['entryid']]);
					$item['display_name'] = $user_data[$this->properties['display_name']];
					$item['object_type'] = $user_data[$this->properties['object_type']];
					$item['display_type'] = $user_data[PR_DISPLAY_TYPE];

					// Test whether the GUID in the entryid is from the Contact Provider
					if($GLOBALS['entryid']->hasContactProviderGUID( bin2hex($user_data[$this->properties['entryid']]) )){
						// Use the original_display_name property to fill in the fileas column
						$item['fileas'] = $user_data[$this->properties['original_display_name']];
						$item['address_type'] = isset($user_data[$this->properties['address_type']]) ? $user_data[$this->properties['address_type']] : 'SMTP';

						switch($user_data[PR_DISPLAY_TYPE]){
							case DT_PRIVATE_DISTLIST:
								$item['email_address'] = '';
								break;
							case DT_MAILUSER:
							default:
								$item['email_address'] = $user_data[$this->properties['email_address']];
						}
					} else {
						// If display_type_ex is not set we can overwrite it with display_type
						$item['display_type_ex'] = isset($user_data[PR_DISPLAY_TYPE_EX])?$user_data[PR_DISPLAY_TYPE_EX]:$user_data[PR_DISPLAY_TYPE];
						$item['fileas'] = $item['display_name'];
						$item['mobile_telephone_number'] = isset($user_data[PR_MOBILE_TELEPHONE_NUMBER])? $user_data[PR_MOBILE_TELEPHONE_NUMBER] : '';
						$item['home_telephone_number'] = isset($user_data[PR_HOME_TELEPHONE_NUMBER])? $user_data[PR_HOME_TELEPHONE_NUMBER] : '';
						$item['pager_telephone_number'] = isset($user_data[PR_PAGER_TELEPHONE_NUMBER])? $user_data[PR_PAGER_TELEPHONE_NUMBER] : '';
						$item['surname'] = isset($user_data[PR_SURNAME])? $user_data[PR_SURNAME] : '';
						$item['given_name'] = isset($user_data[$this->properties['given_name']])? $user_data[$this->properties['given_name']] : '';

						switch($user_data[PR_DISPLAY_TYPE]){
							case DT_ORGANIZATION:
								$item['email_address'] = $user_data[$this->properties['account']];
								$item['address_type'] = 'ZARAFA';
								// The account property is used to fill in the fileas column
								$item['fileas'] = $user_data[$this->properties['account']];
								break;

							case DT_DISTLIST:
								// The account property is used to fill in the fileas column, private dislist does not have that
								$item['fileas'] = $user_data[$this->properties['account']];
							case DT_PRIVATE_DISTLIST:
								$item['email_address'] = $user_data[$this->properties['account']];
								// FIXME: shouldn't be needed, but atm this gives us an undefined offset error which makes the unittests fail.
								if($item['email_address'] !== 'Everyone') {
									if (isset($user_data[$this->properties['smtp_address']])) {
										$item['smtp_address'] = $user_data[$this->properties['smtp_address']];
									}
								}
								$item['address_type'] = 'ZARAFA';
								break;

							case DT_MAILUSER:
								// The account property is used to fill in the fileas column, remote mailuser does not have that
								$item['fileas'] = $user_data[$this->properties['account']];
							case DT_REMOTE_MAILUSER:
							default:
								$item['email_address'] = $user_data[$this->properties['email_address']];
								$item['smtp_address'] = $user_data[$this->properties['smtp_address']];

								$item['address_type'] = isset($user_data[$this->properties['address_type']]) ? $user_data[$this->properties['address_type']] : 'SMTP';
								$item['department_name'] = isset($user_data[$this->properties['department_name']]) ? $user_data[$this->properties['department_name']] : '';
								$item['office_telephone_number'] = isset($user_data[$this->properties['office_telephone_number']]) ? $user_data[$this->properties['office_telephone_number']] : '';
								$item['office_location'] = isset($user_data[$this->properties['office_location']]) ? $user_data[$this->properties['office_location']] : '';
								$item['primary_fax_number'] = isset($user_data[$this->properties['primary_fax_number']]) ? $user_data[$this->properties['primary_fax_number']] : '';
							break;
						}
					}

					// Create a nice full_name prop ("Lastname, Firstname Middlename")
					if ( isset($user_data[$this->properties['surname']]) ){
						$item['full_name'] = $user_data[$this->properties['surname']];
					} else {
						$item['full_name'] = '';
					}
					if ( (isset($user_data[$this->properties['given_name']]) || isset($user_data[$this->properties['middle_name']])) && !empty($item['full_name']) ){
						$item['full_name'] .= ', ';
					}
					if ( isset($user_data[$this->properties['given_name']]) ){
						$item['full_name'] .= $user_data[$this->properties['given_name']];
					}
					if ( isset($user_data[$this->properties['middle_name']]) ){
						$item['full_name'] .= ' ' . $user_data[$this->properties['middle_name']];
					}
					if ( empty($item['full_name']) ){
						$item['full_name'] = $item['display_name'];
					}

					if(!empty($user_data[$this->properties['search_key']])) {
						$item['search_key'] = bin2hex($user_data[$this->properties['search_key']]);
					} else {
						// contacts folders are not returning search keys, this should be fixed in Kopano Core
						// meanwhile this is a workaround, check ZCP-10814
						// if search key is not passed then we will generate it
						$email_address = '';
						if(!empty($item['smtp_address'])) {
							$email_address = $item['smtp_address'];
						} else if(!empty($item['email_address'])) {
							$email_address = $item['email_address'];
						}

						if(!empty($email_address)) {
							$item['search_key'] = bin2hex(strtoupper($item['address_type'] . ':' . $email_address)) . '00';
						}
					}

					array_push($items, array('props' => $item));
				}

				if ( $sortingOnName ){
					// Sort the items here, because full_name is not a real property, so we can not use the regular sorting
					// Note: This hack only works becaue the GAB does not work with paging!
					function cmpAsc($a, $b){
						return strcasecmp($b['props']['full_name'], $a['props']['full_name']);
					}
					function cmpDesc($a, $b){
						return strcasecmp($a['props']['full_name'], $b['props']['full_name']);
					}

					$cmpFn = $sortingDir === 'DESC' ? 'cmpDesc' : 'cmpAsc';
					usort($items, $cmpFn);
				}

				// todo: fix paging stuff
				$data['page']['start'] = 0;
				$data['page']['rowcount'] = mapi_table_getrowcount($table);
				$data['page']['totalrowcount'] = $data['page']['rowcount'];
			} else {
				// Provide clue that full GAB is disabled.
				$data = array_merge($data, array('disable_full_gab' => DISABLE_FULL_GAB));
			}
			$data = array_merge($data, array('item'=>$items));

			$this->addActionData('list', $data);
			$GLOBALS['bus']->addData($this->getResponseData());

			return true;
		}

		/**
		 *	Function will create a restriction based on parameters passed for hiding users
		 *	@param		Array				$hide_users		list of users that should not be shown
		 *	@return		restrictionObject					restriction for hiding provided users
		 */
		function createUsersRestriction($hide_users) {
			$usersRestriction = null;

			// When $hide_users is true, then we globally disable
			// all users regardless of their subtype. Otherwise if
			// $hide_users is set then we start looking which subtype
			// is being filtered out.
			if ($hide_users === true) {
				$usersRestriction = Array(
							RES_AND,
								Array(
									Array(
										RES_PROPERTY,
											Array(
												RELOP => RELOP_NE,
												ULPROPTAG => PR_DISPLAY_TYPE,
												VALUE => Array(
													PR_DISPLAY_TYPE => DT_MAILUSER
												)
											)
									),
									Array(
										RES_PROPERTY,
											Array(
												RELOP => RELOP_NE,
												ULPROPTAG => PR_DISPLAY_TYPE,
												VALUE => Array(
													PR_DISPLAY_TYPE => DT_REMOTE_MAILUSER
												)
											)
									)
								)
				);
			} else if ($hide_users) {
				$tempRestrictions = Array();

				// wrap parameters in an array
				if(!is_array($hide_users)) {
					$hide_users = Array($hide_users);
				}

				if(in_array('non_security', $hide_users)) {
					array_push($tempRestrictions, Array(
									RES_BITMASK,
										Array(
											ULTYPE => BMR_EQZ,
											ULPROPTAG => PR_DISPLAY_TYPE_EX,
											ULMASK => DTE_FLAG_ACL_CAPABLE
										)
									)
							);
				}

				if(in_array('room', $hide_users)) {
					array_push($tempRestrictions, Array(
									RES_PROPERTY,
										Array(
											RELOP => RELOP_EQ,
											ULPROPTAG => PR_DISPLAY_TYPE_EX,
											VALUE => Array(
												PR_DISPLAY_TYPE_EX => DT_ROOM
											)
										)
									)
							);
				}

				if(in_array('equipment', $hide_users)) {
					array_push($tempRestrictions, Array(
									RES_PROPERTY,
										Array(
											RELOP => RELOP_EQ,
											ULPROPTAG => PR_DISPLAY_TYPE_EX,
											VALUE => Array(
												PR_DISPLAY_TYPE_EX => DT_EQUIPMENT
											)
										)
									)
							);
				}

				if(in_array('active', $hide_users)) {
					array_push($tempRestrictions, Array(
									RES_PROPERTY,
										Array(
											RELOP => RELOP_EQ,
											ULPROPTAG => PR_DISPLAY_TYPE_EX,
											VALUE => Array(
												PR_DISPLAY_TYPE_EX => DTE_FLAG_ACL_CAPABLE
											)
										)
									)
							);
				}

				if(in_array('non_active', $hide_users)) {
					array_push($tempRestrictions, Array(
									RES_PROPERTY,
										Array(
											RELOP => RELOP_EQ,
											ULPROPTAG => PR_DISPLAY_TYPE_EX,
											VALUE => Array(
												PR_DISPLAY_TYPE_EX => DT_MAILUSER
											)
										)
									)
							);
				}

				if(in_array('contact', $hide_users)) {
					array_push($tempRestrictions, Array(
									RES_PROPERTY,
										Array(
											RELOP => RELOP_EQ,
											ULPROPTAG => PR_DISPLAY_TYPE_EX,
											VALUE => Array(
												PR_DISPLAY_TYPE_EX => DT_REMOTE_MAILUSER
											)
										)
									)
							);
				}

				if(in_array('system', $hide_users)) {
					array_push($tempRestrictions, Array(
									RES_CONTENT,
										Array(
											FUZZYLEVEL => FL_FULLSTRING | FL_IGNORECASE,
											ULPROPTAG => PR_ACCOUNT,
											VALUE => Array(
												PR_ACCOUNT => 'SYSTEM'
											)
										)
								)
							);
				}

				if(!empty($tempRestrictions)) {
					$usersRestriction = Array(
								RES_NOT,
								Array(
									Array(
										RES_AND,
											Array(
												Array(
													RES_OR,
														Array(
															Array(
																RES_PROPERTY,
																	Array(
																		RELOP => RELOP_EQ,
																		ULPROPTAG => PR_DISPLAY_TYPE,
																		VALUE => Array(
																			PR_DISPLAY_TYPE => DT_MAILUSER
																		)
																	)
															),
															Array(
																RES_PROPERTY,
																	Array(
																		RELOP => RELOP_EQ,
																		ULPROPTAG => PR_DISPLAY_TYPE,
																		VALUE => Array(
																			PR_DISPLAY_TYPE => DT_REMOTE_MAILUSER
																		)
																	)
															)
														)
												),
												Array(
													RES_OR,
													$tempRestrictions // all user restrictions
												)
											)
									)
								)
							);
				}
			}

			return $usersRestriction;
		}

		/**
		 *	Function will create a restriction based on parameters passed for hiding groups
		 *	@param		Array				$hide_groups	list of groups that should not be shown
		 *	@return		restrictionObject					restriction for hiding provided users
		 */
		function createGroupsRestriction($hide_groups) {
			$groupsRestriction = null;

			// When $hide_groups is true, then we globally disable
			// all groups regardless of their subtype. Otherwise if
			// $hide_groups is set then we start looking which subtype
			// is being filtered out.
			if ($hide_groups === true) {
				$groupsRestriction = Array(
							RES_AND,
								Array(
									Array(
										RES_PROPERTY,
											Array(
												RELOP => RELOP_NE,
												ULPROPTAG => PR_DISPLAY_TYPE,
												VALUE => Array(
													PR_DISPLAY_TYPE => DT_DISTLIST
												)
											)
									),
									Array(
										RES_PROPERTY,
											Array(
												RELOP => RELOP_NE,
												ULPROPTAG => PR_DISPLAY_TYPE,
												VALUE => Array(
													PR_DISPLAY_TYPE => DT_PRIVATE_DISTLIST
												)
											)
									)
								)
						);
			} else if($hide_groups) {
				$tempRestrictions = Array();

				// wrap parameters in an array
				if(!is_array($hide_groups)) {
					$hide_groups = Array($hide_groups);
				}

				if(in_array('non_security', $hide_groups)) {
					array_push($tempRestrictions, Array(
									RES_BITMASK,
										Array(
											ULTYPE => BMR_EQZ,
											ULPROPTAG => PR_DISPLAY_TYPE_EX,
											ULMASK => DTE_FLAG_ACL_CAPABLE
										)
									)
							);
				}

				if(in_array('normal', $hide_groups)) {
					array_push($tempRestrictions, Array(
									RES_PROPERTY,
										Array(
											RELOP => RELOP_EQ,
											ULPROPTAG => PR_DISPLAY_TYPE_EX,
											VALUE => Array(
												PR_DISPLAY_TYPE_EX => DT_DISTLIST
											)
										)
									)
							);
				}

				if(in_array('security', $hide_groups)) {
					array_push($tempRestrictions, Array(
									RES_PROPERTY,
										Array(
											RELOP => RELOP_EQ,
											ULPROPTAG => PR_DISPLAY_TYPE_EX,
											VALUE => Array(
												PR_DISPLAY_TYPE_EX => (DT_SEC_DISTLIST | DTE_FLAG_ACL_CAPABLE)
											)
										)
									)
							);
				}

				if(in_array('dynamic', $hide_groups)) {
					array_push($tempRestrictions, Array(
									RES_PROPERTY,
										Array(
											RELOP => RELOP_EQ,
											ULPROPTAG => PR_DISPLAY_TYPE_EX,
											VALUE => Array(
												PR_DISPLAY_TYPE_EX => DT_AGENT
											)
										)
									)
							);
				}

				if(in_array('distribution_list', $hide_groups)) {
					array_push($tempRestrictions, Array(
									RES_PROPERTY,
										Array(
											RELOP => RELOP_EQ,
											ULPROPTAG => PR_DISPLAY_TYPE,
											VALUE => Array(
												PR_DISPLAY_TYPE => DT_PRIVATE_DISTLIST
											)
										)
									)
							);
				}

				if(in_array('everyone', $hide_groups)) {
					array_push($tempRestrictions, Array(
									RES_CONTENT,
										Array(
											FUZZYLEVEL => FL_FULLSTRING | FL_IGNORECASE,
											ULPROPTAG => PR_ACCOUNT,
											VALUE => Array(
												PR_ACCOUNT => 'Everyone'
											)
										)
									)
							);
				}

				if(!empty($tempRestrictions)) {
					$groupsRestriction = Array(
								RES_NOT,
								Array(
									Array(
										RES_AND,
										Array(
											Array(
												RES_OR,
												Array(
													Array(
														RES_PROPERTY,
														Array(
															RELOP => RELOP_EQ,
															ULPROPTAG => PR_DISPLAY_TYPE,
															VALUE => Array(
																PR_DISPLAY_TYPE => DT_DISTLIST
															)
														)
													),
													Array(
														RES_PROPERTY,
														Array(
															RELOP => RELOP_EQ,
															ULPROPTAG => PR_DISPLAY_TYPE,
															VALUE => Array(
																PR_DISPLAY_TYPE => DT_PRIVATE_DISTLIST
															)
														)
													)
												)
											),
											Array(
												RES_OR,
												$tempRestrictions     // all group restrictions
											)
										)
									)
								)
					);
				}
			}

			return $groupsRestriction;
		}

		/**
		 *	Function will create a restriction to get company information
		 *	@param		Boolean				$hide_companies	true/false
		 *	@return		restrictionObject		restriction for getting company info
		 */
		function createCompanyRestriction($hide_companies) {
			$companyRestriction = false;

			if($hide_companies) {
				$companyRestriction = Array(
							RES_PROPERTY,
								Array(
									RELOP => RELOP_NE,
									ULPROPTAG => PR_DISPLAY_TYPE,
									VALUE => Array(
											PR_DISPLAY_TYPE => DT_ORGANIZATION
									)
								)
				);
			}

			return $companyRestriction;
		}

		function getHierarchy($action)
		{
			$hideContacts = false;
			// Check if hide_contacts is set in the restriction
			if(isset($action['restriction']) && isset($action['restriction']['hide_contacts'])){
				$hideContacts = $action['restriction']['hide_contacts'];
			}

			$folders = $this->getAddressbookHierarchy($hideContacts);
			$data = array( 'item' => $folders );
			$this->addActionData('list', $data);
			$GLOBALS['bus']->addData($this->getResponseData());

			return true;
		}

		/**
		* Get addressbook hierarchy
		*
		* This function returns the entire hierarchy of the addressbook, with global addressbooks, and contacts
		* folders.
		*
		* The output array contains an associative array for each found contact folder. Each entry contains
		* "display_name" => Name of the folder, "entryid" => entryid of the folder, "parent_entryid" => parent entryid
		* "storeid" => store entryid, "type" => gab | contacts
		*
		* @param array Associative array with store information
		* @return array Array of associative arrays with addressbook container information
		* @todo Fix bizarre input parameter format
		*/
		function getAddressbookHierarchy($hideContacts = false)
		{
			$ab = $GLOBALS["mapisession"]->getAddressbook(false, true);
			$dir = mapi_ab_openentry($ab);
			$table = mapi_folder_gethierarchytable($dir, MAPI_DEFERRED_ERRORS | CONVENIENT_DEPTH);

			if($hideContacts){
				// Restrict on the addressbook provider GUID if the contact folders need to be hidden
				$restriction = array(RES_PROPERTY,
					array(
						RELOP => RELOP_EQ,
						ULPROPTAG => PR_AB_PROVIDER_ID,
						VALUE => array(
							PR_AB_PROVIDER_ID => MUIDECSAB
						)
					)
				);
				mapi_table_restrict($table, $restriction);
			}

			$items = mapi_table_queryallrows($table, array(PR_DISPLAY_NAME, PR_ENTRYID, PR_PARENT_ENTRYID, PR_DEPTH, PR_AB_PROVIDER_ID));

			$folders = array();

			$parent = false;
			foreach($items as $item){
				// TODO: fix for missing PR_PARENT_ENTRYID, see #2190
				if ($item[PR_DEPTH]==0)
					$parent = $item[PR_ENTRYID];

				$item[PR_PARENT_ENTRYID] = $parent;

				$folders[] = array(
					"props" => array(
						"display_name"	=> $item[PR_DISPLAY_NAME],
						"entryid"		=> bin2hex($item[PR_ENTRYID]),
						"parent_entryid"=> bin2hex($item[PR_PARENT_ENTRYID]),
						"depth"			=> $item[PR_DEPTH],
						"type"			=> $item[PR_AB_PROVIDER_ID] == MUIDECSAB ? "gab" : 'contacts',
						"object_type"	=> MAPI_ABCONT
					)
				);
			}

			return $folders;
		}

	}
?>
