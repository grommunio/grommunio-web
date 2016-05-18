Ext.namespace('Zarafa.hierarchy.dialogs');

/**
 * @class Zarafa.hierarchy.dialogs.FolderSizeContentPanel
 * @extends Zarafa.core.ui.RecordContentPanel
 * @xtype folderzarafa.sizecontentpanel
 *
 * This will display a {@link Zarafa.core.ui.ContentPanel contentpanel}
 * for displaying the size of the {@link Zarafa.hierarchy.data.MAPIFolderRecord folder} and the subfolders.
 */
Zarafa.hierarchy.dialogs.FolderSizeContentPanel = Ext.extend(Zarafa.core.ui.RecordContentPanel, {
	/**
	 * @constructor
	 * @param config Configuration structure
	 */
	constructor : function(config)
	{
		config = config || {};

		Ext.applyIf(config, {
			// Override from Ext.Component
			xtype : 'zarafa.foldersizecontentpanel',
			layout: 'fit',
			title : _('Folder Size'),
			recordComponentPluginConfig : Ext.applyIf(config.recordComponentPluginConfig || {}, {
				allowWrite : true,
				useShadowStore : true
			}),
			closeOnSave : true,
			width: 360,
			height: 360,
			items: [{
				xtype: 'zarafa.foldersizepanel',
				buttons : [{
					text : _('Close'),
					handler : this.close,
					scope: this
				}]
			}]
		});

		Zarafa.hierarchy.dialogs.FolderSizeContentPanel.superclass.constructor.call(this, config);
	}
});

Ext.reg('zarafa.foldersizecontentpanel', Zarafa.hierarchy.dialogs.FolderSizeContentPanel);
