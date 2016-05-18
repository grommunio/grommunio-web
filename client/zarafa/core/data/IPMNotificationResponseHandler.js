Ext.namespace('Zarafa.core.data');

/**
 * @class Zarafa.core.data.IPMNotificationResponseHandler
 * @extends Zarafa.core.data.AbstractNotificationResponseHandler
 *
 * The default {@link Zarafa.core.data.AbstractNotificationResponseHandler ResponseHandler}
 * for {@link Zarafa.core.data.IPMStore IPMStore} Notifications.
 */
Zarafa.core.data.IPMNotificationResponseHandler = Ext.extend(Zarafa.core.data.AbstractNotificationResponseHandler, {
	/**
	 * Handle the {@link Zarafa.core.Actions#update 'update'} action.
	 * This will check if an item was created or updated,
	 * and generate the correct notification.
	 * @param {Object} data The entire response object which will be processed during this transaction.
	 * @private
	 */
	doUpdate : function(response)
	{
		var responseObj = this.reader.readResponse(Ext.data.Api.actions.read, response);
		if (responseObj) {
			var recordData = responseObj.data;

			for (var j = 0, len = recordData.length; j < len; j++) {
				var item = recordData[j];

				var record = this.store.getById(item.entryid);
				if (!Ext.isDefined(record)) {
					this.addNotification(Zarafa.core.data.Notifications.objectCreated, null, item);
				} else {
					this.addNotification(Zarafa.core.data.Notifications.objectModified, record, item);
				}
			}
		}
	},

	/**
	 * Handle the {@link Zarafa.core.Actions#delete 'delete'} action.
	 * This will generate the correct objectDeleted notification.
	 * @param {Object} data The entire response object which will be processed during this transaction.
	 * @private
	 */
	doDelete : function(response)
	{
		var items = response.item;

		if (!Ext.isArray(items)) {
			items = [ items ];
		}

		for (var i = 0, len = items.length; i < len; i++) {
			var item = items[i];

			var record = this.store.getById(item.entryid);
			if (record) {
				this.addNotification(Zarafa.core.data.Notifications.objectDeleted, record, item);
			}
		}
	},

	/**
	 * Handle the {@link Zarafa.core.Actions#newobject 'newobject'} action.
	 * This will obtain the list of {@link Zarafa.core.data.IPMStore stores}
	 * which must be updated, and generate the Notification.
	 * @param {Object} data The entire response object which will be processed during this transaction.
	 * @private
	 */
	doNewobject : function(data)
	{
		var folderEntryids = Ext.pluck(data.item, 'entryid');
		var folderStores = Zarafa.core.data.IPMStoreMgr.getStoresForFolders(folderEntryids);

		this.addNotification(Zarafa.core.data.Notifications.objectCreated, folderStores, data);
	}
});
