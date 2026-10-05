<?php

/*
 * SPDX-FileCopyrightText: Copyright 2020 - 2026 grommunio GmbH
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

/**
 * AIActionParser — validates the model's suggest_actions output.
 */
class AIActionParser {
	/**
	 * Parse the model's JSON action list, keeping only allowed, well-formed
	 * actions (and at most six).
	 */
	public static function parse(string $raw, array $allowed): array {
		$json = json_decode($raw, true);
		if (!is_array($json) && preg_match('/\{.*\}/s', $raw, $matches)) {
			$json = json_decode($matches[0], true);
		}

		$list = (is_array($json) && isset($json['actions']) && is_array($json['actions'])) ? $json['actions'] : [];
		$out = [];
		foreach ($list as $item) {
			if (!is_array($item)) {
				continue;
			}
			$type = (string) ($item['type'] ?? '');
			if (!in_array($type, $allowed, true)) {
				continue;
			}
			$clean = self::sanitize($type, $item);
			if ($clean !== null) {
				$out[] = $clean;
			}
			if (count($out) >= 6) {
				break;
			}
		}

		return $out;
	}

	/**
	 * Normalize and bound one action of a given type; return null if it lacks
	 * the fields needed to be useful.
	 */
	private static function sanitize(string $type, array $action): ?array {
		switch ($type) {
			case 'meeting':
				return self::meeting($action);

			case 'task':
				return self::task($action);

			case 'contact':
				return self::contact($action);

			case 'reply':
				return ['type' => 'reply', 'intent' => self::str($action['intent'] ?? '', 1000)];
		}

		return null;
	}

	private static function meeting(array $action): ?array {
		$title = self::str($action['title'] ?? '', 256);
		if ($title === '') {
			return null;
		}

		return [
			'type' => 'meeting',
			'title' => $title,
			'attendees' => self::attendees($action['attendees'] ?? null),
			'date' => self::normalizeDate($action['date'] ?? ''),
			'time' => self::normalizeTime($action['time'] ?? ''),
			// 0 (or missing) means "use the client default"; cap at 24h.
			'duration_minutes' => min(1440, max(0, (int) ($action['duration_minutes'] ?? 30))),
			'location' => self::str($action['location'] ?? '', 256),
			'notes' => self::str($action['notes'] ?? '', 2000),
		];
	}

	private static function attendees(mixed $list): array {
		$attendees = [];
		if (!is_array($list)) {
			return $attendees;
		}
		foreach ($list as $attendee) {
			$name = self::str($attendee, 256);
			if ($name !== '') {
				$attendees[] = $name;
			}
			if (count($attendees) >= 25) {
				break;
			}
		}

		return $attendees;
	}

	private static function task(array $action): ?array {
		$title = self::str($action['title'] ?? '', 256);
		if ($title === '') {
			return null;
		}

		return [
			'type' => 'task',
			'title' => $title,
			'due' => self::normalizeDate($action['due'] ?? ''),
			'notes' => self::str($action['notes'] ?? '', 2000),
		];
	}

	private static function contact(array $action): ?array {
		$name = self::str($action['name'] ?? '', 256);
		$email = self::str($action['email'] ?? '', 256);
		if ($name === '' && $email === '') {
			return null;
		}

		return ['type' => 'contact', 'name' => $name, 'email' => $email];
	}

	private static function str(mixed $value, int $max = 500): string {
		return mb_substr(trim((string) ($value ?? '')), 0, $max);
	}

	/**
	 * Normalize a model-supplied date to a strict YYYY-MM-DD, or '' when it is
	 * not a plausible calendar date. This keeps malformed values from reaching
	 * the client's Date parser.
	 */
	private static function normalizeDate(mixed $value): string {
		$value = trim((string) $value);
		if (!preg_match('/^(\d{4})-(\d{2})-(\d{2})$/', $value, $m)) {
			return '';
		}

		return checkdate((int) $m[2], (int) $m[3], (int) $m[1]) ? $value : '';
	}

	/**
	 * Normalize a model-supplied time to a strict, zero-padded HH:MM, or '' when
	 * it is not a valid 24-hour time. A bad time must never discard a good date,
	 * so the client treats '' as "use the default time".
	 */
	private static function normalizeTime(mixed $value): string {
		$value = trim((string) $value);
		if (!preg_match('/^(\d{1,2}):(\d{2})$/', $value, $m)) {
			return '';
		}
		$hours = (int) $m[1];
		$minutes = (int) $m[2];
		if ($hours > 23 || $minutes > 59) {
			return '';
		}

		return sprintf('%02d:%02d', $hours, $minutes);
	}
}
