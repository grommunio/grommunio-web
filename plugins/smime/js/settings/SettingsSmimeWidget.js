Ext.namespace('Zarafa.plugins.smime.settings');
/**
 * @class Zarafa.plugins.smime.settings.SettingsSmimeWidget
 * @extends Zarafa.settings.ui.SettingsWidget
 * @xtype smime.settingssmimewidget
 *
 * The {@link Zarafa.plugins.settings.SettingsSmimeWidget widget} for importing S/MIME certificates (public/private)
 */
Zarafa.plugins.smime.settings.SettingsSmimeWidget = Ext.extend(Zarafa.settings.ui.SettingsWidget, {

	/**
	 * @cfg {Zarafa.core.data.IPMRecord} record.
	 */
	record : undefined,

	/**
	 * The default button label for the 'Change passphrase' button
	 * @cfg {String} defaultButtonLabel
	 */
	defaultButtonLabel : _('You don\'t have a valid certificate corresponding to your account', 'plugin_smime'),


	/**
	 * @constructor
	 * @param {Object} config Configuration object
	 */
	constructor : function(config) {
		config = config || {};

		if(!config.store) {
			config.store = new Zarafa.plugins.smime.data.SmimeCertificateStore();
		}

		Ext.applyIf(config, {
			title	: _('Personal certificate', 'plugin_smime'),
			layout : 'form',
			xtype : 'smime.settingssmimewidget',
			items :[{
				xtype: 'button',
				text: _('Change passphrase for last certificate', 'plugin_smime'),
				labelStyle: 'width:580px',
				ref: 'certificateField',
				fieldLabel : this.defaultButtonLabel,
				labelSeparator: '',
				handler : this.changePassphrase
			}]
		});

		Zarafa.plugins.smime.settings.SettingsSmimeWidget.superclass.constructor.call(this, config);
	},


	/**
	 * initialize events for the grid panel.
	 * @private
	 */
	initEvents : function()
	{
		Zarafa.plugins.smime.settings.SettingsSmimeWidget.superclass.initEvents.call(this);
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
		} else {
			this.certificateField.enable();
			this.record = this.store.getAt(index);
			// TODO: add validity message
			this.setCertificateButtonLabel(_('You have a valid certificate corresponding to your account', 'plugin_smime'));
		}
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
		Zarafa.core.data.UIFactory.openLayerComponent(Zarafa.core.data.SharedComponentType['plugin.smime.dialog.changepassphrasecontentpanel'], undefined, {modal: true});
	}
});

Ext.reg('smime.settingssmimewidget', Zarafa.plugins.smime.settings.SettingsSmimeWidget);
