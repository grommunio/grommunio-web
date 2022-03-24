Ext.namespace('Zarafa.plugins.files.ui.dialogs');

/**
 * @class Zarafa.plugins.files.ui.dialogs.CreateFolderContentPanel
 * @extends Zarafa.core.ui.RecordContentPanel
 * @xtype filesplugin.createfoldercontentpanel
 *
 * Create folder content panel provide the {@link Zarafa.plugins.files.ui.Tree Tree} to create
 * the new folder in that.
 */
Zarafa.plugins.files.ui.dialogs.CreateFolderContentPanel = Ext.extend(Zarafa.core.ui.RecordContentPanel, {

	/**
	 * @constructor
	 * @param config Configuration structure
	 */
	constructor : function(config)
	{
		config = config || {};

		Ext.applyIf(config, {
			xtype : 'zarafa.createfoldercontentpanel',
			layout: 'fit',
			title : dgettext('plugin_files', 'Create New Folder'),
			recordComponentPluginConfig : Ext.applyIf(config.recordComponentPluginConfig || {}, {
				allowWrite : true,
				ignoreUpdates : false,
				useShadowStore : true,
				shadowStore : new Zarafa.plugins.files.data.FilesShadowStore()
			}),
			showLoadMask: false,
			showInfoMask: false,
			width: 300,
			height: 350,
			items: [{
				xtype: 'filesplugin.createfolderpanel',
				accountFilter : config.accountFilter,
				parentFolder : config.parentFolder,
				model : config.model
			}]
		});

		Zarafa.plugins.files.ui.dialogs.CreateFolderContentPanel.superclass.constructor.call(this, config);
	},
	/**
	 * Fired when the {@link #updaterecord} event has been fired. This will close the panel if the record
	 * is being {@link Ext.data.Record#COMMIT committed}.
	 *
	 * @param {Zarafa.core.ui.RecordContentPanel} contentpanel The record which fired the event
	 * @param {String} action write Action that ocurred. Can be one of
	 * {@link Ext.data.Record.EDIT EDIT}, {@link Ext.data.Record.REJECT REJECT} or
	 * {@link Ext.data.Record.COMMIT COMMIT}
	 * @param {Zarafa.core.data.IPMRecord} record The record which was updated
	 * @private
	 * @overridden
	 */
	onUpdateRecord : function(contentpanel, action, record)
	{
		Zarafa.plugins.files.ui.dialogs.CreateFolderContentPanel.superclass.onUpdateRecord.apply(this, arguments);

		if (action == Ext.data.Record.COMMIT) {
			this.close();
			return false;
		}
	}
});

Ext.reg('filesplugin.createfoldercontentpanel', Zarafa.plugins.files.ui.dialogs.CreateFolderContentPanel);
