Ext.namespace('Grommunio.plugins.files.ui');

/**
 * @class Grommunio.plugins.files.ui.ContentPanel
 * @extends Grommunio.core.ui.ContentPanel
 */
Grommunio.plugins.files.ui.ContentPanel = Ext.extend(Grommunio.core.ui.ContentPanel, {
	/**
	 * @constructor
	 * @param config Configuration structure
	 */
	constructor : function(config)
	{
		config = config || {};

		Ext.applyIf(config, {
			// Overridden from Ext.Component
			xtype: 'grommunio.plugins.files.ui.contentpanel',
			layout : 'fit',
			header: false,
			iconCls: 'icon_files',
			border: false,
			items : [{
				xtype: 'grommunio.plugins.files.ui.onlyofficepanel',
				url: config.url,
				src: config.src,
				origin: config.origin,
				callback: config.callback,
				scope: config.scope,
				record: config.record,
				tabOrder: config.tabOrder
			}]
		});

		Grommunio.plugins.files.ui.ContentPanel.superclass.constructor.call(this, config);
	}
});

Ext.reg('grommunio.plugins.files.ui.contentpanel', Grommunio.plugins.files.ui.ContentPanel);
