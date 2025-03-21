<?php

/**
 * ExpandDistlist Module.
 */
class ExpandDistlistModule extends Module {
	private $addrbook;

	/**
	 * Constructor.
	 *
	 * @param mixed $id
	 * @param mixed $data
	 */
	public function __construct($id, $data) {
		parent::__construct($id, $data);

		$this->properties = $GLOBALS["properties"]->getRecipientProperties();
	}

	/**
	 * Executes all the actions in the $data variable.
	 */
	public function execute() {
		foreach ($this->data as $actionType => $action) {
			if (isset($actionType)) {
				try {
					match ($actionType) {
                        'expand' => $this->expand($action),
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
	 * Function which expands a distribution list, optionally expands a distribution list in a distribution list.
	 * Duplicate members will not be be filtered.
	 *
	 * @param string $entryid   entryid of distribution list
	 * @param array  $data      an array of members in the distribution list
	 * @param bool   $isRecurse true if we want to expand a distribution list in distribution lists
	 *
	 * @return array $data an array of members in the distribution list
	 */
	public function expandDist($entryid, $data = [], $isRecurse = false) {
		$heid = bin2hex($entryid);
		if ($GLOBALS['entryid']->hasAddressBookGUID($heid) || $GLOBALS['entryid']->hasAddressBookRecipientGUID($heid)) {
			$abentry = mapi_ab_openentry($this->addrbook, $entryid);
			$table = mapi_folder_getcontentstable($abentry, MAPI_DEFERRED_ERRORS);
			$rows = mapi_table_queryrows($table, $this->properties, 0, (ABITEMDETAILS_MAX_NUM_DISTLIST_MEMBERS > 0) ? ABITEMDETAILS_MAX_NUM_DISTLIST_MEMBERS : 0x7FFFFFFF);
			/*
			 * To prevent loading a huge list that the browser cannot handle, it is possible to
			 * limit the maximum number of shown items. Note that when the table doesn't
			 * contain the requested number of rows, it will not give any errors and simply
			 * return what is available.
			 * When the limit is 0 or below, then no limit is applied and we use 0x7fffffff
			 * to indicate we want to have all rows from the table.
			 */
			for ($i = 0, $len = count($rows); $i < $len; ++$i) {
				$memberProps = Conversion::mapMAPI2XML($this->properties, $rows[$i]);
				$isDistlist = $memberProps['props']['object_type'] == MAPI_DISTLIST;
				if ($isDistlist && $isRecurse === true) {
					$data = array_merge($data, $this->expandDist(hex2bin((string) $memberProps['entryid']), [], $isRecurse));
				}
				else {
					$data[] = $memberProps;
				}
			}
		}
		else {
			/**
			 * If distribution list was belongs to local/shared folder then
			 * it will expand all members of distribution list.
			 */
			$distlistMembers = $GLOBALS['operations']->expandDistList($heid, $isRecurse);
			$recipients = [];
			foreach ($distlistMembers as $distlistMember) {
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
	 *
	 * @param array $action the action data, sent by the client
	 */
	public function expand($action) {
		// Get the distribution list entryid from request
		$entryid = hex2bin((string) $action["entryid"]);
		$this->addrbook = $GLOBALS["mapisession"]->getAddressbook();

		if ($entryid) {
			$data["results"] = $this->expandDist($entryid, [], $action['recurse']);
			$this->addActionData("expand", $data);
			$GLOBALS["bus"]->addData($this->getResponseData());
		}
	}
}
