/*
 * SPDX-FileCopyrightText: Copyright 2020 - 2026 grommunio GmbH
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

Ext.namespace('Grommunio.plugins.mdm.dialogs');

/**
 * @class Grommunio.plugins.mdm.dialogs.MDMManageSharedFolderContentPanel
 * @extends Grommunio.core.ui.RecordContentPanel
 * @xtype grommunio.managesharedfoldercontentpanel
 *
 * This will display a {@link Grommunio.plugins.mdm.dialogs.MDMManageSharedFolderPanel contentpanel}
 * to show {@link Grommunio.core.data.IPFRecord folders} which are shared with device.
 */
Grommunio.plugins.mdm.dialogs.MDMManageSharedFolderContentPanel = Ext.extend(Grommunio.core.ui.RecordContentPanel, {

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
			title: _('Manage Shared Folders'),
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

		Grommunio.plugins.mdm.dialogs.MDMManageSharedFolderContentPanel.superclass.constructor.call(this, config);
	}
});

Ext.reg('mdm.managesharedfoldercontentpanel', Grommunio.plugins.mdm.dialogs.MDMManageSharedFolderContentPanel);
