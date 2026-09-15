/*
 * SPDX-FileCopyrightText: Copyright 2020 - 2026 grommunio GmbH
 * SPDX-FileCopyrightText: Copyright 2016 Kopano and its licensors
 * SPDX-FileCopyrightText: Copyright 2005 - 2016 Zarafa B.V. and its licensors
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

Ext.namespace('Grommunio.advancesearch.ui');

/**
 * @class Grommunio.advancesearch.ui.SearchFolderContextMenu
 * @extends Grommunio.core.ui.menu.ConditionalMenu
 * @xtype grommunio.searchfoldercontextmenu
 */
Grommunio.advancesearch.ui.SearchFolderContextMenu = Ext.extend(Grommunio.core.ui.menu.ConditionalMenu, {

	/**
	 * @constructor
	 * @param {Object} config Configuration object
	 */
	constructor: function(config)
	{
		config = config || {};

		Ext.applyIf(config, {
			items: [{
				xtype: 'grommunio.conditionalitem',
				text: _('Delete search folder'),
				iconCls: 'icon_folder_delete',
				handler: this.onContextItemDeleteFolder,
				scope: this
			}]
		});

		Grommunio.advancesearch.ui.SearchFolderContextMenu.superclass.constructor.call(this, config);
	},

	/**
	 * Event handler triggers when "Delete search folder" button was clicked.
	 * it is used to delete the search folder which marked as favorites.
	 */
	onContextItemDeleteFolder: function ()
	{
		var record = this.records;
		var store = record.getStore();
		store.remove(record);
		record.removeFromFavorites();
		store.save(record);
	}
});

Ext.reg('grommunio.searchfoldercontextmenu', Grommunio.advancesearch.ui.SearchFolderContextMenu);
