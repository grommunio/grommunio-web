<?php

require_once 'TestUser.php';

/**
 * SuggestionUser.
 *
 * An extension to the TestUser which can request recipient suggestions
 * based on a portion of the email address.
 */
class SuggestionUser extends TestUser {
	/**
	 * The name of the default itemmodule to which
	 * we send all item requests.
	 */
	protected $defaultItemModule;

	/**
	 * The name of the default listmodule to which
	 * we send all list requests.
	 */
	protected $defaultListModule;

	/**
	 * Initialize the TestUser.
	 */
	protected function initialize() {
		parent::initialize();

		$this->logon();

		$this->defaultItemModule = 'suggestemailaddressmodule';
		$this->defaultListModule = 'suggestemailaddressmodule';
	}

	/**
	 * Load all suggestions from the server.
	 *
	 * @param string $query The search query
	 *
	 * @return array The response from the server
	 */
	public function listSuggestions($query) {
		$this->logon();

		return $this->execute($this->defaultListModule, [
			'list' => [
				'query' => $query,
			],
		]);
	}

	/**
	 * Delete a suggestion.
	 *
	 * @param array $recipient The recipient record properties along with email address/ smtp address which should be removed
	 *
	 * @return array The response from the server
	 */
	public function deleteSuggestion($recipient) {
		$this->logon();

		return $this->execute($this->defaultListModule, [
			'delete' => $recipient,
		]);
	}
}
