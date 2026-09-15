Ext.namespace('Grommunio.plugins.intranet.ui');

/**
 * @class Grommunio.plugins.intranet.ui.ContentPanel
 * @extends Grommunio.core.ui.ContentPanel
 */
Grommunio.plugins.intranet.ui.ContentPanel = Ext.extend(Grommunio.core.ui.ContentPanel, {
	/**
	 * @constructor
	 * @param config Configuration structure
	 */
	constructor : function(config)
	{
		config = config || {};

		Ext.applyIf(config, {
			// Overridden from Ext.Component
			xtype: 'grommunio.plugins.intranet.ui.contentpanel',
			layout : 'fit',
			iconCls: config.iconCls,
			border: false,
			items : [{
				xtype: 'grommunio.plugins.intranet.ui.panel',
				url: config.url,
				tabOrder: config.tabOrder
			}]
		});

		Grommunio.plugins.intranet.ui.ContentPanel.superclass.constructor.call(this, config);
	}
});

Ext.reg('grommunio.plugins.intranet.ui.contentpanel', Grommunio.plugins.intranet.ui.ContentPanel);
