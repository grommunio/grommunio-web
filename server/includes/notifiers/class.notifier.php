<?php
	/**
	 * Notifier
	 *
	 * Superclass for every notifier.
	 */
	class Notifier {
		/**
		 * @var array list of the notifications, which is send to the client.
		 */
		private $responseNotificationData;

		/**
		 * @var int notification counter of the class
		 */
		private $notifyCount;

		public function __construct()
		{
			$this->notifyCount = 0;
			$this->responseNotificationData = array();
		}

		/**
		 * @return Number Return the bitmask of events which are handled
		 * by this notifier. The bitmask can consist of the 
		 * OBJECT_SAVE, OBJECT_DELETE, TABLE_SAVE, TABLE_DELETE, REQUEST_START and REQUEST_END flags
		 */
		public function getEvents()
		{
			return 0;
		}

		/**
		 * Function which resets the data and the response data class variable.
		 */
		public function reset()
		{
			$this->notifyCount = 0;
			$this->responseNotificationData = array();
		}

		/**
		 * Function which returns name of the notifier class.
		 * @return string notifier name.
		 */
		public function getNotifierName()
		{
			return strtolower(get_class($this));
		}

		/**
		 * Function which adds notification data to module, so later it can be retrieved to send.
		 * @param string $actionType type of action that response data corresponds.
		 * @return array data object.
		 */
		protected function addNotificationActionData($actionType, $data)
		{
			if (!isset($this->responseNotificationData[$actionType])) {
				$this->responseNotificationData[$actionType] = $data;
			}
		}

		/**
		 * Function which returns notification data that will be sent to client. If there isn't any data added
		 * to response data then it will return a blank array.
		 * @return object response data.
		 */
		protected function createNotificationResponseData()
		{
			if (!empty($this->responseNotificationData)) {
				$moduleName = $this->getNotifierName();
				$idName = $moduleName . (++$this->notifyCount);

				$response = array(
					$moduleName => array(
						$idName => $this->responseNotificationData
					)
				);

				// Clear notification data, the response which is being returned
				// should be sent to the client.
				$this->responseNotificationData = array();

				return $response;
			} else {
				return array();
			}
		}

		/**
		 * If an event elsewhere has occurred, it enters in this methode. This method
		 * executes one ore more actions, depends on the event.
		 * @param int $event Event.
		 * @param string $entryid Entryid.
		 * @param array $data array of data.
		 */
		public function update($event, $entryid, $data)
		{
			// you must implement this function for each notifier
		}
	}
?>
