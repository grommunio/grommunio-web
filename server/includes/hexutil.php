<?php

/*
 * SPDX-FileCopyrightText: Copyright 2020 - 2026 grommunio GmbH
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

/**
 * Check whether a value is a non-empty string of hexadecimal digits.
 *
 * @param mixed $value
 *
 * @return bool
 */
function is_hex_string($value) {
	return is_string($value) && $value !== '' && ctype_xdigit($value);
}

/**
 * Check whether a value is a hex-encoded binary such as an entryid.
 *
 * @param mixed $value
 *
 * @return bool
 */
function is_hex_entryid($value) {
	return is_hex_string($value) && (strlen($value) % 2) === 0;
}
