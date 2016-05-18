Ext.namespace('Zarafa.common.delegates.dialogs');

/**
 * @class Zarafa.common.delegates.dialogs.DelegatePermissionContentPanel
 * @extends Zarafa.core.ui.RecordContentPanel
 * @xtype zarafa.delegatepermissioncontentpanel
 *
 * {@link Zarafa.common.delegates.dialogs.DelegatePermissionContentPanel DelegatePermissionContentPanel} will be used to display
 * permissions of a specific delegate user.
 */
Zarafa.common.delegates.dialogs.DelegatePermissionContentPanel = Ext.extend(Zarafa.core.ui.RecordContentPanel, {
	/**
	 * @constructor
	 * @param config Configuration structure
	 */
	constructor : function(config)
	{
		config = config || {};

		// Add in some standard configuration data.
		Ext.applyIf(config, {
			// Override from Ext.Component
			xtype : 'zarafa.delegatepermissioncontentpanel',
			// Override from Ext.Component
			layout : 'fit',
			modal : true,
			recordComponentPluginConfig : Ext.applyIf(config.recordComponentPluginConfig || {}, {
				allowWrite : true,
				useShadowStore : true
			}),
			autoSave : false,
			width : 500,
			height : 325,
			title : _('Delegate Permissions'),
			items : [{
				xtype : 'zarafa.delegatepermissionpanel',
				buttons : [{
					text : _('Ok'),
					handler : this.onOk,
					scope : this
				},{
					text : _('Cancel'),
					handler : this.onCancel,
					scope : this
				}]
			}]
		});

		Zarafa.common.delegates.dialogs.DelegatePermissionContentPanel.superclass.constructor.call(this, config);
	}
});

Ext.reg('zarafa.delegatepermissioncontentpanel', Zarafa.common.delegates.dialogs.DelegatePermissionContentPanel);
