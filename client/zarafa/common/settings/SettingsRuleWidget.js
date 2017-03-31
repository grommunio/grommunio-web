Ext.namespace('Zarafa.common.settings');

/**
 * @class Zarafa.common.settings.SettingsRuleWidget
 * @extends Zarafa.settings.ui.SettingsWidget
 * @xtype zarafa.settingsrulewidget
 *
 * The {@link Zarafa.settings.ui.SettingsWidget widget} for configuring
 * delegation options in the {@link Zarafa.common.settings.SettingsRuleCategory rule category}.
 */
Zarafa.common.settings.SettingsRuleWidget = Ext.extend(Zarafa.settings.ui.SettingsWidget, {

	/**
	 * @constructor
	 * @param {Object} config Configuration object
	 */
	constructor : function(config)
	{
		config = config || {};

		Ext.applyIf(config, {
			title : _('Rules'),
			xtype : 'zarafa.settingsrulewidget',
			cls: 'zarafa-settings-widget k-rules-widget',
			layout : {
				// override from SettingsWidget
				type : 'fit'
			},
			items : [{
				xtype : 'zarafa.rulespanel',
				ref : 'rulesPanel'
			}]
		});

		Zarafa.common.settings.SettingsRuleWidget.superclass.constructor.call(this, config);
	},

	/**
	 * @return {Zarafa.common.rules.data.RulesStore} The store which is holds all rules
	 */
	getRulesStore : function()
	{
		return this.rulesPanel.store;
	},

	/**
	 * initialize events for the {@link Zarafa.common.settings.SettingsDelegateWidget SettingsDelegateWidget}.
	 * @private
	 */
	initEvents : function()
	{
		Zarafa.common.settings.SettingsRuleWidget.superclass.initEvents.call(this);

		// listen to savesettings and discardsettings to save/discard rules data
		var contextModel = this.settingsContext.getModel();

		this.mon(contextModel, 'savesettings', this.onSaveSettings, this);
		this.mon(contextModel, 'discardsettings', this.onDiscardSettings, this);

		this.mon(this.getRulesStore(), {
			// Don't listen to the 'add' event,
			// when the UI adds a rule, it will fire
			// the 'update' event when the rule is
			// completely filled in.
			'remove' : this.doStoreRemove,
			'update' : this.doStoreUpdate,
			scope : this
		});
	},

	/**
	 * Event handler for the {@link Ext.data.Store#remove} event which is fired
	 * by the {@link Ext.data.Store} inside the {@link #rulesPanel}.
	 * This will mark the {@link Zarafa.settings.SettingsContextModel} as
	 * {@link Zarafa.settings.SettingsContextModel#setDirty dirty}.
	 * @param {Ext.data.Store} store The store which fired the event
	 * @param {Ext.data.Record} record The record which was updated
	 * @private
	 */
	doStoreRemove : function(store, record)
	{
		if (record.phantom !== true) {
			this.settingsContext.getModel().setDirty();
		}
	},

	/**
	 * Event handler for the {@link Ext.data.Store#update} event which is fired
	 * by the {@link Ext.data.Store} inside the {@link #rulesPanel}.
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
	 * This will relay this event to {@link Zarafa.common.delegates.ui.RulesPanel RulesPanel} so it can
	 * save rules data.
	 * @private
	 */
	onSaveSettings : function()
	{
		this.rulesPanel.saveChanges();
	},

	/**
	 * Event handler will be called when {@link Zarafa.settings.SettingsContextModel#discardsettings} event is fired.
	 * This will relay this event to {@link Zarafa.common.delegates.ui.RulesPanel RulesPanel} so it can
	 * discard current changes and reload rules data from server.
	 * @private
	 */
	onDiscardSettings : function()
	{
		this.rulesPanel.discardChanges();
	}
});

Ext.reg('zarafa.settingsrulewidget', Zarafa.common.settings.SettingsRuleWidget);
