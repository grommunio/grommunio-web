<?php

/*
 * SPDX-FileCopyrightText: Copyright 2020 - 2026 grommunio GmbH
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

// The server resolves a contents table through its folder handle, so the
// Sent Items folder must outlive the helper that opened its table.
if (extension_loaded('mapi')) {
	echo "Mail list conversation count checks skipped with php-mapi loaded\n";

	return;
}

$constants = ['PR_IPM_SENTMAIL_ENTRYID', 'PR_CONVERSATION_ID', 'PR_SENSITIVITY', 'MAPI_DEFERRED_ERRORS', 'RES_OR',
	'RES_PROPERTY', 'RELOP', 'RELOP_EQ', 'ULPROPTAG', 'VALUE', 'TBL_BATCH', 'SENSITIVITY_PRIVATE'];
foreach ($constants as $index => $constant) {
	defined($constant) || define($constant, 3000 + $index);
}
define('ZARAFA_STORE_DELEGATE_GUID', 'delegate-provider');

class GrommunioException extends Exception {}

class MAPIException extends Exception {
	public function setHandled() {}
}

class StubFolder {}

class StubTable {
	public function __construct(public WeakReference $folder) {}
}

function mapi_getprops($object, $tags = null) {
	return [PR_IPM_SENTMAIL_ENTRYID => 'sent'];
}

function mapi_msgstore_openentry($store, $entryid) {
	return new StubFolder();
}

function mapi_folder_getcontentstable($folder, $flags) {
	return new StubTable(WeakReference::create($folder));
}

function mapi_table_restrict($table, $restriction, $flags) {
	if ($table->folder->get() === null) {
		throw new MAPIException('ecNullObject');
	}
}

function mapi_table_queryallrows($table, $props) {
	return [[PR_CONVERSATION_ID => "\x01\x02"], [PR_CONVERSATION_ID => "\x01\x02"]];
}

$GLOBALS['bus'] = new class {
	public $data;

	public function addData($data) {
		$this->data = $data;
	}
};

require_once dirname(__DIR__) . '/includes/modules/class.module.php';
require_once dirname(__DIR__) . '/includes/modules/class.listmodule.php';
require_once dirname(__DIR__) . '/includes/modules/class.maillistmodule.php';

class ConversationCountsList extends MailListModule {
	public function __construct() {
		$this->id = 1;
	}

	#[Override]
	public function useConversationView() {
		return true;
	}

	public function counts() {
		return $this->responseData['conversationcounts']['counts'];
	}
}

$list = new ConversationCountsList();
$list->storeProviderGuid = false;
$list->getConversationCounts('store', ['conversation_ids' => ['0102']]);
if ($list->counts() !== ['0102' => 2]) {
	throw new RuntimeException('Sent items of a conversation were not counted');
}

echo "Mail list conversation count checks passed\n";
