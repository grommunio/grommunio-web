Ext.namespace('Zarafa.hierarchy.dialogs');

/**
 * @class Zarafa.hierarchy.dialogs.FolderPropertiesPanel
 * @extends Ext.Panel
 * @xtype zarafa.folderpropertiespanel
 *
 * This class is used as wrapper class for all tabs, individual tab will have its own class,
 * extra tabs can be added using insertion point in this dialog.
 */
Zarafa.hierarchy.dialogs.FolderPropertiesPanel = Ext.extend(Ext.Panel, {
	// Insertion points for this class
	/**
	 * @insert folderpropertiescontentpanel.tabs
	 * can be used to add extra tabs to folder properties content panel
	 * @param {Zarafa.hierarchy.dialogs.FolderPropertiesPanel} panel This panel
	 */

	/**
	 * @constructor
	 * @param {Object} config configuration object.
	 */
	constructor : function(config)
	{
		config = config || {};

		Ext.applyIf(config, {
			xtype : 'zarafa.folderpropertiespanel',
			cls : 'zarafa-folderproperties tabpanel-container',
			border : false,
			layout : 'fit',
			deferredRender : false,
			items: [{
				xtype : 'tabpanel',
				border : false,
				activeTab : config.activeTab,
				layoutOnTabChange : true,
				items : [{
					xtype : 'zarafa.folderpropertiesgeneraltab',
					title: _('General')
				},{
					xtype : 'zarafa.folderpropertiespermissiontab',
					emptyText : config.emptyText,
					title: _('Permissions')
				},
				container.populateInsertionPoint('folderpropertiescontentpanel.tabs', this)
				]
			}]
		});

		Zarafa.hierarchy.dialogs.FolderPropertiesPanel.superclass.constructor.call(this, config);
	}
});

Ext.reg('zarafa.folderpropertiespanel', Zarafa.hierarchy.dialogs.FolderPropertiesPanel);
