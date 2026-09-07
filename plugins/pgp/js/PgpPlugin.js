Ext.namespace('Zarafa.plugins.pgp');

/** OpenPGP/MIME presentation; private-key unlocking stays in the browser. */
Zarafa.plugins.pgp.PgpPlugin = Ext.extend(Zarafa.core.Plugin, {
	initPlugin: function()
	{
		Zarafa.plugins.pgp.PgpPlugin.superclass.initPlugin.apply(this, arguments);
		Zarafa.common.ui.SecurityButtons.register(this.securityProvider());
		this.registerInsertionPoint('context.settings.categories', this.settingsCategory, this);
		this.registerInsertionPoint('previewpanel.toolbar.detaillinks', this.previewInfo, this);
		this.registerInsertionPoint('context.mail.griddefaultcolumn', this.defaultColumn, this);
		this.registerInsertionPoint('context.mail.gridrow', this.compactColumn, this);
	},
	settingsCategory: function(insertionName, panel, settingsContext)
	{
		return [{xtype: 'pgp.settingscategory', settingsContext: settingsContext}];
	},
	securityProvider: function()
	{
		var plugin = this;
		return {id: 'pgp', label: 'OpenPGP', priority: 20,
			isSelected: function(record, action) { return record.get('pgp_' + action) === true; },
			setAction: function(dialog, action, enabled) { plugin.setProtection(dialog, action, enabled); },
			attach: function(dialog) { plugin.attachCompose(dialog); },
			getOptions: function(action, dialog) {
				return [{text: _('Choose private key…'), iconCls: 'icon_pgp_key', handler: function() {
					plugin.selectComposeKey(dialog, dialog.record.get('pgp_sign'), dialog.record.get('pgp_encrypt'), true, function(key) {
						if (!dialog.isDestroyed && !Zarafa.plugins.pgp.PgpUtils.isSmime(dialog.record)) {
							dialog.record.set('pgp_key', key.fingerprint);
							dialog.securityPreferredProtocol = 'pgp';
						}
					});
				}}, {text: _('Manage OpenPGP keys…'), handler: function() { Zarafa.plugins.pgp.PgpUtils.openSettings(); }},
				{text: _('Lock private keys'), handler: function() { Zarafa.plugins.pgp.PgpUtils.crypto().lock(); }}];
			}
		};
	},
	attachCompose: function(dialog)
	{
		Zarafa.plugins.pgp.PgpTransport.install(dialog);
		var record = dialog.record;
		if (!record.pgpDefaultsApplied) {
			record.pgpDefaultsApplied = true;
			if (record.phantom && !Zarafa.plugins.pgp.PgpUtils.isSmime(record) && !record.get('pgp_sign') && !record.get('pgp_encrypt')) {
				var settings = container.getSettingsModel();
				record.beginEdit();
				record.set('pgp_sign', settings.get('zarafa/v1/plugins/pgp/default_sign', false));
				record.set('pgp_encrypt', settings.get('zarafa/v1/plugins/pgp/default_encrypt', false));
				record.set('pgp_key', settings.get('zarafa/v1/plugins/pgp/default_key', ''));
				record.endEdit();
			}
		}
	},
	setProtection: function(dialog, action, enabled)
	{
		if (!dialog || !dialog.record || (enabled && Zarafa.plugins.pgp.PgpUtils.isSmime(dialog.record))) { return; }
		// Selecting protection records intent only. Send validation offers setup or
		// local unlocking when needed; no passphrase enters the message record.
		dialog.record.set('pgp_' + action, enabled === true);
		if (enabled && !dialog.record.get('pgp_key')) {
			dialog.record.set('pgp_key', container.getSettingsModel().get('zarafa/v1/plugins/pgp/default_key', ''));
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
		var record = dialog.record, utils = Zarafa.plugins.pgp.PgpUtils, email = this.senderAddress(record);
		utils.api('list', {}).then(function(response) {
			if (dialog.isDestroyed || dialog.record !== record || utils.isSmime(record)) { return; }
			var keys = (response.keys || []).filter(function(key) { return utils.usableKey(key, email, sign, encrypt); });
			var current = record.get('pgp_key') || container.getSettingsModel().get('zarafa/v1/plugins/pgp/default_key', '');
			var selected = keys.filter(function(key) { return key.fingerprint === current; })[0];
			if (!forceChoice && selected) { callback(selected); }
			else { Zarafa.plugins.pgp.dialogs.PgpDialogs.chooseKey(keys, current, callback); }
		}).catch(function(error) { utils.notify(error.message, true); });
	},
	previewInfo: function()
	{
		var plugin = this;
		return {xtype: 'button', cls: 'pgp-info', hidden: true,
			plugins: ['zarafa.recordcomponentupdaterplugin'],
			update: function(record) {
				this.record = record;
				if (record) { Zarafa.plugins.pgp.PgpTransport.observe(record); }
				var info = record && record.get('pgp');
				this.setVisible(!!(record && record.isOpened() && info));
				if (!info) { return; }
				if (record.isOpened() && info.pending) { Zarafa.plugins.pgp.PgpTransport.open(record); }
				var status = Zarafa.plugins.pgp.PgpUtils.status(info);
				this.removeClass(['pgp-info-good', 'pgp-info-bad', 'pgp-info-warning', 'pgp-info-info']);
				this.addClass('pgp-info-' + status.severity);
				this.setText(Zarafa.plugins.pgp.PgpUtils.encode(status.text));
			},
			handler: plugin.onPreviewInfo, scope: plugin
		};
	},
	onPreviewInfo: function(button)
	{
		var record = button.record, info = record && record.get('pgp'), utils = Zarafa.plugins.pgp.PgpUtils;
		if (!info) { return; }
		if (info.encrypted && !info.decrypted && info.mime && !info.unverifiable) {
			Zarafa.plugins.pgp.PgpTransport.unlockAndOpen(record).catch(function(error) { if (!error.cancelled) { utils.notify(error.message, true); } });
			return;
		}
		var details = utils.encode(utils.status(info).text);
		if (info.fingerprint) { details += '<br><br>' + _('Signing key: ') + utils.encode(utils.formatFingerprint(info.fingerprint)); }
		if (info.message) { details += '<br><br>' + utils.encode(info.message); }
		if (info.encrypted && info.decrypted) { details += '<br><br>' + _('Decryption alone does not authenticate the sender.'); }
		Ext.Msg.alert(_('OpenPGP security information'), details);
	},
	defaultColumn: function()
	{
		return {header: '<p class="icon_pgp_key"><span class="title">' + _('OpenPGP') + '</span></p>',
			headerCls: 'zarafa-icon-column', dataIndex: 'pgp_encrypted', width: 24, sortable: false, fixed: true,
			tooltip: _('OpenPGP signed or encrypted message'), renderer: function(value, meta, record) {
				meta.css = Zarafa.plugins.pgp.PgpUtils.icon(record);
				return '';
			}};
	},
	compactColumn: function(insertionName, record)
	{
		return '<td style="width:24px"><div class="grid_compact ' + Zarafa.plugins.pgp.PgpUtils.icon(record) + '" style="height:24px;width:24px"></div></td>';
	}
});

Zarafa.core.data.RecordFactory.addFieldToMessageClass('IPM.Note', [
	{name: 'pgp', defaultValue: null},
	{name: 'pgp_sign', type: 'boolean', defaultValue: false},
	{name: 'pgp_encrypt', type: 'boolean', defaultValue: false},
	{name: 'pgp_key', type: 'string', defaultValue: ''},
	{name: 'pgp_message_class', type: 'string', defaultValue: ''},
	{name: 'pgp_signed', type: 'boolean', defaultValue: false},
	{name: 'pgp_encrypted', type: 'boolean', defaultValue: false}
]);

Zarafa.onReady(function() {
	container.registerPlugin(new Zarafa.core.PluginMetaData({
		name: 'pgp', displayName: _('OpenPGP Plugin'), pluginConstructor: Zarafa.plugins.pgp.PgpPlugin
	}));
});
