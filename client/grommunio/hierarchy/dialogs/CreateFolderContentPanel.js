/*
 * SPDX-FileCopyrightText: Copyright 2020 - 2026 grommunio GmbH
 * SPDX-FileCopyrightText: Copyright 2016 Kopano and its licensors
 * SPDX-FileCopyrightText: Copyright 2005 - 2016 Zarafa B.V. and its licensors
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

Ext.namespace('Grommunio.hierarchy.dialogs');

/**
 * @class Grommunio.hierarchy.dialogs.CreateFolderContentPanel
 * @extends Grommunio.core.ui.ContentPanel
 * @xtype grommunio.createfoldercontentpanel
 */
Grommunio.hierarchy.dialogs.CreateFolderContentPanel = Ext.extend(Grommunio.core.ui.RecordContentPanel, {
	/**
	 * @cfg {Grommunio.hierarchy.data.MAPIFolderRecord} parentFolder (optional) The parent folder
	 * underneath the new folder will be created.
	 */
	parentFolder: undefined,
	/**
	 * @cfg {String} preferredContainerClass (optional) The preferred container
	 * class for the newly created Folder.
	 */
	preferredContainerClass: undefined,
	/**
	 * @constructor
	 * @param config Configuration structure
	 */
	constructor: function(config)
	{
		config = config || {};

		config = Ext.applyIf(config, {
			// Override from Ext.Component
			xtype: 'grommunio.createfoldercontentpanel',
			layout: 'fit',
			title: _('Create New Folder'),
			recordComponentPluginConfig: Ext.applyIf(config.recordComponentPluginConfig || {}, {
				allowWrite: true,
				ignoreUpdates: false,
				useShadowStore: true
			}),
			width: 330,
			height: 380,
			items: [{
				xtype: 'grommunio.createfolderpanel',
				parentFolder: config.parentFolder,
				preferredContainerClass: config.preferredContainerClass
			}]
		});

		Grommunio.hierarchy.dialogs.CreateFolderContentPanel.superclass.constructor.call(this, config);
	},

	/**
	 * Fired when the {@link #updaterecord} event has been fired. This will close the panel if the record
	 * is being {@link Ext.data.Record#COMMIT committed}.
	 *
	 * @param {Grommunio.core.ui.RecordContentPanel} contentpanel The record which fired the event
	 * @param {String} action write Action that occurred. Can be one of
	 * {@link Ext.data.Record.EDIT EDIT}, {@link Ext.data.Record.REJECT REJECT} or
	 * {@link Ext.data.Record.COMMIT COMMIT}
	 * @param {Grommunio.core.data.IPMRecord} record The record which was updated
	 * @private
	 * @overridden
	 */
	onUpdateRecord: function(contentpanel, action, record)
	{
		Grommunio.hierarchy.dialogs.CreateFolderContentPanel.superclass.onUpdateRecord.apply(this, arguments);

		if (action == Ext.data.Record.COMMIT) {
			this.close();
			return false;
		}
	}
});

Ext.reg('grommunio.createfoldercontentpanel', Grommunio.hierarchy.dialogs.CreateFolderContentPanel);
