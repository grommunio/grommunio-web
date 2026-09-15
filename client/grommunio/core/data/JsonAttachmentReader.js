Ext.namespace('Grommunio.core.data');

/**
 * @class Grommunio.core.data.JsonAttachmentReader
 * @extends Grommunio.core.data.JsonReader
 */
Grommunio.core.data.JsonAttachmentReader = Ext.extend(Grommunio.core.data.JsonReader, {
	/**
	 * @constructor
	 * @param {Object} meta Metadata configuration options.
	 * @param {Object} recordType (optional) Optional Record type matches the type
	 * which must be read from response. If no type is given, it will use the
	 * record type for the {@link Grommunio.core.mapi.ObjectType#MAPI_ATTACH}.
	 */
	constructor: function(meta, recordType)
	{
		meta = Ext.applyIf(meta || {}, {
			id: 'attach_id',
			idProperty: 'attach_id'
		});

		// If no recordType is provided, force the type to be an attachment
		if (!Ext.isDefined(recordType)) {
			recordType = Grommunio.core.data.RecordFactory.getRecordClassByObjectType(Grommunio.core.mapi.ObjectType.MAPI_ATTACH);
		}

		Grommunio.core.data.JsonAttachmentReader.superclass.constructor.call(this, meta, recordType);
	}
});
