Ext.namespace('Grommunio.plugins.chat.ui');

/**
 * @class Grommunio.plugins.chat.ui.ContentPanel
 * @extends Grommunio.core.ui.ContentPanel
 */
Grommunio.plugins.chat.ui.ContentPanel = Ext.extend(Grommunio.core.ui.ContentPanel, {
	/**
	 * @constructor
	 * @param config Configuration structure
	 */
	constructor : function(config)
	{
		config = config || {};

		Ext.applyIf(config, {
			// Overridden from Ext.Component
			xtype: 'grommunio.plugins.chat.ui.contentpanel',
			layout : 'fit',
			header: false,
			iconCls: 'icon_chat',
			border: false,
			items : [{
				xtype: 'grommunio.plugins.chat.ui.panel',
				url: config.url,
				tabOrder: config.tabOrder
			}]
		});

		Grommunio.plugins.chat.ui.ContentPanel.superclass.constructor.call(this, config);
	}
});

Ext.reg('grommunio.plugins.chat.ui.contentpanel', Grommunio.plugins.chat.ui.ContentPanel);
