Ext.namespace('Zarafa.common.favorites.data');

/**
 * @class Zarafa.common.favorites.data.MAPIFavoritesSubStore
 * @extends Zarafa.hierarchy.data.IPFSubStore
 *
 * {@link Zarafa.hierarchy.data.MAPIFavoritesSubStore} holds {@link Zarafa.hierarchy.data.FavoritesFolderRecord} as records,
 * which defines favorites folders of all opened stores(own, shared, public)
 */
Zarafa.common.favorites.data.MAPIFavoritesSubStore = Ext.extend(Zarafa.hierarchy.data.IPFSubStore, {
	/**
	 * @constructor
	 * @param {Object} config Configuration object
	 */
	constructor : function(config)
	{
		config = config || {};

		Zarafa.common.favorites.data.MAPIFavoritesSubStore.superclass.constructor.call(this, config);
	}
});