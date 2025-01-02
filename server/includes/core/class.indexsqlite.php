<?php

define('PRIVATE_FID_ROOT', 0x1);

define('PR_FOLDER_ID', 0x67480014);
define('PR_MID', 0x674A0014);
define('PR_CHANGE_NUMBER', 0x67A40014);

class IndexSqlite extends SQLite3 {
	private $username;
	private $count;
	private $store;
	private $session;

	private static function get_gc_value($eid) {
		$r0 = ($eid >> 56) & 0xFF;
		$r1 = ($eid >> 48) & 0xFF;
		$r2 = ($eid >> 40) & 0xFF;
		$r3 = ($eid >> 32) & 0xFF;
		$r4 = ($eid >> 24) & 0xFF;
		$r5 = ($eid >> 16) & 0xFF;
		$value = $r0 | ($r1 << 8) | ($r2 << 16) | ($r3 << 24) | ($r4 << 32) | ($r5 << 40);

		return $value;
	}

	public function __construct($username = null, $session = null, $store = null) {
		$this->username = $username ?? $GLOBALS["mapisession"]->getSMTPAddress();
		$this->session = $session ?? $GLOBALS["mapisession"]->getSession();
		$this->store = $store ?? $GLOBALS["mapisession"]->getDefaultMessageStore();
		$this->open(SQLITE_INDEX_PATH . '/' . $this->username . '/index.sqlite3');
	}

	private function try_insert_content(
		$search_entryid,
		$row,
		$message_classes,
		$date_start,
		$date_end,
		$unread,
		$has_attachments
	) {
		// if match condition contains '@', $row['entryid'] will disappear. it seems a bug for php-sqlite
		if (empty($row['entryid'])) {
			$results = $this->query("SELECT entryid FROM msg_content WHERE message_id=" . $row['message_id']);
			$row1 = $results->fetchArray(SQLITE3_NUM);
			if ($row1 && !empty($row1[0])) {
				$row['entryid'] = $row1[0];
			}
			// abort if the entryid is not available
			else {
				error_log(sprintf("No entryid available, not possible to link the message %d.", $row['message_id']));
				return;
			}
		}
		if (isset($message_classes)) {
			$found = false;
			foreach ($message_classes as $message_class) {
				if (strncasecmp($row['message_class'], $message_class, strlen($message_class)) == 0) {
					$found = true;
					break;
				}
			}
			if (!$found) {
				return;
			}
		}
		if (isset($date_start) && $row['date'] < $date_start) {
			return;
		}
		if (isset($date_end) && $row['date'] > $date_end) {
			return;
		}
		if (isset($unread) && $row['readflag']) {
			return;
		}
		if (isset($has_attachments) && !$row['attach_indexed']) {
			return;
		}

		try {
			mapi_linkmessage($this->session, $search_entryid, $row['entryid']);
		}
		catch (Exception $e) {
			return;
		}
		++$this->count;
	}

	private function result_full() {
		return $this->count >= MAX_FTS_RESULT_ITEMS;
	}

	public function search($search_entryid, $search_patterns, $folder_entryid, $recursive) {
		$whereFolderids = '';
		if (isset($folder_entryid)) {
			try {
				$folder = mapi_msgstore_openentry($this->store, $folder_entryid);
				if (!$folder) {
					return false;
				}
				$tmp_props = mapi_getprops($folder, [PR_FOLDER_ID]);
				if (empty($tmp_props[PR_FOLDER_ID])) {
					return false;
				}
				$folder_id = IndexSqlite::get_gc_value((int) $tmp_props[PR_FOLDER_ID]);
				$whereFolderids .= "c.folder_id in (" . $folder_id . ", ";
				if ($recursive) {
					$this->getWhereFolderids($folder, $whereFolderids);
				}
				$whereFolderids = substr($whereFolderids, 0, -2) . ") AND ";
			}
			catch (Exception $e) {
				error_log(sprintf("Index: error getting folder information %s - %s", $this->username, $e));

				return false;
			}
		}
		$sql_string = "SELECT c.message_id, c.entryid, c.folder_id, " .
			"c.message_class, c.date, c.readflag, c.attach_indexed " .
			"FROM msg_content c " .
			"JOIN messages m ON c.message_id = m.rowid " .
			"WHERE ";
		if (!empty($whereFolderids)) {
			$sql_string .= $whereFolderids;
		}
		$sql_string .= "messages MATCH '";
		$this->count = 0;
		// Extract search_patterns into separate variables
		[
			'sender' => $sender,
			'sending' => $sending,
			'recipients' => $recipients,
			'subject' => $subject,
			'content' => $content,
			'attachments' => $attachments,
			'others' => $others,
			'message_classes' => $message_classes,
			'date_start' => $date_start,
			'date_end' => $date_end,
			'unread' => $unread,
			'has_attachments' => $has_attachments,
			'categories' => $categories,
		] = $search_patterns;
		if (isset($sender) && $sender == $sending && $sending == $recipients && $recipients == $subject &&
			$subject == $content && $content == $attachments && $attachments == $others && empty($categories)) {
			$sql_string .= SQLite3::escapeString($this->quote_words($sender)) . "'";
		}
		else {
			$first = true;
			foreach ($search_patterns as $key => $search_pattern) {
				switch($key) {
					case 'message_classes':
					case 'date_start':
					case 'date_end':
					case 'unread':
					case 'has_attachments':
					case 'categories':
						break;
					default:
						if (!is_null($search_pattern)) {
							if ($first === true) {
								$first = false;
							}
							else {
								$sql_string .= " OR ";
							}
							$sql_string .= $key . ':' . SQLite3::escapeString($this->quote_words($search_pattern));
						}
				}
			}
			if ($first) {
				return false;
			}
			$sql_string .= "'";
			if (!empty($categories)) {
				foreach ($categories as $category) {
					$sql_string .= " AND messages MATCH 'others:" . SQLite3::escapeString($this->quote_words($category)) . "'";
				}
			}
		}
		$sql_string .= " ORDER BY c.date DESC LIMIT " . MAX_FTS_RESULT_ITEMS;
		$results = $this->query($sql_string);
		while (($row = $results->fetchArray(SQLITE3_ASSOC)) && !$this->result_full()) {
			$this->try_insert_content(
				$search_entryid,
				$row,
				$message_classes,
				$date_start,
				$date_end,
				$unread,
				$has_attachments
			);
		}

		return true;
	}

	private function quote_words($search_string) {
		return '"' . preg_replace("/(\\s+)/", '*" "', trim($search_string)) . '"*';
	}

	/**
	 * Returns the restriction to filter hidden folders.
	 *
	 * @return array
	 */
	private function getHiddenRestriction() {
		return
			[RES_OR, [
				[RES_PROPERTY,
					[
						RELOP => RELOP_EQ,
						ULPROPTAG => PR_ATTR_HIDDEN,
						VALUE => [PR_ATTR_HIDDEN => false],
					],
				],
				[RES_NOT,
					[
						[RES_EXIST,
							[
								ULPROPTAG => PR_ATTR_HIDDEN,
							],
						],
					],
				],
			]];
	}

	/**
	 * Returns the comma joined folderids for the WHERE clause in the SQL
	 * statement.
	 *
	 * @param mixed  $folder
	 * @param string $whereFolderids
	 */
	private function getWhereFolderids($folder, &$whereFolderids) {
		/**
		 * remove hidden folders, folders with PR_ATTR_HIDDEN property set
		 * should not be shown to the client.
		 */
		$restriction = $this->getHiddenRestriction();
		$hierarchy = mapi_folder_gethierarchytable($folder, CONVENIENT_DEPTH | MAPI_DEFERRED_ERRORS);
		mapi_table_restrict($hierarchy, $restriction, TBL_BATCH);
		$rows = mapi_table_queryallrows($hierarchy, [PR_FOLDER_ID]);
		foreach ($rows as $row) {
			if (isset($row[PR_FOLDER_ID])) {
				$whereFolderids .= IndexSqlite::get_gc_value((int) $row[PR_FOLDER_ID]) . ", ";
			}
		}
	}
}
