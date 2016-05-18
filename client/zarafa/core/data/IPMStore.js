Ext.namespace('Zarafa.core.data');

Ext.data.Api.actions.open = 'open';

/**
 * @class Zarafa.core.data.IPMStore
 * @extends Zarafa.core.data.MAPIStore
 * @xtype zarafa.ipmstore
 *
 * The {@link Zarafa.core.data.IPMStore IPMStore} represents the collection of messages.
 */
Zarafa.core.data.IPMStore = Ext.extend(Zarafa.core.data.MAPIStore, {
	/**
	 * @cfg {Boolean} standalone If true, the {@link Zarafa.core.data.IPMStore IPMStore}
	 * will not be hooked into the {@link Zarafa.core.data.IPMStoreMgr IPMStoreMgr}. This will prevent
	 * listening to events coming from the {@link Zarafa.core.data.IPMStoreMgr IPMStoreMgr}.
	 * Defaults to false.
	 */
	standalone : false,

	/**
	 * @cfg {Boolean} serveronly If true, the {@link Zarafa.core.data.IPMStore IPMStore}
	 * will be hooked into the {@link Zarafa.core.data.IPMStoreMgr IPMStoreMgr}, but will
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

		Ext.applyIf(config, {
			remoteGroup : true
		});

		this.addEvents(
			/**
			 * @event beforenotify
			 * Event fired before a {@link #onNotify notification} is handled.
			 *
			 * @param {Zarafa.core.data.IPMStore} store The store which fired the event
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
			 * @param {Zarafa.core.data.IPMStore} store The store which fired the event
			 * @param {Zarafa.core.data.Notifications} notification The notification action
			 * @param {Ext.data.Record/Array} records The record or records which have been affected by the notification.
			 * @param {Object} data The data which has been recieved from the PHP-side which must be applied
			 * to the given records.
			 * @param {Number} timestamp The {@link Date#getTime timestamp} on which the notification was received
			 * @param {Boolean} success The success status, True if the notification was successfully recieved.
			 */
			'notify'
		);

		Zarafa.core.data.IPMStore.superclass.constructor.call(this, config);

		// Register store with the store manager
		if (!this.standalone) {
			Zarafa.core.data.IPMStoreMgr.register(this, this.serveronly);
		}
	},

	/**
	 * Initialize all events which Zarafa.core.data.IPMStore IPMStore} will listen to.
	 * @private
	 */
	initEvents : function()
	{
		Zarafa.core.data.IPMStore.superclass.initEvents.call(this);

		if (!this.standalone) {
			if (!this.serveronly) {
				Zarafa.core.data.IPMStoreMgr.on('beforerecordsave', this.onExternalSave, this);
			}
			Zarafa.core.data.IPMStoreMgr.on('afterrecordwrite', this.onExternalWrite, this);
		}
	},

	/**
	 * Filter a list of {@link Zarafa.core.data.IPMRecord records} by checking if the record
	 * belongs to this Store. This comparison is based on checking if the entryid of the given
	 * records match the entryid of the records inside the store. If the records are being
	 * {@link Zarafa.core.data.JsonReader#realize realized} by the {@link Zarafa.core.data.JsonReader JsonReader}
	 * then we check if the parent_entryid matches this store.
	 *
	 * What will be returned is an object containing the records as present inside the store,
	 * and the data objects which should be applied to them (the data from the records of the
	 * store that triggered the event).
	 *
	 * @param {Zarafa.core.data.IPMRecord|Array} records The record or records to filter
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

			if (action === Ext.data.Api.actions.create) {
				for (var i = 0, len = records.length; i < len; i++) {
					var rec = records[i];
					var storeRec = this.containsFolderInLastLoad(rec.get('parent_entryid'));

					if (rec.store !== this && storeRec) {
						results.records.push(rec.copy());
						results.updatedRecords.push(rec);
					}
				}
			} else {
				for (var i = 0, len = records.length; i < len; i++) {
					var rec = records[i];
					var storeRec = this.findBy(function (record, id) {
						if(rec.equals(record)) {
							return true;
						}
					});

					if(storeRec < 0) {
						continue;
					}

					storeRec = this.getAt(storeRec);

					if (rec.store !== this && storeRec) {
						results.records.push(storeRec);
						results.updatedRecords.push(rec);
					}
				}
			}
		}

		return results;
	},

	/**
	 * Event handler which is raised when a {@link Zarafa.core.data.IPMRecord IPMRecord} is about
	 * to be saved by a different {@link Zarafa.core.data.IPMStore IPMStore}. However the same
	 * {@link Zarafa.core.data.IPMRecord IPMRecord} may have been listed in multiple
	 * {@link Zarafa.core.data.IPMStore IPMStores} at the same time. Thus check if the saved
	 * {@link Zarafa.core.data.IPMRecord IPMRecord} is also listed in this store, and if that is the
	 * case, update it here as well. This way we don't have to wait until a reload from the
	 * server occurs, and the {@link Zarafa.core.data.IPMRecord IPMRecord} is updated on all stores
	 * instantly.
	 *
	 * @param {Zarafa.core.data.IPMStore} store The {@link Zarafa.core.data.IPMStore store} to which the
	 * {@link Zarafa.core.data.IPMRecord record} belongs.
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
	 * Event handler which is raised when a {@link Zarafa.core.data.IPMRecord IPMRecord} has been
	 * updated from the server. This {@link Zarafa.core.data.IPMRecord IPMRecord} may have been listed in
	 * multiple {@link Zarafa.core.data.IPMStore IPMStores} at the same time. Thus we need to
	 * check if this {@link Zarafa.core.data.IPMRecord IPMRecord} is also listed in this store, and if that
	 * is the case, update it here as well. This way we don't have to wait until a reload from the
	 * server occurs for this specific store.
	 *
	 * @param {Zarafa.core.data.IPMStore} store The {@link Zarafa.core.data.IPMStore store} to which the
	 * {@link Zarafa.core.data.IPMRecord record} belongs.
	 * @param {String} action [Ext.data.Api.actions.create|update|destroy|open]
	 * @param {Object} data The 'data' picked-out out of the response for convenience.
	 * @param {Ext.Direct.Transaction} res
	 * @param {Zarafa.core.data.IPMrecord} record The most recent version of the record
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
	 * Checks whether any of the folders that were included in the parameters during the last load,
	 * matches the supplied entryid argument.
	 * @param {String|Array} entryidList Entryid of the folder
	 * @return {Boolean} Returns true when entryid matches, false when it does not.
	 */
	containsFolderInLastLoad: function(entryidList)
	{
		if (!this.lastOptions) {
			return false;
		}

		if (!Ext.isArray(entryidList)) {
			entryidList = [ entryidList ];
		}

		var folderList = this.lastOptions.folder;
		if (Ext.isDefined(folderList)) {
			if (!Ext.isArray(folderList)) {
				folderList = [ folderList ];
			}

			for (var i = 0, len = folderList.length; i < len; i++) {
				for (var j = 0, jlen = entryidList.length; j < jlen; j++) {
					if (Zarafa.core.EntryId.compareEntryIds(folderList[i].get('entryid'), entryidList[j])) {
						return true;
					}
				}
			}
		}

		return false;
	},

	/**
	 * Notification handler which is called automatically by the
	 * {@link Zarafa.core.data.IPMNotificationResponseHandler NotificationResponseHandler}
	 * when a notification has been recieved for a {@link Zarafa.core.data.IPMRecord record} which
	 * has been loaded by this store.
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

			/*
			 * Fire the notify event only for record of this store.
			 * Notify event is only for records, not for store it self.
			 */
			if (!Ext.isEmpty(records) && records[0] instanceof Ext.data.Record) {
				this.fireEvent('notify', this, action, records, data, timestamp, success);
			}
		}
	},

	/**
	 * Notification handler called by {@link #onNotify} when
	 * a {@link Zarafa.core.data.Notifications#objectDeleted objectDeleted}
	 * notification has been recieved.
	 *
	 * This will remove the message from the store.
	 *
	 * @param {Zarafa.core.data.Notifications} action The notification action
	 * @param {Ext.data.Record/Array} records The record or records which have been affected by the notification.
	 * @param {Object} data The data which has been recieved from the PHP-side which must be applied
	 * to the given records.
	 * @param {Number} timestamp The {@link Date#getTime timestamp} on which the notification was received
	 * @param {Boolean} success The success status, True if the notification was successfully recieved.
	 * @private
	 */
	onNotifyObjectdeleted : function(action, records, data, timestamp, success)
	{
		if (!Ext.isArray(records)) {
			records = [ records ];
		}

		// To prevent the Deletion to be saved back to the server again,
		// we mark all the records which we are about to delete as phantom.
		for (var i = 0, len = records.length; i < len; i++) {
			records[i].setEventPropagation(false);
			records[i].phantom = true;
		}

		this.remove(records);
	},

	/**
	 * Notification handler called by {@link #onNotify} when
	 * a {@link Zarafa.core.data.Notifications#objectModified objectModified}
	 * notification has been recieved.
	 *
	 * This will update the message in the store.
	 *
	 * @param {Zarafa.core.data.Notifications} action The notification action
	 * @param {Ext.data.Record/Array} records The record or records which have been affected by the notification.
	 * @param {Object} data The data which has been recieved from the PHP-side which must be applied
	 * to the given records.
	 * @param {Number} timestamp The {@link Date#getTime timestamp} on which the notification was received
	 * @param {Boolean} success The success status, True if the notification was successfully recieved.
	 * @private
	 */
	onNotifyObjectmodified : function(action, records, data, timestamp, success)
	{
		var reloadStore = false;

		if (!Ext.isArray(records)) {
			records = [ records ];
		}

		// Temporarily disable event propagation, every store (which contains the provided records)
		// will receive this notification. So we have to disable event propagation to prevent
		// bouncing events around.
		for (var i = 0, len = records.length; i < len; i++) {
			var record = records[i];
			var singleData =  (Ext.isArray(data)) ? data[i] : data;

			record.setEventPropagation(false);

			var recordMessageClass = record.get('message_class');
			if (singleData instanceof Ext.data.Record) {
				// whenever message class is changed that means we will need to recreate record as the old record
				// will be having different set of fields, for that we simply reload the store
				if(recordMessageClass !== singleData.get('message_class')) {
					// If changed message class is part of original message class, then original message record
					// will already have all the properties, so for that case we don't need reload
					if(recordMessageClass.indexOf(singleData.get('message_class')) !== 0) {
						reloadStore = true;
					}
				}

				// Merge the changes into the record without using the JSONReader.
				record.applyData(singleData);
				// Commit the changes, it is a merge, so there are no local changes.
				record.commit();
			} else if(Object.keys(singleData).length !== 0) {
				// whenever message class is changed that means we will need to recreate record as the old record
				// will be having different sets of fields, for that we simply reload the store
				var updateMessageClass = singleData['message_class'] || singleData['props']['message_class'];
				if(recordMessageClass !== updateMessageClass) {
					// If changed message class is part of original message class, then original message record
					// will already have all the properties, so for that case we don't need reload
					if(recordMessageClass.indexOf(updateMessageClass) !== 0) {
						reloadStore = true;
					}
				}

				// Simply merge the record using the JsonReader, this will cause a 'update' event to be fired with
				// a COMMIT action. Because it is a commit, this store will not mark the record as dirty.
				this.reader.update(record, singleData);
			}

			record.setEventPropagation(true);
		}

		if(reloadStore) {
			this.reload();
		}
	},

	/**
	 * Notification handler called by {@link #onNotify} when
	 * a {@link Zarafa.core.data.Notifications#objectCreated objectCreated}
	 * notification has been recieved.
	 *
	 * Because it is unknown if the added record must be visible, or where
	 * in the Store the record must be shown, we simply reload the entire
	 * store to get all updates.
	 *
	 * @param {Zarafa.core.data.Notifications} action The notification action
	 * @param {Ext.data.Record/Array} records The record or records which have been affected by the notification.
	 * @param {Object} data The data which has been recieved from the PHP-side which must be applied
	 * to the given records.
	 * @param {Number} timestamp The {@link Date#getTime timestamp} on which the notification was received
	 * @param {Boolean} success The success status, True if the notification was successfully recieved.
	 * @private
	 */
	onNotifyObjectcreated : function(action, records, data, timestamp, success)
	{
		// If this notification came at the same time as we reloaded this folder,
		// we already obtained created item, and we don't need to reload.
		if (!timestamp || this.lastExecutionTime(Zarafa.core.Actions['list']) < timestamp) {
			this.reload();
		}
	},

	/**
	 * Destroys the store.
	 */
	destroy : function()
	{
		if (!this.standalone) {
			Zarafa.core.data.IPMStoreMgr.un('afterrecordwrite', this.onExternalWrite, this);
			if (!this.serveronly) {
				Zarafa.core.data.IPMStoreMgr.un('beforerecordsave', this.onExternalSave, this);
			}
			Zarafa.core.data.IPMStoreMgr.unregister(this, this.serveronly);
		}
		Zarafa.core.data.IPMStore.superclass.destroy.call(this);
	}
});

Ext.reg('zarafa.ipmstore', Zarafa.core.data.IPMStore);
