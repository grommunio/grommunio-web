Ext.namespace('Zarafa.plugins.files.ui.dialogs');

/**
 * @class Zarafa.plugins.files.ui.dialogs.AttachFromFilesContentPanel
 * @extends Zarafa.core.ui.ContentPanel
 * @xtype filesplugin.attachfromfilescontentpanel
 *
 * This content panel contains the download tree panel for attaching item to emails.
 */
Zarafa.plugins.files.ui.dialogs.AttachFromFilesContentPanel = Ext.extend(Zarafa.core.ui.ContentPanel, {

	/**
	 * @constructor
	 * @param config
	 */
	constructor: function (config) {
		config = config || {};
		Ext.applyIf(config, {
			layout : 'fit',
			title : dgettext('plugin_files', 'Add attachment from Files'),
			closeOnSave: true,
			width : 400,
			height : 300,
			items: [{
				xtype :'filesplugin.attachfromfilespanel',
				model : config.model,
				emailrecord: config.record,
			}]
		});

		Zarafa.plugins.files.ui.dialogs.AttachFromFilesContentPanel.superclass.constructor.call(this, config);
	}
});

Ext.reg('filesplugin.attachfromfilescontentpanel', Zarafa.plugins.files.ui.dialogs.AttachFromFilesContentPanel);
