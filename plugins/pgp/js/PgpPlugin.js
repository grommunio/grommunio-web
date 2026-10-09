/*
 * SPDX-FileCopyrightText: Copyright 2020 - 2026 grommunio GmbH
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

Ext.namespace('Grommunio.plugins.pgp');

/** OpenPGP/MIME presentation; private-key unlocking stays in the browser. */
Grommunio.plugins.pgp.PgpPlugin = Ext.extend(Grommunio.core.Plugin, {
	initPlugin: function()
	{
		Grommunio.plugins.pgp.PgpPlugin.superclass.initPlugin.apply(this, arguments);
		Grommunio.common.ui.SecurityButtons.register(this.securityProvider());
		this.registerInsertionPoint('context.settings.categories', this.settingsCategory, this);
		this.registerInsertionPoint('previewpanel.toolbar.detaillinks', this.previewInfo, this);
		this.registerInsertionPoint('context.mail.griddefaultcolumn', this.defaultColumn, this);
		this.registerInsertionPoint('context.mail.gridrow', this.compactColumn, this);
		this.registerInsertionPoint('common.contextmenu.attachment.actions', this.attachmentImportItem, this);
	},
	settingsCategory: function(insertionName, panel, settingsContext)
	{
		return [{xtype: 'pgp.settingscategory', settingsContext: settingsContext}];
	},
	securityProvider: function()
	{
		var plugin = this;
		return {id: 'pgp', label: 'OpenPGP', priority: 20,
			// OpenPGP drafts hold plaintext, so pause autosave while encryption is selected.
			suspendsAutoSave: true,
			isSelected: function(record, action) { return record.get('pgp_' + action) === true; },
			setAction: function(dialog, action, enabled) { plugin.setProtection(dialog, action, enabled); },
			attach: function(dialog) { plugin.attachCompose(dialog); },
			getOptions: function(action, dialog) {
				return [{text: _('Choose private key…'), iconCls: 'icon_pgp_key', handler: function() {
					plugin.selectComposeKey(dialog, dialog.record.get('pgp_sign'), dialog.record.get('pgp_encrypt'), true, function(key) {
						if (!dialog.isDestroyed && !Grommunio.plugins.pgp.PgpUtils.isSmime(dialog.record)) {
							dialog.record.set('pgp_key', key.fingerprint);
							dialog.securityPreferredProtocol = 'pgp';
						}
					});
				}}, {text: _('Manage OpenPGP keys…'), handler: function() { Grommunio.plugins.pgp.PgpUtils.openSettings(); }},
				{text: _('Lock private keys'), handler: function() { Grommunio.plugins.pgp.PgpUtils.crypto().lock(); }}];
			}
		};
	},
	attachCompose: function(dialog)
	{
		Grommunio.plugins.pgp.PgpTransport.install(dialog);
		var record = dialog.record;
		if (!record.pgpDefaultsApplied) {
			record.pgpDefaultsApplied = true;
			if (record.phantom && !Grommunio.plugins.pgp.PgpUtils.isSmime(record) && !record.get('pgp_sign') && !record.get('pgp_encrypt')) {
				var settings = container.getSettingsModel();
				record.beginEdit();
				record.set('pgp_sign', settings.get('grommunio/v1/plugins/pgp/default_sign', false));
				record.set('pgp_encrypt', settings.get('grommunio/v1/plugins/pgp/default_encrypt', false));
				record.set('pgp_key', settings.get('grommunio/v1/plugins/pgp/default_key', ''));
				record.endEdit();
			}
		}
	},
	setProtection: function(dialog, action, enabled)
	{
		if (!dialog || !dialog.record || (enabled && Grommunio.plugins.pgp.PgpUtils.isSmime(dialog.record))) { return; }
		// Selecting protection records intent only. Send validation offers setup or
		// local unlocking when needed; no passphrase enters the message record.
		dialog.record.set('pgp_' + action, enabled === true);
		if (enabled && !dialog.record.get('pgp_key')) {
			dialog.record.set('pgp_key', container.getSettingsModel().get('grommunio/v1/plugins/pgp/default_key', ''));
		}
	},
	senderAddress: function(record)
	{
		var address = record.get('sent_representing_smtp_address');
		if (!address && record.getSentRepresenting) {
			var sender = record.getSentRepresenting();
			address = sender && sender.get('smtp_address');
		}
		return address || container.getUser().getSMTPAddress();
	},
	selectComposeKey: function(dialog, sign, encrypt, forceChoice, callback)
	{
		var record = dialog.record, utils = Grommunio.plugins.pgp.PgpUtils, email = this.senderAddress(record);
		utils.api('list', {}).then(function(response) {
			if (dialog.isDestroyed || dialog.record !== record || utils.isSmime(record)) { return; }
			var keys = (response.keys || []).filter(function(key) { return utils.usableKey(key, email, sign, encrypt); });
			var current = record.get('pgp_key') || container.getSettingsModel().get('grommunio/v1/plugins/pgp/default_key', '');
			var selected = keys.filter(function(key) { return key.fingerprint === current; })[0];
			if (!forceChoice && selected) { callback(selected); }
			else { Grommunio.plugins.pgp.dialogs.PgpDialogs.chooseKey(keys, current, callback); }
		}).catch(function(error) { utils.notify(error.message, true); });
	},
	previewInfo: function()
	{
		var plugin = this;
		return {xtype: 'button', cls: 'pgp-info', hidden: true,
			plugins: ['grommunio.recordcomponentupdaterplugin'],
			update: function(record) {
				this.record = record;
				if (record) { Grommunio.plugins.pgp.PgpTransport.observe(record); }
				var info = record && record.get('pgp');
				this.setVisible(!!(record && record.isOpened() && info));
				if (!info) { return; }
				if (record.isOpened() && info.pending) { Grommunio.plugins.pgp.PgpTransport.open(record); }
				var status = Grommunio.plugins.pgp.PgpUtils.status(info);
				this.removeClass(['pgp-info-good', 'pgp-info-bad', 'pgp-info-warning', 'pgp-info-info']);
				this.addClass('pgp-info-' + status.severity);
				this.setText(Grommunio.plugins.pgp.PgpUtils.encode(status.text));
			},
			handler: plugin.onPreviewInfo, scope: plugin
		};
	},
	onPreviewInfo: function(button)
	{
		var record = button.record, info = record && record.get('pgp'), utils = Grommunio.plugins.pgp.PgpUtils;
		if (!info) { return; }
		if (info.encrypted && !info.decrypted && info.mime && !info.unverifiable) {
			Grommunio.plugins.pgp.PgpTransport.unlockAndOpen(record).catch(function(error) { if (!error.cancelled) { utils.notify(error.message, true); } });
			return;
		}
		var details = utils.encode(utils.status(info).text);
		if (info.fingerprint) { details += '<br><br>' + String.format(_('Signing key: {0}'), utils.encode(utils.formatFingerprint(info.fingerprint))); }
		if (info.message) { details += '<br><br>' + utils.encode(info.message); }
		if (info.encrypted && info.decrypted) { details += '<br><br>' + _('Decryption alone does not authenticate the sender.'); }
		var missing = utils.missingSigners(info);
		if (!missing.length) {
			Ext.Msg.alert(_('OpenPGP security information'), details);
			return;
		}
		details += '<br><br>' + utils.encode(_('Your keyservers can be searched for the missing key. They learn which key you look for. A key found this way still needs its fingerprint verified before you trust the sender.'));
		Ext.Msg.show({title: _('OpenPGP security information'), msg: details, icon: Ext.Msg.INFO,
			buttons: {yes: _('Find key on keyserver'), cancel: _('Close')},
			fn: function(button) {
				if (button === 'yes') { this.findSigningKeys(missing); }
			}, scope: this});
	},
	/**
	 * Fetch the missing signing keys from the keyservers and import them. Storing a
	 * key rechecks the open messages, so the signature status updates by itself.
	 * @param {Object[]} missing See {@link Grommunio.plugins.pgp.PgpUtils#missingSigners}
	 */
	findSigningKeys: function(missing)
	{
		var utils = Grommunio.plugins.pgp.PgpUtils;
		Promise.all(missing.map(function(signer) { return utils.findPublicKey(signer.queries); })).then(function(keys) {
			return utils.importKeys(keys);
		}).then(function(keys) {
			utils.notify(String.format(_('Imported the signing key {0}. Verify its fingerprint before you trust the sender.'), keys.map(function(key) {
				return utils.formatFingerprint(key.fingerprint);
			}).join(', ')));
		}).catch(function(error) { utils.notify(error.message, true); });
	},
	/** Attachments which may hold OpenPGP keys, by name or declared type. */
	isKeyAttachment: function(attachment)
	{
		return /\.(?:asc|key|pub|gpg|pgp)$/i.test(attachment.get('name') || '') || /^application\/pgp-keys$/i.test(attachment.get('filetype') || '');
	},
	attachmentImportItem: function(insertionName, menu)
	{
		var plugin = this;
		return {xtype: 'grommunio.conditionalitem', text: _('Import OpenPGP key'), iconCls: 'icon_pgp_key',
			beforeShow: function(item, records) {
				var attachment = menu.getPrimaryRecord(records);
				item.setVisible(!!attachment && plugin.isKeyAttachment(attachment));
			},
			handler: function() { plugin.importAttachmentKeys(menu.getPrimaryRecord()); }};
	},
	/**
	 * Import the public keys an attachment carries. Private keys are refused here,
	 * they need the passphrase handling of the import dialog in the settings.
	 * @param {Grommunio.core.data.IPMAttachmentRecord} attachment The attachment
	 */
	importAttachmentKeys: function(attachment)
	{
		var utils = Grommunio.plugins.pgp.PgpUtils, limit = 1024 * 1024;
		var local = attachment.localContent;
		var content = local && local.bytes ? Promise.resolve(local.bytes) : fetch(attachment.getAttachmentUrl(), {credentials: 'same-origin'}).then(function(response) {
			if (!response.ok) { throw new Error(_('The attachment could not be loaded.')); }
			return response.arrayBuffer();
		}).then(function(buffer) { return new Uint8Array(buffer); });
		content.then(function(data) {
			if (data.length > limit) { throw new Error(_('The key file is too large. Maximum size: 1 MiB.')); }
			var text = new TextDecoder('utf-8').decode(data);
			if (/-----BEGIN PGP PRIVATE KEY BLOCK-----/.test(text)) {
				throw new Error(_('This attachment holds a private key. Import it under Settings → OpenPGP → Import key.'));
			}
			// Armored keys are text, cut from any surrounding mail text; anything else is tried as a binary key file.
			var begin = text.indexOf('-----BEGIN PGP PUBLIC KEY BLOCK-----'), end = '-----END PGP PUBLIC KEY BLOCK-----';
			var input = begin === -1 ? data : text.slice(begin, text.lastIndexOf(end) + end.length);
			return utils.crypto().importable(input);
		}).then(function(keys) {
			if (keys.some(function(key) { return key.encrypted_private_key; })) {
				throw new Error(_('This attachment holds a private key. Import it under Settings → OpenPGP → Import key.'));
			}
			return utils.importKeys(keys);
		}).then(function(keys) {
			utils.notify(keys.length === 1 ? _('Public key imported. Verify its fingerprint before encrypting to its owner.')
				: String.format(_('{0} public keys imported. Verify their fingerprints before encrypting to their owners.'), keys.length));
		}).catch(function(error) { utils.notify(error.message || _('This attachment does not hold an OpenPGP public key.'), true); });
	},
	defaultColumn: function()
	{
		return {header: '<p class="icon_pgp_key"><span class="title">' + _('OpenPGP') + '</span></p>',
			headerCls: 'grommunio-icon-column', dataIndex: 'pgp_encrypted', width: 24, sortable: false, fixed: true,
			tooltip: _('OpenPGP signed or encrypted message'), renderer: function(value, meta, record) {
				meta.css = Grommunio.plugins.pgp.PgpUtils.icon(record);
				return '';
			}};
	},
	compactColumn: function(insertionName, record)
	{
		return '<td style="width:24px"><div class="grid_compact ' + Grommunio.plugins.pgp.PgpUtils.icon(record) + '" style="height:24px;width:24px"></div></td>';
	}
});

Grommunio.core.data.RecordFactory.addFieldToMessageClass('IPM.Note', [
	{name: 'pgp', defaultValue: null},
	{name: 'pgp_sign', type: 'boolean', defaultValue: false},
	{name: 'pgp_encrypt', type: 'boolean', defaultValue: false},
	{name: 'pgp_key', type: 'string', defaultValue: ''},
	{name: 'pgp_message_class', type: 'string', defaultValue: ''},
	{name: 'pgp_signed', type: 'boolean', defaultValue: false},
	{name: 'pgp_encrypted', type: 'boolean', defaultValue: false}
]);

Grommunio.onReady(function() {
	container.registerPlugin(new Grommunio.core.PluginMetaData({
		name: 'pgp', displayName: _('OpenPGP Plugin'), pluginConstructor: Grommunio.plugins.pgp.PgpPlugin
	}));
});
