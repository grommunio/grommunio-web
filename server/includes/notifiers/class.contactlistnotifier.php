<?php

/*
 * SPDX-FileCopyrightText: Copyright 2020 - 2026 grommunio GmbH
 * SPDX-FileCopyrightText: Copyright 2016 Kopano and its licensors
 * SPDX-FileCopyrightText: Copyright 2005 - 2016 Zarafa B.V. and its licensors
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

require_once __DIR__ . '/class.listnotifier.php';

/**
 * ContactListNotifier.
 *
 * Generates notifications for changes to the
 * Contact Folder contents.
 */
class ContactListNotifier extends ListNotifier {
	/**
	 * Obtain the list of Message Properties which should be returned
	 * to the client when a Message was changed.
	 *
	 * @return array The properties mapping
	 */
	#[Override]
	protected function getPropertiesList() {
		return $GLOBALS["properties"]->getContactListProperties();
	}
}
