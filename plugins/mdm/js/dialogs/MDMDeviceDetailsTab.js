Ext.namespace('Zarafa.plugins.mdm.dialogs');

/**
 * @class Zarafa.plugins.mdm.dialogs.MDMDeviceDetailsTab
 * @extends Ext.form.FormPanel
 * @xtype mdmplugin.mdmdevicedetailstab
 *
 * General tab in the {@link Zarafa.plugins.mdm.dialogs.MDMDeviceContentPanel}
 */
Zarafa.plugins.mdm.dialogs.MDMDeviceDetailsTab = Ext.extend(Ext.form.FormPanel, {

	/**
	 * @constructor
	 * @param {Object} config
	 */
	constructor: function (config)
	{
		config = config || {};
		Ext.applyIf(config, {
			xtype: 'mdmplugin.mdmdevicedetailstab',
			cls: 'tab-device',
			border: false,
			labelAlign: 'left',
			defaults: {
				border: false,
				xtype: 'panel',
				layout: 'form',
				labelWidth: 150
			},
			plugins : ['zarafa.recordcomponentupdaterplugin'],
			items: [
				this.createDeviceInfoPanel(),
				this.createVersionInfoPanel()
			]
		});

		Zarafa.plugins.mdm.dialogs.MDMDeviceDetailsTab.superclass.constructor.call(this, config);
	},
	/**
	 * Function which is use to create device information panel
	 * @return {Object} Configuration object for the panel which shows device properties
	 * @private
	 */
	createDeviceInfoPanel: function ()
	{
		return {
			cls : 'mdm-device-panel',
			defaultType: 'displayfield',
			defaults: {
				disabled: true
			},
			items: [{
				cls: 'mdm-display-name',
				value: _('Device'),
				hideLabel: true,
				disabled: false
			}, {
				fieldLabel: _('Type'),
				name: 'devicetype'
			}, {
				fieldLabel: _('Operating System'),
				name: 'deviceos'
			}, {
				fieldLabel: _('ID'),
				name: 'entryid'
			}, {
				fieldLabel: _('User Agent'),
				name: 'useragent'
			}]
		};
	},

	/**
	 * Function which is use to create version information panel.
	 * @return {Object} Configuration object for the panel which shows versions properties
	 * @private
	 */
	createVersionInfoPanel: function ()
	{
		return {
			defaultType: 'displayfield',
			defaults: {
				disabled: true
			},
			cls : 'mdm-device-panel mdm-field-sep',
			items: [{
				cls: 'mdm-display-name',
				value: _('MDM Plugin'),
				htmlEncode: true,
				hideLabel: true,
				disabled: false
			}, {
				fieldLabel: _('Active Sync Version'),
				name: 'asversion'
			}, {
				fieldLabel: _('grommunio-sync Version'),
				value: container.getSettingsModel().get('zarafa/v1/plugins/mdm/zpush-server-version', true)
			}, {
				fieldLabel: _('Policy name'),
				name: 'policyname'
			}]
		};
	},

	/**
	 * Updates the panel by loading data from the record.
	 *
	 * @param {Zarafa.core.data.IPMRecord} record The record update the panel with.
	 * @param {Boolean} contentReset force the component to perform a full update of the data.
	 */
	update : function(record, contentReset)
	{
		this.getForm().loadRecord(record);
	}
});

Ext.reg('mdmplugin.mdmdevicedetailstab', Zarafa.plugins.mdm.dialogs.MDMDeviceDetailsTab);
