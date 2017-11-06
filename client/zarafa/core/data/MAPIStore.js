Ext.namespace('Zarafa.core.data');

Ext.data.Api.actions.open = 'open';

/**
 * @class Zarafa.core.data.MAPIStore
 * @extends Ext.data.GroupingStore
 * @xtype zarafa.mapistore
 *
 * Extension of the Extjs store which adding support for the 'open' command,
 * which is used by MAPI to request additional data for a record.
 */
Zarafa.core.data.MAPIStore = Ext.extend(Ext.data.GroupingStore, {
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
	 * Set to true when the {Zarafa.core.data.MAPIStore} starts saving, set to false when done.
	 * @property
	 * @type Boolean
	 * @private
	 */
	isSaving : false,

	/**
	 * @constructor
	 * @param config Configuration structure
	 */
	constructor : function(config)
	{
		config = config || {};

		Ext.applyIf(config, {
			// Don't automatically update changes to records to the server.
			autoSave : false,

			// When autoSave is false, indicates that CRUD operations are batched into a single request.
			batch : true
		});

		this.addEvents(
			/**
			 * @event open
			 * Fires when the {@link Zarafa.core.data.MAPIStore MAPIStore} gets extra data for a specific
			 * {@link Zarafa.core.data.MAPIRecord MAPIRecord}.
			 * @param {Zarafa.core.data.MAPIStore} store The {@link Zarafa.core.data.MAPIStore MAPIStore} which issues
			 * open request to get extra data for specific record.
			 * @param {Zarafa.core.data.MAPIRecord} record Record which is being opened to get extra information.
			 */
			'open'
		);

		Zarafa.core.data.MAPIStore.superclass.constructor.call(this, config);

		// Update the getKey function inside the MixedCollection to match
		// the one provided getRecordKey.
		this.data.getKey = this.getRecordKey;

		this.initEvents();
	},

	/**
	 * Initialize all events which Zarafa.core.data.MAPIStore MAPIStore} will listen to.
	 * @protected
	 */
	initEvents : function()
	{
		this.on('beforeload', this.onBeforeLoad, this);
		this.on('add', this.onAdd, this);
		this.on('remove', this.onRemove, this);
		this.on('write', this.onWrite, this);

		this.on('beforesave', function(){ this.isSaving = true; }, this);
		this.on('save', function(){ this.isSaving = false; }, this);
	},

	/**
	 * The {@link Ext.util.MixedCollection#getKey} function which must be
	 * applied to the {@link #data}{@link Ext.util.MixedCollection#getKey #getKey}
	 * function. This is assigned by the constructor and allows subclasses to
	 * simply override this function rather then apply it manually to {@link #data}
	 * themselves.
	 * @param {Ext.data.Record} o The record for which the key is requested
	 * @return {String} The key by which the record must be saved into the {@link Ext.util.MixedCollection}.
	 * @protected
	 */
	getRecordKey : Ext.util.MixedCollection.prototype.getKey,

	/**
	 * Check if a particular {@link Zarafa.core.Action action} is being executed
	 * by the {@link #proxy} of this store. When no action is given, this function
	 * will check if the proxy is busy with any action.
	 *
	 * @param {Zarafa.core.Action} action The action which is being checked
	 * @return {Boolean} True if the given action is being executed  by the proxy
	 */
	isExecuting : function(action)
	{
		return this.proxy.isExecuting(action);
	},

	/**
	 * Determine if a {@link #isExecuting 'list'} or {@link #isExecuting 'open'}
	 * request is still pending. And if so
	 * {@link Zarafa.core.data.MAPIProxy#cancelRequest cancel} those requests.
	 */
	cancelLoadRequests : function()
	{
		// If we are loading data, we want to cancel
		// the request as we don't want the data anymore.
		if (this.isExecuting('list')) {
			this.proxy.cancelRequests('list');
		}

		// If we are opening the record, we want to cancel
		// the request as we don't want the data anymore.
		if (this.isExecuting('open')) {
			this.proxy.cancelRequests('open');
		}

		// Saving is still interesting as the user might
		// not expect that action to be still pending.
	},

	/**
	 * Get the {@link Date#getTime timestamp} of the last time a response was given
	 * for the given action.
	 * @param {Zarafa.core.Action} action The action which is being checked
	 * @return {Number} The timestamp of the last action time
	 */
	lastExecutionTime : function(action)
	{
		return this.proxy.lastExecutionTime(action);
	},	

	/**
	 * <p>Reloads the Record cache from the configured Proxy. See the superclass {@link Ext.data.Store#reload documentation}
	 * for more detaiils.
	 * During reload we add an extra option into the {@link #load} argument which marks the action as a reload
	 * action.
	 */
	reload : function(options)
	{
		options = Ext.applyIf(options || {}, { reload : true });
		Zarafa.core.data.MAPIStore.superclass.reload.call(this, options);
	},

	/**
	 * Saves all pending changes to the store. See the superclass {@link Ext.data.Store#save documentation}
	 * for more details. Where the superclass saves all {@link #removed} and {@link #modified} records,
	 * this function will only save the records which are passed as argument.
	 *
	 * @param {Zarafa.core.data.MAPIRecord/Zarafa.core.data.MAPIRecord[]} records The records which
	 * must be saved to the server.
	 * @return {Number} batch Returns a number to uniquely identify the "batch" of saves occurring. -1 will be returned
	 * if there are no items to save or the save was cancelled.
	 */
	save : function(records) {
		// When no records are provided, fall back to the default behavior of the superclass.
		if (!Ext.isDefined(records)) {
			return Zarafa.core.data.MAPIStore.superclass.save.call(this);
		}

		if (!Array.isArray(records)) {
			records = [ records ];
		}

		if (!this.writer) {
			throw new Ext.data.Store.Error('writer-undefined');
		}

		var destroyed = [],
			created = [],
			updated = [],
			queue = [],
			trans,
			batch,
			data = {};

		for (var i = 0, len = records.length; i < len; i++) {
			var record = records[i];

			if (this.removed.indexOf(record) >= 0) {
				// Check for removed records first, a record located in this.removed is
				// guarenteed to be a non-phantom. See store.remove().
				destroyed.push(record);
			} else if (this.modified.indexOf(record) >= 0) {
				// Only accept valid records.
				if (record.isValid()) {
					if (record.phantom) {
						created.push(record);
					} else {
						updated.push(record);
					}
				}
			}
		}

		if (destroyed.length > 0) {
			queue.push(['destroy', destroyed]);
		}
		if (created.length > 0) {
			queue.push(['create', created]);
		}
		if (updated.length > 0) {
			queue.push(['update', updated]);
		}

		var len = queue.length;
		if(len){
			batch = ++this.batchCounter;
			for(var i = 0; i < len; ++i){
				trans = queue[i];
				data[trans[0]] = trans[1];
			}
			if(this.fireEvent('beforesave', this, data) !== false){
				for(var i = 0; i < len; ++i){
					trans = queue[i];
					this.doTransaction(trans[0], trans[1], batch);
				}
				return batch;
			}
		}
		return -1;
	},

	/**
	 * Event handler which is fired when we are about to (re)load the store.
	 * When this happens we should cancel all pending {@link #open} requests,
	 * as they cannot be completed anymore (the record will have been deleted,
	 * so the opened record has become useless.
	 * @private
	 */
	onBeforeLoad : function()
	{
		if (this.isExecuting('open')) {
			this.proxy.cancelRequests('open');
		}
	},

	/**
	 * Event handler which is raised when a {@link Zarafa.core.data.MAPIRecord MAPIRecord} has been added
	 * to this {@link Zarafa.core.data.MAPIStore MAPIStore}.
	 *
	 * @param {Zarafa.core.data.MAPIStore} store The {@link Zarafa.core.data.MAPIStore MAPIStore} to which the store was added.
	 * @param {Zarafa.core.data.MAPIRecord[]} records The array of {@link Zarafa.core.data.MAPIRecord records} which have been added.
	 * @param {Number} index The index at which the record(s) were added
	 * @private
	 */
	onAdd : function(store, records, index)
	{
		this.setRecordsStore(store, records);
	},

	/**
	 * Event handler which is raised when a {@link Zarafa.core.data.MAPIRecord MAPIRecord} has been removed
	 * from this {@link Zarafa.core.data.MAPIStore MAPIStore}.
	 *
	 * @param {Zarafa.core.data.MAPIStore} store The {@link Zarafa.core.data.MAPIStore MAPIStore} from which the records were removed.
	 * @param {Zarafa.core.data.MAPIRecord[]} records The array of {@link Zarafa.core.data.MAPIRecord records} which have been removed.
	 * @param {Number} index The index at which the record(s) were removed.
	 * @private
	 */
	onRemove: function(store, records, index)
	{
		this.setRecordsStore(undefined, records);
	},

	/**
	 * Event handler which is raised when the {@link #write} event has been fired. This will clear
	 * all {@link Zarafa.core.data.MAPIRecord#actions Message Actions} from the given records.
	 *
	 * @param {Zarafa.core.data.MAPIStore} store The store which fired the event
	 * @param {String} action [Ext.data.Api.actions.create|update|destroy]
	 * @param {Object} result The 'data' picked-out out of the response for convenience
	 * @param {Ext.Direct.Transaction} res The transaction
	 * @param {Record/Record[]} records The records which were written to the server
	 * @private
	 */
	onWrite : function(store, action, result, res, records)
	{
		if (!Array.isArray(records)) {
			records = [ records ];
		}

		for (var i = 0, len = records.length; i < len; i++) {
			records[i].clearMessageActions();
			records[i].clearActionResponse();
		}
	},

	/**
	 * Iterates through all {@link Zarafa.core.data.MAPIRecord records} and sets the
	 * reference to the {@link Zarafa.core.data.MAPIStore MAPIStore} to which it belongs.
	 *
	 * @param {Zarafa.core.data.MAPIStore} store The {@link Zarafa.core.data.MAPIStore MAPIStore} to which the
	 * {@link Zarafa.core.data.MAPIRecord records} must be assigned.
	 * @param {Zarafa.core.data.MAPIRecord[]} records The array of
	 * {@link Zarafa.core.data.MAPIRecord records} which must be updated.
	 * @private
	 */
	setRecordsStore : function(store, records)
	{
		records = Array.isArray(records) ? records : [ records ];
		Ext.each(records, function(record) { record.join(store); }, this);
	},

	/**
	 * Function is used to get extra properties from the server, which are not received in
	 * 'list' action. function will call {@link #execute} event, which is entry point for every
	 * CRUD operation, {@link #execute} will internall call {@link #createCallback} to create a
	 * callback function based on operation type ('open' -> onOpenRecords).
	 * @param {Zarafa.core.data.MAPIRecord[]} records records for which we need extra properties.
	 * @param {Object} options Extra options which can be used for opening the records
	 * @return {Boolean|undefined} false when this.execute fails
	 */
	open : function(records, options)
	{
		try {
			return this.execute('open', records, options);
		} catch (e) {
			this.handleException(e);
			return false;
		}
	},

	/**
	 * Function will work as callback function for 'open' operation, and update the
	 * existing records with the new data that is received from server.
	 * @param {Boolean} success true if operation completed successfully else false.
	 * @param {Zarafa.core.data.MAPIRecord|Zarafa.core.dataMAPIRecord[]} records updated records.
	 * @param {Object|Array} data properties of records which is received from server (in key/value pair).
	 */
	onOpenRecords : function(success, records, data)
	{
		if (success !== true) {
			return;
		}

		if (!Array.isArray(records)) {
			records = [ records ];
		}

		records.forEach(function(record) {
			if (this.indexOf(record) === -1) {
				return;
			}

			// Opening items in batch passes multiple records but only one data object per onOpenRecords
			// call, therefore the entryid has to be compared to update the correct record.
			// Also opening meeting requests passes the task request as record and expects the actual task to
			// be applied onto the record, here the entryids don't match so just check if records length is not 1.
			if (records.length !== 1 && Array.isArray(data) && data.length !== 0 &&
				!Zarafa.core.EntryId.compareEntryIds(record.get('entryid'), data[0].entryid)) {
				return;
			}

			try {
				// call reader to update record data
				var oldRecord = record;
				
				this.reader.update(record, data);
				record.afterOpen();
				
				this.fireEvent('open', this, record, oldRecord);
			} catch (e) {
				this.handleException(e);
			}
		}, this);
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
		var item = Zarafa.core.data.MAPIStore.superclass.getById.call(this, id);

		// If no item was found, and the reader uses the 'entryid' property,
		// we should retry searching using the compareEntryIds function. If that
		// fails as well, then the item is really not present.
		if (!item) {
			var index = this.findBy(function(record) { return this.idComparison(id, record.id); }, this);
			if (index >= 0) {
				item = this.getAt(index);
			}
		}

		return item;
	},

	/**
	 * Compare a {@link Ext.data.Record#id ids} to determine if they are equal.
	 * @param {String} a The first id to compare
	 * @param {String} b The second id to compare
	 * @protected
	 */
	idComparison : function(a, b)
	{
		return a === b;
	},

	/**
	 * Filter by a function. Returns a <i>new</i> collection that has been filtered.
	 * The passed function will be called with each object in the collection.
	 * If the function returns true, the value is included otherwise it is filtered.
	 * @param {Function} fn The function to be called, it will receive the args o (the object), k (the key)
	 * @param {Object} scope (optional) The scope (<code>this</code> reference) in which the function is executed. Defaults to this MixedCollection.
	 * @return {MixedCollection} The new filtered collection
	 */
	filterBy : function(fn, scope)
	{
		// Save the function for later usage.
		this.filterFn = fn;
		this.filterScope = scope;

		Zarafa.core.data.MAPIStore.superclass.filterBy.apply(this, arguments);
	},

	/**
	 * Revert to a view of the Record cache with no filtering applied.
	 * @param {Boolean} suppressEvent If <tt>true</tt> the filter is cleared silently without firing the
	 * {@link #datachanged} event.
	 */
	clearFilter : function()
	{
		// Reset the filter
		delete this.filterFn;
		delete this.filterScope;

		Zarafa.core.data.MAPIStore.superclass.clearFilter.apply(this, arguments);
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
		Zarafa.core.data.MAPIStore.superclass.loadRecords.apply(this, arguments);

		if (this.persistentFilter === true && !this.isDestroyed && (!options || options.add !== true)) {
			if (this.filterFn) {
				this.filterBy(this.filterFn, this.filterScope);
			}
		}
	},

	/**
	 * Clear all data in the store
	 * @private
	 */
	clearData : function()
	{
		this.data.each(function(rec) {
			rec.destroy();
		});
		Zarafa.core.data.MAPIStore.superclass.clearData.apply(this, arguments);
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
	},

	/**
	 * Clears any existing grouping and refreshes the data using the default sort.
	 */
	clearGrouping : function()
	{
		// Only clear grouping when
		// grouping was previously applied
		if (this.groupField) {
			Zarafa.core.data.MAPIStore.superclass.clearGrouping.apply(this, arguments);
		}
	},

	/**
	 * Destroys the store
	 */
	destroy : function()
	{
		// Make sure we cancel all load requests
		// to the server as we are no longer
		// interested in the results.
		if (!this.isDestroyed) {
			this.cancelLoadRequests();
		}

		Zarafa.core.data.MAPIStore.superclass.destroy.apply(this, arguments);
	}
});

Ext.reg('zarafa.mapistore', Zarafa.core.data.MAPIStore);
