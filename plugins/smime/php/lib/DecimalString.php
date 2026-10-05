<?php

/*
 * SPDX-FileCopyrightText: Copyright 2020 - 2026 grommunio GmbH
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

namespace WAYF;

/**
 * Unsigned decimal-string arithmetic for DER integers and OID arcs without GMP or BCMath.
 */
final class DecimalString {
	/**
	 * Add a small integer to an unsigned decimal string.
	 */
	public static function addInt(string $number, int $addend): string {
		$result = '';
		$carry = $addend;
		for ($i = strlen($number) - 1; $i >= 0; --$i) {
			$value = (ord($number[$i]) - 48) + ($carry % 10);
			$carry = intdiv($carry, 10);
			if ($value >= 10) {
				$value -= 10;
				++$carry;
			}
			$result = $value . $result;
		}
		while ($carry > 0) {
			$result = ($carry % 10) . $result;
			$carry = intdiv($carry, 10);
		}

		return ltrim($result, '0') ?: '0';
	}

	/**
	 * Divide an unsigned decimal string by a small integer.
	 *
	 * @return array{0: string, 1: int} quotient and remainder
	 */
	public static function divideInt(string $number, int $divisor): array {
		$quotient = '';
		$remainder = 0;
		foreach (str_split($number) as $digit) {
			$value = ($remainder * 10) + (ord($digit) - 48);
			$quotient .= intdiv($value, $divisor);
			$remainder = $value % $divisor;
		}

		return [ltrim($quotient, '0') ?: '0', $remainder];
	}

	/**
	 * Compare an unsigned normalized decimal string with a small integer.
	 */
	public static function compareToInt(string $number, int $value): int {
		$other = (string) $value;
		if (strlen($number) !== strlen($other)) {
			return strlen($number) <=> strlen($other);
		}

		return strcmp($number, $other);
	}

	/**
	 * Subtract a small integer from an unsigned decimal string.
	 */
	public static function subtractInt(string $number, int $subtrahend): string {
		$result = '';
		$borrow = $subtrahend;
		for ($i = strlen($number) - 1; $i >= 0; --$i) {
			$value = (ord($number[$i]) - 48) - ($borrow % 10);
			$borrow = intdiv($borrow, 10);
			if ($value < 0) {
				$value += 10;
				++$borrow;
			}
			$result = $value . $result;
		}

		return ltrim($result, '0') ?: '0';
	}

	/**
	 * Multiply an unsigned decimal string and add a byte without requiring BCMath.
	 */
	public static function multiplyAndAdd(string $number, int $multiplier, int $addend): string {
		$result = '';
		$carry = $addend;
		for ($i = strlen($number) - 1; $i >= 0; --$i) {
			$value = ((ord($number[$i]) - 48) * $multiplier) + $carry;
			$result = ($value % 10) . $result;
			$carry = intdiv($value, 10);
		}
		while ($carry > 0) {
			$result = ($carry % 10) . $result;
			$carry = intdiv($carry, 10);
		}

		return ltrim($result, '0') ?: '0';
	}
}
