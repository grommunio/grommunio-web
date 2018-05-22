Ext.namespace('Zarafa.hierarchy.dialogs');

/**
 * @class Zarafa.hierarchy.dialogs.BrokenFilesContentPanel
 * @extends Zarafa.core.ui.ContentPanel
 * @xtype zarafa.brokenfilescontentpanel
 *
 * This content panel will be used to show error when user tries to import attachments
 * directly from drive.
 */
Zarafa.hierarchy.dialogs.BrokenFilesContentPanel = Ext.extend(Zarafa.core.ui.ContentPanel, {
	/**
	 * @constructor
	 * @param {Object} config Configuration object
	 */
	constructor : function(config)
	{
		config = config || {};

		Ext.applyIf(config, {
			xtype : 'zarafa.brokenfilescontentpanel',
			layout: 'fit',
			border: false,
			title : _('Import error'),
			width : 400,
			height: 250,
			items: [{
				xtype: 'zarafa.brokenfilespanel',
				records: config.record,
				buttons: [{
					text: _('Close'),
					handler: this.close,
					scope: this
				}]
			}]
		});

		Zarafa.hierarchy.dialogs.BrokenFilesContentPanel.superclass.constructor.call(this, config);
	}
});

Ext.reg('zarafa.brokenfilescontentpanel', Zarafa.hierarchy.dialogs.BrokenFilesContentPanel);