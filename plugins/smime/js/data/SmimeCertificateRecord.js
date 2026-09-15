Ext.namespace('Grommunio.plugins.smime.data');

/**
 * @class Grommunio.plugins.smime.data.SmimeCertificateRecordFields
 * Array of {@link Ext.data.Field field} configurations for the
 * {@link Grommunio.plugins.smime.data.SmimeCertificateRecord} object.
 */
Grommunio.plugins.smime.data.SmimeCertificateRecordFields = [
	{name: 'entryid', type: 'string'},
	{name: 'type', type: 'string'}, // Public or Private
	{name: 'issued_by', type: 'string'},
	{name: 'issued_to', type: 'string'},
	{name: 'serial', type: 'string'},
	{name: 'email', type: 'string', defaultValue: ''},
	{name: 'validto', type: 'date', dateFormat: 'timestamp', defaultValue: null},
	{name: 'validfrom', type: 'date', dateFormat: 'timestamp', defaultValue: null},
	{name: 'fingerprint_sha1', type: 'string'},
	{name: 'fingerprint_md5', type: 'string'},
	{name: 'key_type', type: 'string', defaultValue: 'unknown'},
	{name: 'key_bits', type: 'int', defaultValue: 0},
	{name: 'curve_name', type: 'string', defaultValue: ''},
	{name: 'purpose', type: 'string', defaultValue: 'both'}
];

/**
 * @class Grommunio.plugins.smime.data.SmimeCertificateRecord
 * @extends Grommunio.core.data.IPMRecord
 *
 * An extension to the {@link Grommunio.core.data.IPMRecord}.
 */
Grommunio.plugins.smime.data.SmimeCertificateRecord = Ext.extend(Grommunio.core.data.IPMRecord, {});

Grommunio.core.data.RecordCustomObjectType.addProperty('GROMMUNIO_SMIME');
Grommunio.core.data.RecordFactory.addFieldToCustomType(Grommunio.core.data.RecordCustomObjectType.GROMMUNIO_SMIME, Grommunio.plugins.smime.data.SmimeCertificateRecordFields);
Grommunio.core.data.RecordFactory.addFieldToCustomType(Grommunio.core.data.RecordCustomObjectType.MAPI_SMIME_ATTACH, Grommunio.core.data.IPMRecordFields);
Grommunio.core.data.RecordFactory.setSubStoreToCustomType(Grommunio.core.data.RecordCustomObjectType.GROMMUNIO_SMIME, 'attachments', Grommunio.plugins.smime.data.SmimeAttachmentStore);
Grommunio.core.data.RecordFactory.addListenerToCustomType(Grommunio.core.data.RecordCustomObjectType.GROMMUNIO_SMIME, 'createphantom', function(record)
{
	// Phantom records must always be marked as opened (they contain the full set of data)
	record.afterOpen();
});

Grommunio.core.data.RecordFactory.setBaseClassToCustomType(Grommunio.core.data.RecordCustomObjectType.GROMMUNIO_SMIME, Grommunio.plugins.smime.data.SmimeCertificateRecord);
