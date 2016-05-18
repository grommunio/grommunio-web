Ext.namespace('Zarafa.core.data');

/**
 * @class Zarafa.core.data.NoSyncStore
 * @extends Ext.util.Observable
 *
 * The {@link Zarafa.core.data.NoSyncStore NoSyncStore} represents the collection of
 * {@link Ext.data.Record records}. It offers the same interface
 * as {@link Zarafa.core.data.Store Store} without any CRUD operations being
 * send to the server. This implies that the {@link Zarafa.core.data.NoSyncStore NoSyncStore}
 * will only work for working on {@link Ext.data.Record records} offline.
 */
Zarafa.core.data.NoSyncStore = Ext.extend(Ext.util.Observable, {
	/**
	 * The {@link Ext.data.Record Record} constructor as supplied to (or created by) the
	 * {@link Ext.data.DataReader Reader}. Read-only.
	 * <p>If the Reader was constructed by passing in an Array of {@link Ext.data.Field} definition objects,
	 * instead of a Record constructor, it will implicitly create a Record constructor from that Array (see
	 * {@link Ext.data.Record}.{@link Ext.data.Record#create create} for additional details).</p>
	 * <p>This property may be used to create new Records of the type held in this Store
	 * @property recordType
	 * @type Function
	 */
	recordType : undefined,

	/**
	 * A {@link Ext.util.MixedCollection MixedCollection} containing the defined {@link Ext.data.Field Field}s
	 * for the {@link Ext.data.Record Records} stored in this Store. Read-only.
	 * @property fields
	 * @type Ext.util.MixedCollection
	 */
	fields : undefined,

	/**
	 * True if this store is currently sorted by more than one field/direction combination.
	 * @property
	 * @type Boolean
	 */
	hasMultiSort: false,

	/**
	 * Object containing the current sorting information.
	 * @property
	 * @type Object
	 */
	sortToggle : undefined,

	/**
	 * @cfg {String} sortField
	 * (optional) Initial column on which to sort.
	 */
	sortField : undefined,

	/**
	 * @cfg {String} sortDir
	 * (Optional) Initial direction to sort (<code>"ASC"</code> or <code>"DESC"</code>). Defaults to
	 * <code>"ASC"</code>.
	 */
	sortDir : 'ASC',

	/**
	 * @cfg {Object} sortInfo A config object to specify the sort order in the request of a Store's load operation.
	 * Note that for local sorting, the direction property is case-sensitive.
	 */
	sortInfo : undefined,

	/**
	 * @constructor
	 * @param config Configuration structure
	 */
	constructor : function(config)
	{
		config = config || {};

		Ext.apply(this, config);

		// If the recordType is provided, we can obtain the fields.
		if (this.recordType) {
			this.fields = this.recordType.prototype.fields;
		}

		this.addEvents(
			/**
			 * @event add
			 * Fires when Records have been {@link #add}ed to the Store
			 * @param {Store} this
			 * @param {Ext.data.Record[]} records The array of Records added
			 * @param {Number} index The index at which the record(s) were added
			 */
			'add',
			/**
			 * @event remove
			 * Fires when a Record has been {@link #remove}d from the Store
			 * @param {Store} this
			 * @param {Ext.data.Record} record The Record that was removed
			 * @param {Number} index The index at which the record was removed
			 */
			'remove',
			/**
			 * @event update
			 * Fires when a Record has been updated
			 * @param {Store} this
			 * @param {Ext.data.Record} record The Record that was updated
			 * @param {String} operation The update operation being performed. Value may be one of:
			 * <pre><code>
	Ext.data.Record.EDIT
	Ext.data.Record.REJECT
	Ext.data.Record.COMMIT
			 * </code></pre>
			 */
			'update',
			/**
			 * @event clear
			 * Fires when the data cache has been cleared.
			 * @param {Store} this
			 * @param {Record[]} The records that were cleared.
			 */
			'clear'
		);

		this.sortToggle = {};
		if (this.sortField){
			this.setDefaultSort(this.sortField, this.sortDir);
		} else if(this.sortInfo) {
			this.setDefaultSort(this.sortInfo.field, this.sortInfo.direction);
		}

		Zarafa.core.data.NoSyncStore.superclass.constructor.call(this, config);

		this.initEvents();
		this.initData();
	},

	/**
	 * Initialize data structures in which the {@link Ext.data.Record records} are stored.
	 * @private
	 */
	initData : function()
	{
		this.data = new Ext.util.MixedCollection(false);
		this.data.getKey = function(o){
			return o.id;
		};

		this.removed = [];
		this.modified = [];
	},

	/**
	 * Initialize events which can be raised by the {@link Zarafa.core.data.NoSyncStore NoSyncStore}
	 * @private
	 */
	initEvents : function()
	{
		this.on({
			scope: this,
			add: this.createRecords,
			remove: this.destroyRecord,
			clear: this.onClear
		});
	},

	/**
	 * Destroys the store.
	 */
	destroy : function()
	{
		if (!this.isDestroyed) {
			this.clearData();
			this.data = null;
			this.purgeListeners();
			this.isDestroyed = true;
		}
	},

	/**
	 * Add Records to the Store and fires the {@link #add} event.
	 * See also <code>{@link #insert}</code>.
	 * @param {Ext.data.Record[]} records An Array of Ext.data.Record objects
	 * to add to the cache.
	 * @param {Boolean} silent [false] Defaults to <tt>false</tt>.
	 * Set <tt>true</tt> to not fire add event.
	 */
	add : function(records, silent)
	{
		records = [].concat(records);
		if(records.length < 1) {
			return;
		}

		for (var i = 0, len = records.length; i < len; i++) {
			records[i].join(this);
		}

		var index = this.data.length;
		this.data.addAll(records);

		if(this.snapshot){
			this.snapshot.addAll(records);
		}

		if (silent !== true) {
			this.fireEvent('add', this, records, index);
		}
	},

	/**
	 * Remove Records from the Store and fires the {@link #remove} event.
	 * @param {Ext.data.Record/Ext.data.Record[]} record The record object or array of records to remove from the cache.
	 * @param {Boolean} silent [false] Defaults to <tt>false</tt>. Set <tt>true</tt> to not fire remove event.
	 */
	remove : function(record, silent)
	{
		if (Ext.isArray(record)) {
			Ext.each(record, function(r){
				this.remove(r, silent);
			}, this);
		}

		var index = this.data.indexOf(record);
		if(this.snapshot){
			this.snapshot.remove(record);
		}
		if (index > -1) {
			record.join(null);

			this.data.removeAt(index);
			this.modified.remove(record);

			if (silent !== true) {
				this.fireEvent('remove', this, record, index);
			}
		}
	},

	/**
	 * Remove a Record from the Store at the specified index. Fires the {@link #remove} event.
	 * @param {Number} index The index of the record to remove.
	 * @param {Boolean} silent [false] Defaults to <tt>false</tt>. Set <tt>true</tt> to not fire remove event.
	 */
	removeAt : function(index, silent)
	{
		this.remove(this.getAt(index), silent);
	},

	/**
	 * Remove all Records from the Store and fires the {@link #clear} event.
	 * @param {Boolean} silent [false] Defaults to <tt>false</tt>. Set <tt>true</tt> to not fire clear event.
	 */
	removeAll : function(silent)
	{
		var items = [];
		this.each(function(rec){
			items.push(rec);
		});

		this.clearData();
		if(this.snapshot){
			this.snapshot.clear();
		}
		this.modified = [];
		this.removed = [];

		if (silent !== true) {
			this.fireEvent('clear', this, items);
		}
	},

	/**
	 * Remove all Records for which the callback returns true
	 * from the Store and fires the {@link #remove} event.
	 *
	 * @param {Function} callback The callback function which is used to determine
	 * if a record must be removed. Function must accept a {@link Ext.data.Record}
	 * as argument.
	 * @param {Object} scope The scope which must be used for the callback function
	 */
	removeIf : function(callback, scope)
	{
		this.each(function(record) {
			if (callback.call(scope || this, record)) {
				this.remove(record);
			}
		}, this);
	},

	/**
	 * Inserts Records into the Store at the given index and fires the {@link #add} event.
	 * See also <code>{@link #add}</code>.
	 * @param {Number} index The start index at which to insert the passed Records.
	 * @param {Ext.data.Record[]} records An Array of Ext.data.Record objects to add to the cache.
	 */
	insert : function(index, records)
	{
		records = [].concat(records);
		for (var i = 0, len = records.length; i < len; i++) {
			this.data.insert(index, records[i]);
			records[i].join(this);
		}

		if(this.snapshot){
			this.snapshot.addAll(records);
		}

		this.fireEvent('add', this, records, index);
	},

	/**
	 * Get the index within the cache of the passed Record.
	 * @param {Ext.data.Record} record The Ext.data.Record object to find.
	 * @return {Number} The index of the passed Record. Returns -1 if not found.
	 */
	indexOf : function(record)
	{
		return this.data.indexOf(record);
	},

	/**
	 * Get the index within the cache of the Record with the passed id.
	 * @param {String} id The id of the Record to find.
	 * @return {Number} The index of the Record. Returns -1 if not found.
	 */
	indexOfId : function(id)
	{
		return this.data.indexOfKey(id);
	},

	/**
	 * Get the Record at the specified index.
	 * @param {Number} index The index of the Record to find.
	 * @return {Ext.data.Record} The Record at the passed index. Returns undefined if not found.
	 */
	getAt : function(index)
	{
		return this.data.itemAt(index);
	},

	/**
	 * Returns a range of Records between specified indices.
	 * @param {Number} startIndex (optional) The starting index (defaults to 0)
	 * @param {Number} endIndex (optional) The ending index (defaults to the last Record in the Store)
	 * @return {Ext.data.Record[]} An array of Records
	 */
	getRange : function(start, end)
	{
		return this.data.getRange(start, end);
	},

	/**
	 * Gets the number of cached records
	 * @return {Number} The number of records
	 */
	getCount : function()
	{
		return this.data.length;
	},

	/**
	 * Gets the total number of records in the dataset.
	 * @return {Number} The number of records
	 */
	getTotalCount : function()
	{
		return this.getCount();
	},

	/**
	 * Calls the specified function for each of the {@link Ext.data.Record Records} in the cache.
	 * @param {Function} fn The function to call. The {@link Ext.data.Record Record} is passed as the first parameter.
	 * Returning <tt>false</tt> aborts and exits the iteration.
	 * @param {Object} scope (optional) The scope (<code>this</code> reference) in which the function is executed.
	 * Defaults to the current {@link Ext.data.Record Record} in the iteration.
	 */
	each : function(fn, scope)
	{
		this.data.each(fn, scope);
	},

	/**
	 * Gets all {@link Ext.data.Record records} modified since the last commit.
	 * <b>Note</b>: deleted records are not included.
	 * See also {@link Ext.data.Record}<tt>{@link Ext.data.Record#markDirty markDirty}.</tt>.
	 * @return {Ext.data.Record[]} An array of {@link Ext.data.Record Records} containing outstanding
	 * modifications. To obtain modified fields within a modified record see
	 *{@link Ext.data.Record}<tt>{@link Ext.data.Record#modified modified}.</tt>.
	 */
	getModifiedRecords : function()
	{
		return this.modified;
	},

	/**
	 * Gets all {@link Ext.data.Record records} removed since the last commit.
	 * @return {Ext.data.Record[]} An array of {@link Ext.data.Record Records} which have
	 * been marked as removed.
	 */
	getRemovedRecords : function()
	{
		return this.removed;
	},

	/**
	 * Called by {@link Ext.data.Record}
	 * @param {Ext.data.Record} The record which has been edited.
	 * @private
	 */
	afterEdit : function(record)
	{
		if(this.modified.indexOf(record) === -1) {
			this.modified.push(record);
		}
		this.fireEvent('update', this, record, Ext.data.Record.EDIT);
	},

	/**
	 * Called by {@link Ext.data.Record}
	 * @param {Ext.data.Record} The record which has been rejected.
	 * @private
	 */
	afterReject : function(record)
	{
		this.modified.remove(record);
		this.fireEvent('update', this, record, Ext.data.Record.REJECT);
	},

	/**
	 * Called by {@link Ext.data.Record}
	 * @param {Ext.data.Record} The record which has been committed.
	 * @private
	 */
	afterCommit : function(record)
	{
		this.modified.remove(record);
		this.fireEvent('update', this, record, Ext.data.Record.COMMIT);
	},

	/**
	 * 'Commit' outstanding changes. Since {@link Zarafa.core.data.NoSyncStore NoSyncStore}
	 * has no commit capability, changes are not actually sent, but are only cleared.
	 */
	commitChanges : function()
	{
		var m = this.modified.slice(0);
		for(var i = 0, len = m.length; i < len; i++){
			var mi = m[i];
			// Committing means unphantoming.
			mi.phantom = false;
			mi.commit();
		}

		this.modified = [];
		this.removed = [];
	},

	/**
	 * Clear the data within this store
	 * @private
	 */
	clearData: function()
	{
		this.data.clear();
	},

	/**
	 * Should not be used directly. Store#add will call this automatically
	 * @param {Object} store
	 * @param {Object} rs
	 * @param {Object} index
	 * @private
	 */
	createRecords : function(store, rs, index)
	{
		for (var i = 0, len = rs.length; i < len; i++) {
			if (rs[i].phantom && rs[i].isValid()) {
				rs[i].markDirty();  // <-- Mark new records dirty
				this.modified.push(rs[i]);  // <-- add to modified
			}
		}
	},

	/**
	 * Destroys a record or records. Should not be used directly. It's called by Store#remove automatically
	 * @param {Store} store
	 * @param {Ext.data.Record/Ext.data.Record[]} record
	 * @param {Number} index
	 * @private
	 */
	destroyRecord : function(store, record, index)
	{
		if (this.modified.indexOf(record) !== -1) {
			this.modified.remove(record);
		}

		if (!record.phantom) {
			this.removed.push(record);
		}
	},

	/**
	 * Clears all records. Show not be used directly. It's called by Store#removeAll automatically
	 * @param {Store} store
	 * @param {Ext.data.Record/Ext.data/Record[]} records
	 * @private
	 */
	onClear: function(store, records)
	{
		Ext.each(records, function(rec, index) {
			this.destroyRecord(this, rec, index);
		}, this);
	},

	/**
	 * Returns an object describing the current sort state of this Store.
	 * @return {Object} The sort state of the Store. An object with two properties:
	 * field : String The name of the field by which the Records are sorted.
	 * direction : String The sort order, 'ASC' or 'DESC' (case-sensitive).
	 *
	 * Added for grid support with store, grid's store needs sortinfo.
	 *
	 * See <tt>{@link #sortInfo}</tt> for additional details.
	 */
	getSortState : Ext.data.Store.prototype.getSortState,

	/**
	 * Invokes sortData if we have sortInfo to sort on and are not sorting remotely
	 * @private
	 */
	applySort : Ext.data.Store.prototype.applySort,

	/**
	 * Performs the actual sorting of data. This checks to see if we currently have a multi sort or not. It applies
	 * each sorter field/direction pair in turn by building an OR'ed master sorting function and running it against
	 * the full dataset
	 * @private
	 */
	sortData : Ext.data.Store.prototype.sortData,

	/**
	 * Creates and returns a function which sorts an array by the given field and direction
	 * @param {String} field The field to create the sorter for
	 * @param {String} direction The direction to sort by (defaults to "ASC")
	 * @return {Function} A function which sorts by the field/direction combination provided
	 * @private
	 */
	createSortFunction : Ext.data.Store.prototype.createSortFunction,

	/**
	 * Sets the default sort column and order to be used by the next {@link #load} operation.
	 * @param {String} fieldName The name of the field to sort by.
	 * @param {String} dir (optional) The sort order, 'ASC' or 'DESC' (case-sensitive, defaults to <tt>'ASC'</tt>)
	 */
	setDefaultSort : Ext.data.Store.prototype.setDefaultSort,

	/**
	 * Sort the Records.
	 * If remote sorting is used, the sort is performed on the server, and the cache is reloaded. If local
	 * sorting is used, the cache is sorted internally. See also {@link #remoteSort} and {@link #paramNames}.
	 * This function accepts two call signatures - pass in a field name as the first argument to sort on a single
	 * field, or pass in an array of sort configuration objects to sort by multiple fields.
	 * Single sort example:
	 * store.sort('name', 'ASC');
	 * Multi sort example:
	 * store.sort([
	 *   {
	 *     field    : 'name',
	 *     direction: 'ASC'
	 *   },
	 *   {
	 *     field    : 'salary',
	 *     direction: 'DESC'
	 *   }
	 * ], 'ASC');
	 * In this second form, the sort configs are applied in order, with later sorters sorting within earlier sorters' results.
	 * For example, if two records with the same name are present they will also be sorted by salary if given the sort configs
	 * above. Any number of sort configs can be added.
	 * @param {String/Array} fieldName The name of the field to sort by, or an array of ordered sort configs
	 * @param {String} dir (optional) The sort order, 'ASC' or 'DESC' (case-sensitive, defaults to <tt>'ASC'</tt>)
	 */
	sort : Ext.data.Store.prototype.sort,

	/**
	 * Sorts the store contents by a single field and direction. This is called internally by {@link sort} and would
	 * not usually be called manually
	 * @param {String} fieldName The name of the field to sort by.
	 * @param {String} dir (optional) The sort order, 'ASC' or 'DESC' (case-sensitive, defaults to <tt>'ASC'</tt>)
	 */
	singleSort : Ext.data.Store.prototype.singleSort,

	/**
	 * Sorts the contents of this store by multiple field/direction sorters. This is called internally by {@link sort}
	 * and would not usually be called manually.
	 * Multi sorting only currently applies to local datasets - multiple sort data is not currently sent to a proxy
	 * if remoteSort is used.
	 * @param {Array} sorters Array of sorter objects (field and direction)
	 * @param {String} direction Overall direction to sort the ordered results by (defaults to "ASC")
	 */
	multiSort : Ext.data.Store.prototype.multiSort,

	/**
	 * Sums the value of property for each record between start and end and returns the result
	 * @param {String} property A field in each record
	 * @param {Number} start (optional) The record index to start at (defaults to 0)
	 * @param {Number} end (optional) The last record index to include (defaults to length - 1)
	 * @return {Number} The sum
	 */
	sum : Ext.data.Store.prototype.sum,

	/**
	 * Returns a filter function used to test a the given property's value. Defers most of the work to
	 * Ext.util.MixedCollection's createValueMatcher function
	 * @param {String} property The property to create the filter function for
	 * @param {String/RegExp} value The string/regex to compare the property value to
	 * @param {Boolean} anyMatch True if we don't care if the filter value is not the full value (defaults to false)
	 * @param {Boolean} caseSensitive True to create a case-sensitive regex (defaults to false)
	 * @param {Boolean} exactMatch True to force exact match (^ and $ characters added to the regex). Defaults to false. Ignored if anyMatch is true.
	 * @private
	 */
	createFilterFn : Ext.data.Store.prototype.createFilterFn,

	/**
	 * Filters an array of elements to only include matches of a simple selector (e.g. div.some-class or span:first-child)
	 * @param {Array} el An array of elements to filter
	 * @param {String} selector The simple selector to test
	 * @param {Boolean} nonMatches If true, it returns the elements that DON'T match
	 * the selector instead of the ones that match
	 * @return {Array} An Array of DOM elements which match the selector. If there are
	 * no matches, and empty Array is returned.
	 */
	filter : Ext.data.Store.prototype.filter,

	/**
	 * Filter by a function. Returns a <i>new</i> collection that has been filtered.
	 * The passed function will be called with each object in the collection.
	 * If the function returns true, the value is included otherwise it is filtered.
	 * @param {Function} fn The function to be called, it will receive the args o (the object), k (the key)
	 * @param {Object} scope (optional) The scope (<code>this</code> reference) in which the function is executed. Defaults to this MixedCollection.
	 * @return {MixedCollection} The new filtered collection
	 */
	filterBy : Ext.data.Store.prototype.filterBy,

	/**
	 * Query the records by a specified property.
	 * @param {String} field A field on your records
	 * @param {String/RegExp} value Either a string that the field
	 * should begin with, or a RegExp to test against the field.
	 * @param {Boolean} anyMatch (optional) True to match any part not just the beginning
	 * @param {Boolean} caseSensitive (optional) True for case sensitive comparison
	 * @return {MixedCollection} Returns an Ext.util.MixedCollection of the matched records
	 */
	query : Ext.data.Store.prototype.query,

	/**
	 * Query the cached records in this Store using a filtering function. The specified function
	 * will be called with each record in this Store. If the function returns <tt>true</tt> the record is
	 * included in the results.
	 * @param {Function} fn The function to be called. It will be passed the following parameters:<ul>
	 * <li><b>record</b> : Ext.data.Record<p class="sub-desc">The {@link Ext.data.Record record}
	 * to test for filtering. Access field values using {@link Ext.data.Record#get}.</p></li>
	 * <li><b>id</b> : Object<p class="sub-desc">The ID of the Record passed.</p></li>
	 * </ul>
	 * @param {Object} scope (optional) The scope (<code>this</code> reference) in which the function is executed. Defaults to this Store.
	 * @return {MixedCollection} Returns an Ext.util.MixedCollection of the matched records
	 **/
	queryBy : Ext.data.Store.prototype.queryBy,

	/**
	 * Finds the index of the first matching Record in this store by a specific field value.
	 * @param {String} fieldName The name of the Record field to test.
	 * @param {String/RegExp} value Either a string that the field value
	 * should begin with, or a RegExp to test against the field.
	 * @param {Number} startIndex (optional) The index to start searching at
	 * @param {Boolean} anyMatch (optional) True to match any part of the string, not just the beginning
	 * @param {Boolean} caseSensitive (optional) True for case sensitive comparison
	 * @return {Number} The matched index or -1
	 */
	find : Ext.data.Store.prototype.find,

	/**
	 * Finds the index of the first matching Record in this store by a specific field value.
	 * @param {String} fieldName The name of the Record field to test.
	 * @param {Mixed} value The value to match the field against.
	 * @param {Number} startIndex (optional) The index to start searching at
	 * @return {Number} The matched index or -1
	 */
	findExact : Ext.data.Store.prototype.findExact,

	/**
	 * Find the index of the first matching Record in this Store by a function.
	 * If the function returns <tt>true</tt> it is considered a match.
	 * @param {Function} fn The function to be called. It will be passed the following parameters:<ul>
	 * <li><b>record</b> : Ext.data.Record<p class="sub-desc">The {@link Ext.data.Record record}
	 * to test for filtering. Access field values using {@link Ext.data.Record#get}.</p></li>
	 * <li><b>id</b> : Object<p class="sub-desc">The ID of the Record passed.</p></li>
	 * </ul>
	 * @param {Object} scope (optional) The scope (<code>this</code> reference) in which the function is executed. Defaults to this Store.
	 * @param {Number} startIndex (optional) The index to start searching at
	 * @return {Number} The matched index or -1
	 */
	findBy : Ext.data.Store.prototype.findBy,

	/**
	 * Get the Record with the specified id.
	 * @param {String} id The id of the Record to find.
	 * @return {Ext.data.Record} The Record with the passed id. Returns undefined if not found.
	 */
	getById : Ext.data.Store.prototype.getById,

	/**
	 * Revert to a view of the Record cache with no filtering applied.
	 * @param {Boolean} suppressEvent If <tt>true</tt> the filter is cleared silently without firing the
	 * {@link #datachanged} event.
	 */
	clearFilter : Ext.data.Store.prototype.clearFilter,

	/**
	 * Returns true if this store is currently filtered
	 * @return {Boolean}
	 */
	isFiltered : Ext.data.Store.prototype.isFiltered,

	/**
	 * Collects unique values for a particular dataIndex from this store.
	 * @param {String} dataIndex The property to collect
	 * @param {Boolean} allowNull (optional) Pass true to allow null, undefined or empty string values
	 * @param {Boolean} bypassFilter (optional) Pass true to collect from all records, even ones which are filtered
	 * @return {Array} An array of the unique values
	 **/
	collect : Ext.data.Store.prototype.collect,

	/**
	 * When store's reader provides new metadata (fields) this function is called.
	 * @param {Object} meta The JSON metadata
	 * @private
	 */
	onMetaChange : Ext.data.Store.prototype.onMetaChange
});
