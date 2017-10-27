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
	 * Open a Panel in which a new {@link Zarafa.core.data.IPMRecord record} can be
	 * further edited.
	 *
	 * @param {Zarafa.task.TaskContextModel} model Context Model object that will be used
	 * to {@link Zarafa.task.TaskContextModel#createRecord create} the Task.
	 * @param {Object} config (optional) Configuration object used to create
	 * the Content Panel.
	 */
	openCreateTaskRequestContent : function(model, config)
	{
		var record = model.createRecord();
		record.convertToTaskRequest();
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

		if (Array.isArray(records) && !Ext.isEmpty(records)) {
			record = records[0];
		} else {
			return;
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
	},

	/**
	 * Opens a {@link Zarafa.task.dialogs.SendTaskRequestConfirmationContentPanel}.
	 *
	 * @param {Zarafa.task.TaskRecord} record The record, or records, for which the task conformation will be send.
	 * @param {Object} config (optional) Configuration object used to create the ContentPanel
	 */
	openSendConfirmationContent : function(record, config)
	{
		config = Ext.applyIf(config || {}, {
			record : record,
			modal : true
		});
		var componentType = Zarafa.core.data.SharedComponentType['task.dialogs.sendtaskrequestconfirmation'];
		Zarafa.core.data.UIFactory.openLayerComponent(componentType, record, config);
	},

	/**
	 * Opens a {@link Zarafa.addressbook.dialogs.ABMultiUserSelectionContentPanel ABMultiUserSelectionContentPanel}
	 * for configuring the recipient of the given {@link Zarafa.core.data.IPMRecord records}.
	 *
	 * @param {Zarafa.core.data.IPMRecord} records The record, or records for which the recipient
	 * must be configured
	 * @param {Object} config (optional) Configuration object used to create
	 * the Content Panel.
	 */
	openRecipientSelectionContent : function(records, config)
	{
		if (Ext.isArray(records) && !Ext.isEmpty(records)) {
			records = records[0];
		}

		// Create a copy of the record, we don't want the changes
		// to be activated until the user presses the Ok button.
		var copy = records.copy();
		var store = copy.getSubStore('recipients');

		Zarafa.common.Actions.openABUserMultiSelectionContent({
			callback : function() {
				records.applyData(copy);
			},
			convert : function(user, field) {
				return user.convertToRecipient(field ? field.defaultRecipientType : config.defaultRecipientType);
			},
			store : store,
			selectionCfg : [{
				xtype : 'zarafa.recipientfield',
				fieldLabel : _('To') + ':',
				boxStore : store,
				filterRecipientType: Zarafa.core.mapi.RecipientType.MAPI_TO,
				defaultRecipientType: Zarafa.core.mapi.RecipientType.MAPI_TO,
				flex : 1
			}]
		});
	},

	/**
	 * Deletes all passed {@link Zarafa.core.data.IPMRecord records}. A
	 * {@link Zarafa.common.dialogs.MessageBox.show MessageBox} will be shown to explain that the records will be
	 * deleted from their original folder.
	 *
	 * @param {Array} records The array of {@link Zarafa.core.data.IPMRecord records} that must be deleted.
	 */
	deleteRecordsFromTodoList : function(records)
	{
		// It would be nice if we could use the state functionality for this, but the MessageBox is not an
		// Ext.Component and this context menu is already gone when the MessageBox is displayed, so this is
		// not possible.
		var settingsKey = 'zarafa/v1/contexts/task/todolist/dialogs/delete_item_confirmation/disabled';
		var disableDeleteConfirmationDialog = container.getSettingsModel().get(settingsKey) === true;

		if ( disableDeleteConfirmationDialog ){
			Zarafa.common.Actions.doDeleteRecords(records);
			return;
		}

		Zarafa.common.dialogs.MessageBox.addCustomButtons({
			title: _('Delete confirmation'),
			minWidth: 351,
			customButton: [{
				text : _('Delete'),
				name : 'delete'
			}, {
				text : _('Cancel'),
				name : 'cancel'
			}],
			checkbox: true,
			fn: function(btnId, text, checked){
				if ( btnId !== 'delete' ){
					return;
				}

				container.getSettingsModel().set(settingsKey, checked);
				Zarafa.common.Actions.doDeleteRecords(records);
			},
			msg: _('Deleting the item(s) will also delete the original item(s).') + '<br />' + _('Do you want to delete the item(s)?')
		});

	}
};
