'use strict';

/**
 * Browser-crypto/MAPI HTTP integration for an explicitly disposable QA account.
 * Creates one protected mailbox key and sends only to that same QA account.
 * Requires --allow-mailbox-changes --send-to-self and explicit PGP_TEST_URL,
 * PGP_TEST_USER, and PGP_TEST_PASSWORD_FILE environment variables.
 * Passwords, session cookies, receipts and key armor are never logged.
 */
const assert = require('node:assert/strict');
const fs = require('node:fs/promises');
const {randomBytes, webcrypto} = require('node:crypto');
if (!globalThis.crypto) { globalThis.crypto = webcrypto; }
const BrowserCrypto = require('../js/crypto/BrowserCrypto.js');
const Mime = require('../js/crypto/PgpMime.js');
const PostalMime = require('postal-mime');

if (!process.argv.includes('--allow-mailbox-changes') || !process.argv.includes('--send-to-self')) {
	throw new Error('Explicit --allow-mailbox-changes --send-to-self arguments are required for the disposable QA mailbox.');
}
if (!process.env.PGP_TEST_URL || !process.env.PGP_TEST_USER || !process.env.PGP_TEST_PASSWORD_FILE) {
	throw new Error('Explicit PGP_TEST_URL, PGP_TEST_USER, and PGP_TEST_PASSWORD_FILE are required; no default mailbox is targeted.');
}
const base = new URL(process.env.PGP_TEST_URL);
const username = process.env.PGP_TEST_USER;
const passwordFile = process.env.PGP_TEST_PASSWORD_FILE;
if (base.protocol !== 'https:' || !username.includes('@')) { throw new Error('HTTPS and a complete dedicated QA mailbox address are required.'); }
let assertions = 0;
function check(value, message) { assert.ok(value, message); assertions++; }
function equal(actual, expected, message) { assert.deepEqual(actual, expected, message); assertions++; }
function first(value) { return Array.isArray(value) ? value[0] : value; }
function item(value) { value = first(value); return value && value.item ? item(value.item) : value; }
const pause = ms => new Promise(resolve => setTimeout(resolve, ms));

class Session {
	constructor() { this.cookies = new Map(); }
	async fetch(url, options = {}) {
		url = new URL(url, base);
		if (url.origin !== base.origin) { throw new Error('Cross-origin redirect refused.'); }
		const response = await fetch(url, {...options, redirect: 'manual', signal: AbortSignal.timeout(110000), headers: {
			'User-Agent': 'grommunio-openpgp-browser-http-test/2.0', ...options.headers,
			Cookie: Array.from(this.cookies, ([key, value]) => `${key}=${value}`).join('; ')
		}});
		for (const cookie of response.headers.getSetCookie()) {
			const pair = cookie.split(';', 1)[0], index = pair.indexOf('=');
			if (index > 0) { this.cookies.set(pair.slice(0, index), pair.slice(index + 1)); }
		}
		if (!response.ok && ![301, 302, 303, 307, 308].includes(response.status)) { throw new Error(`HTTP integration request failed: ${response.status}`); }
		return response;
	}
	async login() {
		await this.fetch(base);
		const response = await this.fetch(new URL('?logon', base), {method: 'POST', body: new URLSearchParams({
			username, password: (await fs.readFile(passwordFile, 'utf8')).trim()
		})});
		if (response.headers.has('Location')) { await this.fetch(new URL(response.headers.get('Location'), base)); }
	}
	async rpc(module, action, data) {
		const wire = JSON.stringify({zarafa: {[module]: {pgpqa: {[action]: data}}}});
		if (wire.includes(localPassphrase)) { throw new Error('A private-key passphrase was about to leave the browser.'); }
		const response = await this.fetch(new URL('grommunio.php?subsystem=openpgp_browser_http_test', base), {
			method: 'POST', headers: {'Content-Type': 'application/json'}, body: wire
		});
		let payload;
		try { payload = await response.json(); } catch (error) { throw new Error('Expected an authenticated JSON response; login or server configuration failed.'); }
		if (payload.zarafa && payload.zarafa.error) { return {error: payload.zarafa.error}; }
		return payload.zarafa && payload.zarafa[module] ? payload.zarafa[module].pgpqa || {} : {};
	}
	async request(operation, data = {}, success = true) {
		const response = await this.rpc('pluginpgpmodule', 'request', {operation, ...data});
		const result = first(response.request);
		check(!!result && result.success === success, `OpenPGP HTTP ${operation} returned unexpected status${result && result.message ? ': ' + result.message : ''}`);
		return result;
	}
}

const localPassphrase = randomBytes(32).toString('base64url');
const crypto = new BrowserCrypto();
const session = new Session();
let store, folders, generated, before;
const generatedDrafts = new Set();
let sentCount = 0;

function draftProps(subject, body, sign, encrypt) {
	return {message_class: 'IPM.Note', subject, body, isHTML: false,
		sent_representing_entryid: folders.mailbox_owner_entryid,
		sent_representing_smtp_address: username, sent_representing_email_address: username,
		sent_representing_address_type: 'SMTP', sent_representing_name: 'Browser OpenPGP QA',
		pgp_key: generated.fingerprint, pgp_sign: sign, pgp_encrypt: encrypt};
}
function finalProps(sign, encrypt) { return {message_class: 'IPM.Note', pgp_key: generated.fingerprint, pgp_sign: sign, pgp_encrypt: encrypt}; }
function success(response) { return !Object.prototype.hasOwnProperty.call(response, 'error') && Object.prototype.hasOwnProperty.call(response, 'success'); }
async function upload(draftId, filename, content, type) {
	const form = new FormData();
	form.set('dialog_attachments', draftId);
	form.set('store', store);
	form.set('ignore_extract_attachid', '1');
	form.append('attachments[]', new Blob([content], {type}), filename);
	const response = await session.fetch(new URL('?load=upload_attachment&module=attachments&moduleid=pgpqa', base), {method: 'POST', body: form});
	const result = await response.json();
	check(result.success === true, 'Normal authenticated browser attachment upload succeeds');
	const attachment = first(result.zarafa && result.zarafa.attachments && result.zarafa.attachments.pgpqa.update.item);
	check(attachment && attachment.props && attachment.props.tmpname, 'Upload returns a correlated temporary attachment');
	return attachment.props;
}
async function saveDraft(sign, encrypt, name, options = {}) {
	const subject = `Browser OpenPGP QA ${name} ${randomBytes(6).toString('hex')}`;
	const body = `Browser-only body — äöü 日本語\r\nSecret marker ${randomBytes(18).toString('hex')}`;
	const props = draftProps(subject, body, sign, encrypt);
	const expectedAttachments = [], attachments = {};
	if (options.rich) {
		const dialogId = randomBytes(16).toString('hex');
		attachments.dialog_attachments = dialogId;
		const png = BrowserCrypto.fromBase64('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+j4ZkAAAAASUVORK5CYII=');
		const image = await upload(dialogId, 'inline.png', png, 'image/png');
		attachments.add = [{...image, inline: true, cid: 'pgp-http-inline', hidden: true, filetype: 'image/png', attach_method: 1}];
		expectedAttachments.push({name: 'inline.png', bytes: png, cid: 'pgp-http-inline'});
		if (options.action !== 'reply') {
			const binary = Uint8Array.from({length: 1024}, (_, index) => index % 256);
			await upload(dialogId, 'binary.dat', binary, 'application/octet-stream');
			expectedAttachments.push({name: 'binary.dat', bytes: binary});
		}
		props.isHTML = true;
		props.html_body = '<html><body><p>' + body + '</p><img src="cid:pgp-http-inline"></body></html>';
	}
	const response = await session.rpc('createmailitemmodule', 'save', {
		store_entryid: store, parent_entryid: folders.default_folder_drafts,
		props, attachments, recipients: {add: [{
			display_name: username, email_address: username, smtp_address: username, address_type: 'SMTP', recipient_type: 1, object_type: 6
		}]}, ...(options.source ? {message_action: {browser_decrypted: true, action_type: options.action || 'forward',
			source_entryid: options.source, source_store_entryid: store}} : {})
	});
	check(success(response), 'QA draft save succeeds');
	const updated = item(response.update);
	const entryid = updated && (updated.entryid || updated.props && updated.props.entryid);
	check(typeof entryid === 'string' && entryid.length > 0, 'Saved draft entry ID returned');
	generatedDrafts.add(entryid);
	return {entryid, subject, body, sign, encrypt, options, expectedAttachments, dialogAttachments: attachments.dialog_attachments};
}
async function prepare(draft) {
	const prepared = await session.request('prepare', {store_entryid: store, entryid: draft.entryid});
	check(prepared.sign === draft.sign && prepared.encrypt === draft.encrypt, 'Receipt preserves saved protection selection');
	equal(prepared.key.fingerprint, generated.fingerprint, 'Receipt identifies selected full fingerprint');
	const source = BrowserCrypto.fromBase64(prepared.mime);
	check(Mime.contentType(source).type.length > 0, 'Prepared MIME is a byte-preserved entity');
	if (draft.options.rich) {
		const parsed = await PostalMime.parse(source, {forceRfc822Attachments: true});
		for (const expected of draft.expectedAttachments) {
			const actual = parsed.attachments.find(attachment => attachment.filename === expected.name);
			check(!!actual, 'Uploaded attachment exists in prepared MIME');
			equal(new Uint8Array(actual.content), expected.bytes, 'Upload/MAPI snapshot preserves binary attachment bytes');
			if (expected.cid) { equal((actual.contentId || '').replace(/^<|>$/g, ''), expected.cid, 'Prepared MIME preserves inline attachment content ID'); }
		}
	}
	const current = await crypto.inspect(prepared.key.encrypted_private_key, prepared.key.public_key);
	equal(current.fingerprint, generated.fingerprint, 'Browser validates returned mailbox key material');
	await crypto.unlock(current.encrypted_private_key, localPassphrase, undefined, current.public_key);
	let entity = source;
	if (draft.sign && !(draft.encrypt && draft.options.combined)) {
		const signature = await crypto.sign(entity, generated.fingerprint);
		entity = Mime.signed(entity, signature.signature, signature.micalg);
	}
	if (draft.encrypt) {
		const recipients = [];
		for (const recipient of prepared.recipients) {
			const inspected = await crypto.inspect(recipient.public_key);
			equal(inspected.fingerprint, recipient.fingerprint, 'Recipient certificate matches the pinned full fingerprint');
			check(inspected.metadata.uids.some(uid => uid.valid && uid.email === recipient.email), 'Recipient email has valid certification');
			recipients.push(inspected.public_key);
		}
		entity = Mime.encrypted(await crypto.encrypt(entity, recipients, draft.sign && draft.options.combined ? generated.fingerprint : undefined));
	}
	return {token: prepared.token, envelope: BrowserCrypto.toBase64(entity), source};
}
async function submit(draft, prepared, overrides = {}, expected = true) {
	const response = await session.rpc('createmailitemmodule', 'save', {
		store_entryid: store, parent_entryid: folders.default_folder_drafts, entryid: draft.entryid,
		props: finalProps(draft.sign, draft.encrypt),
		...(draft.dialogAttachments ? {attachments: {dialog_attachments: draft.dialogAttachments}} : {}),
		message_action: {send: true, ...(prepared ? {pgp: {token: prepared.token, envelope: prepared.envelope}} : {})}, ...overrides
	});
	check(success(response) === expected, expected ? 'Prepared message submitted' : 'Unsafe/stale prepared message rejected');
	if (expected) { generatedDrafts.delete(draft.entryid); sentCount++; }
	else {
		const opened = await open(draft.entryid);
		check(opened && opened.props && opened.props.subject, 'Failed protection retains original recoverable draft');
	}
	return response;
}
async function open(entryid) {
	const result = await session.rpc('createmailitemmodule', 'open', {
		store_entryid: store, entryid, message_action: {mark_read: true, send_read_receipt: false}
	});
	return item(result.item || result.open);
}
async function locate(folder, subject) {
	const until = Date.now() + 60000;
	while (Date.now() < until) {
		const response = await session.rpc('maillistmodule', 'list', {store_entryid: store, entryid: folder, rowcount: 100});
		const items = response.list && response.list.item || [];
		const found = (Array.isArray(items) ? items : [items]).find(message => message.props && message.props.subject === subject);
		if (found) { return found.entryid; }
		await pause(1000);
	}
	throw new Error('QA message did not arrive in its Inbox/Sent folder within 60 seconds.');
}
async function roundtrip(sign, encrypt, options = {}) {
	const draft = await saveDraft(sign, encrypt, `${sign ? 'sign' : ''}${encrypt ? 'encrypt' : ''}${options.rich ? '-rich' : ''}${options.action || ''}` || 'plain', options);
	const prepared = sign || encrypt ? await prepare(draft) : null;
	await submit(draft, prepared);
	let inbox;
	for (const folder of [folders.default_folder_inbox, folders.default_folder_sent]) {
		const entryid = await locate(folder, draft.subject);
		if (folder === folders.default_folder_inbox) { inbox = entryid; }
		let record = await open(entryid);
		equal(record.props.subject, draft.subject, 'Outer mail subject survives MAPI/SMTP');
		if (!sign && !encrypt) {
			check(!record.props.pgp && record.props.body.includes('Secret marker'), 'Unprotected normal mail remains unaffected');
			continue;
		}
		check(!record.props.body && !record.props.html_body, 'PHP returns no decrypted/clear protected message preview');
		const info = record.props.pgp;
		check(info && !info.error && info.pending && info.mime, 'Original protected MIME delivered to browser');
		let envelope = BrowserCrypto.fromBase64(info.mime);
		let parsed = Mime.parse(envelope);
		if (encrypt) {
			equal(parsed.type, 'encrypted', 'Stored and received mail remain ciphertext');
			check(!BrowserCrypto.binaryString(envelope).includes('Secret marker'), 'Opaque server MIME contains no decrypted marker');
			crypto.lock();
			await assert.rejects(() => crypto.decrypt(parsed.ciphertext)); assertions++;
			await crypto.unlock(generated.encrypted_private_key, localPassphrase, undefined, generated.public_key);
			const decrypted = await crypto.decrypt(parsed.ciphertext, [generated.public_key]);
			check(decrypted.integrity, 'Browser authenticates complete ciphertext before parsing');
			if (sign && options.combined) {
				check(decrypted.valid && decrypted.signatures[0].fingerprint === generated.fingerprint, 'Actual UI combined encrypted signature verified locally');
			}
			parsed = Mime.parse(decrypted.data);
		}
		if (sign && !options.combined) {
			equal(parsed.type, 'signed', 'Expected detached OpenPGP/MIME signature preserved');
			const verified = await crypto.verify(parsed.entity, parsed.signature, [generated.public_key]);
			check(verified.valid, 'Browser verifies the received detached signature');
			equal(verified.signatures[0].fingerprint, generated.fingerprint, 'Signature resolves to verified full fingerprint');
		}
		const mail = await PostalMime.parse(parsed.entity, {maxNestingDepth: 32, maxHeadersSize: 65536, forceRfc822Attachments: true});
		check(mail.text.includes('Secret marker') && mail.text.includes('日本語'), 'Browser MIME decoder recovers Unicode message');
		if (options.rich) {
			check(mail.html && mail.html.includes('cid:pgp-http-inline'), 'HTML/CID reference survives upload/MAPI/SMTP/browser decryption');
			equal(mail.attachments.length, draft.expectedAttachments.length, 'No protected source envelope was accidentally copied as an attachment');
			for (const expected of draft.expectedAttachments) {
				const actual = mail.attachments.find(attachment => attachment.filename === expected.name);
				check(!!actual, 'Expected uploaded attachment survives protected mail delivery');
				equal(new Uint8Array(actual.content), expected.bytes, 'HTTP/MAPI/SMTP attachment bytes exact');
				if (expected.cid) { equal((actual.contentId || '').replace(/^<|>$/g, ''), expected.cid, 'Inline attachment content ID preserved'); }
			}
		}
		crypto.lock();
		record = await open(entryid);
		check(!record.props.body && !record.props.html_body && record.props.pgp.mime === info.mime, 'Mark read/reopen never persists browser plaintext');
	}
	console.log(`PASS browser HTTP SMTP/Inbox/Sent ${sign ? 'sign ' : ''}${encrypt ? 'encrypt' : ''}${!sign && !encrypt ? 'normal control' : ''}${options.combined ? ' combined' : ''}${options.rich ? ' HTML/CID/binary' : ''}${options.action ? ' ' + options.action : ''}`);
	return {inbox, draft};
}

async function guards() {
	const draft = await saveDraft(true, false, 'guards');
	await submit(draft, null, {}, false);
	await submit(draft, {...await prepare(draft), token: randomBytes(24).toString('hex')}, {}, false);
	// Each rejection gets a fresh one-time receipt, otherwise an earlier
	// rejection could consume it and hide a missing later validation guard.
	await submit(draft, await prepare(draft), {props: {...finalProps(true, false), subject: draft.subject}}, false);
	await submit(draft, await prepare(draft), {props: {...finalProps(true, false), isHTML: false}}, false);
	await submit(draft, await prepare(draft), {props: {...finalProps(true, false), message_class: 'IPM.Note.deferSMIME'}}, false);
	await submit(draft, await prepare(draft), {props: {...finalProps(true, false), smime: {sign: true}}}, false);
	await submit(draft, await prepare(draft), {props: finalProps(true, true)}, false);
	await submit(draft, await prepare(draft), {recipients: {add: [{display_name: username, email_address: username,
		smtp_address: username, address_type: 'SMTP', recipient_type: 3, object_type: 6}]}}, false);
	await submit(draft, await prepare(draft), {attachments: {remove: [{attach_num: 0}]}}, false);
	const prepared = await prepare(draft);
	const signed = Mime.parse(BrowserCrypto.fromBase64(prepared.envelope));
	const changed = new Uint8Array(signed.entity.length + 1); changed.set(signed.entity); changed[changed.length - 1] = 88;
	const tampered = {...prepared, envelope: BrowserCrypto.toBase64(Mime.signed(changed, signed.signature, signed.micalg))};
	await submit(draft, tampered, {}, false);
	const other = await saveDraft(true, false, 'cross-draft');
	await submit(other, await prepare(draft), {}, false);
	const beforeChange = await prepare(draft);
	const update = await session.rpc('createmailitemmodule', 'save', {store_entryid: store, entryid: draft.entryid,
		parent_entryid: folders.default_folder_drafts, props: {body: 'Changed after OpenPGP preparation'}});
	check(success(update), 'Draft can change after old preparation');
	await submit(draft, beforeChange, {}, false);
	const attachmentDraft = await saveDraft(true, true, 'late-upload-guard', {rich: true, combined: true});
	const beforeUpload = await prepare(attachmentDraft);
	await upload(attachmentDraft.dialogAttachments, 'late-upload.dat', BrowserCrypto.utf8('Attachment added after preparation'), 'application/octet-stream');
	// The final payload contains only the normal upload dialog identifier, no
	// attachment add/remove array. The saved-content digest must still reject
	// newly consumed pending uploads rather than silently omitting their bytes.
	await submit(attachmentDraft, beforeUpload, {}, false);
	console.log('PASS browser HTTP stale/mixed/receipt/tampered-content/cross-draft guards');
}

async function main() {
	await session.login();
	before = await session.request('list');
	const hierarchy = await session.rpc('hierarchymodule', 'list', {});
	const stores = hierarchy.list && hierarchy.list.item || [];
	const mailbox = stores.find(candidate => candidate.props && candidate.props.user_name === username);
	check(!!mailbox, 'Dedicated QA mailbox session established');
	store = mailbox.store_entryid; folders = mailbox.props;
	generated = await crypto.generate({name: 'Browser HTTP QA', email: username, passphrase: localPassphrase, algorithm: 'curve25519', expiresDays: 2});
	const uploaded = await session.request('put', {key: {fingerprint: generated.fingerprint, public_key: generated.public_key,
		encrypted_private_key: generated.encrypted_private_key, metadata: generated.metadata}});
	check(uploaded.key.secret && uploaded.key.revision, 'Encrypted private key saved as revisioned mailbox material');
	const material = (await session.request('get', {fingerprint: generated.fingerprint})).key;
	check((await crypto.inspect(material.encrypted_private_key, material.public_key)).metadata.protected, 'Mailbox protected key revalidated in browser');
	const listed = await session.request('list');
	check(!listed.keys.some(key => key.encrypted_private_key || key.private_key || key.public_key), 'Key list exposes metadata, not secret/public armor');
	await session.request('put', {key: {fingerprint: generated.fingerprint, public_key: generated.public_key, metadata: generated.metadata}}, false);
	await session.request('unlock', {fingerprint: generated.fingerprint}, false);
	await session.request('generate', {}, false);
	await session.request('keyservers', {servers: ['http://127.0.0.1']}, false);
	await session.request('delete', {fingerprint: generated.fingerprint, deleteSecret: false}, false);
	await guards();
	for (const [sign, encrypt] of [[false, false], [true, false], [false, true], [true, true]]) { await roundtrip(sign, encrypt); }
	const rich = await roundtrip(true, true, {rich: true, combined: true});
	await roundtrip(true, true, {rich: true, combined: true, source: rich.inbox, action: 'forward'});
	await roundtrip(true, true, {rich: true, combined: true, source: rich.inbox, action: 'reply'});
	console.log(`OK: ${assertions} browser-crypto authenticated HTTP assertions; ${sentCount} QA-only messages submitted`);
}

main().catch(error => { console.error(error.message); process.exitCode = 1; }).finally(async () => {
	crypto.destroy();
	if (generated) {
		try {
			await session.request('delete', {fingerprint: generated.fingerprint, deleteSecret: true});
			const after = await session.request('list');
			equal(after.keys.map(key => key.fingerprint).sort(), before.keys.map(key => key.fingerprint).sort(), 'Only the test-generated mailbox key was removed');
			console.log('Cleanup: removed only the generated QA key; QA test messages/drafts retained for inspection.');
		} catch (error) { console.error('QA key cleanup failed; remove the generated test key manually.'); process.exitCode = 1; }
	}
});
