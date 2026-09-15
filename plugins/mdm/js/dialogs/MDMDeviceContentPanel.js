/*
 * SPDX-FileCopyrightText: Copyright 2020 - 2026 grommunio GmbH
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

Ext.namespace('Grommunio.plugins.mdm.dialogs');

/**
 * @class Grommunio.plugins.mdm.dialogs.MDMDeviceContentPanel
 * @extends Grommunio.core.ui.RecordContentPanel
 * @xtype mdmplugin.devicecontentpanel
 *
 * The content panel which is use to show device detail panel.
 */
Grommunio.plugins.mdm.dialogs.MDMDeviceContentPanel = Ext.extend(Grommunio.core.ui.RecordContentPanel, {

	/**
	 * @constructor
	 * @param config Configuration structure
	 */
	constructor: function (config)
	{
		config = config || {};
		Ext.applyIf(config, {
			xtype: 'mdmplugin.devicecontentpanel',
			modal: true,
			showModalWithoutParent: true,
			title: _(config.record.get('devicetype')),
			recordComponentPluginConfig: Ext.applyIf(config.recordComponentPluginConfig || {}, {
				allowWrite: true,
				useShadowStore: true
			}),
			layout: 'fit',
			stateful: false,
			showInfoMask : false,
			showLoadMask: false,
			width: 405,
			height: 420,
			items: [{
				xtype: 'mdmplugin.mdmdevicepanel',
				record: config.record,
				buttons: [{
					text: _('Ok'),
					handler: this.onOk,
					scope: this
				}]
			}]
		});

		Grommunio.plugins.mdm.dialogs.MDMDeviceContentPanel.superclass.constructor.call(this, config);
	},

	/**
	 * Action handler when the user presses the "Ok" button.
	 * This will close the panel.
	 */
	onOk: function ()
	{
		this.close();
	}
});

Ext.reg('mdmplugin.devicecontentpanel', Grommunio.plugins.mdm.dialogs.MDMDeviceContentPanel);