<?php

require_once dirname(__DIR__) . '/php/lib/seafapi/autoload.php';

use Datamate\SeafileApi\Exception\UnexpectedJsonTextResponseException;
use Datamate\SeafileApi\SeafileApi;

$reflection = new ReflectionClass(SeafileApi::class);
$api = $reflection->newInstanceWithoutConstructor();
$decode = $reflection->getMethod('jsonDecode');

foreach (['null', 'true', 'false', '42', '1.5'] as $json) {
	try {
		$decode->invoke($api, $json);
	}
	catch (UnexpectedJsonTextResponseException) {
		continue;
	}

	throw new RuntimeException("Default JSON decoding accepted scalar value {$json}.");
}

if ($decode->invoke($api, '"value"') !== 'value' || $decode->invoke($api, '[]') !== [] ||
	!is_object($decode->invoke($api, '{"success":true}'))) {
	throw new RuntimeException('Default JSON decoding rejected a supported structural value.');
}

$jsonFlag = $reflection->getConstant('JSON_DECODE_ACCEPT_JSON');
if ($decode->invoke($api, 'null', $jsonFlag) !== null || $decode->invoke($api, '42', $jsonFlag) !== 42) {
	throw new RuntimeException('JSON passthrough mode rejected a valid scalar value.');
}

$nullableFlag = $reflection->getConstant('JSON_DECODE_ACCEPT_ARRAY_SINGLE_OBJECT_NULLABLE');
if ($decode->invoke($api, '[]', $nullableFlag) !== null) {
	throw new RuntimeException('Nullable single-object mode rejected an empty array.');
}

try {
	$decode->invoke($api, 'null', $nullableFlag);
}
catch (UnexpectedJsonTextResponseException) {
	echo "Seafile JSON structural validation checks passed\n";

	return;
}

throw new RuntimeException('Nullable single-object mode accepted a JSON null value.');
