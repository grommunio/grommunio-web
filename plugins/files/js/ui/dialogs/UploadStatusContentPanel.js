Ext.namespace('Zarafa.plugins.files.ui.dialogs');

/**
 * @class Zarafa.plugins.files.ui.dialogs.UploadStatusContentPanel
 * @extends Zarafa.core.ui.ContentPanel
 * @xtype filesplugin.uploadstatuscontentpanel
 *
 * The content panel for the main upload status panel.
 */
Zarafa.plugins.files.ui.dialogs.UploadStatusContentPanel = Ext.extend(Zarafa.core.ui.ContentPanel, {

	/**
	 * @constructor
	 * @param config
	 */
	constructor: function (config) {
		config = config || {};
		Ext.applyIf(config, {
			layout : 'fit',
			title : dgettext('plugin_files', 'Uploading files to ') + Zarafa.plugins.files.data.Utils.File.stripAccountId(config.destination) + ' &hellip;',
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

		Zarafa.plugins.files.ui.dialogs.UploadStatusContentPanel.superclass.constructor.call(this, config);
	}
});

Ext.reg('filesplugin.uploadstatuscontentpanel', Zarafa.plugins.files.ui.dialogs.UploadStatusContentPanel);
