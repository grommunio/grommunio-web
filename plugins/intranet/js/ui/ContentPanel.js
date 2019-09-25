Ext.namespace('Zarafa.plugins.intranet.ui');

/**
 * @class Zarafa.plugins.intranet.ui.ContentPanel
 * @extends Zarafa.core.ui.ContentPanel
 */
Zarafa.plugins.intranet.ui.ContentPanel = Ext.extend(Zarafa.core.ui.ContentPanel, {
	/**
	 * @constructor
	 * @param config Configuration structure
	 */
	constructor : function(config)
	{
		config = config || {};

		Ext.applyIf(config, {
			// Overridden from Ext.Component
			xtype: 'zarafa.plugins.intranet.ui.contentpanel',
			layout : 'fit',
			iconCls: config.iconCls,
			border: false,
			items : [{
				xtype: 'zarafa.plugins.intranet.ui.panel',
				url: config.url,
				tabOrder: config.tabOrder
			}]
		});

		Zarafa.plugins.intranet.ui.ContentPanel.superclass.constructor.call(this, config);
	}
});

Ext.reg('zarafa.plugins.intranet.ui.contentpanel', Zarafa.plugins.intranet.ui.ContentPanel);
