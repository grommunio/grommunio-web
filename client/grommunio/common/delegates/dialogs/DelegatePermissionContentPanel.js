/*
 * SPDX-FileCopyrightText: Copyright 2020 - 2026 grommunio GmbH
 * SPDX-FileCopyrightText: Copyright 2016 Kopano and its licensors
 * SPDX-FileCopyrightText: Copyright 2005 - 2016 Zarafa B.V. and its licensors
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

Ext.namespace('Grommunio.common.delegates.dialogs');

/**
 * @class Grommunio.common.delegates.dialogs.DelegatePermissionContentPanel
 * @extends Grommunio.core.ui.RecordContentPanel
 * @xtype grommunio.delegatepermissioncontentpanel
 *
 * {@link Grommunio.common.delegates.dialogs.DelegatePermissionContentPanel DelegatePermissionContentPanel} will be used to display
 * permissions of a specific delegate user.
 */
Grommunio.common.delegates.dialogs.DelegatePermissionContentPanel = Ext.extend(Grommunio.core.ui.RecordContentPanel, {
	/**
	 * @constructor
	 * @param config Configuration structure
	 */
	constructor: function(config)
	{
		config = config || {};

		// Add in some standard configuration data.
		Ext.applyIf(config, {
			// Override from Ext.Component
			xtype: 'grommunio.delegatepermissioncontentpanel',
			// Override from Ext.Component
			layout: 'fit',
			modal: true,
			recordComponentPluginConfig: Ext.applyIf(config.recordComponentPluginConfig || {}, {
				allowWrite: true,
				useShadowStore: true
			}),
			autoSave: false,
			width: 500,
			height: 370,
			title: _('Delegate Permissions'),
			items: [{
				xtype: 'grommunio.delegatepermissionpanel',
				buttons: [{
					text: _('Ok'),
					handler: this.onOk,
					scope: this
				},{
					text: _('Cancel'),
					handler: this.onCancel,
					scope: this
				}]
			}]
		});

		Grommunio.common.delegates.dialogs.DelegatePermissionContentPanel.superclass.constructor.call(this, config);
	}
});

Ext.reg('grommunio.delegatepermissioncontentpanel', Grommunio.common.delegates.dialogs.DelegatePermissionContentPanel);
