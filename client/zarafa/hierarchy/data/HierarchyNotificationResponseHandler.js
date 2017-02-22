Ext.namespace('Zarafa.hierarchy.data');

/**
 * @class Zarafa.hierarchy.data.HierarchyNotificationResponseHandler
 * @extends Zarafa.core.data.AbstractNotificationResponseHandler
 *
 * The default {@link Zarafa.core.data.AbstractNotificationResponseHandler ResponseHandler}
 * for Hierarchy Notifications. This can handle folder changes, and newMail updates.
 */
Zarafa.hierarchy.data.HierarchyNotificationResponseHandler = Ext.extend(Zarafa.core.data.AbstractNotificationResponseHandler, {
	/**
	 * Handle the {@link Zarafa.core.Actions#folder 'folder'} action.
	 * This will check if the folder was created, updated or deleted,
	 * and generate the correct notification.
	 * @param {Object} data The entire response object which will be processed during this transaction.
	 * @private
	 */
	doFolders : function(data)
	{
		var responseObj;
		var folders = data.item;

		if (Ext.isEmpty(folders)) {
			return;
		}

		if (!Array.isArray(folders)) {
			folders = [ folders ];
		}

		try {
			responseObj = this.reader.readResponse(Ext.data.Api.actions.read, {item : folders});
		} catch(e) {
			return false;
		}

		for (var i = 0, len = responseObj.data.length; i < len; i++) {
			var rawFolder = folders[i];
			var folder = responseObj.data[i];

			var mapiFolderRecord = this.store.getById(folder.entryid);
			if (mapiFolderRecord) {
				// Check the 'folderdelete' field inside the rawdata.
				// 'folderdelete' is a notification flag set by PHP which indicates that the
				// reason for this notification is that the folder has been deleted. We must check
				// this flag in the raw data rather then the Record itself, since 'folderdelete'
				// is not defined as an official field for the FolderRecord. Neither should it be registered,
				// as it is only a notification flag.
				if (rawFolder.folderdelete) {
					this.addNotification(Zarafa.core.data.Notifications.objectDeleted, mapiFolderRecord, folder);
				} else {
					this.addNotification(Zarafa.core.data.Notifications.objectModified, mapiFolderRecord, folder);
				}
			} else if (!rawFolder.folderdelete) {
				this.addNotification(Zarafa.core.data.Notifications.objectCreated, null, folder);
			}
		}
	},

	/**
	 * Handle the {@link Zarafa.core.Actions#newmail 'newmail'} action.
	 * This will obtain the list of {@link Zarafa.core.data.IPMStore stores}
	 * which must be updated, and generate the Notification.
	 * @param {Object} data The entire response object which will be processed during this transaction.
	 * @private
	 */
	doNewmail : function(data)
	{
		var folderEntryids = Ext.pluck(data.item, 'entryid');
		var folderStores = Zarafa.core.data.IPMStoreMgr.getStoresForFolders(folderEntryids);

		this.addNotification(Zarafa.core.data.Notifications.newMail, folderStores, data);
	},

	/**
	 * Handle the stores action we recieve as notification.
	 * This will obtain the list of {@link Zarafa.hierarchy.data.MAPIStoreRecord MAPIStoreRecord}
	 * which must be updated, and generate the Notification.
	 * @param {Object} data The entire response object which will be processed during this transaction.
	 * @private
	 */
	doStores : function(data)
	{
		var stores = data.item;
		var mapiStoreIds = Ext.pluck(stores, 'store_entryid');

		var mapiStoreRecord = [];
		for (var i = 0, len = mapiStoreIds.length; i < len; i++) {
			var storeRecord = this.store.getById(mapiStoreIds[i]);
			// We must check if we have a store record, because a keepalive request might be sent before the store loaded.
			// The notifier that will be sent in the response will trigger this function and because we don't have the 
			// store record yet, we will eventually end up with a javascript error if we put undefined in the mapiStoreRecord array.
			if ( Ext.isDefined(storeRecord) ){
				mapiStoreRecord.push(storeRecord);
			}
		}

		this.addNotification(Zarafa.core.data.Notifications.objectModified, mapiStoreRecord, stores);
	}
});
