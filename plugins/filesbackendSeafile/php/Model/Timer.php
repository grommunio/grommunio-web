<?php

/*
 * SPDX-FileCopyrightText: Copyright 2020 - 2026 grommunio GmbH
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

declare(strict_types=1);

namespace Files\Backend\Seafile\Model;

/**
 * Simple Timer.
 */
final class Timer implements \Stringable {
	private float $start;

	public function __construct() {
		$this->start = microtime(true);
	}

	public function __toString(): string {
		$time = microtime(true) - $this->start;

		return \sprintf('%.3F', $time);
	}
}
