/*
 * SPDX-FileCopyrightText: Copyright 2026 Nika Krasnova
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

'use strict';

const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const {test} = require('node:test');

// Run the real model, state restoration, and save methods. Only Ext's class/event
// plumbing and the state-manager storage boundary are replaced. This does not
// exercise browser startup ordering or HTTP/settings persistence.
function fixture(initialState) {
	const pending = [];
	const writes = [];
	let saved = initialState && structuredClone(initialState);
	const palette = [{name: 'orange'}, {name: 'green'}, {name: 'blue'}];
	const context = vm.createContext({});
	function Observable() {}
	Observable.prototype.on = function(name, handler, scope, options) {
		(this.listeners[name] ||= []).push({handler, scope, options});
	};
	Observable.prototype.fireEvent = function(name, ...args) {
		for (const listener of this.listeners[name] || []) {
			const invoke = () => listener.handler.apply(listener.scope || this, args);
			if (listener.options?.delay) {
				pending.push(invoke);
			} else if (invoke() === false) {
				return false;
			}
		}
		return true;
	};
	context.Ext = {
		namespace(name) {
			let target = context;
			for (const part of name.split('.')) {
				target = target[part] ||= {};
			}
		},
		extend(base, methods) {
			function Type() {}
			Type.prototype = Object.assign(Object.create(base.prototype), methods);
			Type.superclass = base.prototype;
			return Type;
		},
		apply: Object.assign,
		isDefined: value => value !== undefined,
		util: {Observable},
		state: {Manager: {
			get() { return saved && structuredClone(saved); },
			set(id, state) {
				saved = structuredClone(state);
				writes.push(structuredClone(state));
			}
		}}
	};
	for (const file of ['core/data/StatefulObservable.js', 'core/ContextModel.js', 'core/MultiFolderContextModel.js']) {
		vm.runInContext(fs.readFileSync(path.join(__dirname, '../grommunio', file), 'utf8'), context, {filename: file});
	}
	context.Grommunio.core.ColorSchemes = {
		getColorScheme: name => palette.find(scheme => scheme.name === name)
	};
	return {
		writes,
		palette,
		settle() {
			while (pending.length) { pending.shift()(); }
		},
		model(ids = ['calendar']) {
			// Bypass UI/store construction, then perform the real state setup.
			const model = Object.create(context.Grommunio.core.MultiFolderContextModel.prototype);
			Object.assign(model, {
				listeners: {}, stateful: true, stateId: 'calendar-model',
				colorMap: {}, colorScheme: palette, groupings: {},
				folders: ids.map(id => ({get: key => key === 'entryid' ? id : 'mailbox'}))
			});
			model.initStateEvents();
			model.initState();
			return model;
		}
	};
}

test('an automatic color reaches saved state and survives model recreation', () => {
	const f = fixture();
	const first = f.model();
	first.assignColors();
	const chosen = first.colorMap.calendar;
	assert.ok(f.palette.some(scheme => scheme.name === chosen), 'a color was assigned');
	f.settle();
	assert.equal(f.writes.length, 1, 'the new color must reach the save path');
	assert.equal(f.writes[0].colorMap.calendar, chosen);
	const reopened = f.model();
	assert.equal(reopened.colorMap.calendar, chosen, 'restore the saved color before assigning colors');
	reopened.assignColors();
	f.settle();
	assert.equal(reopened.colorMap.calendar, chosen);
	assert.equal(f.writes.length, 1, 'restoring an existing color must not save again');
});

test('existing colors are preserved without saving', () => {
	const f = fixture({colorMap: {calendar: 'blue'}});
	const model = f.model();
	model.assignColors();
	f.settle();
	assert.equal(model.colorMap.calendar, 'blue');
	assert.equal(f.writes.length, 0);
});

test('multiple new calendars are saved together', () => {
	const f = fixture();
	const model = f.model(['calendar', 'shared']);
	model.assignColors();
	f.settle();
	assert.equal(f.writes.length, 1, 'save the batch once, not once per calendar');
	assert.deepEqual(Object.keys(f.writes[0].colorMap).sort(), ['calendar', 'shared']);
});

test('opening a shared calendar saves its color and preserves the existing choice', () => {
	const f = fixture({colorMap: {calendar: 'blue'}});
	const model = f.model(['calendar', 'shared']);
	model.assignColors();
	f.settle();
	assert.equal(f.writes.length, 1);
	assert.equal(f.writes[0].colorMap.calendar, 'blue');
	assert.ok(f.writes[0].colorMap.shared);
	model.assignColors();
	f.settle();
	assert.equal(f.writes.length, 1, 'repeating assignment without changes must not save');
});

test('manual color selection still reaches saved state', () => {
	const f = fixture({colorMap: {calendar: 'orange'}});
	const model = f.model();
	model.setColorScheme('calendar', {name: 'blue'});
	f.settle();
	assert.equal(f.writes.length, 1);
	assert.equal(f.model().colorMap.calendar, 'blue');
});

test('no calendars means no save', () => {
	const f = fixture();
	f.model([]).assignColors();
	f.settle();
	assert.equal(f.writes.length, 0);
});
