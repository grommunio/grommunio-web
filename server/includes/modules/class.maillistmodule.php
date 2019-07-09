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

		/**
		 * Parses the incoming sort request and builds a MAPI sort order.
		 * Overridden to rewrite the sorting for flags. (because the flags that are shown in the WebApp
		 * are a combination of several properties)
		 *
		 * @param array $action the action data, sent by the client
		 * @param array|bool $map Normally properties are mapped from the XML to MAPI by the standard
		 * $this->properties mapping. However, if you want other mappings, you can specify them in this parameter.
		 * @param bool $allow_multi_instance Sort as multi-value instance (every value a different row)
		 * @param array|bool a custom set of properties to use instead of the properties stored in module
		 */
		function parseSortOrder($action, $map = false, $allow_multi_instance = false, $properties = false)
		{
			if(isset($action['sort'])) {
				// Check if the user wants to sort the maillist on flags.
				// If so, we will rewrite the sorting a little
				if ( is_array($action['sort']) && count($action['sort'])>0 && $action['sort'][0]['field'] === 'flag_due_by' ) {
					$dir = $action['sort'][0]['direction'];
					$action['sort'] = array(
						array(
							'field' => 'flag_status',
							'direction' => $dir,
						),
						array(
							'field' => 'duedate',
							'direction' => $dir === 'ASC' ? 'DESC' : 'ASC',
						),
						array(
							'field' => 'flag_due_by',
							'direction' => $dir,
						),
					);
				}
			}

			parent::parseSortOrder($action, $map, $allow_multi_instance, $properties);
		}
	}
?>
