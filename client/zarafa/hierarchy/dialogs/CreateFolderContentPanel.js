Ext.namespace('Zarafa.hierarchy.dialogs');

/**
 * @class Zarafa.hierarchy.dialogs.CreateFolderContentPanel
 * @extends Zarafa.core.ui.ContentPanel
 * @xtype zarafa.createfoldercontentpanel
 */
Zarafa.hierarchy.dialogs.CreateFolderContentPanel = Ext.extend(Zarafa.core.ui.RecordContentPanel, {
	/**
	 * @cfg {Zarafa.hierarchy.data.MAPIFolderRecord} parentFolder (optional) The parent folder
	 * underneath the new folder will be created.
	 */
	parentFolder : undefined,
	/**
	 * @cfg {String} preferredContainerClass (optional) The preferred container
	 * class for the newly created Folder.
	 */
	preferredContainerClass : undefined,
	/**
	 * @constructor
	 * @param config Configuration structure
	 */
	constructor : function(config)
	{
		config = config || {};

		config = Ext.applyIf(config, {
			// Override from Ext.Component
			xtype : 'zarafa.createfoldercontentpanel',
			layout: 'fit',
			title : _('Create New Folder'),
			recordComponentPluginConfig : Ext.applyIf(config.recordComponentPluginConfig || {}, {
				allowWrite : true,
				ignoreUpdates : false,
				useShadowStore : true
			}),
			width: 330,
			height: 380,
			items: [{
				xtype: 'zarafa.createfolderpanel',
				parentFolder: config.parentFolder,
				preferredContainerClass: config.preferredContainerClass
			}]
		});

		Zarafa.hierarchy.dialogs.CreateFolderContentPanel.superclass.constructor.call(this, config);
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
		Zarafa.hierarchy.dialogs.CreateFolderContentPanel.superclass.onUpdateRecord.apply(this, arguments);

		if (action == Ext.data.Record.COMMIT) {
			this.close();
			return false;
		}
	}
});

Ext.reg('zarafa.createfoldercontentpanel', Zarafa.hierarchy.dialogs.CreateFolderContentPanel);
