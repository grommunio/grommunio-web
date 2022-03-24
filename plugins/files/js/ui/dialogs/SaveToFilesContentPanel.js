Ext.namespace('Zarafa.plugins.files.ui.dialogs');

/**
 * @class Zarafa.plugins.files.ui.dialogs.SaveToFilesContentPanel
 * @extends Zarafa.core.ui.ContentPanel
 * @xtype filesplugin.savetofilescontentpanel
 *
 * This content panel contains the upload panel for storing files to the backend.
 */
Zarafa.plugins.files.ui.dialogs.SaveToFilesContentPanel = Ext.extend(Zarafa.core.ui.ContentPanel, {

	/**
	 * @constructor
	 * @param config
	 */
	constructor: function (config) {
		config = config || {};

		Ext.applyIf(config, {
			layout     : 'fit',
			title      : dgettext('plugin_files', 'Add item to Files'),
			closeOnSave: true,
			width      : 400,
			height     : 300,
			items: [{
				xtype   : 'filesplugin.savetofilespanel',
				response: config.response,
				model : config.model
			}]
		});

		Zarafa.plugins.files.ui.dialogs.SaveToFilesContentPanel.superclass.constructor.call(this, config);
	}
});

Ext.reg('filesplugin.savetofilescontentpanel', Zarafa.plugins.files.ui.dialogs.SaveToFilesContentPanel);
