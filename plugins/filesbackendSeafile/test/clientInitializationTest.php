<?php

if (!function_exists('_')) {
	function _($message) {
		return $message;
	}
}

$curlConstants = [
	'CURLE_BAD_PASSWORD_ENTERED',
	'CURLE_SSL_CONNECT_ERROR',
	'CURLE_COULDNT_RESOLVE_HOST',
	'CURLE_COULDNT_CONNECT',
	'CURLE_OPERATION_TIMEOUTED',
];
foreach ($curlConstants as $index => $constant) {
	defined($constant) || define($constant, 900 + $index);
}

require_once dirname(__DIR__) . '/php/class.backend.php';

use Files\Backend\Exception as BackendException;
use Files\Backend\Seafile\Backend;

$backend = (new ReflectionClass(Backend::class))->newInstanceWithoutConstructor();
$getSeafileApi = new ReflectionMethod(Backend::class, 'getSeafileApi');

try {
	$getSeafileApi->invoke($backend);

	throw new RuntimeException('An unopened Seafile backend exposed an uninitialized API client');
}
catch (BackendException $e) {
	if ($e->getCode() !== 800) {
		throw new RuntimeException('An unopened Seafile backend returned the wrong error code', 0, $e);
	}
}

try {
	$backend->mkcol('/library');

	throw new RuntimeException('An unopened Seafile backend attempted an API operation');
}
catch (BackendException $e) {
	if ($e->getCode() !== 800) {
		throw new RuntimeException('An unopened Seafile operation returned the wrong error code', 0, $e);
	}
}

echo "Seafile client initialization checks passed\n";
