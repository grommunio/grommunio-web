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
					match ($actionType) {
                        'list' => $this->addUserData($selUser),
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
	 * This function will get user info from address book and add freebusy data of the user to
	 * response.
	 *
	 * @param array $selUser User that should be resolved
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
	 * @param string $entryID Entryid of the user for which we need to get freebusy data
	 * @param int $start start offset for freebusy publish range
	 * @param int $end end offset for freebusy publish range
	 *
	 * @return array freebusy blocks for passed publish range
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
