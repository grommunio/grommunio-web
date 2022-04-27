Ext.namespace('Zarafa.plugins.files.ui.dialogs');

/**
 * @class Zarafa.plugins.files.ui.dialogs.CreateFileContentPanel
 * @extends Zarafa.core.ui.RecordContentPanel
 * @xtype filesplugin.createfilecontentpanel
 *
 * Create file content panel provide the {@link Zarafa.plugins.files.ui.Tree Tree} to create
 * the new file in that.
 */
Zarafa.plugins.files.ui.dialogs.CreateFileContentPanel = Ext.extend(Zarafa.core.ui.RecordContentPanel, {

	/**
	 * @constructor
	 * @param config Configuration structure
	 */
	constructor : function(config)
	{
		config = config || {};
		const filetypeTitle = config.button.text || 'Document';

		Ext.applyIf(config, {
			xtype : 'zarafa.createfilecontentpanel',
			layout: 'fit',
			title : _('Create New ' + filetypeTitle),
			showLoadMask: false,
			showInfoMask: false,
			width: 300,
			height: 60,
			items: [{
				xtype: 'filesplugin.createfilepanel',
				accountFilter : config.accountFilter,
				parentFolder : config.parentFolder,
				model : config.model,
				filetype: config.filetype
			}]
		});

		Zarafa.plugins.files.ui.dialogs.CreateFileContentPanel.superclass.constructor.call(this, config);
	}
});

Ext.reg('filesplugin.createfilecontentpanel', Zarafa.plugins.files.ui.dialogs.CreateFileContentPanel);
