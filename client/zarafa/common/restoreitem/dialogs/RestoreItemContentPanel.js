Ext.namespace('Zarafa.common.restoreitem.dialogs');

/**
 * @class Zarafa.common.restoreitem.dialogs.RestoreItemContentPanel
 * @extends Zarafa.core.ui.RecordContentPanel
 * @xtype zarafa.restoreitemcontentpanel
 */
Zarafa.common.restoreitem.dialogs.RestoreItemContentPanel = Ext.extend(Zarafa.core.ui.RecordContentPanel, {

	/**
	 * @cfg {Zarafa.hierarchy.data.MAPIFolderRecord} folder default folder for the contextModel.
	 */
	folder : undefined,

	/**
	 * @cfg {Zarafa.common.restoreitem.data.RestoreItemStore} store which can be used to restore item.
	 */
	store : undefined,

	/**
	 * @constructor
	 * @param {Object} config Configuration structure
	 */
	constructor : function(config)
	{
		config = config || {};

		var folder = config.folder;
		var folderName = '';
		// if folder name is not defined, then use this title
		var title = _('Restore Softdeleted Items');
		if(folder) {
			folderName = folder.getFullyQualifiedDisplayName();

			if(!Ext.isEmpty(folderName)) {
				title = String.format(_('Restore From {0}'), folderName);
			}
		}

		Ext.applyIf(config, {
			xtype: 'zarafa.restoreitemcontentpanel',
			layout: 'fit',
			title: title,
			items: [{
				xtype: 'zarafa.restoreitempanel',
				folder: folder,
				store : config.store
			}]
		});

		Zarafa.common.restoreitem.dialogs.RestoreItemContentPanel.superclass.constructor.call(this,config);
	}
});

Ext.reg('zarafa.restoreitemcontentpanel', Zarafa.common.restoreitem.dialogs.RestoreItemContentPanel);
