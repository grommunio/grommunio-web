Ext.namespace('Zarafa.plugins.mdm.dialogs');

/**
 * @class Zarafa.plugins.mdm.dialogs.MDMDeviceGeneralTab
 * @extends Ext.form.FormPanel
 * @xtype mdmplugin.mdmdevicegeneraltab
 *
 * Details tab in the {@link Zarafa.plugins.mdm.dialogs.MDMDeviceContentPanel}
 */
Zarafa.plugins.mdm.dialogs.MDMDeviceGeneralTab = Ext.extend(Ext.form.FormPanel, {

	/**
	 * @cfg {Boolean} isKoe True if device has Outlook Extension information.
	 */
	isKoe: false,

	/**
	 * @constructor
	 * @param {Object} config Configuration object
	 */
	constructor: function (config)
	{
		config = config || {};
		Ext.applyIf(config, {
			xtype: 'mdmplugin.mdmdevicegeneraltab',
			cls: 'tab-general',
			border: false,
			labelAlign: 'left',
			defaults: {
				border: false,
				xtype: 'panel',
				layout: 'form',
				labelWidth: 150,
				cls: 'mdm-device-panel'
			},
			plugins : ['zarafa.recordcomponentupdaterplugin'],
			items: [
				this.createDeviceInfoPanel(config),
				this.createFolderInfoPanel()
			]
		});

		Zarafa.plugins.mdm.dialogs.MDMDeviceGeneralTab.superclass.constructor.call(this, config);
	},
	/**
	 * Function which is use to create device status panel
	 * @param {Object} config Configuration object
	 * @return {Object} Configuration object for the panel which shows device status properties
	 * @private
	 */
	createDeviceInfoPanel: function (config)
	{
		return {
			cls: 'mdm-device-panel',
			defaultType: 'displayfield',
			defaults: {
				disabled: true
			},
			items: [{
				cls: 'mdm-display-name',
				value: dgettext('plugin_mdm', config.record.get('devicetype')),
				htmlEncode: true,
				disabled: false,
				hideLabel: true
			}, {
				fieldLabel: dgettext('plugin_mdm', 'Connected since'),
				value: String.format('{0}', new Date(config.record.get('firstsynctime')).format(_('d F Y')))
			}, {
				fieldLabel: dgettext('plugin_mdm', 'Last updated'),
				value: String.format(_('{0}'), new Date(config.record.get('lastupdatetime')).format(_('d F Y, H:i')))
			}, {
				fieldLabel: dgettext('plugin_mdm', 'Status'),
				hidden: config.isKoe,
				listeners: {
					afterrender: this.onAfterRenderStatus,
					scope: this
				}
			}]
		};
	},
	/**
	 * Function which is use to create folders synchronization panel
	 * @return {Object} Configuration object for the panel which shows folders properties
	 * @private
	 */
	createFolderInfoPanel: function ()
	{
		return {
			cls: 'mdm-device-panel mdm-field-sep',
			defaultType: 'displayfield',
			items: [{
				cls: 'mdm-display-name',
				value: dgettext('plugin_mdm', 'Synchronize'),
				htmlEncode: true,
				hideLabel: true
			}, {
				fieldLabel: dgettext('plugin_mdm', 'Folders'),
				disabled: true,
				name: 'synchronizedfolders'
			}, {
				xtype: 'fieldset',
				layout: 'form',
				labelWidth: 140,
				cls: 'mdm-synchronize-panel',
				defaultType: 'displayfield',
				defaults: {
					labelSeparator: '',
					value: '0',
					disabled: true
				},
				items: [{
					fieldLabel: _('Email'),
					name: 'emailsfolder'
				}, {
					fieldLabel: _('Calendar'),
					name: 'calendarsfolder'
				}, {
					fieldLabel: _('Contacts'),
					name: 'contactsfolder'
				}, {
					fieldLabel: _('Notes'),
					name: 'notesfolder'
				}, {
					fieldLabel: _('Tasks'),
					name: 'tasksfolder'
				},
                    // this.createSharedFolderInfoPanel()
				]
			}]
		};
	},

	/**
	 * Function which is use to create shared folders panel
	 * @returns {Object} Configuration object for the panel which shows folders properties
	 */
	createSharedFolderInfoPanel: function ()
	{
		return {
			xtype: 'panel',
			border: false,
            cls: 'mdm-synchronize-shared-panel',
			height: 50,
            disabled: false,
			layout: {
				type: 'hbox',
				align: 'stretch',
				pack: 'start'
			},
			items: [{
				layout: 'form',
				border: false,
				items: [{
					xtype: 'displayfield',
					fieldLabel: 'Shared Folders',
					disabled: true,
					name : 'sharedfolders'
				}],
				flex: 1
			}, {
				xtype: 'button',
				text: dgettext('plugin_mdm', 'Manage Shared Folders'),
				cls: 'mdm-managesharedfolder-button',
				listeners: {
					click: this.onClickManageSharedFolder,
					scope: this
				}
			}]
		};
	},

	/**
	 * Updates the panel by loading data from the record into the header template, and
	 * loading the body html into the embedded iframe.
	 *
	 * @param {Zarafa.core.data.IPMRecord} record The record update the panel with.
	 * @param {Boolean} contentReset force the component to perform a full update of the data.
	 */
	update : function(record, contentReset)
	{
		this.getForm().loadRecord(record);
	},

	/**
	 * Function which handles the after render event of status field.
	 * Which is use to set the display name for the given Provisioning Status into given field
	 * @param {Ext.form.TextField} statusField text field
	 */
	onAfterRenderStatus: function (statusField)
	{
		var status = parseInt(this.record.get("wipestatus"));
		statusField.setValue(Zarafa.plugins.mdm.data.ProvisioningStatus.getDisplayName(status));
	},

	/**
	 * Function which handles the click event of manage shared folder button.
	 * It will open {@link Zarafa.plugins.mdm.dialogs.MDMManageSharedFolderContentPanel dialog}
	 */
	onClickManageSharedFolder: function ()
	{
		this.dialog.record.opened = false;
		Zarafa.core.data.UIFactory.openLayerComponent(Zarafa.core.data.SharedComponentType['mdm.dialog.mdmmanagesharedfoldercontentpanel'], undefined, {
			manager: Ext.WindowMgr,
			record: this.dialog.record
		});
	}
});

Ext.reg('mdmplugin.mdmdevicegeneraltab', Zarafa.plugins.mdm.dialogs.MDMDeviceGeneralTab);
