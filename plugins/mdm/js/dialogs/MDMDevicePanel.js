Ext.namespace('Grommunio.plugins.mdm.dialogs');

/**
 * @class Grommunio.plugins.mdm.dialogs.MDMDevicePanel
 * @extends Ext.Panel
 * @xtype mdmplugin.mdmdevicepanel
 *
 * This class is used as wrapper class for all tabs, individual tab will have its own class.
 */
Grommunio.plugins.mdm.dialogs.MDMDevicePanel = Ext.extend(Ext.Panel, {

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
					title: _('General'),
				}, {
					xtype: 'mdmplugin.mdmdevicedetailstab',
					record: config.record,
					title: _('Details'),
				}]
			}]
		});

		Grommunio.plugins.mdm.dialogs.MDMDevicePanel.superclass.constructor.call(this, config);
	}
});

Ext.reg('mdmplugin.mdmdevicepanel', Grommunio.plugins.mdm.dialogs.MDMDevicePanel);
