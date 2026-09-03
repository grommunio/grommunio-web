/* Run with node --test plugins/pgp/test/frontend-test.js. No browser dependencies. */
'use strict';

const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');
const vm = require('node:vm');

function runtime() {
	const fields = [], alerts = [], context = {_: text => text, console, Promise, Error};
	context.Ext = {
		namespace(name) {
			name.split('.').reduce((parent, key) => parent[key] || (parent[key] = {}), context);
		},
		extend(parent, members) {
			function Child(config) {
				if (Object.hasOwn(members, 'constructor')) { members.constructor.call(this, config); }
				else { parent.call(this, config); }
			}
			Child.prototype = Object.assign(Object.create(parent.prototype), members);
			Child.superclass = parent.prototype;
			return Child;
		},
		apply: Object.assign,
		emptyFn() {},
		isEmpty(value) { return value === undefined || value === null || value === ''; },
		isDefined(value) { return value !== undefined; },
		isFunction(value) { return typeof value === 'function'; },
		applyIf(target, source) {
			for (const key of Object.keys(source)) { if (target[key] === undefined) { target[key] = source[key]; } }
			return target;
		},
		each(values, callback, scope) { values.forEach((value, index) => callback.call(scope, value, index)); },
		util: {Format: {htmlEncode(value) {
			return String(value).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
		}}},
		Msg: {alert(title, message) { alerts.push({title, message}); }},
		data: {
			JsonStore: function(config) { Object.assign(this, config); },
			ArrayStore: function(config) { Object.assign(this, config); }
		},
		grid: {RowSelectionModel: function(config) { Object.assign(this, config); }},
		reg() {},
		id() { return 'test'; }
	};
	context.Zarafa = {core: {Plugin: function() {}, ContextModel: function() {}, ui: {Toolbar: function() {}}, data: {
		AbstractResponseHandler: function(config) { Object.assign(this, config); }, RecordFactory: {addFieldToMessageClass(messageClass, list) { fields.push(...list); }}
	}}, settings: {ui: {SettingsWidget: function(config) { Object.assign(this, config); }}}, onReady() {}};
	context.container = {getSettingsModel: () => ({get: (key, fallback) => fallback}), getUser: () => ({getSMTPAddress: () => 'alice@example.test'})};
	vm.createContext(context);
	vm.runInContext("String.format = function(text, value) { return text.replace('{0}', value); };", context);
	vm.runInContext(fs.readFileSync(path.join(__dirname, '../../../client/zarafa/common/ui/SecurityButtons.js'), 'utf8'), context);
	for (const filename of ['data/PgpResponseHandler.js', 'PgpUtils.js', 'PgpPlugin.js', 'dialogs/PgpDialogs.js', 'settings/SettingsPgpWidget.js']) {
		vm.runInContext(fs.readFileSync(path.join(__dirname, '../js', filename), 'utf8'), context, {filename});
	}
	vm.runInContext(fs.readFileSync(path.join(__dirname, '../../smime/js/SmimePlugin.js'), 'utf8'), context);
	for (const filename of ['Actions.js', 'MailContextModel.js']) {
		vm.runInContext(fs.readFileSync(path.join(__dirname, '../../../client/zarafa/mail', filename), 'utf8'), context);
	}
	context.Zarafa.mail.data = {ActionTypes: {REPLY: 'reply', REPLYALL: 'replyall', FORWARD: 'forward', FORWARD_ATTACH: 'forward_attach', EDIT_AS_NEW: 'edit_as_new'}};
	return {context, fields, alerts, utils: context.Zarafa.plugins.pgp.PgpUtils, plugin: new context.Zarafa.plugins.pgp.PgpPlugin()};
}

function record(values = {}) {
	const data = Object.assign({message_class: 'IPM.Note', pgp_sign: false, pgp_encrypt: false, pgp_key: ''}, values);
	return {data, get: name => data[name], set: (name, value) => { data[name] = value; }, beginEdit() {}, endEdit() {}};
}

function buttonFor(mail, action) {
	return {pgpAction: action, ownerCt: {dialog: {record: mail}}, iconCls: 'icon_pgp_' + action,
		setDisabled(value) { this.disabled = value; }, disable() { this.disabled = true; },
		setIconClass(value) { this.iconCls = value; }, setTooltip() {}};
}

const fingerprint = '1234567890ABCDEF1234567890ABCDEF12345678';

test('accepts full v4/v6 fingerprints and rejects short key IDs', () => {
	const {utils} = runtime();
	assert.equal(utils.isFingerprint('1234567890ABCDEF'), false);
	assert.equal(utils.isFingerprint('a'.repeat(40)), true);
	assert.equal(utils.isFingerprint('b'.repeat(64)), true);
	assert.equal(utils.isFingerprint('a'.repeat(42)), false);
	assert.equal(utils.fingerprint(utils.formatFingerprint(fingerprint)), fingerprint);
});

test('decryption and valid cryptography do not falsely authenticate the sender', () => {
	const {utils} = runtime();
	assert.equal(utils.status({encrypted: true, decrypted: true}).severity, 'info');
	assert.equal(utils.status({signed: true, signature_valid: 'true', sender_match: true, signer_trusted: true}).severity, 'bad');
	assert.equal(utils.status({signed: true, signature_valid: true, sender_match: false, signer_trusted: true}).severity, 'warning');
	assert.equal(utils.status({signed: true, signature_valid: true, sender_match: true, signer_trusted: false}).severity, 'warning');
	assert.equal(utils.status({signed: true, signature_valid: true, sender_match: true, signer_trusted: true}).severity, 'good');
	assert.match(utils.status({signed: true, signature_valid: true, sender_match: true, signer_trusted: true, inline: true}).text, /body only; attachments are not covered/);
});

test('OpenPGP column distinguishes ambiguous S/MIME classes using protocol metadata', () => {
	const {utils} = runtime();
	assert.equal(utils.icon(record({message_class: 'IPM.Note.SMIME.MultipartSigned'})), '');
	assert.equal(utils.icon(record({message_class: 'IPM.Note.SMIME.MultipartSigned', pgp_signed: true})), 'icon_pgp_sign');
	assert.equal(utils.icon(record({pgp_message_class: 'IPM.Note.GpgOL.MultipartSigned'})), 'icon_pgp_sign');
	assert.equal(utils.icon(record({message_class: 'IPM.Note.GpgOL.MultipartEncrypted'})), 'icon_pgp_encrypt');
	assert.equal(utils.icon(record({message_class: 'IPM.Note.GpgOL.ClearSigned'})), 'icon_pgp_sign');
	assert.equal(utils.icon(record({message_class: 'IPM.Note.GpgOL.OpaqueEncrypted'})), '');
	assert.equal(utils.icon(record({message_class: 'IPM.Note.GpgOL.OpaqueSigned'})), '');
});

test('key selection rejects revoked, expired, unusable, or other-identity keys', () => {
	const {utils} = runtime();
	const key = {secret: true, can_sign: true, can_encrypt: true, uids: [{email: 'ALICE@example.test'}]};
	assert.equal(utils.usableKey(key, 'alice@example.test', true, true), true);
	assert.equal(utils.usableKey({...key, revoked: true}, 'alice@example.test', true, true), false);
	assert.equal(utils.usableKey({...key, expired: true}, 'alice@example.test', true, true), false);
	assert.equal(utils.usableKey({...key, disabled: true}, 'alice@example.test', true, true), false);
	assert.equal(utils.usableKey({...key, uids: [{email: 'ALICE@example.test', validity: 'r'}]}, 'alice@example.test', true, true), false);
	assert.equal(utils.usableKey({...key, can_encrypt: false}, 'alice@example.test', false, true), false);
	assert.equal(utils.usableKey({...key, secret: false}, 'alice@example.test', true, false), false);
	assert.equal(utils.usableKey(key, 'bob@example.test', true, true), false);
});


test('selecting OpenPGP is silent draft intent with no passphrase or key request', () => {
	const {plugin, fields, context, alerts} = runtime();
	const mail = record(), dialog = {record: mail};
	context.container.getRequest = () => { throw new Error('No key operation should run when selecting protection'); };
	plugin.setProtection(dialog, 'sign', true);
	plugin.setProtection(dialog, 'encrypt', true);
	assert.equal(mail.get('message_class'), 'IPM.Note');
	assert.equal(mail.get('pgp_sign'), true);
	assert.equal(mail.get('pgp_encrypt'), true);
	assert.equal(fields.some(field => /passphrase|password/.test(field.name)), false);
	assert.equal(Object.keys(mail.data).some(name => /passphrase|password/.test(name)), false);
	assert.equal(alerts.length, 0);
	plugin.setProtection(dialog, 'sign', false);
	assert.equal(mail.get('pgp_sign'), false);
	assert.equal(mail.get('pgp_encrypt'), true);
});

test('shared toolbar has exactly Sign and Encrypt for either or both plugins', () => {
	const {plugin, context} = runtime(), manager = context.Zarafa.common.ui.SecurityButtons;
	assert.equal(manager.createButtons().length, 0);
	manager.register(plugin.securityProvider());
	assert.deepEqual(Array.from(manager.createButtons(), button => button.text), ['Sign', 'Encrypt']);
	const smime = new context.Zarafa.plugins.smime.SmimePlugin();
	manager.register(smime.securityProvider());
	assert.deepEqual(Array.from(manager.createButtons(), button => button.text), ['Sign', 'Encrypt']);
	manager.register(plugin.securityProvider());
	assert.equal(manager.providers.length, 2, 're-registration never duplicates a provider');
	manager.providers = [smime.securityProvider()];
	assert.equal(manager.createButtons().length, 2);
});

test('both shared security menus and every provider submenu use the scoped menu layout', () => {
	const {plugin, context} = runtime(), manager = context.Zarafa.common.ui.SecurityButtons;
	const pgp = plugin.securityProvider(), smime = new context.Zarafa.plugins.smime.SmimePlugin().securityProvider();
	for (const providers of [[pgp], [smime], [smime, pgp]]) {
		manager.providers = providers;
		const buttons = manager.createButtons();
		assert.equal(buttons.length, 2);
		for (const config of buttons) {
			assert.equal(config.menu.cls, 'message-security-menu');
			const items = [], mail = record(), button = {...buttonFor(mail, config.securityAction), ...config};
			const menu = {ownerCt: button, removeAll() { items.length = 0; }, add(item) { items.push(item); }};
			config.menu.listeners.beforeshow(menu);
			const submenus = items.filter(item => item.menu);
			assert.equal(submenus.length, providers.length);
			assert.deepEqual(submenus.map(item => item.text), providers.map(provider => provider.label + ' options'));
			for (const item of submenus) {
				assert.equal(item.menu.cls, 'message-security-menu');
				assert.ok(item.menu.items.length > 0);
			}
		}
	}
});

test('key settings retain native section spacing and direct form references', () => {
	const {context} = runtime();
	const widget = new context.Zarafa.plugins.pgp.settings.SettingsPgpWidget();
	assert.deepEqual(widget.cls.split(/\s+/).sort(), ['pgp-settings', 'zarafa-settings-widget']);
	assert.equal(widget.layout, 'form');
	assert.equal(widget.labelWidth, 200);
	assert.deepEqual(Array.from(widget.items.filter(item => item.ref), item => [item.ref, item.xtype]), [
		['keyGrid', 'grid'], ['operationStatus', 'box'], ['defaultKey', 'combo'],
		['defaultSign', 'checkbox'], ['defaultEncrypt', 'checkbox']
	]);
	const grid = widget.items.find(item => item.ref === 'keyGrid');
	assert.equal(grid.store, widget.keyStore);
	assert.equal(grid.selModel.listeners.selectionchange, widget.onSelectionChange);
	assert.equal(grid.selModel.listeners.scope, widget);
});

test('key settings use consistent button styling and a fit-width keyserver action', () => {
	const {context} = runtime();
	const widget = new context.Zarafa.plugins.pgp.settings.SettingsPgpWidget();
	const grid = widget.items.find(item => item.ref === 'keyGrid');
	const top = grid.tbar.filter(item => typeof item === 'object');
	const bottom = grid.bbar.filter(item => typeof item === 'object');
	assert.equal(top.length, 4);
	assert.equal(bottom.length, 5);
	for (const button of [...top, ...bottom]) {
		assert.equal(button.cls, 'pgp-settings-button', button.text);
	}
	assert.equal(top[0].iconCls, 'icon_pgp_key', 'the key icon remains available in the unified button style');
	const manage = widget.items.find(item => item.text === 'Manage keyservers');
	assert.equal(manage.xtype, 'button');
	assert.equal(manage.cls, 'pgp-settings-button pgp-keyservers-button');
	assert.equal(manage.width, undefined, 'translated labels determine the button width');
	assert.equal(manage.anchor, undefined, 'the keyserver button does not stretch across the form');
	assert.equal(manage.handler, widget.manageKeyservers);
	assert.equal(manage.scope, widget);
});

test('key actions stay disabled until a suitable key is selected', () => {
	const {context} = runtime();
	const widget = new context.Zarafa.plugins.pgp.settings.SettingsPgpWidget();
	const grid = widget.items.find(item => item.ref === 'keyGrid');
	const actions = Object.fromEntries(grid.bbar.filter(item => item.itemId).map(item => [item.itemId, {
		...item, setDisabled(value) { this.disabled = value; }
	}]));
	assert.deepEqual(Object.keys(actions), ['verify', 'export', 'private', 'delete']);
	for (const action of Object.values(actions)) { assert.equal(action.disabled, true); }
	let selected = null;
	widget.keyGrid = {rendered: true, getSelectionModel: () => ({getSelected: () => selected}),
		getBottomToolbar: () => ({getComponent: id => actions[id]})};
	widget.onSelectionChange();
	for (const action of Object.values(actions)) { assert.equal(action.disabled, true); }
	selected = record({secret: false});
	widget.onSelectionChange();
	for (const id of ['verify', 'export', 'delete']) { assert.equal(actions[id].disabled, false); }
	assert.equal(actions.private.disabled, true);
	selected = record({secret: true});
	widget.onSelectionChange();
	for (const action of Object.values(actions)) { assert.equal(action.disabled, false); }
	selected = null;
	widget.onSelectionChange();
	for (const action of Object.values(actions)) { assert.equal(action.disabled, true); }
});

test('protocol exclusion covers sign, encrypt and cross-protocol combinations', () => {
	const {plugin, context} = runtime(), manager = context.Zarafa.common.ui.SecurityButtons;
	const smime = new context.Zarafa.plugins.smime.SmimePlugin();
	const pgpProvider = plugin.securityProvider(), smimeProvider = smime.securityProvider();
	manager.register(pgpProvider);
	manager.register(smimeProvider);
	for (const messageClass of ['IPM.Note.deferSMIME', 'IPM.Note.deferSMIME.MultipartSigned', 'IPM.Note.deferSMIME.SignedEncrypt']) {
		const mail = record({message_class: messageClass});
		assert.equal(manager.canSelect(pgpProvider, mail), false);
		manager.setAction(pgpProvider, {record: mail}, 'encrypt', true);
		plugin.setProtection({record: mail}, 'sign', true);
		assert.equal(mail.get('pgp_encrypt'), false);
		assert.equal(mail.get('pgp_sign'), false);
	}
	for (const intent of ['pgp_sign', 'pgp_encrypt']) {
		const mail = record({[intent]: true});
		assert.equal(manager.canSelect(smimeProvider, mail), false);
		assert.equal(manager.canSelect(pgpProvider, mail), true);
	}
});

test('main button follows active protocol and clears only its own action', () => {
	const {plugin, context} = runtime(), manager = context.Zarafa.common.ui.SecurityButtons;
	manager.register(plugin.securityProvider());
	const mail = record({pgp_sign: true, pgp_encrypt: true});
	const button = {...buttonFor(mail, 'sign'), securityAction: 'sign'};
	manager.mainClick(button);
	assert.equal(mail.get('pgp_sign'), false);
	assert.equal(mail.get('pgp_encrypt'), true);
	assert.equal(button.iconCls, 'icon_security_sign');
	manager.mainClick(button);
	assert.equal(mail.get('pgp_sign'), true);
	assert.equal(button.iconCls, 'icon_security_sign_selected');
});

test('menus show disabled alternative protocol and an explanatory tooltip', () => {
	const {plugin, context} = runtime(), manager = context.Zarafa.common.ui.SecurityButtons;
	manager.register(plugin.securityProvider());
	manager.register(new context.Zarafa.plugins.smime.SmimePlugin().securityProvider());
	const mail = record({pgp_encrypt: true}), items = [];
	manager.populateMenu({removeAll() {}, add(item) { items.push(item); }},
		{...buttonFor(mail, 'sign'), securityAction: 'sign'});
	const smime = items.find(item => item.text === 'S/MIME');
	assert.equal(smime.disabled, true);
	assert.match(smime.tooltip, /Turn off OpenPGP/);
	let nativeTooltip;
	smime.getEl = () => ({dom: {setAttribute(name, value) { assert.equal(name, 'title'); nativeTooltip = value; }}});
	smime.listeners.afterrender(smime);
	assert.equal(nativeTooltip, smime.tooltip);
	assert.equal(items.find(item => item.text === 'OpenPGP').disabled, false);
});

test('provider binding happens once per compose and defaults never alter S/MIME drafts', () => {
	const {plugin, context} = runtime(), manager = context.Zarafa.common.ui.SecurityButtons;
	let installs = 0;
	context.Zarafa.plugins.pgp.PgpTransport = {install() { installs++; }};
	manager.register(plugin.securityProvider());
	const mail = record({message_class: 'IPM.Note.deferSMIME'});
	mail.phantom = true;
	context.container.getSettingsModel = () => ({get: () => true});
	const button = {...buttonFor(mail, 'sign'), securityAction: 'sign'};
	manager.attach(button);
	manager.attach(button);
	assert.equal(installs, 1);
	assert.equal(mail.get('pgp_sign'), false);
	assert.equal(mail.get('pgp_encrypt'), false);
});

test('inactive S/MIME send hook does not block OpenPGP, but mixed drafts fail closed', () => {
	const {context} = runtime(), smime = new context.Zarafa.plugins.smime.SmimePlugin();
	assert.equal(smime.onBeforeSendRecord({}, record({pgp_sign: true})), true);
	assert.equal(smime.onBeforeSendRecord({}, record({pgp_sign: true, message_class: 'IPM.Note.deferSMIME'})), false);
});

test('untrusted errors stay plain data until encoded by inline presentation', async () => {
	const {utils, context, alerts} = runtime();
	assert.equal(utils.encode('<img src=x onerror="alert(1)">'), '&lt;img src=x onerror=&quot;alert(1)&quot;&gt;');
	context.container.getRequest = () => ({singleRequest(module, action, data, handler) {
		handler.callback({success: false, message: '<script>bad()</script>'});
	}});
	await assert.rejects(utils.api('list', {}), /<script>bad\(\)<\/script>/);
	assert.equal(alerts.length, 0);
});

test('unlock uses browser-only passphrase with the latest public certificate', async () => {
	const {utils, context} = runtime(), dialogs = context.Zarafa.plugins.pgp.dialogs.PgpDialogs;
	let submit, local, completed = false;
	const requests = [];
	dialogs.form = (title, fields, button, handler) => { submit = handler; };
	context.container.getRequest = () => ({singleRequest(module, action, data, handler) {
		requests.push(data);
		handler.callback({success: true, key: {encrypted_private_key: 'PROTECTED ARMOR', public_key: 'CURRENT PUBLIC'}});
	}});
	utils.crypto = () => ({unlock: async (...args) => { local = args; return {fingerprint}; }});
	dialogs.unlock(fingerprint, () => { completed = true; });
	await new Promise(resolve => submit({passphrase: 'local secret'}, success => { assert.equal(success, true); resolve(); }));
	assert.equal(completed, true);
	assert.deepEqual(local, ['PROTECTED ARMOR', 'local secret', 300, 'CURRENT PUBLIC']);
	assert.equal(requests[0].operation, 'get');
	assert.deepEqual(Object.keys(requests[0]).sort(), ['fingerprint', 'operation']);
});

test('private-key passphrase fields do not request autofill of the website login password', () => {
	const {context} = runtime();
	const field = context.Zarafa.plugins.pgp.dialogs.PgpDialogs.passwordField();
	assert.equal(field.inputType, 'password');
	assert.equal(field.autoCreate.autocomplete, 'new-password');
});

test('only successful key and policy mutations invalidate cached verification', async () => {
	const {utils, context} = runtime();
	let updates = 0, successful = true;
	context.Zarafa.plugins.pgp.PgpTransport = {keysChanged: () => { updates++; }};
	context.container.getRequest = () => ({singleRequest(module, action, data, handler) {
		handler.callback({success: successful});
	}});
	for (const operation of ['list', 'get', 'public', 'prepare', 'lookup']) { await utils.api(operation, {}); }
	assert.equal(updates, 0);
	for (const operation of ['put', 'delete', 'trust', 'keyservers']) { await utils.api(operation, {}); }
	assert.equal(updates, 4);
	successful = false;
	await assert.rejects(utils.api('trust', {}));
	assert.equal(updates, 4);
});

test('persisted key payload excludes passwords and unlocked key objects', async () => {
	const {utils, context} = runtime();
	utils.crypto = () => ({lock() {}});
	let payload;
	context.container.getRequest = () => ({singleRequest(module, action, data, handler) {
		payload = data;
		handler.callback({success: true});
	}});
	await utils.storeKey({fingerprint, public_key: 'PUBLIC', private_key: 'PROTECTED', metadata: {secret: true},
		revision: 'revision', passphrase: 'never send', unlocked: {secret: 'never send'}});
	assert.equal(payload.operation, 'put');
	assert.deepEqual(Object.keys(payload.key).sort(), ['encrypted_private_key', 'fingerprint', 'metadata', 'public_key', 'revision']);
	assert.equal(payload.key.encrypted_private_key, 'PROTECTED');
});

test('generation runs locally and only protected material plus self trust are persisted', async () => {
	const {utils, context} = runtime(), dialogs = context.Zarafa.plugins.pgp.dialogs.PgpDialogs;
	const widget = Object.create(context.Zarafa.plugins.pgp.settings.SettingsPgpWidget.prototype);
	let submit, localOptions, finished;
	const requests = [];
	dialogs.form = (title, fields, button, handler) => { submit = handler; };
	dialogs.passwordField = () => ({});
	widget.complete = promise => { finished = promise; return promise; };
	utils.crypto = () => ({lock() {}, generate: async options => { localOptions = options; return {
		fingerprint, public_key: 'PUBLIC', encrypted_private_key: 'PROTECTED', metadata: {secret: true}
	}; }});
	context.container.getRequest = () => ({singleRequest(module, action, data, handler) {
		requests.push(data);
		handler.callback({success: true});
	}});
	widget.generateKey();
	submit({name: 'Alice', email: 'alice@example.test', passphrase: 'browser-only secret', algorithm: 'rsa3072', expiresDays: '730'}, () => {});
	await finished;
	assert.equal(localOptions.passphrase, 'browser-only secret');
	assert.equal(localOptions.expiresDays, 730);
	assert.deepEqual(requests.map(request => request.operation), ['put', 'trust']);
	assert.equal(JSON.stringify(requests).includes('browser-only secret'), false);
});

test('public key updates merge certification, use revisions, preserve private armor and lock cached keys', async () => {
	const {utils, context} = runtime();
	const operations = [], locks = [];
	utils.crypto = () => ({lock: fp => locks.push(fp), inspect: async (incoming, existing) => {
		assert.equal(incoming, 'NEW PUBLIC');
		assert.equal(existing, 'OLD PUBLIC');
		return {fingerprint, public_key: 'MERGED PUBLIC', encrypted_private_key: '', metadata: {revoked: true}};
	}});
	context.container.getRequest = () => ({singleRequest(module, action, data, handler) {
		operations.push(data);
		if (data.operation === 'list') { handler.callback({success: true, keys: [{fingerprint}]}); }
		else if (data.operation === 'get') { handler.callback({success: true, key: {public_key: 'OLD PUBLIC', revision: 'v1'}}); }
		else { handler.callback({success: true}); }
	}});
	await utils.importKey({fingerprint, public_key: 'NEW PUBLIC'});
	assert.deepEqual(operations.map(item => item.operation), ['list', 'get', 'put']);
	assert.equal(operations[2].key.revision, 'v1');
	assert.equal(operations[2].key.public_key, 'MERGED PUBLIC');
	assert.equal('encrypted_private_key' in operations[2].key, false);
	assert.deepEqual(locks, [fingerprint]);
});

test('reply waits for browser decryption and attachment uploads before opening compose', async () => {
	const {context} = runtime(), mail = record({pgp: {pending: true, encrypted: true}}), events = [];
	let releaseAttachments;
	const response = {browserAttachmentsReady: new Promise(resolve => { releaseAttachments = resolve; })};
	context.Zarafa.core.data.UIFactory = {openCreateRecord: result => { assert.equal(result, response); events.push('compose'); }};
	context.Zarafa.plugins.pgp.PgpTransport = {
		open: async () => { events.push('open'); mail.set('pgp', {encrypted: true, locked: true}); return mail; },
		unlockAndOpen: async () => { events.push('unlock'); mail.set('pgp', {encrypted: true, decrypted: true}); return mail; }
	};
	const ready = context.Zarafa.mail.Actions.openReadyMailResponse(mail, {createResponseRecord() { events.push('quote'); return response; }}, 'reply');
	await new Promise(resolve => setImmediate(resolve));
	assert.deepEqual(events, ['open', 'unlock', 'quote']);
	releaseAttachments();
	await ready;
	assert.deepEqual(events, ['open', 'unlock', 'quote', 'compose']);
	assert.equal(mail.browserResponsePending, false);
});

test('reply to a tampered encrypted message fails closed with an encoded error', async () => {
	const {context} = runtime(), mail = record({pgp: {encrypted: true}}), notices = [];
	context.container.getNotifier = () => ({notify: (...args) => notices.push(args)});
	context.Zarafa.plugins.pgp.PgpTransport = {open: async () => { throw new Error('<img src=x onerror=bad()>'); }};
	await context.Zarafa.mail.Actions.openReadyMailResponse(mail, {createResponseRecord() { assert.fail('Must not quote failed plaintext'); }}, 'forward');
	assert.match(notices[0][2], /&lt;img/);
	assert.equal(mail.browserResponsePending, false);
});

test('reply rejects signed-only decoding errors but allows a rendered invalid signature', async () => {
	const {context} = runtime(), notices = [];
	context.container.getNotifier = () => ({notify: (...args) => notices.push(args)});
	context.Zarafa.plugins.pgp.PgpTransport = {open: async mail => mail};
	const failed = record({pgp: {signed: true, error: true, pending: false}});
	await context.Zarafa.mail.Actions.openReadyMailResponse(failed, {createResponseRecord() { assert.fail('Must not quote undecoded signed body'); }}, 'reply');
	assert.equal(notices.length, 1);
	let quoted = false;
	context.Zarafa.core.data.UIFactory = {openCreateRecord() { quoted = true; }};
	const rendered = record({pgp: {signed: true, error: false, signature: 'bad'}});
	await context.Zarafa.mail.Actions.openReadyMailResponse(rendered, {createResponseRecord() { return {}; }}, 'reply');
	assert.equal(quoted, true);
});

test('decrypted response attachment selection keeps inline replies and full forwards', async () => {
	const {context} = runtime();
	const model = Object.create(context.Zarafa.mail.MailContextModel.prototype), copied = [];
	const attachments = [record({name: 'photo.png', cid: 'inline'}), record({name: 'document.pdf'}), record({name: 'opaque.mime'})];
	attachments[0].localContent = {blob: {}};
	attachments[1].localContent = {blob: {}};
	const source = {getAttachmentStore: () => ({each: fn => attachments.forEach(fn)})};
	const response = record({isHTML: true});
	response.getAttachmentStore = () => ({getCount: () => copied.length});
	response.getMessageActions = () => ({browser_decrypted: true});
	model.uploadLocalResponseAttachment = async (target, attachment) => { copied.push(attachment.get('name')); };
	model.initRecordAttachments(response, source, 'reply');
	await response.browserAttachmentsReady;
	assert.deepEqual(copied, ['photo.png']);
	copied.length = 0;
	model.initRecordAttachments(response, source, 'forward');
	await response.browserAttachmentsReady;
	assert.deepEqual(copied, ['photo.png', 'document.pdf']);
});

test('decrypted attachment uploads preserve bytes and CID without a source message reference', async () => {
	const {context} = runtime(), listeners = {}, bytes = new Uint8Array([0, 255, 128, 10]), uploaded = record();
	uploaded.setInline = value => { uploaded.inline = value; };
	const win = {File: class { constructor(parts, name, options) { this.parts = parts; this.name = name; this.type = options.type; } },
		DataTransfer: class { constructor() { this.files = []; this.items = {add: file => this.files.push(file)}; } }, setTimeout, clearTimeout};
	context.Zarafa.core.BrowserWindowMgr = {getActive: () => win};
	const store = {canUploadFiles: () => true, on: (event, fn) => { listeners[event] = fn; }, un: event => { delete listeners[event]; },
		uploadFiles(files, form, hidden) {
			assert.equal(files[0].parts[0], bytes);
			assert.equal(files[0].name, 'binary.png');
			assert.equal(hidden, true);
			listeners.add(store, [uploaded]);
			listeners.write(store, 'create', {}, {}, [uploaded]);
		}};
	const response = record({html_body: '<img src="data:image/png;base64,AA==">'});
	response.getAttachmentStore = () => store;
	const source = record({name: 'binary.png', cid: 'image@example.test', filetype: 'image/png', hidden: true});
	source.localContent = {blob: bytes, inlineUrl: 'data:image/png;base64,AA=='};
	const model = Object.create(context.Zarafa.mail.MailContextModel.prototype);
	await model.uploadLocalResponseAttachment(response, source);
	assert.equal(uploaded.get('cid'), 'image@example.test');
	assert.equal(uploaded.inline, true);
	assert.equal(response.get('html_body'), '<img src="cid:image@example.test">');
	assert.equal(Object.keys(listeners).length, 0);
});
