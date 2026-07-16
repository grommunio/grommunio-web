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
			throw $e;
		}
	}

	/**
	 * Apply the per-result filters and return the message entryid that should
	 * be linked into the search folder, or null when the row is filtered out
	 * or unusable. Linking itself is deferred to the caller so it can be
	 * batched into a single RPC instead of one round trip per message.
	 */
	private function filter_content(
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

				return null;
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

				return null;
			}
		}
		if ($date_start !== null && $row['date'] < $date_start) {
			$this->logDebug('Skipping message before start date filter', [
				'message_id' => $row['message_id'] ?? null,
				'message_date' => $row['date'] ?? null,
				'date_start' => $date_start,
			]);

			return null;
		}
		if ($date_end !== null && $row['date'] > $date_end) {
			$this->logDebug('Skipping message after end date filter', [
				'message_id' => $row['message_id'] ?? null,
				'message_date' => $row['date'] ?? null,
				'date_end' => $date_end,
			]);

			return null;
		}
		if ($unread && $row['readflag']) {
			$this->logDebug('Skipping message because unread flag filter is active', [
				'message_id' => $row['message_id'] ?? null,
				'readflag' => $row['readflag'] ?? null,
			]);

			return null;
		}
		if ($has_attachments && !$row['attach_indexed']) {
			$this->logDebug('Skipping message because attachment filter is active', [
				'message_id' => $row['message_id'] ?? null,
				'attach_indexed' => $row['attach_indexed'] ?? null,
			]);

			return null;
		}

		return $row['entryid'];
	}

	/**
	 * Link the collected result entryids into the search folder. When the
	 * php-mapi extension exposes the batch binding (mapi_linkmessages), all
	 * messages are linked in a single RPC; otherwise we fall back to the
	 * per-message mapi_linkmessage path so a new web release keeps working
	 * against an older gromox. Returns the number of linked messages.
	 */
	private function link_entryids($search_entryid, array $entryids): int {
		if ($entryids === []) {
			return 0;
		}
		if (function_exists('mapi_linkmessages')) {
			try {
				mapi_linkmessages($this->session, $search_entryid, $entryids);

				return count($entryids);
			}
			catch (Exception $e) {
				$details = [
					'count' => count($entryids),
					'error' => $e->getMessage(),
					'hresult' => mapi_last_hresult(),
				];
				$this->logDebug('MAPI linkmessages (batch) failed, falling back to per-message linking', $details);
				// fall through to the per-message path below
			}
		}

		$linked = 0;
		foreach ($entryids as $entryid) {
			try {
				mapi_linkmessage($this->session, $search_entryid, $entryid);
			}
			catch (Exception $e) {
				$details = [
					'entryid' => self::formatBinaryFieldForLog($entryid),
					'error' => $e->getMessage(),
					'hresult' => mapi_last_hresult(),
				];
				$this->logDebug('MAPI linkmessage failed', $details);

				continue;
			}
			++$linked;
		}

		return $linked;
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
			error_log('Search aborted: index database unavailable');

			return false;
		}
		$whereFolderids = [];
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
				$whereFolderids[] = $folder_id;
				if ($recursive) {
					$this->getWhereFolderids($folder, $whereFolderids);
				}
				$this->logDebug('Folder scope resolved', [
					'root_folder_gc_id' => $folder_id,
					'folder_ids' => $whereFolderids,
				]);
			}
			catch (Exception $e) {
				error_log(sprintf("Index: error getting folder information %s - %s", $this->username, $e));
				$this->logDebug('Failed to resolve folder scope', ['error' => $e->getMessage()]);

				return false;
			}
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
			error_log(sprintf("FTS query compilation returned empty expression: ast => %s", $ftsAst));

			return false;
		}

		$whereClauses = [];
		$bindings = [];

		if (!empty($whereFolderids)) {
			$folderPlaceholders = [];
			foreach (array_values(array_unique(array_map("intval", $whereFolderids))) as $index => $folderId) {
				$placeholder = ":folder_id_" . $index;
				$folderPlaceholders[] = $placeholder;
				$bindings[] = [$placeholder, $folderId, SQLITE3_INTEGER];
			}
			$whereClauses[] = "c.folder_id in (" . implode(", ", $folderPlaceholders) . ")";
		}

		$whereClauses[] = "messages MATCH :fts_query";
		$bindings[] = [":fts_query", $ftsQuery, SQLITE3_TEXT];

		// Push filters into SQL so LIMIT applies to already-filtered rows.
		// PHP-side filtering in filter_content() is kept as a safety net.
		if ($date_start !== null) {
			$whereClauses[] = "c.date >= :date_start";
			$bindings[] = [":date_start", (int) $date_start, SQLITE3_INTEGER];
		}
		if ($date_end !== null) {
			$whereClauses[] = "c.date <= :date_end";
			$bindings[] = [":date_end", (int) $date_end, SQLITE3_INTEGER];
		}
		if ($unread) {
			$whereClauses[] = "(c.readflag IS NULL OR c.readflag = 0)";
		}
		if ($has_attachments) {
			$whereClauses[] = "c.attach_indexed = 1";
		}
		if (is_array($message_classes) && $message_classes !== []) {
			$classConditions = [];
			foreach (array_values($message_classes) as $index => $mc) {
				$placeholder = ":message_class_" . $index;
				$classConditions[] = "c.message_class LIKE " . $placeholder;
				$bindings[] = [$placeholder, (string) $mc . "%", SQLITE3_TEXT];
			}
			$whereClauses[] = "(" . implode(" OR ", $classConditions) . ")";
		}

		$this->count = 0;
		$bindings[] = [":limit", (int) MAX_FTS_RESULT_ITEMS, SQLITE3_INTEGER];
		$sql = "SELECT c.message_id, c.entryid, c.folder_id, " .
			"c.message_class, c.date, c.readflag, c.attach_indexed " .
			"FROM msg_content c " .
			"JOIN messages m ON c.message_id = m.rowid " .
			"WHERE " . implode(" AND ", $whereClauses) .
			" ORDER BY c.date DESC LIMIT :limit";
		$this->logDebug('Executing SQLite FTS query', [
			'sql' => $sql,
			'bindings' => array_map(static function ($binding) {
				return [
					'name' => $binding[0],
					'value' => $binding[1],
				];
			}, $bindings),
		]);

		// Tighten PHP's execution-time limit for the duration of the
		// query + result processing so a single expensive search cannot
		// monopolise a PHP-FPM worker for the full max_execution_time.
		$prevTimeLimit = (int) ini_get('max_execution_time');
		if (MAX_FTS_EXECUTION_TIME > 0) {
			set_time_limit(MAX_FTS_EXECUTION_TIME);
		}
		$deadline = MAX_FTS_EXECUTION_TIME > 0 ? microtime(true) + MAX_FTS_EXECUTION_TIME : 0;
		$matchedRows = 0;
		$sampleRows = [];
		$entryids = [];
		$stmt = null;
		$results = null;

		try {
			$stmt = $this->prepare($sql);
			if ($stmt === false) {
				error_log(sprintf(
					"SQLite query prepare failed: %s (%d)",
					$this->lastErrorMsg(),
					$this->lastErrorCode()
				));

				return false;
			}
			foreach ($bindings as $binding) {
				if (!$stmt->bindValue($binding[0], $binding[1], $binding[2])) {
					error_log(sprintf(
						"SQLite query bind failed for param '%s' with value '%s': %s (%d)",
						$binding[0],
						$binding[1],
						$this->lastErrorMsg(),
						$this->lastErrorCode()
					));

					return false;
				}
			}
			$results = $stmt->execute();
			if ($results === false) {
				error_log(sprintf(
					"SQLite query execution failed: %s (%d)",
					$this->lastErrorMsg(),
					$this->lastErrorCode()
				));

				return false;
			}
			// Collect the entryids that pass the filters; the actual linking
			// is deferred until after the loop so it can be batched into a
			// single RPC instead of one round trip per matched message.
			while (($row = $results->fetchArray(SQLITE3_ASSOC)) && count($entryids) < MAX_FTS_RESULT_ITEMS) {
				// Graceful abort when the wall-clock deadline is reached
				// so we return partial results instead of letting PHP
				// kill the process via max_execution_time.
				if ($deadline > 0 && microtime(true) >= $deadline) {
					$this->logDebug('Search aborted: execution time limit reached', [
						'limit_seconds' => MAX_FTS_EXECUTION_TIME,
						'matched_rows' => $matchedRows,
						'selected_messages' => count($entryids),
					]);
					break;
				}
				++$matchedRows;
				$entryid = $this->filter_content(
					$row,
					$message_classes,
					$date_start,
					$date_end,
					$unread,
					$has_attachments
				);
				if ($entryid === null) {
					continue;
				}
				$entryids[] = $entryid;
				if (count($sampleRows) < self::DEBUG_SAMPLE_LIMIT) {
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
		}
		finally {
			if ($results instanceof SQLite3Result) {
				$results->finalize();
			}
			if ($stmt instanceof SQLite3Stmt) {
				$stmt->close();
			}
			// Always restore the original time limit, even after an error.
			set_time_limit($prevTimeLimit);
		}
		$this->count = $this->link_entryids($search_entryid, $entryids);
		$durationMs = (int) round((microtime(true) - $startTime) * 1000);
		$this->logDebug('Search completed', [
			'fts_query' => $ftsQuery,
			'matched_rows' => $matchedRows,
			'selected_messages' => count($entryids),
			'linked_messages' => $this->count,
			'batch_link' => function_exists('mapi_linkmessages'),
			'limit_reached' => count($entryids) >= MAX_FTS_RESULT_ITEMS,
			'folder_ids' => $whereFolderids !== [] ? $whereFolderids : null,
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
			// In FTS5, NOT is a binary infix operator (a NOT b), not a
			// unary prefix.  When an AND node contains NOT children we
			// must emit them with the FTS5 NOT operator instead of
			// producing the invalid "a AND (NOT b)" form.
			$positiveParts = [];
			$negativeParts = [];
			foreach ($children as $child) {
				if ($operator === 'AND' && isset($child['op']) && $child['op'] === 'NOT') {
					$compiled = $this->compileFtsExpression($child['children'][0] ?? null);
					if ($compiled !== null) {
						$negativeParts[] = $compiled;
					}
				}
				else {
					$compiled = $this->compileFtsExpression($child);
					if ($compiled !== null) {
						$positiveParts[] = $compiled;
					}
				}
			}
			if (empty($positiveParts) && empty($negativeParts)) {
				return null;
			}
			if (empty($positiveParts)) {
				// FTS5 NOT requires a left-hand operand
				return null;
			}
			if (count($positiveParts) === 1) {
				$result = $positiveParts[0];
			}
			else {
				$wrapped = array_map(function ($segment) {
					return '(' . $segment . ')';
				}, $positiveParts);
				$result = implode(' ' . $operator . ' ', $wrapped);
			}
			foreach ($negativeParts as $neg) {
				$result = '(' . $result . ') NOT (' . $neg . ')';
			}

			return $result;
		}

		return null;
	}

	private function quoteWordsArray($search_string) {
		$words = preg_split('/\s+/', trim($search_string), -1, PREG_SPLIT_NO_EMPTY);
		// With the trigram tokenizer terms shorter than 3 characters cause a
		// full table scan instead of an index lookup.  Skip them to avoid
		// excessive CPU usage.
		$minLength = (SQLITE_FTS_TOKENIZER === 'trigram') ? 3 : 1;
		$quoted = [];
		foreach ($words as $word) {
			if (mb_strlen($word) < $minLength) {
				$this->logDebug('Skipping short search term', [
					'term' => $word,
					'min_length' => $minLength,
					'tokenizer' => SQLITE_FTS_TOKENIZER,
				]);

				continue;
			}
			$quoted[] = '"' . SQLite3::escapeString($word) . '"*';
			if (MAX_FTS_QUERY_TERMS > 0 && count($quoted) >= MAX_FTS_QUERY_TERMS) {
				$this->logDebug('Search term limit reached', [
					'limit' => MAX_FTS_QUERY_TERMS,
					'total_words' => count($words),
				]);
				break;
			}
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
	 * Appends the recursive folder ids for the search scope.
	 *
	 * @param mixed $folder
	 * @param array $whereFolderids
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
				$whereFolderids[] = IndexSqlite::get_gc_value((int) $row[PR_FOLDER_ID]);
			}
		}
	}
}
