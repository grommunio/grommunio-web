/*
 * #dependsFile client/zarafa/core/data/RecordFactory.js
 * #dependsFile client/zarafa/core/data/MessageRecord.js
 */
Ext.namespace('Zarafa.task');

/**
 * @class Zarafa.task.TaskRecordFields
 * Array of {@link Ext.data.Field field} configurations for the
 * {@link Zarafa.core.data.IPMRecord IPMRecord} object.
 * These fields will be available in all 'IPM.Task' type messages.
 */
Zarafa.task.TaskRecordFields = [
	{name: 'importance', type: 'int', defaultValue: Zarafa.core.mapi.Importance.NORMAL},
	{name: 'message_flags', type: 'int', defaultValue: Zarafa.core.mapi.MessageFlags.MSGFLAG_READ},
	{name: 'last_modification_time', type: 'date', dateFormat: 'timestamp', defaultValue: null},
	{name: 'recurring', type: 'boolean'},
	{name: 'startdate', type: 'date', dateFormat: 'timestamp', defaultValue: null},
	{name: 'duedate', type: 'date', dateFormat: 'timestamp', defaultValue: null},
	{name: 'commonstart', type: 'date', dateFormat: 'timestamp', defaultValue: null},
	{name: 'commonend', type: 'date', dateFormat: 'timestamp', defaultValue: null},
	{name: 'taskstate', type: 'int', defaultValue: Zarafa.core.mapi.TaskState.NORMAL},
	{name: 'taskmode', type: 'int', defaultValue: Zarafa.core.mapi.TaskMode.NOTHING},
	{name: 'tasksoc',  type: 'boolean', defaultValue: true},
	{name: 'taskupdates',  type: 'boolean', defaultValue: true},
	{name: 'reminder', type: 'boolean', defaultValue: false},
	{name: 'reminderdate', type: 'date', dateFormat: 'timestamp', defaultValue: null},
	{name: 'owner'},
	{name: 'status', type: 'int', defaultValue: Zarafa.core.mapi.TaskStatus.NOT_STARTED},
	{name: 'percent_complete', type: 'float', defaultValue: 0},
	{name: 'complete', type: 'boolean', defaultValue: false},
	{name: 'sensitivity', type: 'int', defaultValue: Zarafa.core.mapi.Sensitivity.NONE},
	{name: 'private', type: 'boolean', defaultValue: false},
	{name: 'totalwork', type: 'int', defaultValue: 0},
	{name: 'actualwork', type: 'int', defaultValue: 0},
	{name: 'mileage'},
	{name: 'billing_information'},
	{name: 'companies'},
	{name: 'date_completed', type: 'date', dateFormat: 'timestamp', defaultValue: null},
	{name: 'reminder', type: 'boolean', defaultValue: false},
	{name: 'reminder_time', type: 'date', dateFormat: 'timestamp', defaultValue: null},
	{name: 'flagdueby', type: 'date', dateFormat: 'timestamp', defaultValue: null}
];

Zarafa.core.data.RecordFactory.addFieldToMessageClass('IPM.Task', Zarafa.task.TaskRecordFields);

Zarafa.core.data.RecordFactory.addFieldToMessageClass('IPM.TaskRequest', Zarafa.task.TaskRecordFields);
Zarafa.core.data.RecordFactory.addFieldToMessageClass('IPM.TaskRequest', Zarafa.core.data.MessageRecordFields);
Zarafa.core.data.RecordFactory.addListenerToMessageClass('IPM.TaskRequest', 'createphantom', Zarafa.core.data.MessageRecordPhantomHandler);

Zarafa.core.data.RecordFactory.addListenerToMessageClass('IPM.Task', 'createphantom', function(record, data) {
	record.beginEdit();

	if (!data || !Ext.isDefined(data.reminder)) {
		var reminder = false;
		var store = container.getHierarchyStore().getById(record.get('store_entryid'));
		if (!store || !store.isPublicStore()) {
			reminder = container.getSettingsModel().get('zarafa/v1/contexts/task/default_reminder');
		}
		record.set('reminder', reminder);
	}

	if (record.get('reminder')) {
		var time = new Date().clearTime().add(Date.MINUTE, container.getSettingsModel().get('zarafa/v1/contexts/task/default_reminder_time'));
		record.set('reminder_time', time);
	}

	record.endEdit();
});

Zarafa.core.data.RecordFactory.setBaseClassToMessageClass('IPM.Task', Zarafa.core.data.MessageRecord);
Zarafa.core.data.RecordFactory.setBaseClassToMessageClass('IPM.TaskRequest', Zarafa.core.data.MessageRecord);

