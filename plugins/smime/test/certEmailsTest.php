<?php

/*
 * SPDX-FileCopyrightText: Copyright 2020 - 2026 grommunio GmbH
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

/* Every email address of a certificate takes part in the sender check. */
chdir(dirname(__DIR__));

require_once 'php/util.php';

function checkEmails(array $certificate, array $expected, string $message): void {
	if (getCertEmails($certificate) !== $expected) {
		fwrite(STDERR, "FAIL: {$message}: " . json_encode(getCertEmails($certificate)) . "\n");

		exit(1);
	}
}

checkEmails(['subject' => ['emailAddress' => 'A@Example.com']], ['a@example.com'], 'subject address, lower-cased');
checkEmails(
	['subject' => [], 'extensions' => ['subjectAltName' => 'email:first@example.com, DNS:example.com, email:Second@example.com']],
	['first@example.com', 'second@example.com'],
	'every subjectAltName address'
);
checkEmails(
	['subject' => ['emailAddress' => 'a@example.com'], 'extensions' => ['subjectAltName' => 'email:a@example.com, email:b@example.com']],
	['a@example.com', 'b@example.com'],
	'subject and subjectAltName without duplicates'
);
checkEmails(['subject' => ['emailAddress' => ['a@example.com', 'b@example.com']]], ['a@example.com', 'b@example.com'], 'multi-valued subject address');
checkEmails(['subject' => ['CN' => 'No Mail']], [], 'certificate without address');

echo "Certificate email checks passed\n";
