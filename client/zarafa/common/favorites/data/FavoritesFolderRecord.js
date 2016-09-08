/*
 * #dependsFile client/zarafa/core/mapi/ObjectType.js
 * #dependsFile client/zarafa/core/data/RecordFactory.js
 */
Ext.namespace('Zarafa.common.favorites.data');

/**
 * @class Zarafa.common.favorites.data.FavoritesFolderRecord
 * @extends Zarafa.hierarchy.data.MAPIFolderRecord
 */
Zarafa.common.favorites.data.FavoritesFolderRecord = Ext.extend(Zarafa.hierarchy.data.MAPIFolderRecord, {

	/**
	 * Returns all child folders of given folder.
	 *
	 * @return {Array} array of child {@link Zarafa.hierarchy.data.MAPIFolderRecord folders}
	 */
	getChildren : function()
	{
		var rs = Zarafa.common.favorites.data.FavoritesFolderRecord.superclass.getChildren.apply(this, arguments);

		if (this.isFavoritesRootFolder()) {
			var favoritesStore = this.getMAPIStore().getFavoritesStore();
			favoritesStore.each(function(record) {
				if (record.isFavoritesFolder()) {
					rs.push(record);
				}
			}, this);
		}

		return rs;
	},

	/**
	 * Function is used to get original folder from favorites folder is created.
	 * @return {Zarafa.hierarchy.data.MAPIFolderRecord} return {Zarafa.hierarchy.data.MAPIFolderRecord folder}.
	 */
	getOriginalRecordFromFavoritesRecord : function()
	{
		var mapiStore = container.getHierarchyStore().getById(this.get('store_entryid'));
		return mapiStore.getFolderStore().getById(this.get("entryid"));
	}
});

Zarafa.core.data.RecordFactory.setBaseClassToObjectType(Zarafa.core.mapi.ObjectType.MAPI_FOLDER, Zarafa.common.favorites.data.FavoritesFolderRecord);