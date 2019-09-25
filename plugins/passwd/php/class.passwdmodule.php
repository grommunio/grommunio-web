<?php
/**
 * Passwd module.
 * Module that will be used to change passwords of the user
 */
class PasswdModule extends Module
{
	/**
	 * Process the incoming events that were fire by the client.
	 */
	public function execute()
	{
		foreach($this->data as $actionType => $actionData)
		{
			if(isset($actionType)) {
				try {
					switch($actionType)
					{
						case 'save':
							$this->save($actionData);
							break;
						default:
							$this->handleUnknownActionType($actionType);
					}
				} catch (MAPIException $e) {
					$this->sendFeedback(false, $this->errorDetailsFromException($e));
				}

			}
		}
	}

	/**
	 * Change the password of user. Do some calidation and call proper methods based on
	 * zarafa setup.
	 * @param {Array} $data data sent by client.
	 */
	public function save($data)
	{
		$errorMessage = '';

		// some sanity checks
		if(empty($data)) {
			$errorMessage = Language::getstring('No data received.');
		}

		if(empty($data['username'])) {
			$errorMessage = Language::getstring('Account is empty.');
		}

		if(empty($data['current_password'])) {
			$errorMessage = Language::getstring('Current password is empty.');
		}

		if(empty($data['new_password']) || empty($data['new_password_repeat'])) {
			$errorMessage = Language::getstring('New password is empty.');
		}

		if($data['new_password'] !== $data['new_password_repeat']) {
			$errorMessage = Language::getstring('New passwords do not match.');
		}

		if(empty($errorMessage)) {
			$this->saveInDB($data);
		} else {
			$this->sendFeedback(false, array(
				'type' => ERROR_ZARAFA,
				'info' => array(
					'display_message' => $errorMessage
				)
			));
		}
	}
	

	/**
	 * Function will try to change user's password via MAPI in SOAP connection.
	 * @param {Array} $data data sent by client.
	 */
	public function saveInDB($data)
	{
		$errorMessage = '';
		$userName = $data['username'];
		$newPassword = $data['new_password'];
		$sessionPass = '';

		// get current session password
		// if this plugin is used on a webapp version with EncryptionStore,
		// $_SESSION['password'] is no longer available. User EncryptionStore
		// in this case.
		// EncryptionStore was introduced in webapp core somewhere after
		// version 2.1.2, and with or before version 2.2.0.414.
		// tested with Zarafa WebApp 2.2.1.43-199.1 running with
		// Zarafa Server 7.2.4.29-99.1
		if(class_exists("EncryptionStore")) {
			$encryptionStore = EncryptionStore::getInstance();
			$sessionPass = $encryptionStore->get("password");
		}

		if($data['current_password'] === $sessionPass) {
			try {
				$result = nsp_setuserpasswd($userName, $sessionPass, $newPassword);
				// password changed successfully
				if ($result) {
					$this->sendFeedback(true, array(
						'info' => array(
							'display_message' => Language::getstring('Password is changed successfully.')
						)
					));
					// write new password to session because we don't want user to re-authenticate
					session_start();
					$encryptionStore = EncryptionStore::getInstance();
					$encryptionStore->add('password', $newPassword);
					session_write_close();
					return;
				}
			} catch (MAPIException $e) {
				if (MAPI_E_NO_ACCESS == mapi_last_hresult()) {
					$errorMessage = Language::getstring('Your password is wrong or you have insufficent permission to change password');
				}
			}
			if (empty($errorMessage)) {
				$errorMessage = Language::getstring('Password is not changed.');
			}
		} else {
			$errorMessage = Language::getstring('Current password does not match.');
		}

		if(!empty($errorMessage)) {
			$this->sendFeedback(false, array(
				'type' => ERROR_ZARAFA,
				'info' => array(
					'display_message' => $errorMessage
				)
			));
		}
	}
}
	
?>
