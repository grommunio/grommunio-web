/*
 * SPDX-FileCopyrightText: Copyright 2020 - 2026 grommunio GmbH
 * SPDX-FileCopyrightText: Copyright 2016 Kopano and its licensors
 * SPDX-FileCopyrightText: Copyright 2005 - 2016 Zarafa B.V. and its licensors
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

/*
 * #dependsFile client/grommunio/core/data/RecordFactory.js
 * #dependsFile client/grommunio/core/data/MessageRecord.js
 */
Ext.namespace('Grommunio.mail');

/**
 * @class Grommunio.mail.MailRecordFields
 * Array of {@link Ext.data.Field field} configurations for the
 * {@link Grommunio.core.data.IPMRecord IPMRecord} object.
 * These fields will be available in all 'IPM.Note' type messages.
 */
Grommunio.mail.MailRecordFields = [
	{name: 'importance', type: 'int', defaultValue: Grommunio.core.mapi.Importance.NORMAL},
	{name: 'private', type: 'boolean', defaultValue: false},
	{name: 'sensitivity', type: 'int', defaultValue: Grommunio.core.mapi.Sensitivity.NONE},
	{name: 'flag_status'},
	{name: 'flag_icon'},
	{name: 'reply_time', type: 'date', dateFormat: 'timestamp', defaultValue: null},
	{name: 'reply_requested'},
	{name: 'response_requested'},
	{name: 'source_message_info'},
	{name: 'reminder', type: 'boolean', defaultValue: false},
	{name: 'reminder_time', type:'date', dateFormat:'timestamp', defaultValue: null},
	{name: 'flag_request'},
	{name: 'flag_due_by', type:'date', dateFormat:'timestamp', defaultValue: null},
	{name: 'flag_complete_time', type:'date', dateFormat:'timestamp', defaultValue: null},
	{name: 'complete', type: 'boolean', defaultValue: false},
	{name: 'task_status', type: 'int', defaultValue: Grommunio.core.mapi.TaskStatus.NOT_STARTED},
	{name: 'percent_complete', type: 'float', defaultValue: 0},
	{name: 'date_completed', type:'date', dateFormat:'timestamp', defaultValue: null},
	{name: 'block_status', type: 'int', defaultValue: undefined},
	{name: 'stubbed', type: 'boolean', defaultValue: false},
	{name: 'startdate', type: 'date', dateFormat: 'timestamp', defaultValue: null},
	{name: 'duedate', type: 'date', dateFormat: 'timestamp', defaultValue: null},
	{name: 'user_image', type: 'string'},
	{name: 'depth', type: 'int', defaultValue: 0},
	{name: 'conversation_count', type: 'int', defaultValue: 0},
	{name: 'conversation_id'},
	{name: 'folder_name'},
	{name: 'internet_message_id'}
];

Grommunio.mail.MailRecordPhantomHandler = function(record) {
	var readReceipt = container.getSettingsModel().get('grommunio/v1/contexts/mail/always_request_readreceipt');
	record.set('read_receipt_requested', readReceipt);
};

Grommunio.core.data.RecordFactory.addFieldToMessageClass('REPORT.IPM.Note', Grommunio.mail.MailRecordFields);
Grommunio.core.data.RecordFactory.addFieldToMessageClass('REPORT.IPM.Note', Grommunio.core.data.MessageRecordFields);
Grommunio.core.data.RecordFactory.setSubStoreToMessageClass('REPORT.IPM.Note', 'reply-to', Grommunio.core.data.IPMRecipientStore);

Grommunio.core.data.RecordFactory.addFieldToMessageClass('IPM.Note', Grommunio.mail.MailRecordFields);
Grommunio.core.data.RecordFactory.addFieldToMessageClass('IPM.Note', Grommunio.core.data.MessageRecordFields);
Grommunio.core.data.RecordFactory.setSubStoreToMessageClass('IPM.Note', 'reply-to', Grommunio.core.data.IPMRecipientStore);

Grommunio.core.data.RecordFactory.addFieldToMessageClass('IPM.Schedule', Grommunio.mail.MailRecordFields);

Grommunio.core.data.RecordFactory.addListenerToMessageClass('IPM.Note', 'createphantom', Grommunio.core.data.MessageRecordPhantomHandler);
Grommunio.core.data.RecordFactory.addListenerToMessageClass('IPM.Note', 'createphantom', Grommunio.mail.MailRecordPhantomHandler);

Grommunio.core.data.RecordFactory.addDefaultValueToMessageClass('IPM.Note', 'message_flags', Grommunio.core.mapi.MessageFlags.MSGFLAG_UNSENT);
Grommunio.core.data.RecordFactory.addDefaultValueToMessageClass('REPORT.IPM.Note', 'message_flags', Grommunio.core.mapi.MessageFlags.MSGFLAG_UNSENT);

Grommunio.core.data.RecordFactory.setBaseClassToMessageClass('REPORT.IPM.Note', Grommunio.core.data.MessageRecord);
Grommunio.core.data.RecordFactory.setBaseClassToMessageClass('IPM.Note', Grommunio.core.data.MessageRecord);
