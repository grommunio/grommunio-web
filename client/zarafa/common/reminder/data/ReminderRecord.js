/*
 * #dependsFile client/zarafa/core/mapi/ObjectType.js
 * #dependsFile client/zarafa/core/data/RecordCustomObjectType.js
 * #dependsFile client/zarafa/core/data/RecordFactory.js
 */
Ext.namespace('Zarafa.common.reminder.data');

/**
 * @class Zarafa.common.reminder.data.ReminderRecord
 *
 * Array of default fields for the {@link Zarafa.common.reminder.data.ReminderRecord} object.
 * These fields will always be added, regardless of the exact type of
 * {@link Zarafa.common.reminder.data.ReminderRecord record}.
 */
Zarafa.common.reminder.data.ReminderRecordFields = [
	{name: 'entryid'},
	{name: 'store_entryid'},
	{name: 'parent_entryid'},
	{name: 'message_flags'},
	{name: 'message_class'},
	{name: 'icon_index'},
	{name: 'subject'},
	{name: 'object_type', type: 'int', defaultValue: Zarafa.core.mapi.ObjectType.MAPI_MESSAGE},
	{name: 'location'},

	{name: 'reminder', type: 'boolean'},
	{name: 'reminder_minutes', type: 'int'},
	{name: 'reminder_time', type: 'date', dateFormat: 'timestamp', defaultValue: null},
	{name: 'flagdueby', type: 'date', dateFormat: 'timestamp', defaultValue: null},
	
	{name: 'task_duedate', type: 'date', dateFormat: 'timestamp', defaultValue: null},
	{name: 'task_startdate', type: 'date', dateFormat: 'timestamp', defaultValue: null},
	{name: 'task_resetreminder'},
	{name: 'task_recurring'},

	{name: 'appointment_recurring'},
	{name: 'appointment_startdate', type: 'date', dateFormat: 'timestamp', defaultValue: null},
	{name: 'appointment_enddate', type: 'date', dateFormat: 'timestamp', defaultValue: null},
	{name: 'appointment_startdate_recurring'},
	{name: 'appointment_enddate_recurring'}
];

/**
 * @class Zarafa.common.reminder.data.ReminderRecord
 * @extends Zarafa.core.data.MAPIRecord
 */
Zarafa.common.reminder.data.ReminderRecord = Ext.extend(Zarafa.core.data.MAPIRecord, {
	/**
	 * Create a new {@link Zarafa.core.data.IPMRecord IPMRecord}. This record can be used to get all the properties
	 * of appointment/task/mail associated with this {@link Zarafa.common.reminder.data.ReminderRecord ReminderRecord}.
	 * @return {Zarafa.core.data.IPMRecord} record which can be used to open appointment/task/mail dialogs.
	 */
	convertToIPMRecord : function()
	{
		var entryId = this.get('entryid');
		var messageClass = this.get('message_class');
		var props = {};

		if (Zarafa.core.MessageClass.isClass(messageClass, 'IPM.Appointment', true)) {
			props = {
				recurring: this.get('appointment_recurring'),
				startdate: this.get('appointment_startdate'),
				duedate: this.get('appointment_enddate'),
				startdate_recurring: this.get('appointment_startdate_recurring'),
				enddate_recurring: this.get('appointment_enddate_recurring')
			};
		} else if (Zarafa.core.MessageClass.isClass(messageClass, 'IPM.Task', true)) {
			props = {
				startdate: this.get('task_startdate'),
				duedate: this.get('task_duedate')
			};
		} else if (Zarafa.core.MessageClass.isClass(messageClass, 'IPM.Contact', true)) {
			Ext.MessageBox.alert(_('Info'), _('Not supported at the moment.'));
			return false;
		}

		// Copy all common properties
		Ext.applyIf(props, {
			entryid : entryId,
			parent_entryid : this.get('parent_entryid'),
			store_entryid : this.get('store_entryid'),
			object_type : this.get('object_type'),
			message_class : messageClass,

			message_flags : this.get('message_flags'),
			subject : this.get('subject'),
			location : this.get('location'),
			icon_index : this.get('icon_index'),

			reminder : this.get('reminder'),
			reminder_minutes : this.get('reminder_minutes'),
			reminder_time : this.get('reminder_time'),
			flagdueby : this.get('flagdueby')
		});

		var record = Zarafa.core.data.RecordFactory.createRecordObjectByRecordData(props, entryId);

		// For mail record it's require a store to perform mark as read while opening the record.
		if (Zarafa.core.MessageClass.isClass(messageClass, 'IPM.Note', true)) {
			Ext.copyTo(record, this, 'store');
		}

		return record;
	}
});

// Register a custom type to be used by the Record Factory
Zarafa.core.data.RecordCustomObjectType.addProperty('ZARAFA_REMINDER');

Zarafa.core.data.RecordFactory.setBaseClassToCustomType(Zarafa.core.data.RecordCustomObjectType.ZARAFA_REMINDER, Zarafa.common.reminder.data.ReminderRecord);
Zarafa.core.data.RecordFactory.addFieldToCustomType(Zarafa.core.data.RecordCustomObjectType.ZARAFA_REMINDER , Zarafa.common.reminder.data.ReminderRecordFields);
