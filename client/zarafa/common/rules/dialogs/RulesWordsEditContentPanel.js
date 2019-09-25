Ext.namespace('Zarafa.common.rules.dialogs');

/**
 * @class Zarafa.common.rules.dialogs.RulesWordsEditContentPanel
 * @extends Zarafa.core.ui.ContentPanel
 * @xtype zarafa.ruleswordseditcontentpanel
 *
 * Content Panel to edit the {@link Zarafa.common.rules.data.ConditionFlags#SUBJECT_WORDS} condition
 * for a {@link Zarafa.common.rules.data.RulesRecord Rule}.
 */
Zarafa.common.rules.dialogs.RulesWordsEditContentPanel = Ext.extend(Zarafa.core.ui.ContentPanel, {
	/**
	 * @cfg {Ext.data.Store} store The store which contains the words on which
	 * is being filtered.
	 */
	store : undefined,

	/**
	 * @constructor
	 * @param config Configuration structure
	 */
	constructor : function(config)
	{
		config = config || {};

		// Add in some standard configuration data.
		Ext.applyIf(config, {
			// Override from Ext.Component
			xtype : 'zarafa.ruleswordseditcontentpanel',
			// Override from Ext.Component
			layout : 'fit',
			width : 500,
			height : 300,
			title : _('Specify Words or Phrases'),
			items : [{
				xtype : 'zarafa.ruleswordseditpanel',
				ref : 'rulesWordsEditPanel',
				store : config.store,
				buttons : [{
					text : _('Ok'),
					handler : this.onOk,
					scope : this
				},{
					text : _('Cancel'),
					handler : this.onCancel,
					scope : this
				}]
			}]
		});

		Zarafa.common.rules.dialogs.RulesWordsEditContentPanel.superclass.constructor.call(this, config);
	},

	/**
	 * Event handler which is fired when the user pressed the
	 * 'Ok' button. This will call {@link #callback} and {@link #close}
	 * the content panel.
	 * @private
	 */
	onOk : function()
	{
		// In case word field still contain some word to add.
		if (this.rulesWordsEditPanel.onWordAdd() !== false) {
			if (Ext.isFunction(this.callback)) {
				this.callback.call(this.scope || this, this.store);
			}
			this.close();
		}
	},

	/**
	 * Event handler which is fired when the user pressed the
	 * 'Cancel' button. This will discard all changes and {@link #close}
	 * the content panel.
	 * @private
	 */
	onCancel : function()
	{
		this.close();
	}
});
Ext.reg('zarafa.ruleswordseditcontentpanel', Zarafa.common.rules.dialogs.RulesWordsEditContentPanel);
