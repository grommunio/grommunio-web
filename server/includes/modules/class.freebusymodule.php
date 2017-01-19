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
				$busyArray = $this->getFreeBusyInfo($fbUser, $selUser["start"], $selUser["end"]);

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
		 * @param {Array} $user which contains the user information like entryid and user type.
		 * @param {Number} $start start offset for freebusy publish range
		 * @param {Number} $end end offset for freebusy publish range
		 * @return {Array} freebusy blocks for passed publish range
		 */
		function getFreeBusyInfo($user, $start, $end)
		{
			$result = array();

			if ($user['organizer']) {
				$store = $GLOBALS["mapisession"]->getDefaultMessageStore();
				$rootContainer = mapi_msgstore_openentry($store, null);
				$rootProps = mapi_getprops($rootContainer, Array(PR_IPM_APPOINTMENT_ENTRYID));
				$calendar = mapi_msgstore_openentry($store, $rootProps[PR_IPM_APPOINTMENT_ENTRYID]);

				$pub = new FreeBusyPublish($GLOBALS["mapisession"]->getSession(), $store, $calendar, hex2bin($user['entryid']));
				$appointments = $pub->getCalendarData($start, $end);

				foreach($appointments as $appointment) {
					$blockItem = array();
					$blockItem["status"] = $appointment["status"];
					$blockItem["start"] = $appointment["start"];
					$blockItem["end"] = $appointment["end"];
					$result[] = $blockItem;
				}
			} else {
				// Get the FB interface
				try {
					$fbsupport = mapi_freebusysupport_open($GLOBALS["mapisession"]->getSession());
				} catch (MAPIException $e) {
					if($e->getCode() == MAPI_E_NOT_FOUND) {
						$e->setHandled();
						dump("Error in opening freebusysupport object.");
					}
				}

				$fbDataArray = mapi_freebusysupport_loaddata($fbsupport, array(hex2bin($user["entryid"])));

				if($fbDataArray[0] != NULL){
					foreach($fbDataArray as $fbDataUser){
						$rangeuser1 = mapi_freebusydata_getpublishrange($fbDataUser);
						if($rangeuser1 == NULL){
							return $result;
						}

						$enumblock = mapi_freebusydata_enumblocks($fbDataUser, $start, $end);
						mapi_freebusyenumblock_reset($enumblock);

						while(true){
							$blocks = mapi_freebusyenumblock_next($enumblock, 100);
							if(!$blocks){
								break;
							}

							foreach($blocks as $blockItem){
								$result[] = $blockItem;
							}
						}

						// Add restricted Free/Busy range information for recipient.
						$noInfoItem = array();
						$noInfoItem["status"] = -1;
						$noInfoItem["isRestrictedRange"] = true;
						// Last day of visible Free/Busy range was first day of restricted Free/Busy range.
						$noInfoItem["start"] = $rangeuser1["end"];
						// Scheduler's last day.
						$noInfoItem["end"] = $end;
						$result[] = $noInfoItem;
					}
				}
				mapi_freebusysupport_close($fbsupport);
			}
			return $result;
		}
	}
?>
