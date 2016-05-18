/*
 * #dependsFile client/zarafa/core/data/RecordCustomObjectType.js
 */
Ext.namespace('Zarafa.core.data');

/**
 * @class Zarafa.core.data.JsonRecipientReader
 * @extends Zarafa.core.data.JsonReader
 */
Zarafa.core.data.JsonRecipientReader = Ext.extend(Zarafa.core.data.JsonReader, {
	/**
	 * @cfg {Zarafa.core.data.RecordCustomObjectType} customObjectType The custom object type
	 * which represents the {@link Ext.data.Record records} which should be created using
	 * {@link Zarafa.core.data.RecordFactory#createRecordObjectByCustomType}.
	 */
	customObjectType : Zarafa.core.data.RecordCustomObjectType.ZARAFA_RECIPIENT,

	/**
	 * @constructor
	 * @param {Object} meta Metadata configuration options.
	 * @param {Object} recordType (optional) Optional Record type matches the type
	 * which must be read from response. If no type is given, it will use the
	 * record type for the {@link Zarafa.core.data.RecordCustomObjectType#ZARAFA_RECIPIENT}.
	 */
	constructor : function(meta, recordType)
	{
		meta = Ext.applyIf(meta || {}, {
			id : 'rowid',
			idProperty : 'rowid',
			dynamicRecord : false
		});

		// If no recordType is provided, force the type to be a recipient
		if (!Ext.isDefined(recordType)) {
			recordType = Zarafa.core.data.RecordFactory.getRecordClassByCustomType(meta.customObjectType || this.customObjectType);
		}

		Zarafa.core.data.JsonRecipientReader.superclass.constructor.call(this, meta, recordType);
	}
});
