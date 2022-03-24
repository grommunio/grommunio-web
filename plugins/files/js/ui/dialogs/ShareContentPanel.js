Ext.namespace('Zarafa.plugins.files.ui.dialogs');

/**
 * @class Zarafa.plugins.files.ui.dialogs.ShareContentPanel
 * @extends Zarafa.core.ui.ContentPanel
 * @xtype filesplugin.sharecontentpanel
 *
 * This content panel contains the sharing panel.
 */
Zarafa.plugins.files.ui.dialogs.ShareContentPanel = Ext.extend(Zarafa.core.ui.ContentPanel, {

	/**
	 * @var {Array} records
	 */
	records: null,

	/**
	 * @constructor
	 * @param config
	 */
	constructor: function (config) {
		config = config || {};
		Ext.applyIf(config, {
			layout     : 'fit',
			title      : dgettext('plugin_files', 'Share Files'),
			width      : 800,
			height     : 500,
			items: [
				container.populateInsertionPoint('plugin.files.sharedialog', this, config.context)
			]
		});

		Zarafa.plugins.files.ui.dialogs.ShareContentPanel.superclass.constructor.call(this, config);
	}
});

Ext.reg('filesplugin.sharecontentpanel', Zarafa.plugins.files.ui.dialogs.ShareContentPanel);
