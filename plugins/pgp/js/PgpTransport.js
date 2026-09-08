/* global PostalMime, DOMPurify, fflate */
Ext.namespace('Zarafa.plugins.pgp');

/**
 * The only bridge between mailbox transport and browser cryptography.
 * Drafts are ordinary MAPI drafts. Send freezes a saved snapshot, protects its
 * exact MIME bytes locally, then submits an expiring, draft-bound receipt.
 * Reading never uploads decrypted bodies or attachments.
 */
Zarafa.plugins.pgp.PgpTransport = (function() {
	'use strict';
	var states = new WeakMap(), displayed = new Map(), subscribed, epoch = 0, certificateEpoch = 0;
	var LIMIT = 50 * 1024 * 1024;
	var purifier = null, publicBundle = null;
	/** Decrypted HTML gets a stricter policy than ordinary mail, on an instance of its own. */
	function sanitize(html) {
		var strict = {FORBID_TAGS: ['style', 'form', 'input', 'button', 'svg', 'use', 'symbol', 'math'], FORBID_ATTR: ['srcset', 'background']};
		if (!purifier) {
			purifier = typeof DOMPurify === 'function' && typeof window !== 'undefined' ? DOMPurify(window) : DOMPurify;
			if (purifier !== DOMPurify && purifier.setConfig) {
				var base = (typeof Zarafa !== 'undefined' && Zarafa.sanitizerConfig) || {};
				purifier.setConfig(Ext.apply({}, base, {FORBID_TAGS: (base.FORBID_TAGS || []).concat(strict.FORBID_TAGS), FORBID_ATTR: strict.FORBID_ATTR, ADD_TAGS: []}));
			}
		}
		return purifier === DOMPurify ? DOMPurify.sanitize(html, strict) : purifier.sanitize(html);
	}
	/** One verification bundle per keyring state; a failed load never blocks decryption. */
	function publicKeysBundle() {
		if (!publicBundle) {
			publicBundle = utils().api('public', {}).then(function(response) { return response.keys || []; });
			publicBundle.catch(function() { publicBundle = null; });
		}
		return publicBundle;
	}
	function utils() { return Zarafa.plugins.pgp.PgpUtils; }
	function crypto() {
		var service = utils().crypto();
		if (subscribed !== service) {
			subscribed = service;
			service.onLock(function() {
				epoch++;
				displayed.forEach(function(state, record) {
					if (state.info.encrypted) { clear(record, state); }
				});
			});
		}
		return service;
	}
	function bytes() { return Zarafa.plugins.pgp.crypto.BrowserCrypto; }
	function mime() { return Zarafa.plugins.pgp.crypto.PgpMime; }
	function dialogs() { return Zarafa.plugins.pgp.dialogs.PgpDialogs; }
	function error(message, code) { var result = new Error(message); result.code = code; return result; }
	function cancelled() { var failure = error(_('The OpenPGP operation was cancelled.'), 'OPENPGP_CANCELLED'); failure.cancelled = true; return failure; }
	function active(dialog, record) {
		if (dialog.isDestroyed || dialog.destroyed || dialog.record !== record) { throw cancelled(); }
		if (utils().isSmime(record)) { throw error(_('S/MIME and OpenPGP cannot protect the same message.')); }
	}
	function sender(record) {
		var address = record.get('sent_representing_smtp_address');
		if (!address && record.getSentRepresenting) {
			var identity = record.getSentRepresenting();
			address = identity && identity.get('smtp_address');
		}
		return String(address || container.getUser().getSMTPAddress()).toLowerCase();
	}
	function matches(key, email) {
		return utils().keyEmails(key).some(function(address) { return address.toLowerCase() === String(email).toLowerCase(); });
	}
	function forceIntent(record) {
		['pgp_sign', 'pgp_encrypt', 'pgp_key'].forEach(function(name) { record.set(name, record.get(name), true); });
	}
	/** Resolve after the store has cleared the draft save's message actions. */
	function saveSnapshot(dialog, record) {
		return new Promise(function(resolve, reject) {
			var saved = dialog.modalRecord || record, store = saved.getStore(), finished = false;
			var closeOnSave = dialog.closeOnSave;
			var timeout = setTimeout(function() { finish(error(_('Saving the OpenPGP draft timed out. Please retry.'))); }, 120000);
			function cleanup() {
				clearTimeout(timeout);
				store.un('write', written);
				store.un('exception', failed);
				dialog.un('destroy', destroyed);
				dialog.closeOnSave = closeOnSave;
			}
			function finish(failure) {
				if (finished) { return; }
				finished = true;
				cleanup();
				if (failure) { reject(failure); return; }
				// The normal COMMIT unlocks the draft UI. Re-lock for crypto and
				// the final send, after the entire synchronous write dispatch.
				setTimeout(function() {
					try {
						active(dialog, record);
						dialog.isSending = true;
						dialog.lockPendingAction(dialog.sendingText.msg);
						resolve();
					} catch (failure) { reject(failure); }
				}, 0);
			}
			function written(source, action, result, response, records) {
				if ((Array.isArray(records) ? records : [records]).indexOf(saved) !== -1) { finish(); }
			}
			function failed(proxy, type, action, options, response, args) {
				var affected = args && args.sendRecords;
				if (affected && affected !== saved && !(Array.isArray(affected) && affected.indexOf(saved) !== -1)) { return; }
				finish(error(_('The draft could not be saved. Nothing was sent.')));
			}
			function destroyed() { finish(cancelled()); }
			store.on('write', written);
			store.on('exception', failed);
			dialog.on('destroy', destroyed);
			try {
				record.deleteMessageAction('pgp');
				record.deleteMessageAction('send');
				forceIntent(record);
				dialog.forceSendAsIdentityTransmission();
				if (saved !== record && Ext.isFunction(saved.applyData)) { saved.applyData(record); }
				// saveRecord() issues no request for an unmodified draft; prepare()
				// then reads the stored copy, which already equals this record.
				if (!saved.phantom && store.modified.indexOf(saved) === -1) { finish(); return; }
				dialog.closeOnSave = false;
				dialog.isSending = false;
				if (dialog.saveRecord() === false) { finish(error(_('The draft could not be saved. Nothing was sent.'))); }
				// Keep the send guard active while the draft request is in flight.
				dialog.isSending = true;
			} catch (failure) { finish(failure); }
		});
	}
	async function protect(dialog, record) {
		active(dialog, record);
		var sign = record.get('pgp_sign') === true, encrypt = record.get('pgp_encrypt') === true;
		if (!sign && !encrypt) { return; }
		var listing = await utils().api('list', {});
		active(dialog, record);
		var candidates = (listing.keys || []).filter(function(key) { return utils().usableKey(key, sender(record), sign, encrypt); });
		var current = record.get('pgp_key') || listing.default_key;
		var key = candidates.filter(function(candidate) { return candidate.fingerprint === current; })[0];
		if (!key) { key = await dialogs().chooseKeyAsync(candidates, current); }
		active(dialog, record);
		record.set('pgp_key', key.fingerprint);
		await saveSnapshot(dialog, record);
		active(dialog, record);
		var prepared = await utils().api('prepare', {entryid: record.get('entryid'), store_entryid: record.get('store_entryid')});
		active(dialog, record);
		if (prepared.sign !== sign || prepared.encrypt !== encrypt || prepared.key.fingerprint !== key.fingerprint ||
			String(prepared.sender).toLowerCase() !== sender(record)) {
			throw error(_('The sender or message protection changed. Please send again.'));
		}
		var service = crypto();
		// Mailbox metadata is advisory. Validate self-signatures, expiration,
		// revocation, capabilities and the sender UID against actual packets.
		var checked = (await service.inspect(prepared.key.public_key)).metadata;
		if (checked.fingerprint !== key.fingerprint || checked.revoked || checked.expired || checked.disabled ||
			!matches(checked, prepared.sender) || (sign && !checked.can_sign) || (encrypt && !checked.can_encrypt)) {
			throw error(_('The selected private key is not valid for this sender and protection mode.'));
		}
		var secret = (await service.inspect(prepared.key.encrypted_private_key, prepared.key.public_key)).metadata;
		if (secret.fingerprint !== key.fingerprint || !secret.secret || !secret.protected) {
			throw error(_('A matching, passphrase-protected private key is required.'));
		}
		var recipientKeys = [];
		if (encrypt) {
			for (var recipient of prepared.recipients) {
				var verified = (await service.inspect(recipient.public_key)).metadata;
				if (verified.fingerprint !== recipient.fingerprint || !verified.can_encrypt || verified.expired || verified.revoked || verified.disabled || !matches(verified, recipient.email)) {
					throw error(_('A recipient key is invalid, expired or does not match its email address.') + ' ' + recipient.email);
				}
				recipientKeys.push(recipient.public_key);
			}
			if (!recipientKeys.length) { throw error(_('No verified recipient keys are available.')); }
		}
		if (sign && !service.unlocked().some(function(entry) { return entry.fingerprint === key.fingerprint; })) {
			await dialogs().unlockAsync(key.fingerprint);
		}
		active(dialog, record);
		var entity = bytes().fromBase64(prepared.mime), envelope;
		if (entity.length > LIMIT) { throw error(_('This message is too large for browser OpenPGP processing.')); }
		if (encrypt) {
			envelope = mime().encrypted(await service.encrypt(entity, recipientKeys, sign ? key.fingerprint : undefined));
		} else {
			var signature = await service.sign(entity, key.fingerprint);
			envelope = mime().signed(entity, signature.signature, signature.micalg);
		}
		active(dialog, record);
		if (record.get('pgp_sign') !== sign || record.get('pgp_encrypt') !== encrypt || record.get('pgp_key') !== key.fingerprint) {
			throw error(_('Message protection changed while preparing the message. Please send again.'));
		}
		var encoded = bytes().toBase64(envelope), maximum = Number(utils().maxEnvelopeBytes) || 0;
		if (maximum && encoded.length > maximum) {
			throw error(String.format(_('The protected message is {0} MB, more than this server accepts in one request ({1} MB). Remove attachments or ask the administrator to raise the upload limit.'),
				(encoded.length / 1048576).toFixed(1), (maximum / 1048576).toFixed(1)));
		}
		forceIntent(record);
		record.addMessageAction('pgp', {token: prepared.token, envelope: encoded});
	}
	function refresh(record) {
		if (record.clearSanitizedHtmlBody) { record.clearSanitizedHtmlBody(); }
		var store = record.getStore();
		if (store && !store.isDestroyed) { store.fireEvent('update', store, record, Ext.data.Record.COMMIT); }
	}
	function attachments(record, records) {
		var store = record.getAttachmentStore();
		store.localOnly = true;
		// Loading is a read, not add/remove edits. Never enlist plaintext view
		// attachments in a subsequent mark-read/flag update sent to the server.
		store.modified = [];
		store.removed = [];
		store.loadRecords({records: records, totalRecords: records.length}, {}, true);
		record.data.hasattach = records.length > 0;
	}
	function revoke(state) {
		(state.urls || []).forEach(function(url) { URL.revokeObjectURL(url); });
		state.urls = [];
		(state.attachments || []).forEach(function(attachment) {
			var local = attachment.localContent;
			if (local) { local.blob = null; local.bytes.fill(0); local.url = ''; local.inlineUrl = ''; }
		});
		state.attachments = [];
	}
	function clear(record, state) {
		revoke(state);
		displayed.delete(record);
		if (record.isUnsent && record.isUnsent()) { return; }
		record.data.body = '';
		record.data.html_body = '';
		record.data.isHTML = false;
		record.data.pgp = Ext.apply({}, state.info);
		record.data.pgp.locked = state.info.encrypted;
		record.data.pgp.pending = true;
		if (!state.info.inline) { attachments(record, []); }
		refresh(record);
	}
	function safeName(value) {
		return String(value || _('Attachment')).replace(/[\\/\x00-\x1f\x7f]/g, '_').replace(/^\.+$/, '_').slice(0, 240) || 'attachment';
	}
	function download(url, name) {
		var link = document.createElement('a');
		link.href = url;
		link.download = safeName(name);
		link.rel = 'noopener';
		document.body.appendChild(link);
		link.click();
		link.remove();
	}
	function zip(records, state) {
		if (!records.length || records.some(function(record) { return !record.localContent || !record.localContent.blob; })) { return ''; }
		var files = Object.create(null), total = 0;
		records.forEach(function(record) {
			var data = record.localContent.bytes, name = safeName(record.get('name')), index = 1, original = name;
			total += data.length;
			if (total > LIMIT) { throw error(_('The attachment archive is too large.')); }
			while (Object.prototype.hasOwnProperty.call(files, name)) { name = (index++) + '-' + original; }
			files[name] = data;
		});
		var url = URL.createObjectURL(new Blob([fflate.zipSync(files, {level: 0})], {type: 'application/zip'}));
		state.urls.push(url);
		return url;
	}
	function localAttachment(item, state, html) {
		var content = item.content instanceof Uint8Array ? item.content : new Uint8Array(item.content);
		var type = String(item.mimeType || 'application/octet-stream').toLowerCase();
		var name = safeName(item.filename), cid = String(item.contentId || '').replace(/^<|>$/g, '');
		// A same-origin blob: URL must never be a navigable document of the sender's choosing.
		var blob = new Blob([content], {type: 'application/octet-stream'});
		var url = URL.createObjectURL(blob);
		state.urls.push(url);
		var attachment = Zarafa.core.data.RecordFactory.createRecordObjectByCustomType(Zarafa.core.mapi.ObjectType.MAPI_ATTACH, {
			// Only files the body references are inline; a Content-ID alone keeps a file visible.
			name: name, size: content.length, filetype: type, cid: cid, hidden: !!cid && html.indexOf('cid:' + cid) !== -1,
			attach_method: Zarafa.core.mapi.AttachMethod.ATTACH_BY_VALUE, attach_num: -1,
			extension: name.indexOf('.') < 0 ? '' : name.split('.').pop().toLowerCase()
		});
		attachment.phantom = false;
		attachment.localContent = {
			blob: blob, bytes: content, url: url,
			// SVG/HTML are never rendered inline, even if a sender labels them
			// as an image. Data images survive the normal DOMPurify pipeline.
			inlineUrl: /^(?:image\/(?:png|jpeg|gif|webp|avif))$/.test(type) ? 'data:' + type + ';base64,' + bytes().toBase64(content) : '',
			zip: function(records) { return zip(records, state); },
			download: function(allAsZip) {
				if (!this.blob) { utils().notify(_('Unlock the message again to download this attachment.'), true); return; }
				if (allAsZip) { download(zip(state.attachments, state), 'attachments.zip'); }
				else { download(this.url, name); }
			}
		};
		return attachment;
	}
	async function decode(record, state) {
		var service = crypto(), startEpoch = epoch, startCertificateEpoch = certificateEpoch, info = Ext.apply({}, state.info);
		var keys = [];
		try { keys = await publicKeysBundle(); }
		catch (failure) { info.bundle_error = true; }
		var publicArmors = keys.map(function(key) { return key.public_key; });
		var data = bytes().fromBase64(info.mime), signatures = [], result, inline = info.format === 'inline';
		if (data.length > LIMIT) { throw error(_('This message is too large for browser OpenPGP processing.')); }
		if (inline) {
			var armored = bytes().decodeUtf8(data), marker = info.encrypted ? '-----END PGP MESSAGE-----' : '-----END PGP SIGNATURE-----';
			var end = armored.indexOf(marker);
			if (end !== -1) {
				// Mailer footers after the block are unprotected and stay hidden.
				info.trailer = armored.slice(end + marker.length).trim() !== '';
				armored = armored.slice(0, end + marker.length);
			}
			if (info.encrypted) { result = await service.decrypt(armored, publicArmors); info.decrypted = true; }
			else { result = await service.verifyCleartext(armored, publicArmors); }
			data = result.data;
			signatures = result.signatures;
		} else {
			for (var depth = 0; depth < 4; depth++) {
				var envelope = mime().parse(data);
				if (envelope.kind === 'plain') { break; }
				if (envelope.kind === 'smime') { throw error(_('This message contains nested S/MIME protection that OpenPGP cannot open.')); }
				if (envelope.kind === 'encrypted') {
					// The outer envelope can be signed around encrypted content.
					// Its effective confidentiality must also drive lock cleanup.
					state.info.encrypted = true;
					result = await service.decrypt(envelope.ciphertext, publicArmors);
					info.decrypted = true;
					info.encrypted = true;
				} else {
					result = await service.verify(envelope.entity, envelope.signature, publicArmors);
					info.signed = true;
				}
				data = result.data;
				signatures = signatures.concat(result.signatures);
			}
			if (depth === 4 && mime().parse(data).kind !== 'plain') { throw error(_('Too many nested OpenPGP envelopes.')); }
		}
		info.signed = info.signed || signatures.length > 0;
		info.signature_valid = signatures.length > 0 && signatures.every(function(signature) { return signature.valid === true; });
		info.signer_expired = signatures.some(function(signature) { return signature.valid === true && signature.expired === true; });
		info.sender_match = info.signature_valid && signatures.every(function(signature) { return matches(signature, info.sender); });
		info.signer_trusted = info.sender_match && signatures.every(function(signature) {
			return keys.some(function(key) {
				return key.fingerprint === signature.primary_fingerprint && (key.trusted_emails || []).some(function(email) { return email.toLowerCase() === String(info.sender).toLowerCase(); });
			});
		});
		info.fingerprint = signatures.map(function(signature) { return signature.primary_fingerprint; }).filter(Boolean).join(', ');
		info.signatures = signatures;
		info.locked = false;
		info.pending = false;
		info.error = false;
		info.message = info.signed && !info.signature_valid ? _('The signature is invalid or its public key is not available. Do not rely on this sender identity.') : '';
		var parsed = inline ? {text: bytes().decodeUtf8(data), attachments: []} : await PostalMime.parse(data, {attachmentEncoding: 'arraybuffer', maxNestingDepth: 32, maxHeadersSize: 65536, forceRfc822Attachments: true});
		if (states.get(record) !== state || record.get('pgp').mime !== state.info.mime) { data.fill(0); throw cancelled(); }
		if (startCertificateEpoch !== certificateEpoch) { data.fill(0); state.recheck = true; throw cancelled(); }
		if (info.encrypted && startEpoch !== epoch) { data.fill(0); throw error(_('The private key was locked while opening this message.'), 'OPENPGP_LOCKED'); }
		if ((parsed.attachments || []).length > 200) { throw error(_('This message contains too many attachments.')); }
		var total = 0;
		(parsed.attachments || []).forEach(function(item) { total += item.content.byteLength; });
		if (total > LIMIT) { throw error(_('The decoded attachments are too large.')); }
		// Sanitization is mandatory for OpenPGP regardless of the global mail
		// setting. Remote pictures are blocked when rendered, like ordinary mail,
		// so the usual per-message download choice stays available.
		var html = parsed.html ? sanitize(parsed.html) : '';
		revoke(state);
		state.attachments = (parsed.attachments || []).map(function(item) { return localAttachment(item, state, html); });
		record.data.body = parsed.text || '';
		record.data.html_body = html;
		record.data.isHTML = !!html;
		record.data.pgp = info;
		if (!inline) { attachments(record, state.attachments); }
		displayed.set(record, state);
		// Bound retained plaintext previews, including attachment blob URLs.
		if (displayed.size > 20) {
			var oldest = displayed.keys().next().value;
			clear(oldest, displayed.get(oldest));
		}
		refresh(record);
		return record;
	}
	return {
		/** Recheck cached security badges after a certificate or fingerprint pin changes. */
		keysChanged: function() {
			certificateEpoch++;
			publicBundle = null;
			displayed.forEach(function(state, record) {
				if (record.isUnsent && record.isUnsent()) { return; }
				var info = record.get('pgp');
				if (!info) { return; }
				info.pending = true;
				info.signature_valid = false;
				info.signer_trusted = false;
				info.sender_match = false;
				if (state.promise) { state.recheck = true; }
				refresh(record);
			});
		},
		install: function(dialog) {
			if (dialog.pgpTransportInstalled) { return; }
			dialog.pgpTransportInstalled = true;
			dialog.sendValidationQueue.add(function(callback) {
				var record = dialog.record;
				if (!record.get('pgp_sign') && !record.get('pgp_encrypt')) { callback(true); return; }
				if (dialog.pgpPreparing) { callback(false); return; }
				dialog.pgpPreparing = true;
				protect(dialog, record).then(function() {
					dialog.pgpPreparing = false;
					if (!dialog.isDestroyed) { callback(true); }
				}, function(failure) {
					dialog.pgpPreparing = false;
					record.deleteMessageAction('pgp');
					if (!dialog.isDestroyed) {
						if (!failure.cancelled && failure.code !== 'OPENPGP_CANCELLED') { utils().notify(failure.message, true); }
						callback(false);
					}
				});
			}, dialog);
		},
		/** Track a copied read view as well, so locking clears pop-out plaintext. */
		observe: function(record) {
			var info = record && record.get('pgp');
			if (!info || !info.mime || info.pending || !info.decrypted || states.has(record)) { return; }
			crypto();
			var original = Ext.apply({}, info);
			original.decrypted = false;
			original.signature_valid = false;
			original.sender_match = false;
			original.signer_trusted = false;
			original.pending = true;
			original.locked = original.encrypted;
			var state = {info: original, urls: [], attachments: []};
			states.set(record, state);
			displayed.set(record, state);
			if (!crypto().unlocked().length) { clear(record, state); }
		},
		open: function(record) {
			var info = record && record.get('pgp');
			if (!info || !info.pending || !info.mime) { return Promise.resolve(record); }
			var state = states.get(record);
			if (!state || state.info.mime !== info.mime) {
				if (state) { revoke(state); }
				state = {info: Ext.apply({}, info), urls: [], attachments: []};
				states.set(record, state);
			}
			if (state.promise) { return state.promise; }
			if (info.encrypted && !crypto().unlocked().length) { return Promise.resolve(record); }
			state.promise = decode(record, state).catch(function(failure) {
				if (states.get(record) !== state) { revoke(state); throw failure; }
				clear(record, state);
				var status = record.data.pgp;
				status.pending = false;
				status.locked = status.encrypted;
				status.error = true;
				status.message = failure.message;
				refresh(record);
				throw failure;
			}).finally(function() {
				state.promise = null;
				if (state.recheck && states.get(record) === state) {
					state.recheck = false;
					record.data.pgp.pending = true;
					refresh(record);
				}
			});
			// Preview components do not await promises; retain a handled branch
			// without swallowing the rejection for explicit reply/open callers.
			state.promise.catch(function() {});
			return state.promise;
		},
		unlockAndOpen: async function(record) {
			var info = record && record.get('pgp');
			if (!info || !info.mime) { return record; }
			var listing = await utils().api('list', {});
			// Old/revoked keys may still be needed to read historical mail.
			// They remain forbidden for new signing/encryption operations.
			var keys = (listing.keys || []).filter(function(key) { return key.secret; });
			var key = await dialogs().chooseKeyAsync(keys, listing.default_key);
			await dialogs().unlockAsync(key.fingerprint);
			info.pending = true;
			return this.open(record);
		},
		/** Download a selected local ZIP without any server attachment request. */
		download: download,
		// Exposed for focused lifecycle tests, not a second application API.
		_saveSnapshot: saveSnapshot,
		_protect: protect
	};
})();
