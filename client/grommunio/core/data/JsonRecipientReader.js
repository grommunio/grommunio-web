/*
 * #dependsFile client/grommunio/core/data/RecordCustomObjectType.js
 */
Ext.namespace('Grommunio.core.data');

/**
 * @class Grommunio.core.data.JsonRecipientReader
 * @extends Grommunio.core.data.JsonReader
 */
Grommunio.core.data.JsonRecipientReader = Ext.extend(Grommunio.core.data.JsonReader, {
	/**
	 * @cfg {Grommunio.core.data.RecordCustomObjectType} customObjectType The custom object type
	 * which represents the {@link Ext.data.Record records} which should be created using
	 * {@link Grommunio.core.data.RecordFactory#createRecordObjectByCustomType}.
	 */
	customObjectType: Grommunio.core.data.RecordCustomObjectType.GROMMUNIO_RECIPIENT,

	/**
	 * @constructor
	 * @param {Object} meta Metadata configuration options.
	 * @param {Object} recordType (optional) Optional Record type matches the type
	 * which must be read from response. If no type is given, it will use the
	 * record type for the {@link Grommunio.core.data.RecordCustomObjectType#GROMMUNIO_RECIPIENT}.
	 */
	constructor: function(meta, recordType)
	{
		meta = Ext.applyIf(meta || {}, {
			id: 'rowid',
			idProperty: 'rowid',
			dynamicRecord: false
		});

		// If no recordType is provided, force the type to be a recipient
		if (!Ext.isDefined(recordType)) {
			recordType = Grommunio.core.data.RecordFactory.getRecordClassByCustomType(meta.customObjectType || this.customObjectType);
		}

		Grommunio.core.data.JsonRecipientReader.superclass.constructor.call(this, meta, recordType);
	}
});
