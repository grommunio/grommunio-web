Ext.namespace('Grommunio.plugins.files.ui.dialogs');

/**
 * @class Grommunio.plugins.files.ui.dialogs.FilesRecordContentPanel
 * @extends Grommunio.core.ui.ContentPanel
 * @xtype filesplugin.filesrecordcontentpanel
 *
 * This content panel contains the record information panel.
 */
Grommunio.plugins.files.ui.dialogs.FilesRecordContentPanel = Ext.extend(Grommunio.core.ui.ContentPanel, {

	/**
	 * @constructor
	 * @param {object} config
	 */
	constructor: function (config) {
		config = config || {};

		Ext.applyIf(config, {

			xtype: 'filesplugin.filesrecordcontentpanel',

			layout: 'fit',
			title : _('File information'),
			items : [this.createPanel(config)]
		});

		Grommunio.plugins.files.ui.dialogs.FilesRecordContentPanel.superclass.constructor.call(this, config);
	},

	/**
	 * This creates the {@link Grommunio.plugins.files.ui.FilesRecordDetailsPanel}
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

Ext.reg('filesplugin.filesrecordcontentpanel', Grommunio.plugins.files.ui.dialogs.FilesRecordContentPanel);
