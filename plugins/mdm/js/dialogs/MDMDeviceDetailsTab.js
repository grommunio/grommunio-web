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
	 * @cfg {Boolean} isKoe True if device has Outlook Extension information.
	 */
	isKoe : false,

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
				this.createDeviceInfoPanel(config.isKoe),
				this.createVersionInfoPanel(config.isKoe)
			]
		});

		// KOE information
		if (config.isKoe) {
			config.items.push(this.createKOEInfoPanel(config.record));
		}
		Zarafa.plugins.mdm.dialogs.MDMDeviceDetailsTab.superclass.constructor.call(this, config);
	},
	/**
	 * Function which is use to create device information panel
	 * @param {Boolean} isKoe True if device has Outlook Extension information, false otherwise.
	 * @return {Object} Configuration object for the panel which shows device properties
	 * @private
	 */
	createDeviceInfoPanel: function (isKoe)
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
				hidden: isKoe,
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
	 * @param {Boolean} isKoe True if device has Outlook Extension information, false otherwise.
	 * @return {Object} Configuration object for the panel which shows versions properties
	 * @private
	 */
	createVersionInfoPanel: function (isKoe)
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
	 * Function which is use to create Outlook Extension panel
	 * @param {Zarafa.plugins.mdm.data.MDMDeviceRecord} record The device record.s
	 * @return {Object} Configuration object for the panel which shows Outlook Extension properties
	 * @private
	 */
	createKOEInfoPanel: function (record)
	{
		return {
			cls : 'mdm-device-panel mdm-field-sep',
			defaults: {
				disabled: true
			},
			defaultType: 'displayfield',
			items: [{
				cls: 'mdm-display-name',
				value: _('Outlook Extension'),
				htmlEncode: true,
				hideLabel: true,
				disabled: false
			}, {
				fieldLabel: _('Version'),
				name: "koeversion"
			}, {
				fieldLabel: _('Build'),
				name: "koebuild"
			}, {
				fieldLabel: _('Last updated'),
				value: String.format('{0}', new Date(record.get('koebuilddate')).format(_('d F Y, H:i')))
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
