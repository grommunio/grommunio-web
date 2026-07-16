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
	 * Check shared and public stores for hierarchy changes, throttled to avoid
	 * querying on every single request.
	 */
	private function checkSharedStores() {
		$now = time();
		if (($now - $this->lastSharedCheck) < self::SHARED_CHECK_INTERVAL) {
			return;
		}
		$this->lastSharedCheck = $now;

		$this->updateOpenedStoreHierachies();

		if (ENABLE_PUBLIC_FOLDERS) {
			$this->updatePublicFolderHierachy();
		}
	}

	/**
	 * Update unread counters for all opened non-public stores.
	 */
	private function updateOpenedStoreHierachies() {
		$stores = $GLOBALS["mapisession"]->getOtherUserStore();
		$defaultStoreEntryId = $GLOBALS["mapisession"]->getDefaultMessageStoreEntryId();

		foreach ($stores as $store) {
			try {
				$storeProps = mapi_getprops($store, [PR_ENTRYID, PR_MDB_PROVIDER, PR_DISPLAY_NAME, PR_MAILBOX_OWNER_NAME]);
			}
			catch (MAPIException $e) {
				$e->setHandled();
				continue;
			}

			if (($storeProps[PR_MDB_PROVIDER] ?? null) == ZARAFA_STORE_PUBLIC_GUID) {
				continue;
			}

			$storeEntryId = bin2hex((string) $storeProps[PR_ENTRYID]);
			$isDefaultStore = $GLOBALS["entryid"]->compareEntryIds($storeEntryId, $defaultStoreEntryId);
			$cacheKey = $isDefaultStore ? 'sessionData' : 'store_' . $storeEntryId;
			$displayName = $isDefaultStore ? null : str_replace('Inbox - ', '', $storeProps[PR_MAILBOX_OWNER_NAME] ?? $storeProps[PR_DISPLAY_NAME] ?? '');
			$folderType = $this->getOpenedStoreFolderType($storeProps[PR_ENTRYID]);

			$this->updateFolderHierachy('', $folderType, $store, $cacheKey, $displayName, $isDefaultStore);
		}
	}

	/**
	 * Returns the configured folder type for a manually opened shared store.
	 * Automatically opened stores do not have a setting and use the full subtree.
	 *
	 * @param string $storeEntryId binary store entryid
	 *
	 * @return string folder type for counter updates
	 */
	private function getOpenedStoreFolderType($storeEntryId) {
		$username = $GLOBALS["mapisession"]->getUserNameOfStore($storeEntryId);
		if (!$username) {
			return '';
		}

		$otherUsers = $GLOBALS["mapisession"]->retrieveOtherUsersFromSettings();
		if (!isset($otherUsers[$username])) {
			return '';
		}

		$folderType = array_key_first($otherUsers[$username]);
		$supportedTypes = ['inbox' => 1, 'all' => 1];

		return isset($supportedTypes[$folderType]) ? $folderType : '';
	}

	/**
	 * Update unread counters for the public store hierarchy.
	 */
	private function updatePublicFolderHierachy() {
		$store = $GLOBALS["mapisession"]->getPublicMessageStore();
		if (!$store) {
			return;
		}

		$this->updateFolderHierachy('', '', $store, 'publicStore');
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
	 * @param mixed  $store      optional already opened store
	 * @param string $cacheKey   optional key for the counter state cache
	 * @param string $displayName optional store display name for shared-store notifications
	 * @param bool   $logErrors  whether to log root folder open failures
	 */
	private function updateFolderHierachy($username = '', $folderType = '', $store = null, $cacheKey = null, $displayName = null, $logErrors = true) {
		$counterState = new State('counters_sessiondata');
		$counterState->open();
		if ($cacheKey === null) {
			$cacheKey = 'sessionData';
		}
		if ($username) {
			$cacheKey = $username;
		}

		$sessionData = $counterState->read($cacheKey);
		if (!is_array($sessionData)) {
			$sessionData = [];
		}

		$folderStatCache = updateHierarchyCounters($username, $folderType, $store, $logErrors);

		// Keep the previous counter state when the hierarchy could not be read.
		if (empty($folderStatCache)) {
			$counterState->close();

			return;
		}

		if ($folderStatCache !== $sessionData) {
			$data = ["item" => []];

			foreach ($folderStatCache as $entryid => $props) {
				if (isset($sessionData[$entryid]) &&
					$sessionData[$entryid]['commit_time'] !== $props['commit_time']) {
					if ($username) {
						$name = $GLOBALS["mapisession"]->getDisplayNameofUser($username);
					}
					else {
						$name = $displayName;
					}
					$data['item'][] = [
						'entryid' => $props['entryid'],
						'store_entryid' => $props['store_entryid'],
						'content_count' => $props['content_count'],
						'content_unread' => $props['content_unread'],
						'display_name' => $props['display_name'],
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
