<?php

namespace ContactAppointmentRecurrenceTest;

abstract class ItemModuleStub {
	abstract public function open($store, $entryid, $action);

	abstract public function save($store, $parententryid, $entryid, $action, $actionType = 'save');

	abstract public function delete($store, $parententryid, $entryid, $action);
}

class_alias(ItemModuleStub::class, 'ItemModule');

require_once dirname(__DIR__) . '/includes/modules/class.contactitemmodule.php';

$previousTimezone = date_default_timezone_get();
date_default_timezone_set('UTC');

try {
	$monthOffsetMethod = new \ReflectionMethod(\ContactItemModule::class, 'getMonthOffset');
	$birthDate = new \DateTimeImmutable('1900-03-15 00:00:00 UTC');
	$monthOffset = $monthOffsetMethod->invoke(null, $birthDate->getTimestamp());
	$expectedOffset = 59 * 24 * 60;

	if ($monthOffset !== $expectedOffset) {
		throw new \RuntimeException(sprintf(
			'Expected a %d-minute offset for March 1900, got %s.',
			$expectedOffset,
			var_export($monthOffset, true)
		));
	}
}
finally {
	date_default_timezone_set($previousTimezone);
}

echo "Contact appointment recurrence checks passed\n";
