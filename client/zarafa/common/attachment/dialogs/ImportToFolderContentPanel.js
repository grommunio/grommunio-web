Ext.namespace('Zarafa.common.attachment.dialogs');

/**
 * @class Zarafa.common.attachment.dialogs.ImportToFolderContentPanel
 * @extends Zarafa.common.dialogs.CopyMoveContentPanel
 * @xtype zarafa.importtofoldercontentpanel
 *
 * This will display a {@link Zarafa.core.ui.ContentPanel contentpanel}
 * for importing {@link Zarafa.core.data.IPMAttachmentRecord records}
 * to {@link Zarafa.hierarchy.data.MAPIFolderRecord folder}.
 */
Zarafa.common.attachment.dialogs.ImportToFolderContentPanel = Ext.extend(Zarafa.common.dialogs.CopyMoveContentPanel, {
	/**
	 * @constructor
	 * @param {Object} config Configuration structure
	 */
	constructor : function(config)
	{
		config = config || {};

		if (config.record && !Array.isArray(config.record)) {
			config.record = [ config.record ];
		}

		Ext.applyIf(config, {
			// Override from Ext.Component
			xtype : 'zarafa.importtofoldercontentpanel',
			title : _('Import to'),
			items: [{
				xtype: 'zarafa.importtofolderpanel',
				// A bit ugly, but the Zarafa.common.dialogs.CopyMoveContentPanel uses this ref
				ref: 'copyMovePanel',
				record : config.record
			}]
		});

		Zarafa.common.attachment.dialogs.ImportToFolderContentPanel.superclass.constructor.call(this, config);
	}
});

Ext.reg('zarafa.importtofoldercontentpanel', Zarafa.common.attachment.dialogs.ImportToFolderContentPanel);
