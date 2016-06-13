<?php
	include_once(__DIR__ . '/../mapi/class.taskrecurrence.php');

	/**
	 * Task Module
	 */
	class TaskListModule extends ListModule
	{
		/**
		 * Constructor
		 * @param int $id unique id.
		 * @param array $data list of all actions.
		 */
		function __construct($id, $data)
		{
			$this->properties = $GLOBALS["properties"]->getTaskListProperties();

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
			$GLOBALS["bus"]->registerNotifier('tasklistnotifier', $entryid);
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
						$parententryid = $this->getActionParentEntryID($action);
						$entryid = $this->getActionEntryID($action);

						switch($actionType)
						{
							case "list":
								$this->getDelegateFolderInfo($store);
								$this->messageList($store, $entryid, $action, $actionType);
								break;
							case "search":
								// @FIXME add handling of private items
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
	}
?>
