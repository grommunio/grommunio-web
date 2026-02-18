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
	private $openResult;

	private const DEBUG_SAMPLE_LIMIT = 5;

	private function logDebug(string $message, array $context = []): void {
		if (!DEBUG_FULLTEXT_SEARCH) {
			return;
		}
		$prefix = '[fts-debug][index] ';
		if (!empty($context)) {
			$encoded = json_encode($context, JSON_UNESCAPED_SLASHES | JSON_UNESCAPED_UNICODE);
			if ($encoded === false) {
				$encoded = 'context_encoding_failed';
			}
			error_log($prefix . $message . ' ' . $encoded);
		}
		else {
			error_log($prefix . $message);
		}
	}

	private static function formatEntryIdForLog($entryid) {
		if ($entryid === null) {
			return null;
		}
		if (is_array($entryid)) {
			return array_map([self::class, 'formatEntryIdForLog'], $entryid);
		}
		if (!is_string($entryid)) {
			return $entryid;
		}

		return bin2hex($entryid);
	}

	private static function formatBinaryFieldForLog($value) {
		if ($value === null) {
			return null;
		}
		if (!is_string($value)) {
			return $value;
		}
		if (preg_match('/[^\x20-\x7E]/', $value)) {
			return bin2hex($value);
		}

		return $value;
	}

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
		$indexPath = SQLITE_INDEX_PATH . '/' . $this->username . '/index.sqlite3';

		try {
			$this->open($indexPath, SQLITE3_OPEN_READONLY);
			$this->openResult = 0;
			$this->logDebug('Opened index database', ['path' => $indexPath]);
		}
		catch (Exception $e) {
			error_log(sprintf("Error opening the index database: %s", $e));
			$this->openResult = 1;
			$this->logDebug('Failed to open index database', [
				'path' => $indexPath,
				'error' => $e->getMessage(),
			]);
		}
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
				$this->logDebug('Recovered missing entryid from msg_content', [
					'message_id' => $row['message_id'],
				]);
			}
			// abort if the entryid is not available
			else {
				error_log(sprintf("No entryid available, not possible to link the message %d.", $row['message_id']));
				$this->logDebug('Missing entryid prevents linking message', [
					'message_id' => $row['message_id'],
				]);

				return;
			}
		}
		if (is_array($message_classes) && $message_classes !== []) {
			$found = false;
			foreach ($message_classes as $message_class) {
				if (strncasecmp((string) $row['message_class'], (string) $message_class, strlen((string) $message_class)) == 0) {
					$found = true;
					break;
				}
			}
			if (!$found) {
				$this->logDebug('Skipping message because message class is filtered out', [
					'message_id' => $row['message_id'] ?? null,
					'message_class' => $row['message_class'] ?? null,
				]);
				return;
			}
		}
		if ($date_start !== null && $row['date'] < $date_start) {
			$this->logDebug('Skipping message before start date filter', [
				'message_id' => $row['message_id'] ?? null,
				'message_date' => $row['date'] ?? null,
				'date_start' => $date_start,
			]);
			return;
		}
		if ($date_end !== null && $row['date'] > $date_end) {
			$this->logDebug('Skipping message after end date filter', [
				'message_id' => $row['message_id'] ?? null,
				'message_date' => $row['date'] ?? null,
				'date_end' => $date_end,
			]);
			return;
		}
		if ($unread && $row['readflag']) {
			$this->logDebug('Skipping message because unread flag filter is active', [
				'message_id' => $row['message_id'] ?? null,
				'readflag' => $row['readflag'] ?? null,
			]);
			return;
		}
		if ($has_attachments && !$row['attach_indexed']) {
			$this->logDebug('Skipping message because attachment filter is active', [
				'message_id' => $row['message_id'] ?? null,
				'attach_indexed' => $row['attach_indexed'] ?? null,
			]);
			return;
		}

		try {
			mapi_linkmessage($this->session, $search_entryid, $row['entryid']);
		}
		catch (Exception $e) {
			$details = [
				'message_id' => $row['message_id'],
				'entryid' => self::formatBinaryFieldForLog($row['entryid']),
				'error' => $e->getMessage(),
			];
			if (function_exists('mapi_last_hresult')) {
				$details['hresult'] = mapi_last_hresult();
			}
			$this->logDebug('MAPI linkmessage failed', $details);
			return;
		}
		++$this->count;
	}

	private function result_full() {
		return $this->count >= MAX_FTS_RESULT_ITEMS;
	}

	public function search($search_entryid, $descriptor, $folder_entryid, $recursive) {
		$startTime = microtime(true);
		$this->logDebug('Search invoked', [
			'user' => $this->username,
			'search_entryid' => self::formatEntryIdForLog($search_entryid),
			'folder_entryid' => self::formatEntryIdForLog($folder_entryid),
			'recursive' => (bool) $recursive,
			'descriptor' => $descriptor,
		]);
		if ($this->openResult) {
			$this->logDebug('Search aborted: index database unavailable', ['open_result' => $this->openResult]);
			return false;
		}
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
				$this->logDebug('Folder scope resolved', [
					'root_folder_gc_id' => $folder_id,
					'folder_clause' => rtrim($whereFolderids),
				]);
			}
			catch (Exception $e) {
				error_log(sprintf("Index: error getting folder information %s - %s", $this->username, $e));
				$this->logDebug('Failed to resolve folder scope', ['error' => $e->getMessage()]);

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
		$ftsAst = $descriptor['ast'] ?? null;
		$message_classes = $descriptor['message_classes'] ?? null;
		$date_start = $descriptor['date_start'] ?? null;
		$date_end = $descriptor['date_end'] ?? null;
		$unread = !empty($descriptor['unread']);
		$has_attachments = !empty($descriptor['has_attachments']);
		$this->logDebug('Search filters resolved', [
			'unread' => $unread,
			'has_attachments' => $has_attachments,
			'date_start' => $date_start,
			'date_end' => $date_end,
			'message_classes_count' => is_array($message_classes) ? count($message_classes) : null,
		]);

		$ftsQuery = $this->compileFtsExpression($ftsAst);
		if ($ftsQuery === null || $ftsQuery === '') {
			$this->logDebug('FTS query compilation returned empty expression', [
				'ast' => $ftsAst,
			]);
			return false;
		}

		$sql_string .= "messages MATCH '" . $ftsQuery . "'";

		// Push filters into SQL so LIMIT applies to already-filtered rows.
		// PHP-side filtering in try_insert_content() is kept as a safety net.
		if ($date_start !== null) {
			$sql_string .= " AND c.date >= " . intval($date_start);
		}
		if ($date_end !== null) {
			$sql_string .= " AND c.date <= " . intval($date_end);
		}
		if ($unread) {
			$sql_string .= " AND (c.readflag IS NULL OR c.readflag = 0)";
		}
		if ($has_attachments) {
			$sql_string .= " AND c.attach_indexed = 1";
		}
		if (is_array($message_classes) && $message_classes !== []) {
			$classConditions = [];
			foreach ($message_classes as $mc) {
				$classConditions[] = "c.message_class LIKE '" . SQLite3::escapeString((string) $mc) . "%'";
			}
			$sql_string .= " AND (" . implode(" OR ", $classConditions) . ")";
		}

		$this->count = 0;
		$sql_string .= " ORDER BY c.date DESC LIMIT " . MAX_FTS_RESULT_ITEMS;
		$this->logDebug('Executing SQLite FTS query', ['sql' => $sql_string]);
		$results = $this->query($sql_string);
		if ($results === false) {
			$this->logDebug('SQLite query execution failed', [
				'error_code' => $this->lastErrorCode(),
				'error_message' => $this->lastErrorMsg(),
			]);
			return false;
		}
		$matchedRows = 0;
		$sampleRows = [];
		while (($row = $results->fetchArray(SQLITE3_ASSOC)) && !$this->result_full()) {
			++$matchedRows;
			$previousCount = $this->count;
			$this->try_insert_content(
				$search_entryid,
				$row,
				$message_classes,
				$date_start,
				$date_end,
				$unread,
				$has_attachments
			);
			if ($this->count > $previousCount && count($sampleRows) < self::DEBUG_SAMPLE_LIMIT) {
				$sampleRows[] = [
					'message_id' => $row['message_id'] ?? null,
					'entryid' => self::formatBinaryFieldForLog($row['entryid'] ?? null),
					'message_class' => $row['message_class'] ?? null,
					'date' => $row['date'] ?? null,
					'readflag' => $row['readflag'] ?? null,
					'attach_indexed' => $row['attach_indexed'] ?? null,
				];
			}
		}
		$durationMs = (int) round((microtime(true) - $startTime) * 1000);
		$this->logDebug('Search completed', [
			'fts_query' => $ftsQuery,
			'matched_rows' => $matchedRows,
			'linked_messages' => $this->count,
			'limit_reached' => $this->result_full(),
			'folder_clause' => $whereFolderids !== '' ? rtrim($whereFolderids) : null,
			'sample_messages' => $sampleRows,
			'duration_ms' => $durationMs,
		]);

		return true;
	}

	private function compileFtsExpression($ast) {
		if ($ast === null) {
			return null;
		}

		if (isset($ast['type']) && $ast['type'] === 'term') {
			$fields = $ast['fields'] ?? [];
			if (empty($fields)) {
				return null;
			}
			$words = $this->quoteWordsArray($ast['value'] ?? '');
			if (empty($words)) {
				return null;
			}
			$segments = [];
			foreach ($fields as $field) {
				$fieldWords = [];
				foreach ($words as $word) {
					$fieldWords[] = $field . ':' . $word;
				}
				$segments[] = implode(' ', $fieldWords);
			}
			if (count($segments) === 1) {
				return $segments[0];
			}
			return '(' . implode(' OR ', array_map(function ($s) {
				return '(' . $s . ')';
			}, $segments)) . ')';
		}

		$operator = $ast['op'] ?? null;
		$children = $ast['children'] ?? [];
		if ($operator === 'NOT') {
			$child = $this->compileFtsExpression($children[0] ?? null);
			if ($child === null) {
				return null;
			}
			return 'NOT (' . $child . ')';
		}
		if ($operator === 'AND' || $operator === 'OR') {
			$parts = [];
			foreach ($children as $child) {
				$compiled = $this->compileFtsExpression($child);
				if ($compiled !== null) {
					$parts[] = $compiled;
				}
			}
			if (empty($parts)) {
				return null;
			}
			if (count($parts) === 1) {
				return $parts[0];
			}
			$wrapped = array_map(function ($segment) {
				return '(' . $segment . ')';
			}, $parts);
			return implode(' ' . $operator . ' ', $wrapped);
		}

		return null;
	}

	private function sanitizeFtsInput($value) {
		return preg_replace('/["*(){}:^~]/', '', (string) $value);
	}

	private function quoteWordsArray($search_string) {
		$sanitized = $this->sanitizeFtsInput($search_string);
		$words = preg_split('/\s+/', trim($sanitized), -1, PREG_SPLIT_NO_EMPTY);
		$quoted = [];
		foreach ($words as $word) {
			$quoted[] = '"' . SQLite3::escapeString($word) . '"*';
		}
		return $quoted;
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
