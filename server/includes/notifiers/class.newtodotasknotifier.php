<?php

/*
 * SPDX-FileCopyrightText: Copyright 2020 - 2026 grommunio GmbH
 * SPDX-FileCopyrightText: Copyright 2016 Kopano and its licensors
 * SPDX-FileCopyrightText: Copyright 2005 - 2016 Zarafa B.V. and its licensors
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

/**
 * NewTodoTaskNotifier.
 *
 * Generates notifications update To-Do list folder.
 */
class NewTodoTaskNotifier extends Notifier {
	/**
	 * @return Number the event which this module handles
	 */
	#[Override]
	public function getEvents() {
		return OBJECT_SAVE;
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
			case OBJECT_SAVE:
				$data = [
					'item' => [[
						'entryid' => $entryid,
						'store_entryid' => bin2hex((string) $props[PR_STORE_ENTRYID]),
					]],
				];
				$this->addNotificationActionData("newtodotask", $data);
				$GLOBALS["bus"]->addData($this->createNotificationResponseData());
				break;
		}
	}
}
