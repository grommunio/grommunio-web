Ext.namespace('Grommunio.task.data');

/**
 * @class Grommunio.task.data.TodoTaskListNotificationResponseHandler
 * @extends Grommunio.core.data.AbstractNotificationResponseHandler
 *
 * The {@link Grommunio.task.data.TodoTaskListNotificationResponseHandler NotificationResponseHandler}
 * to notify To-Do task list folder. This can updates To-Do task list folder.
 */
Grommunio.task.data.TodoTaskListNotificationResponseHandler = Ext.extend(Grommunio.core.data.AbstractNotificationResponseHandler, {

	/**
	 * Handle the newtodotask action we receive as notification.
	 * This will contains to-do task list folder related information
	 * which used to generate the correct notification.
	 *
	 * @param {Object} data The entire response object which will be
	 * processed during this transaction.
	 * @private
	 */
	doNewtodotask: function (data)
	{
		var stores = data.item;
		var entryIds = Ext.pluck(stores, 'entryid');
		var folders = [];
		entryIds.forEach(function (entryId) {
			folders.push(container.getHierarchyStore().getFolder(entryId));
		});
		this.addNotification(Grommunio.core.data.Notifications.objectCreated, folders, null);
	}
});
