/*
 * SPDX-FileCopyrightText: Copyright 2020 - 2026 grommunio GmbH
 * SPDX-FileCopyrightText: Copyright 2016 Kopano and its licensors
 * SPDX-FileCopyrightText: Copyright 2005 - 2016 Zarafa B.V. and its licensors
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

Ext.namespace('Grommunio.common.restoreitem.dialogs');

/**
 * @class Grommunio.common.restoreitem.dialogs.RestoreItemContentPanel
 * @extends Grommunio.core.ui.RecordContentPanel
 * @xtype grommunio.restoreitemcontentpanel
 */
Grommunio.common.restoreitem.dialogs.RestoreItemContentPanel = Ext.extend(Grommunio.core.ui.RecordContentPanel, {

	/**
	 * @cfg {Grommunio.hierarchy.data.MAPIFolderRecord} folder default folder for the contextModel.
	 */
	folder: undefined,

	/**
	 * @constructor
	 * @param {Object} config Configuration structure
	 */
	constructor: function(config)
	{
		config = config || {};

		var folder = config.folder;
		var folderName = '';
		// if folder name is not defined, then use this title
		var title = _('Restore Softdeleted Items');
		if(folder) {
			folderName = folder.getFullyQualifiedDisplayName();

			if(!Ext.isEmpty(folderName)) {
				title = String.format(_('Restore From {0}'), folderName);
			}
		}

		Ext.applyIf(config, {
			xtype: 'grommunio.restoreitemcontentpanel',
			layout: 'fit',
			title: title,
			items: [{
				xtype: 'grommunio.restoreitempanel',
				folder: folder
			}]
		});

		Grommunio.common.restoreitem.dialogs.RestoreItemContentPanel.superclass.constructor.call(this,config);
	}
});

Ext.reg('grommunio.restoreitemcontentpanel', Grommunio.common.restoreitem.dialogs.RestoreItemContentPanel);
