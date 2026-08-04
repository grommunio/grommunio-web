/* global openpgp */
/*
 * Browser-only OpenPGP operations. This module has no transport or persistent
 * storage access. Only passphrase-protected key armor may leave this module.
 * OpenPGP.js is bundled locally and pinned in package-lock.json.
 */
(function(root, factory) {
	'use strict';
	if (typeof module === 'object' && module.exports) {
		module.exports = factory(require('openpgp'));
	} else {
		root.Zarafa = root.Zarafa || {};
		root.Zarafa.plugins = root.Zarafa.plugins || {};
		root.Zarafa.plugins.pgp = root.Zarafa.plugins.pgp || {};
		root.Zarafa.plugins.pgp.crypto = root.Zarafa.plugins.pgp.crypto || {};
		root.Zarafa.plugins.pgp.crypto.BrowserCrypto = factory(root.openpgp);
	}
})(typeof globalThis !== 'undefined' ? globalThis : this, function(pgp) {
	'use strict';
	var states = new WeakMap();
	var KEY_LIMIT = 10 * 1024 * 1024;
	var DEFAULT_LIMIT = 50 * 1024 * 1024;
	var DIGESTS = {8: 'pgp-sha256', 9: 'pgp-sha384', 10: 'pgp-sha512', 12: 'pgp-sha3-256', 14: 'pgp-sha3-512'};

	function fail(message, code) {
		var error = new Error(message);
		error.code = code || 'OPENPGP_INVALID';
		throw error;
	}
	function fingerprint(value) {
		if (typeof value !== 'string' || !/^(?:[a-fA-F0-9]{40}|[a-fA-F0-9]{64})$/.test(value)) {
			fail('A complete OpenPGP fingerprint is required.');
		}
		return value.toUpperCase();
	}
	function bytes(value, maximum) {
		if (!(value instanceof Uint8Array) || value.length > maximum) {
			fail('OpenPGP data must be a bounded byte array.');
		}
		return value;
	}
	function passphrase(value, creating) {
		if (typeof value !== 'string' || !value.length || value.length > 4096 || /\u0000/.test(value)) {
			fail('Enter a nonempty passphrase of at most 4096 characters.');
		}
		if (creating && value.length < 12) {
			fail('Use a private-key passphrase of at least 12 characters.');
		}
		return value;
	}
	function boundedTtl(value) {
		return Math.min(3600, Math.max(1, Number.isFinite(Number(value)) ? Math.floor(Number(value)) : 600));
	}
	function wipe(key) {
		// Best effort only: JavaScript engines do not promise physical zeroization
		// of strings, WebCrypto state, temporary copies or garbage-collected memory.
		if (key && key.isPrivate() && typeof key.clearPrivateParams === 'function') {
			key.clearPrivateParams();
		}
	}
	function armor(value, type, limit) {
		if (typeof value !== 'string' || value.length > limit || value.indexOf('\u0000') !== -1) {
			fail('Invalid or oversized OpenPGP armor.');
		}
		var text = value.trim();
		var head = '-----BEGIN PGP ' + type + '-----';
		var tail = '-----END PGP ' + type + '-----';
		if (!text.startsWith(head + '\n') && !text.startsWith(head + '\r\n')) {
			fail('Expected a single OpenPGP ' + type.toLowerCase() + ' block.');
		}
		if (!text.endsWith(tail) || text.indexOf(head, head.length) !== -1 || text.indexOf(tail) !== text.length - tail.length) {
			fail('Additional data outside the OpenPGP armor is not allowed.');
		}
		return text;
	}
	function config(limit) {
		return Object.assign({}, pgp.config, {
			preferredHashAlgorithm: pgp.enums.hash.sha256,
			preferredSymmetricAlgorithm: pgp.enums.symmetric.aes256,
			preferredCompressionAlgorithm: pgp.enums.compression.uncompressed,
			v6Keys: false,
			aeadProtect: false,
			s2kType: pgp.enums.s2k.iterated,
			s2kIterationCountByte: 224,
			maxArgon2MemoryExponent: 16,
			allowUnauthenticatedMessages: false,
			allowUnauthenticatedStream: false,
			allowInsecureDecryptionWithSigningKeys: false,
			allowInsecureVerificationWithReformattedKeys: false,
			constantTimePKCS1Decryption: true,
			enforceGrammar: true,
			ignoreMalformedPackets: false,
			ignoreUnsupportedPackets: false,
			minRSABits: 2048,
			maxDecompressedMessageSize: limit,
			maxUserIDLength: 2048,
			showVersion: false,
			showComment: false
		});
	}
	async function readKey(input, cfg, requireProtected) {
		var options = {config: cfg};
		if (typeof input === 'string') {
			var isSecret = input.trim().startsWith('-----BEGIN PGP PRIVATE KEY BLOCK-----');
			options.armoredKeys = armor(input, isSecret ? 'PRIVATE KEY BLOCK' : 'PUBLIC KEY BLOCK', KEY_LIMIT);
		} else {
			options.binaryKeys = bytes(input, KEY_LIMIT);
		}
		var keys = await pgp.readKeys(options);
		if (keys.length !== 1) {
			keys.forEach(wipe);
			fail('Import one complete OpenPGP key at a time.');
		}
		var key = keys[0];
		fingerprint(key.getFingerprint());
		if (key.getKeys().length > 32 || key.users.length > 100) {
			wipe(key);
			fail('This key exceeds the supported subkey or identity limit.');
		}
		if (key.isPrivate() && requireProtected) {
			// PrivateKey.isDecrypted() is intentionally true if ANY packet is
			// unlocked. Inspect every packet as well, including mixed key exports.
			var unsafe = key.getKeys().some(function(part) {
				var packet = part.keyPacket;
				return packet.isDecrypted() || (!packet.isDummy() && ![253, 254].includes(packet.s2kUsage));
			});
			if (unsafe) {
				wipe(key);
				fail('Private keys must be passphrase protected before upload. Protect this key locally first.', 'OPENPGP_UNPROTECTED_KEY');
			}
		}
		return key;
	}
	async function metadata(key, cfg) {
		var now = new Date();
		var expiry = await key.getExpirationTime(undefined, cfg).catch(function() { return null; });
		var revoked = await key.isRevoked(undefined, undefined, now, cfg);
		var validPrimary = await key.verifyPrimaryKey(now, undefined, cfg).then(function() { return true; }, function() { return false; });
		var signing = await key.getSigningKey(undefined, now, undefined, cfg).then(function() { return true; }, function() { return false; });
		var encryption = await key.getEncryptionKey(undefined, now, undefined, cfg).then(function() { return true; }, function() { return false; });
		var uids = await Promise.all(key.users.filter(function(user) { return user.userID; }).map(async function(user) {
			var valid = await user.verify(now, cfg).then(function() { return true; }, function() { return false; });
			return {uid: user.userID.userID, name: user.userID.name || '', email: (user.userID.email || '').toLowerCase(),
				valid: valid, validity: valid ? 'u' : 'i', revoked: !valid, expired: false};
		}));
		var algorithm = key.getAlgorithmInfo();
		return {
			fingerprint: fingerprint(key.getFingerprint()), keyid: key.getKeyID().toHex().toUpperCase(),
			secret: key.isPrivate(), protected: key.isPrivate() ? !key.isDecrypted() : false,
			uids: uids, created: Math.floor(key.getCreationTime().getTime() / 1000),
			expires: expiry instanceof Date ? Math.floor(expiry.getTime() / 1000) : 0,
			expired: expiry instanceof Date && expiry <= now, revoked: revoked, disabled: !validPrimary,
			can_sign: validPrimary && signing, can_encrypt: validPrimary && encryption,
			algorithm: key.keyPacket.algorithm, algorithm_name: algorithm.algorithm,
			bits: algorithm.bits || 0, curve: algorithm.curve || '',
			subkeys: key.getSubkeys().map(function(part) { return {fingerprint: fingerprint(part.getFingerprint()), keyid: part.getKeyID().toHex().toUpperCase()}; })
		};
	}
	async function refreshedKey(input, publicArmor, cfg, requireProtected) {
		var key = await readKey(input, cfg, requireProtected);
		if (publicArmor) {
			var updates = await readKey(publicArmor, cfg, true);
			if (updates.isPrivate() || updates.getFingerprint() !== key.getFingerprint()) {
				wipe(key); wipe(updates);
				fail('The public certificate must match the private key fingerprint.');
			}
			key = await key.update(updates, undefined, cfg);
		}
		return key;
	}
	async function exported(key, cfg) {
		var info = await metadata(key, cfg);
		var secret = key.isPrivate() ? key.armor(cfg) : '';
		return {fingerprint: info.fingerprint, public_key: key.toPublic().armor(cfg),
			private_key: secret, encrypted_private_key: secret, metadata: info};
	}
	async function publicKeys(armors, cfg) {
		if (!Array.isArray(armors) || armors.length > 100) {
			fail('Supply at most 100 public recipient or verification keys.');
		}
		var keys = [];
		for (var input of armors) {
			var key = await readKey(input, cfg, true);
			if (key.isPrivate()) {
				wipe(key);
				fail('Only public keys may be used as recipient or verification keys.');
			}
			if (!keys.some(function(existing) { return existing.getFingerprint() === key.getFingerprint(); })) {
				keys.push(key);
			}
		}
		return keys;
	}
	function active(service, fp) {
		var state = states.get(service);
		var key = state.keys.get(fingerprint(fp));
		if (!key || key.expires <= Date.now()) {
			if (key) { service.lock(fp); }
			fail('Unlock your OpenPGP private key in this browser tab first.', 'OPENPGP_LOCKED');
		}
		return key.key;
	}
	function checkEpoch(service, epoch, used, data) {
		var state = states.get(service);
		var expired = used.some(function(fp) { var entry = state.keys.get(fp); return !entry || entry.expires <= Date.now(); });
		if (state.epoch !== epoch || expired) {
			if (data instanceof Uint8Array) { data.fill(0); }
			fail('The OpenPGP key was locked while the operation was running.', 'OPENPGP_LOCKED');
		}
	}
	async function signatureResults(signatures, keys, cfg) {
		return Promise.all(signatures.map(async function(signature) {
			var keyid = signature.keyID.toHex().toUpperCase();
			var candidates = keys.filter(function(key) { return key.getKeyIDs().some(function(id) { return id.toHex().toUpperCase() === keyid; }); });
			var valid = await signature.verified.then(function() { return true; }, function() { return false; });
			// A short key ID is never treated as a verified fingerprint. Only map
			// it when exactly one supplied certificate matches and verification won.
			var key = valid && candidates.length === 1 ? candidates[0] : null;
			var info = key ? await metadata(key, cfg) : null;
			var accepted = valid && !!key && !info.expired && !info.revoked && !info.disabled;
			return {keyid: keyid, fingerprint: info ? info.fingerprint : '', primary_fingerprint: info ? info.fingerprint : '',
				valid: accepted, status: accepted ? 'valid' : (candidates.length ? 'invalid' : 'missing-key'),
				uids: info ? info.uids : [], expired: info ? info.expired : false, revoked: info ? info.revoked : false};
		}));
	}

	class BrowserCrypto {
		constructor(options) {
			options = options || {};
			if (!pgp || typeof pgp.encrypt !== 'function' || !globalThis.crypto || !globalThis.crypto.subtle) {
				fail('OpenPGP requires a modern browser and a secure HTTPS connection.', 'OPENPGP_UNAVAILABLE');
			}
			var limit = Number(options.maxMessageBytes) || DEFAULT_LIMIT;
			limit = Math.min(100 * 1024 * 1024, Math.max(1024, Math.floor(limit)));
			states.set(this, {keys: new Map(), listeners: new Set(), epoch: 0, ttl: boundedTtl(options.ttlSeconds === undefined ? 600 : options.ttlSeconds), limit: limit, config: config(limit)});
			if (typeof globalThis.addEventListener === 'function') {
				var handler = this.lock.bind(this, undefined);
				globalThis.addEventListener('pagehide', handler);
				states.get(this).pagehide = handler;
			}
		}

		async inspect(input, publicArmor) {
			var cfg = states.get(this).config;
			var key = await refreshedKey(input, publicArmor, cfg, true);
			try { return await exported(key, cfg); }
			finally { wipe(key); }
		}

		async generate(options) {
			options = options || {};
			var name = String(options.name || '').trim();
			var email = String(options.email || '').trim().toLowerCase();
			if (name.length > 200 || /[\x00-\x1f\x7f<>]/.test(name) || !/^[^\s<>@]+@[^\s<>@]+\.[^\s<>@]+$/.test(email) || email.length > 254) {
				fail('Enter a valid name and email address for the OpenPGP identity.');
			}
			var days = options.expiresDays === undefined ? 730 : Number(options.expiresDays);
			if (!Number.isInteger(days) || days < 1 || days > 3650) { fail('Key expiry must be between 1 and 3650 days.'); }
			var algorithm = options.algorithm || 'rsa3072';
			if (!['rsa3072', 'rsa4096', 'curve25519'].includes(algorithm)) { fail('Choose RSA3072, RSA4096 or Curve25519.'); }
			var cfg = states.get(this).config;
			var result = await pgp.generateKey({userIDs: [{name: name, email: email}], passphrase: passphrase(options.passphrase, true),
				type: algorithm === 'curve25519' ? 'ecc' : 'rsa', curve: 'curve25519Legacy',
				rsaBits: algorithm === 'rsa4096' ? 4096 : 3072, keyExpirationTime: days * 86400, format: 'armored', config: cfg});
			var out = await this.inspect(result.privateKey);
			out.revocation_certificate = result.revocationCertificate;
			return out;
		}

		async protect(input, newPassphrase) {
			var cfg = states.get(this).config;
			var key = await readKey(input, cfg, false);
			try {
				if (!key.isPrivate() || !key.getKeys().every(function(part) { return part.keyPacket.isDecrypted() || part.keyPacket.isDummy(); })) {
					fail('Protect expects an unprotected private key. Use change passphrase for protected keys.');
				}
				var encrypted = await pgp.encryptKey({privateKey: key, passphrase: passphrase(newPassphrase, true), config: cfg});
				return await exported(encrypted, cfg);
			} finally { wipe(key); }
		}

		async changePassphrase(input, oldPassphrase, newPassphrase, publicArmor) {
			var cfg = states.get(this).config;
			var key = await refreshedKey(input, publicArmor, cfg, true);
			var unlocked;
			try {
				if (!key.isPrivate()) { fail('A protected private key is required.'); }
				unlocked = await pgp.decryptKey({privateKey: key, passphrase: passphrase(oldPassphrase, false), config: cfg});
				var encrypted = await pgp.encryptKey({privateKey: unlocked, passphrase: passphrase(newPassphrase, true), config: cfg});
				this.lock(key.getFingerprint());
				return await exported(encrypted, cfg);
			} finally { wipe(unlocked); wipe(key); }
		}

		async unlock(input, password, ttlSeconds, publicArmor) {
			var state = states.get(this);
			var epoch = state.epoch;
			var key = await refreshedKey(input, publicArmor, state.config, true);
			var unlocked;
			try {
				if (!key.isPrivate()) { fail('A protected private key is required.'); }
				try { unlocked = await pgp.decryptKey({privateKey: key, passphrase: passphrase(password, false), config: state.config}); }
				catch (error) { fail('The passphrase could not unlock this private key.', 'OPENPGP_BAD_PASSPHRASE'); }
				var fp = fingerprint(key.getFingerprint());
				checkEpoch(this, epoch, []);
				var previous = state.keys.get(fp);
				if (previous) { clearTimeout(previous.timer); wipe(previous.key); }
				var expires = Date.now() + boundedTtl(ttlSeconds === undefined ? state.ttl : ttlSeconds) * 1000;
				var timer = setTimeout(this.lock.bind(this, fp), expires - Date.now());
				if (timer.unref) { timer.unref(); }
				state.keys.set(fp, {key: unlocked, expires: expires, timer: timer});
				unlocked = null;
				return {fingerprint: fp, expires: Math.floor(expires / 1000)};
			} finally { wipe(key); wipe(unlocked); }
		}

		lock(fp) {
			var state = states.get(this);
			fp = fp === undefined ? undefined : fingerprint(fp);
			state.epoch++;
			var targets = fp === undefined ? Array.from(state.keys.keys()) : [fp];
			targets.forEach(function(id) {
				var entry = state.keys.get(id);
				if (entry) { clearTimeout(entry.timer); wipe(entry.key); state.keys.delete(id); }
			});
			// Notify only after key destruction. A broken UI observer must neither
			// prevent locking nor prevent other observers erasing their plaintext.
			Array.from(state.listeners).forEach(function(listener) {
				try { listener(fp); } catch (error) { /* No sensitive diagnostics. */ }
			});
		}

		onLock(listener) {
			if (typeof listener !== 'function') { fail('An OpenPGP lock observer must be a function.'); }
			var listeners = states.get(this).listeners;
			listeners.add(listener);
			return function() { listeners.delete(listener); };
		}

		unlocked() {
			var state = states.get(this);
			var out = [];
			state.keys.forEach(function(entry, fp) {
				if (entry.expires <= Date.now()) { this.lock(fp); }
				else { out.push({fingerprint: fp, expires: Math.floor(entry.expires / 1000)}); }
			}, this);
			return out;
		}

		destroy() {
			this.lock();
			var state = states.get(this);
			if (state.pagehide) { globalThis.removeEventListener('pagehide', state.pagehide); }
			state.listeners.clear();
		}

		async sign(data, signer) {
			var state = states.get(this), fp = fingerprint(signer), key = active(this, fp), epoch = state.epoch;
			var message = await pgp.createMessage({binary: bytes(data, state.limit)});
			var signature = await pgp.sign({message: message, signingKeys: key, detached: true, format: 'armored', config: state.config});
			checkEpoch(this, epoch, [fp]);
			var parsed = await pgp.readSignature({armoredSignature: signature, config: state.config});
			var digests = Array.from(new Set(parsed.packets.map(function(packet) { return DIGESTS[packet.hashAlgorithm]; })));
			if (digests.length !== 1 || !digests[0]) { fail('Unsupported detached signature digest.'); }
			return {signature: signature, micalg: digests[0]};
		}

		async encrypt(data, recipientArmors, signer) {
			var state = states.get(this), epoch = state.epoch;
			var recipients = await publicKeys(recipientArmors, state.config);
			if (!recipients.length) { fail('Every recipient needs a verified OpenPGP public key.'); }
			var fp = signer ? fingerprint(signer) : null;
			var key = fp ? active(this, fp) : undefined;
			var message = await pgp.createMessage({binary: bytes(data, state.limit)});
			var result = await pgp.encrypt({message: message, encryptionKeys: recipients, signingKeys: key,
				wildcard: true, format: 'armored', config: state.config});
			checkEpoch(this, epoch, fp ? [fp] : []);
			if (result.length > state.limit * 2) { fail('Encrypted message exceeds the size limit.'); }
			return result;
		}

		async decrypt(input, verificationArmors) {
			var state = states.get(this);
			var entries = this.unlocked();
			if (!entries.length) { fail('Unlock your OpenPGP private key in this browser tab first.', 'OPENPGP_LOCKED'); }
			var keys = entries.map(function(entry) { return active(this, entry.fingerprint); }, this);
			var epoch = state.epoch;
			var verification = await publicKeys(verificationArmors || [], state.config);
			var options = {config: state.config};
			if (typeof input === 'string') { options.armoredMessage = armor(input, 'MESSAGE', state.limit * 2); }
			else { options.binaryMessage = bytes(input, state.limit * 2); }
			var message = await pgp.readMessage(options);
			var result = await pgp.decrypt({message: message, decryptionKeys: keys, verificationKeys: verification, format: 'binary', config: state.config});
			bytes(result.data, state.limit);
			var signatures = await signatureResults(result.signatures, verification, state.config);
			checkEpoch(this, epoch, entries.map(function(entry) { return entry.fingerprint; }), result.data);
			return {data: result.data, signatures: signatures, valid: signatures.length > 0 && signatures.every(function(sig) { return sig.valid; }), integrity: true};
		}

		async verify(data, signature, verificationArmors) {
			var state = states.get(this);
			var keys = await publicKeys(verificationArmors || [], state.config);
			var parsed = await pgp.readSignature({armoredSignature: armor(signature, 'SIGNATURE', KEY_LIMIT), config: state.config});
			var result = await pgp.verify({message: await pgp.createMessage({binary: bytes(data, state.limit)}), signature: parsed,
				verificationKeys: keys, format: 'binary', config: state.config});
			var signatures = await signatureResults(result.signatures, keys, state.config);
			return {data: data, signatures: signatures, valid: signatures.length > 0 && signatures.every(function(sig) { return sig.valid; })};
		}

		async verifyCleartext(input, verificationArmors) {
			var state = states.get(this);
			if (typeof input !== 'string' || input.length > state.limit || !/^-----BEGIN PGP SIGNED MESSAGE-----\r?\n/.test(input) ||
				(input.match(/-----BEGIN PGP SIGNED MESSAGE-----/g) || []).length !== 1) { fail('Expected one complete clear-signed OpenPGP message.'); }
			var start = input.indexOf('-----BEGIN PGP SIGNATURE-----');
			if (start < 0 || (input[start - 1] !== '\n')) { fail('Invalid clear-signed OpenPGP signature.'); }
			armor(input.slice(start), 'SIGNATURE', KEY_LIMIT);
			var keys = await publicKeys(verificationArmors || [], state.config);
			var message = await pgp.readCleartextMessage({cleartextMessage: input, config: state.config});
			var result = await pgp.verify({message: message, verificationKeys: keys, config: state.config});
			var signatures = await signatureResults(result.signatures, keys, state.config);
			return {data: new TextEncoder().encode(result.data), signatures: signatures, valid: signatures.length > 0 && signatures.every(function(sig) { return sig.valid; })};
		}

		static utf8(value) { return new TextEncoder().encode(String(value)); }
		static decodeUtf8(value) { return new TextDecoder('utf-8').decode(bytes(value, 100 * 1024 * 1024)); }
		static binaryString(value) {
			bytes(value, 100 * 1024 * 1024);
			var result = '';
			for (var i = 0; i < value.length; i += 8192) { result += String.fromCharCode.apply(null, value.subarray(i, i + 8192)); }
			return result;
		}
		static fromBinaryString(value) {
			if (typeof value !== 'string' || value.length > 100 * 1024 * 1024 || /[^\x00-\xff]/.test(value)) { fail('Invalid binary string.'); }
			var result = new Uint8Array(value.length);
			for (var i = 0; i < value.length; i++) { result[i] = value.charCodeAt(i); }
			return result;
		}
		static toBase64(value) { return btoa(BrowserCrypto.binaryString(value)); }
		static fromBase64(value) {
			if (typeof value !== 'string' || value.length > 140 * 1024 * 1024 || value.length % 4 || /[^A-Za-z0-9+/=]/.test(value)) { fail('Invalid base64 data.'); }
			// Avoid a repeated-group regular expression: V8 overflows its regexp
			// stack on otherwise valid multi-megabyte attachment strings.
			var padding = value.indexOf('=');
			if (padding !== -1 && value.slice(padding) !== '=' && value.slice(padding) !== '==') { fail('Invalid base64 padding.'); }
			return BrowserCrypto.fromBinaryString(atob(value));
		}
	}
	BrowserCrypto.VERSION = '6.3.1';
	return BrowserCrypto;
});
