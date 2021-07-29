Ext.namespace('Zarafa.plugins.mdm.dialogs');

/**
 * @class Zarafa.plugins.mdm.dialogs.MDMManageSharedFolderContentPanel
 * @extends Zarafa.core.ui.RecordContentPanel
 * @xtype zarafa.managesharedfoldercontentpanel
 *
 * This will display a {@link Zarafa.plugins.mdm.dialogs.MDMManageSharedFolderPanel contentpanel}
 * to show {@link Zarafa.core.data.IPFRecord folders} which are shared with device.
 */
Zarafa.plugins.mdm.dialogs.MDMManageSharedFolderContentPanel = Ext.extend(Zarafa.core.ui.RecordContentPanel, {

	/**
	 * @constructor
	 * @param config Configuration structure
	 */
	constructor: function (config) {
		config = config || {};

		Ext.applyIf(config,
			{
			xtype: 'mdm.managesharedfoldercontentpanel',
			layout: 'fit',
			title: dgettext('plugin_mdm','Manage Shared Folders'),
			modal: true,
			stateful: false,
			showInfoMask : false,
			showLoadMask: false,
			closeOnSave: true,
			width: 300,
			height: 350,
			items: [{
				xtype: 'mdm.managesharedfolderpanel'
			}]
		});

		Zarafa.plugins.mdm.dialogs.MDMManageSharedFolderContentPanel.superclass.constructor.call(this, config);
	}
});

Ext.reg('mdm.managesharedfoldercontentpanel', Zarafa.plugins.mdm.dialogs.MDMManageSharedFolderContentPanel);
