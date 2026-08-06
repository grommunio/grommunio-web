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
	 * Obtain the position of the given store within the persisted order.
	 * @param {Zarafa.hierarchy.data.MAPIStoreRecord} mapiStore The store to look up
	 * @return {Number} The index of the store, or -1 when the store has no explicit position
	 */
	indexOf: function(mapiStore)
	{
		var key = this.getStoreKey(mapiStore);
		if (Ext.isEmpty(key)) {
			return -1;
		}

		return this.getOrder().indexOf(key);
	},

	/**
	 * Compare two stores based on the user-defined order. Stores which have an explicit
	 * position are placed before stores which have none, so a mailbox opened after the
	 * user last reordered the hierarchy appears at the bottom of the shared stores
	 * rather than in an arbitrary spot.
	 * @param {Zarafa.hierarchy.data.MAPIStoreRecord} store1 The first store to compare
	 * @param {Zarafa.hierarchy.data.MAPIStoreRecord} store2 The second store to compare
	 * @return {Number} -1 when store1 comes first, +1 when store2 comes first, 0 when
	 * neither store has an explicit position and the caller must decide the order itself.
	 */
	compareStores: function(store1, store2)
	{
		// Both stores must be ones the user may reorder. Without this the own store,
		// which never has an explicit position, would sort *after* every shared store
		// that has one - visible in a filtered tree such as the calendar folder list,
		// where the own store's folders are ordinary top level nodes and are therefore
		// not held in place by the IPM_SUBTREE rules in the sorter.
		if (!this.isReorderable(store1) || !this.isReorderable(store2)) {
			return 0;
		}

		var index1 = this.indexOf(store1);
		var index2 = this.indexOf(store2);

		if (index1 === index2) {
			// Either both stores are unordered (-1), or the same store is compared
			// with itself. Let the caller fall back to its own comparison.
			return 0;
		}

		if (index1 === -1) {
			return +1;
		}

		if (index2 === -1) {
			return -1;
		}

		return index1 < index2 ? -1 : +1;
	},

	/**
	 * Persist a new order and inform all listeners. The complete sequence of
	 * {@link #isReorderable reorderable} stores is written, so the stored order is
	 * always a full description of what the user sees rather than a partial one.
	 * @param {String[]} keys The {@link #getStoreKey store keys} in their new order
	 */
	setOrder: function(keys)
	{
		var order = [];

		for (var i = 0, len = keys.length; i < len; i++) {
			// Guard against a store being listed twice, which would make the
			// comparison in compareStores depend on which duplicate is found first.
			// A store can legitimately have several top level nodes in a filtered
			// tree - one per visible folder - so duplicates are expected input here.
			if (!Ext.isEmpty(keys[i]) && order.indexOf(keys[i]) === -1) {
				order.push(keys[i]);
			}
		}

		container.getSettingsModel().set(this.settingsPath, order);

		this.fireEvent('change', this, order);
	}
});

Zarafa.hierarchy.data.StoreOrder = new Zarafa.hierarchy.data.StoreOrder();
