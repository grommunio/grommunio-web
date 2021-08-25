Ext.namespace('Zarafa.plugins.chat.ui');

/**
 * @class Zarafa.plugins.chat.ui.ContentPanel
 * @extends Zarafa.core.ui.ContentPanel
 */
Zarafa.plugins.chat.ui.ContentPanel = Ext.extend(Zarafa.core.ui.ContentPanel, {
	/**
	 * @constructor
	 * @param config Configuration structure
	 */
	constructor : function(config)
	{
		config = config || {};

		Ext.applyIf(config, {
			// Overridden from Ext.Component
			xtype: 'zarafa.plugins.chat.ui.contentpanel',
			layout : 'fit',
			header: false,
			iconCls: 'icon_chat',
			border: false,
			items : [{
				xtype: 'zarafa.plugins.chat.ui.panel',
				url: config.url,
				tabOrder: config.tabOrder
			}]
		});

		Zarafa.plugins.chat.ui.ContentPanel.superclass.constructor.call(this, config);
	}
});

Ext.reg('zarafa.plugins.chat.ui.contentpanel', Zarafa.plugins.chat.ui.ContentPanel);
