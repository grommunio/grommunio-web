/*
 * SPDX-FileCopyrightText: Copyright 2020 - 2026 grommunio GmbH
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

Ext.namespace('Grommunio.plugins.files.ui.dialogs');

/**
 * @class Grommunio.plugins.files.ui.dialogs.CreateFolderContentPanel
 * @extends Grommunio.core.ui.RecordContentPanel
 * @xtype filesplugin.createfoldercontentpanel
 *
 * Create folder content panel provide the {@link Grommunio.plugins.files.ui.Tree Tree} to create
 * the new folder in that.
 */
Grommunio.plugins.files.ui.dialogs.CreateFolderContentPanel = Ext.extend(Grommunio.core.ui.RecordContentPanel, {

	/**
	 * @constructor
	 * @param config Configuration structure
	 */
	constructor : function(config)
	{
		config = config || {};

		Ext.applyIf(config, {
			xtype : 'grommunio.createfoldercontentpanel',
			layout: 'fit',
			title : _('Create New Folder'),
			recordComponentPluginConfig : Ext.applyIf(config.recordComponentPluginConfig || {}, {
				allowWrite : true,
				ignoreUpdates : false,
				useShadowStore : true,
				shadowStore : new Grommunio.plugins.files.data.FilesShadowStore()
			}),
			showLoadMask: false,
			showInfoMask: false,
			width: 300,
			height: 350,
			items: [{
				xtype: 'filesplugin.createfolderpanel',
				accountFilter : config.accountFilter,
				parentFolder : config.parentFolder,
				model : config.model
			}]
		});

		Grommunio.plugins.files.ui.dialogs.CreateFolderContentPanel.superclass.constructor.call(this, config);
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
	onUpdateRecord : function(contentpanel, action, record)
	{
		Grommunio.plugins.files.ui.dialogs.CreateFolderContentPanel.superclass.onUpdateRecord.apply(this, arguments);

		if (action == Ext.data.Record.COMMIT) {
			this.close();
			return false;
		}
	}
});

Ext.reg('filesplugin.createfoldercontentpanel', Grommunio.plugins.files.ui.dialogs.CreateFolderContentPanel);
