<?php

/**
 * NewMailNotifier.
 *
 * Generates notifications for hierarchy folder updates (content unread).
 * Also piggybacks shared-store checks onto regular requests so that
 * shared mailbox changes appear without waiting for the full polling
 * interval.
 */
class NewMailNotifier extends Notifier {
	/**
	 * Epoch timestamp of the last shared-store check, used for
	 * throttling so we don't query shared hierarchies on every
	 * single request.
	 */
	private $lastSharedCheck = 0;

	/**
	 * Minimum number of seconds between shared-store hierarchy
	 * checks piggybacked onto regular requests.
	 */
	private const SHARED_CHECK_INTERVAL = 60;

	/**
	 * @return Number the event which this module handles
	 */
	#[Override]
	public function getEvents() {
		return HIERARCHY_UPDATE | REQUEST_END;
	}

	/**
	 * If an event elsewhere has occurred, it enters in this method. This method
	 * executes one or more actions, depends on the event.
	 *
	 * @param int    $event   event
	 * @param string $entryid entryid
	 * @param mixed  $props
	 */
	#[Override]
	public function update($event, $entryid, $props) {
		switch ($event) {
			case HIERARCHY_UPDATE:
				$this->updateFolderHierachy($props[0], $props[1]);
				break;

			case REQUEST_END:
				$this->checkSharedStores();
				break;
		}
	}

	/**
	 * Check shared stores for hierarchy changes, throttled to avoid
	 * querying on every single request.
	 */
	private function checkSharedStores() {
		$now = time();
		if (($now - $this->lastSharedCheck) < self::SHARED_CHECK_INTERVAL) {
			return;
		}
		$this->lastSharedCheck = $now;

		$supported_types = ['inbox' => 1, 'all' => 1];
		$users = $GLOBALS["settings"]->get("zarafa/v1/contexts/hierarchy/shared_stores", []);

		foreach ($users as $username => $data) {
			$key = array_keys($data)[0];
			$folder_type = $data[$key]['folder_type'];

			if (!isset($supported_types[$folder_type])) {
				continue;
			}

			$this->updateFolderHierachy(strtolower(hex2bin((string) $username)), $folder_type);
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
