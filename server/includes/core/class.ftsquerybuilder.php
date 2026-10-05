<?php

/*
 * SPDX-FileCopyrightText: Copyright 2020 - 2026 grommunio GmbH
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

/**
 * Builds the SQLite FTS5 query and its bindings for a search descriptor.
 */
class FtsQueryBuilder {
	/** @var callable */
	private $log;

	/**
	 * @param null|callable $logger receives a debug message and its context
	 */
	public function __construct(?callable $logger = null) {
		$this->log = $logger ?? static function () {};
	}

	/**
	 * Return [sql, bindings, ftsQuery], or null when the AST yields no expression.
	 *
	 * @param mixed $descriptor
	 * @param array $folderIds  folder ids the search is limited to, empty for all
	 *
	 * @return null|array
	 */
	public function build($descriptor, array $folderIds) {
		$message_classes = $descriptor['message_classes'] ?? null;
		$date_start = $descriptor['date_start'] ?? null;
		$date_end = $descriptor['date_end'] ?? null;
		$unread = !empty($descriptor['unread']);
		$has_attachments = !empty($descriptor['has_attachments']);

		[$ast, $excluded] = self::splitNegation($descriptor['ast'] ?? null);
		$ftsQuery = $this->compile($ast);
		if ($ftsQuery === null || $ftsQuery === '') {
			return null;
		}

		$whereClauses = [];
		$bindings = [];

		if (!empty($folderIds)) {
			$folderPlaceholders = [];
			foreach (array_values(array_unique(array_map("intval", $folderIds))) as $index => $folderId) {
				$placeholder = ":folder_id_" . $index;
				$folderPlaceholders[] = $placeholder;
				$bindings[] = [$placeholder, $folderId, SQLITE3_INTEGER];
			}
			$whereClauses[] = "c.folder_id in (" . implode(", ", $folderPlaceholders) . ")";
		}

		// FTS5 NOT is binary, so a query of exclusions only is matched as a set difference
		$whereClauses[] = $excluded ? "c.message_id NOT IN (SELECT rowid FROM messages WHERE messages MATCH :fts_query)" : "messages MATCH :fts_query";
		$bindings[] = [":fts_query", $ftsQuery, SQLITE3_TEXT];

		// Push filters into SQL so LIMIT applies to already-filtered rows.
		// PHP-side filtering in IndexSqlite::filter_content() is kept as a safety net.
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

		$bindings[] = [":limit", (int) MAX_FTS_RESULT_ITEMS, SQLITE3_INTEGER];
		$sql = "SELECT c.message_id, c.entryid, c.folder_id, " .
			"c.message_class, c.date, c.readflag, c.attach_indexed " .
			"FROM msg_content c " .
			"JOIN messages m ON c.message_id = m.rowid " .
			"WHERE " . implode(" AND ", $whereClauses) .
			" ORDER BY c.date DESC LIMIT :limit";

		return [$sql, $bindings, $ftsQuery];
	}

	/**
	 * Split a NOT node, or an AND of NOT nodes only, into the AST to exclude.
	 *
	 * @param mixed $ast
	 *
	 * @return array [ast, excluded]
	 */
	private static function splitNegation($ast) {
		$op = $ast['op'] ?? null;
		$children = $ast['children'] ?? [];
		if ($op === 'NOT') {
			return [$children[0] ?? null, true];
		}
		$negated = array_filter($children, fn ($child) => ($child['op'] ?? null) === 'NOT' && isset($child['children'][0]));
		if ($op !== 'AND' || $children === [] || count($negated) !== count($children)) {
			return [$ast, false];
		}
		$excluded = array_map(fn ($child) => $child['children'][0], array_values($negated));

		return [count($excluded) > 1 ? ['op' => 'OR', 'children' => $excluded] : $excluded[0], true];
	}

	/**
	 * Compile a search AST into an FTS5 MATCH expression.
	 *
	 * @param mixed $ast
	 *
	 * @return null|string
	 */
	public function compile($ast) {
		if ($ast === null) {
			return null;
		}

		if (isset($ast['type']) && $ast['type'] === 'term') {
			$fields = $ast['fields'] ?? [];
			if (empty($fields)) {
				return null;
			}
			$words = $this->quoteWords($ast['value'] ?? '');
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
			$child = $this->compile($children[0] ?? null);
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
					$compiled = $this->compile($child['children'][0] ?? null);
					if ($compiled !== null) {
						$negativeParts[] = $compiled;
					}
				}
				else {
					$compiled = $this->compile($child);
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

	private function quoteWords($search_string) {
		$words = preg_split('/\s+/', trim($search_string), -1, PREG_SPLIT_NO_EMPTY);
		// With the trigram tokenizer terms shorter than 3 characters cause a
		// full table scan instead of an index lookup.  Skip them to avoid
		// excessive CPU usage.
		$minLength = (SQLITE_FTS_TOKENIZER === 'trigram') ? 3 : 1;
		$quoted = [];
		foreach ($words as $word) {
			if (mb_strlen($word) < $minLength) {
				($this->log)('Skipping short search term', [
					'term' => $word,
					'min_length' => $minLength,
					'tokenizer' => SQLITE_FTS_TOKENIZER,
				]);

				continue;
			}
			$quoted[] = '"' . SQLite3::escapeString($word) . '"*';
			if (MAX_FTS_QUERY_TERMS > 0 && count($quoted) >= MAX_FTS_QUERY_TERMS) {
				($this->log)('Search term limit reached', [
					'limit' => MAX_FTS_QUERY_TERMS,
					'total_words' => count($words),
				]);
				break;
			}
		}

		return $quoted;
	}
}
