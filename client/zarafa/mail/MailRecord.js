/*
 * #dependsFile client/zarafa/core/data/RecordFactory.js
 * #dependsFile client/zarafa/core/data/MessageRecord.js
 */
Ext.namespace('Zarafa.mail');

/**
 * @class Zarafa.mail.MailRecordFields
 * Array of {@link Ext.data.Field field} configurations for the
 * {@link Zarafa.core.data.IPMRecord IPMRecord} object.
 * These fields will be available in all 'IPM.Note' type messages.
 */
Zarafa.mail.MailRecordFields = [
	{name: 'importance', type: 'int', defaultValue: Zarafa.core.mapi.Importance.NORMAL},
	{name: 'private', type: 'boolean', defaultValue: false},
	{name: 'sensitivity', type: 'int', defaultValue: Zarafa.core.mapi.Sensitivity.NONE},
	{name: 'flag_status'},
	{name: 'flag_icon'},
	{name: 'reply_time', type: 'date', dateFormat: 'timestamp', defaultValue: null},
	{name: 'reply_requested'},
	{name: 'response_requested'},
	{name: 'source_message_info'},
	{name: 'reminder_set', type: 'boolean', defaultValue: false},
	{name: 'reminder_time', type:'date', dateFormat:'timestamp', defaultValue: null},
	{name: 'flag_request'},
	{name: 'flag_due_by', type:'date', dateFormat:'timestamp', defaultValue: null},
	{name: 'flag_complete_time', type:'date', dateFormat:'timestamp', defaultValue: null},
	{name: 'block_status', type: 'int', defaultValue: undefined},
	{name: 'stubbed', type: 'boolean', defaultValue: false}
];

Zarafa.mail.MailRecordPhantomHandler = function(record) {
	var readReceipt = container.getSettingsModel().get('zarafa/v1/contexts/mail/always_request_readreceipt');
	record.set('read_receipt_requested', readReceipt);
};

Zarafa.core.data.RecordFactory.addFieldToMessageClass('REPORT.IPM.Note', Zarafa.mail.MailRecordFields);
Zarafa.core.data.RecordFactory.addFieldToMessageClass('REPORT.IPM.Note', Zarafa.core.data.MessageRecordFields);
Zarafa.core.data.RecordFactory.setSubStoreToMessageClass('REPORT.IPM.Note', 'reply-to', Zarafa.core.data.IPMRecipientStore);

Zarafa.core.data.RecordFactory.addFieldToMessageClass('IPM.Note', Zarafa.mail.MailRecordFields);
Zarafa.core.data.RecordFactory.addFieldToMessageClass('IPM.Note', Zarafa.core.data.MessageRecordFields);
Zarafa.core.data.RecordFactory.setSubStoreToMessageClass('IPM.Note', 'reply-to', Zarafa.core.data.IPMRecipientStore);

Zarafa.core.data.RecordFactory.addFieldToMessageClass('IPM.Schedule', Zarafa.mail.MailRecordFields);

Zarafa.core.data.RecordFactory.addListenerToMessageClass('IPM.Note', 'createphantom', Zarafa.core.data.MessageRecordPhantomHandler);
Zarafa.core.data.RecordFactory.addListenerToMessageClass('IPM.Note', 'createphantom', Zarafa.mail.MailRecordPhantomHandler);

Zarafa.core.data.RecordFactory.addDefaultValueToMessageClass('IPM.Note', 'message_flags', Zarafa.core.mapi.MessageFlags.MSGFLAG_UNSENT);
Zarafa.core.data.RecordFactory.addDefaultValueToMessageClass('REPORT.IPM.Note', 'message_flags', Zarafa.core.mapi.MessageFlags.MSGFLAG_UNSENT);

Zarafa.core.data.RecordFactory.setBaseClassToMessageClass('REPORT.IPM.Note', Zarafa.core.data.MessageRecord);
Zarafa.core.data.RecordFactory.setBaseClassToMessageClass('IPM.Note', Zarafa.core.data.MessageRecord);
