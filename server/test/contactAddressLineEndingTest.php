<?php

/*
 * SPDX-FileCopyrightText: Copyright 2020 - 2026 grommunio GmbH
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

abstract class ItemModule {
	public $properties = [];

	public function open($store, $entryid, $action) {}

	public function save($store, $parententryid, $entryid, $action, $actionType = 'save') {}

	public function delete($store, $parententryid, $entryid, $action) {}
}

class Conversion {
	public static function mapXML2MAPI($properties, $props) {
		return $props;
	}
}

require_once dirname(__DIR__) . '/includes/modules/class.contactitemmodule.php';

$module = (new ReflectionClass(ContactItemModule::class))->newInstanceWithoutConstructor();
foreach ([1, 2, 3] as $index) {
	foreach (['address_type', 'original_display_name', 'email_address', 'original_entryid'] as $suffix) {
		$module->properties['fax_' . $index . '_' . $suffix] = $suffix;
	}
}

$deleted = [];
$props = (new ReflectionMethod(ContactItemModule::class, 'prepareContactProps'))->invokeArgs($module, [
	'store',
	['props' => [
		'business_address' => "Street 1\n12345 City",
		'home_address' => "Road 2\r\n54321 Town\nCountry",
		'other_address' => 'Single line',
	]],
	false,
	&$deleted,
]);

$expected = [
	'business_address' => "Street 1\r\n12345 City",
	'home_address' => "Road 2\r\n54321 Town\r\nCountry",
	'other_address' => 'Single line',
];
foreach ($expected as $key => $value) {
	if ($props[$key] !== $value) {
		throw new RuntimeException(sprintf('Unexpected %s line endings: %s', $key, json_encode($props[$key])));
	}
}

echo "Contact address line ending checks passed\n";
