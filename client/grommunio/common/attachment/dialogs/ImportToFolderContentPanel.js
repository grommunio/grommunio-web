/*
 * SPDX-FileCopyrightText: Copyright 2020 - 2026 grommunio GmbH
 * SPDX-FileCopyrightText: Copyright 2016 Kopano and its licensors
 * SPDX-FileCopyrightText: Copyright 2005 - 2016 Zarafa B.V. and its licensors
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

Ext.namespace('Grommunio.common.attachment.dialogs');

/**
 * @class Grommunio.common.attachment.dialogs.ImportToFolderContentPanel
 * @extends Grommunio.common.dialogs.CopyMoveContentPanel
 * @xtype grommunio.importtofoldercontentpanel
 *
 * This will display a {@link Grommunio.core.ui.ContentPanel contentpanel}
 * for importing {@link Grommunio.core.data.IPMAttachmentRecord records}
 * to {@link Grommunio.hierarchy.data.MAPIFolderRecord folder}.
 */
Grommunio.common.attachment.dialogs.ImportToFolderContentPanel = Ext.extend(Grommunio.common.dialogs.CopyMoveContentPanel, {
	/**
	 * @constructor
	 * @param {Object} config Configuration structure
	 */
	constructor: function(config)
	{
		config = config || {};

		if (config.record && !Array.isArray(config.record)) {
			config.record = [ config.record ];
		}

		Ext.applyIf(config, {
			// Override from Ext.Component
			xtype: 'grommunio.importtofoldercontentpanel',
			title: _('Import to'),
			items: [{
				xtype: 'grommunio.importtofolderpanel',
				// A bit ugly, but the Grommunio.common.dialogs.CopyMoveContentPanel uses this ref
				ref: 'copyMovePanel',
				record: config.record
			}]
		});

		Grommunio.common.attachment.dialogs.ImportToFolderContentPanel.superclass.constructor.call(this, config);
	}
});

Ext.reg('grommunio.importtofoldercontentpanel', Grommunio.common.attachment.dialogs.ImportToFolderContentPanel);
