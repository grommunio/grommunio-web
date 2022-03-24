Ext.namespace('Zarafa.plugins.files.data');

/**
 * @class Zarafa.plugins.files.data.FilesJsonReader
 * @extends Zarafa.core.data.JsonReader
 */
Zarafa.plugins.files.data.FilesJsonReader = Ext.extend(Zarafa.core.data.JsonReader, {
	/**
	 * @cfg {Zarafa.core.data.RecordCustomObjectType} customObjectType The custom object type
	 * which represents the {@link Ext.data.Record records} which should be created using
	 * {@link Zarafa.core.data.RecordFactory#createRecordObjectByCustomType}.
	 */
	customObjectType : Zarafa.core.data.RecordCustomObjectType.FILES_FOLDER_STORE,

	/**
	 * @constructor
	 * @param {Object} meta Metadata configuration options.
	 * @param {Object} recordType (optional) Optional Record type matches the type
	 * which must be read from response. If no type is given, it will use the
	 * record type for the {@link Zarafa.core.data.RecordCustomObjectType#FILES_FOLDER_STORE}.
	 */
	constructor : function(meta, recordType)
	{
		meta = Ext.applyIf(meta || {}, {
			dynamicRecord : false,
			id : 'store_entryid',
			idProperty : 'store_entryid',
			customObjectType : meta.customObjectType || Zarafa.core.data.RecordCustomObjectType.FILES_FOLDER_STORE
		});

		// If no recordType is provided, force the type to be a Distlist Member
		if (!Ext.isDefined(recordType)) {
			recordType = Zarafa.core.data.RecordFactory.getRecordClassByCustomType(meta.customObjectType);
		}

		Zarafa.plugins.files.data.FilesJsonReader.superclass.constructor.call(this, meta, recordType);
	}
});
