Ext.namespace('Zarafa.plugins.smime.settings');
/**
 * @class Zarafa.smime.settings.SettingsPublickeyWidget
 * @extends Zarafa.settings.ui.SettingsWidget
 * @xtype smime.settingspublickeysmimewidget
 *
 * The {@link Zarafa.settings.SettingsPublickeyWidget widget} for managing public certificates
 */
Zarafa.plugins.smime.settings.SettingsPublickeyWidget = Ext.extend(Zarafa.settings.ui.SettingsWidget, {
	/**
	 * @constructor
	 * @param {Object} config Configuration object
	 */
	constructor : function(config) {
		config = config || {};

		Ext.applyIf(config, {
			height : 400,
			title : _('Public & Private certificates', 'plugin_smime'),
			xtype : 'smime.settingspublickeysmimewidget',
			layout : {
				// override from SettingsWidget
				type : 'fit'
			},
			items : [{
				xtype : 'smime.publiccertificatespanel',
				ref : 'certificatesPanel',
				store: config.store
			}]
		});
		
		Zarafa.plugins.smime.settings.SettingsPublickeyWidget.superclass.constructor.call(this, config);
	},

	/**
	 * @return {Zarafa.public.smime.data.SmimeCertificateStore} The store which is holds all the public certificates
	 */
	getCertificateStore : function()
	{
		return this.certificatesPanel.store;
	},

	/**
	 * initialize events for the {@link Zarafa.plugins.smime.settings.SettingsPublickeyWidget SettingsPublickeyWidget}.
	 * @private
	 */
	initEvents : function()
	{
		Zarafa.plugins.smime.settings.SettingsPublickeyWidget.superclass.initEvents.call(this);

		// listen to savesettings and discardsettings to save/discard public certificates.
		var contextModel = this.settingsContext.getModel();

		this.mon(contextModel, 'savesettings', this.onSaveSettings, this);
		this.mon(contextModel, 'discardsettings', this.onDiscardSettings, this);

		this.mon(this.getCertificateStore(), {
			'remove' : this.doStoreRemove,
			'update' : this.doStoreUpdate,
			scope : this
		});
	},

	/**
	 * Event handler for the {@link Ext.data.Store#remove} event which is fired
	 * by the {@link Ext.data.Store} inside the {@link #certificatePanel}.
	 * This will mark the {@link Zarafa.settings.SettingsContextModel} as
	 * {@link Zarafa.settings.SettingsContextModel#setDirty dirty}.
	 * @param {Ext.data.Store} store The store which fired the event
	 * @param {Ext.data.Record} record The record which was updated
	 * @private
	 */
	doStoreRemove : function(store, record)
	{
		if(!record.phantom) {
			this.settingsContext.getModel().setDirty();
		}
	},

	/**
	 * Event handler for the {@link Ext.data.Store#update} event which is fired
	 * by the {@link Ext.data.Store} inside the {@link #certificatePanel}.
	 * This will mark the {@link Zarafa.settings.SettingsContextModel} as
	 * {@link Zarafa.settings.SettingsContextModel#setDirty dirty}.
	 * @param {Ext.data.Store} store The store which fired the event
	 * @param {Ext.data.Record} record The record which was updated
	 * @param {String} operation The update operation being performed.
	 * @private
	 */
	doStoreUpdate : function(store, record, operation)
	{
		if (operation !== Ext.data.Record.COMMIT) {
			this.settingsContext.getModel().setDirty();
		}
	},

	/**
	 * Event handler will be called when {@link Zarafa.settings.SettingsContextModel#savesettings} event is fired.
	 * This will relay this event to {@link Zarafa.plugins.smime.settings.SettingsPublickeyPanel PublickeyPanel} so it can
	 * save certificates.
	 * @private
	 */
	onSaveSettings : function()
	{
		this.certificatesPanel.saveChanges();
	},

	/**
	 * Event handler will be called when {@link Zarafa.settings.SettingsContextModel#discardsettings} event is fired.
	 * This will relay this event to {@link Zarafa.plugins.smime.settings.SettingsPublicKeyPanel PublickeyPanel} so it can
	 * discard current changes and reload public certificates from the server.
	 * @private
	 */
	onDiscardSettings : function()
	{
		this.certificatesPanel.discardChanges();
	}
});

Ext.reg('smime.settingspublickeywidget', Zarafa.plugins.smime.settings.SettingsPublickeyWidget);
