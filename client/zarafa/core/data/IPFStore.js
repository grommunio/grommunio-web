Ext.namespace('Zarafa.core.data');

/**
 * @class Zarafa.core.data.IPFStore
 * @extends Zarafa.core.data.MAPIStore
 * @xtype zarafa.ipfstore
 *
 * The {@link Zarafa.core.data.IPFStore IPFStore} represents the collection of MAPIStores.
 */
Zarafa.core.data.IPFStore = Ext.extend(Zarafa.core.data.MAPIStore, {
	/**
	 * @cfg {Boolean} standalone If true, the {@link Zarafa.core.data.IPFStore IPFStore}
	 * will not be hooked into the {@link Zarafa.core.data.IPFStoreMgr IPFStoreMgr}. This will prevent
	 * listening to events coming from the {@link Zarafa.core.data.IPFStoreMgr IPFStoreMgr}.
	 * Defaults to false.
	 */
	standalone : false,
	/**
	 * @cfg {Boolean} serveronly If true, the {@link Zarafa.core.data.IPFStore IPFStore}
	 * will be hooked into the {@link Zarafa.core.data.IPFStoreMgr IPFStoreMgr}, but will
	 * only do that for events which are triggered by a serverside change (e.g. a write
	 * event coming from the server, after a successful save).
	 * Defaults to false.
	 */
	serveronly : false,

	/**
	 * @constructor
	 * @param config Configuration structure
	 */
	constructor : function(config)
	{
		config = config || {};

		this.addEvents(
			/**
			 * @event beforenotify
			 * Event fired before a {@link #onNotify notification} is handled.
			 * 
			 * @param {Zarafa.core.data.IPFStore} store The store which fired the event
			 * @param {Zarafa.core.data.Notifications} notification The notification action
			 * @param {Ext.data.Record/Array} records The record or records which have been affected by the notification.
			 * @param {Object} data The data which has been recieved from the PHP-side which must be applied
			 * to the given records.
			 * @param {Number} timestamp The {@link Date#getTime timestamp} on which the notification was received
			 * @param {Boolean} success The success status, True if the notification was successfully recieved.
			 * @return {Boolean} false to cancel the notification handling
			 */
			'beforenotify',
			/**
			 * @event notify
			 * Event fired after a {@link #onNotify notification} is handled.
			 * 
			 * @param {Zarafa.core.data.IPFStore} store The store which fired the event
			 * @param {Zarafa.core.data.Notifications} notification The notification action
			 * @param {Ext.data.Record/Array} records The record or records which have been affected by the notification.
			 * @param {Object} data The data which has been recieved from the PHP-side which must be applied
			 * to the given records.
			 * @param {Number} timestamp The {@link Date#getTime timestamp} on which the notification was received
			 * @param {Boolean} success The success status, True if the notification was successfully recieved.
			 */
			'notify'
		);

		Zarafa.core.data.IPFStore.superclass.constructor.call(this, config);

		// Register store with the store manager
		if (!this.standalone) {
			Zarafa.core.data.IPFStoreMgr.register(this, this.serveronly);
		}
	},

	/**
	 * Initialize all events which Zarafa.core.data.IPFStore IPFStore} will listen to.
	 * @private
	 */
	initEvents : function()
	{
		Zarafa.core.data.IPFStore.superclass.initEvents.call(this);

		if (!this.standalone) {
			if (!this.serveronly) {
				Zarafa.core.data.IPFStoreMgr.on('beforerecordsave', this.onExternalSave, this);
			}
			Zarafa.core.data.IPFStoreMgr.on('afterrecordwrite', this.onExternalWrite, this);
		}
	},

	/**
	 * Filter a list of {@link Zarafa.core.data.IPFRecord records} by checking if the record
	 * belongs to this Store. This comparison is based on checking if the entryid of the given
	 * records match the entryid of the records inside the store. If the records are being
	 * {@link Zarafa.core.data.JsonReader#realize realized} by the {@link Zarafa.core.data.JsonReader JsonReader}
	 * then we check if the parent_entryid matches this store.
	 *
	 * What will be returned is an object containing the records as present inside the store,
	 * and the data objects which should be applied to them (the data from the records of the
	 * store that triggered the event).
	 *
	 * @param {Zarafa.core.data.IPFRecord|Array} records The record or records to filter
	 * @param {Ext.data.Api.actions} action The API action for which the updates are looked for.
	 * @return {Object} Object containing the key 'records' containing the array of records inside
	 * this store, and the key 'updatedRecords' containing the array of records which should be 
	 * applied to those records.
	 * @private
	 */
	getRecordsForUpdateData : function(records, action)
	{
		var results = { records: [],  updatedRecords : [] };

		if (Ext.isDefined(records)) {
			if (!Ext.isArray(records)) {
				records = [ records ];
			}

			var isFavoritesStoreInstance = this instanceof Zarafa.common.favorites.data.MAPIFavoritesSubStore;

			if (action === Ext.data.Api.actions.create) {
				for (var i = 0, len = records.length; i < len; i++) {
					var rec = records[i];
					var storeRec = this.containsStoreInLastLoad(rec.get('store_entryid'));

					// Notify Zarafa.hierarchy.data.MAPIFavoritesSubStore when record/folder is Favorites folder.
					if (rec.isFavoritesFolder()) {
						// Requires separate check here because there are many cases
						// where record was favorites marked but store is not favorites store in that case don't do
						// anything.
						if (isFavoritesStoreInstance) {
							results.records.push(rec.copy());
							results.updatedRecords.push(rec);
						}
					} else if (rec.store !== this && storeRec && !isFavoritesStoreInstance) {
						results.records.push(rec.copy());
						results.updatedRecords.push(rec);
					}
				}
			} else {
				for (var i = 0, len = records.length; i < len; i++) {
					var rec = records[i];
					var storeRec = this.getById(rec.get('entryid'));

					if (storeRec !== this && storeRec && !rec.isFavoritesFolder() && !isFavoritesStoreInstance) {
						results.records.push(storeRec);
						results.updatedRecords.push(rec);
					}
				}
			}
		}

		return results;
	},

	/**
	 * Event handler which is raised when a {@link Zarafa.core.data.IPFRecord IPFRecord} is about
	 * to be saved by a different {@link Zarafa.core.data.IPFStore IPFStore}. However the same
	 * {@link Zarafa.core.data.IPFRecord IPFRecord} may have been listed in multiple
	 * {@link Zarafa.core.data.IPFStore IPFStores} at the same time. Thus check if the saved
	 * {@link Zarafa.core.data.IPFRecord IPFRecord} is also listed in this store, and if that is the
	 * case, update it here as well. This way we don't have to wait until a reload from the
	 * server occurs, and the {@link Zarafa.core.data.IPFRecord IPFRecord} is updated on all stores
	 * instantly.
	 *
	 * @param {Zarafa.core.data.IPFStore} store The {@link Zarafa.core.data.IPFStore store} to which the
	 * {@link Zarafa.core.data.IPFRecord record} belongs.
	 * @param {Object} data An object containing the data that is to be saved.
	 * The object will contain a key for each appropriate action, with an array
	 * of updated data for each record.  
	 */
	onExternalSave : function(store, data)
	{
		var result;

		if (store === this) {
			return;
		}

		result = this.getRecordsForUpdateData(data[Ext.data.Api.actions.open], Ext.data.Api.actions.open);
		if (!Ext.isEmpty(result.records)) {
			this.onNotify(Zarafa.core.data.Notifications.objectModified, result.records, result.updatedRecords);
		}

		result = this.getRecordsForUpdateData(data[Ext.data.Api.actions.update], Ext.data.Api.actions.update);
		if (!Ext.isEmpty(result.records)) {
			this.onNotify(Zarafa.core.data.Notifications.objectModified, result.records, result.updatedRecords);
		}

		result = this.getRecordsForUpdateData(data[Ext.data.Api.actions.create], Ext.data.Api.actions.create);
		if (!Ext.isEmpty(result.records)) {
			this.onNotify(Zarafa.core.data.Notifications.objectCreated, result.records, result.updatedRecords);
		}

		result = this.getRecordsForUpdateData(data[Ext.data.Api.actions.destroy], Ext.data.Api.actions.destroy);
		if (!Ext.isEmpty(result.records)) {
			this.onNotify(Zarafa.core.data.Notifications.objectDeleted, result.records, result.updatedRecords);
		}
	},

	/**
	 * Event handler which is raised when a {@link Zarafa.core.data.IPFRecord IPFRecord} has been
	 * updated from the server. This {@link Zarafa.core.data.IPFRecord IPFRecord} may have been listed in
	 * multiple {@link Zarafa.core.data.IPFStore IPFStores} at the same time. Thus we need to
	 * check if this {@link Zarafa.core.data.IPFRecord IPFRecord} is also listed in this store, and if that
	 * is the case, update it here as well. This way we don't have to wait until a reload from the
	 * server occurs for this specific store.
	 *
	 * @param {Zarafa.core.data.IPFStore} store The {@link Zarafa.core.data.IPFStore store} to which the
	 * {@link Zarafa.core.data.IPFRecord record} belongs.
	 * @param {String} action [Ext.data.Api.actions.create|update|destroy|open]
	 * @param {Object} data The 'data' picked-out out of the response for convenience.
	 * @param {Ext.Direct.Transaction} res
	 * @param {Zarafa.core.data.IPFrecord} record The most recent version of the record
	 * which came from the server.
	 */
	onExternalWrite : function(store, action, data, res, record)
	{
		if (store === this) {
			return;
		}

		var obj = {};
		if (Ext.isArray(record)) {
			obj[action] = record;
		} else {
			obj[action] = [ record ];
		}

		this.onExternalSave(store, obj);
	},

	/**
	 * Checks whether any of the stores that were included in the parameters during the last load, 
	 * matches the supplied entryid argument.
	 *
	 * The IPFStore can currently not load data directly from the server, hence this
	 * function will always return false as it cannot determine which store it is currently
	 * displaying. Subclasses should override this function to return accurate information.
	 *
	 * @param {String|Array} entryidList Entryid of the folder
	 * @return {Boolean} Returns true when entryid matches, false when it does not.
	 */
	containsStoreInLastLoad: function(entryidList)
	{
		return false;
	},

	/**
	 * Notification handler which is called automatically by the
	 * {@link Zarafa.hierarchy.data.HierarchyNotificationResponseHandler NotificationResponseHandler}
	 * when a notification has been recieved for the hierarchy.
	 *
	 * @param {Zarafa.core.data.Notifications} action The notification action
	 * @param {Ext.data.Record/Array} records The record or records which have been affected by the notification.
	 * @param {Object} data The data which has been recieved from the PHP-side which must be applied
	 * to the given records.
	 * @param {Number} timestamp The {@link Date#getTime timestamp} on which the notification was received
	 * @param {Boolean} success The success status, True if the notification was successfully recieved.
	 */
	onNotify : function(action, records, data, timestamp, success)
	{
		if (this.fireEvent('beforenotify', this, action, records, data, timestamp, success) !== false) {
			var handler = this['onNotify' + Ext.util.Format.capitalize(action)];
			if (Ext.isFunction(handler)) {
				handler.call(this, action, records, data, timestamp, success);
			}
			this.fireEvent('notify', this, action, records, data, timestamp, success);
		}
	},

	/**
	 * Destroys the store.
	 */
	destroy : function()
	{   
		if (!this.standalone) {
			Zarafa.core.data.IPFStoreMgr.unregister(this, this.serveronly);

			Zarafa.core.data.IPFStoreMgr.un('beforerecordsave', this.onExternalSave, this);
			Zarafa.core.data.IPFStoreMgr.un('afterrecordwrite', this.onExternalWrite, this);
		}
		Zarafa.core.data.IPFStore.superclass.destroy.call(this);
	}
});

Ext.reg('zarafa.ipfstore', Zarafa.core.data.IPFStore);
