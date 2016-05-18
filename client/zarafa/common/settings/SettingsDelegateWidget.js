Ext.namespace('Zarafa.common.settings');

/**
 * @class Zarafa.common.settings.SettingsDelegateWidget
 * @extends Zarafa.settings.ui.SettingsWidget
 * @xtype zarafa.settingsdelegatewidget
 *
 * The {@link Zarafa.settings.ui.SettingsWidget widget} for configuring
 * delegation options in the {@link Zarafa.common.settings.SettingsDelegateCategory delegate category}.
 */
Zarafa.common.settings.SettingsDelegateWidget = Ext.extend(Zarafa.settings.ui.SettingsWidget, {

	/**
	 * @constructor
	 * @param {Object} config Configuration object
	 */
	constructor : function(config)
	{
		config = config || {};

		Ext.applyIf(config, {
			height : 400,
			title : _('Delegate settings'),
			xtype : 'zarafa.settingsdelegatewidget',
			layout : {
				// override from SettingsWidget
				type : 'fit'
			},
			items : [{
				xtype : 'zarafa.delegatespanel',
				ref : 'delegatesPanel'
			}]
		});

		Zarafa.common.settings.SettingsDelegateWidget.superclass.constructor.call(this, config);
	},

	/**
	 * @return {Zarafa.common.delegates.data.DelegateStore} The store which is holds all delegates
	 */
	getDelegateStore : function()
	{
		return this.delegatesPanel.store;
	},

	/**
	 * initialize events for the {@link Zarafa.common.settings.SettingsDelegateWidget SettingsDelegateWidget}.
	 * @private
	 */
	initEvents : function()
	{
		Zarafa.common.settings.SettingsDelegateWidget.superclass.initEvents.call(this);

		// listen to savesettings and discardsettings to save/discard delegation data
		var contextModel = this.settingsContext.getModel();

		this.mon(contextModel, 'savesettings', this.onSaveSettings, this);
		this.mon(contextModel, 'discardsettings', this.onDiscardSettings, this);

		this.mon(this.getDelegateStore(), {
			'remove' : this.doStoreRemove,
			'update' : this.doStoreUpdate,
			scope : this
		});
	},

	/**
	 * Event handler for the {@link Ext.data.Store#remove} event which is fired
	 * by the {@link Ext.data.Store} inside the {@link #delegatesPanel}.
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
	 * by the {@link Ext.data.Store} inside the {@link #delegatesPanel}.
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
	 * This will relay this event to {@link Zarafa.common.delegates.ui.DelegatesPanel DelegatesPanel} so it can
	 * save delegation data.
	 * @private
	 */
	onSaveSettings : function()
	{
		this.delegatesPanel.saveChanges();
	},

	/**
	 * Event handler will be called when {@link Zarafa.settings.SettingsContextModel#discardsettings} event is fired.
	 * This will relay this event to {@link Zarafa.common.delegates.ui.DelegatesPanel DelegatesPanel} so it can
	 * discard current changes and reload delegation data from server.
	 * @private
	 */
	onDiscardSettings : function()
	{
		this.delegatesPanel.discardChanges();
	}
});

Ext.reg('zarafa.settingsdelegatewidget', Zarafa.common.settings.SettingsDelegateWidget);
