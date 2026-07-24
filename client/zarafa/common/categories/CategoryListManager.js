/*
 * #dependsFile client/zarafa/common/categories/data/CategoriesStore.js
 * #dependsFile client/zarafa/core/data/AbstractResponseHandler.js
 */
Ext.namespace('Zarafa.common.categories');

/**
 * @class Zarafa.common.categories.CategoryListManagerClass
 * @extends Ext.util.Observable
 *
 * Loads, caches and saves the per-mailbox master category list. Each mailbox
 * (store) has its own list, stored the Outlook-compatible way in the store's
 * Calendar folder (see the server-side CategoryList/CategoryListModule), so the
 * list is shared by every user of that mailbox. This manager keeps one
 * {@link Zarafa.common.categories.data.CategoriesStore} per store entryid,
 * populated from the server, and fires {@link #load} when a store's list
 * arrives so views can refresh.
 *
 * @singleton (instantiated below as Zarafa.common.categories.CategoryListManager)
 */
Zarafa.common.categories.CategoryListManagerClass = Ext.extend(Ext.util.Observable, {
	/**
	 * Cache of per-store category stores, keyed by lower-cased store entryid.
	 * @property
	 * @type Object
	 * @private
	 */
	stores: null,

	/**
	 * Set of store entryids (lower-cased) for which a request is in flight,
	 * used to avoid firing duplicate requests.
	 * @property
	 * @type Object
	 * @private
	 */
	loading: null,

	/**
	 * @constructor
	 */
	constructor: function()
	{
		this.stores = {};
		this.loading = {};

		this.addEvents(
			/**
			 * @event load
			 * Fires when a store's category list has been loaded (or reloaded).
			 * @param {Zarafa.common.categories.CategoryListManagerClass} manager
			 * @param {String} storeEntryId The (lower-cased) store entryid
			 * @param {Zarafa.common.categories.data.CategoriesStore} categoriesStore
			 */
			'load'
		);

		Zarafa.common.categories.CategoryListManagerClass.superclass.constructor.call(this);
	},

	/**
	 * Normalise a store entryid for use as a cache key.
	 * @param {String} storeEntryId
	 * @return {String} the lower-cased entryid, or '' when empty
	 * @private
	 */
	normalizeId: function(storeEntryId)
	{
		return storeEntryId ? storeEntryId.toLowerCase() : '';
	},

	/**
	 * Return the cached category store for the given store entryid, or
	 * undefined when it has not been loaded yet.
	 * @param {String} storeEntryId
	 * @return {Zarafa.common.categories.data.CategoriesStore|undefined}
	 */
	getCategoriesStore: function(storeEntryId)
	{
		return this.stores[this.normalizeId(storeEntryId)];
	},

	/**
	 * Load the category list for the given store from the server. Does nothing
	 * when it is already cached or a request is already in flight, unless
	 * forceReload is true.
	 * @param {String} storeEntryId The store entryid (hex)
	 * @param {Boolean} forceReload (optional) reload even when already cached
	 */
	load: function(storeEntryId, forceReload)
	{
		var id = this.normalizeId(storeEntryId);
		if ( !id ){
			return;
		}
		if ( !forceReload && (this.stores[id] || this.loading[id]) ){
			return;
		}

		this.loading[id] = true;
		var responseHandler = new Zarafa.core.data.AbstractResponseHandler({
			doList: this.onListResponse.createDelegate(this, [id], true),
			doUpdate: this.onListResponse.createDelegate(this, [id], true)
		});
		container.getRequest().singleRequest('categorylistmodule', 'list', { store_entryid: storeEntryId }, responseHandler);
	},

	/**
	 * Save the given category list for the given store back to the server. The
	 * server merges it onto the stored list (preserving Outlook bookkeeping)
	 * and returns the canonical result, which repopulates the cache.
	 * @param {String} storeEntryId The store entryid (hex)
	 * @param {Object[]} categories The category dicts to store
	 */
	save: function(storeEntryId, categories)
	{
		var id = this.normalizeId(storeEntryId);
		var responseHandler = new Zarafa.core.data.AbstractResponseHandler({
			doList: this.onListResponse.createDelegate(this, [id], true),
			doUpdate: this.onListResponse.createDelegate(this, [id], true)
		});
		container.getRequest().singleRequest('categorylistmodule', 'save', {
			store_entryid: storeEntryId,
			categories: categories
		}, responseHandler);
	},

	/**
	 * Handle a list/update response from the server: (re)build the per-store
	 * {@link Zarafa.common.categories.data.CategoriesStore} and fire
	 * {@link #load}.
	 * @param {Object} response The action data ({store_entryid, categories})
	 * @param {String} requestedId The (normalised) store entryid this request
	 * was made with. Records and the hierarchy carry this id, whereas the server
	 * echoes the store's canonical PR_ENTRYID; for shared stores the two differ,
	 * so the list is cached under both to guarantee a lookup hit.
	 * @private
	 */
	onListResponse: function(response, requestedId)
	{
		if ( !response ){
			return;
		}

		var categoriesStore = new Zarafa.common.categories.data.CategoriesStore({
			categoriesData: response.categories || []
		});

		var ids = [];
		if ( requestedId ){
			ids.push(requestedId);
		}
		if ( response.store_entryid ){
			var responseId = this.normalizeId(response.store_entryid);
			if ( ids.indexOf(responseId) === -1 ){
				ids.push(responseId);
			}
		}

		Ext.each(ids, function(id){
			delete this.loading[id];
			this.stores[id] = categoriesStore;
		}, this);

		if ( ids.length ){
			this.fireEvent('load', this, ids[0], categoriesStore);
		}
	}
});

/**
 * @class Zarafa.common.categories.CategoryListManager
 * The singleton instance of {@link Zarafa.common.categories.CategoryListManagerClass}.
 * @singleton
 */
Zarafa.common.categories.CategoryListManager = new Zarafa.common.categories.CategoryListManagerClass();
