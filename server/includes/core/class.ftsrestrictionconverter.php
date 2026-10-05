<?php

/*
 * SPDX-FileCopyrightText: Copyright 2020 - 2026 grommunio GmbH
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

/**
 * Converts a MAPI search restriction into the query AST and the side filters
 * (message classes, date range, unread, attachments) of the full-text index.
 */
class FtsRestrictionConverter {
	private $properties;

	/**
	 * @param array $properties the search module's property tags
	 */
	public function __construct($properties) {
		$this->properties = $properties;
	}

	public function buildDescriptor($restriction) {
		[$ast, $filters] = $this->convert($restriction);

		$filters['message_classes'] = array_values(array_unique($filters['message_classes']));

		return [
			'ast' => $ast,
			'message_classes' => $filters['message_classes'],
			'date_start' => $filters['date_start'],
			'date_end' => $filters['date_end'],
			'unread' => $filters['unread'],
			'has_attachments' => $filters['has_attachments'],
		];
	}

	/**
	 * @param mixed       $restriction
	 * @param null|string $context     'attachments' or 'recipients' inside a subrestriction
	 *
	 * @return array [ast node or null, filter state]
	 */
	public function convert($restriction, $context = null) {
		$filters = FtsFilterState::create();

		if (!is_array($restriction) || empty($restriction)) {
			return [null, $filters];
		}

		$type = $restriction[0];

		switch ($type) {
			case RES_AND:
			case RES_OR:
				return $this->convertList($type, $restriction, $context, $filters);

			case RES_NOT:
				return $this->convertNot($restriction, $context, $filters);

			case RES_CONTENT:
				return $this->convertContent($restriction, $context, $filters);

			case RES_PROPERTY:
				return $this->convertProperty($restriction, $filters);

			case RES_BITMASK:
				$subres = $restriction[1];
				if (($subres[ULPROPTAG] ?? null) == PR_MESSAGE_FLAGS && ($subres[ULTYPE] ?? null) == BMR_EQZ) {
					$filters['unread'] = true;
				}

				return [null, $filters];

			case RES_SUBRESTRICTION:
				return $this->convertSubRestriction($restriction, $context, $filters);

			case RES_COMMENT:
				return $this->convertInner($restriction[1][RESTRICTION] ?? null, $context, $filters);

			default:
				return [null, $filters];
		}
	}

	private function mapPropTagToFields($propTag, $context = null) {
		if (in_array($context, ['attachments', 'recipients'], true)) {
			return [$context];
		}

		static $map = null;
		if ($map === null) {
			$map = [
				PR_SUBJECT => ['subject'],
				PR_BODY => ['content', 'attachments'],
				PR_SENDER_NAME => ['sender'],
				PR_SENDER_EMAIL_ADDRESS => ['sender'],
				PR_SENT_REPRESENTING_NAME => ['sending'],
				PR_SENT_REPRESENTING_EMAIL_ADDRESS => ['sending'],
				PR_DISPLAY_TO => ['recipients'],
				PR_DISPLAY_CC => ['recipients'],
				PR_DISPLAY_BCC => ['recipients'],
				PR_EMAIL_ADDRESS => ['recipients'],
				PR_SMTP_ADDRESS => ['recipients'],
				PR_DISPLAY_NAME => ['others'],
				PR_ATTACH_LONG_FILENAME => ['attachments'],
			];
			if (defined('PR_NORMALIZED_SUBJECT')) {
				$map[PR_NORMALIZED_SUBJECT] = ['subject'];
			}
			if (isset($this->properties['categories'])) {
				$map[$this->properties['categories']] = ['others'];
			}
		}

		return $map[$propTag] ?? [];
	}

	/**
	 * Null for no children, the child itself for one, an $op node otherwise.
	 *
	 * @param string $op
	 */
	private static function combine($op, array $children) {
		if (count($children) > 1) {
			return [
				'op' => $op,
				'children' => $children,
			];
		}

		return $children[0] ?? null;
	}

	private function convertInner($inner, $context, array $filters) {
		[$childAst, $childFilters] = $this->convert($inner, $context);

		return [$childAst, FtsFilterState::merge($filters, $childFilters)];
	}

	private function convertList($type, $restriction, $context, array $filters) {
		$children = [];
		$subRestrictions = $restriction[1] ?? [];
		if (is_array($subRestrictions)) {
			foreach ($subRestrictions as $subRestriction) {
				[$childAst, $filters] = $this->convertInner($subRestriction, $context, $filters);
				if ($childAst !== null) {
					$children[] = $childAst;
				}
			}
		}

		return [self::combine($type == RES_AND ? 'AND' : 'OR', $children), $filters];
	}

	private function convertNot($restriction, $context, array $filters) {
		[$childAst, $filters] = $this->convertInner($restriction[1][0] ?? null, $context, $filters);
		if ($childAst === null) {
			return [null, $filters];
		}

		return [[
			'op' => 'NOT',
			'children' => [$childAst],
		], $filters];
	}

	private function convertContent($restriction, $context, array $filters) {
		$subres = $restriction[1];
		$propTag = $subres[ULPROPTAG] ?? null;
		if ($propTag === null) {
			return [null, $filters];
		}

		$value = $subres[VALUE][$propTag] ?? null;
		if ($propTag == PR_MESSAGE_CLASS) {
			if ($value !== null) {
				$filters['message_classes'][] = $value;
			}

			return [null, $filters];
		}

		$fields = $this->mapPropTagToFields($propTag, $context);
		if (empty($fields) || $value === null) {
			return [null, $filters];
		}

		// A scalar '' still yields a term, empty array entries do not.
		$values = is_array($value) ? array_filter($value, fn ($entry) => !in_array($entry, ['', null], true)) : [$value];
		$terms = [];
		foreach ($values as $entry) {
			$terms[] = [
				'type' => 'term',
				'fields' => $fields,
				'value' => (string) $entry,
			];
		}

		return [self::combine('OR', $terms), $filters];
	}

	private function convertProperty($restriction, array $filters) {
		$subres = $restriction[1];
		$propTag = $subres[ULPROPTAG] ?? null;
		if ($propTag === null) {
			return [null, $filters];
		}

		if (in_array($propTag, [PR_MESSAGE_DELIVERY_TIME, PR_LAST_MODIFICATION_TIME])) {
			$value = $subres[VALUE][$propTag] ?? null;
			if ($value !== null) {
				if (in_array($subres[RELOP], [RELOP_LT, RELOP_LE])) {
					$filters['date_end'] = $value;
				}
				elseif (in_array($subres[RELOP], [RELOP_GT, RELOP_GE])) {
					$filters['date_start'] = $value;
				}
			}

			return [null, $filters];
		}

		if (isset($this->properties['hide_attachments']) && $propTag == $this->properties['hide_attachments']) {
			$filters['has_attachments'] = true;
		}

		return [null, $filters];
	}

	private function convertSubRestriction($restriction, $context, array $filters) {
		$subres = $restriction[1];
		$propTag = $subres[ULPROPTAG] ?? null;
		if ($propTag == PR_MESSAGE_ATTACHMENTS) {
			$filters['has_attachments'] = true;
			$context = 'attachments';
		}
		elseif ($propTag == PR_MESSAGE_RECIPIENTS) {
			$context = 'recipients';
		}

		return $this->convertInner($subres[RESTRICTION] ?? null, $context, $filters);
	}
}

/**
 * Filter state of a converted restriction, as a plain array.
 */
final class FtsFilterState {
	public static function create() {
		return [
			'message_classes' => [],
			'date_start' => null,
			'date_end' => null,
			'unread' => false,
			'has_attachments' => false,
		];
	}

	public static function merge(array $base, array $delta) {
		$base['message_classes'] = array_merge($base['message_classes'], $delta['message_classes']);
		if ($delta['date_start'] !== null) {
			$base['date_start'] = max($base['date_start'] ?? $delta['date_start'], $delta['date_start']);
		}
		if ($delta['date_end'] !== null) {
			$base['date_end'] = min($base['date_end'] ?? $delta['date_end'], $delta['date_end']);
		}
		$base['unread'] = $base['unread'] || $delta['unread'];
		$base['has_attachments'] = $base['has_attachments'] || $delta['has_attachments'];

		return $base;
	}
}
