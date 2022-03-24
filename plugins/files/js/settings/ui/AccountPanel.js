Ext.namespace('Zarafa.plugins.files.settings.ui');

/**
 * @class Zarafa.plugins.files.settings.ui.AccountPanel
 * @extends Ext.grid.GridPanel
 * @xtype filesplugin.accountpanel
 * The main gridpanel for our data
 */
Zarafa.plugins.files.settings.ui.AccountPanel = Ext.extend(Ext.Panel, {
	/**
	 * @constructor
	 * @param {Object} config Configuration object
	 */
	constructor: function (config)
	{
		config = Ext.applyIf(config || {}, {
			border: false,
			layout: 'fit',
			items : [{
				xtype: "filesplugin.accountgrid",
				backendStore : config.model.backendStore,
				store : config.store,
				flex : 1
			}]
		});

		Zarafa.plugins.files.settings.ui.AccountPanel.superclass.constructor.call(this, config);
	}
});
Ext.reg('filesplugin.accountpanel', Zarafa.plugins.files.settings.ui.AccountPanel);