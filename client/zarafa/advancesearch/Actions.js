Ext.namespace('Zarafa.advancesearch');

/**
 * @class Zarafa.advancesearch.Actions
 *
 * Advance search actions which can be used within {@link Ext.Button buttons}
 * or other {@link Ext.Component components} with action handlers.
 * @singleton
 */
Zarafa.advancesearch.Actions = {
	/**
	 * Open a {@link Zarafa.advancesearch.dialogs.SelectFolderContentPanel SelectFolderContentPanel} for
	 * select the {@link Zarafa.core.data.IPFRecord folder} on which search get's performs.
	 *
	 * @param {Object} config (optional) Configuration object to create the ContentPanel
	 */
	openSelectSearchFolderDialog : function(config)
	{
		config = Ext.applyIf(config || {}, {
			modal : true
		});
		var componentType = Zarafa.core.data.SharedComponentType['search.dialog.selectfolder'];
		Zarafa.core.data.UIFactory.openLayerComponent(componentType, [], config);
	},

	/**
	 * Open a dialog in which a new {@link Zarafa.common.favorites.data.FavoritesFolderRecord search} folder record can be
	 * further edited.
	 *
	 * @param {Zarafa.advancesearch.AdvanceSearchContextModel} model Context Model object that will be used
	 * to {@link Zarafa.advancesearch.AdvanceSearchContextModel#createSearchFolderRecord create} the search folder.
	 * @param {Object} config configuration options for {@link Zarafa.advancesearch.dialogs.CreateSearchFolderContentPanel CreateSearchFolderContentPanel}.
	 */
	openCreateSearchFolderContentPanel : function(model, config)
	{
		config = Ext.apply(config||{}, {
			modal : true,
			manager : Ext.WindowMgr,
			iconCls : 'icon_favorites',
			closable : false,
			resizable : false,
			showModalWithoutParent : true
		});

		var record = model.createSearchFolderRecord(config.searchText);

		Zarafa.core.data.UIFactory.openCreateRecord(record, config);
	}
};
