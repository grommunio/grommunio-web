<?php

/*
 * SPDX-FileCopyrightText: Copyright 2020 - 2026 grommunio GmbH
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

// The advanced search model takes a selected folder even before it has a default folder.
$node = trim((string) shell_exec('command -v node 2>/dev/null'));
if ($node === '') {
	echo "Advanced search folder select checks skipped without node\n";

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
		var Ext = {
			namespace: function(ns) { var o = window; ns.split('.').forEach(function(p) { o = o[p] = o[p] || {}; }); },
			extend: function(base, proto) { var c = function() {}; c.prototype = Object.assign(Object.create(base.prototype), proto); return c; },
			isDefined: function(v) { return v !== undefined; },
			isEmpty: function(v) { return v === undefined || v === null || v === '' || (Array.isArray(v) && !v.length); }
		};
		var Grommunio = { core: { data: { MAPIRecord: function() {} } } };
		Grommunio.core.ContextModel = function() {};
		Grommunio.core.ContextModel.prototype.getFolders = function() { return this.folders; };
		Grommunio.core.ContextModel.prototype.getDefaultFolder = function() {
			return this.enabled && !Ext.isEmpty(this.folders) ? this.folders[0] : this.defaultFolder;
		};
		window.Grommunio = Grommunio;
	`, ctx);
	for (const file of ['core/data/IPFRecord.js', 'advancesearch/AdvanceSearchContextModel.js']) {
		vm.runInContext(fs.readFileSync(client + '/' + file, 'utf8'), ctx, {filename: file});
	}
	const G = vm.runInContext('Grommunio', ctx);
	const folder = (id) => Object.assign(new G.core.data.IPFRecord(), {
		id, phantom: false, getMAPIStore: () => ({}), isIPMSubTree: () => false,
	});
	const model = Object.assign(new G.advancesearch.AdvanceSearchContextModel(), {
		enabled: false, folders: [], defaultFolder: undefined,
	});
	let set = null;
	model.setFolders = (f) => { set = f; };
	const inbox = folder('inbox');
	model.onFolderSelect([inbox]);
	assert.deepEqual(set, [inbox], 'the folder is taken without a default folder');

	set = null;
	model.defaultFolder = inbox;
	model.onFolderSelect([inbox]);
	assert.equal(set, null, 'the same folder is not set again');
	console.log('ok');
JS;

$out = [];
exec(escapeshellarg($node) . ' -e ' . escapeshellarg($script) . ' ' . escapeshellarg($client) . ' 2>&1', $out, $status);
if ($status !== 0 || end($out) !== 'ok') {
	throw new RuntimeException("Advanced search folder select checks failed:\n" . implode("\n", $out));
}
echo "Advanced search folder select checks passed\n";
