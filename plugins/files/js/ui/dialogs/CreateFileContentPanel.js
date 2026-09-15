/*
 * SPDX-FileCopyrightText: Copyright 2020 - 2026 grommunio GmbH
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

Ext.namespace('Grommunio.plugins.files.ui.dialogs');

/**
 * @class Grommunio.plugins.files.ui.dialogs.CreateFileContentPanel
 * @extends Grommunio.core.ui.RecordContentPanel
 * @xtype filesplugin.createfilecontentpanel
 *
 * Create file content panel provide the {@link Grommunio.plugins.files.ui.Tree Tree} to create
 * the new file in that.
 */
Grommunio.plugins.files.ui.dialogs.CreateFileContentPanel = Ext.extend(Grommunio.core.ui.RecordContentPanel, {

	/**
	 * @constructor
	 * @param config Configuration structure
	 */
	constructor : function(config)
	{
		config = config || {};
		const filetypeTitle = config.button.text || _('Document');

		Ext.applyIf(config, {
			xtype : 'grommunio.createfilecontentpanel',
			layout: 'fit',
			// TRANSLATORS: {0} is a translated file type such as Document, Presentation or Spreadsheet
			title : String.format(_('Create New {0}'), filetypeTitle),
			showLoadMask: false,
			showInfoMask: false,
			width: 300,
			height: 110,
			items: [{
				xtype: 'filesplugin.createfilepanel',
				accountFilter : config.accountFilter,
				parentFolder : config.parentFolder,
				model : config.model,
				filetype: config.filetype
			}]
		});

		Grommunio.plugins.files.ui.dialogs.CreateFileContentPanel.superclass.constructor.call(this, config);
	}
});

Ext.reg('filesplugin.createfilecontentpanel', Grommunio.plugins.files.ui.dialogs.CreateFileContentPanel);
