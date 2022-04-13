Ext.namespace('Zarafa.plugins.smime.data');

/**
 * @class Zarafa.plugins.smime.data.SmimeCertificateRecordFields
 * Array of {@link Ext.data.Field field} configurations for the
 * {@link Zarafa.plugins.smime.data.SmimeCertificateRecord} object.
 */
Zarafa.plugins.smime.data.SmimeCertificateRecordFields = [
	{name: 'entryid', type: 'string'},
	{name: 'type', type: 'string'}, // Public or Private
	{name: 'issued_by', type: 'string'},
	{name: 'issued_to', type: 'string'},
	{name: 'serial', type: 'string'},
	{name: 'email', type: 'string', defaultValue: ''},
	{name: 'validto', type: 'date', dateFormat: 'timestamp', defaultValue: null},
	{name: 'validfrom', type: 'date', dateFormat: 'timestamp', defaultValue: null},
	{name: 'fingerprint_sha1', type: 'string'},
	{name: 'fingerprint_md5', type: 'string'}
];

/**
 * @class Zarafa.plugins.smime.data.SmimeCertificateRecord
 * @extends Zarafa.core.data.IPMRecord
 *
 * An extension to the {@link Zarafa.core.data.IPMRecord}.
 */
Zarafa.plugins.smime.data.SmimeCertificateRecord = Ext.extend(Zarafa.core.data.IPMRecord, {});

Zarafa.core.data.RecordCustomObjectType.addProperty('ZARAFA_SMIME');
Zarafa.core.data.RecordFactory.addFieldToCustomType(Zarafa.core.data.RecordCustomObjectType.ZARAFA_SMIME, Zarafa.plugins.smime.data.SmimeCertificateRecordFields);
Zarafa.core.data.RecordFactory.addFieldToCustomType(Zarafa.core.data.RecordCustomObjectType.MAPI_SMIME_ATTACH, Zarafa.core.data.IPMRecordFields);
Zarafa.core.data.RecordFactory.setSubStoreToCustomType(Zarafa.core.data.RecordCustomObjectType.ZARAFA_SMIME, 'attachments', Zarafa.plugins.smime.data.SmimeAttachmentStore);
Zarafa.core.data.RecordFactory.addListenerToCustomType(Zarafa.core.data.RecordCustomObjectType.ZARAFA_SMIME, 'createphantom', function(record)
{
	// Phantom records must always be marked as opened (they contain the full set of data)
	record.afterOpen();
});

Zarafa.core.data.RecordFactory.setBaseClassToCustomType(Zarafa.core.data.RecordCustomObjectType.ZARAFA_SMIME, Zarafa.plugins.smime.data.SmimeCertificateRecord);
