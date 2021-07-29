Ext.namespace('Zarafa.plugins.mdm.dialogs');

/**
 * @class Zarafa.plugins.mdm.dialogs.MDMDevicePanel
 * @extends Ext.Panel
 * @xtype mdmplugin.mdmdevicepanel
 *
 * This class is used as wrapper class for all tabs, individual tab will have its own class.
 */
Zarafa.plugins.mdm.dialogs.MDMDevicePanel = Ext.extend(Ext.Panel, {

	/**
	 * @cfg {Boolean} isKoe True if device has Kopano Outlook Extension information.
	 */
	isKoe : false,

	/**
	 * @constructor
	 * @param {Object} config configuration object.
	 */
	constructor: function (config)
	{
		config = config || {};
		Ext.applyIf(config, {
			xtype: 'mdmplugin.mdmdevicepanel',
			cls: 'mdm-devicepanel tabpanel-container',
			border: false,
			deferredRender: false,
			items: [{
				xtype: 'tabpanel',
				border: false,
				activeTab: 0,
				layoutOnTabChange: true,
				items: [{
					xtype: 'mdmplugin.mdmdevicegeneraltab',
					record: config.record,
					title: dgettext('plugin_mdm','General'),
					isKoe : config.isKoe
				}, {
					xtype: 'mdmplugin.mdmdevicedetailstab',
					record: config.record,
					title: dgettext('plugin_mdm','Details'),
					isKoe : config.isKoe
				}]
			}]
		});

		Zarafa.plugins.mdm.dialogs.MDMDevicePanel.superclass.constructor.call(this, config);
	}
});

Ext.reg('mdmplugin.mdmdevicepanel', Zarafa.plugins.mdm.dialogs.MDMDevicePanel);
