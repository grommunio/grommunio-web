<?php

	require_once __DIR__ . '/../exceptions/class.SearchException.php';

	/**
	 * Module
	 * Superclass of every module. Many default functions are defined in this class.
	 */
	class Module {
		/**
		 * @var int unique id of the class
		 */
		public $id;

		/**
		 * @var string entryid, which will be registered by the bus object
		 */
		public $entryid;

		/**
		 * @var array list of all actions, which is received from the client
		 */
		public $data;

		/**
		 * @var array list of the results, which is send to the client
		 */
		public $responseData;

		/**
		 * @var array list of all the errors occurred
		 */
		public $errors;

		/**
		 * @var State The state object which refers to the statefile
		 */
		public $sessionState;

		/**
		 * @var array data stored in session for this module
		 */
		public $sessionData;

		/**
		 * Constructor.
		 *
		 * @param int   $id   unique id
		 * @param array $data list of all actions
		 */
		public function __construct($id, $data) {
			$this->id = $id;
			$this->data = $data;
			$this->errors = [];
			$this->responseData = [];
			$this->sessionState = false;
			$this->sessionData = false;

			$this->createNotifiers();

			// Get the store from $data and set it to properties class.
			// It is requires for multi server environment where namespace differs.
			// e.g. 'categories' => -2062020578, 'categories' => -2062610402,
			if (isset($GLOBALS['properties'])) {
				$GLOBALS['properties']->setStore($this->getActionStore($this->getActionData($data)));
			}
		}

		/**
		 * Creates the notifiers for this module,
		 * and register them to the Bus.
		 */
		public function createNotifiers() {
		}

		/**
		 * Executes all the actions in the $data variable.
		 *
		 * @return bool true on success of false on fialure
		 */
		public function execute() {
			// you must implement this function for each module
		}

		/**
		 * This will call $handleException of updating the MAPIException based in the module data.
		 * When this is done, $sendFeedback will be called to send the message to the client.
		 *
		 * @param object     $e             exception object
		 * @param string     $actionType    the action type, sent by the client
		 * @param MAPIobject $store         store object of the store
		 * @param string     $parententryid parent entryid of the message
		 * @param string     $entryid       entryid of the message/folder
		 * @param array      $action        the action data, sent by the client
		 */
		public function processException(&$e, $actionType = null, $store = null, $parententryid = null, $entryid = null, $action = null) {
			$this->handleException($e, $actionType, $store, $parententryid, $entryid, $action);
			$this->sendFeedback(false, $this->errorDetailsFromException($e));
		}

		/**
		 * Function does customization of MAPIException based on module data.
		 * like, here it will generate display message based on actionType
		 * for particular exception.
		 *
		 * @param object     $e             exception object
		 * @param string     $actionType    the action type, sent by the client
		 * @param MAPIobject $store         store object of the message
		 * @param string     $parententryid parent entryid of the message
		 * @param string     $entryid       entryid of the message/folder
		 * @param array      $action        the action data, sent by the client
		 */
		public function handleException(&$e, $actionType = null, $store = null, $parententryid = null, $entryid = null, $action = null) {
			if (is_null($e->displayMessage)) {
				switch ($actionType) {
					case "save":
						if ($e->getCode() == MAPI_E_NO_ACCESS) {
							$e->setDisplayMessage(_("You have insufficient privileges to save this message."));
						}
						else {
							$e->setDisplayMessage(_("Could not save message."));
						}
							$e->allowToShowDetailMessage = true;
						break;

					case "delete":
						if ($e->getCode() == MAPI_E_NO_ACCESS) {
							$e->setDisplayMessage(_("You have insufficient privileges to delete this message."));
						}
						else {
							$e->setDisplayMessage(_("Could not delete message."));
						}
						break;

					case "cancelMeetingRequest":
						if ($e->getCode() == MAPI_E_NO_ACCESS) {
							$e->setDisplayMessage(_("You have insufficient privileges to cancel this Meeting Request."));
						}
						else {
							$e->setDisplayMessage(_("Could not cancel Meeting Request."));
						}
						break;

					case "declineMeetingRequest":
						if ($e->getCode() == MAPI_E_NO_ACCESS) {
							$e->setDisplayMessage(_("You have insufficient privileges to decline this Meeting Request."));
						}
						else {
							$e->setDisplayMessage(_("Could not decline Meeting Request."));
						}
						break;

					case "acceptMeetingRequest":
						if ($e->getCode() == MAPI_E_NO_ACCESS) {
							$e->setDisplayMessage(_("You have insufficient privileges to accept this Meeting Request."));
						}
						else {
							$e->setDisplayMessage(_("Could not accept Meeting Request."));
						}
						break;

					case "cancelInvitation":
						if ($e->getCode() == MAPI_E_NO_ACCESS) {
							$e->setDisplayMessage(_("You have insufficient privileges to cancel Meeting Request invitation."));
						}
						else {
							$e->setDisplayMessage(_("Could not cancel Meeting Request invitations."));
						}
						break;

					case "updatesearch":
					case "stopsearch":
					case "search":
						if ($e->getCode() == MAPI_E_NOT_INITIALIZED) {
							$e->setDisplayMessage(_("You can not continue search operation on this folder."));
						}
						else {
							$e->setDisplayMessage(_("Error in search, please try again."));
						}
						break;

					case "expand":
						$e->setDisplayMessage(_("Error in distribution list expansion."));
						break;
				}
				Log::Write(
					LOGLEVEL_ERROR,
					"Module::handleException():" . $actionType . ": " . $e->displayMessage,
					$e,
					$action
				);
			}
		}

		/**
		 * Get quota information of user store and check for over qouta restrictions,
		 * if any qouta (softquota/hardquota) limit is exceeded then it will simply
		 * return appropriate message string according to quota type(hardquota/softquota).
		 *
		 * @param MAPIobject $store      Store object of the store
		 * @param string     $actionType the action type, sent by the client
		 * @param array      $action     the action data, sent by the client
		 *
		 * @return string short message according to quota type(hardquota/softquota) or a blank string
		 */
		public function getOverQuotaMessage($store) {
			if ($store === false) {
				$store = $GLOBALS['mapisession']->getDefaultMessageStore();
			}

			$storeProps = mapi_getprops($store, [PR_QUOTA_WARNING_THRESHOLD, PR_QUOTA_SEND_THRESHOLD, PR_QUOTA_RECEIVE_THRESHOLD, PR_MESSAGE_SIZE_EXTENDED]);

			$quotaDetails = [
				'store_size' => round($storeProps[PR_MESSAGE_SIZE_EXTENDED] / 1024),
				'quota_warning' => $storeProps[PR_QUOTA_WARNING_THRESHOLD],
				'quota_soft' => $storeProps[PR_QUOTA_SEND_THRESHOLD],
				'quota_hard' => $storeProps[PR_QUOTA_RECEIVE_THRESHOLD],
			];

			if ($quotaDetails['quota_hard'] !== 0 && $quotaDetails['store_size'] > $quotaDetails['quota_hard']) {
				return _('The message store has exceeded its hard quota limit.') . '<br/>' .
						_('To reduce the amount of data in this message store, select some items that you no longer need, delete them and cleanup your Deleted Items folder.');
			}

			// if hard quota limit doesn't restrict the operation then check for soft qouta limit
			if ($quotaDetails['quota_soft'] !== 0 && $quotaDetails['store_size'] > $quotaDetails['quota_soft']) {
				return _('The message store has exceeded its soft quota limit.') . '<br/> ' .
						_('To reduce the amount of data in this message store, select some items that you no longer need, delete them and cleanup your Deleted Items folder.');
			}

			return '';
		}

		/**
		 * sends a success or error message to client based on parameters passed.
		 *
		 * @param bool  $success              operation completed successfully or not
		 * @param array $data                 the data array that will be send to the client as a response to success/failure
		 * @param bool  $addResponseDataToBus if true then data will be added to bus otherwise data
		 *                                    will be stored in module and later requests can add it to bus
		 */
		public function sendFeedback($success = false, $data = [], $addResponseDataToBus = true) {
			// Send success/error message to client
			$this->addActionData($success == true ? "success" : "error", $data);

			if ($addResponseDataToBus) {
				$GLOBALS["bus"]->addData($this->getResponseData());
			}
		}

		/**
		 * Function will retrieve error details from exception object based on exception type.
		 * it should also send type of exception with the data. so client can know which type
		 * of exception is generated.
		 *
		 * @param object $exception the exception object which is generated
		 *
		 * @return array error data
		 */
		public function errorDetailsFromException($exception) {
			if (!$exception->isHandled) {
				if ($exception instanceof MAPIException) {
					$exception->setHandled();

					return [
						"type" => ERROR_MAPI,
						"info" => [
							"hresult" => $exception->getCode(),
							"title" => $exception->getTitle(),
							"hresult_name" => get_mapi_error_name($exception->getCode()),
							"file" => $exception->getFileLine(),
							"display_message" => $exception->getDisplayMessage(),
							"details_message" => $exception->getDetailsMessage(),
						],
					];
				}
				if ($exception instanceof ZarafaException) {
					$exception->setHandled();

					return [
						"type" => ERROR_ZARAFA,
						"info" => [
							"file" => $exception->getFileLine(),
							"title" => $exception->getTitle(),
							"display_message" => $exception->getDisplayMessage(),
							"original_message" => $exception->getMessage(),
						],
					];
				}
			}

			return [];
		}

		/**
		 * Function which returns an entryid, which is used to register this module. It
		 * searches in the class variable $data for a ParentEntryID or an EntryID.
		 *
		 * @return string an entryid if found, false if entryid not found
		 */
		public function getEntryID() {
			$entryid = false;
			foreach ($this->data as $action) {
				if (isset($action["parent_entryid"]) && !empty($action["parent_entryid"])) {
					$entryid = $action["parent_entryid"];
				}
				elseif (isset($action["entryid"]) && !empty($action["entryid"])) {
					$entryid = $action["entryid"];
				}
			}

			return $entryid;
		}

		/**
		 * Returns all the errors, which occurred.
		 *
		 * @return array an array of all the errors, which occurred
		 */
		public function getErrors() {
			return $this->errors;
		}

		/**
		 * Returns the response data.
		 *
		 * @return array An array of the response data. This data is send to the client.
		 */
		public function getData() {
			return $this->responseData;
		}

		/**
		 * Sets the action data, which will be executed.
		 *
		 * @param array $data array of all the actions
		 */
		public function setData($data) {
			$this->data = $data;
		}

		/**
		 * Function which returns MAPI Message Store Object. It
		 * searches in the variable $action for a storeid.
		 *
		 * @param array $action the XML data retrieved from the client
		 *
		 * @return object MAPI Message Store Object, false if storeid is not found in the $action variable
		 */
		public function getActionStore($action) {
			$store = false;

			try {
				if (isset($action["store_entryid"]) && !empty($action["store_entryid"])) {
					if (is_array($action["store_entryid"])) {
						$store = [];
						foreach ($action["store_entryid"] as $store_id) {
							array_push($store, $GLOBALS["mapisession"]->openMessageStore(hex2bin($store_id)));
						}
					}
					elseif (ctype_xdigit($action["store_entryid"])) {
						$store = $GLOBALS["mapisession"]->openMessageStore(hex2bin($action["store_entryid"]));
					}
				}
			}
			catch (Exception $e) {
			}

			return $store;
		}

		/**
		 * Function which returns a parent entryid. It
		 * searches in the variable $action for a parententryid.
		 *
		 * @param array $action the XML data retrieved from the client
		 *
		 * @return object MAPI Message Store Object, false if parententryid is not found in the $action variable
		 */
		public function getActionParentEntryID($action) {
			$parententryid = false;

			if (isset($action["parent_entryid"]) && !empty($action["parent_entryid"])) {
				$parententryid = hex2bin($action["parent_entryid"]);
			}

			return $parententryid;
		}

		/**
		 * Function which returns an entryid. It
		 * searches in the variable $action for an entryid.
		 *
		 * @param array $action the XML data retrieved from the client
		 *
		 * @return object MAPI Message Store Object, false if entryid is not found in the $action variable
		 */
		public function getActionEntryID($action) {
			$entryid = false;

			if (isset($action["entryid"]) && !empty($action["entryid"])) {
				if (is_array($action["entryid"])) {
					$entryid = [];
					foreach ($action["entryid"] as $action_entryid) {
						array_push($entryid, hex2bin($action_entryid));
					}
				}
				else {
					$entryid = hex2bin($action["entryid"]);
				}
			}

			return $entryid;
		}

		/**
		 * Helper function which used to get the action data from request.
		 *
		 * @param array $data list of all actions
		 *
		 * @return array $action the json data retrieved from the client
		 */
		public function getActionData($data) {
			$actionData = false;
			foreach ($data as $actionType => $action) {
				if (isset($actionType)) {
					$actionData = $action;
				}
			}

			return $actionData;
		}

		/**
		 * Function which adds action data to module, so later it can be retrieved to send.
		 *
		 * @param string $actionType type of action that response data corresponds
		 * @param mixed  $data
		 *
		 * @return array data object
		 */
		public function addActionData($actionType, $data) {
			if (!isset($this->responseData[$actionType])) {
				$this->responseData[$actionType] = $data;
			}
		}

		/**
		 * Function which returns response data that will be sent to client. If there isn't any data added
		 * to response data then it will return a blank array.
		 *
		 * @return object response data
		 */
		public function getResponseData() {
			if (!empty($this->responseData)) {
				return
					[
						$this->getModuleName() => [
							$this->id => $this->responseData,
						],
					];
			}

			return [];
		}

		/**
		 * Function which returns name of the module class.
		 *
		 * @return string module name
		 */
		public function getModuleName() {
			return strtolower(get_class($this));
		}

		/**
		 * Function which will handle unknown action type for all modules.
		 *
		 * @param string $actionType action type
		 */
		public function handleUnknownActionType($actionType) {
			$this->sendFeedback(
				false,
				[
					"type" => ERROR_ZARAFA,
					"info" => [
						"display_message" => _("Could not process request data properly."),
						"original_message" => sprintf(_("Unknown action type specified - %s"), $actionType),
					],
				]
			);
			Log::Write(
				LOGLEVEL_ERROR,
				"Module::handleUnknownActionType(): ERROR_ZARAFA : " . _("Could not process request data properly."),
				sprintf(_("Unknown action type specified - %s"), $actionType)
			);
		}

		/**
		 * Loads sessiondata of the module from state file on disk.
		 */
		public function loadSessionData() {
			$this->sessionState = new State('module_sessiondata');
			$this->sessionState->open();
			$this->sessionData = $this->sessionState->read($this->getModuleName());
		}

		/**
		 * Saves sessiondata of the module to the state file on disk.
		 */
		public function saveSessionData() {
			if ($this->sessionData !== false) {
				$this->sessionState->write($this->getModuleName(), $this->sessionData);
			}
			$this->sessionState->close();
		}
	}
