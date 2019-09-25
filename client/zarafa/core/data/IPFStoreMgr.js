Ext.namespace('Zarafa.core.data');

/**
 * @class Zarafa.core.data.IPFStoreMgr
 * @extends Ext.util.Observable
 *
 * The {@link Zarafa.core.data.IPFStore IPFStore} manager. Each
 * {@link Zarafa.core.data.IPFStore IPFStore} which is created
 * must register itself to this manager.
 *
 * {@link Zarafa.core.data.IPFStoreMgr} will then handle inter-store
 * communications. Listening to {@link Zarafa.core.data.IPFStoreMgr IPFStoreMgr}
 * events allow UI components and {@link Zarafa.core.data.IPFStore stores} to
 * detect {@link Zarafa.core.data.IPFRecord record} editing in dialogs.
 * @singleton
 */
Zarafa.core.data.IPFStoreMgr = Ext.extend(Ext.util.Observable, {
		/**
		 * The collection of {@link Zarafa.core.data.IPFStore stores}
		 * which have been registered to this manager.
		 * @property
		 * @type Ext.util.MixedCollection
		 */
		IPFStores : undefined,
		/**
		 * @constructor
		 */
		constructor : function()
		{
			this.IPFStores = new Ext.util.MixedCollection();
			this.addEvents([
				/**
				 * @event storeexception
				 * Fires when the {@link Zarafa.core.data.IPFStore IPFStore} fired an {@link Zarafa.core.data.IPFStore#exception exception}.
				 * @param {Zarafa.core.data.IPFStore} store The store on which the exception occured
				 * @param {Ext.data.DataProxy} proxy The proxy from where the exception event originated
				 * @param {String} type The value of this parameter will be either 'response' or 'remote'.
				 * @param {String} action Name of the action.
				 * @param {Object} options The options for the action that were specified in the request.
				 * @param {Object} response If the 'type' argument was 'response' this will be the raw browser response object,
				 * otherwise it will be the decoded response object
				 * @param {Mixed} arg (optional) Additional arguments for the exception
				 */
				'storeexception',
				/**
				 * @event beforerecordsave
				 * Fires before a Message {@link Zarafa.core.data.IPFRecord record} is being saved.
				 * @param {Zarafa.core.data.IPFStore} store The {@link Zarafa.core.data.IPFStore store} in which the
				 * {@link Zarafa.core.data.IPFRecord record} is located while being saved.
				 * @param {Object} data An object containing the data that is to be saved.
				 * The object will contain a key for each appropriate action, with an array
				 * of updated data for each record.				 
				 */
				'beforerecordsave',
				/**
				 * @event afterrecordsave
				 * Fires when a Message {@link Zarafa.core.data.IPFRecord record} has been saved.
				 * @param {Zarafa.core.data.IPFStore} store The {@link Zarafa.core.data.IPFStore store} in which the
				 * {@link Zarafa.core.data.IPFRecord record} is located while being saved.
				 * @param {Mixed} obj The object containing {@link Zarafa.core.data.IPFRecord record} which has been saved. This
				 * {@link Zarafa.core.data.IPFRecord record} is the most recent version which came from the server.
				 */
				'afterrecordsave',
				/**
				 * @event afterrecordupdate
				 * Fires when a Message {@link Zarafa.core.data.IPFRecord record} has been updated.
				 * @param {Zarafa.core.data.IPFStore} store The {@link Zarafa.core.data.IPFStore store} to which the
				 * {@link Zarafa.core.data.IPFRecord record} belongs.
				 * @param {Zarafa.core.data.IPFrecord} record The most recent version which came from the server.
				 * @param {String} operation  The update operation being performed. 
				 * ({@link Ext.data.Record#EDIT}, {@link Ext.data.Record#REJECT}, {@link Ext.data.Record#COMMIT}).
				 */
				'afterrecordupdate',
				/**
				 * @event recordremove
				 * Fires when a Message {@link Zarafa.core.data.IPFRecord record} has been removed from the server
				 * @param {Zarafa.core.data.IPFStore} store The {@link Zarafa.core.data.IPFStore store} to which the
				 * {@link Zarafa.core.data.IPFRecord record} belongs.
				 * @param {Zarafa.core.data.IPFrecord} record The most recent version which came from the server.
				 */
				'recordremove',
				/**
				 * @event afterrecordwrite
				 * Fires when {@link Zarafa.core.IPFRecord IPFRecords} are modified (created, updated, destroyed, opened)
				 * on {@link Zarafa.core.data.IPFStore IPFStore}.
				 * @param {Zarafa.core.data.IPFStore} store The {@link Zarafa.core.data.IPFStore store} to which the
				 * {@link Zarafa.core.data.IPFRecord record} belongs.
				 * @param {String} action [Ext.data.Api.actions.create|update|destroy|open]
				 * @param {Object} result The 'data' picked-out out of the response for convenience.
				 * @param {Ext.Direct.Transaction} res
				 * @param {Zarafa.core.data.IPFrecord[]} records The most recent version of the records
				 * which came from the server.
				 */				
				'afterrecordwrite'
			]);

			Zarafa.core.data.IPFStoreMgr.superclass.constructor.call(this);
		},

		/**
		 * Register a {@link Zarafa.core.data.IPFStore IPFStore} with the {@link Zarafa.core.data.IPFStoreMgr IPFStoreMgr}.
		 * @param {Zarafa.core.data.IPFStore} IPFStore the {@link Zarafa.core.data.IPFStore IPFStore} which must be registered.
		 * @param {Boolean} serverOnly True to register the {@link Zarafa.core.data.IPFStore IPFStore} only for
		 * events originating directly from the server.
		 */
		register : function(IPFStore, serverOnly)
		{
			if (!serverOnly) {
				IPFStore.on('beforesave', this.onBeforeSave, this);
				IPFStore.on('save', this.onSave, this);
				IPFStore.on('update', this.onUpdate, this);
				IPFStore.on('remove', this.onRemove, this);
			}
			IPFStore.on('write', this.onWrite, this);
			IPFStore.on('exception', this.onException, this);

			this.IPFStores.add(IPFStore);
		},

		/**
		 * Unregister a {@link Zarafa.core.data.IPFStore IPFStore} from the {@link Zarafa.core.data.IPFStoreMgr IPFStoreMgr}.
		 * @param {Zarafa.core.data.IPFStore} IPFStore the {@link Zarafa.core.data.IPFStore IPFStore} which must be unregistered.
		 * @param {Boolean} serverOnly True if the {@link Zarafa.core.data.IPFStore IPFStore} was {@link #register registered}
		 * with the serverOnly argument.
		 */
		unregister : function(IPFStore, serverOnly)
		{
			if (!serverOnly) {
				IPFStore.un('beforesave', this.onBeforeSave, this);
				IPFStore.un('save', this.onSave, this);
				IPFStore.un('update', this.onUpdate, this);
				IPFStore.un('remove', this.onRemove, this);
			}
			IPFStore.un('write', this.onWrite, this);
			IPFStore.un('exception', this.onException, this);

			this.IPFStores.remove(IPFStore);
		},

		/**
		 * Filter the list of {@link Zarafa.core.data.IPFRecord records} to contain
		 * only those which can be {@link Zarafa.core.data.IPFRecord#eventPropagation propagated}
		 * over a new event to other {@link Zarafa.core.data.IPFStore stores}.
		 * 
		 * @param {Zarafa.core.data.IPFRecord/Array} records The record or records to filter
		 * out the non-propagatable records.
		 * @return {Zarafa.core.data.IPFRecord/Array} All propagatable records
		 * @private
		 */
		getPropagatableRecords : function(records)
		{
			var propagateRecords = [];

			if (!Array.isArray(records)) {
				records = [ records ];
			}
	
			for (var i = 0, len = records.length; i < len; i++) {
				var record = records[i];

				if (record instanceof Zarafa.core.data.IPFRecord && record.hasEventPropagation()) {
					propagateRecords.push(record);
				}
			}

			return propagateRecords;
		},

		/**
		 * Event handler which is triggered when a {@link Zarafa.core.data.IPFRecord record} is about to
		 * be saved in a {@link Zarafa.core.data.IPFStore store}. This function will inform the
		 * {@link Zarafa.core.data.IPFStore IPFStores} about the event through the
		 * {@link #beforerecordsave} event.
		 *
		 * @param {Zarafa.core.data.IPFStore} IPFStore
		 * @param {Object} data An object containing the data that is to be saved.
		 * The object will contain a key for each appropriate action, with an array
		 * of updated data for each record.
		 * @private
		 */
		onBeforeSave : function(IPFStore, data)
		{
			var propagateData = {}; 

			for (var key in data) {
				var propagateRecords = this.getPropagatableRecords(data[key]);
				if (!Ext.isEmpty(propagateData)) {
					propagateData[key] = propagateRecords;
				}
			}

			this.fireEvent('beforerecordsave', IPFStore, propagateData);
		},

		/**
		 * Event handler which is triggered when a {@link Zarafa.core.data.IPFRecord record} has been
		 * saved in a {@link Zarafa.core.data.IPFStore store}. This function will inform the
		 * {@link arafa.core.data.IPFStore IPFStores} about the event through the
		 * {@link #afterrecordsave} event.
		 *
		 * @param {Zarafa.core.data.IPFStore} IPFStore
		 * @param {Number} batch The identifier for the batch that was saved.
		 * @param {Object} data An object containing the data that is to be saved.
		 * The object will contain a key for each appropriate action, with an array
		 * of updated data for each record.
		 * @private
		 */
		onSave : function(IPFStore, batch, data)
		{
			this.fireEvent('afterrecordsave', IPFStore, data);
		},

		/**
		 * Event handler which is triggered when a {@link Zarafa.core.data.IPFRecord record} has been
		 * updated from the server. This function will inform the {@link Zarafa.core.data.IPFStore IPFStores}
		 * about the event through the {@link #afterrecordupdate} event.
		 *
		 * @param {Zarafa.core.data.IPFStore} IPFStore
		 * @param {Zarafa.core.data.IPFRecord} record The Record which has been updated
		 * @param {String} operation  The update operation being performed. 
		 * ({@link Ext.data.Record#EDIT}, {@link Ext.data.Record#REJECT}, {@link Ext.data.Record#COMMIT}).
		 * @private
		 */
		onUpdate : function(IPFStore, record, operation)
		{
			if (record.hasEventPropagation()) {
				this.fireEvent('afterrecordupdate', IPFStore, record, operation);
			}
		},

		/**
		 * Event handler which is triggered when a {@link Zarafa.core.data.IPFRecord record} has been
		 * removed from the server. This function will inform the {@link Zarafa.core.data.IPFStore IPFStores}
		 * about the event through the {@link #recordremove} event.
		 *
		 * @param {Zarafa.core.data.IPFStore} IPFStore
		 * @param {Zarafa.core.data.IPFRecord} record The Record which has been updated
		 * @param {String} The index at which the record was removed
		 * @private
		 */
		onRemove : function(IPFStore, record, index)
		{
			if (record.hasEventPropagation()) {
				this.fireEvent('recordremove', IPFStore, record);
			}
		},

		/**
		 * Event handler will be called on successfull completion of any CRUD operation,
		 * the difference between this event and {@link #save} event is that {@link #save}
		 * event will pass only data set that is modified not the record that is modified.
		 * so this event removes burden of finding record from the record set.
		 *
		 * @param {Zarafa.core.data.IPFStore} store The {@link Zarafa.core.data.IPFStore store} to which the
		 * {@link Zarafa.core.data.IPFRecord record} belongs.
		 * @param {String} action [Ext.data.Api.actions.create|update|destroy|open]
		 * @param {Object} data The 'data' picked-out out of the response for convenience.
		 * @param {Ext.Direct.Transaction} res
		 * @param {Zarafa.core.data.IPFrecord[]} records The most recent version of the records
		 * which came from the server.
		 * @private
		 */
		onWrite : function(IPFStore, action, data, transaction, records)
		{
			var propagateRecords = this.getPropagatableRecords(records);
			if (!Ext.isEmpty(propagateRecords)) {
				this.fireEvent('afterrecordwrite', IPFStore, action, data, transaction, propagateRecords);
			}
		},

		/**
		 * Event handler which will be called when the store has fired the {@link Ext.data.Store#exception} event.
		 * This will look up which store has exactly fired the event, and will fire the {@link #exception} event.
		 * @param {Ext.data.DataProxy} proxy The proxy from where the exception event originated
		 * @param {String} type The value of this parameter will be either 'response' or 'remote'.
		 * @param {String} action Name of the action.
		 * @param {Object} options The options for the action that were specified in the request.
		 * @param {Object} response If the 'type' argument was 'response' this will be the raw browser response object,
		 * otherwise it will be the decoded response object
		 * @param {Mixed} arg (optional) Additional arguments for the exception
		 * @private
		 */
		onException : function(proxy, type, action, options, response, arg)
		{
			var proxies = Ext.pluck(this.IPFStores.items, 'proxy');
			if (!Ext.isEmpty(proxies)) {
				var storeIndex = proxies.indexOf(proxy);
				this.fireEvent('storeexception', this.IPFStores.get(storeIndex), proxy, type, action, options, response, arg);
			}
		},

		/**
		 * Executes the specified function once for every {@link Zarafa.core.data.IPFStore store} in the collection,
		 * passing the following arguments:
		 * <div class="mdetail-params"><ul>
		 * <li><b>item</b> : Zarafa.core.data.IPFStore<p class="sub-desc">The collection item</p></li>
		 * <li><b>index</b> : Number<p class="sub-desc">The item's index</p></li>
		 * <li><b>length</b> : Number<p class="sub-desc">The total number of items in the collection</p></li>
		 * </ul></div>
		 * The function should return a boolean value. Returning false from the function will stop the iteration.
		 * @param {Function} fn The function to execute for each item.
		 * @param {Object} scope (optional) The scope (<code>this</code> reference) in which the function is executed.
		 * Defaults to the current item in the iteration.
		 */
		each : function(fn, scope)
		{
			this.IPFStores.each.apply(this, arguments);
		},

		/**
		 * Obtain a list of {@link Zarafa.core.data.IPFStore stores} which have one or more of the
		 * requested {@link Zarafa.core.data.IPFRecord folders} currently
		 * {@link Zarafa.core.data.IPFStore#containsStoreInLastLoad loaded}.
		 * @param {Array} folders The list of {@link Zarafa.core.data.IPFRecord folders} or
		 * {@link Zarafa.hierarchy.data.MAPIFolderRecord#getId folder entryIds}
		 * for which the {@link Zarafa.core.data.IPFStore stores} are requested.
		 * @return {Array} The array of {@link Zarafa.core.data.IPFStore stores} which have the
		 * one or more of the requested stores loaded.
		 */
		getStoresForStores : function(folders)
		{
			var stores = [];

			if (!Array.isArray(folders)) {
				folders = [ folders ];
			}

			if (folders[0] instanceof Zarafa.core.data.IPFRecord) {
				folders = Ext.pluck(folders, 'id');
			}

			this.IPFStores.each(function(store) {
				if (store.containsStoreInLastLoad(folders)) {
					stores.push(store);
				}
			}, this);

			return stores;
		}
});

Zarafa.core.data.IPFStoreMgr = new Zarafa.core.data.IPFStoreMgr();
