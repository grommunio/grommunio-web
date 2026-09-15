Ext.namespace('Grommunio.plugins.files.settings.ui');

/**
 * @class Grommunio.plugins.files.settings.ui.AccountPanel
 * @extends Ext.grid.GridPanel
 * @xtype filesplugin.accountpanel
 * The main gridpanel for our data
 */
Grommunio.plugins.files.settings.ui.AccountPanel = Ext.extend(Ext.Panel, {
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
				store : config.store,
				flex : 1
			}]
		});

		Grommunio.plugins.files.settings.ui.AccountPanel.superclass.constructor.call(this, config);
	}
});
Ext.reg('filesplugin.accountpanel', Grommunio.plugins.files.settings.ui.AccountPanel);