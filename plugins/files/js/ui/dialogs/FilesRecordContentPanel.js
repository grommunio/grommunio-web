Ext.namespace('Zarafa.plugins.files.ui.dialogs');

/**
 * @class Zarafa.plugins.files.ui.dialogs.FilesRecordContentPanel
 * @extends Zarafa.core.ui.ContentPanel
 * @xtype filesplugin.filesrecordcontentpanel
 *
 * This content panel contains the record information panel.
 */
Zarafa.plugins.files.ui.dialogs.FilesRecordContentPanel = Ext.extend(Zarafa.core.ui.ContentPanel, {

	/**
	 * @constructor
	 * @param {object} config
	 */
	constructor: function (config) {
		config = config || {};

		Ext.applyIf(config, {

			xtype: 'filesplugin.filesrecordcontentpanel',

			layout: 'fit',
			title : dgettext('plugin_files', 'File information'),
			items : [this.createPanel(config)]
		});

		Zarafa.plugins.files.ui.dialogs.FilesRecordContentPanel.superclass.constructor.call(this, config);
	},

	/**
	 * This creates the {@link Zarafa.plugins.files.ui.FilesRecordDetailsPanel}
	 * @param config
	 * @returns {object}
	 */
	createPanel: function (config) {

		return {
			xtype : 'filesplugin.filesrecorddetailspanel',
			record: config.record
		};
	}
});

Ext.reg('filesplugin.filesrecordcontentpanel', Zarafa.plugins.files.ui.dialogs.FilesRecordContentPanel);
