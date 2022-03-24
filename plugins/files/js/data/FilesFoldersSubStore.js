Ext.namespace('Zarafa.plugins.files.data');

/**
 * @class Zarafa.plugins.files.data.FilesFoldersSubStore
 * @extends Zarafa.core.data.IPFStore
 */
Zarafa.plugins.files.data.FilesFoldersSubStore = Ext.extend(Zarafa.core.data.IPFStore, {

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
	constructor: function(config)
	{
		config = config || {};

		var recordType = Zarafa.core.data.RecordFactory.getRecordClassByCustomType(Zarafa.core.data.RecordCustomObjectType.FILES_FOLDER);

		Ext.applyIf(config, {
			proxy: new Zarafa.plugins.files.data.FilesHierarchyProxy(),
			writer : new Zarafa.core.data.JsonWriter(),
			reader : new Zarafa.core.data.JsonReader({
				dynamicRecord : false,
			}, recordType)
		});

		Zarafa.plugins.files.data.FilesFoldersSubStore.superclass.constructor.call(this, config);
	},

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

		Zarafa.plugins.files.data.FilesFoldersSubStore.superclass.createRecords.call(this, store, record, index);
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
		Zarafa.plugins.files.data.FilesFoldersSubStore.superclass.destroyRecord.call(this, store, record, index);
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
		if (!Array.isArray(records)) {
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
		if (!Array.isArray(records)) {
			records = [ records ];
		}

		// Temporarily disable event propagation, every store (which contains the provided records)
		// will receive this notification. So we have to disable event propagation to prevent
		// bouncing events around.
		for (var i = 0, len = records.length; i < len; i++) {
			var record = records[i];
			var singleData =  (Array.isArray(data)) ? data[i] : data;

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
	 * Checks whether any of the stores that were included in the parameters during the last load,
	 * matches the supplied entryid argument.
	 *
	 * @param {String|Array} entryidList Entryid of the folder
	 * @return {Boolean} Returns true when entryid matches, false when it does not.
	 */
	containsStoreInLastLoad: function(entryidList)
	{
		if (!Array.isArray(entryidList)) {
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
		if (!Array.isArray(data)) {
			data = [ data ];
		}

		if (data[0] instanceof Ext.data.Record) {
			this.loadRecords({ records : data }, { add : true });
		} else {
			this.loadData({ item : data }, true);
		}
	},

	/**
	 * <p>Loads the Record cache from the configured <tt>{@link #proxy}</tt> using the configured <tt>{@link #reader}</tt>.</p>
	 * <br> Function just adds 'list' as actionType in options and calls parent {@link Zarafa.core.data.IPFStore#load} method.
	 * <br> Check documentation of {@link Ext.data.Store#load} for more information.
	 *
	 * @param {Object} options An object containing properties which control loading.
	 * @return {Boolean} true if super class load method will call successfully, false otherwise.
	 */
	load : function(options)
	{
		// FIXME: In Webapp sub store are not allow to send request to server but files is
		// a special case where we dont load all the folder of hierarchy in advance so here
		// we have to give privilege to substore so it can able to send a request to server
		// to load the child folders
		if (!Ext.isObject(options)) {
			options = {};
		}

		if (!Ext.isObject(options.params)) {
			options.params = {};
		}

		// Load should always cancel the previous actions.
		if (!Ext.isDefined(options.cancelPreviousRequest)) {
			options.cancelPreviousRequest = true;
		}

		// Reload the files hierarchy panel.
		if (options.reload) {
			options.params = {
				reload : options.reload
			};
		}

		if (options.folder) {
			var folder = options.folder;

			Ext.applyIf(options.params||{}, {
				entryid : folder.get('entryid'),
				store_entryid : folder.get('store_entryid'),
				parent_entryid : folder.get('parent_entryid'),
				folder_id: folder.get('folder_id')
			});
		}

		Ext.applyIf(options, {
			actionType : Zarafa.core.Actions['list']
		});

		return Zarafa.plugins.files.data.FilesFoldersSubStore.superclass.load.call(this, options);
	}
});