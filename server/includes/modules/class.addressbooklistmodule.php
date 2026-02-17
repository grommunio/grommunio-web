<?php

/**
 * Addressbook Module.
 */
class AddressbookListModule extends ListModule {
	/**
	 * Constructor.
	 *
	 * @param int   $id   unique id
	 * @param array $data list of all actions
	 */
	public function __construct($id, $data) {
		$this->properties = $GLOBALS['properties']->getAddressBookListProperties();

		parent::__construct($id, $data);
	}

	/**
	 * Creates the notifiers for this module,
	 * and register them to the Bus.
	 */
	public function createNotifiers() {
		$GLOBALS["bus"]->registerNotifier('addressbooknotifier', ADDRESSBOOK_ENTRYID);
	}

	/**
	 * Executes all the actions in the $data variable.
	 */
	#[Override]
	public function execute() {
		foreach ($this->data as $actionType => $action) {
			if (isset($actionType)) {
				try {
					$store = $this->getActionStore($action);
					$parententryid = $this->getActionParentEntryID($action);
					$entryid = $this->getActionEntryID($action);

					if (isset($action['subActionType']) && $action['subActionType'] != '') {
						$subActionType = $action['subActionType'];
					}

					match ($actionType) {
						'list' => match ($subActionType) {
							'hierarchy' => $this->getHierarchy($action),
							'globaladdressbook' => $this->GABUsers($action, $subActionType),
							default => $this->handleUnknownActionType($actionType),
						},
						default => $this->handleUnknownActionType($actionType),
					};
				}
				catch (MAPIException $e) {
					$this->processException($e, $actionType, $store, $parententryid, $entryid, $action);
				}
			}
		}
	}

	/**
	 * Function which retrieves the list of system users in Zarafa.
	 *
	 * @param array  $action     the action data, sent by the client
	 * @param string $actionType the action type, sent by the client
	 *
	 * @return bool true on success or false on failure
	 */
	public function GABUsers($action, $actionType) {
		$searchstring = $action['restriction']['searchstring'] ?? '';
		$hide_users = $action['restriction']['hide_users'] ?? false;
		$hide_groups = $action['restriction']['hide_groups'] ?? false;
		$hide_companies = $action['restriction']['hide_companies'] ?? false;
		$items = [];
		$data = [];
		$this->sort = [];
		$map = [];
		$map['fileas'] = $this->properties['account'];
		$sortingDir = $action["sort"][0]["direction"] ?? 'ASC';
		$sortingField = $this->getSortingField($action, $map, $sortingDir);
		$folderType = $action['folderType'];
		$sharedStore = null;
		$isSharedFolder = $folderType === 'sharedcontacts' && isset($action["sharedFolder"]["store_entryid"]);
		$isContactFolder = ($folderType === 'contacts' || $folderType === 'sharedcontacts');

		if (($folderType !== 'gab' || ENABLE_FULL_GAB) || !empty($searchstring)) {
			$table = null;
			$ab = $GLOBALS['mapisession']->getAddressbook(false, true);
			$entryid = !empty($action['entryid']) ? hex2bin((string) $action['entryid']) : mapi_ab_getdefaultdir($ab);

			if ($folderType === 'contacts') {
				// Personal contact folder: open directly from the default store.
				// These use raw entry IDs (not AB-wrapped), so we must not go
				// through mapi_ab_openentry which may partially succeed but
				// return incomplete data.
				$contactsFolder = mapi_msgstore_openentry(
					$GLOBALS['mapisession']->getDefaultMessageStore(), $entryid
				);
				$table = mapi_folder_getcontentstable($contactsFolder, MAPI_DEFERRED_ERRORS);
				$this->properties = $GLOBALS['properties']->getContactProperties();
			}
			elseif ($isSharedFolder) {
				// Shared/public contact folder: open from the specified store
				$sharedStore = $GLOBALS["mapisession"]->openMessageStore(
					hex2bin((string) $action["sharedFolder"]["store_entryid"])
				);
				$sharedContactsFolder = mapi_msgstore_openentry($sharedStore, $entryid);
				$table = mapi_folder_getcontentstable($sharedContactsFolder, MAPI_DEFERRED_ERRORS);
				$this->properties = $GLOBALS['properties']->getContactProperties();
			}
			else {
				// GAB or other AB entry: open through the address book
				try {
					$dir = mapi_ab_openentry($ab, $entryid);

					/**
					 * @TODO: 'All Address Lists' on IABContainer gives MAPI_E_INVALID_PARAMETER,
					 * as it contains subfolders only. When #7344 is fixed, MAPI will return error here,
					 * handle it here and return false.
					 */
					$table = mapi_folder_getcontentstable($dir, MAPI_DEFERRED_ERRORS);
				}
				catch (MAPIException) {
					// AB entry could not be opened
				}
			}

			if ($table) {
				$restriction = $this->getRestriction($searchstring, $hide_users, $hide_groups, $hide_companies);
				// Only add restriction when it is used
				if (!empty($restriction)) {
					mapi_table_restrict($table, $restriction, TBL_BATCH);
				}
				// Only sort when asked for
				if (!empty($this->sort)) {
					mapi_table_sort($table, $this->sort, TBL_BATCH);
				}

				$rowCount = mapi_table_getrowcount($table);

				// Try to find hidden users if enabled and searching
				$hiddenUserRows = [];
				if (defined('ENABLE_RESOLVE_HIDDEN_USERS') && ENABLE_RESOLVE_HIDDEN_USERS && !empty($searchstring) && $folderType === 'gab') {
					$hiddenUserRows = $this->resolveHiddenGABUsers($ab, $searchstring, $hide_users, $hide_groups);
				}

				if (is_int(MAX_GAB_RESULTS) && MAX_GAB_RESULTS > 0 && $rowCount > MAX_GAB_RESULTS) {
					// Create a response that contains an error message that there are too much results
					$data['error'] = ['code' => 'listexceederror', 'max_gab_users' => MAX_GAB_RESULTS];
					$rows = mapi_table_queryrows($table, $this->properties, 0, MAX_GAB_RESULTS);
					$rowCount = MAX_GAB_RESULTS;
				}
				else {
					$rows = mapi_table_queryallrows($table, $this->properties);
				}

				// Merge hidden user results
				if (!empty($hiddenUserRows)) {
					$rows = array_merge($rows, $hiddenUserRows);
					$rowCount += count($hiddenUserRows);
				}

				for ($i = 0, $len = $rowCount; $i < $len; ++$i) {
					// Use array_shift to so we won't double memory usage!
					$user_data = array_shift($rows);
					$abprovidertype = 0;
					$item = [];
					$entryid = bin2hex((string) $user_data[$this->properties['entryid']]);
					$item['entryid'] = $entryid;
					$item['display_name'] = $user_data[$this->properties['display_name']] ?? "";
					$item['object_type'] = $user_data[$this->properties['object_type']] ?? "";
					$item['display_type'] = $user_data[PR_DISPLAY_TYPE] ?? "";
					$item['title'] = $user_data[PR_TITLE] ?? "";
					$item['company_name'] = $user_data[PR_COMPANY_NAME] ?? "";

					// Test whether the GUID in the entryid is from the Contact Provider
					if ($GLOBALS['entryid']->hasContactProviderGUID(bin2hex((string) $user_data[$this->properties['entryid']]))) {
						// Use the original_display_name property to fill in the fileas column
						$item['fileas'] = $user_data[$this->properties['original_display_name']] ?? $item['display_name'];
						$item['address_type'] = $user_data[$this->properties['address_type']] ?? 'SMTP';
						// necessary to display the proper icon
						if ($item['address_type'] === 'MAPIPDL') {
							$item['display_type_ex'] = DTE_FLAG_ACL_CAPABLE | DT_MAILUSER | DT_DISTLIST;
						}

						$item['email_address'] = match ($user_data[PR_DISPLAY_TYPE]) {
							DT_PRIVATE_DISTLIST => '',
							default => $user_data[$this->properties['email_address']],
						};
						if (!isset($item['smtp_address']) && $item['address_type'] === 'SMTP') {
							$item['smtp_address'] = $item['email_address'];
						}
					}
					elseif ($isContactFolder) {
						// Contact folder item (personal or shared).
						// These are real contact items from a MAPI folder, not
						// AB entries, so they use contact properties instead of
						// AB list properties.

						// Do not display private items from shared folders
						if ($isSharedFolder && isset($user_data[$this->properties['private']]) && $user_data[$this->properties['private']] === true) {
							continue;
						}

						// Determine if this is a single contact or a distribution list
						$isContact = strcasecmp((string) ($user_data[$this->properties['message_class']] ?? ''), 'IPM.Contact') === 0;

						// Do not display contacts without any email address
						if ($isContact &&
							empty($user_data[$this->properties["email_address_1"]]) &&
							empty($user_data[$this->properties["email_address_2"]]) &&
							empty($user_data[$this->properties["email_address_3"]])) {
							continue;
						}

						$item['display_type_ex'] = $isContact ? DT_MAILUSER : DT_MAILUSER | DT_PRIVATE_DISTLIST;
						$item['display_type'] = $isContact ? DT_MAILUSER : DT_DISTLIST;
						$item['fileas'] = $item['display_name'];
						$item['surname'] = $user_data[PR_SURNAME] ?? '';
						$item['given_name'] = $user_data[$this->properties['given_name']] ?? '';
						$item['object_type'] = ($user_data[$this->properties['icon_index']] ?? 0) == 512 ? MAPI_MAILUSER : MAPI_DISTLIST;

						// Map contact properties to fields expected by the GAB column model
						$item['department_name'] = $user_data[$this->properties['department_name']] ?? '';
						$item['office_telephone_number'] = $user_data[$this->properties['business_telephone_number']] ?? '';
						$item['mobile_telephone_number'] = $user_data[$this->properties['cellular_telephone_number']] ?? '';
						$item['home_telephone_number'] = $user_data[$this->properties['home_telephone_number']] ?? '';
						$item['pager_telephone_number'] = $user_data[$this->properties['pager_telephone_number']] ?? '';
						$item['office_location'] = $user_data[$this->properties['office_location']] ?? '';
						$item['primary_fax_number'] = $user_data[$this->properties['business_fax_number']]
							?? $user_data[$this->properties['primary_fax_number']] ?? '';

						if ($isSharedFolder) {
							$item['store_entryid'] = $action["sharedFolder"]["store_entryid"];
							$item['is_shared'] = true;
						}

						// Determine which email addresses are available
						if (!empty($user_data[$this->properties["email_address_type_1"]])) {
							$abprovidertype |= 1;
						}
						if (!empty($user_data[$this->properties["email_address_type_2"]])) {
							$abprovidertype |= 2;
						}
						if (!empty($user_data[$this->properties["email_address_type_3"]])) {
							$abprovidertype |= 4;
						}

						switch ($abprovidertype) {
							case 1:
							case 3:
							case 5:
							case 7:
								$item['entryid'] .= '01';
								$item['address_type'] = $user_data[$this->properties["email_address_type_1"]];
								$item['email_address'] = $user_data[$this->properties["email_address_1"]];
								break;

							case 2:
							case 6:
								$item['entryid'] .= '02';
								$item['address_type'] = $user_data[$this->properties["email_address_type_2"]];
								$item['email_address'] = $user_data[$this->properties["email_address_2"]];
								break;

							case 4:
								$item['entryid'] .= '03';
								$item['address_type'] = $user_data[$this->properties["email_address_type_3"]];
								$item['email_address'] = $user_data[$this->properties["email_address_3"]];
								break;
						}

						// Set smtp_address for GAB column compatibility
						if (!empty($item['email_address']) && ($item['address_type'] ?? '') === 'SMTP') {
							$item['smtp_address'] = $item['email_address'];
						}
					}
					else {
						// If display_type_ex is not set we can overwrite it with display_type
						$item['display_type_ex'] = $user_data[PR_DISPLAY_TYPE_EX] ?? $user_data[PR_DISPLAY_TYPE];
						$item['fileas'] = $item['display_name'];
						$item['mobile_telephone_number'] = $user_data[PR_MOBILE_TELEPHONE_NUMBER] ?? '';
						$item['home_telephone_number'] = $user_data[PR_HOME_TELEPHONE_NUMBER] ?? '';
						$item['pager_telephone_number'] = $user_data[PR_PAGER_TELEPHONE_NUMBER] ?? '';
						$item['surname'] = $user_data[PR_SURNAME] ?? '';
						$item['given_name'] = $user_data[$this->properties['given_name']] ?? '';

						switch ($user_data[PR_DISPLAY_TYPE]) {
							case DT_ORGANIZATION:
								$item['email_address'] = $user_data[$this->properties['account']];
								$item['address_type'] = 'EX';
								// The account property is used to fill in the fileas column
								$item['fileas'] = $user_data[$this->properties['account']];
								break;

							case DT_DISTLIST:
								// The account property is used to fill in the fileas column, private dislist does not have that
								$item['fileas'] = $user_data[$this->properties['account']];

								// no break
							case DT_PRIVATE_DISTLIST:
								$item['email_address'] = $user_data[$this->properties['email_address']] ?? $user_data[$this->properties['account']];
								// FIXME: shouldn't be needed, but atm this gives us an undefined offset error which makes the unittests fail.
								if ($item['email_address'] !== 'Everyone' && isset($user_data[$this->properties['smtp_address']])) {
									$item['smtp_address'] = $user_data[$this->properties['smtp_address']];
								}
								$item['address_type'] = 'EX';
								break;

							case DT_MAILUSER:
								// The account property is used to fill in the fileas column, remote mailuser does not have that
								$item['fileas'] = $user_data[$this->properties['account']];

								// no break
							case DT_REMOTE_MAILUSER:
							default:
								$item['email_address'] = $user_data[$this->properties['email_address']];
								$item['smtp_address'] = $user_data[$this->properties['smtp_address']];

								$item['address_type'] = $user_data[$this->properties['address_type']] ?? 'SMTP';
								$item['department_name'] = $user_data[$this->properties['department_name']] ?? '';
								$item['office_telephone_number'] = $user_data[$this->properties['office_telephone_number']] ?? '';
								$item['office_location'] = $user_data[$this->properties['office_location']] ?? '';
								$item['primary_fax_number'] = $user_data[$this->properties['primary_fax_number']] ?? '';
								break;
						}
					}

					// Create a nice full_name prop ("Lastname, Firstname Middlename")
					if (isset($user_data[$this->properties['surname']])) {
						$item['full_name'] = $user_data[$this->properties['surname']];
					}
					else {
						$item['full_name'] = '';
					}
					if ((isset($user_data[$this->properties['given_name']]) || isset($user_data[$this->properties['middle_name']])) && !empty($item['full_name'])) {
						$item['full_name'] .= ', ';
					}
					if (isset($user_data[$this->properties['given_name']])) {
						$item['full_name'] .= $user_data[$this->properties['given_name']];
					}
					if (isset($user_data[$this->properties['middle_name']])) {
						$item['full_name'] .= ' ' . $user_data[$this->properties['middle_name']];
					}
					if (empty($item['full_name'])) {
						$item['full_name'] = $item['display_name'];
					}

					if (!empty($user_data[$this->properties['search_key']])) {
						$item['search_key'] = bin2hex((string) $user_data[$this->properties['search_key']]);
					}
					else {
						// contacts folders are not returning search keys, this should be fixed in Gromox
						// meanwhile this is a workaround, check ZCP-10814
						// if search key is not passed then we will generate it
						$email_address = '';
						if (!empty($item['smtp_address'])) {
							$email_address = $item['smtp_address'];
						}
						elseif (!empty($item['email_address'])) {
							$email_address = $item['email_address'];
						}

						if (!empty($email_address)) {
							$item['search_key'] = bin2hex(strtoupper($item['address_type'] . ':' . $email_address)) . '00';
						}
					}

					array_push($items, ['props' => $item]);
					if ($isContactFolder) {
						switch ($abprovidertype) {
							case 3:
								$item['address_type'] = $user_data[$this->properties["email_address_type_2"]];
								$item['email_address'] = $user_data[$this->properties["email_address_2"]];
								$item['smtp_address'] = ($item['address_type'] === 'SMTP') ? $item['email_address'] : '';
								$item['search_key'] = bin2hex(strtoupper($item['address_type'] . ':' . $item['email_address'])) . '00';
								$item['entryid'] = $entryid . '02';
								array_push($items, ['props' => $item]);
								break;

							case 5:
							case 6:
								$item['address_type'] = $user_data[$this->properties["email_address_type_3"]];
								$item['email_address'] = $user_data[$this->properties["email_address_3"]];
								$item['smtp_address'] = ($item['address_type'] === 'SMTP') ? $item['email_address'] : '';
								$item['search_key'] = bin2hex(strtoupper($item['address_type'] . ':' . $item['email_address'])) . '00';
								$item['entryid'] = $entryid . '03';
								array_push($items, ['props' => $item]);
								break;

							case 7:
								$item['address_type'] = $user_data[$this->properties["email_address_type_2"]];
								$item['email_address'] = $user_data[$this->properties["email_address_2"]];
								$item['smtp_address'] = ($item['address_type'] === 'SMTP') ? $item['email_address'] : '';
								$item['search_key'] = bin2hex(strtoupper($item['address_type'] . ':' . $item['email_address'])) . '00';
								$item['entryid'] = $entryid . '02';
								array_push($items, ['props' => $item]);
								$item['address_type'] = $user_data[$this->properties["email_address_type_3"]];
								$item['email_address'] = $user_data[$this->properties["email_address_3"]];
								$item['smtp_address'] = ($item['address_type'] === 'SMTP') ? $item['email_address'] : '';
								$item['search_key'] = bin2hex(strtoupper($item['address_type'] . ':' . $item['email_address'])) . '00';
								$item['entryid'] = $entryid . '03';
								array_push($items, ['props' => $item]);
								break;
						}
					}
				}

				function sorter($direction, $key) {
					return fn ($a, $b) => $direction == 'ASC' ?
							strcasecmp($a['props'][$key] ?? '', $b['props'][$key] ?? '') :
							strcasecmp($b['props'][$key] ?? '', $a['props'][$key] ?? '');
				}
				usort($items, sorter($sortingDir, $sortingField));

				// todo: fix paging stuff
				$data['page']['start'] = 0;
				$data['page']['rowcount'] = $rowCount;
				$data['page']['totalrowcount'] = $data['page']['rowcount'];
				$data = array_merge($data, ['item' => $items]);
			}
		}
		else {
			// Provide clue that full GAB is disabled.
			$data = array_merge($data, ['disable_full_gab' => !ENABLE_FULL_GAB]);
		}

		$this->addActionData('list', $data);
		$GLOBALS['bus']->addData($this->getResponseData());

		return true;
	}

	/**
	 *	Function will create a restriction based on parameters passed for hiding users.
	 *
	 * @param array $hide_users list of users that should not be shown
	 *
	 * @return null|array restriction for hiding provided users
	 */
	public function createUsersRestriction($hide_users) {
		$usersRestriction = null;

		// When $hide_users is true, then we globally disable
		// all users regardless of their subtype. Otherwise if
		// $hide_users is set then we start looking which subtype
		// is being filtered out.
		if ($hide_users === true) {
			$usersRestriction = [
				RES_AND,
				[
					[
						RES_PROPERTY,
						[
							RELOP => RELOP_NE,
							ULPROPTAG => PR_DISPLAY_TYPE,
							VALUE => [
								PR_DISPLAY_TYPE => DT_MAILUSER,
							],
						],
					],
					[
						RES_PROPERTY,
						[
							RELOP => RELOP_NE,
							ULPROPTAG => PR_DISPLAY_TYPE,
							VALUE => [
								PR_DISPLAY_TYPE => DT_REMOTE_MAILUSER,
							],
						],
					],
				],
			];
		}
		elseif ($hide_users) {
			$tempRestrictions = [];

			// wrap parameters in an array
			if (!is_array($hide_users)) {
				$hide_users = [$hide_users];
			}

			if (in_array('non_security', $hide_users)) {
				array_push(
					$tempRestrictions,
					[
						RES_BITMASK,
						[
							ULTYPE => BMR_EQZ,
							ULPROPTAG => PR_DISPLAY_TYPE_EX,
							ULMASK => DTE_FLAG_ACL_CAPABLE,
						],
					]
				);
			}

			if (in_array('room', $hide_users)) {
				array_push(
					$tempRestrictions,
					[
						RES_PROPERTY,
						[
							RELOP => RELOP_EQ,
							ULPROPTAG => PR_DISPLAY_TYPE_EX,
							VALUE => [
								PR_DISPLAY_TYPE_EX => DT_ROOM,
							],
						],
					]
				);
			}

			if (in_array('equipment', $hide_users)) {
				array_push(
					$tempRestrictions,
					[
						RES_PROPERTY,
						[
							RELOP => RELOP_EQ,
							ULPROPTAG => PR_DISPLAY_TYPE_EX,
							VALUE => [
								PR_DISPLAY_TYPE_EX => DT_EQUIPMENT,
							],
						],
					]
				);
			}

			if (in_array('active', $hide_users)) {
				array_push(
					$tempRestrictions,
					[
						RES_PROPERTY,
						[
							RELOP => RELOP_EQ,
							ULPROPTAG => PR_DISPLAY_TYPE_EX,
							VALUE => [
								PR_DISPLAY_TYPE_EX => DTE_FLAG_ACL_CAPABLE,
							],
						],
					]
				);
			}

			if (in_array('non_active', $hide_users)) {
				array_push(
					$tempRestrictions,
					[
						RES_PROPERTY,
						[
							RELOP => RELOP_EQ,
							ULPROPTAG => PR_DISPLAY_TYPE_EX,
							VALUE => [
								PR_DISPLAY_TYPE_EX => DT_MAILUSER,
							],
						],
					]
				);
			}

			if (in_array('contact', $hide_users)) {
				array_push(
					$tempRestrictions,
					[
						RES_PROPERTY,
						[
							RELOP => RELOP_EQ,
							ULPROPTAG => PR_DISPLAY_TYPE_EX,
							VALUE => [
								PR_DISPLAY_TYPE_EX => DT_REMOTE_MAILUSER,
							],
						],
					]
				);
			}

			if (in_array('system', $hide_users)) {
				array_push(
					$tempRestrictions,
					[
						RES_CONTENT,
						[
							FUZZYLEVEL => FL_FULLSTRING | FL_IGNORECASE,
							ULPROPTAG => PR_ACCOUNT,
							VALUE => [
								PR_ACCOUNT => 'SYSTEM',
							],
						],
					]
				);
			}

			if (!empty($tempRestrictions)) {
				$usersRestriction = [
					RES_NOT,
					[
						[
							RES_AND,
							[
								[
									RES_OR,
									[
										[
											RES_PROPERTY,
											[
												RELOP => RELOP_EQ,
												ULPROPTAG => PR_DISPLAY_TYPE,
												VALUE => [
													PR_DISPLAY_TYPE => DT_MAILUSER,
												],
											],
										],
										[
											RES_PROPERTY,
											[
												RELOP => RELOP_EQ,
												ULPROPTAG => PR_DISPLAY_TYPE,
												VALUE => [
													PR_DISPLAY_TYPE => DT_REMOTE_MAILUSER,
												],
											],
										],
									],
								],
								[
									RES_OR,
									$tempRestrictions, // all user restrictions
								],
							],
						],
					],
				];
			}
		}

		return $usersRestriction;
	}

	/**
	 *	Function will create a restriction based on parameters passed for hiding groups.
	 *
	 * @param array $hide_groups list of groups that should not be shown
	 *
	 * @return null|array restriction for hiding provided users
	 */
	public function createGroupsRestriction($hide_groups) {
		$groupsRestriction = null;

		// When $hide_groups is true, then we globally disable
		// all groups regardless of their subtype. Otherwise if
		// $hide_groups is set then we start looking which subtype
		// is being filtered out.
		if ($hide_groups === true) {
			$groupsRestriction = [
				RES_AND,
				[
					[
						RES_PROPERTY,
						[
							RELOP => RELOP_NE,
							ULPROPTAG => PR_DISPLAY_TYPE,
							VALUE => [
								PR_DISPLAY_TYPE => DT_DISTLIST,
							],
						],
					],
					[
						RES_PROPERTY,
						[
							RELOP => RELOP_NE,
							ULPROPTAG => PR_DISPLAY_TYPE,
							VALUE => [
								PR_DISPLAY_TYPE => DT_PRIVATE_DISTLIST,
							],
						],
					],
				],
			];
		}
		elseif ($hide_groups) {
			$tempRestrictions = [];

			// wrap parameters in an array
			if (!is_array($hide_groups)) {
				$hide_groups = [$hide_groups];
			}

			if (in_array('non_security', $hide_groups)) {
				array_push(
					$tempRestrictions,
					[
						RES_BITMASK,
						[
							ULTYPE => BMR_EQZ,
							ULPROPTAG => PR_DISPLAY_TYPE_EX,
							ULMASK => DTE_FLAG_ACL_CAPABLE,
						],
					]
				);
			}

			if (in_array('normal', $hide_groups)) {
				array_push(
					$tempRestrictions,
					[
						RES_PROPERTY,
						[
							RELOP => RELOP_EQ,
							ULPROPTAG => PR_DISPLAY_TYPE_EX,
							VALUE => [
								PR_DISPLAY_TYPE_EX => DT_DISTLIST,
							],
						],
					]
				);
			}

			if (in_array('security', $hide_groups)) {
				array_push(
					$tempRestrictions,
					[
						RES_PROPERTY,
						[
							RELOP => RELOP_EQ,
							ULPROPTAG => PR_DISPLAY_TYPE_EX,
							VALUE => [
								PR_DISPLAY_TYPE_EX => (DT_SEC_DISTLIST | DTE_FLAG_ACL_CAPABLE),
							],
						],
					]
				);
			}

			if (in_array('dynamic', $hide_groups)) {
				array_push(
					$tempRestrictions,
					[
						RES_PROPERTY,
						[
							RELOP => RELOP_EQ,
							ULPROPTAG => PR_DISPLAY_TYPE_EX,
							VALUE => [
								PR_DISPLAY_TYPE_EX => DT_AGENT,
							],
						],
					]
				);
			}

			if (in_array('distribution_list', $hide_groups)) {
				array_push(
					$tempRestrictions,
					[
						RES_PROPERTY,
						[
							RELOP => RELOP_EQ,
							ULPROPTAG => PR_DISPLAY_TYPE,
							VALUE => [
								PR_DISPLAY_TYPE => DT_PRIVATE_DISTLIST,
							],
						],
					]
				);
			}

			if (in_array('everyone', $hide_groups)) {
				array_push(
					$tempRestrictions,
					[
						RES_CONTENT,
						[
							FUZZYLEVEL => FL_FULLSTRING | FL_IGNORECASE,
							ULPROPTAG => PR_ACCOUNT,
							VALUE => [
								PR_ACCOUNT => 'Everyone',
							],
						],
					]
				);
			}

			if (!empty($tempRestrictions)) {
				$groupsRestriction = [
					RES_NOT,
					[
						[
							RES_AND,
							[
								[
									RES_OR,
									[
										[
											RES_PROPERTY,
											[
												RELOP => RELOP_EQ,
												ULPROPTAG => PR_DISPLAY_TYPE,
												VALUE => [
													PR_DISPLAY_TYPE => DT_DISTLIST,
												],
											],
										],
										[
											RES_PROPERTY,
											[
												RELOP => RELOP_EQ,
												ULPROPTAG => PR_DISPLAY_TYPE,
												VALUE => [
													PR_DISPLAY_TYPE => DT_PRIVATE_DISTLIST,
												],
											],
										],
									],
								],
								[
									RES_OR,
									$tempRestrictions,     // all group restrictions
								],
							],
						],
					],
				];
			}
		}

		return $groupsRestriction;
	}

	/**
	 *	Function will create a restriction to get company information.
	 *
	 * @param bool $hide_companies true/false
	 *
	 * @return array|bool restriction for getting company info
	 */
	public function createCompanyRestriction($hide_companies) {
		$companyRestriction = false;

		if ($hide_companies) {
			$companyRestriction = [
				RES_PROPERTY,
				[
					RELOP => RELOP_NE,
					ULPROPTAG => PR_DISPLAY_TYPE,
					VALUE => [
						PR_DISPLAY_TYPE => DT_ORGANIZATION,
					],
				],
			];
		}

		return $companyRestriction;
	}

	public function getHierarchy($action) {
		// Check if hide_contacts is set in the restriction
		$hideContacts = $action['restriction']['hide_contacts'] ?? false;

		$folders = $this->getAddressbookHierarchy($hideContacts);
		$data = ['item' => $folders];
		$this->addActionData('list', $data);
		$GLOBALS['bus']->addData($this->getResponseData());

		return true;
	}

	/**
	 * Get addressbook hierarchy.
	 *
	 * This function returns the entire hierarchy of the addressbook, with global addressbooks, and contacts
	 * folders.
	 *
	 * The output array contains an associative array for each found contact folder. Each entry contains
	 * "display_name" => Name of the folder, "entryid" => entryid of the folder, "parent_entryid" => parent entryid
	 * "storeid" => store entryid, "type" => gab | contacts
	 *
	 * @param bool $hideContacts
	 *
	 * @return array Array of associative arrays with addressbook container information
	 */
	public function getAddressbookHierarchy($hideContacts = false) {
		$folders = [];
		$this->getAbContactFolders($folders);

		if (!$hideContacts) {
			// Add personal contact folders directly from the default store.
			// This bypasses the AB Contact Provider which may not have all
			// folders registered (depends on session setup timing).
			$this->getPersonalContactFolders($folders);

			// add shared contact folders if they are enabled
			if (ENABLE_SHARED_CONTACT_FOLDERS) {
				$this->getSharedContactFolders($folders);
			}
			if (ENABLE_PUBLIC_CONTACT_FOLDERS && ENABLE_PUBLIC_FOLDERS) {
				$this->getPublicContactFolders($folders);
			}
		}

		return $folders;
	}

	/**
	 * Gets the GAB (Global Address Book) folders from the addressbook hierarchy.
	 * Only returns GAB entries (MUIDECSAB provider). Contact folders are added
	 * separately via getPersonalContactFolders/getSharedContactFolders for
	 * reliability, as those query the mail store hierarchy directly.
	 *
	 * @param array $folders list of folders
	 */
	public function getAbContactFolders(&$folders) {
		$ab = $GLOBALS["mapisession"]->getAddressbook(false, true);
		$dir = mapi_ab_openentry($ab);
		$table = mapi_folder_gethierarchytable($dir, MAPI_DEFERRED_ERRORS | CONVENIENT_DEPTH);

		$items = mapi_table_queryallrows($table, [PR_DISPLAY_NAME, PR_ENTRYID, PR_PARENT_ENTRYID, PR_DEPTH, PR_AB_PROVIDER_ID]);
		$parent = false;
		foreach ($items as $item) {
			// Only include GAB entries; contact folders are added separately
			// via getPersonalContactFolders/getSharedContactFolders.
			if ($item[PR_AB_PROVIDER_ID] != MUIDECSAB) {
				continue;
			}

			if ($item[PR_DEPTH] == 0) {
				$parent = $item[PR_ENTRYID];
			}
			$item[PR_PARENT_ENTRYID] = $parent;

			$displayName = $item[PR_DISPLAY_NAME] ?? '';
			if ($displayName === 'Gromox Contact Folders') {
				$displayName = _("Domain Contact Folders");
			}

			$this->addFolder($folders, [
				"display_name" => $displayName,
				"entryid" => bin2hex((string) $item[PR_ENTRYID]),
				"parent_entryid" => bin2hex((string) $item[PR_PARENT_ENTRYID]),
				"depth" => $item[PR_DEPTH],
				"type" => "gab",
				"object_type" => MAPI_ABCONT,
			]);
		}
	}

	/**
	 * Gets personal contact folders directly from the default message store.
	 * This is more reliable than using the AB Contact Provider, as it queries
	 * the store hierarchy directly and is not affected by AB setup timing.
	 *
	 * @param array $folders list of folders
	 */
	public function getPersonalContactFolders(&$folders) {
		$store = $GLOBALS['mapisession']->getDefaultMessageStore();
		$contactFolders = $GLOBALS['mapisession']->getContactFoldersForABContactProvider($store);

		if (empty($contactFolders)) {
			return;
		}

		// Add a group header for personal contact folders
		$storeProps = mapi_getprops($store, [PR_ENTRYID]);
		$this->addFolder($folders, [
			"display_name" => _("Personal Contact Folders"),
			"entryid" => bin2hex((string) $storeProps[PR_ENTRYID]) . "00",
			"parent_entryid" => "",
			"depth" => 0,
			"type" => "contacts",
			"object_type" => MAPI_ABCONT,
		]);

		for ($i = 0, $len = count($contactFolders); $i < $len; ++$i) {
			$this->addFolder($folders, [
				"display_name" => $contactFolders[$i][PR_DISPLAY_NAME],
				"entryid" => bin2hex((string) $contactFolders[$i][PR_ENTRYID]),
				"store_entryid" => bin2hex((string) $contactFolders[$i][PR_STORE_ENTRYID]),
				"parent_entryid" => isset($contactFolders[$i][PR_PARENT_ENTRYID]) ?
					bin2hex((string) $contactFolders[$i][PR_PARENT_ENTRYID]) : "",
				"depth" => 1,
				"type" => "contacts",
				"object_type" => MAPI_ABCONT,
			]);
		}
	}

	/**
	 * Gets the shared contacts folders from all open delegate stores.
	 * getOtherUserStore() returns stores that are either auto-hooked
	 * delegate stores or explicitly opened by the user, filtering out
	 * any that were explicitly closed via hidden_delegate_stores setting.
	 *
	 * @param array $folders list of folders
	 */
	public function getSharedContactFolders(&$folders) {
		$otherstores = $GLOBALS['mapisession']->getOtherUserStore();
		$sharedFolderEntries = [];

		foreach ($otherstores as $sharedEntryId => $sharedStore) {
			$sharedStoreProps = mapi_getprops($sharedStore, [PR_MAILBOX_OWNER_NAME, PR_MDB_PROVIDER]);
			if ($sharedStoreProps[PR_MDB_PROVIDER] != ZARAFA_STORE_DELEGATE_GUID) {
				continue;
			}

			try {
				$sharedContactFolders = $GLOBALS["mapisession"]->getContactFoldersForABContactProvider($sharedStore);
			}
			catch (MAPIException $e) {
				continue;
			}

			for ($i = 0, $len = count($sharedContactFolders); $i < $len; ++$i) {
				$sharedFolderEntries[] = [
					"display_name" => $sharedContactFolders[$i][PR_DISPLAY_NAME] . " - " . $sharedStoreProps[PR_MAILBOX_OWNER_NAME],
					"entryid" => bin2hex((string) $sharedContactFolders[$i][PR_ENTRYID]),
					"store_entryid" => bin2hex((string) $sharedContactFolders[$i][PR_STORE_ENTRYID]),
					"parent_entryid" => bin2hex((string) $sharedContactFolders[$i][PR_PARENT_ENTRYID]),
					"depth" => 1,
					"type" => 'sharedcontacts',
					"object_type" => MAPI_ABCONT,
				];
			}
		}

		if (!empty($sharedFolderEntries)) {
			// Add group header for shared contact folders
			$this->addFolder($folders, [
				"display_name" => _("Shared Contact Folders"),
				"entryid" => bin2hex("shared_contacts_header"),
				"parent_entryid" => "",
				"depth" => 0,
				"type" => "sharedcontacts",
				"object_type" => MAPI_ABCONT,
			]);

			foreach ($sharedFolderEntries as $entry) {
				$this->addFolder($folders, $entry);
			}
		}
	}

	/**
	 * Gets the public contacts folders.
	 *
	 * @param array $folders list of folders
	 */
	public function getPublicContactFolders(&$folders) {
		$publicStore = $GLOBALS['mapisession']->getPublicMessageStore();
		$publicStoreProps = mapi_getprops($publicStore, [PR_DISPLAY_NAME]);
		$publicContactFolders = $GLOBALS['mapisession']->getContactFoldersForABContactProvider($publicStore);

		if (empty($publicContactFolders)) {
			return;
		}

		// Add group header for public contact folders
		$this->addFolder($folders, [
			"display_name" => _("Public Contact Folders"),
			"entryid" => bin2hex("public_contacts_header"),
			"parent_entryid" => "",
			"depth" => 0,
			"type" => "sharedcontacts",
			"object_type" => MAPI_ABCONT,
		]);

		$knownParents = [];
		for ($i = 0, $len = count($publicContactFolders); $i < $len; ++$i) {
			$knownParents[] = $publicContactFolders[$i][PR_ENTRYID];
			$this->addFolder($folders, [
				// Postfix display name of every contact folder with respective owner name
				// it is mandatory to keep display-name different
				"display_name" => $publicContactFolders[$i][PR_DISPLAY_NAME] . ' - ' . $publicStoreProps[PR_DISPLAY_NAME],
				"entryid" => bin2hex((string) $publicContactFolders[$i][PR_ENTRYID]),
				"store_entryid" => bin2hex((string) $publicContactFolders[$i][PR_STORE_ENTRYID]),
				"parent_entryid" => bin2hex((string) $publicContactFolders[$i][PR_PARENT_ENTRYID]),
				// only indent folders which have a parent folder already in the list
				"depth" => $publicContactFolders[$i][PR_DEPTH] > 1 && in_array($publicContactFolders[$i][PR_PARENT_ENTRYID], $knownParents) ?
					$publicContactFolders[$i][PR_DEPTH] : 1,
				"type" => 'sharedcontacts',
				"object_type" => MAPI_ABCONT,
			]);
		}
	}

	/**
	 * Adds folder information to the folder list.
	 *
	 * @param array $folders list of folders
	 * @param array $data    folder information
	 */
	public function addFolder(&$folders, $data) {
		$folders[] = ["props" => $data];
	}

	/**
	 * Returns the field which will be used to sort the ab items.
	 *
	 * @param array  $action
	 * @param array  $map
	 * @param string $sortingDir
	 *
	 * @return string
	 */
	public function getSortingField(&$action, $map, $sortingDir) {
		// Rewrite the sort info when sorting on full name as this is a combination of multiple fields
		$sortingField = 'full_name';
		if (isset($action["sort"]) && is_array($action["sort"]) && count($action["sort"]) === 1 && isset($action["sort"][0]["field"])) {
			$sortingField = $action["sort"][0]["field"];
			if ($action["sort"][0]["field"] === 'full_name') {
				$action["sort"] = [
					[
						"field" => "surname",
						"direction" => $sortingDir,
					],
					[
						"field" => "given_name",
						"direction" => $sortingDir,
					],
					[
						"field" => "middle_name",
						"direction" => $sortingDir,
					],
					[
						"field" => "display_name",
						"direction" => $sortingDir,
					],
				];
			}
			elseif ($action["sort"][0]["field"] === 'icon_index') {
				$sortingField = 'display_type_ex';
				$action["sort"] = [
					[
						"field" => 'display_type_ex',
						"direction" => $sortingDir,
					],
					[
						"field" => 'display_name',
						"direction" => $sortingDir,
					],
				];
			}

			// Parse incoming sort order
			$this->parseSortOrder($action, $map, true);
		}

		return $sortingField;
	}

	/**
	 * Returns the restriction for the ab items.
	 *
	 * @param string $searchstring
	 * @param bool   $hide_users
	 * @param bool   $hide_groups
	 * @param bool   $hide_companies
	 *
	 * @return array
	 */
	public function getRestriction($searchstring, $hide_users, $hide_groups, $hide_companies) {
		$restriction = [];
		$userGroupRestriction = $this->getUserGroupCompanyRestriction($hide_users, $hide_groups, $hide_companies);
		$searchRestriction = $this->getSearchRestriction($searchstring);

		if (!empty($searchRestriction) && !empty($userGroupRestriction)) {
			$restriction = [
				RES_AND,
				[
					// restriction for search/alphabet bar
					$searchRestriction,
					// restriction for hiding users/groups
					$userGroupRestriction,
				], ];
		}
		elseif (!empty($searchRestriction)) {
			// restriction for search/alphabet bar
			$restriction = $searchRestriction;
		}
		else {
			// restriction for hiding users/groups
			$restriction = $userGroupRestriction;
		}

		return $restriction;
	}

	/**
	 * Returns the search/alphabet bar restriction for the ab items.
	 *
	 * @param string $searchstring
	 *
	 * @return array
	 */
	public function getSearchRestriction($searchstring) {
		$searchRestriction = [];

		if (!empty($searchstring)) {
			// create restriction for search
			// only return users from who the displayName or the username starts with $searchstring
			// TODO: use PR_ANR for this restriction instead of PR_DISPLAY_NAME and PR_ACCOUNT
			$searchRestriction = [RES_OR,
				[
					// Display name of user from GAB and contacts.
					[
						RES_CONTENT,
						[FUZZYLEVEL => FL_SUBSTRING | FL_IGNORECASE,
							ULPROPTAG => PR_DISPLAY_NAME,
							VALUE => $searchstring,
						],
					],
					// fileas value of user from GAB.
					[
						RES_CONTENT,
						[FUZZYLEVEL => FL_SUBSTRING | FL_IGNORECASE,
							ULPROPTAG => PR_ACCOUNT,
							VALUE => $searchstring,
						],
					],
					// smtp_address of user from GAB.
					[
						RES_CONTENT,
						[FUZZYLEVEL => FL_SUBSTRING | FL_IGNORECASE,
							ULPROPTAG => PR_SMTP_ADDRESS,
							VALUE => $searchstring,
						],
					],
					// email_address of user from GAB and contacts.
					[
						RES_CONTENT,
						[FUZZYLEVEL => FL_SUBSTRING | FL_IGNORECASE,
							ULPROPTAG => PR_EMAIL_ADDRESS,
							VALUE => $searchstring,
						],
					],
					// department of user from GAB.
					[
						RES_CONTENT,
						[FUZZYLEVEL => FL_SUBSTRING | FL_IGNORECASE,
							ULPROPTAG => PR_DEPARTMENT_NAME,
							VALUE => $searchstring,
						],
					],
					// fileas of user from Contacts.
					[
						RES_CONTENT,
						[FUZZYLEVEL => FL_SUBSTRING | FL_IGNORECASE,
							ULPROPTAG => PR_ORIGINAL_DISPLAY_NAME,
							VALUE => $searchstring,
						],
					],
				],
			];
		}

		return $searchRestriction;
	}

	/**
	 * Returns the hiding users/groups restriction for the ab items.
	 *
	 * @param bool $hide_users
	 * @param bool $hide_groups
	 * @param bool $hide_companies
	 *
	 * @return array
	 */
	public function getUserGroupCompanyRestriction($hide_users, $hide_groups, $hide_companies) {
		$userGroupRestriction = [];

		if ($hide_users || $hide_groups || $hide_companies) {
			$userRestrictions = [];
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
			$userGroupRestriction = [RES_AND, $userRestrictions];
		}

		return $userGroupRestriction;
	}

	/**
	 * Try to resolve hidden GAB users by exact match when ENABLE_RESOLVE_HIDDEN_USERS is enabled.
	 * This allows finding users that are hidden from the GAB when the search string exactly matches
	 * their display name, email address, or account name.
	 *
	 * @param resource $ab          The addressbook resource
	 * @param string   $searchstr   The search string to match exactly
	 * @param bool     $hide_users  Whether to exclude users from results
	 * @param bool     $hide_groups Whether to exclude groups from results
	 *
	 * @return array Array of user rows in the same format as table query results
	 */
	protected function resolveHiddenGABUsers($ab, $searchstr, $hide_users, $hide_groups) {
		if (!defined('ENABLE_RESOLVE_HIDDEN_USERS') || !ENABLE_RESOLVE_HIDDEN_USERS) {
			return [];
		}

		$searchstr = trim($searchstr);
		if (empty($searchstr)) {
			return [];
		}

		// Try to find exact matches by different properties
		$properties = [PR_DISPLAY_NAME, PR_ACCOUNT];
		if (str_contains($searchstr, '@')) {
			$properties[] = PR_EMAIL_ADDRESS;
			$properties[] = PR_SMTP_ADDRESS;
		}

		foreach ($properties as $property) {
			try {
				$rows = mapi_ab_resolvename($ab, [[$property => $searchstr]], EMS_AB_ADDRESS_LOOKUP);
				if (!empty($rows)) {
					// Filter based on hide_users and hide_groups flags
					$filteredRows = [];
					foreach ($rows as $row) {
						$objectType = $row[PR_OBJECT_TYPE] ?? MAPI_MAILUSER;
						if ($hide_users && $objectType === MAPI_MAILUSER) {
							continue;
						}
						if ($hide_groups && $objectType === MAPI_DISTLIST) {
							continue;
						}
						$filteredRows[] = $row;
					}
					return $filteredRows;
				}
			}
			catch (MAPIException $e) {
				// NOT_FOUND or AMBIGUOUS - try next property
				if ($e->getCode() != MAPI_E_NOT_FOUND && $e->getCode() != MAPI_E_AMBIGUOUS_RECIP) {
					error_log("RESOLVE_HIDDEN_GAB: Error resolving by property " . $property . ": " . $e->getMessage());
				}
			}
		}

		return [];
	}
}
