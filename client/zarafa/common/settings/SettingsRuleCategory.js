Ext.namespace('Zarafa.common.settings');

/**
 * @class Zarafa.common.settings.SettingsRuleCategory
 * @extends Zarafa.settings.ui.SettingsCategory
 * @xtype zarafa.settingsrulecategory
 *
 * The rule category to modify inbox rules for user.
 */
Zarafa.common.settings.SettingsRuleCategory = Ext.extend(Zarafa.settings.ui.SettingsCategory, {
	// Insertion points for this class
	/**
	 * @insert context.settings.category.rules
	 * Insertion point to register new {@link Zarafa.settings.ui.SettingsWidget widgets}
	 * for the {@link Zarafa.common.settings.SettingsRuleCategory Rule Category}.
	 * @param {Zarafa.common.settings.SettingsRuleCategory} category The rule
	 * category to which the widgets will be added.
	 */

	/**
	 * @constructor
	 * @param {Object} config Configuration object
	 */
	constructor : function(config)
	{
		config = config || {};

		Ext.applyIf(config, {
			title : _('Rules'),
			categoryIndex : 3,
			xtype : 'zarafa.settingsrulecategory',
			iconCls : 'zarafa-settings-category-rules',
			layout: 'fit',
			items : [{
					xtype : 'zarafa.settingsrulewidget',
					settingsContext : config.settingsContext
				},
				container.populateInsertionPoint('context.settings.category.rules', this)
			]
		});

		Zarafa.common.settings.SettingsRuleCategory.superclass.constructor.call(this, config);
	},

	/**
	 * Called by superclass when the Category has been deselected and is hidden from the user,
	 * this will unregister the {@link #onBeforeSaveRules} event handler.
	 * @private
	 */
	onHide : function()
	{
		Zarafa.common.settings.SettingsRuleCategory.superclass.onHide.apply(this, arguments);

		// Unregister the 'beforesave' event. This could be lingering when
		// 'savesettings' was fired but it was cancelled by one of the
		// event handlers.
		var store = this.get(0).getRulesStore();
		this.mun(store, 'beforesave', this.onBeforeSaveRules, this);
	},

	/**
	 * Event handler for the
	 * {@link Zarafa.settings.SettingsContextModel ContextModel}#{@link Zarafa.settings.SettingsContextModel#beforesavesettings beforesavesettings}
	 * event. It will register the 'beforesave' event on {@link Zarafa.common.rules.data.RulesStore Rules Store}.
	 * @private
	 */
	onBeforeSaveSettingsModel : function()
	{
		var store = this.get(0).getRulesStore();
		this.mon(store, 'beforesave', this.onBeforeSaveRules, this, { single : true });
	},

	/**
	 * Event handler which is fired when the {@link Zarafa.common.rules.data.RulesStore Rules Store}
	 * fires the 'beforesave' event. This will {@link #displaySavingMask show a notification} and register the
	 * event handlers for the completion of the save.
	 * @private
	 */
	onBeforeSaveRules : function()
	{
		this.displaySavingMask();

		var store = this.get(0).getRulesStore();
		this.mon(store, 'save', this.onRulesSave, this);
		this.mon(store, 'exception', this.onRulesException, this);
	},

	/**
	 * Event handler which is fired when the {@link Zarafa.common.rules.data.RulesStore Rules Store}
	 * fires the 'save' event indicating the successfull save of the rules. This will
	 * {@link #hideSavingMask hide the notification}.
	 * @private
	 */
	onRulesSave : function()
	{
		this.hideSavingMask(true);

		var store = this.get(0).getRulesStore();
		this.mun(store, 'save', this.onRulesSave, this);
		this.mun(store, 'exception', this.onRulesException, this);
	},

	/**
	 * Event handler which is fired when the {@link Zarafa.common.rules.data.RulesStore Rules Store}
	 * fires the 'exception' event indicating a failing save of the rules. This will
	 * {@link #hideSavingMask hide the notification}.
	 * @private
	 */
	onRulesException : function()
	{
		this.hideSavingMask(false);

		var store = this.get(0).getRulesStore();
		this.mun(store, 'save', this.onRulesSave, this);
		this.mun(store, 'exception', this.onRulesException, this);
	}
});

Ext.reg('zarafa.settingsrulecategory', Zarafa.common.settings.SettingsRuleCategory);
