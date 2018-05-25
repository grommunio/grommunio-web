Ext.namespace('Zarafa.hierarchy.dialogs');

/**
 * @class Zarafa.hierarchy.dialogs.FolderPropertiesContentPanel
 * @extends Zarafa.core.ui.RecordContentPanel
 * @xtype folderzarafa.propertiescontentpanel
 *
 * This will display a {@link Zarafa.core.ui.ContentPanel contentpanel}
 * for general properties of {@link Zarafa.hierarchy.data.MAPIFolderRecord folder} and set permissions on same.
 */
Zarafa.hierarchy.dialogs.FolderPropertiesContentPanel = Ext.extend(Zarafa.core.ui.RecordContentPanel, {
	/**
	 * @constructor
	 * @param config Configuration structure
	 */
	constructor : function(config)
	{
		config = config || {};

		Ext.applyIf(config, {
			// Override from Ext.Component
			xtype : 'zarafa.folderpropertiescontentpanel',
			layout: 'fit',
			title : Ext.isDefined(config.title)? config.title : _('Properties'),
			recordComponentPluginConfig : Ext.applyIf(config.recordComponentPluginConfig || {}, {
				allowWrite : true,
				useShadowStore : true
			}),
			closeOnSave : true,
			width: 425,
			height: 450,
			items: [{
				xtype: 'zarafa.folderpropertiespanel',
				activeTab : Ext.isDefined(config.activeTab) ? config.activeTab : 0,
				emptyText : config.emptyText,
				buttons : [{
					text : _('Ok'),
					handler : this.onOk,
					scope: this
				},{
					text : _('Cancel'),
					handler : this.onCancel,
					scope: this
				}]
			}]
		});

		Zarafa.hierarchy.dialogs.FolderPropertiesContentPanel.superclass.constructor.call(this, config);
	}
});

Ext.reg('zarafa.folderpropertiescontentpanel', Zarafa.hierarchy.dialogs.FolderPropertiesContentPanel);
