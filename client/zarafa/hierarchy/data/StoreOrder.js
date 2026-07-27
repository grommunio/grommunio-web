Ext.namespace('Zarafa.hierarchy.data');

/**
 * @class Zarafa.hierarchy.data.StoreOrder
 * @extends Ext.util.Observable
 *
 * Manager for the user-defined order of the mailboxes (stores) in the hierarchy.
 *
 * By default the hierarchy places the own store on top, the Public store at the
 * bottom, and sorts all shared stores alphabetically in between (see
 * {@link Zarafa.hierarchy.ui.TreeSorter}). This manager holds an explicit order for
 * the shared stores, which is persisted in the user settings so it survives a reload
 * and applies to every hierarchy tree in the client.
 *
 * Stores are identified by their {@link Zarafa.hierarchy.data.MAPIStoreRecord#user_name
 * user_name} rather than by their store entryid, because that is the identifier the
 * shared-store settings themselves are keyed on and it remains valid when a store is
 * closed and opened again.
 *
 * @singleton
 */
Zarafa.hierarchy.data.StoreOrder = Ext.extend(Ext.util.Observable, {
	/**
	 * The settings path in which the order is persisted. The value is an array of
	 * {@link #getStoreKey store keys}, ordered top to bottom.
	 * @property
	 * @type String
	 */
	settingsPath: 'zarafa/v1/contexts/hierarchy/store_order',

	/**
	 * @constructor
	 */
	constructor: function()
	{
		this.addEvents(
			/**
			 * @event change
			 * Fires after the order of the mailboxes has been changed. Hierarchy trees
			 * listen to this to re-sort themselves, as the order applies to all of them
			 * and not only to the tree in which the change was made.
			 * @param {Zarafa.hierarchy.data.StoreOrder} storeOrder This object
			 * @param {String[]} order The new order as a list of {@link #getStoreKey store keys}
			 */
			'change'
		);

		Zarafa.hierarchy.data.StoreOrder.superclass.constructor.call(this);
	},

	/**
	 * Obtain the identifier under which the given store is recorded in the order.
	 * @param {Zarafa.hierarchy.data.MAPIStoreRecord} mapiStore The store to identify
	 * @return {String} The key for the store, or an empty string when the store cannot
	 * be identified and can therefore not be ordered.
	 */
	getStoreKey: function(mapiStore)
	{
		if (!mapiStore) {
			return '';
		}

		var userName = mapiStore.get('user_name');
		return Ext.isString(userName) ? userName.toLowerCase() : '';
	},

	/**
	 * Check if the given store may be moved by the user. Only shared stores can be
	 * reordered; the own store remains pinned to the top of the hierarchy and the
	 * Public store to the bottom, which is the order the client has always had.
	 * @param {Zarafa.hierarchy.data.MAPIStoreRecord} mapiStore The store to check
	 * @return {Boolean} True when the store can be reordered
	 */
	isReorderable: function(mapiStore)
	{
		if (!mapiStore || !mapiStore.isSharedStore()) {
			return false;
		}

		return !Ext.isEmpty(this.getStoreKey(mapiStore));
	},

	/**
	 * Obtain the currently persisted order.
	 * @return {String[]} The ordered list of {@link #getStoreKey store keys}
	 */
	getOrder: function()
	{
		var order = container.getSettingsModel().get(this.settingsPath, true);
		return Array.isArray(order) ? order : [];
	},

	/**
	 * Compare two stores based on the user-defined order. As long as the user has never
	 * reordered anything this returns 0 for every pair, leaving the layout entirely to
	 * the caller. Once an explicit order exists every store is ranked by
	 * {@link #getStoreRank}, so the comparison is transitive even when stores the user
	 * cannot reorder - the own store's folders in a filtered tree, an archive store -
	 * are siblings of ordered mailboxes. Deciding some pairs by the explicit order and
	 * others by a name comparison can contradict itself, and an inconsistent comparison
	 * makes Array.sort produce an arbitrary order.
	 * @param {Zarafa.hierarchy.data.MAPIStoreRecord} store1 The first store to compare
	 * @param {Zarafa.hierarchy.data.MAPIStoreRecord} store2 The second store to compare
	 * @return {Number} -1 when store1 comes first, +1 when store2 comes first, 0 when
	 * both stores rank equally and the caller must decide the order itself.
	 */
	compareStores: function(store1, store2)
	{
		var order = this.getOrder();
		if (order.length === 0) {
			return 0;
		}

		var rank1 = this.getStoreRank(store1, order);
		var rank2 = this.getStoreRank(store2, order);

		if (rank1 === rank2) {
			return 0;
		}

		return rank1 < rank2 ? -1 : +1;
	},

	/**
	 * Rank a store for {@link #compareStores}: the own store first, then the mailboxes
	 * the user has given an explicit position, then everything else - mailboxes opened
	 * after the last reorder, archive stores - and the Public store last. The own and
	 * Public store ranks mirror the IPM_SUBTREE rules in
	 * {@link Zarafa.hierarchy.ui.TreeSorter}, which pin them in an unfiltered tree
	 * before this comparison is ever consulted. The rank depends on the store alone,
	 * which is what makes the comparison transitive; stores with the same rank are left
	 * to the caller's own comparison.
	 * @param {Zarafa.hierarchy.data.MAPIStoreRecord} mapiStore The store to rank
	 * @param {String[]} order The persisted order, as returned by {@link #getOrder}
	 * @return {Number} The rank of the store, lower ranks sort first
	 * @private
	 */
	getStoreRank: function(mapiStore, order)
	{
		if (mapiStore) {
			if (mapiStore.isDefaultStore()) {
				return -1;
			}

			if (mapiStore.isPublicStore()) {
				return order.length + 1;
			}

			// The isReorderable check keeps out a store which merely shares its
			// user_name with an ordered mailbox, such as that mailbox's archive.
			var index = order.indexOf(this.getStoreKey(mapiStore));
			if (index !== -1 && this.isReorderable(mapiStore)) {
				return index;
			}
		}

		return order.length;
	},

	/**
	 * Persist a new order and inform all listeners.
	 * @param {String[]} keys The {@link #getStoreKey store keys} in their new order
	 */
	setOrder: function(keys)
	{
		var order = [];
		var openKeys = this.getOpenStoreKeys();

		for (var i = 0, len = keys.length; i < len; i++) {
			// Guard against a store being listed twice, which would make the
			// comparison in compareStores depend on which duplicate is found first.
			// A store can legitimately have several top level nodes in a filtered
			// tree - one per visible folder - so duplicates are expected input here.
			// Keys of mailboxes that are no longer open are dropped as well: the
			// order is carried over from one write to the next, so closed mailboxes
			// would otherwise linger in the setting forever.
			if (!Ext.isEmpty(keys[i]) && order.indexOf(keys[i]) === -1 &&
				openKeys.indexOf(keys[i]) !== -1) {
				order.push(keys[i]);
			}
		}

		container.getSettingsModel().set(this.settingsPath, order);

		this.fireEvent('change', this, order);
	},

	/**
	 * Obtain the keys of all currently opened stores the user may reorder.
	 * @return {String[]} The {@link #getStoreKey store keys} of the opened stores
	 * @private
	 */
	getOpenStoreKeys: function()
	{
		var keys = [];
		var stores = container.getHierarchyStore().getRange();

		for (var i = 0, len = stores.length; i < len; i++) {
			if (this.isReorderable(stores[i])) {
				keys.push(this.getStoreKey(stores[i]));
			}
		}

		return keys;
	}
});

Zarafa.hierarchy.data.StoreOrder = new Zarafa.hierarchy.data.StoreOrder();
