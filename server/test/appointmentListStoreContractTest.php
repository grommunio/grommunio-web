<?php

if (!class_exists('Module')) {
	class Module {
		public function execute() {}
	}
}

if (!class_exists('ListModule')) {
	class ListModule extends Module {
		public function messageList(
			/* @scrutinizer ignore-unused */ $store,
			/* @scrutinizer ignore-unused */ $entryid,
			/* @scrutinizer ignore-unused */ $action,
			/* @scrutinizer ignore-unused */ $actionType,
		) {}

		public function processPrivateItem($item) {
			return $item;
		}
	}
}

require_once dirname(__DIR__) . '/includes/modules/class.appointmentlistmodule.php';

$module = (new ReflectionClass(AppointmentListModule::class))->newInstanceWithoutConstructor();
$normalize = new ReflectionMethod(AppointmentListModule::class, 'normalizeStoreEntryIds');

$firstStore = fopen('php://memory', 'r+');
$secondStore = fopen('php://memory', 'r+');
if ($firstStore === false || $secondStore === false) {
	throw new RuntimeException('Unable to create test store resources.');
}

[$stores, $entryids] = $normalize->invoke(
	$module,
	[$firstStore, false, $secondStore],
	['first', 'failed', 'second'],
);
if ($stores !== [$firstStore, $secondStore] || $entryids !== ['first', 'second']) {
	throw new RuntimeException('Valid store/folder pairs were not preserved.');
}

[$stores, $entryids] = $normalize->invoke($module, [$firstStore], ['first', 'extra']);
if ($stores !== [] || $entryids !== []) {
	throw new RuntimeException('Mismatched store/folder lists were accepted.');
}

[$stores, $entryids] = $normalize->invoke($module, $firstStore, 'first');
if ($stores !== [$firstStore] || $entryids !== ['first']) {
	throw new RuntimeException('A scalar store/folder pair was not normalized.');
}

fclose($firstStore);
fclose($secondStore);

echo "Appointment list store contract checks passed\n";
