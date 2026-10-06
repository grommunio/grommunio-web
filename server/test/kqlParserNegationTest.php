<?php

/*
 * SPDX-FileCopyrightText: Copyright 2020 - 2026 grommunio GmbH
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

// A leading minus negates a search term, like NOT.
$node = trim((string) shell_exec('command -v node 2>/dev/null'));
if ($node === '') {
	echo "KQL negation checks skipped without node\n";

	return;
}

$client = dirname(__DIR__, 2) . '/client';
$script = <<<'JS'
	const fs = require('node:fs');
	const vm = require('node:vm');
	const assert = require('node:assert/strict');
	const client = process.argv[1];
	const ctx = {console};
	ctx.window = ctx;
	vm.createContext(ctx);
	vm.runInContext(fs.readFileSync(client + '/third-party/tokenizr/tokenizr.js', 'utf8'), ctx);
	vm.runInContext(`
		var _ = function(s) { return s; };
		var call = function(name) { return function() { return [name].concat([].slice.call(arguments)); }; };
		var Grommunio = { advancesearch: {}, core: {
			data: { RestrictionFactory: { createResAnd: call('AND'), createResOr: call('OR'), createResNot: call('NOT'), dataResContent: call('CONTENT') } },
			mapi: { RecipientType: {}, Restrictions: {} }
		} };
		var Ext = {
			namespace: function() {},
			extend: function(base, proto) { var c = function() {}; c.prototype = Object.assign(Object.create(base.prototype), proto); return c; },
			isArray: Array.isArray,
			isObject: function(v) { return v !== null && typeof v === 'object' && !Array.isArray(v); },
			isDefined: function(v) { return v !== undefined; },
			isEmpty: function(v) { return v == null || v === '' || (Array.isArray(v) && !v.length); },
			each: function(a, fn, scope) { (a || []).forEach(fn.bind(scope)); }
		};
		window.Grommunio = Grommunio; window.Ext = Ext;
	`, ctx);
	const file = 'grommunio/advancesearch/KQLParser.js';
	vm.runInContext(fs.readFileSync(client + '/' + file, 'utf8'), ctx, {filename: file});
	const kql = vm.runInContext('Grommunio.advancesearch.KQLParser', ctx);
	const res = (q) => JSON.stringify(kql.createTokenRestriction(kql.tokenize(q), ['subject']));
	const term = (v) => ['CONTENT', 'subject', 0, v];
	const json = (r) => JSON.stringify(r);

	assert.equal(res('-foo'), res('NOT foo'));
	assert.equal(res('-foo'), json(['AND', [['NOT', term('foo')]]]));
	assert.equal(res('a -b'), json(['AND', [term('a'), ['NOT', term('b')]]]));
	assert.equal(res('e-mail'), json(['AND', [term('e-mail')]]), 'an inner hyphen stays');
	assert.equal(res('"-x"'), json(['AND', [term('-x')]]), 'a quoted minus stays');
	console.log('ok');
JS;

$out = [];
exec(escapeshellarg($node) . ' -e ' . escapeshellarg($script) . ' ' . escapeshellarg($client) . ' 2>&1', $out, $status);
if ($status !== 0 || end($out) !== 'ok') {
	throw new RuntimeException("KQL negation checks failed:\n" . implode("\n", $out));
}
echo "KQL negation checks passed\n";
