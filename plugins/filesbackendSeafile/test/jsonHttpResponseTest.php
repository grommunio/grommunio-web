<?php

require_once dirname(__DIR__) . '/php/lib/seafapi/autoload.php';

use Datamate\SeafileApi\Exception\InvalidResponseException;
use Datamate\SeafileApi\SeafileApi;

$reflection = new ReflectionClass(SeafileApi::class);
$api = $reflection->newInstanceWithoutConstructor();
$decode = $reflection->getMethod('jsonDecode');

foreach ([false, true] as $response) {
	try {
		$decode->invoke($api, $response);
	}
	catch (InvalidResponseException) {
		continue;
	}

	throw new RuntimeException('JSON decoding accepted an HTTP response without a body.');
}

echo "Seafile JSON HTTP response checks passed\n";
