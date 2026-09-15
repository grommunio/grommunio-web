Ext.namespace('Grommunio.plugins.files.data');

/**
 * @class Grommunio.plugins.files.data.FilesJsonReader
 * @extends Grommunio.core.data.JsonReader
 */
Grommunio.plugins.files.data.FilesJsonReader = Ext.extend(Grommunio.core.data.JsonReader, {
	/**
	 * @cfg {Grommunio.core.data.RecordCustomObjectType} customObjectType The custom object type
	 * which represents the {@link Ext.data.Record records} which should be created using
	 * {@link Grommunio.core.data.RecordFactory#createRecordObjectByCustomType}.
	 */
	customObjectType : Grommunio.core.data.RecordCustomObjectType.FILES_FOLDER_STORE,

	/**
	 * @constructor
	 * @param {Object} meta Metadata configuration options.
	 * @param {Object} recordType (optional) Optional Record type matches the type
	 * which must be read from response. If no type is given, it will use the
	 * record type for the {@link Grommunio.core.data.RecordCustomObjectType#FILES_FOLDER_STORE}.
	 */
	constructor : function(meta, recordType)
	{
		meta = Ext.applyIf(meta || {}, {
			dynamicRecord : false,
			id : 'store_entryid',
			idProperty : 'store_entryid',
			customObjectType : meta.customObjectType || Grommunio.core.data.RecordCustomObjectType.FILES_FOLDER_STORE
		});

		// If no recordType is provided, force the type to be a Distlist Member
		if (!Ext.isDefined(recordType)) {
			recordType = Grommunio.core.data.RecordFactory.getRecordClassByCustomType(meta.customObjectType);
		}

		Grommunio.plugins.files.data.FilesJsonReader.superclass.constructor.call(this, meta, recordType);
	}
});
