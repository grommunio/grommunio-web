/*
 * SPDX-FileCopyrightText: Copyright 2020 - 2026 grommunio GmbH
 * SPDX-FileCopyrightText: Copyright 2016 Kopano and its licensors
 * SPDX-FileCopyrightText: Copyright 2005 - 2016 Zarafa B.V. and its licensors
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

Ext.namespace('Grommunio.task');

/**
 * @class Grommunio.task.Actions
 * Common actions which can be used within {@link Ext.Button buttons}
 * or other {@link Ext.Component components} with action handlers.
 * @singleton
 */
Grommunio.task.Actions = {
	/**
	 * Open a Panel in which a new {@link Grommunio.core.data.IPMRecord record} can be
	 * further edited.
	 *
	 * @param {Grommunio.task.TaskContextModel} model Context Model object that will be used
	 * to {@link Grommunio.task.TaskContextModel#createRecord create} the Task.
	 * @param {Object} config (optional) Configuration object used to create
	 * the Content Panel.
	 */
	openCreateTaskContent: function(model, config)
	{
		var record = model.createRecord();
		Grommunio.core.data.UIFactory.openCreateRecord(record, config);
	},

	/**
	 * Open a Panel in which a new {@link Grommunio.core.data.IPMRecord record} can be
	 * further edited.
	 *
	 * @param {Grommunio.task.TaskContextModel} model Context Model object that will be used
	 * to {@link Grommunio.task.TaskContextModel#createRecord create} the Task.
	 * @param {Object} config (optional) Configuration object used to create
	 * the Content Panel.
	 */
	openCreateTaskRequestContent: function(model, config)
	{
		var record = model.createRecord();
		record.convertToTaskRequest();
		Grommunio.core.data.UIFactory.openCreateRecord(record, config);
	},

	/**
	 * Converts record to an task and calls {@link Grommunio.core.data.UIFactory.openCreateRecord}
	 * to open the newly created task as editable record. The original record isn't removed.
	 *
	 * @param {Grommunio.core.data.IPMRecord} records The record which will be converted to a task
	 * @param {Grommunio.task.TaskContextModel} model Used to create a new task record
	 */
	createTaskFromMail: function(records, model)
	{
		var record;

		if (Array.isArray(records) && !Ext.isEmpty(records)) {
			record = records[0];
		} else {
			return;
		}

		if (record.isOpened()) {
			var newTaskRecord = record.convertToTask(model.getDefaultFolder());
			Grommunio.core.data.UIFactory.openCreateRecord(newTaskRecord);
		} else {
			// If record is not opened, then we need to reopen it to get the body. (For example when the selected records store reloads)
			record.getStore().on('open', this.openHandler.createDelegate(this, [model], 2), this, {single: true});
			record.open();
		}
	},

	/**
	 * Handler for {@link Grommunio.core.data.IPMStore store} open event. Converts the opened record
	 * to a task and opens it as editable record.
	 *
	 * @param {Grommunio.core.data.IPMStore} store The store of the record.
	 * @param {Grommunio.core.data.IPMRecord} record The record which will be converted to a task
	 * @param {Grommunio.task.TaskContextModel} model Used to create a new task record
	 */
	openHandler: function(store, record, model)
	{
		var newTaskRecord = record.convertToTask(model.getDefaultFolder());
		Grommunio.core.data.UIFactory.openCreateRecord(newTaskRecord);
	},

	/**
	 * Opens a {@link Grommunio.task.dialogs.SendTaskRequestConfirmationContentPanel}.
	 *
	 * @param {Grommunio.task.TaskRecord} record The record, or records, for which the task confirmation will be sent.
	 * @param {Object} config (optional) Configuration object used to create the ContentPanel
	 */
	openSendConfirmationContent: function(record, config)
	{
		config = Ext.applyIf(config || {}, {
			record: record,
			modal: true
		});
		var componentType = Grommunio.core.data.SharedComponentType['task.dialogs.sendtaskrequestconfirmation'];
		Grommunio.core.data.UIFactory.openLayerComponent(componentType, record, config);
	},

	/**
	 * Opens a {@link Grommunio.addressbook.dialogs.ABMultiUserSelectionContentPanel ABMultiUserSelectionContentPanel}
	 * for configuring the recipient of the given {@link Grommunio.core.data.IPMRecord records}.
	 *
	 * @param {Grommunio.core.data.IPMRecord} records The record, or records for which the recipient
	 * must be configured
	 * @param {Object} config (optional) Configuration object used to create
	 * the Content Panel.
	 */
	openRecipientSelectionContent: function(records, config)
	{
		if (Ext.isArray(records) && !Ext.isEmpty(records)) {
			records = records[0];
		}

		// Create a copy of the record, we don't want the changes
		// to be activated until the user presses the Ok button.
		var copy = records.copy();
		var store = copy.getSubStore('recipients');

		Grommunio.common.Actions.openABUserMultiSelectionContent({
			callback: function() {
				records.applyData(copy);
			},
			convert: function(user, field) {
				return user.convertToRecipient(field ? field.defaultRecipientType : config.defaultRecipientType);
			},
			store: store,
			selectionCfg: [{
				xtype: 'grommunio.recipientfield',
				fieldLabel: Grommunio.util.Translations.Label(_('To')),
				boxStore: store,
				filterRecipientType: Grommunio.core.mapi.RecipientType.MAPI_TO,
				defaultRecipientType: Grommunio.core.mapi.RecipientType.MAPI_TO,
				flex: 1
			}]
		});
	},

	/**
	 * Marks the given tasks complete or incomplete and saves them. Assigned
	 * tasks owned by someone else get a warning that the assignee overwrites
	 * the change.
	 *
	 * @param {Grommunio.core.data.IPMRecord/Array} records The task(s) to change
	 * @param {Boolean} complete True to mark complete, false to mark incomplete
	 */
	markComplete: function(records, complete)
	{
		records = Array.isArray(records) ? records : [ records ];
		if (Ext.isEmpty(records)) {
			return;
		}

		var warningCount = 0;
		Ext.each(records, function(record) {
			record.beginEdit();
			record.set('complete', complete);
			record.set('percent_complete', complete);
			record.set('status', complete ? Grommunio.core.mapi.TaskStatus.COMPLETE : Grommunio.core.mapi.TaskStatus.NOT_STARTED);
			record.set('date_completed', complete ? new Date() : null);
			record.set('flag_icon', complete ? Grommunio.core.mapi.FlagIcon.clear : Grommunio.core.mapi.FlagIcon.red);
			record.set('flag_complete_time', complete ? new Date() : null);
			record.set('flag_request', complete ? '' : 'Follow up');
			record.set('flag_status', complete ? Grommunio.core.mapi.FlagStatus.completed : Grommunio.core.mapi.FlagStatus.flagged);
			record.endEdit();

			if (!record.isNormalTask()) {
				if (!record.isTaskOwner() && !record.isTaskRequest()) {
					warningCount++;
				} else {
					record.addMessageAction('response_type', Grommunio.core.mapi.TaskMode.UPDATE);
				}
			}
		});

		if (warningCount > 0) {
			Ext.MessageBox.show({
				title: _('Changes to assigned task'),
				msg: ngettext('Please note that the assigned task will be overwritten when the assignee makes changes.', 'Please note that the assigned tasks will be overwritten when the assignee makes changes.', warningCount),
				buttons: Ext.MessageBox.OK
			});
		}
		records[0].getStore().save();
	},

	/**
	 * Deletes all passed {@link Grommunio.core.data.IPMRecord records}. A
	 * {@link Grommunio.common.dialogs.MessageBox.show MessageBox} will be shown to explain that the records will be
	 * deleted from their original folder.
	 *
	 * @param {Array} records The array of {@link Grommunio.core.data.IPMRecord records} that must be deleted.
	 */
	deleteRecordsFromTodoList: function(records)
	{
		// It would be nice if we could use the state functionality for this, but the MessageBox is not an
		// Ext.Component and this context menu is already gone when the MessageBox is displayed, so this is
		// not possible.
		var settingsKey = 'grommunio/v1/contexts/task/todolist/dialogs/delete_item_confirmation/disabled';
		var disableDeleteConfirmationDialog = container.getSettingsModel().get(settingsKey) === true;

		if ( disableDeleteConfirmationDialog ){
			Grommunio.common.Actions.doDeleteRecords(records);
			return;
		}

		Grommunio.common.dialogs.MessageBox.addCustomButtons({
			title: _('Delete confirmation'),
			minWidth: 351,
			customButton: [{
				text: _('Delete'),
				name: 'delete'
			}, {
				text: _('Cancel'),
				name: 'cancel'
			}],
			checkbox: true,
			fn: function(btnId, text, checked){
				if ( btnId !== 'delete' ){
					return;
				}

				container.getSettingsModel().set(settingsKey, checked);
				Grommunio.common.Actions.doDeleteRecords(records);
			},
			msg: ngettext('Deleting the item will also delete the original item.', 'Deleting the items will also delete the original items.', records.length) + '<br />' + ngettext('Do you want to delete the item?', 'Do you want to delete the items?', records.length)
		});
	},

	/**
	 * Opens the task options dialog for the given record.
	 *
	 * @param {Grommunio.core.data.IPMRecord|Grommunio.core.data.IPMRecord[]} records
	 * The record(s) for which the options are requested.
	 * @param {Object} config (optional) Configuration object used to create the Content Panel.
	 */
	openOptionsContent: function(records, config)
	{
		if (Array.isArray(records)) {
			records = records[0];
		}

		if (!records) {
			return;
		}

		config = Ext.applyIf(config || {}, {
			modal: true
		});

		var componentType = Grommunio.core.data.SharedComponentType['task.dialog.options'];
		Grommunio.core.data.UIFactory.openLayerComponent(componentType, records, config);
	},

	/**
	 * Opens the {@link Grommunio.task.ui.TaskFlagsMenu FlagsMenu} for
	 * the given {@link Grommunio.core.data.IPMRecord records}.
	 *
	 * @param {Grommunio.task.TaskRecord} records The record, or records for which the flags
	 * menu will be shown.
	 * @param {Object} options An Object Which contains configuration options to
	 * open {@link Grommunio.task.ui.TaskFlagsMenu FlagsMenu}.
	 */
	openFlagsMenu: function(records, options)
	{
		if (!Ext.isArray(records)) {
			records = [ records ];
		}

		var component = Grommunio.core.data.SharedComponentType['task.contextmenu.flags'];
		Grommunio.core.data.UIFactory.openContextMenu(component, records, options);
	}
};
