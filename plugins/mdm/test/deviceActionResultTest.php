<?php

if (function_exists('mapi_logon_zarafa')) {
	echo "MDM device action result checks skipped with php-mapi loaded\n";

	return;
}

// The module pulls in the encryption store, which in turn wants a deployed
// config.php. Point BASE_PATH at a stub tree so the real class can be loaded.
$stubRoot = sys_get_temp_dir() . '/grommunio-mdm-' . bin2hex(random_bytes(8));
if (!mkdir($stubRoot . '/server/includes/core', 0700, true)) {
	throw new RuntimeException('Could not create the stub tree.');
}
file_put_contents($stubRoot . '/server/includes/core/class.encryptionstore.php', "<?php\n");
register_shutdown_function(static function () use ($stubRoot): void {
	@unlink($stubRoot . '/server/includes/core/class.encryptionstore.php');
	foreach (['/server/includes/core', '/server/includes', '/server', ''] as $part) {
		@rmdir($stubRoot . $part);
	}
});
define('BASE_PATH', $stubRoot . '/');

if (!class_exists('Module')) {
	class Module {
		public function __construct($id, $data) {}

		protected function afterLoadSessionData() {}

		public function execute() {}
	}
}

if (!class_exists('EncryptionStore')) {
	class EncryptionStore {}
}

require_once __DIR__ . '/../php/class.pluginmdmmodule.php';

$module = (new ReflectionClass(PluginMDMModule::class))->newInstanceWithoutConstructor();
$reported = new ReflectionMethod(PluginMDMModule::class, 'apiReportedSuccess');

$succeeds = [
	'a plain success' => '{"message":"success"}',
	'success with a tail' => '{"message":"successfully wiped"}',
	'success in another case' => '{"message":"Success"}',
];
foreach ($succeeds as $label => $answer) {
	if ($reported->invoke($module, $answer) !== true) {
		throw new RuntimeException(sprintf('%s was not taken as a successful request.', ucfirst($label)));
	}
}

// Anything else is a failure. Before, removeDevice handed these back verbatim and
// the client took every non-empty answer for a removed device.
$fails = [
	'a refusal' => '{"message":"Permission denied"}',
	'an error object' => '{"error":"unauthorized"}',
	'an empty object' => '{}',
	'an unreachable endpoint' => false,
	'an empty answer' => '',
	'a non-JSON answer' => '<html>502 Bad Gateway</html>',
	'a bare string' => '"success"',
	'a message that only contains success' => '{"message":"no success at all"}',
];
foreach ($fails as $label => $answer) {
	if ($reported->invoke($module, $answer) !== false) {
		throw new RuntimeException(sprintf('%s was taken as a successful request.', ucfirst($label)));
	}
}

echo "MDM device action result checks passed\n";
