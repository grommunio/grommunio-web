<?php
require_once('classes/KopanoUser.php');
require_once('classes/TaskUser.php');
require_once('classes/TestData.php');
require_once('classes/KopanoTest.php');

/**
 * SearchTasksTest
 *
 * Tests all possible cases for searching Tasks
 */
class SearchTasksTest extends KopanoTest {
	/**
	 * The default user
	 */
	private $user;

	/**
	 * The message which will be handled
	 */
	private $message;

	/**
	 * During setUp we create the user
	 */
	protected function setUp()
	{
		parent::setUp();

		$this->user = $this->addUser(new TaskUser(new KopanoUser(KOPANO_USER1_NAME, KOPANO_USER1_PASSWORD)));

		$this->message = array(
			'props' => TestData::getTask(),
		);
	}

	/**
	 * Test if a search can be performed without using a search folder
	 * @dataProvider providerTaskProps
	 */
	public function testStartSearching($prop, $value)
	{
		try {
			$this->user->saveTask($this->message);
			$searchResult = $this->user->doSearch($prop, $value);
		} catch (Exception $e) {
			$this->fail('Test that a search for Tasks can be started: ' . $e->getMessage() . PHP_EOL . $e->getTraceAsString());
		}

		$this->assertArrayHasKey('list', $searchResult, 'Test that the search result contains the \'list\' array');
		$this->assertArrayHasKey('item', $searchResult['list'], 'Test that the update result contains the \'item\' array');
	}

	/**
	 * Test if a search returns the correct search results
	 * @dataProvider providerTaskProps
	 */
	public function testSearchResults($prop, $value)
	{
		try {
			$this->user->saveTask($this->message);
			$searchResult = $this->user->doSearch($prop, $value);
		} catch (Exception $e) {
			$this->fail('Test that searching tasks returns items: ' . $e->getMessage() . PHP_EOL . $e->getTraceAsString());
		}

		$this->assertCount(1, $searchResult['list']['item'], 'Test that the item has been found during search');
		$this->assertEquals(1, $searchResult['list']['page']['totalrowcount'], 'Test that the search indicates the correct number of results');
	}

	/**
	 * Test if a search can be started using a search folder
	 * @dataProvider providerTaskProps
	 */
	public function testStartSearchingInSearchFolder($prop, $value)
	{
		$this->user->saveTask($this->message);

		$searchResult = $this->user->startSearch($prop, $value);

		$this->assertArrayHasKey('search', $searchResult, 'Test that the search result contains the \'search\' array');
		$this->assertArrayHasKey('search_meta', $searchResult['search'], 'Test that the update result contains the \'search_meta\' array');
		$this->assertArrayHasKey('searchstate', $searchResult['search']['search_meta'], 'Test that the update result contains the \'searchstate\'');
	}

	/**
	 * Test if updates for a search folder can be requested
	 */
	public function testUpdateSearchingInSearchFolder()
	{
		$this->user->saveTask($this->message);

		$this->user->startSearch('subject', $this->message['props']['subject']);
		$updateResult = $this->user->updateSearch();

		$this->assertArrayHasKey('updatesearch', $updateResult, 'Test that the update result contains the \'updatesearch\' array');
		$this->assertArrayHasKey('search_meta', $updateResult['updatesearch'], 'Test that the update result contains the \'search_meta\' array');
		$this->assertArrayHasKey('searchstate', $updateResult['updatesearch']['search_meta'], 'Test that the update result contains the \'searchstate\'');
	}

	/**
	 * Test if a search in a search folder can be ended
	 * @dataProvider providerTaskProps
	 */
	public function testStopSearchingInSearchFolder($prop, $value)
	{
		$this->user->saveTask($this->message);

		$this->user->startSearch($prop, $value);
		$stopResult = $this->user->stopSearch();

		$this->assertArrayHasKey('stopsearch', $stopResult, 'Test that the response contains the \'stopsearch\' array');
		$this->assertArrayHasKey('success', $stopResult['stopsearch'], 'Test that the response contains the \'success\' property');
		$this->assertTrue($stopResult['stopsearch']['success'], 'Test that the search request could successfully be stopped');
	}

	/**
	 * Test if search results can be found
	 * @dataProvider providerTaskProps
	 */
	public function testSearchResultsFromSearchFolder($prop, $value)
	{
		$this->user->saveTask($this->message);

		$searchResult = $this->user->startSearch($prop, $value);

		$this->assertCount(1, $searchResult['search']['item'], 'Test that initially there is a result');
		$this->assertEquals(1, $searchResult['search']['search_meta']['results'], 'Test that the search indicates the correct number of results');
	}

	/**
	 * Test if search results are returned on update
	 * @dataProvider providerTaskProps
	 */
	public function testSearchResultsAfterUpdateFromSearchFolder($prop, $value)
	{
		$searchResult = $this->user->startSearch($prop, $value);

		$this->user->saveTask($this->message);

		// wait at most 10 seconds to wait for the search folder to be updated
		for ($i = 0; $i < 10; $i++) {
			$updateResult = $this->user->updateSearch();
			if ($updateResult['updatesearch']['search_meta']['results'] > 0) {
				break;
			}
			sleep(1);
		}

		$this->assertCount(0, $searchResult['search']['item'], 'Test that initially there are no results');
		$this->assertEquals(0, $searchResult['search']['search_meta']['results'], 'Test that the search indicates the correct number of results');
		$this->assertCount(1, $updateResult['updatesearch']['item'], 'Test that the item has been found in the folder during the update');
		$this->assertEquals(1, $updateResult['updatesearch']['search_meta']['results'], 'Test that the search update indicates the correct number of results');
	}

	/**
	 * Test if a search returns the correct search results
	 * @dataProvider providerSpecialCharacterProps
	 */
	public function testSearchSpecialCharactersResults($subject, $keyword, $matches = true)
	{
		$this->message['props']['subject'] = $subject;

		$this->user->saveTask($this->message);
		$searchResult = $this->user->doSearch('PR_SUBJECT', $keyword);

		if($matches) {
			$this->assertCount(1, $searchResult['list']['item'], 'Test that the item has been found during search');
			$this->assertEquals(1, $searchResult['list']['page']['totalrowcount'], 'Test that the search indicates the correct number of results');
		} else {
			$this->assertCount(0, $searchResult['list']['item'], 'Test that the item has not been found during search');
			$this->assertEquals(0, $searchResult['list']['page']['totalrowcount'], 'Test that the search indicates the correct number of results');
		}
	}

	/**
	 * This will feed property references in all ways currently possible
	 * - as a key in the properties array, e.g. 'subject'
	 * - as the name of a constant, e.g. 'PR_SUBJECT'
	 */
	public function providerTaskProps()
	{
		$task = TestData::getTask();

		return array(
			array('subject', $task['subject']),
			array('PR_SUBJECT', $task['subject']),
			array('body', $task['body']),
			array('PR_BODY', $task['body'])
		);
	}
}
?>
