/*
 * #dependsFile client/zarafa/core/data/RecordCustomObjectType.js
 */
Ext.namespace('Zarafa.contact.data');

/**
 * @class Zarafa.contact.data.JsonMemberReader
 * @extends Zarafa.core.data.JsonReader
 */
Zarafa.contact.data.JsonMemberReader = Ext.extend(Zarafa.core.data.JsonReader, {
	/**
	 * @cfg {Zarafa.core.data.RecordCustomObjectType} customObjectType The custom object type
	 * which represents the {@link Ext.data.Record records} which should be created using
	 * {@link Zarafa.core.data.RecordFactory#createRecordObjectByCustomType}.
	 */
	customObjectType : Zarafa.core.data.RecordCustomObjectType.ZARAFA_DISTLIST_MEMBER,

	/**
	 * @constructor
	 * @param {Object} meta Metadata configuration options.
	 * @param {Object} recordType (optional) Optional Record type matches the type
	 * which must be read from response. If no type is given, it will use the
	 * record type for the {@link Zarafa.core.data.RecordCustomObjectType#ZARAFA_DISTLIST_MEMBER}.
	 */
	constructor : function(meta, recordType)
	{
		meta = Ext.applyIf(meta || {}, {
			dynamicRecord : false
		});

		// If no recordType is provided, force the type to be a Distlist Member
		if (!Ext.isDefined(recordType)) {
			recordType = Zarafa.core.data.RecordFactory.getRecordClassByCustomType(meta.customObjectType || this.customObjectType);
		}

		Zarafa.contact.data.JsonMemberReader.superclass.constructor.call(this, meta, recordType);
	}
});
