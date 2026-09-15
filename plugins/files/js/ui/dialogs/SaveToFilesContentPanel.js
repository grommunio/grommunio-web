Ext.namespace('Grommunio.plugins.files.ui.dialogs');

/**
 * @class Grommunio.plugins.files.ui.dialogs.SaveToFilesContentPanel
 * @extends Grommunio.core.ui.ContentPanel
 * @xtype filesplugin.savetofilescontentpanel
 *
 * This content panel contains the upload panel for storing files to the backend.
 */
Grommunio.plugins.files.ui.dialogs.SaveToFilesContentPanel = Ext.extend(Grommunio.core.ui.ContentPanel, {

	/**
	 * @constructor
	 * @param config
	 */
	constructor: function (config) {
		config = config || {};

		Ext.applyIf(config, {
			layout     : 'fit',
			title      : _('Add item to Files'),
			closeOnSave: true,
			width      : 400,
			height     : 300,
			items: [{
				xtype   : 'filesplugin.savetofilespanel',
				response: config.response,
				model : config.model
			}]
		});

		Grommunio.plugins.files.ui.dialogs.SaveToFilesContentPanel.superclass.constructor.call(this, config);
	}
});

Ext.reg('filesplugin.savetofilescontentpanel', Grommunio.plugins.files.ui.dialogs.SaveToFilesContentPanel);
