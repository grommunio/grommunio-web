Ext.namespace('Zarafa.core.data');

/**
 * @class Zarafa.core.data.ShadowStore
 * @extends Zarafa.core.data.MAPIStore
 * @xtype zarafa.shadowstore
 *
 * A store which holds all items which are being created or edited within a {@link Zarafa.core.ui.ContentPanel}
 * This store only contains references of {@link Zarafa.core.data.IPMRecord} elements which have
 * been retreived from the server by a regular {@link Zarafa.core.data.ListModuleStore}.
 * <p>
 * Each {@link Zarafa.core.ui.ContentPanel} will register the {@link Zarafa.core.data.MAPIRecord} on which it is working
 * to this {@link Zarafa.core.data.ShadowStore}
 *
 * A store that communicates with a list module on the php side. It supports listing items,
 * pagination, etc.
 * <p>
 * Pagination is not properly supported since there is no way to pass the desired page size
 * to the server side. Therefore the page size has to be hard-coded to 50 items.
 */
Zarafa.core.data.ShadowStore = Ext.extend(Zarafa.core.data.MAPIStore, {
	/**
	 * @cfg {Boolean} standalone If true, the {@link Zarafa.core.data.ShadowStore ShadowStore}
	 * will not be hooked into the {@link Zarafa.core.data.IPMStoreMgr IPMStoreMgr} and
	 * {@link Zarafa.core.data.IPFStoreMgr IPFStoreMgr}. This will prevent listening to events
	 * coming from the {@link Zarafa.core.data.IPMStoreMgr IPMStoreMgr} or
	 * {@link Zarafa.core.data.IPFStoreMgr IPFStoreMgr}.
	 * Defaults to false.
	 */
	standalone : false,

	/**
	 * @cfg {Boolean} serveronly If true, the {@link Zarafa.core.data.ShadowStore ShadowStore}
	 * will be hooked into the {@link Zarafa.core.data.IPMStoreMgr IPMStoreMgr} and
	 * {@link Zarafa.core.data.IPFStoreMgr IPFStoreMgr}, but will only do that for events which
	 * are triggered by a serverside change (e.g. a write event coming from the server, after a successful save).
	 * Defaults to false.
	 */
	serveronly : true,

	/**
	 * @constructor
	 * @param config Configuration structure
	 */
	constructor : function(config)
	{
		config = config || {};

		Ext.applyIf(config, {
			batch : false,
			proxy : new Zarafa.core.data.ShadowProxy(),
			writer : new Zarafa.core.data.JsonWriter(),
			reader : new Zarafa.core.data.JsonReader()
		});

		Zarafa.core.data.ShadowStore.superclass.constructor.call(this, config);

		// Register store with the store manager
		if (!this.standalone) {
			Zarafa.core.data.IPMStoreMgr.register(this, this.serveronly);
			Zarafa.core.data.IPFStoreMgr.register(this, this.serveronly);
		}
	},

	/**
	 * For the ShadowStore it is possible that any record can be entered
	 * into this store multiple times. To ensure that the {@link #data MixedCollecton}
	 * will not become upset when adding and removing those records, we
	 * generate a fresh unique for each new record which will be added
	 * to the store. The ID generation has been taken from {@link Ext.data.Record#id}.
	 * @param {Ext.data.Record} o The record for which the key is requested
	 * @return {String} The key by which the record must be saved into the {@link Ext.util.MixedCollection}.
	 * @protected
	 */
	getRecordKey : function(o)
	{
		var objectKey;

		// First search if the given record is already present
		// in this store, and by which key it was added.
		this.eachKey(function(key, item) {
			if (item === o) {
				objectKey = key;
				return false;
			}
		});

		// either return the foud key, or generate the new ID
		return objectKey || [Ext.data.Record.PREFIX, '-', Ext.data.Record.AUTO_ID++].join('');
	},

	/**
	 * remap record ids in MixedCollection after records have been realized.
	 * @see Store#onCreateRecords, @see DataReader#realize
	 * Because in {@link #getRecordKey} we always generate a new ID for the record,
	 * remapping is not needed (and even hurts the mappings in this store}. Hence
	 * we simply delete the {@link Ext.data.Record#_phid} and don't do anything
	 * else.
	 * @param {Ext.data.Record} record The record which was realized
	 * @protected
	 */
	reMap : function(record)
	{
		if (Array.isArray(record)) {
			for (var i = 0, len = record.length; i < len; i++) {
				this.reMap(record[i]);
			}
		} else {
			delete record._phid;
		}
	},

	/**
	 * Remove Records from the Store and fires the {@link #remove} event.
	 * @param {Ext.data.Record/Ext.data.Record[]} record The record object or array of records to remove from the cache.
	 * @param {Boolean} silent [false] Defaults to <tt>false</tt>.  Set <tt>true</tt> to not fire remove event.
	 */
	remove : function(record, silent)
	{
		// FIXME: This function is completely copied from
		// Ext.data.store.remove(). Is there a nicer way we can
		// add the 'silent' argument without blunt code copying?
		if(Array.isArray(record)){
			Ext.each(record, function(r){
				this.remove(r, silent);
			}, this);
		}

		var index = this.data.indexOf(record);
		if(index > -1){
			record.join(null);
			this.data.removeAt(index);
		}

		if(this.pruneModifiedRecords){
			this.modified.remove(record);
		}
		if(this.snapshot){
			this.snapshot.remove(record);
		}
		if(index > -1 && silent !== true){
			this.fireEvent('remove', this, record, index);
		}
	},

	/**
	 * Remove a Record from the Store at the specified index. Fires the {@link #remove} event.
	 * @param {Number} index The index of the record to remove.
	 * @param {Boolean} silent [false] Defaults to <tt>false</tt>.  Set <tt>true</tt> to not fire remove event.
	 */
	removeAt : function(index, silent)
	{
		this.remove(this.getAt(index), silent);
	},

	/**
	 * Checks whether any of the folders that were included in the parameters during the last load,
	 * matches the supplied entryid argument.
	 *
	 * Implemented for the {@link Zarafa.core.data.IPMStoreMgr IPMStoreMgr} which calls this function
	 * on {@link Zarafa.core.data.IPMStore IPMStores} to determine if a given folder has been loaded.
	 * Since the ShadowStore will never load data from the server, this function always returns false.
	 *
	 * @param {String|Array} entryidList Entryid of the folder
	 * @return {Boolean} Returns true when entryid matches, false when it does not.
	 */
	containsFolderInLastLoad: function(entryidList)
	{
		return false;
	},

	/**
	 * Checks whether any of the stores that were included in the parameters during the last load,
	 * matches the supplied entryid argument.
	 *
	 * Implemented for the {@link Zarafa.core.data.IPFStoreMgr IPFStoreMgr} which calls this function
	 * on {@link Zarafa.core.data.IPFStore IPFStores} to determine if a given store has been loaded.
	 * Since the ShadowStore will never load data from the server, this function always returns false.
	 *
	 * @param {String|Array} entryidList Entryid of the folder
	 * @return {Boolean} Returns true when entryid matches, false when it does not.
	 */
	containsStoreInLastLoad : function(entryidList)
	{
		return false;
	},

	/**
	 * Destroys the store.
	 */
	destroy : function()
	{
		if (!this.standalone) {
			Zarafa.core.data.IPMStoreMgr.unregister(this, this.serveronly);
			Zarafa.core.data.IPFStoreMgr.unregister(this, this.serveronly);
		}
		Zarafa.core.data.IPMStore.superclass.destroy.call(this);
	}
});

Ext.reg('zarafa.shadowstore', Zarafa.core.data.ShadowStore);
