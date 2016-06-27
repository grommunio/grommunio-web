Ext.namespace('Zarafa.hierarchy.data');

/**
 * @class Zarafa.hierarchy.data.IPFSubStore
 * @extends Zarafa.core.data.IPFStore
 * @xtype zarafa.ipfsubstore
 *
 * {@link Zarafa.hierarchy.data.IPFSubStore} holds {@link Zarafa.hierarchy.data.MAPIFolderRecords} as records, which defines store information
 * of all opened stores(own, shared, public)
 */
Zarafa.hierarchy.data.IPFSubStore = Ext.extend(Zarafa.core.data.IPFStore, {
	/**
	 * The {@link Zarafa.core.data.MAPIRecord MAPIRecord} that is the parent of this store.
	 * @property
	 * @type Zarafa.core.data.MAPIRecord
	 */
	parentRecord: null,

	/**
	 * @constructor
	 * @param {Object} config Configuration object
	 */
	constructor : function (config)
	{
		config = config || {};

		var recordType = Zarafa.core.data.RecordFactory.getRecordClassByObjectType(Zarafa.core.mapi.ObjectType.MAPI_FOLDER);

		Ext.applyIf(config, {
			proxy: new Zarafa.hierarchy.data.HierarchyProxy(),
			writer : new Zarafa.core.data.JsonWriter(),
			reader: new Zarafa.core.data.JsonReader({}, recordType)
		});

		Zarafa.hierarchy.data.IPFSubStore.superclass.constructor.call(this, config);

		this.on({
			'beforesave' : this.onBeforeSave,
			'exception' : this.onException,
			scope : this
		});
	},

	// some ugly duplication of code between MAPISubStore and IPFSubStore

	/**
	 * Called when member is added on store. Should not be used directly.
	 * It's called by Store#add automatically
	 * @FIXME now IPFSubStore is not child of NoSyncStore, 
	 * so we don't need to mark parentrecord dirty, remove this.
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

		Zarafa.hierarchy.data.IPFSubStore.superclass.createRecords.call(this, store, record, index);
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
		Zarafa.hierarchy.data.IPFSubStore.superclass.destroyRecord.call(this, store, record, index);
	},

	/**
	 * Get the {@link Zarafa.core.data.IPFRecord IPFRecord} that is the parent of this store.
	 * @return {Zarafa.core.data.IPFRecord} The parent IPFRecord.
	 */
	getParentRecord : function()
	{
		return this.parentRecord;
	},

	/**
	 * Set the {@link Zarafa.core.data.IPFRecord IPFRecord} that is the parent of this store.
	 * @param {Zarafa.core.data.IPFRecord} record The parent IPFRecord.
	 */
	setParentRecord : function(record)
	{
		this.parentRecord = record;
	},

	/**
	 * Event handler will be called when an error/exception is occured at server side,
	 * and error is returned.
	 * @param {Zarafa.core.data.MAPIProxy} proxy object that received the error
	 * and which fired exception event.
	 * @param {String} type 'request' if an invalid response from server recieved,
	 * 'remote' if valid response received from server but with succuessProperty === false.
	 * @param {String} action Name of the action {@link Ext.data.Api.actions}.
	 * @param {Object} options The options for the action that were specified in the request.
	 * @param {Object} response response received from server depends on type.
	 * @param {Mixed} args
	 */
	onException : function(proxy, type, action, options, response, args)
	{
		if (Ext.isDefined(args) && Ext.isArray(args.sendRecords)) {
			Ext.each(args.sendRecords, function(record) {
				// Clear all previous message actions
				record.clearMessageActions();
				record.reject();
			});
		}
	},

	/**
	 * Checks whether any of the stores that were included in the parameters during the last load, 
	 * matches the supplied entryid argument.
	 *
	 * @param {String|Array} entryidList Entryid of the folder
	 * @return {Boolean} Returns true when entryid matches, false when it does not.
	 */
	containsStoreInLastLoad: function(entryidList)
	{
		if (!Ext.isArray(entryidList)) {
			entryidList = [ entryidList ];
		}

		if (this.parentRecord) {
			var entryId = this.parentRecord.get('store_entryid');

			for (var i = 0, len = entryidList.length; i < len; i++) {
				if (Zarafa.core.EntryId.compareStoreEntryIds(entryId, entryidList[i])) {
					return true;
				}
			}
		}

		return false;
	},

	/**
	 * Notification handler called by {@link #onNotify} when
	 * a {@link Zarafa.core.data.Notifications#objectDeleted objectDeleted}
	 * notification has been recieved.
	 *
	 * This will remove the folder from the store.
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
	 * This will update the folder in the store.
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

			if (singleData instanceof Ext.data.Record) {
				// Merge the changes into the record without using the JSONReader. 
				record.applyData(singleData);
			} else {
				// Simply merge the record using the JsonReader, this will cause a 'update' event to be fired with
				// a COMMIT action. Because it is a commit, this store will not mark the record as dirty.
				this.reader.update(record, singleData);
			}
			
			record.setEventPropagation(true);
		}
	},

	/**
	 * Notification handler called by {@link #onNotify} when
	 * a {@link Zarafa.core.data.Notifications#objectCreated objectCreated}
	 * notification has been recieved.
	 *
	 * This will add the folder to the store.
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
		if (!Ext.isArray(data)) {
			data = [ data ];
		}

		var isFavoritesStoreInstance = this instanceof Zarafa.common.favorites.data.MAPIFavoritesSubStore;

		if (data[0] instanceof Ext.data.Record) {
			this.loadRecords({ records : data }, { add : true });
		} else if(!isFavoritesStoreInstance) {
			// Don't go for loadData if store is MAPIFavoritesSubStore because we are never
			// send non Ext.data.Record in server side notification.
			this.loadData({ item : data }, true);
		}
	},

	/**
	 * Saves all pending changes to the store.  If the commensurate Ext.data.Api.actions action is not configured, then
	 * the configured <code>{@link #url}</code> will be used.
	 * <pre>
	 * change            url
	 * ---------------   --------------------
	 * removed records   Ext.data.Api.actions.destroy
	 * phantom records   Ext.data.Api.actions.create
	 * {@link #getModifiedRecords modified records}  Ext.data.Api.actions.update
	 * </pre>
	 * @TODO:  Create extensions of Error class and send associated Record with thrown exceptions.
	 * e.g.:  Ext.data.DataReader.Error or Ext.data.Error or Ext.data.DataProxy.Error, etc.
	 * @return {Number} batch Returns a number to uniquely identify the "batch" of saves occurring. -1 will be returned
	 * if there are no items to save or the save was cancelled.
	 */
	save : function()
	{
		// If the removed array is non-empty shared stores are being closed
		// shared stores get a special treatmeent
		if (this.removed.length) {
			var removed = [];
			var sharedfolders = [];

			for (var i = 0, len = this.removed.length; i < len; i++) {
				var item = this.removed[i];

				if (item.isSharedFolder() && !item.isFavoritesFolder()) {
					sharedfolders.push(item);
				} else {
					removed.push(item);
				}
			}

			if (!Ext.isEmpty(sharedfolders)) {
				var data = {
					'close' : sharedfolders
				};

				if (this.fireEvent('beforesave', this, data) !== false) {
					try {
						var batch = ++this.batchCounter;
						this.execute('destroy', data['close'], { actionType : 'closesharedfolder' }, batch);
					} catch (e) {
						this.handleException(e);
					}

					// Continue with the filtered list
					// of removed folders.
					this.removed = removed;
				}
			}
		}

		Zarafa.hierarchy.data.IPFSubStore.superclass.save.apply(this, arguments);
	},

	/**
	 * Event handler which is fired when Folder changes are about to be saved.
	 * This will check if a record is being destroyed, if that is a shared folder,
	 * then the settings will be updated to save the state.
	 * @param {Ext.data.Store} store The store which fired the event.
	 * @param {Object} data The data object containing the various changes
	 * which will be send to the server
	 * @private
	 */
	onBeforeSave : function(store, data)
	{
		// The 'close' key is only used for shared stores/folders
		if (!Ext.isEmpty(data['close'])) {
			var settings = container.getSettingsModel();
			var folders = data['close'];

			settings.beginEdit();

			for (var i = 0, len = folders.length; i < len; i++) {
				var sharedfolder = folders[i];
				var user = sharedfolder.getMAPIStore().get('user_name').toLowerCase();
				var type = sharedfolder.getSharedFolderKey();

				// Remove this specific folder from the settings
				// to prevent it from being loaded during the next
				// reload.
				settings.remove('zarafa/v1/contexts/hierarchy/shared_stores/' + user + '/' + type);

				// The server doesn't need the entryids to be sent,
				// only the user_name and folder_type.
				sharedfolder.addIdProp('user_name');
				sharedfolder.addIdProp('folder_type');
				sharedfolder.removeIdProp('parent_entryid');
				sharedfolder.removeIdProp('store_entryid');

				// Now we do have to check, as the 2 id properties are not defined
				// in the Record Fields array. So we insert them into the record.
				sharedfolder.set('user_name', user);
				sharedfolder.set('folder_type', type);
			}

			settings.endEdit();
		}
	}
});

Ext.reg('zarafa.ipfsubstore', Zarafa.hierarchy.data.IPFSubStore);
