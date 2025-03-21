<?php

/**
 * StickyNote Module.
 */
class StickyNoteListModule extends ListModule {
	/**
	 * Constructor.
	 *
	 * @param int   $id   unique id
	 * @param array $data list of all actions
	 */
	public function __construct($id, $data) {
		parent::__construct($id, $data);

		$this->properties = $GLOBALS["properties"]->getStickyNoteListProperties();

		$this->start = 0;
	}

	/**
	 * Creates the notifiers for this module,
	 * and register them to the Bus.
	 */
	public function createNotifiers() {
		$entryid = $this->getEntryID();
		$GLOBALS["bus"]->registerNotifier('stickynotelistnotifier', $entryid);
	}

	/**
	 * Executes all the actions in the $data variable.
	 */
	public function execute() {
		foreach ($this->data as $actionType => $action) {
			if (isset($actionType)) {
				try {
					$store = $this->getActionStore($action);
					$entryid = $this->getActionEntryID($action);

					match ($actionType) {
                        "list" => $this->messageList($store, $entryid, $action, $actionType),
                        "search" => $this->search($store, $entryid, $action, $actionType),
                        "updatesearch" => $this->updatesearch($store, $entryid, $action),
                        "stopsearch" => $this->stopSearch($store, $entryid, $action),
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
	 * Function will be used to process private items in a list response,
	 * sticky notes doesn't have private items so function is overridden to not do
	 * any processing.
	 *
	 * @param object $item item properties
	 *
	 * @return object item properties if its non private item otherwise empty array
	 */
	public function processPrivateItem($item) {
		return $item;
	}
}
