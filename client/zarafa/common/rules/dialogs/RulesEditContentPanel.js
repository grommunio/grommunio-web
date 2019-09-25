Ext.namespace('Zarafa.common.rules.dialogs');

/**
 * @class Zarafa.common.rules.dialogs.RulesEditContentPanel
 * @extends Zarafa.core.ui.RecordContentPanel
 * @xtype zarafa.ruleseditcontentpanel
 *
 * {@link Zarafa.common.rules.dialogs.RulesEditContentPanel RulesEditContentPanel} will be used to edit the rules.
 */
Zarafa.common.rules.dialogs.RulesEditContentPanel = Ext.extend(Zarafa.core.ui.RecordContentPanel, {
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
			xtype : 'zarafa.ruleseditcontentpanel',
			// Override from Ext.Component
			layout : 'fit',
			modal : true,
			cls: 'k-ruleseditpanel',
			recordComponentPluginConfig : Ext.applyIf(config.recordComponentPluginConfig || {}, {
				allowWrite : true,
				useShadowStore : true
			}),
			autoSave : false,
			width : 600,
			height : 457,
			title : _('Inbox Rule'),
			items : [{
				xtype : 'zarafa.ruleseditpanel',
				storeEntryId: config.record.getStore().storeEntryId,
				buttons : [{
					text : _('Save'),
					handler : this.onOk,
					scope : this
				},{
					text : _('Cancel'),
					handler : this.onCancel,
					scope : this
				}]
			}]
		});

		Zarafa.common.rules.dialogs.RulesEditContentPanel.superclass.constructor.call(this, config);
	}
});

Ext.reg('zarafa.ruleseditcontentpanel', Zarafa.common.rules.dialogs.RulesEditContentPanel);
