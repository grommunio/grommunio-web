Ext.namespace('Zarafa.plugins.pgp');

/** Presentation, mailbox persistence, and access to the browser-only crypto service. */
Zarafa.plugins.pgp.PgpUtils = {
	encode: function(value)
	{
		return Ext.util.Format.htmlEncode(String(value === undefined || value === null ? '' : value));
	},
	fingerprint: function(value)
	{
		return String(value || '').replace(/\s/g, '').toUpperCase();
	},
	isFingerprint: function(value)
	{
		return /^(?:[A-F0-9]{40}|[A-F0-9]{64})$/.test(this.fingerprint(value));
	},
	formatFingerprint: function(value)
	{
		return this.fingerprint(value).replace(/(.{4})(?=.)/g, '$1 ');
	},
	crypto: function()
	{
		var namespace = Zarafa.plugins.pgp.crypto;
		if (!namespace.browserCrypto) { namespace.browserCrypto = new namespace.BrowserCrypto(); }
		return namespace.browserCrypto;
	},
	api: function(operation, payload)
	{
		return new Promise(function(resolve, reject) {
			container.getRequest().singleRequest('pluginpgpmodule', 'request',
				Ext.apply({operation: operation}, payload || {}),
				new Zarafa.plugins.pgp.data.PgpResponseHandler({callback: function(response) {
					if (response.success !== true) { reject(new Error(response.message || _('The OpenPGP operation failed.'))); }
					else {
						if (operation === 'list' && response.unlock_ttl) { Zarafa.plugins.pgp.PgpUtils.unlockTtl = Number(response.unlock_ttl); }
						var transport = Zarafa.plugins.pgp.PgpTransport;
						if (['put', 'delete', 'trust', 'keyservers'].indexOf(operation) !== -1 && transport && transport.keysChanged) {
							transport.keysChanged();
						}
						resolve(response);
					}
				}}));
		});
	},
	loadKey: function(fingerprint)
	{
		return this.api('get', {fingerprint: this.fingerprint(fingerprint)}).then(function(response) { return response.key; });
	},
	storeKey: function(key)
	{
		// Never send a decrypted key, password or private-key object through the Web request router.
		var utils = this;
		var stored = {fingerprint: key.fingerprint, public_key: key.public_key, metadata: key.metadata, revision: key.revision};
		var privateArmor = key.encrypted_private_key || key.private_key;
		if (privateArmor) { stored.encrypted_private_key = privateArmor; }
		return this.api('put', {key: stored}).then(function(response) {
			// Public updates may revoke an already unlocked private certificate.
			utils.crypto().lock(key.fingerprint);
			return response;
		});
	},
	importKey: function(key)
	{
		var utils = this;
		return this.api('list', {}).then(function(response) {
			var existing = (response.keys || []).some(function(item) { return item.fingerprint === key.fingerprint; });
			if (!existing) { return utils.storeKey(key); }
			return utils.loadKey(key.fingerprint).then(function(stored) {
				return utils.crypto().inspect(key.encrypted_private_key || key.public_key, stored.public_key).then(function(merged) {
					merged.revision = stored.revision;
					return utils.storeKey(merged);
				});
			});
		});
	},
	notify: function(message, error)
	{
		container.getNotifier().notify('info.saved', _('OpenPGP'), this.encode(message));
	},
	openSettings: function()
	{
		var context = container.getContextByName('settings');
		context.defaultActiveTab = 'pgp';
		container.switchContext(context);
		context.setView('pgp');
		container.getTabPanel().setActiveTab('zarafa-mainpanel-content');
	},
	isSmime: function(record)
	{
		return !!record && /^IPM\.Note\.deferSMIME(?:\.|$)/i.test(record.get('message_class') || '');
	},
	keyEmails: function(key)
	{
		var emails = [];
		Ext.each(key.uids || [], function(uid) {
			if (uid.email && !uid.revoked && !uid.expired && ['r', 'e', 'd', 'i'].indexOf(uid.validity) === -1 && emails.indexOf(uid.email) === -1) {
				emails.push(uid.email);
			}
		});
		return emails;
	},
	keyLabel: function(key)
	{
		return this.keyEmails(key).join(', ') + ' — ' + this.formatFingerprint(key.fingerprint);
	},
	algorithmLabel: function(key)
	{
		var names = {1: 'RSA', 2: 'RSA', 3: 'RSA', 16: 'ElGamal', 17: 'DSA', 18: 'ECDH', 19: 'ECDSA', 22: 'EdDSA', 27: 'Ed25519', 28: 'Ed448'};
		return (names[key.algorithm] || String(key.algorithm || _('Unknown'))) + (key.bits ? ' ' + key.bits : '');
	},
	usableKey: function(key, email, sign, encrypt)
	{
		return key.secret === true && !key.revoked && !key.expired && !key.disabled &&
			(!sign || key.can_sign === true) && (!encrypt || key.can_encrypt === true) &&
			this.keyEmails(key).some(function(address) {
				return address.toLowerCase() === String(email || '').toLowerCase();
			});
	},
	/** A valid signature is separate from an authenticated sender identity. */
	status: function(info)
	{
		var parts = [], severity = 'info';
		if (info.pending && !info.locked) { return {text: _('OpenPGP: checking message security…'), severity: 'info'}; }
		if (info.unverifiable) {
			return {text: 'OpenPGP: ' + (info.encrypted ? _('Encrypted message stored without its MIME envelope — save the attachment and decrypt it with an OpenPGP tool') :
				_('Signed message stored without its original MIME — the signature cannot be verified')), severity: 'warning'};
		}
		if (info.encrypted) {
			parts.push(info.decrypted ? _('Message decrypted') : info.error ?
				_('Message could not be decrypted — click for details or retry') : _('Encrypted message — unlock your private key to read'));
		}
		if (info.signed) {
			if (info.signature_valid !== true) {
				parts.push(_('Signature could not be verified'));
				severity = 'bad';
			} else if (info.sender_match !== true) {
				parts.push(_('Valid signature, but the signing key does not match the sender'));
				severity = 'warning';
			} else if (info.signer_trusted !== true) {
				parts.push(_('Valid signature — sender fingerprint has not been verified'));
				severity = 'warning';
			} else {
				parts.push(_('Valid signature from a verified sender'));
				severity = 'good';
			}
		} else if (info.decrypted) {
			parts.push(_('Message is not signed'));
		}
		if (info.inline) {
			parts.push(_('Inline OpenPGP protects the body only; attachments are not covered'));
		}
		if (info.error && info.message) { parts.push(String(info.message)); }
		if (severity !== 'bad' && (info.error || (info.encrypted && !info.decrypted && !info.locked))) {
			severity = 'warning';
		}
		return {text: 'OpenPGP: ' + (parts.join(' · ') || _('Security information')), severity: severity};
	},
	/** Only explicit OpenPGP metadata/classes identify the protocol. */
	icon: function(record)
	{
		var info = record.get('pgp') || {};
		var messageClass = record.get('pgp_message_class') || record.get('message_class') || '';
		if (info.encrypted || record.get('pgp_encrypted') || record.get('pgp_encrypt') || /^IPM\.Note\.GpgOL\.(?:MultipartEncrypted|PGPMessage)(?:\.|$)/i.test(messageClass)) {
			return 'icon_pgp_encrypt';
		}
		if (info.signed || record.get('pgp_signed') || record.get('pgp_sign') || /^IPM\.Note\.GpgOL\.(?:MultipartSigned|ClearSigned)(?:\.|$)/i.test(messageClass)) {
			return 'icon_pgp_sign';
		}
		return '';
	},
	request: function(operation, payload, callback, scope)
	{
		return this.api(operation, payload).then(function(response) {
			if (callback) { callback.call(scope || this, response); }
		}, function(error) {
			if (callback) { callback.call(scope || this, {success: false, message: error.message}); }
		});
	}
};
