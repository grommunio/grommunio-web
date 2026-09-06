<?php

defined('PLUGIN_FILESBROWSER_LOGLEVEL') || define('PLUGIN_FILESBROWSER_LOGLEVEL', 'ERROR');

require_once dirname(__DIR__, 2) . '/plugins/files/php/Files/Backend/Webdav/class.backend.php';
require_once dirname(__DIR__, 2) . '/plugins/filesbackendDefault/php/class.backend.php';

use Files\Backend\Default\Backend;

$reflection = new ReflectionClass(Backend::class);
$backend = $reflection->newInstanceWithoutConstructor();
$backend->ocs_client = new class {
	public function loadShares($path = null) {}

	public function getAllShares() {
		return false;
	}

	public function loadShareByPath($path) {
		return false;
	}
};

set_error_handler(static function ($severity, $message, $file, $line) {
	throw new ErrorException($message, 0, $severity, $file, $line);
});

try {
	if ($backend->getShares('/missing') !== ['/missing' => []]) {
		throw new RuntimeException('An unavailable share list did not produce an empty result.');
	}
	if ($backend->sharingDetails(['/missing']) !== ['/missing' => []]) {
		throw new RuntimeException('An unavailable path share list did not produce an empty result.');
	}
}
finally {
	restore_error_handler();
}

echo "Empty share list checks passed\n";
