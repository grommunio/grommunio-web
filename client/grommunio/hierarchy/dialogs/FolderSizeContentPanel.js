Ext.namespace('Grommunio.hierarchy.dialogs');

/**
 * @class Grommunio.hierarchy.dialogs.FolderSizeContentPanel
 * @extends Grommunio.core.ui.RecordContentPanel
 * @xtype foldergrommunio.sizecontentpanel
 *
 * This will display a {@link Grommunio.core.ui.ContentPanel contentpanel}
 * for displaying the size of the {@link Grommunio.hierarchy.data.MAPIFolderRecord folder} and the subfolders.
 */
Grommunio.hierarchy.dialogs.FolderSizeContentPanel = Ext.extend(Grommunio.core.ui.RecordContentPanel, {
	/**
	 * @constructor
	 * @param config Configuration structure
	 */
	constructor: function(config)
	{
		config = config || {};

		Ext.applyIf(config, {
			// Override from Ext.Component
			xtype: 'grommunio.foldersizecontentpanel',
			layout: 'fit',
			title: _('Folder Size'),
			recordComponentPluginConfig: Ext.applyIf(config.recordComponentPluginConfig || {}, {
				allowWrite: true,
				useShadowStore: true
			}),
			closeOnSave: true,
			width: 360,
			height: 360,
			items: [{
				xtype: 'grommunio.foldersizepanel',
				buttons: [{
					text: _('Close'),
					handler: this.close,
					scope: this
				}]
			}]
		});

		Grommunio.hierarchy.dialogs.FolderSizeContentPanel.superclass.constructor.call(this, config);
	}
});

Ext.reg('grommunio.foldersizecontentpanel', Grommunio.hierarchy.dialogs.FolderSizeContentPanel);
