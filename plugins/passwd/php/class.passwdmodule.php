<?php

/**
 * Passwd module.
 * Module that will be used to change passwords of the user.
 */
class PasswdModule extends Module {
	/**
	 * Process the incoming events that were fire by the client.
	 */
	#[Override]
	public function execute() {
		foreach ($this->data as $actionType => $actionData) {
			if (isset($actionType)) {
				try {
					match ($actionType) {
						'save' => $this->save($actionData),
						default => $this->handleUnknownActionType($actionType),
					};
				}
				catch (MAPIException $e) {
					$this->sendFeedback(false, $this->errorDetailsFromException($e));
				}
			}
		}
	}

	/**
	 * Change the password of user. Do some calidation and call proper methods based on
	 * zarafa setup.
	 *
	 * @param array $data data sent by client
	 */
	public function save($data) {
		$errorMessage = '';

		// some sanity checks
		if (empty($data)) {
			$errorMessage = _('No data received.');
		}

		if (empty($data['username'])) {
			$errorMessage = _('Account is empty.');
		}

		if (empty($data['current_password'])) {
			$errorMessage = _('Current password is empty.');
		}

		if (empty($data['new_password']) || empty($data['new_password_repeat'])) {
			$errorMessage = _('New password is empty.');
		}

		if ($data['new_password'] !== $data['new_password_repeat']) {
			$errorMessage = _('New passwords do not match.');
		}

		if (empty($errorMessage)) {
			$this->saveInDB($data);
		}
		else {
			$this->sendFeedback(false, [
				'type' => ERROR_ZARAFA,
				'info' => [
					'display_message' => $errorMessage,
				],
			]);
		}
	}

	/**
	 * Function will try to change user's password via MAPI in SOAP connection.
	 *
	 * @param array $data data sent by client
	 */
	public function saveInDB($data) {
		$errorMessage = '';
		$userName = $GLOBALS['mapisession']->getSMTPAddress();
		$newPassword = $data['new_password'];

		// When a session password is available it may not correspond to the user's
		// actual password (e.g. when authenticated via grommunio-auth/Keycloak). We rely
		// on the backend to verify the provided current password instead of validating it
		// against the session value.
		if (defined('PLUGIN_PASSWD_USE_ZCORE') && PLUGIN_PASSWD_USE_ZCORE) {
			try {
				$result = nsp_setuserpasswd($userName, $data['current_password'], $newPassword);
				// password changed successfully
				if ($result) {
					$this->sendFeedback(true, [
						'info' => [
							'display_message' => _('Password is changed successfully.'),
						],
					]);
					// write new password to session because we don't want user to re-authenticate
					session_start();
					$encryptionStore = EncryptionStore::getInstance();
					$encryptionStore->add('password', $newPassword);
					session_write_close();

					return;
				}
			}
			catch (MAPIException) {
				if (mapi_last_hresult() == MAPI_E_NO_ACCESS) {
					$errorMessage = _('Your password is wrong or you have insufficient permission to change password');
				}
			}
			if (empty($errorMessage)) {
				$errorMessage = _('Password is not changed.');
			}
		}
		else {
			$url = (defined('PLUGIN_PASSWD_ADMIN_API_ENDPOINT') && PLUGIN_PASSWD_ADMIN_API_ENDPOINT) ?
				PLUGIN_PASSWD_ADMIN_API_ENDPOINT :
				'http://[::1]:8080/api/v1/passwd';
			$result = file_get_contents($url, false, stream_context_create([
				'http' => [
					'header' => [
						'Content-type: application/json',
					],
					'method' => 'PUT',
					'content' => json_encode([
						"user" => $userName,
						"old" => $data['current_password'],
						"new" => $newPassword,
					]),
				],
			]));

			if ($result === false) {
				$errorMessage = _('Error changing password. Please verify your password or contact the system administrator.');
			}
			else {
				$this->sendFeedback(true, [
					'info' => [
						'display_message' => _('Password has been changed successfully.'),
					],
				]);
				// write new password to session because we don't want user to re-authenticate
				session_start();
				$encryptionStore = EncryptionStore::getInstance();
				$encryptionStore->add('password', $newPassword);
				session_write_close();

				return;
			}
			if (empty($errorMessage)) {
				$errorMessage = _('Password is not changed.');
			}
		}

		if (!empty($errorMessage)) {
			$this->sendFeedback(false, [
				'type' => ERROR_ZARAFA,
				'info' => [
					'display_message' => $errorMessage,
				],
			]);
		}
	}
}
