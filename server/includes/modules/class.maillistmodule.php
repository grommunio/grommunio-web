<?php
	/**
	 * Mail Module
	 */
	class MailListModule extends ListModule
	{
		/**
		 * Constructor
		 * @param int $id unique id.
		 * @param array $data list of all actions.
		 */
		function __construct($id, $data)
		{
			$this->properties = $GLOBALS["properties"]->getMailListProperties();

			parent::__construct($id, $data);
		}

		/**
		 * Creates the notifiers for this module,
		 * and register them to the Bus.
		 */
		function createNotifiers()
		{
			$entryid = $this->getEntryID();
			$GLOBALS["bus"]->registerNotifier('maillistnotifier', $entryid);
		}

		/**
		 * Executes all the actions in the $data variable.
		 * @return boolean true on success of false on fialure.
		 */
		function execute()
		{
			$GLOBALS['PluginManager']->triggerHook("server.module.maillistmodule.execute.before", array('moduleObject' =>& $this));

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
							case "updatelist":
								$this->getDelegateFolderInfo($store);
								$this->messageList($store, $entryid, $action, $actionType);
								break;
							case "search":
								// @FIXME add handling for private items
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
					} catch (SearchException $e) {
						$this->processException($e, $actionType);
					}
				}
			}
			$GLOBALS['PluginManager']->triggerHook("server.module.maillistmodule.execute.after", array('moduleObject' =>& $this));
		}

		/**
		 * Function does customization of exception based on module data.
		 * like, here it will generate display message based on actionType
		 * for particular exception.
		 * 
		 * @param object $e Exception object
		 * @param string $actionType the action type, sent by the client
		 * @param MAPIobject $store Store object of the current user.
		 * @param string $parententryid parent entryid of the message.
		 * @param string $entryid entryid of the message.
		 * @param array $action the action data, sent by the client
		 */
		function handleException(&$e, $actionType = null, $store = null, $parententryid = null, $entryid = null, $action = null)
		{
			if(is_null($e->displayMessage)) {
				switch($actionType)
				{
					case "list":
						if($e->getCode() == MAPI_E_NO_ACCESS)
							$e->setDisplayMessage(_("You have insufficient privileges to see the contents of this folder."));
						else
							$e->setDisplayMessage(_("Could not load the contents of this folder."));
						break;

					case "search":
						if($e->getCode() == MAPI_E_NO_ACCESS)
							$e->setDisplayMessage(_("You have insufficient privileges to perform search operation in this folder."));
						else
							$e->setDisplayMessage(_("Error in search, please try again"));
						break;

					case "updatesearch":
						$e->setDisplayMessage(_("Could not update search results."));
						break;

					case "stopsearch":
						$e->setDisplayMessage(_("Could not stop search operation."));
						break;
				}
			}

			parent::handleException($e, $actionType, $store, $parententryid, $entryid, $action);
		}
	}
?>
