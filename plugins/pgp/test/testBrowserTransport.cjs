'use strict';
/* Real browser crypto with deterministic Ext/store lifecycle stand-ins. */
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const path = require('node:path');
const {webcrypto} = require('node:crypto');
const BrowserCrypto = require('../js/crypto/BrowserCrypto.js');
const Mime = require('../js/crypto/PgpMime.js');
const PostalMime = require('postal-mime');
const fflate = require('fflate');
if (!globalThis.crypto) { globalThis.crypto = webcrypto; }
let assertions = 0;
function check(value, message) { assert.ok(value, message); assertions++; }
function equal(actual, expected, message) { assert.deepEqual(actual, expected, message); assertions++; }
async function rejects(operation, message) { await assert.rejects(operation, undefined, message); assertions++; }
const pause = ms => new Promise(resolve => setTimeout(resolve, ms));
const password = 'browser-transport-test-password';

class Events {
	constructor() { this.handlers = new Map(); this.modified = []; this.removed = []; this.records = []; }
	on(name, handler) { if (!this.handlers.has(name)) { this.handlers.set(name, new Set()); } this.handlers.get(name).add(handler); }
	un(name, handler) { this.handlers.get(name)?.delete(handler); }
	fireEvent(name, ...args) { for (const handler of Array.from(this.handlers.get(name) || [])) { handler(...args); } }
	loadRecords(result) { this.records = result.records; }
	listeners() { return Array.from(this.handlers.values()).reduce((sum, listeners) => sum + listeners.size, 0); }
}
class Record {
	constructor(data = {}) { this.data = data; this.actions = {}; this.modified = {}; this.store = new Events(); this.attachments = new Events(); }
	get(name) { return this.data[name]; }
	set(name, value, forced) { if (forced || this.data[name] !== value) { this.modified[name] = this.data[name]; } this.data[name] = value; }
	deleteMessageAction(name) { delete this.actions[name]; }
	addMessageAction(name, value) { this.actions[name] = value; }
	applyData(source) { Object.assign(this.data, source.data); }
	getStore() { return this.store; }
	getAttachmentStore() { return this.attachments; }
	clearSanitizedHtmlBody() { this.sanitizedCleared = true; }
	isUnsent() { return this.data.unsent === true; }
}
function dialogFor(record, modal = false) {
	const dialog = new Events();
	Object.assign(dialog, {record, closeOnSave: true, sendingText: {msg: 'Sending'}, isSending: true, locks: 0,
		forceSendAsIdentityTransmission() { this.identityForced = true; },
		lockPendingAction() { this.locks++; },
		saveRecord() {
			const saved = this.modalRecord || record;
			// Like RecordContentPanel.saveRecord: nothing happens for an unmodified record.
			if (!saved.phantom && saved.store.modified.indexOf(saved) < 0) { return undefined; }
			check(!record.actions.send && !record.actions.pgp && this.isSending === false, 'Snapshot is a draft save without send/protected actions');
			setTimeout(() => {
				record.data.entryid = 'aa';
				record.modified = {};
				saved.store.fireEvent('write', saved.store, 'update', {}, {}, [new Record()]);
				saved.store.fireEvent('write', saved.store, 'update', {}, {}, [saved]);
				// Simulate a normal store write listener running AFTER the plugin.
				record.actions = {};
				this.isSending = false;
			}, 0);
			return true;
		}});
	if (modal) { dialog.modalRecord = new Record({...record.data}); dialog.modalRecord.store.modified.push(dialog.modalRecord); }
	return dialog;
}

async function main() {
	const crypto = new BrowserCrypto();
	const own = await crypto.generate({name: 'Browser Transport QA', email: 'qa@example.test', passphrase: password, algorithm: 'curve25519'});
	const peer = await crypto.generate({name: 'Browser Transport Peer', email: 'peer@example.test', passphrase: password, algorithm: 'curve25519'});
	const source = BrowserCrypto.utf8('Content-Type: multipart/mixed; boundary=inner\r\n\r\n--inner\r\nContent-Type: text/plain; charset=utf-8\r\n\r\nTransport body 日本語\r\n--inner\r\nContent-Type: application/octet-stream\r\nContent-Disposition: attachment; filename="binary.bin"\r\nContent-Transfer-Encoding: base64\r\n\r\nAP+AQQ0K\r\n--inner--\r\n');
	let prepared, apiOverride, unlockCount = 0, blockCount = 0;
	const calls = [], notifications = [], revokedUrls = [], urls = [];
	const utils = {
		crypto: () => crypto,
		isSmime: record => /SMIME/.test(record.get('message_class') || ''),
		keyEmails: key => (key.uids || []).filter(uid => uid.validity === 'u' && !uid.revoked && !uid.expired).map(uid => uid.email),
		usableKey: (key, email, sign, encrypt) => key.secret && !key.revoked && !key.expired && !key.disabled && (!sign || key.can_sign) && (!encrypt || key.can_encrypt) && key.uids.some(uid => uid.email === email),
		notify: message => notifications.push(message),
		api: async (operation, data) => {
			calls.push({operation, data});
			if (apiOverride) { const value = await apiOverride(operation, data); if (value !== undefined) { return value; } }
			if (operation === 'list') { return {keys: [own.metadata], default_key: own.fingerprint}; }
			if (operation === 'prepare') { return prepared; }
			if (operation === 'public') { return {keys: [{fingerprint: own.fingerprint, public_key: own.public_key, trusted_emails: ['qa@example.test']}]}; }
			throw new Error('Unexpected transport request ' + operation);
		}
	};
	const context = vm.createContext({
		Uint8Array, ArrayBuffer, WeakMap, Map, Promise, Set, Blob, setTimeout, clearTimeout, console,
		_: value => value, PostalMime, fflate,
		URL: {createObjectURL: () => { const url = 'blob:qa-' + urls.length; urls.push(url); return url; }, revokeObjectURL: url => revokedUrls.push(url)},
		DOMPurify: {sanitize: html => html.replace(/<script[\s\S]*?<\/script>/gi, '')},
		Ext: {namespace() {}, apply: (target, source) => Object.assign(target, source), isFunction: value => typeof value === 'function', data: {Record: {COMMIT: 'commit'}}},
		container: {getUser: () => ({getSMTPAddress: () => 'qa@example.test'})},
		Zarafa: {plugins: {pgp: {PgpUtils: utils, crypto: {BrowserCrypto, PgpMime: Mime}, dialogs: {PgpDialogs: {
			chooseKeyAsync: async keys => { if (!keys.length) { throw new Error('No key'); } return keys[0]; },
			unlockAsync: async () => { unlockCount++; await crypto.unlock(own.encrypted_private_key, password, undefined, own.public_key); }
		}}}}, core: {HTMLParser: {blockExternalContent: html => { blockCount++; return html; }},
			mapi: {ObjectType: {MAPI_ATTACH: 7}, AttachMethod: {ATTACH_BY_VALUE: 1}},
			data: {RecordFactory: {createRecordObjectByCustomType: (type, data) => new Record(data)}}}}
	});
	vm.runInContext(fs.readFileSync(require.resolve('../js/PgpTransport.js'), 'utf8'), context);
	const transport = context.Zarafa.plugins.pgp.PgpTransport;
	function setup(sign = true, encrypt = false, modal = false) {
		const record = new Record({store_entryid: 'bb', message_class: 'IPM.Note', pgp_key: own.fingerprint,
			pgp_sign: sign, pgp_encrypt: encrypt, sent_representing_smtp_address: 'qa@example.test'});
		prepared = {token: 'a'.repeat(48), sign, encrypt, sender: 'qa@example.test', key: own, mime: BrowserCrypto.toBase64(source),
			recipients: [own, peer].map(key => ({email: key.metadata.uids[0].email, fingerprint: key.fingerprint, public_key: key.public_key}))};
		record.store.modified.push(record);
		return {record, dialog: dialogFor(record, modal)};
	}
	{
		// Autosaved, reopened or retried drafts have no pending modifications.
		const {record, dialog} = setup(true, false);
		record.store.modified.length = 0;
		record.data.entryid = 'aa';
		let saveCalls = 0;
		dialog.saveRecord = () => { saveCalls++; return undefined; };
		await transport._protect(dialog, record);
		check(saveCalls === 0 && record.actions.pgp && dialog.isSending && dialog.locks === 1 && dialog.closeOnSave, 'Committed draft skips the snapshot save and still prepares the stored copy');
		equal(record.store.listeners(), 0, 'Committed-draft path leaves no store listeners');
	}
	for (const modal of [false, true]) {
		const {record, dialog} = setup(true, false, modal);
		record.actions = {send: true, pgp: {stale: true}};
		await transport._protect(dialog, record);
		check(dialog.closeOnSave && dialog.isSending && dialog.locks === 1, 'Snapshot restores close-on-save and relocks send after complete write dispatch');
		check(dialog.identityForced && record.actions.pgp && !record.actions.send, 'Receipt installed only after draft action cleanup');
		equal(Object.keys(record.modified).sort(), ['pgp_encrypt', 'pgp_key', 'pgp_sign'], 'Final request retransmits only protection intent, not body/subject');
		const parsed = Mime.parse(BrowserCrypto.fromBase64(record.actions.pgp.envelope));
		equal(parsed.entity, source, 'Send lifecycle signs exact saved snapshot bytes');
		check((await crypto.verify(parsed.entity, parsed.signature, [own.public_key])).valid, 'Send lifecycle actual detached signature valid');
		equal((dialog.modalRecord || record).store.listeners(), 0, 'Snapshot store listeners removed after completion');
	}
	for (const [sign, encrypt] of [[false, true], [true, true]]) {
		const {record, dialog} = setup(sign, encrypt);
		await transport._protect(dialog, record);
		const parsed = Mime.parse(BrowserCrypto.fromBase64(record.actions.pgp.envelope));
		const decrypted = await crypto.decrypt(parsed.ciphertext, [own.public_key]);
		equal(decrypted.data, source, 'Combined-sign/encryption lifecycle preserves binary MIME');
		equal(decrypted.valid, sign, 'Combined encrypted signature follows requested mode');
	}
	check(unlockCount === 1, 'Only browser-local private key unlock required');
	check(!JSON.stringify(calls).includes(password), 'Transport never transmits private-key passphrase');
	for (const mutation of [
		() => { prepared.sender = 'wrong@example.test'; },
		() => { prepared.key = {...own, public_key: peer.public_key}; },
		() => { prepared.key = {...own, encrypted_private_key: peer.encrypted_private_key}; },
		() => { prepared.recipients[0].fingerprint = peer.fingerprint; },
		() => { prepared.recipients[0].email = 'wrong@example.test'; }
	]) {
		const {record, dialog} = setup(true, true); mutation();
		await rejects(() => transport._protect(dialog, record), 'Untrusted prepared metadata/material mismatch aborts send');
		check(!record.actions.pgp, 'Invalid prepared data cannot leave a send receipt');
	}
	{
		const {record, dialog} = setup(); dialog.saveRecord = () => false;
		await rejects(() => transport._saveSnapshot(dialog, record), 'Synchronous draft failure aborts snapshot');
		check(dialog.closeOnSave && record.store.listeners() === 0, 'Failed draft restores dialog and removes listeners');
	}
	{
		const {record, dialog} = setup(); dialog.saveRecord = () => { setTimeout(() => dialog.fireEvent('destroy'), 0); return true; };
		await rejects(() => transport._saveSnapshot(dialog, record), 'Destroyed compose dialog aborts snapshot');
		equal(record.store.listeners(), 0, 'Destroy removes pending snapshot listeners');
	}
	{
		const {record, dialog} = setup(); apiOverride = async operation => { if (operation === 'prepare') { record.data.pgp_encrypt = true; } };
		await rejects(() => transport._protect(dialog, record), 'Changed protection selection while preparing aborts send');
		apiOverride = undefined;
	}

	function readRecord(envelope, encrypted, signed) {
		return new Record({body: '', html_body: '', pgp: {mime: BrowserCrypto.toBase64(envelope), format: 'mime',
			pending: true, encrypted, signed, sender: 'qa@example.test', decrypted: false, locked: encrypted}});
	}
	const signature = await crypto.sign(source, own.fingerprint);
	const signed = Mime.signed(source, signature.signature, signature.micalg);
	const encrypted = Mime.encrypted(await crypto.encrypt(signed, [own.public_key]));
	const record = readRecord(encrypted, true, false);
	await transport.open(record);
	check(record.data.body.includes('日本語') && record.data.pgp.decrypted, 'Browser opens authenticated encrypted MIME body');
	check(record.data.pgp.signature_valid && record.data.pgp.sender_match && record.data.pgp.signer_trusted, 'Nested detached signature status accumulates');
	check(record.attachments.localOnly && record.attachments.records.length === 1, 'Decrypted attachments are local-only records');
	const attachment = record.attachments.records[0], attachmentBytes = attachment.localContent.bytes;
	equal(attachmentBytes, Uint8Array.from([0, 255, 128, 65, 13, 10]), 'Local decrypted attachment bytes exact');
	equal(Object.keys(record.modified), [], 'Opening plaintext does not dirty persisted message properties');
	const cidSource = BrowserCrypto.utf8('Content-Type: multipart/related; boundary=rel\r\n\r\n--rel\r\nContent-Type: text/html; charset=utf-8\r\n\r\n<p>Logo</p><img src="cid:logo@qa">\r\n--rel\r\nContent-Type: image/png\r\nContent-ID: <logo@qa>\r\nContent-Disposition: inline; filename="logo.png"\r\nContent-Transfer-Encoding: base64\r\n\r\nAA==\r\n--rel\r\nContent-Type: application/pdf\r\nContent-ID: <report@qa>\r\nContent-Disposition: inline; filename="report.pdf"\r\nContent-Transfer-Encoding: base64\r\n\r\nAA==\r\n--rel--\r\n');
	const cidRecord = readRecord(Mime.encrypted(await crypto.encrypt(cidSource, [own.public_key])), true, false);
	await transport.open(cidRecord);
	const byCid = Object.fromEntries(cidRecord.attachments.records.map(item => [item.get('cid'), item]));
	check(byCid['logo@qa'] && byCid['logo@qa'].get('hidden') === true && byCid['report@qa'] && byCid['report@qa'].get('hidden') === false, 'Only a body-referenced Content-ID makes a decrypted file inline');
	crypto.lock();
	check(!record.data.body && !record.data.html_body && record.data.pgp.locked && record.attachments.records.length === 0, 'Lock removes displayed plaintext and attachment rows');
	check(attachment.localContent.blob === null && attachment.localContent.url === '' && attachmentBytes.every(byte => byte === 0), 'Lock destroys attachment object references and byte buffers');
	check(revokedUrls.length > 0, 'Lock revokes decrypted object URLs');
	const locked = readRecord(encrypted, true, false);
	await transport.open(locked);
	check(!locked.data.body && locked.data.pgp.pending, 'Locked ciphertext is never rendered');
	await crypto.unlock(own.encrypted_private_key, password, undefined, own.public_key);
	let release;
	apiOverride = operation => operation === 'public' ? new Promise(resolve => { release = () => resolve({keys: [{...own.metadata, public_key: own.public_key}]}); }) : undefined;
	const pendingRecord = readRecord(encrypted, true, false), pending = transport.open(pendingRecord);
	crypto.lock(); release();
	await rejects(() => pending, 'Lock during pending open cancels plaintext release');
	check(!pendingRecord.data.body && pendingRecord.data.pgp.error, 'Cancelled open contains no decrypted preview');
	apiOverride = undefined;
	const wrongSignature = Mime.signed(BrowserCrypto.utf8('Content-Type: text/plain\r\n\r\nModified data'), signature.signature, signature.micalg);
	const invalid = readRecord(wrongSignature, false, true);
	await transport.open(invalid);
	check(!invalid.data.pgp.signature_valid && !invalid.data.pgp.signer_trusted, 'Invalid signature never becomes trusted sender');
	await crypto.unlock(own.encrypted_private_key, password, undefined, own.public_key);
	const encryptedInner = Mime.encrypted(await crypto.encrypt(source, [own.public_key]));
	const outerSignature = await crypto.sign(encryptedInner, own.fingerprint);
	const signedOuter = readRecord(Mime.signed(encryptedInner, outerSignature.signature, outerSignature.micalg), false, true);
	await transport.open(signedOuter);
	check(signedOuter.data.body && signedOuter.data.pgp.encrypted, 'Signed outer envelope detects encrypted inner content');
	crypto.lock();
	check(!signedOuter.data.body && signedOuter.data.pgp.locked && !signedOuter.attachments.records.length, 'Nested encryption plaintext is erased even when outer envelope only signed');
	await crypto.unlock(own.encrypted_private_key, password, undefined, own.public_key);
	const newerSource = BrowserCrypto.utf8('Content-Type: text/plain\r\n\r\nNewest message revision');
	const newerSignature = await crypto.sign(newerSource, own.fingerprint);
	const newerEnvelope = Mime.signed(newerSource, newerSignature.signature, newerSignature.micalg);
	const releases = [];
	apiOverride = operation => operation === 'public' ? new Promise(resolve => releases.push(() => resolve({keys: [{...own.metadata, public_key: own.public_key}]}))) : undefined;
	const revisionRecord = readRecord(signed, false, true), oldOpen = transport.open(revisionRecord);
	revisionRecord.data.pgp = readRecord(newerEnvelope, false, true).data.pgp;
	const newOpen = transport.open(revisionRecord);
	releases[1](); await newOpen;
	check(revisionRecord.data.body.includes('Newest message revision'), 'Newer message revision is decoded');
	releases[0](); await Promise.allSettled([oldOpen]);
	check(revisionRecord.data.body.includes('Newest message revision'), 'Stale open completion cannot overwrite or clear newer plaintext');
	apiOverride = undefined;
	const badCipher = readRecord(Mime.encrypted('-----BEGIN PGP MESSAGE-----\n\nbad\n-----END PGP MESSAGE-----'), true, false);
	await rejects(() => transport.open(badCipher), 'Invalid ciphertext fails closed');
	check(!badCipher.data.body && !badCipher.attachments.records.length && badCipher.data.pgp.error, 'Failed decryption clears message content');
	const mixed = readRecord(Mime.encrypted(await crypto.encrypt(BrowserCrypto.utf8('Content-Type: application/pkcs7-mime\r\n\r\nS/MIME bytes'), [own.public_key])), true, false);
	await rejects(() => transport.open(mixed), 'Nested S/MIME/OpenPGP read rejected');
	await testCore(context);
	crypto.destroy();
	console.log(`OK: ${assertions} browser transport lifecycle assertions`);
}

async function testCore(context) {
	Object.assign(context.Ext, {extend: (base, definition) => definition,
		each: (values, fn, scope) => values.forEach(value => fn.call(scope, value)),
		isDefined: value => value !== undefined, isEmpty: value => value == null || value === '' || Array.isArray(value) && !value.length});
	context.Ext.data.Store = {prototype: {handleException() {}}};
	context.Zarafa.core.mapi.Access = {ACCESS_READ: 1};
	context.Zarafa.core.mapi.MessageFlags = {MSGFLAG_UNSENT: 8, MSGFLAG_READ: 1};
	context.Zarafa.core.data.RecordFactory = new Proxy(context.Zarafa.core.data.RecordFactory, {get: (object, name) => object[name] || (() => {})});
	for (const filename of ['JsonWriter.js', 'JsonAttachmentWriter.js', 'IPMRecord.js', 'IPMAttachmentRecord.js', 'IPMAttachmentStore.js']) {
		vm.runInContext(fs.readFileSync(path.resolve(__dirname, '../../../client/zarafa/core/data', filename), 'utf8'), context, {filename});
	}
	const writer = Object.assign({}, context.Zarafa.core.data.JsonWriter, {toHash: record => ({...record.data})});
	function serialRecord(protectedView, unsent) {
		const record = new Record({entryid: 'aa', unsent, body: 'decrypted text', html_body: '<p>decrypted</p>', isHTML: true,
			hasattach: true, pgp: protectedView ? {mime: 'opaque-envelope'} : undefined, message_flags: 1, categories: ['local flag']});
		record.getIdProps = () => ['entryid']; record.getMessageActions = () => ({mark_read: true});
		record.subStores = {attachments: {writer: {toPropHash: () => ({attachments: {add: [{name: 'secret.txt'}]}})}}};
		record.supportsSubStore = () => true;
		return record;
	}
	const protectedHash = writer.toPropHash(serialRecord(true, false));
	check(!protectedHash.props.body && !protectedHash.props.html_body && !protectedHash.props.pgp && !protectedHash.attachments, 'Core writer strips protected read plaintext/status and attachment mutations');
	equal(protectedHash.props.message_flags, 1, 'Core writer retains ordinary mark-read properties');
	check(protectedHash.message_action.mark_read, 'Core writer retains mark-read action');
	check(writer.toPropHash(serialRecord(false, false)).props.body === 'decrypted text', 'Ordinary unprotected write remains unchanged');
	check(writer.toPropHash(serialRecord(true, true)).props.body === 'decrypted text', 'Explicit unsent drafts remain editable rather than silently dropping body');
	const uploaded = {data: {attach_num: -1, tmpname: 'cache-picture', cid: 'picture'}, isInline: () => true};
	const removed = {data: {attach_num: 7, cid: 'removed-picture'}, isInline: () => true};
	const ordinary = {data: {attach_num: -1, tmpname: 'cache-binary'}, isInline: () => false};
	const uploadStore = {getId: () => 'upload-dialog', getModifiedRecords: () => [uploaded, ordinary], getRemovedRecords: () => [removed, ordinary]};
	const attachmentHash = context.Zarafa.core.data.JsonAttachmentWriter.toPropHash({getAttachmentStore: () => uploadStore}).attachments;
	equal(attachmentHash.dialog_attachments, 'upload-dialog', 'Core attachment writer retains upload dialog identity');
	check(attachmentHash.add.length === 1 && attachmentHash.add[0].inline === true && attachmentHash.add[0].tmpname === 'cache-picture', 'Pending inline upload explicitly serializes inline flag and cache filename');
	check(attachmentHash.remove.length === 1 && attachmentHash.remove[0].inline === true && attachmentHash.remove[0].attach_num === 7, 'Saved inline removal explicitly serializes inline flag and MAPI number');
	check(!Object.hasOwn(uploaded.data, 'inline') && !Object.hasOwn(removed.data, 'inline'), 'Inline serialization does not mutate attachment record data');
	check(attachmentHash.add[0] !== uploaded.data && attachmentHash.remove[0] !== removed.data, 'Inline serialized properties are independent copied objects');
	const attach = new Record({cid: 'picture', attach_num: -1});
	attach.localContent = {url: 'blob:local-binary', inlineUrl: 'data:image/png;base64,AA==', blob: {}, zip: () => 'blob:local-zip'};
	const attachStore = Object.assign({}, context.Zarafa.core.data.IPMAttachmentStore, {localOnly: true, getRange: () => [attach],
		getAttachmentBaseUrl() { throw new Error('Local attachments must not request a server URL'); }});
	equal(attachStore.getDownloadAttachmentUrl(attach), 'blob:local-binary', 'Local attachment download uses browser Blob URL');
	equal(attachStore.getSelectionZipUrl([attach]), 'blob:local-zip', 'Selected local attachments use browser ZIP');
	equal(attachStore.getSelectionZipUrl([attach, new Record()]), '', 'Mixed local/server selection cannot request a partial ZIP');
	equal(attachStore.getInlineImageUrl(attach), attach.localContent.inlineUrl, 'Local inline images resolve without server fetch');
	attach.getInlineImageUrl = () => attachStore.getInlineImageUrl(attach);
	const message = new Record(); message.getAttachmentStore = () => attachStore; message.getMessageAction = () => undefined;
	const inline = context.Zarafa.core.data.IPMRecord.inlineImgOutlookToZarafa;
	equal(inline.call(message, '<img src="cid:picture"><img src="cid:missing">'), '<img src="data:image/png;base64,AA=="><img src="">', 'Core CID replacement uses only exact local attachments and suppresses missing CID');
	attachStore.getRange = () => [attach, attach];
	equal(inline.call(message, '<img src="cid:picture">'), '<img src="">', 'Ambiguous duplicate CID is not rendered');
	const advisory = new Record({pgp: {advisory: true, unverifiable: true, mime: ''}, entryid: 'e1', store_entryid: 's1'});
	advisory.getAttachmentStore = () => ({getRange() { throw new Error('Advisory records must use the server inline-image path'); }});
	advisory.getMessageAction = () => undefined;
	context.Zarafa.core.HTMLParser.inlineImgOutlookToZarafa = (body, store, entryid) => body.replace('cid:', 'server:' + store + ':' + entryid + ':');
	equal(inline.call(advisory, '<img src="cid:picture">'), '<img src="server:s1:e1:picture">', 'Advisory OpenPGP records keep the server inline-image path');
	equal(context.Zarafa.core.data.IPMAttachmentRecord.canBeImported.call(attach), false, 'Local decrypted attachment cannot trigger server-side import');
	equal(context.Zarafa.core.data.IPMAttachmentRecord.isUploaded.call(attach), true, 'Usable browser attachment recognized without upload');
	attach.localContent.blob = null;
	equal(context.Zarafa.core.data.IPMAttachmentRecord.isUploaded.call(attach), false, 'Locked browser attachment no longer usable');
	context.Zarafa.mail = {};
	const uploadWindow = {setTimeout, clearTimeout, File: class {constructor(parts, name, options) { this.parts = parts; this.name = name; this.type = options.type; }},
		DataTransfer: class {constructor() { this.files = []; this.items = {add: file => this.files.push(file)}; }}};
	context.Zarafa.core.BrowserWindowMgr = {getActive: () => uploadWindow};
	context.Ext.util = {Format: {htmlEncode: value => value.replace(/&/g, '&amp;').replace(/"/g, '&quot;')}};
	vm.runInContext(fs.readFileSync(path.resolve(__dirname, '../../../client/zarafa/mail/MailContextModel.js'), 'utf8'), context, {filename: 'MailContextModel.js'});
	const responseRecord = new Record({html_body: '<img src="blob:source"><img src="data:image/png;base64,AA==">'});
	const uploadEvents = responseRecord.attachments;
	const uploadRecord = new Record({attach_num: -1, tmpname: 'response-cache'});
	uploadRecord.setInline = context.Zarafa.core.data.IPMAttachmentRecord.setInline;
	uploadRecord.isInline = context.Zarafa.core.data.IPMAttachmentRecord.isInline;
	let uploadedFile;
	uploadEvents.canUploadFiles = () => true;
	uploadEvents.uploadFiles = files => {
		uploadedFile = files[0];
		uploadEvents.fireEvent('add', uploadEvents, [uploadRecord]);
		uploadEvents.fireEvent('write', uploadEvents, 'create', {}, {}, [new Record()]);
		uploadEvents.fireEvent('write', uploadEvents, 'create', {}, {}, [uploadRecord]);
	};
	const sourceAttachment = new Record({name: 'inline.png', cid: 'response-cid', hidden: true, filetype: 'image/png'});
	sourceAttachment.localContent = {blob: new Blob([Uint8Array.of(0, 255, 65)]), url: 'blob:source', inlineUrl: 'data:image/png;base64,AA=='};
	const uploadResponse = context.Zarafa.mail.MailContextModel.uploadLocalResponseAttachment;
	equal(await uploadResponse.call({}, responseRecord, sourceAttachment, true), uploadRecord, 'Reply/forward local upload correlates the exact completed record');
	check(uploadRecord.isInline() && uploadRecord.get('cid') === 'response-cid' && uploadRecord.get('hidden'), 'Reply/forward helper restores inline state and CID after upload');
	equal(responseRecord.get('html_body'), '<img src="cid:response-cid"><img src="cid:response-cid">', 'Reply/forward HTML replaces only local attachment URLs with original CID');
	check(uploadedFile.name === 'inline.png' && uploadedFile.parts[0] === sourceAttachment.localContent.blob, 'Reply/forward upload uses local attachment bytes rather than server source IDs');
	equal(uploadEvents.listeners(), 0, 'Local upload listeners removed after successful completion');
	sourceAttachment.localContent.blob = null;
	await rejects(() => uploadResponse.call({}, responseRecord, sourceAttachment), 'Locked attachment cannot be reuploaded for a reply or forward');
	testProtectedMessageRendering(context);
}

function testProtectedMessageRendering(context) {
	context.Zarafa.common = {ui: {messagepanel: {}}};
	context.Zarafa.core.KeyMapMgr = {deactivate() {}, activate() {}};
	Object.assign(context.Ext, {reg() {}, isFunction: value => typeof value === 'function',
		Element: class {constructor(document) { this.dom = document; }}, defer: callback => callback(), EventManager: {on() {}}});
	context.container.getServerConfig = () => ({getDOMPurifyEnabled: () => true});
	vm.runInContext(fs.readFileSync(path.resolve(__dirname, '../../../client/zarafa/common/ui/messagepanel/MessageBody.js'), 'utf8'), context, {filename: 'MessageBody.js'});
	const renderedBody = {innerHTML: '', querySelectorAll: () => []};
	const iframeDocument = {body: renderedBody, getElementsByTagName: tag => tag === 'body' ? [renderedBody] : []};
	const component = Object.assign({}, context.Zarafa.common.ui.messagepanel.MessageBody, {
		getEl: () => ({dom: {contentWindow: {document: iframeDocument}}}),
		plaintextTemplate: {applyTemplate: data => '<pre>' + data.body + '</pre>'},
		addCSSText() {}, setImageClickHandler() {}, deferLinkification() {}, recordComponentUpdaterPlugin: {}});
	const record = new Record({entryid: 'protected-render-record', pgp: {encrypted: true}, isHTML: true,
		html_body: '<p>Previously decrypted secret</p>', body: 'Previously decrypted secret'});
	record.isOpened = () => true;
	record.getBody = html => record.get(html ? 'html_body' : 'body');
	record.cleanupOutlookStyles = html => html;
	component.update(record);
	check(renderedBody.innerHTML.includes('Previously decrypted secret') && component.currentRenderInfo.renderedHtml, 'Actual message renderer initially displays the opened decrypted HTML');
	Object.assign(record.data, {pgp: {encrypted: true, locked: true}, isHTML: false, html_body: '', body: ''});
	component.update(record);
	equal(renderedBody.innerHTML, '', 'Actual message renderer clears prior HTML immediately when the same protected record locks');
	check(!component.currentRenderInfo.renderedHtml, 'Lock clears renderer HTML state as well as visible DOM');
	Object.assign(record.data, {pgp: {encrypted: true}, isHTML: true, html_body: '<p>New decrypted secret</p>'});
	component.update(record);
	record.isOpened = () => false;
	component.update(record);
	equal(renderedBody.innerHTML, '', 'Protected same-entry refresh clears prior HTML while the message is not opened');
	record.isOpened = () => true;
	component.update(record);
	Object.assign(record.data, {pgp: {encrypted: true, error: 'Verification failed'}, isHTML: false, html_body: '', body: ''});
	component.update(record);
	equal(renderedBody.innerHTML, '', 'Actual message renderer clears prior protected HTML after verification or decryption failure');
	Object.assign(record.data, {pgp: {encrypted: true}, body: 'New plaintext protected view'});
	component.update(record);
	equal(renderedBody.innerHTML, '<pre>New plaintext protected view</pre>', 'Protected HTML-to-text transition renders the new authenticated body');
	Object.assign(record.data, {entryid: 'normal-render-record', pgp: undefined, isHTML: true, html_body: '<p>Ordinary loaded HTML</p>', body: 'Ordinary text'});
	component.update(record);
	Object.assign(record.data, {isHTML: false, html_body: ''});
	component.update(record);
	check(renderedBody.innerHTML.includes('Ordinary loaded HTML'), 'Normal mail retains existing HTML anti-flicker behavior');
}

main().catch(error => { console.error(error.stack); process.exitCode = 1; });
