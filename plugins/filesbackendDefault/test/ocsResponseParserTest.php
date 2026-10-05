<?php

/*
 * SPDX-FileCopyrightText: Copyright 2020 - 2026 grommunio GmbH
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

if (!class_exists(SimpleXMLElement::class)) {
	return;
}

require_once dirname(__DIR__) . '/php/lib/ocsapi/class.ocsresponseparser.php';

libxml_use_internal_errors(true);

use OCSAPI\Exception\FileNotFoundException;
use OCSAPI\Exception\InvalidResponseException;
use OCSAPI\Exception\PermissionDeniedException;
use OCSAPI\ocsresponseparser;
use OCSAPI\ocsshare;

function assertParser($condition, $message) {
	if (!$condition) {
		throw new RuntimeException($message);
	}
}

function expectParserException($callback, $class, $message) {
	try {
		$callback();
	}
	catch (Throwable $e) {
		assertParser($e::class === $class, $message . ' (got ' . $e::class . ')');

		return;
	}

	throw new RuntimeException($message . ' (no exception)');
}

$ok = '<meta><statuscode>100</statuscode></meta>';

$listing = ocsresponseparser::parseListingResponse("<ocs>{$ok}<data>" .
	'<element><id>7</id><path>/a</path><token>tok</token></element>' .
	'<element><id>3</id><path>/b</path><url>https://x/s/given</url></element>' .
	'</data></ocs>', 'https://cloud.test');
assertParser(array_keys($listing) === [7, 3], 'Listing keys or order changed.');
assertParser($listing[7]->getUrl() === 'https://cloud.test' . ocsshare::SHARE_URL_SUFFIX . 'tok', 'Share URL was not generated from the token.');
assertParser($listing[3]->getUrl() === 'https://x/s/given', 'A given share URL was replaced.');
assertParser(ocsresponseparser::parseListingResponse("<ocs>{$ok}</ocs>", 'h') === [], 'A listing without data returned shares.');

$share = ocsresponseparser::parseModificationResponse("<ocs>{$ok}<data><id>9</id></data></ocs>");
assertParser($share instanceof ocsshare && $share->getId() === 9, 'Modification response was not parsed.');
assertParser(ocsresponseparser::parseModificationResponse("<ocs>{$ok}</ocs>") === false, 'Modification without data was accepted.');

$recipient = static fn ($label, $with, $type) => "<element><label>{$label}</label><value><shareType>{$type}</shareType><shareWith>{$with}</shareWith></value></element>";
$recipients = ocsresponseparser::parseRecipientResponse("<ocs>{$ok}<data>" .
	'<groups>' . $recipient('G', 'g', 1) . '</groups>' .
	'<users>' . $recipient('U', 'u', 0) . '</users>' .
	'<exact><groups>' . $recipient('EG', 'eg', 1) . '</groups><users>' . $recipient('EU', 'eu', 0) . '</users></exact>' .
	'</data></ocs>');
assertParser($recipients === [['EU', 'eu', '0'], ['U', 'u', '0'], ['EG', 'eg', '1'], ['G', 'g', '1']], 'Recipient order changed.');
assertParser(ocsresponseparser::parseRecipientResponse("<ocs>{$ok}</ocs>") === false, 'Recipients without data were accepted.');

expectParserException(static fn () => ocsresponseparser::parseListingResponse('', 'h'), InvalidResponseException::class, 'An empty listing was accepted.');
expectParserException(static fn () => ocsresponseparser::parseRecipientResponse(false), InvalidResponseException::class, 'A failed transfer was accepted.');
expectParserException(static fn () => ocsresponseparser::parseModificationResponse('<ocs'), InvalidResponseException::class, 'Malformed XML was accepted.');
expectParserException(static fn () => ocsresponseparser::parseModificationResponse('<ocs><meta><statuscode>403</statuscode></meta></ocs>'), PermissionDeniedException::class, 'Status 403 was not mapped.');
expectParserException(static fn () => ocsresponseparser::parseListingResponse('<ocs><meta><statuscode>404</statuscode></meta></ocs>', 'h'), FileNotFoundException::class, 'Status 404 was not mapped.');

echo "ocsResponseParserTest: OK\n";
