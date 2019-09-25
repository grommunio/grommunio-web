<?php
	/**
	 * ExpandDistlist Module
	 */
	class ExpandDistlistModule extends Module
	{
		/**
		 * Constructor
		 */
		function __construct($id, $data)
		{
			$this->properties = $GLOBALS["properties"]->getRecipientProperties();
			parent::__construct($id, $data);
		}

		/**
		 * Executes all the actions in the $data variable.
		 */
		function execute()
		{
			foreach($this->data as $actionType => $action)
			{
				if(isset($actionType)) {
					try {
						switch($actionType)
						{
							case 'expand':
								$this->expand($action);
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
		 * Function which expands a distribution list, optionally expands a distribution list in a distribution list.
		 * Duplicate members will not be be filtered.
		 *
		 * @param string $entryid entryid of distribution list.
		 * @param array $data an array of members in the distribution list.
		 * @param boolean $isRecurse true if we want to expand a distribution list in distribution lists.
		 * @return array $data an array of members in the distribution list.
		 */
		function expandDist($entryid, $data = Array(), $isRecurse = false)
		{
			if($GLOBALS['entryid']->hasAddressBookGUID(bin2hex($entryid))) {
				$abentry = mapi_ab_openentry($this->addrbook, $entryid);
				$table = mapi_folder_getcontentstable($abentry, MAPI_DEFERRED_ERRORS);
				$rows = mapi_table_queryrows($table, $this->properties, 0, (ABITEMDETAILS_MAX_NUM_DISTLIST_MEMBERS > 0) ? ABITEMDETAILS_MAX_NUM_DISTLIST_MEMBERS : 0x7fffffff);
				/*
				 * To prevent loading a huge list that the browser cannot handle, it is possible to
				 * limit the maximum number of shown items. Note that when the table doesn't
				 * contain the requested number of rows, it will not give any errors and simply
				 * return what is available.
				 * When the limit is 0 or below, then no limit is applied and we use 0x7fffffff
				 * to indicate we want to have all rows from the table.
				 */
				for ($i = 0, $len = count($rows); $i < $len; $i++) {
					$memberProps = Conversion::mapMAPI2XML($this->properties, $rows[$i]);
					$isDistlist = $memberProps['props']['object_type'] == MAPI_DISTLIST;
					if ($isDistlist && $isRecurse == True) {
						$data = array_merge($data, $this->expandDist(hex2bin($memberProps['entryid']), array(), $isRecurse));
					} else {
						$data[] = $memberProps;
					}
				}
			} else {
				/**
				 * If distribution list was belongs to local/shared folder then
				 * it will expand all members of distribution list.
				 */
				$distlistMembers = $GLOBALS['operations']->expandDistList(bin2hex($entryid), $isRecurse);
				$recipients = array();
				foreach($distlistMembers as $distlistMember) {
					$recipients['props'] = $distlistMember;
					array_push($data, $recipients);
				}
			}
			return $data;
		}

		/**
		 * Function which expand the distribution list, sent by the client. This function is used
		 * when a user wants to replace the distribution list with its members 
		 * in the to, cc and bcc field. This function retrieve members of that particular distribution list
		 * and send that list back to the client.
		 * @param array $action the action data, sent by the client
		 */
		function expand($action)
		{
			// Get the distribution list entryid from request
			$entryid = hex2bin($action["entryid"]);
			$this->addrbook = $GLOBALS["mapisession"]->getAddressbook();

			if($entryid) {
				$data["results"] = $this->expandDist($entryid, array(), $action['recurse']);
				$this->addActionData("expand", $data);
				$GLOBALS["bus"]->addData($this->getResponseData());
			}
		}
	}
?>
