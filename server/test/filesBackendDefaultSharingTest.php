<?php

defined('PLUGIN_FILESBROWSER_LOGLEVEL') || define('PLUGIN_FILESBROWSER_LOGLEVEL', 'ERROR');

require_once dirname(__DIR__, 2) . '/plugins/files/php/Files/Backend/Webdav/class.backend.php';
require_once dirname(__DIR__, 2) . '/plugins/filesbackendDefault/php/class.backend.php';

use Files\Backend\Default\Backend;
use OCSAPI\Exception\ConnectionException;

$reflection = new ReflectionClass(Backend::class);
$backend = $reflection->newInstanceWithoutConstructor();
$backend->ocs_client = new class {
	public function loadShares() {
		throw new ConnectionException('Unavailable');
	}

	public function getAllShares() {
		throw new RuntimeException('Sharing data was requested after loadShares failed.');
	}
};

try {
	$backend->sharingDetails(['/first', '/second']);

	throw new RuntimeException('A sharing connection error was reported as a successful empty result.');
}
catch (ConnectionException) {
}

echo "Default backend sharing error checks passed\n";
