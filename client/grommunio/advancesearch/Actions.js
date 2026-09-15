/*
 * SPDX-FileCopyrightText: Copyright 2020 - 2026 grommunio GmbH
 * SPDX-FileCopyrightText: Copyright 2016 Kopano and its licensors
 * SPDX-FileCopyrightText: Copyright 2005 - 2016 Zarafa B.V. and its licensors
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

Ext.namespace('Grommunio.advancesearch');

/**
 * @class Grommunio.advancesearch.Actions
 *
 * Advance search actions which can be used within {@link Ext.Button buttons}
 * or other {@link Ext.Component components} with action handlers.
 * @singleton
 */
Grommunio.advancesearch.Actions = {
	/**
	 * Open a {@link Grommunio.advancesearch.dialogs.SelectFolderContentPanel SelectFolderContentPanel} for
	 * select the {@link Grommunio.core.data.IPFRecord folder} on which search gets performs.
	 *
	 * @param {Object} config (optional) Configuration object to create the ContentPanel
	 */
	openSelectSearchFolderDialog: function(config)
	{
		config = Ext.applyIf(config || {}, {
			modal: true
		});
		var componentType = Grommunio.core.data.SharedComponentType['search.dialog.selectfolder'];
		Grommunio.core.data.UIFactory.openLayerComponent(componentType, [], config);
	},

	/**
	 * Open a dialog in which a new {@link Grommunio.common.favorites.data.FavoritesFolderRecord search} folder record can be
	 * further edited.
	 *
	 * @param {Grommunio.advancesearch.AdvanceSearchContextModel} model Context Model object that will be used
	 * to {@link Grommunio.advancesearch.AdvanceSearchContextModel#createSearchFolderRecord create} the search folder.
	 * @param {Object} config configuration options for {@link Grommunio.advancesearch.dialogs.CreateSearchFolderContentPanel CreateSearchFolderContentPanel}.
	 */
	openCreateSearchFolderContentPanel: function(model, config)
	{
		config = Ext.apply(config||{}, {
			modal: true,
			manager: Ext.WindowMgr,
			iconCls: 'icon_favorites',
			closable: false,
			resizable: false,
			showModalWithoutParent: true
		});

		var record = model.createSearchFolderRecord(config.searchText);

		Grommunio.core.data.UIFactory.openCreateRecord(record, config);
	},

	/**
	 * Open a {@link Grommunio.advancesearch.dialogs.SearchCategoriesContentPanel dialog}
	 * @param {Object} config configuration options.
	 */
	openSearchCategoryContentPanel: function (config)
	{
		var componentType = Grommunio.core.data.SharedComponentType['search.dialog.searchcategory'];
		Grommunio.core.data.UIFactory.openLayerComponent(componentType, [], config);
	}
};
