/**
 * #dependsFile client/zarafa/core/data/MAPIStore.js
 */
Ext.namespace('Zarafa.core.data');

/**
 * @class Zarafa.core.data.MAPISubStore
 * @extends Zarafa.core.data.NoSyncStore
 */
Zarafa.core.data.MAPISubStore = Ext.extend(Zarafa.core.data.NoSyncStore, {
	/**
	 * The {@link Zarafa.core.data.MAPIRecord MAPIRecord} that is the parent of this store.
	 * @property
	 * @type Zarafa.core.data.MAPIRecord
	 */
	parentRecord: null,

	/**
	 * @cfg {Zarafa.core.data.JsonReader} reader The {@link Zarafa.core.data.JsonReader Reader} object which processes the
	 * data object and returns an Array of {@link Zarafa.core.data.MAPIRecord MAPIRecord} objects which are cached keyed by their
	 * <b><tt>{@link Zarafa.core.data.MAPIRecord#id id}</tt></b> property.
	 */
	reader : undefined,

	/**
	 * @cfg {Zarafa.core.data.JsonWriter} writer
	 * <p>The {@link Zarafa.core.data.JsonWriter Writer} object which processes a record object for being written
	 * to the server-side database.</p>
	 * <br><p>When a writer is installed into a Store the {@link #add}, {@link #remove}, and {@link #update}
	 * events on the store are monitored in order to remotely {@link #createRecords create records},
	 * {@link #destroyRecord destroy records}, or {@link #updateRecord update records}.</p>
	 */
	writer : undefined,

	/**
	 * @cfg {Boolean} persistentFilter True when the {@link #filter} which
	 * has been applied on this store should be reapplied when the store
	 * has been {@link #load loaded}
	 */
	persistentFilter : true,

	/**
	 * The currently active function which was given to {@link #filterBy}.
	 * @property
	 * @type Function
	 * @private
	 */
	filterFn : undefined,

	/**
	 * The currently active {@link #filterFn function} scope which was given to {@link #filterBy}.
	 * @property
	 * @type Object
	 * @private
	 */
	filterScope : undefined,

	/**
	 * @constructor
	 * @param config Configuration structure
	 */
	constructor : function(config)
	{
		config = config || {};

		// If the reader is provided, but not the recordType, we can obtain
		// the recordType from the reader.
		if (config.reader) {
			if (!config.recordType) {
				config.recordType = config.reader.recordType;
			}
		}

		this.addEvents(
			/**
			 * @event load
			 * Fires after a new set of Records has been loaded.
			 * @param {Store} this
			 * @param {Ext.data.Record[]} records The Records that were loaded
			 * @param {Object} options The loading options that were specified (see {@link #load} for details)
			 */
			'load',
			/**
			 * @event datachanged
			 * Fires when the data cache has changed in a bulk manner (e.g., it has been sorted, filtered, etc.)
			 * and a widget that is using this Store as a Record cache should refresh its view.
			 * @param {Store} this
			 */
			'datachanged'
		);

		Zarafa.core.data.MAPISubStore.superclass.constructor.call(this, config);
	},

	/**
	 * Called when member is added on store. Should not be used directly.
	 * It's called by Store#add automatically
	 * @param {Store} store
	 * @param {Ext.data.Record/Ext.data.Record[]} record
	 * @param {Number} index
	 * @private
	 */
	createRecords : function(store, record, index)
	{
		var parentRecord = this.getParentRecord();
		if(parentRecord) {
			// this will add parent record to modified array of associated store
			// and will mark the record as dirty.
			parentRecord.afterEdit();
		}

		Zarafa.core.data.MAPISubStore.superclass.createRecords.call(this, store, record, index);
	},

	/**
	 * Destroys a record or records. Should not be used directly.
	 * It's called by Store#remove automatically
	 * @param {Store} store
	 * @param {Ext.data.Record/Ext.data.Record[]} record
	 * @param {Number} index
	 * @private
	 */
	destroyRecord : function(store, record, index)
	{
		if(this.getParentRecord()){
			this.getParentRecord().markDirty();
		}
		Zarafa.core.data.MAPISubStore.superclass.destroyRecord.call(this, store, record, index);
	},

	/**
	 * Get the {@link Zarafa.core.data.MAPIRecord IPMRecord} that is the parent of this store.
	 * @return {Zarafa.core.data.MAPIRecord} The parent IPMRecord.
	 */
	getParentRecord : function()
	{
		return this.parentRecord;
	},

	/**
	 * Set the {@link Zarafa.core.data.MAPIRecord IPMRecord} that is the parent of this store.
	 * @param {Zarafa.core.data.MAPIRecord} record The parent IPMRecord.
	 */
	setParentRecord : function(record)
	{
		this.parentRecord = record;
	},

	/**
	 * Get the Record with the specified id.
	 * If the {@link #reader} has the {@link Ext.data.JsonReader#idProperty} set to 'entryid',
	 * then this function will also use {@link Zarafa.core.EntryId#compareEntryIds}. For
	 * 'store_entryid' then {@link Zarafa.core.EntryId#compareStoreEntryIds} is used.
	 * @param {String} id The id of the Record to find.
	 * @return {Ext.data.Record} The Record with the passed id. Returns undefined if not found.
	 */
	getById : function(id)
	{
		// First use the original implementation
		var item = Zarafa.core.data.MAPISubStore.superclass.getById.call(this, id);

		// If no item was found, and the reader uses the 'entryid' property,
		// we should retry searching using the compareEntryIds function. If that
		// fails as well, then the item is really not present.
		if (!item) {
			var index = -1;
			if (this.reader.meta.idProperty === 'entryid') {
				index = this.findBy(function(record) { return Zarafa.core.EntryId.compareEntryIds(id, record.id); });
			} else if (this.reader.meta.idProperty === 'store_entryid') {
				index = this.findBy(function(record) { return Zarafa.core.EntryId.compareStoreEntryIds(id, record.id); });
			}

			if (index >= 0) {
				item = this.getAt(index);
			}
		}

		return item;
	},

	/**
	 * Filter by a function. Returns a <i>new</i> collection that has been filtered.
	 * The passed function will be called with each object in the collection.
	 * If the function returns true, the value is included otherwise it is filtered.
	 * @param {Function} fn The function to be called, it will receive the args o (the object), k (the key)
	 * @param {Object} scope (optional) The scope (<code>this</code> reference) in which the function is executed. Defaults to this MixedCollection.
	 * @return {MixedCollection} The new filtered collection
	 */
	filterBy : Zarafa.core.data.MAPIStore.prototype.filterBy,

	/**
	 * Revert to a view of the Record cache with no filtering applied.
	 * @param {Boolean} suppressEvent If <tt>true</tt> the filter is cleared silently without firing the
	 * {@link #datachanged} event.
	 */
	clearFilter : Zarafa.core.data.MAPIStore.prototype.clearFilter,

	/**
	 * Loads data from a passed data block and fires the {@link #load} event. A {@link Ext.data.Reader Reader}
	 * which understands the format of the data must have been configured in the constructor.
	 * @param {Object} data The data block from which to read the Records.  The format of the data expected
	 * is dependent on the type of {@link Ext.data.Reader Reader} that is configured and should correspond to
	 * that {@link Ext.data.Reader Reader}'s <tt>{@link Ext.data.Reader#readRecords}</tt> parameter.
	 * @param {Boolean} append (Optional) <tt>true</tt> to append the new Records rather the default to replace
	 * the existing cache.
	 * <b>Note</b>: that Records in a Store are keyed by their {@link Ext.data.Record#id id}, so added Records
	 * with ids which are already present in the Store will <i>replace</i> existing Records. Only Records with
	 * new, unique ids will be added.
	 */
	loadData : function(o, append)
	{
		if (Ext.isDefined(this.reader)) {
			var r = this.reader.readRecords(o);
			this.loadRecords(r, {add: append}, true);
		}
	},
 
	/**
	 * Callback function which will be called when 'read' action is executed 
	 * and {@link Zarafa.core.data.JsonReader JsonReader} has deserialized data
	 * into {@link Zarafa.core.data.MAPIRecord MAPIRecord},
	 * so the records can be added to the {@link Zarafa.core.data.NoSyncStore NoSyncStore}.
	 * @param {Object} o response object containing array of {@link Zarafa.core.data.MAPIRecord MAPIRecord}
	 * and optionally a property indicating total number of records.
	 * @param {Object} options optionally can contain 'add' which will append {@link Zarafa.core.data.MAPIRecord MAPIRecord}
	 * to the existing set of cached {@link Zarafa.core.data.MAPIRecord MAPIRecord}.
	 * @private
	 */
	loadRecords : function(o, options, success)
	{
		if (this.isDestroyed === true) {
			return;
		}
		if (!o || success === false) {
			if(success !== false) {
				this.fireEvent('load', this, [], options);
			}
			return;
		}
		var r = o.records, t = o.totalRecords || r.length;
		if (!options || options.add !== true) {
			for (var i = 0, len = r.length; i < len; i++) {
				r[i].join(this);
			}

			if(this.snapshot){
				this.data = this.snapshot;
				delete this.snapshot;
			}
			this.clearData();
			this.data.addAll(r);
			this.totalLength = t;
			this.fireEvent('datachanged', this);
		} else {
			this.totalLength = Math.max(t, this.data.length+r.length);
			this.add(r);
		}
		this.fireEvent('load', this, r, options);

		if (this.persistentFilter === true) {
			if (this.filterFn) {
				this.filterBy(this.filterFn, this.filterScope);
			}
		}
	},

	/**
	 * Sort the data in the store using the given sort function.
	 * This will call {@link Ext.util.MixedCollection#sort sort} on the
	 * {@link #data} object.
	 * @param {String} direction (optional) 'ASC' or 'DESC'. Defaults to 'ASC'.
	 * @param {Function} fn (optional) Comparison function that defines the sort order. Defaults to sorting by numeric value.
	 */
	sortBy : function(direction, fn)
	{
		this.data.sort(direction, fn);
		if (this.snapshot && this.snapshot != this.data) {
			this.snapshot.sort(direction, fn);
		}
		this.fireEvent('datachanged', this);
	}
});
