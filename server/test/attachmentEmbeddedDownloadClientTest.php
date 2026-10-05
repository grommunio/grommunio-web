<?php

/*
 * SPDX-FileCopyrightText: Copyright 2020 - 2026 grommunio GmbH
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

// The client offers a saved embedded message for download and ZIP, and warns only about unsaved ones.
$node = trim((string) shell_exec('command -v node 2>/dev/null'));
if ($node === '') {
	echo "Embedded attachment client checks skipped without node\n";

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
		var settings = {};
		var container = { getSettingsModel: function() { return { get: function(k) { return settings[k]; } }; } };
		var Ext = {
			namespace: function(ns) { var o = window; ns.split('.').forEach(function(p) { o = o[p] = o[p] || {}; }); },
			extend: function(base, proto) { var c = function(d) { this.data = d || {}; }; c.prototype = Object.assign(Object.create(base.prototype), proto); return c; },
			reg: function() {},
			isFunction: function(f) { return typeof f === 'function'; },
			isEmpty: function(v) { return v === undefined || v === null || v === ''; },
			data: { Record: function() {} },
			Component: function() {}
		};
		Ext.data.Record.prototype.get = function(k) { return this.data[k]; };
		var Grommunio = { core: { mapi: { ObjectType: { MAPI_ATTACH: 7 }, AttachMethod: { NO_ATTACHMENT: 0, ATTACH_BY_VALUE: 1, ATTACH_OLE: 6, ATTACH_EMBEDDED_MSG: 5 } },
			MessageClass: { isClass: function() { return false; } },
			data: { RecordFactory: { setBaseClassToObjectType: function() {}, addFieldToObjectType: function() {} } },
			ui: { menu: { ConditionalMenu: function() {} } } } };
		window.container = container; window.settings = settings;
	`, ctx);
	for (const file of ['core/data/IPMAttachmentRecord.js', 'common/attachment/ui/AttachmentDownloader.js', 'common/attachment/ui/AttachmentContextMenu.js']) {
		vm.runInContext(fs.readFileSync(client + '/' + file, 'utf8'), ctx, {filename: file});
	}
	const G = vm.runInContext('Grommunio', ctx);
	const records = [];
	const store = { each(fn) { records.every((r) => fn(r) !== false); }, getCount: () => records.length, getRange: () => records.slice() };
	const make = (data) => { const r = new G.core.data.IPMAttachmentRecord(Object.assign({attach_num: -1}, data)); r.store = store; r.getAttachmentUrl = (zip) => (zip ? 'zip' : 'one'); r.isEmbeddedInBody = () => false; return r; };
	const file = make({attach_method: 1, attach_num: 0});
	const embedded = make({attach_method: 5, attach_num: 1});
	const ole = make({attach_method: 6, attach_num: 2});
	records.push(file, embedded, ole);

	const downloader = new G.common.attachment.ui.AttachmentDownloader();
	let opened = null, downloaded = null;
	downloader.openMixAttachmentsDialog = (r) => { opened = r; };
	downloader.downloadItem = (url) => { downloaded = url; };
	downloader.checkForEmbeddedAttachments(file, true);
	assert.equal(opened, null, 'saved embedded message raises no ZIP warning');
	assert.equal(downloaded, 'zip');

	const menu = new G.common.attachment.ui.AttachmentContextMenu();
	menu.getPrimaryRecord = (r) => r;
	let disabled;
	const item = { setDisabled(v) { disabled = v; } };
	menu.onDownloadBeforeShow(item, embedded);
	assert.equal(disabled, false, 'saved embedded message can be downloaded');
	menu.onDownloadZipBeforeShow(item, embedded);
	assert.equal(disabled, false, 'saved embedded message can be downloaded as ZIP');

	const unsaved = make({attach_method: 5});
	records.push(unsaved);
	menu.onDownloadBeforeShow(item, unsaved);
	assert.equal(disabled, true, 'unsaved embedded message can not be downloaded');
	downloader.checkForEmbeddedAttachments(file, true);
	assert.ok(opened, 'unsaved embedded message still raises the ZIP warning');
	console.log('ok');
JS;

$out = [];
exec(escapeshellarg($node) . ' -e ' . escapeshellarg($script) . ' ' . escapeshellarg($client) . ' 2>&1', $out, $status);
if ($status !== 0 || end($out) !== 'ok') {
	throw new RuntimeException("Embedded attachment client checks failed:\n" . implode("\n", $out));
}
echo "Embedded attachment client checks passed\n";
