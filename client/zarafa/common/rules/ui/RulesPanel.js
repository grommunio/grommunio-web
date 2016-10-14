Ext.namespace('Zarafa.common.rules.ui');

/**
 * @class Zarafa.common.rules.ui.RulesPanel
 * @extends Ext.Panel
 * @xtype zarafa.rulespanel
 * Will generate UI for the {@link Zarafa.common.settings.SettingsRuleWidget SettingsRuleWidget}.
 */
Zarafa.common.rules.ui.RulesPanel = Ext.extend(Ext.Panel, {
	/**
	 * @cfg {Zarafa.common.rules.data.RulesStore} store store to use for loading rules
	 */
	store : undefined,

	/**
	 * @constructor
	 * @param config Configuration structure
	 */
	constructor : function(config)
	{
		config = config || {};

		if(Ext.isEmpty(config.store)) {
			config.store = new Zarafa.common.rules.data.RulesStore();
		}

		Ext.applyIf(config, {
			// Override from Ext.Component
			xtype : 'zarafa.rulespanel',
			border : false,
			layout : 'fit',
			items : this.createPanelItems(config)
		});

		Zarafa.common.rules.ui.RulesPanel.superclass.constructor.call(this, config);
	},

	/**
	 * Function will create panel items for {@link Zarafa.common.rules.ui.RulesPanel RulesPanel}
	 * @param {Array} config config passed to the constructor
	 * @return {Array} array of items that should be added to panel.
	 * @private
	 */
	createPanelItems : function(config)
	{
		return [{
			xtype : 'container',
			layout : {
				type : 'vbox',
				align : 'stretch',
				pack  : 'start'
			},
			items : [{
				xtype : 'zarafa.rulesgrid',
				ref : '../rulesGrid',
				flex : 1,
				store : config.store
			}]
		}];
	},

	/**
	 * Function will be used to reload data in the {@link Zarafa.common.rules.data.RulesStore RulesStore}.
	 */
	discardChanges : function()
	{
		this.store.load();
	},

	/**
	 * Function will be used to save changes in the {@link Zarafa.common.rules.data.RulesStore RulesStore}.
	 */
	saveChanges : function()
	{
		this.store.save();
	}
});

Ext.reg('zarafa.rulespanel', Zarafa.common.rules.ui.RulesPanel);
