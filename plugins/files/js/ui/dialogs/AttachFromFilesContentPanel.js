Ext.namespace('Grommunio.plugins.files.ui.dialogs');

/**
 * @class Grommunio.plugins.files.ui.dialogs.AttachFromFilesContentPanel
 * @extends Grommunio.core.ui.ContentPanel
 * @xtype filesplugin.attachfromfilescontentpanel
 *
 * This content panel contains the download tree panel for attaching item to emails.
 */
Grommunio.plugins.files.ui.dialogs.AttachFromFilesContentPanel = Ext.extend(Grommunio.core.ui.ContentPanel, {

	/**
	 * @constructor
	 * @param config
	 */
	constructor: function (config) {
		config = config || {};
		Ext.applyIf(config, {
			layout : 'fit',
			title : _('Add attachment from Files'),
			closeOnSave: true,
			width : 400,
			height : 300,
			items: [{
				xtype :'filesplugin.attachfromfilespanel',
				model : config.model,
				emailrecord: config.record,
			}]
		});

		Grommunio.plugins.files.ui.dialogs.AttachFromFilesContentPanel.superclass.constructor.call(this, config);
	}
});

Ext.reg('filesplugin.attachfromfilescontentpanel', Grommunio.plugins.files.ui.dialogs.AttachFromFilesContentPanel);
