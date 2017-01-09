<?php
	/**
	 * StickyNote Module
	 */
	class StickyNoteListModule extends ListModule
	{
		/**
		 * Constructor
		 * @param int $id unique id.
		 * @param array $data list of all actions.
		 */
		function __construct($id, $data)
		{
			$this->properties = $GLOBALS["properties"]->getStickyNoteListProperties();

			parent::__construct($id, $data);

			$this->start = 0;
		}

		/**
		 * Creates the notifiers for this module,
		 * and register them to the Bus.
		 */
		function createNotifiers()
		{
			$entryid = $this->getEntryID();
			$GLOBALS["bus"]->registerNotifier('stickynotelistnotifier', $entryid);
		}

		/**
		 * Executes all the actions in the $data variable.
		 * @return boolean true on success of false on fialure.
		 */
		function execute()
		{
			foreach($this->data as $actionType => $action)
			{
				if(isset($actionType)) {
					try {
						$store = $this->getActionStore($action);
						$entryid = $this->getActionEntryID($action);

						switch($actionType)
						{
							case "list":
								$this->messageList($store, $entryid, $action, $actionType);
								break;
							case "search":
								$this->search($store, $entryid, $action, $actionType);
								break;
							case "updatesearch":
								$this->updatesearch($store, $entryid, $action);
								break;
							case "stopsearch":
								$this->stopSearch($store, $entryid, $action);
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
		 * Function will be used to process private items in a list response,
		 * sticky notes doesn't have private items so function is overriden to not do 
		 * any processing.
		 * @param {Object} $item item properties
		 * @return {Object} item properties if its non private item otherwise empty array
		 */
		function processPrivateItem($item)
		{
			return $item;
		}
	}
?>
