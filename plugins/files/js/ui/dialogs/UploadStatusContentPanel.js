Ext.namespace('Grommunio.plugins.files.ui.dialogs');

/**
 * @class Grommunio.plugins.files.ui.dialogs.UploadStatusContentPanel
 * @extends Grommunio.core.ui.ContentPanel
 * @xtype filesplugin.uploadstatuscontentpanel
 *
 * The content panel for the main upload status panel.
 */
Grommunio.plugins.files.ui.dialogs.UploadStatusContentPanel = Ext.extend(Grommunio.core.ui.ContentPanel, {

	/**
	 * @constructor
	 * @param config
	 */
	constructor: function (config) {
		config = config || {};
		Ext.applyIf(config, {
			layout : 'fit',
			title : _('Uploading files to ') + Grommunio.plugins.files.data.Utils.File.stripAccountId(config.destination) + ' &hellip;',
			closeOnSave : true,
			width : 480,
			height : 445,
			items: [{
				xtype : 'filesplugin.uploadstatuspanel',
				files : config.files,
				destination : config.destination,
				keepBoth : config.keepBoth,
				callbackAllDone : config.callbackAllDone || Ext.emptyFn,
				callbackUploadFailed : config.callbackUploadFailed || Ext.emptyFn,
				callbackUploadAborted : config.callbackUploadAborted || Ext.emptyFn,
				store : config.store
			}]
		});

		Grommunio.plugins.files.ui.dialogs.UploadStatusContentPanel.superclass.constructor.call(this, config);
	}
});

Ext.reg('filesplugin.uploadstatuscontentpanel', Grommunio.plugins.files.ui.dialogs.UploadStatusContentPanel);
