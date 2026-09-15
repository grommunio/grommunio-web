Ext.namespace('Grommunio.core.data');

/**
 * @class Grommunio.core.data.IPMNotificationResponseHandler
 * @extends Grommunio.core.data.AbstractNotificationResponseHandler
 *
 * The default {@link Grommunio.core.data.AbstractNotificationResponseHandler ResponseHandler}
 * for {@link Grommunio.core.data.IPMStore IPMStore} Notifications.
 */
Grommunio.core.data.IPMNotificationResponseHandler = Ext.extend(Grommunio.core.data.AbstractNotificationResponseHandler, {
	/**
	 * Handle the {@link Grommunio.core.Actions#update 'update'} action.
	 * This will check if an item was created or updated,
	 * and generate the correct notification.
	 * @param {Object} data The entire response object which will be processed during this transaction.
	 * @private
	 */
	doUpdate: function(response)
	{
		var responseObj = this.reader.readResponse(Ext.data.Api.actions.read, response);
		if (responseObj) {
			var recordData = responseObj.data;

			for (var j = 0, len = recordData.length; j < len; j++) {
				var item = recordData[j];

				var record = this.store.getRecordFromNotification(item);
				if (record === false) {
					// The store cannot tell which of its records the notification is
					// about and handles it itself. Treating it as a new object here
					// would add a second copy of an item the store already has.
					continue;
				}

				if (!Ext.isDefined(record)) {
					this.addNotification(Grommunio.core.data.Notifications.objectCreated, null, item);
				} else {
					this.addNotification(Grommunio.core.data.Notifications.objectModified, record, item);
				}
			}
		}
	},

	/**
	 * Handle the {@link Grommunio.core.Actions#delete 'delete'} action.
	 * This will generate the correct objectDeleted notification.
	 * @param {Object} data The entire response object which will be processed during this transaction.
	 * @private
	 */
	doDelete: function(response)
	{
		var items = response.item;

		if (!Array.isArray(items)) {
			items = [ items ];
		}

		for (var i = 0, len = items.length; i < len; i++) {
			var item = items[i];

			var record = this.store.getRecordFromNotification(item);
			if (record) {
				this.addNotification(Grommunio.core.data.Notifications.objectDeleted, record, item);
			}
		}
	},

	/**
	 * Handle the {@link Grommunio.core.Actions#newobject 'newobject'} action.
	 * This will obtain the list of {@link Grommunio.core.data.IPMStore stores}
	 * which must be updated, and generate the Notification.
	 * @param {Object} data The entire response object which will be processed during this transaction.
	 * @private
	 */
	doNewobject: function(data)
	{
		var folderEntryids = Ext.pluck(data.item, 'entryid');
		var folderStores = Grommunio.core.data.IPMStoreMgr.getStoresForFolders(folderEntryids);

		this.addNotification(Grommunio.core.data.Notifications.objectCreated, folderStores, data);
	}
});
