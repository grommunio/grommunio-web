<?php
	/**
	 * FreeBusyModule Module
	 */
	class FreeBusyModule extends Module
	{
		function __construct($id, $data)
		{
			parent::__construct($id, $data);
		}
		
		function execute()
		{
			foreach($this->data as $actionType => $selUser)
			{
				if(isset($actionType)) {
					try {
						switch($actionType){
							case "list":
								$this->addUserData($selUser);
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
		 * This function will get user info from address book and add freebusy data of the user to
		 * response.
		 *
		 * @param {Array} $selUser User that should be resolved
		 */
		function addUserData($selUser)
		{
			$data = array();
			$data["users"] = array();

			foreach ($selUser["users"] as $fbUser) {
				$user = array();

				// Copy the identifier of the user.
				$user["userid"] = $fbUser["userid"]; 
				$user["entryid"] = $fbUser["entryid"];

				// Obtain the Freebusy data for this user
				$busyArray = $this->getFreeBusyInfo($fbUser["entryid"], $selUser["start"], $selUser["end"]);

				if ($busyArray) {
					// We have freebusy information, go over the data
					// and insert the blocks into the user object.
					foreach ($busyArray as $busyItem) {
						$busy = array();
						$busy["status"] = $busyItem["status"];
						$busy["start"] = $busyItem["start"];
						$busy["isRestrictedRange"] = isset($busyItem["isRestrictedRange"]) ? $busyItem["isRestrictedRange"] : false;
						$busy["end"] = $busyItem["end"];
						$user["items"][] = $busy;
					}
				} else {
					// No freebusy data available, create a single empty block
					$busy["status"] = -1;
					$busy["start"] = $selUser["start"];
					$busy["end"] = $selUser["end"];
					$user["items"][] = $busy;
				}

				$data["users"][] = $user;
			}

			$this->addActionData("list", $data);
			$GLOBALS["bus"]->addData($this->getResponseData());
		}

		/**
		 * This function will get freebusy data for user based on the timeframe passed in arguments.
		 *
		 * @param {String} $entryID Entryid of the user for which we need to get freebusy data
		 * @param {Number} $start start offset for freebusy publish range
		 * @param {Number} $end end offset for freebusy publish range
		 * @return {Array} freebusy blocks for passed publish range
		 */
		function getFreeBusyInfo($entryID, $start, $end)
		{
			$result = array();
			
			$retval = mapi_getuseravailability($GLOBALS['mapisession']->getSession(), hex2bin($entryID), $start, $end);
			if (empty($retval)) {
				return $result;
			}
			$freebusy = json_decode($retval, true);
			if (0 == strcasecmp($freebusy['permission'], 'none')) {
				return $result;
			}
			$last_end = $start;
			foreach ($freebusy['events'] as $event) {
				$blockItem = array();
				$blockItem['start'] = $event['StartTime'];
				$blockItem['end'] = $event['EndTime'];
				if ('Free' == $event['BusyType']) {
					$blockItem['status'] = 0;
				} else if ('Tentative' == $event['BusyType']) {
					$blockItem['status'] = 1;
				} else if ('Busy' == $event['BusyType']) {
					$blockItem['status'] = 2;
				} else if ('OOF' == $event['BusyType']) {
					$blockItem['status'] = 3;
				} else if ('WorkingElsewhere' == $event['BusyType']) {
					$blockItem['status'] = 4;
				} else {
					$blockItem['status'] = -1;
				}
				$last_end = $event['EndTime'];
				$result[] = $blockItem;	
			}

			// Add restricted Free/Busy range information for recipient.
			$noInfoItem = array();
			$noInfoItem["status"] = -1;
			$noInfoItem["isRestrictedRange"] = true;
			// Last day of visible Free/Busy range was first day of restricted Free/Busy range.
			$noInfoItem["start"] = $last_end;
			// Scheduler's last day.
			$noInfoItem["end"] = $end;
			$result[] = $noInfoItem;
			
			return $result;
		}
	}
?>
