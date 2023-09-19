<?php

/**
 * FreeBusyModule Module.
 */
class FreeBusyModule extends Module {
	public function __construct($id, $data) {
		parent::__construct($id, $data);
	}

	public function execute() {
		foreach ($this->data as $actionType => $selUser) {
			if (isset($actionType)) {
				try {
					switch ($actionType) {
						case 'list':
							$this->addUserData($selUser);
							break;

						default:
							$this->handleUnknownActionType($actionType);
					}
				}
				catch (MAPIException $e) {
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
	public function addUserData($selUser) {
		$data = [
			'users' => [],
		];

		foreach ($selUser['users'] as $fbUser) {
			// Copy the identifier of the user.
			$user = [
				'userid' => $fbUser['userid'],
				'entryid' => $fbUser['entryid'],
			];

			// Obtain the Freebusy data for this user
			$busyArray = $this->getFreeBusyInfo($fbUser['entryid'], $selUser['start'], $selUser['end']);
			$user['items'] = $busyArray;
			$data['users'][] = $user;
		}

		$this->addActionData('list', $data);
		$GLOBALS['bus']->addData($this->getResponseData());
	}

	/**
	 * This function will get freebusy data for user based on the timeframe passed in arguments.
	 *
	 * @param {String} $entryID Entryid of the user for which we need to get freebusy data
	 * @param {Number} $start start offset for freebusy publish range
	 * @param {Number} $end end offset for freebusy publish range
	 *
	 * @return {Array} freebusy blocks for passed publish range
	 */
	public function getFreeBusyInfo($entryID, $start, $end) {
		$result = [];

		$fbdata = mapi_getuserfreebusy($GLOBALS['mapisession']->getSession(), hex2bin($entryID), $start, $end);

		foreach ($fbdata['fbevents'] as $event) {
			$result[] = [
				'start' => $event['start'],
				'end' => $event['end'],
				'status' => $event['busystatus'],
			];
		}

		return $result;
	}
}
