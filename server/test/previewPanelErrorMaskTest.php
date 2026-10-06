<?php

/*
 * SPDX-FileCopyrightText: Copyright 2020 - 2026 grommunio GmbH
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

// The preview's load error mask is cleared once the next record loads.
$node = trim((string) shell_exec('command -v node 2>/dev/null'));
if ($node === '') {
	echo "Preview error mask checks skipped without node\n";

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
			Panel: function() {},
			util: { DelayedTask: function(fn, scope) { this.delay = function() { this.pending = function() { fn.call(scope); }; }; this.cancel = function() { this.pending = null; }; } }
		};
		var mask = { state: 'hidden', show: function() { this.state = 'loading'; }, showError: function() { this.state = 'error'; }, hide: function() { this.state = 'hidden'; } };
		var Grommunio = { common: { ui: { LoadMask: function() { return mask; } } } };
		window.Grommunio = Grommunio; window.mask = mask;
	`, ctx);
	const file = 'core/ui/PreviewPanel.js';
	vm.runInContext(fs.readFileSync(client + '/' + file, 'utf8'), ctx, {filename: file});
	const G = vm.runInContext('Grommunio', ctx);
	const mask = vm.runInContext('mask', ctx);
	const panel = Object.assign(new G.core.ui.PreviewPanel(), {loadMaskDelay: 250});

	panel.onBeforeLoadRecord();
	panel.onExceptionRecord();
	assert.equal(mask.state, 'error', 'a failed load shows the error mask');
	panel.onBeforeLoadRecord();
	panel.onLoadRecord();
	assert.equal(mask.state, 'hidden', 'the next record clears the error mask');

	panel.onBeforeLoadRecord();
	panel.loadMaskTask.pending();
	assert.equal(mask.state, 'loading');
	panel.onLoadRecord();
	assert.equal(mask.state, 'hidden');
	console.log('ok');
JS;

$out = [];
exec(escapeshellarg($node) . ' -e ' . escapeshellarg($script) . ' ' . escapeshellarg($client) . ' 2>&1', $out, $status);
if ($status !== 0 || end($out) !== 'ok') {
	throw new RuntimeException("Preview error mask checks failed:\n" . implode("\n", $out));
}
echo "Preview error mask checks passed\n";
