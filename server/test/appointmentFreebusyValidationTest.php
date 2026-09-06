<?php

if (function_exists('mapi_getuserfreebusy')) {
	echo "Appointment free/busy validation requires PHP without the MAPI extension; skipped\n";

	exit(0);
}

define('PR_ENTRYID', 1);
define('PR_MAILBOX_OWNER_ENTRYID', 2);
define('MAPI_MESSAGE', 5);

if (!function_exists('mapi_getprops')) {
	function mapi_getprops($store, $properties) {
		return [
			PR_ENTRYID => 'store',
			PR_MAILBOX_OWNER_ENTRYID => 'owner',
		];
	}
}

if (!function_exists('mapi_getuserfreebusy')) {
	function mapi_getuserfreebusy($session, $ownerEntryId, $start, $end) {
		return $GLOBALS['freebusyTestData'];
	}
}

if (!function_exists('_')) {
	function _($message) {
		return $message;
	}
}

class BaseException extends Exception {}

class FreebusyValidationMapiSession {
	public function getSession() {
		return new stdClass();
	}
}

require_once dirname(__DIR__) . '/includes/exceptions/class.ZarafaException.php';
require_once dirname(__DIR__) . '/includes/modules/class.module.php';
require_once dirname(__DIR__) . '/includes/modules/class.listmodule.php';
require_once dirname(__DIR__) . '/includes/modules/class.appointmentlistmodule.php';

$GLOBALS['mapisession'] = new FreebusyValidationMapiSession();
$module = (new ReflectionClass(AppointmentListModule::class))->newInstanceWithoutConstructor();

foreach ([false, [], ['fbevents' => null]] as $freebusyData) {
	$GLOBALS['freebusyTestData'] = $freebusyData;
	if ($module->getFreebusyItems(new stdClass(), 'folder', false, false) !== []) {
		throw new RuntimeException('Invalid free/busy data was not ignored.');
	}
}

$GLOBALS['freebusyTestData'] = [
	'fbevents' => [[
		'start' => 100,
		'end' => 200,
		'subject' => 'Available appointment',
	]],
];
$items = $module->getFreebusyItems(new stdClass(), 'folder', 50, 250);
if (count($items) !== 1 || $items[0]['props']['subject'] !== 'Available appointment') {
	throw new RuntimeException('Valid free/busy data was rejected.');
}

$GLOBALS['freebusyTestData']['fbevents'] = new ArrayIterator($GLOBALS['freebusyTestData']['fbevents']);
$items = $module->getFreebusyItems(new stdClass(), 'folder', 50, 250);
if (count($items) !== 1 || $items[0]['props']['subject'] !== 'Available appointment') {
	throw new RuntimeException('Traversable free/busy data was rejected.');
}

echo "Appointment free/busy validation checks passed\n";
