<?php
	/**
	 * NewMailNotifier
	 *
	 * Generates notifications for hiearchy folder updates (content unread).
	 */
	class NewMailNotifier extends Notifier
	{
		/**
		 * @return Number the event which this module handles.
		 */
		public function getEvents()
		{
			return HIERARCHY_UPDATE;
		}

		/**
		 * If an event elsewhere has occurred, it enters in this methode. This method
		 * executes one ore more actions, depends on the event.
		 * @param int $event Event.
		 * @param string $entryid Entryid.
		 * @param array $data array of data.
		 */
		public function update($event, $entryid, $props)
		{
			switch ($event) {
				case HIERARCHY_UPDATE:
					$this->updateFolderHierachy();
					break;
			}
		}

		/**
		 * Fetch the folder hierachy from the IPM.Subtree with the properties required for the newmail notification
		 * for the WebApp client.
		 *
		 * The returned hierachy is cached in the session state and compared when the function is called, when
		 * the data differs newmail notifications for the changed folder(s) are created and send to the client.
		 */
		private function updateFolderHierachy() {
			$store = $GLOBALS["mapisession"]->getDefaultMessageStore();

			$counterState = new State('counters_sessiondata');
			$counterState->open();

			$sessionData = $counterState->read("sessionData");
			if (!is_array($sessionData)) {
				$sessionData = array();
			}

			$folderStatCache = update_hierarchy_counters();

			if ($folderStatCache !== $sessionData) {
				$data = array("item" => array());

				foreach($folderStatCache as $display_name => $props) {
					if (isset($sessionData[$display_name]) &&
						$sessionData[$display_name]['commit_time'] !== $props['commit_time']) {
						$data['item'][] = array(
							'entryid' =>  $props['entryid'],
							'store_entryid' => $props['store_entryid'],
							'content_count' => $props['content_count'],
							'content_unread' => $props['content_unread'],
							'display_name' => $display_name,
						);
					}
				}

				$this->addNotificationActionData("newmail", $data);
				$GLOBALS["bus"]->addData($this->createNotificationResponseData());

				$counterState->write("sessionData", $folderStatCache);
			}

			$counterState->close();
		}
	}
?>
