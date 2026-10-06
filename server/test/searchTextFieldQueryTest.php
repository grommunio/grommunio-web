<?php

/*
 * SPDX-FileCopyrightText: Copyright 2020 - 2026 grommunio GmbH
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

// The search box keeps a leading NOT and drops operators that only join toolbox filters.
$node = trim((string) shell_exec('command -v node 2>/dev/null'));
if ($node === '') {
	echo "Search query client checks skipped without node\n";

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
		var Grommunio = {};
		var Ext = {
			ns: function(ns) { var o = window; ns.split('.').forEach(function(p) { o = o[p] = o[p] || {}; }); },
			extend: function(base, proto) { var c = function() {}; c.prototype = Object.assign(Object.create(base.prototype), proto); return c; },
			reg: function() {},
			form: { TextField: function() {} }
		};
		window.Grommunio = Grommunio;
	`, ctx);
	const file = 'common/searchfield/ui/SearchTextField.js';
	vm.runInContext(fs.readFileSync(client + '/' + file, 'utf8'), ctx, {filename: file});
	const proto = vm.runInContext('Grommunio', ctx).common.searchfield.ui.SearchTextField.prototype;
	const build = (tokens, tail) => proto.buildQuery.call(Object.assign(Object.create(proto), {
		tokens, tailInputEl: tail ? {dom: {value: tail}} : null,
	}));
	const op = (key) => ({type: 'operator', key});
	const text = (value) => ({type: 'text', value});
	const filter = (key, value) => ({type: 'filter', key, value});

	assert.equal(build([op('NOT'), text('foo')]), 'NOT foo', 'leading NOT is kept');
	assert.equal(build([text('a'), op('AND'), op('NOT'), text('b')]), 'a AND NOT b');
	assert.equal(build([filter('unread'), op('AND'), op('NOT'), text('b')]), 'NOT b', 'NOT after a toolbox filter is kept');
	assert.equal(build([op('AND'), text('foo')]), 'foo', 'leading binary operator is dropped');
	assert.equal(build([text('foo'), op('NOT')]), 'foo', 'trailing NOT is dropped');
	assert.equal(build([op('NOT'), filter('unread')]), '', 'NOT of a toolbox filter is dropped');
	assert.equal(build([text('a'), op('OR'), filter('subject', 'x y')]), 'a OR subject:"x y"');
	console.log('ok');
JS;

$out = [];
exec(escapeshellarg($node) . ' -e ' . escapeshellarg($script) . ' ' . escapeshellarg($client) . ' 2>&1', $out, $status);
if ($status !== 0 || end($out) !== 'ok') {
	throw new RuntimeException("Search query client checks failed:\n" . implode("\n", $out));
}
echo "Search query client checks passed\n";
