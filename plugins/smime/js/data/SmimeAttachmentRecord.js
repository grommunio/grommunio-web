Ext.namespace('Zarafa.plugins.smime.data');

/**
 * @class Zarafa.plugins.smime.data.SmimeAttachmentRecordFields
 * Array of {@link Ext.data.Field field} configurations for the
 * {@link Zarafa.plugins.smime.data.SmimeAttachmentRecord} object.
 */
Zarafa.plugins.smime.data.SmimeAttachmentRecordFields = [
	{name: 'cert', type: 'boolean', defaultValue: false}, 
	{name: 'cert_message', type: 'string'},
	{name: 'cert_warning', type: 'string'}
];

Zarafa.core.data.RecordCustomObjectType.addProperty('ZARAFA_SMIME_ATTACHMENT');
Zarafa.core.data.RecordFactory.setBaseClassToCustomType(Zarafa.core.data.RecordCustomObjectType.ZARAFA_SMIME_ATTACHMENT, Zarafa.plugins.smime.data.SmimeAttachmentRecord);
Zarafa.core.data.RecordFactory.addFieldToCustomType(Zarafa.core.data.RecordCustomObjectType.ZARAFA_SMIME_ATTACHMENT, Zarafa.plugins.smime.data.SmimeAttachmentRecordFields);
Zarafa.core.data.RecordFactory.addFieldToCustomType(Zarafa.core.data.RecordCustomObjectType.ZARAFA_SMIME_ATTACHMENT, Zarafa.core.data.IPMAttachmentRecordFields);
