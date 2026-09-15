/*
 * SPDX-FileCopyrightText: Copyright 2020 - 2026 grommunio GmbH
 * SPDX-FileCopyrightText: Copyright 2016 Kopano and its licensors
 * SPDX-FileCopyrightText: Copyright 2005 - 2016 Zarafa B.V. and its licensors
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

/*
 * #dependsFile client/grommunio/core/mapi/ObjectType.js
 * #dependsFile client/grommunio/core/data/RecordFactory.js
 */
Ext.namespace('Grommunio.common.favorites.data');

/**
 * @class Grommunio.common.favorites.data.FavoritesFolderRecord
 * @extends Grommunio.hierarchy.data.MAPIFolderRecord
 */
Grommunio.common.favorites.data.FavoritesFolderRecord = Ext.extend(Grommunio.hierarchy.data.MAPIFolderRecord, {

	/**
	 * Returns all child folders of given folder.
	 *
	 * @return {Array} array of child {@link Grommunio.hierarchy.data.MAPIFolderRecord folders}
	 */
	getChildren: function()
	{
		var rs = Grommunio.common.favorites.data.FavoritesFolderRecord.superclass.getChildren.apply(this, arguments);

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
	 * @return {Grommunio.hierarchy.data.MAPIFolderRecord} return {Grommunio.hierarchy.data.MAPIFolderRecord folder}.
	 */
	getOriginalRecordFromFavoritesRecord: function()
	{
		var mapiStore = container.getHierarchyStore().getById(this.get('store_entryid'));

		return mapiStore ? mapiStore.getFolderStore().getById(this.get("entryid")) : undefined;
	}
});

Grommunio.core.data.RecordFactory.setBaseClassToObjectType(Grommunio.core.mapi.ObjectType.MAPI_FOLDER, Grommunio.common.favorites.data.FavoritesFolderRecord);
