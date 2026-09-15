<?php

/*
 * SPDX-FileCopyrightText: Copyright 2020 - 2026 grommunio GmbH
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

namespace Files\Backend;

/**
 * Recipient lookup for backends that can share files with users or groups.
 */
interface iFeatureRecipientSearch {
	/**
	 * Find recipients matching the supplied search string.
	 *
	 * @param string $search
	 *
	 * @return array|false matching recipients, or false for an invalid response
	 */
	public function getRecipients($search): array|false;
}
