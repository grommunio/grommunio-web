<?php

/*
 * SPDX-FileCopyrightText: Copyright 2020 - 2026 grommunio GmbH
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

use WAYF\DecimalString;
use WAYF\Der;
use WAYF\DerEncoder;

chdir(dirname(__DIR__));
require_once 'php/lib/Der.php';
require_once 'php/lib/DerEncoder.php';

function checkDecimal(bool $condition, string $message): void {
	if (!$condition) {
		fwrite(STDERR, "FAIL: {$message}\n");

		exit(1);
	}
}

checkDecimal(DecimalString::addInt('0', 80) === '80', 'add to zero');
checkDecimal(DecimalString::addInt('999', 80) === '1079', 'add with carry');
checkDecimal(DecimalString::addInt('18446744073709551615', 1) === '18446744073709551616', 'add beyond 64 bit');
checkDecimal(DecimalString::divideInt('0', 128) === ['0', 0], 'divide zero');
checkDecimal(DecimalString::divideInt('18446744073709551616', 128) === ['144115188075855872', 0], 'divide big');
checkDecimal(DecimalString::divideInt('300', 128) === ['2', 44], 'divide with remainder');
checkDecimal(DecimalString::compareToInt('39', 40) < 0, 'compare less');
checkDecimal(DecimalString::compareToInt('40', 40) === 0, 'compare equal');
checkDecimal(DecimalString::compareToInt('100', 80) > 0, 'compare longer');
checkDecimal(DecimalString::subtractInt('80', 80) === '0', 'subtract to zero');
checkDecimal(DecimalString::subtractInt('1000', 1) === '999', 'subtract with borrow');
checkDecimal(DecimalString::multiplyAndAdd('0', 256, 255) === '255', 'multiply zero');
checkDecimal(DecimalString::multiplyAndAdd('72057594037927936', 256, 0) === '18446744073709551616', 'multiply beyond 64 bit');

final class DecimalOidProbe extends Der {
	public function decode(string $der): string {
		$this->init($der);

		return $this->oid_($this->next(6));
	}
}

foreach (['1.2.840.113549.1.1.1', '2.999.18446744073709551616', '0.39.0', '2.5.29.17'] as $oid) {
	checkDecimal((new DecimalOidProbe())->decode(DerEncoder::oid($oid)) === $oid . "*", "OID round trip {$oid}");
}

echo "Decimal string checks passed\n";
