<?php

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
