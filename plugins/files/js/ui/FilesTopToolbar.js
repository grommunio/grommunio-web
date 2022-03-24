Ext.namespace('Zarafa.plugins.files.ui');

/**
 * @class Zarafa.plugins.files.ui.FilesTopToolbar
 * @extends Ext.Toolbar
 * @xtype filesplugin.filestoptoolbar
 *
 * The top toolbar for the files explorer.
 */
Zarafa.plugins.files.ui.FilesTopToolbar = Ext.extend(Ext.Toolbar, {
	/**
	 * @cfg {Zarafa.core.Context} context The context to which this toolbar belongs
	 */
	context: undefined,

	/**
	 * The {@link Zarafa.plugins.files.FilesContextModel} which is obtained from the {@link #context}.
	 * @property
	 * @type Zarafa.plugins.files.FilesContextModel
	 */
	model: undefined,

	/**
	 * @constructor
	 * @param config
	 */
	constructor: function (config) {
		config = config || {};

		if (!Ext.isDefined(config.model) && Ext.isDefined(config.context)) {
			config.model = config.context.getModel();
		}

		Ext.applyIf(config, {
			cls: 'files_top_toolbar',
			items: [{
				xtype: 'filesplugin.navigationbar',
				model: config.model,
				accountsStore : config.context.getAccountsStore()
			}, {
				xtype: 'tbfill'
			}, {
				xtype: 'filesplugin.quotabar',
				model: config.model,
				accountsStore : config.context.getAccountsStore()
			}]
		});
		Zarafa.plugins.files.ui.FilesTopToolbar.superclass.constructor.call(this, config);
	}
});

Ext.reg('filesplugin.filestoptoolbar', Zarafa.plugins.files.ui.FilesTopToolbar);
