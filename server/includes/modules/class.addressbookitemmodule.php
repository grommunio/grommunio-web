<?php
	/**
	 * Read Mail ItemModule
	 */
	class AddressbookItemModule extends ItemModule
	{

		/**
		 * Constructor
		 * @param int $id unique id.
		 * @param array $data list of all actions.
		 */
		function __construct($id, $data)
		{
			$this->userDetailProperties = $GLOBALS["properties"]->getAddressBookItemMailuserProperties();
			$this->abObjectDetailProperties = $GLOBALS["properties"]->getAddressBookItemABObjectProperties();
			$this->groupDetailProperties = $GLOBALS["properties"]->getAddressBookItemDistlistProperties();
			
			parent::__construct($id, $data);
		}

		/**
		 * Function which opens an item.
		 * @param object $store MAPI Message Store Object
		 * @param string $entryid entryid of the message
		 * @param array $action the action data, sent by the client
		 * @return boolean true on success or false on failure 
		 */
		function open($store, $entryid, $action)
		{
			if($entryid) {
				$data = array();

				try {
					$abentry = mapi_ab_openentry($GLOBALS["mapisession"]->getAddressbook(false, true), $entryid);
				} catch (MAPIException $e) {
					// If the item not found in addressbook, it might be possible that
					// this particular item was added by setup-contact-provider mechanism.
					// Let us try to get that particular contact item in respective user store.
					// @Fixme: After implementation of KC-350 this extra handling can be removed.
					if ($e->getCode() == MAPI_E_NOT_FOUND) {
						$e->setHandled();
						// Remove Address-Book-Provider prefix from the entryid
						$externalEntryid = $GLOBALS["entryid"]->unwrapABEntryIdObj(bin2hex($entryid));

						// Retrieve user store entryid to which this external item belongs
						$userStore = $GLOBALS['operations']->getOtherStoreFromEntryid($externalEntryid);
						$contactItem = $GLOBALS['operations']->openMessage($userStore, hex2bin($externalEntryid));

						if ($contactItem != false) {
							// Get necessary property from respective contact item
							$contactItemProps = mapi_getprops($contactItem, Array(PR_GIVEN_NAME, PR_DISPLAY_NAME, PR_TITLE, PR_COMPANY_NAME));

							// Use the data retrieved from contact item to prepare response
							// as similar as it seems like an addressbook item.
							$data['props'] = array (
								'object_type' => MAPI_MAILUSER,
								'given_name' => $contactItemProps[PR_GIVEN_NAME],
								'display_name' => $contactItemProps[PR_DISPLAY_NAME],
								'title' => $contactItemProps[PR_TITLE],
								'company_name' => $contactItemProps[PR_COMPANY_NAME]
							);
							$data['entryid'] = bin2hex($entryid);

							$this->addActionData("item", $data);
							$GLOBALS["bus"]->addData($this->getResponseData());
							return;
						}
					}
				}

				if(mapi_last_hresult() == NOERROR && $abentry){
					$objecttypeprop = mapi_getprops($abentry, Array(PR_OBJECT_TYPE));

					if(isset($objecttypeprop[PR_OBJECT_TYPE])){
						// Get the properties for a MAILUSER object and process those MAILUSER specific props that require some more actions
						if($objecttypeprop[PR_OBJECT_TYPE] == MAPI_MAILUSER){
							$messageprops = mapi_getprops($abentry, $this->userDetailProperties);
							$props = Conversion::mapMAPI2XML($this->userDetailProperties, $messageprops);

							// Get the properties of the manager
							$managerProps = $this->getManagerDetails($messageprops);
							if($managerProps!==false){
								$props['ems_ab_manager'] = array(
									'item' => $managerProps	
								);
							}

							$homePhoneNumbers = $this->getHomePhoneNumbers($messageprops);
							if (!empty($homePhoneNumbers)){
								// Add the list of home2_telephone_number_mv in the correct format to $props list to be send to the client
								$props['home2_telephone_numbers'] = array(
									'item' => $homePhoneNumbers	
								);
							}

							$businessPhoneNumbers = $this->getBusinessPhoneNumbers($messageprops);
							if (!empty($businessPhoneNumbers)){
								// Add the list of business2_telephone_number_mv in the correct format to $props list to be send to the client
								$props['business2_telephone_numbers'] = array(
									'item' => $businessPhoneNumbers	
								);
							}

							// Get the properties of the "direct reports"
							$directReportsList = $this->getDirectReportsDetails($messageprops);
							if(!empty($directReportsList)){
								// Add the list of proxy_addresses in the correct format to the $props list to be send to the client.
								$props['ems_ab_reports'] = array(
									'item' => $directReportsList
								);
							}

						// Get the properties for a DISTLIST object and process those DISTLIST specific props that require some more actions
						}else{
							$messageprops = mapi_getprops($abentry, $this->groupDetailProperties);
							$props = Conversion::mapMAPI2XML($this->groupDetailProperties, $messageprops);

							// Get the properties of the owner
							$ownerProps = $this->getOwnerDetails($messageprops);
							if($ownerProps!==false){
								// We can use the same properties as we use for the manager in a MAILUSER
								$props['ems_ab_owner'] = array(
									'item' => $ownerProps
								);
							}

							// Get the list of members for this DISTLSIT
							$props['members'] = array(
								'item' => $this->getMembersDetails($abentry)
							);
						}

						// Get the proxy addresses list, this property exsists in both MAILUSER and DISTLIST
						$proxyAddresses = $this->getProxyAddressesDetails($messageprops);
						// Remove the MV-flagged property
						if(!empty($proxyAddresses)){
							// Add the list of proxy_addresses in the correct format to the $props list to be send to the client.
							$props['ems_ab_proxy_addresses'] = array(
								'item' => $proxyAddresses
							);
						}

						// Get the properties of the group membership, this property exsists in both MAILUSER and DISTLIST
						$memberOfList = $this->getMemberOfDetails($messageprops);
						if(!empty($memberOfList)){
							// Add the list of proxy_addresses in the correct format to the $props list to be send to the client.
							$props['ems_ab_is_member_of_dl'] = array(
								'item' => $memberOfList
							);
						}

						// Remove the MV-flagged properties and also its single valued counterpart
						unset($props['props']['ems_ab_is_member_of_dl']);
						unset($props['props']['business2_telephone_number_mv']);
						unset($props['props']['business2_telephone_number']);
						unset($props['props']['home2_telephone_number_mv']);
						unset($props['props']['home2_telephone_number']);
						unset($props['props']['ems_ab_proxy_addresses_mv']);
						unset($props['props']['ems_ab_proxy_addresses']);
						unset($props['props']['ems_ab_reports_mv']);
						unset($props['props']['ems_ab_reports']);
						unset($props['props']['ems_ab_owner']);
						unset($props['props']['ems_ab_manager']);

						// Allowing to hook in and add more properties
						$GLOBALS['PluginManager']->triggerHook("server.module.addressbookitemmodule.open.props", array(
							'moduleObject' =>& $this,
							'abentry' => $abentry,
							'object_type' => $objecttypeprop[PR_OBJECT_TYPE],
							'messageprops' => $messageprops,
							'props' =>& $props
						));

						$data["item"] = $props;
						$this->addActionData("item", $data);
					}else{
						// Handling error: not able to handle this type of object
						$data["error"] = array();
						$data["error"]["message"] = _("Could not handle this type of object.");
						$this->addActionData("error", $data);
					}
				}else{
					// Handle not being able to open the object
					$data["error"] = array();
					$data["error"]["hresult"] = mapi_last_hresult();
					$data["error"]["hresult_name"] = get_mapi_error_name(mapi_last_hresult());
					$data["error"]["message"] = _("Could not open this object.");
					$this->addActionData("error", $data);
				}

				$GLOBALS["bus"]->addData($this->getResponseData());
			}
		}

		/**
		 * Get Business Telephone numbers in the messageprops array when it is set in the
		 * PR_HOME2_TELEPHONE_NUMBER_MV. This property is poorly documented and in Outlook it checks
		 * the property with and without the MV flag. The one without a MV flag can contain only one
		 * entry and the one with MV flag can contain a list. It then merges both into one list. 
		 * This function has the same behavior and sets the list in the $messageprops.
		 * @param $messageprops Array Details properties of an user entry.
		 * @return Array List of telephone numbers
		 */
		function getHomePhoneNumbers($messageprops)
		{
			$list = Array();
			if (isset($messageprops[$this->userDetailProperties['home2_telephone_number']])){
				$list[] = $messageprops[$this->userDetailProperties['home2_telephone_number']];
			}
			if(isset($messageprops[$this->userDetailProperties['home2_telephone_number_mv']])){
				$list = array_merge($list, $messageprops[$this->userDetailProperties['home2_telephone_number_mv']]);
			}

			$returnList = Array();
			for($i = 0, $len = count($list); $i < $len; $i++) {
				array_push($returnList, Array('number' => $list[$i]));
			}
			return $returnList;
		}

		/**
		 * Get Business Telephone numbers in the messageprops array when it is set in the
		 * PR_BUSINESS2_TELEPHONE_NUMBER_MV. This property is poorly documented and in Outlook it checks
		 * the property with and without the MV flag. The one without a MV flag can contain only one
		 * entry and the one with MV flag can contain a list. It then merges both into one list. 
		 * This function has the same behavior and sets the list in the $messageprops.
		 * @param $messageprops Array Details properties of an user entry.
		 * @return Array List of telephone numbers
		 */
		function getBusinessPhoneNumbers($messageprops)
		{
			$list = Array();
			if (isset($messageprops[$this->userDetailProperties['business2_telephone_number']])){
				$list[] = $messageprops[$this->userDetailProperties['business2_telephone_number']];
			}
			if(isset($messageprops[$this->userDetailProperties['business2_telephone_number_mv']])){
				$list = array_merge($list, $messageprops[$this->userDetailProperties['business2_telephone_number_mv']]);
			}

			$returnList = Array();
			for($i = 0, $len = count($list); $i < $len; $i++) {
				array_push($returnList, Array('number' => $list[$i]));
			}
			return $returnList;
		}

		/**
		 * Get Proxy Addresses in the messageprops array when it is set in the 
		 * PR_EMS_AB_PROXY_ADDRESSES. This property is poorly documented and in Outlook it checks 
		 * the property with and without the MV flag. The one without a MV flag can contain only one
		 * entry and the one with MV flag can contain a list. It then merges both into one list. 
		 * This function has the same behavior and sets the list in the $messageprops.
		 * @param $messageprops Array Details properties of an user entry.
		 * @return Array List of addresses
		 */
		function getProxyAddressesDetails($messageprops)
		{
			$list = Array();
			if(isset($messageprops[$this->userDetailProperties['ems_ab_proxy_addresses']])){
				$list[] = $messageprops[$this->userDetailProperties['ems_ab_proxy_addresses']];
			}
			if(isset($messageprops[$this->userDetailProperties['ems_ab_proxy_addresses_mv']])){
				$list = array_merge($list, $messageprops[$this->userDetailProperties['ems_ab_proxy_addresses_mv']]);
			}

			$returnList = Array();
			for($i = 0, $len = count($list); $i < $len; $i++) {
				array_push($returnList, Array('address' => $list[$i]));
			}
			return $returnList;
		}

		/**
		 * Get the information of the manager from the GAB details of a MAPI_MAILUSER. Will use the 
		 * entryid to get the properties. If no entryid if found false is returned.
		 * @param $messageprops Array Details properties of an user entry.
		 * @return Boolean|Array List of properties or false if no manager is set
		 */
		function getManagerDetails($messageprops)
		{
			if(isset($messageprops[$this->userDetailProperties['ems_ab_manager']])){
				$entryidMananager = $messageprops[$this->userDetailProperties['ems_ab_manager']];

				$managerEntry = mapi_ab_openentry($GLOBALS["mapisession"]->getAddressbook(), $entryidMananager);
				$managerProps = mapi_getprops($managerEntry, $this->abObjectDetailProperties);

				return Conversion::mapMAPI2XML($this->abObjectDetailProperties, $managerProps);
			}
			return false;
		}

		/**
		 * Get the list of users that have been set in the PR_EMS_AB_REPORTS property in the 
		 * $messageprops array. This property is poorly documented and in Outlook it checks 
		 * the property with and without the MV flag. The one without a MV flag can contain only one
		 * entry and the one with MV flag can contain a list. It then merges both into one list. 
		 * This function has the same behavior and sets the list in the $messageprops.
		 * @param $messageprops Array Details properties of an user entry.
		 * @return Boolean|Array List of properties or false if no manager is set
		 */
		function getDirectReportsDetails($messageprops)
		{
			/*
			 * Get the entryIds from the PR_EMS_AB_REPORTS property (with and without MV flag as a 
			 * fallback) and put the entryIds in a list.
			 */
			$entryids = Array();
			if(isset($messageprops[$this->userDetailProperties['ems_ab_reports']])){
				$entryids[] = $messageprops[$this->userDetailProperties['ems_ab_reports']];
			}
			if(isset($messageprops[$this->userDetailProperties['ems_ab_reports_mv']])){
				$entryids = array_merge($entryids, $messageprops[$this->userDetailProperties['ems_ab_reports_mv']]);
			}

			$result = Array();
			// Convert the entryIds in an array of properties of the AB entryies
			for($i = 0, $len = count($entryids); $i < $len; $i++){
				// Get the properies from the AB entry
				$entry = mapi_ab_openentry($GLOBALS["mapisession"]->getAddressbook(), $entryids[$i]);
				$props = mapi_getprops($entry, $this->abObjectDetailProperties);
				// Convert the properties for each entry and put it in an array
				$result[] = Conversion::mapMAPI2XML($this->abObjectDetailProperties, $props);
			}
			return $result;
		}

		/**
		 * Get the list of users that have been set in the PR_EMS_AB_MEMBER_OF_DL property in the 
		 * $messageprops array. This property is poorly documented and in Outlook it checks 
		 * the property with and without the MV flag. The one without a MV flag can contain only one
		 * entry and the one with MV flag can contain a list. It then merges both into one list. 
		 * This function has the same behavior and sets the list in the $messageprops.
		 * @param $messageprops Array Details properties of an user entry.
		 * @return Boolean|Array List of properties or false if no manager is set
		 */
		function getMemberOfDetails($messageprops)
		{
			$result = Array();
			// Get the properties of the group membership
			if(isset($messageprops[$this->userDetailProperties['ems_ab_is_member_of_dl']])){
				$entryids = $messageprops[$this->userDetailProperties['ems_ab_is_member_of_dl']];
				// Get the properties from every entryid in the memberOf list
				for($i = 0, $len = count($entryids); $i < $len; $i++){
					// Get the properies from the AB entry
					$entry = mapi_ab_openentry($GLOBALS["mapisession"]->getAddressbook(), $entryids[$i]);
					$props = mapi_getprops($entry, $this->abObjectDetailProperties);
					// Convert the properties for each entry and put it in an array
					$result[] = Conversion::mapMAPI2XML($this->abObjectDetailProperties, $props);
				}
			}
			return $result;
		}

		/**
		 * Get the information of the owner from the GAB details of a MAPI_DISTLIST. Will use the 
		 * entryid to get the properties. If no entryid if found false is returned.
		 * @param $messageprops Array Details properties of an distlist entry.
		 * @return Boolean|Array List of properties or false if no owner is set
		 */
		function getOwnerDetails($messageprops)
		{
			if(isset($messageprops[$this->groupDetailProperties['ems_ab_owner']])){
				$entryidOwner = $messageprops[$this->groupDetailProperties['ems_ab_owner']];

				$ownerEntry = mapi_ab_openentry($GLOBALS["mapisession"]->getAddressbook(), $entryidOwner);
				$ownerProps = mapi_getprops($ownerEntry, $this->abObjectDetailProperties);

				return Conversion::mapMAPI2XML($this->abObjectDetailProperties, $ownerProps);
			}
			return false;
		}

		/**
		 * Get the information of the members from the GAB details of a MAPI_DISTLIST. The 
		 * information can be found in the contentstable of the AB entry opened by the user. 
		 * @param $abentry Resource Reference to the user-opened AB entry
		 * @return Boolean|Array List of members
		 */
		function getMembersDetails($abentry)
		{
			$result = Array();

			$table = mapi_folder_getcontentstable($abentry, MAPI_DEFERRED_ERRORS);

			/*
			 * To prevent loading a huge list that the browser cannot handle, it is possible to 
			 * limit the maximum number of shown items. Note that when the table doesn't
			 * contain the requested number of rows, it will not give any errors and simply
			 * return what is available.
			 * When the limit is 0 or below, then no limit is applied and we use 0x7fffffff
			 * to indicate we want to have all rows from the table.
			 */
			$rows = mapi_table_queryrows($table, $this->abObjectDetailProperties, 0, (ABITEMDETAILS_MAX_NUM_DISTLIST_MEMBERS > 0) ? ABITEMDETAILS_MAX_NUM_DISTLIST_MEMBERS : 0x7fffffff);
			for($i = 0, $len = count($rows); $i < $len; $i++){
				$result[] = Conversion::mapMAPI2XML($this->abObjectDetailProperties, $rows[$i]);
			}

			return $result;
		}

	}
?>
