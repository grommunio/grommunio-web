Ext.namespace('Zarafa.task.data');

/**
 * @class Zarafa.task.data.TodoTaskListNotificationResponseHandler
 * @extends Zarafa.core.data.AbstractNotificationResponseHandler
 *
 * The {@link Zarafa.task.data.TodoTaskListNotificationResponseHandler NotificationResponseHandler}
 * to notify To-Do task list folder. This can updates To-Do task list folder.
 */
Zarafa.task.data.TodoTaskListNotificationResponseHandler = Ext.extend(Zarafa.core.data.AbstractNotificationResponseHandler, {

	/**
	 * Handle the newtodotask action we recieve as notification.
	 * This will contains to-do task list folder related information
	 * which used to generate the correct notification.
	 *
	 * @param {Object} data The entire response object which will be
	 * processed during this transaction.
	 * @private
	 */
	doNewtodotask : function (data)
	{
		var stores = data.item;
		var entryIds = Ext.pluck(stores, 'entryid');
		var folders = [];
		entryIds.forEach(function (entryId) {
			folders.push(container.getHierarchyStore().getFolder(entryId));
		});
		this.addNotification(Zarafa.core.data.Notifications.objectCreated, folders, null);
	}
});