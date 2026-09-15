/*
 * SPDX-FileCopyrightText: Copyright 2020 - 2026 grommunio GmbH
 * SPDX-FileCopyrightText: Copyright 2016 Kopano and its licensors
 * SPDX-FileCopyrightText: Copyright 2005 - 2016 Zarafa B.V. and its licensors
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

/*
 * #dependsFile client/grommunio/core/mapi/ObjectType.js
 * #dependsFile client/grommunio/core/data/RecordCustomObjectType.js
 * #dependsFile client/grommunio/core/data/RecordFactory.js
 */
Ext.namespace('Grommunio.common.reminder.data');

/**
 * @class Grommunio.common.reminder.data.ReminderRecord
 *
 * Array of default fields for the {@link Grommunio.common.reminder.data.ReminderRecord} object.
 * These fields will always be added, regardless of the exact type of
 * {@link Grommunio.common.reminder.data.ReminderRecord record}.
 */
Grommunio.common.reminder.data.ReminderRecordFields = [
	{name: 'entryid'},
	{name: 'store_entryid'},
	{name: 'parent_entryid'},
	{name: 'message_flags'},
	{name: 'message_class'},
	{name: 'icon_index'},
	{name: 'subject'},
	{name: 'object_type', type: 'int', defaultValue: Grommunio.core.mapi.ObjectType.MAPI_MESSAGE},
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
 * @class Grommunio.common.reminder.data.ReminderRecord
 * @extends Grommunio.core.data.MAPIRecord
 */
Grommunio.common.reminder.data.ReminderRecord = Ext.extend(Grommunio.core.data.MAPIRecord, {
	/**
	 * Create a new {@link Grommunio.core.data.IPMRecord IPMRecord}. This record can be used to get all the properties
	 * of appointment/task/mail associated with this {@link Grommunio.common.reminder.data.ReminderRecord ReminderRecord}.
	 * @return {Grommunio.core.data.IPMRecord} record which can be used to open appointment/task/mail dialogs.
	 */
	convertToIPMRecord: function()
	{
		var entryId = this.get('entryid');
		var messageClass = this.get('message_class');
		var props = {};

		if (Grommunio.core.MessageClass.isClass(messageClass, 'IPM.Appointment', true)) {
			props = {
				recurring: this.get('appointment_recurring'),
				startdate: this.get('appointment_startdate'),
				duedate: this.get('appointment_enddate'),
				startdate_recurring: this.get('appointment_startdate_recurring'),
				enddate_recurring: this.get('appointment_enddate_recurring')
			};
		} else if (Grommunio.core.MessageClass.isClass(messageClass, 'IPM.Task', true)) {
			props = {
				startdate: this.get('task_startdate'),
				duedate: this.get('task_duedate')
			};
		} else if (Grommunio.core.MessageClass.isClass(messageClass, 'IPM.Contact', true)) {
			Ext.MessageBox.alert(_('Info'), _('Not supported at the moment.'));
			return false;
		}

		// Copy all common properties
		Ext.applyIf(props, {
			entryid: entryId,
			parent_entryid: this.get('parent_entryid'),
			store_entryid: this.get('store_entryid'),
			object_type: this.get('object_type'),
			message_class: messageClass,

			message_flags: this.get('message_flags'),
			subject: this.get('subject'),
			location: this.get('location'),
			icon_index: this.get('icon_index'),

			reminder: this.get('reminder'),
			reminder_minutes: this.get('reminder_minutes'),
			reminder_time: this.get('reminder_time'),
			flagdueby: this.get('flagdueby')
		});

		var record = Grommunio.core.data.RecordFactory.createRecordObjectByRecordData(props, entryId);

		// For mail record it's require a store to perform mark as read while opening the record.
		if (Grommunio.core.MessageClass.isClass(messageClass, 'IPM.Note', true)) {
			Ext.copyTo(record, this, 'store');
		}

		return record;
	}
});

// Register a custom type to be used by the Record Factory
Grommunio.core.data.RecordCustomObjectType.addProperty('GROMMUNIO_REMINDER');

Grommunio.core.data.RecordFactory.setBaseClassToCustomType(Grommunio.core.data.RecordCustomObjectType.GROMMUNIO_REMINDER, Grommunio.common.reminder.data.ReminderRecord);
Grommunio.core.data.RecordFactory.addFieldToCustomType(Grommunio.core.data.RecordCustomObjectType.GROMMUNIO_REMINDER , Grommunio.common.reminder.data.ReminderRecordFields);
