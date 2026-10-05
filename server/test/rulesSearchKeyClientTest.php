<?php

/*
 * SPDX-FileCopyrightText: Copyright 2020 - 2026 grommunio GmbH
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

// A reopened From/Sent-To rule keeps the recipient search key under either key spelling.
$node = trim((string) shell_exec('command -v node 2>/dev/null'));
if ($node === '') {
	echo "Rules search key client checks skipped without node\n";

	return;
}

$client = dirname(__DIR__, 2) . '/client/grommunio';
$script = <<<'JS'
	const fs = require('node:fs');
	const vm = require('node:vm');
	const assert = require('node:assert/strict');
	const client = process.argv[1];
	const ctx = {console};
	ctx.window = ctx;
	vm.createContext(ctx);
	vm.runInContext(`
		var _ = function(s) { return s; };
		var Ext = {
			namespace: function(ns) { var o = window; ns.split('.').forEach(function(p) { o = o[p] = o[p] || {}; }); },
			extend: function(base, proto) { var c = function() {}; c.prototype = Object.assign(Object.create(base.prototype), proto); return c; },
			reg: function() {},
			isDefined: function(v) { return typeof v !== 'undefined'; },
			BoxComponent: function() {}
		};
		var Grommunio = { core: { Enum: { create: function(o) { return o; } } } };
	`, ctx);
	for (const file of ['core/mapi/Restrictions.js', 'common/rules/data/ConditionFlags.js', 'common/rules/dialogs/UserSelectionLink.js']) {
		vm.runInContext(fs.readFileSync(client + '/' + file, 'utf8'), ctx, {filename: file});
	}
	const G = vm.runInContext('Grommunio', ctx);
	const flags = G.common.rules.data.ConditionFlags;
	const sk = '534d54503a555345524041';

	const comment = (valueKey, tag) => [10, {
		10: [4, {1: 4, 6: tag, 0: {[valueKey]: sk}}],
		9: {[valueKey]: sk, '0x0001001E': 'User <user@example.com>', PR_DISPLAY_TYPE: 0}
	}];
	const check = (flag, condition) => {
		const added = [];
		const link = Object.create(G.common.rules.dialogs.UserSelectionLink.prototype);
		link.update = () => {};
		link.store = {
			removeAll() {}, add(r) { added.push(r); },
			parseRecipient() { const data = {}; return { data, set(k, v) { data[k] = v; } }; }
		};
		link.setCondition(flag, condition);
		assert.equal(added.length, 1);
		assert.equal(added[0].data.search_key, sk);
		assert.equal(link.isValid, true);
	};

	for (const key of ['0x00010102', 'PR_EMS_TEMPLATE_BLOB']) {
		check(flags.RECEIVED_FROM, comment(key, 'PR_SENDER_SEARCH_KEY'));
		check(flags.RECEIVED_FROM, [1, [comment(key, 'PR_SENDER_SEARCH_KEY')]]);
		check(flags.SENT_TO, [9, {6: 'PR_MESSAGE_RECIPIENTS', 10: comment(key, 'PR_SEARCH_KEY')}]);
		check(flags.SENT_TO, [1, [[9, {6: 'PR_MESSAGE_RECIPIENTS', 10: comment(key, 'PR_SEARCH_KEY')}]]]);
	}
	console.log('OK');
JS;

$out = [];
exec(escapeshellarg($node) . ' -e ' . escapeshellarg($script) . ' ' . escapeshellarg($client) . ' 2>&1', $out, $rc);
echo implode("\n", $out) . "\n";
exit($rc === 0 ? 0 : 1);
