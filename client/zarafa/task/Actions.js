Ext.namespace('Zarafa.task');

/**
 * @class Zarafa.task.Actions
 * Common actions which can be used within {@link Ext.Button buttons}
 * or other {@link Ext.Component components} with action handlers.
 * @singleton
 */
Zarafa.task.Actions = {
	/**
	 * Open a Panel in which the {@link Zarafa.core.data.IPMRecord record}
	 * can be viewed, or further edited.
	 *
	 * @param {Zarafa.core.data.IPMRecord} records The records to open
	 * @param {Object} config (optional) Configuration object used to create
	 * the Content Panel.
	 */
	openTaskContent : function(records, config)
	{
		Ext.each(records, function(record) {
			Zarafa.core.data.UIFactory.openViewRecord(record, config);
		});
	},

	/**
	 * Open a Panel in which a new {@link Zarafa.core.data.IPMRecord record} can be
	 * further edited.
	 *
	 * @param {Zarafa.task.TaskContextModel} model Context Model object that will be used
	 * to {@link Zarafa.task.TaskContextModel#createRecord create} the Task.
	 * @param {Object} config (optional) Configuration object used to create
	 * the Content Panel.
	 */
	openCreateTaskContent : function(model, config)
	{
		var record = model.createRecord();
		Zarafa.core.data.UIFactory.openCreateRecord(record, config);
	},

	/**
	 * Converts record to an task and calls {@link Zarafa.core.data.UIFactory.openCreateRecord}
	 * to open the newly created task as editable record. The original record isn't removed.
	 *
	 * @param {Zarafa.core.data.IPMRecord} records The record which will be converted to a task
	 * @param {Zarafa.task.TaskContextModel} model Used to create a new task record
	 */
	createTaskFromMail : function(records, model)
	{
		var record;

		if (Ext.isArray(records) && !Ext.isEmpty(records)) {
			record = records[0];
		}

		if (record.isOpened()) {
			var newTaskRecord = record.convertToTask(model.getDefaultFolder());		
			Zarafa.core.data.UIFactory.openCreateRecord(newTaskRecord);
		} else {
			// If record is not openend, then we need to reopen it to get the body. (For example when the selected records store reloads)
			record.getStore().on('open', this.openHandler.createDelegate(this, [model], 2), this, {single : true});
			record.open();
		}
	},

	/**
	 * Handler for {@link Zarafa.core.data.IPMStore store} open event. Converts the opened record
	 * to a task and opens it as editable record.
	 *
	 * @param {Zarafa.core.data.IPMStore} store The store of the record.
	 * @param {Zarafa.core.data.IPMRecord} record The record which will be converted to a task
	 * @param {Zarafa.task.TaskContextModel} model Used to create a new task record
	 */
	openHandler: function(store, record, model)
	{
		var newTaskRecord = record.convertToTask(model.getDefaultFolder());		
		Zarafa.core.data.UIFactory.openCreateRecord(newTaskRecord);
	}
};
