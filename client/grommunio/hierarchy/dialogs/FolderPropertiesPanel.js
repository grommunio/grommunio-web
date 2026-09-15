/*
 * SPDX-FileCopyrightText: Copyright 2020 - 2026 grommunio GmbH
 * SPDX-FileCopyrightText: Copyright 2016 Kopano and its licensors
 * SPDX-FileCopyrightText: Copyright 2005 - 2016 Zarafa B.V. and its licensors
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

Ext.namespace('Grommunio.hierarchy.dialogs');

/**
 * @class Grommunio.hierarchy.dialogs.FolderPropertiesPanel
 * @extends Ext.Panel
 * @xtype grommunio.folderpropertiespanel
 *
 * This class is used as wrapper class for all tabs, individual tab will have its own class,
 * extra tabs can be added using insertion point in this dialog.
 */
Grommunio.hierarchy.dialogs.FolderPropertiesPanel = Ext.extend(Ext.Panel, {
	// Insertion points for this class
	/**
	 * @insert folderpropertiescontentpanel.tabs
	 * can be used to add extra tabs to folder properties content panel
	 * @param {Grommunio.hierarchy.dialogs.FolderPropertiesPanel} panel This panel
	 */

	/**
	 * @constructor
	 * @param {Object} config configuration object.
	 */
	constructor: function(config)
	{
		config = config || {};

		Ext.applyIf(config, {
			xtype: 'grommunio.folderpropertiespanel',
			cls: 'grommunio-folderproperties tabpanel-container',
			border: false,
			layout: 'fit',
			deferredRender: false,
			items: [{
				xtype: 'tabpanel',
				border: false,
				activeTab: config.activeTab,
				layoutOnTabChange: true,
				items: [{
					xtype: 'grommunio.folderpropertiesgeneraltab',
					title: _('General')
				},{
					xtype: 'grommunio.folderpropertiespermissiontab',
					emptyText: config.emptyText,
					isAppointmentDialog: config.isAppointmentDialog,
					title: _('Permissions')
				},
				container.populateInsertionPoint('folderpropertiescontentpanel.tabs', this)
				]
			}]
		});

		Grommunio.hierarchy.dialogs.FolderPropertiesPanel.superclass.constructor.call(this, config);
	}
});

Ext.reg('grommunio.folderpropertiespanel', Grommunio.hierarchy.dialogs.FolderPropertiesPanel);
