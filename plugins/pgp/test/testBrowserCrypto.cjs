'use strict';

/* Real OpenPGP.js <-> GnuPG interoperability; never touches a user's keyring. */
const assert = require('node:assert/strict');
const fs = require('node:fs/promises');
const os = require('node:os');
const path = require('node:path');
const {spawn} = require('node:child_process');
const {webcrypto} = require('node:crypto');
const vm = require('node:vm');
const pgp = require('openpgp');
if (!globalThis.crypto) { globalThis.crypto = webcrypto; }
const BrowserCrypto = require('../js/crypto/BrowserCrypto.js');
const Mime = require('../js/crypto/PgpMime.js');
const PostalMime = require('postal-mime');
let assertions = 0;
function check(value, message) { assert.ok(value, message); assertions++; }
function equal(actual, expected, message) { assert.deepEqual(actual, expected, message); assertions++; }
async function rejects(operation, message) { await assert.rejects(operation, undefined, message); assertions++; }
function throws(operation, message) { assert.throws(operation, undefined, message); assertions++; }
const password = 'isolated-browser-test-password';
const password2 = 'different-protected-key-password';
let home;

async function gpg(args, input = new Uint8Array(), pass = password, failureAllowed = false) {
	return new Promise((resolve, reject) => {
		const child = spawn('gpg', ['--homedir', home, '--no-options', '--batch', '--yes', '--no-tty',
			'--no-auto-key-retrieve', '--pinentry-mode', 'loopback', '--passphrase-fd', '3', '--status-fd', '4', ...args],
		{stdio: ['pipe', 'pipe', 'pipe', 'pipe', 'pipe']});
		const output = [], status = [];
		let total = 0;
		const timer = setTimeout(() => child.kill('SIGKILL'), 60000);
		child.stdout.on('data', data => { total += data.length; if (total > 32 * 1024 * 1024) { child.kill('SIGKILL'); } output.push(data); });
		child.stderr.resume(); // Deliberately never log GnuPG diagnostics/key material.
		child.stdio[4].on('data', data => status.push(data));
		for (const stream of [child.stdin, child.stdio[3]]) { stream.on('error', () => {}); }
		child.on('error', reject);
		child.on('close', code => {
			clearTimeout(timer);
			const result = {code, data: Buffer.concat(output), status: Buffer.concat(status).toString('ascii')};
			if (code && !failureAllowed) { reject(new Error(`GnuPG test operation failed (${code}); private diagnostics suppressed.`)); }
			else { resolve(result); }
		});
		child.stdio[3].end(pass + '\n');
		child.stdin.end(input);
	});
}

async function main() {
	home = await fs.mkdtemp(path.join(os.tmpdir(), 'pgp-browser-'));
	await fs.chmod(home, 0o700);
	await fs.writeFile(path.join(home, 'gpg-agent.conf'), 'allow-loopback-pinentry\ndefault-cache-ttl 0\nmax-cache-ttl 0\nignore-cache-for-signing\n', {mode: 0o600});
	const service = new BrowserCrypto();
	const rsa = await service.generate({name: 'Browser RSA', email: 'rsa@example.test', passphrase: password, algorithm: 'rsa3072', expiresDays: 2});
	const curve = await service.generate({name: 'Browser Curve', email: 'curve@example.test', passphrase: password2, algorithm: 'curve25519', expiresDays: 2});
	if (process.env.PGP_BROWSER_FIXTURE) {
		await fs.writeFile(process.env.PGP_BROWSER_FIXTURE, JSON.stringify({fingerprint: curve.fingerprint, public_key: curve.public_key,
			encrypted_private_key: curve.encrypted_private_key, metadata: curve.metadata}), {mode: 0o600});
	}
	check(rsa.metadata.secret && rsa.metadata.protected && rsa.metadata.can_sign && rsa.metadata.can_encrypt, 'Generated RSA key is protected and usable');
	check(curve.metadata.secret && curve.metadata.protected && curve.metadata.can_sign && curve.metadata.can_encrypt, 'Generated Curve25519 key is protected and usable');
	equal(rsa.metadata.bits, 3072, 'RSA3072 default security size');
	equal(rsa.metadata.uids[0].email, 'rsa@example.test', 'Certified identity metadata');
	check(rsa.metadata.uids[0].valid && !rsa.metadata.disabled && rsa.metadata.expires > rsa.metadata.created, 'Identity certifications/expiry validated');
	check(!!rsa.revocation_certificate && rsa.private_key === rsa.encrypted_private_key, 'Protected backup alias and revocation certificate');
	equal((await service.inspect(rsa.public_key)).metadata.secret, false, 'Public import stays public');
	equal(service.unlocked(), [], 'Generating and inspecting do not unlock keys');
	await rejects(() => service.generate({email: 'x@example.test', passphrase: 'short'}), 'Weak new password rejected');
	await rejects(() => service.inspect(rsa.public_key + curve.public_key), 'Multiple armor blocks rejected');
	await rejects(() => service.inspect('attacker text\n' + rsa.public_key), 'Unframed key prefix rejected');
	await rejects(() => service.inspect(rsa.public_key + '\nattacker text'), 'Trailing armor data rejected');
	await rejects(() => service.unlock(rsa.private_key, 'wrong-password'), 'Wrong password rejected locally');
	const rawPrivate = await pgp.decryptKey({privateKey: await pgp.readPrivateKey({armoredKey: curve.private_key}), passphrase: password2});
	await rejects(() => service.inspect(rawPrivate.armor()), 'Unprotected private import rejected');
	const reprotected = await service.protect(rawPrivate.armor(), password);
	check(reprotected.metadata.protected, 'Explicit local reprotection accepted');
	const revoked = await pgp.revokeKey({key: rawPrivate, format: 'armored'});
	check((await service.inspect(revoked.publicKey)).metadata.revoked, 'Revocation certifications checked cryptographically');
	check((await service.inspect(curve.private_key, revoked.publicKey)).metadata.revoked, 'Updated public revocation overrides stale private certificate');
	await service.unlock(curve.private_key, password2, undefined, revoked.publicKey);
	await rejects(() => service.sign(BrowserCrypto.utf8('revoked'), curve.fingerprint), 'Refreshed revoked private key cannot sign');
	service.lock();
	await rejects(() => service.unlock(curve.private_key, password2, undefined, rsa.public_key), 'Public/private fingerprint mismatch rejected');
	await rejects(() => service.encrypt(BrowserCrypto.utf8('revoked'), [revoked.publicKey]), 'Revoked encryption key rejected');
	rawPrivate.clearPrivateParams();
	const expired = await pgp.generateKey({type: 'ecc', curve: 'curve25519Legacy', passphrase: password, userIDs: [{email: 'expired@example.test'}],
		date: new Date(Date.now() - 86400000), keyExpirationTime: 60, format: 'armored'});
	check((await service.inspect(expired.publicKey)).metadata.expired, 'Expired key reported');
	await rejects(() => service.encrypt(BrowserCrypto.utf8('expired'), [expired.publicKey]), 'Expired encryption key rejected');
	await service.unlock(rsa.private_key, password);
	await service.unlock(curve.private_key, password2);
	equal(service.unlocked().length, 2, 'Independent private keys unlocked only in memory');
	const expiredPrivate = await pgp.decryptKey({privateKey: await pgp.readPrivateKey({armoredKey: expired.privateKey}), passphrase: password});
	const backThen = new Date(Date.now() - 86400000 + 10000);
	const oldSignature = await pgp.sign({message: await pgp.createMessage({binary: BrowserCrypto.utf8('signed back then')}), signingKeys: expiredPrivate, detached: true, format: 'armored', date: backThen});
	const late = await service.verify(BrowserCrypto.utf8('signed back then'), oldSignature, [expired.publicKey]);
	check(late.valid && late.signatures[0].expired && late.signatures[0].status === 'expired', 'A good signature by a key that expired later stays valid and is marked expired');
	check(!(await service.verify(BrowserCrypto.utf8('tampered'), oldSignature, [expired.publicKey])).valid, 'Re-verification at signing time still rejects tampered data');
	const rsaPrivate = await pgp.decryptKey({privateKey: await pgp.readPrivateKey({armoredKey: rsa.private_key}), passphrase: password});
	const grown = await rsaPrivate.addSubkey({type: 'ecc', curve: 'curve25519Legacy'});
	await service.unlock(rsa.private_key, password, undefined, grown.toPublic().armor());
	check(service.unlocked().some(entry => entry.fingerprint === rsa.fingerprint), 'Unlock survives a refreshed certificate carrying a subkey the stored key lacks');
	equal(Object.keys(service), [], 'No secret state on serializable instance');
	equal(JSON.stringify(service), '{}', 'Private key and password are not serializable');
	const data = Uint8Array.from([0, 255, 128, 65, 13, 10, 9, 32, 13, 66, 10, 0]);
	const signed = await service.sign(data, rsa.fingerprint);
	equal(signed.micalg, 'pgp-sha256', 'RSA MIME digest SHA256');
	check((await service.verify(data, signed.signature, [rsa.public_key])).valid, 'Detached binary signature');
	const tampered = data.slice(); tampered[0] ^= 1;
	check(!(await service.verify(tampered, signed.signature, [rsa.public_key])).valid, 'Tampered binary signature rejected');
	check(!(await service.verify(data, signed.signature, [])).valid, 'Missing signer is never valid');
	const curveSignature = await service.sign(data, curve.fingerprint);
	check(['pgp-sha256', 'pgp-sha512'].includes(curveSignature.micalg), 'Actual Curve signature digest returned');
	await rejects(() => service.sign(data, rsa.fingerprint.slice(-16)), 'Short key identifiers rejected');
	await rejects(() => service.encrypt(data, []), 'No recipients rejected');
	await rejects(() => service.encrypt(data, [rsa.private_key]), 'Recipient secret material rejected');
	const encrypted = await service.encrypt(data, [rsa.public_key, curve.public_key], rsa.fingerprint);
	const envelope = await pgp.readMessage({armoredMessage: encrypted});
	check(envelope.getEncryptionKeyIDs().every(id => id.toHex() === '0000000000000000'), 'All recipient key IDs hidden including Bcc');
	const decrypted = await service.decrypt(encrypted, [rsa.public_key]);
	equal(decrypted.data, data, 'Signed/encrypted bytes unchanged');
	check(decrypted.valid && decrypted.integrity && decrypted.signatures[0].fingerprint === rsa.fingerprint, 'Verified full primary fingerprint');
	const noSigner = await service.decrypt(encrypted);
	check(!noSigner.valid && noSigner.integrity, 'Missing signing key distinct from decryption integrity');
	const binaryEncrypted = (await pgp.unarmor(encrypted)).data;
	const corrupted = binaryEncrypted.slice(); corrupted[corrupted.length - 4] ^= 0x40;
	await rejects(() => service.decrypt(corrupted, [rsa.public_key]), 'Integrity failure releases no plaintext');
	await rejects(() => service.decrypt(binaryEncrypted.subarray(0, binaryEncrypted.length - 10)), 'Truncated ciphertext rejected');
	await rejects(() => service.decrypt(encrypted + encrypted), 'Concatenated armored messages rejected');
	const concatenated = new Uint8Array(binaryEncrypted.length * 2); concatenated.set(binaryEncrypted); concatenated.set(binaryEncrypted, binaryEncrypted.length);
	await rejects(() => service.decrypt(concatenated), 'Concatenated binary messages rejected');
	service.lock(rsa.fingerprint);
	equal((await service.decrypt(encrypted, [rsa.public_key])).data, data, 'Hidden recipient decrypt with second distinct-password key');
	await rejects(() => service.sign(data, rsa.fingerprint), 'Locked key cannot sign');
	service.lock();
	await rejects(() => service.decrypt(encrypted), 'Lock all prevents subsequent decryption');
	let lockEvents = 0;
	const unsubscribeBad = service.onLock(() => { throw new Error('Broken lock observer'); });
	const unsubscribe = service.onLock(fp => { check(fp === curve.fingerprint, 'Expiry observer receives full key fingerprint'); lockEvents++; });
	await service.unlock(curve.private_key, password2, 1);
	await new Promise(resolve => setTimeout(resolve, 1100));
	equal(service.unlocked(), [], 'Expiry destroys unlocked key references');
	equal(lockEvents, 1, 'Observer exception cannot prevent TTL locking or subsequent observer');
	unsubscribe(); unsubscribeBad();
	await rejects(() => service.decrypt(encrypted), 'Expired key cannot decrypt');
	const pending = service.unlock(curve.private_key, password2);
	service.lock();
	await rejects(() => pending, 'Lock cancels an in-flight unlock');
	const changed = await service.changePassphrase(curve.private_key, password2, password);
	await rejects(() => service.unlock(changed.private_key, password2), 'Old password rejected after local password change');
	await service.unlock(changed.private_key, password);
	check(service.unlocked().length === 1, 'New password unlocks reprotected key');
	service.lock();

	await gpg(['--import'], Buffer.from(rsa.private_key));
	await gpg(['--import'], Buffer.from(curve.private_key));
	await fs.writeFile(path.join(home, 'signature.asc'), signed.signature, {mode: 0o600});
	const verifiedByGpg = await gpg(['--verify', path.join(home, 'signature.asc'), '-'], data);
	check(verifiedByGpg.status.includes('VALIDSIG ' + rsa.fingerprint), 'GnuPG verifies OpenPGP.js detached RSA signature');
	const decryptGpg = await gpg(['--decrypt'], Buffer.from(encrypted), password, true);
	equal(decryptGpg.data, Buffer.from(data), 'GnuPG decrypts browser hidden-recipient encrypted bytes');
	check(decryptGpg.status.includes('GOODMDC') && decryptGpg.status.includes('VALIDSIG'), 'GnuPG verifies integrity and embedded browser signature');
	const gpgDetached = await gpg(['--armor', '--digest-algo', 'SHA256', '--local-user', rsa.fingerprint, '--detach-sign'], data);
	check((await service.verify(data, gpgDetached.data.toString(), [rsa.public_key])).valid, 'Browser verifies GnuPG detached signature');
	await service.unlock(rsa.private_key, password);
	const gpgEncrypted = await gpg(['--armor', '--rfc4880', '--trust-model', 'always', '--throw-keyids', '--recipient', rsa.fingerprint,
		'--local-user', rsa.fingerprint, '--sign', '--encrypt'], data);
	const browserGpg = await service.decrypt(gpgEncrypted.data.toString(), [rsa.public_key]);
	equal(browserGpg.data, data, 'Browser decrypts GnuPG binary plaintext exactly');
	check(browserGpg.valid && browserGpg.integrity, 'Browser verifies GnuPG combined encryption/signature');
	await gpg(['--quick-generate-key', 'GnuPG Browser Peer <gnupg@example.test>', 'ed25519', 'sign', '2d']);
	const listing = await gpg(['--with-colons', '--list-secret-keys', 'gnupg@example.test']);
	const gpgFp = /^fpr:::::::::([A-F0-9]+):/m.exec(listing.data.toString())[1];
	await gpg(['--quick-add-key', gpgFp, 'cv25519', 'encrypt', '2d']);
	const gpgPublic = (await gpg(['--armor', '--export', gpgFp])).data.toString();
	const gpgPrivate = (await gpg(['--armor', '--export-secret-keys', gpgFp])).data.toString();
	const inspectedGpg = await service.inspect(gpgPrivate);
	check(inspectedGpg.metadata.can_sign && inspectedGpg.metadata.can_encrypt && inspectedGpg.metadata.protected, 'GnuPG-generated protected key import');
	await service.unlock(gpgPrivate, password);
	const forGpg = await service.encrypt(data, [gpgPublic], rsa.fingerprint);
	equal((await gpg(['--decrypt'], Buffer.from(forGpg))).data, Buffer.from(data), 'Browser encrypts to GnuPG-generated curve key');
	const cleartext = (await gpg(['--armor', '--local-user', gpgFp, '--clearsign'], Buffer.from('Clear-signed text\nSecond line.\n'))).data.toString();
	const clear = await service.verifyCleartext(cleartext, [gpgPublic]);
	check(clear.valid && BrowserCrypto.decodeUtf8(clear.data).includes('Clear-signed text'), 'GnuPG cleartext signature verified in browser');
	await rejects(() => service.verifyCleartext(cleartext + '\nunsigned attacker text', [gpgPublic]), 'Clear-signed appended attacker text rejected');
	check(!(await service.verifyCleartext(cleartext.replace('Second line.', 'Modified line.'), [gpgPublic])).valid, 'Clear-signed content tampering rejected');
	const tiny = new BrowserCrypto({maxMessageBytes: 1024});
	await tiny.unlock(rsa.private_key, password);
	await rejects(() => tiny.sign(new Uint8Array(1025), rsa.fingerprint), 'Plaintext input bound enforced');
	tiny.destroy();

	await testMime(service, rsa);
	await testBrowserBundle(rsa);
	service.destroy();
	equal(service.unlocked(), [], 'Destroy discards all private key state');
	console.log(`OK: ${assertions} browser OpenPGP/GnuPG/MIME assertions`);
}

async function testBrowserBundle(key) {
	const events = new Map();
	const context = vm.createContext({
		crypto: webcrypto, Uint8Array, ArrayBuffer, DataView, TextEncoder, TextDecoder,
		ReadableStream, WritableStream, TransformStream, Response, Request, Headers,
		setTimeout, clearTimeout, atob, btoa, console,
		addEventListener: (name, handler) => events.set(name, handler),
		removeEventListener: name => events.delete(name),
		fetch: () => { throw new Error('Browser cryptography must not use the network.'); },
		localStorage: new Proxy({}, {get() { throw new Error('Private keys must not use localStorage.'); }}),
		sessionStorage: new Proxy({}, {get() { throw new Error('Private keys must not use sessionStorage.'); }}),
		testKey: key, testPassword: password
	});
	vm.runInContext('globalThis.window = globalThis; globalThis.self = globalThis;', context);
	for (const filename of ['resources/vendor/pgp-vendor.js', 'js/crypto/BrowserCrypto.js', 'js/crypto/PgpMime.js']) {
		vm.runInContext(await fs.readFile(path.join(__dirname, '..', filename), 'utf8'), context, {filename, timeout: 10000});
	}
	const result = await vm.runInContext(`(async () => {
		const C = Zarafa.plugins.pgp.crypto.BrowserCrypto, service = new C();
		await service.unlock(testKey.private_key, testPassword);
		const data = new Uint8Array([0, 255, 128, 13, 10]);
		const ciphertext = await service.encrypt(data, [testKey.public_key], testKey.fingerprint);
		const decrypted = await service.decrypt(ciphertext, [testKey.public_key]);
		const zip = fflate.zipSync({'binary.dat': decrypted.data}, {level: 0});
		const unzipped = fflate.unzipSync(zip)['binary.dat'];
		globalThis.testService = service;
		return {data: decrypted.data, valid: decrypted.valid, unzipped, postal: typeof PostalMime.parse};
	})()`, context);
	equal(result.data, Uint8Array.from([0, 255, 128, 13, 10]), 'Locally bundled browser crypto byte roundtrip without network/storage');
	check(result.valid && result.postal === 'function', 'Browser globals and signatures work in isolated runtime');
	equal(result.unzipped, result.data, 'Local ZIP byte roundtrip for decrypted attachments');
	check(events.has('pagehide'), 'Page lifecycle key destruction registered');
	events.get('pagehide')();
	equal(vm.runInContext('testService.unlocked().length', context), 0, 'Pagehide locks private keys');
	vm.runInContext('testService.destroy()', context);
	check(!events.has('pagehide'), 'Destroyed service removes lifecycle hook');
}

async function testMime(service, key) {
	const raw = BrowserCrypto.fromBinaryString('From: untrusted@example.test\r\nBcc: hidden@example.test\r\nSubject: Test\r\n' +
		'Content-Type: multipart/mixed; boundary="inner"\r\n\r\n--inner\r\nContent-Type: text/plain; charset=utf-8\r\n\r\nPlain body\r\n' +
		'--inner\r\nContent-Type: application/octet-stream\r\nContent-Disposition: attachment; filename="binary.dat"\r\nContent-Transfer-Encoding: base64\r\n\r\nAP+AQQ0K\r\n--inner--\r\n');
	const entity = Mime.entity(raw);
	check(!BrowserCrypto.binaryString(entity).includes('Bcc:') && !BrowserCrypto.binaryString(entity).includes('From:'), 'SMTP envelope excluded from protected MIME');
	const sig = await service.sign(entity, key.fingerprint);
	const signed = Mime.signed(entity, sig.signature, sig.micalg);
	const parsed = Mime.parse(signed);
	equal(parsed.entity, entity, 'Detached MIME parser preserves signed bytes exactly');
	check((await service.verify(parsed.entity, parsed.signature, [key.public_key])).valid, 'MIME detached signature verifies');
	const encrypted = Mime.encrypted(await service.encrypt(signed, [key.public_key]));
	const enc = Mime.parse(encrypted);
	check(enc.type === 'encrypted', 'Encrypted envelope identified');
	const decrypted = await service.decrypt(enc.ciphertext);
	const inner = Mime.parse(decrypted.data);
	check((await service.verify(inner.entity, inner.signature, [key.public_key])).valid, 'Nested signed-then-encrypted MIME roundtrip');
	const mail = await PostalMime.parse(inner.entity, {attachmentEncoding: 'arraybuffer', maxNestingDepth: 32, maxHeadersSize: 65536, forceRfc822Attachments: true});
	check(mail.text.includes('Plain body'), 'PostalMime browser body parser');
	equal(new Uint8Array(mail.attachments[0].content), Uint8Array.from([0, 255, 128, 65, 13, 10]), 'PostalMime binary attachment exact');
	const incoming = BrowserCrypto.fromBinaryString('From: sender@example.test\r\nContent-Type: application/octet-stream\r\nContent-Transfer-Encoding: binary\r\n\r\n\x00\xff\rraw\nline  \t');
	equal(BrowserCrypto.binaryString(Mime.entity(incoming, false)).split('\r\n\r\n')[1], '\x00\xff\rraw\nline  \t', 'Incoming binary MIME body never canonicalized');
	equal(BrowserCrypto.binaryString(Mime.entity(BrowserCrypto.utf8('Subject: x\n\nbody  \n'))), 'Content-Type: text/plain; charset=utf-8\r\n\r\nbody\r\n', 'Outgoing CRLF/trailing whitespace canonicalization');
	const padded = BrowserCrypto.binaryString(Mime.encrypted('-----BEGIN PGP MESSAGE-----\r\n\r\nabc\r\n-----END PGP MESSAGE-----')).replace('\r\n\r\n-----BEGIN', '\r\n\r\n\r\n-----BEGIN');
	check(typeof Mime.parse(BrowserCrypto.fromBinaryString(padded)).ciphertext === 'string', 'Armored ciphertext after a blank line is still recognized as armor');
	const parameters = Mime.parseContentType('multipart/signed; boundary="has;semi\\\"quote"; protocol="application/pgp-signature"');
	equal(parameters.params.boundary, 'has;semi"quote', 'Escaped quoted MIME parameters parsed');
	throws(() => Mime.parseContentType('multipart/signed; boundary=a; BOUNDARY=b'), 'Duplicate MIME boundary rejected');
	throws(() => Mime.parseContentType('multipart/signed; boundary="unclosed'), 'Unclosed MIME quoted parameter rejected');
	throws(() => Mime.parse(BrowserCrypto.utf8('Content-Type: text/plain\r\nContent-Type: text/html\r\n\r\nbody')), 'Duplicate content type rejected');
	throws(() => Mime.parse(BrowserCrypto.utf8('Content-Type: text/plain\rInjected: value\r\n\r\nbody')), 'Bare CR header injection rejected');
	throws(() => Mime.signed(raw, sig.signature, sig.micalg), 'Outgoing protected entity refuses SMTP envelopes');
	throws(() => Mime.entity(BrowserCrypto.utf8('Content-Type: application/pkcs7-mime\r\n\r\nsmime')), 'S/MIME/OpenPGP outgoing nesting rejected');
	equal(Mime.parse(BrowserCrypto.utf8('Content-Type: multipart/signed; protocol="application/pkcs7-signature"; boundary=x\r\n\r\nx')).type, 'smime', 'S/MIME recognized independently');
	const boundary = Mime.contentType(signed).params.boundary;
	const signedText = BrowserCrypto.binaryString(signed);
	throws(() => Mime.parse(BrowserCrypto.fromBinaryString(signedText.replace('--' + boundary + '--', '--' + boundary + '\r\nContent-Type: text/plain\r\n\r\nextra\r\n--' + boundary + '--'))), 'Extra MIME envelope part rejected');
	throws(() => Mime.parse(BrowserCrypto.fromBinaryString(signedText.replace('--' + boundary + '--', '--' + boundary))), 'Missing closing boundary rejected');
	equal(Mime.parse(BrowserCrypto.fromBinaryString(signedText + '<img src="https://attacker.test">')).entity, entity, 'Unauthenticated epilogue excluded from protected entity');
	const encodedSig = signedText.replace('Content-Type: application/pgp-signature;', 'Content-Transfer-Encoding: base64\r\nContent-Type: application/pgp-signature;').replace(sig.signature, BrowserCrypto.toBase64(BrowserCrypto.utf8(sig.signature)));
	check((await service.verify(Mime.parse(BrowserCrypto.fromBinaryString(encodedSig)).entity, Mime.parse(BrowserCrypto.fromBinaryString(encodedSig)).signature, [key.public_key])).valid, 'Base64 signature MIME part supported');
	throws(() => Mime.parse(BrowserCrypto.fromBinaryString(encodedSig.replace(BrowserCrypto.toBase64(BrowserCrypto.utf8(sig.signature)), '!bad-base64!'))), 'Invalid signature transfer encoding rejected');
	const octets = Uint8Array.from({length: 256}, (_, index) => index);
	equal(BrowserCrypto.fromBase64(BrowserCrypto.toBase64(octets)), octets, 'All 256 octets survive transport encoding');
	throws(() => BrowserCrypto.fromBase64('AAAA%%%='), 'Malformed transport base64 rejected');
	throws(() => BrowserCrypto.fromBase64('=AAA'), 'Misplaced transport base64 padding rejected');
	const large = new Uint8Array(5 * 1024 * 1024); large[large.length - 1] = 255;
	equal(BrowserCrypto.fromBase64(BrowserCrypto.toBase64(large)), large, 'Multi-megabyte transport base64 avoids regexp recursion overflow');
}

main().catch(error => { console.error(error.stack); process.exitCode = 1; }).finally(async () => {
	if (home) {
		await new Promise(resolve => { const child = spawn('gpgconf', ['--homedir', home, '--kill', 'gpg-agent'], {stdio: 'ignore'}); child.on('close', resolve); child.on('error', resolve); });
		await fs.rm(home, {recursive: true, force: true});
	}
});
