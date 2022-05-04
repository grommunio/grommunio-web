Ext.namespace('Zarafa.plugins.archive.ui');

/**
 * @class Zarafa.plugins.archive.ui.ContentPanel
 * @extends Zarafa.core.ui.ContentPanel
 */
Zarafa.plugins.archive.ui.ContentPanel = Ext.extend(Zarafa.core.ui.ContentPanel, {
	/**
	 * @constructor
	 * @param config Configuration structure
	 */
	constructor : function(config)
	{
		config = config || {};

		Ext.applyIf(config, {
			// Overridden from Ext.Component
			xtype: 'zarafa.plugins.archive.ui.contentpanel',
			layout : 'fit',
			iconCls: 'icon_archive',
			border: false,
			items : [{
				xtype: 'zarafa.plugins.archive.ui.panel',
				url: config.url,
				tabOrder: config.tabOrder
			}]
		});

		Zarafa.plugins.archive.ui.ContentPanel.superclass.constructor.call(this, config);
	}
});

Ext.reg('zarafa.plugins.archive.ui.contentpanel', Zarafa.plugins.archive.ui.ContentPanel);
