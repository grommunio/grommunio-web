/*
 * SPDX-FileCopyrightText: Copyright 2020 - 2026 grommunio GmbH
 * SPDX-FileCopyrightText: Copyright 2016 Kopano and its licensors
 * SPDX-FileCopyrightText: Copyright 2005 - 2016 Zarafa B.V. and its licensors
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

Ext.namespace('Grommunio.hierarchy.dialogs');

/**
 * @class Grommunio.hierarchy.dialogs.BrokenFilesContentPanel
 * @extends Grommunio.core.ui.ContentPanel
 * @xtype grommunio.brokenfilescontentpanel
 *
 * This content panel will be used to show error when user tries to import attachments
 * directly from drive.
 */
Grommunio.hierarchy.dialogs.BrokenFilesContentPanel = Ext.extend(Grommunio.core.ui.ContentPanel, {
	/**
	 * @constructor
	 * @param {Object} config Configuration object
	 */
	constructor: function(config)
	{
		config = config || {};

		Ext.applyIf(config, {
			xtype: 'grommunio.brokenfilescontentpanel',
			layout: 'fit',
			border: false,
			title: _('Import error'),
			width: 400,
			height: 250,
			items: [{
				xtype: 'grommunio.brokenfilespanel',
				records: config.record,
				buttons: [{
					text: _('Close'),
					handler: this.close,
					scope: this
				}]
			}]
		});

		Grommunio.hierarchy.dialogs.BrokenFilesContentPanel.superclass.constructor.call(this, config);
	}
});

Ext.reg('grommunio.brokenfilescontentpanel', Grommunio.hierarchy.dialogs.BrokenFilesContentPanel);
