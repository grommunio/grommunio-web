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
	 * True once the one-time migration of the own mailbox's list has been
	 * attempted this session, so it is not repeated.
	 * @property
	 * @type Boolean
	 * @private
	 */
	seeded: false,

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
	 * Return the cached category list for a store as plain category dicts, or
	 * null when it has not been loaded yet (callers fall back to the per-user
	 * list). Used to seed an editable per-mailbox CategoriesStore.
	 * @param {String} storeEntryId
	 * @return {Object[]|null}
	 */
	getCategoriesData: function(storeEntryId)
	{
		var store = this.getCategoriesStore(storeEntryId);
		if ( !store ){
			return null;
		}
		return store.getRange().map(function(categoryRecord){
			return {
				name: categoryRecord.get('category'),
				color: categoryRecord.get('color'),
				standardIndex: categoryRecord.get('standardIndex'),
				quickAccess: categoryRecord.get('quickAccess'),
				sortIndex: categoryRecord.get('sortIndex'),
				used: categoryRecord.get('used')
			};
		});
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

		// One-time migration: give the user's own mailbox a real list by seeding
		// its (empty) list from the per-user categories the user already has.
		this.seedOwnStoreIfEmpty(ids, response.categories || []);
	},

	/**
	 * If the just-loaded store is the user's own default store and it has no
	 * stored category list yet, seed it from the existing per-user WebApp
	 * categories (which already include the defaults) and save it back to the
	 * mailbox. Runs at most once per session.
	 * @param {String[]} ids The (normalised) entryids the loaded list was cached under
	 * @param {Object[]} categories The categories that were loaded
	 * @private
	 */
	seedOwnStoreIfEmpty: function(ids, categories)
	{
		if ( this.seeded || (categories && categories.length) ){
			return;
		}

		var hierarchyStore = container.getHierarchyStore();
		var defaultStore = hierarchyStore ? hierarchyStore.getDefaultStore() : null;
		if ( !defaultStore ){
			return;
		}

		var ownEntryId = defaultStore.get('store_entryid');
		if ( ids.indexOf(this.normalizeId(ownEntryId)) === -1 ){
			return; // the loaded store is not the user's own default store
		}

		this.seeded = true;

		var seed = container.getPersistentSettingsModel().get('grommunio/main/categories') || [];
		if ( !seed.length ){
			seed = container.getServerConfig().getDefaultCategories() || [];
		}
		if ( seed.length ){
			this.save(ownEntryId, seed);
		}
	}
});

/**
 * @class Zarafa.common.categories.CategoryListManager
 * The singleton instance of {@link Zarafa.common.categories.CategoryListManagerClass}.
 * @singleton
 */
Zarafa.common.categories.CategoryListManager = new Zarafa.common.categories.CategoryListManagerClass();
