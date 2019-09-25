Ext.namespace('Zarafa.core.data');

/**
 * @class Zarafa.core.data.JsonAttachmentReader
 * @extends Zarafa.core.data.JsonReader
 */
Zarafa.core.data.JsonAttachmentReader = Ext.extend(Zarafa.core.data.JsonReader, {
	/**
	 * @constructor
	 * @param {Object} meta Metadata configuration options.
	 * @param {Object} recordType (optional) Optional Record type matches the type
	 * which must be read from response. If no type is given, it will use the
	 * record type for the {@link Zarafa.core.mapi.ObjectType#MAPI_ATTACH}.
	 */
	constructor : function(meta, recordType)
	{
		meta = Ext.applyIf(meta || {}, {
			id : 'attach_id',
			idProperty : 'attach_id'
		});

		// If no recordType is provided, force the type to be an attachment
		if (!Ext.isDefined(recordType)) {
			recordType = Zarafa.core.data.RecordFactory.getRecordClassByObjectType(Zarafa.core.mapi.ObjectType.MAPI_ATTACH);
		}

		Zarafa.core.data.JsonAttachmentReader.superclass.constructor.call(this, meta, recordType);
	}
});
