Ext.namespace('Zarafa.plugins.files.ui');

/**
 * @class Zarafa.plugins.files.ui.ContentPanel
 * @extends Zarafa.core.ui.ContentPanel
 */
Zarafa.plugins.files.ui.ContentPanel = Ext.extend(Zarafa.core.ui.ContentPanel, {
	/**
	 * @constructor
	 * @param config Configuration structure
	 */
	constructor : function(config)
	{
		config = config || {};

		Ext.applyIf(config, {
			// Overridden from Ext.Component
			xtype: 'zarafa.plugins.files.ui.contentpanel',
			layout : 'fit',
			header: false,
			iconCls: 'icon_files',
			border: false,
			items : [{
				xtype: 'zarafa.plugins.files.ui.onlyofficepanel',
				url: config.url,
				record: config.record,
				tabOrder: config.tabOrder
			}]
		});

		Zarafa.plugins.files.ui.ContentPanel.superclass.constructor.call(this, config);
	}
});

Ext.reg('zarafa.plugins.files.ui.contentpanel', Zarafa.plugins.files.ui.ContentPanel);
