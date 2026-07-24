<?php

require_once __DIR__ . '/../core/class.categorylist.php';

/**
 * CategoryListModule.
 *
 * Serves the per-mailbox master category list (the Outlook-compatible list
 * stored in each mailbox's Calendar folder, see {@link CategoryList}). Every
 * request targets a single store via store_entryid; when none is given the
 * logged-in user's own default store is used. This is what makes the list
 * per-mailbox and shared: opening a shared mailbox reads that mailbox's list,
 * not the current user's.
 */
class CategoryListModule extends Module {
	/**
	 * @param int   $id   unique id
	 * @param array $data list of all actions
	 */
	public function __construct($id, $data) {
		parent::__construct($id, $data);
	}

	/**
	 * Execute all actions in the request.
	 */
	#[Override]
	public function execute() {
		foreach ($this->data as $actionType => $action) {
			if (isset($actionType)) {
				try {
					match ($actionType) {
						"list" => $this->listCategories($action),
						"save" => $this->saveCategories($action),
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
	 * Resolve the store an action targets, defaulting to the user's own store.
	 *
	 * @param array $action the action data sent by the client
	 * @return resource the message store to operate on
	 */
	private function getStoreForAction($action) {
		$store = $this->getActionStore($action);
		if (!$store) {
			$store = $GLOBALS["mapisession"]->getDefaultMessageStore();
		}

		return $store;
	}

	/**
	 * Return the master category list of the requested store.
	 *
	 * @param array $action the action data sent by the client
	 */
	private function listCategories($action) {
		$store = $this->getStoreForAction($action);
		$this->sendCategories("list", $store, new CategoryList($store));
	}

	/**
	 * Store the master category list of the requested store, then return the
	 * re-read list so the client picks up merged/preserved data.
	 *
	 * @param array $action the action data sent by the client
	 */
	private function saveCategories($action) {
		$store = $this->getStoreForAction($action);
		$categories = isset($action["categories"]) && is_array($action["categories"]) ? $action["categories"] : [];
		$categoryList = new CategoryList($store);
		$categoryList->setCategories($categories);
		$this->sendCategories("update", $store, $categoryList);
	}

	/**
	 * Send a category list to the client, tagged with the store it belongs to
	 * (so the client can key its per-store cache).
	 *
	 * @param string       $actionType   the response action type
	 * @param resource     $store        the store the list belongs to
	 * @param CategoryList $categoryList the list accessor for that store
	 */
	private function sendCategories($actionType, $store, CategoryList $categoryList) {
		$storeProps = mapi_getprops($store, [PR_ENTRYID]);
		$this->addActionData($actionType, [
			"store_entryid" => bin2hex((string) $storeProps[PR_ENTRYID]),
			"categories" => $categoryList->getCategories(),
		]);
		$GLOBALS["bus"]->addData($this->getResponseData());
	}
}
