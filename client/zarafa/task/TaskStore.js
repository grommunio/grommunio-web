Ext.namespace('Zarafa.task');

/**
 * @class Zarafa.task.TaskStore
 * @extends Zarafa.core.data.ListModuleStore
 * @xtype zarafa.taskstore
 *
 * this will contain all records fetched from the server side code
 */
Zarafa.task.TaskStore = Ext.extend(Zarafa.core.data.ListModuleStore, {
	/**
	 * @constructor
	 * @param {Object} config configuration params that should be used to create instance of this store.
	 */
	constructor : function(config)
	{
		config = config || {};

		// Apply default settings.
		Ext.applyIf(config, {
			preferredMessageClass : 'IPM.Task',
			defaultSortInfo : {
				field : 'duedate',
				direction : 'desc'
			}
		});

		Zarafa.task.TaskStore.superclass.constructor.call(this, config);
	},

	/**
	 * Notification handler called by {@link #onNotify} when
	 * a {@link Zarafa.core.data.Notifications#objectCreated objectCreated}
	 * notification has been recieved.
	 *
	 * Because it is unknown if the added record must be visible, or where
	 * in the Store the record must be shown, we simply reload the entire
	 * store to get all updates if current selected folder is To-Do list
	 * folder
	 *
	 * @param {Zarafa.core.data.Notifications} action The notification action
	 * @param {Array} records The {@link Zarafa.core.data.IPFStore folder}record(s)
	 * which have been affected by the notification.
	 * @private
	 */
	onNotifyObjectcreated : function(action, records)
	{
		var model = container.getCurrentContext().getModel();
		// Reload task grid only when selected folder is
		// To-Do list folder.
		if (model.getDefaultFolder().isTodoListFolder()) {
			this.reload({folder: records});
		} else {
			Zarafa.task.TaskStore.superclass.onNotifyObjectcreated.apply(this, arguments);
		}
	}
});

Ext.reg('zarafa.taskstore', Zarafa.task.TaskStore);
