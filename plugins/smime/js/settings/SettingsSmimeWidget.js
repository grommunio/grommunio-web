Ext.namespace('Grommunio.plugins.smime.settings');
/**
 * @class Grommunio.plugins.smime.settings.SettingsSmimeWidget
 * @extends Grommunio.settings.ui.SettingsWidget
 * @xtype smime.settingssmimewidget
 *
 * The {@link Grommunio.plugins.settings.SettingsSmimeWidget widget} for importing S/MIME certificates (public/private)
 */
Grommunio.plugins.smime.settings.SettingsSmimeWidget = Ext.extend(Grommunio.settings.ui.SettingsWidget, {

	/**
	 * @cfg {Grommunio.core.data.IPMRecord} record.
	 */
	record : undefined,

	/**
	 * The default button label for the 'Change passphrase' button
	 * @cfg {String} defaultButtonLabel
	 */
	defaultButtonLabel : _('You don\'t have a valid certificate corresponding to your account'),


	/**
	 * @constructor
	 * @param {Object} config Configuration object
	 */
	constructor : function(config) {
		config = config || {};

		if(!config.store) {
			config.store = new Grommunio.plugins.smime.data.SmimeCertificateStore();
		}

		Ext.applyIf(config, {
			title	: _('Personal certificate'),
			layout : 'form',
			xtype : 'smime.settingssmimewidget',
			items :[{
				xtype: 'button',
				text: _('Change passphrase for last certificate'),
				labelStyle: 'width:580px',
				ref: 'certificateField',
				fieldLabel : this.defaultButtonLabel,
				labelSeparator: '',
				handler : this.changePassphrase
			},{
				xtype: 'combo',
				fieldLabel: _('Default encryption algorithm'),
				ref: 'cipherCombo',
				store: new Ext.data.ArrayStore({
					fields: ['value', 'display'],
					data: [
						['aes-256-gcm', 'AES-256-GCM (' + _('Recommended') + ')'],
						['aes-128-gcm', 'AES-128-GCM'],
						['aes-256-cbc', 'AES-256-CBC (' + _('Legacy') + ')'],
						['aes-128-cbc', 'AES-128-CBC (' + _('Legacy') + ')']
					]
				}),
				valueField: 'value',
				displayField: 'display',
				mode: 'local',
				triggerAction: 'all',
				editable: false,
				value: container.getSettingsModel().get('grommunio/v1/plugins/smime/default_cipher', 'aes-256-gcm'),
				listeners: {
					select: function(combo, record) {
						container.getSettingsModel().set('grommunio/v1/plugins/smime/default_cipher', record.get('value'));
					}
				}
			},{
				xtype: 'combo',
				fieldLabel: _('Default signing digest'),
				ref: 'digestCombo',
				store: new Ext.data.ArrayStore({
					fields: ['value', 'display'],
					data: [
						['sha256', 'SHA-256 (' + _('Recommended') + ')'],
						['sha384', 'SHA-384'],
						['sha512', 'SHA-512']
					]
				}),
				valueField: 'value',
				displayField: 'display',
				mode: 'local',
				triggerAction: 'all',
				editable: false,
				value: container.getSettingsModel().get('grommunio/v1/plugins/smime/default_digest', 'sha256'),
				listeners: {
					select: function(combo, record) {
						container.getSettingsModel().set('grommunio/v1/plugins/smime/default_digest', record.get('value'));
					}
				}
			}]
		});

		Grommunio.plugins.smime.settings.SettingsSmimeWidget.superclass.constructor.call(this, config);
	},


	/**
	 * initialize events for the grid panel.
	 * @private
	 */
	initEvents : function()
	{
		Grommunio.plugins.smime.settings.SettingsSmimeWidget.superclass.initEvents.call(this);
		this.mon(this.store, 'load', this.onStoreReady, this);
		this.mon(this.store, 'remove', this.onStoreReady, this);
		this.onStoreReady();
	},

	/**
	 * Event handler which is fired when the store is loaded or an item is removed from the store
	 * @private
	 */
	onStoreReady : function()
	{
		var index = this.store.findExact('type', 'private');
		if(index === -1) {
			this.certificateField.disable();
			this.setCertificateButtonLabel(this.defaultButtonLabel);
			return;
		}
		this.certificateField.enable();
		this.record = this.store.getAt(index);
		// TODO: add validity message
		this.setCertificateButtonLabel(_('You have a valid certificate corresponding to your account'));
	},

	/**
	 * Helper function to set the fieldLabel of the certificate field button.
	 * @param {String} text fieldLabel text to be set.
	 */
	setCertificateButtonLabel : function(text)
	{
		if (this.certificateField.rendered) {
			this.certificateField.label.update(text);
		} else {
			this.certificateField.fieldLabel = text;
		}
	},

	/**
	 * Handler for 'change passphrase' button, opens a panel which allows a
	 * user to change his certificate's passphrase.
	 */
	changePassphrase : function()
	{
		Grommunio.core.data.UIFactory.openLayerComponent(Grommunio.core.data.SharedComponentType['plugin.smime.dialog.changepassphrasecontentpanel'], undefined, {modal: true});
	}
});

Ext.reg('smime.settingssmimewidget', Grommunio.plugins.smime.settings.SettingsSmimeWidget);
