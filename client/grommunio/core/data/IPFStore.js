/*
 * SPDX-FileCopyrightText: Copyright 2020 - 2026 grommunio GmbH
 * SPDX-FileCopyrightText: Copyright 2016 Kopano and its licensors
 * SPDX-FileCopyrightText: Copyright 2005 - 2016 Zarafa B.V. and its licensors
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

Ext.namespace('Grommunio.core.data');

/**
 * @class Grommunio.core.data.IPFStore
 * @extends Grommunio.core.data.MAPIStore
 * @xtype grommunio.ipfstore
 *
 * The {@link Grommunio.core.data.IPFStore IPFStore} represents the collection of MAPIStores.
 */
Grommunio.core.data.IPFStore = Ext.extend(Grommunio.core.data.MAPIStore, {
	/**
	 * @cfg {Boolean} standalone If true, the {@link Grommunio.core.data.IPFStore IPFStore}
	 * will not be hooked into the {@link Grommunio.core.data.IPFStoreMgr IPFStoreMgr}. This will prevent
	 * listening to events coming from the {@link Grommunio.core.data.IPFStoreMgr IPFStoreMgr}.
	 * Defaults to false.
	 */
	standalone: false,
	/**
	 * @cfg {Boolean} serveronly If true, the {@link Grommunio.core.data.IPFStore IPFStore}
	 * will be hooked into the {@link Grommunio.core.data.IPFStoreMgr IPFStoreMgr}, but will
	 * only do that for events which are triggered by a serverside change (e.g. a write
	 * event coming from the server, after a successful save).
	 * Defaults to false.
	 */
	serveronly: false,

	/**
	 * @constructor
	 * @param config Configuration structure
	 */
	constructor: function(config)
	{
		config = config || {};

		this.addEvents(
			/**
			 * @event beforenotify
			 * Event fired before a {@link #onNotify notification} is handled.
			 *
			 * @param {Grommunio.core.data.IPFStore} store The store which fired the event
			 * @param {Grommunio.core.data.Notifications} notification The notification action
			 * @param {Ext.data.Record/Array} records The record or records which have been affected by the notification.
			 * @param {Object} data The data which has been received from the PHP-side which must be applied
			 * to the given records.
			 * @param {Number} timestamp The {@link Date#getTime timestamp} on which the notification was received
			 * @param {Boolean} success The success status, True if the notification was successfully received.
			 * @return {Boolean} false to cancel the notification handling
			 */
			'beforenotify',
			/**
			 * @event notify
			 * Event fired after a {@link #onNotify notification} is handled.
			 *
			 * @param {Grommunio.core.data.IPFStore} store The store which fired the event
			 * @param {Grommunio.core.data.Notifications} notification The notification action
			 * @param {Ext.data.Record/Array} records The record or records which have been affected by the notification.
			 * @param {Object} data The data which has been received from the PHP-side which must be applied
			 * to the given records.
			 * @param {Number} timestamp The {@link Date#getTime timestamp} on which the notification was received
			 * @param {Boolean} success The success status, True if the notification was successfully received.
			 */
			'notify'
		);

		Grommunio.core.data.IPFStore.superclass.constructor.call(this, config);

		// Register store with the store manager
		if (!this.standalone) {
			Grommunio.core.data.IPFStoreMgr.register(this, this.serveronly);
		}
	},

	/**
	 * Initialize all events which Grommunio.core.data.IPFStore IPFStore} will listen to.
	 * @private
	 */
	initEvents: function()
	{
		Grommunio.core.data.IPFStore.superclass.initEvents.call(this);

		if (!this.standalone) {
			if (!this.serveronly) {
				Grommunio.core.data.IPFStoreMgr.on('beforerecordsave', this.onExternalSave, this);
			}
			Grommunio.core.data.IPFStoreMgr.on('afterrecordwrite', this.onExternalWrite, this);
		}
	},

	/**
	 * Filter a list of {@link Grommunio.core.data.IPFRecord records} by checking if the record
	 * belongs to this Store. This comparison is based on checking if the entryid of the given
	 * records match the entryid of the records inside the store. If the records are being
	 * {@link Grommunio.core.data.JsonReader#realize realized} by the {@link Grommunio.core.data.JsonReader JsonReader}
	 * then we check if the parent_entryid matches this store.
	 *
	 * What will be returned is an object containing the records as present inside the store,
	 * and the data objects which should be applied to them (the data from the records of the
	 * store that triggered the event).
	 *
	 * @param {Grommunio.core.data.IPFRecord|Array} records The record or records to filter
	 * @param {Ext.data.Api.actions} action The API action for which the updates are looked for.
	 * @return {Object} Object containing the key 'records' containing the array of records inside
	 * this store, and the key 'updatedRecords' containing the array of records which should be
	 * applied to those records.
	 * @private
	 */
	getRecordsForUpdateData: function(records, action)
	{
		var results = { records: [], updatedRecords: [] };

		if (Ext.isDefined(records)) {
			if (!Array.isArray(records)) {
				records = [ records ];
			}

			var isFavoritesStoreInstance = this instanceof Grommunio.common.favorites.data.MAPIFavoritesSubStore;

			if (action === Ext.data.Api.actions.create) {
				for (var i = 0, len = records.length; i < len; i++) {
					var rec = records[i];
					var storeRec = this.containsStoreInLastLoad(rec.get('store_entryid'));

					// Notify Grommunio.hierarchy.data.MAPIFavoritesSubStore when record/folder is Favorites folder.
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
	 * Event handler which is raised when a {@link Grommunio.core.data.IPFRecord IPFRecord} is about
	 * to be saved by a different {@link Grommunio.core.data.IPFStore IPFStore}. However the same
	 * {@link Grommunio.core.data.IPFRecord IPFRecord} may have been listed in multiple
	 * {@link Grommunio.core.data.IPFStore IPFStores} at the same time. Thus check if the saved
	 * {@link Grommunio.core.data.IPFRecord IPFRecord} is also listed in this store, and if that is the
	 * case, update it here as well. This way we don't have to wait until a reload from the
	 * server occurs, and the {@link Grommunio.core.data.IPFRecord IPFRecord} is updated on all stores
	 * instantly.
	 *
	 * @param {Grommunio.core.data.IPFStore} store The {@link Grommunio.core.data.IPFStore store} to which the
	 * {@link Grommunio.core.data.IPFRecord record} belongs.
	 * @param {Object} data An object containing the data that is to be saved.
	 * The object will contain a key for each appropriate action, with an array
	 * of updated data for each record.
	 */
	onExternalSave: function(store, data)
	{
		var result;

		if (store === this) {
			return;
		}

		result = this.getRecordsForUpdateData(data[Ext.data.Api.actions.open], Ext.data.Api.actions.open);
		if (!Ext.isEmpty(result.records)) {
			this.onNotify(Grommunio.core.data.Notifications.objectModified, result.records, result.updatedRecords);
		}

		result = this.getRecordsForUpdateData(data[Ext.data.Api.actions.update], Ext.data.Api.actions.update);
		if (!Ext.isEmpty(result.records)) {
			this.onNotify(Grommunio.core.data.Notifications.objectModified, result.records, result.updatedRecords);
		}

		result = this.getRecordsForUpdateData(data[Ext.data.Api.actions.create], Ext.data.Api.actions.create);
		if (!Ext.isEmpty(result.records)) {
			this.onNotify(Grommunio.core.data.Notifications.objectCreated, result.records, result.updatedRecords);
		}

		result = this.getRecordsForUpdateData(data[Ext.data.Api.actions.destroy], Ext.data.Api.actions.destroy);
		if (!Ext.isEmpty(result.records)) {
			this.onNotify(Grommunio.core.data.Notifications.objectDeleted, result.records, result.updatedRecords);
		}
	},

	/**
	 * Event handler which is raised when a {@link Grommunio.core.data.IPFRecord IPFRecord} has been
	 * updated from the server. This {@link Grommunio.core.data.IPFRecord IPFRecord} may have been listed in
	 * multiple {@link Grommunio.core.data.IPFStore IPFStores} at the same time. Thus we need to
	 * check if this {@link Grommunio.core.data.IPFRecord IPFRecord} is also listed in this store, and if that
	 * is the case, update it here as well. This way we don't have to wait until a reload from the
	 * server occurs for this specific store.
	 *
	 * @param {Grommunio.core.data.IPFStore} store The {@link Grommunio.core.data.IPFStore store} to which the
	 * {@link Grommunio.core.data.IPFRecord record} belongs.
	 * @param {String} action [Ext.data.Api.actions.create|update|destroy|open]
	 * @param {Object} data The 'data' picked-out out of the response for convenience.
	 * @param {Ext.Direct.Transaction} res
	 * @param {Grommunio.core.data.IPFrecord} record The most recent version of the record
	 * which came from the server.
	 */
	onExternalWrite: function(store, action, data, res, record)
	{
		if (store === this) {
			return;
		}

		var obj = {};
		if (Array.isArray(record)) {
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
	 * {@link Grommunio.hierarchy.data.HierarchyNotificationResponseHandler NotificationResponseHandler}
	 * when a notification has been received for the hierarchy.
	 *
	 * @param {Grommunio.core.data.Notifications} action The notification action
	 * @param {Ext.data.Record/Array} records The record or records which have been affected by the notification.
	 * @param {Object} data The data which has been received from the PHP-side which must be applied
	 * to the given records.
	 * @param {Number} timestamp The {@link Date#getTime timestamp} on which the notification was received
	 * @param {Boolean} success The success status, True if the notification was successfully received.
	 */
	onNotify: function(action, records, data, timestamp, success)
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
	destroy: function()
	{
		if (!this.standalone) {
			Grommunio.core.data.IPFStoreMgr.unregister(this, this.serveronly);

			Grommunio.core.data.IPFStoreMgr.un('beforerecordsave', this.onExternalSave, this);
			Grommunio.core.data.IPFStoreMgr.un('afterrecordwrite', this.onExternalWrite, this);
		}
		Grommunio.core.data.IPFStore.superclass.destroy.call(this);
	}
});

Ext.reg('grommunio.ipfstore', Grommunio.core.data.IPFStore);
