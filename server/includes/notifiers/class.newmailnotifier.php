<?php

/**
 * NewMailNotifier.
 *
 * Generates notifications for hierarchy folder updates (content unread).
 */
class NewMailNotifier extends Notifier {
	/**
	 * @return Number the event which this module handles
	 */
	public function getEvents() {
		return HIERARCHY_UPDATE;
	}

	/**
	 * If an event elsewhere has occurred, it enters in this method. This method
	 * executes one or more actions, depends on the event.
	 *
	 * @param int    $event   event
	 * @param string $entryid entryid
	 * @param mixed  $props
	 */
	public function update($event, $entryid, $props) {
		switch ($event) {
			case HIERARCHY_UPDATE:
				$this->updateFolderHierachy($props[0], $props[1]);
				break;
		}
	}

	/**
	 * Fetch the folder hierarchy from the IPM.Subtree with the properties required for the newmail notification
	 * for grommunio Web client.
	 *
	 * The returned hierarchy is cached in the session state and compared when the function is called, when
	 * the data differs newmail notifications for the changed folder(s) are created and send to the client.
	 *
	 * @param string $username   The user for whom the store is checked for mail updates. If not set, it will be
	 *                           current user's own store.
	 * @param string $folderType the type of shared folder (all, inbox or calendar)
	 */
	private function updateFolderHierachy($username = '', $folderType = '') {
		$counterState = new State('counters_sessiondata');
		$counterState->open();
		$cacheKey = 'sessionData';
		if ($username) {
			$cacheKey = $username;
		}

		$sessionData = $counterState->read($cacheKey);
		if (!is_array($sessionData)) {
			$sessionData = [];
		}

		$folderStatCache = updateHierarchyCounters($username, $folderType);

		if ($folderStatCache !== $sessionData) {
			$data = ["item" => []];

			foreach ($folderStatCache as $display_name => $props) {
				if (isset($sessionData[$display_name]) &&
					$sessionData[$display_name]['commit_time'] !== $props['commit_time']) {
					if ($username) {
						$name = $GLOBALS["mapisession"]->getDisplayNameofUser($username);
					}
					else {
						$name = null;
					}
					$data['item'][] = [
						'entryid' => $props['entryid'],
						'store_entryid' => $props['store_entryid'],
						'content_count' => $props['content_count'],
						'content_unread' => $props['content_unread'],
						'display_name' => $display_name,
						'user_display_name' => $name,
					];
				}
			}

			$this->addNotificationActionData("newmail", $data);
			$GLOBALS["bus"]->addData($this->createNotificationResponseData());

			$counterState->write($cacheKey, $folderStatCache);
		}

		$counterState->close();
	}
}
