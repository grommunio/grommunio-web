<?php

defined('PR_IPM_CONTACT_ENTRYID') || define('PR_IPM_CONTACT_ENTRYID', 1);
defined('DL_DIST') || define('DL_DIST', 2);
defined('DL_DIST_AB') || define('DL_DIST_AB', 3);
defined('MAPI_DISTLIST') || define('MAPI_DISTLIST', 4);
defined('DT_DISTLIST') || define('DT_DISTLIST', 5);

$GLOBALS['mapisession'] = new class {
	public function getDefaultMessageStore() {
		return 'default-store';
	}

	public function getPublicMessageStore() {
		return 'public-store';
	}
};
$GLOBALS['properties'] = new class {
	public function getDistListProperties() {
		return [];
	}

	public function getRecipientProperties() {
		return [];
	}
};
$GLOBALS['entryid'] = new class {
	public function createABEntryIdObj($entryid) {
		return ['extid' => 'message-entryid'];
	}

	public function hasNoMuid($prefix, $entryid) {
		return true;
	}

	public function createMessageEntryId($entryid) {
		return 'message-entryid';
	}

	public function createMessageEntryIdObj($entryid) {
		return ['providerguid' => 'provider', 'folderdbguid' => 'folder'];
	}

	public function createFolderEntryIdObj($entryid) {
		return ['providerguid' => 'provider', 'folderdbguid' => 'folder'];
	}

	public function wrapABEntryIdObj($entryid, $type) {
		return 'wrapped-' . $entryid;
	}
};

require_once dirname(__DIR__) . '/includes/core/class.operations.php';

class DistlistFallbackOperations extends Operations {
	public array $openedStores = [];
	public bool $publicStoreSucceeds = true;

	public function getPropertiesFromStoreRoot($store, $props) {
		return [PR_IPM_CONTACT_ENTRYID => 'contact-folder'];
	}

	public function openMessage($store, $entryid, $attachNum = false, $parseSmimeSigned = false) {
		$this->openedStores[] = $store;

		return $store === 'public-store' && $this->publicStoreSucceeds ? 'public-list' : false;
	}

	public function getMembersFromDistributionList($store, $message, $properties, $isRecursive = false, $listEntryIDs = []) {
		return [['source' => $store]];
	}

	public function convertDistlistMemberToRecipient($store, $member) {
		return ['source' => $store];
	}
}

$operations = new DistlistFallbackOperations();
$recipients = $operations->expandDistList('aa');
if ($recipients !== [['source' => 'public-store']] ||
	$operations->openedStores !== ['default-store', 'public-store']) {
	throw new RuntimeException('A false private-store result did not fall back to the public distribution list.');
}

$operations = new DistlistFallbackOperations();
$operations->publicStoreSucceeds = false;
if ($operations->expandDistList('aa') !== [] ||
	$operations->openedStores !== ['default-store', 'public-store']) {
	throw new RuntimeException('A missing distribution list did not fail cleanly after both stores were tried.');
}

class NestedDistlistFallbackOperations extends Operations {
	public array $openedStores = [];

	public function openMessage($store, $entryid, $attachNum = false, $parseSmimeSigned = false) {
		$this->openedStores[] = $store;

		return $store === 'public-store' ? 'public-list' : false;
	}

	public function getProps($item, $properties) {
		return ['entryid' => 'public-entryid', 'props' => []];
	}
}

$operations = new NestedDistlistFallbackOperations();
$recipient = $operations->convertDistlistMemberToRecipient('default-store', [
	'props' => [
		'entryid' => 'aa',
		'distlist_type' => DL_DIST,
		'address_type' => 'MAPIPDL',
		'email_address' => 'list@example.test',
	],
]);
if (($recipient['entryid'] ?? null) !== 'wrapped-public-entryid' ||
	$operations->openedStores !== ['default-store', 'public-store']) {
	throw new RuntimeException('A nested local list did not fall back to its public-store message.');
}

echo "Distribution-list fallback checks passed\n";
