<?php

require_once 'classes/grommunioUser.php';
require_once 'classes/SuggestionUser.php';
require_once 'classes/MailUser.php';
require_once 'classes/TestData.php';
require_once 'classes/grommunioTest.php';

/**
 * @internal
 * @coversNothing
 */
class DeleteSuggestionsTest extends grommunioTest {
	/**
	 * The default user.
	 */
	private $user;

	/**
	 * The default user which will be sending the mail.
	 */
	private $mailUser;

	/**
	 * During setUp we create the user.
	 */
	protected function setUp() {
		parent::setUp();

		$this->user = $this->addUser(new SuggestionUser(new grommunioUser(GROMMUNIO_USER1_NAME, GROMMUNIO_USER1_PASSWORD)));
		$this->mailUser = $this->addUser(new MailUser(new grommunioUser(GROMMUNIO_USER1_NAME, GROMMUNIO_USER1_PASSWORD)));
	}

	/**
	 * Tests if a non-existing suggestion can be deleted.
	 */
	public function testDeleteNonExistingSuggestion() {
		$data = [
			'email_address' => GROMMUNIO_USER2_NAME,
			'smtp_address' => GROMMUNIO_USER2_EMAIL_ADDRESS,
		];
		$response = $this->user->deleteSuggestion($data);

		$this->assertArrayHasKey('success', $response, 'Test that the response contains the \'success\' property');
	}

	/**
	 * Test deleting a suggestion.
	 */
	public function testDeleteExistingSuggestion() {
		// send the mail to the user
		$recipient1 = $this->addUser(new MailUser(new grommunioUser(GROMMUNIO_USER2_NAME, GROMMUNIO_USER2_PASSWORD)));
		$message = [
			'props' => TestData::getMail(),
			'recipients' => [
				'add' => [
					$recipient1->getRecipient(),
				],
			],
		];
		$this->mailUser->sendMail($message);

		// Delete the created suggestion, and load all suggestions
		$this->user->deleteSuggestion($recipient1->getRecipient());
		$response = $this->user->listSuggestions(GROMMUNIO_USER2_NAME);

		$this->assertArrayHasKey('list', $response, 'Test that the response contains the \'list\' object');
		$this->assertEquals(GROMMUNIO_USER2_NAME, $response['list']['query'], 'Test that the query matches the send query');
		$this->assertEmpty($response['list']['results'], 'Test that no results where returned');
	}
}
