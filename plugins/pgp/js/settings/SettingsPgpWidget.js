Ext.namespace('Zarafa.plugins.pgp.settings');

/** Keyring operations are immediate; compose defaults use the settings save cycle. */
Zarafa.plugins.pgp.settings.SettingsPgpWidget = Ext.extend(Zarafa.settings.ui.SettingsWidget, {
	constructor: function(config)
	{
		config = config || {};
		var utils = Zarafa.plugins.pgp.PgpUtils;
		this.keyStore = new Ext.data.JsonStore({idProperty: 'fingerprint', fields: [
			'fingerprint', 'uids', 'secret', 'can_sign', 'can_encrypt', 'revoked', 'expired', 'disabled',
			'created', 'expires', 'algorithm', 'bits', 'trusted', 'trusted_emails', 'unlocked'
		]});
		this.defaultStore = new Ext.data.ArrayStore({fields: ['fingerprint', 'label'], data: [['', _('Choose when composing')]]});
		this.keyservers = [];
		this.allowedKeyservers = [];
		Ext.applyIf(config, {
			title: _('Personal and public keys'), layout: 'form', cls: 'zarafa-settings-widget pgp-settings', labelWidth: 200,
			items: [{xtype: 'box', autoEl: {tag: 'p', cls: 'pgp-explanation', html: utils.encode(_('Your keys are stored in your mailbox. Private keys stay passphrase-protected; signing, encryption and unlocking happen in this browser. Verify your contacts’ fingerprints through a separate trusted channel. Key changes take effect immediately.'))}}, {
				xtype: 'grid', ref: 'keyGrid', store: this.keyStore, height: 300, border: true,
				selModel: new Ext.grid.RowSelectionModel({singleSelect: true, listeners: {selectionchange: this.onSelectionChange, scope: this}}),
				viewConfig: {forceFit: true, deferEmptyText: false, emptyText: utils.encode(_('No OpenPGP keys. Import or generate a key to get started.'))},
				columns: [{header: _('Identity'), dataIndex: 'uids', width: 180, renderer: function(value, meta, record) {
					return utils.encode(utils.keyEmails(record.data).join(', '));
				}}, {header: _('Fingerprint'), dataIndex: 'fingerprint', width: 270, renderer: function(value) {
					return '<span class="pgp-fingerprint">' + utils.encode(utils.formatFingerprint(value)) + '</span>';
				}}, {header: _('Type'), dataIndex: 'secret', width: 75, renderer: function(value) {
					return value ? _('Private key') : _('Public key');
				}}, {header: _('Status'), dataIndex: 'revoked', width: 160, renderer: function(value, meta, record) {
					var key = record.data, status = [];
					if (key.revoked) { status.push(_('Revoked')); }
					else if (key.expired) { status.push(_('Expired')); }
					else { status.push(key.trusted ? _('Fingerprint verified') : _('Not verified')); }
					if (key.secret) { status.push(key.unlocked ? _('Unlocked') : _('Locked')); }
					return utils.encode(status.join(' · '));
				}}, {header: _('Expires'), dataIndex: 'expires', width: 90, renderer: function(value) {
					return value ? utils.encode(new Date(Number(value) * 1000).toLocaleDateString()) : _('No expiry');
				}}],
				tbar: [{text: _('Generate key'), cls: 'pgp-settings-button', iconCls: 'icon_pgp_key', handler: this.generateKey, scope: this},
					{text: _('Import key'), cls: 'pgp-settings-button', handler: this.importKey, scope: this},
					{text: _('Find public key'), cls: 'pgp-settings-button', handler: this.lookupKey, scope: this}, '->',
					{text: _('Refresh'), cls: 'pgp-settings-button', handler: this.reload, scope: this}],
				bbar: [{text: _('Details / verify'), cls: 'pgp-settings-button', itemId: 'verify', disabled: true, handler: this.verifyKey, scope: this},
					{xtype: 'splitbutton', text: _('Export public key'), cls: 'pgp-settings-button', itemId: 'export', disabled: true, handler: this.exportPublic, scope: this,
						menu: {items: [{text: _('Back up private key'), secretOnly: true, handler: this.exportPrivate, scope: this}],
							listeners: {beforeshow: this.updateKeyMenu, scope: this}}},
					{text: _('Private key'), cls: 'pgp-settings-button', itemId: 'private', disabled: true, menu: {items: [
						{text: _('Unlock in this browser'), handler: this.unlockKey, scope: this},
						{text: _('Change passphrase'), handler: this.changePassphrase, scope: this}]}},
					{text: _('Delete'), cls: 'pgp-settings-button', itemId: 'delete', disabled: true, handler: this.deleteKey, scope: this}, '->',
					{text: _('Lock all'), cls: 'pgp-settings-button', handler: this.lockKeys, scope: this}]
			}, {xtype: 'box', ref: 'operationStatus', hidden: true, autoEl: {tag: 'p', cls: 'pgp-operation-status', role: 'status', 'aria-live': 'polite'}},
			{xtype: 'combo', ref: 'defaultKey', fieldLabel: _('Default private key'),
				store: this.defaultStore, valueField: 'fingerprint', displayField: 'label', mode: 'local',
				tpl: '<tpl for="."><div class="x-combo-list-item">{label:htmlEncode}</div></tpl>',
				triggerAction: 'all', editable: false, forceSelection: true, anchor: '100%'
			}, {xtype: 'checkbox', ref: 'defaultSign', fieldLabel: _('Sign new messages by default')},
			{xtype: 'checkbox', ref: 'defaultEncrypt', fieldLabel: _('Encrypt new messages by default')},
			{xtype: 'button', text: _('Manage keyservers'), cls: 'pgp-settings-button pgp-keyservers-button', handler: this.manageKeyservers, scope: this},
			{xtype: 'box', autoEl: {tag: 'p', cls: 'pgp-explanation', html: utils.encode(_('Compose defaults apply to new OpenPGP messages only. S/MIME and OpenPGP cannot be combined on the same message.'))}}]
		});
		Zarafa.plugins.pgp.settings.SettingsPgpWidget.superclass.constructor.call(this, config);
	},
	update: function(settingsModel)
	{
		this.defaultFingerprint = settingsModel.get('zarafa/v1/plugins/pgp/default_key', '');
		this.defaultKey.setValue(this.defaultFingerprint);
		this.defaultSign.setValue(settingsModel.get('zarafa/v1/plugins/pgp/default_sign', false));
		this.defaultEncrypt.setValue(settingsModel.get('zarafa/v1/plugins/pgp/default_encrypt', false));
		this.reload();
	},
	updateSettings: function(settingsModel)
	{
		settingsModel.set('zarafa/v1/plugins/pgp/default_key', this.defaultKey.getValue());
		settingsModel.set('zarafa/v1/plugins/pgp/default_sign', this.defaultSign.getValue());
		settingsModel.set('zarafa/v1/plugins/pgp/default_encrypt', this.defaultEncrypt.getValue());
	},
	reload: function()
	{
		var widget = this, utils = Zarafa.plugins.pgp.PgpUtils;
		return utils.api('list', {}).then(function(response) {
			if (widget.isDestroyed) { return; }
			var unlocked = utils.crypto().unlocked().map(function(key) { return key.fingerprint; });
			var keys = (response.keys || []).map(function(key) { return Ext.apply(Ext.apply({}, key), {unlocked: unlocked.indexOf(key.fingerprint) !== -1}); });
			widget.keyStore.loadData(keys);
			widget.keyservers = response.keyservers || [];
			widget.allowedKeyservers = response.allowed_keyservers || [];
			var defaults = [['', _('Choose when composing')]];
			Ext.each(keys, function(key) {
				if (utils.usableKey(key, container.getUser().getSMTPAddress(), false, false)) {
					defaults.push([key.fingerprint, utils.keyLabel(key)]);
				}
			});
			var selected = widget.defaultKey.getValue() || widget.defaultFingerprint || '';
			widget.defaultStore.loadData(defaults);
			widget.defaultKey.setValue(selected);
			widget.onSelectionChange();
		}).catch(function(error) { widget.feedback(error.message, true); });
	},
	feedback: function(message, error)
	{
		if (this.isDestroyed || !this.operationStatus) { return; }
		this.operationStatus.show();
		this.operationStatus.getEl().update(Zarafa.plugins.pgp.PgpUtils.encode(message));
		this.operationStatus.getEl()[error ? 'addClass' : 'removeClass']('pgp-operation-error');
	},
	complete: function(promise, done, message)
	{
		var widget = this;
		return promise.then(function(response) {
			if (done) { done(true); }
			widget.reload();
			if (message) { widget.feedback(message); }
			return response;
		}).catch(function(error) {
			if (done) { done(false, error.message); }
			else { widget.feedback(error.message, true); }
		});
	},
	onSelectionChange: function()
	{
		if (!this.keyGrid || !this.keyGrid.rendered) { return; }
		var key = this.keyGrid.getSelectionModel().getSelected(), toolbar = this.keyGrid.getBottomToolbar();
		Ext.each(['verify', 'export', 'delete'], function(id) { toolbar.getComponent(id).setDisabled(!key); });
		toolbar.getComponent('private').setDisabled(!key || !key.get('secret'));
	},
	updateKeyMenu: function(menu)
	{
		var key = this.selectedKey();
		menu.items.each(function(item) { item.setDisabled(!key || (item.secretOnly && !key.secret)); });
	},
	selectedKey: function(secret)
	{
		var record = this.keyGrid.getSelectionModel().getSelected();
		if (!record || (secret && !record.get('secret'))) {
			return null;
		}
		return record.data;
	},
	generateKey: function()
	{
		var widget = this, dialogs = Zarafa.plugins.pgp.dialogs.PgpDialogs, utils = Zarafa.plugins.pgp.PgpUtils;
		var password = dialogs.passwordField();
		password.minLength = 12;
		dialogs.form(_('Generate OpenPGP key'), [
			{xtype: 'textfield', name: 'name', fieldLabel: _('Name'), allowBlank: false},
			{xtype: 'textfield', name: 'email', fieldLabel: _('Email'), value: container.getUser().getSMTPAddress(), vtype: 'email', allowBlank: false},
			{xtype: 'combo', name: 'algorithm', hiddenName: 'algorithm', fieldLabel: _('Algorithm'), mode: 'local', triggerAction: 'all', editable: false,
				store: [['rsa3072', 'RSA 3072'], ['rsa4096', 'RSA 4096'], ['curve25519', 'Ed25519 / Curve25519']], value: 'rsa3072'},
			{xtype: 'combo', name: 'expiresDays', hiddenName: 'expiresDays', fieldLabel: _('Expires in'), mode: 'local', triggerAction: 'all', editable: false,
				store: [['365', _('1 year')], ['730', _('2 years')], ['1825', _('5 years')]], value: '730'},
			password,
			{xtype: 'textfield', name: 'confirmPassphrase', inputType: 'password', fieldLabel: _('Repeat passphrase'), allowBlank: false,
				autoCreate: {tag: 'input', type: 'password', autocomplete: 'new-password'},
				validator: function(value) { return value === this.ownerCt.getForm().findField('passphrase').getValue() || _('Passphrases do not match.'); }}
		], _('Generate'), function(values, done) {
			var email = values.email;
			var operation = utils.crypto().generate({name: values.name, email: email, algorithm: values.algorithm,
				expiresDays: Number(values.expiresDays), passphrase: values.passphrase}).then(function(key) {
				return utils.storeKey(key).then(function() {
					return utils.api('trust', {fingerprint: key.fingerprint, email: email, trusted: true});
				}).then(function() { return key; });
			});
			widget.complete(operation, done, _('Key created. Back up the private key and store its passphrase separately.')).then(function(key) {
				if (key && key.revocation_certificate) {
					dialogs.armored(_('Revocation certificate — keep secure'), key.revocation_certificate, key.fingerprint, false, '-revocation.asc');
				}
			});
		}, _('Choose a strong passphrase of at least 12 characters. Generation runs locally in this browser and may take a moment. Keep the revocation certificate and a private-key backup in a safe place.'));
	},
	importKey: function()
	{
		var widget = this, utils = Zarafa.plugins.pgp.PgpUtils;
		Zarafa.plugins.pgp.dialogs.PgpDialogs.form(_('Import OpenPGP key'), [
			{xtype: 'box', autoEl: {tag: 'input', type: 'file', accept: '.asc,text/plain,application/pgp-keys', 'aria-label': _('Choose armored OpenPGP key file')},
				listeners: {afterrender: function(input) {
					input.getEl().on('change', function() {
						var file = input.getEl().dom.files[0];
						if (!file) { return; }
						if (file.size > 1024 * 1024) {
							input.ownerCt.getForm().findField('armored').markInvalid(_('The key file is too large. Maximum size: 1 MiB.'));
							return;
						}
						var reader = new FileReader();
						reader.onload = function() {
							if (!input.isDestroyed) { input.ownerCt.getForm().findField('armored').setValue(reader.result); }
						};
						reader.onerror = function() { if (!input.isDestroyed) { input.ownerCt.getForm().findField('armored').markInvalid(_('The key file could not be read.')); } };
						reader.readAsText(file);
					});
				}}},
			{xtype: 'textarea', name: 'armored', fieldLabel: _('Armored key'), height: 240, allowBlank: false, cls: 'pgp-armored'},
			{xtype: 'textfield', name: 'passphrase', inputType: 'password', fieldLabel: _('Protect unencrypted key'), minLength: 12,
				emptyText: _('Optional: new passphrase for an unprotected private key'), autoCreate: {tag: 'input', type: 'password', autocomplete: 'new-password'}}
		], _('Import'), function(values, done) {
			var operation = values.passphrase ? utils.crypto().protect(values.armored, values.passphrase) : utils.crypto().inspect(values.armored);
			widget.complete(operation.then(function(key) { return utils.importKey(key); }), done, _('Key imported. Verify recipient fingerprints before encrypting to them.'));
		}, _('Choose a file or paste one ASCII-armored key, including its BEGIN and END lines. For an unprotected private key, enter a new passphrase to protect it locally before storage. Imported recipient keys are not automatically trusted.'));
	},
	exportPublic: function()
	{
		var key = this.selectedKey(false);
		if (!key) { return; }
		var widget = this;
		Zarafa.plugins.pgp.PgpUtils.loadKey(key.fingerprint).then(function(stored) {
			Zarafa.plugins.pgp.dialogs.PgpDialogs.armored(_('Public OpenPGP key'), stored.public_key, key.fingerprint, false);
		}).catch(function(error) { widget.feedback(error.message, true); });
	},
	exportPrivate: function()
	{
		var key = this.selectedKey(true), dialogs = Zarafa.plugins.pgp.dialogs.PgpDialogs, utils = Zarafa.plugins.pgp.PgpUtils;
		if (!key) { return; }
		dialogs.form(_('Back up private OpenPGP key'), [dialogs.passwordField()], _('Create backup'), function(values, done) {
			var passphrase = values.passphrase;
			utils.loadKey(key.fingerprint).then(function(stored) {
				return utils.crypto().unlock(stored.encrypted_private_key, passphrase, utils.unlockTtl || 300, stored.public_key).then(function() {
					return utils.crypto().inspect(stored.encrypted_private_key, stored.public_key);
				});
			}).then(function(stored) {
				passphrase = '';
				done(true);
				dialogs.armored(_('Private key backup — keep secure'), stored.encrypted_private_key, key.fingerprint, true);
			}).catch(function(error) { passphrase = ''; done(false, error.message); });
		}, _('Confirm your passphrase locally before downloading this encrypted private-key backup. Keep it secure and never send it to a recipient or a keyserver.'));
	},
	changePassphrase: function()
	{
		var key = this.selectedKey(true), widget = this, dialogs = Zarafa.plugins.pgp.dialogs.PgpDialogs, utils = Zarafa.plugins.pgp.PgpUtils;
		if (!key) { return; }
		var oldPassword = dialogs.passwordField();
		oldPassword.name = 'oldPassphrase';
		oldPassword.fieldLabel = _('Current passphrase');
		var newPassword = dialogs.passwordField();
		newPassword.fieldLabel = _('New passphrase');
		newPassword.minLength = 12;
		dialogs.form(_('Change OpenPGP passphrase'), [oldPassword, newPassword,
			{xtype: 'textfield', name: 'confirmPassphrase', inputType: 'password', fieldLabel: _('Repeat new passphrase'), allowBlank: false,
				autoCreate: {tag: 'input', type: 'password', autocomplete: 'new-password'},
				validator: function(value) { return value === this.ownerCt.getForm().findField('passphrase').getValue() || _('Passphrases do not match.'); }}
		], _('Change passphrase'), function(values, done) {
			var oldPassphrase = values.oldPassphrase, newPassphrase = values.passphrase;
			var operation = utils.loadKey(key.fingerprint).then(function(stored) {
				return utils.crypto().changePassphrase(stored.encrypted_private_key, oldPassphrase, newPassphrase, stored.public_key).then(function(changed) {
					changed.revision = stored.revision;
					return utils.storeKey(changed);
				});
			});
			widget.complete(operation, done, _('Passphrase changed. Make a new private-key backup.')).then(function() { oldPassphrase = ''; newPassphrase = ''; });
		}, _('The private key is re-encrypted locally. Existing backups still require their original passphrase.'));
	},
	verifyKey: function()
	{
		var key = this.selectedKey(false), utils = Zarafa.plugins.pgp.PgpUtils, widget = this;
		if (!key) { return; }
		var emails = utils.keyEmails(key).map(function(email) { return [email, email]; });
		var trusted = key.trusted_emails || [];
		Zarafa.plugins.pgp.dialogs.PgpDialogs.form(_('Verify OpenPGP fingerprint'), [
			{xtype: 'displayfield', fieldLabel: _('Fingerprint'), value: utils.encode(utils.formatFingerprint(key.fingerprint)), cls: 'pgp-fingerprint'},
			{xtype: 'displayfield', fieldLabel: _('Algorithm'), value: utils.encode(utils.algorithmLabel(key))},
			{xtype: 'displayfield', fieldLabel: _('Verified identities'), value: utils.encode(trusted.join(', ') || _('None'))},
			{xtype: 'combo', name: 'email', hiddenName: 'email', fieldLabel: _('Email identity'), store: emails, mode: 'local', triggerAction: 'all', editable: false,
				tpl: '<tpl for="."><div class="x-combo-list-item">{field2:htmlEncode}</div></tpl>', value: emails.length ? emails[0][0] : '', allowBlank: false},
			{xtype: 'textfield', name: 'fingerprint', fieldLabel: _('Confirm fingerprint'), allowBlank: false,
				validator: function(value) { return utils.fingerprint(value) === key.fingerprint || _('Enter the full fingerprint shown above.'); }},
			{xtype: 'checkbox', name: 'trusted', fieldLabel: _('I verified this fingerprint'), checked: false}
		], _('Save verification'), function(values, done) {
			widget.complete(utils.api('trust', {fingerprint: key.fingerprint, email: values.email, trusted: values.trusted === 'on' || values.trusted === true}), done, _('Fingerprint verification updated.'));
		}, _('Compare the complete fingerprint with your contact using a separate trusted channel. Checking the box pins this key for the selected address; leaving it unchecked removes that verification.'));
	},
	unlockKey: function()
	{
		var key = this.selectedKey(true);
		if (key) { Zarafa.plugins.pgp.dialogs.PgpDialogs.unlock(key.fingerprint, this.reload, this); }
	},
	lockKeys: function()
	{
		Zarafa.plugins.pgp.PgpUtils.crypto().lock();
		this.reload();
		this.feedback(_('All private keys in this browser tab are locked.'));
	},
	deleteKey: function()
	{
		var key = this.selectedKey(false), widget = this, utils = Zarafa.plugins.pgp.PgpUtils;
		if (!key) { return; }
		Zarafa.plugins.pgp.dialogs.PgpDialogs.form(_('Delete OpenPGP key'), [
			{xtype: 'displayfield', fieldLabel: _('Fingerprint'), value: utils.encode(utils.formatFingerprint(key.fingerprint)), cls: 'pgp-fingerprint'},
			{xtype: 'textfield', name: 'confirm', fieldLabel: _('Confirm fingerprint'), allowBlank: false,
				validator: function(value) { return utils.fingerprint(value) === key.fingerprint || _('Type the full fingerprint to confirm deletion.'); }}
		], _('Delete key'), function(values, done) {
			widget.complete(utils.api('delete', {fingerprint: key.fingerprint, deleteSecret: key.secret === true}).then(function(response) {
				utils.crypto().lock(key.fingerprint);
				return response;
			}), done, _('Key removed from your mailbox.'));
		}, key.secret ? _('Deleting this private key prevents you from reading messages encrypted to it unless you have a backup. Make a private-key backup before continuing.') : _('This removes the public key and its verified fingerprints from your keyring.'));
	},
	manageKeyservers: function()
	{
		var widget = this;
		Zarafa.plugins.pgp.dialogs.PgpDialogs.form(_('Manage OpenPGP keyservers'), [
			{xtype: 'textarea', name: 'servers', fieldLabel: _('HTTPS keyservers'), value: this.keyservers.join('\n'), height: 140,
				validator: function(value) {
					var valid = true;
					Ext.each(value.split(/\r?\n/), function(server) {
						if (server.replace(/\s/g, '') && !/^https:\/\/[a-z0-9.-]+(?::443)?\/?$/i.test(server.trim())) { valid = false; }
					});
					return valid || _('Enter one HTTPS server origin per line, without a path, credentials, or query.');
				}}
		], _('Save keyservers'), function(values, done) {
			var servers = values.servers.split(/\r?\n/).map(function(server) { return server.trim(); }).filter(function(server) { return !!server; });
			widget.complete(Zarafa.plugins.pgp.PgpUtils.api('keyservers', {servers: servers}), done, _('Keyservers updated.'));
		}, _('Only administrator-approved HTTPS keyservers can be used. Searches require a complete fingerprint. Keys are never uploaded automatically.') +
			(this.allowedKeyservers.length ? ' ' + _('Approved servers: ') + this.allowedKeyservers.join(', ') : ''));
	},
	lookupKey: function()
	{
		var widget = this, utils = Zarafa.plugins.pgp.PgpUtils;
		if (!this.keyservers.length) {
			this.manageKeyservers();
			return;
		}
		Zarafa.plugins.pgp.dialogs.PgpDialogs.form(_('Find OpenPGP public key'), [
			{xtype: 'combo', name: 'server', hiddenName: 'server', fieldLabel: _('Keyserver'), store: this.keyservers.map(function(server) { return [server, server]; }),
				mode: 'local', triggerAction: 'all', editable: false, allowBlank: false, value: this.keyservers[0],
				tpl: '<tpl for="."><div class="x-combo-list-item">{field2:htmlEncode}</div></tpl>'},
			{xtype: 'textfield', name: 'fingerprint', fieldLabel: _('Full fingerprint'), allowBlank: false,
				validator: function(value) { return utils.isFingerprint(value) || _('Enter a complete 40- or 64-digit hexadecimal fingerprint.'); }}
		], _('Find and import'), function(values, done) {
			values.fingerprint = utils.fingerprint(values.fingerprint);
			var fingerprint = values.fingerprint;
			widget.complete(utils.api('lookup', {server: values.server, fingerprint: fingerprint}).then(function(response) {
				return utils.crypto().inspect(response.armored);
			}).then(function(key) {
				if (key.fingerprint !== fingerprint || key.encrypted_private_key) { throw new Error(_('The keyserver did not return the requested public key.')); }
				return utils.importKey(key);
			}), done, _('Public key imported. Verify its fingerprint before encrypting to its owner.'));
		}, _('The server will receive the fingerprint you search for. A downloaded key still needs fingerprint verification before encrypting to its owner.'));
	}
});

Ext.reg('pgp.settingswidget', Zarafa.plugins.pgp.settings.SettingsPgpWidget);
