Ext.namespace('Grommunio.plugins.files.ui.dialogs');

/**
 * @class Grommunio.plugins.files.ui.dialogs.ShareContentPanel
 * @extends Grommunio.core.ui.ContentPanel
 * @xtype filesplugin.sharecontentpanel
 *
 * This content panel contains the sharing panel.
 */
Grommunio.plugins.files.ui.dialogs.ShareContentPanel = Ext.extend(Grommunio.core.ui.ContentPanel, {

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
			title      : _('Share Files'),
			width      : 800,
			height     : 500,
			items: [
				container.populateInsertionPoint('plugin.files.sharedialog', this, config.context)
			]
		});

		Grommunio.plugins.files.ui.dialogs.ShareContentPanel.superclass.constructor.call(this, config);
	}
});

Ext.reg('filesplugin.sharecontentpanel', Grommunio.plugins.files.ui.dialogs.ShareContentPanel);
